# Real Physical Gigs Tabletop Canister Demo Runbook v1.0

## Scope

This document defines the exact tabletop-only demo setup for the metal canister scenario used in the hackathon room.

- Alignment source: `README.md` and `SPEC.md`
- Note: this runbook is now aligned with the current repository [`SPEC.md`](/Users/wildman/GitHub/yc2026/SPEC.md).
- Companion checklist: `strategy/tabletop_canister_onsite_asset_checklist_v1.0.md`
- Companion quick card: `strategy/tabletop_canister_demo_quick_card_v1.0.md`
- Companion print sheet: `strategy/tabletop_canister_label_pack_v1.0.md`
- Companion UI copy sheet: `strategy/tabletop_canister_demo_copy_sheet_v1.0.md`
- Companion run-of-show: `strategy/tabletop_canister_demo_run_of_show_v1.0.md`
- Companion doc map: `strategy/tabletop_canister_demo_doc_map_v1.0.md`
- Companion acceptance matrix: `strategy/tabletop_canister_demo_acceptance_matrix_v1.0.md`
- Demo class: `green task` only
- Safety boundary: no pressure, no heat, no chemicals, no electricity, no tools, no sharp objects, no floor movement

## Demo Goal

Show one reliable path from AI alert to operator guidance to verified completion to simulated payout, using a desk-safe canister prop and a phone camera.

## Exact Physical Props And Labels

| Item | Qty | Exact label text | Notes |
|---|---:|---|---|
| Metal canister prop with lid/cap that can be visibly open vs closed | 1 | `VALVE #3` | Main tabletop asset. Must stay empty and room-safe. |
| Red cap, red knob, or red tape on the cap area | 1 | `TURN THIS` | Gives the camera an obvious target. |
| Printed image target card placed under or behind the canister | 1 | `TRACKER A` | Primary AR anchor for 8th Wall Image Targets. |
| Base card or tent card naming the asset | 1 | `Pressure Vessel Demo - Tabletop Only` | Makes the prop legible on camera. |
| Small alert placard near laptop | 1 | `Pressure anomaly detected` | Helps the first dashboard shot read instantly. |
| Status card for audit-log shot | 1 | `BEFORE`, `AFTER`, `VERIFIED`, `PAYOUT RELEASED` | Optional if the UI already shows these clearly. |
| Laptop showing dashboard | 1 | none | Operator / control screen. |
| Smartphone showing worker view | 1 | none | Camera, AR, and task guidance. |
| Phone stand or stable grip | 1 | none | Avoid shaky footage during live demo. |
| Neutral tabletop mat or paper background | 1 | none | Reduces visual clutter behind the canister. |
| Gaffer tape or painter's tape | 1 roll | `DO NOT MOVE` on two small table markers | Marks laptop and canister positions. |
| Small cleaning cloth | 1 | none | Wipe reflective glare off the canister before filming. |
| Power bank and charging cable | 1 each | none | Keep the phone alive during repeated takes. |

## Table Layout

Place everything on one desk and keep all movement above the table plane.

1. Put the canister at the center of the table, about one forearm length from the phone position.
2. Place the `TRACKER A` image target flat under the canister base or upright directly behind it.
3. Put the laptop on the left side of the table, angled 20 to 30 degrees toward the audience camera.
4. Put the phone start position on the right side of the table and mark it with tape.
5. Keep the background plain. Remove bottles, bags, badges, and cords from the frame.
6. Set overhead light so the cap edge is readable without hot reflections.

## Pre-Show Setup Checklist

- Canister is empty, cool, sealed from any real system, and used only as a prop.
- `VALVE #3`, `TURN THIS`, `TRACKER A`, and `Pressure Vessel Demo - Tabletop Only` labels are attached and readable.
- Cap starts in the `open / fault` state agreed by the team.
- Laptop dashboard is already on the alert-ready screen.
- Phone is unlocked, brightness high, camera permission granted, and screen rotation locked.
- 8th Wall Image Target build is open and tested on the phone.
- MindAR backup build or URL is open in another tab and ready.
- Final fallback mode is available: static overlay box plus manual `Capture Before` / `Capture After`.
- Demo timer is visible to the presenter.
- Simulated payout text is prepared as `$15 released` or equivalent.

## Live Operator Flow

This is the gold path. Keep it under 60 seconds live, or 75 seconds if narrating slowly.

