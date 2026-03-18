"""
=============================================================================
CHƯƠNG 10: TÁI CẤU TRÚC MÃ NGUỒN VỚI GenAI
Tập hợp các Prompt sử dụng trong Lab thực hành
=============================================================================

Sách: Supercharged Coding with GenAI (2025) - Packt Publishing
Tác giả: Hila Paz Herszfang & Peter V. Henstock

Mỗi prompt được thiết kế theo nguyên tắc 5S:
- Structured: Cấu trúc rõ ràng
- Surrounding: Cung cấp ngữ cảnh đầy đủ
- Single task: Một nhiệm vụ duy nhất
- Specific: Chỉ dẫn cụ thể
- Short: Ngắn gọn, không thừa
=============================================================================
"""

# =============================================================================
# PROMPT 1: Tái cấu trúc cơ bản - Baseline (ChatGPT)
# Mục đích: Yêu cầu GenAI tái cấu trúc hàm mà không có hướng dẫn cụ thể
# =============================================================================
PROMPT_1_BASELINE_REFACTOR = """
CONTEXT: You are provided with a Python function enclosed with {{{ FUNCTION }}}.
TASK: Refactor the function.

FUNCTION: {{{
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route("/distances", methods=["POST"])
def calculate_distance():
    data = request.get_json()
    dist_type = data.get("distance")
    if dist_type == "L1":
        a = data.get("df1")
        b = data.get("df2")
        if np.asarray(a).shape != np.asarray(b).shape:
            return jsonify({"error": "Matrices must have the same shape"})
        dist = np.sum(np.abs(a - b))
        return jsonify({"distance": dist})
    elif dist_type == "L2":
        a = data.get("df1")
        b = data.get("df2")
        if np.asarray(a).shape != np.asarray(b).shape:
            return jsonify({"error": "Matrices must have the same shape"})
        dist = 0
        for i in range(len(a)):
            for j in range(len(a[i])):
                dist += (a[i][j] - b[i][j]) ** 2
        dist = np.sqrt(dist)
        return jsonify({"distance": dist})
    else:
        return jsonify({"error": "Invalid distance type"})
}}}

REFACTORED:
"""


# =============================================================================
# PROMPT 2: Tái cấu trúc cấu trúc với CoT (ChatGPT)
# Mục đích: Sử dụng Chain-of-Thought để hướng dẫn GenAI tái cấu trúc
#            bằng cách cung cấp cả hàm mới (skeleton) và mã cũ
# =============================================================================
PROMPT_2_COT_STRUCTURAL_REFACTOR = """
CONTEXT: You are provided with
1. Python function enclosed with {{{ FUNCTION }}} with calls to missing implementations.
2. Old implementation enclosed with {{{ OLD }}} for reference.
TASK: implement the missing functions.

FUNCTION: {{{
@app.route("/distances", methods=["POST"])
def calculate_distance():
    a, b, dist_type = parse_request_parameters(request)
    dist_func = {"L1": get_manhattan_dist, "L2": get_euclidean_dist}.get(dist_type)
    dist = dist_func(a, b)
    return jsonify({"distance": dist})
}}}

OLD: {{{
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route("/distances", methods=["POST"])
def calculate_distance():
    data = request.get_json()
    dist_type = data.get("distance")
    if dist_type == "L1":
        a = data.get("df1")
        b = data.get("df2")
        if np.asarray(a).shape != np.asarray(b).shape:
            return jsonify({"error": "Matrices must have the same shape"})
        dist = np.sum(np.abs(a - b))
        return jsonify({"distance": dist})
    elif dist_type == "L2":
        a = data.get("df1")
        b = data.get("df2")
        if np.asarray(a).shape != np.asarray(b).shape:
            return jsonify({"error": "Matrices must have the same shape"})
        dist = 0
        for i in range(len(a)):
            for j in range(len(a[i])):
                dist += (a[i][j] - b[i][j]) ** 2
        dist = np.sqrt(dist)
        return jsonify({"distance": dist})
    else:
        return jsonify({"error": "Invalid distance type"})
}}}

CODE:
"""


# =============================================================================
# PROMPT 3: Tái cấu trúc cấu trúc với CoT (GitHub Copilot)
# Mục đích: Viết skeleton code trong IDE để Copilot tự sinh implementations
# Cách sử dụng: Paste vào file .py trong IDE có Copilot, để Copilot gợi ý
# =============================================================================
PROMPT_3_COT_COPILOT_SKELETON = """
# Paste đoạn code sau vào file Python trong IDE có GitHub Copilot.
# Copilot sẽ tự động gợi ý implementation cho các hàm còn thiếu
# dựa trên ngữ cảnh (tên hàm, tham số, hàm gọi).

import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/distances", methods=["POST"])
def calculate_distance():
    a, b, dist_type = parse_request_parameters(request)
    dist_func = {"L1": get_manhattan_dist, "L2": get_euclidean_dist}.get(dist_type)
    dist = dist_func(a, b)
    return jsonify({"distance": dist})


def parse_request_parameters(request):
    # Copilot sẽ tự gợi ý implementation ở đây


def get_manhattan_dist(a, b):
    # Copilot sẽ tự gợi ý implementation ở đây


def get_euclidean_dist(a, b):
    # Copilot sẽ tự gợi ý implementation ở đây
"""


