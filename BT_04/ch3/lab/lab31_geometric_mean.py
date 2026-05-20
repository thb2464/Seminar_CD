# -*- coding: utf-8 -*-
"""Lab 3.1 — Triển khai hàm trung bình nhân với GitHub Copilot.

Quy trình thực hành:
  1) Dùng cửa sổ chat của Copilot để hỏi định nghĩa "trung bình nhân".
  2) Dùng gợi ý nội dòng (inline) để hiện thực hàm.
  3) Gọi hàm và kiểm tra kết quả.
"""
import sys
from functools import reduce

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def get_geometric_mean(*numbers: float) -> float:
    """Tính trung bình nhân của một dãy số dương.

    Trung bình nhân của n số là căn bậc n của tích các số đó.

    Args:
        *numbers: dãy số cần tính, cần ít nhất một số dương.

    Returns:
        Giá trị trung bình nhân của dãy số.

    Raises:
        ValueError: khi dãy rỗng hoặc chứa số không dương.
    """
    if not numbers:
        raise ValueError("Cần ít nhất một số để tính trung bình nhân.")
    if any(x <= 0 for x in numbers):
        raise ValueError("Trung bình nhân chỉ xác định với các số dương.")
    product = reduce(lambda a, b: a * b, numbers)
    return product ** (1 / len(numbers))


if __name__ == "__main__":
    print("GM(4, 9)    =", get_geometric_mean(4, 9))      # 6.0
    print("GM(1, 2, 4) =", get_geometric_mean(1, 2, 4))   # 2.0
    print("GM(2, 8)    =", get_geometric_mean(2, 8))      # 4.0
