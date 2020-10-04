from datetime import timedelta

TASK_DELAY = timedelta(minutes=10)
HN_TOP_STORIES = 30
REDDIT_USER_AGENT = "script:slothclient:1.0 (by /u/slothtron)"
REDDIT_OAUTH_USER_AGENT = "django:slothweb:1.0 (by /u/slothtron)"
REDDIT_TOP_SUBMISSIONS = 100
REDDIT_SCORING_TOP_TIME = "month"
REDDIT_SCORING_TOP_LIMIT = 10
REDDIT_SCORING_REFRESH_DELAY = timedelta(days=1)
REDDIT_SCOPES = ["identity", "mysubreddits", "read", "subscribe", "vote"]

WSGI_APPLICATION = "project.wsgi.application"
ROOT_URLCONF = "project.urls"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True
SITE_ID = 1
STATIC_URL = "/static/"
STATIC_ROOT = "dist/static"

ACCOUNT_SESSION_REMEMBER = True
LOGIN_REDIRECT_URL = LOGOUT_REDIRECT_URL = "/"
SOCIALACCOUNT_STORE_TOKENS = True

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "app.auth.ProfileAuthenticationBackend",
]

SOCIALACCOUNT_PROVIDERS = {
    "reddit": {
        "AUTH_PARAMS": {"duration": "permanent"},
        "SCOPE": REDDIT_SCOPES,
        "USER_AGENT": REDDIT_OAUTH_USER_AGENT,
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

INSTALLED_APPS = [
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.reddit",
    "app.apps.AppConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.sites",
    "django.contrib.staticfiles",
    "django_filters",
    "rest_framework",
]

MIDDLEWARE = [
    "app.tasks.init_task_thread_middleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] [{levelname}] [{module}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "noscroll",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
}