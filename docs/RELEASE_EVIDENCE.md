# Release evidence

## Release 4.0 — mobile-first rebuild (3 October 2026)

Deployed on 3 October 2026 from commit `f042ac0189f74cbfbb867dbfb99fac9c6128c175`, a fast-forward of `main` from `6f71f16`. [Live atlas](https://occult-kranti.github.io/protest-atlas/). [Pages workflow run 37143562643](https://github.com/occult-kranti/protest-atlas/actions/runs/37143562643): `validate-build`, `deploy` and `verify` all succeeded. The data is the same 84 episodes; newest evidence is dated 2 Oct 2026. The interface release changed no observation, source-check or review date.

### Checked on the deployed site (GitHub-hosted runner, `verify` job)

| Check | Result |
| --- | --- |
| Build stamp | `public/build-info.json` reports commit `f042ac0…`, equal to the deployed SHA, on the first attempt (18:16:55Z). |
| Published files | HTTP 200 for `/`, `/index.html`, `/public/roadmap.json` and `/public/events.json`, all parsed as JSON where applicable; `/public/upcoming.json` returned 200 (optional file). |
| Unknown path | A missing path returns the 404 page carrying `noindex`. |

This session's container cannot open `github.io`: its network policy denies the host. So no browser check of the deployed pages was run from here. The browser evidence below comes from a local build of the same commit, served under the same `/protest-atlas/` prefix. That build differs from the deployed artifact only in `build-info.json`.

### Verified locally before deployment

| Check | Result |
| --- | --- |
| Automated tests | 87 Python tests and 231 Node tests passed. CI ran the same suites on the runner, with Node 22 pinned through `actions/setup-node` and Python 3.12. |
| Browser smoke (`tests/browser/smoke.cjs`, 25 checks) | All 25 passed at the repo root after the final fixes. At `b260087` the 24-check version passed in both modes, repo root and the Pages prefix on a built copy. Checks cover routes, disclosure on every view, stamps, the 2 Oct, 9 Oct and 5 Nov clocks, permalinks, record sheet behaviour, map gestures, example isolation, failure states and the first viewport. |
| Accessibility | axe-core 4.13: 104 scans at `b260087`, 0 violations of any impact. The scans covered 13 states (every view, both sheets, two records, example mode) at 390 and 1440 px, light and dark, on the real clock and on 9 Oct. The keyboard walkthrough covered skip links, dialog focus, roving map focus and focus after mode changes. |
| Phone layout at 390×844, against release 3 | First record top: 540 px (603 px on the 9 Oct stale clock); it was 5,812 px. DOM: 1,130 elements, down from 6,972. Default Reports page: 8,904 px, down from 35,102. All records in List density: 14,574 px. First card visible about 123 ms unthrottled and about 2.6 s on a throttled mobile profile. About 189 KB gzip-equivalent; Reports loads no map or vendor files. |
| Data-refresh resilience | Copies with an 85th valid record, including one in a new country and one with rewritten sweep sentences, build and pass both suites and the data-dependent smoke checks. UI tests read `tests/fixtures/snapshot-20261002/` for literal 2 Oct expectations. |
| Editorial acceptance | §14 checks covered: the disclosure on every view and record; staleness measured from newest evidence; separate, labelled stamps; stance always with a named target and no tallies (the worked cases are the South Korea, Nigeria and New Zealand records); "not established" never shown as zero; no keyword chips; status shown before the evidence band; the Ahead empty state stating the blocked sweep; nothing from this release marked shipped. A banned-vocabulary scan found 0 hits on both clocks. |

Verification history: five independent verification lenses (editorial, accessibility, mobile UX, code review and deployment) reported 43 findings: 14 major and 29 minor. All 14 majors were fixed and re-tested by a separate verifier with fresh repros. A final pass fixed 6 more minors. The resolutions, two declined minors and three deferred to the data owner are listed in `docs/design/SPEC.md` §23 and `docs/design/INTEGRATION_NOTES.md` §8.

Screenshots: [Reports 390](images/release4-reports-390.png) · [stale state, 9 Oct clock](images/release4-reports-stale-390.png) · [record sheet](images/release4-record-390.png) · [map with France](images/release4-map-390.png) · [Ahead](images/release4-ahead-390.png) · [Coming next](images/release4-roadmap-390.png) · [desktop](images/release4-desktop-1440.png) · [desktop dark](images/release4-desktop-dark-1440.png).

### Not yet verified, and the roadmap status that follows

- No browser check of the deployed pages has been made (phone viewport, first-viewport position, sheet behaviour, map gestures), and no physical-device touch, screen-reader or Safari/WebKit check. axe and the smoke tests ran in Chromium only.
- Under the rule that shipped means checked after deployment, the four in-progress roadmap items stay in progress in `public/roadmap.json`: mobile-first redesign, clear dates and stale warnings, the facts on cards, and the Ahead page. Two kinds of evidence would justify moving them to shipped: a smoke run against the live URL from an environment that can reach `github.io`, or a recorded check on a phone (SPEC §22.4).
- Data is unchanged and newest evidence is dated 2 Oct 2026, so the site will show its aging and stale states from 5 Oct and 9 Oct. The data refresh is waiting on a session with news-site access ([handoff](HANDOFF_DATA_REFRESH.md)).

## Release 3 — historical research from 2024

Verified on 2 October 2026. Runtime commit: `64785a20f7fb30de8c076139d27726aa88a07c38`. [Live atlas](https://occult-kranti.github.io/protest-atlas/#atlas). [Successful Pages workflow](https://github.com/occult-kranti/protest-atlas/actions/runs/37067775278). The earlier historical-data deployment and city-reset patch also succeeded (runs `37067453098` and `37067550820`).

| Check | Evidence |
| --- | --- |
| Research scope | 84 episodes, 81 countries/territories, 118 city references, 128 source records. Initial queries logged for all 249 entries; 168 have no published episode. No exhaustive history or current-activity claim. |
| Semantic review | Separate skeptical advisor read the principal ending source for all 18 ended/suspended episodes plus four targeted followups. Applied 13 reversed stance corrections and Tanzania's missing status-source reference to regional inputs; regenerated public files and checked all 14 resolutions. |
| Automated verification | 41 Python tests passed. All eight named JavaScript tests passed using `node tests/test_explorer.mjs` and `node --test --test-isolation=none --test-reporter=spec tests/test_explorer.mjs`. Build and syntax checks passed. The isolated runner in this workspace only reported a file-level test, so the non-isolated/direct runs supplied named-test evidence. GitHub workflow test and deployment gates passed. |
| World/city map | 101 rendered city markers; 17 unresolved city names remain in text/selectors. World panel and index both show 84 records. Ended filter returns 18; 17 corresponding country polygons are available because Faroe Islands has no separate polygon at this scale. |
| Endings/results | New Zealand record showed bounded final-day ending, later bill rejection, named beneficiary/setback assessments labeled inference, source links and an explicit no-established-protest-causation note. Ended/suspended styling does not imply countrywide cessation. |
| Filters and URL | Combined 2024 + Paris + documented-change filters returned the farmers' record. Reload preserved all three selected values and the one-record result. Reported-year 2024 alone returned 36 records because matching includes dated timeline entries, rather than only the latest-observation year. |
| Small-country/keyboard route | Andorra selector opened its record despite absent polygon. Pressing Enter on its city point selected `AD:Andorra la Vella` and the same one-record index. |
| Missing coverage | Iceland panel explicitly distinguished initial search logged, source coverage not reviewed, no published episode and five unreviewed discovery leads. No zero-protest inference. |
| Reset correction | France provided six city names plus the all-cities option. Reset restored 118 city names plus the all-cities option (119 options), 84 records and world scope. Versioned module/CSS references resolve observed browser caching of the prior controls. |
| Responsive layout | Real iframe outer widths 320, 390, 768 and 1440 px yielded content widths 305, 375, 753 and 1425 px, respectively. At each, document scroll width equaled client width and 101 city markers were present. Phone historical filters/map were visually inspected; zoom changed from 1.00 to 1.60. |
| Publication boundary | All historical JSON passes strict provenance validators. Coarse city source dataset and raw research remain outside the static allowlist. Credential-pattern scan found no matches in project text artifacts. |

![Historical map with ended-episode shadows and city references](images/history-release3.jpg)

Remaining limits: this is a selective AI-assisted research index, predominantly English-source, without independent human editorial sign-off. No country is certified complete. Physical touch/pinch, screen-reader, 200% zoom and final browser download-byte capture remain unverified; the automated CSV serializer checks passed. See HISTORICAL_RESEARCH.md, ROADMAP.md and the advisor's retained review for scope and next work. Previous release evidence below records its historical state, not the current dataset.


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
