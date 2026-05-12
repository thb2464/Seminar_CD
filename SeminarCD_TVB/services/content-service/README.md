# Content Service

> **Travel TVB** Content Management Service — Strapi 5 + PostgreSQL.

## Purpose

Manages all CMS-driven content that doesn't belong to the transactional or AI domains:

| Content Type | API Path | Description |
|---|---|---|
| `single-post` | `/api/single-posts` | Blog posts (Integer, ThiTruong, TongHop) |
| `single-community-post` | `/api/single-community-posts` | Community posts (Podcast, PhanTichBinhLuan, ChuyenMucHoiDap) |
| `post-category` | `/api/post-categories` | Blog/community post categories |
| `author` | `/api/authors` | Post authors |
| `faq` | `/api/faqs` | Frequently asked questions |
| `newsletter-email-submisson` | `/api/newsletter-email-submissons` | Newsletter subscribers |
| `about-hero` | `/api/about-heroes` | About page hero section |
| `about-core-value` | `/api/about-core-values` | About page core values |
| `about-journey` | `/api/about-journeys` | About page journey section |
| `about-team` | `/api/about-teams` | About page team section |
| `home-hero-slider` | `/api/home-hero-sliders` | Home page hero slider |
| `home-commitment` | `/api/home-commitments` | Home page commitments |
| `home-diagram` | `/api/home-diagrams` | Home page diagram section |
| `home-portfolio` | `/api/home-portfolios` | Home page portfolio section |
| `home-statistic` | `/api/home-statistics` | Home page statistics |
| `community-hero` | `/api/community-heroes` | Community page hero section |
| `news-hero` | `/api/news-heroes` | News page hero section |
| `service-hero` | `/api/service-heroes` | Services page hero section |
| `layout-navbar` | `/api/layout-navbars` | Navigation bar content |
| `layout-footer` | `/api/layout-footers` | Footer content |
| `layout-cta-banner` | `/api/layout-cta-banners` | Call-to-action banner |
| `layout-newsletter` | `/api/layout-newsletters` | Newsletter section |

## What was removed

The following APIs have been extracted into dedicated microservices and are **not** part of this service:

- **Booking** → `services/booking-service/` (Sprint 5)
- **Chatbot** → `services/ai-chatbot-service/` (Sprint 1)
- **Tour / Tour Category** → `services/catalog-service/` (Sprint 3)
- **Auth / Users** → `services/identity-service/` (Sprint 2)

## Local Development

```bash
# 1. Copy .env.example to .env and fill in real values
cp .env.example .env

# 2. Ensure PostgreSQL is running with a content_db database
# (Docker: docker compose -f infra/docker-compose.yml up postgres)

# 3. Install dependencies
npm install

# 4. Start in development mode
npm run develop

# 5. Access
# API:   http://localhost:1337/api
# Admin: http://localhost:1337/admin
```

## Docker

```bash
docker build -t content-service .
docker run -p 1337:1337 --env-file .env content-service
```

## Database

Default: **PostgreSQL** (`content_db`).

For local dev without Postgres, set `DATABASE_CLIENT=sqlite` in `.env` to fall back to SQLite (file-based).

The SQLite → PostgreSQL data migration is handled by F4.2 (see `Implement_Log.md`).

## i18n

All content types support `i18n` localisation (vi, en, zh) — the same locale set as the monolith.
