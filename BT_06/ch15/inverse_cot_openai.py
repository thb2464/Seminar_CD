"""
Chapter 15 - Going Live with GenAI: Logging, Monitoring, and Errors
Lab 15.4: Inverse CoT với OpenAI API cho Decorator Generation

Kỹ thuật Inverse CoT (Chain-of-Thought ngược):
- Thay vì mô tả yêu cầu chung chung, ta cung cấp:
  1. Hàm ĐÃ ĐƯỢC decorate (cách sử dụng mong muốn)
  2. Yêu cầu GenAI sinh code cho decorator còn thiếu
- Điều này giúp LLM hiểu chính xác context và interface cần thiết

Minh họa gọi OpenAI API với system/user prompt.
"""

# =====================================================
# INVERSE COT PROMPT TEMPLATE
# =====================================================

INVERSE_COT_SYSTEM_PROMPT = """You are a Python expert. You will be given:
1. DECORATED_FUNCTION: A function that uses decorators which don't exist yet
2. TASK: Implement the missing decorators

Rules:
- Return ONLY Python code
- Include all necessary imports
- Follow PEP 8 style
- Use functools.wraps for all decorators
- Include logging with the logging module
"""

INVERSE_COT_USER_PROMPT = """
### DECORATED_FUNCTION ###
The following function uses three decorators that need to be implemented:

```python
@handle_errors(default_return=[])
@log_execution
@monitor_time(threshold=0.05)
def fizzbuzz(n: int) -> list:
    if not isinstance(n, int):
        raise TypeError(f"Expected int, got {type(n)}")
    if n <= 0:
        raise ValueError(f"Expected positive int, got {n}")
    results = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            results.append("FizzBuzz")
        elif i % 3 == 0:
            results.append("Fizz")
        elif i % 5 == 0:
            results.append("Buzz")
        else:
            results.append(str(i))
    return results
```

### TASK ###
Implement the three missing decorators:
1. `handle_errors(default_return)` - catches exceptions, logs them, returns default_return
2. `log_execution` - logs function name, args when called and when completed
3. `monitor_time(threshold)` - measures execution time, warns if above threshold
"""


def build_openai_api_request():
    """
    Xây dựng cấu trúc request cho OpenAI API.
    Minh họa cách sử dụng Inverse CoT prompt.
    """
    request_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": INVERSE_COT_SYSTEM_PROMPT},
            {"role": "user", "content": INVERSE_COT_USER_PROMPT}
        ],
        "temperature": 0.2,
        "max_tokens": 2000
    }
    return request_body


def call_openai_api():
    """
    Gọi OpenAI API với Inverse CoT prompt.
    
    LƯU Ý: Bỏ comment và thêm API key để chạy thực tế.
    """
    # from openai import OpenAI
    # client = OpenAI()  # Cần OPENAI_API_KEY environment variable
    
    request = build_openai_api_request()
    
    # response = client.chat.completions.create(**request)
    # generated_code = response.choices[0].message.content
    # print(generated_code)
    
    print("OpenAI API Request Structure:")
    print(f"  Model: {request['model']}")
    print(f"  Temperature: {request['temperature']}")
    print(f"  Messages: {len(request['messages'])}")
    print(f"    - System: {len(request['messages'][0]['content'])} chars")
    print(f"    - User: {len(request['messages'][1]['content'])} chars")
    print(f"  Max tokens: {request['max_tokens']}")
    return request


# =====================================================
# SO SÁNH: PROMPT THÔNG THƯỜNG vs INVERSE COT
# =====================================================

NORMAL_PROMPT = """
Write Python decorators for logging, monitoring, and error handling.
They should work with a FizzBuzz function.
"""

INVERSE_COT_PROMPT_SHORT = """
Given this decorated function:

@handle_errors(default_return=[])
@log_execution  
@monitor_time(threshold=0.05)
def fizzbuzz(n: int) -> list:
    ...

Implement the three decorators: handle_errors, log_execution, monitor_time.
"""


def compare_prompt_approaches():
    """
    So sánh hai cách tiếp cận prompt:
    1. Prompt thông thường: Mô tả yêu cầu chung
    2. Inverse CoT: Cung cấp hàm đã decorate, yêu cầu sinh decorator
    """
    print("\n" + "=" * 60)
    print("SO SÁNH PROMPT APPROACHES")
    print("=" * 60)

    print("\n--- Approach 1: Normal Prompt ---")
    print(f"Length: {len(NORMAL_PROMPT)} chars")
    print("Vấn đề:")
    print("  - Thiếu context cụ thể về interface")
    print("  - LLM có thể sinh decorator không khớp với cách sử dụng")
    print("  - Kết quả không nhất quán giữa các lần gọi")

    print("\n--- Approach 2: Inverse CoT Prompt ---")
    print(f"Length: {len(INVERSE_COT_USER_PROMPT)} chars")
    print("Ưu điểm:")
    print("  - LLM thấy chính xác cách decorator được sử dụng")
    print("  - Interface (tham số, decorator factory vs simple) rõ ràng")
    print("  - Kết quả nhất quán và khớp với code hiện có")
    print("  - Nguyên tắc 5S: Structured, Surrounding, Single, Specific, Short")


# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Lab 15.4: Inverse CoT với OpenAI API")
    print("=" * 60)

    # Demo API request structure
    print("\n--- API Request Structure ---")
    request = call_openai_api()

    # So sánh prompt approaches
    compare_prompt_approaches()

    print("\n" + "=" * 60)
    print("Để chạy thực tế, uncomment code trong call_openai_api()")
    print("và đảm bảo biến OPENAI_API_KEY đã được thiết lập.")
    print("=" * 60)
