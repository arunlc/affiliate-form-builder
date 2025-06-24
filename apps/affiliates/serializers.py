# apps/affiliates/serializers.py - Enhanced with Password Support
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
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
        instance = self.instance
        
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

class AffiliateCreateSerializer(serializers.ModelSerializer):
    """Enhanced serializer for creating affiliates with user and password"""
    user_name = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    send_credentials = serializers.BooleanField(write_only=True, default=False)
    
    class Meta:
        model = Affiliate
        fields = [
            'user_name', 'email', 'phone', 'password', 'send_credentials',
            'affiliate_code', 'company_name', 'website', 'is_active'
        ]
    
    def validate_user_name(self, value):
        """Validate username uniqueness"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(f"Username '{value}' is already taken")
        return value
    
    def validate_password(self, value):
        """Validate password if provided"""
        if value:
            try:
                validate_password(value)
            except ValidationError as e:
                raise serializers.ValidationError(e.messages)
        return value
    
    def validate_affiliate_code(self, value):
        """Validate affiliate code uniqueness"""
        if Affiliate.objects.filter(affiliate_code=value).exists():
            raise serializers.ValidationError(
                f"Affiliate code '{value}' already exists"
            )
        return value
    
    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail
        from django.conf import settings
        import secrets
        import string
        
        User = get_user_model()
        
        # Extract user-related fields
        user_name = validated_data.pop('user_name')
        email = validated_data.pop('email', '')
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password', '')
        send_credentials = validated_data.pop('send_credentials', False)
        
        # Generate password if not provided
        if not password:
            # Generate secure random password
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        # Create user
        user = User.objects.create_user(
            username=user_name,
            email=email,
            password=password,
            user_type='affiliate',
            affiliate_id=validated_data['affiliate_code']
        )
        
        # Create affiliate
        affiliate = Affiliate.objects.create(
            user=user,
            **validated_data
        )
        
        # Send credentials via email if requested and email is provided
        if send_credentials and email:
            try:
                subject = 'Your Affiliate Account Credentials'
                message = f"""
                Welcome to our Affiliate Program!
                
                Your account has been created with the following credentials:
                
                Username: {user_name}
                Password: {password}
                Affiliate Code: {validated_data['affiliate_code']}
                
                Please login at: {settings.FRONTEND_URL}/login
                
                For security, please change your password after your first login.
                
                Best regards,
                The Team
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=True,
                )
            except Exception as e:
                # Don't fail affiliate creation if email fails
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send credentials email: {e}")
        
        return affiliate

class AffiliateUpdateSerializer(serializers.ModelSerializer):
    """Enhanced serializer for updating affiliates"""
    user_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    
    class Meta:
        model = Affiliate
        fields = [
            'user_name', 'email', 'affiliate_code', 'company_name', 
            'website', 'is_active'
        ]
    
    def validate_user_name(self, value):
        """Validate username uniqueness for updates"""
        if value:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Exclude current user from check
            queryset = User.objects.filter(username=value)
            if self.instance and self.instance.user:
                queryset = queryset.exclude(id=self.instance.user.id)
            
            if queryset.exists():
                raise serializers.ValidationError(f"Username '{value}' is already taken")
        return value
    
    def validate_affiliate_code(self, value):
        """Validate affiliate code uniqueness for updates"""
        if value:
            queryset = Affiliate.objects.filter(affiliate_code=value)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    f"Affiliate code '{value}' already exists"
                )
        return value
    
    def update(self, instance, validated_data):
        # Update user fields if provided
        user_name = validated_data.pop('user_name', None)
        email = validated_data.pop('email', None)
        
        if user_name:
            instance.user.username = user_name
        if email is not None:
            instance.user.email = email
        
        if user_name or email is not None:
            instance.user.save()
        
        # Update affiliate fields
        return super().update(instance, validated_data)
