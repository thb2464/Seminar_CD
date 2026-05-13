# Services Workspace

This directory contains the extracted Travel TVB services that replace the Strapi monolith behind Kong.

Current service folders:

- `ai-chatbot-service/` - FastAPI RAG chatbot.
- `identity-service/` - NestJS auth and user identity.
- `catalog-service/` - NestJS tours, categories, regions, and pricing.
- `content-service/` - Strapi content-only service.
- `booking-service/` - NestJS bookings and availability.
- `payment-service/` - NestJS VNPay payments and refunds.
- `api-gateway/` - Kong declarative gateway config.

The legacy `Travel_TVB/` and `Travel_TVB_Server/` folders stay at the repo root until each workflow has been verified through the gateway.
