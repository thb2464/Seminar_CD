---
name: secure-github-commit
description: Scans for leaked secrets and environment values, runs an OWASP Top 10–oriented security review of the codebase, then guides safe git commit and GitHub push. Use when committing, pushing, opening a pull request, or when the user requests a pre-commit security check before GitHub.
---

# Secure GitHub commit

## When to apply

Run this workflow **before** `git commit` or `git push` when the user wants changes on GitHub, or when they ask for a security pass prior to version control.

## Execution order

1. **Scope what ships** — Inspect `git status` and `git diff --cached`. If nothing is staged, clarify whether to stage specific paths or review the working tree.
2. **Secret and env leak scan** (mandatory) — Follow [Secret scan](#secret-scan) on **staged changes first**, then a **quick repo sanity pass** for high-risk patterns (see [Full codebase pass](#full-codebase-pass)).
3. **OWASP-oriented audit** (mandatory) — Follow [OWASP audit](#owasp-audit) across the **whole codebase** (not only staged lines). Use [reference.md](reference.md) for the detailed Top 10 checklist.
4. **Report and gate** — Summarize findings by severity. **Do not commit or push** if critical issues remain (real credentials, active tokens, private keys, reversible secrets). For lower severity, note remediation and proceed only if the user explicitly accepts the risk.
5. **GitHub** — After a clean or accepted report: stage (if needed), commit with a clear message, push to the requested branch, or open a PR per user instructions.

## Secret scan

### Patterns and locations

Search staged and relevant paths with ripgrep (or equivalent). Include case-sensitive and common false-positive filters (examples, tests) only when clearly safe; **never** dismiss matches without reading context.

High-priority patterns (extend as needed):

- Private keys: `BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY`
- AWS: `AKIA[0-9A-Z]{16}`, `[Aa]ws[_-]?secret`, `x-amz-security-token` with literals
- GitHub: `gh[pousr]_[A-Za-z0-9_]{20,}`, `github_pat_[A-Za-z0-9_]{22,}`
- Slack: `xox[baprs]-`
- Stripe: `sk_live_`, `rk_live_`
- Google API: `AIza[0-9A-Za-z_-]{35}`
- Generic: `api[_-]?key\s*[=:]\s*['\"]?[0-9A-Za-z_\-]{16,}`, `password\s*[=:]\s*['\"][^'\"]{8,}`, `token\s*[=:]\s*['\"][^'\"]{16,}`, `Bearer\s+[A-Za-z0-9_\-\.]{20,}`
- Connection strings with embedded passwords: `mongodb(\+srv)?:\/\/[^:]+:[^@]+@`

Also check:

- **`.env`, `*.pem`, `id_rsa`, `credentials`, `secrets.yml`** — must not be committed unless clearly dummy values and documented.
- **Client-side bundles** — no production API keys in frontend env vars that ship to the browser.

### Full codebase pass

After staged-file review, run targeted searches on the repository for the same patterns (excluding `node_modules`, `dist`, `build`, `.git` if appropriate). Surface **any** historical leaks in tracked files; recommend rotation if keys look real.

## OWASP audit

Work through the **OWASP Top 10** categories as they apply to the stack (web API, SPA, mobile, etc.). For each category, note **concrete evidence** (file paths, patterns) or **gap** (missing control).

Quick mapping:

| Risk area | What to verify |
|-----------|----------------|
| Access control | AuthZ on every sensitive route; IDOR; admin vs user separation |
| Cryptographic failures | TLS, password hashing, key management, sensitive data at rest |
| Injection | SQL/NoSQL/OS/command injection; unsafe `eval`; XSS sinks |
| Insecure design | Threat modeling gaps, missing rate limits, business-logic abuse |
| Misconfiguration | Debug in prod, default creds, verbose errors, open CORS |
| Vulnerable components | Outdated deps with known CVEs (use lockfiles / audit tools if available) |
| Auth failures | Session/JWT handling, MFA gaps, weak reset flows |
| Integrity failures | Unsigned updates, unsafe deserialization, CI/CD trust |
| Logging/monitoring | Auth failures, no sensitive data in logs, alerting |
| SSRF | User-controlled URLs fetching internal resources |

For expanded checks and evidence hints, read [reference.md](reference.md).

## Severity guidance

- **Critical**: Confirmed or highly likely real secrets; unauthenticated access to sensitive data; trivial RCE/SQLi. **Block commit/push.**
- **High**: Weak crypto, missing authz, SSRF likely exploitable. Fix or explicit waiver.
- **Medium/Low**: Hardening, dependency bumps, log hygiene. Can commit with documented follow-ups if user agrees.

## Examples

**User:** "Commit and push my changes."

**Agent:** Run secret scan on staged files → repo-wide pattern spot-check → OWASP pass per stack → report → if clear, `git commit` and `git push` to the branch the user names.

**User:** "Security check only."

**Agent:** Same as steps 1–4 without commit/push; deliver a structured report (Critical / High / Medium / Low / Informational).
