# Protest Atlas 4.0 — implementation architecture

Tech architect, redesign panel · 2 Oct 2026 · baseline commit `7ff6dca` (working tree clean, 49 Python + 13 Node tests green).

Scope: a complete mobile-first rebuild of the public atlas. It has to work for either UX direction ("Live desk": feed first, bottom tab bar; "Atlas sheet": map first, bottom sheet) and has to be buildable by five agents working in parallel on files that do not overlap. Everything below is binding for builders unless it is marked *UX decides*.

---

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Pages | One `index.html` with hash-routed views: `#/latest`, `#/map`, `#/ahead` (and `#/ahead/roadmap`), `#/countries`, `#/about`, plus the overlay route `#/record/<id>`. `review.html` is unchanged. New self-contained `404.html`. No `roadmap.html`. |
| Permalinks | Filters stay in the query string (`?q,country,region,issue,status,window,year,city,outcome`), using the same codec. The view goes in the hash. Legacy anchors (`#atlas`, `#countries`, `#methodology`) are aliased. Every old URL still works. |
| Direction switch | Two attributes on `<html>`: `data-default-view="latest\|map"` and `data-map-gestures="page\|map"`. All JS is the same for both directions; only `index.html` structure and CSS differ. |
| Module layout | The root modules that tests import keep their names (`app.js`, `explore.js`, `map.js`, `history.js`, `review.js`, `freshness.js`). New code goes in `js/` and `css/`. Every module imports cleanly in Node with no DOM. |
| State | One immutable-update store (`js/store.js`). `app.js` is the only subscriber and calls each component's `render(state, prev)`. Components change state only through `actions`. |
| Cache busting | One version, `4.0`, in an **import map** plus the `<link>`/entry tags. Module specifiers carry no `?v=`. A test enforces this. |
| CSS | `styles.css` becomes tokens + base + layout + primitives, still shared with `review.html` and keeping the legacy token aliases. Each work package owns one component sheet under `css/`. Cascade layers, three breakpoints (600/900/1200), no `!important`. Dark mode is opt-in through `html[data-color-scheme="auto"]`, so the review desk stays light. |
| Map | Countries come from TopoJSON plus a 2 KB code table. The 426 KB GeoJSON is not fetched at runtime and is no longer published (it stays in the repo for tests). Land-fit without Antarctica gives a `viewBox 0 0 1000 448`. Gestures default to `touch-action: pan-y` (one finger scrolls the page; two fingers zoom or pan) with an explicit Explore toggle. Countries use a roving tabindex and there is a skip-map link. Focus fits the largest polygon cluster. Colours come only from CSS custom properties. |
| Data | Critical path: events, countries, event-context, upcoming and build-info (about 62 KB gzip). Lazy: coverage, research-ledger, cities, discovery, roadmap and examples. |
| Roadmap | `public/roadmap.json` with a strict schema. `scripts/validate_roadmap.py` runs in `build.py`. `shipped` requires at least one `test` evidence entry that resolves to a CI-run test, plus a ship date and release. |
| Tests | Keep `test_explorer.mjs` and `test_freshness.mjs` **unchanged** as regression contracts. Add 5 Node and 3 Python test files. Add a local-only Playwright smoke script, `tests/browser/smoke.cjs`, outside the CI glob. |
| New dependencies | None at runtime. No new vendored code. Adopted: import maps, `<dialog>`, `Intl.RelativeTimeFormat`, cascade layers and container queries. View Transitions only as progressive enhancement. |

---

## 1. Ground truth this plan is built on (measured, not assumed)

- **The GeoJSON is redundant at runtime.** In Node, `topojson.feature(world-110m.topo.json, objects.countries)` reproduced `public/world-countries.geo.json` geometry for **177/177** features, in the same order (probe: `scratchpad/design/probe/geo.cjs`). Only the ISO2 `code` property is missing: the topology carries numeric ids, 3 of which are null (N. Cyprus, Somaliland, Kosovo). `tests/test_explorer.mjs` reads the GeoJSON from the repo (177 features, FR/IN/ES unique, 3 null codes), so **the file stays in the repo** but leaves the publication allowlist.
- **Land-fit geometry.** The Equal Earth sphere has an aspect ratio (h/w) of 0.487. Land without Antarctica (`AQ`) is 0.439. `fitExtent([[8,8],[992,440]], land)` fills exactly, which gives `MAP_WIDTH = 1000` and `MAP_HEIGHT = 448`. At 358 CSS px wide the map is 160 px tall, and **175 of 177 features are under 44 px** at zoom 1. On a phone the map is an overview; the list, search and directory must carry selection.
- **Focus by largest cluster** (rule from §5.4, measured in a 1000×448 space):

  | Country | Whole feature | Largest-cluster rule |
  |---|---|---|
  | FR | 175×170 (includes French Guiana) | 29×27 (mainland) |
  | US | 270×156 | 148×80 (contiguous US) |
  | NO | 49×43 | 49×29 |
  | ID | 128×59 | 67×43 |
  | NZ | 53×39 | 53×39 |
  | FJ | 984×8 (antimeridian split) | 4×3 (needs the "ignore parts wider than half the map" guard) |

- **d3-zoom sets no `touch-action`.** Only d3-brush and d3-drag do (checked in the vendored 7.9.0 bundle). The scroll trap therefore comes entirely from `map.js` line 203 (`touch-action: none`) and can be fixed there.
- **Payload (bytes, raw / gzip -9):**

  | File | Raw | Gzip |
  |---|---|---|
  | events.json | 241,373 | 38,278 |
  | event-context.json | 117,459 | 20,375 |
  | countries.json | 19,322 | 2,816 |
  | coverage.json | 110,204 | 6,059 |
  | research-ledger.json | 372,328 | 68,094 |
  | cities.json | 17,989 | 3,248 |
  | world-110m.topo.json | 107,761 | 38,496 |
  | world-countries.geo.json | 436,691 | **149,637** |
  | d3 7.9.0 | 279,706 | 92,377 |
  | topojson-client | 7,169 | 2,635 |
  | current CSS (3 files) | 35,751 | 9,388 |
  | current app/explore/map/history JS | 60,402 | 20,142 |

- **Already in place:** `freshness.js` is committed but **not in `PUBLIC_FILES`**, so it would 404 in production. `public/upcoming.json` does not exist yet (it is in `OPTIONAL_FILES`; `merge_history.py` writes it). `build.py` already validates upcoming and writes `public/build-info.json` into `_site` only.

---

## 2. Routing and pages

### 2.1 Decision: one page, hash views; filters in the query

- **Why not separate pages.** A `roadmap.html` or `ahead.html` would duplicate the shell, header, tab bar, stamps chip and sheets. It would reload on every tab switch, lose filter state, and add a second page for every work package to keep consistent. Parallel builds are already safe with one page, because the shell exposes empty mount points (§4.7) and each work package renders into its own.
- **Why the hash and not `?view=`.**
  1. A `#/record/<id>` history entry means the Android back gesture and the browser Back button close the record sheet. This is a large part of making the mobile experience feel native.
  2. The filter codec (`readViewState`/`encodeViewState`) keeps exactly the 9 keys that `test_explorer.mjs` deep-equals, so no test churn.
  3. GitHub Pages needs no server rewrite.

### 2.2 Route grammar (`js/router.js`, owned by WP2)

| Hash | Route object | Notes |
|---|---|---|
| `''`, `#`, `#/` | `{view: defaultView}` | `defaultView` comes from `html[data-default-view]`: `latest` for Live desk, `map` for Atlas sheet. |
| `#/latest`, `#/map`, `#/ahead`, `#/countries`, `#/about` | `{view}` | `VIEWS` is this exact list. |
| `#/ahead/roadmap`, `#/ahead/actions` | `{view:'ahead', param}` | Scrolls to and focuses the sub-section. |
| `#/record/<id>` | `{view: <last non-record view>, record: id}` | `id` must match `^[a-z0-9][a-z0-9-]{0,95}$` (same as `validate_data.ID`). On a cold load the underlying view is `defaultView`. |
| `#atlas`, `#countries`, `#methodology`, `#roadmap`, `#/next`, `#/roadmap` | Aliases: map, countries, about, ahead/roadmap, ahead, ahead/roadmap | The router replaces the URL with the canonical hash. |
| `#/<unknown>` | `{view: defaultView, unknown:true}` | Replaces the URL and shows a toast: "That section doesn't exist." |
| Any other `#…` (`#main`, `#after-map`, `#detail-source-2`) | `null` | **Not a route.** The router ignores it, so native anchor behaviour and skip links keep working, and the current view stays. |

### 2.3 History semantics

- Navigation uses `history.pushState` (with `{atlas:true, pushed:true}` as state) and then applies the route directly. The router listens to `popstate` and `hashchange`; the latter covers hashes typed or edited by hand.
- **View changes** push a history entry. Filter changes `replaceState` the **query** only, preserve `location.hash`, are debounced by 250 ms (iOS Safari throws after 100 `replaceState` calls in 30 s, and search fires on every keystroke), and are written only in reported mode after the critical load.
- **Record open** (card tap) pushes `#/record/<id>`.
  - **Close** (button, Escape or backdrop): if the current entry was pushed by the router, use `history.back()`. Otherwise (a deep link), use `replaceState` to `#/<underlying view>`.
  - **Back** (popstate): the route loses `record`, so the controller calls `closeSheet(recordSheet, 'route')`. The `'route'` reason never triggers another history operation, which guards against re-entrancy.
  - **Prev/Next record** inside the sheet uses `replaceState`, so Back still closes the sheet rather than stepping through records.
- **Deep link `#/record/<id>` before data has loaded:** the route is stored, and the sheet opens when the critical data is ready. If the id is unknown, show the toast "This record is not in the current snapshot" and replace the URL with `#/<view>`. Example records are not deep-linkable, because mode is not in the URL.
- **Focus and title.** On user-initiated view changes, focus `#<view>-title` (`tabindex="-1"`) and set `document.title = "<View name> — Protest Atlas"`. On the initial load, do not move focus.
- **View Transitions** (optional): `document.startViewTransition?.(apply)` only when supported and not `prefers-reduced-motion`.

### 2.4 Permalink compatibility and URL hygiene (`explore.js`, WP2)

- `readViewState` / `encodeViewState` keep their exact 9-key shape and allowlists. There is one deliberate migration: `year` changes from `['2024','2025','2026']` to `/^20\d{2}$/`, which stops it breaking in 2027. The existing test asserts the `2024` round-trip, which still passes. The year options are generated from data (`availableYears`).
- **New: `droppedParams(search)`** returns the names of parameters that were present but rejected or normalised (`?status=live&year=1999` gives `['status','year']`). After load, the controller adds any post-validation drops (a country not in the directory, region or issue absent from the data, a city not among the options). The list is shown once in `#data-notice` as: "Some link filters were not recognised and were removed: status, year." This fixes the current silent rewrite.
- **Share link:** `origin + pathname + ('?'+q if q) + ('#/'+view if view !== defaultView)`. **Record share:** `origin + pathname + '#/record/' + id` (filters omitted). Use `navigator.share` when it exists on a coarse pointer, otherwise the clipboard, otherwise show the URL in `#action-feedback`.
- **Source anchors:** `#detail-source-N` hrefs are kept (`outcomeHTML` tests assert the string). Clicks are intercepted by `data-scroll-to` (§4.8), so the hash route is never clobbered.

### 2.5 Other pages

- **`review.html`, `review.js`, `review.css`: no edits.** They keep linking `styles.css` and `review.css`. `styles.css` keeps every class and token they use (§4.9). Dark mode does not apply to them because `review.html` has no `data-color-scheme` attribute.
- **`checks.html`** (from `tests/layout-preview.html`): WP1 adds page options `index.html#/latest|#/map|#/ahead|#/countries|#/about`, `review.html` and `404.html`.
- **`404.html`** (new, WP1): fully self-contained, with inline `<style>` using literal colours, inline `<script>`, `<meta name="robots" content="noindex">`, and no relative asset URLs (Pages serves it at any depth).
  - Home link: `seg = location.pathname.split('/')[1]`; `home = location.hostname.endsWith('github.io') && seg ? '/'+seg+'/' : '/'`. The no-JS fallback is `href="/protest-atlas/"`.
  - Known aliases redirect with `location.replace`: `roadmap`, `roadmap.html` and `coming-next` go to `#/ahead/roadmap`; `ahead` and `next` to `#/ahead`; `map` to `#/map`; `countries` to `#/countries`; `about` and `methodology` to `#/about`.
  - Visible links: Latest, Map, Coming next, Countries, Published data (`public/events.json`).

---

## 3. File plan and ownership

### 3.1 Phase 0 scaffold (lead, before any builder starts; about 30 min)

Phase 0 ensures that every import resolves, the build allowlist is final, and builders never wait on each other's files.

