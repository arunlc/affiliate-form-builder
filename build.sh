#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔧 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
echo "⚛️ Setting up frontend..."
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if all required config files exist
echo "🔍 Checking frontend configuration..."
if [ ! -f "vite.config.js" ]; then
    echo "❌ Warning: vite.config.js not found"
fi

if [ ! -f "tailwind.config.js" ]; then
    echo "❌ Warning: tailwind.config.js not found"
fi

if [ ! -f "postcss.config.js" ]; then
    echo "❌ Warning: postcss.config.js not found"
fi

# Build frontend with verbose output
echo "🏗️ Building frontend..."
npm run build

# Check if build succeeded
if [ -d "dist" ]; then
    echo "✅ Frontend build successful! Files in dist:"
    ls -la dist/
    if [ -d "dist/assets" ]; then
        echo "📁 Assets directory contents:"
        ls -la dist/assets/
    else
        echo "⚠️ No assets directory found in dist"
    fi
else
    echo "❌ Error: Frontend build failed - no dist directory created"
    exit 1
fi

cd ..

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --verbosity=2

# Check if static files were collected
if [ -d "staticfiles" ]; then
    echo "✅ Static files collected! Contents:"
    ls -la staticfiles/
    if [ -d "staticfiles/assets" ]; then
        echo "📁 Static assets directory contents:"
        ls -la staticfiles/assets/
    else
        echo "⚠️ No assets directory in staticfiles"
        echo "📁 All staticfiles contents:"
        find staticfiles -type f -name "*.css" -o -name "*.js" | head -10
    fi
else
    echo "❌ Error: Static files collection failed"
    exit 1
fi

# Create migrations in the correct order (users first, then others)
echo "🗄️ Creating migrations..."
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations forms
python manage.py makemigrations affiliates
python manage.py makemigrations leads

# Run database migrations (INCLUDING TOKEN AUTH)
echo "🗄️ Running migrations..."
python manage.py migrate

# Create tokens for existing users (if any)
echo "🔑 Setting up authentication tokens..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
User = get_user_model()
for user in User.objects.all():
    Token.objects.get_or_create(user=user)
    print(f'Token created for user: {user.username}')
"

echo "✅ Build process completed successfully!"
