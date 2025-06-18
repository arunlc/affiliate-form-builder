# apps/forms/serializers.py - FIXED VERSION
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
    assigned_affiliates_count = serializers.SerializerMethodField()
    my_submissions = serializers.SerializerMethodField()  # For affiliates
    my_new_leads = serializers.SerializerMethodField()    # For affiliates
    
    class Meta:
        model = Form
        fields = '__all__'
        read_only_fields = ('id', 'embed_code', 'created_by', 'created_at', 'updated_at')
    
    def get_total_submissions(self, obj):
        """Get total number of submissions for this form"""
        request = self.context.get('request')
        if not request:
            return obj.leads.count()
        
        # If user is affiliate, only count their submissions
        if request.user.user_type == 'affiliate':
            try:
                from apps.affiliates.models import Affiliate
                affiliate = Affiliate.objects.get(user=request.user)
                return obj.leads.filter(affiliate=affiliate).count()
            except:
                return 0
        
        return obj.leads.count()
    
    def get_new_leads_count(self, obj):
        """Get count of new leads in the last 24 hours"""
        request = self.context.get('request')
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        
        queryset = obj.leads.filter(created_at__gte=twenty_four_hours_ago)
        
        # If user is affiliate, only count their leads
        if request and request.user.user_type == 'affiliate':
            try:
                from apps.affiliates.models import Affiliate
                affiliate = Affiliate.objects.get(user=request.user)
                queryset = queryset.filter(affiliate=affiliate)
            except:
                return 0
        
        return queryset.count()
    
    def get_assigned_affiliates_count(self, obj):
        """Get number of affiliates assigned to this form (Admin only)"""
        request = self.context.get('request')
        if request and request.user.user_type == 'admin':
            # FIXED: Use the correct relationship through AffiliateFormAssignment
            return obj.affiliateformassignment_set.filter(
                is_active=True,
                affiliate__is_active=True
            ).count()
        return None
    
    def get_my_submissions(self, obj):
        """Get affiliate's total submissions for this form"""
        request = self.context.get('request')
        if request and request.user.user_type == 'affiliate':
            try:
                from apps.affiliates.models import Affiliate
                affiliate = Affiliate.objects.get(user=request.user)
                return obj.leads.filter(affiliate=affiliate).count()
            except:
                return 0
        return None
    
    def get_my_new_leads(self, obj):
        """Get affiliate's new leads for this form"""
        request = self.context.get('request')
        if request and request.user.user_type == 'affiliate':
            try:
                from apps.affiliates.models import Affiliate
                affiliate = Affiliate.objects.get(user=request.user)
                return obj.leads.filter(
                    affiliate=affiliate,
                    status='new'
                ).count()
            except:
                return 0
        return None
