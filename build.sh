#!/usr/bin/env bash
set -o errexit

echo "🚀 AFFILIATE FORM BUILDER - EMERGENCY DEPLOYMENT FIX"
echo "====================================================="

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify Django installation
echo "🔍 Verifying Django installation..."
python -c "import django; print(f'✅ Django {django.get_version()} installed')"

# Environment setup
export DJANGO_SETTINGS_MODULE=backend.settings.production

# CRITICAL: Clean up any problematic migration files first
echo "🧹 Cleaning up migration files..."
find apps/*/migrations -name "0*.py" -delete 2>/dev/null || true
find apps/*/migrations -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Ensure migration directories exist
echo "📁 Ensuring migration directories exist..."
for app in users core forms affiliates leads; do
    mkdir -p apps/$app/migrations
    echo "# Migration package" > apps/$app/migrations/__init__.py
done

# Build frontend with fixed configuration
echo "⚛️ Building React frontend..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
    echo "✅ NPM version: $(npm --version)"

    cd frontend

    # Clean previous builds
    echo "🧹 Cleaning previous builds..."
    rm -rf dist node_modules/.cache

    # Create correct PostCSS config (CJS format)
    echo "🔧 Creating PostCSS config..."
    cat > postcss.config.cjs << 'EOF'
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

/* Custom styles for the affiliate form builder */
@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  body {
    @apply antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg;
  }
  
  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
  }
  
  .bg-gradient-primary {
    @apply bg-gradient-to-br from-blue-50 via-white to-purple-50;
  }
}
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
        
        # Check for assets
        if [ -d "dist/assets" ]; then
            echo "📁 Assets directory:"
            ls -la dist/assets/ | head -10
        fi
    else
        echo "❌ React build failed, checking for errors..."
        exit 1
    fi

    cd ..
else
    echo "❌ Node.js not found - cannot build frontend"
    exit 1
fi

# Database migrations - FIXED ORDER
echo "🗄️ Running database migrations..."

# Create migrations in correct dependency order
echo "📝 Creating migrations in dependency order..."
python manage.py makemigrations users --name initial_user_model || echo "⚠️ Users migration exists"
python manage.py makemigrations core --name initial_core_models || echo "⚠️ Core migration exists"  
python manage.py makemigrations forms --name initial_form_models || echo "⚠️ Forms migration exists"
python manage.py makemigrations affiliates --name initial_affiliate_models || echo "⚠️ Affiliates migration exists"
python manage.py makemigrations leads --name initial_lead_models || echo "⚠️ Leads migration exists"

# Apply migrations in order
echo "🗄️ Applying migrations..."
python manage.py migrate auth --run-syncdb || echo "⚠️ Auth already migrated"
python manage.py migrate contenttypes --run-syncdb || echo "⚠️ Contenttypes already migrated"
python manage.py migrate users || echo "⚠️ Users migration issue"
python manage.py migrate core || echo "⚠️ Core migration issue"
python manage.py migrate forms || echo "⚠️ Forms migration issue" 
python manage.py migrate affiliates || echo "⚠️ Affiliates migration issue"
python manage.py migrate leads || echo "⚠️ Leads migration issue"
python manage.py migrate --run-syncdb || echo "⚠️ Final migration issue"

# Collect static files - CRITICAL STEP
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify static files and MIME types
echo "🔍 Verifying static files..."
if [ -f "staticfiles/index.html" ]; then
    echo "✅ React app found in static files"
    
    # Check for assets
    if [ -d "staticfiles/assets" ]; then
        echo "✅ Assets directory found"
        echo "📄 Sample assets:"
        ls -la staticfiles/assets/ | head -5
        
        # Check for CSS and JS files
        css_files=$(find staticfiles/assets -name "*.css" | wc -l)
        js_files=$(find staticfiles/assets -name "*.js" | wc -l)
