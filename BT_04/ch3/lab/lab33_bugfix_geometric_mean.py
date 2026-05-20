# -*- coding: utf-8 -*-
"""Lab 3.3 — Phát hiện và sửa lỗi với GitHub Copilot.

Đoạn mã ban đầu tính trung bình nhân của ba số nhưng chứa một lỗi tinh
vi: số mũ là 1/2 thay vì 1/3. Cửa sổ chat của Copilot giúp nhận ra và
giải thích lỗi này.
"""
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def geometric_mean_three_buggy(a, b, c):
    """PHIÊN BẢN LỖI — chỉ dùng để minh họa.

    Lỗi: dùng số mũ 1/2 (căn bậc hai) trong khi trung bình nhân của ba
    số phải là căn bậc ba, tức số mũ 1/3.
    """
    return (a * b * c) ** (1 / 2)


def geometric_mean_three(a: float, b: float, c: float) -> float:
    """Phiên bản đã sửa: trung bình nhân ba số là căn bậc ba của tích."""
    product: float = a * b * c
    return product ** (1 / 3)


if __name__ == "__main__":
    buggy = geometric_mean_three_buggy(2, 4, 8)
    fixed = geometric_mean_three(2, 4, 8)
    print("Buggy version  GM(2, 4, 8) =", buggy, "-> wrong")
    print("Fixed version  GM(2, 4, 8) =", fixed, "-> expected 4.0")
    assert abs(fixed - 4.0) < 1e-9, "fixed function must return 4.0"
    print("Self-check: OK")
