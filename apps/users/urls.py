# apps/users/urls.py - ENHANCED WITH DEBUG ENDPOINTS

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
    
    # Debug endpoint
    path('debug/', views.DebugAuthView.as_view(), name='auth_debug'),
    
    # User management (admin only)
    path('create-user/', views.CreateUserView.as_view(), name='create_user'),
    
    # Password management
    path('change-password/', views.UserViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('set-password/', views.UserViewSet.as_view({'post': 'set_user_password'}), name='set_password'),
    
    # Password reset
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

# backend/urls.py - ENHANCED WITH DEBUG ROUTES

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
import logging

logger = logging.getLogger(__name__)

def serve_react_app(request):
    """Serve React app index.html"""
    try:
        index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
        if os.path.exists(index_path):
            return FileResponse(open(index_path, 'rb'), content_type='text/html')
    except Exception as e:
        logger.error(f"Error serving React app: {e}")
    
    # Fallback HTML with debug info
    return HttpResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Affiliate Form Builder</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body style="font-family: Arial; text-align: center; margin-top: 50px;">
        <div class="max-w-4xl mx-auto p-6">
            <h1 class="text-3xl font-bold mb-6">🚀 Affiliate Form Builder</h1>
            <p class="mb-8">Your SaaS platform is running!</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <a href="/admin" class="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
                    🛠️ Django Admin Panel
                </a>
                <a href="/api/auth/debug/" class="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
                    🔍 Auth Debug Info
                </a>
                <a href="/api/core/dashboard/" class="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
                    📊 API Dashboard
                </a>
                <a href="/api/forms/forms/" class="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    📝 Forms API
                </a>
            </div>
            
            <div class="bg-gray-100 p-6 rounded-lg mb-6">
                <h3 class="text-lg font-semibold mb-4">🔑 Test Accounts</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white p-4 rounded">
                        <div class="font-medium">Admin</div>
                        <div class="text-sm text-gray-600">admin / admin123</div>
                    </div>
                    <div class="bg-white p-4 rounded">
                        <div class="font-medium">Affiliate</div>
                        <div class="text-sm text-gray-600">affiliate1 / affiliate123</div>
                    </div>
                    <div class="bg-white p-4 rounded">
                        <div class="font-medium">Operations</div>
                        <div class="text-sm text-gray-600">operations / ops123</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <h3 class="font-semibold text-yellow-800 mb-2">⚠️ Login Issues?</h3>
                <p class="text-yellow-700 text-sm">
                    If you're experiencing login issues, try:
                </p>
                <ul class="text-left text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Clear browser cache and cookies</li>
                    <li>• Use incognito/private mode</li>
                    <li>• Check <a href="/api/auth/debug/" class="underline">auth debug page</a></li>
                    <li>• Ensure accounts exist via Django admin</li>
                </ul>
            </div>
            
            <div class="text-sm text-gray-500">
                <p>Environment: {'Production' if not settings.DEBUG else 'Development'}</p>
                <p>Host: {request.get_host()}</p>
            </div>
        </div>
        
        <script>
            // Test auth endpoint
            fetch('/api/auth/debug/')
                .then(response => response.json())
                .then(data => console.log('Auth Debug:', data))
                .catch(err => console.error('Auth Debug Error:', err));
        </script>
    </body>
    </html>
    """, content_type='text/html')

@csrf_exempt
def api_debug_view(request):
    """Debug view to help troubleshoot API issues"""
    return JsonResponse({
        'message': 'API is working',
        'method': request.method,
        'path': request.path,
        'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
        'authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'content_type': request.content_type,
        'headers': {
            'authorization': request.META.get('HTTP_AUTHORIZATION', 'Not provided'),
            'origin': request.META.get('HTTP_ORIGIN', 'Not provided'),
            'user_agent': request.META.get('HTTP_USER_AGENT', 'Not provided'),
        },
        'timestamp': str(__import__('django.utils.timezone', fromlist=['now']).now()),
    })

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API debug endpoint
    path('api/debug/', api_debug_view, name='api_debug'),
    
    # API routes
    path('api/auth/', include('apps.users.urls')),
    path('api/forms/', include('apps.forms.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/affiliates/', include('apps.affiliates.urls')),
    path('api/core/', include('apps.core.urls')),
    
    # Embed routes
    path('embed/<uuid:form_id>/', lambda r, form_id: 
         __import__('apps.forms.views', fromlist=['EmbedFormView']).EmbedFormView.as_view()(r, form_id=form_id)),
    path('embed/<uuid:form_id>/submit/', lambda r, form_id: 
         __import__('apps.forms.views', fromlist=['FormSubmissionView']).FormSubmissionView.as_view()(r, form_id=form_id)),
]

# Static files serving
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React SPA routes - MUST be last
urlpatterns += [
    path('', serve_react_app),
    re_path(r'^(?!api/|admin/|assets/|embed/|favicon|robots).*, serve_react_app),
]
