from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

from app.api import router

svc_urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
]

urlpatterns = [
    path("", lambda _: redirect("admin:index")),
    path("svc/", include(svc_urlpatterns)),
]