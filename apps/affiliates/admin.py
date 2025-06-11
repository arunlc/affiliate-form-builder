# apps/affiliates/admin.py
from django.contrib import admin
from .models import Affiliate

@admin.register(Affiliate)
class AffiliateAdmin(admin.ModelAdmin):
    list_display = ('user', 'affiliate_code', 'company_name', 'total_leads', 'conversion_rate', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'affiliate_code', 'company_name')
    readonly_fields = ('id', 'total_leads', 'total_conversions', 'created_at', 'updated_at')
