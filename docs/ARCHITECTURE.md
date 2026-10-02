# Architecture

Protest Atlas is a static HTML/CSS/JavaScript site. GitHub Pages serves the built files; there is no application server, database, account system or browser-side API secret. Public JSON is curated editorial data, not an automatic event feed.

## Geographic exploration

Release 2 uses `map.js` for an SVG country map with a D3 **Equal Earth** projection and `explore.js` for the linked country panel, view-state encoding, observation-window filtering and CSV generation. `app.js` owns the selected country and other filters, then passes the same filtered records to the map and index. Country selection changes that shared view; the panel opens existing source-linked record detail rather than inventing country events.

D3 7.9.0 and TopoJSON Client 3.1.0 load from pinned `vendor/` files. `public/world-110m.topo.json` and derived `public/world-countries.geo.json` use world-atlas 2.0.2/Natural Earth 1:110m geometry, with provenance and hashes in `public/world-map-metadata.json`. Assets are served locally with paths relative to the module URL; there is no runtime CDN, mapping API key, tile service or geolocation. This implementation replaces the earlier Leaflet proposal. Asset preparation and boundary conventions are documented in `MAP_IMPLEMENTATION.md`; reuse terms are in `REUSE_AND_LICENSES.md`.

The geometry contains 177 features with 174 catalog country codes; 75 of the 249 directory entries lack separate polygons at this scale. Unmapped source areas remain contextual geometry, not extra catalog records. The country selector and directory therefore remain the full navigation route, including small territories and a keyboard alternative. Map failure leaves filters and the published index available. Pan/zoom and country focus change geographic presentation only. Color and report totals represent publication scope, never crowd size, severity, national opinion or completeness.

Observation presets select the last 7 or 30 days using `last_observed_at`. Filter URLs carry text query, country, region, issue, status and observation window; they do not imply a live-data subscription. Filtered reported-data CSV includes stable ID, country, title, issues, last observation, recorded status, a status-limitation note and source URLs. Text cells are quoted and spreadsheet-formula prefixes escaped. The export is a reporting snapshot, not the full claim/evidence ledger; synthetic mode does not export reported CSV.

## Publication boundary

`scripts/validate_data.py` uses Python 3.12's standard library. It validates `public/countries.json`, the `public/events.json` envelope, and optional `public/examples.json`. Events use event-local source IDs for positions, state responses, timeline statements and described intensity. Unknown turnout uses null bounds. Every public event has a verification note, last verification time and last observed time. Schema version accepts integer `1` or string `"1.0"`.

The validator rejects unknown keys at every schema object, malformed or duplicate IDs, foreign source references, unsupported status/stance/verification values, non-HTTPS or credential-bearing source URLs, future observations/verifications/access dates, contradictory dates and turnout bounds, precise coordinate/location fields, and common address-like labels. Only city, region, country and multi-location precision are accepted. These checks cannot understand every harmful detail inside natural language: source attribution, necessity, privacy and summary accuracy still require editorial review. The schema is for collective events and public institutional positions, not participant dossiers or movement tracking.

`start_date` is null with `start_date_precision: "unknown"` when onset is not established. A news publication or GDELT discovery time is not event onset. `last_observed_at` indicates the latest evidenced observation; `last_verified` indicates the most recent source check. `generated_at` describes the data envelope, and the legacy field `last_editorial_review` records AI-assisted integration/review time, not human sign-off. Build and deployment preserve these values byte for byte. A new deployment must never refresh observation or verification dates by itself. Status is an attributed editorial observation, not proof that a protest remains active now. Freshness must use `last_observed_at`.

`scripts/build.py` validates first, then copies only the explicit static-site allowlist into `_site`: the public atlas HTML/styles/modules, review HTML/styles/module, named public reporting/coverage/discovery/map JSON, pinned map libraries and their license files, and `.nojekyll`. It rejects symlinked publication sources. Repository docs, candidate artifacts, review queues/packets, research notes, credentials and miscellaneous files are outside that allowlist. Public assets added later need an explicit reviewed allowlist update. GitHub Actions uploads `_site`, never the repository root.

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
python -m unittest discover -s tests -v
python scripts/validate_data.py
python scripts/validate_coverage.py
python scripts/build.py
python -m http.server 8000 --directory _site
```

The tests exercise unsafe URLs, private fields, exact locations, contradictory/future dates, foreign claim references, unverified candidate rejection, duplicate JSON keys, coverage claims, manual draft evidence gates, URL deduplication, output path/link boundaries and the build allowlist. Browser release checks also need map/list agreement, filter permalink reload, responsive keyboard navigation, local import/export and visible failure states. Tests do not prove editorial facts, source independence, human-review capacity or exhaustive worldwide coverage. Recorded release evidence is the authority for which checks ran.

## Primary references

- [GDELT DOC 2.0 API documentation](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — request modes, JSON, timespan, sorting and record caps.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — artifact deployment and permissions.
- [GitHub Actions schedule event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) — scheduling constraints.

Reviewed against primary references on 2026-10-02. Older provider documentation is not an uptime or coverage guarantee.

## Historical expansion (release 3)

`history.js` implements reported-year/city/outcome filtering, completion styling, sourced result panels and the country search ledger. `event-context.json` references event-local source IDs without altering the v1 event contract. `research-ledger.json` has exactly one public initial-search row per directory entry; raw retries remain in `research/round3`. Search results are candidates, not published episodes.

`cities.json` partitions all contextual city names into mapped and unmapped references. Coordinates are from the official Natural Earth populated-place dataset, rounded to one decimal. `map.js` projects those references; the dots do not locate demonstrations. The 4.9 MB source dataset is a repository build input, excluded from the public asset allowlist. Small countries and unmapped cities remain navigable through filters.

`scripts/merge_history.py` assembles the five regional datasets and re-audited seed inputs. `validate_history.py` enforces exact fields, one context per event, event-local citations, supported end dates, outcome structure, dated country search provenance, safe URLs and the mapped/unmapped city partition. `validate_coverage.py` retains v1 compatibility and validates v2 source-language provenance and truly unknown publication-date windows. The build calls all validators and copies the named historical assets only.

Filter permalinks now include reported year, city and outcome. CSV adds city names, completion basis, change summaries and attributed actor effects. Reported-year matching uses recorded start/end/observation/timeline dates, not a continuous year-spanning activity assumption. Outcomes never become intensity scores.
