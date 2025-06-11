#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
cd frontend
npm ci
npm run build
cd ..

# Collect static files
python manage.py collectstatic --no-input

# Create migrations in the correct order (users first, then others)
echo "Creating migrations..."
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations forms
python manage.py makemigrations affiliates
python manage.py makemigrations leads

# Run database migrations
echo "Running migrations..."
python manage.py migrate
