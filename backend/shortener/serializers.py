from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ShortURL, ClickStat

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password']
        extra_kwargs = {'username': {'required': False}}
    
    def create(self, validated_data):
        # If username is not provided, use email as username
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email']
            
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class ShortURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShortURL
        fields = ['id', 'original_url', 'short_code', 'click_count', 'created_at', 'expires_at']
        read_only_fields = ['id', 'short_code', 'click_count', 'created_at']

class ClickStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClickStat
        fields = ['id', 'ip_address', 'user_agent', 'clicked_at']
        read_only_fields = ['id', 'clicked_at']

class URLStatsSerializer(serializers.ModelSerializer):
    recent_clicks = serializers.SerializerMethodField()
    
    class Meta:
        model = ShortURL
        fields = ['id', 'original_url', 'short_code', 'click_count', 'created_at', 'expires_at', 'recent_clicks']
        read_only_fields = ['id', 'short_code', 'click_count', 'created_at']
    
    def get_recent_clicks(self, obj):
        recent_clicks = obj.clicks.order_by('-clicked_at')[:10]
        return ClickStatSerializer(recent_clicks, many=True).data