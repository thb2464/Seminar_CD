# -*- coding: utf-8 -*-
"""Lab 2.3 — Dùng OpenAI API để sinh mã nguồn.

Mục tiêu: gửi một chữ ký hàm (function signature) kèm hướng dẫn, yêu cầu
mô hình hiện thực hàm; nhận n phương án và tách đoạn mã khỏi khối ```
của Markdown.
"""
import os
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

if not os.environ.get("OPENAI_API_KEY"):
    sys.exit("Please set the OPENAI_API_KEY environment variable first.")

from openai import OpenAI

USER_PROMPT = "def print_fibonacci_sequence(n: int) -> None:"

SYSTEM_PROMPT = (
    "Bạn sẽ nhận được chữ ký của một hàm Python. Nhiệm vụ của bạn là "
    "hiện thực hàm đó. Chỉ trả về mã nguồn."
)


def get_code_with_instructions(code: str) -> str:
    """Thêm một dòng chú thích hướng dẫn vào cuối đoạn mã."""
    return code + "\n# Hoàn thiện đoạn mã này"


def extract_code(text: str) -> str:
    """Tách đoạn mã nằm trong khối ```python ... ``` nếu có."""
    match = re.search(r"```(?:python)?(.*?)```", text, flags=re.DOTALL)
    return match.group(1).strip() if match else text.strip()


def main() -> None:
    client = OpenAI()

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=1.0,
        n=2,  # yêu cầu 2 phương án để so sánh
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": "Bao gồm docstring và type hint."},
            {"role": "user", "content": get_code_with_instructions(USER_PROMPT)},
        ],
    )

    for i, choice in enumerate(completion.choices, start=1):
        print("--- Option %d ---" % i)
        print(extract_code(choice.message.content))
        print()


if __name__ == "__main__":
    main()
