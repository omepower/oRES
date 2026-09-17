import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# .ENV FILE LOADER (Standard Library)
# ============================================================

env_file = BASE_DIR / ".env"
if env_file.is_file():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Ignore empty lines and comments
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                # setdefault prevents overwriting system environment variables
                os.environ.setdefault(key.strip(), value.strip().strip("'\""))


# ============================================================
# SECURITY
# ============================================================

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-rems-development-key")

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes", "t")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "*").split(",")
    if host.strip()
]

# Trust the X-Forwarded-Proto header sent by Nginx (prevents infinite redirect loops behind reverse proxies)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    # W008: Redirect all HTTP requests to HTTPS
    SECURE_SSL_REDIRECT = True

    # W012: Ensure session cookies are only sent over HTTPS
    SESSION_COOKIE_SECURE = True

    # W016: Ensure CSRF cookies are only sent over HTTPS
    CSRF_COOKIE_SECURE = True

    # W004: HTTP Strict Transport Security (HSTS)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "django_filters",
    "corsheaders",

    # REMS applications
    "accounts",
    "properties",
    "residents",
    "visitors",
    "vehicles",
    "security",
    "core",
    "notifications",
    "announcements",
    "facilities",
    "audit",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URL CONFIGURATION
# ============================================================

ROOT_URLCONF = "config.urls"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# WSGI
# ============================================================

WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# DATABASE
# ============================================================

if os.getenv("DB_ENGINE"):
    DATABASES = {
        "default": {
            "ENGINE": os.getenv("DB_ENGINE"),
            "NAME": os.getenv("DB_NAME"),
            "USER": os.getenv("DB_USER", ""),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", ""),
            "PORT": os.getenv("DB_PORT", ""),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Manila"

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = "accounts.User"


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication."
        "JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}


# ============================================================
# JWT
# ============================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_MINUTES", 30))
    ),

    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_DAYS", 1))
    ),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ============================================================
# CORS & CSRF
# ============================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://192.168.18.53:5173",
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS", "https://*.ngrok-free.app"
    ).split(",")
    if origin.strip()
]



# from pathlib import Path
# from datetime import timedelta


# BASE_DIR = Path(__file__).resolve().parent.parent


# # ============================================================
# # SECURITY
# # ============================================================

# SECRET_KEY = "django-insecure-rems-development-key"

# DEBUG = True

# ALLOWED_HOSTS = ['*']
# # ALLOWED_HOSTS = ['localhost','127.0.0.1','192.168.18.53']


# # ============================================================
# # APPLICATIONS
# # ============================================================

# INSTALLED_APPS = [
#     # Django
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",

#     # Third-party
#     "rest_framework",
#     "rest_framework_simplejwt",
#     'django_filters',
#     "corsheaders",

#     # REMS applications
#     "accounts",
#     "properties",
#     "residents",
#     "visitors",
#     "vehicles",
#     "security",
#     "core",
#     "notifications",
#     "announcements",
#     "facilities",
#     "audit",
# ]


# # ============================================================
# # MIDDLEWARE
# # ============================================================

# MIDDLEWARE = [
#     "corsheaders.middleware.CorsMiddleware",

#     "django.middleware.security.SecurityMiddleware",

#     "django.contrib.sessions.middleware.SessionMiddleware",

#     "django.middleware.common.CommonMiddleware",

#     "django.middleware.csrf.CsrfViewMiddleware",

#     "django.contrib.auth.middleware.AuthenticationMiddleware",

#     "django.contrib.messages.middleware.MessageMiddleware",

#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# ]


# # ============================================================
# # URL CONFIGURATION
# # ============================================================

# ROOT_URLCONF = "config.urls"


# # ============================================================
# # TEMPLATES
# # ============================================================

# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",

#         "DIRS": [],

#         "APP_DIRS": True,

#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.request",

#                 "django.contrib.auth.context_processors.auth",

#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]


# # ============================================================
# # WSGI
# # ============================================================

# WSGI_APPLICATION = "config.wsgi.application"


# # ============================================================
# # DATABASE
# # ============================================================

# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.sqlite3",
#         "NAME": BASE_DIR / "db.sqlite3",
#     }
# }


# # ============================================================
# # PASSWORD VALIDATION
# # ============================================================

# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": (
#             "django.contrib.auth.password_validation."
#             "UserAttributeSimilarityValidator"
#         ),
#     },
#     {
#         "NAME": (
#             "django.contrib.auth.password_validation."
#             "MinimumLengthValidator"
#         ),
#     },
#     {
#         "NAME": (
#             "django.contrib.auth.password_validation."
#             "CommonPasswordValidator"
#         ),
#     },
#     {
#         "NAME": (
#             "django.contrib.auth.password_validation."
#             "NumericPasswordValidator"
#         ),
#     },
# ]


# # ============================================================
# # INTERNATIONALIZATION
# # ============================================================

# LANGUAGE_CODE = "en-us"

# TIME_ZONE = "Asia/Manila"

# USE_I18N = True

# USE_TZ = True


# # ============================================================
# # STATIC FILES
# # ============================================================

# STATIC_URL = "static/"

# STATIC_ROOT = BASE_DIR / "staticfiles"


# # ============================================================
# # MEDIA FILES
# # ============================================================

# MEDIA_URL = "/media/"

# MEDIA_ROOT = BASE_DIR / "media"


# # ============================================================
# # DEFAULT PRIMARY KEY
# # ============================================================

# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# # ============================================================
# # CUSTOM USER MODEL
# # ============================================================

# AUTH_USER_MODEL = "accounts.User"


# # ============================================================
# # DJANGO REST FRAMEWORK
# # ============================================================

# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": (
#         "rest_framework_simplejwt.authentication."
#         "JWTAuthentication",
#     ),

#     "DEFAULT_PERMISSION_CLASSES": (
#         "rest_framework.permissions.IsAuthenticated",
#     ),

#     "DEFAULT_RENDERER_CLASSES": (
#         "rest_framework.renderers.JSONRenderer",
#     ),
# }


# # ============================================================
# # JWT
# # ============================================================

# SIMPLE_JWT = {
#     "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),

#     "REFRESH_TOKEN_LIFETIME": timedelta(days=1),

#     "ROTATE_REFRESH_TOKENS": True,

#     "BLACKLIST_AFTER_ROTATION": True,

#     "AUTH_HEADER_TYPES": ("Bearer",),
# }


# # ============================================================
# # CORS
# # ============================================================


# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
#     "http://192.168.18.53:5173",
# ]

# # Allow ngrok URLs for CSRF protection
# CSRF_TRUSTED_ORIGINS = ['https://*.ngrok-free.app']
