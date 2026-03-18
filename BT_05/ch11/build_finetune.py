"""
Chương 11 - Lab: Tinh chỉnh mô hình (Fine-tuning) với OpenAI API
=================================================================
Script này minh họa quy trình fine-tuning một mô hình LLM của OpenAI
để chuyên biệt hóa cho tác vụ sinh mã Python.

Quy trình gồm 4 bước:
1. Upload file dữ liệu huấn luyện JSONL lên OpenAI
2. Khởi tạo fine-tuning job
3. Theo dõi tiến trình huấn luyện
4. Sử dụng mô hình đã fine-tune

Yêu cầu:
- pip install openai
- Biến môi trường OPENAI_API_KEY đã được thiết lập
- File fine_tuning.jsonl trong cùng thư mục

Tác giả gốc: Hila Paz Herszfang & Peter V. Henstock
Phiên bản viết lại: Lab minh họa Chương 11
"""

import os
import time
import json
from pathlib import Path

from openai import OpenAI
from openai.types import FileObject
from openai.types.fine_tuning import FineTuningJob


# =============================================================================
# Cấu hình
# =============================================================================
BASE_MODEL = "gpt-4o-mini-2024-07-18"  # Model gốc dùng để fine-tune
TRAINING_FILE = "fine_tuning.jsonl"      # File dữ liệu huấn luyện
FINE_TUNING_METHOD = "dpo"               # Direct Preference Optimization


