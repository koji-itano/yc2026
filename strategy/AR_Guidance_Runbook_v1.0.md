# Real Physical Gigs
## Canister AR Demo Runbook

**Runbook - v1.0**
**Linear issue:** WIL-9
**Date:** 2026-03-08

## Purpose

Provide the minimum operator checklist to run the tabletop canister AR guidance demo with an `8th Wall first` posture and a timed fallback decision.

## Demo Surfaces

- Operator console: `src/ar-canister-demo/control.html`
- Worker mobile flow: `src/ar-canister-demo/index.html`
- Dashboard receiver: `src/ar-canister-demo/dashboard.html`

## Preflight

1. Run `node src/ar-canister-demo/smoke.js` to confirm the worker, dashboard, and scripted fallback loop still pass.
2. Print or display `src/ar-canister-demo/assets/canister-target-card.svg`.
3. Place the canister on a stable tabletop with even lighting.
4. Open the dashboard receiver on the laptop.
5. Open the operator console and configure:
   - `taskId`
   - `workerId`
   - `instruction`
   - `demoProvider`
6. Open the worker link on the phone.

## 8th Wall First Decision Rule

Use the real 8th Wall route only if all of the following are true before demo lock:

- 8th Wall credentials are already working
- target asset is already trained and available
- the phone can lock the image target within 5 seconds
- target tracking is stable enough to keep the instruction card anchored

If any of those fail, cut immediately to fallback.

## Fallback Order

1. `MindAR` image target
2. `Manual tabletop anchor`

Do not spend demo time debugging provider wiring live.

## Golden Demo Sequence

1. Worker opens the mobile page.
2. Worker confirms the header `Canister secure check`.
3. Worker points at the target and locks the provider.
4. Worker sees `Turn clockwise to secure the cap.`
5. Worker captures `before`.
6. Worker rotates the cap clockwise and taps `Mark cap secured`.
7. Worker captures `after`.
8. Worker taps `Generate proof record`.
9. Worker taps `Dispatch dashboard handoff`.
10. Operator shows the dashboard receiver with before/after evidence and structured payload.
11. Operator marks `verified` or `needs_retry`.
12. Worker view reflects the dashboard response.
13. If retry is needed, operator includes a short note describing what to recapture.
14. If the worker recaptures evidence, the prior verification state is cleared and a fresh proof package is generated.
15. Confirm the dashboard is reviewing the latest attempt number, not an older submission.
16. Call out the event timeline as the audit trail for the task session.

## Hard Timebox

If the chosen provider is not stable after 2 minutes of troubleshooting, switch to the next fallback tier.

## Scripted Fallback

If live interaction becomes unreliable during final prep, use the operator console in `control.html` with:

- `Launch mode: Scripted autoplay`
- a selected provider of `manual` or `mindar`
- optional dashboard auto-verification for a deterministic full-loop run

This mode should be treated as the demo-stability fallback, not the primary plan.

## What To Say During The Demo

- `The phone locks onto the canister target and anchors the guidance step.`
- `The worker captures before and after proof in the same flow.`
- `The proof package is handed off to the dashboard for verification.`
- `If 8th Wall is unavailable, the same worker proof flow continues under MindAR or a manual tabletop anchor.`

## Demo Success Criteria

- Worker sees the instruction text on the phone
- Before/after proof is captured
- Dashboard receives the handoff without manual JSON copy/paste
- The fallback path is ready before demo time, not after failure
