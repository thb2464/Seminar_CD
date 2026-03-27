"""
Chapter 15 - Going Live with GenAI: Logging, Monitoring, and Errors
Lab 15.3: Few-shot Learning và Fine-tuning cho Decorator Style

Minh họa cách sử dụng:
1. Few-shot learning với ChatGPT/OpenAI API để sinh decorator theo phong cách nhất quán
2. Fine-tuning data (JSONL) để huấn luyện mô hình sinh decorator chuẩn
3. Prompt templates cho GitHub Copilot
"""

import json

# =====================================================
# PHẦN 1: FEW-SHOT PROMPT CHO CHATGPT / OPENAI API
# =====================================================

# Prompt few-shot để yêu cầu GenAI sinh decorator theo phong cách chuẩn
FEW_SHOT_PROMPT = """
You are a Python developer specializing in production-ready code.
Generate decorators following this exact style:

### EXAMPLE 1: Logging Decorator ###
```python
def log_execution(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"CALLING {func.__name__} | args={args}")
        result = func(*args, **kwargs)
        logger.info(f"COMPLETED {func.__name__}")
        return result
    return wrapper
```

### EXAMPLE 2: Timing Decorator ###
```python
def monitor_time(threshold=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            if elapsed > threshold:
                logger.warning(f"SLOW: {func.__name__} took {elapsed:.4f}s")
            return result
        return wrapper
    return decorator
```

### TASK ###
Now generate a decorator called `rate_limiter` that:
- Limits function calls to max N calls per minute
- Logs when rate limit is exceeded
- Follows the same style as examples above
"""


# =====================================================
# PHẦN 2: OPENAI API CALL VỚI FEW-SHOT LEARNING
# =====================================================

def call_openai_few_shot():
    """
    Minh họa cách gọi OpenAI API với few-shot examples
    để sinh decorator theo phong cách nhất quán.
    
    LƯU Ý: Cần cài đặt openai package và có API key.
    Đoạn code dưới đây là minh họa cấu trúc prompt.
    """
    # from openai import OpenAI
    # client = OpenAI()

    messages = [
        {
            "role": "system",
            "content": (
                "You are a Python code generator. Generate only code, "
                "no explanations. Follow the decorator style shown in examples."
            )
        },
        # Few-shot example 1: Log decorator
        {
            "role": "user",
            "content": "Generate a logging decorator called log_execution"
        },
        {
            "role": "assistant",
            "content": """import functools
import logging

logger = logging.getLogger(__name__)

def log_execution(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"CALLING {func.__name__} | args={args}")
        result = func(*args, **kwargs)
        logger.info(f"COMPLETED {func.__name__}")
        return result
    return wrapper"""
        },
        # Few-shot example 2: Timer decorator
        {
            "role": "user",
            "content": "Generate a timing decorator called monitor_time with threshold parameter"
        },
        {
            "role": "assistant",
            "content": """import functools
import time
import logging

logger = logging.getLogger(__name__)

def monitor_time(threshold=0.1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            if elapsed > threshold:
                logger.warning(f"SLOW: {func.__name__} took {elapsed:.4f}s")
            return result
        return wrapper
    return decorator"""
        },
        # Yêu cầu thực tế
        {
            "role": "user",
            "content": "Generate a retry decorator called retry_on_failure with max_retries and delay parameters"
        }
    ]

    # response = client.chat.completions.create(
    #     model="gpt-4o-mini",
    #     messages=messages,
    #     temperature=0.2
    # )
    # print(response.choices[0].message.content)

    print("Few-shot prompt structure:")
    print(f"  - System message: 1")
    print(f"  - Few-shot examples: 2 pairs (user + assistant)")
    print(f"  - Actual request: 1")
    print(f"  - Total messages: {len(messages)}")
    return messages


# =====================================================
# PHẦN 3: FINE-TUNING DATA (JSONL FORMAT)
# =====================================================

