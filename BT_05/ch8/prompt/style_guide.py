import numpy as np

# Ham tinh dien tich hinh tron co type hints
def get_area(
    radius: float,
) -> float:
    area: float = np.pi * radius ** 2
    return area

# Ham tinh trung binh cong co type hints
def get_arithmetic_mean(
    x1: float,
    x2: float,
) -> float:
    arithmetic_mean: float = (x1 + x2) / 2
    return arithmetic_mean