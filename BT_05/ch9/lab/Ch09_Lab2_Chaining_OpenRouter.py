# Lab 2: Prompt Chaining va Selective History qua OpenRouter API

import os
import re
from openai import OpenAI

# Thiet lap ket noi API
os.environ["OPENAI_API_KEY"] = "personal openrouter api key"
client = OpenAI(base_url="https://openrouter.ai/api/v1")
MODEL_NAME = "openai/gpt-4o-mini"

# Ham goi API tra ve ket qua dang text
def get_completion(system_prompt: str, user_content: str) -> str:
    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
    )
    return completion.choices[0].message.content

# Ham dung Regex de trich xuat rieng phan code tu ket qua cua LLM
def extract_code(assistant_output: str) -> str:
    code = re.sub(r"(.*?)```python(.*?)```(.*)", r"\2", assistant_output, flags=re.DOTALL).strip()
    if not code: return assistant_output.strip()
    return code

# Buoc 1: Khai bao code tho ban dau
initial_code = """
def get_gross_returns(net_returns):
    return {k: v + 1 for k, v in net_returns.items()}
"""

# Buoc 2: Chaining 1 - Them Type Hints vao code tho
system_prompt_2 = "You are provided with a Python code. Add type hints to all variables and function signatures. Do not add docstrings yet. Return ONLY the code."
user_prompt_2 = f"Code:\n{initial_code}"
output_step_2 = get_completion(system_prompt_2, user_prompt_2)
code_step_2 = extract_code(output_step_2)

# Buoc 3: Chaining 2 - Them Docstring vao code_step_2 (Selective History)
system_prompt_3 = "You are provided with a Python code. Add a Google Style docstring to the function. Return ONLY the complete code."
user_prompt_3 = f"Code:\n{code_step_2}"
output_step_3 = get_completion(system_prompt_3, user_prompt_3)
code_step_3 = extract_code(output_step_3)

# In ket qua cuoi cung de kiem chung
print(code_step_3)