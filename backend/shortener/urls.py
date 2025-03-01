from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register', views.RegisterView.as_view(), name='register'),
    path('auth/login', views.LoginView.as_view(), name='login'),
    path('auth/me', views.UserDetailsView.as_view(), name='user-details'),
    
    # User management (admin only)
    path('users', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/role', views.UserRoleUpdateView.as_view(), name='user-role-update'),
    
    # URL shortening and management
    path('shorten', views.ShortURLListCreateView.as_view(), name='shorten-list-create'),
    path('shorten/<uuid:pk>', views.ShortURLDetailView.as_view(), name='shorten-detail'),
    path('stats/<str:short_code>', views.URLStatsView.as_view(), name='url-stats'),
    
    # Admin statistics
    path('admin/stats', views.AdminStatsView.as_view(), name='admin-stats'),
]