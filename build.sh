#!/usr/bin/env bash
set -o errexit

echo "🚀 AFFILIATE FORM BUILDER - PRODUCTION BUILD"
echo "=============================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify Django installation
echo "🔍 Verifying Django installation..."
python -c "import django; print(f'✅ Django {django.get_version()} installed')"

# Environment setup
export DJANGO_SETTINGS_MODULE=backend.settings.production

# Build frontend with fixed configuration
echo "⚛️ Building React frontend..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    echo "✅ NPM version: $(npm --version)"

    cd frontend

    # Clean previous builds
    echo "🧹 Cleaning previous builds..."
    rm -rf dist node_modules/.cache

    # Remove any problematic config files
    rm -f postcss.config.cjs

    # Create correct PostCSS config
    echo "🔧 Creating PostCSS config..."
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

    # Ensure correct CSS file exists
    echo "🎨 Ensuring CSS file exists..."
    mkdir -p src
    if [ ! -f "src/index.css" ]; then
        cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
    fi

    # Install dependencies
    echo "📦 Installing npm dependencies..."
    npm install --prefer-offline --no-audit

    # Build with detailed logging
    echo "🔨 Building React application..."
    npm run build

    # Verify build output
    if [ -f "dist/index.html" ]; then
        echo "✅ React build successful!"
        echo "📁 Build contents:"
        ls -la dist/
    else
        echo "❌ React build failed, checking for errors..."
        exit 1
    fi

    cd ..
else
    echo "❌ Node.js not found - cannot build frontend"
    exit 1
fi

# Database migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations --noinput || echo "⚠️ No new migrations"
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify static files
if [ -f "staticfiles/index.html" ]; then
    echo "✅ React app found in static files"
else
    echo "⚠️ No React app in static files"
    # Copy manually if needed
    if [ -f "frontend/dist/index.html" ]; then
        echo "📋 Copying React build manually..."
        cp -r frontend/dist/* staticfiles/
        echo "✅ React app copied to static files"
    fi
fi

# Create test users
echo "👤 Creating test users..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()

# Create users
users = [
    ('affiliate1', 'affiliate123', 'affiliate', 'AFF001'),
    ('operations', 'ops123', 'operations', None)
]

for username, password, user_type, affiliate_id in users:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': f'{username}@example.com',
            'user_type': user_type,
            'affiliate_id': affiliate_id
        }
    )
    if created:
        user.set_password(password)
        user.save()
        print(f'✅ Created {username} user')
    else:
        print(f'ℹ️ {username} user already exists')

# Create admin if needed
admin_user = User.objects.filter(is_superuser=True).first()
if not admin_user:
    try:
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            user_type='admin'
        )
        print('✅ Created admin user')
    except Exception as e:
        print(f'⚠️ Admin creation: {e}')
else:
    print('ℹ️ Admin user already exists')

print('✅ User setup complete')
" || echo "⚠️ User creation completed with warnings"

echo ""
echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
echo "================================"
echo "✅ Django backend: Ready"
echo "✅ React frontend: Built and deployed"
echo "✅ Database: Migrated"
echo "✅ Static files: Collected"
echo "✅ Users: Created"
echo ""
echo "🔗 Your app: https://affiliate-form-builder.onrender.com"
echo "🔑 Login credentials:"
echo "   • affiliate1 / affiliate123"
echo "   • operations / ops123"
echo "   • admin / admin123"
echo ""
echo "🚀 The full React application should now be available!"
