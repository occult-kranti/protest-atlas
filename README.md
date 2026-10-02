# Protest Atlas

A public, source-led index of protest reporting, demands, counterpositions, timeframes, intensity dimensions, and state responses.

**Status: release 3 · historical research since 2024 · AI-assisted reporting pilot. No independent human editorial review.** The snapshot contains 84 sourced episodes across 81 countries/territories, with 118 city references. All 249 directory entries have an initial search logged; 168 still have no published episode. An initial search is not a completed country history. Coverage is selective and predominantly English-language, not a real-time census. Missing records never mean no protests. See the [historical research audit](docs/HISTORICAL_RESEARCH.md).

- [Website](https://occult-kranti.github.io/protest-atlas/) · [Local editor workspace](https://occult-kranti.github.io/protest-atlas/review.html)
- [Repository](https://github.com/occult-kranti/protest-atlas)
- [Roadmap and delivery tracker](docs/ROADMAP.md)
- [Source comparison](docs/SOURCE_RESEARCH.md)
- [Editorial policy](docs/EDITORIAL_POLICY.md)
- [Panel review](docs/PANEL_REVIEW.md)
- [Architecture](docs/ARCHITECTURE.md) · [Deployment](docs/DEPLOYMENT.md)
- [Seed source audit](docs/SOURCE_AUDIT.md) · [Reuse and licenses](docs/REUSE_AND_LICENSES.md)
- [Map implementation](docs/MAP_IMPLEMENTATION.md) · [Editor review workflow](docs/REVIEW_WORKFLOW.md) · [Release evidence](docs/RELEASE_EVIDENCE.md)

## Explore the reporting

The D3 Equal Earth world map links country selection to a coverage panel and the source-led record index. Text, country, city, reported year, outcome, status, region, issue and last-observed 7/30-day filters apply to the same records. A reported-year match means a dated observation or timeline entry exists, not continuous activity throughout the year. Black shadows identify sourced ended/suspended episodes; they do not mean every protest in that country ended or that its demands succeeded. Evidence panels explain what changed, the affected actors, and whether benefit/setback assessments are explicit or inferred. Copy a view link to share those filters or download a filtered reported-data CSV with source URLs, recorded-status limitations and spreadsheet-formula escaping. Synthetic examples remain explicitly labeled and excluded from reported export.

The map uses pinned local D3, TopoJSON Client and world-atlas/Natural Earth geometry. There is no mapping token, runtime CDN or remote tile service. Its simplified 1:110m boundaries do not draw every territory separately; use the country selector and full 249-entry directory for those places or if the map fails. Color describes published reporting coverage, never protest intensity, public support or completeness.

## Run locally

Python 3.12 or later is the reference runtime; no frontend installation is required.

```bash
python3 scripts/validate_data.py
python3 scripts/validate_coverage.py
python3 scripts/validate_history.py
python3 -m unittest discover -s tests -v
node --test tests/test_explorer.mjs
python3 scripts/build.py
python3 -m http.server 8000 --directory _site
```

Open [http://localhost:8000](http://localhost:8000), or `/review.html` for the editor desk. Do not open HTML directly as a file: browsers restrict fetching local JSON. Deployment uses relative paths for the GitHub Pages project subdirectory.

## How updates work

The scheduled discovery workflow asks GDELT for candidate article metadata every six hours, subject to service availability and GitHub scheduling. It does **not** modify the published event ledger. Candidates need article-level checking and an explicit reviewed-data commit. GDELT article volume is not a protest count, crowd estimate or intensity score. The public discovery manifest is a **static audit**, recording the known successful run [37054141060](https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060) and its 97 unverified leads, with artifact-created time `2026-10-02T19:27:08Z`. It does not claim live service health or infer subsequent successful runs; consult Actions for current run outcomes.

`public/events.json` is the published reporting snapshot. `public/examples.json` is synthetic and only available through an explicit example mode. `public/countries.json` is a directory, not a coverage guarantee. `public/coverage.json` discloses actual source-language checks and unknown gaps. `public/research-ledger.json` records all 249 initial country searches. `public/event-context.json` holds sourced cities, episode endings and outcomes; `public/cities.json` supplies coarse public city reference points. Regional research inputs and failed attempts are retained in `research/round3/`; rebuild reviewed inputs with `python3 scripts/merge_history.py`, then validate. The merge updates integration time, never invents new event observations or source access dates. `public/discovery-status.json` records the dated discovery audit. A successful discovery run, build or deployment does not change observation or source-review dates. Old ongoing observations become “Needs review” in the browser after 72 hours.

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
