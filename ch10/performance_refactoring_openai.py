"""
Chương 10 - Lab: Tái cấu trúc hiệu suất với OpenAI API
========================================================
Script này minh họa cách sử dụng OpenAI API để tự động
tái cấu trúc hiệu suất mã nguồn Python.

Quy trình:
1. Đọc hàm gốc cần tái cấu trúc
2. Xác định các dòng code cần tối ưu
3. Gửi prompt có cấu trúc đến OpenAI API
4. Nhận kết quả đã được vector hóa

Yêu cầu:
- pip install openai
- Biến môi trường OPENAI_API_KEY đã được thiết lập
"""

import inspect
from typing import Callable

from openai import OpenAI
from openai.types.chat import ChatCompletion


# =============================================================================
# System Prompt - Thiết lập ngữ cảnh theo nguyên tắc 5S
# =============================================================================
SYSTEM_PROMPT_SURROUND = """You are provided with:
1. A Python function implementation enclosed with {{{ FUNCTION }}}
2. Lines to be refactored enclosed with {{{ OLD }}}
3. A library to be used in the new code enclosed with {{{ LIBRARY }}}."""

SYSTEM_PROMPT_TASK = "Your task is to return a new implementation for the old lines using the specified library."


# =============================================================================
# Hàm gốc cần tái cấu trúc (trước khi tối ưu)
# =============================================================================
def get_euclidean_distance_original(a, b):
    """Hàm tính khoảng cách Euclidean - phiên bản chưa tối ưu."""
    print("Info: computing L2 distance...")
    dist_2 = 0
    for i in range(len(a)):
        for j in range(len(a[i])):
            dist_2 += (a[i][j] - b[i][j]) ** 2
    return dist_2 ** 0.5


# Các dòng code cụ thể cần thay thế
LINES_TO_REFACTOR = """dist_2 = 0
for i in range(len(a)):
    for j in range(len(a[i])):
        dist_2 += (a[i][j] - b[i][j]) ** 2"""


def build_user_prompt(func: Callable, library: str, lines: str) -> str:
    """
    Xây dựng user prompt từ hàm, thư viện mục tiêu, và dòng cần thay thế.

    Args:
        func: Hàm Python cần tái cấu trúc
        library: Tên thư viện dùng để tối ưu (vd: "NumPy")
        lines: Các dòng code cụ thể cần thay thế

    Returns:
        Chuỗi prompt đã được format
    """
    source_code = inspect.getsource(func)
    return f"""
    FUNCTION: {{{{{{ {source_code} }}}}}}

    LINES: {{{{{{ {lines} }}}}}}

    LIBRARY: {{{{{{ {library} }}}}}}

    REFACTORED:
    """


def refactor_with_openai(
    func: Callable,
    library: str,
    lines: str,
    model: str = "gpt-4o-mini"
) -> str:
    """
    Gửi yêu cầu tái cấu trúc hiệu suất đến OpenAI API.

    Args:
        func: Hàm cần tái cấu trúc
        library: Thư viện mục tiêu
        lines: Dòng code cần thay thế
        model: Model OpenAI sử dụng

    Returns:
        Code đã được tái cấu trúc từ phản hồi API
    """
    client: OpenAI = OpenAI()

    system_prompt = f"{SYSTEM_PROMPT_SURROUND} {SYSTEM_PROMPT_TASK}"
    user_prompt = build_user_prompt(func, library, lines)

    print(f"[INFO] Sending refactoring request to {model}...")
    print(f"[INFO] Target library: {library}")
    print(f"[INFO] Lines to refactor: {len(lines.splitlines())} lines")

    completion: ChatCompletion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    response = completion.choices[0].message.content
    tokens_used = completion.usage.total_tokens if completion.usage else "N/A"
    print(f"[INFO] Response received. Tokens used: {tokens_used}")

    return response


if __name__ == "__main__":
    print("=" * 60)
    print("  Chương 10: Performance Refactoring với OpenAI API")
    print("=" * 60)

    result = refactor_with_openai(
        func=get_euclidean_distance_original,
        library="NumPy",
        lines=LINES_TO_REFACTOR
    )

    print("\n" + "─" * 60)
    print("  KẾT QUẢ TÁI CẤU TRÚC:")
    print("─" * 60)
    print(result)
