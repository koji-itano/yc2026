# AR Canister Demo

Lightweight mobile web prototype for `WIL-9`.

## What it covers

- phone camera access,
- `8th Wall -> MindAR -> manual` provider selection,
- anchored instruction overlay,
- before/after proof capture,
- structured proof record generation,
- dashboard-ready proof handoff,
- worker and dashboard event timelines.
- optional scripted autoplay mode for demo fallback.

The repo does not contain licensed 8th Wall assets, so the default runnable path is the manual tabletop anchor. If `window.XR8` or `window.MINDAR` is present, the same UI can accept image-target callbacks through the bridge examples.

For the real 8th Wall completion checklist, see:

- `strategy/AR_8thWall_Handoff_v1.0.md`

## Run

Serve this folder over a local web server from the repository root:

```bash
cd /Users/wildman/code/yc2026-symphony-workspaces/WIL-9
python3 -m http.server 4173
```

Then open:

`http://localhost:4173/src/ar-canister-demo/`

For the dashboard receiver view, open:

`http://localhost:4173/src/ar-canister-demo/dashboard.html`

For the operator launch console, open:

`http://localhost:4173/src/ar-canister-demo/control.html`

Use a phone browser for camera access.

For a repo-local smoke check without a live browser session, run:

```bash
node src/ar-canister-demo/smoke.js
```

This validates control-link generation, worker-to-dashboard handoff, verification return, and scripted autoplay using a Node test harness with browser mocks.

The integration contract artifacts live at:

- `src/ar-canister-demo/contracts/canister-proof.schema.json`
- `src/ar-canister-demo/contracts/proof-handoff.schema.json`
- `src/ar-canister-demo/contracts/verification.schema.json`

## Demo flow

1. Tap `Start session`.
2. Point the camera at the tabletop canister and target card.
3. If no AR SDK is loaded, tap `Lock fallback anchor`.
4. Tap `Capture before`.
5. Rotate the cap clockwise and tap `Mark cap secured`.
6. Tap `Capture after`.
7. Tap `Generate proof record`.
8. Optionally copy, download, or dispatch the handoff package.
9. In the separate dashboard page, verify the structured handoff, metadata, and before/after evidence.
10. Mark the result as `verified` or `needs_retry` in the dashboard and confirm the worker page receives the update.
11. Use the verification note to tell the worker exactly what to retry when needed.
12. If the worker recaptures evidence after a retry, the app clears the old review state and generates a fresh handoff package.
13. Each regenerated proof package increments its attempt number so the dashboard can distinguish fresh evidence from stale review state.

For a deterministic fallback run, use `Launch mode: Scripted autoplay` in the control page.
That mode auto-starts the worker, auto-locks the selected provider, captures proof, dispatches the handoff, and can auto-verify from the dashboard.

## Files

- `control.html` - operator launch console
- `control.js` - deep-link and launch URL generation
- `dashboard.html` - laptop-side proof receiver
- `dashboard.js` - dashboard handoff and verification loop
- `index.html` - mobile UI
- `styles.css` - presentation and overlay styling
- `app.js` - state machine, camera handling, proof record generation
- `smoke.js` - dependency-free Node smoke test for the prototype flow
- `contracts/canister-proof.schema.json` - worker proof payload contract
- `contracts/proof-handoff.schema.json` - dashboard handoff wrapper contract
- `contracts/verification.schema.json` - dashboard-to-worker verification contract
- `assets/canister-target-card.svg` - printable tabletop target card candidate
- `bridge-examples/8thwall-target-bridge.example.js` - callback example
- `bridge-examples/mindar-target-bridge.example.js` - callback example

## Wiring a real provider

The app exposes:

```js
window.canisterGuidanceApp.targetFound({
  name: "canister-tabletop-target",
  provider: "8thwall",
  x: 0.5,
  y: 0.54,
  scale: 1
})

window.canisterGuidanceApp.targetLost()
```

Any AR SDK adapter only needs to call those methods.

The proof-flow integration points are:

```js
window.canisterGuidanceApp.getProofRecord()
window.canisterGuidanceApp.dispatchProofRecord()
window.canisterGuidanceApp.onProofReady = (handoff) => {
  console.log("dashboard handoff", handoff)
}
```

The page also dispatches a browser event when handoff occurs:

```js
window.addEventListener("rpg:proof-ready", (event) => {
  console.log(event.detail)
})
```

The worker flow also publishes the handoff to:

- `localStorage["rpg:latest-proof-handoff"]`
- `BroadcastChannel("rpg-proof-handoff")`

The dashboard sends verification responses back to the worker over:

- `localStorage["rpg:latest-verification"]`
- `BroadcastChannel("rpg-verification")`

## URL parameters

These query params let a dashboard deep-link into the worker flow:

- `taskId`
- `taskLabel`
- `instruction`
- `workerId`
- `taskClass`
- `proofEndpoint`
- `demoScript`

Example:

```text
http://localhost:4173/src/ar-canister-demo/?taskId=WIL-9-canister&workerId=worker-07&taskClass=green%20task&instruction=Turn%20clockwise%20to%20secure%20the%20cap.&demoScript=autoplay
```
