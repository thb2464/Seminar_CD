"""
Chương 10 - Unit Tests cho ứng dụng Manhattan Distance API
===========================================================
Kiểm thử sau tái cấu trúc để đảm bảo hành vi không thay đổi.
Đây là bước quan trọng trong quy trình refactoring.
"""

import json
import pytest
import numpy as np
from app import (
    app,
    get_manhattan_distance,
    get_euclidean_distance,
    parse_request_parameters,
)


@pytest.fixture
def client():
    """Tạo Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestDistanceFunctions:
    """Test trực tiếp các hàm tính khoảng cách."""

    def test_manhattan_distance_basic(self):
        a = np.array([[1, 2], [3, 4]])
        b = np.array([[2, 0], [1, 3]])
        result = get_manhattan_distance(a, b)
        # |1-2| + |2-0| + |3-1| + |4-3| = 1 + 2 + 2 + 1 = 6.0
        assert result == pytest.approx(6.0)

    def test_euclidean_distance_basic(self):
        a = np.array([[1, 2], [3, 4]])
        b = np.array([[2, 0], [1, 3]])
        result = get_euclidean_distance(a, b)
        # sqrt((1-2)^2 + (2-0)^2 + (3-1)^2 + (4-3)^2) = sqrt(1+4+4+1) = sqrt(10)
        assert result == pytest.approx(np.sqrt(10))

    def test_manhattan_zero_distance(self):
        a = np.array([[1, 2], [3, 4]])
        result = get_manhattan_distance(a, a)
        assert result == pytest.approx(0.0)

    def test_euclidean_zero_distance(self):
        a = np.array([[1, 2], [3, 4]])
        result = get_euclidean_distance(a, a)
        assert result == pytest.approx(0.0)

    def test_1d_arrays(self):
        a = np.array([3, 4])
        b = np.array([0, 0])
        assert get_euclidean_distance(a, b) == pytest.approx(5.0)
        assert get_manhattan_distance(a, b) == pytest.approx(7.0)


class TestAPIEndpoint:
    """Test API endpoint /distances."""

    def test_l1_distance(self, client):
        response = client.post("/distances", json={
            "distance": "L1",
            "df1": [[1, 2], [3, 4]],
            "df2": [[2, 0], [1, 3]],
        })
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["distance"] == pytest.approx(6.0)

    def test_l2_distance(self, client):
        response = client.post("/distances", json={
            "distance": "L2",
            "df1": [[1, 2], [3, 4]],
            "df2": [[2, 0], [1, 3]],
        })
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["distance"] == pytest.approx(np.sqrt(10))

    def test_invalid_distance_type(self, client):
        response = client.post("/distances", json={
            "distance": "L3",
            "df1": [[1, 2]],
            "df2": [[3, 4]],
        })
        assert response.status_code == 400

    def test_missing_fields(self, client):
        response = client.post("/distances", json={"distance": "L1"})
        assert response.status_code == 400

    def test_shape_mismatch(self, client):
        response = client.post("/distances", json={
            "distance": "L1",
            "df1": [[1, 2]],
            "df2": [[1, 2, 3]],
        })
        assert response.status_code == 400


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
