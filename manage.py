#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    # Use development settings for local, production for deployment
    if 'runserver' in sys.argv or 'shell' in sys.argv or len(sys.argv) == 1:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')
    else:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.production')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
