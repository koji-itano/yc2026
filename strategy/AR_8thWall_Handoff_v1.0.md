# Real Physical Gigs
## 8th Wall Handoff Checklist for Canister Demo

**Handoff note - v1.0**
**Linear issue:** WIL-9
**Date:** 2026-03-08

## Purpose

Convert the current browser prototype into a real `8th Wall Image Targets` demo as soon as credentials and Studio assets are available.

This note exists to remove ambiguity from the external blocker. The codebase already has:

- a worker flow,
- a dashboard receiver,
- a proof handoff channel,
- an SDK bridge contract.

The missing work is now mostly 8th Wall setup and wiring, not product definition.

## What Already Exists In Repo

- Worker mobile flow: `src/ar-canister-demo/index.html`
- Shared AR bridge API: `window.canisterGuidanceApp.targetFound(...)`
- 8th Wall callback example: `src/ar-canister-demo/bridge-examples/8thwall-target-bridge.example.js`
- Dashboard receiver: `src/ar-canister-demo/dashboard.html`
- Manual and MindAR fallback paths

## External Inputs Required

- 8th Wall account access
- 8th Wall project for this demo
- trained image target named `canister-tabletop-target`
- hosted project URL or export path
- final target image asset approved for tracking

## Target Asset Requirements

Use a target with:

- strong corners,
- asymmetric features,
- high local contrast,
- no large flat areas,
- printable layout compatible with the tabletop canister setup.

Do not use:

- glossy reflections,
- repetitive patterns with weak uniqueness,
- a target smaller than the visible canister interaction area.

## Implementation Steps

1. Upload the target image to 8th Wall Studio and confirm training succeeds.
2. Name the target `canister-tabletop-target`.
3. In the 8th Wall project, hook target found/lost callbacks to the bridge contract.
4. Forward those callbacks into:
   - `window.canisterGuidanceApp.targetFound({ name, provider: "8thwall", x, y, scale })`
   - `window.canisterGuidanceApp.targetLost()`
5. Confirm the worker page still owns:
   - instruction text,
   - before/after proof capture,
   - proof dispatch,
   - verification loop.
6. Open the dashboard receiver and verify proof dispatch still works unchanged.

## Acceptance Check For The Real 8th Wall Path

The 8th Wall route is complete only if all of the following are true:

- worker page shows `Provider: 8th Wall Image Target`
- target lock occurs without manual fallback
- the anchored instruction appears near the canister target
- worker can capture before/after proof in the same flow
- dashboard receives the proof package
- dashboard can send `verified` or `needs_retry` back to worker

## Demo-Time Cut Rule

If any of the following fail during final demo prep, cut to fallback immediately:

- target does not lock in under 5 seconds
- tracking jitters enough to make the overlay unreliable
- camera permissions or hosted page loading are unstable
- proof handoff breaks after integrating 8th Wall

Fallback order:

1. MindAR
2. Manual tabletop anchor

## Recording Guidance

For the final video:

- record one run using the real 8th Wall path only if it is already stable,
- otherwise record the stable fallback and state that the same proof flow supports an 8th Wall image-target route when credentials are enabled,
- never demo a half-working target tracker live.

## Definition Of Ready To Merge Real 8th Wall

- 8th Wall callbacks are wired into the existing bridge contract
- no changes are required to dashboard handoff semantics
- no changes are required to worker proof capture semantics
- fallback still works if 8th Wall is disabled
