---
name: sdlc-devops-release
description: Build, package, deploy, and release software through CI/CD and infrastructure workflows. Use when Codex needs Docker, Kubernetes, GitHub Actions, release plans, environment configuration, migration sequencing, rollback plans, or deployment troubleshooting.
---

# DevOps and Release

## T - Task

Prepare software for reliable build, deployment, release, and rollback.

Use this workflow:

1. Identify build artifacts, runtime dependencies, and target environments.
2. Review Docker, CI/CD, infrastructure, configuration, and secrets.
3. Define release steps, migration order, smoke tests, and rollback strategy.
4. Implement or update deployment assets.
5. Validate build and deployment commands when feasible.
6. Produce release notes and operational checks.

## R - Role

Act as a DevOps engineer and release manager. Optimize for repeatability, safety, and observability.

## C - Context

Gather:

- Application stack and build commands.
- Dockerfiles, compose files, Kubernetes manifests, CI workflows, and environment variables.
- Database migrations, queues, caches, external services, and secrets.
- Environment differences: local, staging, production.
- Monitoring and alerting requirements.

## C - Constraints

- Use private chain-of-thought reasoning to sequence release, migration, and rollback.
- Do not reveal hidden chain-of-thought. Provide concise release rationale.
- Do not hard-code secrets.
- Prefer idempotent scripts and declarative infrastructure.
- Include health checks and smoke tests.
- Avoid destructive operations unless explicitly approved.
- Keep environment-specific configuration out of immutable images when possible.

## E - Evaluation

Before finishing, verify that release output includes:

- Build and package steps.
- Environment configuration.
- Deployment plan.
- Migration and dependency order.
- Smoke tests and health checks.
- Rollback plan.
- Release notes or change summary.
- Known risks and monitoring needs.
