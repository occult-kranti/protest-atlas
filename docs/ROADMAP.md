# Protest Atlas roadmap and delivery tracker

Updated for release 2, 2 October 2026. Product name: **Protest Atlas**. Owner: repository maintainer; human editorial role is not yet staffed. Dates below are planning windows after staffing, not delivery promises. Release verification is recorded separately in `RELEASE_EVIDENCE.md`.

## Product decision

Build an accessible static website on GitHub Pages, backed by a versioned event ledger and automated discovery. Give a reader a short, attributable answer to: where, when, what issue, who supports/opposes what, what occurred, how the state responded, and how recently this was observed. Make the source trail and missing evidence immediately available.

Worldwide discovery is an ambition. Release 2 remains a bounded reporting pilot: three English-source checks for France, India and Spain, with 246 directory entries not reviewed. Coverage must expand with language competence and review capacity. Three published countries out of 249 directory entries is a count of publication scope, not a percentage of worldwide protests captured. The delivered map and editor tools do not add source checks or human editorial approval.

## Expert panel decisions

The panel consists of AI agents playing research, UX, engineering, and advisor/skeptic roles, coordinated by the lead agent. It does not represent consultation with human journalists or named outside experts.

| Review round | Finding | Decision applied |
| --- | --- | --- |
| 1: source and architecture | Broad data access does not imply redistribution permission; news detection creates false positives | Independent public reporting ledger; GDELT discovery queue; ACLED excluded from default ingestion |
| 1: interface | A dramatic globe can imply completeness and hide evidence | Readable event index first; directory with explicit coverage gaps; every report opens evidence detail |
| 2: temporal skepticism | Fresh review of old reporting can incorrectly renew an event | Independent observation timestamp; 72-hour expiry from activity; unknown onset remains null |
| 2: framing | For/against without a target and single intensity numbers are ambiguous | Target-linked positions; turnout, disruption, violence, state action separated |
| 2: publication | AI source checks are not independent human review | Prominent pilot disclosure; single-source labels; initial current status unknown |
| 3: release integration | A deploy file does not prove a working deployment | Validate/build, browser checks, actual GitHub Actions/Pages result, and live URL probe recorded in release evidence |

## Feature contract

| Area | Initial implementation | Next increment and acceptance criterion |
| --- | --- | --- |
| Event browsing | Responsive list and linked map/panel; text, country, status, issue and region filters; last-observed 7/30-day presets; shareable filter URL | Broader date intervals and movement/episode navigation; reloaded URLs must preserve filter results |
| Country coverage | 249-entry country-language ledger; three limited English-source checks, 246 not reviewed; actual check times and source references | Document staffed local-language reviews, attempted searches and source gaps without inventing dates; no empty-country zero claims |
| Position | Actor + support/oppose/mixed/unclear + explicit target + source refs | Separate organized counter-demonstration links and policy positions; no invented false balance |
| Timeframe | Observed date separate from source publication/check date; unknown start/end | Movement/episode hierarchy and precision intervals; historical article cannot enter current window |
| Intensity | Sourced descriptive turnout/disruption/violence dimensions | Structured attributed ranges with denominator/window and source refs per dimension; never aggregate into a severity number |
| State action | Attributed descriptions, including police, administrative and legislative actions | Separate type, announced/observed, time, actor, allegations, injuries/arrests with conflicting source estimates preserved |
| Evidence | Sources, uncertainty, single-source label, correction route | Source dependency graph, translation provenance, citation per individual numeric observation |
| Geography | D3 Equal Earth country map using pinned local Natural Earth/world-atlas geometry; pan, zoom, linked country panel and directory alternative | Retain map/list count agreement, explicit map-scale omissions and neutral boundary conventions; no precise participant positions |
| Updating | Best-effort six-hour discovery; static audit of the known 97-lead artifact; memory-only local import/review/export desk | Staff editorial review; episode grouping and syndication resolution; record subsequent success/failure audits honestly rather than claim live health |
| Sharing/export | Inspectable public JSON, stable record IDs, filter permalinks and filtered source-linked CSV with spreadsheet-formula escaping | Versioned snapshots and fuller claim-level evidence exports where rights permit; no third-party restricted raw data |

## Delivery phases

### P0 — initial pilot (this repository)

- [x] Primary-source data/tool research and reuse decision.
- [x] Public reporting schema with temporal precision and source references.
- [x] Three cautiously scoped source-checked reports and 249-country/territory directory.
- [x] Explicit AI-assisted review disclosure and separate synthetic example.
- [x] UX, editorial policy, architecture and skeptical panel records.
- [x] Validation, functional verification, GitHub publication and live Pages verification: see RELEASE_EVIDENCE.md for scope and remaining checks.

Exit: source-backed claims, no unsupported “live global” wording, no secrets/personal tactical details, functioning mobile and keyboard workflow, public URL responds with this release.

### Release 2 — geographic exploration and review tooling (delivered implementation)

