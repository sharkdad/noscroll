from datetime import datetime
from typing import Iterable
import json

from django.db import transaction

from .data import Token
from .models import Profile, RelativeScoring, SeenSubmission
from .utils import to_json


class ProfileDao:
    manager = Profile.objects

    @classmethod
    @transaction.atomic
    def write_token(cls, user_id: int, reddit_uid: str, token: Token) -> None:
        tokens = json.loads(to_json({reddit_uid: token}))
        obj, created = cls.manager.select_for_update().get_or_create(
            user_id=user_id, defaults={"enc_tokens": tokens}
        )
        if not created:
            obj.enc_tokens = json.loads(obj.enc_tokens) | tokens
            obj.save()


class RelativeScoringDao:
    manager = RelativeScoring.objects

    @classmethod
    def get_next_to_refresh(cls, cutoff: datetime) -> Iterable[RelativeScoring]:
        return cls.manager.filter(last_updated__lte=cutoff).order_by("last_updated")[:1]


class SeenSubmissionDao:
    manager = SeenSubmission.objects

    @classmethod
    def get_seen_ids(cls, user_id: str, ids: Iterable[str]) -> Iterable[str]:
        query = cls.manager.filter(user_id=user_id, submission_id__in=ids)
        return query.values_list("submission_id", flat=True)

    @classmethod
    def mark_seen(cls, user_id: str, ids: Iterable[str]) -> None:
        seen = (SeenSubmission(user_id=user_id, submission_id=s) for s in ids)
        cls.manager.bulk_create(seen, ignore_conflicts=True)