1. Laptop operator triggers the alert: `Valve #3 pressure anomaly. Physical inspection required.`
2. Dashboard shows the task card with reward and state `DISPATCHING`.
3. Worker picks up the phone and opens the task.
4. Phone screen says `Approach Valve #3` and frames the canister.
5. AR locks to `TRACKER A` and highlights the red cap area.
6. Worker captures `BEFORE`.
7. Phone instruction changes to `Close the valve by turning the red cap clockwise.`
8. Worker closes the cap in one smooth motion while keeping the canister on the table.
9. Phone captures `AFTER`.
10. Verification runs and the phone flashes `VERIFIED`.
11. Laptop dashboard updates to show before/after images, operator, timestamp, and JSON audit log.
12. Dashboard closes with `Task complete. Payment released. Maintenance record filed.`

## Operator Cues

Use these short lines verbatim if needed.

- Presenter: `The AI detects an anomaly and dispatches a physical inspection.`
- Worker operator: `Opening task and acquiring the target.`
- Presenter: `The phone guides the operator to the exact control point.`
- Worker operator: `Capturing before, closing the cap, capturing after.`
- Presenter: `Now we verify and release payment with an audit trail.`

## Filming Sequence

Use this shot order for the 90-second submission and for onsite replay.

1. Shot 1, 0-10 sec: laptop close-up with the alert appearing.
2. Shot 2, 10-22 sec: split or cut to the phone acquiring the canister target.
3. Shot 3, 22-38 sec: over-the-shoulder view of the phone with visible AR highlight on the red cap.
4. Shot 4, 38-50 sec: hand closes the cap on the tabletop.
5. Shot 5, 50-62 sec: phone shows `VERIFIED`.
6. Shot 6, 62-80 sec: laptop shows before/after images plus the structured audit log.
7. Shot 7, 80-90 sec: laptop final state with `Payment released` and Real Physical Gigs branding.

## AR Failure And Fallback Behavior

Primary path uses `8th Wall Image Targets`. Fallback path uses `MindAR`. Final recovery mode uses a static overlay and manual image capture so the demo can still finish.

### Recovery ladder

1. If 8th Wall loses tracking for less than 3 seconds, hold the phone still and reacquire `TRACKER A`.
2. If 8th Wall fails twice, switch immediately to the preloaded MindAR backup.
3. If tracking still fails or the room is too reflective, switch to `Guided Manual Mode`.

### Guided Manual Mode

- Keep the same verbal story and same tabletop prop.
- Replace AR highlight with a fixed on-screen frame box and arrow pointing to the red cap.
- Worker centers the canister manually, captures `BEFORE`, performs the cap turn, then captures `AFTER`.
- Verification and simulated payout still run from the before/after images.
- Presenter line: `AR tracking is degraded in this lighting, so Real Physical Gigs falls back to guided manual verification without changing the task flow.`

## Role Splits

### 2-person team

| Role | Responsibilities |
|---|---|
| Presenter / dashboard operator | Start alert, narrate, monitor timing, show payout and audit log, call fallback if needed. |
| Worker / phone operator | Hold phone, acquire target, capture before/after, turn cap, keep motion clean and tabletop-only. |

### 3-person team

| Role | Responsibilities |
|---|---|
| Presenter | Narration, timing, fallback call, audience focus. |
| Dashboard operator | Trigger alert, advance states, hold laptop framing for audit-log and payout shots. |
| Worker / phone operator | Run AR or fallback flow, manipulate the cap, keep the prop centered and steady. |

## Venue-Safe Rules

- No real pressurized object, no gas cartridge, and no powered valve substitute.
- No liquid inside the canister during the demo.
- No standing, walking, or floor staging; all action stays on one desk.
- No tools, blades, hot surfaces, or electrical modifications.
- No audience participation.
- If the prop shifts or drops, stop the take, reset the table markers, and restart from the alert.

## Fast Reset Between Takes

1. Reopen the cap to the starting state.
2. Return the canister to the tape mark.
3. Confirm `TRACKER A` is still visible and flat.
4. Clear old before/after images if the UI caches them.
5. Return the dashboard to the alert-ready state.
6. Wipe glare or fingerprints off the canister and phone lens.

## Done Condition

The demo is ready when a new operator can run the full tabletop sequence from alert to verified payout in one minute without improvising the setup.
