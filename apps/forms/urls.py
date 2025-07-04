# apps/forms/urls.py - FIXED URL patterns
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'forms', views.FormViewSet)

urlpatterns = [
    # API routes
    path('', include(router.urls)),
    
    # Embed routes - FIXED: These should be separate from API routes
    path('<uuid:form_id>/', views.EmbedFormView.as_view(), name='embed_form'),
    path('<uuid:form_id>/submit/', views.FormSubmissionView.as_view(), name='form_submit'),
]
