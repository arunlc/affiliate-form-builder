# apps/affiliates/serializers.py
from rest_framework import serializers
from .models import Affiliate, AffiliateFormAssignment

class AffiliateFormAssignmentSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source='form.name', read_only=True)
    form_description = serializers.CharField(source='form.description', read_only=True)
    form_type = serializers.CharField(source='form.form_type', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = AffiliateFormAssignment
        fields = [
            'id', 'form', 'form_name', 'form_description', 'form_type',
            'assigned_at', 'assigned_by_username', 'is_active',
            'leads_generated', 'conversions', 'conversion_rate'
        ]
        read_only_fields = ('id', 'assigned_at', 'leads_generated', 'conversions')

class AffiliateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    assigned_forms_count = serializers.SerializerMethodField()
    active_assignments = serializers.SerializerMethodField()
    recent_performance = serializers.SerializerMethodField()
    form_assignments = AffiliateFormAssignmentSerializer(
        source='affiliateformassignment_set',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = Affiliate
        fields = '__all__'
        read_only_fields = ('id', 'total_leads', 'total_conversions', 'created_at', 'updated_at')
    
    def get_assigned_forms_count(self, obj):
        """Get count of active form assignments"""
        return obj.assigned_forms.filter(is_active=True).count()
    
    def get_active_assignments(self, obj):
        """Get active form assignments with basic info"""
        assignments = obj.affiliateformassignment_set.filter(is_active=True).select_related('form')
        return [{
            'form_id': str(assignment.form.id),
            'form_name': assignment.form.name,
            'leads_generated': assignment.leads_generated,
            'conversions': assignment.conversions,
            'conversion_rate': assignment.conversion_rate
        } for assignment in assignments]
    
    def get_recent_performance(self, obj):
        """Get recent performance metrics"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_leads = obj.leads.filter(created_at__gte=thirty_days_ago).count()
        recent_conversions = obj.leads.filter(
            created_at__gte=thirty_days_ago,
            status__in=['qualified', 'demo_completed', 'closed_won']
        ).count()
        
        return {
            'leads_last_30_days': recent_leads,
            'conversions_last_30_days': recent_conversions,
            'conversion_rate_last_30_days': (recent_conversions / recent_leads * 100) if recent_leads > 0 else 0
        }
