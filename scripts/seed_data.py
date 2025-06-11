#!/usr/bin/env python

"""
Seed script to create sample data for development
Usage: python scripts/seed_data.py
"""

import os
import sys
import django
from django.contrib.auth import get_user_model

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from apps.forms.models import Form, FormField
from apps.affiliates.models import Affiliate
from apps.leads.models import Lead
import uuid

User = get_user_model()

def create_sample_data():
    print("🌱 Creating sample data...")
    
    # Create affiliate user
    affiliate_user, created = User.objects.get_or_create(
        username='affiliate1',
        defaults={
            'email': 'affiliate@example.com',
            'user_type': 'affiliate',
            'affiliate_id': 'AFF001',
        }
    )
    if created:
        affiliate_user.set_password('affiliate123')
        affiliate_user.save()
        print("✅ Created affiliate user (affiliate1/affiliate123)")
    else:
        print("ℹ️ Affiliate user already exists")

    # Create operations user
    ops_user, created = User.objects.get_or_create(
        username='operations',
        defaults={
            'email': 'ops@example.com',
            'user_type': 'operations',
        }
    )
    if created:
        ops_user.set_password('ops123')
        ops_user.save()
        print("✅ Created operations user (operations/ops123)")
    else:
        print("ℹ️ Operations user already exists")

    # Get or create admin user (should already exist)
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                user_type='admin'
            )
            print("✅ Created admin user (admin/admin123)")
        else:
            print("ℹ️ Admin user already exists")
    except Exception as e:
        print(f"⚠️ Admin user setup: {e}")
        admin_user = User.objects.filter(user_type='admin').first()

    # Create affiliate profile
    affiliate, created = Affiliate.objects.get_or_create(
        user=affiliate_user,
        defaults={
            'affiliate_code': 'AFF001',
            'company_name': 'Sample Marketing Co',
            'website': 'https://samplemarketing.com',
        }
    )
    if created:
        print("✅ Created affiliate profile")
    else:
        print("ℹ️ Affiliate profile already exists")

    # Create sample form
    form, created = Form.objects.get_or_create(
        name='Lead Capture Form',
        defaults={
            'description': 'Capture potential customer information',
            'form_type': 'lead_capture',
            'created_by': admin_user,
            'fields_config': {
                'theme': 'modern',
                'submit_button_text': 'Get Started'
            }
        }
    )
    if created:
        print("✅ Created sample form")

        # Create form fields
        fields_data = [
            {'field_type': 'text', 'label': 'Full Name', 'placeholder': 'Enter your full name', 'is_required': True, 'order': 1},
            {'field_type': 'email', 'label': 'Email Address', 'placeholder': 'Enter your email', 'is_required': True, 'order': 2},
            {'field_type': 'text', 'label': 'Company', 'placeholder': 'Your company name', 'is_required': False, 'order': 3},
            {'field_type': 'select', 'label': 'Company Size', 'is_required': False, 'order': 4, 'options': ['1-10', '11-50', '51-200', '200+']},
            {'field_type': 'textarea', 'label': 'Message', 'placeholder': 'Tell us about your needs', 'is_required': False, 'order': 5},
        ]

        for field_data in fields_data:
            FormField.objects.create(form=form, **field_data)
        
        print("✅ Created form fields")
    else:
        print("ℹ️ Sample form already exists")

    # Create sample leads
    sample_leads = [
        {
            'email': 'john.doe@example.com',
            'name': 'John Doe',
            'phone': '+1234567890',
            'form_data': {
                'full_name': 'John Doe',
                'email': 'john.doe@example.com',
                'company': 'Tech Startup Inc',
                'company_size': '11-50',
                'message': 'Interested in your product'
            },
            'status': 'qualified',
            'utm_source': 'google',
            'utm_medium': 'cpc',
            'utm_campaign': 'lead-gen-2024'
        },
        {
            'email': 'jane.smith@example.com',
            'name': 'Jane Smith',
            'phone': '+1987654321',
            'form_data': {
                'full_name': 'Jane Smith',
                'email': 'jane.smith@example.com',
                'company': 'Marketing Agency',
                'company_size': '51-200',
                'message': 'Looking for a solution for our clients'
            },
            'status': 'demo_scheduled',
            'utm_source': 'facebook',
            'utm_medium': 'social',
            'utm_campaign': 'fb-ads-q1'
        }
    ]

    for lead_data in sample_leads:
        lead, created = Lead.objects.get_or_create(
            email=lead_data['email'],
            defaults={
                **lead_data,
                'form': form,
                'affiliate': affiliate,
            }
        )
        if created:
            print(f"✅ Created sample lead: {lead_data['email']}")
        else:
            print(f"ℹ️ Lead already exists: {lead_data['email']}")

    print("\n🎉 Sample data creation completed!")
    print("\n📋 Summary:")
    print(f"- Users: {User.objects.count()}")
    print(f"- Forms: {Form.objects.count()}")
    print(f"- Form Fields: {FormField.objects.count()}")
    print(f"- Affiliates: {Affiliate.objects.count()}")
    print(f"- Leads: {Lead.objects.count()}")
    
    print("\n🔑 Login Credentials:")
    print("Admin: admin / admin123 (or your existing superuser)")
    print("Affiliate: affiliate1 / affiliate123")
    print("Operations: operations / ops123")

    print(f"\n🔗 Form Embed URL: https://affiliate-form-builder.onrender.com/embed/{form.id}/")

if __name__ == '__main__':
    create_sample_data()
