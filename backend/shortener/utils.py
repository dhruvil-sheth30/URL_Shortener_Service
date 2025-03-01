import random
import string
from django.conf import settings
from django.core.cache import cache

def generate_short_code(length=None):
    """Generate a random short code for URLs"""
    if length is None:
        length = settings.SHORT_URL_LENGTH
        
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def cache_short_url(short_code, original_url):
    """Cache the short URL for faster lookups"""
    cache_key = f"short_url:{short_code}"
    cache.set(cache_key, original_url, timeout=60*60*24*7)  # Cache for 7 days

def get_cached_url(short_code):
    """Get a cached URL if it exists"""
    cache_key = f"short_url:{short_code}"
    return cache.get(cache_key)

def get_client_ip(request):
    """Get the client IP address from the request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip