# Symphony Import Plan v1.0

2026-03-08

## Purpose

Prioritize which Symphony workspace outputs should be merged back into the main `yc2026` repository
first.

The priority rule is simple:

1. Anything that directly increases demo readiness comes first.
2. Anything that creates a runnable artifact comes before speculative strategy expansion.
3. Anything still anchored to `Guidance OS` naming should be merged only after or together with the
   `R.P.G.` rename pass.

## Tier 1: Merge First

These are the highest-value artifacts because they directly improve the live demo and are already
close to usable.

### WIL-8: Dispatch + proof prototype

Source workspace:

- `/Users/wildman/code/yc2026-symphony-workspaces/WIL-8`

Recommended imports:

- `prototype/`
- `package.json`
- `strategy/Dispatch_Demo_v1.1.md`
- `strategy/Demo_Runbook_v1.0.md`

Why first:

- This is the closest thing to a runnable demo surface.
- It covers the core story: task open, accept, proof submit, verify, paid.
- It gives the team something they can run today, not just discuss.

Import caution:

- Rename visible `Guidance OS` labels to `Real Physical Gigs` during import.
- Keep the flow scoped to the tabletop canister demo.

### WIL-7: Onsite canister demo operations pack

Source workspace:

- `/Users/wildman/code/yc2026-symphony-workspaces/WIL-7`

Recommended imports:

- `strategy/tabletop_canister_demo_runbook_v1.0.md`
- `strategy/tabletop_canister_onsite_asset_checklist_v1.0.md`
- `strategy/tabletop_canister_demo_run_of_show_v1.0.md`
- `strategy/tabletop_canister_demo_copy_sheet_v1.0.md`
- `strategy/tabletop_canister_demo_quick_card_v1.0.md`
- `strategy/tabletop_canister_label_pack_v1.0.md`

Why first:

- These docs help the team actually run the demo in the room.
- They complement `WIL-8` immediately.
- They reduce live-demo failure risk more than any additional strategy doc.

Import caution:

- Do not import `strategy/~$slide_v2.pptx`.
- Remove duplicate or overlapping instructions if they repeat existing tabletop demo docs.

### WIL-9: AR canister implementation + runbooks

Source workspace:

- `/Users/wildman/code/yc2026-symphony-workspaces/WIL-9`

Recommended imports:

- `src/ar-canister-demo/`
- `strategy/AR_Guidance_v1.1_Canister.md`
- `strategy/AR_Guidance_Runbook_v1.0.md`
- `strategy/AR_8thWall_Handoff_v1.0.md`

Why first:

- AR is one of the strongest visible demo moments.
- The source tree already contains a structured demo scaffold.
- This is the clearest path to an `8th Wall first, fallback ready` implementation.

Import caution:

- Import only if the current team wants a browser-based AR demo path in the main repo.
- Rename visible UI copy from `Guidance OS` to `Real Physical Gigs`.
- Keep fallback language because 8th Wall credentials are still a practical risk.

## Tier 2: Merge After Demo-Critical Artifacts

These are useful, but they do not unblock the live demo as directly as Tier 1.

### WIL-15: Quest registration flow

Source workspace:

- `/Users/wildman/code/yc2026-symphony-workspaces/WIL-15`

Recommended imports:

- `strategy/Quest_Registration_Flow_v1.0.md`

Why second:

- It aligns well with the new `Real Physical Gigs` map/quest framing.
- It helps explain the supply-side product.
- It is useful for pitch depth, but not required to run the tabletop demo.

Import caution:

- The doc still references `Guidance OS` as the base product language.
- Merge it only after a light terminology pass.

## Tier 3: Hold For Now

These should not be merged yet, either because they are incomplete, still empty, or likely to
conflict with the new `R.P.G.` direction.

### WIL-10

- Status: `In Progress`
- Visible output: none yet
- Action: wait

### WIL-11

- Status: `In Progress`
- Visible output: no clear rename artifact yet
- Action: wait, or do the rename directly in main if the team wants speed

### WIL-12 / WIL-13 / WIL-14 / WIL-16 / WIL-17 / WIL-18

- Status: mixed, mostly early
- Visible output: little or none yet in workspaces
- Action: keep running in Symphony, do not import yet

## Recommended Import Order

1. `WIL-8`
2. `WIL-7`
3. `WIL-9`
4. `WIL-15`

## Merge Strategy

Use this order in practice:

1. Import `WIL-8` runnable prototype.
2. Import `WIL-7` runbook pack.
3. Import `WIL-9` AR demo assets and handoff docs.
4. Apply one cleanup pass across imported files:
   - rename to `Real Physical Gigs` / `R.P.G.`
   - remove duplicate instructions
   - ensure safety language matches `SPEC.md`
5. Import `WIL-15` only if the team still has time for narrative polish.

## Bottom Line

If only one thing gets merged now, merge `WIL-8`.

If two things get merged, merge `WIL-8` and `WIL-7`.

If the team can handle a full demo package, merge `WIL-8`, `WIL-7`, and `WIL-9` together, then run
one naming cleanup pass to standardize on `Real Physical Gigs`.
