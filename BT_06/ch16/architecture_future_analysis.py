"""
Chapter 16 - Architecture, Design, and the Future
Demo: Phân tích kinh tế phát triển phần mềm và Vibe Coding

Chương 16 chủ yếu là lý thuyết, thảo luận về:
- Sự phát triển nhanh chóng của GenAI
- Kinh tế học phát triển phần mềm nhanh hơn
- Bối cảnh thay đổi của lập trình viên
- GenAI trong SWEBOK (Software Engineering Body of Knowledge)
- Vibe Coding và tương lai GenAI

Code minh họa dưới đây cho thấy cách GenAI thay đổi quy trình SDLC
và so sánh năng suất trước/sau GenAI.
"""

import time
from dataclasses import dataclass
from typing import Dict, List


# =====================================================
# PHẦN 1: MÔ HÌNH HÓA CHI PHÍ PHÁT TRIỂN PHẦN MỀM
# =====================================================

@dataclass
class DevelopmentTask:
    """Mô tả một tác vụ phát triển phần mềm."""
    name: str
    hours_without_ai: float
    hours_with_ai: float
    sdlc_phase: str

    @property
    def time_saved_percent(self) -> float:
        if self.hours_without_ai == 0:
            return 0.0
        return ((self.hours_without_ai - self.hours_with_ai)
                / self.hours_without_ai * 100)


def analyze_productivity_gains():
    """
    Phân tích năng suất phát triển phần mềm trước và sau GenAI.
    Dựa trên dữ liệu từ sách và các nghiên cứu của McKinsey.
    """
    tasks = [
        DevelopmentTask("Viết code mới", 8, 4, "Implementation"),
        DevelopmentTask("Code review", 3, 1.5, "Verification"),
        DevelopmentTask("Debug lỗi", 4, 2, "Maintenance"),
        DevelopmentTask("Viết unit test", 3, 1, "Testing"),
        DevelopmentTask("Viết tài liệu", 2, 0.5, "Documentation"),
        DevelopmentTask("Refactoring", 4, 2, "Maintenance"),
        DevelopmentTask("Tối ưu hiệu suất", 5, 3, "Optimization"),
        DevelopmentTask("Logging & Monitoring", 3, 1.5, "Operations"),
        DevelopmentTask("Thiết kế kiến trúc", 6, 5, "Design"),
        DevelopmentTask("Tạo file cấu hình", 2, 0.5, "Deployment"),
    ]

    total_without = sum(t.hours_without_ai for t in tasks)
    total_with = sum(t.hours_with_ai for t in tasks)
    overall_saving = (total_without - total_with) / total_without * 100

    print("=" * 70)
    print("PHÂN TÍCH NĂNG SUẤT PHÁT TRIỂN PHẦN MỀM VỚI GenAI")
    print("=" * 70)
    print(f"\n{'Tác vụ':<25} {'Không AI (h)':<15} {'Có AI (h)':<12} {'Tiết kiệm':<10} {'Pha SDLC'}")
    print("-" * 70)

    for task in tasks:
        print(
            f"{task.name:<25} {task.hours_without_ai:<15.1f} "
            f"{task.hours_with_ai:<12.1f} {task.time_saved_percent:<10.0f}% "
            f"{task.sdlc_phase}"
        )

    print("-" * 70)
    print(f"{'TỔNG':<25} {total_without:<15.1f} {total_with:<12.1f} {overall_saving:.0f}%")
    print(f"\nKết luận: GenAI giúp tiết kiệm ~{overall_saving:.0f}% thời gian phát triển tổng thể")
    print(f"Tương đương hoàn thành 2x công việc trong cùng thời gian.")

    return tasks


# =====================================================
# PHẦN 2: PHÂN TÍCH THEO CÁC PHA SDLC
# =====================================================

