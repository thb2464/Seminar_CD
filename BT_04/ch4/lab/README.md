# Lab 4 — Prompting with ChatGPT

Worked solutions for the Chapter 4 labs (prompt engineering).

| File | Lab | What it does |
|------|-----|--------------|
| `lab41_prompt_improvement.txt` | 4.1 | Rewrites a weak prompt into a structured one (context, task, delimiters) |
| `lab42_structured_prompt.py` | 4.2 | Builds a structured prompt in code (SURROUND + SINGLE_TASK pattern) |

## Run

`lab41` is a text artifact — open and read it.

`lab42` calls the OpenAI API:

```
pip install openai
setx OPENAI_API_KEY "your-key"      # then reopen the terminal
python lab42_structured_prompt.py
```

Discussion of the technique is in `../BaoCao_Chuong4_Prompting_voi_ChatGPT.docx`.