1. Create `js/` and `css/`, and a stub for every new file in §3.2 that exports the exact signatures from §4.6. Function stubs return `''`, `[]`, `null`, or `{render(){}}`.
2. Move `getDisplayStatus` and `dateLabel` **verbatim** from `app.js` into `js/model.js`. Make `app.js` re-export them. Write `js/html.js` **verbatim from §4.3**.
3. Write the `index.html` skeleton containing every id in §4.7, the import map (§11.1) and the CSS links.
4. Set `build.py` `PUBLIC_FILES` to the final list in §3.3.
5. Run both test suites. They must be green before WP1–WP5 start.

### 3.2 Work packages: non-overlapping file sets

| Path | Action | Purpose | Owner |
|---|---|---|---|
| `index.html` | rewrite | Shell: header, stamp chip, notice, 5 view sections, tab bar/nav, footer, 3 `<dialog>` sheets, SVG icon sprite, static About copy, import map, modulepreload | **WP1** |
| `styles.css` | rewrite | `@layer` order, tokens (+ legacy aliases, light/dark), reset, base type, layout/views, primitives (`.btn`, `.chip`, `.badge`, `.status`, `.band`, `.stamp`, `.notice`, `.sheet`, `.tab-bar`, `.toast`, `.empty-state`…), shared with `review.html` | **WP1** |
| `atlas.css`, `history.css` | delete | Cascade debt removed | **WP1** |
| `404.html` | create | Self-contained not-found page with alias redirects | **WP1** |
| `js/sheet.js` | create | `<dialog>` sheet behaviour: open/close, focus, scroll lock, backdrop, `data-open-sheet`/`data-close-sheet`/`data-scroll-to` delegation, optional detents (Atlas) | **WP1** |
| `tests/layout-preview.html` | modify | Route options in the preview selector | **WP1** |
| `tests/test_shell.mjs` | create | DOM-contract ids, import-map/version consistency, modulepreload set, Node import safety of every module, code payload budgets | **WP1** |
| `tests/browser/smoke.cjs` | create | Local-only Playwright smoke (§10.4) | **WP1** |
| `app.js` | rewrite | Bootstrap/controller: store, router, loaders, component mounting, delegated actions, 60 s tick; re-exports `getDisplayStatus`, `dateLabel` | **WP2** |
| `explore.js` | rewrite | Pure only: `withinWindow`, `readViewState`, `encodeViewState`, `csvForEvents` (unchanged contracts) + `FILTER_KEYS`, `droppedParams`, `shareURL`. `createExplorer` is removed | **WP2** |
| `js/model.js` | create | Pure selectors and status, search, filter, sort and snapshot helpers | **WP2** |
| `js/store.js` | create | Store and initial state | **WP2** |
| `js/router.js` | create | Route parse/format plus history binding | **WP2** |
| `js/data.js` | create | Critical and lazy loaders, shape checks | **WP2** |
| `js/actions.js` | create | All state transitions, share/export, `exportAllowed` | **WP2** |
| `js/filters.js` | create | Search, quick chips, active chips, filter sheet controls | **WP2** |
| `js/list.js` | create | Feed stats, result summary, grouped/paginated list, loading/error/empty states | **WP2** |
| `js/stamps.js` | create | Updated-time chip, stamp list, `refreshTimes` | **WP2** |
| `js/notice.js` | create | Pilot disclosure, stale/error/dropped-param notice, example banner | **WP2** |
| `css/feed.css` | create | Styles for filters, chips, filter sheet body, feed, stamps list, notice | **WP2** |
| `tests/test_core.mjs` | create | Node tests for model/router/store/data/explore additions/actions/stamps/notice | **WP2** |
| `js/html.js` | create (verbatim, Phase 0) | Shared escape, URL, source and time helpers; signatures frozen | **WP3** maintains |
| `js/record-facts.js` | create | Pure record derivations: sides, state action, intensity facets, timeframe, evidence line | **WP3** |
| `js/cards.js` | create | `renderCard` (HTML string) | **WP3** |
| `js/detail.js` | create | `renderRecord` sheet body, section nav, `patchRecordStatus` | **WP3** |
| `history.js` | modify | Keep `contextFor`, `matchesHistory`, `completionKind`, `outcomeHTML` (pinned strings). Restyle classes. Add `data-scroll-to` on refs. **Remove `renderResearchCoverage`** (moved to `js/about.js`) | **WP3** |
| `css/record.css` | create | Cards, record sheet body, outcome section | **WP3** |
| `tests/test_record.mjs` | create | Record-facts, card and detail rendering contracts | **WP3** |
| `map.js` | modify | TopoJSON-only, land fit, gesture modes, roving tabindex, cluster focus, CSS-only colours, new pure exports | **WP4** |
| `js/map-view.js` | create | Lazy map mount: controls, legend, tooltip, explore toggle, auto-focus, failure/retry, brief placement | **WP4** |
| `js/country-brief.js` | create | World overview and country brief models plus HTML | **WP4** |
| `css/map.css` | create | Map stage/svg/legend/controls/brief styles from tokens only | **WP4** |
| `scripts/prepare_map.py` | modify | Also emit `public/world-map-codes.json`; GeoJSON output byte-identical | **WP4** |
| `public/world-map-codes.json` | create (generated) | `{schema_version, source, topology_sha256, codes:{"250":"FR",…}}` | **WP4** |
| `public/world-map-metadata.json` | modify (regenerated) | Add `codes_sha256` | **WP4** |
| `public/world-countries.geo.json` | keep in repo, unpublished | Tests read it; runtime no longer fetches it | — |
| `tests/test_map.mjs` | create | Pure map helpers | **WP4** |
| `tests/test_map_assets.py` | create | Codes/topology/GeoJSON parity and metadata hashes | **WP4** |
| `js/ahead.js` | create | Announced actions (upcoming.json) and site roadmap (roadmap.json) | **WP5** |
| `js/countries.js` | create | A–Z directory with coverage-honest labels | **WP5** |
| `js/about.js` | create | Discovery audit, research scope, lazy ledger table | **WP5** |
| `css/pages.css` | create | Ahead/roadmap/countries/about styles | **WP5** |
| `public/roadmap.json` | create | Product roadmap data (§8) | **WP5** |
| `scripts/validate_roadmap.py` | create | Strict validator (§8.3) | **WP5** |
| `scripts/build.py` | modify | Call `validate_roadmap_repository`. **`PUBLIC_FILES` is fixed in Phase 0**; WP5 changes it only on lead request | **WP5** |
| `tests/test_roadmap.py` | create | Validator tests plus the real-file check | **WP5** |
| `tests/test_pages.mjs` | create | Pure helpers of ahead, countries and about | **WP5** |
| `tests/test_site.py` | create | Offline internal link check of the built `_site`, 404 self-containment | **WP5** |
| `tests/test_upcoming.py` | modify | Add "empty items manifest validates" case | **WP5** |
| `.github/workflows/pages.yml` | modify | Deploy concurrency, Node 24 action pins, post-deploy probe | **WP5** |
| `package.json` | modify | `"smoke": "node tests/browser/smoke.cjs"` (users set NODE_PATH) | **WP5** |
| `tests/test_explorer.mjs`, `tests/test_freshness.mjs`, `freshness.js`, `review.*` | **keep unchanged** | Regression contracts and frozen helpers | — |
| `docs/*.md`, `CHANGELOG.md`, `README.md` | modify after integration | ARCHITECTURE, UX_SPEC, MAP_IMPLEMENTATION, ROADMAP, DEPLOYMENT (pins), REUSE (GeoJSON no longer shipped), RELEASE_EVIDENCE | **lead (Phase 3)** |
| `scripts/merge_history.py`, `validate_{data,coverage,history,upcoming}.py`, `research/**`, other `public/*.json` | **not touched by WP1–5** | Data agents may be working in parallel | — |

**Rule:** a builder who needs a change in another package's file asks the lead. Nobody edits a file outside their package. Shared vocabulary (ids, attributes, classes, tokens, signatures) is frozen by this document.

### 3.3 Final `PUBLIC_FILES` (set in Phase 0)

```python
PUBLIC_FILES = (
    'index.html', '404.html', 'styles.css',
    'css/feed.css', 'css/record.css', 'css/map.css', 'css/pages.css',
    'app.js', 'explore.js', 'map.js', 'history.js', 'freshness.js',
    'js/html.js', 'js/model.js', 'js/store.js', 'js/router.js', 'js/data.js', 'js/actions.js',
    'js/filters.js', 'js/list.js', 'js/stamps.js', 'js/notice.js', 'js/sheet.js',
    'js/record-facts.js', 'js/cards.js', 'js/detail.js',
    'js/map-view.js', 'js/country-brief.js',
    'js/ahead.js', 'js/countries.js', 'js/about.js',
    'review.html', 'review.css', 'review.js',
    'public/events.json', 'public/countries.json', 'public/examples.json', 'public/event-context.json',
    'public/research-ledger.json', 'public/cities.json', 'public/coverage.json', 'public/discovery-status.json',
    'public/upcoming.json', 'public/roadmap.json',
    'public/world-110m.topo.json', 'public/world-map-codes.json', 'public/world-map-metadata.json',
    'vendor/d3.v7.9.0.min.js', 'vendor/topojson-client.v3.1.0.min.js',
    'vendor/NATURAL_EARTH_LICENSE.md', 'vendor/D3_LICENSE', 'vendor/TOPOJSON_CLIENT_LICENSE', 'vendor/WORLD_ATLAS_LICENSE',
)
OPTIONAL_FILES = {'public/examples.json', 'public/upcoming.json'}
```

Removed: `atlas.css`, `history.css`, `public/world-countries.geo.json`. `tests/test_pipeline.py` needs **no edit**: its expected output set is derived from `PUBLIC_COPIES`, `GENERATED_FILES` and `.nojekyll`.

---

## 4. Module contracts

### 4.1 Global rules (every JS file)

1. **Node import safety.** No top-level access to `document`, `window`, `navigator`, `location`, `matchMedia`, `localStorage`, `HTMLElement` or `CSS`. DOM work happens inside functions. `app.js` ends with `if (typeof document !== 'undefined') boot();`. `test_shell.mjs` imports every `js/*.js` file and every root module in Node.
2. **Plain relative specifiers** (`'./model.js'`, `'../freshness.js'`) with **no `?v=`**. Versioning lives in the import map (§11.1).
3. **Lazy modules.** `map.js`, `js/map-view.js` and `js/country-brief.js` are reached only through dynamic `import()` from `app.js`. Everything else is static and gets a modulepreload link.
4. **HTML strings** are built only with `esc`, `safeURL` and `sourceLink` from `js/html.js`. All data text is escaped, and only http(s) URLs are linked. `history.js` keeps its private `escape`.
5. **Never mutate state objects.** Always produce new objects for changed slices so that `render(state, prev)` reference checks work.
6. **Time.** Any function that depends on "now" takes `now` as a parameter. Renderers receive `state.now`. Nothing calls `Date.now()` during render, except `app.js` when ticking.
7. **No `localStorage`, analytics, geolocation, network calls other than same-origin JSON, `eval` or inline event handlers.**

### 4.2 Frozen exports (tests import these by path)

| Import in test | New home | How it is preserved |
|---|---|---|
| `getDisplayStatus` from `../app.js` | `js/model.js` (verbatim) | `export {getDisplayStatus, dateLabel} from './js/model.js';` in `app.js` |
| `withinWindow`, `readViewState`, `encodeViewState`, `csvForEvents` from `../explore.js` | `explore.js` (stays) | Same signatures. Only `year` validation becomes `/^20\d{2}$/` |
| `countRecordsByCountry` from `../map.js` | `map.js` | Unchanged; `groupRecordsByCountry` also kept |
| `matchesHistory`, `completionKind`, `outcomeHTML` from `../history.js` | `history.js` | Unchanged signatures and pinned strings ('Assessment / inference', 'protest causation is not established', 'End not established', `#detail-source-1`, escaping). Markup classes may change |
| `normalizeCandidates`, `reviewErrors`, `canonicalUrl` from `../review.js` | `review.js` | File untouched |
| `public/world-countries.geo.json` (177 features, 3 null codes, FR/IN/ES unique) | repo | File kept; generator output byte-identical |

`dateLabel` stays exported from `app.js` for compatibility. `contextFor` stays exported from `history.js`.

### 4.3 `js/html.js`: verbatim (Phase 0 writes it; WP3 may add functions, not change these)

```js
// Shared DOM-free HTML string helpers. Pure; safe to import in Node.
import {absoluteLabel, relativeLabel} from '../freshness.js';

export const REPO_URL = 'https://github.com/occult-kranti/protest-atlas';
const ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ENTITIES[c]);

/** http(s) URLs only; '' otherwise. */
export function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}
export function hostOf(value) {
  const url = safeURL(value);
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
}
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function icon(name, label = '') {
  const svg = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${esc(name)}"></use></svg>`;
  return label ? `${svg}<span class="visually-hidden">${esc(label)}</span>` : svg;
}

/** External source link: new tab, no referrer, accessible "opens in a new tab". */
export function sourceLink(source, label) {
  const url = safeURL(source?.url);
  const text = esc(label || source?.title || 'Source URL unavailable');
  return url
    ? `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}${icon('external')}<span class="visually-hidden"> (opens in a new tab)</span></a>`
    : text;
}

