# backend/urls.py - FIXED URL routing
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API routes (highest priority)
    path('api/auth/', include('apps.users.urls')),
    path('api/forms/', include('apps.forms.urls')),  # This handles /api/forms/forms/ etc.
    path('api/leads/', include('apps.leads.urls')),
    path('api/affiliates/', include('apps.affiliates.urls')),
    path('api/core/', include('apps.core.urls')),
    
    # FIXED: Embed routes - separate from API
    path('embed/', include('apps.forms.urls')),  # This handles /embed/<uuid>/ and /embed/<uuid>/submit/
]

# Static file serving
if settings.DEBUG:
    # Development static/media files
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Production static file serving
    urlpatterns += [
        re_path(r'^static/(?P<path>.*)$', serve, {
            'document_root': settings.STATIC_ROOT,
        }),
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]

# React app routes (MUST be after static file routes)
urlpatterns += [
    # Home page
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    
    # Catch-all for React router (LAST - catches everything else)
    re_path(r'^(?!static|media|api|admin|embed).*$', 
            TemplateView.as_view(template_name='index.html'), 
            name='react_routes'),
]
