# Change log

## 2026-10-03 — Release 4.0: mobile-first rebuild (deployed 3 Oct 2026, commit `f042ac0`; see docs/RELEASE_EVIDENCE.md)

Interface release over the same 84 episode records as release 3 (81 countries/territories, newest evidence dated 2 Oct 2026). The data files are not byte-identical to release 3's: envelope stamps and the coverage note changed, and new public data files were added (see **Dates and data files**). Not yet merged or deployed; the live site runs release 3 until then. Deployed-site checks and the roadmap "shipped" flips (SPEC §22.4) follow the deploy and will be recorded in RELEASE_EVIDENCE.md.

- **Interface rebuild.** Five views (Reports, Map, Ahead, Countries, About) with a phone tab bar and a desktop header nav; records open in a sheet at `#/record/<id>`. The 3.x page script is split into `app.js` and 19 modules in `js/` with a store and hash router: 21 modules (with `explore.js`, `freshness.js` and `history.js`) load up front, and `map.js`, `js/map-view.js` and `js/country-brief.js` load on the first visit to Map; filters stay in the URL, and release-3 links such as `#atlas` still resolve. Designed from the 4.0 design record in `docs/design/` (an AI-agent panel; no human designers, engineers or editors).
- **Honesty features.** Separate, named update stamps (snapshot assembled; AI-assisted review pass, shown only when it differs from snapshot assembled, so not in this snapshot; newest evidence; latest source re-read; announced-actions list compiled; site built; lead-discovery audit; human editorial review "Not completed"). Staleness is counted from the newest evidence date, never from a build or deploy: "newest evidence N days old" after 72 hours, "Stale snapshot" from 7 days, with one warning line and a "Why?" disclosure. Cards show for/against only with a named target and never tally positions. Turnout, disruption and violence stay separate; "not established" is shown as such, never as zero or blank. Context, outcome and ledger failures read as unknown, not absent.
- **Ahead and Coming next.** Announced protest actions are a separate list from reports; it is empty in this snapshot and says why. Coming next shows the site roadmap from `public/roadmap.json` (30 items: 6 shipped in releases 1.0–3.0, 4 in progress, 5 blocked, 7 next, 8 later), with no promised dates. "In progress" reads "built or being built; not yet confirmed on the deployed site".
- **Accessibility.** Focus moves to each view's title on navigation and never drops to the page body after a mode switch or Retry; the record, filter and dates sheets are native dialogs with focus return; 44 px targets; short-viewport, 200 % zoom, forced-colours, reduced-motion and dark-mode rules; status messages for country selection on the map. Verification round 1 (scripted Playwright and axe-core checks) found 11 accessibility issues; all 11 are fixed in code (SPEC §23 addendum). No screen-reader or physical-device testing has been done.
- **Map.** No scroll trap: one finger scrolls the page until Explore is turned on; the selection bar stays above the tab bar. Country shapes now come from the TopoJSON at runtime, matched to ISO codes through a small table (`public/world-map-codes.json`), and the map code, D3 and the geometry load only on the first visit to Map. `public/world-countries.geo.json` stays in the repository as a preparation output but is **no longer published**.
- **Country names.** Short common names (for example United Kingdom, South Korea, Taiwan, Tanzania) for 24 formal ISO names, reviewed against Unicode CLDR display names by an AI agent, not a human editor. Display only: `public/countries.json` keeps the ISO name, which still shows in the brief and the directory. Search also accepts aliases such as UK, USA or Ivory Coast.
- **CI.** A post-deploy `verify` job checks that the deployed site serves this commit's build stamp (`public/build-info.json`), that the root, `index.html`, `public/events.json` and `public/roadmap.json` answer 200 (the two JSON files must parse; `public/upcoming.json` is optional and must parse when present), and that unknown paths get the `noindex` 404. It does not check `countries.json` or `event-context.json`. The job runs only on `main`, so it has not run for 4.0 yet. Actions are pinned to full SHAs (configure-pages v6.0.0, deploy-pages v5.0.1, setup-node v6.5.0); CI runs Node 22 and every `tests/*.mjs` file; pushes to `main` queue instead of cancelling a running deploy. UI tests read frozen fixtures (`tests/fixtures/snapshot-20261002/`), so a valid data refresh keeps CI green.
- **Data pipeline groundwork.** `scripts/validate_upcoming.py` validates announced actions (an announcement is never an occurrence; times, meeting points and routes are rejected). "Ongoing" needs a sourced status basis. The research window end can advance past 2 Oct (`merge_history.py` still writes it as a constant). `scripts/validate_roadmap.py` checks the roadmap; a shipped item must cite a test that CI runs.
- **Round-4 recent-activity sweep: blocked.** On 2 Oct the five-region sweep logged 167 searches and opened 0 news pages (every fetch was blocked or failed in the research environment). Nothing was published. Its search snippets are kept as 192 unverified leads in `research/round4/LEADS.json` for a session with news access (docs/HANDOFF_DATA_REFRESH.md).
- **Dates and data files.** No record changed, and no record's observation, source-check or review date changed. The envelope stamps (events `generated_at` and `last_editorial_review`, coverage `checked_at`, research-ledger `generated_at`) moved from 21:31:50 to 22:45:35 UTC, and the events `coverage_note` gained the blocked-sweep sentence, when the merge recorded the blocked sweep (commit 11bdb7f). That was on 2 Oct, before the 4.0 front-end modules were written, but after the first 4.0 groundwork (commit 0f4854f: freshness helpers and build stamp; 11bdb7f also edits `freshness.js` labels). New public data files: `upcoming.json` (empty), `roadmap.json` and `world-map-codes.json`; `world-map-metadata.json` gains a `codes_sha256`.

## 2026-10-02 — Historical expansion from 2024

- Added 81 sourced historical episodes to the three re-audited seed records: 84 episodes, 81 countries/territories and 118 city references.
- Logged initial searches for all 249 directory entries, retaining failures/retries; no completeness claim.
- Added city/year/outcome exploration, coarse city map points, 18 sourced ended/suspended shadows and 57 episode result panels with actor effects and inference labels.
- Added strict historical provenance validation and source-language accounting.
- Corrected Taiwan’s directory region from the erroneous Antarctic fallback to Asia.
- Skeptical integration rejected an ended classification for Mexico’s judicial strike because sources conflict; Timor-Leste also remains unknown after later protest evidence.
- Corrected target-linked support/opposition labels before releasing regional draft records; details in research/round3/FINAL_REVIEW.md and its correction file.
- Re-audited France/India/Spain seed article dates; the suspected date mismatch was not supported. Retained observed dates and recorded actual new source-access times. Syndicated wire copies do not establish independence.

## 2026-10-02 — World map and review workspace

- Added a real Equal Earth world map using locally pinned D3, TopoJSON and Natural Earth geography.
- Linked map, country evidence panel, country selector and source records; added zoom, observation windows, shareable filters and source-linked CSV.
- Added explicit coverage ledger and static discovery audit; added memory-only candidate review and JSON packet export.
- Expanded validation for coverage dates, duplicate sources and manual review decisions.
- Source observations, published claims and present-status uncertainty remain unchanged. This release adds no human editorial review or global completeness claim.

## 2026-10-02 — Initial reporting pilot

- Created public tracker architecture, source research, editorial policy and staged roadmap.
- Added three explicitly AI-assisted source-checked reports and a country/territory directory.
- Current status kept unknown; separated activity and source-check dates; omitted unestablished onset/end.
- Added a separate synthetic example and a discovery-to-review workflow.

Future factual changes must include event ID, affected field, source, reason and correction date. Do not include sensitive personal details in correction history.
