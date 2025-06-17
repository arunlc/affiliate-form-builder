from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import JsonResponse
from apps.forms.views import EmbedFormView, FormSubmissionView

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'app': 'affiliate-form-builder',
        'timestamp': str(timezone.now()) if 'timezone' in globals() else 'unknown'
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

# React app fallback - serve our template if React files don't exist
try:
    # Check if React build exists
    import os
    react_index = os.path.join(settings.STATIC_ROOT, 'index.html')
    if os.path.exists(react_index):
        # Serve React app
        urlpatterns += [
            path('', TemplateView.as_view(template_name='index.html'), name='home'),
            re_path(r'^(?!static|media|api|admin|embed|health).*$', 
                    TemplateView.as_view(template_name='index.html'), 
                    name='react_routes'),
        ]
    else:
        # Serve fallback template
        urlpatterns += [
            path('', TemplateView.as_view(template_name='index.html'), name='home'),
            re_path(r'^(?!static|media|api|admin|embed|health).*$', 
                    TemplateView.as_view(template_name='index.html'), 
                    name='fallback_routes'),
        ]
except:
    # If there's any error checking, just serve the template
    urlpatterns += [
        path('', TemplateView.as_view(template_name='index.html'), name='home'),
        re_path(r'^(?!static|media|api|admin|embed|health).*$', 
                TemplateView.as_view(template_name='index.html'), 
                name='fallback_routes'),
    ]
