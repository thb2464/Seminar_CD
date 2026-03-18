"""
=============================================================================
CHƯƠNG 11: TINH CHỈNH MÔ HÌNH VỚI OpenAI
Tập hợp các Prompt sử dụng trong Lab thực hành
=============================================================================

Sách: Supercharged Coding with GenAI (2025) - Packt Publishing
Tác giả: Hila Paz Herszfang & Peter V. Henstock

Chương này tập trung vào fine-tuning LLM. Các prompt dưới đây
minh họa cả hai phương pháp: few-shot learning và fine-tuning.
=============================================================================
"""

# =============================================================================
# PROMPT 1: System prompt cho fine-tuning data
# Mục đích: Thiết lập ngữ cảnh cho mô hình trong training data
# Được sử dụng trong mọi training example trong file JSONL
# =============================================================================
SYSTEM_PROMPT_FOR_TRAINING = """
You will be provided with a Python function signature enclosed with {{{ FUNCTION }}}.
Your task is to implement it.
"""


# =============================================================================
# PROMPT 2: User prompt template cho fine-tuning data
# Mục đích: Template chuẩn cho input trong training examples
# =============================================================================
USER_PROMPT_TEMPLATE = """
FUNCTION: {{{def <function_name>(<params>) -> <return_type>:}}}
 CODE:
"""

# Ví dụ cụ thể:
USER_PROMPT_EXAMPLE_1 = """
FUNCTION: {{{def get_arithmetic_mean(a, b)}}}
 CODE:
"""

USER_PROMPT_EXAMPLE_2 = """
FUNCTION: {{{def get_highest_even(numbers: List[int]) -> int:}}}
 CODE:
"""


# =============================================================================
# PROMPT 3: Few-shot learning (thay thế cho fine-tuning)
# Mục đích: So sánh hiệu quả few-shot vs fine-tuning
# Sử dụng trực tiếp trong API call thay vì training
# =============================================================================
FEW_SHOT_PROMPT = """
System: You will be provided with a Python function signature.
Your task is to implement it. Return ONLY code, no explanations.
Use clean code practices: extract helper functions for low-level details.

Example 1:
User: FUNCTION: {{{def get_reversed_longer_string(s1, s2):}}}
Assistant:
def get_reversed_longer_string(s1, s2):
    longer_s = get_longer_string(s1, s2)
    return reverse_string(longer_s)

def get_longer_string(s1, s2):
    return s1 if len(s1) > len(s2) else s2

def reverse_string(s):
    return s[::-1]

Example 2:
User: FUNCTION: {{{def get_highest_even(numbers: List[int]) -> int:}}}
Assistant:
def get_highest_even(numbers: List[int]) -> int:
    evens = filter_even_numbers(numbers)
    return max(evens)

def filter_even_numbers(numbers: List[int]) -> List[int]:
    return [num for num in numbers if num % 2 == 0]

Now implement:
User: FUNCTION: {{{def get_sum_of_odd_squares(numbers: List[int]) -> int:}}}
"""


# =============================================================================
# PROMPT 4: Tạo training data JSONL
# Mục đích: Prompt để ChatGPT giúp tạo thêm training examples
# =============================================================================
PROMPT_GENERATE_TRAINING_DATA = """
CONTEXT: I am building a fine-tuning dataset for an LLM specialized
in generating clean Python code. Each training example follows this structure:

{
  "messages": [
    {"role": "system", "content": "You will be provided with a Python function signature enclosed with {{{ FUNCTION }}}. Your task is to implement it."},
    {"role": "user", "content": "FUNCTION: {{{def function_name(params):}}}\\n CODE: "},
    {"role": "assistant", "content": "implementation code here", "weight": 1}
  ]
}

KEY RULES for assistant responses:
1. Code ONLY - no explanations, no markdown
2. Use helper functions to extract low-level details (Single Responsibility Principle)
3. Clear, descriptive function and variable names
4. For complex examples: include a weight=0 response with explanation first,
   then a weight=1 response with code only

TASK: Generate 5 new training examples following these rules.
The functions should involve: list manipulation, string processing,
and mathematical operations of varying complexity.

OUTPUT: Valid JSONL format (one JSON object per line).
"""


