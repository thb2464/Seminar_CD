from app.middleware.rate_limit import InMemoryRateLimiter


class FakeClock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value


def test_allows_up_to_max_then_blocks() -> None:
    clock = FakeClock()
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60, clock=clock)

    assert not limiter.is_rate_limited("1.1.1.1")
    assert not limiter.is_rate_limited("1.1.1.1")
    assert not limiter.is_rate_limited("1.1.1.1")
    assert limiter.is_rate_limited("1.1.1.1")


def test_window_expires_old_entries() -> None:
    clock = FakeClock()
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=10, clock=clock)

    limiter.is_rate_limited("ip")
    limiter.is_rate_limited("ip")
    assert limiter.is_rate_limited("ip")

    clock.value = 11.0
    assert not limiter.is_rate_limited("ip")


def test_separate_buckets_per_ip() -> None:
    clock = FakeClock()
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60, clock=clock)

    assert not limiter.is_rate_limited("a")
    assert not limiter.is_rate_limited("b")
    assert limiter.is_rate_limited("a")
    assert limiter.is_rate_limited("b")


def test_prune_drops_empty_buckets() -> None:
    clock = FakeClock()
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=10, clock=clock)
    limiter.is_rate_limited("ip")
    clock.value = 11.0
    limiter.prune()
    assert "ip" not in limiter._timestamps
