#!/usr/bin/env bash
# migration_fix.sh - Complete migration fix for Render deployment

echo "🔧 Starting migration fix process..."

# Step 1: Clean up any existing migration files
echo "🧹 Cleaning up existing migrations..."
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Step 2: Create clean migration directories
echo "📁 Creating clean migration directories..."
for app in apps/users apps/core apps/forms apps/affiliates apps/leads; do
    mkdir -p $app/migrations
    echo "# Migration package" > $app/migrations/__init__.py
done

# Step 3: Create migrations in correct order
echo "📝 Creating migrations in dependency order..."

# Users first (no dependencies)
python manage.py makemigrations users --name initial_users

# Core next (depends on users)
python manage.py makemigrations core --name initial_core

# Forms next (depends on users)
python manage.py makemigrations forms --name initial_forms

# Affiliates next (depends on users)
python manage.py makemigrations affiliates --name initial_affiliates

# Leads last (depends on forms and affiliates)
python manage.py makemigrations leads --name initial_leads

# Step 4: Apply migrations
echo "🗄️ Applying migrations..."
python manage.py migrate

echo "✅ Migration fix completed!"
