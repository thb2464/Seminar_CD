# Phase 5 - Task 02: E2E, Chaos, And Workflow Testing

## User Prompt

```text
Add E2E and chaos testing for Travel TVB.
Cover the main browser workflows and failure scenarios across the distributed services.
```

## AI Understanding

AI understood that unit and contract tests were not enough. The project also needed browser-level workflow tests and resilience checks for service, broker, database, and AI failures.

## AI Work Report

AI added E2E testing:

- Created a Playwright workspace under `tests/e2e/`.
- Added workflow specs for browsing tours.
- Added workflow specs for viewing tour detail.
- Added auth workflow coverage.
- Added booking and payment flow coverage.
- Added chatbot interaction coverage.
- Added content page coverage.
- Added mocked gateway response support for deterministic test runs.

AI added chaos testing:

- Payment service crash scenario.
- RabbitMQ outage scenario.
- Catalog database slowdown scenario.
- AI Chatbot memory pressure scenario.
- Kubernetes-oriented chaos manifests.

AI added workflow validation:

- Verified core workflows still pass through gateway routes.
- Verified service-specific failures do not break unrelated workflows.
- Documented expected failure behavior for operators and testers.

## Deliverables

- Playwright E2E workspace.
- Browser workflow specs.
- Chaos test manifests.
- Failure scenario documentation.
- Deterministic mocked gateway responses.

## Validation Notes

The task was complete when the main customer workflows had browser-level coverage and key service failure scenarios had executable chaos definitions.

## Next Prompt

```text
Prepare deployment and CI/CD for Travel TVB with Dockerfiles, GitHub Actions, Kubernetes manifests, and environment overlays.
```