/** 1-based position of each source id in event.sources. */
export function sourceNumbers(event) {
  return new Map((event?.sources ?? []).map((s, i) => [s.id, i + 1]));
}

/** In-sheet citation chips. href kept for history/outcome tests; data-scroll-to avoids hash routing. */
export function sourceRefs(event, ids = []) {
  const numbers = sourceNumbers(event);
  return (ids ?? []).map(id => numbers.get(id)).filter(Boolean)
    .map(n => `<a class="source-ref" href="#detail-source-${n}" data-scroll-to="detail-source-${n}">Source ${n}</a>`).join('');
}

/** Visible text for a time element. format: 'both' | 'absolute' | 'relative'. */
export function timeText(value, now, format = 'both') {
  if (format === 'absolute') return absoluteLabel(value);
  if (format === 'relative') return relativeLabel(value, now);
  return `${absoluteLabel(value)} · ${relativeLabel(value, now)}`;
}

/** <time> that js/stamps.js refreshTimes() can update in place. */
export function timeTag(value, now, format = 'both', className = 'stamp-time') {
  if (!value || !Number.isFinite(Date.parse(value))) return `<span class="${esc(className)}">Not established</span>`;
  return `<time class="${esc(className)}" datetime="${esc(value)}" data-rel="${esc(value)}" data-format="${esc(format)}">${esc(timeText(value, now, format))}</time>`;
}
```

### 4.4 State, store and actions (WP2)

```js
// js/store.js
export function createStore(initial) // → { get(): State, set(patch | (s) => patch, meta = {}): void, subscribe(fn): () => void }
// set() shallow-merges the patch into a NEW top-level object; listeners receive (state, prev, meta) synchronously.
export function initialState({filters, defaultView, mapGestures, now}) // → State
```

```text
State = {
  now: number,                                   // ms; changed only by tick / boot
  mode: 'reported' | 'example',
  route: { view: 'latest'|'map'|'ahead'|'countries'|'about', param: string|null, record: string|null },
  filters: { query, country, region, issue, status, window, year, city, outcome },  // exactly readViewState() keys
  data: {
    events: Envelope|null, countries: Country[], contexts: ContextFile|null,
    upcoming: UpcomingFile|null, build: BuildInfo|null,                        // critical
    coverage: null, research: null, cities: null, discovery: null, roadmap: null, examples: null  // lazy
  },
  load: {
    critical: 'loading' | 'ready' | 'error',          // 'error' only when events or countries fail
    errors: { events?: 'error', countries?: 'error', contexts?: 'error', upcoming?: 'absent'|'error', build?: 'absent'|'error' },
    lazy: { coverage|research|cities|discovery|roadmap|examples: 'idle'|'loading'|'ready'|'error' }
  },
  ui: { listLimit: number /* PAGE_SIZE multiples */, droppedParams: string[], feedback: string, mapStatus: 'idle'|'loading'|'ready'|'unavailable' }
}
```

```js
// js/actions.js
export function createActions({store, router, loader, sheets}) // → Actions (below)
export function exportAllowed(state) // → {ok: boolean, reason: string}; false in example mode, while loading, on error, or with 0 matches
```

| Action | Semantics |
|---|---|
| `setFilter(key, value)` / `setFilters(patch)` | Key must be in `FILTER_KEYS`. The value is sanitised by round-tripping `readViewState(encodeViewState(next))`. A country change clears `city` unless the city starts with `country+':'`. Resets `ui.listLimit` to `PAGE_SIZE`. |
| `resetFilters()` | All 9 keys back to `readViewState('')`. |
| `selectCountry(code, {view} = {})` | `setFilter('country', code)`, then `navigate(view)` if one is given. |
| `selectCity(country, name)` | Sets `country` and `city = country+':'+name`. |
| `setMode(mode)` | Mode change: `resetFilters()`, set mode, `loadLazy('examples')` for example mode, set `html[data-mode]`. |
| `navigate(view, {param = null, replace = false})` | Through the router. |
| `openRecord(id, {trigger, replace = false})` / `closeRecord()` / `stepRecord(±1)` | §2.3. `stepRecord` walks `selectFiltered(state)` order with replace. |
| `showMore()` | `listLimit += PAGE_SIZE`; focus moves to the first newly added card link. |
| `loadLazy(name)` → `Promise` | Memoised; updates `load.lazy[name]`; an error can be retried with `retry(name)`. |
| `retryCritical()` | Reloads the critical set. |
| `share('view' \| 'record')` | §2.4. Sets `ui.feedback`. |
| `exportCSV()` | Guarded by `exportAllowed(state)` **inside the action**, not only by a disabled button. BOM + Blob + object URL, revoked after 1 s, filename `protest-atlas-reports.csv`. |
| `tick(now)` | §7.3. |

### 4.5 Component protocol

```js
/** @typedef {{ store, actions, env: { defaultView: string, mapGestures: 'page'|'map', reducedMotion: () => boolean } }} Ctx */
export function mountX(ctx) { /* bind delegated listeners on its own containers once */ return { render(state, prev) {} }; }
```

- `app.js` calls every mounted component's `render(state, prev)` from **one** store subscription, coalesced with `requestAnimationFrame`.
- Components must return early when their slices are reference-equal (`state.filters === prev.filters`, …).
- Components never call `store.subscribe`.
- After replacing `innerHTML`, a component restores focus to the element with the same `data-open-record`, `data-select-country` or `data-set-filter` value if focus was inside its container.

### 4.6 Exports per module (exact signatures)

**`js/model.js` (WP2, pure)**

```js
export const HOUR = 3_600_000;
export const PAGE_SIZE = 20;
export const STATUS_LABELS = {ongoing: 'Reported ongoing', planned: 'Planned', ended: 'Ended / suspended', 'needs-review': 'Needs review', unknown: 'Status unknown'};
export function getDisplayStatus(event, now = Date.now())          // verbatim from app.js 3.1
export function dateLabel(value)                                   // verbatim from app.js 3.1
export function statusLabel(status)
export function foldText(value)                                    // NFD, strip \p{M}, toLocaleLowerCase('en')
export function searchableText(event)                              // folded: title, summary, country_name, region, location.label, issues, positions actor/claim/target
export function queryTokens(query)                                 // folded, whitespace split, ≤ 8 tokens; AND semantics
export function indexContexts(contexts)                            // Map<event_id, record>, memoised per object (WeakMap)
export function eventMatches(event, filters, {context = null, now = Date.now(), ignoreCountry = false} = {})
  // ignoreCountry also ignores city (DELIBERATE CHANGE: a city selection keeps world context on the map, like country)
export function sortByObservation(events)                          // new array, newest last_observed_at first, ties by id
export function selectEvents(state)                                // reported envelope events or example events by mode
export function selectFiltered(state, {ignoreCountry = false} = {})
export function activeFilterCount(filters)                         // window !== 'all' counts as 1; query counts as 1
export function availableYears(events)                             // desc, from start/end/observed/timeline dates
export function cityOptions(events, contextIndex, country = '')     // [{value: 'CC:Name', label: 'Name · Country'}]
export function refinementOptions(events)                          // {regions: string[], issues: string[]} sorted
export function datasetStats(envelope, now)                        // {episodes, countries, observed7, observed30, ended} — scope only, never rankings
export function editorialStale(envelope, now)                       // true when last_editorial_review is invalid or ≥ 72 h old
export function timeSnapshot(state)                                 // string: event id×displayStatus×observationBand | upcoming id×announcementState×daysUntil | stale flag
```

**`explore.js` (WP2, pure)**: the four frozen exports plus:

```js
export const FILTER_KEYS = ['query', 'country', 'region', 'issue', 'status', 'window', 'year', 'city', 'outcome'];
export function droppedParams(search)                               // names present in search but rejected or normalised
export function shareURL({origin, pathname, filters, route, defaultView, kind = 'view'})
```

**`js/router.js` (WP2)**

```js
export const VIEWS = ['latest', 'map', 'ahead', 'countries', 'about'];
export const RECORD_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
export const ROUTE_ALIASES = {'#atlas': {view: 'map'}, '#countries': {view: 'countries'}, '#methodology': {view: 'about'},
  '#roadmap': {view: 'ahead', param: 'roadmap'}, '#/next': {view: 'ahead'}, '#/roadmap': {view: 'ahead', param: 'roadmap'}};
export function parseRoute(hash, defaultView = 'latest')  // → {view, param, record, alias: bool, unknown: bool} | null (null = not a route)
export function formatRoute({view, param = null, record = null})   // → '#/map' | '#/ahead/roadmap' | '#/record/<id>'
export function createRouter({defaultView, onChange})   // → {start(), go(route, {replace}), current(), closeRecord()}  (DOM-bound only inside start/go)
```

The router sets `html[data-view]`, sets `aria-current="page"` on `[data-nav="<view>"]`, focuses `#<view>-title` on user navigation, updates `document.title` and dispatches `document` `atlas:route` `{detail: {route, prev}}`.

**`js/data.js` (WP2)**

```js
export const CRITICAL = Object.freeze({events: 'public/events.json', countries: 'public/countries.json',
  contexts: 'public/event-context.json', upcoming: 'public/upcoming.json', build: 'public/build-info.json'});
export const LAZY = Object.freeze({coverage: 'public/coverage.json', research: 'public/research-ledger.json',
  cities: 'public/cities.json', discovery: 'public/discovery-status.json', roadmap: 'public/roadmap.json', examples: 'public/examples.json'});
export const REQUIRED = Object.freeze(['events', 'countries']);
export const SHAPES = { /* name → (value) => boolean, e.g. events: v => Array.isArray(v?.events) */ };
export class DataError extends Error {}                    // .name = file key, .kind = 'absent' (404) | 'http' | 'network' | 'shape'
export async function fetchJSON(path, {fetchImpl = globalThis.fetch, signal} = {})   // cache: 'no-cache'; same-origin relative path
export async function loadCritical({fetchImpl} = {})        // → {data: {...}, errors: {name: 'absent'|'error'}}  (Promise.allSettled)
export function createLazyLoader({fetchImpl} = {})          // → {load(name): Promise, state(name), reset(name)}
```

**`js/filters.js` (WP2)**: `export const QUICK_CHIPS` (*UX decides*, e.g. `[{key:'window',value:'7',label:'Last 7 days'}, …]`) and `export function mountFilters(ctx)`.

- It renders into `#filter-bar` (search `#query` plus quick chips plus the "Filters (n)" button `data-open-sheet="filters-sheet"`), `#active-filters` (removable chips `data-clear-filter`), `#filters-body` (controls with the **legacy ids** `#country-filter #status-filter #window-filter #region-filter #issue-filter #year-filter #city-filter #outcome-filter`, all ≥ 44 px tall and 16 px text) and `#filters-foot` ("Show N records" `data-close-sheet` and "Clear all" `data-clear-filter="all"`).
- Search input is debounced by 120 ms.
- Filters apply immediately (no draft state). The footer count is live.

**`js/list.js` (WP2)**: `export function mountList(ctx)`. It renders `#feed-stats` (`datasetStats`), `#result-summary` (`aria-live="polite"`: "Showing 20 of 84 published records · France · match your filters"), `#event-list` (an `<ol class="feed-list">` of `<li class="feed-item">` + `renderCard(...)`, optionally grouped by `observationBand` with `<h3 class="feed-group">`; *UX decides* grouping) and `#list-more` (`data-action="show-more"`).

- Loading, error and empty copy keep the current editorial wording. The filtered-empty state says: "This result describes our published coverage. It does not establish that no protests occurred…".
- The true-empty state offers the directory and the example (`data-set-mode="example"`).

**`js/stamps.js` (WP2)**: §7.

```js
export const STAMP_ROWS
export function stampItems(stamps, now)
export function refreshTimes(root, now)
export function mountStamps(ctx)
```

**`js/notice.js` (WP2)**

```js
export const PILOT_DISCLOSURE = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';
export function noticeModel(state) // → {tone: 'info'|'warn', lines: string[]}
export function mountNotice(ctx)   // #data-notice (always shows PILOT_DISCLOSURE), #example-banner (hidden unless example mode)
```

**`js/record-facts.js` (WP3, pure)**

```js
export const VERIFICATION_LABELS = {'single-source': 'Single reporting chain', corroborated: 'Corroborated by independent reports', contested: 'Contested', illustrative: 'Illustrative'};
export function positionSentence(position)    // "<actor> supports|opposes|has mixed positions on|position unclear on <target>"; missing target → "… (target not established)"
export function sidesLedger(event)            // {support: Position[], oppose: Position[], other: Position[]} — NO counts, bars or percentages are derived
export function stateActionSummary(event)     // {present: bool, items: [{action, attribution, source_ids}], text}; absent → text 'Not established in this record' (never 'no police action')
export function intensityFacets(event)        // [{key: 'turnout'|'disruption'|'violence', label, text, known: bool, source_ids}]; unknown/Unknown/'not established' → 'Not established'; never 0/'none'
export function timeframe(event, context, now) // {onset: 'Started 12 Sep 2026' | 'Onset not established', end: 'Ended 30 Sep 2026' | null, observed: label, band, spanDays: number|null (first-to-last report)}
export function evidenceLine(event)           // {publishers: string[], count, level, levelLabel, firstPublished, lastChecked} — count never presented as confidence
```

