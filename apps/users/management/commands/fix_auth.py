# apps/users/management/commands/fix_auth.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from apps.affiliates.models import Affiliate

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix authentication issues and verify user setup'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-missing',
            action='store_true',
            help='Create missing affiliate profiles',
        )
        parser.add_argument(
            '--reset-tokens',
            action='store_true',
            help='Reset all authentication tokens',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('🔍 Analyzing authentication setup...\n')
        
        # Check all users
        users = User.objects.all()
        self.stdout.write(f"Found {users.count()} users:")
        
        for user in users:
            self.stdout.write(f"\n👤 User: {user.username}")
            self.stdout.write(f"   Type: {user.user_type}")
            self.stdout.write(f"   Active: {user.is_active}")
            self.stdout.write(f"   Email: {user.email}")
            self.stdout.write(f"   Last Login: {user.last_login}")
            
            # Check if user can authenticate
            from django.contrib.auth import authenticate
            test_auth = authenticate(username=user.username, password='affiliate123' if user.user_type == 'affiliate' else 'admin123')
            self.stdout.write(f"   Test Auth: {'✅ Success' if test_auth else '❌ Failed'}")
            
            # Check token
            try:
                token = Token.objects.get(user=user)
                self.stdout.write(f"   Token: ✅ Exists ({token.key[:10]}...)")
            except Token.DoesNotExist:
                self.stdout.write(f"   Token: ❌ Missing")
                if options['reset_tokens']:
                    token = Token.objects.create(user=user)
                    self.stdout.write(f"   Token: ✅ Created ({token.key[:10]}...)")
            
            # Check affiliate profile for affiliate users
            if user.user_type == 'affiliate':
                try:
                    affiliate = Affiliate.objects.get(user=user)
                    self.stdout.write(f"   Affiliate: ✅ Profile exists ({affiliate.affiliate_code})")
                except Affiliate.DoesNotExist:
                    self.stdout.write(f"   Affiliate: ❌ Profile missing")
                    if options['create_missing']:
                        affiliate = Affiliate.objects.create(
                            user=user,
                            affiliate_code=f"AFF{user.id:03d}",
                            company_name=f"{user.username} Company"
                        )
                        self.stdout.write(f"   Affiliate: ✅ Created ({affiliate.affiliate_code})")
        
        self.stdout.write('\n🔧 Authentication fixes:')
        
        if options['reset_tokens']:
            Token.objects.all().delete()
            for user in users:
                Token.objects.create(user=user)
            self.stdout.write('✅ All tokens reset')
        
        if options['create_missing']:
            affiliate_users = User.objects.filter(user_type='affiliate')
            for user in affiliate_users:
                if not hasattr(user, 'affiliate'):
                    Affiliate.objects.create(
                        user=user,
                        affiliate_code=f"AFF{user.id:03d}",
                        company_name=f"{user.username} Company"
                    )
            self.stdout.write('✅ Missing affiliate profiles created')
        
        # Test accounts verification
        self.stdout.write('\n🧪 Test Accounts Status:')
        
        test_accounts = [
            ('admin', 'admin123', 'admin'),
            ('affiliate1', 'affiliate123', 'affiliate'),
            ('operations', 'ops123', 'operations'),
        ]
        
        for username, password, expected_type in test_accounts:
            try:
                user = User.objects.get(username=username)
                auth_test = authenticate(username=username, password=password)
                
                status = "✅" if auth_test else "❌"
                self.stdout.write(f"{status} {username} ({expected_type}): {'Login OK' if auth_test else 'Login Failed'}")
                
                if user.user_type != expected_type:
                    self.stdout.write(f"   ⚠️  Wrong user type: {user.user_type} (expected: {expected_type})")
                
            except User.DoesNotExist:
                self.stdout.write(f"❌ {username}: User does not exist")
        
        self.stdout.write('\n📊 Summary:')
        self.stdout.write(f"Total Users: {User.objects.count()}")
        self.stdout.write(f"Admin Users: {User.objects.filter(user_type='admin').count()}")
        self.stdout.write(f"Affiliate Users: {User.objects.filter(user_type='affiliate').count()}")
        self.stdout.write(f"Operations Users: {User.objects.filter(user_type='operations').count()}")
        self.stdout.write(f"Active Tokens: {Token.objects.count()}")
        self.stdout.write(f"Affiliate Profiles: {Affiliate.objects.count()}")
        
        self.stdout.write('\n🚀 Next Steps:')
        self.stdout.write('1. Visit /api/auth/debug/ to test authentication')
        self.stdout.write('2. Try logging in with test accounts')
        self.stdout.write('3. If issues persist, run: python manage.py fix_auth --reset-tokens --create-missing')
        
        self.stdout.write('\n✅ Authentication analysis complete!')

# apps/users/management/commands/create_test_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.affiliates.models import Affiliate

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for the application'
    
    def handle(self, *args, **options):
        self.stdout.write('👥 Creating test users...\n')
        
        # Create admin user
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
            self.stdout.write('✅ Created admin user (admin/admin123)')
        else:
            # Update password in case it was wrong
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write('✅ Updated admin user password')
        
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
            self.stdout.write('✅ Created affiliate user (affiliate1/affiliate123)')
        else:
            # Update password in case it was wrong
            affiliate_user.set_password('affiliate123')
            affiliate_user.save()
            self.stdout.write('✅ Updated affiliate user password')
        
        # Create affiliate profile
        affiliate, created = Affiliate.objects.get_or_create(
            user=affiliate_user,
            defaults={
                'affiliate_code': 'AFF001',
                'company_name': 'Test Marketing Company',
                'website': 'https://testmarketing.com',
            }
        )
        if created:
            self.stdout.write('✅ Created affiliate profile (AFF001)')
        else:
            self.stdout.write('✅ Affiliate profile already exists')
        
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
            self.stdout.write('✅ Created operations user (operations/ops123)')
        else:
            # Update password in case it was wrong
            ops_user.set_password('ops123')
            ops_user.save()
            self.stdout.write('✅ Updated operations user password')
        
        # Clear and recreate tokens
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user__in=[admin_user, affiliate_user, ops_user]).delete()
        
        for user in [admin_user, affiliate_user, ops_user]:
            token = Token.objects.create(user=user)
            self.stdout.write(f'🔑 Created token for {user.username}: {token.key[:10]}...')
        
        self.stdout.write('\n🎉 Test users created successfully!')
        self.stdout.write('\n🔑 Login Credentials:')
        self.stdout.write('Admin: admin / admin123')
        self.stdout.write('Affiliate: affiliate1 / affiliate123')
        self.stdout.write('Operations: operations / ops123')
        self.stdout.write('\n🔗 Test URLs:')
        self.stdout.write('Auth Debug: /api/auth/debug/')
        self.stdout.write('Login Test: POST /api/auth/login/')
        self.stdout.write('Django Admin: /admin/')
        
        # Test login for each user
        self.stdout.write('\n🧪 Testing login for all users...')
        from django.contrib.auth import authenticate
        
        for username, password in [('admin', 'admin123'), ('affiliate1', 'affiliate123'), ('operations', 'ops123')]:
            auth_result = authenticate(username=username, password=password)
            status = "✅" if auth_result else "❌"
            self.stdout.write(f'{status} {username}: {"Login successful" if auth_result else "Login failed"}')
        
        self.stdout.write('\n✅ Setup complete!')

