# apps/affiliates/serializers.py - FIXED VERSION
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
    # Read-only fields for user information
    user_name = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    # Performance fields
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
        fields = [
            'id', 'user_name', 'email', 'affiliate_code', 'company_name', 
            'website', 'total_leads', 'total_conversions', 'conversion_rate',
            'is_active', 'created_at', 'updated_at', 'assigned_forms_count',
            'active_assignments', 'recent_performance', 'form_assignments'
        ]
        read_only_fields = (
            'id', 'user_name', 'email', 'total_leads', 'total_conversions', 
            'conversion_rate', 'created_at', 'updated_at'
        )
    
    def validate_affiliate_code(self, value):
        """Validate affiliate code uniqueness"""
        # Get the instance if we're updating
        instance = self.instance
        
        # Check if this code already exists for a different affiliate
        queryset = Affiliate.objects.filter(affiliate_code=value)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                f"Affiliate code '{value}' already exists. Please choose a different code."
            )
        
        return value
    
    def validate_website(self, value):
        """Validate website URL format"""
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                "Website URL must start with http:// or https://"
            )
        return value
    
    def get_assigned_forms_count(self, obj):
        """Get count of active form assignments"""
        try:
            return obj.affiliateformassignment_set.filter(is_active=True).count()
        except:
            return 0
    
    def get_active_assignments(self, obj):
        """Get active form assignments with basic info"""
        try:
            assignments = obj.affiliateformassignment_set.filter(is_active=True).select_related('form')
            return [{
                'form_id': str(assignment.form.id),
                'form_name': assignment.form.name,
                'leads_generated': assignment.leads_generated,
                'conversions': assignment.conversions,
                'conversion_rate': assignment.conversion_rate
            } for assignment in assignments]
        except:
            return []
    
    def get_recent_performance(self, obj):
        """Get recent performance metrics"""
        try:
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
        except:
            return {
                'leads_last_30_days': 0,
                'conversions_last_30_days': 0,
                'conversion_rate_last_30_days': 0
            }
    
    def to_representation(self, instance):
        """Custom representation to handle any missing relationships"""
        try:
            data = super().to_representation(instance)
            
            # Ensure all fields have default values
            data.setdefault('user_name', instance.user.username if instance.user else 'Unknown')
            data.setdefault('email', instance.user.email if instance.user else '')
            data.setdefault('total_leads', 0)
            data.setdefault('total_conversions', 0)
            data.setdefault('conversion_rate', 0.0)
            data.setdefault('assigned_forms_count', 0)
            data.setdefault('active_assignments', [])
            data.setdefault('recent_performance', {
                'leads_last_30_days': 0,
                'conversions_last_30_days': 0,
                'conversion_rate_last_30_days': 0
            })
            
            return data
        except Exception as e:
            # Log the error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in affiliate serialization: {e}")
            
            # Return minimal safe data
            return {
                'id': str(instance.id),
                'affiliate_code': instance.affiliate_code,
                'company_name': instance.company_name or '',
                'website': instance.website or '',
                'is_active': instance.is_active,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
                'user_name': 'Unknown',
                'email': '',
                'total_leads': 0,
                'total_conversions': 0,
                'conversion_rate': 0.0,
                'assigned_forms_count': 0,
                'active_assignments': [],
                'recent_performance': {
                    'leads_last_30_days': 0,
                    'conversions_last_30_days': 0,
                    'conversion_rate_last_30_days': 0
                }
            }
