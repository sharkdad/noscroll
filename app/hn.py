import logging
import requests

from datetime import datetime, timezone
from django.conf import settings
from requests.adapters import HTTPAdapter
from typing import Any, List
from urllib3.util.retry import Retry

from .models import Link

retry = Retry(total=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry)
http = requests.Session()
http.mount("https://", adapter)
http.mount("http://", adapter)


def get_hn_json(path: str) -> Any:
    response = http.get(
        "https://hacker-news.firebaseio.com/v0/%s.json" % path, timeout=10
    )
    response.raise_for_status()
    return response.json()


def sync_top_stories() -> None:
    logging.info("Syncing top Hacker News stories")
    top_stories: List[int] = get_hn_json("topstories")
    for hn_id in top_stories[: settings.HN_TOP_STORIES]:
        metadata = get_hn_json("item/%d" % hn_id)
        if metadata["type"] == "job":
            continue
        link, created = Link.objects.get_or_create(
            hn_id=hn_id,
            defaults={
                "title": metadata["title"],
                "posted_at": datetime.fromtimestamp(metadata["time"], timezone.utc),
                "score": metadata["score"],
                "metadata": metadata,
            },
        )
        if created:
            continue

        update_fields = []
        if metadata["score"] != link.score:
            link.score = metadata["score"]
            update_fields.append("score")
        if metadata["title"] != link.title:
            link.title = metadata["title"]
            update_fields.append("title")
        if update_fields:
            link.save(update_fields=update_fields)
    logging.info("Finished syncing top Hacker News stories")
