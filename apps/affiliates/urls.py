# apps/affiliates/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'affiliates', views.AffiliateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:affiliate_id>/stats/', views.AffiliateStatsView.as_view(), name='affiliate_stats'),
    path('<uuid:affiliate_id>/leads/', views.AffiliateLeadsView.as_view(), name='affiliate_leads'),
]
