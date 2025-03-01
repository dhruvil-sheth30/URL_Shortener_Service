from django.contrib import admin
from django.urls import path, include
from shortener.views import redirect_to_original

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('shortener.urls')),
    path('<str:short_code>/', redirect_to_original, name='redirect'),
]