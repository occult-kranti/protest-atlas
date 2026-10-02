# Architecture

Protest Atlas is a static HTML/CSS/JavaScript site. GitHub Pages serves the built files; there is no application server, database, account system or browser-side API secret. Public JSON is curated editorial data, not an automatic event feed.

## Publication boundary

`scripts/validate_data.py` uses Python 3.12's standard library. It validates `public/countries.json`, the `public/events.json` envelope, and optional `public/examples.json`. Events use event-local source IDs for positions, state responses, timeline statements and described intensity. Unknown turnout uses null bounds. Every public event has a verification note, last verification time and last observed time. Schema version accepts integer `1` or string `"1.0"`.

The validator rejects unknown keys at every schema object, malformed or duplicate IDs, foreign source references, unsupported status/stance/verification values, non-HTTPS or credential-bearing source URLs, future observations/verifications/access dates, contradictory dates and turnout bounds, precise coordinate/location fields, and common address-like labels. Only city, region, country and multi-location precision are accepted. These checks cannot understand every harmful detail inside natural language: source attribution, necessity, privacy and summary accuracy still require editorial review. The schema is for collective events and public institutional positions, not participant dossiers or movement tracking.

`start_date` is null with `start_date_precision: "unknown"` when onset is not established. A news publication or GDELT discovery time is not event onset. `last_observed_at` indicates the latest evidenced observation; `last_verified` indicates the most recent source check. `generated_at` describes the data envelope, and `last_editorial_review` records its actual review. Build and deployment preserve these values byte for byte. A new deployment must never refresh observation or verification dates by itself. Status is an attributed editorial observation, not proof that a protest remains active now. Freshness must use `last_observed_at`.

`scripts/build.py` validates first, then copies only `index.html`, `styles.css`, `app.js`, the three explicitly named public JSON files and `.nojekyll` into `_site`. It rejects symlinked publication sources. Repository docs, discovery files, research notes, credentials and future miscellaneous files are outside that allowlist. Public assets added later need an explicit reviewed allowlist update. GitHub Actions uploads `_site`, never the repository root.

## Discovery is a separate trust level

`scripts/discover_gdelt.py` requests GDELT DOC 2.0 article metadata over HTTPS: a 24-hour window, broad protest/demonstration/strike terms, up to 100 results, newest first. It deduplicates URLs, skips unsafe URLs, retains a small metadata subset, and marks every candidate `unverified`. It does not download article bodies, scrape restricted services, identify participants, infer event countries or create event records. The provider's source country identifies an outlet, not the location of a protest. Its `seendate` is retained as `gdelt_seen_at`, never interpreted as publication or occurrence time. Missing upstream article arrays or request failures fail the job rather than masquerading as a successful empty update.

Candidate output is restricted to `data/candidates/`. The discovery workflow has read-only repository permissions and uploads an expiring reviewer artifact. It cannot commit events or deploy Pages. A maintainer must inspect sources, assess independence and conflicting claims, confirm broad location and dates, write attributed event fields, then obtain editorial approval through a pull request. Configure branch protection to enforce that review: the included workflow alone cannot prevent an administrator from pushing directly.

Discovery is a limited sample, subject to keyword, language, publisher and indexing bias and the record cap. Country selection does not imply complete coverage. Absence from the atlas is not evidence of an absence of protest. An empty candidate result does not establish that nothing occurred.

## Local verification

```sh
python -m unittest discover -s tests -v
python scripts/validate_data.py
python scripts/build.py
python -m http.server 8000 --directory _site
```

The tests exercise unsafe URLs, private fields, exact locations, contradictory/future dates, foreign claim references, unverified candidate rejection, duplicate JSON keys, evidence requirements and the build allowlist. They do not prove editorial facts, source independence or exhaustive worldwide coverage.

## Primary references

- [GDELT DOC 2.0 API documentation](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) — request modes, JSON, timespan, sorting and record caps.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — artifact deployment and permissions.
- [GitHub Actions schedule event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) — scheduling constraints.

Reviewed against primary references on 2026-10-02. Older provider documentation is not an uptime or coverage guarantee.
