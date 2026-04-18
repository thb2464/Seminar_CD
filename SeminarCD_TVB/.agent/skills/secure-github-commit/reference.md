# OWASP Top 10 (2021) — review hints for agents

Use this as a **systematic checklist** during codebase review. Adapt to the project’s languages and frameworks.

## A01:2021 — Broken Access Control

- Every endpoint that reads/writes user-specific or admin data: verify **authorization** (not only authentication).
- **IDOR**: user-supplied IDs must be checked against the authenticated principal.
- **Path traversal** in file download/upload.
- **CORS** must not replace server-side authz; `Access-Control-Allow-Credentials` with `*` is suspicious.
- **JWT**: validate `aud`, `iss`, `exp`; no `none` algorithm; role/scope enforced server-side.

## A02:2021 — Cryptographic Failures

- Passwords: strong hashing (e.g. Argon2, bcrypt with adequate cost); no MD5/SHA1 for passwords.
- **Secrets at rest**: DB columns, backups, mobile storage — encryption or tokenization where required.
- **TLS**: HTTPS for external traffic; no mixed content for session cookies.
- **Randomness**: use crypto-grade RNG for tokens and session IDs.

## A03:2021 — Injection

- **SQL**: parameterized queries/ORM; no string concatenation with user input.
- **NoSQL**, **LDAP**, **OS command**: same principle — structured APIs, no shell with user strings.
- **XSS**: encode output; avoid `dangerouslySetInnerHTML` / `v-html` with untrusted data; CSP where feasible.

## A04:2021 — Insecure Design

- **Rate limiting** on auth and expensive endpoints.
- **Business logic**: double spending, coupon abuse, booking race conditions.
- **Threat modeling** gaps called out explicitly if obvious (e.g. no fraud checks on payments).

## A05:2021 — Security Misconfiguration

- Default accounts/passwords removed.
- **Stack traces** and **debug** off in production; `NODE_ENV`/equivalent correct.
- **Directory listings**, open admin panels, backup files (`*.bak`) not web-accessible.
- **Security headers** where applicable: `Content-Security-Policy`, `X-Content-Type-Options`, `Frame-Options`, HSTS.

## A06:2021 — Vulnerable and Outdated Components

- Run **`npm audit`**, **`pnpm audit`**, **`pip-audit`**, **`cargo audit`**, or OSV tooling when lockfiles exist.
- Flag **direct dependencies** with known critical/high CVEs; note transitive where relevant.

## A07:2021 — Identification and Authentication Failures

- **Session fixation**, weak session IDs, missing logout invalidation.
- **Credential stuffing** resistance: lockout or CAPTCHA after failures (if applicable).
- **Password reset** tokens: single-use, short-lived, not guessable; no user enumeration via timing/messages if policy requires.

## A08:2021 — Software and Data Integrity Failures

- **Deserialization** of untrusted data (pickle, `ObjectInputStream`, unsafe YAML).
- **CI/CD**: pinned actions, verified packages, no unsigned artifacts in update paths.
- **Supply chain**: install from lockfile; unexpected `postinstall` scripts noted.

## A09:2021 — Security Logging and Monitoring Failures

- **Auth failures**, privilege changes, admin actions logged.
- Logs avoid **PII/secrets**; sufficient context for incident response.
- No **silent** swallow of security-relevant exceptions.

## A10:2021 — Server-Side Request Forgery (SSRF)

- **HTTP clients** that accept URLs from users: block internal IPs, metadata endpoints (`169.254.169.254`), file/file+ schemes.
- **Redirects** followed by server must not bypass allowlists.

---

## Secret scan — supplementary patterns

- SendGrid/Mailgun/Mailchimp API key shapes in code or config.
- Database URLs with username/password in application repos.
- **Base64** blobs beside keywords `secret`, `private` — spot-check for PEM or long tokens.

When uncertain whether a match is a **test fixture**, read surrounding files and naming; flag if it could be copied into production.
