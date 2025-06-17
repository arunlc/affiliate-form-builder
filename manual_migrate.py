#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model

print("🚀 Manual migration fix...")

# Step 1: Users first
print("Step 1: Users migrations...")
execute_from_command_line(['manage.py', 'makemigrations', 'users'])
execute_from_command_line(['manage.py', 'migrate', 'users'])

# Step 2: Other apps
apps = ['core', 'forms', 'affiliates', 'leads']
for app in apps:
    print(f"Step: {app} migrations...")
    execute_from_command_line(['manage.py', 'makemigrations', app])
    execute_from_command_line(['manage.py', 'migrate', app])

# Step 3: Apply all
execute_from_command_line(['manage.py', 'migrate'])

# Step 4: Create users
User = get_user_model()
user1, created = User.objects.get_or_create(
    username='affiliate1',
    defaults={'email': 'affiliate1@example.com', 'user_type': 'affiliate', 'affiliate_id': 'AFF001'}
)
if created:
    user1.set_password('affiliate123')
    user1.save()

print("✅ Done!")
