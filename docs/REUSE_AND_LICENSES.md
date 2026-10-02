# Reuse and licensing ledger

Reviewed 2 October 2026. Confirm terms again before onboarding new feeds. Source accessibility and an open-source client do not establish redistribution rights for the underlying content.

## Included

| Component | Reuse | Attribution / rights |
| --- | --- | --- |
| Country directory | Adapted `name`, `alpha-2`, `region` from [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes), `all/all.json`, retrieved 2 Oct 2026 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Adaptations: rename alpha-2 to code, remove other fields, replace empty region with Antarctic. The adapted `public/countries.json` remains CC BY-SA 4.0. See included original LICENSE notice. Upstream is a convenience directory, not an authoritative sovereignty ruling; its documented source snapshot is June 2024. |
| GDELT discovery metadata | Optional candidate article intake; not a verified event source | [GDELT terms](https://gdeltproject.org/about.html#termsofuse) allow dataset redistribution with citation and link. Credit The GDELT Project, https://www.gdeltproject.org/. These terms do not relicense news articles linked by GDELT. |
| GitHub Actions and Pages | Build, artifact upload and static delivery | Action sources and pinned versions in workflows. GitHub service terms apply separately. |
| Original project code | HTML/CSS/JavaScript and Python | MIT; see root LICENSE. |
| News references | Links, brief independent descriptions and attributed facts | Reuters, AP, Al Jazeera and other publishers retain their rights. No full-text article, image or video distribution license is implied. |

## Evaluated, not bundled

| Tool or project | Fit and decision | Primary reference |
| --- | --- | --- |
| Leaflet | BSD-2-Clause; suitable lightweight optional geographic view in P2. Keep accessible list as equivalent path. | https://github.com/Leaflet/Leaflet/blob/main/LICENSE |
| MapLibre GL JS | Open-source vector-map renderer; consider only if map scale/features need it. Tiles, style and geocoding rights/costs are separate. | https://github.com/maplibre/maplibre-gl-js |
| Natural Earth | Public-domain basemap dataset; preferred coarse geography for offline/static map. Attribute voluntarily and document disputed-boundary conventions. | https://www.naturalearthdata.com/about/terms-of-use/ |
| Ushahidi | Established crowdsourced reporting platform; inspect for a later moderated submission workflow. Its server/API requirements exceed this static pilot. No code imported. | https://github.com/ushahidi/platform |
| GDELT Global Dashboard | Existing experimental protest/conflict visualization; learn from its explicit error and media-volume cautions. Do not reuse its historical freshness claims as ours. | https://www.gdeltproject.org/globaldashboard/ |
| Protests-Vis | Historical 2016 demonstration of timeline/map/filter patterns. Outdated Flask/PostgreSQL stack; license and reuse rights need checking before any code import. | https://github.com/lingsitu1290/Protests-Vis |
| Crowd Counting Consortium | Useful US comparison and methodological source; scope is not global. Confirm dataset/code licensing separately before importing. | https://github.com/nonviolent-action-lab/crowd-counting-consortium |

ACLED is intentionally not ingested or republished. Its current EULA/tier restrictions need provider authorization suitable for this use before any integration. Carnegie and historical protest projects are research comparators, not assumed unrestricted APIs. See SOURCE_RESEARCH.md for the deeper comparison.
