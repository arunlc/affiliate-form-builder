# apps/forms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'forms', views.FormViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('<uuid:form_id>/', views.EmbedFormView.as_view(), name='embed_form'),
    path('<uuid:form_id>/submit/', views.FormSubmissionView.as_view(), name='form_submit'),
    path('<uuid:form_id>/stats/', views.FormStatsView.as_view(), name='form_stats'),
]
