wsgi_app = "project.wsgi"
bind = ["127.0.0.1:8001"]
threads = 10

logconfig_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "app.log.JSONFormatter",
            "format": "%(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "loggers": {
        "gunicorn.error": {
            "handlers": [],
            "propagate": True,
        },
        "gunicorn.access": {
            "handlers": [],
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
