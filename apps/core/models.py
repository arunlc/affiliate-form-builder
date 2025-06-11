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
