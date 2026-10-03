# Protest Atlas roadmap and delivery tracker

Updated for release 3, 2 October 2026. Product name: **Protest Atlas**. Owner: repository maintainer; human editorial role is not yet staffed. Dates below are planning windows after staffing, not delivery promises. Release verification is recorded separately in `RELEASE_EVIDENCE.md`.

## Product decision

Build an accessible static website on GitHub Pages, backed by a versioned event ledger and automated discovery. Give a reader a short, attributable answer to: where, when, what issue, who supports/opposes what, what occurred, how the state responded, and how recently this was observed. Make the source trail and missing evidence immediately available.

Worldwide recall remains unestablished. Release 3 has 84 sourced episodes in 81 countries/territories and initial searches logged for all 249 directory entries, covering 2024-01-01 through 2026-10-02. There are 118 sourced city references, 18 ended/suspended episodes and 57 episodes with documented outcomes. The remaining 168 countries have no published episode; no country is certified exhaustive. Source checks remain predominantly English and AI-assisted. Published-country counts measure this dataset, not the proportion of worldwide protests captured. See HISTORICAL_RESEARCH.md for the audit and next priorities.

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
| Event browsing | Responsive list and linked map/panel; text, country, status, issue and region filters; last-observed 7/30-day presets; shareable filter URL | City, reported-year and documented-outcome filters delivered in release 3; next: arbitrary date intervals and movement/episode navigation |
| Country coverage | 249-entry initial-search ledger plus separate source-language checks in 81 countries; actual query/access times and source references | Document staffed local-language reviews, attempted searches and source gaps without inventing dates; no empty-country zero claims |
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

### Release 3 — history, city references and outcomes

- [x] Initial historical search logged for every directory entry, including retained failed attempts and retries.
- [x] 84 sourced episodes across 81 countries; 118 city references, 101 coarse mapped points and 17 explicitly unmapped names.
- [x] Reported-year, city and outcome filters shared by map, index, URL and CSV.
- [x] Black-shadow treatment for 18 sourced ended/suspended episodes; unknown endings remain unknown.
- [x] Results for 57 episodes, with named actor effects, inference labels, source references and causal limitations.
- [x] Five regional research agents and a separate skeptical advisor; semantic stance corrections applied before publication.
- [x] Strict context/search/geography validators and reproducible merge from regional inputs.

Acceptance: no search-only candidate is presented as a sourced episode; historical reports cannot imply current activity; city markers represent generalized city references; every outcome and ending has local source references. Deployment and browser evidence: RELEASE_EVIDENCE.md.

### P1 — maintainable human-reviewed pilot (estimated weeks 1–2)

- [ ] Appoint an editorial owner and backup; establish capacity before adding countries. Start the independently reviewed track with 5–10 countries across several regions and languages selected by actual reviewer availability; the wider AI-assisted snapshot does not constitute that track.
- [ ] Expand the delivered `coverage.json` ledger with actual staffed language/source review windows, documented search attempts and gap reasons. A failed search does not establish absence of protests.
- [ ] Extend the delivered local review desk with episode grouping and source dependency review; wire copies must not become independent corroboration. URL deduplication alone does not establish event uniqueness.
- [ ] Establish reviewer identity/role and independent sign-off for the human-reviewed track. The draft disposition “ready for editor” is not that sign-off.
- [ ] Conduct a correction end-to-end, record substantive correction history and verify source timestamps remain unchanged. The issue template is a route, not a completed correction drill.
- [ ] Establish a daily review target, prioritize observations approaching 72 hours, and reduce published scope if capacity is insufficient.

Exit: sampled claims independently checked; every ongoing record has activity evidence younger than 72 hours; corrections and outages visible. Automation does not silently create events.

### P2 — geographic and temporal understanding (estimated weeks 3–4)

The country overview is delivered in release 2 using D3 Equal Earth and local Natural Earth/world-atlas assets; it replaces the earlier Leaflet proposal. The directory remains a complete alternative to the simplified geometry. Keep boundaries and disputed-area conventions explicit. Release 3 adds coarse city references and reported-year filters. Remaining work: movement-to-episode relations, arbitrary date-range filters, timeline diffs, per-source language display and original-versus-translated text provenance. Maintain keyboard equivalence and 200% zoom.

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

## Next tasks (3 Oct 2026)

Added 3 Oct 2026 and revised the same day after an independent review of the handoff. The tasks are in dependency order and carry no dates. The roadmap items named below are in `public/roadmap.json` and SPEC §20 (`docs/design/SPEC.md`).

