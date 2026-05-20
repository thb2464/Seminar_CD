# -*- coding: utf-8 -*-
"""Lab 3.2 — Hàm trung bình nhân cho hai số.

Mục tiêu: viết một prompt (dưới dạng chú thích và chữ ký hàm) đủ rõ để
GitHub Copilot gợi ý một hàm có type hint đầy đủ.
"""
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def get_geometric_mean_of_two_numbers(a: float, b: float) -> float:
    """Trả về trung bình nhân của hai số dương a và b."""
    return (a * b) ** 0.5


if __name__ == "__main__":
    num1: float = 5.0
    num2: float = 20.0
    print("GM(5.0, 20.0) =", get_geometric_mean_of_two_numbers(num1, num2))  # 10.0
