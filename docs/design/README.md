# Protest Atlas 4.0 design record

Panel outputs for the mobile-first redesign (2–3 Oct 2026). The panel was made up of AI agents in defined roles, coordinated by the lead agent. It does not represent consultation with human designers, engineers or editors.

| Document | Role |
| --- | --- |
| [SPEC.md](SPEC.md) | **Binding build specification**: the judged hybrid "Reports desk with atlas components", the contract changes against the architecture plan, the copy rules, work packages WP1–WP5 and the smoke checks. Revision 2 resolves the pre-freeze critic's 13 major and 21 minor gaps. |
| [TECH_ARCHITECTURE.md](TECH_ARCHITECTURE.md) | Tech architect: routing, file plan, module and DOM contracts, map, payload budget, roadmap schema, tests and CI. SPEC.md §2 lists every deviation from it. |
| [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) | Phase 2 integration record: every contract question and deviation from WP1–WP5 with the lead's decision and the files changed, simplifications, the final payload budgets with measurements, load performance and open risks. SPEC.md §23 "Integration addendum" summarises it. |
| [EDITORIAL_GUIDANCE.md](EDITORIAL_GUIDANCE.md) | Editorial skeptic: freshness and "live" rules, update-stamp labels, stance, intensity and state-response rules, Ahead and roadmap rules, copy deck, risk register. |
| [OPEN_SOURCE_RESEARCH.md](OPEN_SOURCE_RESEARCH.md) | Comparable trackers and open-source tools, each with its licence and a reuse decision. |
| [UX_DIRECTION_A_LIVE_DESK.md](UX_DIRECTION_A_LIVE_DESK.md), [UX_DIRECTION_B_ATLAS_SHEET.md](UX_DIRECTION_B_ATLAS_SHEET.md) | The two competing prototype proposals that were judged. Selected screenshots are in `prototype-shots/`. |

Paths under `/tmp/...scratchpad/` refer to working files from the session and are not retained. The judges scored mobile UX at A 6.5 and B 7, editorial honesty at A 5.5 and B 5, and feasibility at A 7.5 and B 4.5. All three recommended a hybrid built on A's shell, using B's components and its frame that keeps the disclosure on every view.
