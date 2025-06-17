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
    fields_config = models.JSONField(default=dict)  # Store form fields as JSON
    styling_config = models.JSONField(default=dict)  # Store styling options
    
    # Embed settings
    embed_code = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add the many-to-many relationship to affiliates
    assigned_affiliates = models.ManyToManyField(
        'affiliates.Affiliate',
        through='affiliates.AffiliateFormAssignment',
        related_name='assigned_forms',
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.embed_code:
            # We'll set this after we know the domain
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
    options = models.JSONField(default=list, blank=True)  # For select/radio/checkbox
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.form.name} - {self.label}"
