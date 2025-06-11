# apps/core/admin.py
from django.contrib import admin
from .models import Setting, Analytics

@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key', 'description')

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ('form', 'date', 'views', 'submissions', 'conversion_rate')
    list_filter = ('date', 'form')
    date_hierarchy = 'date'
