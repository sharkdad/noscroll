from datetime import datetime
from typing import List, Optional

from pydantic.dataclasses import dataclass


@dataclass
class Multi:
    owner: str
    name: str
    display_name: str


@dataclass
class AppDetails:
    is_authenticated: bool
    reddit_users: List[str]
    multis: List[Multi]


@dataclass
class Embed:
    html: str
    width: Optional[int]
    height: Optional[int]


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
    embed: Optional[Embed]


@dataclass
class SubmissionResults:
    results: List[Submission]


@dataclass
class Token:
    token: str
    token_secret: str
    expires_at: datetime