# backend/urls.py - FINAL FIX WITH BETTER ERROR HANDLING

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
    
    # Fallback HTML
    return HttpResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Affiliate Form Builder</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial; text-align: center; margin-top: 100px;">
        <h1>🚀 Affiliate Form Builder</h1>
        <p>Loading...</p>
        <p><a href="/admin">Admin Panel</a></p>
        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; max-width: 600px; margin-left: auto; margin-right: auto;">
            <h3>Test Accounts:</h3>
            <p>Affiliate: <code>affiliate1 / affiliate123</code></p>
            <p>Operations: <code>operations / ops123</code></p>
        </div>
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
        'content_type': request.content_type,
        'data_keys': list(request.POST.keys()) if request.method == 'POST' else None
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

# CRITICAL: Add static files serving for production
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React SPA routes - MUST be last
urlpatterns += [
    path('', serve_react_app),
    # CRITICAL: Exclude assets/ from SPA routing
    re_path(r'^(?!api/|admin/|assets/|embed/|favicon|robots).*$', serve_react_app),
]
