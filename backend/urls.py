# backend/urls.py - FIXED FOR REACT APP
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
        # Try to serve React build
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
        <p class="text-gray-600 mb-6">SaaS Platform Loading...</p>
        
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
        }, 5000);
    </script>
</body>
</html>"""
        return HttpResponse(fallback_html, content_type='text/html')

urlpatterns = [
    # Health check
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

# Static files serving
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Production static file serving
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {
            'document_root': settings.STATIC_ROOT,
        }),
    ]

# REACT APP ROUTES - Serve React app for all other routes
urlpatterns += [
    # Serve React app for root and all SPA routes
    path('', react_app_view, name='react_home'),
    
    # Catch all routes for React SPA
    re_path(r'^(?!static|media|api|admin|embed|health).*/$', react_app_view, name='react_spa'),
    
    # Handle routes without trailing slash
    re_path(r'^(?!static|media|api|admin|embed|health)[^/]*$', react_app_view, name='react_spa_no_slash'),
]
