# apps/affiliates/models.py
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Affiliate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    affiliate_code = models.CharField(max_length=50, unique=True)
    company_name = models.CharField(max_length=200, blank=True)
    website = models.URLField(blank=True)
    
    # Performance tracking
    total_leads = models.PositiveIntegerField(default=0)
    total_conversions = models.PositiveIntegerField(default=0)
    
    # NEW: Form assignments - Many-to-Many relationship
    assigned_forms = models.ManyToManyField(
        'forms.Form', 
        through='AffiliateFormAssignment',
        related_name='assigned_affiliates',
        blank=True
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.affiliate_code}"
    
    @property
    def conversion_rate(self):
        if self.total_leads > 0:
            return (self.total_conversions / self.total_leads) * 100
        return 0

    def get_assigned_forms(self):
        """Get all forms assigned to this affiliate"""
        return self.assigned_forms.filter(is_active=True)
    
    def get_leads_count_for_forms(self):
        """Get total leads for all assigned forms"""
        return self.leads.filter(form__in=self.assigned_forms.all()).count()


class AffiliateFormAssignment(models.Model):
    """Through model for Affiliate-Form assignments with additional metadata"""
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE)
    form = models.ForeignKey('forms.Form', on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='form_assignments_made'
    )
    is_active = models.BooleanField(default=True)
    
    # Performance tracking for this specific assignment
    leads_generated = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['affiliate', 'form']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.affiliate.affiliate_code} → {self.form.name}"
    
    @property
    def conversion_rate(self):
        if self.leads_generated > 0:
            return (self.conversions / self.leads_generated) * 100
        return 0

    def update_stats(self):
        """Update performance stats for this assignment"""
        leads = self.affiliate.leads.filter(form=self.form)
        self.leads_generated = leads.count()
        self.conversions = leads.filter(
            status__in=['qualified', 'demo_completed', 'closed_won']
        ).count()
        self.save()