**`js/cards.js` (WP3)**

```js
export function renderCard(event, {context = null, mode = 'reported', now = Date.now(), countryName = code => code} = {}) // → HTML
export function renderCardSkeleton(count = 3) // → HTML
```

Card contract:
- The root is `<article class="card" data-id data-status data-band [data-ended]>`.
- The title link is `<a class="card-link" href="#/record/<id>" data-open-record="<id>">`.
- Also present: a status badge and an observation band; a timeframe line; issues; the first `positionSentence` plus "+n more"; a state-response line; three intensity facets; an evidence line (publisher, observed date, source published date, source count with the single-chain label, "AI-assisted check <date>"); a separate external **primary source link** (policy requirement; it is not nested inside the card link); the outcome teaser; cities; and the example watermark in example mode.

**`js/detail.js` (WP3)**

```js
export const RECORD_SECTIONS = [{id: 'rec-overview', label: 'Overview'}, {id: 'rec-sides', label: 'Sides'},
  {id: 'rec-intensity', label: 'Intensity'}, {id: 'rec-state', label: 'State action'}, {id: 'rec-outcome', label: 'Outcome'},
  {id: 'rec-timeline', label: 'Timeline'}, {id: 'rec-sources', label: 'Sources'}];
export function renderRecord(event, {context, mode, now, countryName, position = null /* {index, total} */}) // → HTML for #record-body
export function patchRecordStatus(root, event, now) // updates .rec-status badge in place; inserts #temporal-update note when aged into needs-review
```

`renderRecord` must contain:
- an `<h2 id="detail-title" tabindex="-1">`;
- a sticky section nav of `<a href="#rec-…" data-scroll-to="rec-…">`;
- source items `<li id="detail-source-N">`;
- `outcomeHTML(event, context)` inside `#rec-outcome`;
- the example banner when `mode === 'example'`;
- the needs-review note when that status applies.

**`map.js` (WP4)**: §5.2. **`js/map-view.js` (WP4)**: `export function mountMap(ctx)` returns `{render(state, prev), ensure(): Promise<void>}`. **`js/country-brief.js` (WP4)**:

```js
export function overviewModel({mapEvents, countries, mode})   // {count, countryCount, recent: [{code, name, lastObserved}] (5 most recently observed, NOT by count)}
export function briefModel({code, mapEvents, allEvents, countries, coverage, research, mode})
  // {code, name, region, matching: Event[], publishedCount, state: 'records'|'filtered-out'|'no-record',
  //  ledger: {coverage, languages, lastChecked, screen, humanReview: 'Not completed'}, leads: [{url, host}] (safeURL-checked, only when no records)}
export function renderOverview(model, {now})
export function renderBrief(model, {now, hasPolygon, lazy})   // lazy = {coverage, research} load states
```

**`js/ahead.js`, `js/countries.js`, `js/about.js` (WP5)**: §9, plus:

```js
// js/countries.js
export function directoryRows({countries, events, research, loadError}) // [{code, name, region, count, label}] labels: 'N records published' | 'Screen logged · no record' | 'Not yet searched' | 'Coverage unavailable'
export function regionGroups(rows, query)   // [{region, rows}] folded search over name/code/region
export function entriesLabel(n)             // '1 entry' | 'N entries'
export function mountCountries(ctx)         // #countries-root; directory buttons carry data-select-country + data-view-after
// js/about.js
export function researchScope({research, contexts, events, countries}) // {screened, failed, total, countriesWithRecords, cityCount, ended, windowStart, windowEnd} — window from the ledger, never hard-coded
export function discoveryView(discovery)    // {date, count, runUrl (must match ^https://github.com/occult-kranti/protest-atlas/), intervalText from scheduled_interval_hours}
export function mountAbout(ctx)             // #about-discovery, #research-scope (ledger table rendered only on <details> toggle)
```

**`js/sheet.js` (WP1)**

```js
export function initSheets(root = document)        // delegation: [data-open-sheet], [data-close-sheet], [data-scroll-to]; backdrop click (rect test); 'cancel'/'close' → 'sheet:close'
export function openSheet(dialog, {trigger = null, focus = '[data-autofocus], h2', returnFocus = null} = {})
export function closeSheet(dialog, reason = 'programmatic')  // reason: 'button'|'escape'|'backdrop'|'route'|'programmatic'
export function isOpen(dialog)
export function initDetentSheet(el, {detents = ['peek', 'half', 'full'], initial = 'peek', onChange} = {}) // Atlas only; buttons [data-detent]; sets el[data-detent]
```

- `openSheet` calls `showModal()`, adds `html.sheet-open` (scroll lock: `overflow: hidden` + `overscroll-behavior: contain`), focuses the target and dispatches `sheet:open`.
- `closeSheet` restores focus to `returnFocus?.()` if that element is connected, otherwise to the trigger, otherwise to `#main`.

### 4.7 DOM contract: `index.html` ids (pinned by `tests/test_shell.mjs`)

```html
<!doctype html>
<html lang="en" data-color-scheme="auto" data-default-view="latest" data-map-gestures="page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light dark"> <meta name="theme-color" …> <meta name="description" …>
  <title>Protest Atlas — source-led protest reporting</title>
  <link rel="icon" href="data:image/svg+xml,…">                <!-- inline; no new file -->
  <script type="importmap">{ "imports": { "./app.js": "./app.js?v=4.0", … } }</script>   <!-- FIRST script -->
  <link rel="modulepreload" href="./explore.js?v=4.0"> …         <!-- static graph of app.js -->
  <link rel="stylesheet" href="styles.css?v=4.0"> <link rel="stylesheet" href="css/feed.css?v=4.0">
  <link rel="stylesheet" href="css/record.css?v=4.0"> <link rel="stylesheet" href="css/map.css?v=4.0">
  <link rel="stylesheet" href="css/pages.css?v=4.0">
  <script type="module" src="app.js?v=4.0"></script>
</head>
<body>
  <svg hidden id="icon-sprite">…<symbol id="i-…">…</symbol>…</svg>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" id="site-header">  brand · <button id="stamp-chip" data-open-sheet="stamps-sheet">…</button> · <nav id="primary-nav" aria-label="Primary">(5 × <a href="#/<view>" data-nav="<view>">)</nav></header>
  <div id="data-notice" class="notice" role="status"></div>
  <div id="example-banner" class="example-banner" hidden>Illustrative example • not a real event …</div>
  <main id="main" tabindex="-1">
    <section class="view" id="view-latest" data-view="latest" aria-labelledby="latest-title">
      <h1 id="latest-title" tabindex="-1">…</h1>
      <div id="feed-stats"></div> <div id="filter-bar"></div> <div id="active-filters"></div>
      <p id="result-summary" aria-live="polite"></p> <div id="event-list" aria-busy="true"></div> <div id="list-more"></div>
    </section>
    <section class="view" id="view-map" data-view="map" aria-labelledby="map-title">
      <h2 id="map-title" tabindex="-1">…</h2>
      <a class="skip-map" href="#after-map">Skip map</a>
      <div id="map-stage" class="map-stage"><div id="world-map" class="world-map"></div><div id="map-tooltip" hidden></div>
        <div id="map-controls"></div><div id="map-legend"></div></div>
      <div id="after-map" tabindex="-1"></div>
      <section id="country-panel" aria-labelledby="country-panel-title"></section>  <!-- WP4 renders <h3 id="country-panel-title"> + <p class="brief-lead" role="status"> (live region = lead sentence only) -->
    </section>
    <section class="view" id="view-ahead" data-view="ahead" aria-labelledby="ahead-title"><h2 id="ahead-title" tabindex="-1">…</h2><div id="ahead-root"></div></section>
    <section class="view" id="view-countries" data-view="countries" aria-labelledby="countries-title"><h2 id="countries-title" tabindex="-1">…</h2><div id="countries-root"></div></section>
    <section class="view" id="view-about" data-view="about" aria-labelledby="about-title"><h2 id="about-title" tabindex="-1">…</h2>
      <!-- static methodology + reading key (72 h rule, colour = coverage only, black shadow, city dots, unknown ≠ none, no severity score) -->
      <div id="about-stamps"></div> <div id="about-discovery"></div> <div id="research-scope"></div>
      <button type="button" id="about-example" data-set-mode="example">Explore an illustrative example</button>
    </section>
  </main>
  <nav id="tab-bar" class="tab-bar" aria-label="Sections">(same 5 data-nav links; CSS decides visibility)</nav>
  <footer class="site-footer" id="site-footer">… Published data · Source & corrections · Editorial policy · Review desk · country-data attribution …</footer>
  <div id="action-feedback" class="toast" role="status" aria-live="polite"></div>
  <dialog id="record-sheet" class="sheet sheet--record" aria-labelledby="detail-title">
    <header class="sheet-head"><span class="eyebrow">Event record · source-led</span>
      <button id="record-close" class="icon-btn" data-close-sheet aria-label="Close record">…</button></header>
    <div id="record-body" class="sheet-body"></div>
    <footer id="record-actions" class="sheet-foot">
      <button id="record-prev" data-action="record-prev">…</button> <button id="record-share" data-action="share-record">…</button>
      <button id="record-next" data-action="record-next">…</button></footer>
  </dialog>
  <dialog id="filters-sheet" class="sheet" aria-labelledby="filters-title">
    <header class="sheet-head"><h2 id="filters-title">Filters</h2><button class="icon-btn" data-close-sheet aria-label="Close filters">…</button></header>
    <div id="filters-body" class="sheet-body"></div><footer id="filters-foot" class="sheet-foot"></footer></dialog>
  <dialog id="stamps-sheet" class="sheet" aria-labelledby="stamps-title">
    <header class="sheet-head"><h2 id="stamps-title">Update times</h2><button class="icon-btn" data-close-sheet aria-label="Close">…</button></header>
    <div id="stamps-body" class="sheet-body"></div></dialog>
  <noscript>… public/events.json and methodology links …</noscript>
</body>
</html>
```

**Atlas-sheet variant:** the same ids are kept. `#view-latest` may be nested in a non-modal `<section class="atlas-sheet" data-detent="peek">` above `#view-map`, and `#country-panel` may move into it. JS never relies on parent or child structure, only on ids.

**Runtime attributes set by JS on `<html>`:**

| Attribute | Set by | Values |
|---|---|---|
| `data-view` | router | current view |
| `data-mode` | actions | `reported` \| `example` |
| `data-loading` | app | `true` \| `false` |
| class `sheet-open` | sheet.js | present while a sheet is open |

**Icon symbol ids** (WP1 sprite, usable by every package): `i-latest i-map i-ahead i-countries i-about i-filter i-search i-close i-share i-download i-external i-chevron-left i-chevron-right i-chevron-down i-plus i-minus i-world i-clock i-check i-alert i-info i-hand i-expand i-collapse`.

### 4.8 Delegated attributes and events

| Attribute | Element | Handled by | Behaviour |
|---|---|---|---|
| `data-open-record="<id>"` | `<a href="#/record/<id>">` | app.js (one `click` listener on `document`) | Records the trigger. The hash navigation then opens the record through the router. |
| `data-select-country="<CC>"` [+ `data-view-after="latest\|map"`] | button | app.js | `actions.selectCountry` |
| `data-select-city="<CC:Name>"` | button | app.js | `actions.selectCity` |
| `data-set-filter="<key>"` + `data-value` | chip | filters.js (inside `#filter-bar`, `#filters-body`) | Toggle (sets the value, or `''` if already set). `aria-pressed` reflects state. |
| `data-clear-filter="<key>\|all"` | chip or button | app.js | `setFilter(key, '')`, `'all'` for `window`, or `resetFilters()` |
| `data-set-mode="reported\|example"` | button | app.js | `actions.setMode` |
| `data-action="share-view\|share-record\|export-csv\|show-more\|record-prev\|record-next\|retry-data"` | button | app.js | Matching action |
| `data-retry="<lazy name>"` | button | app.js | `loader.reset(name)` + `loadLazy` |
| `data-action="retry-map\|map-zoom-in\|map-zoom-out\|map-reset\|map-explore\|map-focus"` | button | map-view.js (inside `#view-map` only) | Map API |
| `data-open-sheet="<dialog id>"`, `data-close-sheet` | any | sheet.js | open / close |
| `data-scroll-to="<id>"` | `<a>` | sheet.js | `preventDefault`, scroll into view within the nearest scroll container (instant under reduced motion), focus the target (`tabindex=-1`) |
| `data-detent="peek\|half\|full"` | button | sheet.js | Atlas only |
| `data-nav="<view>"` | `<a href="#/<view>">` | router | `aria-current="page"` |

**CustomEvents:**

