# apps/leads/models.py
from django.db import models
from django.contrib.auth import get_user_model
from apps.forms.models import Form
from apps.affiliates.models import Affiliate
import uuid

User = get_user_model()

class Lead(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('demo_scheduled', 'Demo Scheduled'),
        ('demo_completed', 'Demo Completed'),
        ('proposal_sent', 'Proposal Sent'),
        ('negotiating', 'Negotiating'),
        ('closed_won', 'Closed Won'),
        ('closed_lost', 'Closed Lost'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='leads')
    affiliate = models.ForeignKey(Affiliate, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Lead data
    form_data = models.JSONField(default=dict)  # Store all form submission data
    email = models.EmailField()
    name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Tracking data
    utm_source = models.CharField(max_length=100, blank=True)
    utm_medium = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    utm_term = models.CharField(max_length=100, blank=True)
    utm_content = models.CharField(max_length=100, blank=True)
    referrer_url = models.URLField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Status and notes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['affiliate']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.form.name} ({self.status})"
    
    @property
    def affiliate_code(self):
        return self.affiliate.affiliate_code if self.affiliate else None

class LeadNote(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='lead_notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.lead.email} by {self.user.username}"
