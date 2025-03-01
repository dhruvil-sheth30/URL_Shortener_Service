from django.shortcuts import redirect, get_object_or_404
from django.http import Http404
from django.db.models import Count, Sum
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ShortURL, ClickStat
from .serializers import (
    UserSerializer, UserRegistrationSerializer, ShortURLSerializer,
    URLStatsSerializer
)
from .authentication import generate_jwt_token
from .permissions import IsAdminUser, IsOwnerOrAdmin
from .utils import generate_short_code, cache_short_url, get_cached_url, get_client_ip

# Public redirect view
def redirect_to_original(request, short_code):
    """Redirect to the original URL from a short code"""
    # Try to get the URL from cache first
    original_url = get_cached_url(short_code)
    
    if not original_url:
        # If not in cache, get from database
        try:
            short_url = ShortURL.objects.get(short_code=short_code)
            original_url = short_url.original_url
            
            # Cache the URL for future requests
            cache_short_url(short_code, original_url)
            
            # Increment click count
            short_url.click_count += 1
            short_url.save(update_fields=['click_count'])
            
            # Record click statistics
            ClickStat.objects.create(
                short_url=short_url,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except ShortURL.DoesNotExist:
            raise Http404("Short URL does not exist")
    
    return redirect(original_url)

# Authentication views
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Try to find user by email
        try:
            user = User.objects.get(email=email)
            username = user.username
        except User.DoesNotExist:
            return Response(
                {"message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Authenticate with username and password
        user = authenticate(username=username, password=password)
        
        if user:
            token = generate_jwt_token(user)
            return Response({
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": "admin" if user.is_staff else "user"
                }
            })
        
        return Response(
            {"message": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

class UserDetailsView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "id": request.user.id,
            "email": request.user.email,
            "role": "admin" if request.user.is_staff else "user"
        })

# User management views (admin only)
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get(self, request, *args, **kwargs):
        users = self.get_queryset()
        user_data = []
        
        for user in users:
            user_data.append({
                "id": user.id,
                "email": user.email,
                "role": "admin" if user.is_staff else "user",
                "created_at": user.date_joined
            })
        
        return Response(user_data)

class UserRoleUpdateView(APIView):
    permission_classes = [IsAdminUser]
    
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        role = request.data.get('role')
        if role not in ['admin', 'user']:
            return Response(
                {"message": "Invalid role. Must be 'admin' or 'user'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user role
        user.is_staff = (role == 'admin')
        user.save(update_fields=['is_staff'])
        
        return Response({
            "id": user.id,
            "email": user.email,
            "role": role
        })

# URL shortening and management views
class ShortURLListCreateView(generics.ListCreateAPIView):
    serializer_class = ShortURLSerializer
    
    def get_queryset(self):
        return ShortURL.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Generate a unique short code
        while True:
            short_code = generate_short_code()
            if not ShortURL.objects.filter(short_code=short_code).exists():
                break
        
        # Create the short URL
        short_url = ShortURL.objects.create(
            original_url=serializer.validated_data['original_url'],
            short_code=short_code,
            user=request.user
        )
        
        # Cache the URL for faster lookups
        cache_short_url(short_code, short_url.original_url)
        
        return Response(ShortURLSerializer(short_url).data, status=status.HTTP_201_CREATED)

class ShortURLDetailView(generics.RetrieveDestroyAPIView):
    queryset = ShortURL.objects.all()
    serializer_class = ShortURLSerializer
    permission_classes = [IsOwnerOrAdmin]

class URLStatsView(APIView):
    def get(self, request, short_code):
        try:
            short_url = ShortURL.objects.get(short_code=short_code)
        except ShortURL.DoesNotExist:
            return Response(
                {"message": "Short URL not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        if short_url.user != request.user and not request.user.is_staff:
            return Response(
                {"message": "You don't have permission to view these stats"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = URLStatsSerializer(short_url)
        return Response(serializer.data)

# Admin statistics view
class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get today's date for filtering
        today = timezone.now().date()
        
        # Calculate statistics
        total_urls = ShortURL.objects.count()
        total_clicks = ShortURL.objects.aggregate(Sum('click_count'))['click_count__sum'] or 0
        total_users = User.objects.count()
        
        # URLs created today
        urls_today = ShortURL.objects.filter(
            created_at__date=today
        ).count()
        
        # Clicks today
        clicks_today = ClickStat.objects.filter(
            clicked_at__date=today
        ).count()
        
        # Top performing URLs
        top_urls = ShortURL.objects.order_by('-click_count')[:10]
        top_urls_data = []
        
        for url in top_urls:
            top_urls_data.append({
                'short_code': url.short_code,
                'original_url': url.original_url,
                'click_count': url.click_count
            })
        
        return Response({
            'total_urls': total_urls,
            'total_clicks': total_clicks,
            'total_users': total_users,
            'urls_today': urls_today,
            'clicks_today': clicks_today,
            'top_urls': top_urls_data
        })