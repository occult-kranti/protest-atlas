# Architecture

Protest Atlas is a static HTML/CSS/JavaScript site. GitHub Pages serves the built files; there is no application server, database, account system or browser-side API secret. Public JSON is curated editorial data, not an automatic event feed.

Release 4.0 (built and verified locally on 3 Oct 2026; deployment pending) rebuilds the front end as ES modules with a store and hash router. The data contracts and the publication boundary below are unchanged except where noted. The binding design is [design/SPEC.md](design/SPEC.md); [design/TECH_ARCHITECTURE.md](design/TECH_ARCHITECTURE.md) is the plan it amends, and [design/INTEGRATION_NOTES.md](design/INTEGRATION_NOTES.md) records what was built and measured.

## Front end (release 4.0)

`index.html` holds the static shell: header and snapshot chip, the pilot notice (outside `<main>`, so it is on every view), five view sections, the footer and three `<dialog>` sheets. An import map adds a `?v=` stamp to every module, and 21 `modulepreload` links name the static graph. There is no bundler, framework or build-time minifier; sources ship as written.

| Module | Role |
|---|---|
| `app.js` | Bootstrap and controller: creates the store and router, runs the loaders, mounts components, handles delegated clicks, re-renders on store changes and runs a 60-second tick (plus `visibilitychange` and `pageshow`) so time-dependent labels change without a reload. Imports the map only through `import()`. |
| `js/store.js` | Immutable-update store (`get`, `set`, `subscribe`) and the initial state: `mode`, `route`, `filters`, `data`, `load` (`critical`, per-file `errors`, per-file `lazy` status) and `ui`. |
| `js/router.js` | Hash routes (`#/latest`, `#/map`, `#/ahead/actions`, `#/ahead/roadmap`, `#/countries`, `#/about`, `#/record/<id>`) and release-3 aliases (`#atlas`, `#countries`, `#methodology`). Manual scroll restoration: a view change scrolls to the top and focuses the view title; Back restores the stored `scrollY`. |
| `js/data.js` | File maps, loaders and shape checks. Critical: `events`, `countries`, `event-context`, `upcoming`, `build-info`, each settled on its own, so one failure never blanks the others. Lazy: `coverage`, `research-ledger`, `cities`, `discovery-status`, `roadmap`, `examples`, `world-map-codes`. A file that fails its shape check is an error, never empty data. `upcoming` and `build-info` may be absent (404). |
| `js/model.js` | Pure selectors: display status, observation bands, filtering and search (including country aliases), sorting by `last_observed_at` with ties in file order, snapshot state from the newest evidence, the parse of the sweep sentences in the coverage notes (`sweepFact`), and the short country display names. |
| `js/actions.js` | State transitions, retry, share (Web Share on coarse pointers, else clipboard with a selectable fallback) and CSV export, refused in example mode or without loaded records. |
| `js/filters.js`, `js/list.js`, `js/stamps.js`, `js/notice.js`, `js/sheet.js` | Search and filter sheet; Reports stats, groups and pagination; the snapshot chip, dates sheet and footer stamps; the notice lines and example banner; dialog behaviour, focus return and chrome metrics. |
| `js/record-facts.js`, `js/cards.js`, `js/detail.js` | Record derivations (positions with targets, intensity facets, state response, timeframe, evidence line), cards in two layouts, and the record sheet body. Recorded text stays verbatim; no number is parsed from prose. |
| `js/ahead.js`, `js/countries.js`, `js/about.js` | Ahead (announced actions and roadmap), the A–Z directory, and About (research scope, ledger table, discovery audit). They are static imports but render only on first visit. |
| `js/map-view.js`, `js/country-brief.js`, `map.js` | Map add-on, loaded on the first visit to `#/map`: the view controller (region chips, Explore, selection bar, legend), the world overview and country brief, and the D3 map. |
| `js/html.js`, `freshness.js`, `history.js`, `explore.js` | Shared escaping and HTML helpers (`patchHTML` patches a region without losing open `<details>` or focus); UTC date and age labels with fixed English month names; outcome and context helpers; the view-state codec, observation-window filter and CSV serializer. |

Apart from `app.js`, every module is DOM-free when imported (DOM work happens only inside its `mount*`, `init*` or `start` functions), so `tests/*.mjs` import them in Node. `review.html` keeps its own `review.js` and the legacy `styles.css` selectors it needs.

