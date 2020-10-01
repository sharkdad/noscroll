from django.conf import settings
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

from app.api import router

svc_urlpatterns = [
    path("accounts/", include("allauth.urls")),
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]

if settings.DEBUG:
    import debug_toolbar

    svc_urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + svc_urlpatterns

urlpatterns = [
    path("", lambda _: redirect("admin:index")),
    path("svc/", include(svc_urlpatterns)),
]