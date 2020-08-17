import logging
import random

from datetime import datetime, timezone
from django.conf import settings
from praw import Reddit
from statistics import mean
from typing import MutableMapping

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
            scoring = get_or_create_relative_scoring(all_scoring, reddit, submission.subreddit.display_name)
            relative_score = (submission.score / scoring.score) * 1000
            link, created = Link.objects.get_or_create(reddit_id=submission.id, defaults={
                'title': submission.title,
                'posted_at': datetime.fromtimestamp(submission.created_utc, timezone.utc),
                'score': submission.score,
                'relative_score': relative_score,
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
                if relative_score != link.relative_score:
                    link.relative_score = relative_score
                    update_fields.append('relative_score')
                if submission.title != link.title:
                    link.title = submission.title
                    update_fields.append('title')
                if update_fields:
                    link.save(update_fields=update_fields)
    logging.info("Finshed syncing top reddit submissions")

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

def update_all_link_scores():
    reddit = get_reddit()
    all_scoring = {s.id: s for s in RelativeScoring.objects.all()}
    for link in Link.objects.filter(reddit_id__isnull=False):
        scoring = get_or_create_relative_scoring(all_scoring, reddit, link.metadata['subreddit'])
        link.relative_score = (link.score / scoring.score) * 1000
        link.save(update_fields=['relative_score'])