def validate_jsonl_file(filepath: str) -> int:
    """
    Kiểm tra tính hợp lệ của file JSONL trước khi upload.

    Args:
        filepath: Đường dẫn đến file JSONL

    Returns:
        Số lượng training examples trong file

    Raises:
        FileNotFoundError: Nếu file không tồn tại
        ValueError: Nếu file có dòng không hợp lệ
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Training file not found: {filepath}")

    count = 0
    with open(filepath, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                if "messages" not in data:
                    raise ValueError(f"Line {line_num}: Missing 'messages' field")
                messages = data["messages"]
                roles = [m["role"] for m in messages]
                if "system" not in roles or "user" not in roles or "assistant" not in roles:
                    raise ValueError(f"Line {line_num}: Must have system, user, and assistant roles")
                count += 1
            except json.JSONDecodeError:
                raise ValueError(f"Line {line_num}: Invalid JSON")

    print(f"[OK] Validated {count} training examples in {filepath}")
    return count


def upload_training_file(client: OpenAI, filepath: str) -> str:
    """
    Bước 1: Upload file dữ liệu huấn luyện lên OpenAI.

    Args:
        client: OpenAI client
        filepath: Đường dẫn file JSONL

    Returns:
        File ID từ OpenAI
    """
    print(f"\n{'='*60}")
    print("  BƯỚC 1: Upload file dữ liệu huấn luyện")
    print(f"{'='*60}")

    upload_response: FileObject = client.files.create(
        file=open(filepath, "rb"),
        purpose="fine-tune"
    )

    file_id = upload_response.id
    print(f"[OK] File uploaded successfully!")
    print(f"     File ID: {file_id}")
    print(f"     Filename: {upload_response.filename}")
    print(f"     Size: {upload_response.bytes} bytes")

    return file_id


def create_fine_tuning_job(
    client: OpenAI,
    file_id: str,
    model: str = BASE_MODEL,
    method: str = FINE_TUNING_METHOD
) -> str:
    """
    Bước 2: Khởi tạo fine-tuning job.

    Args:
        client: OpenAI client
        file_id: ID của file đã upload
        model: Model gốc dùng để fine-tune
        method: Phương pháp fine-tuning ("dpo" hoặc "supervised")

    Returns:
        Job ID của fine-tuning job
    """
    print(f"\n{'='*60}")
    print("  BƯỚC 2: Khởi tạo Fine-tuning Job")
    print(f"{'='*60}")

    job: FineTuningJob = client.fine_tuning.jobs.create(
        training_file=file_id,
        model=model,
        extra_body={"method": {"type": method}}
    )

    job_id = job.id
    print(f"[OK] Fine-tuning job created!")
    print(f"     Job ID: {job_id}")
    print(f"     Base model: {model}")
    print(f"     Method: {method}")
    print(f"     Status: {job.status}")

    return job_id


def monitor_fine_tuning_job(client: OpenAI, job_id: str, poll_interval: int = 30):
    """
    Bước 3: Theo dõi tiến trình fine-tuning.

    Args:
        client: OpenAI client
        job_id: ID của fine-tuning job
        poll_interval: Khoảng thời gian giữa các lần kiểm tra (giây)
    """
    print(f"\n{'='*60}")
    print("  BƯỚC 3: Theo dõi tiến trình huấn luyện")
    print(f"{'='*60}")

    while True:
        job = client.fine_tuning.jobs.retrieve(job_id)
        status = job.status

        print(f"  [{time.strftime('%H:%M:%S')}] Status: {status}")

        if status == "succeeded":
            print(f"\n[OK] Fine-tuning completed successfully!")
            print(f"     Fine-tuned model: {job.fine_tuned_model}")
            return job.fine_tuned_model

        elif status in ("failed", "cancelled"):
            print(f"\n[ERROR] Fine-tuning {status}!")
            if hasattr(job, "error") and job.error:
                print(f"     Error: {job.error}")
            return None

        time.sleep(poll_interval)


def test_fine_tuned_model(client: OpenAI, model_name: str):
    """
    Bước 4: Thử nghiệm mô hình đã fine-tune.

    Args:
        client: OpenAI client
        model_name: Tên mô hình đã fine-tune (ft:gpt-4o-mini:...)
    """
    print(f"\n{'='*60}")
    print("  BƯỚC 4: Thử nghiệm mô hình đã fine-tune")
    print(f"{'='*60}")

    test_prompts = [
        "Write a Python function that finds the maximum value in a list.",
        "Write a Python function that checks if a number is prime.",
        "Write a Python function that computes the factorial of a number.",
    ]

    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n--- Test {i}: {prompt[:60]}... ---")

        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": "You will be provided with a Python function signature "
                               "enclosed with {{{ FUNCTION }}}. Your task is to implement it."
                },
                {"role": "user", "content": f"FUNCTION: {{{{{{{prompt}}}}}}}\n CODE: "},
            ],
        )

        response = completion.choices[0].message.content
        tokens = completion.usage.total_tokens if completion.usage else "N/A"
        print(f"Response ({tokens} tokens):\n{response}\n")


def compare_models(client: OpenAI, base_model: str, fine_tuned_model: str):
    """
    So sánh output giữa mô hình gốc và mô hình đã fine-tune.

    Args:
        client: OpenAI client
        base_model: Tên mô hình gốc
        fine_tuned_model: Tên mô hình đã fine-tune
    """
    print(f"\n{'='*60}")
    print("  SO SÁNH: Model gốc vs Fine-tuned")
    print(f"{'='*60}")

    test_prompt = "Write a Python function that finds the maximum value in a list."
    messages = [
        {
            "role": "system",
            "content": "You will be provided with a Python function signature "
                       "enclosed with {{{ FUNCTION }}}. Your task is to implement it."
        },
        {"role": "user", "content": f"FUNCTION: {{{{{{{test_prompt}}}}}}}\n CODE: "},
    ]

    for model_name, label in [(base_model, "GỐC"), (fine_tuned_model, "FINE-TUNED")]:
        print(f"\n{'─'*60}")
        print(f"  Model {label}: {model_name}")
        print(f"{'─'*60}")

        completion = client.chat.completions.create(
            model=model_name,
            messages=messages,
        )
        print(completion.choices[0].message.content)


if __name__ == "__main__":
    print("=" * 60)
    print("  CHƯƠNG 11: Fine-tuning Models với OpenAI")
    print("=" * 60)

    # Khởi tạo client
    client = OpenAI()

    # Validate dữ liệu
    num_examples = validate_jsonl_file(TRAINING_FILE)

    # Bước 1: Upload
    file_id = upload_training_file(client, TRAINING_FILE)

    # Bước 2: Tạo job
    job_id = create_fine_tuning_job(client, file_id)

    # Bước 3: Theo dõi (có thể mất vài phút đến vài giờ)
    print("\n[INFO] Fine-tuning có thể mất 5-30 phút tùy kích thước dữ liệu.")
    print("[INFO] Bạn có thể theo dõi tại: https://platform.openai.com/finetune")

    fine_tuned_model = monitor_fine_tuning_job(client, job_id)

    # Bước 4: Thử nghiệm
    if fine_tuned_model:
        test_fine_tuned_model(client, fine_tuned_model)
        compare_models(client, BASE_MODEL, fine_tuned_model)
