import dj_database_url
from .base import *

DEBUG = True
SECRET_KEY = config('SECRET_KEY', default='dev-secret-key-change-in-production-at-least-50-chars-long')

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database - PostgreSQL for development
DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL', default='postgresql://postgres:password@localhost:5432/affiliate_forms')
    )
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Email (Development - Console backend)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