| Event | Dispatched on | Detail |
|---|---|---|
| `atlas:route` | document | `{route, prev}` |
| `sheet:open`, `sheet:close` | dialog | `{reason}` (`app.js` syncs the route on record close) |
| `mapready` | `#world-map` | `{mappedCountries, featureCount}` |
| `maperror` | `#world-map` | `{message}` |
| `mapzoom` | `#world-map` | `{scale, min, max}` |
| `mapgestures` | `#world-map` | `{mode}` |

### 4.9 CSS contract

- **Cascade layers.** `styles.css` line 1 is `@layer reset, tokens, base, layout, components, views, utilities;`. WP2, WP3 and WP4 write only inside `@layer components {…}`; WP5 only inside `@layer views {…}`; WP1 uses the others. No unlayered rules in public sheets, no `!important`, no id selectors except `#world-map`/`#map-stage` sizing and dialog ids. `review.css` stays unlayered and so still wins on the review page, as today.
- **Breakpoints, mobile first, only these three:** `@media (min-width: 600px)`, `(min-width: 900px)`, `(min-width: 1200px)`. Add `(hover: hover) and (pointer: fine)` for hover affordances and `(prefers-reduced-motion: reduce)`. Container queries are allowed inside components (for example, the card container is `container-type: inline-size`).
- **Class prefixes per owner, to avoid collisions:**

  | Owner | Prefixes |
  |---|---|
  | WP1 primitives (unprefixed) | `btn icon-btn chip badge status band stamp notice toast sheet sheet-head sheet-body sheet-foot tab-bar view site-header site-footer wrap brand brand-mark edition eyebrow muted visually-hidden skip-link skip-map empty-state stack cluster icon noscript example-banner` |
  | WP2 | `filter-* quick-* active-* feed-* result-* stamp-list* notice-*` |
  | WP3 | `card* rec-* facet* side* source-*` plus the legacy outcome classes (`outcome-section episode-scope completion-note confirmed-ended outcome-entry outcome-date outcome-causality assessment-label outcome-unknown small-note`) |
  | WP4 | `map-* city-* legend-* brief-*` |
  | WP5 | `ahead-* announce-* roadmap-* dir-* scope-* ledger-* about-*` |

- **Status and band hooks.** `.status[data-status="ongoing|planned|ended|needs-review|unknown"]` and `.band[data-band="fresh|week|month|older|unknown"]`. Each always shows a text label plus a `::before` symbol, never hue alone.
- **Tokens** (WP1 defines values; names are frozen):
  - **Legacy aliases** (review.css depends on them): `--canvas --surface --ink --muted --line --ochre --ochre-light --green --green-light --error --serif --sans --radius --space`.
  - **Semantic colours:** `--bg --bg-raised --bg-sunken --text --text-muted --border --border-strong --accent --accent-ink --accent-weak --focus-ring --ok --ok-weak --warn --warn-weak --danger --danger-weak`.
  - **Status and band:** `--status-ongoing --status-planned --status-ended --status-review --status-unknown`, `--band-fresh --band-week --band-month --band-older`.
  - **Stance** (text colour only, always paired with words): `--stance-support --stance-oppose --stance-other`.
  - **Map (sole colour source for the map and legend):** `--map-ocean --map-land --map-hatch --map-reported --map-example --map-selected --map-border --map-grid --map-city --map-city-ended --map-shadow --map-focus`.
  - **Type:** `--font-serif --font-sans` (system stacks; no font requests); `--fs-xs: 12px` (**minimum for any text**) `--fs-sm: 14px --fs-md: 16px --fs-lg: 18px --fs-xl: 22px --fs-2xl: 28px --fs-3xl: clamp(30px, 7vw, 48px)`; `--lh-tight --lh-body`.
  - **Space:** `--sp-1…--sp-8` = 4 8 12 16 20 24 32 48 px.
  - **Size:** `--tap: 44px` (minimum for every control), `--header-h`, `--tabbar-h`, `--r-1 --r-2 --r-3 --r-pill`, `--shadow-1 --shadow-2`.
  - **Motion:** `--ease-out --dur-1 --dur-2` (0 ms under reduced motion).
  - **z-index:** `--z-controls 10 --z-sticky 20 --z-header 30 --z-tabbar 30 --z-toast 40` (dialogs use the top layer).
- **Dark mode:** `@media (prefers-color-scheme: dark) { :root[data-color-scheme="auto"] {…} }` plus `:root[data-color-scheme="dark"] {…}`. `review.html` carries neither attribute, so it stays light.
- **Scroll padding:** `html { scroll-padding-top: var(--header-h); scroll-padding-bottom: var(--tabbar-h); }` (WCAG 2.4.11). The tab bar and sheets use `env(safe-area-inset-bottom)`.
- **Palette check:** WP1 runs the dataviz validator on the map tokens (`--map-reported`, `--map-selected`, `--map-example`) and the status tokens, in light and dark (`node …/dataviz/scripts/validate_palette.js "<hexes>" --mode light|dark --surface <--map-land or --bg>`). The output goes in the WP1 hand-off note. The gap fill keeps its hatch texture as secondary encoding.

---

## 5. Map (WP4)

### 5.1 Geometry and assets

- `scripts/prepare_map.py` keeps writing `public/world-countries.geo.json` byte for byte. It also writes `public/world-map-codes.json`:

  ```json
  {"schema_version": 1, "source": "public/world-110m.topo.json (world-atlas 2.0.2) numeric ids mapped through vendor/iso-country-codes.json", "topology_sha256": "…", "codes": {"004": "AF", "250": "FR"}}
  ```

  The keys are the raw `geometry.id` strings. The 3 id-less features have no entry, so their code is null. It also adds `codes_sha256` to `world-map-metadata.json`.
- At runtime, `map.js` fetches only `public/world-110m.topo.json` and `public/world-map-codes.json`, alongside the vendored d3 and topojson-client. Then: `features = attachCodes(topojson.feature(topo, topo.objects.countries).features, codes.codes)`.
- **Projection:** `d3.geoEqualEarth().fitExtent([[8,8],[992,440]], {type:'FeatureCollection', features: features.filter(f => f.properties.code !== 'AQ')})`. Antarctica is still drawn (it is clipped by the viewBox) and stays selectable through the directory. The `viewBox` is `0 0 1000 448`.
- The **sphere outline is removed** (it would be cropped). The ocean is the container background `var(--map-ocean)`. The graticule is optional (CSS can hide `.map-graticule`).
- **Sizing:** the default is `.world-map { aspect-ratio: 1000 / 448 }`. Taller stages (Atlas) keep `preserveAspectRatio="xMidYMid meet"`, `overflow: visible` on the svg, and an ocean-coloured stage background, so the letterbox blends in and zoomed content uses the extra space.

### 5.2 `map.js` exports

```js
export const MAP_WIDTH = 1000, MAP_HEIGHT = 448, MAP_PADDING = 8;
export const ZOOM_MIN = 1, ZOOM_MAX = 12, ZOOM_STEP = 1.6, FOCUS_FILL = 0.7;
export const FIT_EXCLUDE = ['AQ'];
export const REGION_VIEWS = {Africa: [[-19, -36], [53, 38]], Americas: [[-170, -56], [-30, 72]], Asia: [[25, -11], [150, 56]],
  Europe: [[-25, 34], [45, 71]], Oceania: [[110, -48], [180, 0]]};   // [lon, lat] viewing boxes, not data claims
export function groupRecordsByCountry(events = [])                   // unchanged
export function countRecordsByCountry(events = [])                   // unchanged
export function attachCodes(features, codes)                         // → new features, properties {code: codes[f.id] ?? null, name}
export function focusParts(parts, {ratio = 0.5, maxPartWidth = MAP_WIDTH / 2} = {}) // parts: [{area, bounds}] → [[x0,y0],[x1,y1]] | null
export function focusTransform(bounds, {width = MAP_WIDTH, height = MAP_HEIGHT, fill = FOCUS_FILL, min = ZOOM_MIN, max = ZOOM_MAX} = {}) // → {k, x, y} | null
export function zoomButtonState({scale, min, max})                   // → {zoomIn: enabled, zoomOut: enabled, reset: enabled}  (epsilon 1e-3)
export function nextInDirection(items, fromCode, key)                // items [{code, cx, cy}]; key Arrow*/Home/End → code
export async function createWorldMap({container, tooltip, onSelect = () => {}, onSelectCity = () => {}, onHover = () => {},
  gestures = 'page', reducedMotion = () => false})
  // → api: update(partial), reset(), zoomIn(), zoomOut(), hasCountry(code), focusCountry(code) → boolean,
  //        focusRegion(name) → boolean, setGestures('page'|'map'), getZoom() → {scale, min, max}, destroy()
```

`update(partial)` keeps its keys: `{events, countries, selectedCountry, mode, loading, error, contexts, cityGeography}`. `createWorldMap` still resolves (rather than throwing) when assets fail, with `container[data-map-state="unavailable"]` and a `maperror` event. `map-view.js` then renders a `.map-fallback` with `data-action="retry-map"`. The dependency promise already resets on failure.

### 5.3 Gestures: no scroll trap

| Mode | svg `touch-action` | d3.zoom filter | Use |
|---|---|---|---|
| `page` (default; Live desk, map inline in a scrolling page) | `pan-y` | `touchstart`: `event.touches.length >= 2`; `wheel`: only `event.ctrlKey` (trackpad pinch); mouse: primary button, no ctrl; `dblclick`: never | One finger scrolls the page. Two-finger pinch or pan zooms the map. Taps still select. |
| `map` (Atlas full-bleed stage, or Explore toggled on) | `none` | Also allows single-touch | One-finger pan. |

- d3-zoom only starts touch gestures through the filtered `touchstarted`, and `touchmoved` returns early when no gesture is active. With `pan-y` and a 1-finger filter, the browser therefore owns vertical scrolling. (Verified in d3 source; d3-zoom sets no `touch-action` itself.)
- The **Explore toggle**, `data-action="map-explore"`, renders "Explore map" / "Done exploring". It calls `setGestures('map')` and sets `#world-map[data-gestures]`, and reverts on route change, Escape, or when the stage leaves the viewport (IntersectionObserver). `+`, `−` and World buttons are always available (WCAG 2.5.7).
- In `page` mode, a coarse-pointer user who starts a one-finger horizontal drag on the map sees a one-time hint ("Use two fingers or Explore map to move the map") in `#map-tooltip` (*UX decides* the copy).

### 5.4 Focus, zoom, labels and hit areas

- **`focusCountry(code)`:**
  1. Split the feature into polygons. For each, compute `path.area` and `path.bounds`.
  2. Take the largest polygon's bounds.
  3. Union in any other polygon with **area ≥ 50 % of the largest**, a **gap ≤ max(w, h) of the largest**, and a **projected width ≤ 500** (this guards against parts split by the antimeridian).
  4. Pass the result to `focusTransform`.
  5. Animate with `svg.transition().duration(reducedMotion() ? 0 : 450)`.

  Measured results are in §1. `ZOOM_MAX` rises from 8 to 12 so small states (NL, 8×8) become usable.
- **Auto-focus.** `map-view.js` calls `focusCountry` whenever `filters.country` changes and the map is visible. This covers the select, the directory and the brief. It calls `reset()` when the country is cleared.
- **Zoom buttons** are re-enabled or disabled from `mapzoom` through `zoomButtonState`. The initial event is dispatched after ready. At 1×, zoom-out and World are disabled; at 12×, zoom-in is disabled.
- **Scale-aware sizes.**
  - `unitPx = svg.getBoundingClientRect().width / MAP_WIDTH`, refreshed by a ResizeObserver.
  - City labels use `font-size = 12 / (k · unitPx)` user units, so they are always 12 CSS px on screen.
  - City dots: visual radius `3.5 / (k · unitPx)`; an invisible hit circle `.city-hit` of radius `12 / (k · unitPx)` (24 px target, WCAG 2.5.8).
  - Dots, labels and hit circles render **only** for the selected country, or for any country when `k ≥ 3`. Otherwise `g.map-city-points[data-visible="false"]` with `pointer-events: none`.
- **Touch tolerance.** A tap that lands on ocean (or on a non-record path) is checked against `projection.invert` at the tap point plus 8 points at a 10 px radius, using `d3.geoContains`. The first feature found that has records is selected. *Optional, P2.*

### 5.5 Keyboard and accessibility

- `<svg role="group" aria-labelledby="map-title" aria-describedby="map-help">`. The `map-help` text reads: "Arrow keys move between countries with reports in view; Enter selects; the country filter and directory list every territory."
- **Roving tabindex.** Exactly one `path.map-country` has `tabindex="0"`: the selected country, or else the first candidate in reading order. Every other candidate has `-1`; non-candidates have no tabindex. Candidates are the countries with records in view plus the selected country.
- Arrow keys move through `nextInDirection` (by projected centroid). Home and End jump to the ends. Enter and Space select. Escape hides the tooltip. Focus is kept visible by panning (`focusCountry` when a focused path is off-screen).
- City circles are never tab stops. The city filter is their keyboard equivalent.
- The `Skip map` link sits before the stage. `#after-map` is its target.
- Map controls render into `#map-controls` as `<button>`s of at least 44×44 with ids `zoom-in`, `zoom-out`, `reset-map` and `map-explore`, each with `aria-label`. The legend renders into `#map-legend`. Each swatch is `<i class="legend-swatch" data-kind="reported|example|selected|gap|ended|city">`, painted with the same `--map-*` tokens. Example mode changes the legend text; no inline styles are used.
- Hover tooltips only under `(hover: hover)`. On touch, the tap selects, and the brief (panel or peek sheet) is the preview.

