# apps/core/admin.py - FIXED VERSION
from django.contrib import admin
from .models import Setting

@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key', 'description')

# Analytics model is commented out in models.py, so we don't import it
# @admin.register(Analytics)
# class AnalyticsAdmin(admin.ModelAdmin):
#     list_display = ('form', 'date', 'views', 'submissions', 'conversion_rate')
#     list_filter = ('date', 'form')
#     date_hierarchy = 'date'
