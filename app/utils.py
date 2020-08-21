from typing import Iterable, Optional, TypeVar

T = TypeVar('T')

def first_not_none(stuff: Iterable[T]) -> Optional[T]:
    return next((t for t in stuff if t is not None), None)