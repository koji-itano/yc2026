# Real Physical Gigs
## AR Guidance for Tabletop Canister Task

**Implementation note - v1.1**
**Linear issue:** WIL-9
**Date:** 2026-03-08

## Purpose

Define the smallest shippable phone-based AR guidance path for the tabletop canister demo, with `8th Wall Image Targets` as the primary route and a documented fallback if the licensed integration cannot be completed inside the hackathon window.

## Scope Guardrails

- Task class: `green task`
- Demo task: tabletop canister cap secure check
- Worker instruction: `Turn clockwise to secure the cap.`
- Out of scope: field repair, pressure systems, high-voltage assets, medical tasks, or any untrained-citizen hazard scenario

The canister demo is a low-risk proxy for the broader worker guidance flow. It should be framed as a training-safe tabletop validation, not as live industrial maintenance.

## User Outcome

The worker points a phone at the tabletop canister setup and sees:

- a camera view,
- an anchored instruction card near the target,
- a clear step to rotate the cap clockwise,
- before/after proof capture,
- a structured proof record ready for dashboard handoff.

This is not a standalone AR toy. The AR layer exists only to improve worker execution and feed the proof flow.

## Golden Path

1. Worker opens the mobile guidance link.
2. Camera starts and the app selects the best available anchor provider in this order:
   - `8th Wall Image Target`
   - `MindAR Image Target`
   - `Manual tabletop anchor`
3. Worker points at the tabletop target card next to the canister.
4. Target lock occurs and the instruction card is anchored near the canister target.
5. Worker captures `before` proof.
6. Worker performs the action: `Turn clockwise to secure the cap.`
7. Worker captures `after` proof.
8. App produces a structured proof package for the dashboard or verification service.

## Primary Path: 8th Wall First

### Why 8th Wall

- Best mobile browser AR fit for the hackathon demo
- Strong image-target tracking without requiring a native app
- Preserves the repo's browser-first direction

### Required artifacts

- One high-feature tabletop target image uploaded to 8th Wall Studio
- Image target name: `canister-tabletop-target`
- One anchor callback that tells the web UI when tracking is found or lost
- Instruction overlay linked to the tracked image pose

### Integration contract

The web UI should react to two events:

- `targetFound`
- `targetLost`

Payload for `targetFound` should include:

- `name`
- `x`
- `y`
- `scale`
- `provider`

That contract keeps the worker proof UI independent from the AR SDK. The SDK only solves anchor tracking. The app still owns instructions, proof capture, and audit output.

## Fallback Path

### Fallback A: MindAR Image Target

Use `MindAR` if:

- 8th Wall credentials are unavailable,
- 8th Wall Studio target setup is incomplete,
- or the hosted 8th Wall project cannot be wired in time.

MindAR uses the same target-driven mental model:

- point camera at target,
- lock anchor,
- show instruction,
- capture proof.

The UI contract should remain the same so the proof flow does not change.

### Fallback B: Manual tabletop anchor

Use manual anchor if image-target tracking is not reliable enough for demo time.

Manual mode requirements:

- worker aligns the canister within a fixed guide frame,
- worker taps `Lock fallback anchor`,
- instruction card appears in the same place every run,
- before/after proof capture still completes.

This still satisfies the demo need because the proof flow remains intact and compatible with the tabletop setup.

## Tabletop Setup

- Place the printed target card directly behind or under the canister
- Keep the cap and target in the same phone frame
- Use a plain table surface and stable lighting
- Keep the distance between phone and canister roughly 25-45 cm for reliable demo framing
- Avoid reflective glare on the cap

## Worker Proof Flow Integration

The AR layer must hand off into the same worker proof sequence every time:

1. `task_opened`
2. `anchor_locked`
3. `before_captured`
4. `instruction_completed`
5. `after_captured`
6. `proof_submitted`
7. `verification_received`

Minimum proof record fields:

- `sessionId`
- `taskId`
- `taskLabel`
- `workerId`
- `taskClass`
- `attemptNumber`
- `provider`
- `fallbackUsed`
- `instruction`
- `beforeCapturedAt`
- `instructionCompletedAt`
- `afterCapturedAt`
- `anchorLockedAt`
- `result`
- `eventLog`

Recommended result values:

- `proof_submitted`
- `ready_for_verification`
- `verified`
- `needs_retry`

Recommended handoff routes:

- browser event: `rpg:proof-ready`
- optional webhook-ready payload for dashboard ingestion
- browser-local bridge for hackathon demos: `localStorage` + `BroadcastChannel`

Implementation contract artifacts:

- `src/ar-canister-demo/contracts/canister-proof.schema.json`
- `src/ar-canister-demo/contracts/proof-handoff.schema.json`
- `src/ar-canister-demo/contracts/verification.schema.json`

Recommended worker deep-link inputs:

- `taskId`
- `taskLabel`
- `instruction`
- `workerId`
- `proofEndpoint`

Minimum dashboard receiver behavior:

- detect the latest proof handoff without a manual page refresh,
- show `before` and `after` evidence,
- display `taskId`, `workerId`, `provider`, `attemptNumber`, and `result`,
- send `verified` or `needs_retry` back to the worker flow,
- include a short retry note when the result is `needs_retry`,
- allow the worker to recapture evidence and produce a fresh handoff without stale verification state,
- surface the worker event timeline as an audit trail,
- treat the worker flow as the source of truth rather than duplicating capture logic.

## Demo Framing

Use this wording in the mobile UI:

- Header: `Canister secure check`
- Step label: `Step 2 of 3`
- Instruction: `Turn clockwise to secure the cap.`
- Proof CTA: `Capture before`, `Mark cap secured`, `Capture after`, `Generate proof record`

Use this wording in the dashboard handoff:

- `AR guidance complete`
- `Proof package ready for verification`

## Build Decision

For this repo state, the smallest complete implementation is:

- one strategy note,
- one runnable mobile web prototype,
- one printable target asset,
- one bridge example for 8th Wall and MindAR callbacks.

This is preferable to attempting a partial 8th Wall integration without licensed assets in the repository.

## Current Blockers

- This plan is aligned to the current repository `README.md` and `SPEC.md`.
- No 8th Wall license keys, Studio project export, or target asset bundle are present in the repo.

## Definition of Done for WIL-9

- Mobile flow shows camera-based guidance for the tabletop canister task
- Worker sees `Turn clockwise to secure the cap.`
- Flow supports image-target anchoring when an AR provider is available
- Fallback path is documented and implemented at least as manual tabletop anchoring
- Before/after proof capture is part of the same worker flow
- Structured proof record is generated for dashboard handoff
