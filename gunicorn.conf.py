wsgi_app = "project.wsgi"
bind = ["127.0.0.1:8001"]
threads = 10

access_log_format = "%(m)s %(U)s %(s)s"

logconfig_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "app.log.JSONFormatter",
            "format": "%(message)s",
        },
        "json_access": {
            "()": "app.log.GunicornAccessLogJSONFormatter",
            "format": "%(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        "console_access": {
            "class": "logging.StreamHandler",
            "formatter": "json_access",
        },
    },
    "loggers": {
        "gunicorn.error": {
            "handlers": [],
            "propagate": True,
        },
        "gunicorn.access": {
            "handlers": ["console_access"],
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
