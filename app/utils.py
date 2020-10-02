import json

from datetime import datetime, timezone
from os.path import splitext
from typing import Any, Iterable, Optional, Type, TypeVar

from pydantic.json import pydantic_encoder
from pydantic.tools import parse_obj_as


T = TypeVar("T")


def first(stuff: Iterable[T]) -> Optional[T]:
    return next((t for t in stuff if t), None)


def get_ext(path: str) -> str:
    return splitext(path)[1].lower()[1:]


def to_json(thing: Any) -> str:
    return json.dumps(thing, default=pydantic_encoder)


def from_obj(type_: Type[T], obj: Any) -> T:
    return parse_obj_as(type_, obj)


def from_timestamp_utc(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, timezone.utc)