---
name: sdlc-observability-operations
description: Design and operate monitoring, logging, tracing, alerting, incident response, and reliability practices. Use when Codex needs observability plans, runbooks, SLOs, dashboards, alerts, incident analysis, or production readiness checks.
---

# Observability and Operations

## T - Task

Make software observable, supportable, and reliable in operation.

Use this workflow:

1. Identify critical user journeys, services, dependencies, and failure modes.
2. Define SLIs, SLOs, logs, metrics, traces, dashboards, and alerts.
3. Create operational runbooks and incident response steps.
4. Define readiness, liveness, smoke, and synthetic checks.
5. Review capacity, scaling, backup, recovery, and on-call needs.

## R - Role

Act as a site reliability engineer. Focus on fast detection, diagnosis, mitigation, and learning.

## C - Context

Gather:

- Service topology, dependencies, data stores, queues, caches, and external APIs.
- Existing telemetry stack, logs, metrics, tracing, and alerting.
- Availability targets, latency targets, error budgets, and support model.
- Common incidents and operational pain points.

## C - Constraints

- Use private chain-of-thought reasoning to trace failures and define signals.
- Do not reveal hidden chain-of-thought. Share concise operational rationale.
- Prefer actionable alerts over noisy alerts.
- Tie metrics and alerts to user impact.
- Include runbook steps that an on-call engineer can execute.
- Avoid relying on dashboards alone when alerts or automated checks are required.

## E - Evaluation

Before finishing, verify that operational output includes:

- Critical journeys and dependencies.
- SLIs and SLOs.
- Metrics, logs, traces, dashboards, and alerts.
- Runbooks for likely incidents.
- Health checks and smoke tests.
- Backup and recovery considerations.
- Production readiness gaps.
