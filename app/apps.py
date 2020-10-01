from django.apps import AppConfig as BaseAppConfig


class AppConfig(BaseAppConfig):
    name = "app"

    def ready(self):
        from . import signals