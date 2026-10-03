# Protest Atlas

A public, source-led index of protest reporting, demands, counterpositions, timeframes, intensity dimensions, and state responses.

**Status: release 4.0, a mobile-first rebuild of the interface. It is built and verified locally; deployment is pending, and the live site still runs release 3 until 4.0 is merged and deployed.** This is an AI-assisted reporting pilot with no independent human editorial review. The data are the same 84 records as release 3: 84 sourced episodes across 81 countries/territories, 118 city references, newest evidence dated **2 Oct 2026**. The snapshot's envelope stamps and coverage note moved on 2 Oct when the blocked recent-activity sweep was recorded, and 4.0 adds new public data files (see [CHANGELOG.md](CHANGELOG.md)). All 249 directory entries have an initial search logged; 168 still have no published episode. An initial search is not a completed country history. Coverage is selective and predominantly English-language, not a real-time census. Missing records never mean no protests.

4.0 adds an **Ahead** view (announced protest actions, kept apart from reports) and **Coming next** (this site's own roadmap), plus dated update stamps that each name what they measure. Staleness is counted from the newest evidence, never from a build or deploy. **The data refresh is blocked:** the 2 Oct recent-activity search logged 167 searches but could not open a single news page, so nothing newer was published and the announced-actions list is empty. It waits for a session with news access; see [HANDOFF_DATA_REFRESH.md](docs/HANDOFF_DATA_REFRESH.md). See also the [historical research audit](docs/HISTORICAL_RESEARCH.md).

- [Website](https://occult-kranti.github.io/protest-atlas/) (release 3 until the 4.0 deploy) · [Local editor workspace](https://occult-kranti.github.io/protest-atlas/review.html)
- [Repository](https://github.com/occult-kranti/protest-atlas)
- [Roadmap and delivery tracker](docs/ROADMAP.md) · [Change log](CHANGELOG.md)
- [4.0 design record](docs/design/README.md): binding [SPEC](docs/design/SPEC.md), [integration notes](docs/design/INTEGRATION_NOTES.md), [editorial guidance](docs/design/EDITORIAL_GUIDANCE.md)
- [UX specification](docs/UX_SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Deployment](docs/DEPLOYMENT.md)
- [Source comparison](docs/SOURCE_RESEARCH.md) · [Editorial policy](docs/EDITORIAL_POLICY.md) · [Panel review](docs/PANEL_REVIEW.md)
- [Seed source audit](docs/SOURCE_AUDIT.md) · [Reuse and licenses](docs/REUSE_AND_LICENSES.md)
- [Map implementation](docs/MAP_IMPLEMENTATION.md) · [Editor review workflow](docs/REVIEW_WORKFLOW.md) · [Release evidence](docs/RELEASE_EVIDENCE.md)

## Explore the reporting

There are five views, and every one keeps the pilot disclosure above its content. On phones they sit in a bottom tab bar; from 900 px they move into the header. Filters live in the page address, so Reports, Map and the CSV always describe the same records and a copied link reproduces the view.

- **Reports** (`#/latest`, the default) lists published records newest evidence first, grouped by how old that evidence is: within 72 hours, 3 to 7 days, 7 to 30 days, then "Earlier research". Search and the filter sheet cover text, country, city, region, issue, status, reported year, outcome and a last-observed 7/30-day window. Each card leads with status, then place, title, latest evidence date, issues, timeframe, for/against **with a named target**, intensity (turnout, disruption and violence or harm, never combined), police/state response, and the first source with its publisher, publication date and "AI-assisted check". "Not established" is shown as such, never as zero or blank. A **List** layout gives a compact scan row. Copy a link to the current view, or download a filtered CSV with source URLs and spreadsheet-formula escaping.
- **Record** (`#/record/<id>`) opens as a sheet over the current view: an overview with four at-a-glance cells, then For/against, Intensity, Police/state, Outcome ("What changed — and for whom?"), Timeline and Sources, each source with its publication date and when it was last re-read. Previous/next step through the current list.
- **Map** (`#/map`) is the D3 Equal Earth coverage map with region chips, zoom and an Explore mode, so one finger scrolls the page until you choose to move the map. Selecting a country opens its brief and filters Reports to it. Color describes published coverage, never protest intensity, public support or completeness.
- **Ahead** (`#/ahead/actions`, `#/ahead/roadmap`) holds two separate lists. *Announced protest actions* is empty in this snapshot; it says why, and that an empty list does not mean nothing is planned. *Coming next to Protest Atlas* is this site's roadmap from `public/roadmap.json`; items are intentions, not promises, and carry no dates.
- **Countries** (`#/countries`) is the A–Z directory of all 249 entries by region. Each row says whether it has a published episode, or was searched (or the search failed) with none published, or was not yet searched. Common names such as South Korea, UK or Ivory Coast are found too.
- **About** (`#/about`) has the reading key, what each date means, the research scope with the country-by-country first-search ledger, the lead-discovery audit, data downloads and a switch to a clearly labelled illustrative example, which is excluded from counts and CSV export.

The header chip shows the snapshot time. Once the newest evidence is more than 72 hours old it shows that age instead ("newest evidence N days old"), and from 7 days it says "Stale snapshot". The dates sheet behind the chip lists each stamp separately: snapshot assembled, AI-assisted review pass (only when it differs from snapshot assembled; it does not appear in this snapshot), newest evidence, latest source re-read, announced-actions list compiled, site built, lead-discovery audit, and human editorial review ("Not completed"). Release-3 links such as `#atlas` and `#methodology` still open the matching view.

The map uses pinned local D3, TopoJSON Client and world-atlas/Natural Earth geometry, loaded only when the Map view is first opened. There is no mapping token, runtime CDN or remote tile service. Its simplified 1:110m boundaries do not draw every territory separately; use Countries, or the country filter, for those places or if the map fails.

## Run locally

Python 3.12 or later and Node.js 22 or later. No frontend installation is required.

```bash
python3 -m unittest discover -s tests     # 87 tests; plain `python3 -m unittest` finds none
npm test                                  # node --test tests/*.mjs: 227 tests
python3 scripts/build.py                  # runs every validator, then writes the allowlisted site to _site/
python3 -m http.server 8000 --directory _site
```

Open [http://localhost:8000](http://localhost:8000), or `/review.html` for the editor desk. Do not open HTML directly as a file: browsers restrict fetching local JSON. Deployment uses relative paths for the GitHub Pages project subdirectory.

The UI tests read a frozen copy of the 2 Oct data in `tests/fixtures/snapshot-20261002/`; tests on `public/*.json` check only invariants, so a valid data refresh does not turn them red. The validators can also run on their own: `scripts/validate_{data,coverage,history,upcoming,roadmap}.py`.

Optional browser smoke (24 checks at phone, tablet, desktop and short viewports; needs a global Playwright with Chromium, and takes about five minutes):

```bash
NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs                                          # serves the repository root
python3 scripts/build.py && NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs --root _site --prefix /protest-atlas/   # Pages layout
```

Check 10 compares `review.html` with a baseline taken from Git history (`git show 7f0b1d5:styles.css`); outside a Git checkout pass `--baseline-css <file>`. Smoke is a local check, not a CI gate.

## How updates work

The scheduled discovery workflow asks GDELT for candidate article metadata every six hours, subject to service availability and GitHub scheduling. It does **not** modify the published event ledger. Candidates need article-level checking and an explicit reviewed-data commit. GDELT article volume is not a protest count, crowd estimate or intensity score. The public discovery manifest is a **static audit**, recording the known successful run [37054141060](https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060) and its 97 unverified leads, with artifact-created time `2026-10-02T19:27:08Z`. It does not claim live service health or infer subsequent successful runs; consult Actions for current run outcomes.

`public/events.json` is the published reporting snapshot. `public/examples.json` is synthetic and only available through an explicit example mode. `public/countries.json` is a directory, not a coverage guarantee. `public/coverage.json` discloses actual source-language checks and unknown gaps. `public/research-ledger.json` records all 249 initial country searches. `public/event-context.json` holds sourced cities, episode endings and outcomes; `public/cities.json` supplies coarse public city reference points. Regional research inputs and failed attempts are retained in `research/round3/`; rebuild reviewed inputs with `python3 scripts/merge_history.py`, then validate. The merge updates integration time, never invents new event observations or source access dates. `public/discovery-status.json` records the dated discovery audit. `public/upcoming.json` holds announced protest actions (empty in this snapshot) and is validated by `scripts/validate_upcoming.py`; an announcement is never an occurrence. `public/roadmap.json` is the site roadmap shown under Coming next, validated by `scripts/validate_roadmap.py`; a shipped item must cite a test that CI runs. The build writes `public/build-info.json` (build time and commit) for the "Site built" stamp only. A successful discovery run, build or deployment does not change observation or source-review dates. Old ongoing observations become “Needs review” in the browser after 72 hours, and the snapshot is labelled stale from the newest evidence date, not from when the site was built.

## Prepare editorial review locally

Download and unzip a successful discovery workflow artifact, then import its candidate JSON into `review.html`. Search leads, read the underlying reporting, enter dates/country/claims manually, and apply draft dispositions. URL matches flag existing public records; no URL match proves that an event is new. “Ready for editor” requires evidence fields and source acknowledgement, but remains an unverified draft decision.

Work stays in the tab's memory. Export a local JSON review packet before refreshing or closing; there are no accounts, browser storage, uploads or automatic publication. The optional CLI normalizes leads outside the public asset tree and validates draft packets:

```bash
python3 scripts/build_review_queue.py /path/to/downloaded/latest.json
python3 scripts/build_review_queue.py /path/to/exported-review.json --validate-packet
```

See [the review guide](docs/REVIEW_WORKFLOW.md). Human editorial staffing, independent sign-off, source-independence assessment and an end-to-end correction drill remain pending. Do not commit private review notes or packets to public Git history.

## Scope

The product records issues, actor-attributed support/opposition **to a named target**, timeframes, source links, turnout uncertainty, disruption, violence, and police/administrative/legislative responses. It does not infer national popularity from protesters, conflate officials with counter-demonstrators, or calculate a combined severity score.

This repository publishes country/city summaries, not private participant identities, precise routes, or operational movement information. Do not submit sensitive testimony or personal identifiers through public GitHub issues.

## Contribute and correct

For a factual correction, use the [public record correction template](https://github.com/occult-kranti/protest-atlas/issues/new?template=correction.yml) with the event ID, relevant date, affected claim, supporting public source links and reason. Do not post names of private participants, private contact details, faces, meeting points or unpublished evidence. Git history and public issues are durable. Submitting an issue is not automatic approval or publication. Maintainers must validate source dates and independence and record substantive corrections in [CHANGELOG.md](CHANGELOG.md).

The initial records were assembled with AI assistance. Human-reviewed labeling is a later gate, not a claim made by this release. Source terms and source rights remain separate from this project's software license.

## License

Original code: MIT. Adapted country directory: CC BY-SA 4.0; see [country license](docs/COUNTRY_DATA_LICENSE.md) and [attribution](docs/REUSE_AND_LICENSES.md). Linked news articles and other third-party materials retain their respective rights. The MIT license does not relicense them.
