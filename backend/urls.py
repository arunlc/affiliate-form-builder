# backend/urls.py - FOCUSED MIME TYPE FIX

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, FileResponse
from django.shortcuts import render
import os
import mimetypes

def serve_react_app(request):
    """Serve React app index.html"""
    try:
        index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
        if os.path.exists(index_path):
            return FileResponse(open(index_path, 'rb'), content_type='text/html')
    except Exception:
        pass
    
    # Fallback HTML
    fallback_html = """
    <!DOCTYPE html>
    <html>
    <head><title>Affiliate Form Builder</title></head>
    <body style="font-family: Arial; text-align: center; margin-top: 100px;">
        <h1>🚀 Affiliate Form Builder</h1>
        <p>React app is loading...</p>
        <a href="/admin">Admin Panel</a>
    </body>
    </html>
    """
    return HttpResponse(fallback_html, content_type='text/html')

def serve_static_with_correct_mime(request, path):
    """Serve static files with correct MIME types"""
    try:
        full_path = os.path.join(settings.STATIC_ROOT, path)
        
        if not os.path.exists(full_path):
            return HttpResponse('Not Found', status=404)
        
        # CRITICAL: Set correct MIME types
        if path.endswith('.css'):
            content_type = 'text/css'
        elif path.endswith('.js'):
            content_type = 'application/javascript'
        elif path.endswith('.json'):
            content_type = 'application/json'
        elif path.endswith('.woff2'):
            content_type = 'font/woff2'
        elif path.endswith('.woff'):
            content_type = 'font/woff'
        elif path.endswith('.ttf'):
            content_type = 'font/ttf'
        elif path.endswith('.svg'):
            content_type = 'image/svg+xml'
        elif path.endswith('.png'):
            content_type = 'image/png'
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            content_type = 'image/jpeg'
        else:
            content_type, _ = mimetypes.guess_type(full_path)
            if not content_type:
                content_type = 'application/octet-stream'
        
        response = FileResponse(
            open(full_path, 'rb'), 
            content_type=content_type
        )
        
        # Add caching for assets
        if any(path.endswith(ext) for ext in ['.css', '.js', '.woff', '.woff2', '.png', '.jpg', '.svg']):
            response['Cache-Control'] = 'public, max-age=31536000'
        
        return response
        
    except Exception as e:
        return HttpResponse(f'Error: {e}', status=500)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
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

# CRITICAL: Static file handling for production
if not settings.DEBUG:
    # Serve static files with correct MIME types
    urlpatterns += [
        # MUST handle assets directory specifically
        re_path(r'^assets/(?P<path>.*)$', serve_static_with_correct_mime),
        re_path(r'^static/(?P<path>.*)$', serve_static_with_correct_mime),
        
        # Root files
        re_path(r'^favicon\.ico$', serve_static_with_correct_mime, {'path': 'favicon.ico'}),
        re_path(r'^robots\.txt$', serve_static_with_correct_mime, {'path': 'robots.txt'}),
    ]

# React SPA routes (MUST be last)
urlpatterns += [
    path('', serve_react_app),
    re_path(r'^(?!api|admin|static|assets|embed|favicon|robots).*$', serve_react_app),
]
