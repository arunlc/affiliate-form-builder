# apps/users/views.py - Enhanced with Password Management
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from .models import User
from .serializers import (
    UserSerializer, LoginSerializer, ChangePasswordSerializer,
    SetPasswordSerializer, UserCreateSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
import logging

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admins can see all users
        if self.request.user.user_type == 'admin':
            return User.objects.all()
        # Others can only see themselves
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change current user's password"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            
            # Invalidate all tokens for this user (optional security measure)
            Token.objects.filter(user=request.user).delete()
            # Create new token
            new_token = Token.objects.create(user=request.user)
            
            return Response({
                'message': 'Password changed successfully',
                'token': new_token.key  # Return new token
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_user_password(self, request):
        """Admin-only: Set password for any user"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Invalidate all tokens for the target user
            Token.objects.filter(user=user).delete()
            
            return Response({
                'message': f'Password set successfully for {user.username}'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            
            # Create or get authentication token
            token, created = Token.objects.get_or_create(user=user)
            
            logger.info(f"User {user.username} logged in successfully")
            
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Logged in successfully'
            })
        
        logger.warning(f"Failed login attempt: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Delete the token to logout
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({'message': 'Logged out successfully'})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def put(self, request):
        """Update user profile (excluding password)"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_active=True)
                
                # Generate token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Create reset URL
                reset_url = f"{request.scheme}://{request.get_host()}/reset-password/{uid}/{token}/"
                
                # Send email (you'll need to customize this)
                subject = 'Password Reset Request'
                message = f"""
                Hi {user.username},
                
                You requested a password reset. Click the link below to reset your password:
                {reset_url}
                
                If you didn't request this, please ignore this email.
                
                This link will expire in 24 hours.
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                
                logger.info(f"Password reset email sent to {email}")
                
            except User.DoesNotExist:
                # Don't reveal if email exists
                logger.warning(f"Password reset requested for non-existent email: {email}")
            
            # Always return success for security
            return Response({
                'message': 'If an account with that email exists, a password reset link has been sent.'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Invalidate all tokens
            Token.objects.filter(user=user).delete()
            
            logger.info(f"Password reset completed for user {user.username}")
            
            return Response({'message': 'Password reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateUserView(APIView):
    """Admin-only user creation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
