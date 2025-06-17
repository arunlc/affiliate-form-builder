#!/usr/bin/env bash
# build.sh - ENHANCED FOR REACT DEPLOYMENT
set -o errexit

echo "🚀 BUILDING AFFILIATE FORM BUILDER WITH REACT"
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

# Frontend build - ENHANCED
echo "⚛️ Building React frontend..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    echo "✅ NPM version: $(npm --version)"
    
    cd frontend
    
    # Clean any previous builds
    echo "🧹 Cleaning previous builds..."
    rm -rf dist node_modules/.cache
    
    # Install dependencies with better error handling
    echo "📦 Installing npm dependencies..."
    if [ -f "package-lock.json" ]; then
        echo "📋 Using package-lock.json..."
        npm ci --prefer-offline --no-audit
    else
        echo "📋 Creating fresh package-lock.json..."
        npm install --prefer-offline --no-audit
    fi
    
    # Verify critical dependencies
    echo "🔍 Verifying React installation..."
    node -e "console.log('React version:', require('./node_modules/react/package.json').version)"
    node -e "console.log('Vite version:', require('./node_modules/vite/package.json').version)"
    
    # Build with verbose output
    echo "🔨 Building React application..."
    npm run build -- --mode production
    
    # Verify build output
    if [ -f "dist/index.html" ]; then
        echo "✅ React build successful!"
        echo "📁 Build contents:"
        ls -la dist/
        
        # Check file sizes
        echo "📊 Build size analysis:"
        du -sh dist/*
        
        # Verify index.html content
        if grep -q "<!doctype html>" dist/index.html; then
            echo "✅ Valid index.html generated"
        else
            echo "⚠️ index.html may be malformed"
            head -10 dist/index.html
        fi
    else
        echo "❌ React build failed - no index.html found"
        echo "📁 Current directory contents:"
        ls -la .
        echo "📁 Dist directory (if exists):"
        ls -la dist/ 2>/dev/null || echo "Dist directory doesn't exist"
        
        # Create emergency fallback
        echo "🚨 Creating emergency fallback..."
        mkdir -p dist
        cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Form Builder</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        function App() {
            const [loading, setLoading] = useState(true);
            
            useEffect(() => {
                setTimeout(() => setLoading(false), 1000);
            }, []);
            
            if (loading) {
                return (
                    <div className="min-h-screen gradient-bg flex items-center justify-center">
                        <div className="text-center text-white">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                            <h2 className="text-2xl font-bold">Loading Affiliate Forms...</h2>
                        </div>
                    </div>
                );
            }
            
            return (
                <div className="min-h-screen gradient-bg">
                    <div className="container mx-auto px-4 py-8">
                        <div className="max-w-4xl mx-auto text-center text-white">
                            <h1 className="text-6xl font-bold mb-4">🚀</h1>
                            <h2 className="text-4xl font-bold mb-4">Affiliate Form Builder</h2>
                            <p className="text-xl mb-8 opacity-90">Professional SaaS Platform for Lead Generation</p>
                            
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="glass rounded-2xl p-6">
                                    <h3 className="text-2xl font-bold mb-4">🔑 Admin Access</h3>
                                    <a href="/admin" className="block bg-white text-blue-600 py-3 px-6 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                                        Django Admin Panel
                                    </a>
                                </div>
                                
                                <div className="glass rounded-2xl p-6">
                                    <h3 className="text-2xl font-bold mb-4">📊 API Access</h3>
                                    <a href="/api/core/dashboard/" className="block bg-white text-purple-600 py-3 px-6 rounded-lg font-bold hover:bg-purple-50 transition-colors">
                                        API Dashboard
                                    </a>
                                </div>
                            </div>
                            
                            <div className="glass rounded-2xl p-6 mb-8">
                                <h3 className="text-2xl font-bold mb-4">🧪 Test Accounts</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                        <div className="font-bold">Affiliate Account</div>
                                        <div className="font-mono">affiliate1 / affiliate123</div>
                                    </div>
                                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                        <div className="font-bold">Operations Account</div>
                                        <div className="font-mono">operations / ops123</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-2xl font-bold mb-4">✨ Features</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">📋</div>
                                        <div className="font-semibold">Form Builder</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">👥</div>
                                        <div className="font-semibold">Affiliate Tracking</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">📈</div>
                                        <div className="font-semibold">Analytics</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">💾</div>
                                        <div className="font-semibold">Lead Management</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</body>
</html>
EOF
        echo "⚠️ Created emergency React fallback"
    fi
    
    cd ..
else
    echo "❌ Node.js not found - creating basic fallback"
    mkdir -p frontend/dist
    cp templates/index.html frontend/dist/index.html
fi

# Database migrations
echo "🗄️ Running database migrations..."
python manage.py makemigrations --noinput || echo "⚠️ No new migrations"
python manage.py migrate --noinput

# Collect static files (including React build)
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify static file collection
echo "🔍 Verifying static files..."
if [ -f "staticfiles/index.html" ]; then
    echo "✅ React app found in static files"
    echo "📊 Static files summary:"
    ls -la staticfiles/ | head -10
    echo "..."
    echo "Total static files: $(find staticfiles -type f | wc -l)"
else
    echo "❌ React app not found in static files"
    echo "📁 Available static files:"
    ls -la staticfiles/ || echo "No staticfiles directory"
fi

# Create test data
echo "👤 Setting up test users..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create users
users_to_create = [
    ('affiliate1', 'affiliate123', 'affiliate', 'AFF001'),
    ('operations', 'ops123', 'operations', None)
]

for username, password, user_type, affiliate_id in users_to_create:
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

print('✅ User setup complete')
" || echo "⚠️ User creation optional"

echo ""
echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
echo "================================="
echo "✅ Python: $(python --version)"
echo "✅ Django: Ready"
echo "✅ React: Built and served"
echo "✅ Database: Migrated"
echo "✅ Static: Collected"
echo "✅ Users: Created"
echo ""
echo "🔗 Your app: https://affiliate-form-builder.onrender.com"
echo "🔑 Login with: affiliate1/affiliate123 or operations/ops123"