### 5.6 Colours come only from CSS

`map.js` stops writing any `fill`/`stroke` presentation attributes and the `COLORS` object is deleted. It sets:
- `container.style.setProperty('--map-gap-fill', 'url(#map-no-records-<n>)')`, plus `--map-shadow-filter: url(#map-shadow-<n>)` for a `<filter><feDropShadow/></filter>` def. An SVG filter is used instead of a CSS `drop-shadow()` on SVG children, which Safari renders inconsistently.
- `container[data-mode]`, `container[data-gestures]` and `svg[data-zoom]`;
- on paths: `data-country`, `data-has-records`, `data-selected`, `data-completion`;
- on circles: `data-city`, `data-ended`.

`css/map.css` then maps state to colour:

```css
@layer components {
  .world-map { background: var(--map-ocean); }
  .map-country { fill: var(--map-gap-fill, var(--map-land)); stroke: var(--map-border); stroke-width: .65; vector-effect: non-scaling-stroke; }
  .map-country[data-has-records="true"] { fill: var(--map-reported); }
  .world-map[data-mode="example"] .map-country[data-has-records="true"] { fill: var(--map-example); }
  .map-country[data-selected="true"] { fill: var(--map-selected); }
  .map-country[data-completion="ended-only"], .map-country[data-completion="mixed"] { filter: var(--map-shadow-filter); }
  .map-no-records-pattern rect { fill: var(--map-land); } .map-no-records-pattern path { stroke: var(--map-hatch); }
  .map-shadow-def feDropShadow { flood-color: var(--map-shadow); }
  .map-borders { stroke: var(--map-border); fill: none; } .map-graticule { stroke: var(--map-grid); fill: none; }
  .city-point { fill: var(--map-city); } .city-point[data-ended="true"] { stroke: var(--map-shadow); }
  .map-country:focus-visible { stroke: var(--map-focus); stroke-width: 3; outline: none; }
}
```

**Colour stays binary publication coverage** (reported / none in view, plus selected and example). It never encodes count, intensity or popularity. The black shadow marks only a sourced ended or suspended episode.

---

## 6. Data loading and payload budget

### 6.1 Load plan

| Phase | Files | Trigger | Failure state |
|---|---|---|---|
| Critical (parallel, `Promise.allSettled`, `cache:'no-cache'`) | `events`*, `countries`*, `event-context`, `upcoming`, `build-info` | Boot | `*`required: notice + list error + Retry (`data-action="retry-data"`), filters preserved. `contexts` failure: cards without cities/outcomes, city/outcome filters disabled with a note. `upcoming` **absent (404)** reads "Announcements list not published in this snapshot"; `upcoming` **error** reads "Announcements list could not load · Retry". `build` absent is normal locally: the "Site built" row reads "Not available in this preview". |
| Lazy: `cities` | `public/cities.json` | First `ensure()` of the map | Map draws without city dots; legend notes it |
| Lazy: map code | `map.js` (dynamic import) → d3, topojson-client (script tags), topo + codes | `#world-map` intersects the viewport (IntersectionObserver, rootMargin 200px) **or** route becomes `map` | `.map-fallback` with Retry; list/directory unaffected |
| Lazy: `coverage`, `research` | ledger files | Country brief rendered (country selected), `#/countries`, `#/about` | Brief ledger rows read "Ledger unavailable · Retry" (`data-retry`) |
| Lazy: `discovery` | `discovery-status.json` | `#/about` | "Discovery audit unavailable" |
| Lazy: `roadmap` | `roadmap.json` | `#/ahead` | "Roadmap unavailable · Retry" |
| Lazy: `examples` | `examples.json` | `setMode('example')` | Current example error/retry state |

`timeSnapshot`, the list and the stamps need only the critical set. No component may block first render on a lazy file.

### 6.2 Budgets (gzip -9 bytes; enforced in CI by `tests/test_shell.mjs`)

| Bucket | Contents | Budget | Today's equivalent |
|---|---|---|---|
| HTML | `index.html` | ≤ 12 KB | 4.6 KB (no sprite or sheets yet) |
| CSS | `styles.css` + `css/*.css` | ≤ 16 KB | 9.4 KB |
| Critical JS | Static import graph of `app.js` (walked by regex over `import … from '…'`) | ≤ 40 KB | 20.1 KB eager, *including* map.js |
| Critical data | events + countries + contexts + upcoming + build-info | Report only; assert `events.json` ≤ 120 KB gz with the message "split an events index" | ≈ 62 KB |
| **Critical total (feed-first)** | Sum of the above | **≤ 140 KB** | ≈ 450 KB gzip / 1.81 MB raw today (everything eager) |
| Map add-on | d3 92.4 + topojson 2.6 + topo 38.5 + codes ≈ 1 + cities 3.2 + map JS (map.js, map-view, brief) ≤ 10 + map.css | ≤ 155 KB | — (GeoJSON 149.6 KB removed) |
| **Map-first critical** | Critical + map add-on | **≤ 295 KB** | — |
| Never at runtime | `world-countries.geo.json` | 0 | 149.6 KB |

**Runtime metrics** (asserted by `smoke.cjs`, local, 390×844 DSF 2, unthrottled):
- No request for `world-countries.geo.json`.
- DOM ≤ 1,500 nodes after the first `#/latest` render (today 6,972).
- First card top ≤ 1.5 × viewport height in Live desk (today 5,812 px, about 6.9 screens). For Atlas sheet, the peek sheet shows result count and first card title above the fold.
- `#/map` svg present ≤ 1,000 ms after navigation.
- 0 console, page or request errors (allowlist: `build-info.json` 404 when serving the repo root).

**Measuring in production:** after deploy, `curl -sI` on `index.html`, `public/events.json` and `vendor/d3.v7.9.0.min.js` records `content-encoding`, `cache-control` and `etag` in RELEASE_EVIDENCE. Budgets assume gzip, which Pages applies to text types.

---

## 7. Updated-time display

### 7.1 Sources (from `freshness.updateStamps({events, upcoming, build})`; the stamps are never merged)

| Row key | Label (fixed) | Explanation shown | Precision |
|---|---|---|---|
| `dataUpdated` | Data integrated | AI-assisted integration of the published dataset. Not a human editorial sign-off. | Timestamp, UTC hh:mm |
| `latestObservation` | Newest source observation | The most recent day a source observed activity in any record. | Day only (never shows a time) |
| `latestSourceCheck` | Newest source check | Most recent AI-assisted re-read of a source. It does not make an old event current. | Timestamp |
| `announcementsUpdated` | Announcements list | When the announced-actions list was compiled. | Timestamp, or "Not published in this snapshot" |
| `siteBuilt` (+ `commit`) | Site built | Deployment time only. It never refreshes any record. | Timestamp + short SHA linked to `REPO_URL/commit/<sha>` (only if `^[0-9a-f]{40}$`) |

`editorialReview` is shown as an extra row only when it differs from `dataUpdated`.

### 7.2 Where it shows (WP2 `js/stamps.js`)

- **`#stamp-chip`** (header, every view): `Data <time datetime="…">2 Oct, 21:31 UTC</time> · 2 h ago`. It always contains a UTC hh:mm (smoke check: `/\d{2}:\d{2} UTC/`) and opens `#stamps-sheet` (`data-open-sheet`). Long-press and hover tooltips are not used. When `editorialStale(...)`, the chip gets `data-stale="true"` and the text "Data 5 days old".
- **`#stamps-body`** and **`#about-stamps`**: all rows from `stampItems(stamps, now)` → `[{key, label, note, value, present}]`, each rendered with `timeTag(value, now, 'both')`.
- **Cards and record** (WP3): "Observed `timeTag(last_observed_at, now, 'both')`" (day precision gives "2 Oct 2026 · today"); "Source check `timeTag(last_verified, …)`".
- **Ahead** (WP5): announcement countdowns use `countdownLabel(item, now)`; roadmap uses "Reviewed `timeTag(last_reviewed, now, 'relative')`".
- **`#data-notice`** (WP2 notice.js): always `PILOT_DISCLOSURE`. When stale: "Data last integrated N days ago; status labels may be out of date." This is the replacement for today's text swap; the disclosure is never dropped.

### 7.3 Refresh (app.js)

```js
function tick() {
  const now = Date.now();
  refreshTimes(document, now);                 // patch every time[data-rel] text in place (no DOM replacement, no focus loss)
  const next = timeSnapshot({...store.get(), now});
  if (next !== lastSnapshot) {                 // a status, observation band (72 h / 7 d / 30 d), announcement state, day count or stale flag changed
    lastSnapshot = next;
    store.set({now}, {reason: 'tick'});        // full re-render with focus restore; list windows and counts update
    if (store.get().route.record) patchRecordStatus(recordBody, currentRecord(), now); // open sheet keeps scroll; status badge + #temporal-update note
  }
}
setInterval(tick, 60_000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
addEventListener('pageshow', e => { if (e.persisted) tick(); });   // bfcache restore
```

This fixes today's stale-tab bug, where the notice and 7/30-day window results never updated because only display-status changes triggered a re-render. The observation band boundaries (72 h, 7 d, 30 d) coincide exactly with the window filter boundaries, so including bands in the snapshot keeps the windows current.

---

## 8. `public/roadmap.json`: the public product roadmap

### 8.1 Schema (exact keys; `obj()`-style rejection of unknown or missing keys)

```json
{
  "schema_version": 1,
  "updated_at": "2026-10-02T23:30:00Z",
  "note": "Site features we are building or considering. Planned items are intentions, not promises or delivery dates. Shipped items cite tests that run on every build.",
  "items": [
    {
      "id": "mobile-first-redesign",
      "title": "Mobile-first redesign",
      "summary": "Feed, map, announced actions and countries as separate views with readable cards and a full-height record sheet.",
      "area": "interface",
      "status": "shipped",
      "last_reviewed": "2026-10-02",
      "shipped_in": "4.0",
      "shipped_on": "2026-10-02",
      "evidence": [
        {"kind": "test", "ref": "tests/test_shell.mjs::shell exposes every view mount point", "label": "Shell contract test"},
        {"kind": "file", "ref": "index.html", "label": "Shell"}
      ],
      "blocked_by": null,
      "depends_on": [],
      "acceptance": "A phone reader reaches the first record within 1.5 screens; all controls are at least 44 px."
    }
  ]
}
```

| Field | Type and rule |
|---|---|
| `id` | slug `^[a-z0-9][a-z0-9-]{0,95}$`, unique |
| `title` | text ≤ 80 |
| `summary` | text ≤ 400 |
| `area` | `interface \| map \| data \| editorial \| accessibility \| infrastructure` |
| `status` | `shipped \| in-progress \| next \| later \| blocked` |
| `last_reviewed` | ISO day ≤ today (UTC) and ≤ `updated_at` day |
| `shipped_in` | `^\d+\.\d+(\.\d+)?$` when shipped, else `null` |
| `shipped_on` | ISO day ≤ `last_reviewed` when shipped, else `null` |
| `evidence` | array of `{kind, ref, label}`; `kind ∈ test \| file \| doc \| commit \| url`; `label` text ≤ 120 |
| `blocked_by` | text ≤ 300 when `status = blocked`, else `null` |
| `depends_on` | array of existing ids, no self, no duplicates, no cycles |
| `acceptance` | text ≤ 400: the observable criterion for "shipped" |

### 8.2 Evidence resolution (against the **repository** root, `evidence_root=ROOT`, never the temporary build root)

| Kind | `ref` format | Resolves when |
|---|---|---|
| `test` | `tests/<name>.py::<TestClass.test_method or test_method>` or `tests/<name>.mjs::<test title substring>` | The file is a top-level `tests/test_*.py` or `tests/*.mjs` (the CI globs; `tests/browser/` is **not** accepted), and the part after `::` occurs verbatim in the file text |
| `file` | Relative POSIX path | `normpath` stays inside the root, has no `..`, is not absolute, is not under `_site/`, `.git/` or `research/`, and is a regular, non-symlinked file |
| `doc` | `docs/*.md` path | Same as `file`, inside `docs/` |
| `commit` | `^[0-9a-f]{7,40}$` | Format only (CI checkouts are shallow) |
| `url` | `https://github.com/occult-kranti/protest-atlas/…` | `https_url()` and the repo prefix |

### 8.3 Rules enforced by `scripts/validate_roadmap.py` (stdlib; reuses `validate_data` helpers)

