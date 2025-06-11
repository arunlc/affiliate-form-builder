# apps/leads/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'leads', views.LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('export/', views.ExportLeadsView.as_view(), name='export_leads'),
    path('stats/', views.LeadStatsView.as_view(), name='lead_stats'),
]
