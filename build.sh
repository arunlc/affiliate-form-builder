#!/usr/bin/env bash
# build.sh - FIXED VERSION for Render deployment
set -o errexit

echo "🔧 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup frontend
echo "⚛️ Setting up frontend..."
cd frontend
npm install
npm run build
cd ..

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Clean up any existing migrations (for fresh start)
echo "🧹 Cleaning up migrations..."
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete 2>/dev/null || true
find . -path "*/migrations/*.pyc" -delete 2>/dev/null || true

# Recreate migration init files
echo "📝 Recreating migration packages..."
for app in apps/users apps/core apps/forms apps/affiliates apps/leads; do
    mkdir -p $app/migrations
    echo "# Migration package" > $app/migrations/__init__.py
done

# Wait for database to be ready with better error handling
echo "🔍 Checking database connection..."
python -c "
import os
import time
import sys
from decouple import config
import dj_database_url

max_tries = 30
for i in range(max_tries):
    try:
        import psycopg2
        db_config = dj_database_url.parse(config('DATABASE_URL'))
        conn = psycopg2.connect(
            host=db_config['HOST'],
            port=db_config['PORT'],
            user=db_config['USER'],
            password=db_config['PASSWORD'],
            database=db_config['NAME'],
            connect_timeout=10
        )
        conn.close()
        print('✅ Database connection successful!')
        break
    except Exception as e:
        print(f'⏳ Database not ready (attempt {i+1}/{max_tries}): {e}')
        if i < max_tries - 1:
            time.sleep(5)
        else:
            print('❌ Database connection failed after all attempts')
            print('🔄 Continuing with migration anyway...')
            break
"

# Create migrations in correct dependency order
echo "🗄️ Creating migrations in dependency order..."

# Step 1: Users first (no dependencies)
echo "📝 Creating users migrations..."
python manage.py makemigrations users --verbosity=1

# Step 2: Core (depends on users)
echo "📝 Creating core migrations..."
python manage.py makemigrations core --verbosity=1

# Step 3: Forms (depends on users)
echo "📝 Creating forms migrations..."
python manage.py makemigrations forms --verbosity=1

# Step 4: Affiliates (depends on users)
echo "📝 Creating affiliates migrations..."
python manage.py makemigrations affiliates --verbosity=1

# Step 5: Leads (depends on forms and affiliates)
echo "📝 Creating leads migrations..."
python manage.py makemigrations leads --verbosity=1

# Apply all migrations
echo "🚀 Applying migrations..."
python manage.py migrate --verbosity=1

# Create basic test data
echo "🌱 Creating basic data..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    # Create test users
    affiliate_user, created = User.objects.get_or_create(
        username='affiliate1',
        defaults={
            'email': 'affiliate1@example.com',
            'user_type': 'affiliate',
            'affiliate_id': 'AFF001'
        }
    )
    if created:
        affiliate_user.set_password('affiliate123')
        affiliate_user.save()
        print('✅ Created affiliate1 user')

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
        print('✅ Created operations user')

    # Create admin if none exists
    if not User.objects.filter(is_superuser=True).exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            user_type='admin'
        )
        print('✅ Created admin user')

    print('🎉 Basic users created successfully!')

except Exception as e:
    print(f'⚠️ User creation error (non-critical): {e}')
    print('Users can be created after deployment')
"

echo "✅ Build completed successfully!"

# Show deployment info
echo ""
echo "🔗 Deployment Information:"
echo "- Application will be available at your Render URL"
echo "- Test accounts: affiliate1/affiliate123, operations/ops123"
echo "- Admin panel: /admin (admin/admin123)"
echo "- API docs: /api/"
