import uuid

from django.contrib.postgres.fields import JSONField
from django.db.models import BigIntegerField, BooleanField, DateTimeField, Model, TextField, UUIDField

class Link(Model):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    hn_id = BigIntegerField(unique=True, null=True, blank=True)
    title = TextField()
    posted_at = DateTimeField()
    score = BigIntegerField(default=0)
    is_read = BooleanField(default=False)
    is_saved = BooleanField(default=False)
    metadata = JSONField(default=dict)

    def get_absolute_url(self):
        return 'https://news.ycombinator.com/item?id=%d' % self.hn_id