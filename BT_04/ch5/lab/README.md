# Lab 5 — Prompting with the OpenAI API & GitHub Copilot

Worked solutions for the Chapter 5 labs — applying structured prompting.

| File | Lab | What it does |
|------|-----|--------------|
| `lab51_docstring_generator.py` | 5.1 | Reusable structured prompt (SURROUND + SINGLE_TASK) — generates a Google-style docstring for a function via the API |
| `lab52_singleton_test.py` | 5.2 | Singleton design pattern verified by generated `unittest` test cases |

## Run

`lab51` calls the OpenAI API:

```
pip install openai
setx OPENAI_API_KEY "your-key"      # then reopen the terminal
python lab51_docstring_generator.py
```

`lab52` is plain Python — no API key needed:

```
python lab52_singleton_test.py
```

Discussion is in `../BaoCao_Chuong5_Prompting_API_va_Copilot.docx`.
