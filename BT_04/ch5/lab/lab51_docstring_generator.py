# -*- coding: utf-8 -*-
"""Lab 5.1 — Áp dụng mẫu prompt có cấu trúc với OpenAI API.

Dùng mẫu SURROUND + SINGLE_TASK (Chương 4) như một prompt tái sử dụng:
yêu cầu mô hình sinh docstring kiểu Google cho một hàm Python cho trước.
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

# Hai hằng số tạo nên thông điệp system — tách riêng để dễ tái sử dụng.
SURROUND = "Bạn sẽ nhận được một hàm Python đặt trong {{{ FUNCTION }}}."
SINGLE_TASK = "Nhiệm vụ của bạn là sinh docstring kiểu Google cho hàm đó."


def celsius_to_fahrenheit(c):
    return c * 9 / 5 + 32


def get_user_prompt(func) -> str:
    """Dựng thông điệp user: mã nguồn của hàm, đặt trong dấu phân tách."""
    return (
        "FUNCTION: {{{\n" + inspect.getsource(func) + "}}}\n\n"
        "GOOGLE STYLE DOCSTRING:"
    )


def main() -> None:
    client = OpenAI()
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,
        messages=[
            {"role": "system", "content": SURROUND + " " + SINGLE_TASK},
            {"role": "user", "content": get_user_prompt(celsius_to_fahrenheit)},
        ],
    )
    print("Generated docstring:")
    print(completion.choices[0].message.content)


if __name__ == "__main__":
    main()
