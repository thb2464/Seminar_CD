"""
Manhattan Distance API - Refactored Version
=============================================
Chương 10: Tái cấu trúc mã nguồn với GenAI

Ứng dụng Flask API tính khoảng cách Manhattan (L1) và Euclidean (L2)
giữa hai ma trận được cung cấp dưới dạng JSON.

Phiên bản này đã được tái cấu trúc từ mã gốc monolithic thành
kiến trúc modular với các hàm đơn nhiệm (Single Responsibility Principle).

Tác giả gốc: Hila Paz Herszfang & Peter V. Henstock
Phiên bản tái cấu trúc: Lab minh họa Chương 10
"""

import logging
from typing import Tuple, Callable, Optional

import numpy as np
from numpy.typing import NDArray
from flask import Flask, Request, request, jsonify, Response

# ===== Cấu hình Logging =====
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)


# =============================================================================
# Hàm tiện ích - Parse request
# =============================================================================
def parse_request_parameters(req: Request) -> Tuple[NDArray, NDArray, str]:
    """
    Phân tích tham số từ JSON request body.

    Args:
        req: Flask Request object chứa JSON với keys 'df1', 'df2', 'distance'

    Returns:
        Tuple gồm (ma_tran_a, ma_tran_b, loai_khoang_cach)

    Raises:
        ValueError: Nếu thiếu tham số hoặc ma trận không cùng kích thước
    """
    data = req.get_json()

    if data is None:
        raise ValueError("Request body must be valid JSON")

    dist_type = data.get("distance")
    raw_a = data.get("df1")
    raw_b = data.get("df2")

    if dist_type is None or raw_a is None or raw_b is None:
        raise ValueError("Missing required fields: 'distance', 'df1', 'df2'")

    a = np.array(raw_a, dtype=float)
    b = np.array(raw_b, dtype=float)

    if a.shape != b.shape:
        raise ValueError(
            f"Shape mismatch: df1 has shape {a.shape}, df2 has shape {b.shape}"
        )

    return a, b, dist_type


# =============================================================================
# Hàm tính khoảng cách
# =============================================================================
def get_manhattan_distance(a: NDArray, b: NDArray) -> float:
    """
    Tính khoảng cách Manhattan (L1) giữa hai ma trận.

    Khoảng cách Manhattan = Σ|aᵢ - bᵢ| (tổng giá trị tuyệt đối của hiệu)

    Args:
        a: Ma trận NumPy thứ nhất
        b: Ma trận NumPy thứ hai (cùng kích thước với a)

    Returns:
        Giá trị khoảng cách L1 (float)
    """
    logger.info("Computing L1 (Manhattan) distance...")
    return float(np.sum(np.abs(a - b)))


def get_euclidean_distance(a: NDArray, b: NDArray) -> float:
    """
    Tính khoảng cách Euclidean (L2) giữa hai ma trận.

    Khoảng cách Euclidean = √(Σ(aᵢ - bᵢ)²) (căn tổng bình phương hiệu)

    Phiên bản này đã được tối ưu bằng vector hóa NumPy
    thay vì vòng lặp for lồng nhau.

    Args:
        a: Ma trận NumPy thứ nhất
        b: Ma trận NumPy thứ hai (cùng kích thước với a)

    Returns:
        Giá trị khoảng cách L2 (float)
    """
    logger.info("Computing L2 (Euclidean) distance...")
    # Vectorized computation - thay thế vòng lặp for lồng nhau
    return float(np.sqrt(np.sum((a - b) ** 2)))


# =============================================================================
# Registry khoảng cách - Strategy Pattern
# =============================================================================
DISTANCE_FUNCTIONS: dict[str, Callable[[NDArray, NDArray], float]] = {
    "L1": get_manhattan_distance,
    "L2": get_euclidean_distance,
}


def get_distance_function(dist_type: str) -> Optional[Callable]:
    """
    Trả về hàm tính khoảng cách tương ứng với loại được yêu cầu.

    Args:
        dist_type: Loại khoảng cách ("L1" hoặc "L2")

    Returns:
        Hàm tính khoảng cách, hoặc None nếu loại không hợp lệ
    """
    return DISTANCE_FUNCTIONS.get(dist_type)


# =============================================================================
# API Route
# =============================================================================
@app.route("/distances", methods=["POST"])
def calculate_distance() -> Response:
    """
    API endpoint tính khoảng cách giữa hai ma trận.

    Request body (JSON):
        {
            "distance": "L1" hoặc "L2",
            "df1": [[1, 2], [3, 4]],
            "df2": [[2, 0], [1, 3]]
        }

    Returns:
        JSON response với khoảng cách đã tính hoặc thông báo lỗi
    """
    try:
        # Bước 1: Parse tham số từ request
        a, b, dist_type = parse_request_parameters(request)

        # Bước 2: Lấy hàm tính khoảng cách phù hợp
        dist_func = get_distance_function(dist_type)

        if dist_func is None:
            supported = ", ".join(DISTANCE_FUNCTIONS.keys())
            logger.warning(f"Invalid distance type requested: {dist_type}")
            return jsonify({
                "error": f"Invalid distance type: '{dist_type}'. Supported: {supported}"
            }), 400

        # Bước 3: Tính khoảng cách
        distance = dist_func(a, b)

        logger.info(f"Computed {dist_type} distance: {distance}")
        return jsonify({"distance": distance})

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# =============================================================================
# Health Check
# =============================================================================
@app.route("/health", methods=["GET"])
def health_check() -> Response:
    """Health check endpoint."""
    return jsonify({"status": "healthy", "supported_distances": list(DISTANCE_FUNCTIONS.keys())})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
