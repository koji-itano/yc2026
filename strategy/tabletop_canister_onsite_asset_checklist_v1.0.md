# Real Physical Gigs Tabletop Canister Onsite Asset Checklist v1.0

## Scope

This checklist is the companion to `strategy/tabletop_canister_demo_runbook_v1.0.md`.

- Purpose: make the tabletop canister demo easy to pack, stage, reset, and rerun in a crowded hackathon room
- Print source for labels: `strategy/tabletop_canister_label_pack_v1.0.md`
- Demo class: `green task` only
- Safety boundary: prop-only, tabletop-only, venue-safe

## Pack List

| Item | Qty | Must have | Owner | Notes |
|---|---:|---|---|---|
| Metal canister prop with visibly open vs closed cap state | 1 | yes | demo lead | Must be empty and disconnected from any real system. |
| Red cap, red knob, or red tape marker | 1 | yes | prop owner | Gives the camera a clear target. |
| `TRACKER A` printed image target | 2 | yes | AR owner | Bring one live card and one spare. |
| `VALVE #3` asset label | 1 | yes | prop owner | Attach to the canister body. |
| `TURN THIS` cap label | 1 | yes | prop owner | Attach near the cap action point. |
| `Pressure Vessel Demo - Tabletop Only` base card | 1 | yes | presenter | Keeps the prop readable on camera. |
| `Pressure anomaly detected` placard | 1 | yes | presenter | Supports the opening dashboard shot. |
| `BEFORE`, `AFTER`, `VERIFIED`, `PAYOUT RELEASED` status cards | 1 set | no | presenter | Only needed if the UI text is not prominent enough on camera. |
| Laptop with dashboard build loaded | 1 | yes | dashboard operator | Keep charger connected if possible. |
| Smartphone with worker view loaded | 1 | yes | worker operator | Camera permission should already be granted. |
| Phone stand or grip | 1 | yes | worker operator | Stabilizes the tracking shot. |
| Power bank and charging cable | 1 each | yes | worker operator | Needed for repeated takes. |
| Neutral tabletop mat or paper background | 1 | yes | presenter | Reduces clutter and reflections. |
| Gaffer tape or painter's tape | 1 roll | yes | presenter | Marks prop and device positions. |
| Cleaning cloth | 1 | yes | presenter | Removes glare and fingerprints. |
| Backup phone or secondary browser tab for fallback | 1 | no | AR owner | Useful if the main phone session gets stuck. |

## Printed Label Pack

Prepare these exact strings before arriving onsite.

| Label | Count | Placement |
|---|---:|---|
| `VALVE #3` | 1 | Canister body |
| `TURN THIS` | 1 | Cap or cap-side marker |
| `TRACKER A` | 2 | One live target, one spare |
| `Pressure Vessel Demo - Tabletop Only` | 1 | Base card or tent card |
| `Pressure anomaly detected` | 1 | Beside laptop |
| `DO NOT MOVE` | 2 | Tape markers for canister and phone start position |
| `BEFORE` | 1 | Optional audit-log shot support |
| `AFTER` | 1 | Optional audit-log shot support |
| `VERIFIED` | 1 | Optional audit-log shot support |
| `PAYOUT RELEASED` | 1 | Optional audit-log shot support |

## Arrival Checklist

- Claim one stable desk with room for a laptop on the left, canister in the center, and phone on the right.
- Confirm the entire story can be performed without standing, walking, or using the floor.
- Remove unrelated bags, drinks, badges, and charging clutter from the camera frame.
- Check overhead lighting and move the desk setup slightly if the canister reflects too strongly.
- Confirm venue Wi-Fi or hotspot works well enough for the dashboard and phone flow.
- Open the dashboard, primary AR build, MindAR backup, and manual fallback mode before the demo slot starts.

## Desk-Ready Checklist

- Canister is empty, clean, cool, and visibly in the `open / fault` start state.
- `VALVE #3`, `TURN THIS`, `TRACKER A`, and `Pressure Vessel Demo - Tabletop Only` are readable from arm's length.
- Laptop is angled toward the audience camera and already showing the alert-ready screen.
- Phone brightness is high, rotation is locked, and camera permission is active.
- Tape markers for canister position and phone start position are applied.
- Power bank is connected or within reach.
- Cleaning cloth is on the table edge for fast resets.
- Presenter has the first narration line ready.

## Go Or No-Go Check

Run this check 2 to 3 minutes before a judged take.

| Check | Pass condition | If failed |
|---|---|---|
| AR target lock | 8th Wall acquires `TRACKER A` within 3 seconds | Switch to MindAR and retest once |
| Manual fallback | Fixed overlay and manual capture buttons are reachable | Reload the fallback build before starting |
| Cap readability | Open vs closed state is obvious on phone camera | Add light, reduce glare, or reapply red marker |
| Dashboard payout state | Final state can display `Payment released` cleanly | Preload the end state or prepare a manual trigger |
| Before/after capture | Images appear on the dashboard | Refresh the phone session and clear stale cache |

## Role Handout

Use this as a quick onsite assignment card.

| Role | Carry | Owns |
|---|---|---|
| Presenter | label pack, tape, cloth | Table staging, narration, timing, final fallback call |
| Dashboard operator | laptop, charger | Alert trigger, audit-log reveal, payout close |
| Worker / phone operator | phone, stand, power bank | Target acquisition, before/after capture, cap turn |

For a 2-person team, combine presenter and dashboard operator.

## Fallback Kit

Keep these ready without opening a bag mid-demo.

- MindAR backup page already loaded in another tab
- Manual overlay mode with `Capture Before` and `Capture After`
- Spare `TRACKER A` printout
- Spare red tape for the cap marker
- Cloth for glare recovery
- One sentence fallback line: `Tracking is degraded in this lighting, so Real Physical Gigs is switching to guided manual verification without changing the task flow.`

## Reset Checklist

- Reopen the cap to the start state.
- Put the canister back on its tape mark.
- Confirm `TRACKER A` is flat, visible, and not shadowed.
- Clear prior before/after images if the UI cached them.
- Return the dashboard to the alert-ready state.
- Wipe the canister and phone lens.
- Recheck that the table still looks clean on camera.

## Done Condition

The onsite setup is ready when the team can unpack, stage, and run the full tabletop demo in under 3 minutes, then reset for a second take in under 45 seconds.
