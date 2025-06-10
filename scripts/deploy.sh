# scripts/deploy.sh
#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found. Make sure you're in the project root."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
echo "🔧 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "✅ Deployment completed successfully!"

---

# scripts/setup_local.sh
#!/bin/bash

echo "🏗️ Setting up local development environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment variables
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your settings before continuing."
fi

# Setup database
echo "🗄️ Setting up database..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
echo "👤 Create a superuser account? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    python manage.py createsuperuser
fi

# Setup frontend
echo "⚛️ Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Local setup completed!"
echo ""
echo "🚀 To start development:"
echo "1. Backend: python manage.py runserver"
echo "2. Frontend: cd frontend && npm run dev"
echo "3. Visit: http://localhost:3000"

---

# scripts/seed_data.py
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
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')
django.setup()

from apps.forms.models import Form, FormField
from apps.affiliates.models import Affiliate
from apps.leads.models import Lead
import uuid

User = get_user_model()

def create_sample_data():
    print("🌱 Creating sample data...")
    
    # Create users
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'user_type': 'admin',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✅ Created admin user (admin/admin123)")

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

    print("🎉 Sample data creation completed!")
    print("\n📋 Summary:")
    print(f"- Users: {User.objects.count()}")
    print(f"- Forms: {Form.objects.count()}")
    print(f"- Form Fields: {FormField.objects.count()}")
    print(f"- Affiliates: {Affiliate.objects.count()}")
    print(f"- Leads: {Lead.objects.count()}")
    
    print("\n🔑 Login Credentials:")
    print("Admin: admin / admin123")
    print("Affiliate: affiliate1 / affiliate123")
    print("Operations: operations / ops123")

if __name__ == '__main__':
    create_sample_data()

---

# public/form-embed.js
/**
 * Embeddable Form JavaScript
 * Usage: <script src="https://yourapp.com/js/form-embed.js" data-form-id="uuid"></script>
 */

(function() {
    'use strict';
    
    // Get the script tag and form ID
    const scriptTag = document.currentScript;
    const formId = scriptTag.getAttribute('data-form-id');
    const baseUrl = scriptTag.src.replace('/js/form-embed.js', '');
    
    if (!formId) {
        console.error('Affiliate Form Builder: data-form-id is required');
        return;
    }
    
    // Create iframe container
    const container = document.createElement('div');
    container.id = `affiliate-form-${formId}`;
    container.style.cssText = 'width: 100%; max-width: 600px; margin: 0 auto;';
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${formId}/`;
    iframe.style.cssText = 'width: 100%; height: 600px; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    
    // Add iframe to container
    container.appendChild(iframe);
    
    // Insert after the script tag
    scriptTag.parentNode.insertBefore(container, scriptTag.nextSibling);
    
    // Handle iframe height adjustment
    window.addEventListener('message', function(event) {
        if (event.origin !== baseUrl.replace(/^https?:\/\//, '').replace(/^\/\//, '')) return;
        
        if (event.data.type === 'resize' && event.data.formId === formId) {
            iframe.style.height = event.data.height + 'px';
        }
    });
    
    console.log('Affiliate Form Builder: Form loaded successfully');
})();

---

# Makefile
.PHONY: help install dev build deploy test clean seed

help:
	@echo "Available commands:"
	@echo "  install    Install dependencies for development"
	@echo "  dev        Start development servers"
	@echo "  build      Build the application"
	@echo "  deploy     Deploy to production"
	@echo "  test       Run tests"
	@echo "  clean      Clean build files"
	@echo "  seed       Create sample data"

install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	@echo "Backend will start on http://localhost:8000"
	@echo "Frontend will start on http://localhost:3000"
	python manage.py runserver &
	cd frontend && npm run dev

build:
	@echo "Building application..."
	cd frontend && npm run build
	python manage.py collectstatic --noinput

deploy:
	@echo "Deploying application..."
	chmod +x scripts/deploy.sh
	./scripts/deploy.sh

test:
	@echo "Running tests..."
	python manage.py test
	cd frontend && npm run test

clean:
	@echo "Cleaning build files..."
	rm -rf frontend/dist
	rm -rf staticfiles
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete

seed:
	@echo "Creating sample data..."
	python scripts/seed_data.py

setup:
	@echo "Setting up local environment..."
	chmod +x scripts/setup_local.sh
	./scripts/setup_local.sh

---

# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.11
        
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Install Node.js dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run Python tests
      run: |
        python manage.py test
        
    - name: Build frontend
      run: |
        cd frontend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Render
      run: |
        echo "Deployment will be handled by Render's automatic deployment"
        echo "Connected to GitHub repository"
