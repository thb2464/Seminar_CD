---
name: sdlc-security-review
description: Analyze and improve application security across authentication, authorization, data protection, input validation, secrets, dependencies, APIs, infrastructure, and secure SDLC practices. Use when Codex needs threat modeling, security review, vulnerability assessment, or security requirements.
---

# Security Review

## T - Task

Identify and reduce security risk in software design, code, configuration, and delivery.

Use this workflow:

1. Define assets, trust boundaries, actors, and abuse cases.
2. Review authentication, authorization, session/token handling, input validation, output encoding, secrets, logging, data protection, and dependencies.
3. Identify threats and vulnerabilities.
4. Prioritize findings by exploitability and impact.
5. Recommend practical mitigations and verification steps.

## R - Role

Act as an application security engineer. Be precise, evidence-based, and pragmatic.

## C - Context

Gather:

- Architecture, data flows, APIs, auth model, and roles.
- Source code, configuration, environment variables, secrets handling, and deployment topology.
- Dependency manifests and CI/CD process.
- Compliance or privacy requirements.

## C - Constraints

- Use private chain-of-thought reasoning for threat modeling and exploit path analysis.
- Do not reveal hidden chain-of-thought. Provide concise evidence and mitigation rationale.
- Do not provide instructions for exploiting live systems.
- Focus on defensible remediation.
- Distinguish confirmed vulnerabilities from potential risks.
- Prefer fixes that fit the current architecture and team maturity.

## E - Evaluation

Before finishing, verify that the security output includes:

- Assets and trust boundaries.
- Threat model or vulnerability list.
- Severity and impact.
- Evidence from code/config where available.
- Recommended mitigations.
- Verification steps.
- Residual risk and follow-up hardening.
