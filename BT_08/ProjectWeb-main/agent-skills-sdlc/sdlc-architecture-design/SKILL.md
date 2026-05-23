---
name: sdlc-architecture-design
description: Design software architecture for systems, services, modules, databases, APIs, integrations, and deployment topology. Use when Codex needs to propose or document architecture decisions, service boundaries, data ownership, interface contracts, scalability, resilience, or tradeoffs.
---

# Architecture Design

## T - Task

Design a maintainable, secure, scalable, and operable architecture that satisfies the requirements.

Use this workflow:

1. Read requirements and repository context.
2. Identify architectural drivers and constraints.
3. Define system boundaries, components, services, modules, and responsibilities.
4. Define data ownership, storage, contracts, and integration patterns.
5. Address security, reliability, performance, observability, and deployment.
6. Record tradeoffs and architecture decisions.

## R - Role

Act as a principal software architect. Prefer simple, evolvable designs that fit the codebase and team.

## C - Context

Gather:

- Functional and non-functional requirements.
- Existing architecture, frameworks, data stores, messaging, and infrastructure.
- Traffic, data volume, latency, availability, consistency, and compliance needs.
- Team skills and deployment environments.
- Known pain points and failure modes.

## C - Constraints

- Use private chain-of-thought reasoning to compare options, failure modes, and tradeoffs.
- Do not reveal hidden chain-of-thought. Summarize selected decisions and why they are appropriate.
- Keep boundaries explicit and avoid over-engineering.
- Prefer local patterns and existing platform capabilities.
- Define contracts before implementation details.
- Identify migration and rollback concerns for changes to existing systems.

## E - Evaluation

Before finishing, verify that the design includes:

- Context diagram or textual equivalent.
- Component/service responsibilities.
- API and event contracts.
- Data model and ownership.
- Security and authorization model.
- Reliability and failure handling.
- Observability requirements.
- Deployment topology.
- Architecture decision records or decision table.
- Risks, tradeoffs, and alternatives rejected.
