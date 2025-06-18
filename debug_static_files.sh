#!/bin/bash
# debug_static_files.sh - Run this to see what's happening

echo "🔍 DEBUGGING STATIC FILES STRUCTURE"
echo "=" * 50

echo "1. Checking frontend build..."
if [ -d "frontend/dist" ]; then
    echo "✅ frontend/dist exists"
    ls -la frontend/dist/
    
    if [ -d "frontend/dist/assets" ]; then
        echo "✅ frontend/dist/assets exists"
        echo "Assets in frontend/dist/assets:"
        ls -la frontend/dist/assets/ | head -5
    else
        echo "❌ frontend/dist/assets MISSING"
    fi
else
    echo "❌ frontend/dist MISSING - React not built"
    echo "Run: cd frontend && npm run build"
fi

echo ""
echo "2. Checking staticfiles..."
if [ -d "staticfiles" ]; then
    echo "✅ staticfiles exists"
    ls -la staticfiles/
    
    if [ -d "staticfiles/assets" ]; then
        echo "✅ staticfiles/assets exists"
        echo "Assets in staticfiles/assets:"
        ls -la staticfiles/assets/ | head -5
    else
        echo "❌ staticfiles/assets MISSING"
        echo "Run: python manage.py collectstatic --noinput"
    fi
else
    echo "❌ staticfiles MISSING"
    echo "Run: python manage.py collectstatic --noinput"
fi

echo ""
echo "3. Checking for specific files causing 404..."
MISSING_CSS="index-08f8269d.css"
MISSING_JS="index-380328a1.js"

if [ -f "staticfiles/assets/$MISSING_CSS" ]; then
    echo "✅ Found $MISSING_CSS"
else
    echo "❌ Missing $MISSING_CSS"
    echo "Available CSS files:"
    find staticfiles -name "*.css" 2>/dev/null | head -3
fi

if [ -f "staticfiles/assets/$MISSING_JS" ]; then
    echo "✅ Found $MISSING_JS"
else
    echo "❌ Missing $MISSING_JS"
    echo "Available JS files:"
    find staticfiles -name "*.js" 2>/dev/null | head -3
fi

echo ""
echo "4. Testing MIME types..."
python3 -c "
import mimetypes
print('CSS MIME type:', mimetypes.guess_type('test.css')[0])
print('JS MIME type:', mimetypes.guess_type('test.js')[0])
print('HTML MIME type:', mimetypes.guess_type('test.html')[0])
"

echo ""
echo "🚀 NEXT STEPS:"
echo "1. If frontend/dist is missing: cd frontend && npm run build"
echo "2. If staticfiles is missing: python manage.py collectstatic --noinput"
echo "3. Replace backend/urls.py with the fixed version"
echo "4. Deploy changes"
