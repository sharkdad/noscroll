from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns

from .provider import RedditEncProvider


urlpatterns = default_urlpatterns(RedditEncProvider)