def generate_fine_tuning_data():
    """
    Tạo dữ liệu JSONL cho fine-tuning mô hình
    sinh decorator theo phong cách chuẩn.
    
    Bao gồm cả positive examples (weight=1)
    và negative examples (weight=0).
    """
    training_examples = [
        # Example 1: Positive - chỉ code, đúng phong cách (weight=1)
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You generate Python decorators. Return only code."
                },
                {
                    "role": "user",
                    "content": "Generate a caching decorator called cache_result"
                },
                {
                    "role": "assistant",
                    "content": """import functools
import logging

logger = logging.getLogger(__name__)

def cache_result(func):
    cache = {}
    @functools.wraps(func)
    def wrapper(*args):
        if args in cache:
            logger.info(f"CACHE HIT: {func.__name__} | args={args}")
            return cache[args]
        logger.info(f"CACHE MISS: {func.__name__} | args={args}")
        result = func(*args)
        cache[args] = result
        return result
    return wrapper""",
                    "weight": 1
                }
            ]
        },
        # Example 2: Negative - có giải thích dài dòng (weight=0)
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You generate Python decorators. Return only code."
                },
                {
                    "role": "user",
                    "content": "Generate a validation decorator called validate_input"
                },
                {
                    "role": "assistant",
                    "content": """Sure! Here's a validation decorator that checks input types:

A decorator is a design pattern in Python that allows you to modify the behavior of a function. This particular decorator validates that all arguments are of the expected types.

```python
import functools

def validate_input(*types):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for arg, expected_type in zip(args, types):
                if not isinstance(arg, expected_type):
                    raise TypeError(f"Expected {expected_type}, got {type(arg)}")
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

This decorator takes type arguments and checks each function argument against the expected types. If a mismatch is found, it raises a TypeError.""",
                    "weight": 0
                }
            ]
        },
        # Example 3: Positive - chỉ code, đúng phong cách (weight=1)
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You generate Python decorators. Return only code."
                },
                {
                    "role": "user",
                    "content": "Generate a validation decorator called validate_input"
                },
                {
                    "role": "assistant",
                    "content": """import functools
import logging

logger = logging.getLogger(__name__)

def validate_input(*types):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i, (arg, expected) in enumerate(zip(args, types)):
                if not isinstance(arg, expected):
                    logger.error(f"VALIDATION FAILED: {func.__name__} arg[{i}] expected {expected}, got {type(arg)}")
                    raise TypeError(f"Expected {expected.__name__}, got {type(arg).__name__}")
            logger.info(f"VALIDATION PASSED: {func.__name__}")
            return func(*args, **kwargs)
        return wrapper
    return decorator""",
                    "weight": 1
                }
            ]
        },
        # Example 4: Positive - retry decorator (weight=1)
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You generate Python decorators. Return only code."
                },
                {
                    "role": "user",
                    "content": "Generate a retry decorator called retry_on_failure"
                },
                {
                    "role": "assistant",
                    "content": """import functools
import time
import logging

logger = logging.getLogger(__name__)

def retry_on_failure(max_retries=3, delay=1.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    logger.info(f"SUCCESS: {func.__name__} on attempt {attempt}")
                    return result
                except Exception as e:
                    logger.warning(f"RETRY {attempt}/{max_retries}: {func.__name__} failed with {e}")
                    if attempt == max_retries:
                        logger.error(f"FAILED: {func.__name__} after {max_retries} attempts")
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator""",
                    "weight": 1
                }
            ]
        },
        # Example 5: Negative - có markdown formatting (weight=0)
        {
            "messages": [
                {
                    "role": "system",
                    "content": "You generate Python decorators. Return only code."
                },
                {
                    "role": "user",
                    "content": "Generate a rate limiter decorator called rate_limit"
                },
                {
                    "role": "assistant",
                    "content": """# Rate Limiter Decorator

Here's a rate limiter that restricts how often a function can be called:

## Implementation

```python
import functools
import time

def rate_limit(max_calls=10, period=60):
    \"\"\"
    A rate limiter decorator.
    
    Args:
        max_calls: Maximum number of calls allowed
        period: Time period in seconds
    \"\"\"
    def decorator(func):
        calls = []
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            calls[:] = [c for c in calls if now - c < period]
            if len(calls) >= max_calls:
                raise RuntimeError("Rate limit exceeded")
            calls.append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

## Usage
Just add `@rate_limit(max_calls=5, period=60)` above your function.""",
                    "weight": 0
                }
            ]
        },
    ]

    # Ghi ra file JSONL
    output_file = "ch15_fine_tuning.jsonl"
    with open(output_file, 'w') as f:
        for example in training_examples:
            f.write(json.dumps(example) + '\n')

    print(f"Generated {len(training_examples)} training examples")
    print(f"  - Positive (weight=1): {sum(1 for e in training_examples if e['messages'][-1].get('weight', 1) == 1)}")
    print(f"  - Negative (weight=0): {sum(1 for e in training_examples if e['messages'][-1].get('weight', 1) == 0)}")
    print(f"  - Output file: {output_file}")
    return output_file


# =====================================================
# PHẦN 4: GITHUB COPILOT FEW-SHOT STYLE
# =====================================================

# Đoạn code dưới đây minh họa cách viết "skeleton code"
# để GitHub Copilot hiểu phong cách decorator mong muốn

# --- Few-shot examples cho Copilot (viết sẵn) ---
import functools
import time
import logging

logger = logging.getLogger(__name__)


def log_execution(func):
    """Decorator: log function calls and results."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"CALLING {func.__name__} | args={args}")
        result = func(*args, **kwargs)
        logger.info(f"COMPLETED {func.__name__}")
        return result
    return wrapper


def monitor_time(threshold=0.1):
    """Decorator factory: monitor execution time with threshold alert."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            if elapsed > threshold:
                logger.warning(f"SLOW: {func.__name__} took {elapsed:.4f}s")
            return result
        return wrapper
    return decorator


# --- Copilot sẽ tự sinh code cho decorator dưới đây ---
# --- dựa trên ngữ cảnh từ 2 decorator ở trên ---
def count_calls(func):
    """Decorator: count how many times a function is called."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.call_count += 1
        logger.info(f"CALL COUNT: {func.__name__} called {wrapper.call_count} times")
        result = func(*args, **kwargs)
        return result
    wrapper.call_count = 0
    return wrapper


# =====================================================
# MAIN - CHẠY THỬ
# =====================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Lab 15.3: Few-shot Learning & Fine-tuning cho Decorators")
    print("=" * 60)

    # Demo few-shot prompt
    print("\n--- Phần 1: Few-shot Prompt Structure ---")
    messages = call_openai_few_shot()

    # Demo fine-tuning data generation
    print("\n--- Phần 2: Fine-tuning Data Generation ---")
    output_file = generate_fine_tuning_data()

    # Demo Copilot-generated decorator
    print("\n--- Phần 3: Copilot-style Decorator Demo ---")

    @count_calls
    @log_execution
    @monitor_time(threshold=0.01)
    def fibonacci(n):
        if n <= 1:
            return n
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b

    for i in range(5):
        result = fibonacci(30)
    print(f"\nfibonacci was called {fibonacci.call_count} times")