- [x] D3 7.9.0 Equal Earth SVG map with local TopoJSON Client 3.1.0 and world-atlas 2.0.2 assets; no mapping token, remote tiles or runtime CDN.
- [x] Country selection links the map, source-coverage panel, filters and published index; country selector/directory remain available when geometry is absent or the map fails.
- [x] Last-observed 7/30-day presets, filter URL permalinks and filtered reported-data CSV with source URLs and recorded-status limitation.
- [x] Country-language ledger retaining the three seed source-check times and explicitly marking 246 countries/territories not reviewed.
- [x] Static provenance audit of discovery run `37054141060`: 97 unverified leads, artifact available `2026-10-02T19:27:08Z`; no subsequent success or live service health inferred.
- [x] Local editor desk with JSON import, search, manual evidence/disposition gates, URL duplicate flags and JSON packet export; public-data writes and automatic approval remain excluded.
- [x] Public correction issue template with a private-identifying-information warning.

Acceptance: map and index use the same filtered records; colors describe publication coverage only; every directory entry remains accessible; dates age against source observation; synthetic examples stay labeled and excluded from reported export; reload reproduces shared filters; imported leads cannot become public events through the review desk. Root release checks and deployment evidence remain in `RELEASE_EVIDENCE.md`.

### P1 — maintainable human-reviewed pilot (estimated weeks 1–2)

- [ ] Appoint an editorial owner and backup; establish capacity before adding countries. Start with 5–10 countries across several regions and languages selected by actual reviewer availability.
- [ ] Expand the delivered `coverage.json` ledger with actual staffed language/source review windows, documented search attempts and gap reasons. A failed search does not establish absence of protests.
- [ ] Extend the delivered local review desk with episode grouping and source dependency review; wire copies must not become independent corroboration. URL deduplication alone does not establish event uniqueness.
- [ ] Establish reviewer identity/role and independent sign-off for the human-reviewed track. The draft disposition “ready for editor” is not that sign-off.
- [ ] Conduct a correction end-to-end, record substantive correction history and verify source timestamps remain unchanged. The issue template is a route, not a completed correction drill.
- [ ] Establish a daily review target, prioritize observations approaching 72 hours, and reduce published scope if capacity is insufficient.

Exit: sampled claims independently checked; every ongoing record has activity evidence younger than 72 hours; corrections and outages visible. Automation does not silently create events.

### P2 — geographic and temporal understanding (estimated weeks 3–4)

The country overview is delivered in release 2 using D3 Equal Earth and local Natural Earth/world-atlas assets; it replaces the earlier Leaflet proposal. The directory remains a complete alternative to the simplified geometry. Keep boundaries and disputed-area conventions explicit. Remaining work: movement-to-episode relations, broader date-range filters beyond the delivered observation presets, timeline diffs, source-language labels and original-versus-translated text provenance. Maintain keyboard equivalence and 200% zoom.

Exit: map and list counts agree; no-data areas remain visibly unknown; subdirectory deployment and stale-state rendering remain correct; map resources work without a paid API key.

### P3 — measured global expansion (weeks 5–8+, capacity dependent)

Expand with local-language reviewers and permitted regional sources. Sample misses and false positives by geography/language; do not estimate global recall from the same news feed used to discover events. Introduce versioned snapshots, licensed exports and basic historical comparisons only where coverage is comparable. Add external scheduling only if measured GitHub scheduler delays are unacceptable.

Exit: coverage claims correspond to documented review windows; source dropout and publication lag are measured; publish limitations alongside comparisons.

## Operations and update tracker

| Process | Target | Evidence kept | Failure handling |
| --- | --- | --- | --- |
| Candidate discovery | Every six hours, best effort | Timestamped workflow artifact; current public manifest is a static audit of the first known success | Inspect Actions for later failures/successes; retain last good published snapshot; no empty replacement or live-health inference |
| Editorial update | Daily target after staffing; not established today | Reviewed source URLs, observation times, PR/commit and check time | Let ongoing status expire; reduce advertised scope |
| High-impact allegation | Before publication; human second check for verified track | Attributable statement and independent review | Keep disputed/unknown; do not infer guilt |
| Schema and site build | Every relevant push/PR | Tests and build output | Do not deploy failing snapshot |
| Source rights | At onboarding and when terms change | Source catalogue and license decision | Disable affected adapter; preserve permitted citations |
| Coverage review | Weekly | Language/country gap report | Prioritize missing coverage, not highest news volume |

Daily maintainer order: failed sources → expiring records → corrections → incoming candidates → country gaps. This prevents growth from displacing maintenance.

## Skeptical metrics

Track median source-to-publication delay, share of records beyond activity freshness window, records with unknown dates, claim-citation completeness, duplicate rejection rate, correction turnaround, and reviewed country-language windows. Measure false-positive rate on a labeled sample with a stated denominator. Avoid “countries covered” as a proxy for completeness, news volume as intensity, and protest participation as electoral support.

## Costs and services

The pilot needs a GitHub repository and Pages/Actions, ordinary source access, and reviewer time. It needs no database, paid mapping token, account system or custom domain. Public GitHub Pages availability and Actions terms should be checked in current GitHub documentation. Any later licensed data, translation service, private editorial application or external scheduler is a separate decision based on demonstrated need. The largest scaling dependency is sustained editorial capacity.

## Explicitly deferred

No predictive unrest risk scoring, national approval percentages, private-person tracking, crowd identification, automatic mass scraping of restricted providers, or “real-time everywhere” promise. Notifications, user accounts and public submissions come only after moderation capacity and an actual user need are established.
