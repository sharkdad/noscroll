from django.http.request import HttpRequest
from django.dispatch import receiver

from allauth.account.signals import user_logged_in
from allauth.socialaccount.signals import pre_social_login
from allauth.socialaccount.models import SocialLogin

from .models import Profile


@receiver([pre_social_login, user_logged_in])
def populate_profile(sender, **kwargs):
    request: HttpRequest = kwargs["request"]
    login: SocialLogin = kwargs["sociallogin"]

    if request.user.is_anonymous:
        return

    Profile.objects.populate_profile(request.user, login)