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
python manage.py collectstatic --no-input

# CREATE migrations first, THEN run them
echo "🗄️ Creating migrations in correct order..."
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations forms
python manage.py makemigrations affiliates
python manage.py makemigrations leads

echo "🗄️ Running migrations in correct order..."
# Migrate core Django apps first
python manage.py migrate auth
python manage.py migrate contenttypes

# Migrate our apps in dependency order
python manage.py migrate users
python manage.py migrate core
python manage.py migrate forms
python manage.py migrate affiliates
python manage.py migrate leads

# Create tokens for auth
echo "🔑 Setting up authentication..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
User = get_user_model()
for user in User.objects.all():
    Token.objects.get_or_create(user=user)
    print(f'Token created for user: {user.username}')
"

# Create sample data
echo "🌱 Creating sample data..."
python seed_data_for_render.py

echo "✅ Build completed successfully!"
