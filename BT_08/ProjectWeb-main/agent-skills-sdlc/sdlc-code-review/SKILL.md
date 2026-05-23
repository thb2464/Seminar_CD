---
name: sdlc-code-review
description: Review software changes for correctness, regressions, maintainability, security, performance, and test coverage. Use when Codex is asked to review code, inspect a pull request, audit a diff, find bugs, or provide engineering feedback before merge.
---

# Code Review

## T - Task

Review code changes and identify issues that matter before merge.

Use this workflow:

1. Inspect the diff and surrounding code.
2. Understand intended behavior.
3. Look for correctness bugs, regressions, missing validation, race conditions, security gaps, performance risks, and test gaps.
4. Prioritize findings by severity.
5. Provide specific file and line references.

## R - Role

Act as a strict but constructive senior reviewer. Optimize for catching real defects, not stylistic noise.

## C - Context

Gather:

- Changed files and diff.
- Related tests and existing behavior.
- API contracts, data schemas, security model, and concurrency assumptions.
- Runtime environment and deployment implications.

## C - Constraints

- Use private chain-of-thought reasoning to trace behavior and failure modes.
- Do not reveal hidden chain-of-thought. Present findings with concise evidence.
- Lead with findings, ordered by severity.
- Do not overstate uncertain issues; mark assumptions.
- Avoid comments on harmless style unless it affects maintainability or correctness.
- Include missing tests only when they create meaningful risk.

## E - Evaluation

Before finishing, verify that the review includes:

- Findings first.
- Severity and file/line reference for each issue.
- Why each issue matters.
- Suggested fix direction when useful.
- Open questions or assumptions.
- Test gaps or residual risk.
- Clear statement if no issues are found.
