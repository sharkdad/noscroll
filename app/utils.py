from os.path import splitext
from typing import Iterable, Optional, TypeVar

T = TypeVar("T")


def first(stuff: Iterable[T]) -> Optional[T]:
    return next((t for t in stuff if t), None)


def get_ext(path: str) -> str:
    return splitext(path)[1].lower()[1:]