# apps/affiliates/management/__init__.py
# This file makes Python treat the directory as a package

# apps/affiliates/management/commands/__init__.py
# This file makes Python treat the directory as a package

# apps/affiliates/management/commands/verify_affiliates.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.affiliates.models import Affiliate

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify affiliate setup and fix issues'
    
    def handle(self, *args, **options):
        self.stdout.write('🔍 Verifying affiliate setup...\n')
        
        # Get all affiliate users
        affiliate_users = User.objects.filter(user_type='affiliate')
        self.stdout.write(f'Found {affiliate_users.count()} affiliate users')
        
        for user in affiliate_users:
            self.stdout.write(f'\n👤 Checking user: {user.username}')
            
            # Check if affiliate profile exists
            try:
                affiliate = Affiliate.objects.get(user=user)
                self.stdout.write(f'   ✅ Affiliate profile: {affiliate.affiliate_code}')
                self.stdout.write(f'   📊 Stats: {affiliate.total_leads} leads, {affiliate.conversion_rate:.1f}% conversion')
                self.stdout.write(f'   🏢 Company: {affiliate.company_name or "Not set"}')
                self.stdout.write(f'   🌐 Website: {affiliate.website or "Not set"}')
                self.stdout.write(f'   ✅ Active: {affiliate.is_active}')
            except Affiliate.DoesNotExist:
                self.stdout.write(f'   ❌ No affiliate profile found')
                
                # Create affiliate profile
                affiliate_code = f'AFF{user.id:03d}'
                affiliate = Affiliate.objects.create(
                    user=user,
                    affiliate_code=affiliate_code,
                    company_name=f'{user.username} Company',
                    website='',
                )
                self.stdout.write(f'   ✅ Created affiliate profile: {affiliate_code}')
        
        # Summary
        self.stdout.write(f'\n📊 Summary:')
        self.stdout.write(f'Total affiliate users: {affiliate_users.count()}')
        self.stdout.write(f'Total affiliate profiles: {Affiliate.objects.count()}')
        self.stdout.write(f'Active affiliates: {Affiliate.objects.filter(is_active=True).count()}')
        
        self.stdout.write('\n✅ Affiliate verification complete!')
