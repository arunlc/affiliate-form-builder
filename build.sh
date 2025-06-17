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

# For FRESH database - create migrations and migrate
echo "🗄️ Creating and running migrations..."

# Remove any existing migration files to start fresh
find apps/*/migrations -name "*.py" -not -name "__init__.py" -delete

# Create migrations in dependency order
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations forms
python manage.py makemigrations affiliates
python manage.py makemigrations leads

# Run migrations
python manage.py migrate

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
