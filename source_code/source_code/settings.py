"""
Configurazione settings della root folder
"""
import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "django-insecure-t45p6x&xzpq(=rfguc51fi+nz+_c12vh73hn%%z&b7fuz4+ki("
DEBUG = True
ALLOWED_HOSTS = ["*"]

# ─────────────────────────────────────────────────────────────
#  INSTALLED_APPS
# ─────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework.authtoken",
    "djoser",                       
    "django_filters",             
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "rest_framework_simplejwt.token_blacklist",  
    "django_otp",
    "django_otp.plugins.otp_email",             

    "users",      
    "accounts",
    "transactions",
    "api",
    "dashboard"
]

# ────────────────────────────────────────────────────────────
#  MIDDLEWARE
# ─────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "source_code.urls"
WSGI_APPLICATION = "source_code.wsgi.application"

# ─────────────────────────────────────────────────────────────
#  DATABASE
# ─────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "biodb"),
        "USER": os.getenv("POSTGRES_USER", "bioadmin"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "supersecret"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─────────────────────────────────────────────────────────────
#  REST FRAMEWORK SETTINGS
# ─────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.CursorPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_ORDERING": "-created_at",
}

# ─────────────────────────────────────────────────────────────
#  DRF-SPECTACULAR SETTINGS
# ─────────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "Personal Finance Hub API",
    "DESCRIPTION": "Saldo conti, movimenti, bonifici e documenti",
    "VERSION": "1.0.0",
    "SCHEMA_PATH_PREFIX": "/api/v1",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ─────────────────────────────────────────────────────────────
#  TEMPLATES 
# ─────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],   
        "APP_DIRS": True,                   
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

AUTH_USER_MODEL = "users.User"

# ─────────────────────────────────────────────────────────────
#  JWT TOKEN SETTINGS
# ─────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ─────────────────────────────────────────────────────────────
#  DJSOR SETTINGS
# ─────────────────────────────────────────────────────────────
DJOSER = {
    "LOGIN_FIELD": "email",
    "USER_CREATE_PASSWORD_RETYPE": True,
    "SEND_ACTIVATION_EMAIL": True,

    "ACTIVATION_URL": "activate/{uid}/{token}/",

    "SEND_RESET_PASSWORD_EMAIL": True,
    "PASSWORD_RESET_CONFIRM_URL": "reset-password-confirm/{uid}/{token}/",

    "DOMAIN": "localhost:8000",
    "SITE_NAME": "FinHub Credit Bank",

    "EMAIL": {
        "password_reset": "users.email.ResetPasswordEmail",
    },
    
    "PERMISSIONS": {
        "activation": ["rest_framework.permissions.AllowAny"],
    },

    "SERIALIZERS": {
        "user_create": "users.serializers.CustomUserCreateSerializer",
        "token_create": "users.serializers.CustomTokenCreateSerializer",
    },
}

# ─────────────────────────────────────────────────────────────
#  EMAIL SMTP , MAILHOG SETTINGS
# ─────────────────────────────────────────────────────────────
OTP_EMAIL_SENDER = "noreply@pfh.local"
OTP_EMAIL_SUBJECT = "Il tuo codice OTP PFH"
OTP_EMAIL_BODY_TEMPLATE = "Il tuo codice è: {token}"

EMAIL_BACKEND        = "source_code.email_backends.DualBackend"

# SMTP MailHog
EMAIL_HOST           = "mailhog"
EMAIL_PORT           = 1025
EMAIL_USE_TLS        = False
EMAIL_HOST_USER      = "finhubemailservice@gmail.com"
EMAIL_HOST_PASSWORD  = "pyno ixxf anhq mglu"

# SMTP Gmail 
GMAIL_EMAIL_HOST        = "smtp.gmail.com"
GMAIL_EMAIL_PORT        = 587
GMAIL_EMAIL_USE_TLS     = True
GMAIL_EMAIL_HOST_USER   = "finhubemailservice@gmail.com"
GMAIL_EMAIL_HOST_PASSWORD = "pyno ixxf anhq mglu"

# Mittente di default
DEFAULT_FROM_EMAIL    = "noreply@finhub.local"
