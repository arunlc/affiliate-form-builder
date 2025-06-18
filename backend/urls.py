# backend/urls.py - SIMPLIFIED STATIC FILE HANDLING

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import HttpResponse, FileResponse
import os

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

# CRITICAL: DO NOT add custom static file handlers in production
# Let WhiteNoise handle all static files automatically

# React SPA routes (MUST be last) - but exclude static paths
urlpatterns += [
    path('', serve_react_app),
    # CRITICAL: Updated regex to properly exclude static paths
    re_path(r'^(?!api/|admin/|static/|assets/|embed/|favicon|robots).*$', serve_react_app),
]
