# Phase 3 - Task 03: Frontend Integration And User Experience Design

## User Prompt

```text
Design how the React frontend connects to the Travel TVB backend services.
Include user workflows and graceful error behavior.
```

## AI Understanding

AI understood that the frontend should not need to know internal service locations. It should call one gateway URL and keep user workflows stable even when one service is temporarily unavailable.

## AI Work Report

AI designed frontend integration:

- The frontend uses `VITE_API_GATEWAY_URL` as the single API base URL.
- Auth screens call Identity endpoints.
- Tour pages call Catalog endpoints.
- Booking forms call Booking and then Payment endpoints.
- Content pages call Content endpoints.
- Chat widget calls AI Chatbot endpoints.

AI designed user workflows:

- Browse tours and content without authentication.
- Register or log in before protected account actions.
- Create booking from selected tour and travel date.
- Redirect to VNPay payment URL.
- Return from payment callback and show updated booking status.
- Ask chatbot questions while browsing or planning.

AI designed graceful degradation:

- If AI Chatbot is unavailable, tour browsing still works.
- If Content Service is unavailable, booking and payment still work.
- If Payment Service is unavailable, booking can show a clear payment retry state.
- If Catalog Service is unavailable, booking form blocks tour selection and shows a meaningful error.

## Deliverables

- Frontend service map.
- User workflow map.
- Error boundary plan.
- Gateway URL configuration plan.

## Validation Notes

The task was complete when the frontend could be implemented against a single gateway while preserving clear user behavior during service failures.

## Next Prompt

```text
Begin development by creating the infrastructure foundation, gateway configuration, shared libraries, and local development stack.
```
