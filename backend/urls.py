# backend/urls.py - REPLACE YOUR ENTIRE URLS.PY WITH THIS

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse
from django.shortcuts import render
import os
import mimetypes

# Add MIME types
mimetypes.add_type("application/javascript", ".js", True)
mimetypes.add_type("text/css", ".css", True)

def health_check(request):
    """Health check endpoint"""
    return HttpResponse("OK", content_type="text/plain")

def serve_react_app(request):
    """Serve React app index.html for SPA routes"""
    try:
        # Try to serve React build from staticfiles
        index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return HttpResponse(content, content_type='text/html')
    except Exception as e:
        pass
    
    # Fallback if React build not available
    fallback_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Affiliate Form Builder</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
            <h1 class="text-3xl font-bold mb-4">🚀 Affiliate Form Builder</h1>
            <p class="text-gray-600 mb-6">React app is loading...</p>
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
            setTimeout(() => window.location.reload(), 3000);
        </script>
    </body>
    </html>
    """
    return HttpResponse(fallback_html, content_type='text/html')

# URL Configuration
urlpatterns = [
    # Health check (must be first)
    path('health/', health_check, name='health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/auth/', include('apps.users.urls')),
    path('api/forms/', include('apps.forms.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/affiliates/', include('apps.affiliates.urls')),
    path('api/core/', include('apps.core.urls')),
    
    # Embed routes (these need to be before static files)
    path('embed/<uuid:form_id>/', lambda r, form_id: 
         __import__('apps.forms.views', fromlist=['EmbedFormView']).EmbedFormView.as_view()(r, form_id=form_id)),
    path('embed/<uuid:form_id>/submit/', lambda r, form_id: 
         __import__('apps.forms.views', fromlist=['FormSubmissionView']).FormSubmissionView.as_view()(r, form_id=form_id)),
]

# CRITICAL: Static files must come BEFORE catch-all React routes
if settings.DEBUG:
    # Development
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # Production - serve static files with proper MIME types
    def serve_static_with_mime(request, path):
        """Serve static files with correct MIME type"""
        try:
            # Determine MIME type
            content_type, _ = mimetypes.guess_type(path)
            
            # Serve the file
            response = serve(request, path, document_root=settings.STATIC_ROOT)
            if content_type:
                response['Content-Type'] = content_type
            
            # Add caching headers for assets
            if any(path.endswith(ext) for ext in ['.css', '.js', '.png', '.jpg', '.svg']):
                response['Cache-Control'] = 'public, max-age=31536000'  # 1 year
            
            return response
        except Exception:
            # If file not found, let it 404
            return HttpResponse('File not found', status=404)
    
    # Static files URLs - MUST come before React routes
    urlpatterns += [
        # Assets folder (where Vite puts CSS/JS)
        re_path(r'^assets/(?P<path>.*)$', serve_static_with_mime, name='serve_assets'),
        
        # General static files
        re_path(r'^static/(?P<path>.*)$', serve_static_with_mime, name='serve_static'),
        
        # Root level files
        re_path(r'^favicon\.ico$', serve_static_with_mime, {'path': 'favicon.ico'}),
        re_path(r'^robots\.txt$', serve_static_with_mime, {'path': 'robots.txt'}),
    ]

# React SPA routes (MUST be last - catches everything else)
urlpatterns += [
    # Root
    path('', serve_react_app, name='react_home'),
    
    # All other routes go to React (but NOT /api/, /admin/, /static/, /assets/)
    re_path(r'^(?!api|admin|static|assets|health|embed|favicon|robots).*$', serve_react_app, name='react_catch_all'),
]
