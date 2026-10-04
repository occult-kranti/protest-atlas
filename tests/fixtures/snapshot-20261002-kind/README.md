# Frozen 2 Oct 2026 snapshot with the 4.1 kind defaults

Byte-for-byte copies of `public/events.json` and `public/examples.json` taken once, at the 4.1 Phase-0 kind-pipeline commit (the first 4.1 commit on `ccr-77796c82-ka7vhp`, whose parent is `9bc7d45`), after `scripts/apply_kind_defaults.py` had run on the 2 Oct 2026 snapshot and `examples.json` had been given its illustrative kind by hand. The records are the 84 episodes of `../snapshot-20261002/` with exactly two keys added to each: `kind: "collective-action"` and the contract-default `kind_basis`. `generated_at` and `last_editorial_review` are unchanged (`2026-10-02T22:45:35Z`).

Tests that pin kind literals read these copies: 84 × `collective-action`, 84 × `contract-default`, the 18 keyword-lead ids of 4.1 SPEC §5.2(7) still `collective-action`, and `showKindBadges === false`. `../snapshot-20261002/` stays byte-frozen without a kind, so the UI's `kindOf(event) === null` path is covered too.

Never edit these files to match new data. Add a new fixture directory if a new walkthrough is needed.
