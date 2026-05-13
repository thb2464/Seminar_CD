# Shared Libraries

Shared cross-service code lives here as the migration matures.

Current packages:

- `ts/` - TypeScript helpers for NestJS services: gateway identity header middleware, RabbitMQ JSON event helpers, and JSON logger conventions.
- `py/` - Python helpers for FastAPI services: gateway identity ASGI middleware, RabbitMQ JSON event helpers, and structured logging helpers.

Keep shared code small and stable. Prefer service-local code until two or more services genuinely need the same behavior.

## Verification

TypeScript:

```bash
cd libs/shared/ts
npm run build
npm test
```

Python:

```bash
cd libs/shared/py
python -m unittest discover tests
```
