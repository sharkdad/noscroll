import uuid

from django.db.models import (
    BigIntegerField,
    BooleanField,
    CharField,
    DateTimeField,
    IntegerField,
    IntegerChoices,
    JSONField,
    ManyToManyField,
    Model,
    TextField,
    UUIDField,
)


class FeedType(IntegerChoices):
    REDDIT_FRONT_PAGE = 1
    REDDIT_MULTI = 2


class Feed(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    feed_type = IntegerField(choices=FeedType.choices)
    metadata = JSONField(default=dict)

    def __str__(self):
        if self.feed_type == FeedType.REDDIT_FRONT_PAGE:
            return "Reddit front page"
        if self.feed_type == FeedType.REDDIT_MULTI:
            return "Multireddit %s" % self.metadata["name"]
        raise Exception("Unknown feed type %s" % self.feed_type)


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
