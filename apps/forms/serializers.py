# apps/forms/serializers.py
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Form, FormField

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = '__all__'

class FormSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, read_only=True)
    total_submissions = serializers.SerializerMethodField()
    new_leads_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Form
        fields = '__all__'
        read_only_fields = ('id', 'embed_code', 'created_by', 'created_at', 'updated_at')
    
    def get_total_submissions(self, obj):
        """Get total number of submissions for this form"""
        return obj.leads.count()
    
    def get_new_leads_count(self, obj):
        """Get count of new leads in the last 24 hours"""
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        return obj.leads.filter(created_at__gte=twenty_four_hours_ago).count()
