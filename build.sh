#!/usr/bin/env bash
set -o errexit

echo "🔧 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
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

# FIXED: Reset migrations to avoid dependency issues
echo "🗄️ Resetting migrations..."
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Create migrations in proper dependency order
echo "🗄️ Creating migrations in proper order..."

# 1. Users first (base model)
echo "Creating users migrations..."
python manage.py makemigrations users --verbosity=2

# 2. Core app (no dependencies)
echo "Creating core migrations..."
python manage.py makemigrations core --verbosity=2

# 3. Forms app (depends on User)
echo "Creating forms migrations..."
python manage.py makemigrations forms --verbosity=2

# 4. Affiliates app (depends on User and Forms)
echo "Creating affiliates migrations..."
python manage.py makemigrations affiliates --verbosity=2

# 5. Leads app (depends on User, Forms, and Affiliates)
echo "Creating leads migrations..."
python manage.py makemigrations leads --verbosity=2

# Run all migrations
echo "🗄️ Running migrations..."
python manage.py migrate --verbosity=2

# Create superuser and sample data
echo "🌱 Setting up initial data..."
python seed_data_for_render.py

echo "✅ Build completed successfully!"
