import logging
import random

from datetime import datetime, timezone
from deepdiff import DeepDiff
from django.conf import settings
from praw import Reddit
from statistics import mean
from typing import Mapping, MutableMapping

from .models import Feed, FeedType, Link, RelativeScoring

def get_reddit() -> Reddit:
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
    logging.info("Syncing top reddit submissions")
    reddit = get_reddit()
    all_scoring = {s.id: s for s in RelativeScoring.objects.all()}
    for feed in Feed.objects.all():
        logging.info("Syncing feed %s", feed.id)
        if feed.feed_type == FeedType.REDDIT_FRONT_PAGE:
            source = reddit.front
        elif feed.feed_type == FeedType.REDDIT_MULTI:
            source = reddit.multireddit(feed.metadata['owner'], feed.metadata['name'])
        else:
            raise Exception("Unknown feed type %s" % feed.feed_type)
        for submission in source.hot(limit=settings.REDDIT_TOP_SUBMISSIONS):
            link = write_submission(reddit, all_scoring, submission)
            link.feeds.add(feed)
    logging.info("Finshed syncing top reddit submissions")

def write_submission(reddit, all_scoring, submission) -> Link:
    scoring = get_or_create_relative_scoring(all_scoring, reddit, submission.subreddit.display_name)
    relative_score = (submission.score / scoring.score) * 1000
    metadata = get_submission_metadata(submission.__dict__)
    link, created = Link.objects.get_or_create(reddit_id=submission.id, defaults={
        'title': submission.title,
        'posted_at': datetime.fromtimestamp(submission.created_utc, timezone.utc),
        'score': relative_score,
        'metadata': metadata,
    })
    if not created:
        update_fields = []
        if relative_score != link.score:
            link.score = relative_score
            update_fields.append('score')
        if submission.title != link.title:
            link.title = submission.title
            update_fields.append('title')
        if DeepDiff(metadata, link.metadata):
            link.metadata = metadata
            update_fields.append('metadata')
        if update_fields:
            link.save(update_fields=update_fields)
    return link

def get_submission_metadata(data: Mapping) -> Mapping:
    metadata = {k: data.get(k) for k in ('id', 'is_self', 'is_video', 'is_reddit_media_domain', 'spoiler', 'over_18',
        'num_comments', 'preview', 'thumbnail', 'thumbnail_height', 'thumbnail_width', 'media', 'media_embed',
        'secure_media', 'secure_media_embed', 'url', 'permalink', 'gallery_data', 'media_metadata')}
    subreddit = data['subreddit']
    metadata['subreddit'] = subreddit if isinstance(subreddit, str) else subreddit.display_name
    metadata['crosspost_parent_list'] = [get_submission_metadata(p) for p in data.get('crosspost_parent_list', [])]
    return metadata

def refresh_relative_scoring():
    logging.info("Refreshing reddit relative scoring")
    reddit = get_reddit()
    cutoff = datetime.now(timezone.utc) - settings.REDDIT_SCORING_REFRESH_DELAY
    for scoring in RelativeScoring.objects.filter(last_updated__lte=cutoff):
        build_relative_scoring(reddit, scoring.id).save()
    logging.info("Finished refreshing reddit relative scoring")

def get_or_create_relative_scoring(all_existing: MutableMapping[str, RelativeScoring], reddit: Reddit, subreddit: str) -> RelativeScoring:
    existing = all_existing.get(subreddit)
    if existing is not None:
        return existing
    scoring = build_relative_scoring(reddit, subreddit)
    scoring.last_updated = datetime.now(timezone.utc) - settings.REDDIT_SCORING_REFRESH_DELAY * random.random()
    all_existing[subreddit] = scoring
    scoring.save()
    return scoring

def build_relative_scoring(reddit: Reddit, subreddit: str) -> RelativeScoring:
    logging.info("Building relative scoring for %s" % subreddit)
    top = reddit.subreddit(subreddit).top(settings.REDDIT_SCORING_TOP_TIME, limit=settings.REDDIT_SCORING_TOP_LIMIT)
    score = mean(s.score for s in top)
    logging.info("Finished building relative scoring for %s" % subreddit)
    return RelativeScoring(id=subreddit, score=score, last_updated=datetime.now(timezone.utc))