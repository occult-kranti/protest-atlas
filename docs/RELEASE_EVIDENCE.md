# Release evidence — 2 October 2026

## Published result

- Repository created: https://github.com/occult-kranti/protest-atlas
- Live website opened and inspected: https://occult-kranti.github.io/protest-atlas/
- Initial implementation commit: `cd2e50134fd16906d4f9cafbb7e948c5b953eb05`
- Initial Pages workflow passed: https://github.com/occult-kranti/protest-atlas/actions/runs/37053913494
- First GitHub-hosted discovery workflow passed: https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060

The initial local GDELT request returned HTTP 429. The subsequent GitHub-hosted run succeeded. This confirms one successful run, not guaranteed upstream availability or schedule reliability. Discovery writes unverified metadata to a workflow artifact; it never updates the public event ledger.

## Checks performed

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

## Limits and next gates

This is a sparse reporting pilot, not comprehensive live coverage. Broad country-language review, independent human editing, a review-queue application and a geographic map remain roadmap work. Mobile viewport, 200% zoom and assistive-technology checks are not claimed; local browser installation failed, though deployed desktop verification succeeded. Browser-extension diagnostic errors were observed; no site-origin console failure appeared in the inspected log sample.

Initial source checking and web deployment do not verify real-world truth or complete protest coverage. The roadmap names the human-reviewed pilot as the next operational gate.
