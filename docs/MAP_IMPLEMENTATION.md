# Global map implementation

Updated for release 4.0 (built and verified locally on 3 Oct 2026; deployment pending). The release-3 version of this file is in Git history.

The map uses an Equal Earth projection and the real Natural Earth Admin 0 country geometry at 1:110m. It is a coverage map of the published index. Ochre means at least one published episode matches the current non-country filters; a gray hatch means none matches, which is a coverage gap, not "no protests"; ink with a light halo marks the selected country; a dark shadow means the country includes a sourced ended or suspended episode, not that a movement ended or won. Color is categorical, with no claim about protest frequency, turnout, intensity or severity. Example mode uses a striped violet watermark and its own fill, and never mixes with reported records. City dots are approximate public reference points, not protest sites. The map has no protest pins.

## Runtime integration

The map is an add-on. `app.js` imports `js/map-view.js` with `import()` on the first visit to `#/map`; `js/map-view.js` imports `map.js` and `js/country-brief.js`. `map.js` then loads the pinned `vendor/` scripts and two JSON files:

- `public/world-110m.topo.json`: world-atlas 2.0.2 topology. Country shapes are decoded at runtime with TopoJSON Client `feature()`, and shared borders with `mesh()`.
- `public/world-map-codes.json`: a small table from each topology geometry id to its ISO 3166-1 alpha-2 code, with the topology's SHA-256. `attachCodes()` adds the code to each feature. The three id-less areas (Northern Cyprus, Somaliland, Kosovo) have no entry.

`public/world-countries.geo.json` (426 KB) stays in the repository as a reproducible preparation output that tests compare with the code table. It is **not published and not fetched**; `tests/test_site.py` and `tests/test_map_assets.py` fail if it is.

`map.js` exports `createWorldMap({container, tooltip, onSelect, onSelectCity, onHover, gestures, reducedMotion, describe})`. The returned object has `update(state)` (events after the non-country filters, the directory, `selectedCountry`, `mode`, `loading`, `error`, contexts and city geography; unspecified keys are kept), `reset()`, `zoomIn()`, `zoomOut()`, `focusCountry(code)` (false for a country without a polygon), `focusRegion(name)`, `hasCountry(code)`, `setGestures('page'|'map')`, `getZoom()` and `destroy()`. The container emits `mapzoom`, `mapgestures`, `mapready` (`{mappedCountries, featureCount}`) and `maperror`. Zoom runs from 1 to 12. Failure leaves a plain-language message with Retry in the view; Reports, Countries and the country filter keep working, and a loading or failed data state never labels a country as having no records.

`js/map-view.js` owns the controls and the page integration:
- Region chips (World, Africa, Americas, Asia, Europe, Oceania), zoom in, zoom out, World, and "Explore map".
- **Gestures.** By default one finger and the wheel scroll the page and two fingers pinch the map. "Explore map" lets one finger and the wheel move the map until "Done exploring", Escape, or the stage leaving the viewport. The legend hint says which mode is on.
- A selection bar under the stage ("{Country} · n published episodes", "See brief", "Back to world", which clears the country filter). After a selection made on the map, the page scrolls only as far as needed to keep the bar above the phone tab bar and the stage top below the header.
- The legend ("What the colours mean") and the world overview or country brief. The brief's status line is a live region that keeps its node across selections, so screen readers announce it.

Keyboard: countries with records in view and the selected country sit in a roving tab order; arrow keys move between them in reading order and Enter or Space selects (`MAP_HELP`). The focus ring is drawn on its own halo above the selection, and in forced colours it is dashed CanvasText while the selection uses Highlight. Escape hides the hover tooltip wherever focus is. There is no keyboard-focus tooltip. The Countries view and the filter sheet list every territory and are the complete alternative to the map.

Pure helpers `groupRecordsByCountry(events)` and `countRecordsByCountry(events)` accept only uppercase two-letter codes and count index records, not protests or sources. `focusTransform`, `zoomButtonState`, `readingOrder`, `nextInDirection`, `gestureFilter` and `placeLabels` are pure and tested in `tests/test_map.mjs`.

## Country names

Map labels, the selection bar, the brief, cards and the directory show a short common name where the directory's ISO 3166 name is formal (for example "United Kingdom" for "United Kingdom of Great Britain and Northern Ireland", "South Korea" for "Korea, Republic of", "Taiwan" for "Taiwan, Province of China"). The 24 short names are in `js/model.js` (`COUNTRY_SHORT_NAMES`). They were chosen by an AI agent with reference to Unicode CLDR English display names, without human editorial review. CLDR's "&" and "Congo - Kinshasa" styles were not adopted, and some ISO forms were kept as they are (for example "Falkland Islands (Malvinas)", Hong Kong, Macao, Holy See). "Taiwan" follows CLDR and common news style; verification round 1 asked for that label to go through editorial review, and with no human editor appointed it remains an open item for the editorial owner. They are **display only**: `public/countries.json`, the CSV and the data files keep the ISO names, and the brief ("ISO name: …") and the directory show the ISO name as a second line when it differs. Search also matches a short list of aliases (UK, USA, Ivory Coast, Burma and others; `COUNTRY_ALIASES`), which are never displayed. A name is a label for navigation, not a position on sovereignty.

