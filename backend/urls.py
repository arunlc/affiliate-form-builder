from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/auth/', include('apps.users.urls')),
    path('api/forms/', include('apps.forms.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/affiliates/', include('apps.affiliates.urls')),
    path('api/core/', include('apps.core.urls')),
    
    # Embed routes (separate from API)
    path('embed/<uuid:form_id>/', 'apps.forms.views.EmbedFormView.as_view()'),
    path('embed/<uuid:form_id>/submit/', 'apps.forms.views.FormSubmissionView.as_view()'),
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

# React app - catch all other routes
urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    re_path(r'^(?!static|media|api|admin|embed).*$', 
            TemplateView.as_view(template_name='index.html'), 
            name='react_routes'),
]
