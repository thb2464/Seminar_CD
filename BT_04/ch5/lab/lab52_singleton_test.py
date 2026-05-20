# -*- coding: utf-8 -*-
"""Lab 5.2 — Sinh ca kiểm thử cho mẫu thiết kế Singleton.

Minh họa việc dùng GenAI để sinh ca kiểm thử: lớp Singleton (cài bằng
metaclass) được kiểm chứng bằng các ca unittest. Tệp này là Python
thuần — chạy được mà không cần khóa API.
"""
import sys
import unittest

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")  # unittest in ket qua ra stderr
except Exception:
    pass


class Singleton(type):
    """Metaclass bảo đảm mỗi lớp dùng nó chỉ có một thể hiện duy nhất."""

    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Environment(metaclass=Singleton):
    """Cấu hình môi trường — chỉ tồn tại một thể hiện trong toàn ứng dụng."""

    def __init__(self, name: str = "Production"):
        self.name = name


class TestSingleton(unittest.TestCase):
    """Các ca kiểm thử cho hành vi của mẫu Singleton."""

    def test_returns_same_instance(self):
        """Mọi lần khởi tạo phải trả về cùng một đối tượng."""
        self.assertIs(Environment(), Environment())

    def test_keeps_first_initialization(self):
        """Thể hiện đầu tiên được giữ lại; tham số ở lần sau bị bỏ qua."""
        first = Environment("Production")
        second = Environment("Development")
        self.assertEqual(first.name, second.name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
