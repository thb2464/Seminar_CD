# -*- coding: utf-8 -*-
"""Lab 4.2 — Xây dựng prompt có cấu trúc bằng mã nguồn.

Minh họa mẫu prompt SURROUND + SINGLE_TASK: phần SURROUND nêu bối cảnh,
SINGLE_TASK nêu một nhiệm vụ duy nhất; dữ liệu được đặt trong dấu phân
tách {{{ }}}. Ví dụ áp dụng: yêu cầu mô hình tái cấu trúc một hàm.
"""
import inspect
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

if not os.environ.get("OPENAI_API_KEY"):
    sys.exit("Please set the OPENAI_API_KEY environment variable first.")

from openai import OpenAI

# SURROUND — nêu bối cảnh: mô tả các phần đầu vào và dấu phân tách được dùng.
SURROUND = (
    "Bạn sẽ nhận được một hàm Python đặt trong {{{ CODE }}} và một yêu cầu "
    "thay đổi đặt trong {{{ CHANGE }}}."
)
# SINGLE_TASK — một nhiệm vụ duy nhất, phát biểu rõ ràng.
SINGLE_TASK = "Nhiệm vụ của bạn là trả về một hàm Python mới đã áp dụng thay đổi."


def sum_prices(prices):
    total = 0
    for price in prices:
        total = total + price
    return total


def get_user_prompt(func, change: str) -> str:
    """Ghép user prompt: yêu cầu thay đổi và mã nguồn, có dấu phân tách."""
    code = inspect.getsource(func)
    return (
        "CHANGE: {{{ " + change + " }}}\n\n"
        "CODE: {{{\n" + code + "}}}\n\n"
        "REFACTORED CODE:"
    )


def main() -> None:
    client = OpenAI()
    change = "Dùng hàm dựng sẵn sum() thay cho vòng lặp tích lũy."
    user_prompt = get_user_prompt(sum_prices, change)

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        messages=[
            {"role": "system", "content": SURROUND + " " + SINGLE_TASK},
            {"role": "user", "content": user_prompt},
        ],
    )

    print("=== Structured user prompt ===")
    print(user_prompt)
    print("=== Model response ===")
    print(completion.choices[0].message.content)


if __name__ == "__main__":
    main()