def analyze_by_sdlc_phase(tasks: List[DevelopmentTask]):
    """
    Phân tích tác động của GenAI theo từng pha trong SDLC.
    Liên hệ với SWEBOK (Software Engineering Body of Knowledge).
    """
    phases: Dict[str, dict] = {}
    for task in tasks:
        if task.sdlc_phase not in phases:
            phases[task.sdlc_phase] = {
                "without_ai": 0,
                "with_ai": 0,
                "tasks": []
            }
        phases[task.sdlc_phase]["without_ai"] += task.hours_without_ai
        phases[task.sdlc_phase]["with_ai"] += task.hours_with_ai
        phases[task.sdlc_phase]["tasks"].append(task.name)

    print("\n" + "=" * 70)
    print("PHÂN TÍCH THEO PHA SDLC (SWEBOK Knowledge Areas)")
    print("=" * 70)

    swebok_mapping = {
        "Design": "Software Design (KA 2)",
        "Implementation": "Software Construction (KA 3)",
        "Testing": "Software Testing (KA 4)",
        "Maintenance": "Software Maintenance (KA 5)",
        "Verification": "Software Quality (KA 10)",
        "Documentation": "Software Engineering Models (KA 9)",
        "Optimization": "Software Engineering Process (KA 8)",
        "Operations": "Software Engineering Management (KA 7)",
        "Deployment": "Software Configuration Mgmt (KA 6)",
    }

    for phase, data in phases.items():
        saving = (data["without_ai"] - data["with_ai"]) / data["without_ai"] * 100
        swebok = swebok_mapping.get(phase, "N/A")
        print(f"\n  {phase} ({swebok})")
        print(f"    Trước AI: {data['without_ai']:.1f}h | Sau AI: {data['with_ai']:.1f}h | Tiết kiệm: {saving:.0f}%")
        print(f"    Tác vụ: {', '.join(data['tasks'])}")


# =====================================================
# PHẦN 3: KINH TẾ HỌC - ROI CỦA GENAI
# =====================================================

def calculate_roi():
    """
    Tính toán ROI (Return on Investment) cho việc áp dụng GenAI.
    Dựa trên chi phí công cụ vs. giá trị thời gian tiết kiệm.
    """
    print("\n" + "=" * 70)
    print("KINH TẾ HỌC: ROI CỦA GENAI TOOLS")
    print("=" * 70)

    # Giả định
    developer_hourly_rate = 50  # USD/giờ
    monthly_dev_hours = 160  # giờ/tháng
    productivity_gain = 0.50  # 50% nhanh hơn

    # Chi phí công cụ (USD/tháng)
    tools_cost = {
        "GitHub Copilot Business": 19,
        "ChatGPT Plus": 20,
        "OpenAI API (ước tính)": 30,
    }

    total_tools_cost = sum(tools_cost.values())
    hours_saved_per_month = monthly_dev_hours * productivity_gain
    value_of_saved_time = hours_saved_per_month * developer_hourly_rate
    roi = ((value_of_saved_time - total_tools_cost) / total_tools_cost) * 100

    print(f"\n  Chi phí lập trình viên: ${developer_hourly_rate}/giờ")
    print(f"  Giờ làm việc/tháng: {monthly_dev_hours}h")
    print(f"  Tăng năng suất ước tính: {productivity_gain*100:.0f}%")

    print(f"\n  Chi phí công cụ GenAI/tháng:")
    for tool, cost in tools_cost.items():
        print(f"    - {tool}: ${cost}")
    print(f"    TỔNG: ${total_tools_cost}/tháng")

    print(f"\n  Giá trị tạo ra:")
    print(f"    - Giờ tiết kiệm/tháng: {hours_saved_per_month:.0f}h")
    print(f"    - Giá trị thời gian: ${value_of_saved_time:,.0f}/tháng")
    print(f"    - ROI: {roi:.0f}%")
    print(f"\n  => Mỗi $1 đầu tư tạo ra ~${value_of_saved_time/total_tools_cost:.0f} giá trị")


# =====================================================
# PHẦN 4: VIBE CODING - MINH HỌA KHÁI NIỆM
# =====================================================