# =============================================================================
# PROMPT 4: Tái cấu trúc hiệu suất (ChatGPT)
# Mục đích: Yêu cầu thay thế vòng lặp for bằng NumPy vectorization
# =============================================================================
PROMPT_4_PERFORMANCE_REFACTOR = """
CONTEXT: You are provided with:
1. A Python function implementation enclosed with {{{ FUNCTION }}}
2. Lines to be refactored enclosed with {{{ OLD }}}
3. A library to be used in the new code enclosed with {{{ LIBRARY }}}
TASK: Return a new implementation for the old lines using the specified library.

FUNCTION: {{{
def get_euclidean_dist(a, b):
    print("Info: computing L2 distance...")
    dist_2 = 0
    for i in range(len(a)):
        for j in range(len(a[i])):
            dist_2 += (a[i][j] - b[i][j]) ** 2
    return np.sqrt(dist_2)
}}}

OLD: {{{
    dist_2 = 0
    for i in range(len(a)):
        for j in range(len(a[i])):
            dist_2 += (a[i][j] - b[i][j]) ** 2
    return np.sqrt(dist_2)
}}}

LIBRARY: {{{ NumPy }}}

REFACTORED CODE:
"""


# =============================================================================
# PROMPT 5: Tái cấu trúc hiệu suất với OpenAI API (Programmatic)
# Mục đích: Gọi OpenAI API lập trình để tái cấu trúc hiệu suất tự động
# =============================================================================
PROMPT_5_PERFORMANCE_OPENAI_API = """
# Script Python gọi OpenAI API để thực hiện tái cấu trúc hiệu suất
# System prompt + User prompt được tách biệt rõ ràng

import inspect
from openai import OpenAI

# System prompt: Thiết lập vai trò và ngữ cảnh
SYSTEM_PROMPT = '''You are provided with:
1. A Python function implementation enclosed with {{{ FUNCTION }}}
2. Lines to be refactored enclosed with {{{ OLD }}}
3. A library to be used in the new code enclosed with {{{ LIBRARY }}}.
Your task is to return a new implementation for the old lines using the specified library.'''

# User prompt: Cung cấp dữ liệu cụ thể
USER_PROMPT = '''
FUNCTION: {{{
def get_euclidean_distance(a, b):
    print("Info: computing L2 distance...")
    dist_2 = 0
    for i in range(len(a)):
        for j in range(len(a[i])):
            dist_2 += (a[i][j] - b[i][j]) ** 2
    return dist_2 ** 0.5
}}}

LINES: {{{
dist_2 = 0
for i in range(len(a)):
    for j in range(len(a[i])):
        dist_2 += (a[i][j] - b[i][j]) ** 2
}}}

LIBRARY: {{{ NumPy }}}

REFACTORED:
'''

# Gọi API
client = OpenAI()
completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_PROMPT},
    ],
)
print("Result:", completion.choices[0].message.content)
"""


# =============================================================================
# PROMPT 6: Tái cấu trúc nâng cao - Thêm error handling, logging, type hints
# Mục đích: Yêu cầu GenAI nâng cấp toàn diện mã nguồn
# =============================================================================
PROMPT_6_ADVANCED_REFACTOR = """
CONTEXT: You are provided with a refactored Python Flask API that calculates
Manhattan (L1) and Euclidean (L2) distances between two matrices.

CURRENT CODE: {{{
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/distances", methods=["POST"])
def calculate_distance():
    a, b, dist_type = parse_request_parameters(request)
    dist_func = {"L1": get_manhattan_dist, "L2": get_euclidean_dist}.get(dist_type)
    dist = dist_func(a, b)
    return jsonify({"distance": dist})

def parse_request_parameters(request):
    data = request.get_json()
    a = np.array(data.get("df1"))
    b = np.array(data.get("df2"))
    dist_type = data.get("distance")
    return a, b, dist_type

def get_manhattan_dist(a, b):
    return np.sum(np.abs(a - b))

def get_euclidean_dist(a, b):
    return np.sqrt(np.sum((a - b) ** 2))
}}}

TASK: Enhance this code with:
1. Type hints for all function parameters and return types
2. Proper error handling (ValueError for invalid inputs, shape mismatch)
3. Logging using Python's logging module
4. Docstrings in Google style
5. A health check endpoint at /health
6. Strategy pattern for distance functions using a dictionary registry

Return only the improved Python code.
"""


if __name__ == "__main__":
    print("=" * 70)
    print("CHƯƠNG 10: PROMPTS CHO TÁI CẤU TRÚC MÃ VỚI GenAI")
    print("=" * 70)
    prompts = [
        ("Prompt 1", "Baseline Refactor (ChatGPT)", PROMPT_1_BASELINE_REFACTOR),
        ("Prompt 2", "CoT Structural Refactor (ChatGPT)", PROMPT_2_COT_STRUCTURAL_REFACTOR),
        ("Prompt 3", "CoT Copilot Skeleton", PROMPT_3_COT_COPILOT_SKELETON),
        ("Prompt 4", "Performance Refactor (ChatGPT)", PROMPT_4_PERFORMANCE_REFACTOR),
        ("Prompt 5", "Performance Refactor (OpenAI API)", PROMPT_5_PERFORMANCE_OPENAI_API),
        ("Prompt 6", "Advanced Refactor (Full Enhancement)", PROMPT_6_ADVANCED_REFACTOR),
    ]
    for name, desc, prompt in prompts:
        print(f"\n{'─' * 70}")
        print(f"  {name}: {desc}")
        print(f"{'─' * 70}")
        print(prompt[:200] + "..." if len(prompt) > 200 else prompt)