1. Envelope keys are exactly `schema_version`, `updated_at`, `note`, `items`. `schema_version` is int 1. `updated_at` is a timestamp ≤ now. `note` matches `/not (?:a )?(?:promise|commitment|guarantee)|intentions, not/i`. `items` is non-empty.
2. Item keys are exactly the 12 listed, with the types and lengths above.
3. **`status == "shipped"` ⇒** `shipped_in` and `shipped_on` are set, `blocked_by` is null, and **at least one `test` evidence resolves**. A shipped claim without a CI-run test fails the build.
4. `status != "shipped"` ⇒ `shipped_in` and `shipped_on` are null. Evidence is optional, but any evidence present must resolve.
5. `status == "blocked"` ⇔ `blocked_by` is non-empty.
6. There are no future dates anywhere. There is **no build-time staleness failure**: an old `last_reviewed` must not become a time bomb. Staleness is shown in the UI instead (§9.2).
7. Ids are unique, `depends_on` references resolve, and there are no cycles (DFS).

```python
STATUSES = ('shipped', 'in-progress', 'next', 'later', 'blocked')
AREAS = ('interface', 'map', 'data', 'editorial', 'accessibility', 'infrastructure')
EVIDENCE_KINDS = ('test', 'file', 'doc', 'commit', 'url')
ITEM_FIELDS = ('id', 'title', 'summary', 'area', 'status', 'last_reviewed', 'shipped_in', 'shipped_on',
               'evidence', 'blocked_by', 'depends_on', 'acceptance')
def validate_roadmap(data, now=None, evidence_root=ROOT) -> dict
def validate_roadmap_repository(root=ROOT, now=None, evidence_root=ROOT) -> dict   # required file; raises if absent
# build.py: validate_roadmap_repository(root)  — evidence_root stays the scripts' repository, so test_build's temp root works
```

### 8.4 `tests/test_roadmap.py` (WP5)

The tests use a temporary `evidence_root` containing `tests/test_x.py` (with `def test_feature`), `tests/y.mjs` (with `test('shell works'`), and `index.html`. Cases:

- the valid manifest passes;
- shipped with no evidence fails;
- shipped with only `file` evidence fails ("needs test");
- a test ref whose name is absent fails;
- a test ref under `tests/browser/` fails;
- a missing file, `../secret`, `/etc/passwd` and a symlink all fail;
- non-shipped with `shipped_on` fails;
- blocked without `blocked_by`, and `blocked_by` on a next item, both fail;
- future `last_reviewed` fails, and `shipped_on` after `last_reviewed` fails;
- unknown field, duplicate id, unknown dependency and a dependency cycle all fail;
- a note without the disclaimer fails;
- a URL evidence outside the repo fails;
- **the real `public/roadmap.json` validates against the real repository with the real clock.**

### 8.5 Initial content (WP5 writes it; the lead reviews it sceptically)

- **Shipped (4.0)**, each citing a real test added in this round:
  - mobile-first redesign;
  - separate update-time stamps (`tests/test_freshness.mjs::update stamps stay separate`);
  - announced-actions page with a truthful empty state (`tests/test_pages.mjs::…`, `tests/test_upcoming.py::…`);
  - map land fit and no scroll trap (`tests/test_map.mjs::…`);
  - public roadmap with evidence gate (`tests/test_roadmap.py::…`);
  - historical layer, release 3 (`tests/test_history.py::…`).
- **Next:**
  - structured state-response types (announced vs observed, acting body; MMP vocabulary). Needs schema, merge and validator changes;
  - issue-taxonomy normalisation (Labor/Labour…), which needs a data migration and a permalink alias map;
  - counter-demonstration links.
- **Blocked:**
  - human editorial review track (`blocked_by`: "No human editor enrolled");
  - recent-activity sweeps (`blocked_by`: "Research environment cannot currently read news sites; no unread page is cited");
  - local-language coverage (staffing).
- **Later:** lighter map bundle (D3 submodules, about −50 KB gzip); typo-tolerant search (MiniSearch when > 500 records); external link-rot check (weekly, non-blocking); per-record static share pages.

There are no target dates. Items under "Explicitly deferred" in `docs/ROADMAP.md` (risk scores, notifications, accounts) are **not** listed as roadmap items.

---

## 9. "Ahead" view (WP5): two kinds of "next", visibly separate

### 9.1 Announced protest actions (`upcoming.json`, critical)

```js
export function groupAnnouncements(items, now)
  // → {today, upcoming (planned_start asc, country, id), postponed, cancelled, passed, unknown} using freshness.announcementState
export function announcementView(item, now)
  // → {state, stateLabel: ANNOUNCEMENT_LABELS[state], countdown: countdownLabel(item, now), dateText (precision-aware: 'Week of 12 Oct 2026', 'October 2026', '12–14 Oct 2026'), cities, announcedBy, sources: [{href: safeURL, publisher, published}], recordHref: item.event_id ? '#/record/'+id : null}
```

- The section `#ahead-actions` always starts with `upcoming.note` (it states that announcement ≠ occurrence).
- **Empty state** (`items: []`, the expected state this round): "No announced actions are recorded in this snapshot (list compiled `<time>`). This round's research could not reach news sites, so announcements may exist that we have not checked. An empty list is not evidence that nothing is planned."
- **Absent and error states** are distinct (§6.1).
- Passed dates go in a collapsed group labelled "Planned date passed · occurrence not recorded here". These items are never shown as upcoming.
- No clock times, assembly points or routes (the validator already rejects them). Cities and day precision only.
- Keyword-mining "further action" phrases out of record timelines is **rejected**: it would misfile items such as `mx-judges` (a past, conflicting date).

### 9.2 Site roadmap (`roadmap.json`, lazy)

```js
export function roadmapGroups(roadmap)            // [{status, label, items}] order: in-progress, next, blocked, later, shipped
export function evidenceHref(evidence, repo = REPO_URL)
  // test/file/doc → `${repo}/blob/main/<path>`; commit → `${repo}/commit/<sha>`; url → safeURL(url); else null
export function reviewOverdue(lastReviewed, now, days = 90)   // UI badge "Review overdue"; never fails the build
export function mountAhead(ctx)                   // #ahead-root → #ahead-actions, #ahead-roadmap; param 'roadmap'|'actions' scrolls+focuses
```

- Each item shows: title, a status badge (text + symbol), area, summary, "Reviewed `<relative>`", acceptance criterion, `blocked_by`, dependency titles and evidence links.
- Shipped items show "Shipped in 4.0 · 2 Oct 2026" and their evidence.
- The heading must make clear these are **site features, not protest events**: "What we're building next".

---

## 10. Testing and CI

### 10.1 Node (pure modules; CI runs `node --test tests/*.mjs`, all offline)

| File | Owner | Asserts |
|---|---|---|
| `test_explorer.mjs` | — | **Unchanged** (regression contract) |
| `test_freshness.mjs` | — | **Unchanged** |
| `test_core.mjs` | WP2 | Below |
| `test_record.mjs` | WP3 | Below |
| `test_map.mjs` | WP4 | Below |
| `test_pages.mjs` | WP5 | Below |
| `test_shell.mjs` | WP1 | Below |

**`test_core.mjs` (WP2):**
- `parseRoute`/`formatRoute`: every view, `ahead/roadmap`, a record id (valid and `<svg>`), legacy aliases, unknown `#/x`, and `#main`/`#detail-source-2` giving `null`.
- `droppedParams('?status=live&year=1999&window=999')`.
- Year regex round-trip.
- `eventMatches`: diacritics ("sao paulo" matches "São Paulo"); AND tokens; `ignoreCountry` also ignores city.
- `sortByObservation` stable.
- `activeFilterCount`.
- `availableYears` from real data equals `['2026','2025','2024']`.
- `timeSnapshot` changes exactly at 72 h, 7 d and 30 d, and at UTC midnight for announcements.
- `editorialStale` boundary.
- Store set/subscribe immutability.
- `exportAllowed` false in example mode, while loading and on error.
- `shareURL` (view and record forms, default view omitted).
- `loadCritical` with an injected `fetchImpl`: 404 upcoming gives `'absent'`, a 500 gives `'error'`, and an events shape failure means critical `'error'`.
- `stampItems`: five distinct labels, a missing build reads "Not available".
- `noticeModel` always contains `PILOT_DISCLOSURE`.

**`test_record.mjs` (WP3):**
- `positionSentence` for all 4 stances, plus missing target.
- `sidesLedger` has no numeric fields; `kr-yoon-removal` (both oppose, opposite targets) renders two sentences naming both targets.
- `stateActionSummary` with no entries gives "Not established in this record".
- `intensityFacets` normalise Unknown/unknown to "Not established" and never output `0` or "none".
- Turnout qualifier preserved.
- `evidenceLine`: single-source with 3 sources still reads "Single reporting chain"; contested stays visible.
- `timeframe`: unknown onset gives "Onset not established".
- `renderCard` escapes `<script>` in title and summary, and includes the publisher, observed date, source published date, `rel="noopener noreferrer"`, an AI-assisted marker and `data-open-record`; example mode includes the watermark.
- `renderRecord` includes `detail-title`, every `RECORD_SECTIONS` id, `#detail-source-1` and the outcome strings.
- **Every real event plus its context renders without throwing.**

**`test_map.mjs` (WP4):**
- `attachCodes`.
- `focusParts` on synthetic FR-like (mainland + distant small part), US-like (Alaska at 21 %), ID-like (three ≥ 50 % parts) and FJ-like (antimeridian-wide part) inputs.
- `focusTransform` clamps to [1, 12].
- `zoomButtonState` at min, mid and max.
- `nextInDirection` ordering and Home/End.
- `MAP_HEIGHT === 448`.
- `REGION_VIEWS` keys are a subset of `countries.json` regions.
- `groupRecordsByCountry` drops invalid codes.

**`test_pages.mjs` (WP5):**
- `groupAnnouncements` at today, passed, postponed, cancelled and range-spanning-today.
- `announcementView` date text per precision.
- `roadmapGroups` order.
- `evidenceHref` mappings and rejection of `javascript:`.
- `reviewOverdue` at 89/90/91 days.
- `directoryRows` labels; `entriesLabel(1) === '1 entry'`.
- `researchScope` window taken from the ledger.
- `discoveryView` rejects a foreign run URL and uses `scheduled_interval_hours`.

**`test_shell.mjs` (WP1):**
- `index.html` contains every id in §4.7.
- The import map is the first `<script>`. Every root module and every `js/*.js` file has exactly one entry, `"./x.js": "./x.js?v=<V>"`, with a single `V` shared by all CSS links and the entry script.
- No JS source contains `?v=` in an import specifier.
- The modulepreload set equals the static import graph of `app.js`.
- `map.js`, `js/map-view.js` and `js/country-brief.js` are **not** in the static graph.
- Every `js/*.js` and root module `import()`s cleanly in Node.
- Code budgets from §6.2.
- Every CSS file under `css/` contains only `@layer components|views` blocks (regex: first statement), and no file contains `!important`.

### 10.2 Python (CI runs `python -m unittest discover -s tests`, offline)

| File | Owner | Asserts |
|---|---|---|
| `test_roadmap.py` | WP5 | §8.4 |
| `test_map_assets.py` | WP4 | Decoding the topology with the prepare_map logic plus `world-map-codes.json` reproduces every GeoJSON feature's `code` in order; every code is in `countries.json`; `world-map-metadata.json` hashes match the files; `prepare()` re-run in a temp copy is byte-identical (deterministic) |
| `test_site.py` | WP5 | Builds into a temp root (like `test_build`). Parses every output `.html` with `html.parser`; collects local `href`/`src`, import-map targets, `modulepreload`; collects JS import specifiers and the `public/*.json` string constants in `js/data.js` and `map.js`; asserts every one resolves to an output file (query string stripped). Also: `404.html` has no relative asset refs and has `noindex`; `review.html` refs resolve; `world-countries.geo.json` is not in the output. **This is the offline internal link checker.** |
| `test_upcoming.py` (+1 case) | WP5 | An empty `items` manifest with a valid note validates |
| `test_pipeline.py` | — | No edit: the exact output set follows `PUBLIC_COPIES`. It still proves that no non-public file leaks and that `events.json` is byte-preserved |

### 10.3 CI (`.github/workflows/pages.yml`, WP5)

- **Unchanged commands:** `python -m unittest discover -s tests -v`, then `node --test tests/*.mjs`, then `python scripts/build.py`. New tests are picked up by the existing globs.
- **Concurrency:** make the workflow-level `cancel-in-progress` equal `${{ github.event_name == 'pull_request' }}`, and give the deploy job `concurrency: {group: pages-deploy, cancel-in-progress: false}`, so a newer push never cancels a deploy that is already running.
- **Pins (Node 20 removed from runners on 2026-09-23):**
  - `actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0`
  - `actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1`

  These SHAs come from the OSS research (`git ls-remote`, 2 Oct). Re-verify them if the network allows; otherwise keep the current pins, which still work with warnings.
- **Post-deploy probe:** a `verify` job (main only; needs `deploy`) retries `curl -fsS "$PAGE_URL/public/build-info.json"` for up to 10 minutes until `.commit == github.sha`, then records `curl -sI` headers for `index.html` and `events.json`. This is deployment evidence. It is not a PR gate and does not affect offline test safety.
- **Not in CI this round:** Playwright (no global module on runners; installing it needs the network and about 150 MB), Lighthouse CI, pa11y, axe and lychee. All of them need network installs or external fetches.

