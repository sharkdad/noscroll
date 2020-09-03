from datetime import timedelta

TASK_DELAY = timedelta(minutes=10)
HN_TOP_STORIES = 30
REDDIT_USER_AGENT = "script:slothclient:1.0 (by /u/slothtron)"
REDDIT_TOP_SUBMISSIONS = 100
REDDIT_SCORING_TOP_TIME = "month"
REDDIT_SCORING_TOP_LIMIT = 10
REDDIT_SCORING_REFRESH_DELAY = timedelta(days=1)

WSGI_APPLICATION = "project.wsgi.application"
ROOT_URLCONF = "project.urls"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = "dist/static"

INSTALLED_APPS = [
    "app.apps.AppConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
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
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

SHELL_PLUS = "notebook"

# DEV ONLY - MUST OVERRIDE IN PROD

SECRET_KEY = "!7cg)5gwytb1v64si_kjo!-z884@wu@(=el$el@%-=nht0)oee"
DEBUG = True
ALLOWED_HOSTS = []
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

try:
    from .settings_override import *
except ImportError:
    pass

if DEBUG:
    INSTALLED_APPS.append("django_extensions")
