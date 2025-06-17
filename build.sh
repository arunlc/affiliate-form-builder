#!/usr/bin/env bash
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

# Try database connection with timeout
echo "🔍 Checking database connection..."
python -c "
import os
import time
import psycopg2
import dj_database_url
from decouple import config

# Wait for database to be ready
max_tries = 30
for i in range(max_tries):
    try:
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
            raise
"

# Simple migration approach - let Django handle dependencies
echo "🗄️ Running migrations..."
python manage.py makemigrations --verbosity=1
python manage.py migrate --verbosity=1

# Create superuser if needed
echo "🌱 Setting up initial data..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create basic users
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

# Try to create admin
try:
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            user_type='admin'
        )
        print('✅ Created admin user')
except Exception as e:
    print(f'⚠️ Admin creation: {e}')

print('🎉 Basic setup completed!')
"

echo "✅ Build completed successfully!"
