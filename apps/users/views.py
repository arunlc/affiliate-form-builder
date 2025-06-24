# apps/users/views.py - ENHANCED WITH DEBUG AND FIXES

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout, authenticate
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
        if self.request.user.user_type == 'admin':
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            
            # Invalidate all tokens for this user
            Token.objects.filter(user=request.user).delete()
            new_token = Token.objects.create(user=request.user)
            
            return Response({
                'message': 'Password changed successfully',
                'token': new_token.key
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def set_user_password(self, request):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            Token.objects.filter(user=user).delete()
            
            return Response({
                'message': f'Password set successfully for {user.username}'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Enhanced login with detailed logging"""
        logger.info(f"Login attempt for: {request.data.get('username', 'unknown')}")
        
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                
                # Create or get authentication token
                token, created = Token.objects.get_or_create(user=user)
                if not created:
                    # Delete and recreate token to ensure it's fresh
                    token.delete()
                    token = Token.objects.create(user=user)
                
                logger.info(f"User {user.username} logged in successfully (type: {user.user_type})")
                
                # Set session for web interface
                login(request, user)
                
                response_data = {
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'Logged in successfully',
                    'user_type': user.user_type,
                    'affiliate_id': getattr(user, 'affiliate_id', None)
                }
                
                # Add affiliate info if user is affiliate
                if user.user_type == 'affiliate':
                    try:
                        from apps.affiliates.models import Affiliate
                        affiliate = Affiliate.objects.get(user=user)
                        response_data['affiliate_code'] = affiliate.affiliate_code
                        logger.info(f"Affiliate login: {affiliate.affiliate_code}")
                    except Affiliate.DoesNotExist:
                        logger.warning(f"User {user.username} is affiliate type but no affiliate profile found")
                        response_data['warning'] = 'Affiliate profile not found'
                
                return Response(response_data)
            else:
                logger.warning(f"Login validation failed: {serializer.errors}")
                return Response({
                    'error': 'Invalid credentials',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'error': 'Login failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Enhanced logout with cleanup"""
        try:
            # Delete the token to logout
            Token.objects.filter(user=request.user).delete()
            logger.info(f"User {request.user.username} logged out successfully")
        except Exception as e:
            logger.error(f"Logout error: {e}")
        
        logout(request)
        return Response({'message': 'Logged out successfully'})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile with additional info"""
        user_data = UserSerializer(request.user).data
        
        # Add additional info based on user type
        if request.user.user_type == 'affiliate':
            try:
                from apps.affiliates.models import Affiliate
                affiliate = Affiliate.objects.get(user=request.user)
                user_data['affiliate_info'] = {
                    'affiliate_code': affiliate.affiliate_code,
                    'company_name': affiliate.company_name,
                    'total_leads': affiliate.total_leads,
                    'conversion_rate': affiliate.conversion_rate,
                    'is_active': affiliate.is_active
                }
            except Affiliate.DoesNotExist:
                user_data['affiliate_info'] = None
                
        return Response(user_data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DebugAuthView(APIView):
    """Debug endpoint to help troubleshoot auth issues"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get authentication debug info"""
        debug_info = {
            'is_authenticated': request.user.is_authenticated,
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous',
            'session_key': request.session.session_key,
            'headers': {
                'authorization': request.META.get('HTTP_AUTHORIZATION', 'Not provided'),
                'user_agent': request.META.get('HTTP_USER_AGENT', 'Not provided'),
                'origin': request.META.get('HTTP_ORIGIN', 'Not provided'),
            },
            'cookies': {
                'sessionid': request.COOKIES.get('sessionid', 'Not set'),
                'csrftoken': request.COOKIES.get('csrftoken', 'Not set'),
            },
            'method': request.method,
            'path': request.path,
        }
        
        if request.user.is_authenticated:
            debug_info.update({
                'user_id': request.user.id,
                'username': request.user.username,
                'user_type': request.user.user_type,
                'is_active': request.user.is_active,
                'last_login': request.user.last_login,
            })
            
            # Check if user has token
            try:
                token = Token.objects.get(user=request.user)
                debug_info['has_token'] = True
                debug_info['token_key'] = token.key[:10] + '...'  # Don't expose full token
            except Token.DoesNotExist:
                debug_info['has_token'] = False
        
        return Response(debug_info)
    
    def post(self, request):
        """Test login with provided credentials"""
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password required'
            }, status=400)
        
        try:
            # Check if user exists
            try:
                user = User.objects.get(username=username)
                user_exists = True
                user_active = user.is_active
                user_type = user.user_type
            except User.DoesNotExist:
                user_exists = False
                user_active = False
                user_type = None
            
            # Try authentication
            auth_user = authenticate(username=username, password=password)
            auth_success = auth_user is not None
            
            debug_info = {
                'username': username,
                'user_exists': user_exists,
                'user_active': user_active,
                'user_type': user_type,
                'auth_success': auth_success,
                'timestamp': str(timezone.now()) if 'timezone' in globals() else 'Unknown'
            }
            
            if auth_success:
                debug_info['message'] = 'Authentication successful'
            elif not user_exists:
                debug_info['message'] = 'User does not exist'
            elif not user_active:
                debug_info['message'] = 'User account is inactive'
            else:
                debug_info['message'] = 'Invalid password'
            
            return Response(debug_info)
            
        except Exception as e:
            return Response({
                'error': f'Debug test failed: {str(e)}'
            }, status=500)

# Keep existing views...
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_active=True)
                
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                reset_url = f"{request.scheme}://{request.get_host()}/reset-password/{uid}/{token}/"
                
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
                logger.warning(f"Password reset requested for non-existent email: {email}")
            
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
            
            Token.objects.filter(user=user).delete()
            
            logger.info(f"Password reset completed for user {user.username}")
            
            return Response({'message': 'Password reset successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateUserView(APIView):
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
