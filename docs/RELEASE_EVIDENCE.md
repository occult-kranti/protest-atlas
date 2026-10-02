# Release evidence — 2 October 2026

## Release 2 — world map and review workspace

- Map implementation commit: `f915dcaf4131ca7c131c1cf7159d26ff15b8c212`.
- [Pages build and deployment succeeded](https://github.com/occult-kranti/protest-atlas/actions/runs/37059809706).
- [Live world map](https://occult-kranti.github.io/protest-atlas/#atlas) and [review desk](https://occult-kranti.github.io/protest-atlas/review.html) opened and inspected.
- Final follow-up preserves this layout, improves singular wording/download feedback, and records this evidence.

| Check | Observed result |
| --- | --- |
| Automated trust boundaries | 28 Python tests and 6 JavaScript test cases passed; includes coverage-date/source consistency, unverified-candidate isolation, manual readiness gates, duplicate handling, time-window filtering, URL round trip, CSV escaping and exact map record totals. |
| Static build | Required local map/review assets included; only explicit allowlisted files enter `_site`; candidate and review drafts excluded. Source observation dates unchanged. |
| Map and linked evidence | Live map rendered all 177 geography areas; India selection updated country brief/list; Enter on France selected its record; country zoom, zoom in/out and world reset worked. Monaco displayed missing-polygon explanation and disabled country zoom. |
| Shared view | Spain + 7-day observation window copied into URL and restored after reload. |
| Example isolation | One illustrative record and one illustrative map country; separate labels/color; CSV and sharing disabled for example mode; switching back restored 3 reported records. |
| Responsive layout | Real iframe outer widths 320, 390, 768, 1440 px produced inner content widths 305, 375, 753, 1425 px because of scrollbars. Document scroll width equaled client width at all four. Mobile typography and stacked layout visually inspected. Review desk empty state also passed 320 px outer-width overflow check. |
| Review UI | Imported a non-sensitive QA candidate containing an already-published public source URL. Existing URL flagged; blank ready-for-editor attempt rejected for missing manual evidence and duplicate source; duplicate disposition accepted only with published event ID. Export action requested a local packet, without publication. |
| Download limitation | Browser UI callbacks fired for CSV and packet export. The cloud download event wait timed out/reset the tool, and completed file bytes were not captured. Serialized CSV/packet validation is automated; final browser save-to-disk behavior remains a manual release check. User messages now say download requested, not saved. |
| Runtime diagnostics | Inspected error sample contained browser-extension diagnostic errors, not site-origin errors. This is a sampled check, not a comprehensive console audit. |
| Design/source audit | Report outlines strengthened, light/dark keyboard focus halo added, legend scoped to current filters, and shortlist/clear-selection keyboard focus preserved. See MAP_DESIGN_SOURCES.md. |

![Deployed world map](images/world-map-release2.jpg)

Remaining: physical touch/pinch, screen-reader and 200% browser zoom checks; review-form mobile editing and download-file capture. The reviewed layout is not a claim of full accessibility certification. The country ledger still has only three English-source checks and 246 not-reviewed countries/territories. Independent human editorial review, local-language coverage, broader real-world reporting, and the correction drill remain operational gates. No data freshness dates changed for this interface release.

## Initial release — published result

- Repository created: https://github.com/occult-kranti/protest-atlas
- Live website opened and inspected: https://occult-kranti.github.io/protest-atlas/
- Initial implementation commit: `cd2e50134fd16906d4f9cafbb7e948c5b953eb05`
- Initial Pages workflow passed: https://github.com/occult-kranti/protest-atlas/actions/runs/37053913494
- First GitHub-hosted discovery workflow passed: https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060

The initial local GDELT request returned HTTP 429. The subsequent GitHub-hosted run succeeded. This confirms one successful run, not guaranteed upstream availability or schedule reliability. Discovery writes unverified metadata to a workflow artifact; it never updates the public event ledger.

## Initial release — checks performed

| Check | Evidence / result |
| --- | --- |
| Python data/publication tests | 15 tests passed; covers future and contradictory times, source references, unsafe URLs, private/exact-location fields, duplicate keys, candidate isolation, symlinks and unchanged editorial dates |
| Actual snapshot build | 3 source-checked seed reports, 249 country/territory entries and a separate example pass validation; only allowlisted files published |
| UI source and simulation | Module syntax, 11 temporal/UTC assertions, contrasts, label/ID checks, simulated loading/filters/empty/error/example/escaping checks; see UX_SPEC.md |
| Live desktop | Source-index page loaded; screenshot visually inspected; filtering, source detail, Escape/focus restoration, synthetic-mode separation and absent-country explanation verified |
| Source uncertainty | All three records single-source and present status unknown; no human editorial review claimed; date-only evidence explicit |
| Licensing | Country directory CC BY-SA attribution and license retained; news linked, no images/full articles redistributed; ACLED excluded |
| Credential scan | No GitHub token/private-key pattern in project files; authentication material kept outside repository and public build |

## Resolved skeptical findings

Freshness now uses `last_observed_at`; opening an old source cannot renew the activity date. Unknown onset remains null. Support/opposition references a named target. Intensity sources appear in the detail panel, while disruption, violence and state response stay separate. A march alone is not labeled disruption; assembly restrictions remain state action. Blanket verified labels were replaced with AI-assisted source-check labels. Exactly 72 hours expires ongoing status.

## Initial release — limits recorded at that time

This is a sparse reporting pilot, not comprehensive live coverage. Broad country-language review, independent human editing, a review-queue application and a geographic map remain roadmap work. Mobile viewport, 200% zoom and assistive-technology checks are not claimed; local browser installation failed, though deployed desktop verification succeeded. Browser-extension diagnostic errors were observed; no site-origin console failure appeared in the inspected log sample.

Initial source checking and web deployment do not verify real-world truth or complete protest coverage. The roadmap names the human-reviewed pilot as the next operational gate.
