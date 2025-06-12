# seed_data_for_render.py
# Place this in your project root and run: python seed_data_for_render.py

import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.contrib.auth import get_user_model
from apps.forms.models import Form, FormField
from apps.affiliates.models import Affiliate
from apps.leads.models import Lead, LeadNote
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

def create_sample_data():
    print("🌱 Creating sample data for Render deployment...")
    
    # Create test users
    users_created = 0
    
    # Affiliate user 1
    user1, created = User.objects.get_or_create(
        username='affiliate1',
        defaults={
            'email': 'affiliate1@example.com',
            'user_type': 'affiliate',
            'affiliate_id': 'AFF001'
        }
    )
    if created:
        user1.set_password('affiliate123')
        user1.save()
        users_created += 1
        print("✅ Created affiliate1 user")
    
    # Affiliate user 2
    user2, created = User.objects.get_or_create(
        username='affiliate2',
        defaults={
            'email': 'affiliate2@example.com',
            'user_type': 'affiliate',
            'affiliate_id': 'AFF002'
        }
    )
    if created:
        user2.set_password('affiliate123')
        user2.save()
        users_created += 1
        print("✅ Created affiliate2 user")
    
    # Operations user
    ops_user, created = User.objects.get_or_create(
        username='operations',
        defaults={
            'email': 'ops@example.com',
            'user_type': 'operations'
        }
    )
    if created:
        ops_user.set_password('ops123')
        ops_user.save()
        users_created += 1
        print("✅ Created operations user")
    
    # Get admin user (should exist)
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.filter(user_type='admin').first()
        if not admin_user:
            admin_user = user1  # Fallback
    
    # Create affiliate profiles
    affiliates_created = 0
    
    affiliate1, created = Affiliate.objects.get_or_create(
        user=user1,
        defaults={
            'affiliate_code': 'AFF001',
            'company_name': 'Digital Marketing Pro',
            'website': 'https://digitalmarketingpro.com'
        }
    )
    if created:
        affiliates_created += 1
        print("✅ Created affiliate1 profile")
    
    affiliate2, created = Affiliate.objects.get_or_create(
        user=user2,
        defaults={
            'affiliate_code': 'AFF002',
            'company_name': 'Lead Generation Experts',
            'website': 'https://leadgenexperts.com'
        }
    )
    if created:
        affiliates_created += 1
        print("✅ Created affiliate2 profile")
    
    # Create sample forms
    forms_created = 0
    
    # Lead Capture Form
    form1, created = Form.objects.get_or_create(
        name='Lead Capture Form',
        defaults={
            'description': 'Capture potential customer information',
            'form_type': 'lead_capture',
            'created_by': admin_user,
            'fields_config': {'theme': 'modern', 'submit_button_text': 'Get Started'}
        }
    )
    if created:
        forms_created += 1
        print("✅ Created Lead Capture Form")
        
        # Add fields
        FormField.objects.get_or_create(
            form=form1, label='Full Name',
            defaults={'field_type': 'text', 'placeholder': 'Enter your full name', 'is_required': True, 'order': 1}
        )
        FormField.objects.get_or_create(
            form=form1, label='Email Address',
            defaults={'field_type': 'email', 'placeholder': 'Enter your email', 'is_required': True, 'order': 2}
        )
        FormField.objects.get_or_create(
            form=form1, label='Company',
            defaults={'field_type': 'text', 'placeholder': 'Your company', 'is_required': False, 'order': 3}
        )
        FormField.objects.get_or_create(
            form=form1, label='Message',
            defaults={'field_type': 'textarea', 'placeholder': 'Tell us your needs', 'is_required': False, 'order': 4}
        )
    
    # Newsletter Form
    form2, created = Form.objects.get_or_create(
        name='Newsletter Signup',
        defaults={
            'description': 'Subscribe to our newsletter',
            'form_type': 'newsletter',
            'created_by': admin_user,
            'fields_config': {'theme': 'modern', 'submit_button_text': 'Subscribe'}
        }
    )
    if created:
        forms_created += 1
        print("✅ Created Newsletter Form")
        
        FormField.objects.get_or_create(
            form=form2, label='First Name',
            defaults={'field_type': 'text', 'placeholder': 'Your first name', 'is_required': True, 'order': 1}
        )
        FormField.objects.get_or_create(
            form=form2, label='Email',
            defaults={'field_type': 'email', 'placeholder': 'your@email.com', 'is_required': True, 'order': 2}
        )
    
    # Contact Form
    form3, created = Form.objects.get_or_create(
        name='Contact Us',
        defaults={
            'description': 'Get in touch with our team',
            'form_type': 'contact',
            'created_by': admin_user,
            'fields_config': {'theme': 'modern', 'submit_button_text': 'Send Message'}
        }
    )
    if created:
        forms_created += 1
        print("✅ Created Contact Form")
        
        FormField.objects.get_or_create(
            form=form3, label='Name',
            defaults={'field_type': 'text', 'placeholder': 'Your name', 'is_required': True, 'order': 1}
        )
        FormField.objects.get_or_create(
            form=form3, label='Email',
            defaults={'field_type': 'email', 'placeholder': 'your@email.com', 'is_required': True, 'order': 2}
        )
        FormField.objects.get_or_create(
            form=form3, label='Subject',
            defaults={'field_type': 'text', 'placeholder': 'Subject', 'is_required': True, 'order': 3}
        )
        FormField.objects.get_or_create(
            form=form3, label='Message',
            defaults={'field_type': 'textarea', 'placeholder': 'Your message', 'is_required': True, 'order': 4}
        )
    
    # Create sample leads
    leads_created = 0
    sample_leads = [
        {
            'email': 'john.doe@techstartup.com',
            'name': 'John Doe',
            'phone': '+1-555-0123',
            'form': form1,
            'affiliate': affiliate1,
            'status': 'qualified',
            'utm_source': 'google',
            'utm_campaign': 'lead-gen-2024',
            'days_ago': 1
        },
        {
            'email': 'sarah.wilson@agency.com',
            'name': 'Sarah Wilson',
            'form': form1,
            'affiliate': affiliate2,
            'status': 'new',
            'utm_source': 'facebook',
            'days_ago': 2
        },
        {
            'email': 'mike.chen@ecommerce.com',
            'name': 'Mike Chen',
            'form': form2,
            'affiliate': affiliate1,
            'status': 'contacted',
            'utm_source': 'linkedin',
            'days_ago': 3
        },
        {
            'email': 'lisa.adams@consulting.com',
            'name': 'Lisa Adams',
            'form': form3,
            'status': 'demo_scheduled',
            'utm_source': 'referral',
            'days_ago': 5
        },
        {
            'email': 'david.brown@healthcare.org',
            'name': 'David Brown',
            'form': form1,
            'affiliate': affiliate2,
            'status': 'closed_won',
            'utm_source': 'google',
            'days_ago': 10
        }
    ]
    
    for lead_data in sample_leads:
        if not Lead.objects.filter(email=lead_data['email']).exists():
            created_at = timezone.now() - timedelta(days=lead_data['days_ago'])
            
            Lead.objects.create(
                form=lead_data['form'],
                affiliate=lead_data.get('affiliate'),
                form_data={
                    'full_name': lead_data['name'],
                    'email': lead_data['email'],
                    'company': 'Sample Company',
                    'message': 'Sample lead submission'
                },
                email=lead_data['email'],
                name=lead_data['name'],
                phone=lead_data.get('phone', ''),
                utm_source=lead_data['utm_source'],
                utm_campaign=lead_data['utm_campaign'],
                status=lead_data['status'],
                created_at=created_at,
                updated_at=created_at,
                ip_address='192.168.1.100'
            )
            leads_created += 1
            print(f"✅ Created lead: {lead_data['email']}")
    
    # Update affiliate stats
    for affiliate in [affiliate1, affiliate2]:
        affiliate.total_leads = affiliate.leads.count()
        affiliate.total_conversions = affiliate.leads.filter(
            status__in=['qualified', 'demo_completed', 'closed_won']
        ).count()
        affiliate.save()
    
    # Create some additional random leads for better data
    additional_leads = 15
    statuses = ['new', 'contacted', 'qualified', 'demo_scheduled', 'closed_won']
    sources = ['google', 'facebook', 'linkedin', 'direct', 'referral']
    
    for i in range(additional_leads):
        email = f"lead{i+10}@example{i%3}.com"
        if not Lead.objects.filter(email=email).exists():
            Lead.objects.create(
                form=random.choice([form1, form2, form3]),
                affiliate=random.choice([affiliate1, affiliate2, None]),
                form_data={
                    'full_name': f'Sample Lead {i+10}',
                    'email': email,
                    'company': f'Company {i+10}'
                },
                email=email,
                name=f'Sample Lead {i+10}',
                utm_source=random.choice(sources),
                status=random.choice(statuses),
                created_at=timezone.now() - timedelta(days=random.randint(1, 30)),
                ip_address='192.168.1.100'
            )
            leads_created += 1
    
    # Final stats update
    for affiliate in [affiliate1, affiliate2]:
        affiliate.total_leads = affiliate.leads.count()
        affiliate.total_conversions = affiliate.leads.filter(
            status__in=['qualified', 'demo_completed', 'closed_won']
        ).count()
        affiliate.save()
    
    print("\n🎉 Sample data creation completed!")
    print(f"✅ Users created: {users_created}")
    print(f"✅ Affiliates created: {affiliates_created}")
    print(f"✅ Forms created: {forms_created}")
    print(f"✅ Leads created: {leads_created}")
    
    print("\n🔑 Login Credentials:")
    print("- affiliate1 / affiliate123")
    print("- affiliate2 / affiliate123")
    print("- operations / ops123")
    
    print(f"\n🔗 Sample Form URLs:")
    print(f"- Lead Capture: https://affiliate-form-builder.onrender.com/embed/{form1.id}/")
    print(f"- Newsletter: https://affiliate-form-builder.onrender.com/embed/{form2.id}/")
    print(f"- Contact: https://affiliate-form-builder.onrender.com/embed/{form3.id}/")
    
    print(f"\n🔗 With Affiliate Tracking:")
    print(f"- https://affiliate-form-builder.onrender.com/embed/{form1.id}/?affiliate=AFF001&utm_source=test")

if __name__ == '__main__':
    create_sample_data()
