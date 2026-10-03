# Reuse and licensing ledger

Reviewed 2 October 2026; map, country-name and tooling rows updated 3 October 2026 for release 4.0 (built and verified locally; deployment pending). Confirm terms again before onboarding new feeds. Source accessibility and an open-source client do not establish redistribution rights for the underlying content.

## Included

| Component | Reuse | Attribution / rights |
| --- | --- | --- |
| Country directory | Adapted `name`, `alpha-2`, `region` from [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes), `all/all.json`, retrieved 2 Oct 2026 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Adaptations: rename alpha-2 to code, remove other fields, replace empty region with Antarctic, then correct Taiwan (TW) to Asia in release 3; the initial fallback had misclassified it. The adapted `public/countries.json` remains CC BY-SA 4.0. See included original LICENSE notice. Upstream is a convenience directory, not an authoritative sovereignty ruling; its documented source snapshot is June 2024. |
| GDELT discovery metadata | Optional candidate article intake; not a verified event source | [GDELT terms](https://gdeltproject.org/about.html#termsofuse) allow dataset redistribution with citation and link. Credit The GDELT Project, https://www.gdeltproject.org/. These terms do not relicense news articles linked by GDELT. |
| GitHub Actions and Pages | Build, artifact upload and static delivery | Action sources and pinned versions in workflows. GitHub service terms apply separately. |
| D3 7.9.0 | Local SVG geography, Equal Earth projection and zoom | ISC; retained `vendor/D3_LICENSE`. [D3 documentation](https://d3js.org/d3-geo). |
| TopoJSON Client 3.1.0 / world-atlas 2.0.2 | Local country topology; since 4.0 the browser decodes country shapes and the border mesh from it at runtime | ISC notices retained in `vendor/`; [world-atlas](https://github.com/topojson/world-atlas). Underlying [Natural Earth geography](https://www.naturalearthdata.com/about/terms-of-use/) is public domain. Exact sources/checksums: MAP_IMPLEMENTATION.md and public/world-map-metadata.json. |
| `public/world-map-codes.json` (4.0) | Published table from topology geometry id to ISO alpha-2 code, prepared by `scripts/prepare_map.py` | The id-to-code mapping is adapted from the CC BY-SA 4.0 ISO table above and keeps that attribution and license. |
| `public/world-countries.geo.json` | Prepared GeoJSON with ISO code/name properties. Published in releases 2–3; since 4.0 kept in the repository for reproducibility tests only, **not published** | Geometry public domain; adapted ISO name/code metadata retains CC BY-SA 4.0 attribution. |
| Short country display names (4.0) | 24 common English names shown in place of formal ISO names (for example "South Korea" for "Korea, Republic of"), chosen by an AI agent with reference to [Unicode CLDR](https://cldr.unicode.org/) English territory display names, plus search-only aliases. Display only: `public/countries.json` and the CSV keep the ISO names. No human editorial review of the choices. | No CLDR data file is bundled or published; the names are hand-entered in `js/model.js`. CLDR is distributed under the [Unicode License v3](https://www.unicode.org/license.txt); we credit it as the reference. If CLDR data files or larger extracts are used later, include the Unicode copyright and permission notice with them. |
| Natural Earth populated places | Coarse city references, rounded to one decimal; 101 mapped names from 118 sourced references | Public-domain Natural Earth 1:10m populated places. Official source, SHA-256, omissions and interpretation: HISTORICAL_RESEARCH.md; retained `vendor/NATURAL_EARTH_LICENSE.md`. No protest-site coordinates. |
| Original project code | HTML/CSS/JavaScript and Python | MIT; see root LICENSE. |
| Playwright, axe-core (local verification only) | `tests/browser/smoke.cjs` uses a globally installed Playwright; release verification also ran axe-core 4.13.0 in a scratch directory. Neither is bundled, committed or published, and neither runs in CI. | Playwright: Apache-2.0. axe-core: MPL-2.0. |
| News references | Links, brief independent descriptions and attributed facts | Reuters, AP, Al Jazeera and other publishers retain their rights. No full-text article, image or video distribution license is implied. |

## Evaluated, not bundled

| Tool or project | Fit and decision | Primary reference |
| --- | --- | --- |
| Leaflet | BSD-2-Clause; evaluated but D3 chosen for a self-contained Equal Earth coverage map. No Leaflet code bundled. | https://github.com/Leaflet/Leaflet/blob/main/LICENSE |
| MapLibre GL JS | Open-source vector-map renderer; consider only if map scale/features need it. Tiles, style and geocoding rights/costs are separate. | https://github.com/maplibre/maplibre-gl-js |
| Ushahidi | Established crowdsourced reporting platform; inspect for a later moderated submission workflow. Its server/API requirements exceed this static pilot. No code imported. | https://github.com/ushahidi/platform |
| GDELT Global Dashboard | Existing experimental protest/conflict visualization; learn from its explicit error and media-volume cautions. Do not reuse its historical freshness claims as ours. | https://www.gdeltproject.org/globaldashboard/ |
| Protests-Vis | Historical 2016 demonstration of timeline/map/filter patterns. Outdated Flask/PostgreSQL stack; license and reuse rights need checking before any code import. | https://github.com/lingsitu1290/Protests-Vis |
| Crowd Counting Consortium | Useful US comparison and methodological source; scope is not global. Confirm dataset/code licensing separately before importing. | https://github.com/nonviolent-action-lab/crowd-counting-consortium |

ACLED is intentionally not ingested or republished. Its current EULA/tier restrictions need provider authorization suitable for this use before any integration. Carnegie and historical protest projects are research comparators, not assumed unrestricted APIs. See SOURCE_RESEARCH.md for the deeper comparison.
