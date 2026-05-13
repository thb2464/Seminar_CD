# Monolith Decommission Watch

Feature: Sprint 7 `F7.4`

Watch window: 2026-05-13 through 2026-05-20, Asia/Saigon.

Goal: keep the old Strapi monolith available only as a private fallback/admin
asset during the watch window, while proving public production traffic is
served by Kong and the extracted services.

## Entry Criteria

- `F7.1` removed non-content monolith APIs.
- `F7.2` archived `Travel_TVB_Server/.tmp/data.db` as `archives/sqlite-final.db`.
- `F7.3` installed or prepared the Kong-only reverse proxy cutover.
- The frontend production build uses `VITE_API_GATEWAY_URL`.
- Public DNS for the API hostname resolves to the reverse proxy or load balancer in front of Kong.

## Daily Watch Checklist

Run once per day during the watch window:

```bash
curl -fsS https://<public-api-host>/api/chatbot/health
curl -fsS "https://<public-api-host>/api/tours?pagination[pageSize]=1"
curl -fsS https://<public-api-host>/api/single-posts
curl -fsS "https://<public-api-host>/api/bookings/availability?tourId=1&date=2099-01-01"
curl -I http://<public-api-host>:1337/api/single-posts
```

Expected results:

- Gateway health and public read probes return through Kong routes.
- Booking availability reaches Booking Service through Kong.
- Direct public Strapi port `1337` is refused, times out, or is blocked by firewall.
- Authentication-protected routes may return `401` without a token, but must not return a Strapi monolith response.

## Metrics To Review

Use the gateway, service, and reverse proxy logs available in the deployment:

- Kong 5xx rate stays below 1% over each 24-hour period.
- Kong p95 latency does not regress by more than 25% compared with the previous production baseline.
- Booking creation and payment callback logs show no saga stalls or stuck `Pending` bookings caused by routing.
- Content pages load assets through the gateway or approved CDN path; no browser requests target the old Strapi public port.
- Old Strapi monolith logs show no public API traffic except private operator/admin access.

## Incident Criteria

Pause decommission and keep the old Strapi container intact if any of these happen:

- Public API DNS or reverse proxy routes traffic to Strapi port `1337`.
- Kong cannot route one or more business workflows BW-01 through BW-08.
- Payment callbacks fail because VNPay return URLs still point at a monolith endpoint.
- Content media URLs are broken for production users.
- Any extracted service needs data that exists only in the archived SQLite DB.

## Final Tear-Down Gate

After 2026-05-20, the old Strapi container can be removed only if:

- All daily checklist entries are recorded as passing or explained.
- No public requests to Strapi were observed during the watch window.
- `archives/sqlite-final.db` checksum still matches the value in `archives/README.md`.
- A rollback target exists at Kong/proxy level.
- The team agrees no Strapi admin-only edits are still required in the monolith.

## Tear-Down Commands

Use the deployment manager for the environment. Examples:

```bash
docker stop travel-tvb-monolith-strapi
docker rm travel-tvb-monolith-strapi
```

Do not delete `archives/sqlite-final.db`.

