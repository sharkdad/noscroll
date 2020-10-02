from allauth.account.auth_backends import AuthenticationBackend
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class ProfileAuthenticationBackend(AuthenticationBackend):
    def get_user(self, user_id):
        try:
            user = UserModel.objects.select_related("profile").get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
        return user if self.user_can_authenticate(user) else None