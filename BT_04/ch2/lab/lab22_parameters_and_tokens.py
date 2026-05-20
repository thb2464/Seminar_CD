# -*- coding: utf-8 -*-
"""Lab 2.2 — Tham số của lệnh gọi API và việc đếm token.

Mục tiêu: tìm hiểu các tham số temperature, max_tokens, n; sử dụng
thông điệp vai trò "system"; và đọc số token đã tiêu thụ.
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
    client = OpenAI()

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.2,   # mức ngẫu nhiên: thấp -> ổn định, cao -> đa dạng
        max_tokens=200,    # giới hạn độ dài câu trả lời (kiểm soát chi phí)
        n=1,               # số phương án trả về
        messages=[
            # Thông điệp "system" thiết lập bối cảnh và phong cách trả lời.
            {"role": "system",
             "content": "Bạn là một giảng viên lập trình, trả lời ngắn gọn."},
            {"role": "user",
             "content": "Trình bày bài toán Two Sum."},
        ],
    )

    # completion.usage cho biết số token đã dùng cho prompt và câu trả lời.
    usage = completion.usage
    print("Prompt tokens    :", usage.prompt_tokens)
    print("Completion tokens:", usage.completion_tokens)
    print("Total tokens     :", usage.total_tokens)
    print("-" * 40)
    print(completion.choices[0].message.content)


if __name__ == "__main__":
    main()
