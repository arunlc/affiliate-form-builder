# apps/users/urls.py - Enhanced with Password Management
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # User management (admin only)
    path('create-user/', views.CreateUserView.as_view(), name='create_user'),
    
    # Password management
    path('change-password/', views.UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('set-password/', views.UserViewSet.as_view({'post': 'set_user_password'}), name='set_password'),
    
    # Password reset
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
