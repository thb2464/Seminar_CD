import threading
import time
from collections import deque
from typing import Callable


class InMemoryRateLimiter:
    """IP-based sliding-window rate limiter.

    Thread-safe and standalone — replaces the in-process Map+setInterval
    pattern from the monolith's chatbot controller. Per-process state only;
    swap to Redis once we run more than one chatbot replica behind Kong.
    """

    def __init__(
        self,
        max_requests: int,
        window_seconds: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_requests < 1:
            raise ValueError("max_requests must be >= 1")
        if window_seconds < 1:
            raise ValueError("window_seconds must be >= 1")
        self._max = max_requests
        self._window = window_seconds
        self._clock = clock
        self._lock = threading.Lock()
        self._timestamps: dict[str, deque[float]] = {}

    def is_rate_limited(self, key: str) -> bool:
        now = self._clock()
        cutoff = now - self._window
        with self._lock:
            bucket = self._timestamps.setdefault(key, deque())
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self._max:
                return True
            bucket.append(now)
            return False

    def prune(self) -> None:
        now = self._clock()
        cutoff = now - self._window
        with self._lock:
            for key in list(self._timestamps):
                bucket = self._timestamps[key]
                while bucket and bucket[0] < cutoff:
                    bucket.popleft()
                if not bucket:
                    del self._timestamps[key]
