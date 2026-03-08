# yc2026 Repository Spec

Status: Draft v1

## 1. Purpose

This repository is the planning and execution workspace for a YC-themed hackathon project in the
`AI Guidance for Physical Work` category.

The current canonical product name is:

> `Real Physical Gigs (R.P.G.)`
>
> A quest-like platform where AI and organizations post real-world tasks, nearby people accept
> them, and phone-based guidance helps them complete the work.

The current hackathon wedge remains the safest and most executable subset of that vision:

> low-risk, guided, verifiable physical micro-tasks with AR support.

This repository currently serves two functions:

1. Strategy and product-definition source of truth.
2. Staging area for hackathon demo specs, implementation plans, and lightweight prototype code.

## 2. Product Thesis

The core insight is not "let untrained people do dangerous work."

The core insight is:

> There are many small real-world tasks that AI cannot do directly, but can decompose, dispatch,
> guide, and verify through humans in the loop.

The product therefore combines:

- map-based quest discovery,
- bounty-style task dispatch,
- nearby labor activation,
- AR guidance at the point of work,
- photo-based proof and verification,
- gamification and lightweight progression,
- safety-based escalation for anything risky or unclear.

## 3. Safety Boundary

This is a hard product boundary.

The system must not route untrained residents into:

- work near energized power lines,
- chainsaw work,
- high-voltage, gas, water, or electrical operations,
- medical tasks,
- traffic-control tasks,
- high-height tasks,
- any task requiring a license, certification, or insurance gate.

Task routing model:

- `green tasks`: safe for general residents
- `yellow tasks`: trained volunteers only
- `red tasks`: licensed professionals only

Anything ambiguous defaults upward in risk tier.

## 4. Hackathon MVP

The hackathon MVP is intentionally narrow.

### 4.1 Demo Story

The system posts a quest-like physical task, assigns it to a nearby worker, guides the worker with
phone-based AR, collects `before` / `after` proof, verifies completion, and marks the task as paid.

### 4.2 Onsite Demo Asset

The tabletop demo asset is a capped metal canister on a desk.

The physical task shown in the demo is:

> Secure the safety cap on a tabletop canister.

This is a stand-in for the broader `Real Physical Gigs` concept because it is safe, visual, fast,
and easy to verify in a crowded hackathon room.

### 4.3 MVP Components

- Quest / dispatcher dashboard
  - Alert card
  - Quest/task status
  - Worker assignment
  - Verification and payout state
- Worker mobile view
  - Map or quest context if available
  - Task acceptance
  - AR guidance
  - `Capture Before`
  - `Capture After`
  - `Submit Proof`
- Verification surface
  - Before/after images
  - Timestamp
  - Verification result
  - Structured JSON log

## 5. Technical Direction

Preferred implementation path:

- frontend dashboard: Vite + React
- mobile AR: 8th Wall Image Targets
- AR fallback: MindAR
- backend: Node.js + Express
- realtime sync: WebSocket or polling
- proof verification: manual-first, Vision API if time permits

Do not introduce unnecessary infrastructure for the MVP.

Avoid:

- native mobile apps,
- custom ML training,
- complex auth,
- production deployment complexity unless explicitly required.

## 6. Repository Layout

- `README.md`
  - top-level repo context
- `event/`
  - organizer, sponsor, and event-source materials
- `strategy/`
  - product, positioning, demo, and pitch documents
- `src/`
  - future prototype or product code if implementation begins

This repo is currently documentation-heavy. Agents should not assume an existing production codebase.

## 7. Work Priorities

Default priority order for autonomous work:

1. Clarify product direction and constraints.
2. Improve demo viability for the hackathon setting.
3. Align the product with the `Real Physical Gigs` quest metaphor where it improves clarity.
4. Create concise, executable implementation plans.
5. Add lightweight prototype code only when directly requested or clearly required by the issue.
6. Preserve existing strategy docs; add new versions instead of rewriting history blindly.

## 8. Output Standards

Changes should optimize for speed of team execution.

Good outputs include:

- tighter PRDs,
- demo scripts,
- screen-by-screen specs,
- implementation checklists,
- concise pitch scripts,
- simple proof-of-concept code,
- safe task taxonomy,
- judge-facing differentiation language.

Avoid bloated documents and speculative architecture.

## 9. Success Criteria

Work is successful when it helps the team do one or more of the following:

- ship a working 90-second demo,
- explain the product clearly in YC terms,
- keep the MVP finishable within hackathon constraints,
- strengthen the moat around execution, verification, and safety,
- make the repo easier for agents and humans to continue from.

## 10. Agent Guidance

When working in this repository:

- read the latest relevant files in `strategy/` before proposing changes,
- preserve the current `Real Physical Gigs` thesis unless the issue explicitly changes it,
- prefer additive versioned docs over destructive rewrites,
- keep claims grounded in the repository context,
- treat safety boundaries as non-negotiable,
- keep every output consistent with a 4-hour hackathon execution model unless told otherwise.
