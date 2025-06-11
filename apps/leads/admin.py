# apps/leads/admin.py
from django.contrib import admin
from .models import Lead, LeadNote

class LeadNoteInline(admin.TabularInline):
    model = LeadNote
    extra = 0
    readonly_fields = ('created_at',)

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'form', 'affiliate_code', 'status', 'created_at')
    list_filter = ('status', 'form', 'affiliate', 'created_at')
    search_fields = ('email', 'name', 'form__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [LeadNoteInline]

@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ('lead', 'user', 'created_at')
    list_filter = ('created_at', 'user')
