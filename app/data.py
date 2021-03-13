from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic.dataclasses import dataclass


@dataclass
class LocationFeed:
    page_path: str
    feed_id: str


@dataclass
class AppDetails:
    is_authenticated: bool
    reddit_users: List[str]
    feeds: List[LocationFeed]
    messages: List[str]


@dataclass
class Location:
    page_path: str
    display_name: str


@dataclass
class Locations:
    locations: List[Location]


@dataclass
class Embed:
    embed_type: str
    url: Optional[str] = None
    html: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    gallery: Optional[List[Embed]] = None
    video: Optional[Embed] = None


# pylint: disable=no-member
Embed.__pydantic_model__.update_forward_refs()  # type: ignore


@dataclass
class Submission:
    id: str
    title: str
    posted_at: str
    subreddit: str
    score: int
    url: str
    permalink: str
    num_comments: int
    embed: Optional[Embed]


@dataclass
class SubmissionResults:
    results: List[Submission]


@dataclass
class Token:
    token: str
    token_secret: str
    expires_at: datetime