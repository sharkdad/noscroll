from datetime import datetime, timezone
from django.conf import settings
from praw import Reddit

from .models import Feed, FeedType, Link

def get_reddit():
    return Reddit(
        user_agent=settings.REDDIT_USER_AGENT,
        client_id=settings.REDDIT_CLIENT_ID,
        client_secret=settings.REDDIT_CLIENT_SECRET,
        username=settings.REDDIT_USERNAME,
        password=settings.REDDIT_PASSWORD
    )

def sync_feeds():
    Feed.objects.get_or_create(feed_type=FeedType.REDDIT_FRONT_PAGE)
    for multi in get_reddit().user.me().multireddits():
        Feed.objects.get_or_create(feed_type=FeedType.REDDIT_MULTI, metadata={'owner': multi.owner, 'name': multi.name})

def sync_top_submissions():
    reddit = get_reddit()
    for feed in Feed.objects.all():
        if feed.feed_type == FeedType.REDDIT_FRONT_PAGE:
            source = reddit.front
        elif feed.feed_type == FeedType.REDDIT_MULTI:
            source = reddit.multireddit(feed.metadata['owner'], feed.metadata['name'])
        else:
            raise Exception("Unknown feed type %s" % feed.feed_type)
        for submission in source.hot(limit=settings.REDDIT_TOP_SUBMISSIONS):
            link, created = Link.objects.get_or_create(reddit_id=submission.id, defaults={
                'title': submission.title,
                'posted_at': datetime.fromtimestamp(submission.created_utc, timezone.utc),
                'score': submission.score,
                'metadata': {
                    'is_self': submission.is_self,
                    'num_comments': submission.num_comments,
                    'permalink': submission.permalink,
                    'spoiler': submission.spoiler,
                    'subreddit': submission.subreddit.display_name,
                    'url': submission.url,
                },
            })
            link.feeds.add(feed)
            if not created:
                update_fields = []
                if submission.score != link.score:
                    link.score = submission.score
                    update_fields.append('score')
                if submission.title != link.title:
                    link.title = submission.title
                    update_fields.append('title')
                if update_fields:
                    link.save(update_fields=update_fields)