from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.contrib.auth.hashers import make_password

from .utils import b64_to_hex


def hash_username(username: str) -> str:
    full_hash = make_password(username, salt=settings.USERNAME_SALT)
    hash_parts = full_hash.split("$", maxsplit=3)
    return b64_to_hex(hash_parts[3])


class NoscrollSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        request.raw_username = data.get("raw_username")
        return user