## Sources, licenses, and exact versions

| Asset | Upstream source | License / retained notice |
| --- | --- | --- |
| `vendor/d3.v7.9.0.min.js` | [D3 7.9.0 distribution](https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js), [official projection docs](https://d3js.org/d3-geo/cylindrical), [zoom docs](https://d3js.org/d3-zoom) | ISC; `vendor/D3_LICENSE`, Mike Bostock 2010–2023 |
| `vendor/topojson-client.v3.1.0.min.js` | [TopoJSON Client 3.1.0](https://github.com/topojson/topojson-client/tree/v3.1.0) | ISC; `vendor/TOPOJSON_CLIENT_LICENSE`, Michael Bostock 2012–2019 |
| `public/world-110m.topo.json` | [world-atlas 2.0.2](https://github.com/topojson/world-atlas/tree/v2.0.2), [pinned download](https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json) | Package ISC; `vendor/WORLD_ATLAS_LICENSE`, Michael Bostock 2013–2019; underlying Natural Earth geometry is public domain |
| `public/world-map-codes.json` | Prepared locally by `scripts/prepare_map.py`: topology geometry ids mapped through the ISO table below | The id-to-code mapping is adapted from the CC BY-SA 4.0 ISO table; retain that attribution and license |
| `vendor/iso-country-codes.json` | [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes), local download of `all/all.json` | CC BY-SA 4.0; names and code mapping attribution from Luke Duncalfe and contributors; see `docs/COUNTRY_DATA_LICENSE.md` and `docs/REUSE_AND_LICENSES.md`. Repository input only; not published |
| `public/world-countries.geo.json` | Prepared locally by `scripts/prepare_map.py` from the topology, the ISO table and the directory | Geometry public domain; code/name metadata CC BY-SA 4.0. Repository and test asset only since 4.0; not published |
| Short display names in `js/model.js` | Chosen with reference to [Unicode CLDR](https://cldr.unicode.org/) English territory display names | See the Unicode note in `docs/REUSE_AND_LICENSES.md` |

Natural Earth permits modification and redistribution without permission under its [official terms](https://www.naturalearthdata.com/about/terms-of-use/). Retain source attribution as provenance. D3 7.9.0 is ISC, even though older descriptions of D3 may mention BSD. The actual downloaded notices control.

## Reproducible preparation and limitations

Run `python3 scripts/prepare_map.py`. It uses only the Python standard library, the local pinned topology, the local ISO mapping and `public/countries.json`, and is deterministic: a re-run reproduces the committed `world-countries.geo.json`, `world-map-codes.json` and `world-map-metadata.json` byte for byte (`tests/test_map_assets.py` checks this). It decodes shared delta-encoded arcs exactly. `public/world-map-metadata.json` records counts, the directory entries without geometry, and SHA-256 checksums of the source, the ISO mapping, the GeoJSON and the code table. It has no build-time network dependency.

There are 177 source areas, 174 ISO-mapped countries/territories, and 249 directory entries. Seventy-five directory entries do not have their own polygon at 1:110m: mainly small islands, microstates and territories represented within other source geometries. The country brief says when a place is too small to draw, and Countries notes it on the row. Northern Cyprus, Somaliland and Kosovo have separate source shapes without numeric ISO identifiers; they remain contextual shapes, are not assigned invented codes and are not separately selectable. Source boundary representation is not a geopolitical position. This map is deliberately coarse and is not suitable for disputed-border analysis or street-level geography.

Known limits in 4.0:
- Antarctica (AQ) is in the code table but clipped by the land fit; choosing it from the directory frames the world with no outline. AQ has no published episode.
- American Samoa (AS) frames Oceania with nothing marked.
- At 360 px and world zoom, the control row covers part of Great Britain.
- At world zoom on phones, many countries with records are smaller than a fingertip. In verification round 1, one scripted tap on each of 66 such countries picked a neighbour in 4 cases at 360 px and 5 at 390 px; the fix that would change what a tap does at low zoom was not made in 4.0 (SPEC §23, verification round 1). Region chips, zoom, Explore and the Countries list are the reliable routes.

Ship `map.js`, `js/map-view.js`, `js/country-brief.js`, both JavaScript libraries, the ISC notices, `public/world-110m.topo.json`, `public/world-map-codes.json` and `public/world-map-metadata.json`. These are in the `scripts/build.py` allowlist. Preserve the CC BY-SA attribution in the published reuse notes.

Validation: the prepared geometries match the official TopoJSON Client `feature()` conversion, and the code table reproduces every GeoJSON code in order. `tests/test_map.mjs` covers selection, the brief, gestures, keyboard order and label placement; browser smoke check 6 covers drawing, selection by hit test and touch, the focus ring and the selection bar at phone and desktop sizes in Chromium. Physical touch and pinch on real devices remain unverified.
