from datetime import datetime
from typing import Iterable

from django.db import connection

from .models import Profile, RelativeScoring, Token
from .utils import to_json


class ProfileDao:
    manager = Profile.objects

    @staticmethod
    def write_token(user_id: int, reddit_uid: str, token: Token):
        tokens = {reddit_uid: token}
        sql = """
            INSERT INTO app_profile (user_id, tokens) VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET tokens = app_profile.tokens || excluded.tokens
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, [user_id, to_json(tokens)])


class RelativeScoringDao:
    manager = RelativeScoring.objects

    @classmethod
    def get_next_to_refresh(cls, cutoff: datetime) -> Iterable[RelativeScoring]:
        return cls.manager.filter(last_updated__lte=cutoff).order_by("last_updated")[:1]