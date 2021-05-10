from datetime import timedelta
from os import environ
from time import gmtime

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

STAGE = environ["NS_STAGE"]
REDDIT_USER_AGENT = environ["NS_USER_AGENT"]
REDDIT_CLIENT_ID = environ["NS_CLIENT_ID"]
REDDIT_CLIENT_SECRET = environ["NS_CLIENT_SECRET"]
REDDIT_OAUTH_USER_AGENT = environ["NS_OAUTH_USER_AGENT"]
REDDIT_OAUTH_CLIENT_ID = environ["NS_OAUTH_CLIENT_ID"]
REDDIT_OAUTH_CLIENT_SECRET = environ["NS_OAUTH_CLIENT_SECRET"]
REDDIT_USERNAME = environ["NS_REDDIT_USERNAME"]
REDDIT_PASSWORD = environ["NS_REDDIT_PASSWORD"]

TASK_DELAY = timedelta(minutes=10)
HN_TOP_STORIES = 30
REDDIT_TOP_SUBMISSIONS = 100
REDDIT_SCORING_TOP_TIME = "month"
REDDIT_SCORING_TOP_LIMIT = 10
REDDIT_SCORING_REFRESH_DELAY = timedelta(days=1)
REDDIT_SCOPES = ["identity", "mysubreddits", "read"]

DEBUG = False
ALLOWED_HOSTS = ["squidscroll.com"]
SECRET_KEY = environ["NS_SECRET_KEY"]
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
LOGGING_CONFIG = None

CRYPTOGRAPHY_SALT = "noscroll"
USERNAME_SALT = "noscroll"

ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"
ACCOUNT_LOGOUT_ON_GET = True
ACCOUNT_SESSION_REMEMBER = True
LOGIN_REDIRECT_URL = LOGOUT_REDIRECT_URL = "/"
SOCIALACCOUNT_STORE_TOKENS = True
SOCIALACCOUNT_ADAPTER = "app.allauth.NoscrollSocialAccountAdapter"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "app.auth.ProfileAuthenticationBackend",
]

SOCIALACCOUNT_PROVIDERS = {
    "reddit": {
        "APP": {
            "client_id": REDDIT_OAUTH_CLIENT_ID,
            "secret": REDDIT_OAUTH_CLIENT_SECRET,
        },
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
    "DEFAULT_RENDERER_CLASSES": [
        "app.utils.PydanticJSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

INSTALLED_APPS = [
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "reddit_enc",
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

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "noscroll",
        "USER": environ["NS_DB_USER"],
        "PASSWORD": environ["NS_DB_PASS"],
        "HOST": environ["NS_DB_HOST"],
        "PORT": "5432",
    }
}

if STAGE == "dev":
    ALLOWED_HOSTS = []
    DEBUG = True
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    INTERNAL_IPS = ["127.0.0.1"]
    INSTALLED_APPS.append("debug_toolbar")
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")

    ACCOUNT_DEFAULT_HTTP_PROTOCOL = "http"
    LOGIN_REDIRECT_URL = LOGOUT_REDIRECT_URL = "http://localhost:3000/"

    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
        "app.utils.PydanticJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ]

    import logging

    if not logging.getLogger().hasHandlers():
        import coloredlogs

        coloredlogs.install(
            level=logging.DEBUG,
            datefmt="%H:%M:%S",
            fmt="%(asctime)s.%(msecs)03d %(name)s %(levelname)s %(message)s",
        )
        logging.getLogger("django").setLevel(logging.INFO)
