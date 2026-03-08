# Real Physical Gigs Tabletop Canister Demo Run Of Show v1.0

## Scope

This is the timed operating sheet for the live tabletop canister demo.

- Use it during rehearsal and immediately before filming
- Pair it with `strategy/tabletop_canister_demo_quick_card_v1.0.md`
- Keep the whole run under 60 seconds live

## 3-Person Run Of Show

| Time | Presenter | Dashboard operator | Worker / phone operator |
|---|---|---|---|
| 0-5 sec | Start narration: `The AI detects an anomaly and dispatches a physical inspection.` | Show laptop alert state | Hold phone at start mark |
| 5-10 sec | Keep attention on laptop | Trigger task from `DISPATCHING` into active state | Raise phone and frame canister |
| 10-18 sec | Say `The phone guides the operator to the exact control point.` | Keep laptop steady for audience camera | Acquire `TRACKER A` |
| 18-24 sec | Pause narration for phone action | Hold dashboard on live task state | Capture `BEFORE` |
| 24-34 sec | Say `Capturing before, closing the cap, capturing after.` | Prepare audit-log state | Turn cap clockwise to closed state |
| 34-40 sec | Keep narration brief | Advance or reveal verification state if needed | Capture `AFTER` |
| 40-46 sec | Say `Now we verify and release payment with an audit trail.` | Show `VERIFIED` transition and audit log | Hold phone steady on success state |
| 46-60 sec | Deliver close line and stop speaking | Show before/after, JSON audit log, and `Payment released` | Lower phone slightly so laptop close shot reads cleanly |

## 2-Person Run Of Show

| Time | Presenter / dashboard operator | Worker / phone operator |
|---|---|---|
| 0-5 sec | Trigger alert and start narration | Hold phone at start mark |
| 5-10 sec | Dispatch task and angle laptop toward camera | Raise phone and frame canister |
| 10-18 sec | Say `The phone guides the operator to the exact control point.` | Acquire `TRACKER A` |
| 18-24 sec | Keep laptop visible and quiet | Capture `BEFORE` |
| 24-34 sec | Say `Capturing before, closing the cap, capturing after.` | Turn cap clockwise to closed state |
| 34-40 sec | Prepare laptop close-state view | Capture `AFTER` |
| 40-46 sec | Say `Now we verify and release payment with an audit trail.` | Hold phone on `VERIFIED` |
| 46-60 sec | Show audit log and `Payment released` on laptop | Lower phone for the closing laptop shot |

## Fallback Insert Point

Use fallback only after a short reacquisition attempt.

| When | Action |
|---|---|
| Tracking fails before `BEFORE` capture | Hold still for up to 3 seconds and reacquire `TRACKER A` |
| Tracking fails twice | Switch to MindAR immediately |
| Tracking still unstable | Say the fallback line and continue in manual overlay mode |

Fallback line:
`Tracking is degraded in this lighting, so Real Physical Gigs is switching to guided manual verification without changing the task flow.`

## Rehearsal Pass Criteria

- The alert-to-payout sequence completes in 60 seconds or less
- No one blocks the canister or laptop from the audience camera
- The worker never lifts the canister off the table
- `BEFORE`, `AFTER`, `VERIFIED`, and payout states are all visible in order
- The presenter can deliver the lines without improvising the wording

## Abort Conditions

- The prop shifts off its tape mark
- The canister glare hides the cap state
- The phone loses framing and cannot reacquire within 3 seconds
- The laptop is on the wrong screen for the close shot

If any abort condition happens, reset fully and restart from the alert.
