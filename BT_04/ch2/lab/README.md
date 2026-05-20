# Lab 2 — OpenAI API Quickstart

Worked solutions for the Chapter 2 labs (book: *Supercharged Coding with
GenAI*, Part 1).

| File | Lab | What it does |
|------|-----|--------------|
| `lab21_basic_chat_completion.py` | 2.1 | First chat-completion call — one `user` message |
| `lab22_parameters_and_tokens.py` | 2.2 | `temperature` / `max_tokens` / `n`, a `system` message, token usage |
| `lab23_code_generation.py` | 2.3 | Generate a function body, request `n=2` options, parse fenced code |

## Run

```
pip install openai
setx OPENAI_API_KEY "your-key"      # then reopen the terminal
python lab21_basic_chat_completion.py
```

All three labs call the OpenAI API and need a valid `OPENAI_API_KEY`.
Discussion of the prompts, parameters and observed results is in
`../BaoCao_Chuong2_Khoi_dau_OpenAI_API.docx`.
