# Dispatch Demo v1.1

## Goal

Recover the lost `WIL-8` deliverable as a local runnable prototype for the hackathon demo.

This prototype covers:

- dispatch dashboard,
- worker acceptance and proof capture,
- simulated verification,
- payout release,
- JSON audit export.

## Golden path

1. Dashboard opens a bounty for `CANISTER-03`.
2. Worker accepts the bounty on `/worker`.
3. Worker starts the task.
4. Worker captures `before` proof.
5. Worker secures the canister cap.
6. Worker captures `after` proof.
7. Worker submits proof.
8. System advances `PROOF SUBMITTED -> VERIFIED -> PAID`.
9. Dashboard shows proof images and structured audit JSON.

## Demo constraints

- Tabletop-only
- `green task` only
- No hazardous work
- No special hardware required

## Local run

```bash
npm start
```

Then open:

- dashboard: `http://127.0.0.1:4174/`
- worker: `http://127.0.0.1:4174/worker`

## Validation

```bash
npm run validate
npm run validate:server
```
