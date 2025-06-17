# backend/urls.py - FIXED FOR REACT
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import JsonResponse
from django.utils import timezone
from apps.forms.views import EmbedFormView, FormSubmissionView

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'app': 'affiliate-form-builder',
        'timestamp': str(timezone.now()),
        'frontend': 'react'
    })

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

# Static files
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

# REACT APP ROUTES - RESTORED
# Serve React app for all non-API routes
urlpatterns += [
    # Serve React app
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    re_path(r'^(?!static|media|api|admin|embed|health).*$', 
            TemplateView.as_view(template_name='index.html'), 
            name='react_routes'),
]