### 10.4 Local browser smoke: `tests/browser/smoke.cjs` (WP1)

- It lives outside the `tests/*.mjs` and `test_*.py` globs, so CI never runs it.
- It is CommonJS, because `NODE_PATH` does not apply to ESM.
- Run it with: `NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs [--root _site] [--prefix /protest-atlas/] [--direction live|atlas] [--shots <dir>]`.
- It starts its own Node static server (correct MIME types including `text/javascript` and `application/json`). With `--root _site --prefix /protest-atlas/` it emulates the Pages base path.
- It uses `chromium.launch()`, falling back to `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, and runs an init script that sets `scrollBehavior='auto'`.
- It exits non-zero on any failure and prints a JSON summary.

**Checks** (viewports 360×780, 390×844 [isMobile, hasTouch, DSF 2], 768×1024, 1440×900, unless a check says otherwise):

1. 0 console, page or request errors (allowlist: `public/build-info.json` 404 when `--root` is the repo); no horizontal overflow.
2. `#data-notice` contains "AI-assisted reporting pilot"; `#stamp-chip time[datetime]` text matches `\d{2}:\d{2} UTC`.
3. All five routes show their `#<view>-title`, and the matching `[data-nav]` has `aria-current="page"`. Legacy `#methodology` lands on About.
4. Record sheet (the regression for the confirmed dialog bug):
   1. open the first card, then Close: closed;
   2. change `#window-filter`, open again, Close: **closed**;
   3. Escape closes, and focus returns to the trigger;
   4. after opening, `page.goBack()` closes the sheet and the URL hash goes back to the previous view;
   5. clicking a `.source-ref` keeps `#/record/…` in the URL.
5. `?country=FR&window=30` restores the controls. `?status=live&year=1999` shows the dropped-params notice. The URL query survives view changes.
6. Map (`#/map`):
   - 177 `.map-country` paths;
   - svg box aspect within ±2 % of 1000/448;
   - computed `touch-action` is `pan-y` (page mode);
   - `#zoom-out` disabled at 1×, and Zoom in enables it;
   - selecting FR gives `data-zoom` ≥ 4 and the FR path's bounding box inside the svg box;
   - at most 1 `[tabindex="0"]` in `.map-countries`; ArrowRight moves focus;
   - **no request** for `world-countries.geo.json`;
   - `page.mouse.wheel` over the map scrolls the page.
7. At 390: every visible control (excluding inline text links inside paragraphs and map shapes) is ≥ 44×44 in the first two screens; no visible text is < 12 px; DOM ≤ 1,500 nodes; first card top ≤ 1.5 viewports (Live desk).
8. `#/ahead`: with 0 upcoming items the empty-state copy is present; roadmap groups render; every shipped item has ≥ 1 evidence link.
9. Example mode: watermark on cards and detail; `[data-action="export-csv"]` is disabled **and** calling the action yields the feedback "excluded".
10. `review.html` at 390 and 1440: no errors, no overflow, header visible, `#candidate-file` enabled after load.
11. `emulateMedia({colorScheme:'dark'})`: `body` background differs from light. `reducedMotion:'reduce'`: no `::view-transition` pseudo-elements and smooth scrolling is off.
12. Screenshots of each view at 390 and 1440 into `--shots` for the design review.

---

## 11. Cache busting, 404 and deploy

### 11.1 Version map (WP1)

```html
<script type="importmap">{"imports": {
  "./app.js": "./app.js?v=4.0", "./explore.js": "./explore.js?v=4.0", "./map.js": "./map.js?v=4.0",
  "./history.js": "./history.js?v=4.0", "./freshness.js": "./freshness.js?v=4.0",
  "./js/html.js": "./js/html.js?v=4.0", "./js/model.js": "./js/model.js?v=4.0", "…every js/*.js…": "…?v=4.0"
}}</script>
```

URL-like import-map keys are resolved against the document base and match the **resolved** specifier. So `'./model.js'` (from `js/`), `'../map.js'` and `'./js/model.js'` all map to one versioned URL, and there is one module instance. Node ignores import maps, so tests import plain paths. Browsers without import-map support (pre-2023) still work, just without the cache-busting.

To bump the version: change `4.0` in the import map, the 5 stylesheet links, the entry script and the modulepreload hrefs. `test_shell.mjs` fails if any of them disagree. Data JSON is never versioned; it uses `cache:'no-cache'` and ETag revalidation, which keeps the stamps truthful despite Pages' reported `max-age=600`.

### 11.2 `404.html`

See §2.5. It goes in `PUBLIC_FILES`, and `test_site.py` checks that it is self-contained.

### 11.3 Deploy path

Changes reach Pages only through `main` (`pages.yml`). The lead merges after integration. The `verify` job and a manual check of the live URL go into RELEASE_EVIDENCE.

---

## 12. Open-source adoption

| Candidate | Decision | Reason |
|---|---|---|
| D3 7.9.0 + topojson-client 3.1.0 (vendored, ISC) | **Keep** | Already pinned and licensed. Use `topojson.feature` for countries (removes the 150 KB gzip GeoJSON fetch). |
| D3 submodules (d3-geo/zoom/selection + deps, 42.7 KB gzip vs 92.4) | **Defer** (roadmap "Later") | 11 extra vendored UMD files with licences and dependency-order risk this round. The map is lazy on the feed-first path anyway. |
| MiniSearch 7.2 (MIT, 18.6 KB gzip) | **Reject now** | 84 records. Folded substring AND-search costs 0 KB. Revisit at > 500 records or when typo tolerance is required. |
| Fuse.js, Pagefind | **Reject** | Fuzzy scoring surprises on short queries. Pagefind needs per-record pages and a build step. |
| Open Props (MIT) | **Reject import; borrow naming** | Semantic tokens already exist. The full set adds 7.7 KB gzip of unused properties. Only the scale naming style is borrowed. |
| Observable Plot (ISC) | **Reject** | No chart in scope (no stance bars, no severity). 69 KB gzip plus the full d3 global. |
| MapLibre GL + PMTiles | **Reject** | About 312 KB gzip, WebGL failure mode, no Equal Earth, and the OSM basemap brings ODbL and boundary-policy issues. |
| Native `<dialog>` | **Adopt** | Record, filters and stamps sheets. Keep the JS backdrop close (`closedby` is not Baseline). |
| Popover API | **Adopt only if needed** | For small non-modal disclosures (e.g. legend help), with a fallback. Not required by any contract. |
| View Transitions (same-document) | **Progressive enhancement** | Route changes only, feature-detected, off under reduced motion. |
| Import maps; CSS cascade layers; container queries; `Intl.RelativeTimeFormat` | **Adopt** | Baseline widely available. They fix cache busting, cascade debt, card responsiveness and relative time without libraries. |
| pure-web-bottom-sheet | **Reject** | Shadow DOM and scroll-driven animations (not Baseline). A native dialog plus buttons covers it. |
| Playwright (preinstalled globally) | **Adopt for local smoke only** | Not a dependency and not in CI. |
| axe-core / pa11y-ci / Lighthouse CI | **Defer** | Need network installs. Revisit with `@axe-core/playwright` when CI may install. |
| lychee | **Defer external checks** | Internal links are covered offline by `test_site.py`. A weekly non-blocking external source check is a "Later" roadmap item. |
| actions/deploy-pages v5.0.1, configure-pages v6.0.0 | **Adopt** (pinned SHAs) | Node 24 runtime. |
| Mass Mobilization state-response vocabulary (CC0) | **Later** (data change) | Needs schema, merge and validator work. Not a front-end heuristic. |

No new third-party code is vendored this round, so there are no new licence files. REUSE docs change only to note that the GeoJSON is no longer shipped.

---

## 13. Risks and mitigations

1. **Contract drift between parallel builders.** Mitigation: the Phase 0 scaffold, this frozen vocabulary, `test_shell.mjs` pinning the ids, import map and Node-importability, and a rule that only the lead edits the allowlist.
2. **The build fails while packages are incomplete,** because every `PUBLIC_FILES` entry must exist. Mitigation: Phase 0 stubs exist from the start, and the stubs keep the suites green.
3. **`test_explorer.mjs` breaks** because a module in `app.js`'s graph touches the DOM at import. Mitigation: rule 4.1.1 plus `test_shell.mjs` importing every module. The map stays lazy.
4. **Hash routing collides with anchors.** `#main`, `#after-map` and `#detail-source-N` are non-routes and are ignored. Source refs use `data-scroll-to`. The record sheet uses push/back semantics with a re-entrancy guard (`reason:'route'`).
5. **iOS Safari `replaceState` rate limit** during typing. Mitigation: 250 ms debounce; only in reported mode after load.
6. **review.html regresses from the `styles.css` rewrite.** Mitigation: legacy token aliases and base classes kept, dark mode opt-in only, smoke check 10.
7. **Silent behaviour changes:**
   - The map now ignores a city selection, like a country, keeping world context.
   - The year allowlist becomes a regex, so invalid years are dropped with a notice.
   - `world-countries.geo.json` is unpublished.

   Mitigation: record all three in CHANGELOG and UX_SPEC.
8. **Map-first layouts reintroduce a scroll trap.** Mitigation: `data-map-gestures="map"` is allowed only when the map stage is not inside a scrolling page (Atlas: the sheet is the scroller). Smoke check 6 covers `page` mode, and Atlas runs with `--direction atlas`.
9. **Overclaiming in the roadmap or announcements.** Mitigation: validator rule 3 (shipped needs a CI test), the note disclaimer regexes, upcoming states never turning into occurrences, and no keyword mining.
10. **Time-dependent UI goes stale or flips mid-session.** Mitigation: one `now` per render, `timeSnapshot` including bands, stale flag and announcement days; `patchRecordStatus` for the open sheet.
11. **Data growth breaks budgets.** The code budgets are strict; the data budget is a report plus a 120 KB gzip ceiling on events, with a remedy message (events index split). This is not a time bomb tied to the date.
12. **Example records exported through a new entry point.** Mitigation: the guard lives in `actions.exportCSV()` and is unit-tested (`exportAllowed`).
13. **Colour accessibility in dark mode and on the map.** Mitigation: validator runs (§4.9), hatch texture plus text labels as secondary encoding, and status always shown as text plus symbol.
14. **Action pin SHAs come from research, not re-verified here** (egress-limited). Mitigation: re-verify before changing them; the fallback is to keep the current pins.
15. **Concurrent data agents** (`merge_history.py`, `research/round4`). Mitigation: WP1–5 never touch data generators or validators other than the new roadmap validator. `upcoming.json` absent and empty are both first-class UI states.
16. **Safari SVG filter and pattern variables.** Mitigation: the pattern and shadow are SVG defs referenced through custom properties set by JS. Verify in the smoke screenshots. A stroke-based ended marker is the fallback.

---

## 14. Integration order and acceptance

1. **Phase 0** (lead): scaffold (§3.1), suites green, commit "Scaffold 4.0 module layout".
2. **Phase 1** (parallel): WP1–WP5. Each package hands off with: its files only; its own tests green; `node --test tests/*.mjs` and `python -m unittest` green; a note listing any contract question for the lead.
3. **Phase 2** (lead, integration):
   1. `python scripts/build.py`;
   2. `smoke.cjs --root _site --prefix /protest-atlas/`;
   3. fix contract mismatches in the owning file;
   4. bump nothing but the import-map version if needed.
4. **Phase 3** (lead): docs (ARCHITECTURE, UX_SPEC, MAP_IMPLEMENTATION, ROADMAP ↔ `roadmap.json` alignment, DEPLOYMENT pins, REUSE, CHANGELOG, RELEASE_EVIDENCE); merge to `main`; watch the `verify` job; check the live URL on a phone viewport.

**Per-package exit criteria (beyond tests):**

- **WP1:**
  - the shell works at 320 px and at 200 % zoom;
  - focus is never obscured by sticky header or tab bar;
  - every control ≥ 44 px; no text < 12 px;
  - dark and light tokens pass the palette validator;
  - review.html is visually intact.
- **WP2:**
  - the confirmed dialog bug is gone (delegation; no `data-*` on the dialog);
  - permalinks round-trip;
  - Back closes the record;
  - the tick updates the stale notice and windows without losing focus.
- **WP3:**
  - each card shows sides with target, state response or "not established", three intensity facets, a timeframe, and per-card evidence including the publisher, the source link and the AI-assisted marker;
  - the record sheet has section navigation and prev/next.
- **WP4:**
  - no GeoJSON fetch;
  - land fit 1000×448;
  - `pan-y` by default;
  - FR focuses the mainland;
  - roving tabindex plus skip-map;
  - zoom buttons enable and disable correctly;
  - colours only from tokens;
  - a failed map leaves the list usable.
- **WP5:**
  - roadmap validator wired into the build;
  - truthful empty state for announced actions;
  - the directory pluralises ("1 entry");
  - the research window comes from data;
  - `test_site.py` link check is green;
  - workflow concurrency and pins updated.
