# Reverse Proxy Cutover

Production API traffic enters the platform through Kong. The monolith Strapi
container must not be exposed on the production hostname after Sprint 7.

## Files

- `kong-only.nginx.conf` - Nginx server block for a production API hostname that proxies every request to Kong.

## Expected State

- DNS for the public API hostname resolves to the reverse proxy or load balancer in front of Kong.
- The reverse proxy has no upstream that points to `Travel_TVB_Server` or port `1337`.
- Kong is reachable from the reverse proxy on its private proxy listener, default `127.0.0.1:8000` for the single-host deployment.
- The frontend uses `VITE_API_GATEWAY_URL=https://<public-api-host>` in production builds.
- Strapi admin access, if still needed during the watch period, uses a private operator-only address outside the public API hostname.

## Validation

Run the detailed checklist in `docs/runbooks/dns-kong-cutover.md` before marking F7.3 complete.