1. **Data refresh in a session with news access.** Follow [HANDOFF_DATA_REFRESH.md](HANDOFF_DATA_REFRESH.md). Its §8 holds the paste-ready prompt.
   - **Status:** blocked until a Claude Code session exists whose cloud environment can open news websites. On 2 Oct the sweep logged 167 searches and opened 0 pages.
   - **Precondition:** the handoff, the leads and the v2 workflows are pushed to `ccr-77796c82-ka7vhp`. The import commit and the lead checksums are at the top of the handoff.
   - **Inputs:** 192 unverified leads in `research/round4/LEADS.json` (21 P1, 48 P2, 123 P3) and the v2 workflows in `research/round4/workflows/`.
   - **Method:** run on a data branch based on commit `e633dfe`, or on `origin/main` once `main` contains it. The work reaches `main` through a reviewed pull request.
   - **Scope:** exactly the allowed paths in handoff §2.2:
     - `research/round4/**`, except the lead files;
     - the six data files that `merge_history.py` regenerates;
     - the `WINDOW_END` constant and the coverage-note date in `merge_history.py`;
     - narrow fixes to the four data validators or the merge logic, only when one blocks valid data, each with a new test file.
   - **First run:** a start on 3 Oct UTC scans with window end 2 Oct, then tops up after 4 Oct 00:00 UTC with window end 3 Oct before consolidating (handoff §4 Step 2).
   - **Done when:** the acceptance list in the handoff (§5) is met, the PR is merged and Pages has deployed.
   - **Deadline:** the newest evidence day + 3, at 00:00 UTC. The Pages deploy of the merge must finish before it, and the PR states it. If review will miss it, top up before merging (handoff §5.11 and §6).
2. **After that merge, update the roadmap items, following SPEC §22.4 only.**
   - **Where:** the commit goes to the 4.0 branch, because `public/roadmap.json` is not on `main`. It becomes visible with the 4.0 release.
   - **When:** after the merge, the Pages deploy and its post-deploy check, and a check on the live site. One commit then does two things:
     - sets `status`, `shipped_in`, `shipped_on`, a `test` evidence entry, `last_reviewed` and `updated_at` for each item whose acceptance passes;
     - updates RELEASE_EVIDENCE.
   - **`add-reports-after-2-oct-2026` (BLK-1):** it ships only if its acceptance holds on the deployed site, including newest evidence under 72 hours at publication. A refresh that cannot move `WINDOW_END` past 2 Oct does not ship it.
   - **`list-announced-actions` (BLK-2):** it also needs the 4.0 Ahead view live, so that date-passed handling can be verified. It cannot ship before task 4.
   - **`records-current-within-72-hours` (BLK-4):** stays blocked. It needs 30 consecutive days of fresh evidence and a human editor.
   - **`local-language-coverage` (BLK-5):** stays blocked on language reviewers. Once fetch access is proven, revise only its `blocked_by` text.
   - **Items that fail:** an item whose acceptance fails keeps its status.
   - **Live-site copy:** the "search could not open news websites" text comes from the data (SPEC §6.6). It changes by itself once a sweep has read pages, so do not hand-edit it.
3. **Recurring daily sweep design**, once task 1 succeeds. HANDOFF_DATA_REFRESH.md §6 has the starting design: a daily run at about 05:45 UTC that searches through the previous UTC day, followed by a PR and a human merge the same day. It needs these changes:
   - split the scan window from the acceptance window (or roll over to a new round directory);
   - replace the hard-coded `window_start` default in `region-scan.js` with the round start or a required argument;
   - screen a rotating subset of countries so each is covered weekly;
   - add a lead cap (a priority filter, `lead_priorities`, already exists);
   - generate leads from earlier runs and from the discovery artifact;
   - build the high-repression and week/month announcement rules into the prompts;
   - stop after two blocked preflights in a row;
   - size the schedule from the per-region run durations recorded in the first data PR;
   - record a newest-evidence-age metric for BLK-4.

   It runs as a scheduled routine in the news-access environment. Publication stays human-reviewed.
4. **4.0 interface release.** In progress on branch `ccr-77796c82-ka7vhp`. The work packages and integration steps are in SPEC §19 and §22.
   - **Ownership until the data PR merges:** this branch commits no change to `research/round4/**`, the six public data JSON files, `scripts/merge_history.py` or the four data validators. An unavoidable change is pushed before the data session imports, or the data session is asked to re-import from the new SHA. Before every UI commit, run `git checkout -- public/events.json public/event-context.json public/coverage.json public/research-ledger.json public/cities.json public/upcoming.json` to discard local merge reruns.
   - **Before the 4.0 PR, tests stop pinning live data:**
     - Literal assertions, such as the `sweepFact` values, record counts and stamps in `tests/test_core.mjs`, read a frozen fixture copy, for example `tests/fixtures/snapshot-20261002/{events,upcoming,coverage}.json`.
     - Tests on the real `public/*.json` assert only invariants: `sweepFact` parses to non-null, counts agree with each other, and the newest evidence is not after today.
     - SPEC §6.6, §19 WP3 (the "33 records" count) and §22.2 (the "84 records" smoke check) are updated to match.
   - After the data PR merges, this branch merges `main`. With the fixture rule in place, that merge needs no test edits.
   - The release then reaches `main` through its own PR.
   - The §22.4 checks run on the deployed site before any 4.0 roadmap item is marked shipped.
