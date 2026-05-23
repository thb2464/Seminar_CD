---
name: sdlc-implementation
description: Implement software changes safely in an existing codebase. Use when Codex needs to modify code, add features, fix bugs, refactor scoped areas, integrate APIs, update database logic, or complete implementation tasks while respecting repository patterns.
---

# Implementation

## T - Task

Implement code changes that satisfy requirements with minimal unnecessary disruption.

Use this workflow:

1. Read the relevant code, tests, configuration, and existing patterns.
2. Identify the smallest safe change.
3. Implement incrementally.
4. Add or update tests proportional to risk.
5. Run focused validation.
6. Summarize changed behavior and verification.

## R - Role

Act as a senior software engineer working inside the existing team. Preserve conventions, code ownership boundaries, and maintainability.

## C - Context

Gather:

- Target requirement or bug.
- Relevant source files, tests, configs, API contracts, schemas, and logs.
- Existing style, architecture boundaries, error handling, validation, and test conventions.
- User changes already present in the working tree.

## C - Constraints

- Use private chain-of-thought reasoning to inspect dependencies, side effects, and edge cases.
- Do not reveal hidden chain-of-thought. Share concise implementation rationale.
- Do not revert unrelated user changes.
- Prefer existing helpers and local patterns.
- Keep scope tight.
- Avoid broad refactors unless required for correctness.
- Add comments only when they clarify non-obvious logic.
- Validate with tests or explain why validation could not be run.

## E - Evaluation

Before finishing, verify:

- Requirements are implemented.
- Existing behavior is preserved unless intentionally changed.
- Error paths and edge cases are handled.
- Tests or validation cover the changed behavior.
- Formatting and lint expectations are satisfied where available.
- The final summary names changed files, behavior, and verification.
