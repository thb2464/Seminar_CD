# -*- coding: utf-8 -*-
"""Lab 2.1 — Cuộc gọi Chat Completion cơ bản tới OpenAI API.

Mục tiêu: thực hiện lệnh gọi API đầu tiên — gửi một câu hỏi và in ra
câu trả lời của mô hình. Yêu cầu: biến môi trường OPENAI_API_KEY.
"""
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

if not os.environ.get("OPENAI_API_KEY"):
    sys.exit("Please set the OPENAI_API_KEY environment variable first.")

from openai import OpenAI


def main() -> None:
    # Đối tượng client tự động đọc khóa API từ biến môi trường OPENAI_API_KEY.
    client = OpenAI()

    # messages là danh sách các thông điệp; mỗi thông điệp gồm "role" và
    # "content". Ở mức cơ bản nhất chỉ cần một thông điệp vai trò "user".
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": "Bài toán FizzBuzz là gì?"},
        ],
    )

    # Câu trả lời của mô hình nằm ở choices[0].message.content.
    print("Answer:")
    print(completion.choices[0].message.content)


if __name__ == "__main__":
    main()
