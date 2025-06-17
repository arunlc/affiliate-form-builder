# apps/affiliates/models.py - FIXED VERSION
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

# apps/forms/models.py - FIXED VERSION
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Form(models.Model):
    FORM_TYPES = (
        ('lead_capture', 'Lead Capture'),
        ('contact', 'Contact Form'),
        ('newsletter', 'Newsletter Signup'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    form_type = models.CharField(max_length=50, choices=FORM_TYPES, default='lead_capture')
    
    # Form configuration
    fields_config = models.JSONField(default=dict)
    styling_config = models.JSONField(default=dict)
    
    # Embed settings
    embed_code = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.embed_code:
            self.embed_code = f'<iframe src="/embed/{self.id}/" width="100%" height="600px" frameborder="0"></iframe>'
        super().save(*args, **kwargs)

class FormField(models.Model):
    FIELD_TYPES = (
        ('text', 'Text Input'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('textarea', 'Textarea'),
        ('select', 'Select Dropdown'),
        ('checkbox', 'Checkbox'),
        ('radio', 'Radio Button'),
    )
    
    form = models.ForeignKey(Form, related_name='fields', on_delete=models.CASCADE)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    label = models.CharField(max_length=200)
    placeholder = models.CharField(max_length=200, blank=True)
    is_required = models.BooleanField(default=False)
    options = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.form.name} - {self.label}"

# apps/leads/models.py - FIXED VERSION  
from django.db import models
from django.contrib.auth import get_user_model
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
    
    # String references to avoid circular imports
    form = models.ForeignKey('forms.Form', on_delete=models.CASCADE, related_name='leads')
    affiliate = models.ForeignKey(
        'affiliates.Affiliate', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='leads'
    )
    
    # Lead data
    form_data = models.JSONField(default=dict)
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
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_leads'
    )
    
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
