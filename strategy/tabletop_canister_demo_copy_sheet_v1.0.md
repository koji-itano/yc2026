# Real Physical Gigs Tabletop Canister Demo Copy Sheet v1.0

## Scope

This file pins the exact on-screen copy for the tabletop canister demo.

- Use the same strings on the laptop, phone, and filmed overlays
- Keep wording stable so the demo feels intentional and repeatable
- Pair with `strategy/tabletop_canister_demo_runbook_v1.0.md`

## Laptop Alert State

Use this for the opening dashboard shot.

| UI element | Exact copy |
|---|---|
| Alert title | `Valve #3 pressure anomaly` |
| Alert body | `Physical inspection required.` |
| Severity chip | `HIGH` |
| Task reward | `$15 payout on verification` |
| Task state | `DISPATCHING` |
| Primary CTA | `Dispatch operator` |

## Laptop Task Progress States

| State | Exact copy |
|---|---|
| Waiting | `Waiting for operator` |
| In progress | `Operator en route` |
| Before captured | `Before image captured` |
| Verification running | `Verifying action` |
| Verified | `Task complete. Payment released. Maintenance record filed.` |
| Failed fallback state | `Verification pending manual review.` |

## Phone Worker States

| Moment | Exact copy |
|---|---|
| Task header | `Valve #3 inspection` |
| Initial prompt | `Approach Valve #3` |
| Tracking prompt | `Acquire TRACKER A` |
| Before prompt | `Capture BEFORE` |
| Action prompt | `Close the valve by turning the red cap clockwise.` |
| After prompt | `Capture AFTER` |
| Verification running | `Verifying` |
| Success state | `VERIFIED` |
| Manual fallback state | `Guided Manual Mode` |

## Optional Helper Copy

Use only if a secondary line is needed on the phone.

| Moment | Exact copy |
|---|---|
| Tracking helper | `Center the canister in frame.` |
| Action helper | `Keep the canister on the table.` |
| Verification helper | `Hold still while the audit record updates.` |

## Presenter Fallback Line

Use this exact sentence when AR tracking degrades.

`Tracking is degraded in this lighting, so Real Physical Gigs is switching to guided manual verification without changing the task flow.`

## Final Laptop Close State

Use this for the last hero shot.

| UI element | Exact copy |
|---|---|
| Status chip | `PAYOUT RELEASED` |
| Summary line | `Task complete. Payment released. Maintenance record filed.` |
| Footer brand | `Real Physical Gigs` |

## Audit Log Example

Use this as the visible JSON block on the laptop if a sample payload is needed.

```json
{
  "taskId": "VALVE-3-INSPECTION-001",
  "asset": "VALVE #3",
  "operator": "operator-01",
  "action": "close_cap_clockwise",
  "verification": "pass",
  "payout": "$15 released",
  "trackingMode": "8th_wall",
  "beforeCaptured": true,
  "afterCaptured": true,
  "timestamp": "2026-03-08T13:00:00+09:00"
}
```

## Copy Rules

- Keep all visible status words uppercase only where already specified, such as `HIGH`, `DISPATCHING`, `VERIFIED`, and `PAYOUT RELEASED`
- Avoid adding industrial language that implies a real hazardous system
- Keep the final dashboard line exactly as written so the filmed close matches the PRD and runbook
