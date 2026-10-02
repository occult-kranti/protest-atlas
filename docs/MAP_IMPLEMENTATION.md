# Global map implementation

The map uses an Equal Earth projection and the real Natural Earth Admin 0 country geometry at 1:110m. It is a coverage map of the published index. Ochre indicates at least one source-linked record under the non-country filters; gray hatch indicates no published records in that view; dark teal indicates the selected country. Color is categorical, with no claim about protest frequency, turnout, intensity, or severity. The example mode uses lavender and explicitly identifies records as illustrative. The map does not use exact protest pins.

## Runtime integration

`map.js` exports `createWorldMap({container, tooltip, onSelect, onHover})`. The supplied container is a real DOM element and should have a definite height and `position: relative`. The tooltip is optional; give it absolute positioning and visual styles for `strong`, `span`, and `small`. The module loads pinned local scripts and map data; it makes no external requests.

```js
import {createWorldMap} from './map.js';
const map = await createWorldMap({
  container: document.getElementById('world-map'),
  tooltip: document.getElementById('map-tooltip'),
  onSelect: (code) => selectCountry(code),
});
map.update({
  events: matchingNonCountryFilters,
  countries: directory,
  selectedCountry: selectedCode,
  mode: 'reported', // or 'example', with an entirely separate records array
  loading: false,
  error: false,
});
```

`update` preserves unspecified state. Pass events after search, issue, region, and status filters, before the country filter. This keeps the global context while selecting one country filters the adjacent list. Published and illustrative arrays must remain separate. Methods `zoomIn()`, `zoomOut()`, and `reset()` connect to externally supplied labeled buttons. `focusCountry(code)` returns `false` for countries missing from this coarse map, otherwise fits their geometry. `hasCountry(code)` allows the side panel to explain a missing polygon. Both zoom gestures and programmatic country focus respect bounded translation and a 1–8 zoom range. Mouse wheel scrolling remains page scrolling; users use the explicit map controls, drag, or pinch.

The container emits `mapzoom` with `{scale, min, max}`, `mapready` with `{mappedCountries, featureCount}`, and `maperror` with `{message}`. Listen before calling the asynchronous constructor if initialization events are needed. Failure leaves a plain-language status and a harmless API; it does not affect the list or directory. Loading and data errors do not falsely label countries as having no published records.

CSS hooks: `.world-map-svg`, `.map-sphere`, `.map-graticule`, `.map-countries`, `.map-country`, `.map-borders`, `.map-no-records-pattern`, `.map-status`. Paths carry `data-country`, `data-has-records`, and `data-selected`. Give `.map-country:focus` a strong focus stroke. The SVG has a semantic description; only countries with records and the selected country join the tab order. Their paths use button semantics and support Enter/Space. The full directory and select provide keyboard access to every country and territory. Hover text uses DOM text nodes, never upstream HTML. Selection occurs on click and never publishes or sends data.

Pure helpers `groupRecordsByCountry(events)` and `countRecordsByCountry(events)` accept only uppercase two-letter country codes. They count index records, not protests or sources, and do not mutate inputs.

## Sources, licenses, and exact versions

| Asset | Upstream source | License / retained notice |
| --- | --- | --- |
| `vendor/d3.v7.9.0.min.js` | [D3 7.9.0 distribution](https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js), [official projection docs](https://d3js.org/d3-geo/cylindrical), [zoom docs](https://d3js.org/d3-zoom) | ISC; `vendor/D3_LICENSE`, Mike Bostock 2010–2023 |
| `vendor/topojson-client.v3.1.0.min.js` | [TopoJSON Client 3.1.0](https://github.com/topojson/topojson-client/tree/v3.1.0) | ISC; `vendor/TOPOJSON_CLIENT_LICENSE`, Michael Bostock 2012–2019 |
| `public/world-110m.topo.json` | [world-atlas 2.0.2](https://github.com/topojson/world-atlas/tree/v2.0.2), [pinned download](https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json) | Package ISC; `vendor/WORLD_ATLAS_LICENSE`, Michael Bostock 2013–2019; underlying Natural Earth geometry is public domain |
| `vendor/iso-country-codes.json` | [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes), local download of `all/all.json` | CC BY-SA 4.0; names and code mapping attribution from Luke Duncalfe and contributors; see `docs/COUNTRY_DATA_LICENSE.md` and `docs/REUSE_AND_LICENSES.md` |
| `public/world-countries.geo.json` | Prepared locally by `scripts/prepare_map.py` from the preceding topology, mapping and existing directory | Geometry retains its public-domain provenance. Code/name metadata is adapted from the CC BY-SA 4.0 directory/mapping; retain that attribution and license. |

Natural Earth permits modification and redistribution without permission under its [official terms](https://www.naturalearthdata.com/about/terms-of-use/). Retain source attribution as provenance. D3 7.9.0 is ISC, even though older descriptions of D3 may mention BSD. The actual downloaded notices control.

## Reproducible preparation and limitations

Run `python scripts/prepare_map.py`. It uses only the Python standard library, local pinned topology, local ISO mapping, and `public/countries.json`. It decodes shared delta-encoded arcs exactly, preserving polygons and antimeridian geometry, and writes minimal GeoJSON features with only `{code, name}` properties. `public/world-map-metadata.json` records source and output SHA-256 checksums and the complete list of directory entries without geometry. It has no build-time network dependency.

There are 177 source areas, 174 ISO-mapped countries/territories, and 249 directory entries. Seventy-five directory entries do not have their own polygon at 1:110m: mainly small islands, microstates, and territories represented within other source geometries. The directory remains the complete navigation method. Northern Cyprus, Somaliland, and Kosovo have separate source shapes without numeric ISO identifiers; their `code` is `null`. They remain contextual shapes, are not assigned invented country codes, and are not separately selectable. Source boundary representation is not a geopolitical position. This map is deliberately coarse and is not suitable for disputed-border analysis or street-level geography.

Runtime shared-border mesh uses TopoJSON Client over the locally pinned topology, while filled country shapes use prepared GeoJSON. Ship `map.js`, both JavaScript libraries, all three ISC notices, `public/world-countries.geo.json`, and `public/world-110m.topo.json`. The mapping and preparation metadata may remain source assets. Preserve CC BY-SA attribution in the published reuse notes.

Validation: all 177 prepared geometries were compared structurally with the official TopoJSON Client `feature()` conversion and match exactly. The initial fixture totals were FR=1, IN=1, ES=1; current tests calculate totals from the expanded published snapshot. The exported counting helper ignores invalid country codes and groups repeated records without inferring event severity. Browser interaction verification should cover selection, list coordination, all three zoom controls, mobile sizing, focus visibility, unmapped directory countries, illustrative separation, and failed local asset loading.
