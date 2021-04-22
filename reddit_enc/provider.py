from app.allauth import hash_username
from allauth.socialaccount.providers.reddit.provider import RedditProvider


class RedditEncProvider(RedditProvider):
    id = "reddit"

    def extract_uid(self, data):
        return hash_username(data["name"])

    def extract_extra_data(self, _):
        return {}

    def extract_common_fields(self, data):
        return dict(username=self.extract_uid(data), raw_username=data["name"])


provider_classes = [RedditEncProvider]
