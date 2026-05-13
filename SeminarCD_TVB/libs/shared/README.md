# Shared Libraries

Shared cross-service code lives here as the migration matures.

Planned packages:

- `ts/` - TypeScript helpers for NestJS services, including JWT header validation, RabbitMQ event helpers, and JSON logger conventions.
- `py/` - Python helpers for FastAPI services with matching JWT header validation, RabbitMQ helpers, and structured logging.

Keep shared code small and stable. Prefer service-local code until two or more services genuinely need the same behavior.
