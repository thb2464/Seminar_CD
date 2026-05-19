# Travel TVB E2E Tests

Playwright coverage for the Phase 5 browser workflows in `MICROSERVICES_PLAN.md` section 5.3.

## Scenarios

- `E2E-01 / BW-01`: Browse tours, filter by category/region, view detail.
- `E2E-02 / BW-02`: Register, login state, persistent session.
- `E2E-03 / BW-03`: Login, book tour, create VNPay payment, success return.
- `E2E-04 / BW-04`: View profile, cancel paid booking, verify refund state.
- `E2E-05 / BW-05`: Open chatbot, ask a question, verify grounded response.
- `E2E-06 / BW-07`: Switch language and verify content reloads.

## Run

```bash
cd tests/e2e
npm install
npm test
```

The suite starts the Vite frontend on `http://127.0.0.1:5173` and mocks the Kong gateway at the browser network layer. It does not require live microservices or the VNPay sandbox for these workflow checks.

On a local machine with Google Chrome already installed, you can skip the Playwright browser download during quick validation:

```bash
PLAYWRIGHT_USE_SYSTEM_CHROME=1 npm test
```
