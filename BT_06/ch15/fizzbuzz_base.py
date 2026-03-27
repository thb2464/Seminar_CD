"""
Chapter 15 - Going Live with GenAI: Logging, Monitoring, and Errors
Lab 15.1: FizzBuzz cơ bản với Logging, Monitoring và Error Handling

Mã nguồn minh họa bài toán FizzBuzz với các thành phần production:
- Logging: ghi nhật ký hoạt động
- Error Handling: xử lý đầu vào không hợp lệ
- Monitoring: đo thời gian thực thi
"""

import logging
import time

# ===== LOGGING CONFIGURATION =====
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fizzbuzz.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# ===== FIZZBUZZ CƠ BẢN (TRƯỚC KHI TÁI CẤU TRÚC) =====
def fizzbuzz_basic(n):
    """
    Hàm FizzBuzz cơ bản - monolithic, chưa tách trách nhiệm.
    Đây là phiên bản ban đầu trước khi áp dụng decorator pattern.
    """
    logger.info(f"FizzBuzz called with n={n}")
    start_time = time.time()

    # Xử lý đầu vào không hợp lệ
    if not isinstance(n, int):
        logger.error(f"Invalid input type: {type(n)}. Expected int.")
        raise TypeError(f"Expected int, got {type(n)}")

    if n <= 0:
        logger.warning(f"Non-positive input: n={n}. Returning empty list.")
        return []

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

    elapsed = time.time() - start_time
    logger.info(f"FizzBuzz completed in {elapsed:.6f}s. Generated {len(results)} items.")

    return results


# ===== MONITORING: ĐO THỜI GIAN THỰC THI =====
def monitor_performance(func_name, elapsed_time, threshold=0.1):
    """
    Hàm giám sát hiệu suất đơn giản.
    Cảnh báo nếu thời gian thực thi vượt ngưỡng.
    """
    if elapsed_time > threshold:
        logger.warning(
            f"PERFORMANCE ALERT: {func_name} took {elapsed_time:.4f}s "
            f"(threshold: {threshold}s)"
        )
    else:
        logger.info(f"PERFORMANCE OK: {func_name} took {elapsed_time:.4f}s")


# ===== MAIN =====
if __name__ == "__main__":
    print("=" * 50)
    print("Lab 15.1: FizzBuzz cơ bản với Logging & Monitoring")
    print("=" * 50)

    # Test case 1: Input hợp lệ
    print("\n--- Test 1: n=20 ---")
    result = fizzbuzz_basic(20)
    print(f"Result: {result}")

    # Test case 2: Input không hợp lệ - kiểu dữ liệu sai
    print("\n--- Test 2: Input không hợp lệ (string) ---")
    try:
        fizzbuzz_basic("abc")
    except TypeError as e:
        print(f"Caught error: {e}")

    # Test case 3: Input không hợp lệ - số âm
    print("\n--- Test 3: Input không hợp lệ (n=-5) ---")
    result = fizzbuzz_basic(-5)
    print(f"Result: {result}")

    # Test case 4: Performance monitoring
    print("\n--- Test 4: Performance monitoring ---")
    start = time.time()
    fizzbuzz_basic(100000)
    elapsed = time.time() - start
    monitor_performance("fizzbuzz_basic(100000)", elapsed, threshold=0.01)
