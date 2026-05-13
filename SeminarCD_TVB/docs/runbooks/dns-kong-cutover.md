# DNS and Reverse Proxy Cutover Runbook

Feature: Sprint 7 `F7.3`

Goal: production API traffic reaches Kong only. The old monolith Strapi server
is not reachable from the public API hostname.

## Target Routing

| Public path | Target |
|---|---|
| `/api/chatbot/*` | Kong -> AI Chatbot Service |
| `/api/auth/*`, `/api/users/me` | Kong -> Identity Service |
| `/api/tours/*`, `/api/tour-categories/*` | Kong -> Catalog Service |
| `/api/single-posts`, `/api/faq`, `/api/home-*`, `/api/about-*`, `/api/layout-*`, `/api/news-*` | Kong -> Content Service |
| `/api/bookings/*` | Kong -> Booking Service |
| `/api/payments/*` | Kong -> Payment Service |

## Pre-Cutover Checks

1. Confirm the gateway config is the active source of routing:

   ```bash
   docker compose -f infra/docker-compose.yml config --quiet
   ```

2. Confirm the frontend production build uses the gateway URL:

   ```bash
   VITE_API_GATEWAY_URL=https://<public-api-host> npm --prefix Travel_TVB run build
   ```

3. Confirm the public reverse proxy config contains no Strapi upstream directive:

   ```bash
   rg -n "proxy_pass .*1337|server .*1337|Travel_TVB_Server" infra/reverse-proxy -g "*.conf"
   ```

   Expected result: no matches.

4. Confirm Kong is reachable from the reverse proxy host:

   ```bash
   curl -fsS http://127.0.0.1:8000/api/chatbot/health
   ```

## DNS Change

1. Set the public API hostname A/AAAA record or CNAME to the reverse proxy or load balancer in front of Kong.
2. Keep TTL low, recommended 60 seconds during the change window.
3. Do not create or keep DNS records that point the public API hostname to the old Strapi host or port `1337`.

## Reverse Proxy Change

1. Install `infra/reverse-proxy/kong-only.nginx.conf` as the API hostname server block.
2. Replace the placeholder `api.travel-tvb.example.com` with the real API hostname.
3. Replace the certificate paths with the issued certificate for that hostname.
4. If Kong is not on the same host, replace `127.0.0.1:8000` with Kong's private load balancer address.
5. Validate and reload Nginx:

   ```bash
   nginx -t
   systemctl reload nginx
   ```

## Post-Cutover Smoke Tests

Run these against the public API hostname:

```bash
curl -fsS https://<public-api-host>/api/chatbot/health
curl -fsS "https://<public-api-host>/api/tours?pagination[pageSize]=1"
curl -fsS https://<public-api-host>/api/single-posts
curl -fsS "https://<public-api-host>/api/bookings/availability?tourId=1&date=2099-01-01"
```

Expected result: requests are answered by Kong routes. Authentication-protected
routes may return `401` without a token, but they must not be answered by
`Travel_TVB_Server`.

## Negative Checks

```bash
curl -I http://<public-api-host>:1337/api/single-posts
curl -I http://<public-api-host>:1337/api/tours
```

Expected result: connection refused, timeout, or firewall rejection. A Strapi
response here means the monolith is still publicly exposed and F7.3 is not done.

## Rollback

Rollback should point traffic to the previous Kong deployment or previous
reverse proxy revision, not to the monolith Strapi API. The monolith no longer
contains booking, tour, chatbot, or auth API implementations after F7.1.

After cutover, follow `docs/runbooks/monolith-decommission-watch.md` for the
one-week watch period before removing the old Strapi container.
