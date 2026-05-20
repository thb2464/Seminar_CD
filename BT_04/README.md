# BT04 — Coding with GenAI (Part 1: Foundations)

Exercise 04 of the **Seminar Chuyen De** course. It studies **Part 1 —
Foundations for Coding with GenAI** (Chapters 1-5) of the book *Supercharged
Coding with GenAI* (Hila Paz Herszfang & Peter V. Henstock, Packt, 2025) and
works through the hands-on labs for Chapters 2-5.

## Structure

| Path | Description |
|------|-------------|
| `ch1/` | Chapter 1 — The current opportunity for GenAI across the SDLC (report) |
| `ch2/` | Chapter 2 — Quickstart guide to the OpenAI API (report + Lab 2) |
| `ch3/` | Chapter 3 — GitHub Copilot in PyCharm, VS Code, Jupyter (report + Lab 3) |
| `ch4/` | Chapter 4 — Best practices for prompting with ChatGPT (report + Lab 4) |
| `ch5/` | Chapter 5 — Best practices for prompting with the API & Copilot (report + Lab 5) |
| `figures/` | Diagrams embedded in the reports |
| `BaoCao_TongHop_BT04_CodingGenAI.docx` | Overall summary report |
| `NhatKy_LamViec.md` | Work log |

Chapter reports are Vietnamese `.docx` files. Lab code is Python 3.

## Running the labs

Labs that call the OpenAI API need the `openai` package and an API key:

```
pip install openai
setx OPENAI_API_KEY "your-key-here"
```

Pure-Python labs (Chapter 3, and the test in Chapter 5) run without a key.

Reference source code: https://github.com/PacktPublishing/Supercharged-Coding-with-Gen-AI