**Payload.** CI measures gzip -9 per file. Code and data are budgeted separately, so a data refresh cannot fail a code-size gate: critical code (HTML, CSS, critical JS) 125,845 B against a 125 KB ceiling, of which critical JS 92,483 B against 91 KB; map add-on code and geometry 159,803 B against 170 KB; critical data 61,471 B against 180 KB, `events.json` against 120 KB. The CSS, critical-JS, critical-code, map add-on and map-first buckets exceed the original targets in tech §6.2 (index.html, at 6,119 B against 12 KB, does not); INTEGRATION_NOTES §4 explains why and what would recover them (lazy Ahead, Countries and About; a minifier; D3 submodules).

## Geographic exploration

`map.js` draws an SVG country map with a D3 **Equal Earth** projection. Release 4.0 builds country shapes at runtime from `public/world-110m.topo.json` with TopoJSON Client and attaches ISO codes from `public/world-map-codes.json` (numeric world-atlas id → alpha-2, with the topology's SHA-256). The prepared `public/world-countries.geo.json` stays in the repository as the reproducible output of `scripts/prepare_map.py`, which tests compare with the code table, but it is **no longer published or fetched**. D3 7.9.0 and TopoJSON Client 3.1.0 load from pinned `vendor/` files; provenance and hashes are in `public/world-map-metadata.json`. There is no runtime CDN, mapping API key, tile service or geolocation. Details: `MAP_IMPLEMENTATION.md`; reuse terms: `REUSE_AND_LICENSES.md`.

The geometry contains 177 features with 174 catalog country codes; 75 of the 249 directory entries lack separate polygons at this scale. The Countries view and the country filter remain the full navigation route, including small territories and a keyboard alternative. Map failure leaves Reports, Countries and the filters available. Pan/zoom change presentation only; by default one finger scrolls the page and the map moves only in Explore mode. Color and totals represent publication scope, never crowd size, severity, national opinion or completeness.

Observation presets select the last 7 or 30 days using `last_observed_at`. The nine filter keys (`q`, `country`, `region`, `issue`, `status`, `year`, `city`, `outcome`, `window`) live in the query string and survive view changes; they do not imply a live-data subscription. Filtered reported-data CSV includes stable ID, country, title, issues, last observation, recorded status, a status-limitation note, cities, completion basis, outcomes, attributed effects and source URLs. Text cells are quoted and spreadsheet-formula prefixes escaped. If `event-context.json` failed to load, the context columns read "not loaded". The export is a reporting snapshot, not the full claim/evidence ledger; example mode does not export.

## Announcements, roadmap and build stamp

- **`public/upcoming.json`** lists announced collective actions, attributed to a named organiser or institution and linked to the announcing article. `scripts/validate_upcoming.py` requires a note saying an announcement is not evidence that the action will occur, ISO days with a stated precision (day, week, month or range), `announced`/`postponed`/`cancelled` status, sources with publisher, publication and access dates, and rejects clock times, meeting points and routes. An announcement never becomes an occurrence; a passed date shows "occurrence not established". The file is optional in the build; in this snapshot it has no items, and its note records the blocked 2 Oct search.
- **`public/roadmap.json`** is the "Coming next" content. `scripts/validate_roadmap.py` checks the schema, statuses (`shipped`, `in-progress`, `next`, `later`, `blocked`), a blocker on exactly the blocked items, dependency ids, nonfuture dates, a note that disclaims promises, and evidence paths inside the repository. A shipped item needs at least one `test` evidence entry that names a test CI runs: a top-level `tests/test_*.py` method (inside its named class) or the start of a `test(...)` title in a `tests/*.mjs` file, at least 8 characters; browser smoke does not count.
- **`public/build-info.json`** is generated by `scripts/build.py` (build time, commit, workflow run id) for the "Site built" stamp and for the post-deploy check. Its note says it never changes or implies an observation, source-check or review date.

## Tests

`python3 -m unittest discover -s tests` (87 tests) covers the publication boundary, validators, pipeline, map assets, roadmap evidence, internal links, the 404 page and action pins. `node --test tests/*.mjs` (227 tests) covers models, routing, filters, stamps, notice, cards, record, map, pages and the shell (DOM contract, CSS layering, banned vocabulary, payload budgets).

Tests that assert snapshot-specific values (84 episodes, the first card, the 9 Oct stale walkthrough, research-scope numbers, sweep facts) read byte copies of the 2 Oct data in `tests/fixtures/snapshot-20261002/`; tests on `public/*.json` assert only invariants. Those fixtures are never edited to match new data. A scratch refresh with a valid extra record keeps both suites green. `tests/browser/smoke.cjs` is an optional local Playwright check (24 checks) and is not run in CI.

## Publication boundary

`scripts/validate_data.py` uses Python 3.12's standard library. It validates `public/countries.json`, the `public/events.json` envelope, and optional `public/examples.json`. Events use event-local source IDs for positions, state responses, timeline statements and described intensity. Unknown turnout uses null bounds. Every public event has a verification note, last verification time and last observed time. Schema version accepts integer `1` or string `"1.0"`.

The validator rejects unknown keys at every schema object, malformed or duplicate IDs, foreign source references, unsupported status/stance/verification values, non-HTTPS or credential-bearing source URLs, future observations/verifications/access dates, contradictory dates and turnout bounds, precise coordinate/location fields, and common address-like labels. Only city, region, country and multi-location precision are accepted. These checks cannot understand every harmful detail inside natural language: source attribution, necessity, privacy and summary accuracy still require editorial review. The schema is for collective events and public institutional positions, not participant dossiers or movement tracking.

`start_date` is null with `start_date_precision: "unknown"` when onset is not established. A news publication or GDELT discovery time is not event onset. `last_observed_at` indicates the latest evidenced observation; `last_verified` indicates the most recent source check. `generated_at` describes the data envelope, and the legacy field `last_editorial_review` records AI-assisted integration/review time, not human sign-off. Build and deployment preserve these values byte for byte. A new deployment must never refresh observation or verification dates by itself. Status is an attributed editorial observation, not proof that a protest remains active now. Freshness must use `last_observed_at`.

`scripts/build.py` runs every validator (data, coverage, history, announcements, roadmap), then copies only the explicit static-site allowlist into `_site`: the public atlas HTML/styles/modules, review HTML/styles/module, named public reporting/coverage/discovery/map JSON, pinned map libraries and their license files, and `.nojekyll`. It rejects symlinked publication sources. Repository docs, candidate artifacts, review queues/packets, research notes, test fixtures, credentials and miscellaneous files are outside that allowlist. Public assets added later need an explicit reviewed allowlist update. GitHub Actions uploads `_site`, never the repository root.

Release 4.0 changes to the allowlist: added `404.html`, `freshness.js`, `css/{feed,record,map,pages}.css` and the 19 modules in `js/`; added `public/upcoming.json` and `public/roadmap.json` (`upcoming.json` and `examples.json` are optional); added `public/world-map-codes.json`; removed `atlas.css`, `history.css` and `public/world-countries.geo.json`. The build also writes `public/build-info.json`. `tests/test_site.py` checks that every HTML, import-map, module, JSON and stylesheet reference resolves inside the published set, and that the GeoJSON and private files are not published.

`scripts/validate_coverage.py` checks both public manifests alongside existing event validation. `public/coverage.json` has one entry for every directory code, with check status, actual source access time, dated-report window, languages, source IDs and limitations. Schema version 2 discloses source-language checks for the 81 countries with published episodes and retains `human_editorial_review: false`. A source-ID-to-language map records the language actually inspected. The 168 other countries have no article-level published-event check; their separate initial searches do not change that status. Source references must belong to that country; check timestamps must equal existing source access evidence. Unknown countries cannot acquire invented check dates, languages or windows. Ledger assembly time is independent of event review time. English-source checks do not imply local-language coverage.

`public/discovery-status.json` records a static audit of the first known successful discovery artifact: run `37054141060`, 97 candidates, artifact-created time `2026-10-02T19:27:08Z`, provenance URL and six-hour configured interval. `last_success_basis: artifact-created` avoids claiming a precisely known workflow completion time. The manifest does not monitor current availability, infer later runs or refresh the public reporting snapshot. Its audit age and Actions provenance matter when assessing the next run.

## Discovery is a separate trust level

`scripts/discover_gdelt.py` requests GDELT DOC 2.0 article metadata over HTTPS: a 24-hour window, broad protest/demonstration/strike terms, up to 100 results, newest first. It deduplicates URLs, skips unsafe URLs, retains a small metadata subset, and marks every candidate `unverified`. It does not download article bodies, scrape restricted services, identify participants, infer event countries or create event records. The provider's source country identifies an outlet, not the location of a protest. Its `seendate` is retained as `gdelt_seen_at`, never interpreted as publication or occurrence time. Missing upstream article arrays or request failures fail the job rather than masquerading as a successful empty update.

Candidate output is restricted to `data/candidates/`. The discovery workflow has read-only repository permissions and uploads an expiring reviewer artifact. It cannot commit events or deploy Pages. A maintainer must inspect sources, assess independence and conflicting claims, confirm broad location and dates, write attributed event fields, then obtain editorial approval through a pull request. Configure branch protection to enforce that review: the included workflow alone cannot prevent an administrator from pushing directly.

Discovery is a limited sample, subject to keyword, language, publisher and indexing bias and the record cap. Country selection does not imply complete coverage. Absence from the atlas is not evidence of an absence of protest. An empty candidate result does not establish that nothing occurred.

## Local editor workspace

`review.html`, `review.js` and `review.css` provide a local-import desk, separate from the public map/list. The page loads only the published country directory and event source URLs to establish valid occurrence codes and duplicate references. A file input reads a downloaded discovery JSON artifact into memory; there is no automatic candidate feed, account, local storage, upload endpoint or remote mutation. Imported candidate metadata is rendered as text, source links must be HTTPS without credentials, and GDELT seen time/source country never become occurrence fields.

Each candidate starts unreviewed. Draft dispositions are unreviewed, needs source, reject, duplicate and ready for editor. Readiness requires manually entered nonfuture observed date, occurrence country, source-read acknowledgement, summary and attribution. Duplicate decisions need an existing event ID. Canonical URL matching removes common tracking parameters/fragments, preserves meaningful query parameters and flags existing public sources; it does not resolve syndication or episode identity. A matching public source URL cannot be marked ready as a new record.

The desk exports only a local JSON review packet. Imported candidates stay `review_status: unverified` even when their draft disposition is ready. `scripts/build_review_queue.py` can normalize candidates into `data/review-queues/` or validate an exported packet without writing it. It rejects occurrence/approval fields in imports, checks packet evidence gates and recomputes URL-derived duplicate IDs from public sources. Queue writes cannot escape the nonpublic directory through symlinks and replace files atomically rather than writing through hardlinks. Neither path writes public event data. See `REVIEW_WORKFLOW.md` for commands and packet schema.

These tools prepare review work; they do not enroll or identify human editors, provide independent human verification or publish approved events. Editorial staffing, source-independence review, separate public-data pull requests and an exercised correction process remain pending requirements. The public correction issue template warns against posting private identifying information or evidence.

## Local verification

```sh
python3 -m unittest discover -s tests -v
node --test tests/*.mjs        # or: npm test
python3 scripts/build.py       # runs every validator, then writes _site
python3 -m http.server 8000 --directory _site
# optional, local only: NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs [--root _site --prefix /protest-atlas/]
```

The Python tests exercise unsafe URLs, private fields, exact locations, contradictory/future dates, foreign claim references, unverified candidate rejection, duplicate JSON keys, coverage claims, manual draft evidence gates, URL deduplication, output path/link boundaries and the build allowlist. The Node tests cover the front-end modules (see Tests above). Browser smoke covers routing, sheets, map, permalinks, failure states, the stale and archive clocks, targets and focus at phone, tablet, desktop and short viewports in Chromium; checks on the deployed site still have to be run and recorded after each deploy. Tests do not prove editorial facts, source independence, human-review capacity or exhaustive worldwide coverage. Recorded release evidence is the authority for which checks ran.

## Primary references

- [GDELT DOC 2.0 API documentation](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — request modes, JSON, timespan, sorting and record caps.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — artifact deployment and permissions.
- [GitHub Actions schedule event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) — scheduling constraints.

Reviewed against primary references on 2026-10-02. Older provider documentation is not an uptime or coverage guarantee.

## Historical expansion (release 3)

This section describes release 3; in 4.0 the same data drive the Reports filters, the record's Outcome section and the About ledger.

`history.js` implements reported-year/city/outcome filtering, completion styling, sourced result panels and the country search ledger. `event-context.json` references event-local source IDs without altering the v1 event contract. `research-ledger.json` has exactly one public initial-search row per directory entry; raw retries remain in `research/round3`. Search results are candidates, not published episodes.

`cities.json` partitions all contextual city names into mapped and unmapped references. Coordinates are from the official Natural Earth populated-place dataset, rounded to one decimal. `map.js` projects those references; the dots do not locate demonstrations. The 4.9 MB source dataset is a repository build input, excluded from the public asset allowlist. Small countries and unmapped cities remain navigable through filters.

`scripts/merge_history.py` assembles the five regional datasets and re-audited seed inputs. `validate_history.py` enforces exact fields, one context per event, event-local citations, supported end dates, outcome structure, dated country search provenance, safe URLs and the mapped/unmapped city partition. `validate_coverage.py` retains v1 compatibility and validates v2 source-language provenance and truly unknown publication-date windows. The build calls all validators and copies the named historical assets only.

Filter permalinks now include reported year, city and outcome. CSV adds city names, completion basis, change summaries and attributed actor effects. Reported-year matching uses recorded start/end/observation/timeline dates, not a continuous year-spanning activity assumption. Outcomes never become intensity scores.
