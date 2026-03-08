# Demo Runbook v1.0

## Purpose

Operate the recovered `WIL-8` prototype smoothly during a live tabletop demo.

## Setup

- Screen 1: dashboard at `/`
- Screen 2: worker flow at `/worker`
- Prop: tabletop canister with visible cap state
- Fallback: use the built-in sample proof bundle from the worker screen

## Two-screen live path

1. Reset the demo from the dashboard.
2. Open the worker flow on a phone or second browser window.
3. Click `Accept bounty`.
4. Click `Start task`.
5. Capture or upload a before image.
6. Secure the canister cap.
7. Capture or upload an after image.
8. Click `Submit proof`.
9. Wait for the dashboard to advance to `VERIFIED` and `PAID`.
10. Export the audit JSON if a handoff artifact is needed.

## Single-screen fallback

1. Open only the dashboard.
2. Click `Auto-run sample flow`.
3. Narrate the state changes.
4. Stop on the audit record and before/after evidence.

## What to emphasize

- The value is guided execution plus verification plus audit trail.
- The task remains a safe `green task`.
- The payout state makes the marketplace loop legible.
- The JSON block is the artifact for downstream systems.
