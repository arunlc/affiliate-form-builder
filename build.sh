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

# Create migrations in proper dependency order
echo "🗄️ Creating migrations..."

# Users first (other apps depend on it)
python manage.py makemigrations users

# Core app
python manage.py makemigrations core

# Forms app
python manage.py makemigrations forms

# Affiliates app (depends on forms)
python manage.py makemigrations affiliates

# Leads app (depends on forms and affiliates)
python manage.py makemigrations leads

# Run all migrations
echo "🗄️ Running migrations..."
python manage.py migrate

# Create superuser and sample data
echo "🌱 Setting up initial data..."
python seed_data_for_render.py

echo "✅ Build completed successfully!"
