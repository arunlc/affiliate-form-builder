# apps/affiliates/models.py - FIXED WITH MISSING MODEL
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


# MISSING MODEL - This was causing the import error
class AffiliateFormAssignment(models.Model):
    """Through model for affiliate-form assignments"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE)
    form = models.ForeignKey('forms.Form', on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Performance tracking for this specific assignment
    leads_generated = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['affiliate', 'form']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.affiliate.affiliate_code} - {self.form.name}"
    
    @property
    def conversion_rate(self):
        if self.leads_generated > 0:
            return (self.conversions / self.leads_generated) * 100
        return 0
    
    def update_stats(self):
        """Update performance statistics for this assignment"""
        from apps.leads.models import Lead
        
        # Count leads for this affiliate-form combination
        leads_count = Lead.objects.filter(
            affiliate=self.affiliate,
            form=self.form
        ).count()
        
        # Count conversions (qualified leads)
        conversions_count = Lead.objects.filter(
            affiliate=self.affiliate,
            form=self.form,
            status__in=['qualified', 'demo_completed', 'closed_won']
        ).count()
        
        # Update the stats
        self.leads_generated = leads_count
        self.conversions = conversions_count
        self.save(update_fields=['leads_generated', 'conversions'])
        
        return self
