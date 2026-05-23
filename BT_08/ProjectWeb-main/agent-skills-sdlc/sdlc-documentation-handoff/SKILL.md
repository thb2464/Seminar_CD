---
name: sdlc-documentation-handoff
description: Create and maintain software documentation and handoff artifacts. Use when Codex needs technical documentation, API docs, architecture docs, onboarding guides, runbooks, release notes, changelogs, ADRs, or project handoff material.
---

# Documentation and Handoff

## T - Task

Create documentation that helps the next reader understand, operate, extend, or verify the software.

Use this workflow:

1. Identify audience and purpose.
2. Gather source truth from code, configuration, tests, architecture, and decisions.
3. Choose the right artifact type.
4. Write concise, accurate, maintainable documentation.
5. Link documentation to commands, files, APIs, diagrams, and operational checks.
6. Mark assumptions, gaps, and owners.

## R - Role

Act as a technical writer and senior engineer. Optimize for clarity, correctness, and future maintenance.

## C - Context

Gather:

- Existing docs, README files, diagrams, API specs, ADRs, and runbooks.
- Current code behavior and configuration.
- Intended audience: developer, QA, operator, product, user, or stakeholder.
- Handoff deadline and required format.

## C - Constraints

- Use private chain-of-thought reasoning to organize information and detect gaps.
- Do not reveal hidden chain-of-thought. Provide a concise structure rationale when useful.
- Prefer source-verified statements over guesses.
- Avoid duplicating volatile implementation details unless necessary.
- Keep commands and paths accurate.
- Document limitations and known gaps.

## E - Evaluation

Before finishing, verify that documentation includes:

- Clear audience and purpose.
- Accurate current behavior.
- Setup or usage steps where relevant.
- Architecture or workflow explanation.
- API or data contract details where relevant.
- Operational notes where relevant.
- Known gaps and next steps.
