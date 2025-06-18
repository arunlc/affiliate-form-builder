# backend/urls.py - FIXED FOR STATIC FILES
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.shortcuts import render
from apps.forms.views import EmbedFormView, FormSubmissionView
import os
import mimetypes

# Add missing MIME types
mimetypes.add_type("application/javascript", ".js", True)
mimetypes.add_type("text/css", ".css", True)
mimetypes.add_type("application/json", ".json", True)

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'app': 'affiliate-form-builder',
        'timestamp': str(timezone.now()),
        'frontend': 'react',
        'version': '1.0.0'
    })

def react_app_view(request):
    """Serve React app index.html"""
    try:
        # Try to serve React build from static files
        static_root = settings.STATIC_ROOT
        index_path = os.path.join(static_root, 'index.html')
        
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HttpResponse(content, content_type='text/html')
        else:
            # Fallback template
            return render(request, 'index.html')
    except Exception as e:
        # Emergency fallback
        fallback_html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Form Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
        <div class="text-6xl mb-4">🚀</div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Affiliate Form Builder
        </h1>
        <p class="text-gray-600 mb-6">Loading React application...</p>
        
        <div class="space-y-3">
            <a href="/admin" class="block w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700">
                🛠️ Admin Panel
            </a>
            <a href="/api/core/dashboard/" class="block w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700">
                📊 API Dashboard
            </a>
        </div>
        
        <div class="mt-6 text-sm text-gray-500">
            <p>Login: affiliate1 / affiliate123</p>
            <p>Operations: operations / ops123</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh to check for React app
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    </script>
</body>
</html>"""
        return HttpResponse(fallback_html, content_type='text/html')

# Custom static file serving view with proper MIME types
def serve_static_file(request, path):
    """Serve static files with correct MIME types"""
    try:
        # Get the file extension and determine MIME type
        _, ext = os.path.splitext(path)
        
        # Set proper MIME type based on extension
        if ext == '.js':
            content_type = 'application/javascript'
        elif ext == '.css':
            content_type = 'text/css'
        elif ext == '.json':
            content_type = 'application/json'
        elif ext == '.png':
            content_type = 'image/png'
        elif ext == '.jpg' or ext == '.jpeg':
            content_type = 'image/jpeg'
        elif ext == '.svg':
            content_type = 'image/svg+xml'
        elif ext == '.ico':
            content_type = 'image/x-icon'
        else:
            content_type = None
        
        # Serve the file with proper MIME type
        response = serve(request, path, document_root=settings.STATIC_ROOT)
        if content_type:
            response['Content-Type'] = content_type
        
        # Add cache headers for static assets
        if ext in ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico']:
            response['Cache-Control'] = 'public, max-age=31536000'  # 1 year
        
        return response
    except Exception as e:
        # Return 404 if file not found
        return HttpResponse('File not found', status=404)

urlpatterns = [
    # Health check - must be first
    path('health/', health_check, name='health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/auth/', include('apps.users.urls')),
    path('api/forms/', include('apps.forms.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/affiliates/', include('apps.affiliates.urls')),
    path('api/core/', include('apps.core.urls')),
    
    # Embed routes (separate from API)
    path('embed/<uuid:form_id>/', EmbedFormView.as_view(), name='embed_form'),
    path('embed/<uuid:form_id>/submit/', FormSubmissionView.as_view(), name='form_submit'),
]

# Static files serving - CRITICAL ORDER
if settings.DEBUG:
    # Development static files
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Production static files with proper MIME types
    urlpatterns += [
        # Assets folder (CSS, JS, etc.) - must come before catch-all
        re_path(r'^assets/(?P<path>.*)$', serve_static_file, name='serve_assets'),
        
        # Other static files
        re_path(r'^static/(?P<path>.*)$', serve_static_file, name='serve_static'),
        
        # Favicon and other root files
        re_path(r'^favicon\.ico$', serve_static_file, {'path': 'favicon.ico'}),
        re_path(r'^robots\.txt$', serve_static_file, {'path': 'robots.txt'}),
    ]

# REACT SPA ROUTES - Must be last to avoid catching API/static routes
urlpatterns += [
    # Serve React app for root
    path('', react_app_view, name='react_home'),
    
    # Catch all other routes for React SPA (excluding API, admin, embed, static)
    re_path(r'^(?!static|media|api|admin|embed|health|assets).*/$', react_app_view, name='react_spa'),
    
    # Handle routes without trailing slash (excluding known paths)
    re_path(r'^(?!static|media|api|admin|embed|health|assets)[^/]*$', react_app_view, name='react_spa_no_slash'),
]
