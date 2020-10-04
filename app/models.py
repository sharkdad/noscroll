from datetime import datetime
from typing import Optional
import uuid

from django.conf import settings
from django.db.models import (
    BigIntegerField,
    BooleanField,
    CASCADE,
    CharField,
    DateTimeField,
    IntegerField,
    IntegerChoices,
    JSONField,
    Manager,
    ManyToManyField,
    Model,
    OneToOneField,
    TextField,
    UUIDField,
)
from pydantic.dataclasses import dataclass

from .embed import get_embed

@dataclass
class Submission:
    id: str
    title: str
    posted_at: datetime
    subreddit: str
    score: int
    url: str
    permalink: str
    num_comments: int
    embed: Optional[str]

@dataclass
class Token:
    token: str
    token_secret: str
    expires_at: datetime


class Profile(Model):
    user = OneToOneField(settings.AUTH_USER_MODEL, primary_key=True, on_delete=CASCADE)
    tokens = JSONField(default=dict)


class FeedType(IntegerChoices):
    REDDIT_FRONT_PAGE = 1
    REDDIT_MULTI = 2


class Feed(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    feed_type = IntegerField(choices=FeedType.choices)
    metadata = JSONField(default=dict)

    @property
    def name(self) -> str:
        if self.feed_type == FeedType.REDDIT_FRONT_PAGE:
            return "Reddit front page"
        if self.feed_type == FeedType.REDDIT_MULTI:
            return "Multireddit %s" % self.metadata["name"]
        raise Exception("Unknown feed type %s" % self.feed_type)

    def __str__(self):
        return self.name


class Link(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    hn_id = BigIntegerField(unique=True, null=True, blank=True)
    reddit_id = CharField(max_length=6, null=True, blank=True)
    feeds = ManyToManyField(Feed)
    title = TextField()
    posted_at = DateTimeField()
    score = BigIntegerField(default=0)
    relative_score = BigIntegerField(default=0)
    is_read = BooleanField(default=False)
    is_saved = BooleanField(default=False)
    metadata = JSONField(default=dict, blank=True)

    @property
    def permalink(self) -> str:
        return self.metadata.get("permalink")

    @property
    def url(self) -> str:
        return self.metadata.get("url")

    @property
    def num_comments(self) -> str:
        return self.metadata.get("num_comments")

    @property
    def subreddit(self) -> str:
        return self.metadata.get("subreddit")

    @property
    def embed(self) -> Optional[str]:
        return get_embed(self.metadata)

    def get_absolute_url(self):
        if self.hn_id:
            return "https://news.ycombinator.com/item?id=%d" % self.hn_id
        if self.reddit_id:
            return "https://old.reddit.com%s" % self.metadata["permalink"]
        raise Exception("Unknown link type for get_absolute_url")


class RelativeScoring(Model):
    id = CharField(primary_key=True, max_length=100)
    score = BigIntegerField()
    last_updated = DateTimeField()