# =============================================================================
# PROMPT 5: Upload và Fine-tune với OpenAI API
# Mục đích: Script template để thực hiện fine-tuning
# =============================================================================
PROMPT_5_FINETUNE_SCRIPT = """
# Bước 1: Upload file
from openai import OpenAI
client = OpenAI()

upload = client.files.create(
    file=open("fine_tuning.jsonl", "rb"),
    purpose="fine-tune"
)
file_id = upload.id

# Bước 2: Tạo fine-tuning job với DPO method
job = client.fine_tuning.jobs.create(
    training_file=file_id,
    model="gpt-4o-mini-2024-07-18",
    extra_body={"method": {"type": "dpo"}}
)
print(f"Job ID: {job.id}, Status: {job.status}")

# Bước 3: Kiểm tra trạng thái
status = client.fine_tuning.jobs.retrieve(job.id)
print(f"Status: {status.status}")

# Bước 4: Sử dụng model đã fine-tune
completion = client.chat.completions.create(
    model="ft:gpt-4o-mini:your-org::job-id",  # Thay bằng model name thực
    messages=[
        {"role": "user", "content": "Write a Python function that finds the maximum value in a list."}
    ]
)
print(completion.choices[0].message.content)
"""


# =============================================================================
# PROMPT 6: So sánh model gốc vs fine-tuned
# Mục đích: Đánh giá hiệu quả fine-tuning
# =============================================================================
PROMPT_6_COMPARE_MODELS = """
# Test prompt để so sánh:
TEST_MESSAGES = [
    {
        "role": "system",
        "content": "You will be provided with a Python function signature "
                   "enclosed with {{{ FUNCTION }}}. Your task is to implement it."
    },
    {
        "role": "user",
        "content": "FUNCTION: {{{def get_longest_common_prefix(strings: List[str]) -> str:}}}\\n CODE: "
    }
]

# Gọi model gốc
response_base = client.chat.completions.create(
    model="gpt-4o-mini-2024-07-18",
    messages=TEST_MESSAGES
)

# Gọi model fine-tuned
response_ft = client.chat.completions.create(
    model="ft:gpt-4o-mini:your-org::job-id",
    messages=TEST_MESSAGES
)

# So sánh:
# - Model gốc: thường trả về code + giải thích dài
# - Model fine-tuned: trả về code sạch, có helper functions, không giải thích
"""


# =============================================================================
# PROMPT 7: Prompt trong OpenAI Playground
# Mục đích: Bài toán Quadratic Roots để test trong Playground
# =============================================================================
PROMPT_7_PLAYGROUND_TEST = """
System: You will be provided with a Python function signature
enclosed with {{{ FUNCTION }}}. Your task is to implement it.

User: FUNCTION: {{{def compute_quadratic_roots(a: float, b: float, c: float) -> tuple:}}}
 CODE:

# Kỳ vọng từ model fine-tuned:
# - Chỉ trả về code
# - Tách thành helper functions
# - Không có giải thích

# Kỳ vọng từ model gốc:
# - Code + giải thích dài
# - Markdown formatting
# - Docstrings chi tiết
"""


if __name__ == "__main__":
    print("=" * 70)
    print("CHƯƠNG 11: PROMPTS CHO FINE-TUNING VỚI OpenAI")
    print("=" * 70)
    prompts = [
        ("Prompt 1", "System prompt for training data", SYSTEM_PROMPT_FOR_TRAINING),
        ("Prompt 2", "User prompt template", USER_PROMPT_TEMPLATE),
        ("Prompt 3", "Few-shot learning alternative", FEW_SHOT_PROMPT),
        ("Prompt 4", "Generate more training data", PROMPT_GENERATE_TRAINING_DATA),
        ("Prompt 5", "Fine-tune script template", PROMPT_5_FINETUNE_SCRIPT),
        ("Prompt 6", "Compare base vs fine-tuned", PROMPT_6_COMPARE_MODELS),
        ("Prompt 7", "Playground test - Quadratic Roots", PROMPT_7_PLAYGROUND_TEST),
    ]
    for name, desc, prompt in prompts:
        print(f"\n{'─' * 70}")
        print(f"  {name}: {desc}")
        print(f"{'─' * 70}")
        print(prompt[:200] + "..." if len(prompt) > 200 else prompt)
