# Protest Atlas

A public, source-led index of protest reporting, demands, counterpositions, timeframes, intensity dimensions, and state responses.

**Status: AI-assisted reporting pilot. No independent human editorial review.** The initial snapshot contains three source-checked reports dated 2 October 2026. The directory covers 249 countries and territories; this is not comprehensive event coverage or a real-time census. Present activity is unknown for the seed reports. Missing records never mean no protests.

- Website: https://occult-kranti.github.io/protest-atlas/
- Repository: https://github.com/occult-kranti/protest-atlas
- [Roadmap and delivery tracker](docs/ROADMAP.md)
- [Source comparison](docs/SOURCE_RESEARCH.md)
- [Editorial policy](docs/EDITORIAL_POLICY.md)
- [Panel review](docs/PANEL_REVIEW.md)
- [Architecture](docs/ARCHITECTURE.md) · [Deployment](docs/DEPLOYMENT.md)
- [Seed source audit](docs/SOURCE_AUDIT.md) · [Reuse and licenses](docs/REUSE_AND_LICENSES.md)

## Run locally

Python 3.12 or later is the reference runtime; no frontend installation is required.

```bash
python3 scripts/validate_data.py
python3 -m unittest discover -s tests -v
python3 scripts/build.py
python3 -m http.server 8000 --directory _site
```

Open http://localhost:8000. Do not open index.html directly as a file: browsers restrict fetching local JSON. Deployment uses relative paths for the GitHub Pages project subdirectory.

## How updates work

The scheduled discovery workflow asks GDELT for candidate article metadata every six hours, subject to service availability and GitHub scheduling. It does **not** modify the published event ledger. Candidates need article-level checking and an explicit reviewed-data commit. GDELT article volume is not a protest count, crowd estimate, or intensity score. The first workflow run and deployment must be checked before treating either service as active.

`public/events.json` is the published reporting snapshot. `public/examples.json` is synthetic and only available through an explicit example mode. `public/countries.json` is a directory, not a coverage guarantee. A successful build does not change observation or review dates. Old ongoing observations become “Needs review” in the browser after 72 hours.

## Scope

The product records issues, actor-attributed support/opposition **to a named target**, timeframes, source links, turnout uncertainty, disruption, violence, and police/administrative/legislative responses. It does not infer national popularity from protesters, conflate officials with counter-demonstrators, or calculate a combined severity score.

This repository publishes country/city summaries, not private participant identities, precise routes, or operational movement information. Do not submit sensitive testimony or personal identifiers through public GitHub issues.

## Contribute and correct

For a factual correction, open a repository issue with the event ID, affected public claim, source URL, and proposed correction. Do not post names of private participants, private contact details, faces, meeting points, or unpublished evidence. Git history and public issues are durable. Maintainers must validate source dates and independence and record substantive corrections in [CHANGELOG.md](CHANGELOG.md).

The initial records were assembled with AI assistance. Human-reviewed labeling is a later gate, not a claim made by this release. Source terms and source rights remain separate from this project's software license.

## License

Original code: MIT. Adapted country directory: CC BY-SA 4.0; see [country license](docs/COUNTRY_DATA_LICENSE.md) and [attribution](docs/REUSE_AND_LICENSES.md). Linked news articles and other third-party materials retain their respective rights. The MIT license does not relicense them.
