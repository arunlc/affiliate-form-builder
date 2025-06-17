# seed_data_for_render.py - SIMPLIFIED VERSION
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_data():
    print("🌱 Creating sample data for Render deployment...")
    
    # Create test users only - no complex relationships initially
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
    
    # Try to create admin user
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                user_type='admin'
            )
            print("✅ Created admin user")
        else:
            print("ℹ️ Admin user already exists")
    except Exception as e:
        print(f"⚠️ Could not create admin user: {e}")
        # Use affiliate as fallback admin
        admin_user = user1
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.user_type = 'admin'
        admin_user.save()
        print("✅ Made affiliate1 into admin user")
    
    print(f"\n🎉 Basic setup completed!")
    print(f"✅ Users created: {users_created}")
    
    print("\n🔑 Login Credentials:")
    print("- affiliate1 / affiliate123")
    print("- operations / ops123")
    print("- admin / admin123 (or use affiliate1 as admin)")
    
    print(f"\n🔗 Application URL:")
    print(f"- https://affiliate-form-builder.onrender.com")
    
    # We'll create other models after initial migration succeeds
    print("\nℹ️ Other data (forms, affiliates, leads) will be created after successful deployment")

if __name__ == '__main__':
    create_sample_data()
