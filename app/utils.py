import json

from base64 import b64decode
from datetime import datetime, timezone
from os.path import splitext
from typing import Any, Iterable, Optional, Type, TypeVar

from rest_framework.renderers import JSONRenderer
from pydantic.json import pydantic_encoder
from pydantic.tools import parse_obj_as, parse_raw_as
from rest_framework.utils import encoders


T = TypeVar("T")


def first(stuff: Iterable[T]) -> Optional[T]:
    return next((t for t in stuff if t), None)


def get_ext(path: str) -> str:
    return splitext(path)[1].lower()[1:]


def to_json(thing: Any) -> str:
    return json.dumps(thing, default=pydantic_encoder)


def from_raw(type_: Type[T], raw: str) -> T:
    return parse_raw_as(type_, raw)


def from_obj(type_: Type[T], obj: Any) -> T:
    return parse_obj_as(type_, obj)


def from_timestamp_utc(timestamp: float) -> datetime:
    return datetime.fromtimestamp(timestamp, timezone.utc)


def b64_to_hex(b64_str: str) -> str:
    return b64decode(b64_str).hex()


# pylint: disable=no-self-use
class PydanticJSONEncoder(json.JSONEncoder):
    def default(self, o):
        return pydantic_encoder(o)


class RestPydanticJSONEncoder(encoders.JSONEncoder, PydanticJSONEncoder):
    pass


class PydanticJSONRenderer(JSONRenderer):
    encoder_class = RestPydanticJSONEncoder