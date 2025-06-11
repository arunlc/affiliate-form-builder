# apps/forms/admin.py
from django.contrib import admin
from .models import Form, FormField

class FormFieldInline(admin.TabularInline):
    model = FormField
    extra = 1

@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('name', 'form_type', 'created_by', 'is_active', 'created_at')
    list_filter = ('form_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    inlines = [FormFieldInline]
    readonly_fields = ('id', 'embed_code', 'created_at', 'updated_at')

@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    list_display = ('form', 'label', 'field_type', 'is_required', 'order')
    list_filter = ('field_type', 'is_required')
    ordering = ('form', 'order')
