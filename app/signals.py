from typing import Optional

from allauth.account.signals import user_logged_in
from allauth.socialaccount.signals import pre_social_login
from allauth.socialaccount.models import SocialLogin
from django.http.request import HttpRequest

from .dao import ProfileDao
from .data import Token


def register_signals() -> None:
    pre_social_login.connect(populate_profile)
    user_logged_in.connect(populate_profile)


def populate_profile(*_, **kwargs):
    request: Optional[HttpRequest] = kwargs.get("request")
    login: Optional[SocialLogin] = kwargs.get("sociallogin")

    if request is None or login is None:
        return

    if request.user.is_anonymous:
        return

    t = login.token
    token = Token(t.token, t.token_secret, t.expires_at)
    ProfileDao.write_token(request.user.id, request.raw_username, token)