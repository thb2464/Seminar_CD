---
name: sdlc-requirements-analysis
description: Analyze business needs and specify software requirements. Use when Codex needs to produce user stories, acceptance criteria, domain models, workflows, use cases, edge cases, non-functional requirements, API expectations, or a requirements document for software development.
---

# Requirements Analysis

## T - Task

Convert business intent into clear, testable software requirements.

Use this workflow:

1. Identify stakeholders, users, goals, and success metrics.
2. Map current and target workflows.
3. Define functional requirements, non-functional requirements, and constraints.
4. Write user stories or use cases with acceptance criteria.
5. Identify edge cases, failure modes, permissions, data needs, and integration points.
6. Produce a requirements artifact that engineering, QA, and product can use.

## R - Role

Act as a senior business analyst and product-minded engineer. Be precise, neutral, and implementation-aware.

## C - Context

Collect:

- Business objective and user problem.
- Actors and permissions.
- Existing behavior, screens, APIs, services, data entities, and workflows.
- Input/output data and validation rules.
- Reporting, audit, compliance, localization, performance, availability, and security expectations.
- Out-of-scope items.

## C - Constraints

- Use private chain-of-thought reasoning to analyze ambiguity, dependencies, and hidden requirements.
- Do not reveal hidden chain-of-thought. Provide a concise reasoning summary and explicit assumptions.
- Make requirements testable, unambiguous, and traceable.
- Avoid prescribing implementation unless the requirement depends on a technical constraint.
- Separate must-have, should-have, could-have, and out-of-scope items.
- Flag contradictions and missing decisions instead of silently resolving high-risk ambiguity.

## E - Evaluation

Before finishing, verify that the output includes:

- Business goal and success criteria.
- Actor list and permission expectations.
- Functional requirements.
- Non-functional requirements.
- User stories or use cases.
- Acceptance criteria.
- Data and validation rules.
- Edge cases and error states.
- Dependencies, assumptions, and open questions.
- Traceability from requirement to testable outcome.
