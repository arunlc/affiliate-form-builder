"""
WSGI config for affiliate form builder project - MINIMAL VERSION
"""

import os
from django.core.wsgi import get_wsgi_application

# Use minimal settings to avoid import issues
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.minimal')

application = get_wsgi_application()
