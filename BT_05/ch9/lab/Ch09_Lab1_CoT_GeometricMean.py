# Lab 1: Trien khai Chain of Thought (CoT)
# Ket qua sinh ra tu ChatGPT dua tren CoT Prompt

import numpy as np
from typing import Dict

# Buoc 1: Chuyen doi Net Return sang Gross Return
def get_gross_returns(net_returns: Dict[str, float]) -> np.ndarray:
    return np.array([1 + return_value for return_value in net_returns.values()])

# Buoc 2: Tinh trung binh nhan (Geometric Mean)
def get_geometric_mean(gross_returns: np.ndarray) -> float:
    return np.prod(gross_returns) ** (1 / len(gross_returns))

# Buoc 3: Chuyen doi nguoc lai thanh Net Average Return
def get_net_average(gross_average: float) -> float:
    return gross_average - 1

# Ham chinh (Kien truc duoc dinh nghia san trong Prompt)
def get_average_return(net_returns: Dict[str, float]) -> float:
    gross_returns: np.ndarray = get_gross_returns(net_returns)
    gross_average: float = get_geometric_mean(gross_returns)
    net_average: float = get_net_average(gross_average)
    return net_average