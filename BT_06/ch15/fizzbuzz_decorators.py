"""
Chapter 15 - Going Live with GenAI: Logging, Monitoring, and Errors
Lab 15.2: Tách trách nhiệm với Decorator Pattern (Inverse CoT)

Áp dụng kỹ thuật Inverse CoT (Chain-of-Thought ngược):
- Bắt đầu từ hàm FizzBuzz đã được "trang trí" (decorated)
- Yêu cầu GenAI sinh code cho các decorator còn thiếu
- Tách biệt logging, monitoring, error handling khỏi business logic

Các decorator được tạo ra bao gồm:
1. @log_execution: Ghi nhật ký đầu vào/đầu ra
2. @monitor_time: Đo và giám sát thời gian thực thi  
3. @handle_errors: Xử lý ngoại lệ và trả về giá trị mặc định
"""

import logging
import time
import functools
from typing import Callable, Any

# ===== LOGGING CONFIGURATION =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ===== DECORATOR 1: LOG EXECUTION =====
def log_execution(func: Callable) -> Callable:
    """
    Decorator ghi nhật ký khi hàm được gọi và khi hoàn thành.
    Ghi lại tên hàm, tham số đầu vào, và kết quả trả về.
    
    Đây là decorator được GenAI sinh ra từ Inverse CoT prompt:
    CONTEXT: Hàm fizzbuzz đã được decorate với @log_execution
    TASK: Implement decorator log_execution
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(
            f"CALLING {func.__name__} | "
            f"args={args} | kwargs={kwargs}"
        )
        try:
            result = func(*args, **kwargs)
            logger.info(
                f"COMPLETED {func.__name__} | "
                f"result_type={type(result).__name__} | "
                f"result_length={len(result) if hasattr(result, '__len__') else 'N/A'}"
            )
            return result
        except Exception as e:
            logger.error(
                f"FAILED {func.__name__} | "
                f"error={type(e).__name__}: {e}"
            )
            raise
    return wrapper


# ===== DECORATOR 2: MONITOR TIME =====
def monitor_time(threshold: float = 0.1) -> Callable:
    """
    Decorator factory đo thời gian thực thi và cảnh báo
    nếu vượt ngưỡng cho phép.
    
    Args:
        threshold: Ngưỡng thời gian (giây). Mặc định 0.1s.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time

            if elapsed > threshold:
                logger.warning(
                    f"SLOW EXECUTION: {func.__name__} took {elapsed:.4f}s "
                    f"(threshold: {threshold}s)"
                )
            else:
                logger.info(
                    f"PERFORMANCE OK: {func.__name__} took {elapsed:.4f}s"
                )
            return result
        return wrapper
    return decorator


# ===== DECORATOR 3: HANDLE ERRORS =====
def handle_errors(default_return: Any = None) -> Callable:
    """
    Decorator factory xử lý ngoại lệ, ghi log lỗi,
    và trả về giá trị mặc định thay vì crash.
    
    Args:
        default_return: Giá trị trả về khi có lỗi. Mặc định None.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except TypeError as e:
                logger.error(
                    f"TYPE ERROR in {func.__name__}: {e} | "
                    f"Returning default: {default_return}"
                )
                return default_return
            except ValueError as e:
                logger.error(
                    f"VALUE ERROR in {func.__name__}: {e} | "
                    f"Returning default: {default_return}"
                )
                return default_return
            except Exception as e:
                logger.error(
                    f"UNEXPECTED ERROR in {func.__name__}: "
                    f"{type(e).__name__}: {e} | "
                    f"Returning default: {default_return}"
                )
                return default_return
        return wrapper
    return decorator


# ===== FIZZBUZZ VỚI DECORATORS (SAU KHI TÁI CẤU TRÚC) =====
@handle_errors(default_return=[])
@log_execution
@monitor_time(threshold=0.05)
def fizzbuzz(n: int) -> list:
    """
    Hàm FizzBuzz sạch - chỉ chứa business logic.
    Logging, monitoring, error handling đã được tách
    ra các decorator riêng biệt.
    """
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


# ===== MAIN =====
if __name__ == "__main__":
    print("=" * 60)
    print("Lab 15.2: FizzBuzz với Decorators (Inverse CoT)")
    print("=" * 60)

    # Test 1: Input hợp lệ
    print("\n--- Test 1: n=15 (hợp lệ) ---")
    result = fizzbuzz(15)
    print(f"Output: {result}")

    # Test 2: Input sai kiểu - decorator xử lý lỗi
    print("\n--- Test 2: n='hello' (TypeError) ---")
    result = fizzbuzz("hello")
    print(f"Output (default): {result}")

    # Test 3: Input âm - decorator xử lý lỗi
    print("\n--- Test 3: n=-10 (ValueError) ---")
    result = fizzbuzz(-10)
    print(f"Output (default): {result}")

    # Test 4: Input lớn - kiểm tra performance monitoring
    print("\n--- Test 4: n=500000 (large input) ---")
    result = fizzbuzz(500000)
    print(f"Output length: {len(result)}")

    print("\n" + "=" * 60)
    print("Kiểm tra file fizzbuzz.log để xem chi tiết nhật ký.")
    print("=" * 60)
