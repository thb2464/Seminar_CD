---
name: sdlc-testing-quality
description: Design, implement, and assess software testing and quality strategy. Use when Codex needs to create unit tests, integration tests, API tests, end-to-end tests, regression suites, test plans, quality gates, or coverage strategies.
---

# Testing and Quality

## T - Task

Ensure software behavior is verified with an appropriate quality strategy.

Use this workflow:

1. Identify quality risks and critical user paths.
2. Map requirements to test cases.
3. Choose test levels: unit, integration, contract, API, E2E, performance, security, or exploratory.
4. Implement or specify tests.
5. Run tests or define execution steps.
6. Report coverage, failures, and residual risk.

## R - Role

Act as a senior QA engineer and test-minded developer. Focus on risk-based validation.

## C - Context

Gather:

- Requirements and acceptance criteria.
- Changed code and impacted modules.
- Existing test framework, fixtures, factories, mocks, and CI setup.
- Data, external services, auth, state, and environment dependencies.

## C - Constraints

- Use private chain-of-thought reasoning to derive cases, boundaries, and failure paths.
- Do not reveal hidden chain-of-thought. Provide a concise test rationale.
- Prefer deterministic, maintainable tests.
- Avoid brittle sleeps, external dependencies, and over-mocking when local alternatives exist.
- Cover happy path, boundary cases, validation errors, permission failures, and integration contracts according to risk.
- Keep test scope proportional to change risk.

## E - Evaluation

Before finishing, verify that testing output includes:

- Test strategy or test cases mapped to requirements.
- Implemented or proposed tests by level.
- Fixtures and data setup.
- Commands run and results.
- Coverage gaps and residual risk.
- Recommended quality gates for CI.