def demonstrate_vibe_coding():
    """
    Minh họa khái niệm Vibe Coding - phong cách lập trình mới
    được giới thiệu bởi Andrej Karpathy (2025).
    
    Vibe Coding = mô tả ý tưởng bằng ngôn ngữ tự nhiên,
    để AI tạo toàn bộ code mà không cần kiểm tra chi tiết.
    """
    print("\n" + "=" * 70)
    print("VIBE CODING - PHONG CÁCH LẬP TRÌNH MỚI")
    print("=" * 70)

    vibe_coding_levels = {
        "Level 1 - Code Completion": {
            "description": "AI hoàn thiện dòng code đang viết",
            "tool": "GitHub Copilot (inline)",
            "human_control": "Cao - xem xét từng gợi ý",
            "example": "Viết tên hàm → Copilot gợi ý body"
        },
        "Level 2 - Code Generation": {
            "description": "AI sinh hàm/module từ prompt",
            "tool": "ChatGPT, OpenAI API",
            "human_control": "Trung bình - review code sinh ra",
            "example": "Prompt: 'Viết hàm sort' → AI sinh thuật toán"
        },
        "Level 3 - Vibe Coding": {
            "description": "Mô tả ý tưởng, AI làm hết",
            "tool": "ChatGPT + Agent, Cursor, Replit",
            "human_control": "Thấp - tin tưởng AI output",
            "example": "'Tạo app todo' → AI sinh toàn bộ project"
        },
        "Level 4 - Agentic Coding": {
            "description": "AI agents tự lập kế hoạch và triển khai",
            "tool": "Devin, SWE-agent, Claude Code",
            "human_control": "Rất thấp - giám sát ở mức cao",
            "example": "'Fix all bugs in repo' → Agent tự tìm và sửa"
        }
    }

    for level, details in vibe_coding_levels.items():
        print(f"\n  {level}")
        for key, value in details.items():
            print(f"    {key}: {value}")

    print("\n  Cảnh báo về Vibe Coding:")
    print("    - Phù hợp cho prototype, side project")
    print("    - KHÔNG phù hợp cho production code quan trọng")
    print("    - Thiếu kiểm tra → tiềm ẩn lỗi bảo mật")
    print("    - Nợ kỹ thuật tăng nhanh nếu không review")


# =====================================================
# PHẦN 5: TƯƠNG LAI CỦA GENAI TRONG PHÁT TRIỂN PHẦN MỀM
# =====================================================

def discuss_future():
    """
    Thảo luận về tương lai của GenAI trong phát triển phần mềm.
    """
    print("\n" + "=" * 70)
    print("TƯƠNG LAI CỦA GENAI TRONG PHÁT TRIỂN PHẦN MỀM")
    print("=" * 70)

    predictions = {
        "Ngắn hạn (1-2 năm)": [
            "GenAI trở thành công cụ tiêu chuẩn cho mọi developer",
            "IDE tích hợp AI sâu hơn (copilot trong mọi khía cạnh)",
            "Vibe coding phổ biến cho prototyping và MVP",
            "Fine-tuning trở nên dễ tiếp cận hơn cho doanh nghiệp",
        ],
        "Trung hạn (3-5 năm)": [
            "AI agents tự động hóa phần lớn các tác vụ lặp lại",
            "Ngôn ngữ lập trình mới tối ưu cho AI collaboration",
            "Dân chủ hóa phát triển phần mềm - nhiều người hơn có thể code",
            "Quy trình SDLC được thiết kế lại xung quanh AI",
        ],
        "Dài hạn (5+ năm)": [
            "AI có thể tự phát triển và bảo trì hệ thống phức tạp",
            "Vai trò developer chuyển sang 'AI supervisor'",
            "Legacy code được tự động hiện đại hóa bởi AI",
            "Rủi ro và governance trở thành ưu tiên hàng đầu",
        ]
    }

    for timeline, items in predictions.items():
        print(f"\n  {timeline}:")
        for i, item in enumerate(items, 1):
            print(f"    {i}. {item}")

    print("\n  Câu hỏi then chốt: AI có thay thế lập trình viên?")
    print("    → KHÔNG thay thế, nhưng thay đổi vai trò")
    print("    → Developer cần skill mới: prompt engineering, AI governance")
    print("    → 'AI-augmented developer' là mô hình tương lai")

    # Rủi ro và Governance
    print("\n  Rủi ro và Governance:")
    risks = [
        "Bảo mật: code sinh bởi AI có thể chứa lỗ hổng",
        "Bản quyền: vấn đề pháp lý với code được train từ open source",
        "Phụ thuộc: over-reliance vào AI dẫn đến mất kỹ năng cơ bản",
        "Chất lượng: hallucination có thể tạo code sai nhưng trông hợp lý",
        "Chi phí: chi phí compute AI tăng 89% từ 2023-2025",
    ]
    for i, risk in enumerate(risks, 1):
        print(f"    {i}. {risk}")


# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":
    print("*" * 70)
    print("CHƯƠNG 16: KIẾN TRÚC, THIẾT KẾ VÀ TƯƠNG LAI")
    print("Supercharged Coding with GenAI")
    print("*" * 70)

    # Phần 1 & 2: Phân tích năng suất
    tasks = analyze_productivity_gains()
    analyze_by_sdlc_phase(tasks)

    # Phần 3: ROI
    calculate_roi()

    # Phần 4: Vibe Coding
    demonstrate_vibe_coding()

    # Phần 5: Tương lai
    discuss_future()

    print("\n" + "*" * 70)
    print("KẾT THÚC DEMO CHƯƠNG 16")
    print("*" * 70)
