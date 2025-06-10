# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPES = (
        ('admin', 'Admin'),
        ('affiliate', 'Affiliate'),
        ('operations', 'Operations'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='affiliate')
    affiliate_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"

---

# apps/forms/models.py
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
    fields_config = models.JSONField(default=dict)  # Store form fields as JSON
    styling_config = models.JSONField(default=dict)  # Store styling options
    
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
            self.embed_code = f'<iframe src="https://yourapp.com/embed/{self.id}" width="100%" height="600px"></iframe>'
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
    options = models.JSONField(default=list, blank=True)  # For select/radio/checkbox
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.form.name} - {self.label}"

---

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

---

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

---

# apps/core/models.py
from django.db import models

class Setting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.key

class Analytics(models.Model):
    form = models.ForeignKey('forms.Form', on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    views = models.PositiveIntegerField(default=0)
    submissions = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['form', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.form.name} - {self.date}"
    
    @property
    def conversion_rate(self):
        if self.views > 0:
            return (self.submissions / self.views) * 100
        return 0
