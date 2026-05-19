# VNPay Callback Failures

Plan section 7.3 scenario: VNPay callback failures.

Use this when `/api/payments/vnpay-return` returns errors, payment success is not reflected in bookings, or users report successful VNPay payment without booking confirmation.

## Quick Triage

1. Check Payment Service logs around the callback time.

   ```bash
   kubectl -n <namespace> logs deploy/payment-service --since=30m
   ```

2. Confirm Kong routes the public callback path to Payment Service.

   ```bash
   curl -I https://<public-api-host>/api/payments/vnpay-return
   ```

   A `4xx` response can be normal without VNPay query parameters; a gateway `404` or monolith response is not.

3. Confirm `VNPAY_RETURN_URL`, terminal code, hash secret, and locale/currency settings come from the expected Secret.

   ```bash
   kubectl -n <namespace> describe deploy payment-service
   kubectl -n <namespace> get secret payment-service-secret
   ```

4. Check VNPay sandbox/production status page or merchant portal for upstream incidents.

## HMAC Verification

Symptoms of HMAC problems:

- `secure hash invalid`,
- callback query missing `vnp_SecureHash`,
- amount or booking id changed before verification,
- terminal code does not match the environment.

Do not log full payment secrets. Redact query strings before sharing logs.

## Booking/Payment State Checks

1. Find the payment row by booking id or VNPay transaction id.
2. Confirm the Payment Service published `PaymentCompleted` or `PaymentFailed`.
3. Confirm Booking Service consumed the event and updated booking status.

PromQL:

```promql
sum by (event_type, outcome) (increase(domain_events_published_total{service="payment-service"}[1h]))
sum by (path, status_code) (increase(http_requests_total{service="payment-service",path="/api/payments/vnpay-return"}[1h]))
```

## Recovery

1. If the callback URL is wrong, patch the environment overlay and restart Payment Service.
2. If HMAC config is wrong, fix the Secret source and restart Payment Service.
3. If VNPay is degraded, leave bookings `Pending` and let users retry after the upstream recovers.
4. If the payment succeeded but the event publish failed, reconcile from Payment Service DB to Booking Service with a reviewed one-off script or replay event.
5. If a payment failed incorrectly, keep the booking `Pending` unless the payment provider proves funds were captured.

## Escalation

Escalate to the payment owner if:

- real funds were captured but Booking Service did not confirm,
- multiple callbacks fail HMAC verification after a config check,
- VNPay reports an incident,
- refunds or duplicate charges are possible.

## Do Not

- Do not mark a booking paid from a browser screenshot alone.
- Do not commit VNPay credentials or print hash secrets in logs.
- Do not replay callbacks without verifying idempotency for the booking/payment pair.
