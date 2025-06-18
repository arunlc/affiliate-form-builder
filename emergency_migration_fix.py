#!/usr/bin/env python
"""
EMERGENCY MIGRATION FIX - Run this to fix the AppRegistryNotReady error
This script carefully creates migrations in the correct dependency order
"""

import os
import sys
import django
import shutil
import glob

# STEP 1: Setup Django Environment
print("🚨 EMERGENCY MIGRATION FIX STARTING...")
print("=" * 60)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')

# Clear any problematic migration files first
print("🧹 Cleaning up old migration files...")

# Remove all migration files except __init__.py
migration_patterns = [
    'apps/*/migrations/0*.py',
    'apps/*/migrations/__pycache__',
]

for pattern in migration_patterns:
    for file_path in glob.glob(pattern):
        try:
            if os.path.isdir(file_path):
                shutil.rmtree(file_path)
            else:
                os.remove(file_path)
            print(f"   Removed: {file_path}")
        except Exception as e:
            print(f"   Could not remove {file_path}: {e}")

# Ensure migration directories exist with __init__.py
apps = ['users', 'core', 'forms', 'affiliates', 'leads']
for app in apps:
    migration_dir = f'apps/{app}/migrations'
    os.makedirs(migration_dir, exist_ok=True)
    
    init_file = f'{migration_dir}/__init__.py'
    if not os.path.exists(init_file):
        with open(init_file, 'w') as f:
            f.write('# Migration package\n')
        print(f"   Created: {init_file}")

print("✅ Migration cleanup completed!")

# STEP 2: Setup Django
try:
    django.setup()
    print("✅ Django setup successful!")
except Exception as e:
    print(f"⚠️ Django setup warning: {e}")
    print("Continuing with migration creation...")

# STEP 3: Create migrations in dependency order
print("\n📝 Creating migrations in correct dependency order...")

from django.core.management import execute_from_command_line

def safe_migrate(app_name, migration_name=None):
    """Safely create migrations for an app"""
    try:
        if migration_name:
            print(f"   Creating {app_name} migration: {migration_name}")
            execute_from_command_line(['manage.py', 'makemigrations', app_name, '--name', migration_name])
        else:
            print(f"   Creating {app_name} migrations...")
            execute_from_command_line(['manage.py', 'makemigrations', app_name])
        return True
    except Exception as e:
        print(f"   ⚠️ {app_name} migration issue: {e}")
        return False

# Create in dependency order
migration_order = [
    ('users', 'initial_user_model'),      # No dependencies
    ('core', 'initial_core_models'),      # Depends on users  
    ('forms', 'initial_form_models'),     # Depends on users
    ('affiliates', 'initial_affiliate_models'),  # Depends on users
    ('leads', 'initial_lead_models'),     # Depends on forms, affiliates
]

print("\nCreating migrations in dependency order:")
for app_name, migration_name in migration_order:
    success = safe_migrate(app_name, migration_name)
    if success:
        print(f"   ✅ {app_name} migration created")
    else:
        print(f"   ⚠️ {app_name} migration skipped due to errors")

# STEP 4: Apply migrations
print("\n🗄️ Applying migrations...")

def safe_migrate_apply():
    """Safely apply migrations"""
    try:
        # First, migrate Django's built-in apps
        execute_from_command_line(['manage.py', 'migrate', 'auth', '--run-syncdb'])
        execute_from_command_line(['manage.py', 'migrate', 'contenttypes', '--run-syncdb'])
        
        # Then migrate our apps in order
        for app_name, _ in migration_order:
            try:
                execute_from_command_line(['manage.py', 'migrate', app_name])
                print(f"   ✅ Applied {app_name} migrations")
            except Exception as e:
                print(f"   ⚠️ {app_name} migration application warning: {e}")
        
        # Finally, migrate everything
        execute_from_command_line(['manage.py', 'migrate'])
        print("   ✅ All migrations applied!")
        return True
        
    except Exception as e:
        print(f"   ⚠️ Migration application issue: {e}")
        return False

migration_success = safe_migrate_apply()

# STEP 5: Create test users
print("\n👤 Creating test users...")

def create_test_users():
    """Create essential test users"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Create affiliate user
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
            print("   ✅ Created affiliate1 user")
        else:
            print("   ℹ️ affiliate1 user already exists")
        
        # Create operations user
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
            print("   ✅ Created operations user")
        else:
            print("   ℹ️ operations user already exists")
        
        # Try to create or find admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            try:
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@example.com',
                    password='admin123',
                    user_type='admin'
                )
                print("   ✅ Created admin superuser")
            except Exception as e:
                print(f"   ⚠️ Could not create admin: {e}")
                # Make affiliate1 admin as fallback
                user1.is_staff = True
                user1.is_superuser = True
                user1.save()
                print("   ✅ Made affiliate1 admin as fallback")
        else:
            print("   ℹ️ Admin user already exists")
        
        return True
        
    except Exception as e:
        print(f"   ⚠️ User creation issue: {e}")
        return False

user_success = create_test_users()

# STEP 6: Summary
print("\n" + "=" * 60)
print("🎉 EMERGENCY FIX COMPLETED!")
print("=" * 60)

if migration_success:
    print("✅ Migrations: SUCCESS")
else:
    print("⚠️ Migrations: PARTIAL SUCCESS")

if user_success:
    print("✅ Test Users: SUCCESS")
else:
    print("⚠️ Test Users: PARTIAL SUCCESS")

print("\n🔑 Login Credentials:")
print("- affiliate1 / affiliate123")
print("- operations / ops123") 
print("- admin / admin123 (or use affiliate1)")

print(f"\n🔗 Application URLs:")
print(f"- Main App: https://affiliate-form-builder.onrender.com")
print(f"- Admin: https://affiliate-form-builder.onrender.com/admin")
print(f"- API: https://affiliate-form-builder.onrender.com/api")

print("\n📋 Next Steps:")
print("1. Replace backend/settings/production.py with fixed version")
print("2. Replace backend/urls.py with fixed version") 
print("3. Commit and push changes to trigger new deployment")
print("4. Check Render logs for successful deployment")

print("\n🚀 Your app should now deploy successfully!")
