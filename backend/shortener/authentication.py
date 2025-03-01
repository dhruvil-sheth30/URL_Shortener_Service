import jwt
import datetime
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
            
        try:
            # Get the token from the Authorization header
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
                
            # Decode the token
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            
            # Check if token is expired
            exp = payload.get('exp')
            if exp and datetime.datetime.fromtimestamp(exp) < datetime.datetime.now():
                raise AuthenticationFailed('Token has expired')
                
            # Get the user
            user_id = payload.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Invalid token payload')
                
            user = User.objects.get(id=user_id)
            return (user, token)
            
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except Exception as e:
            raise AuthenticationFailed(str(e))

def generate_jwt_token(user):
    """Generate a JWT token for the given user"""
    payload = {
        'user_id': user.id,
        'exp': datetime.datetime.now() + datetime.timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME),
        'iat': datetime.datetime.now(),
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
    return token