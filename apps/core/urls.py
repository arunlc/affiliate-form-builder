# apps/core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('settings/', views.SettingsView.as_view(), name='settings'),
]
