# Protest Atlas 4.0: binding build specification (SPEC)

Lead product designer, redesign panel · 2 Oct 2026 · repository HEAD `7f0b1d5` (freshness.js already carries the editorial band/announcement labels and `datasetState`; `js/html.js` is committed verbatim; `public/upcoming.json` exists with 0 items and a data-derived sweep note; `events.coverage_note` carries the data-derived sweep sentence).

**Revision 2, 3 Oct 2026 (pre-freeze review).** This revision resolves the 13 major and 21 minor gaps found by the pre-freeze review. Every contract change is a dated addendum in §2.1 (C-34 to C-52) and is applied in place in the sections it touches. §23 is the revision log. No file is added to tech §3.2/§3.3 and `PUBLIC_FILES` is unchanged.

This is the **one document** the five builders (WP1–WP5) follow. It is built on `tech.md` and `editorial.md`, and it resolves the three judge verdicts (mobile UX, editorial honesty, feasibility).

**Order of precedence:**
1. This SPEC.
2. `editorial.md` (copy deck §12, rules §2–§11). Where this SPEC rewrites a deck string, §18.2 lists the string and the reason.
3. `tech.md` (architecture, file plan, module contracts, DOM and CSS contracts) with the changes in §2.

If something is not covered here, follow tech.md. If tech.md and editorial.md disagree and this SPEC says nothing, editorial.md wins on wording and behaviour, and tech.md wins on code structure. Ask the lead about anything else, and never edit a file outside your package.

---

## 1. Decision

### 1.1 Chosen direction: a hybrid, "Reports desk with atlas components"

The **shell is Direction A** with its tabs renamed:
- feed-first, one ordinary scrolling document;
- `html[data-default-view="latest"][data-map-gestures="page"]`;
- five tabs, Reports · Map · Ahead · Countries · About, mapping 1:1 to tech `VIEWS`;
- all three sheets are modal `<dialog>`s;
- no draggable bottom sheet anywhere.

Into that shell we bring **Direction B's components and B's way of keeping honesty visible on every view**:
- one global disclosure strip plus stale line on every view;
- B's compact label-column card as the default density, with A's List density kept;
- hue-free stance pills, all with the same weight;
- B's detail chrome: the per-record AI line, a glance block, scroll-spy tabs, a mini-title cross-fade, and a thumb-zone footer that uses A's "Read {publisher}" primary;
- B's Explore mode and mainland framing inside the Map tab, with A's outline selection;
- a first-class "Coming next" segment at the top of Ahead.

**Why.** All three judges chose a hybrid.
- Feasibility scored A's shell 7.5 against B's 4.5. B's detent sheet is the riskiest code in the plan: dead-zone swipes, `100dvh` on iOS, a non-modal snap state, and five extra cross-package contracts.
- The mobile and editorial judges found B's frame more honest (disclosure on every view, D1 in the detail, no hue) and its card more scannable (433–485 px against 696–854 px).
- The hybrid takes both strengths and drops both shells' failures. Its shell carries no gesture risk, and its frame stays honest on 9 Oct.

### 1.2 What comes from where

| Element | Source | Notes |
|---|---|---|
| Document-scroll shell, tab bar, `<dialog>` sheets, desktop drawer | A | Tab "Latest" is labelled **Reports** (editorial §13); route id stays `latest` |
| Global `#data-notice` (H1 + stale line) on every view | B | Outside any view section, as in the tech §4.7 DOM contract |
| Header chip with a named clock | editorial H4–H6 | Replaces A's "Data · 58 min ago" and B's "DATA UPDATED" |
| Compact label-column card (default "Cards" density) | B | Copy C1–C11, exact allowlist intensity, unclamped attribution |
| "List" density row | A | Adds C7 and the C8 evidence line (A lacked both) |
| Detail chrome: D1 line, glance, sticky scroll-spy tabs, mini title, footer | B, with A's "Read {publisher} ↗" primary | Sections and copy D1–D11 |
| Map tab: region chips, Explore, mainland focus, outline selection, label culling | A + B | One map instance only (`#world-map`); no home map |
| Country brief ledger, three lead variants | B (ledger), editorial E2/E3 | No unread leads rendered |
| Ahead: two separate sections with a pinned segmented switch | judges + editorial §10.5 | `#/ahead/actions` and `#/ahead/roadmap` |
| Roadmap from validated `public/roadmap.json` | tech §8, editorial §11 | Nothing from this release is marked shipped |
| Live-apply filter sheet with a "Show N records" footer | B behaviour + A rows | Zero-count status options hidden |
| Palette | A text tokens, B map palette (re-validated §17.2) | Ochre means coverage only; ink is the interactive accent |

### 1.3 Judge must-fix ledger (where each item is resolved)

| # | Must-fix (judge) | Resolution | Section | Owner |
|---|---|---|---|---|
| 1 | Disclosure and stale line missing outside Latest (A) | Global `#data-notice` on every view; record sheet carries D1 | §4.2, §8 | WP1, WP2, WP3 |
| 2 | Staleness from `generated_at` with one 72 h threshold (both) | `snapshotState()` = `freshness.datasetState(newest evidence)`: current, aging, stale, archive; chip H4–H6; banners S4–S6; recomputed every 60 s and on `visibilitychange` | §4.1, §4.2, §16 | WP2 |
| 3 | Chip wording ("Data updated", bare "58 min ago") | Chip always starts "Snapshot" or "Stale snapshot"; it contains a UTC hh:mm in the current state | §4.1 | WP2 (content), WP1 (style) |
| 4 | 9 Oct band label contradicts its cards; empty bands show "0" (A) | F6 headings; the empty fresh/week band collapses into one E4 line at the top; no zero counts | §6.4 | WP2 |
| 5 | Zero-count status options; region and quick-chip counts | Status options with 0 matches are hidden; region and issue selects carry no counts; quick chips carry no counts | §6.2, §9 | WP2 |
| 6 | Stance hue (A); FOR solid against AGAINST outline (B); +/− glyphs | One neutral outline pill for all four stances; words only | §7.3, §17.8 | WP3 |
| 7 | Intensity regex (B); incomplete exact set (A); "Violence" label | Editorial §6.2 allowlist, exact match; row label "Violence or harm" + D5-violence-note | §7.4, §8.6 | WP3 |
| 8 | Ellipsis truncation of attribution and timeframe unknowns (B) | Never clamp C4, C5, C7 or attribution; only C9 may clamp | §7.2 | WP3 |
| 9 | Solid time-rail connectors (A) | No rail on cards; detail timeline is marks only, with no connector | §8.9 | WP3 |
| 10 | Claims in quotation marks (A); B's "Further action mentioned" | "As reported:" label, no quotes; the further-action section is not built | §8.5, §12 | WP3, WP5 |
| 11 | Status must lead the band and carry its date | Card and detail meta: status label (ST1–ST4 with date) first, band badge after | §7.2, §8.3 | WP3 |
| 12 | "Sides" vocabulary (B) | `RECORD_SECTIONS` relabelled; D11 tabs | §2 C-15, §8.4 | WP3 |
| 13 | Roadmap overclaims "shipped"; "Live desk" name (A) | `roadmap.json` §20: only SHIP-1–6 shipped; this release's work stays in-progress; working names never appear | §12.3, §20 | WP5, lead |
| 14 | Evidence row missing on compact and list rows (A) | C8 is on every card in both densities | §7.2, §7.5 | WP3 |
| 15 | Filter Apply/Close draft model (A) | Live apply; the footer "Show N records" just closes | §9 | WP2 |
| 16 | "BUILT None" in the home strip; heavy first viewport (A) | Status strip is S1 + S2 only; Site built appears only in the footer and dates sheet | §5, §6.1 | WP2 |
| 17 | Bottom-sheet dead zone (B) | Not built; document scroll everywhere | §1.1 | n/a |
| 18 | Second map instance and DOM 3,503 nodes (A) | One lazy map in `#view-map`; views render on first visit; `PAGE_SIZE` = 12 | §2 C-04, C-21 | WP2, WP4, WP5 |
| 19 | localStorage density (both) | `state.ui.density`, session only | §2 C-11 | WP2 |
| 20 | Routes `#map/FR`, `#filters`, `#stamps` (A) | tech §2.2 grammar; sheets are not routed; country goes in the query | §3.2 | WP2 |
| 21 | No roving tabindex (A); `role="application"` (B) | tech §5.5 as written | §11.4 | WP4 |
| 22 | Map selection filled green (B) | Ink outline overlay with halo; fill stays coverage | §11.3 | WP4 |
| 23 | T1/T2 footer missing; S7 missing | `#footer-stamps` (T1/T2); S7 sourced from data | §4.4, §6.4 | WP2 |
| 24 | Banned strings in the DOM even when negated | Copy rewritten (§18.2); automated scan with a data-verbatim exception | §18 | all |
| 25 | `searchableText` misses state response and intensity | Added | §2 C-09 | WP2 |
| 26 | Ahead copy undated or inaccurate; week-precision countdown | A3–A6 with A5 from data; A9 stamp; no countdown for week or month | §12.2 | WP5 |
| 27 | "Coming next" buried under About | Ahead segmented switch, desktop nav item, feed teaser, About first row, footer, filter-sheet row | §3.4 | WP1, WP5 |
| 28 | 360 tab label wraps; chevron orphan; desktop grab bar (B) | 5 short tab labels; no chevrons on cards; no grab bar on drawers | §4.6, §7 | WP1, WP3 |
| 29 | Sticky filter bar plus header plus tab bar is about 237 px of chrome (A) | Only the header is sticky on phones; `--header-h`/`--tabbar-h` come from ResizeObserver | §4.1, §17.5, C-25 | WP1 |
| 30 | Desktop drawer covers the masthead (B) | Drawers start at `top: var(--header-h)` | §8.1 | WP1 |

---

## 2. Changes to tech.md

All of these keep `tests/test_explorer.mjs`, `tests/test_freshness.mjs`, `review.html` and the `PUBLIC_FILES` list of tech §3.3 working. **No file is added to or removed from tech §3.2/§3.3.** Every change is inside a package's own files or adds an export or id to a frozen contract.

| ID | Area | Change | Compatibility note |
|---|---|---|---|
| C-01 | Direction | Fixed: `data-default-view="latest"`, `data-map-gestures="page"`. The Atlas-sheet variant (tech §4.7 note, risk 8) is **dropped**. `initDetentSheet` and `data-detent` are removed from `js/sheet.js` and the delegated-attribute table. `setGestures('map')` is used only by the Explore toggle. | Smoke check 6 applies as written. |
| C-02 | Staleness | `editorialStale(envelope, now)` is **replaced** by `snapshotState(envelope, now)` → `'current'\|'aging'\|'stale'\|'archive'\|'unknown'`. It equals `datasetState(updateStamps({events: envelope}).latestObservation, now)` from freshness.js. Also new: `evidenceAgeDays(envelope, now)` (whole UTC days from the newest evidence day to today). `timeSnapshot` includes `snapshotState` **and `evidenceAgeDays`** (amended by C-52), so it also changes at every UTC midnight. | freshness.js is unchanged; `datasetState` is already tested. |
| C-03 | Stamp labels | `STAMP_ROWS` uses the editorial §4 labels: Snapshot assembled · AI-assisted review pass (only when it differs) · Newest evidence · Latest source re-read · Announced-actions list compiled · Site built. The sheet title (`#stamps-title`) is T3, "What the dates on this page mean". Signature: `stampItems(stamps, now, extras = {})`, where `extras = {announcementsCount, discovery, discoveryLoad, sweep}`. `discovery` is `discoveryView(state.data.discovery)` (imported from js/about.js) or `null`, and `discoveryLoad` is `state.load.lazy.discovery` (C-49). New: `chipModel(state)` and `footerStampsHTML(state)`. | tech §7.1 labels are superseded. |
| C-04 | Paging | `PAGE_SIZE = 12` (was 20). | Keeps the first `#/latest` render under 1,500 DOM nodes with compact cards. |
| C-05 | Bands | Band text comes from freshness.js `BAND_BADGES`, `BAND_LABELS` and `BAND_HEADINGS`, except the `older` heading, which list.js computes from data ("Earlier research, {minYear}–{maxYear}"). `.band` badges are **text only, with no `::before` symbol** (editorial: no live-dot look). `.status` keeps its symbol. | CSS contract §4.9 "band … ::before symbol" is lifted for `.band` only. |
| C-06 | Status labels | `STATUS_LABELS` values: `ongoing: 'Reported ongoing'`, `planned: 'Planned'`, `ended: 'Ended / suspended'`, `'needs-review': 'Needs review · current status unknown'`, `unknown: 'Current status not established'`. New `statusLabel(status, event = null)` returns the dated forms: "Reported ongoing · evidence dated 2 Oct 2026" and "Ended / suspended 30 Sep 2026" (§18.2 explains the ST1 rewrite). | `getDisplayStatus` is verbatim and untouched. |
| C-07 | Status filter | New `statusOptions(state)` → `[{value, label, count}]`, computed with every other filter applied. Options with count 0 are omitted **unless** they are the current value. A permalink for an absent status renders E7. | Codec unchanged (9 keys). |
| C-08 | Dataset stats | `datasetStats(envelope, countries, now)` → `{episodes, countriesWithRecords, directoryTotal, newestEvidence, fresh}`. The old `observed7`/`observed30` are removed so no "N in the last 7 days" tile can exist. | WP2-internal. |
| C-09 | Search | `searchableText` also folds in `state_response[].action`, `state_response[].attribution`, `intensity.turnout.qualifier`, `intensity.disruption` and `intensity.violence` (editorial §7.2). | — |
| C-10 | Quick chips | `QUICK_CHIPS = [{key:'window',value:'7',label:'Last 7 days'}, {key:'window',value:'30',label:'Last 30 days'}, {key:'status',value:'ended',label:'Ended / suspended'}, {key:'outcome',value:'documented',label:'Outcome documented'}]`, plus a non-toggle "Country or territory" chip that opens the filter sheet focused on `#country-filter`. No chip shows a count. | — |
| C-11 | Density | `state.ui.density: 'card'\|'row'` (default `'card'`, never persisted, never in the URL). New delegated attribute `data-set-density="card\|row"` (app.js → `actions.setDensity`). `renderCard(event, {…, density = 'card'})`. | Not in the codec, so the 9-key test is unaffected. |
| C-12 | Filter controls | `#window-filter` and `#status-filter` become `<fieldset>`s of radio inputs (`name="window"`, `name="status"`). `#country-filter #region-filter #issue-filter #year-filter #city-filter #outcome-filter` stay native `<select>`s. filters.js builds `#filters-body` once per data or mode change and then **patches** values, counts and visibility in place (no innerHTML re-render while the sheet is open). | Smoke uses `check('#window-filter input[value="30"]')`. |
| C-13 | Delegation | New: `data-set-density`; `data-action="map-region"` + `data-value` (map-view.js); `data-action="clear-except-country"` (app.js: reset every filter except `country`); `data-sheet-focus="<selector>"` on a `[data-open-sheet]` trigger (sheet.js passes it as `openSheet(…, {focus})`). Added 3 Oct: `data-action="dismiss-feedback"` (app.js, C-36); `data-retry="examples"` (the existing `data-retry` mechanism, C-38); `data-ahead-target="<id>"` (WP5, inside `#view-ahead` only, §12.2). | Additions only. |
| C-14 | Record facts | `VERIFICATION_LABELS = {'single-source':'Single source', corroborated:'Corroborated', contested:'Contested', illustrative:'Illustrative'}`. `sidesLedger` is **replaced** by `positionList(event)` (recorded order, no grouping). New: `positionView(p)`, `NOT_ESTABLISHED` (the §6.2 allowlists), `intensitySummary(event)` (C6), `primarySource(event)`. `positionSentence`, `stateActionSummary`, `timeframe` and `evidenceLine` keep their names, with outputs redefined in §7.6. Cities are removed from the card contract; they appear in the detail and on the map. | test_record (WP3) asserts the new outputs. |
| C-15 | Record sections | `RECORD_SECTIONS = [{id:'rec-overview',label:'Overview'},{id:'rec-positions',label:'For/against'},{id:'rec-intensity',label:'Intensity'},{id:'rec-state',label:'Police/state'},{id:'rec-outcome',label:'Outcome'},{id:'rec-timeline',label:'Timeline'},{id:'rec-sources',label:'Sources'}]`. New export `mountRecordChrome(dialog)` → `{refresh(), destroy()}` (scroll-spy and mini title). | "Sides" is banned. |
| C-16 | Record sheet DOM | `#record-close` moves to the head start. The head gains `#record-eyebrow` and `#record-minititle`; `#record-share` moves into the head. `#record-actions` holds `#record-prev`, **`#record-source`** (an `<a>`, external, primary) and `#record-next`. app.js fills the eyebrow, mini title and source link (`primarySource`). | Ids added; none removed. |
| C-17 | Map selection | Selection is an **outline overlay**, not a fill. `map.js` keeps `data-selected` on the path and draws `g.map-overlay` (pointer-events none, last child of the zoom group) with `path.map-selection-halo` + `path.map-selection` cloned from the selected feature's `d`. tech §5.6's `.map-country[data-selected="true"] {fill: var(--map-selected)}` rule is **removed**. New token `--map-selected-halo`. | Colours still come only from CSS. |
| C-18 | Map containers | New `#map-regions` (region chips, WP4) before `.skip-map`. `#map-controls` (inside `#map-stage`) holds **only** the overlay controls: the zoom buttons, World and the Explore toggle. The selection bar renders into the new pinned `#map-selbar`, which sits in flow **between** `#map-stage` and `#map-legend` (amended by C-39). tech §5.3's hint copy is decided in §11.2. | Ids added. |
| C-19 | Country brief | `briefModel` **drops `leads`**: unread search results are never rendered (editorial §1/§10.1 spirit; risk 13). Lead copy is E2/E3 plus variant (a) (§11.6). | — |
| C-20 | Countries | Labels are E9. `directoryRows({countries, events, research, loadError, mapCodes = null})` adds `drawn: boolean\|null`. `LAZY` gains `mapCodes: 'public/world-map-codes.json'` (already in `PUBLIC_FILES`). | — |
| C-21 | Lazy view render | `mountCountries`, `mountAbout` and the roadmap half of `mountAhead` render on **first visit** to their route, then stay current. `#/latest` first render contains no directory, ledger or roadmap DOM. | DOM budget. |
| C-22 | Ahead | Static segmented switch `.ahead-switch` (links `#/ahead/actions`, `#/ahead/roadmap`). `#ahead-root[data-section="actions\|roadmap"]` shows **one** section at a time; the default param is `actions`. New `aheadTeaserHTML({upcoming, load, now})` in js/ahead.js, imported by list.js (WP2) and rendered after the first feed group. `load` is the whole `state.load` object; the function reads `load.critical` and `load.errors.upcoming` (C-49). New constant `NOT_PLANNED` (R4 list). tech §9.1's empty-state copy is superseded by A3–A6. `reviewOverdue` badge text: "Status check overdue". | Cross-package import with a frozen signature; the Phase-0 stub returns `''`. |
| C-23 | Roadmap content | tech §8.5 is **superseded** by §20: the redesign, stamps, cards and Ahead stay `in-progress` until the deployed build passes their checks (editorial §11). SHIP-1–6 cite existing CI tests. | The validator is unchanged. |
| C-24 | Router | `ROUTE_ALIASES` adds `'#/reports': {view:'latest'}` and `'#/coming-next': {view:'ahead', param:'roadmap'}`. The router also sets `aria-current="page"` on `[data-nav="<view>/<param>"]`; `ahead` with param null counts as `actions`. **Inside each nav container only the most specific displayed match gets `aria-current="page"`** (§3.3). Scroll and focus after navigation follow C-35 and §3.2. New `VIEW_NAMES = {latest:'Reports', map:'Map', ahead:'Ahead', countries:'Countries', about:'About'}` for `document.title`. | VIEWS unchanged. |
| C-25 | Sheet metrics | New `initChromeMetrics(root = document)` in js/sheet.js. A ResizeObserver writes `--header-h` and `--tabbar-h` on `:root`. app.js calls it at boot. | WCAG 2.4.11. |
| C-26 | Notice | `noticeModel(state)` → `{tone, counts: {withRecords, total, gaps} \| null, lines: [{kind:'pilot'\|'snapshot'\|'dropped'\|'error'\|'countries-error', text}]}`. `counts` is `null` until events and countries are both ready. mountNotice **patches**: it creates `.notice-more` once, when counts become known, and never replaces it. It adds, updates or removes only the `.notice-line` node for each `data-kind`, and writes a line only when its text changes (it is a live region). Amended by C-37. | — |
| C-27 | Model additions | New pure exports in js/model.js: `sweepFact({events, upcoming})`, `groupByBand(events, now)`, `emptyBandNotice(allEvents, now)` → `'fresh'\|'week'\|null`. | — |
| C-28 | Meta | `<title>` = P1; meta description and OG = P2; `document.title` on navigation = "{VIEW_NAMES[view]} — Protest Atlas"; record open: "{title} — Protest Atlas". | — |
| C-29 | Icons | Sprite adds `i-signpost`, `i-calendar-empty`, `i-link`. `i-latest` is drawn as a newspaper or list glyph (label "Reports"). | — |
| C-30 | Desktop filters | There is **no inline filter rail**. `#filters-sheet` is a bottom sheet below 900 px and a right drawer at 900 px and above. | Avoids a second render of `#filters-body`. |
| C-31 | Smoke | Check 2 becomes state-aware. New checks 13 (9 Oct clock), 14 (banned vocabulary), 15 (worked cases), 16 (status before band) and 17 (first card title above the fold at 390×844). Added 3 Oct: 4.6–4.7, the C-41 geometry in 6, short viewports in 1 and 7, and new checks 18–23 (example failure, events failure, countries failure, sticky targets, segmented focus, stance totals). Full list in §22. | Local only. |
| C-32 | Per-record stamps | Cards and detail say "Latest evidence {date · relative}" (not "Observed"). The detail evidence row says "Source re-read (AI-assisted) {timestamp}" (not "Source check"). | tech §7.2 wording superseded. |
| C-33 | 404 | Visible links: Reports, Map, Coming next, Countries, Published data. Every link is built at runtime from the computed `home` (tech §2.5). The static no-JS `href`s are absolute (`/protest-atlas/#/map`, `/protest-atlas/public/events.json`, …). test_site.py fails on any `href` or `src` in `404.html` that does not start with `/protest-atlas/` or `https://` (§15). | — |

### 2.1 Pre-freeze addendum (3 Oct 2026)

These are dated changes to ids, contracts and smoke checks, made before the Phase-0 freeze. Each one is applied in place in the sections listed. None adds a file to tech §3.2/§3.3 or to `PUBLIC_FILES`.

| ID | Area | Change | Sections | Compatibility note |
|---|---|---|---|---|
| C-34 | Sort ties | `sortByObservation` sorts by `last_observed_at`, newest first. Ties keep **published file order** (a stable sort, as in 3.1). tech §4.6 "ties by id" is superseded. On the 2 Oct data the first three cards are `in-electoral-20261002`, `fr-schools-20261002` and `es-housing-20261002`. | §6.4, §16.2 | tech §10.1 "stable" still holds; test_core asserts the first id. |
| C-35 | Scroll and focus on navigation | js/router.js sets `history.scrollRestoration = 'manual'` and stores a `scrollY` per history entry (`history.state.scrollY`, written with `replaceState` before each push). After a **user-initiated** view or param change has rendered, the router calls `scrollTo(0, 0)` (instant) and then `title.focus({preventScroll: true})`. Back and Forward restore the stored `scrollY` after render, then focus the same way. Tapping the current view's tab or nav link scrolls to the top. Query-only changes never scroll. A `popstate` that only opens or closes the record overlay changes neither scroll nor focus. The focus targets are in §3.2. | §3.2, §4.2 | Refines tech §2.3; smoke check 2 extended. |
| C-36 | Action feedback | `ui.feedback` stays a string, and new `ui.feedbackURL: string \| null` is set only by the share clipboard fallback. **app.js owns rendering and the auto-hide timer.** It writes into the new pinned `#record-feedback` (inside `#record-sheet`) while `isOpen(recordSheet)`, otherwise into `#action-feedback`. New delegated `data-action="dismiss-feedback"` (app.js). | §4.5, §4.6, §8.1 | `share('view'\|'record')` semantics unchanged. |
| C-37 | Load failures | `loadCritical` settles each critical file independently (`Promise.allSettled`), so `data.events` is kept when only `countries` failed. `load.critical` means what it did before. Every "records failed" surface keys on `load.errors.events`: notice line `error` (E5) on every view, chip `error`, list E5, the map drawn neutral (`map.update({error: true})`) with the error legend, error leads in the brief and overview, "Coverage unavailable" on every directory row, the filter-sheet error body and footer. `load.errors.countries` alone gives the notice line `countries-error` and the Countries error state; Reports, Map and records keep working, showing the country code where a name is missing. | §4.2, §6, §9, §11, §13, §16.1 | `noticeModel` line kinds gain `error` and `countries-error`. |
| C-38 | Example mode | `load.lazy.examples` gets defined loading and error states (§6.4, §11, §16.1); `data-retry="examples"` retries. `#about-example` and the true-empty button run `setMode('example')` and then `navigate('latest')`. In example mode the map shows the C11 watermark (`.map-watermark`, WP4). A `data-select-country` click inside `#view-countries` in example mode first runs `setMode('reported')`. | §6.4, §11, §13, §14, §16.1 | — |
| C-39 | Map selection bar | New pinned `<div id="map-selbar" class="map-selbar" hidden>` between `#map-stage` and `#map-legend`. WP4 renders the selection bar there. `#map-controls` keeps only the overlay buttons. | §4.6, §11.1, §11.2 | Amends C-18; id added. |
| C-40 | Map focus | Keyboard focus is drawn as an overlay, not as a path stroke. On `focusin` of a `.map-country`, map.js appends `path.map-focus-halo` (6 px, `--map-selected-halo`) and then `path.map-focus-ring` (3 px, `--map-focus`), both cloned from the focused feature's `d`, as the **last** children of `g.map-overlay` (after the selection paths). `focusout` removes them. The `.map-country:focus-visible` stroke rule is removed. Ring against halo: 6.19:1 light, 8.90:1 dark. | §11.3, §17.5 | Colours still come only from CSS. |
| C-41 | Map stage and smoke check 6 | The stage keeps `aspect-ratio: 16 / 10` below 900 px. The svg **fills the stage** with `preserveAspectRatio="xMidYMid meet"`, so the letterbox is ocean and Explore can use the full height. tech smoke check 6's "svg box aspect within ±2 % of 1000/448" now runs **at 1440 only**, where the stage is 1000/448. At every width it is replaced by two checks: `viewBox === "0 0 1000 448"`, and at k = 1 the union of the `.map-country` client rects has aspect 984/432 ± 2 % and a width of 0.984 × the svg width ± 0.01. | §11.1, §19 WP4, §22.2 | Option (b) of the review; land fit 1000×448 is still asserted. |
| C-42 | Short viewports, zoom, forced colours | `(max-height: 500px)` and `(forced-colors: active)` join the allowed media queries (§17.7; rules in §17.10). New export `sheetScroller(dialog)` in js/sheet.js returns the element that scrolls the sheet: `.sheet-body`, or the dialog itself under `max-height: 500px`. `mountRecordChrome` observes with `root: dialog`, which works in both layouts. | §5, §8.1, §17.7, §17.10 | Extends tech §4.9's breakpoint list; WCAG 1.4.10. |
| C-43 | Reports actions | `.feed-head` gains `.feed-actions`: `[Copy link to this view]` (`data-action="share-view"`, `i-link`) and `[Download CSV]` (`data-action="export-csv"`, `i-download`). WP2 sets `aria-disabled="true"` (never `disabled`) on **every** `[data-action="export-csv"]` while `!exportAllowed(state).ok`, and on every `[data-action="share-view"]` and `#record-share` in example mode. The handlers still guard and explain themselves through §4.5 feedback. | §4.6, §6.3, §14, §22.2 | Restores the 3.1 "Copy view link" and "Export reports"; `share('view')` is used again. |
| C-44 | Tokens and defaults | New tokens `--border-input`, `--example-stripe` and `--on-example` (§17.1). `:root` defaults: `--header-h: 56px` (64px at ≥ 900) and `--tabbar-h: 0px`; `:root:has(.tab-bar)` sets `--tabbar-h: calc(64px + env(safe-area-inset-bottom))` below 900 (48 px under `max-height: 500px`), so the layout is right before JS and without it. `initChromeMetrics` refines both, writing only for elements that are displayed. The app footer carries `class="site-footer site-footer--app"`, and the tab-bar padding is scoped to `.site-footer--app`. The Reports two-column grid selects `.view[data-view="latest"]` (no id selector, tech §4.9). | §4.4, §5, §17.1, §17.4, §17.8 | review.html keeps its 3.1 header (§17.8). |
| C-45 | Heading outline | Every view title is an `h1` (only one view is displayed at a time). Reports: group titles and the Ahead teaser title are `h2`; cards stay `h3`. Map: the legend title and `#country-panel-title` are `h2`. Ahead: section titles `h2`; A3, roadmap groups, "What we will not build" and announcement items `h3`; roadmap items `h4`. Countries: regions `h2`. About: section titles `h2`. Sheet titles stay `h2`. `#ahead-actions-title` gets `tabindex="-1"`. | §4.6, §6, §11, §12, §13, §14, §17.3 | Ids unchanged; smoke selects by id. |
| C-46 | Record stepping | When the open id is not in `selectFiltered(state)`, `#record-eyebrow` reads "Record" and `#record-prev`/`#record-next` are `hidden`. A step sets `sheetScroller(recordSheet).scrollTop = 0`, keeps focus on the pressed button, and writes "{title}. Record {i} of {n} in this view." to the new visually hidden `#record-announcer` (`role="status"`). At the ends the button gets `aria-disabled="true"` (never `disabled`), so focus stays, and the action does nothing. | §4.6, §8.1 | Ids added. |
| C-47 | Sheets | `#filters-title` and `#stamps-title` get `tabindex="-1"`, and `openSheet`'s default focus becomes `'[data-autofocus], h2[tabindex="-1"]'`. sheet.js never calls `preventDefault` on an `<a href>` that carries `data-close-sheet`: it closes the sheet (reason `'link'`) and lets the navigation run. `#filters-foot` holds a static `<p id="filters-status" class="visually-hidden" role="status">`; WP2 renders the footer buttons once and then patches their labels and the status text. | §4.6, §9 | Ids added. |
| C-48 | Import graph | §19.0 pins each module's allowed static imports and the final modulepreload set of 21 modules. Phase 0 writes the stubs with the mandatory edges, so the static graph is final from Phase 0 and test_shell is green on every branch. | §19.0, §21, §22.1 | tech §10.1's modulepreload test unchanged. |
| C-49 | Frozen signatures | `aheadTeaserHTML({upcoming, load, now})`: `load` is `state.load`. `stampItems` extras: see C-03. `researchScope` adds `{positions, episodes}`. WP2's prefixes add `list-*`. | §2, §14, §19 | Exports unchanged. |
| C-50 | Copy additions | Per-status E7 sentences; E2 variants; example loading and error copy; events and countries error lines; map error legend; secondary load states; "Planned period includes today · occurrence not established" for non-day `scheduled-now`; feedback strings. The full list is §18.4. | §18.4 | freshness.js unchanged (the override lives in `announcementView`). |
| C-51 | Cards | The "List" density adds the issues line (C3) and one wrapped line, "Timeframe: {C5} · Intensity: {C6}" (§7.5), so both densities carry C1–C8. Band badges carry their long label as visually hidden text, not as `aria-label` on a `<span>`. | §7.2, §7.5 | test_record covers both densities. |
| C-52 | Time snapshot | `timeSnapshot` includes `evidenceAgeDays(envelope, now)` (amends C-02). The chip (H5, H6) and the notice (S4, S5) day counts therefore update at every UTC midnight on a page left open. | §4.1, §16.2 | test_core: the snapshot differs between 2026-10-10T23:59Z and 2026-10-11T00:00Z. |

---

## 3. Information architecture and navigation

### 3.1 Views

| View id (route) | Visible name | Job |
|---|---|---|
| `latest` (`#/latest`; default) | **Reports** | Status strip, search and filters, records grouped by latest-evidence band, Ahead teaser |
| `map` (`#/map`) | **Map** | Coverage map (region chips, Explore, zoom), legend, world overview or country brief |
| `ahead` (`#/ahead/actions`, `#/ahead/roadmap`) | **Ahead** | Two separate sections behind a pinned switch: *Announced protest actions* · *Coming next to Protest Atlas* |
| `countries` (`#/countries`) | **Countries** | A–Z directory of all 249 entries by region; each row opens the brief on Map |
| `about` (`#/about`) | **About** | Reading key, dates, research scope, discovery audit, data and tools, example switch |
| overlay `#/record/<id>` | — | Record sheet over the last view |

There are three sheets: the filter and dates sheets (not routed) and the record sheet (routed as `#/record/<id>`).

### 3.2 Routes

Use tech §2.2–§2.3 exactly, plus the C-24 aliases and the C-35 scroll and focus rules. Filters stay in the query (9-key codec). The country brief is `?country=FR#/map`, never `#map/FR`. `#/ahead` and `#/ahead/actions` render the actions section; `#/ahead/roadmap` renders the roadmap section.

**Scroll and focus after navigation** (C-35, js/router.js). `history.scrollRestoration = 'manual'`. Every focus call below is `focus({preventScroll: true})` and runs after the new view has rendered.

| Navigation | Scroll | Focus |
|---|---|---|
| Into a view from another view (tab, nav, in-page link) | `scrollTo(0, 0)`, instant | `#<view>-title`; `#/ahead/roadmap` focuses `#ahead-roadmap-title` |
| Within Ahead, the param changes (switch) | `scrollTo(0, 0)` | `#ahead-actions-title` or `#ahead-roadmap-title` |
| Tap on the tab or nav link of the view already shown | `scrollTo(0, 0)` | `#<view>-title` |
| Back / Forward between views | restore the entry's stored `scrollY` (± 1 px) | as in the first row |
| Query-only change (filters, search, density) | none | none |
| Record open or close (including the `popstate` that closes it) | none | sheet.js (opening: `#detail-title`; closing: back to the trigger) |
| Initial load, or a non-route hash (`#main`, `#after-map`) | browser default | none |

Before each `pushState` the router saves the current `scrollY` into the current entry with `replaceState({...history.state, scrollY})`. So the disclosure (`#data-notice`, above `<main>`) is in view after every view change, and Back returns to the same feed position.

### 3.3 Navigation chrome

| Width | Primary navigation |
|---|---|
| < 900 px | Fixed bottom `#tab-bar`, five items with icon + label (12 px/600): **Reports** (`i-latest`) · **Map** (`i-map`) · **Ahead** (`i-ahead`) · **Countries** (`i-countries`) · **About** (`i-about`). 64 px + `env(safe-area-inset-bottom)`. The active item has `aria-current="page"`, a 3 px ink bar on top and 700 weight. `#primary-nav` is hidden. |
| ≥ 900 px | `#tab-bar` hidden. `#primary-nav` sits in the header: Reports · Map · Ahead · Countries · About. At ≥ 1200 px it also shows a sixth link, **Coming next** (`href="#/ahead/roadmap"`, `data-nav="ahead/roadmap"`, with an `i-signpost` icon). |

No count badge on any tab (editorial §10.4).

**`aria-current`** (C-24, amended). Inside each nav container (`#primary-nav`, `#tab-bar`, `.ahead-switch`), only the **most specific displayed** match gets `aria-current="page"`; the others get no `aria-current`. Specificity: `view/param` beats `view`; "displayed" means `link.getClientRects().length > 0`. On `#/ahead/roadmap`:
- in `#primary-nav` at ≥ 1200 px, "Coming next" has it and "Ahead" does not;
- at 900–1199 px, where "Coming next" is hidden, "Ahead" has it;
- the tab bar's "Ahead" always has it;
- in `.ahead-switch`, "Coming next" has it.

The router re-evaluates on route change and on a `matchMedia('(min-width: 1200px)')` change. Visual "active" styling selects `[aria-current="page"]` only.

### 3.4 Entry points for "Coming next"

There are six, and every one is a real control:
1. the **Ahead switch** "Coming next" (pinned at the top of Ahead);
2. the desktop header nav item (≥ 1200);
3. the feed **Ahead teaser** link "Coming next to Protest Atlas →";
4. the first row of About;
5. the footer link;
6. the filter-sheet row "Custom date ranges are a later item on the roadmap. See Coming next".

Announced protest actions are reached through the Ahead tab, the teaser and the footer.

---

## 4. Global chrome

### 4.1 Header and snapshot chip (`#site-header`, `#stamp-chip`)

The header is sticky on every width (`top: 0`, `z-index: var(--z-header)`), except under `(max-height: 500px)`, where it is static (§17.10). Its height is `--header-h`: default 56 px (64 px at ≥ 900), refined by `initChromeMetrics`. It has a 1 px `--border` bottom rule on `--bg`. Inline padding is `max(var(--gutter), env(safe-area-inset-left))` and `max(var(--gutter), env(safe-area-inset-right))`.

```
[P] Protest Atlas                         [ SNAPSHOT            ]   < 600 and 900–1199: two-line chip
                                          [ 2 Oct, 22:45 UTC    ]
[P] Protest Atlas    Reports Map Ahead Countries About Coming next    [ Snapshot · 2 Oct 2026, 22:45 UTC ]   ≥ 1200
```

- **Brand** `a.brand[href="#/latest"]`: `.brand-mark` (32×32, ink square, "P" in serif 20/700 on `--accent-ink`, aria-hidden) + `.brand-name` "Protest Atlas" (serif 18/700; 20 at ≥ 900). Fallback: if the chip does not fit at 320–379 px in any state, `.brand-name` becomes visually hidden below 380 px. Chip copy is never shortened beyond the short forms below.
- **Chip** `button#stamp-chip.stamp-chip[data-open-sheet="stamps-sheet"][aria-haspopup="dialog"][data-state][data-tone]`, at least 44 px tall, `--r-pill`, 1 px `--border`, `--bg-raised`, padding 4 px 12 px. Structure (WP2 renders the inner spans; WP1 styles them):

  ```html
  <span class="stamp-chip-label">Snapshot</span><span class="stamp-chip-sep" aria-hidden="true"> · </span>
  <span class="stamp-chip-value"><time datetime="2026-10-02T22:45:35Z">2 Oct<span class="stamp-chip-year"> 2026</span>, 22:45 UTC</time></span>
  <span class="visually-hidden">. Open: what the dates on this page mean</span>
  ```

  - Two-line layout (< 600 px and 900–1199 px): the label is 12 px/700 caps with +.06em tracking in `--text-muted`, the value is 14 px/650, and `.stamp-chip-sep` and `.stamp-chip-year` are hidden.
  - One-line layout (600–899 and ≥ 1200): 14 px label + value, with the separator and year shown.

| `data-state` | Condition (`chipModel`) | Label | Value (one-line / long) | Value (two-line / short) | `data-tone` |
|---|---|---|---|---|---|
| `loading` | critical load pending | Snapshot | loading | loading | neutral |
| `error` | events failed | Snapshot | could not load | could not load | warn |
| `current` (also `unknown`) | `snapshotState` current, or no valid evidence date | Snapshot | `<time>` 2 Oct 2026, 22:45 UTC (`generated_at`) — **H4** | 2 Oct, 22:45 UTC | neutral |
| `aging` | 72 h ≤ newest-evidence age < 7 d | Snapshot | newest evidence {4} days old — **H5** | evidence {4} days old | neutral |
| `stale` | 7 d ≤ age < 30 d | Stale snapshot | newest evidence {7} days old — **H6** | evidence {7} days old | warn |
| `archive` | age ≥ 30 d | Stale snapshot | newest evidence {31} days old — **H6** | evidence {31} days old | warn |

In the short forms the word "newest" sits in `<span class="stamp-chip-long">newest </span>`, which is hidden in two-line layout; it is not a separate string. Warn tone means `--warn-weak` background, `--warn` text and an `i-alert` icon before the label. There is no relative time in the chip (H4 is exact). The chip re-renders only when `chipModel` output changes. Because `timeSnapshot` includes `evidenceAgeDays` (C-52), the day count changes at each UTC midnight on a page left open: on 12 Oct the chip reads "Stale snapshot · newest evidence 10 days old". The `error` state applies when `load.errors.events` is set (C-37); a countries-only failure leaves the chip in its data state.

### 4.2 Data notice (`#data-notice`, every view)

The notice is placed directly after the header and **outside** `<main>`, so it appears on all five views, under the record sheet's backdrop, and on 404 (as static copy). It is not sticky. Markup (WP2 notice.js; WP1 ships the static first line so it paints before JS):

```html
<div id="data-notice" class="notice" role="status" data-tone="info">
  <div class="notice-inner">
    <p class="notice-pilot"><strong>AI-assisted reporting pilot.</strong> Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.</p>
    <details class="notice-more"><summary>What this means</summary><p>{H3}</p></details>   <!-- only once the H3 counts are known; created once, never replaced -->
    <p class="notice-line" data-kind="error">{E5}</p>                    <!-- load.errors.events (C-37), every view -->
    <p class="notice-line" data-kind="countries-error">The country directory could not load; records are listed by country code.</p>  <!-- load.errors.countries only -->
    <p class="notice-line" data-kind="snapshot">{S4 | S5 | S6}</p>       <!-- only when aging/stale/archive -->
    <p class="notice-line" data-kind="dropped">{dropped params}</p>      <!-- only when params were dropped -->
  </div>
</div>
```

- **H1** stays verbatim and in full in the first viewport of every primary view, in every state. Lines are **added** under it, never substituted.
- **H2** is the summary text; **H3** is the body: "An AI system opened and read the cited news articles and recorded what they report. No human editor has reviewed these records. Published episodes exist for {81} of {249} countries and territories; the other {168} are gaps in this atlas, not places without protests. Sources are mostly in English." The numbers come from data (`noticeModel(state).counts`). While loading, or after an events or countries failure, `counts` is `null` and the `<details>` is **not rendered**; no placeholder numbers ever appear.
- **E5 line** (`data-kind="error"`, `load.errors.events`): "Published records could not be loaded, so coverage is unknown at the moment, not zero." It appears on every view. The Retry buttons live where the content would be (list, map legend, Countries), never inside this live region.
- **Patching** (C-26): mountNotice never rewrites `.notice-inner`. It inserts, updates or removes the single `.notice-line` for each `data-kind` (order: error, countries-error, snapshot, dropped), so an open "What this means" keeps its state and focus.
- **S4** (aging): "No evidence newer than {2 Oct 2026} ({3 days ago}) is in this snapshot. More recent protests are missing."
- **S5** (stale): "This snapshot has nothing newer than {2 Oct 2026}, {7} days ago. Read it as an archive of past reporting, not as a picture of protests today." (§18.2 rewrite.)
- **S6** (archive): "Archive: newest evidence {2 Oct 2026}. This atlas is not currently being maintained as a tracker."
- **Dropped params:** "Some link filters were not recognised and were removed: {status, year}." It shows once per load and is removed after the next filter change.
- **Visual:**
  - `--notice-bg` panel with ink text at 14 px/1.45 (15 px at ≥ 600); one line at ≥ 1200 when no extra lines are present.
  - padding 12 px 16 px.
  - `.notice-line` lines: `--warn-weak` background, `--warn` text, 600 weight, an `i-alert` icon, 8 px top margin, `--r-1`. `[data-kind="error"]` and `[data-kind="countries-error"]` use `--danger-weak` and `--danger`.
  - `data-tone="warn"` on the container whenever a snapshot or error line is present.

### 4.3 Example banner (`#example-banner`)

Static (WP1); `hidden` is toggled by notice.js. It sits above `<main>` after the notice and stays visible while the example loads and after it fails to load (§6.4). The banner (and every C11 watermark: cards, record, map) is a 45° stripe of `--example-ink` (#5f4796) and `--example-stripe` (#6b54a3), 12 px bands, with `--on-example` (#ffffff) text: 7.43:1 on the darker stripe and 6.14:1 on the lighter one. Focus rings inside it use `outline-color: var(--on-example)` (`.example-banner :focus-visible, .card-watermark :focus-visible, .map-watermark :focus-visible`), because `--focus-ring` is 1.18:1 on #5f4796. WP1 measures both stripes and pastes the ratios into its hand-off note.

> **Illustrative example • not a real event.** You are viewing one fictional record. It is excluded from counts, the directory and CSV export. [Back to reported data] (`data-set-mode="reported"`)

### 4.4 Footer (`#site-footer`, WP1 static + `#footer-stamps` WP2)

The footer (`class="site-footer site-footer--app"`) stacks on phones and uses three columns at ≥ 900. `.site-footer--app` carries `padding-bottom: calc(var(--tabbar-h) + 24px)` below 900, and inline padding of `max(var(--gutter), env(safe-area-inset-left/right))`. The bare `.site-footer` rule stays as review.html needs it (C-44).

- **Brand line:** "Protest Atlas" + "A source-checked snapshot of reported protests."
- **Links:**
  - Reports · Map · Ahead · Coming next (`#/ahead/roadmap`) · Countries · About
  - Published data (JSON) (`public/events.json`) · Editorial policy ↗ (`{REPO_URL}/blob/main/docs/EDITORIAL_POLICY.md`) · Source code and corrections ↗ (`{REPO_URL}`) · Editor desk (`review.html`)
- **`<p id="footer-stamps">`:**
  - **T1:** "Snapshot assembled {2 Oct 2026, 22:45 UTC} (AI-assisted, no human sign-off) · Newest evidence dated {2 Oct 2026} · Site built {2 Oct 2026, 23:40 UTC} from {1a2b3c4} · All times UTC". The commit is a link to `{REPO_URL}/commit/{sha}`, shown only when the SHA matches `^[0-9a-f]{40}$`.
  - **T2:** when build-info is absent (`load.errors.build === 'absent'`), the "Site built …" part is replaced by "Site build stamp not available in this preview". When it is present but malformed (`'error'`), the text is "Site build stamp could not be read".
- **Attribution:** "Country directory adapted from ISO country data · CC BY-SA 4.0. Map geometry: Natural Earth via world-atlas." (with links as today).

### 4.5 Action feedback (`#action-feedback`, `#record-feedback`; app.js renders, WP1 styles)

There are two feedback regions. Both are `role="status" aria-live="polite"` and `hidden` when empty (C-36):
- **`#action-feedback`** (page level) is fixed above the tab bar (`bottom: calc(var(--tabbar-h) + 12px)`; 24 px at ≥ 900), with inline insets `max(16px, env(safe-area-inset-left/right))` and max-width 560 px.
- **`#record-feedback`** (`.toast.toast--sheet`) lives **inside** `#record-sheet`, in `.sheet-foot`. It is absolutely positioned above the foot (`bottom: calc(100% + 8px)`, inset-inline 16 px), so it is in the dialog's top layer and is visible and announced while the modal is open. Everything outside an open modal dialog is inert, which is why `#action-feedback` cannot be used there.

**Owner and timing.** app.js renders `ui.feedback` (and `ui.feedbackURL`). It writes into `#record-feedback` while `isOpen(recordSheet)`, otherwise into `#action-feedback`, and clears the other region. A plain message auto-hides after 4 s; each new message restarts the timer. Visual: ink background (`--accent`), `--accent-ink` text, `--r-2`, `--shadow-2`, 14/1.45, padding 12 px 16 px.

**Clipboard fallback** (share with no `navigator.share` and a refused clipboard) is persistent and selectable, never a 4 s toast:

```html
<p class="toast-text">Copy this link:</p>
<input class="toast-url" type="text" readonly value="{url}" aria-label="Link to copy">
<button type="button" class="btn btn--quiet toast-close" data-action="dismiss-feedback">Close</button>
```

Focus moves to the input with its text selected (`select()`). The row stays until Close (focus then returns to the share button), the sheet closes, or another message replaces it. `.toast-url` is 44 px tall, 16 px text, and uses `--border-input`.

Exact strings:

| Trigger | Text |
|---|---|
| Unknown section | "That section doesn't exist." |
| Unknown record | "This record is not in the current snapshot." |
| Share copied (view or record) | "Link copied." |
| Share fallback | "Copy this link:" + the persistent input above |
| Share in example mode | "Sharing is off in example mode." |
| CSV done | "CSV downloaded: {n} records." |
| CSV in example mode | "Export is off in example mode: illustrative records are excluded." |
| CSV with 0 matches | "Nothing to export: no records match these filters." |
| CSV while loading or on error | "Records are not loaded yet, so there is nothing to export." |

### 4.6 `index.html` skeleton (complete; Phase 0 writes it, WP1 finishes it)

```html
<!doctype html>
<html lang="en" data-color-scheme="auto" data-default-view="latest" data-map-gestures="page">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121411" media="(prefers-color-scheme: dark)">
  <meta name="description" content="An AI-assisted, source-checked snapshot of reported protests, with searches logged for 249 countries and territories. Sparse coverage; not a live feed.">
  <meta property="og:title" content="Protest Atlas: source-checked protest reports">
  <meta property="og:description" content="An AI-assisted, source-checked snapshot of reported protests, with searches logged for 249 countries and territories. Sparse coverage; not a live feed.">
  <title>Protest Atlas: source-checked protest reports</title>
  <link rel="icon" href="data:image/svg+xml,…">  <!-- inline ink square with serif P -->
  <script type="importmap">{ "imports": { "./app.js": "./app.js?v=4.0", "./explore.js": "./explore.js?v=4.0", "./map.js": "./map.js?v=4.0",
    "./history.js": "./history.js?v=4.0", "./freshness.js": "./freshness.js?v=4.0", "./js/html.js": "./js/html.js?v=4.0", … one entry per js/*.js … } }</script>
  <link rel="modulepreload" href="./app.js?v=4.0"> …(exactly the 21-module set in §19.0; it equals app.js's static graph from Phase 0 on)…
  <link rel="stylesheet" href="styles.css?v=4.0"><link rel="stylesheet" href="css/feed.css?v=4.0">
  <link rel="stylesheet" href="css/record.css?v=4.0"><link rel="stylesheet" href="css/map.css?v=4.0"><link rel="stylesheet" href="css/pages.css?v=4.0">
  <script type="module" src="app.js?v=4.0"></script>
</head>
<body>
  <svg id="icon-sprite" hidden xmlns="http://www.w3.org/2000/svg">…symbols §17.9…</svg>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" id="site-header"><div class="site-header-inner">
    <a class="brand" href="#/latest"><span class="brand-mark" aria-hidden="true">P</span><span class="brand-name">Protest Atlas</span></a>
    <nav id="primary-nav" class="primary-nav" aria-label="Primary">
      <a href="#/latest" data-nav="latest">Reports</a><a href="#/map" data-nav="map">Map</a><a href="#/ahead" data-nav="ahead">Ahead</a>
      <a href="#/countries" data-nav="countries">Countries</a><a href="#/about" data-nav="about">About</a>
      <a class="primary-nav-extra" href="#/ahead/roadmap" data-nav="ahead/roadmap">Coming next</a>
    </nav>
    <button type="button" id="stamp-chip" class="stamp-chip" data-open-sheet="stamps-sheet" aria-haspopup="dialog" data-state="loading" data-tone="neutral">
      <span class="stamp-chip-label">Snapshot</span><span class="stamp-chip-value">loading</span></button>
  </div></header>
  <div id="data-notice" class="notice" role="status" data-tone="info"><div class="notice-inner">
    <p class="notice-pilot"><strong>AI-assisted reporting pilot.</strong> Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.</p></div></div>
  <div id="example-banner" class="example-banner" hidden>…§4.3…</div>
  <main id="main" tabindex="-1">
    <section class="view" id="view-latest" data-view="latest" aria-labelledby="latest-title">
      <aside class="latest-rail" aria-label="Snapshot summary">
        <div id="feed-stats" class="feed-stats"></div>
        <nav class="latest-links" aria-label="More ways in">   <!-- visible ≥1200 only -->
          <a href="#/map">See where published episodes are on the map</a><a href="#/countries">All 249 countries and territories, A to Z</a>
          <button type="button" data-open-sheet="stamps-sheet">What the dates on this page mean</button></nav>
      </aside>
      <div id="filter-bar" class="filter-bar"></div>
      <div id="active-filters" class="active-filters"></div>
      <div class="feed-head">
        <h1 id="latest-title" tabindex="-1">Reports</h1>
        <div class="feed-density" role="group" aria-label="Record layout">
          <button type="button" data-set-density="card" aria-pressed="true">Cards</button><button type="button" data-set-density="row" aria-pressed="false">List</button></div>
        <p id="result-summary" class="result-summary" aria-live="polite"></p>
        <div class="feed-actions">   <!-- C-43; WP2 toggles aria-disabled -->
          <button type="button" class="btn btn--quiet" data-action="share-view"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-link"></use></svg>Copy link to this view</button>
          <button type="button" class="btn btn--quiet" data-action="export-csv"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-download"></use></svg>Download CSV</button></div>
        <details id="feed-explainer" class="feed-explainer"><summary>How this list is ordered</summary>
          <p>Newest first, by the date of each episode's latest sourced activity or development. Not by when it was published or checked.</p></details>
      </div>
      <div id="event-list" class="feed" aria-busy="true"></div>
      <div id="list-more" class="list-more"></div>
    </section>
    <section class="view" id="view-map" data-view="map" aria-labelledby="map-title">
      <div class="view-head"><h1 id="map-title" tabindex="-1">Published coverage</h1>
        <p class="view-dek">Countries and territories with a published episode that matches your filters.</p></div>
      <div class="map-layout"><div class="map-main">
        <div id="map-regions" class="map-regions"></div>
        <a class="skip-map" href="#after-map">Skip map</a>
        <div id="map-stage" class="map-stage"><div id="world-map" class="world-map"></div><div id="map-tooltip" class="map-tooltip" hidden></div>
          <div id="map-controls" class="map-controls"></div></div>   <!-- overlay controls only (zoom, World, Explore) -->
        <div id="map-selbar" class="map-selbar" hidden></div>       <!-- C-39: in flow, outside the clipped stage -->
        <div id="map-legend" class="map-legend"></div>
      </div>
      <div id="after-map" tabindex="-1"></div>
      <section id="country-panel" class="country-panel" aria-labelledby="country-panel-title"></section></div>
    </section>
    <section class="view" id="view-ahead" data-view="ahead" aria-labelledby="ahead-title">
      <div class="view-head"><h1 id="ahead-title" tabindex="-1">Ahead</h1>
        <p class="view-dek">Two separate lists: protest actions that organisations have announced, and what is coming next to this website.</p></div>
      <nav class="ahead-switch" aria-label="Ahead sections">
        <a href="#/ahead/actions" data-nav="ahead/actions">Announced actions</a><a href="#/ahead/roadmap" data-nav="ahead/roadmap">Coming next</a></nav>
      <div id="ahead-root" data-section="actions"></div>
    </section>
    <section class="view" id="view-countries" data-view="countries" aria-labelledby="countries-title">
      <div class="view-head"><h1 id="countries-title" tabindex="-1">Countries and territories</h1></div><div id="countries-root"></div></section>
    <section class="view" id="view-about" data-view="about" aria-labelledby="about-title">
      <div class="view-head"><h1 id="about-title" tabindex="-1">About this atlas</h1></div>
      …static About copy §14 with #about-stamps, #about-discovery, #research-scope, #about-example…
    </section>
  </main>
  <nav id="tab-bar" class="tab-bar" aria-label="Sections">
    <a href="#/latest" data-nav="latest"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-latest"></use></svg><span>Reports</span></a>
    …Map (i-map) · Ahead (i-ahead) · Countries (i-countries) · About (i-about)…
  </nav>
  <footer class="site-footer site-footer--app" id="site-footer">…§4.4…<p id="footer-stamps" class="footer-stamps"></p></footer>
  <div id="action-feedback" class="toast" role="status" aria-live="polite" hidden></div>
  <dialog id="record-sheet" class="sheet sheet--record" aria-labelledby="detail-title">
    <header class="sheet-head">
      <button type="button" id="record-close" class="btn btn--quiet" data-close-sheet>…i-close… Close</button>
      <div class="sheet-head-title"><span id="record-eyebrow" class="eyebrow">Record</span><span id="record-minititle" class="sheet-minititle" aria-hidden="true"></span></div>
      <button type="button" id="record-share" class="icon-btn" data-action="share-record" aria-label="Share this record">…i-share…</button>
      <p id="record-announcer" class="visually-hidden" role="status" aria-live="polite"></p>   <!-- C-46: step announcements -->
    </header>
    <div id="record-body" class="sheet-body"></div>
    <footer id="record-actions" class="sheet-foot">
      <button type="button" id="record-prev" class="icon-btn" data-action="record-prev" aria-label="Previous record in this view">…i-chevron-left…</button>
      <a id="record-source" class="btn btn--primary" href="#" target="_blank" rel="noopener noreferrer" hidden>Read the source</a>
      <button type="button" id="record-next" class="icon-btn" data-action="record-next" aria-label="Next record in this view">…i-chevron-right…</button>
      <div id="record-feedback" class="toast toast--sheet" role="status" aria-live="polite" hidden></div>   <!-- C-36 -->
    </footer>
  </dialog>
  <dialog id="filters-sheet" class="sheet sheet--filters" aria-labelledby="filters-title">
    <header class="sheet-head"><h2 id="filters-title" tabindex="-1">Filters</h2><button type="button" class="icon-btn" data-close-sheet aria-label="Close filters">…</button></header>
    <div id="filters-body" class="sheet-body"></div>
    <footer id="filters-foot" class="sheet-foot"><p id="filters-status" class="visually-hidden" role="status" aria-live="polite"></p></footer></dialog>   <!-- C-47: WP2 adds its buttons once, then patches -->
  <dialog id="stamps-sheet" class="sheet sheet--stamps" aria-labelledby="stamps-title">
    <header class="sheet-head"><h2 id="stamps-title" tabindex="-1">What the dates on this page mean</h2><button type="button" class="icon-btn" data-close-sheet aria-label="Close">…</button></header>
    <div id="stamps-body" class="sheet-body"></div></dialog>
  <noscript><div class="noscript">JavaScript is required to search this index. <a href="public/events.json">Read the published data</a> or <a href="https://github.com/occult-kranti/protest-atlas/blob/main/docs/EDITORIAL_POLICY.md">read the methodology</a>.</div></noscript>
</body>
</html>
```

**Pinned ids** (test_shell): site-header, stamp-chip, primary-nav, data-notice, example-banner, main, view-latest, latest-title, feed-stats, filter-bar, active-filters, result-summary, feed-explainer, event-list, list-more, view-map, map-title, map-regions, map-stage, world-map, map-tooltip, map-controls, map-legend, map-selbar, after-map, country-panel, view-ahead, ahead-title, ahead-root, view-countries, countries-title, countries-root, view-about, about-title, about-stamps, about-discovery, research-scope, about-example, tab-bar, site-footer, footer-stamps, action-feedback, record-sheet, record-close, record-eyebrow, record-minititle, record-share, record-announcer, record-body, record-actions, record-prev, record-source, record-next, record-feedback, filters-sheet, filters-title, filters-body, filters-foot, filters-status, stamps-sheet, stamps-title, stamps-body, icon-sprite. Also pinned: classes `skip-link`, `skip-map`, `ahead-switch`, `feed-actions`, `site-footer--app`; `h1` on every `#<view>-title`; `tabindex="-1"` on `#filters-title` and `#stamps-title`. (Additions of 3 Oct: map-selbar, record-announcer, record-feedback, filters-status.)

View visibility (WP1, CSS):
- `.view { display: none }`;
- `html:not([data-view]) .view[data-view="latest"]` and `html[data-view="X"] .view[data-view="X"]` get `display: block`, or grid at the breakpoints below (selected with `.view[data-view="latest"]`, never `#view-latest`; C-44).

---

## 5. First viewport

The measured target is the visible area above the tab bar. Order is top to bottom; heights are design estimates, and the smoke script measures the real ones.

**360×780** (visible 716 px)
1. Header, 56: brand + two-line chip.
2. Notice, about 100: H1 on 3–4 lines + "What this means".
3. `#feed-stats`, about 112:
   - S1 (14 px muted): "Snapshot assembled 2 Oct 2026, 22:45 UTC · 1 hour ago";
   - S2 (16 px/600): "84 published episodes in 81 of 249 countries and territories · newest evidence dated 2 Oct 2026".
4. `#filter-bar`, about 116: search (48) + Filters button; quick chips row (44, scrolls sideways inside its own container).
5. `.feed-head`, about 136: "Reports" h1 (22 px) left with [Cards | List] right; `#result-summary` "Showing 12 of 84 published records"; the `.feed-actions` row (44): [Copy link to this view] [Download CSV]; "How this list is ordered" (collapsed).
6. First group heading (h2), 24: "Latest evidence within 72 hours (5)". Under it, S3 (3 lines).
7. First card, starting about 645: status line, place line, serif title.
   - **Target:** title visible.
   - **Hard requirement:** the card top is inside the first viewport.

**390×844** (visible 780 px): the same blocks with fewer wraps; the first card starts about 580 and its title ends about 690. **Hard requirement** (2 Oct clock): the first `.card-title` is fully visible above the tab bar (smoke check 17).

**768×1024**
- Single column, max-width 720, centred, with 24 px gutters.
- Header has the one-line chip; the tab bar is still present.
- Notice on 2 lines; S1/S2 one line each.
- The first card and the start of the second are visible.

**1440×900**
- Header (64) with nav + "Coming next" + one-line chip; notice on one line (44) across the full width.
- `.view[data-view="latest"]` becomes a two-column grid, centred, max 1128:
  - **Main column (720):** filter bar, active chips, feed head, list.
  - **Rail column (360, sticky at `top: calc(var(--header-h) + 16px)`):** `.latest-rail` with `#feed-stats` (S1, S2), then `.latest-links`.
- The first two cards are visible. The record opens as a 680 px right drawer under the header.

**Short viewports and zoom** (`(max-height: 500px)`, §17.10): 844×390 and 640×410 (landscape phones), 720×450 (1440×900 at 200 %) and 320×256 (1280×1024 at 400 %).
- The header scrolls away (static); `.ahead-switch` and `.rec-tabs` are not sticky; the tab bar is 48 px with the icon beside the label.
- After the first scroll at least 55 % of the viewport height is content (not fixed chrome); at 320×256 the only fixed chrome is the 48 px tab bar (81 % content).
- No horizontal scroll; the H1 disclosure wraps and is never truncated.
- The record and filter sheets fill the viewport (`inset: 0`), and their head and foot scroll with the body, so no fixed sheet chrome remains.

---

## 6. Reports view (`#view-latest`; WP2 renders, WP3 cards)

### 6.1 `#feed-stats` (S1, S2)

```html
<p class="feed-stat feed-stat--assembled">Snapshot assembled <time datetime="…" data-rel="…" data-format="both">2 Oct 2026, 22:45 UTC · 1 hour ago</time></p>   <!-- S1 -->
<p class="feed-stat feed-stat--scope"><strong>84</strong> published episodes in <strong>81</strong> of <strong>249</strong> countries and territories · newest evidence dated <time datetime="2026-10-02">2 Oct 2026</time></p>   <!-- S2 -->
```

- **Example mode:** "Illustrative example mode: one fictional record. It is excluded from counts, the directory and CSV export."
  - while the example loads: "Loading the illustrative example…";
  - after it fails: "Illustrative example unavailable. Nothing here is reported data."
- **Loading:** "Loading published records…"
- **Events error:** S1 and S2 are omitted (there is no envelope); the list and the notice show E5.
- **Countries-only error:** S2 reads "**84** published episodes · newest evidence dated 2 Oct 2026" (no country or directory counts).

### 6.2 `#filter-bar` and `#active-filters`

```html
<div class="filter-search"><label class="visually-hidden" for="query">Search published records</label>
  <input id="query" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Search issues, places, actors">
  <button type="button" class="icon-btn filter-clear" data-clear-filter="query" aria-label="Clear search" hidden>…</button></div>
<button type="button" class="btn filter-open" data-open-sheet="filters-sheet">…i-filter… Filters<span class="filter-count"> (2)</span></button>
<div class="quick-chips" role="group" aria-label="Quick filters">
  <button type="button" class="chip" data-set-filter="window" data-value="7" aria-pressed="false">Last 7 days</button> … (QUICK_CHIPS)
  <button type="button" class="chip" data-open-sheet="filters-sheet" data-sheet-focus="#country-filter">Country or territory …i-chevron-down…</button></div>
```

- The search field is 48 px tall with 16 px text and a 120 ms debounce. "Filters (n)" shows `activeFilterCount` only when n > 0.
- `.quick-chips` scrolls horizontally inside itself with a 16 px end fade; the page never scrolls sideways.
- `#active-filters`: one removable chip per active filter (`data-clear-filter="<key>"`), for example "Search: housing ×", "France ×", "Last 30 days ×", "Status: Ended / suspended ×", "Issue: Housing ×", "Year: 2025 ×", "City: Lyon ×", "Outcome documented ×". When there are 2 or more, a trailing "Clear all" (`data-clear-filter="all"`) follows. Each chip is at least 44 px tall.
  - Markup: `<button class="chip active-chip" data-clear-filter="country"><span class="visually-hidden">Remove filter: </span>France<span aria-hidden="true"> ×</span></button>`. The accessible name is "Remove filter: France", never "France times".

### 6.3 `.feed-head`

- `#result-summary` (live) reads:
  - "Showing {12} of {84} published records" when no filter is active;
  - "{5} published records match your filters" when all are shown;
  - "Showing {12} of {30} published records that match your filters" otherwise;
  - "1 published record matches your filters".
- The density toggle updates `aria-pressed` and re-renders the list in place.
- **`.feed-actions`** (C-43): two 44 px quiet buttons under `#result-summary`, wrapping onto one row at 360 px:
  - **[Copy link to this view]** (`data-action="share-view"`, `i-link`) runs `share('view')`: filters in the query, view in the hash.
  - **[Download CSV]** (`data-action="export-csv"`, `i-download`) runs `exportCSV()` for the records matching the current filters.
  - When refused, each button has `aria-disabled="true"`, never `disabled`: share in example mode; CSV whenever `!exportAllowed(state).ok` (example mode, loading, error, 0 matches). It stays focusable, is drawn with `--text-muted` text and a dashed border, and pressing it gives the §4.5 explanation.
  - WP2 sets `aria-disabled` on **every** `[data-action="export-csv"]` in the document (Reports and About), on every `[data-action="share-view"]`, and on `#record-share` in example mode.

### 6.4 `#event-list` structure and grouping

Reported mode (`groupByBand` on the filtered list, sorted by `sortByObservation` with ties in file order, C-34; only the first `listLimit` records render):

```html
<div class="feed-gap">                                   <!-- only when emptyBandNotice(all reported events) !== null -->
  <p class="feed-gap-line">{E4}</p>
  <p class="feed-gap-line">{S7}</p>                      <!-- when sweepFact().records.blocked -->
</div>
<section class="feed-group" data-band="fresh" aria-labelledby="feed-group-fresh">
  <h2 class="feed-group-title" id="feed-group-fresh">Latest evidence within 72 hours <span class="feed-group-count">(5)</span></h2>
  <p class="feed-group-note">5 have evidence dated within the last 72 hours. That is not confirmation that they are ongoing.</p>  <!-- S3, fresh group only -->
  <ol class="feed-list"><li class="feed-item">{renderCard}</li>…</ol>
  <p class="feed-group-note feed-group-note--end">{S7}</p>   <!-- when no .feed-gap is shown and the sweep was blocked -->
</section>
{aheadTeaserHTML(...)}                                    <!-- after the FIRST rendered group, reported mode only -->
<section class="feed-group" data-band="older" …><h2 …>Earlier research, 2024–2026 <span>(79)</span></h2>…</section>
```

- **Headings (F6):** "Latest evidence within 72 hours" · "3 to 7 days ago" · "7 to 30 days ago" · "Earlier research, {min}–{max}" · "Evidence date not established". The count in brackets is the group's size in the **filtered** result, not the number shown. A group with zero records never renders.
- **E4** (`emptyBandNotice` over the whole reported snapshot, ignoring filters):
  - fresh empty and week non-empty → "No episode in this snapshot has evidence dated within the last 72 hours. That is a gap in this dataset, not a sign that no protests happened."
  - fresh and week both empty → "No episode in this snapshot has evidence dated in the last 7 days. That is a gap in this dataset, not a sign that no protests happened."
- **S7** comes from data (`sweepFact`, §6.6): "A search for newer reports on {2 Oct 2026} could not open news websites, so no records were added. Recent coverage is especially thin." It appears in `.feed-gap` when E4 shows, otherwise as the closing note of the fresh group. It never appears when the sweep fact is absent or not blocked.
- **Pagination:** `#list-more` shows `<button class="btn" data-action="show-more">Show 12 more ({67} remaining)</button>`. After the click, focus moves to the first new `.card-link`.
- **Example mode:** no groups, no teaser; one `ol.feed-list` with the example card(s).
  - **Example loading** (`load.lazy.examples === 'loading'`): "Loading the illustrative example…" + `renderCardSkeleton(1)`. `#result-summary` is empty.
  - **Example error** (`load.lazy.examples === 'error'`): an `.empty-state` with the h2 "The illustrative example could not load." and the body "Nothing here is reported data.", then `[Retry example]` (`data-retry="examples"`, primary) and `[Back to reported data]` (`data-set-mode="reported"`). `#result-summary` reads "Illustrative example unavailable". Filters are not applied in this state and the true-empty or E1 copy is never shown. The banner stays visible.
- **States** (`aria-busy` true while loading):
  - Loading: "Loading published records…" + `renderCardSkeleton(2)` (aria-hidden).
  - E5 (`load.errors.events`, C-37): "Published records could not be loaded, so coverage is unknown at the moment, not zero." `[Retry]` (`data-action="retry-data"`) and `[Open the published data file]` (link). The same sentence is the notice's `error` line on every view.
  - Countries-only failure: the list renders normally; `.card-place` shows the country code where the name is unknown (for example "**TZ** · Dar es Salaam").
  - E8 (only `query` active, 0 matches): "No published episode mentions '{query}'. Try another word, or browse by country." `[Clear search]` `[Browse countries]` (`#/countries`).
  - E7 (the result is empty and `filters.status` is `ongoing`, `planned` or `needs-review`): "No episode in this snapshot is currently labelled '{label}'. {rule} It does not mean no protests are happening." The label is the status option label. `{rule}` is per status:
    - ongoing: "That label needs evidence dated within 72 hours."
    - planned: "That label applies only to an episode with a sourced future start date."
    - needs-review: "That label applies when a 'Reported ongoing' episode's latest evidence is more than 72 hours old."

    `[Clear filters]`. An empty result with status `ended` or `unknown` gives E1.
  - E1 (any other empty result): "No published episode matches these filters." / "That describes this atlas, not the world. It does not mean no protests happened in this place, on this issue or in this period." `[Clear filters]` `[Browse countries]`.
  - True empty (reported envelope with 0 events): "No episodes are published in this snapshot." `[Browse countries]` `[Explore an illustrative example]` (`data-set-mode="example"`).
  - Every empty or error state is an `.empty-state` whose title is an `h2`.

### 6.5 Ahead teaser (rendered by WP5's `aheadTeaserHTML`, placed by WP2)

```html
<aside class="ahead-teaser" aria-labelledby="ahead-teaser-title">
  <h2 class="ahead-teaser-title" id="ahead-teaser-title">Ahead</h2>
  <a class="ahead-teaser-link" href="#/ahead/actions"><strong>Announced protest actions:</strong> none are listed yet. An empty list does not mean nothing is planned. …i-chevron-right…</a>
  <a class="ahead-teaser-link" href="#/ahead/roadmap"><strong>Coming next to Protest Atlas:</strong> what we are building, what is blocked and what we will not build. …</a>
</aside>
```

- With n > 0 items, the first link reads "**Announced protest actions:** {n} listed. An announcement is not evidence that the action will happen."
- When upcoming.json is absent: "**Announced protest actions:** the list is not published in this snapshot."
- On error: "**Announced protest actions:** the list could not load."
- Signature (C-49): `aheadTeaserHTML({upcoming, load, now})`, where `load` is `state.load`. Absent is `load.errors.upcoming === 'absent'`, error is `=== 'error'`, and while `load.critical === 'loading'` the function returns `''`.
- Styling: two 56 px link rows on a dashed `--border` card. They are not event cards.

### 6.6 `sweepFact({events, upcoming})` (WP2, pure; consumed by WP2 and WP5)

Return `{records: {day, blocked} | null, announcements: {day, blocked, searches, pagesRead} | null}`.
- **`records`:** parse `events.coverage_note` with `/A recent-activity search on (\d{1,2} [A-Z][a-z]{2} \d{4}) logged (\d+) searches but could not open news articles/` → `blocked: true`, with `day` converted to ISO. The variant `/A recent-activity search on (…) read (\d+) source pages/` → `blocked: false`.
- **`announcements`:** parse `upcoming.note` with `/Latest search for announcements: (\d{4}-\d{2}-\d{2}), (\d+) searches logged, (\d+) source pages could be opened/` → `blocked = pagesRead === 0`.
- No match → `null`. Hard-coded dates are forbidden.

Today's data parses to `{records: {day:'2026-10-02', blocked:true}, announcements: {day:'2026-10-02', blocked:true, searches:167, pagesRead:0}}`; test_core asserts this.

---

## 7. Record card (`renderCard`, WP3)

### 7.1 Root

```html
<article class="card" data-id="tz-drivers-20260929" data-status="ended" data-band="fresh" data-ended="true" data-density="card">
```

`container-type: inline-size`. Surface `--bg-raised`, 1 px `--border`, `--r-2`, padding 16 px (20 at ≥ 600), 12 px between cards. An ended record adds a 1.5 px `--border-strong` border + `box-shadow: 5px 5px 0 var(--ended-shadow)`. There is no other shadow and no hover lift (a `(hover:hover)` border darken is allowed).

### 7.2 Default density "Cards" (compact label-column), top to bottom

| # | Element | Markup / copy | Rules |
|---|---|---|---|
| 0 | Example watermark (example mode) | `<p class="card-watermark">Illustrative example • not a real event</p>` (C11) | Striped `--example-ink` band, white text |
| 1 | Status (leads) | `<p class="card-status"><span class="status" data-status="ended">Ended / suspended 30 Sep 2026</span></p>` | `statusLabel(displayStatus, event)`: ST1–ST5. Always first. |
| 2 | Place (C1) | `<p class="card-place"><strong>Tanzania</strong> · Dar es Salaam</p>` | Drop the label when it equals the country name. |
| 3 | Title | `<h3 class="card-title"><a class="card-link" href="#/record/{id}" data-open-record="{id}">{title}</a></h3>` | Serif, `clamp(18px, 2.5vw + 10px, 22px)`/1.25, 600. The link is stretched (`::after { inset: 0 }`) over the card. **No chevron.** |
| 4 | Latest evidence (C2) | `<p class="card-when">Latest evidence <time …>1 Oct 2026 · yesterday</time> <span class="band" data-band="fresh"><span class="band-text" aria-hidden="true">Within 72 h</span><span class="visually-hidden">Latest evidence dated within the last 72 hours</span></span></p>` | `timeTag(last_observed_at, now, 'both')`; badge F1–F5 after the date. The long F-label is visually hidden text, never `aria-label` on a `<span>` (C-51). Tests read the visible badge from `.band-text`. The same markup is used in the record meta. |
| 5 | Issues (C3) | `<p class="card-issues"><span class="visually-hidden">Issues: </span>Transport · Labour</p>` | As recorded, 14 px, `--text-2` |
| 6 | Facts | `<dl class="card-facts">` with four `<div class="card-fact">` rows, below | Label column 104 px when the card is at least 340 px wide (container query); below that, label above value |
| 6a | Timeframe (C5) | `<dt>Timeframe</dt><dd>29 Sep – 30 Sep 2026 (2 days) · ended / suspended</dd>` | §7.6 `timeframe` |
| 6b | For / against (C4, C10) | `<dt>For / against</dt><dd><ul class="card-sides"><li><span class="side-pill" data-stance="oppose">Against</span> 15-point licence system — Bus and truck drivers</li></ul><p class="card-more">+1 more position recorded</p></dd>` | At most 2 positions shown, in recorded order; never clamped; empty → "No position is recorded in this record." |
| 6c | Intensity (C6) | `<dt>Intensity</dt><dd>…</dd>` | All three not established → one line: "Turnout, disruption and violence: not established in this record." Otherwise `<ul class="facet-list">` with three items in fixed order: "Turnout: {text \| not established}" · "Disruption: …" · "Violence or harm: …". Verbatim, never clamped. |
| 6d | Police / state (C7) | `<dt>Police / state</dt><dd>Government suspended points system and opened a review — The Chanzo's reporting</dd>` | Each entry is "{action} — {attribution}"; none → "Not established in this record". Never clamped. |
| 7 | Outcome teaser (C9) | `<p class="card-outcome">What changed: {first documented outcome summary}</p>` | Only when `outcome_status === 'documented'`; the **only** element that may be clamped (2 lines) |
| 8 | Evidence (C8) | `<p class="card-evidence">{sourceLink(sources[0], publisher)} · published 1 Oct 2026 · Corroborated · 2 links · AI-assisted check</p>` | The publisher link is the external primary-source link (new tab, "(opens in a new tab)") and sits above the stretched link (`position: relative; z-index: 1`). A missing date → "publication date not given". |

Measured target: 430–560 px per card at 390 (smoke reports it). Ended records use the shadow treatment in §7.1.

### 7.3 Stance pill (`.side-pill`)

- Text: "For", "Against", "Mixed" or "Unclear" on cards. In the detail: "For", "Against", "Mixed position on", "Position unclear on".
- One style for all four: 1 px solid `--border-strong`, transparent background, `--text`, 12 px/700 uppercase with .06em tracking, 22 px tall, `--r-1`, padding 0 6 px.
- No hue, no fill difference, no glyphs.
- `data-stance` exists only as a test hook; **no CSS may select on it.**

### 7.4 Intensity "not established" detection (exact, editorial §6.2)

`NOT_ESTABLISHED = {disruptionViolence: ['unknown','not established','not established by this record','disruption not established by this record','violence not established by this record'], turnout: ['not established','no reliable event-wide count established','no single verified numerical estimate adopted','no verified numerical estimate retained','reliable comparable count not established']}`.

- Comparison: `text.trim().toLowerCase().replace(/\.$/, '')`.
- Turnout counts as not established only when `min` and `max` are both null **and** the qualifier is on the turnout list.
- Numbers are formatted only from `min`/`max` ("At least 1,000" / "Up to 2,000" / "1,000–2,000", followed by the qualifier); prose is never parsed.
- Anything else is described and shown verbatim. In the 2 Oct snapshot this gives **33** records with all three undescribed (computed in the test; editorial estimated 34). es-housing disruption and as-noaa disruption count as **described**.

### 7.5 "List" density (`data-density="row"`)

Order (C-51; both densities carry C1–C8):
1. `.card-status` + `.card-when` on one wrapped line (status first).
2. C1.
3. Title (serif 17 px).
4. C3 `.card-issues` (as on cards).
5. `ul.card-sides` (at most 2 + C10).
6. `<p class="card-row-facts"><span class="card-row-label">Timeframe:</span> {timeframe().line} · <span class="card-row-label">Intensity:</span> {intensitySummary().line}</p>`: one wrapped line, never clamped.
7. `<p class="card-row-state"><span class="card-row-label">Police / state:</span> {C7}</p>`.
8. C8 evidence line.

Only the C9 outcome teaser is omitted. Padding 12 px; rows are separated by a 1 px rule instead of card boxes; the ended shadow is replaced by a 4 px `--border-strong` left rule plus the ST4 status. The density toggle's group label stays "Record layout"; both layouts show the same facts.

### 7.6 `record-facts.js` outputs (frozen for test_record)

- **`positionView(p)`** → `{stance, pill: 'For'|'Against'|'Mixed'|'Unclear', pillLong: 'For'|'Against'|'Mixed position on'|'Position unclear on', target: p.target || 'target not established', actor, claim, sourceIds}`. Unknown stance → "Unclear".
- **`positionSentence(p)`** → `"${pill} · ${target} — ${actor}"`, for example "Against · Yoon’s removal — Pro-Yoon demonstrators".
- **`positionList(event)`** → `positionView[]` in recorded order (no grouping, no counts).
- **`intensityFacets(event)`** → `[{key:'turnout', label:'Turnout', text, known, sourceIds}, {key:'disruption', label:'Disruption', …}, {key:'violence', label:'Violence or harm', …}]`. When `known === false`, `text = 'Not established in this record'`.
- **`intensitySummary(event)`** → `{allUnknown: boolean, line: string, items: [{label, text}]}`. The card uses "not established" (lower case) for unknown items. `line` is "Turnout, disruption and violence: not established in this record." when `allUnknown`, otherwise "Turnout: {text} · Disruption: {text} · Violence or harm: {text}", with "not established" for unknown items (used by the glance and the List density).
- **`stateActionSummary(event)`** → `{present, items: [{action, attribution, sourceIds}], text}`. `text` = C7 joined with "; ", or "Not established in this record".
- **`timeframe(event, context, now)`** → `{line, onset, end, latestEvidence, band, spanDays}`. `line` follows the editorial §8 templates, with the ended suffix harmonised to "ended / suspended":
  - start = end: "19 Nov 2024 (one day) · ended / suspended"
  - start and end: "29 Sep – 30 Sep 2026 (2 days) · ended / suspended", or "21 Dec 2025 – 4 Jan 2026 (15 days) · ended / suspended" across years
  - start only: "From 1 Oct 2026 · end not established"
  - end only: "Onset not established · ended 30 Sep 2026"
  - neither, with 2 or more distinct timeline dates: "Dated evidence 21 Dec 2024 – 4 Apr 2025 · onset and end not established"
  - one timeline date: "Dated evidence 2 Oct 2026 only · onset and end not established"
  - no dates: "Onset and end not established"

  Durations are inclusive day counts from start and end only, never from the timeline. "Since" is never used.
- **`evidenceLine(event)`** → `{publisher, url, published, levelLabel, linkCount, text}`, where `text` is C8 without the link markup.
- **`primarySource(event)`** → `{url, publisher, label}`. `label` = `Read ${publisher}` if the publisher is 24 characters or fewer, else "Read the source". `url` is '' when there is no safe URL.

---

## 8. Record detail sheet (`#record-sheet`; WP1 chrome, WP3 body, WP2 behaviour)

### 8.1 Chrome and geometry

| Width | Geometry |
|---|---|
| < 900 | `inset: 40px 0 0 0`, full width, height `calc(100dvh - 40px)`, radius 16 px on top, `--shadow-2`; backdrop `rgb(0 0 0 / .45)` (the dimmed header stays visible behind it) |
| ≥ 900 | Right drawer `top: var(--header-h); right: 0; bottom: 0; width: min(680px, 100vw - 240px)`, radius `16px 0 0 0`, no grab bar; backdrop `rgb(0 0 0 / .30)` |
| `max-height: 500px` (any width) | `inset: 0`, full viewport, no radius. The **dialog** is the scroll container (`overflow: auto`); `.sheet-head`, `.rec-tabs` and `.sheet-foot` are static and scroll with the body (§17.10). `sheetScroller(dialog)` returns the dialog here and `.sheet-body` otherwise (C-42). |

Side padding of head, body and foot is `max(16px, env(safe-area-inset-left/right))`.

- **Head** `.sheet-head` (56 px, sticky in the dialog flex column):
  - `[× Close]` at the start;
  - the centre stacks `#record-eyebrow` and `#record-minititle` (serif 16 px, single-line ellipsis, the record title). Eyebrow text:
    - "Record {2} of {84} in this view" when the id is in `selectFiltered(state)`;
    - "Record" when it is not (opened from Ahead "Related episode", a brief, or a deep link outside the filters); prev and next are then `hidden` (C-46);
    - "Illustrative example" in example mode;
  - `[Share]` (`#record-share`) at the end.
- **Mini title:** when `#detail-title` scrolls out of view, `dialog[data-scrolled="true"]` cross-fades the eyebrow out and the mini title in (opacity, `--dur-2`; instant under reduced motion). The mini title is a duplicate of the h2, so it carries `aria-hidden`.
- **Foot** `.sheet-foot` (64 px + safe area): `[‹]` `#record-prev` · `#record-source` primary ("Read Al Jazeera, with AP …" is too long, so it reads "Read the source", with `aria-label="Read the source: {publisher} (opens in a new tab)"`) · `[›]` `#record-next`. `#record-source` is hidden when there is no safe URL. `#record-feedback` sits above the foot (§4.5).
- **Stepping** (C-46): at the ends prev or next gets `aria-disabled="true"` (never `disabled`, so focus stays on it) and pressing it does nothing. A step replaces the body, sets `sheetScroller(recordSheet).scrollTop = 0`, keeps focus on the pressed button, updates the eyebrow and mini title, and writes "{title}. Record {i} of {n} in this view." to `#record-announcer`.
- **Open/close semantics:** tech §2.3; focus goes to `#detail-title` (no ring on programmatic focus).
- **`mountRecordChrome(dialog)`** handles the scroll-spy (an IntersectionObserver on `section[id^="rec-"]` with **`root: dialog`**, so it works whether `.sheet-body` or the dialog scrolls; it sets `aria-current="true"` on the matching `.rec-tabs` link) and the mini-title flag. `refresh()` runs after each render.
- **Targets never hide under the sticky tabs** (WCAG 2.4.11): WP1 sets `.sheet--record .sheet-body { scroll-padding-top: 52px }` (44 px tabs + 8), reset to 8 px under `max-height: 500px`, where the tabs are not sticky. Every `data-scroll-to` jump (glance cells, tabs, "Source N" refs to `#detail-source-N`, `#rec-intensity-help`) uses `scrollIntoView({block: 'start'})`, which honours that padding, and then focuses the target.

### 8.2 Body order (`renderRecord`)

0. Example banner (example mode): C11 + "This record is fictional and is excluded from counts and export."
1. `<p class="rec-disclosure">…i-info… AI-assisted source check · no human editorial review</p>` (**D1**, always).
2. `.rec-meta`: `<span class="status rec-status" data-status>ST label</span>` then `Latest evidence <time>2 Oct 2026 · today</time>` + `.band` badge (status leads).
3. `.rec-place`: "{Country} · {location label} · {city-level | region-level | country-level | several locations}".
4. `<h2 id="detail-title" tabindex="-1">{title}</h2>` (serif 28/1.15).
5. `#temporal-update` needs-review note when the display status is `needs-review`: "Needs review: the latest evidence for this record is more than 72 hours old, so it can no longer be labelled 'Reported ongoing'. Its current status is not established." `patchRecordStatus` inserts this note.
6. `section#rec-overview` (D3 + D2):
   - `<p class="rec-summary">{summary}</p>`;
   - issue tags;
   - `.rec-glance` (§8.3);
   - `<p class="rec-scope"><strong>Scope of this record:</strong> {episode_scope}</p>` (when there is context).
7. `nav.rec-tabs[aria-label="Record sections"]` (sticky, `top: 0` inside `.sheet-body`; static under `max-height: 500px`; 44 px; scrolls sideways): Overview · For/against · Intensity · Police/state · Outcome · Timeline · Sources (`<a href="#rec-…" data-scroll-to="rec-…">`).
8. `section#rec-positions`: D4 "Who is for or against what" + D4-sub + entries (§8.5).
9. `section#rec-intensity`: D5 "Reported intensity" + D5-sub + three rows (§8.6).
10. `section#rec-state`: D6 "Police and state response" + D6-sub + entries or D6-empty (§8.7).
11. `section#rec-outcome`: `outcomeHTML(event, context)` (D7; pinned strings unchanged). WP3 may drop the "RESULTS / FOLLOW THE CHANGE" eyebrow and must add `data-scroll-to` to its refs.
12. `section#rec-timeline`: D8 (§8.9).
13. `section#rec-sources`: D9 "Evidence and verification" + D10 "Sources" (§8.8) + "Record ID: {id}" + "Report a correction ↗" (`{REPO_URL}/issues/new/choose`) + "Please do not post private details about participants."

### 8.3 Glance, "At a glance" (D2, 4 cells)

`<div class="rec-glance" role="group" aria-labelledby="rec-glance-title"><h3 id="rec-glance-title" class="rec-glance-title">At a glance</h3>` + four `<a class="rec-glance-cell" href="#rec-…" data-scroll-to="rec-…">` cells:

| Cell label | Value |
|---|---|
| For / against | First 2 positions as C4 lines + C10, or "No position is recorded in this record." |
| Intensity | The C6 line (same as the card) |
| Police / state | C7, full (no clamp) |
| Timeframe | The `timeframe().line` + "Latest evidence {date}" |

The Intensity cell uses `intensitySummary().line`.

Layout: a single column of four rows when the container is narrower than 520 px; 2×2 at 520 px and above. Each cell has 1 px gutters (`--border`), a 12 px caps label, a 14/1.45 value, and is at least 72 px tall.

### 8.4 Section headings

Each section is `<h3 class="rec-h">` with an optional `<p class="rec-sub">`. The visible headings are exactly D3–D10.

### 8.5 Positions (D4)

D4-sub (verbatim): "Each line is one actor's position toward a named target, as reported in the cited source. 'For' and 'against' only mean something with their target. A government, party or company position is a response, not a counter-protest. Positions are not head-counts and do not show which view has more support."

Per position:

```html
<li class="rec-position"><p class="rec-actor">Junts lawmakers</p>
  <p class="rec-stance"><span class="side-pill">Against</span> Proposed housing decrees</p>
  <p class="rec-claim"><span class="rec-claim-label">As reported:</span> Argued the measures would constrain the rental market; parliamentary position, not a counterprotest.</p>
  <p class="rec-refs">{sourceRefs}</p></li>
```

The list is a single column in recorded order. Claims are never in quotation marks.

### 8.6 Intensity (D5)

- D5-sub verbatim.
- Three `.facet` rows in fixed order: Turnout · Disruption · Violence or harm. Each value is verbatim or "Not established in this record" followed by `<a href="#rec-intensity-help" data-scroll-to="rec-intensity-help">What this means</a>`, where `#rec-intensity-help` is the D5-sub paragraph.
- Under the Violence or harm row: D5-violence-note.
- Then the shared source line, "Source: {sourceRefs(intensity.source_ids)}", or D5-no-source.

### 8.7 Police and state (D6)

- D6-sub verbatim.
- Per entry: `<p class="rec-action">{action}</p><p class="rec-attribution">Reported by: {attribution}</p>{refs}`.
- No entries: a dashed box with D6-empty, "No police or state response is recorded in this record. That is not evidence that none occurred."

### 8.8 Evidence and sources (D9, D10)

D9 is a `dl`:
- "Verification: {Single source | Corroborated | Contested}" + explainer:
  - Single source: "One newsroom or reporting chain, however many links. Two copies of one wire story count as one source."
  - Corroborated: "The AI-assisted check found more than one independent source for key claims. This is not independent human verification."
  - Contested: "Sources disagree on key claims; the record keeps both accounts."
- "Source re-read (AI-assisted): {timeTag(last_verified)}"
- "Latest evidence: {date · relative}"
- Then `verification.note`.

D10 is an `<ol class="source-list">` of `<li id="detail-source-N" tabindex="-1">`. Every `.source-ref` ("Source N") in the record is `display: inline-flex; align-items: center; min-height: var(--tap); padding-inline: 8px` (WP3). Each item reads `{sourceLink(source, title)} — {publisher} · published {date | date not given} · opened {accessed_at absolute}`. Under the list: "Source count is not a confidence score."

### 8.9 Timeline (D8)

- D8 + sub: "Dated entries only. Gaps between dates are not assumed activity."
- Then the `timeframe().line`.
- Then `<ol class="rec-timeline">` items `<li><span class="rec-mark" aria-hidden="true"></span><time>{day}</time> {text} {refs}</li>`. Marks are 10 px ink dots with **no connecting line or bar**. An unknown onset appears as the first item "Onset not established", with an open bracket `[` mark (outline only).
- Then the rule note: "'Reported ongoing' needs evidence dated within the last 72 hours. A newer source re-read alone cannot renew it."

---

## 9. Filter sheet (`#filters-sheet`; WP2 content, WP1 chrome)

- Geometry: < 900 bottom sheet (max-height 92dvh, radius 16, decorative 36×4 grabber, aria-hidden); ≥ 900 right drawer, 440 px, under the header.
- Live apply, with no draft state.
- `#filters-body` is built once per data or mode change, and then patched in place.

```html
<form class="filter-form" novalidate>
  <fieldset id="window-filter" class="filter-group filter-segment"><legend>Latest evidence</legend>
    <label><input type="radio" name="window" value="all"><svg class="icon filter-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg> Any date</label><label><input type="radio" name="window" value="7"><svg class="icon filter-check" …></svg> Last 7 days</label><label><input type="radio" name="window" value="30"><svg class="icon filter-check" …></svg> Last 30 days</label>
    <p class="filter-help">Uses the date of each episode's latest sourced activity or development, never publication or check time.</p></fieldset>
  <fieldset id="status-filter" class="filter-group filter-rows"><legend>Status</legend>
    <label><input type="radio" name="status" value=""> Any status <span class="filter-n">(84)</span></label>
    <label><input type="radio" name="status" value="ended"> Ended / suspended <span class="filter-n">(18)</span></label>
    <label><input type="radio" name="status" value="unknown"> Current status not established <span class="filter-n">(66)</span></label>
    <!-- needs-review / ongoing / planned rows exist only when count > 0 or currently selected (statusOptions) -->
    <p class="filter-help">'Reported ongoing' needs evidence dated within the last 72 hours.</p></fieldset>
  <div class="filter-field"><label for="country-filter">Country or territory</label><select id="country-filter"><option value="">All countries and territories</option>…249 A–Z…</select></div>
  <div class="filter-field"><label for="region-filter">Region</label><select id="region-filter"><option value="">Any region</option>…regions in data, A–Z, no counts…</select></div>
  <div class="filter-field"><label for="issue-filter">Issue</label><select id="issue-filter"><option value="">Any issue</option>…A–Z, no counts…</select>
    <p class="filter-help">Issue tags are not yet normalised: Labor and Labour are separate tags.</p></div>
  <fieldset class="filter-group"><legend>History</legend>
    <div class="filter-field"><label for="year-filter">Year of dated evidence</label><select id="year-filter"><option value="">Any year</option>…availableYears…</select></div>
    <div class="filter-field"><label for="outcome-filter">Outcome</label><select id="outcome-filter"><option value="">Any</option><option value="documented">Outcome documented</option><option value="not-established">Outcome not established</option></select></div>
    <div class="filter-field"><label for="city-filter">City</label><select id="city-filter"><option value="">Any city</option>…cityOptions(country)…</select>
      <p class="filter-help">City points are approximate references, not protest sites.</p></div></fieldset>
  <p class="filter-roadmap">Custom date ranges are a later item on the roadmap. <a href="#/ahead/roadmap" data-close-sheet>See Coming next</a></p>
</form>
```

- Radio rows are 48 px. The segmented window control has three equal 48 px segments, with the radio visually hidden (`.visually-hidden`, still focusable) and the label as the target.
  - **Keyboard focus is drawn on the label:** `.filter-segment label:has(input:focus-visible) { outline: 3px solid var(--focus-ring); outline-offset: 2px }`.
  - **The checked segment is marked by more than colour:** `--accent` fill with `--accent-ink` text, **plus** the `.filter-check` icon (`i-check`), which is shown only on `label:has(input:checked)`, **plus** a 2 px inset border (`box-shadow: inset 0 0 0 2px var(--border-strong)`).
- **Boundaries** (WCAG 1.4.11): `input`, `select`, `.filter-segment` and unpressed `.chip` use a 1 px `--border-input` border (3.81:1 on `--bg` and 4.12:1 on `--bg-raised` in light; 5.28:1 on `--bg-raised` in dark). `--border` stays for hairlines only.
- Selects are 48 px with 16 px text.
- **The roadmap link** `<a href="#/ahead/roadmap" data-close-sheet>` closes the sheet and then navigates; sheet.js never calls `preventDefault` on an `<a href>` with `data-close-sheet` (C-47). The router then focuses `#ahead-roadmap-title`.
- **Initial focus:** `#filters-title` (`tabindex="-1"`), unless the trigger names `data-sheet-focus`.
- **Events error** (`load.errors.events`): `#filters-body` shows only "Filters are unavailable because published records did not load." with `[Retry]` (`data-action="retry-data"`); the footer shows only `[Close]` (`data-close-sheet`).
- Context failure: the city and outcome selects are disabled, with the note "City and outcome filters are unavailable because record context could not load."
- **`#filters-foot`:** `[Clear all]` (`data-clear-filter="all"`, quiet button) · `[Show {n} records]` primary (`data-close-sheet`). The label is "Show 1 record", or "Close · no records match" when n = 0. WP2 renders both buttons **once**, before the static `#filters-status`, and then patches only their labels.
- **`#filters-status`** (static, visually hidden, `role="status"`): `#result-summary` is inert behind the modal, so WP2 writes the count here after each patch: "{n} records match" · "1 record matches" · "No records match". Text that has not changed is not rewritten.

---

## 10. Dates sheet (`#stamps-sheet`) and `#about-stamps` (WP2)

- Geometry: < 600 bottom sheet (auto height, max 92dvh); ≥ 600 a centred modal (560 px, max 80dvh); under `max-height: 500px` full viewport (§17.10). Initial focus: `#stamps-title` (`tabindex="-1"`).
- `#stamps-body` renders, in order:
  - intro: "Each date answers a different question. None of them shows that a protest is still going on."
  - `<dl class="stamp-list">` rows (`stampItems`). Each row: label (16/700), value (`timeTag 'both'`, tabular numerals), explainer (14 px muted).

| Row | Value | Explainer (T4 = editorial §4 verbatim unless marked) |
|---|---|---|
| Snapshot assembled | 2 Oct 2026, 22:45 UTC · 1 hour ago | "When the published records were last compiled and validated by the AI-assisted pipeline. Not a time when protests were checked, and not proof that anything new was added." |
| AI-assisted review pass (only when it differs from assembly) | timestamp | "An AI-assisted integration review. No human editorial sign-off." |
| Newest evidence | dated 2 Oct 2026 · today | "The most recent date on which a cited source reports protest activity or a development in an episode. Day precision." |
| Latest source re-read | 2 Oct 2026, 21:25 UTC · 1 hour ago | "When an AI-assisted check last opened an article already cited by a record. Re-reading old reporting never makes a protest current." |
| Announced-actions list compiled | 2 Oct 2026, 22:45 UTC · 0 items (or "Not published in this snapshot" / "Could not load") | "Compilation time of the list only. The note under the list says when announcements were last searched and what that search could read." |
| Site built | timestamp · commit 1a2b3c4 (link); build-info absent: "Not available in this preview" (T2); build-info malformed (`load.errors.build === 'error'`): "Site build stamp could not be read" | "When this website's code was deployed. A new build never adds or re-checks reports." |
| Lead-discovery audit (loaded lazily when the sheet first opens) | GDELT artifact created 2 Oct 2026, 19:27 UTC · 97 unverified leads. While loading: "Loading…"; on failure: "Discovery audit unavailable." (from `extras.discoveryLoad`, C-03) | "A one-time audit of one automated lead list. Leads are never published automatically. It does not show whether the discovery service is working today." (§18.2) |
| Human editorial review | Not completed | "No human editor is enrolled in this pilot." |

Then S7 (when blocked), then T5: "Event dates are days, as reported. We do not invent times of day. Re-reading a source, assembling the snapshot or rebuilding the site never makes a protest more recent."

---

## 11. Map view (`#view-map`; WP4) and country brief

### 11.1 Layout

- **< 900:** single column:
  - view head;
  - `#map-regions` chip row (World · Africa · Americas · Asia · Europe · Oceania, 44 px, `aria-pressed`, **no counts**);
  - skip link;
  - stage;
  - `#map-selbar` (in flow, outside the clipped stage; C-39);
  - legend;
  - brief.
- **≥ 900:** `.map-layout` grid `minmax(0, 2fr) minmax(320px, 1fr)` with a 32 px gap. `#country-panel` is sticky (`top: calc(var(--header-h) + 16px)`, max-height `calc(100dvh - var(--header-h) - 32px)`, `overflow: auto`).
- **Stage:** `.map-stage` (position relative, `--map-ocean` background, `--r-2`, overflow hidden) with `aspect-ratio: 16 / 10` below 900 and `1000 / 448` at 900 and above. **Decision (C-41, option b):** `.world-map` and its svg **fill the stage** (`width: 100%; height: 100%`) with `viewBox="0 0 1000 448"` and `preserveAspectRatio="xMidYMid meet"` (tech §5.1). Below 900 the land therefore sits in a centred 1000:448 band with ocean above and below, and zoomed content and Explore use the whole stage. Smoke check 6 asserts the viewBox and the k = 1 land box (§22.2), not the svg box aspect, except at 1440, where the two agree.
- **Explore on:** `.map-stage[data-explore="true"]` height `min(70svh, 560px)` (aspect-ratio unset).
- **Unavailable** (`.map-stage[data-map-state="unavailable"]`, also set when `import('./js/map-view.js')` rejects): `aspect-ratio: auto`, so E6 and its two buttons fit at 320 px. `#map-regions`, the zoom buttons, World and Explore are `hidden`. `#map-selbar` stays hidden, and the legend shows only M8 and M7 (§11.5).
- **Events error** (`load.errors.events`, C-37): map-view calls `map.update({error: true})`. Land renders neutral (`--map-land`, no ochre, no hatch, no selection) and the legend is replaced (§11.5). Region chips and zoom stay usable.
- **Example mode:** `<p class="map-watermark">Illustrative example • not a real event</p>` (C11) is absolutely positioned at the top-left of the stage (`pointer-events: none`, the striped §4.3 treatment). While the example loads or after it fails, land renders neutral (as for the events error) and the legend reads "Illustrative example unavailable" on failure (§11.5).

### 11.2 Controls (`#map-controls`)

`#map-controls` holds only the overlay controls below (C-39).

- **`.map-zoom`** (absolute, top-right, 8 px inset): `#zoom-in` (+), `#zoom-out` (−) and `#reset-map` ("World", with an i-world icon and visible text). Each is 44×44 on `--bg-raised` with a 1 px `--border-input`. Enabled state follows `zoomButtonState`.
- **`#map-explore`** (absolute, bottom-left): "Explore map" or "Done exploring" (`aria-pressed`). Exploring sets gestures to `'map'`. It exits on: route change, Escape, the stage leaving the viewport (IntersectionObserver, threshold 0), or the button.
- **`.map-hint`** (first child of `#map-legend`, 14 px muted):
  - coarse pointer: "One finger scrolls the page. To move the map, pinch with two fingers, use + and −, or turn on Explore map."
  - fine pointer: "Drag to move the map. Use + and −, or Ctrl and scroll, to zoom."
  - Transient tooltip on a one-finger horizontal drag in page mode (shown once per session, in `#map-tooltip`): "Use two fingers, or Explore map, to move the map."
- **Selection bar** (rendered by WP4 into `#map-selbar`, which is in flow between the stage and the legend; `hidden` unless a country is selected): "{France} · {2 published episodes match}" + `[See brief]` (`<a href="#country-panel" data-scroll-to="country-panel">`, < 900 only) + `[World]` (`data-clear-filter="country"`).
- **Lazy-import failure:** if `import('./js/map-view.js')` rejects, app.js (WP2) renders E6 into `#map-stage` itself, sets `data-map-state="unavailable"`, and wires its own `[Retry map]`, which re-runs the dynamic import. It also sets `hidden` on `#map-regions` and leaves `#map-legend` holding only M7 and M8 (static strings from §11.5). `data-action="retry-map"` stays a map-view.js action once the module has loaded.

### 11.3 Drawing (tech §5 plus C-17)

- Fill stays binary coverage: `--map-reported`, gap = hatch pattern on `--map-land`, `--map-example` in example mode.
- **Selection** = the overlay paths: `.map-selection-halo { fill:none; stroke: var(--map-selected-halo); stroke-width: 5; vector-effect: non-scaling-stroke }` and `.map-selection { fill:none; stroke: var(--map-selected); stroke-width: 2.5; vector-effect: non-scaling-stroke }`.
- **Ended shadow:** an SVG `feDropShadow` with `flood-color: var(--map-shadow)`. `map.js` sets `dx = dy = 1.6 / (k · unitPx)` on each zoom so the offset stays about 1.6 CSS px.
- **City dots:** visual radius `3.5/(k·unitPx)` (ink, with a 1 px `--map-land` ring); hit circle 12 CSS px; labels at 12 CSS px with greedy collision culling (try right, then left, then drop the label; the dot stays). Shown only for the selected country, or for any country when k ≥ 3.
- **Focus framing:** largest-cluster mainland (tech §5.4). FR frames mainland France.
- **Keyboard focus ring** (C-40): drawn as overlay clones, never as a stroke on the path, so the selection outline cannot hide it. On `focusin` of a `.map-country`, map.js appends `path.map-focus-halo { fill: none; stroke: var(--map-selected-halo); stroke-width: 6; vector-effect: non-scaling-stroke }` and then `path.map-focus-ring { fill: none; stroke: var(--map-focus); stroke-width: 3; vector-effect: non-scaling-stroke }` as the **last** children of `g.map-overlay` (after `.map-selection-halo` and `.map-selection`). On `focusout` it removes both. The ring is 6.19:1 against the halo in light and 8.90:1 in dark, and 5.60:1 against `--map-land` in light.

### 11.4 Keyboard and accessibility

Tech §5.5 exactly: `role="group"`, `aria-describedby="map-help"` (the visually hidden help text from tech), roving tabindex, `nextInDirection`, skip link. No `role="application"`. Focus is shown by the C-40 overlay ring (§11.3), so it stays visible on the selected country, which is the path that holds `tabindex="0"` when the keyboard enters the map.

### 11.5 Legend (`#map-legend`; M1–M9 verbatim)

```html
<h2 class="legend-title">What the colours mean</h2>                                     <!-- M1 -->
<ul class="legend-list">
  <li><i class="legend-swatch" data-kind="reported"></i>Published episode matches your filters</li>   <!-- M2 (example mode: "Illustrative example country (fictional record)") -->
  <li><i class="legend-swatch" data-kind="gap"></i>No published episode matches. A coverage gap, not 'no protests'</li> <!-- M3 -->
  <li><i class="legend-swatch" data-kind="selected"></i>Selected</li>                    <!-- M4: outline swatch -->
  <li><i class="legend-swatch" data-kind="ended"></i>Shadow: includes a sourced ended or suspended episode. It does not mean the movement ended or won</li> <!-- M5 -->
  <li><i class="legend-swatch" data-kind="city"></i>City reference point (approximate). Not a protest site</li>   <!-- M6 -->
</ul>
<p class="legend-note">Small territories are not drawn at this scale. Use the country list</p>      <!-- M7 + link to #/countries -->
<p class="legend-note">Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe.</p> <!-- M8 -->
<p class="legend-note" data-kind="window">Showing episodes with latest evidence in the last {7|30} days</p>  <!-- M9, only when window ≠ all -->
```

When cities.json fails: add "City points could not load; city names stay in records and filters."

Legend variants:
- **Events error** (C-37): the list and notes are replaced by `<p class="legend-note" role="status">Coverage cannot be shown because published records did not load.</p>` + `[Retry]` (`data-action="retry-data"`). The hint stays.
- **Example loading:** M2 reads "Loading the illustrative example…".
- **Example error:** "Illustrative example unavailable" replaces M2–M5, followed by `[Back to reported data]` (`data-set-mode="reported"`).
- **Map unavailable:** only M7 and M8 remain.

### 11.6 `#country-panel`

**World overview** (no country selected):
- `<h2 id="country-panel-title">World</h2>`;
- `<p class="brief-lead" role="status">` "Published episodes in {81} of {249} countries and territories{ match your filters}.";
- `<h3>Most recent evidence</h3>` with 5 `button.brief-country[data-select-country]` rows "{Country} · latest evidence {date}". These are the five most recently observed, **not** a ranking by count;
- `<a href="#/countries">All {249} countries and territories, A to Z</a>`.
- Example mode: "Illustrative example: one fictional record."
- Events error: the lead reads "Coverage cannot be shown because published records did not load." and the five rows are omitted.
- `button.brief-country` rows and `ul.brief-records` links are at least `var(--tap)` tall.

**Country brief** (`briefModel`):

```
COUNTRY BRIEF · EUROPE                       (eyebrow)
France                                       (h2#country-panel-title, serif 28)
{lead, role=status}
  (a) records match: "2 published episodes." (no filters) / "2 published episodes match your filters." + "Includes a sourced ended or suspended episode." when applicable
  (b) E3: "France has 2 published episodes, but none match your current filters."  [Show all for France] (data-action="clear-except-country")
  (c) E2: "Iceland: no published episode in this atlas." + the second sentence by ledger status (C-50):
      searched:          "A first search was logged on 2 Oct 2026 (5 results, not reviewed). This is a coverage gap, not evidence that no protests occurred."
      search failed:     "A first search on {2 Oct 2026} failed, so {Iceland} has not been checked yet. This is a coverage gap, not evidence that no protests occurred."
      not yet searched:  "{Iceland} has not been searched yet. This is a coverage gap, not evidence that no protests occurred."
      ledger loading:    "Checking the search log…"
      ledger failed:     "The search log could not load, so whether {Iceland} was searched is not shown here. This is a coverage gap, not evidence that no protests occurred." + [Retry] (data-retry="research")
  events error: "Coverage cannot be shown because published records did not load." + [Retry] (data-action="retry-data"); no ledger counts are presented as results
  no polygon (e.g. AD): "Andorra is too small to draw on this map at this scale. Its records are listed below and in Reports."
ledger <dl class="brief-ledger"> (label left, value right-aligned; absolute + relative)
  Source coverage ........ Limited source check | Not reviewed
  Languages read ......... English
  Last article check for this country .. 2 Oct 2026, 21:14 UTC / 1 hour ago
  First search logged .... 2 Oct 2026, 21:07 UTC · 5 results (not reviewed) | Search failed | Not yet searched
  Human editorial review . Not completed
  (ledger loading: "Loading…"; failure: "Ledger unavailable" + [Retry] data-retry="coverage"/"research")
Reported cities: [Paris] [Lyon] … (data-select-city chips, 44 px) + "City dots are approximate reference points, not protest sites."
Records (ul.brief-records): <a href="#/record/id" data-open-record> title </a> + "{status label} · Latest evidence {date}"
[Show France in Reports] (data-select-country="FR" data-view-after="latest")   [Back to world] (data-clear-filter="country")
```

No discovery leads and no candidate URLs (C-19).

---

## 12. Ahead view (`#view-ahead`; WP5)

### 12.1 Switch

- `.ahead-switch` is sticky under the header (`top: var(--header-h)`, `--bg` background, 1 px bottom rule; static under `max-height: 500px`): two equal 44 px segments, "Announced actions" and "Coming next", with `aria-current="page"` on the active one (router, C-24).
- Nothing reached by Tab or by a jump may sit under the sticky switch: WP1 sets `html[data-view="ahead"] { scroll-padding-top: calc(var(--header-h) + 52px) }` (§17.5).
- Focus after navigation is set by the router (§3.2): `#ahead-title` when entering Ahead on actions, `#ahead-roadmap-title` when entering on the roadmap, and the section title on a switch tap.
- `mountAhead` sets `#ahead-root[data-section]` from `route.param`, rendering only that section (the other gets `hidden`). Distinct treatments:
  - **actions:** neutral background; items are bordered cards with a date block;
  - **roadmap:** a `--bg-sunken` band with no date blocks and status pills (never styled like event cards).

### 12.2 Announced protest actions (`section#ahead-actions`, `aria-labelledby="ahead-actions-title"`)

```
<h2 id="ahead-actions-title" tabindex="-1">Announced protest actions</h2>                     (A2)
<p>Actions that a named organisation or institution has publicly announced for a future date. An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful.</p>  (A2-sub)
<p class="announce-stamp">Announced-actions list compiled <time>2 Oct 2026, 22:45 UTC · 1 hour ago</time> · 0 items</p>   (A9)
```

**Empty (items = [])**, a dashed card `.announce-empty` (`role="status"`), icon `i-calendar-empty`:
- A3 (h3): "No announced actions are listed yet"
- A4: "This list includes an announced action only after the article announcing it has been opened and read. Nothing meets that standard in this snapshot."
- A5:
  - when `sweepFact().announcements.blocked`: "On {2 Oct 2026}, our search for announced and recent protest actions could not open news websites from the research environment. Search-result snippets were logged as leads, but a snippet is not a source, so none are listed here. An empty list does not mean nothing is planned."
  - otherwise: "Our latest search did not find an announcement that met this standard. An empty list does not mean nothing is planned."
- A6: "When items appear, each will show what was announced and by which organisation or institution, the country and city, the planned date and how precise it is, the source with its publisher and publication date, and when it was checked. Times, meeting points and routes are never listed. After the planned date passes, an item is marked 'occurrence not established' until a sourced report says what happened."
- Buttons: `[What's blocking this →]` (`<a class="btn btn--primary" href="#/ahead/roadmap" data-ahead-target="roadmap-item-list-announced-actions">`) · `[Read the most recent reports]` (`href="#/latest"`).
  - "What's blocking this" lands on the blocker items (editorial §10.1), not the top of the roadmap. mountAhead (WP5, a delegated click inside `#view-ahead`) stores the target and lets the navigation run. Once the roadmap section has rendered (after its lazy load if needed, and after the router's own scroll and focus), it calls `scrollIntoView({block: 'start'})` on `#roadmap-item-list-announced-actions` and focuses it (`tabindex="-1"` on every roadmap article). That item's "Depends on" link leads to `add-reports-after-2-oct-2026`.
- After the card: `<details class="announce-specimen"><summary>How an announcement will appear</summary>`. Inside is a specimen built from placeholders only ("{Planned date}", "{Action}", "{Country} · {City}", "Announced by: {organisation or institution}", "What was announced: {attributed paraphrase}", "Source: {publisher}, published {date} ↗ · opened {time} (AI-assisted)", A7). It is watermarked "Layout specimen • not an announcement" and never names a real or fictional event.
- Then "Every announcement shows one of these states" with the labels from `ANNOUNCEMENT_LABELS` (freshness.js, already editorial §10.3), as neutral pills, plus the period form "Planned period includes today · occurrence not established".
- **Non-day "scheduled-now"** (C-50): `announcementView` (WP5) overrides the state label when `announcementState` is `scheduled-now` and `date_precision` is not `day`: "Planned period includes today · occurrence not established". freshness.js stays frozen.

**Absent (404):** "The announced-actions list is not published in this snapshot." **Error:** "The announced-actions list could not load. This is not the same as an empty list." `[Retry]` (`data-action="retry-data"`).

**Filled item** (editorial §10.2 order; `groupAnnouncements` order: today, upcoming by start; postponed/cancelled in place):

```html
<article class="announce-item" data-state="upcoming">
  <p class="announce-state"><span class="announce-pill">Announced</span> <span class="announce-countdown">in 5 days</span></p>   <!-- countdown only for day/range precision AND state upcoming -->
  <p class="announce-date">Tue 7 Oct 2026</p>      <!-- day: "7 Oct 2026" (weekday allowed) · range: "7–9 Oct 2026" · week: "Week of 5 Oct 2026 · exact day not announced" · month: "October 2026 · exact day not announced" (no countdown for week or month) -->
  <h3 class="announce-action">{action}</h3>
  <p class="announce-place">{Country} · {cities}</p>
  <p>Announced by: {announced_by}</p>
  <p>What was announced: {announcement}</p>
  <p class="announce-source">Source: {sourceLink(publisher)}, published {date} · opened {accessed_at} (AI-assisted)</p>
  <p><a href="#/record/{event_id}" data-open-record="{event_id}">Related episode: {title} →</a></p>   <!-- only with event_id -->
  <p class="announce-caveat">An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful.</p>  <!-- A7 -->
</article>
```

- **Date-passed group:** `<details class="announce-passed"><summary>Planned dates that have passed ({n}) · occurrence not established</summary>` (A8). It is never counted as upcoming, and items carry no check mark.
- No map pins, no calendar or reminder controls, no count badge.

### 12.3 Coming next to Protest Atlas (`section#ahead-roadmap`, `aria-labelledby="ahead-roadmap-title"`)

```
<h2 id="ahead-roadmap-title" tabindex="-1">Coming next to Protest Atlas</h2>                 (A10)
<p>R2: "What we have built, what we are working on and what is blocked, stated plainly. There are no promised dates. 'Shipped' means available on this site now and checked after it was deployed. This page is about the atlas itself. Announced protest actions are listed separately under Ahead."</p>
<p class="roadmap-stamp">Roadmap revised {2 Oct 2026} · AI-assisted · no human editorial owner yet</p>    (R5, date = updated_at day)
[Follow progress on GitHub ↗] (primary, full width on phones; href {REPO_URL}/blob/main/docs/ROADMAP.md)
[Suggest a feature or report a problem ↗] (secondary; {REPO_URL}/issues/new/choose) + "Please do not post private details about participants."
<p class="roadmap-legend">R3 (rewritten, §18.2): "Shipped: available on this site now. · In progress: being built; not available yet. · Next: planned, and can start without outside help. · Later: only after the listed conditions are met. · Blocked: cannot proceed until the named blocker is resolved." (each status shown with its pill)</p>
<nav class="roadmap-jump">In progress (4) · Next (7) · Blocked (5) · Later (8) · Shipped (6)   (data-scroll-to anchors, 44 px pills)</nav>
groups in order: in-progress, next, blocked, later, shipped → <section class="roadmap-group" id="roadmap-{status}"><h3>{In progress}</h3> items…
<section class="roadmap-notplanned"><h3>What we will not build</h3><ul>NOT_PLANNED</ul></section>      (R4, §18.2)
```

**Item** (`article.roadmap-item[data-status][tabindex="-1"]`):
- serif 19 title (`h4`);
- status pill (`.roadmap-status[data-status]`: glyph + word + border style, §17.8);
- area as a muted word;
- summary;
- "Done when: {acceptance}" (shipped items: "Shipped in {3.0} · {2 Oct 2026}" + "Checked by:" + evidence links via `evidenceHref`);
- "Blocked by: {blocked_by}";
- "Depends on: {titles}" (each a `data-scroll-to` link to `roadmap-item-{id}`);
- "Status checked {2 Oct 2026}", plus the "Status check overdue" badge when `reviewOverdue`.

`id="roadmap-item-{id}"` on each article.

**Loading:** "Loading the roadmap…". **Error:** "The roadmap could not load." `[Retry]` (`data-retry="roadmap"`).

---

## 13. Countries view (`#countries-root`; WP5)

- Dek: "{81} of {249} have a published episode. A first search was logged for all {249}; searched is not reviewed, and no published episode does not mean no protests."
- Search: `<label for="dir-query">Find a country or territory</label><input id="dir-query" type="search">` (48 px, 16 px), with a 120 ms debounce. No results: "No country or territory matches '{q}'."
- Regions A–Z: `<section class="dir-region"><h2>{Africa} <span class="dir-count">{60 entries}</span></h2><ul>`. Use `entriesLabel`, so "1 entry" is correct.
- Row: `<button class="dir-row" data-select-country="FR" data-view-after="map"><span class="dir-name">France</span><span class="dir-status">2 episodes published</span><span class="dir-note">Not drawn on the map at this scale</span>…i-chevron-right…</button>`, at least 52 px tall.
  - Status (E9): "{n} {episode|episodes} published" · "Searched · no published episode" · "Search failed · no published episode" · "Not yet searched" · "Coverage unavailable".
  - While `research-ledger.json` is still loading, rows without a published episode read "Checking the search log…" (never "Coverage unavailable"), and then switch to their E9 label.
  - Events error (C-37): every row reads "Coverage unavailable", and the dek is replaced by "Coverage cannot be shown because published records did not load." `[Retry]` (`data-action="retry-data"`).
  - The "Not drawn" note appears only when `mapCodes` loaded and the code is absent.
- Countries load error: "The country directory could not load." `[Retry]` (`data-action="retry-data"`).
- **Example mode** (C-38): the directory always shows reported coverage. The dek gains "This directory shows reported data. Choosing a country returns you to it." A row tap first runs `setMode('reported')` (app.js, for any `data-select-country` inside `#view-countries`), then `selectCountry(code, {view: 'map'})`.

---

## 14. About view (static WP1 + mounts)

The order is fixed. Static copy is verbatim:

1. **Coming next row** (first), `a.about-next[href="#/ahead/roadmap"]` (full-width 60 px card, `i-signpost`): "**Coming next to Protest Atlas** — what we are building, what is blocked and what we will not build →".
2. `p.view-dek`: "Protest Atlas is a dated, source-checked snapshot of reported protests. An AI-assisted process opened and read each cited news report and recorded what it says. No human editor has checked these records yet."
3. `h2` "How to read a record" + list:
   - "Latest evidence is the most recent day a cited source reports activity or a development. Records are sorted by it, newest first."
   - "'Reported ongoing' needs evidence dated within the last 72 hours. Re-reading an old source, assembling the snapshot or rebuilding the site never makes an episode more recent."
   - "For / against always names a target. Positions are not head-counts, and there is no tally."
   - "Turnout, disruption and violence or harm are reported separately. There is no combined score. 'Not established' never means zero or none."
   - "Police and state response is shown as the source reports it, with attribution. A missing entry is not evidence that nothing happened."
   - "Single source means one newsroom or reporting chain, however many links. Corroborated means the AI-assisted check found more than one independent source for key claims; it is not independent human verification."
4. `h2` "How to read the map" + list: M8 · "No published episode is a coverage gap, not evidence that no protests happened." · M5 · M6.
5. `h2` "What the dates mean" + `#about-stamps` (WP2, the same rows as §10, without the sheet chrome).
6. `h2` "Research scope" + `#research-scope` (WP5):
   - a `dl` of scope counts: "First searches logged: {249} of {249}" · "Countries and territories with a published episode: {81}" · "City references in published records: {118}" · "Ended or suspended episodes: {18}" · "Positions recorded: {92} across {84} episodes; each is tied to its own target." (`researchScope` returns `{…, positions, episodes}`, C-49).
   - while the ledger loads: "Loading the research scope…"; on failure: "Research scope unavailable." `[Retry]` (`data-retry="research"`).
   - a limit paragraph: "A logged search is not a completed country history. No country is certified exhaustive. Regional totals reflect where we looked, so they cannot be compared or ranked."
   - `<details>` "Inspect country-by-country research". It renders on its first `toggle`. Columns: Country or territory · Research stage · Published episodes ("None published" for 0) · Source pages read. Caption: "First searches, {1 Jan 2024} to {2 Oct 2026}", from the ledger window. **No candidate URLs.**
7. `h2` "Lead discovery" + `#about-discovery` (WP5):
   - "Lead-discovery audit: GDELT artifact created {2 Oct 2026, 19:27 UTC} · {97} unverified leads." + the explainer from §10;
   - "Scheduled every {6} hours; a schedule is not evidence that runs succeed.";
   - "Workflow run ↗", shown only when the URL passes the repo regex. Unavailable: "Discovery audit unavailable."
8. `h2` "Data and tools", as a list of 52 px rows:
   - `[Download CSV of the records matching your current filters]` (`data-action="export-csv"`; `aria-disabled` per C-43, still guarded in the handler);
   - "Published data (JSON)";
   - "Editorial policy ↗";
   - "Source code and corrections ↗" + "Please do not post private details about participants.";
   - "Editor desk" + "Local tool for reviewing leads. Nothing is published from it.";
   - `#about-example` "Explore an illustrative example" (`data-set-mode="example"`). After `setMode('example')`, app.js navigates to `#/latest` (C-38), where the example (or its loading or error state) is shown.

---

## 15. `404.html` (WP1)

The page is self-contained (inline style with literal light colours and a `prefers-color-scheme` dark block, plus an inline script), `noindex`, with no relative assets. It contains:
- H1 verbatim;
- title "Page not found — Protest Atlas";
- the text "This page is not part of the atlas.";
- links: Reports · Map · Coming next · Countries · Published data;
- alias redirects per tech §2.5, plus `reports` → `#/latest`.

**Link construction** (C-33). Pages serves `404.html` at any depth (for example `/protest-atlas/a/b`), so relative URLs break. The static markup uses absolute no-JS fallbacks:
- `/protest-atlas/#/latest`, `/protest-atlas/#/map`, `/protest-atlas/#/ahead/roadmap`, `/protest-atlas/#/countries`, `/protest-atlas/public/events.json`.

The inline script rewrites each `href` from the computed `home` (tech §2.5) as `home + '#/map'`, `home + 'public/events.json'`, and so on. test_site.py (WP5) fails if any `href` or `src` in `404.html` starts with anything other than `/protest-atlas/` or `https://`.

---

## 16. States

### 16.1 State table

| State | Trigger | Chip | Notice | Reports | Map | Ahead |
|---|---|---|---|---|---|---|
| Current (2 Oct) | newest evidence < 72 h | H4, neutral | H1 | S1, S2; fresh group (5) + S3 + S7 closing note; older group (79) | normal | empty state (A3–A6) |
| Aging (5 Oct 00:00 → 9 Oct 00:00 UTC) | 72 h ≤ age < 7 d | H5, neutral | H1 + **S4** | `.feed-gap`: E4 ("within the last 72 hours" when the week group is non-empty) + S7; groups from "3 to 7 days ago (5)" | S4 shown above the map | same |
| Stale (from 9 Oct 00:00) | 7 d ≤ age < 30 d | H6, warn | H1 + **S5** | E4 ("in the last 7 days") + S7; first group "7 to 30 days ago (5)"; cards "Latest evidence 2 Oct 2026 · 7 days ago" + badge "7–30 days ago" | S5 above the map; fill unchanged | same |
| Archive (from 1 Nov) | age ≥ 30 d | H6, warn | H1 + **S6** | E4 + S7; all groups older | S6 | same |
| Loading | critical pending | "Snapshot / loading" | H1 (static); no "What this means" until counts are known | "Loading published records…" + skeletons | map lazy | "Loading…" |
| Events error (C-37) | `load.errors.events` (fetch or shape) | "Snapshot / could not load", warn | H1 + **E5 line** (every view) | E5 + `[Retry]` + data link; filter sheet error body; footer `[Close]` only | land neutral (no ochre, no hatch); legend "Coverage cannot be shown because published records did not load." + `[Retry]`; overview and brief leads say the same | upcoming is independent; Countries rows "Coverage unavailable" |
| Countries-only error (C-37) | `load.errors.countries` | data state | H1 + "The country directory could not load; records are listed by country code." | list renders; codes for missing names; S2 without country counts | coverage drawn; codes in tooltips | Countries: "The country directory could not load." + `[Retry]` |
| Contexts error | contexts failed | — | — | cards without outcome teaser; city/outcome disabled with note | no city dots | — |
| Upcoming absent / error | 404 / other | — | — | teaser variant | — | absent / error copy |
| Build-info absent | 404 locally | — | — | — | — | — (footer T2, dates sheet T2) |
| Build-info malformed | `load.errors.build === 'error'` | — | — | — | — | — (footer and dates sheet: "Site build stamp could not be read") |
| Research ledger loading / failed | `load.lazy.research` | — | — | — | brief E2 "Checking the search log…" / failure variant + `[Retry]` | Countries "Checking the search log…" / E9; About "Research scope unavailable." + `[Retry]` |
| Discovery loading / failed | `load.lazy.discovery` | — | — | — | — | dates sheet row "Loading…" / "Discovery audit unavailable."; About "Discovery audit unavailable." |
| Map failure | assets failed, or `import('./js/map-view.js')` rejected | — | — | — | E6 in `.map-fallback`: "The map could not load. Every country and territory is still available in the list and the A–Z directory." `[Retry map]` (`data-action="retry-map"`, or app.js's re-import) `[Open Countries]`; stage `aspect-ratio: auto`; region chips, zoom, World and Explore hidden | — |
| Dropped params | permalink normalised | — | H1 + dropped line | — | — | — |
| Example mode | `setMode('example')`, examples ready | unchanged | H1 + `#example-banner` | example stats line; watermarked cards; no groups or teaser; share and export `aria-disabled` and refused in their handlers | `--map-example`; `.map-watermark`; legend example text; the directory always shows reported coverage, and a row tap returns to reported mode | unchanged |
| Example loading (C-38) | `load.lazy.examples === 'loading'` | unchanged | H1 + banner | "Loading the illustrative example…" + 1 skeleton | land neutral; legend M2 "Loading the illustrative example…" | unchanged |
| Example error (C-38) | `load.lazy.examples === 'error'` | unchanged | H1 + banner (stays) | "The illustrative example could not load." / "Nothing here is reported data." `[Retry example]` (`data-retry="examples"`) `[Back to reported data]` (`data-set-mode="reported"`); summary "Illustrative example unavailable" | land neutral; legend "Illustrative example unavailable" + `[Back to reported data]` | unchanged |

### 16.2 9 Oct 2026, 12:00 UTC walkthrough (editorial §14.2; smoke check 13)

1. **Chip:** `data-state="stale"`, warn. Long form "Stale snapshot · newest evidence 7 days old"; short form "STALE SNAPSHOT / evidence 7 days old".
2. **Notice, on every view:** H1 in full, then S5, "This snapshot has nothing newer than 2 Oct 2026, 7 days ago. Read it as an archive of past reporting, not as a picture of protests today."
3. **Reports:**
   - S1 "Snapshot assembled 2 Oct 2026, 22:45 UTC · 7 days ago"; S2 unchanged.
   - Quick chips carry no counts.
   - `.feed-gap`: "No episode in this snapshot has evidence dated in the last 7 days. That is a gap in this dataset, not a sign that no protests happened." + S7.
   - First heading "7 to 30 days ago (5)". The first card is in-electoral (ties on 2 Oct keep file order, C-34: in-electoral, fr-schools, es-housing): status "Current status not established", "Latest evidence 2 Oct 2026 · 7 days ago", badge "7–30 days ago". tz-drivers reads "Ended / suspended 30 Sep 2026" and "Latest evidence 1 Oct 2026 · 8 days ago".
   - No "Latest evidence within 72 hours" heading anywhere; no "0".
   - "Last 7 days" chip → E1.
4. **Map:** the notice with S5 sits above the map title; fill is unchanged; M9 appears only if the user sets a window.
5. **Ahead:** unchanged.
6. **Dates sheet:** "Newest evidence · dated 2 Oct 2026 · 7 days ago".
7. **Recompute:** a page left open from 2 Oct reaches this state through the 60 s tick and `visibilitychange`, without a reload (tech §7.3 with C-02).
8. **Day counts keep moving** (C-52): the same page left open until 12 Oct 00:00 UTC re-renders at midnight because `evidenceAgeDays` is part of `timeSnapshot`. The chip reads "Stale snapshot · newest evidence 10 days old", S5 reads "…nothing newer than 2 Oct 2026, 10 days ago…", and S1 (through `refreshTimes`) reads "· 10 days ago". The three never disagree.
9. **No "latest" or "new" labels:** no `.band`, `.status`, `.chip` or `.feed-group-title` text starts with "latest" or "new"; the only allowed "Latest" is the field label "Latest evidence {date}".

---

## 17. Visual system (WP1 defines; everyone consumes tokens only)

### 17.1 Colour tokens

Light values go on `:root`. Dark values go under `@media (prefers-color-scheme: dark) { :root[data-color-scheme="auto"] {…} }` and again under `:root[data-color-scheme="dark"]`. `review.html` has neither attribute, so it stays light.

| Token | Light | Dark | Use / measured contrast |
|---|---|---|---|
| `--bg` | #f6f4ee | #121411 | page |
| `--bg-raised` | #fffdf8 | #1b1d1a | cards, sheets, chip |
| `--bg-sunken` | #eeebe2 | #242722 | insets, band badges, roadmap band |
| `--notice-bg` *(new)* | #ece8dc | #23261f | disclosure strip |
| `--text` | #1a1c19 | #efede6 | 15.60 on bg / 15.81 dark |
| `--text-2` *(new)* | #3f423c | #cfccc3 | 10.05 on raised / 10.57 |
| `--text-muted` | #5f625b | #a3a69d | ≥ 5.06 on every light surface (5.06 on notice-bg); ≥ 6.12 dark |
| `--border` | #d8d4c8 | #363a33 | hairlines only (1.46:1, never a control boundary) |
| `--border-input` *(new, C-44)* | #7a7d74 | #8d9188 | boundaries of `input`, `select`, `.filter-segment`, unpressed `.chip`, `.toast-url`, map zoom buttons. Light: 3.81 on bg, 4.12 raised, 3.42 notice-bg, 3.51 sunken. Dark: 5.28 raised, 5.77 bg, 4.71 sunken |
| `--border-strong` | #1a1c19 | #efede6 | section rules, pills, ended card border |
| `--accent` | #1a1c19 | #efede6 | interactive accent = ink (primary buttons, pressed chips, active tab) |
| `--accent-ink` | #fffdf8 | #121411 | text on accent |
| `--accent-weak` | #e5e1d6 | #2e312b | pressed/hover fill |
| `--focus-ring` | #1a5fb4 | #8ab4f8 | 5.72 on bg / 8.79 dark |
| `--ok` / `--ok-weak` | #2f6b3f / #e3efe4 | #8fcf9c / #1e2b21 | roadmap "Shipped" glyph only (6.27 / 9.35 on raised) |
| `--warn` / `--warn-weak` | #7a3410 / #f7e6d3 | #f0a477 / #3a2414 | stale chip and lines, needs-review (7.40 on warn-weak / 7.13) |
| `--danger` / `--danger-weak` | #a3341f / #fbebe6 | #f29c87 / #3a1e18 | load errors (6.73 / 7.99) |
| `--status-ongoing --status-planned --status-ended` | var(--text) | var(--text) | text plus symbol, never hue |
| `--status-review` | var(--warn) | var(--warn) | |
| `--status-unknown` | var(--text-2) | var(--text-2) | |
| `--band-fresh --band-week --band-month --band-older` | var(--text-2) | var(--text-2) | neutral in every band |
| `--stance-support --stance-oppose --stance-other` | var(--text) | var(--text) | frozen names, deliberately identical (editorial §5.1) |
| `--example` | #8a6cc2 | #9480cc | example mode only |
| `--example-ink` *(new)* | #5f4796 | #5f4796 | watermark band (dark stripe); white text 7.43:1 |
| `--example-stripe` *(new, C-44)* | #6b54a3 | #6b54a3 | watermark band (light stripe); white text 6.14:1 |
| `--on-example` *(new, C-44)* | #ffffff | #ffffff | text and focus outlines on the striped band (focus-ring would be 1.18:1) |
| `--ended-shadow` *(new)* | #0d0f0d | #c9c6bc | offset shadow on ended cards and status glyphs (light in dark so it stays visible; M5 says "Shadow") |
| `--map-ocean` | #e4e9e3 | #0e1311 | stage background |
| `--map-land` | #f2f2ec | #2b312e | gap fill base |
| `--map-hatch` | #c3cbc1 | #3f4844 | gap hatch lines (secondary encoding) |
| `--map-reported` | #b4772a | #bd8236 | **the only use of ochre** |
| `--map-example` | var(--example) | var(--example) | |
| `--map-selected` | #1a1c19 | #efede6 | selection outline (4.59:1 against reported in light) |
| `--map-selected-halo` *(new)* | #fffdf8 | #0e1311 | outer halo, so the dark-mode outline reads on ochre (halo/reported 5.72 dark) |
| `--map-border` | #b9c1b8 | #48504c | country borders |
| `--map-grid` | #d5dcd3 | #1f2622 | graticule (hidden on phones) |
| `--map-city` | #1a1c19 | #efede6 | city dots |
| `--map-city-ended` | #1a1c19 | #efede6 | (same; ended cities get a shadow stroke) |
| `--map-shadow` | #0d0f0d | #d8d4c8 | feDropShadow flood |
| `--map-focus` | var(--focus-ring) | var(--focus-ring) | keyboard focus ring overlay (C-40): 6.19:1 on `--map-selected-halo` light, 8.90:1 dark |
| **Legacy aliases** (review.css) | `--canvas:#f5f3eb --surface:#fffef9 --ink:#202a28 --muted:#59635d --line:#d3d5c9 --ochre:#926018 --ochre-light:#efe5cd --green:#315b49 --green-light:#e5eee5 --error:#893d30 --serif:var(--font-serif) --sans:var(--font-sans) --radius:3px --space:24px` | not redefined | kept at their 3.1 literal values; **new CSS must never use them** |

### 17.2 Palette validation (dataviz `validate_palette.js --pairs all`, run 2 Oct 2026)

```
LIGHT  #b4772a,#8a6cc2  --surface #e4e9e3 (ocean)   Lightness PASS · Chroma PASS · CVD worst ΔE 22.8 (deutan) · Normal 22.6 · Contrast ≥3:1 → ALL CHECKS PASS
LIGHT  #b4772a,#8a6cc2  --surface #f2f2ec (land)    → ALL CHECKS PASS (contrast ≥3:1)
DARK   #bd8236,#9480cc  --surface #0e1311 (ocean)   Lightness PASS · Chroma PASS · CVD worst ΔE 21.3 (deutan) · Normal 21.1 · Contrast ≥3:1 → ALL CHECKS PASS
DARK   #bd8236,#9480cc  --surface #2b312e (land)    → ALL CHECKS PASS
```

- Selection is an outline, so it is not a categorical fill. Its contrast against the reported fill is 4.59 (light, ink); in dark it uses the halo (5.72).
- Rejected: `#174e4a` selected fill (L 0.39), `#bcaed0` example (chroma 0.05), any stance hue pair (editorial §5.1).
- Text pairs measured with WCAG: see §17.1.
- WP1 re-runs the validator on the final hexes in both modes and pastes the output into its hand-off.
- Added 3 Oct (WCAG pairs, measured): `--map-focus` on `--map-selected-halo` 6.19 light / 8.90 dark (≥ 3:1 required for a focus indicator; on bare ochre it would be 1.68 / 1.55, which is why the halo is drawn); `--border-input` per §17.1; white on `--example-ink` 7.43 and on `--example-stripe` 6.14.

### 17.3 Type

Stacks (no font requests):
- `--font-serif: Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Georgia, serif`
- `--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif`

Tokens (tech names):

| Token | px |
|---|---|
| `--fs-xs` | 12 |
| `--fs-sm` | 14 |
| `--fs-md` | 16 |
| `--fs-lg` | 18 |
| `--fs-xl` | 22 |
| `--fs-2xl` | 28 |
| `--fs-3xl` | clamp(30px, 7vw, 48px) |

`--lh-tight: 1.2`, `--lh-body: 1.5`. Numerals: `font-variant-numeric: tabular-nums` only in stamps, dates and counts.

| Role | Size / line / weight / face |
|---|---|
| View title (`h1` of Map/Ahead/Countries/About, `.view-head h1`) | serif 28/1.15/600 (`--fs-2xl`); 34 at ≥ 900 |
| Reports h1 (`.feed-head h1`) | sans 22/1.2/700 |
| Detail title | serif 28/1.15/600 |
| Card title | serif clamp(18px, 2.5vw + 10px, 22px)/1.25/600 |
| List-row title, roadmap item, country name in rows | serif 17–19/1.3/600 |
| Section heading (h3 in detail; feed group titles, which are `h2`; About and Ahead section titles) | sans 16–18/1.3/700. Visual size follows the class, not the tag (C-45) |
| Body, notice ≥ 600, filter labels | sans 16/1.5 |
| Meta, facts, help, evidence, notice < 600 | sans 14/1.45 (**minimum for reading text**) |
| Labels: eyebrows, fact labels, pills, chip label, tab labels | sans 12/1.3/700, caps with +.06em (12 px only for these) |
| Inputs and selects | 16 (prevents iOS zoom) |

### 17.4 Space, radii, elevation, sizes

- **Space:** `--sp-1…--sp-8` = 4 8 12 16 20 24 32 48. Gutters: 16 (< 600), 24 (≥ 600), 32 (≥ 1200). Content max-widths: feed 720, wrap 1200.
- **Radii:** `--r-1: 6px` (pills, badges, notice lines) · `--r-2: 12px` (cards, inputs, buttons, stage) · `--r-3: 16px` (sheets, drawers) · `--r-pill: 999px` (chips, chip button).
- **Elevation:** cards are flat (1 px border). The **only** semantic shadow is the ended offset (`5px 5px 0 var(--ended-shadow)`; 2 px on status glyphs). Two more shadows exist:
  - `--shadow-1: 0 1px 0 rgb(0 0 0 / .06)` (header when the page is scrolled; optional);
  - `--shadow-2: 0 -12px 40px rgb(0 0 0 / .22)`, dark `rgb(0 0 0 / .6)` (sheets, drawers, toast).
- **Sizes:**
  - `--tap: 44px` (minimum for every control; filter rows 48);
  - `--header-h` / `--tabbar-h`: CSS defaults on `:root` (`--header-h: 56px`, 64px at ≥ 900; `--tabbar-h: 0px`, and `:root:has(.tab-bar)` sets `calc(64px + env(safe-area-inset-bottom))` below 900, 48 px + safe area under `max-height: 500px`), so the layout is right before JS runs and on review.html. `initChromeMetrics` then writes measured values, only for elements that are displayed (C-44);
  - `--gutter`: 16 px, 24 px at ≥ 600, 32 px at ≥ 1200;
  - z-index tokens per tech: `--z-controls 10`, `--z-sticky 20`, `--z-header 30`, `--z-tabbar 30`, `--z-toast 40`.

### 17.5 Focus

- `:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; border-radius: inherit }`.
- Programmatic heading focus: `[tabindex="-1"]:focus:not(:focus-visible) { outline: none }`.
- Visually hidden radios: the label carries the ring (`.filter-segment label:has(input:focus-visible)`, §9).
- On the striped example band: `outline-color: var(--on-example)` (§4.3).
- Map countries: the C-40 overlay (`.map-focus-halo` + `.map-focus-ring`), never a stroke on the path; there is no `.map-country:focus-visible` stroke rule.
- **Focus is never obscured** (WCAG 2.4.11):
  - `html { scroll-padding-top: calc(var(--header-h) + 8px); scroll-padding-bottom: calc(var(--tabbar-h) + 8px) }`;
  - `html[data-view="ahead"] { scroll-padding-top: calc(var(--header-h) + 52px) }`, which covers the sticky `.ahead-switch` for Tab focus and jumps alike;
  - `.sheet--record .sheet-body { scroll-padding-top: 52px }`, which covers the sticky `.rec-tabs` (§8.1);
  - under `max-height: 500px` the header, switch and tabs are static, so these become `8px` (§17.10).
  - sheet.js `data-scroll-to` uses `scrollIntoView({block: 'start'})` so the padding applies.

### 17.6 Motion

- `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--dur-1: 120ms` (chips, buttons, mini title), `--dur-2: 240ms` (sheets, drawers).
- Sheets rise 24 px with an opacity ramp from .6; drawers slide 32 px from the right.
- No pulsing, no tickers, nothing animates on the clock tick.
- `@media (prefers-reduced-motion: reduce) { :root { --dur-1: 0ms; --dur-2: 0ms } html { scroll-behavior: auto } }`. The map focus transition is 0 ms; View Transitions are skipped.
- `html { scroll-behavior: smooth }` applies only under `(prefers-reduced-motion: no-preference)`.

### 17.7 Breakpoints

Mobile first, and only these:
- `(min-width: 600px)`: gutters 24, one-line chip, centred feed 720, stamps modal;
- `(min-width: 900px)`: header nav, no tab bar, two-line chip again, drawers, map grid;
- `(min-width: 1200px)`: one-line chip, "Coming next" nav item, Reports rail, one-line notice.

Also `(hover: hover) and (pointer: fine)` for hover styles and `(prefers-reduced-motion: reduce)`. Added by C-42: **`(max-height: 500px)`** (short viewports, landscape phones, 200–400 % zoom) and **`(forced-colors: active)`**, both with the rules in §17.10 only. Container queries: `.card` (label column at ≥ 340 px), `.rec-glance` (2×2 at ≥ 520 px).

### 17.8 Primitives (WP1 unless noted)

- **`.btn`:** 44 px, `--r-2`, 16/600, padding 0 16. `.btn--primary` uses `--accent` with `--accent-ink`; `.btn--quiet` is transparent with an underline on hover. **`.icon-btn`** is 44×44 with a visible label or `aria-label`.
- **`.chip`:** 44 px, `--r-pill`, 1 px `--border-input`, `--bg-raised`, 15 px. `[aria-pressed="true"]` uses `--accent` fill and `--accent-ink` text **and** shows a leading `i-check` (`.chip-check`, rendered by the chip's owner, hidden unless pressed), so pressed is not colour alone.
- **`input`, `select`** (base layer): 1 px `--border-input`, `--r-2`, `--bg-raised`, 16 px text, min-height 48 px in sheets and the filter bar.
- **`summary`** (base layer): `min-height: var(--tap)`, `padding-block: 10px`, keeping `display: list-item` so the marker stays. This applies to every `<details>` (notice, feed explainer, specimen, A8, About ledger).
- **`[aria-disabled="true"]` on `.btn`/`.icon-btn`:** `--text-muted` text, dashed `--border-input` border, `cursor: not-allowed`; still focusable.
- **`.toast`, `.toast--sheet`, `.toast-text`, `.toast-url`, `.toast-close`:** §4.5.
- **`.status`** (symbol via `::before`, 10 px, `margin-inline-end: 6px`):

  | Status | Symbol |
  |---|---|
  | ongoing | filled ink circle |
  | planned | ring |
  | ended | filled square with a 2 px `--ended-shadow` offset |
  | needs-review | ring with a diagonal slash, `--warn` |
  | unknown | dashed ring |

  Text is 14/600 in its status token.
- **`.band`:** text-only neutral pill. 1 px `--border`, `--bg-sunken`, `--text-2`, 12/600 (not caps), 22 px tall, `--r-1`.
- **`.side-pill`** (WP3): §7.3.
- **`.roadmap-status`** (WP5):

  | Status | Glyph | Treatment |
  |---|---|---|
  | shipped | "✓" | `--ok-weak` fill, `--ok` text |
  | in-progress | "◑" | solid ink border |
  | next | "→" | solid border |
  | later | "…" | dotted border |
  | blocked | "⊘" | dashed border, `--warn` text |

  Always glyph + word.
- **`.sheet`, `.sheet-head`, `.sheet-body`, `.sheet-foot`:**
  - `dialog.sheet { margin:0; padding:0; border:0; max-width:none; max-height:none; background: var(--bg-raised); color: var(--text) }`;
  - flex column; the body has `overflow:auto; overscroll-behavior: contain`;
  - the foot is sticky with `padding-bottom: env(safe-area-inset-bottom)`;
  - `html.sheet-open { overflow: hidden }`.
- **`.empty-state`:** dashed 1 px `--border-strong`, `--r-2`, padding 20, an h-level title + body + actions.
- **`.tab-bar`:** fixed bottom, `--bg-raised`, 1 px top rule, 5 equal cells, each icon 24 + label 12/600, at least 56 px tall cells; inline padding `max(0px, env(safe-area-inset-left/right))`. Compact 48 px variant under `max-height: 500px` (§17.10).
- **review.html compatibility** (C-44; review.html and review.css are not edited):
  - the 3.1 direct-child header layout stays on `.site-header:not(:has(.site-header-inner))` (flex, space-between, wrap, gap 16, `.wrap` width), together with `.brand small` and `.site-header nav` (+ `nav a`) rules;
  - `.brand-mark` uses `min-width: 32px; height: 32px; padding-inline: 4px` (no fixed width), so review's "P<span>↗</span>" fits;
  - tab-bar padding lives on `.site-footer--app` only;
  - the legacy aliases keep their 3.1 values.

### 17.9 Icon sprite (`#icon-sprite`, WP1)

24×24 viewBox, `fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round`. Every use is `aria-hidden` next to a text label (except icon buttons with `aria-label`).

| Id | Glyph | Id | Glyph |
|---|---|---|---|
| `i-latest` | newspaper / stacked lines (Reports) | `i-map` | folded map |
| `i-ahead` | calendar with right arrow | `i-countries` | A–Z list |
| `i-about` | circle with i | `i-filter` | three sliders |
| `i-search` | magnifier | `i-close` | × |
| `i-share` | box with up arrow | `i-download` | arrow into tray |
| `i-external` | arrow leaving box | `i-chevron-left/right/down` | chevrons |
| `i-plus`, `i-minus` | + − | `i-world` | globe |
| `i-clock` | clock | `i-check` | check |
| `i-alert` | triangle ! | `i-info` | small circle i |
| `i-hand` | open hand (Explore) | `i-expand`, `i-collapse` | corners out / in |
| `i-signpost` *(new)* | signpost (Coming next) | `i-calendar-empty` *(new)* | calendar with ? |
| `i-link` *(new)* | chain link | | |

### 17.10 Short viewports, zoom, forced colours and safe areas (WP1 unless noted; C-42)

**`@media (max-height: 500px)`**: landscape phones (844×390, 640×410) and 200–400 % zoom (1440×900 at 200 % is 720×450; 1280×1024 at 400 % is 320×256). WCAG 1.4.10.
- `.site-header { position: static }`; `html { scroll-padding-top: 8px }` (including `html[data-view="ahead"]`).
- `.ahead-switch { position: static }` (WP5 writes this rule in pages.css), and `.rec-tabs { position: static }` (WP3, record.css).
- `.tab-bar` is compact: 48 px cells, icon (20) beside the label in one row, label 12/600; `--tabbar-h: calc(48px + env(safe-area-inset-bottom))`.
- `dialog.sheet--record`, `dialog.sheet--filters` and `dialog.sheet--stamps`: `inset: 0; width: 100%; height: 100%; max-height: none; border-radius: 0; overflow: auto`. `.sheet-head` and `.sheet-foot` are `position: static` and `.sheet-body` is `overflow: visible`, so the dialog scrolls as one and no fixed sheet chrome remains. `.sheet--record .sheet-body { scroll-padding-top: 8px }` moves to the dialog.
- `.map-stage[data-explore="true"]` (WP4): height `calc(100svh - var(--tabbar-h) - 16px)` instead of `min(70svh, 560px)`, so the whole explorable map fits on screen.
- Acceptance (smoke 1 and 7 at 640×410, 844×390, 320×256): no horizontal overflow; focus never obscured; once the header has scrolled away, fixed chrome takes at most 45 % of the viewport height.

**`@media (forced-colors: active)`**:
- pressed `.chip` and `.ahead-switch [aria-current]`: a 2 px `CanvasText` border; the `i-check` icon carries the state;
- `.status::before` symbols: `forced-color-adjust: none` with the symbol drawn as a border shape (ring, dashed ring, square) in `CanvasText`, so it survives;
- ended cards (WP3): the offset shadow is replaced by a 3 px `CanvasText` border; the ST4 text still says "Ended / suspended";
- `.band` (WP1), `.side-pill` (WP3), `.roadmap-status` (WP5): 1 px `CanvasText` border;
- map: WP4 keeps the hatch (a pattern, not a colour) and the selection and focus outlines in `Highlight`.

**Safe areas** (`viewport-fit=cover`): header, tab bar, `.site-footer--app`, `#action-feedback` and every sheet's head, body and foot use inline padding `max(var(--gutter), env(safe-area-inset-left))` and `max(var(--gutter), env(safe-area-inset-right))`. The bottom keeps `env(safe-area-inset-bottom)`.

---

## 18. Copy rules

### 18.1 Banned vocabulary (editorial §2) and the automated scan

These terms must never appear in UI text, `aria-label`, `title`, `alt`, meta or OG text:
- Live, LIVE, Live now, Happening now, Right now, Breaking, Real-time, Active protests, Current protests, Ongoing now;
- "Tracking N protests", "N protests worldwide";
- Hotspots, Trending, Most active, Escalating, Unrest index, Severity, Danger, Risk level, Top countries, Top issues, Sides, vs, As of, Synced, Join, Attend, RSVP, Remind me, Add to calendar, Live desk;
- "Updated", "Last updated", "Reviewed" or "Verified" as the start of a stamp-like element;
- "New" as the whole text of a badge, chip, band, status, button or tab.

**Allowlist (exact sentences only):** H1 ("…not a comprehensive live feed.") and P2 ("…not a live feed.").

**Stance-total scan** (smoke check 23, editorial check 3): no element's own text matches `/\b\d+\s+(for|against|support|supports|oppose|opposes)\b/i` or contains "%", with the same data-verbatim exception (b) below.

**Scan** (smoke check 14; test_shell for static HTML): case-insensitive, whole word or phrase. It runs over every element's own text and the attributes above, in all five views, the record sheet (5 records), the filter sheet and the dates sheet, on the 2 Oct and 9 Oct clocks. A hit is allowed only if (a) it is inside an allowlisted sentence, or (b) the hit text node's full content occurs verbatim in a `public/*.json` value (record data is not our copy).

### 18.2 Copy deck strings rewritten in this SPEC (and why)

| ID | Editorial text | SPEC text | Reason |
|---|---|---|---|
| ST1 | "Reported ongoing as of {date}" | "Reported ongoing · evidence dated {date}" | "As of" is banned (§2) |
| S5 | "…not as a picture of current protests." | "…not as a picture of protests today." | "Current protests" is banned |
| E5 | "…coverage is unknown right now, not zero." | "…coverage is unknown at the moment, not zero." | "Right now" is banned |
| R4 | "A severity or 'danger' score. … Live tracking of police, troops or crowds. … Reminders, calendar exports or 'join' buttons for planned protests." | "Any score that rates or ranks how serious a protest is. … Tracking the positions of police, troops or crowds. … Reminders, calendar exports or sign-up buttons for planned protests." (the other five items are verbatim) | "Severity", "Danger", "Live", "Join" are banned even when negated (judge) |
| §4 discovery explainer | "This is not a live service check." | "It does not show whether the discovery service is working today." | "Live" |
| C5 same-day | "19 Nov 2024 (one day) · ended" | "19 Nov 2024 (one day) · ended / suspended" | Matches ST4; "ended" alone overstates |
| A's stamps intro | "None of them means a protest is happening now" | "Each date answers a different question. None of them shows that a protest is still going on." | "Happening now" |
| tech §9.1 Ahead empty | "This round's research could not reach news sites…" | A3–A6, with A5 from data (§12.2) | Judges: undated or inaccurate |
| A's filter row | "Custom date ranges and movement grouping are coming next" | "Custom date ranges are a later item on the roadmap. See Coming next" | LATER-5 is "later", not "next" |
| R2 | "'Shipped' means live on this site now and checked after it was deployed." | "'Shipped' means available on this site now and checked after it was deployed." (rest verbatim) | "Live" |
| R3 | "Shipped: live on this site now. · In progress: being built; not live yet. · …" | "Shipped: available on this site now. · In progress: being built; not available yet. · …" (rest verbatim) | "Live" |

`NOT_PLANNED` (R4, final, in order):
1. "Any score that rates or ranks how serious a protest is."
2. "Popularity or approval percentages."
3. "Predictions of unrest."
4. "Tracking the positions of police, troops or crowds."
5. "Identification of participants."
6. "Reminders, calendar exports or sign-up buttons for planned protests."
7. "Country or region rankings."
8. "Automatic publication of discovered leads."

### 18.3 Where each copy-deck ID lives

| ID | Location |
|---|---|
| H1–H3 | `#data-notice` |
| H4–H6 | `#stamp-chip` |
| H7 | not used |
| S1–S2 | `#feed-stats` |
| S3 | fresh-group note |
| S4–S6 | notice lines |
| S7 | `.feed-gap` or fresh-group end, and the dates sheet |
| F1–F5 | `.band` |
| F6 | `.feed-group-title` |
| F7 | `#feed-explainer` |
| ST1–ST5 | `.status` |
| C1–C11 | cards |
| D1–D11 | record sheet |
| E1, E4, E5, E7, E8 | `#event-list` |
| E2, E3 | brief |
| E6 | map fallback |
| E9 | Countries |
| M1–M9 | `#map-legend` (M8 also in About) |
| A1–A10 | Ahead |
| R1 | Ahead switch label "Coming next" |
| R2–R5 | roadmap section |
| T1–T2 | `#footer-stamps` |
| T3 | `#stamps-title` |
| T4–T5 | `#stamps-body` / `#about-stamps` |
| P1–P2 | head |

### 18.4 Strings added on 3 Oct 2026 (C-50; verbatim)

| Where | String |
|---|---|
| Notice, events error (`data-kind="error"`) | E5: "Published records could not be loaded, so coverage is unknown at the moment, not zero." |
| Notice, countries-only error | "The country directory could not load; records are listed by country code." |
| Map legend / overview / brief / Countries dek, events error | "Coverage cannot be shown because published records did not load." |
| Filter sheet, events error | "Filters are unavailable because published records did not load." |
| E7 rule, ongoing | "That label needs evidence dated within 72 hours." |
| E7 rule, planned | "That label applies only to an episode with a sourced future start date." |
| E7 rule, needs-review | "That label applies when a 'Reported ongoing' episode's latest evidence is more than 72 hours old." |
| E2, search failed | "A first search on {date} failed, so {Country} has not been checked yet. This is a coverage gap, not evidence that no protests occurred." |
| E2, not yet searched | "{Country} has not been searched yet. This is a coverage gap, not evidence that no protests occurred." |
| E2, ledger loading / Countries rows while the ledger loads | "Checking the search log…" |
| E2, ledger failed | "The search log could not load, so whether {Country} was searched is not shown here. This is a coverage gap, not evidence that no protests occurred." |
| Example loading (list, stats, legend) | "Loading the illustrative example…" |
| Example error (list) | "The illustrative example could not load." / "Nothing here is reported data." [Retry example] [Back to reported data] |
| Example error (stats) | "Illustrative example unavailable. Nothing here is reported data." |
| Example error (summary, legend) | "Illustrative example unavailable" |
| Countries dek, example mode | "This directory shows reported data. Choosing a country returns you to it." |
| Ahead, non-day scheduled-now | "Planned period includes today · occurrence not established" |
| Dates sheet discovery row | "Loading…" / "Discovery audit unavailable." |
| Build stamp malformed (footer, dates sheet) | "Site build stamp could not be read" |
| About research scope | "Loading the research scope…" / "Research scope unavailable." [Retry] |
| Reports actions | "Copy link to this view" · "Download CSV" |
| About CSV row | "Download CSV of the records matching your current filters" |
| Share fallback | "Copy this link:" (+ input, `aria-label="Link to copy"`) · "Close" |
| Filter sheet status | "{n} records match" · "1 record matches" · "No records match" |
| Record step announcement | "{title}. Record {i} of {n} in this view." |
| Record eyebrow outside the filtered list | "Record" |
| Record sections nav label | "Record sections" |
| List density facts line | "Timeframe:" · "Intensity:" |
| Active filter chip prefix (visually hidden) | "Remove filter: " |

---

## 19. Work packages

General rules (all WPs):
- tech §4.1 global rules apply.
- Write only your own files.
- Use only the class prefixes tech §4.9 assigns to you, plus the additions below.
- Tokens only: no hex literal outside styles.css `@layer tokens`.
- Every new string comes verbatim from this SPEC.
- Hand-off: your files only; `node --test tests/*.mjs` and `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests` green; a note listing any contract question.

### 19.0 Module import table (C-48; frozen)

Each module may statically import **only** what its row lists. ● marks a mandatory edge: Phase 0 writes it into the stub and it must stay. The mandatory edges make the static graph of `app.js` exactly these **21 modules** from Phase 0 on: `app.js explore.js freshness.js history.js js/html.js js/model.js js/store.js js/router.js js/data.js js/actions.js js/filters.js js/list.js js/stamps.js js/notice.js js/sheet.js js/record-facts.js js/cards.js js/detail.js js/ahead.js js/countries.js js/about.js`. WP1 writes this set as the modulepreload links, and test_shell's "modulepreload equals the static graph" check is green on every branch. Lazy only (never static): `map.js`, `js/map-view.js`, `js/country-brief.js`. `review.js` is not in the graph. No cycles.

| Module (owner) | Allowed static imports (● mandatory) |
|---|---|
| `app.js` (WP2) | ● `./explore.js` ● `./freshness.js` ● `./js/html.js` ● `./js/model.js` ● `./js/store.js` ● `./js/router.js` ● `./js/data.js` ● `./js/actions.js` ● `./js/filters.js` ● `./js/list.js` ● `./js/stamps.js` ● `./js/notice.js` ● `./js/sheet.js` ● `./js/record-facts.js` ● `./js/detail.js` ● `./js/ahead.js` ● `./js/countries.js` ● `./js/about.js`; dynamic only: `./js/map-view.js` |
| `explore.js` (WP2) | `./freshness.js` |
| `freshness.js` (frozen) | none |
| `history.js` (WP3) | `./js/html.js`, `./freshness.js` |
| `js/html.js` (WP3) | ● `../freshness.js` |
| `js/model.js` (WP2) | `../freshness.js`, `../explore.js`, `../history.js` |
| `js/store.js` (WP2) | none |
| `js/router.js` (WP2) | none |
| `js/data.js` (WP2) | none |
| `js/actions.js` (WP2) | `./model.js`, `../explore.js` |
| `js/filters.js` (WP2) | `./model.js`, `./html.js`, `../explore.js` |
| `js/list.js` (WP2) | ● `./cards.js`, ● `./ahead.js`, `./model.js`, `./html.js`, `../freshness.js` |
| `js/stamps.js` (WP2) | `./about.js`, `./model.js`, `./html.js`, `../freshness.js` |
| `js/notice.js` (WP2) | `./model.js`, `./html.js`, `../freshness.js` |
| `js/sheet.js` (WP1) | none |
| `js/record-facts.js` (WP3) | `./html.js`, `../freshness.js` |
| `js/cards.js` (WP3) | ● `./record-facts.js`, `./html.js`, `./model.js`, `../freshness.js` |
| `js/detail.js` (WP3) | ● `../history.js`, ● `./record-facts.js`, `./html.js`, `./model.js`, `../freshness.js` |
| `js/ahead.js` (WP5) | `./html.js`, `./model.js`, `../freshness.js` |
| `js/countries.js` (WP5) | `./html.js`, `./model.js` |
| `js/about.js` (WP5) | `./html.js`, `./model.js`, `../freshness.js` |
| `js/map-view.js` (WP4, lazy) | ● `../map.js`, ● `./country-brief.js`, `./html.js`, `./model.js`, `../freshness.js`, `../history.js` |
| `js/country-brief.js` (WP4, lazy) | `./html.js`, `./model.js`, `../freshness.js`, `../history.js` |
| `map.js` (WP4, lazy) | ● `./history.js` |

A builder who needs an edge that is not in the table asks the lead. If one is approved, the lead regenerates the modulepreload set at integration step 2 (§22.1).

### 19.1 Class prefixes

Class-prefix additions:
- **WP1:** `latest-rail latest-links view-head view-dek site-header-inner site-footer--app primary-nav brand-name stamp-chip* footer-stamps sheet-head-title sheet-minititle toast--sheet toast-*`.
- **WP2:** `feed-*` (incl. `feed-head feed-density feed-explainer feed-actions feed-gap feed-group*`), `list-*` (incl. `list-more`), `result-*`, `filter-*` (incl. `filter-check`), `quick-*`, `active-*`, `stamp-list*`, `notice-*`.
- **WP3:** `card*`, `rec-*`, `facet*`, `side*`, `source-*`.
- **WP4:** `map-*` (incl. `map-layout map-main map-regions map-selbar map-hint map-selection* map-focus-* map-watermark`), `city-*`, `legend-*`, `brief-*`, `country-panel`.
- **WP5:** `ahead-*` (incl. `ahead-switch ahead-teaser*`), `announce-*`, `roadmap-*`, `dir-*`, `scope-*`, `ledger-*`, `about-*`.

### WP1: Shell, tokens, primitives, sheets, 404, shell tests, smoke

**Files:** `index.html`, `styles.css`, delete `atlas.css` and `history.css`, `404.html`, `js/sheet.js`, `tests/layout-preview.html`, `tests/test_shell.mjs`, `tests/browser/smoke.cjs`.

**Brief.**
1. Finish `index.html` per §4.6:
   - the full sprite (§17.9);
   - static About copy (§14 items 1–4 and 8 static parts, plus the mount points);
   - footer (§4.4), example banner (§4.3), P1/P2 meta;
   - an import map covering every root module and every `js/*.js`, at v4.0;
   - modulepreload for exactly the 21-module set in §19.0;
   - the 3 Oct additions: `#map-selbar`, `#record-announcer`, `#record-feedback`, `#filters-status`, `.feed-actions` buttons, `h1` view titles, `tabindex="-1"` on `#filters-title` and `#stamps-title`, and `site-footer--app`.
2. Rewrite `styles.css`, in this order:
   - `@layer reset, tokens, base, layout, components, views, utilities;`
   - tokens (§17.1, light, dark and legacy aliases);
   - base (type, focus, motion);
   - layout: header and chip (§4.1), notice container, view visibility, the `.view[data-view="latest"]` grid at ≥ 1200 (§5), tab bar, footer;
   - primitives (§17.8), including `input`/`select` with `--border-input`, `summary` at `--tap`, `[aria-disabled]` buttons and the toasts (§4.5);
   - sheet geometry for the three dialogs (§8.1, §9, §10), with `.sheet--record .sheet-body { scroll-padding-top: 52px }`;
   - the focus and scroll-padding rules (§17.5), and `:root` defaults for `--header-h`/`--tabbar-h`/`--gutter` (§17.4);
   - §17.10: `(max-height: 500px)`, `(forced-colors: active)` and safe-area padding.
3. `review.html` must still render with its classes (`wrap site-header brand brand-mark edition eyebrow skip-link site-footer noscript status`) and the legacy aliases, using the compatibility rules in §17.8 (direct-child header on `.site-header:not(:has(.site-header-inner))`, `.brand small`, `.site-header nav`, `.brand-mark` min-width, tab-bar padding only on `.site-footer--app`).
4. `js/sheet.js`:
   - `initSheets` (delegation for `data-open-sheet`, `data-sheet-focus`, `data-close-sheet`, `data-scroll-to`; backdrop rect test; `cancel` → `closeSheet(…, 'escape')`; dispatches `sheet:open`/`sheet:close`);
   - `openSheet`, `closeSheet`, `isOpen` per tech §4.6, with the default focus `'[data-autofocus], h2[tabindex="-1"]'` (C-47);
   - `data-close-sheet` on an `<a href>`: close (reason `'link'`) without `preventDefault`, so the navigation runs;
   - `data-scroll-to`: `scrollIntoView({block: 'start'})` within `sheetScroller(dialog)` or the page, then focus;
   - `sheetScroller(dialog)` (C-42);
   - `initChromeMetrics` (C-25), writing only for displayed elements;
   - no detents.
5. `404.html` per §15 (absolute fallbacks, runtime `home` rewrite).
6. `tests/layout-preview.html` page options: `index.html#/latest|#/map|#/ahead|#/ahead/roadmap|#/countries|#/about`, `review.html`, `404.html`.
7. `test_shell.mjs`:
   - tech §10.1 checks;
   - pinned ids (§4.6);
   - the banned-vocabulary scan of the static text and attributes of `index.html` and `404.html` (§18.1);
   - no `!important` in any `.css`;
   - `css/*` only `@layer components|views`;
   - budgets from tech §6.2.
8. `smoke.cjs` with checks §22.2.

**Consumes:** nothing at runtime. Smoke runs against the integrated build.

**Provides:** tokens (§17.1 names), primitives, DOM ids, the sheet API (incl. `sheetScroller`), `--header-h`/`--tabbar-h`.

**Acceptance.**
- test_shell passes (including pinned ids, `h1` view titles and the §19.0 modulepreload set).
- At 320/360/390/768/1440 **and** 640×410, 844×390, 320×256 there is no horizontal overflow. The shell works at **200 % zoom** (720×450) and 400 % (320×256): after the header scrolls away, fixed chrome takes at most 45 % of the height, and the record and filter sheets scroll as one.
- `review.html` at 390 and 1440 has no errors and no overflow, and its header boxes match the 3.1 baseline within 4 px (smoke 10).
- Every control is at least 44×44 (including `summary`) and no text is under 12 px (smoke 7).
- Focus is never hidden under the header, tab bar, `.ahead-switch` or `.rec-tabs` (smoke 2, 7, 21).
- `--border-input` ratios (§17.1) and both example stripes against `--on-example` are measured in both modes and pasted into the hand-off.
- Dark tokens differ from light (smoke 11), and reduced motion removes all transitions.
- The palette validator output (§17.2) for the final hexes, in both modes, is pasted into the hand-off note, together with `--map-focus` against `--map-selected-halo` (≥ 3:1 in both modes).
- `404.html` has no relative `href` or `src` (every one starts with `/protest-atlas/` or `https://`) and has `noindex`.
- The banned-vocabulary scan of static HTML is clean.

### WP2: Controller, state, routing, data, filters, Reports list, stamps, notice

**Files:** `app.js`, `explore.js`, `js/model.js`, `js/store.js`, `js/router.js`, `js/data.js`, `js/actions.js`, `js/filters.js`, `js/list.js`, `js/stamps.js`, `js/notice.js`, `css/feed.css`, `tests/test_core.mjs`.

**Brief.** Implement tech §2 and §4.4–§4.6 with C-02 to C-13 and C-21 to C-28:
- **`js/model.js`:** `snapshotState`, `evidenceAgeDays`, `statusLabel(status, event)`, `statusOptions`, `datasetStats` (C-08), `searchableText` (C-09), `sweepFact` (§6.6), `groupByBand`, `emptyBandNotice`, `PAGE_SIZE = 12`, `sortByObservation` with file-order ties (C-34), and a `timeSnapshot` that includes `snapshotState` **and** `evidenceAgeDays` (C-52).
- **Router:** C-24 aliases; `aria-current` on the most specific displayed match per nav container (§3.3); `VIEW_NAMES` titles; the C-35 scroll and focus rules (§3.2).
- **Data:** `LAZY.mapCodes`; `loadCritical` with per-file settlement (C-37).
- **Actions:** `setDensity`, `clear-except-country`, guards inside the export and share handlers (§4.5), `ui.feedbackURL`, `dismiss-feedback`; `stepRecord` per C-46; `setMode('example')` followed by `navigate('latest')` from `#about-example` and the true-empty button (C-38).
- **Filters (§6.2, §9):** live, patched in place; zero status options hidden; no counts on chips, regions or issues; the `filter-check` and `chip-check` icons; active chips with "Remove filter: "; footer buttons rendered once; `#filters-status`; the events-error body.
- **List (§6.3–§6.5):** groups (`h2`), E4, S3, S7, teaser placement via `aheadTeaserHTML({upcoming, load: state.load, now})`, pagination, `.feed-actions` `aria-disabled`, and every empty, error and loading state with exact copy, including per-status E7 and the example loading and error states.
- **Stamps (§4.1 chip, §10 rows, §4.4 T1/T2):** `chipModel`, `stampItems(stamps, now, extras)` with `extras.discovery = discoveryView(state.data.discovery)` and `extras.discoveryLoad`, `footerStampsHTML` (absent and malformed build), `refreshTimes`.
- **Notice (§4.2):** S4/S5/S6, E5, countries-error and the dropped-params line; `counts` gate the "What this means" details; patch-only writes (C-26).
- **app.js:**
  - boot;
  - mount components, with lazy first-visit render for Countries, About and roadmap;
  - delegated listeners (tech §4.8 + C-13);
  - record open/step/close: fill `#record-eyebrow` ("Record {i} of {n} in this view", or "Record" outside the filtered list), `#record-minititle`, `#record-source` (`primarySource`) and `#record-announcer` on a step; call `mountRecordChrome(...).refresh()`;
  - **the feedback render and the 4 s auto-hide** (§4.5, C-36), choosing `#record-feedback` while the record sheet is open;
  - E6 in `#map-stage` with its own re-import retry when `import('./js/map-view.js')` rejects (§11.2);
  - example-mode directory taps: `setMode('reported')` first (C-38);
  - load discovery lazily on the first open of `#stamps-sheet`;
  - the 60 s tick + `visibilitychange` + `pageshow`, recomputing `snapshotState` independently of status changes (§16.2 item 7);
  - call `initChromeMetrics`.
- **`css/feed.css`:** styles for feed, `.feed-actions`, filters (including the segmented focus and checked marker, §9), filter sheet body, active chips, dates list and notice lines, using tokens only.

**Consumes:**
- WP3: `renderCard`, `renderCardSkeleton`, `renderRecord`, `patchRecordStatus`, `mountRecordChrome`, `RECORD_SECTIONS`, `primarySource`.
- WP5: `aheadTeaserHTML`, `mountAhead`, `mountCountries`, `mountAbout`.
- WP4: dynamic `import('./js/map-view.js')` → `mountMap`, `import('./js/country-brief.js')` (inside map-view).
- WP1: `initSheets`, `openSheet`, `closeSheet`, `isOpen`, `initChromeMetrics`.
- `freshness.js`, `js/html.js`.

**Provides:** the store, `State` (tech §4.4 + `ui.density`), actions, model selectors (`selectFiltered`, `statusLabel`, `sweepFact`, `snapshotState`, `cityOptions`, `refinementOptions`), router events.

**Acceptance (test_core + smoke).**
- `snapshotState` returns `aging` at 2026-10-05T00:00:00Z, `stale` at 2026-10-09T00:00:00Z and `archive` at 2026-11-01T00:00:00Z for newest evidence 2026-10-02 (and `current` 1 ms earlier for each).
- `noticeModel` contains `PILOT_DISCLOSURE` in every state, plus S4/S5/S6 with exact text.
- `chipModel` at 2 Oct 23:00 gives value text matching `/\d{2}:\d{2} UTC/`; at 9 Oct 12:00 gives label "Stale snapshot" and value "newest evidence 7 days old" with tone warn.
- `sweepFact` on the real files equals §6.6.
- `statusOptions` on the real data has no ongoing, planned or needs-review option; with `status:'ongoing'` it includes that option with count 0, and the list renders E7.
- `searchableText(es-housing)` contains "parliament rejected the decrees" (folded).
- `emptyBandNotice` is `null` at 2 Oct, `'fresh'` at 6 Oct (week non-empty) and `'week'` at 9 Oct 12:00.
- `groupByBand` headings at 9 Oct start "7 to 30 days ago".
- `stampItems` labels equal §10 and a missing build gives T2.
- `timeSnapshot` changes at the band and snapshot boundaries, **and** between 2026-10-10T23:59Z and 2026-10-11T00:00Z (C-52).
- The first record of `sortByObservation(real events)` is `in-electoral-20261002` (C-34).
- `loadLazy('examples')` with a 404 sets `load.lazy.examples === 'error'`, and the list renders the example error copy with `data-retry="examples"` and `data-set-mode="reported"` (C-38).
- `loadCritical` with countries 500 and events 200 keeps `data.events`; `noticeModel` has a `countries-error` line and no `error` line. With events 500: an `error` line equal to E5, and `counts === null` (C-37).
- E7 text for `?status=planned` contains "sourced future start date", and for `ongoing` contains "within 72 hours".
- Every `[data-action="export-csv"]` has `aria-disabled="true"` in example mode and with 0 matches.
- tech §10.1 test_core list (routes incl. `#/reports` and `#/coming-next`, dropped params, codec, store immutability, `exportAllowed`, `shareURL`, `loadCritical` 404/500/shape).
- Smoke 2, 3, 4 (incl. 4.6), 5, 9, 13, 17, 18, 19, 20 and 22 pass.
- No `localStorage` anywhere.
- First `#/latest` DOM is at most 1,500 nodes.

### WP3: Record facts, cards, detail sheet body, outcome section

**Files:** `js/html.js` (maintain; additions only), `js/record-facts.js`, `js/cards.js`, `js/detail.js`, `history.js`, `css/record.css`, `tests/test_record.mjs`.

**Brief.**
- `record-facts.js` exactly per §7.4 and §7.6 (C-14).
- `renderCard` per §7.1–§7.5 (two densities, both carrying C1–C8; example watermark; ended treatment; stretched link with the publisher link above it; no chevron; band markup with visually hidden long label, C-51).
- `renderRecord` per §8.2–§8.9 (D1–D10, glance, `nav.rec-tabs[aria-label="Record sections"]`, `#detail-source-N`, `#temporal-update`, "As reported:" claims, unquoted; `.source-ref` at `--tap` height).
- `css/record.css` additions: `.rec-tabs { position: static }` under `max-height: 500px`, and the forced-colors rules for ended cards and `.side-pill` (§17.10).
- `RECORD_SECTIONS` (C-15).
- `mountRecordChrome` (§8.1).
- `patchRecordStatus` (tech).
- `history.js`:
  - keep `contextFor`, `matchesHistory`, `completionKind`, and `outcomeHTML` with its pinned strings;
  - add `data-scroll-to="detail-source-N"` to its refs;
  - drop the "RESULTS / FOLLOW THE CHANGE" eyebrow;
  - remove `renderResearchCoverage` (WP5 owns the ledger now).
- `css/record.css`: cards, pills (§7.3, no `data-stance` selectors), facets, glance, record body, source list, legacy outcome classes.

**Consumes:** `js/html.js`, `freshness.js`, `getDisplayStatus`/`statusLabel` from `js/model.js` (WP2; frozen signatures), `history.js` `outcomeHTML`.

**Provides:** `renderCard`, `renderCardSkeleton`, `renderRecord`, `patchRecordStatus`, `RECORD_SECTIONS`, `mountRecordChrome`, `primarySource`, record-facts exports.

**Acceptance (test_record + smoke 15/16/21/23).** Worked cases render exactly; the card text contains each of these lines:
- kr-yoon: "Against Yoon’s presidency — Anti-Yoon demonstrators" and "Against Yoon’s removal — Pro-Yoon demonstrators" (pill text + target + actor);
- ng-pengassan: two "For" lines, "Union rights and reinstatement — PENGASSAN" and "Company reorganisation — Dangote management";
- nz: "Against Treaty Principles Bill — Hīkoi mō te Tiriti supporters" and "For Treaty Principles Bill — ACT Party", plus D4-sub in the detail;
- es-housing: For "Tenant protection" and Against "Proposed housing decrees"; "Disruption: Disruption beyond the reported march not established." shown verbatim (described);
- as-noaa: its disruption text verbatim.

Further cases:
- Exactly the computed set of records (33 in the real data) gets the single C6 line, and none shows "0", "—", "None" or "N/A" for intensity or state response.
- All 47 records without a state response show D6-empty in the detail and "Not established in this record" on the card.
- tz-drivers card: the `.status` text "Ended / suspended 30 Sep 2026" precedes the band "Within 72 h" in DOM order (at 2 Oct); timeframe "29 Sep – 30 Sep 2026 (2 days) · ended / suspended".
- nz timeframe: "19 Nov 2024 (one day) · ended / suspended". kr-yoon: "Dated evidence 21 Dec 2024 – 4 Apr 2025 · onset and end not established".
- Every card, in both densities, contains a publisher link with `rel="noopener noreferrer"`, "published", a verification label and "AI-assisted check", **and** the issues line, the timeframe line and an intensity line (C-51).
- No `.band` carries `aria-label`; its visually hidden text equals the F-label.
- No rendered card or record contains `“`, `”`, "+ FOR", "− AGAINST", "%", "Sides" or "Violence:" (it must be "Violence or harm"); claims start with "As reported:".
- `renderRecord` contains `detail-title`, every `RECORD_SECTIONS` id, `detail-source-1`, D1 and the outcome pinned strings.
- `<script>` is escaped in title, summary, claim and action.
- Every real event + context renders in both densities without throwing.
- The `outcomeHTML` tests in test_explorer still pass.
- Card height at 390 is reported by smoke (target 430–560 px).

### WP4: Map view, legend, country brief, map assets

**Files:** `map.js`, `js/map-view.js`, `js/country-brief.js`, `css/map.css`, `scripts/prepare_map.py`, `public/world-map-codes.json` (generated), `public/world-map-metadata.json` (regenerated), `tests/test_map.mjs`, `tests/test_map_assets.py`.

**Brief.**
- Implement tech §5 fully: TopoJSON plus codes only, land fit 1000×448, gestures (page mode default, Explore toggle), largest-cluster focus, roving tabindex, CSS-only colours.
- Add the C-17 selection overlay with halo, the C-40 focus overlay (halo + ring as the last overlay children), the scale-aware shadow offset, and city label culling (§11.3).
- `map-view.js`:
  - lazy mount;
  - `#map-regions` chips (`data-action="map-region"`, `focusRegion`; "World" = `reset`);
  - `#map-controls` (zoom, World, Explore only) and the selection bar in `#map-selbar` (C-39);
  - `#map-legend` (§11.5 with `.map-hint`, plus the events-error, example and unavailable variants);
  - the example watermark `.map-watermark` and neutral land while the example loads or fails (C-38);
  - `map.update({error: true})` on `load.errors.events` (C-37);
  - the unavailable state: `aspect-ratio: auto`, with region chips, zoom, World and Explore hidden;
  - the transient tooltip hint;
  - failure state E6 with retry;
  - auto-focus on country change;
  - exit Explore on route change, Escape or leaving the viewport.
- `country-brief.js` per §11.6 (C-19: no leads), with the E2 variants and the ledger-loading and events-error leads (C-50).
- `css/map.css`: tech §5.6 rules with the selected-fill and `:focus-visible` stroke rules removed and the overlay rules added; stage geometry (§11.1: the svg fills the stage); legend swatches from the same tokens (the M4 swatch is an outline); the forced-colors map rules (§17.10).
- Optional P2, only after everything else passes: at ≥ 1200 a full-bleed map with a floating 424 px panel, via an optional `inset` parameter on `focusTransform`. It must not change any other contract.

**Consumes:** `js/html.js`, `freshness.js`, model selectors (`selectFiltered(state, {ignoreCountry:true})`, `statusLabel`) from `js/model.js`, `history.js` `completionKind`, the actions (`selectCountry`, `selectCity`, `setFilter`), lazy loader names `cities`, `coverage`, `research`.

**Provides:** `mountMap(ctx)` → `{render, ensure}`; the `map.js` exports per tech §5.2; the `mapready`/`maperror`/`mapzoom`/`mapgestures` events; `public/world-map-codes.json`.

**Acceptance.**
- tech §14 WP4 exit criteria.
- test_map (tech §10.1) + test_map_assets (codes reproduce the GeoJSON codes in order; every code exists in `countries.json`; metadata hashes match; deterministic re-run).
- Smoke 6 (geometry per C-41):
  - 177 paths; `viewBox="0 0 1000 448"`; at k = 1 the union of `.map-country` boxes has aspect 984/432 ± 2 % and a width of 0.984 × the svg width ± 0.01; at 1440 the svg box aspect is 1000/448 ± 2 %; `touch-action: pan-y`;
  - Tab into the map: `.map-focus-ring` exists and is the last child of `g.map-overlay`, which is the last child of the zoom group; with FR selected and focused, the ring is painted after `.map-selection`;
  - `#zoom-out` disabled at 1×;
  - FR `data-zoom` ≥ 4 with its box inside the svg;
  - at most one `[tabindex="0"]`;
  - wheel scrolls the page;
  - no GeoJSON request.
- After selecting FR, `path.map-selection` exists, and the FR `.map-country` computed fill equals the computed `--map-reported`.
- Legend text equals M1–M8 (M9 appears with `?window=7`).
- The brief for IS (no record) shows E2 with the ledger date and result count, and no URL from `candidate_urls`. test_map: `briefModel` gives the "failed" and "not yet searched" E2 variants from fixture ledgers, and never "0 results" for a failed search.
- A forced map failure (block `world-110m.topo.json`) shows E6 while the list and Countries still work. The stage has `aspect-ratio: auto`, E6 and both buttons are fully visible at 320 px, and region chips and zoom are hidden.
- With events blocked, no `.map-country` has the reported fill or the hatch, and the legend reads "Coverage cannot be shown because published records did not load." (smoke 19).
- In example mode `.map-watermark` is present.

### WP5: Ahead (actions + roadmap), Countries, About data, roadmap validator, site tests, CI

**Files:** `js/ahead.js`, `js/countries.js`, `js/about.js`, `css/pages.css`, `public/roadmap.json` (content from §20 is written in Phase 0; WP5 validates it and changes it only with lead approval), `scripts/validate_roadmap.py`, `scripts/build.py` (add the validator call only; `PUBLIC_FILES` stays as Phase 0 set it), `tests/test_roadmap.py`, `tests/test_pages.mjs`, `tests/test_site.py`, `tests/test_upcoming.py` (+ empty-items case), `.github/workflows/pages.yml`, `package.json`.

**Brief.**
- **Ahead (§12):**
  - switch handling via `#ahead-root[data-section]`; heading levels per C-45; `#ahead-actions-title` with `tabindex="-1"`; `tabindex="-1"` on every roadmap article;
  - "What's blocking this →" lands on `#roadmap-item-list-announced-actions` (§12.2);
  - the non-day `scheduled-now` label override in `announcementView` (C-50);
  - `.ahead-switch { position: static }` under `max-height: 500px`;
  - actions section: A2, A2-sub, A9, the empty state A3–A6 (A5 from `sweepFact`), specimen, state labels, absent/error, filled items per §10.2 with no countdown for week or month, A8 group;
  - roadmap section: R2, R5, buttons, R3 legend, jump pills, groups in order, items (§12.3), `NOT_PLANNED` (§18.2).
- `aheadTeaserHTML` (§6.5).
- **Countries (§13):** E9 labels, "Checking the search log…" while the ledger loads, "Coverage unavailable" on events error, the example-mode dek, lazily loaded `mapCodes` for the "Not drawn on the map at this scale" note, `entriesLabel`, `h2` regions.
- **About (§14):** `#research-scope` (counts including `positions` and `episodes`, limit text, lazy ledger table with no candidate URLs, caption from the ledger window, loading and failure copy) and `#about-discovery`.
- Style the static `.about-*` and `.ahead-*` markup.
- **`validate_roadmap.py`** per tech §8.3. For a Python `test` ref of the form `Class.method`, both names must occur in the file. Wire it into `build.py`.
- **`test_site.py`** per tech §10.2; in `404.html` any `href` or `src` not starting with `/protest-atlas/` or `https://` is a failure (§15).
- **`pages.yml`:** concurrency + pins + verify job (tech §10.3).
- **`package.json`:** add `"smoke"`.

**Consumes:** `freshness.js` (`announcementState`, `ANNOUNCEMENT_LABELS`, `countdownLabel` only for day/range), `js/html.js`, `js/model.js` (`sweepFact`, `refinementOptions`), loader names `roadmap`, `coverage`, `research`, `discovery`, `mapCodes`, the action `selectCountry`.

**Provides:** `mountAhead`, `mountCountries`, `mountAbout`, `aheadTeaserHTML`, `NOT_PLANNED`, `groupAnnouncements`, `announcementView`, `roadmapGroups`, `evidenceHref`, `reviewOverdue`, `directoryRows`, `regionGroups`, `entriesLabel`, `researchScope`, `discoveryView`.

**Acceptance.**
- test_pages (tech §10.1 list), plus:
  - `announcementView` for week precision has `countdown === null` and `dateText` "Week of 5 Oct 2026 · exact day not announced";
  - `announcementView` for **month** precision (editorial check 7) has `countdown === null` and `dateText` "October 2026 · exact day not announced";
  - a range or month item whose period includes today has the state label "Planned period includes today · occurrence not established"; a day item dated today keeps "Planned for today · occurrence not established";
  - `researchScope` on the real files gives `positions === 92` and `episodes === 84`;
  - A5 renders "On 2 Oct 2026, our search …" from the real `upcoming.json`, and the fallback text when the note has no sweep sentence;
  - `aheadTeaserHTML` for 0 items, n items, absent and error;
  - `directoryRows` gives "1 episode published", "Searched · no published episode", and `drawn: false` for AD;
  - `NOT_PLANNED` has 8 items and contains no banned word.
- test_roadmap (tech §8.4 cases) passes, and the real `public/roadmap.json` validates with the real clock.
- The roadmap contains no `shipped` item whose id is among `mobile-first-redesign`, `clear-dates-and-stale-warnings`, `record-cards-key-dimensions` or `ahead-page`.
- `test_site.py` is green (no broken internal reference; `404.html` self-contained; GeoJSON not published).
- `build.py` fails on an invalid roadmap.
- Smoke 8: Ahead shows A3–A6 and the switch; `#/ahead/roadmap` shows groups in order, and every shipped item has an evidence link. Pressing "What's blocking this →" puts `#roadmap-item-list-announced-actions` at the top below the switch, with focus on it. On `#/ahead/roadmap` at 1440 exactly one `#primary-nav` link has `aria-current="page"` ("Coming next").
- A fixture item dated yesterday appears only under A8 (unit test).
- The directory says "1 entry" for the Antarctic region.

---

## 20. `public/roadmap.json`: initial content (Phase 0 writes it verbatim; schema per tech §8.1)

**Schema (tech §8.1–§8.3, unchanged; enforced by `scripts/validate_roadmap.py`):**
- **Envelope keys, exactly:** `schema_version` (int 1), `updated_at` (timestamp ≤ now), `note` (must match `/not (?:a )?(?:promise|commitment|guarantee)|intentions, not/i`), `items` (non-empty).
- **Item keys, exactly these 12:**

  | Key | Rule |
  |---|---|
  | `id` | `^[a-z0-9][a-z0-9-]{0,95}$`, unique |
  | `title` | ≤ 80 |
  | `summary` | ≤ 400 |
  | `area` | `interface\|map\|data\|editorial\|accessibility\|infrastructure` |
  | `status` | `shipped\|in-progress\|next\|later\|blocked` |
  | `last_reviewed` | ISO day ≤ today and ≤ the `updated_at` day |
  | `shipped_in` | `^\d+\.\d+(\.\d+)?$` iff shipped |
  | `shipped_on` | ISO day ≤ `last_reviewed`, iff shipped |
  | `evidence` | `[{kind: test\|file\|doc\|commit\|url, ref, label ≤ 120}]`; every entry must resolve; shipped needs at least one resolving `test` |
  | `blocked_by` | text ≤ 300 iff blocked, else null |
  | `depends_on` | existing ids, no self, no duplicates, no cycles |
  | `acceptance` | ≤ 400 |

- **UI-only copy rules** (checked by test_pages, not the validator): no banned vocabulary (§18.1) in any title, summary, acceptance or `blocked_by`.

Shipped = SHIP-1–6 only. They were available on the deployed site before this release and cite **existing** CI tests. This release's work (WIP-1–4) stays `in-progress` until the deployed build passes its acceptance check (§22.4). No dates in the future; no promised dates.

```json
{
  "schema_version": 1,
  "updated_at": "2026-10-02T23:00:00Z",
  "note": "Site features we are building, considering or blocked on. Planned items are intentions, not promises, and carry no dates. Shipped items were available before this release and cite tests that run on every build.",
  "items": [
    {"id": "source-linked-episode-index", "title": "Source-linked episode index",
     "summary": "Every published claim traces to a source cited inside its own record: positions, intensity, police and state response, cities, endings and outcomes.",
     "area": "data", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "1.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_pipeline.py::test_foreign_claim_reference_rejected", "label": "Claims must cite their own record's sources"},
       {"kind": "test", "ref": "tests/test_history.py::test_every_claim_reference_is_event_local", "label": "Historical claims cite event-local sources"},
       {"kind": "url", "ref": "https://github.com/occult-kranti/protest-atlas/actions/runs/37067775278", "label": "Pages deployment of release 3"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "84 episodes in 81 countries and territories; every position, intensity, state response, city, ending and outcome cites an event-local source; validators pass; checked on the deployed site on 2 Oct 2026 (Pages run 37067775278)."},
    {"id": "world-map-and-directory", "title": "World map with a complete 249-entry directory",
     "summary": "An Equal Earth world map coloured by published coverage only, with an A–Z directory of all 249 countries and territories as the complete alternative to the map.",
     "area": "map", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "2.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_explorer.mjs::map totals agree with reported data", "label": "Map totals equal published records"},
       {"kind": "test", "ref": "tests/test_history.py::test_catalog_screening_is_complete_without_claiming_event_coverage", "label": "All 249 entries screened without coverage claims"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "The map colours published coverage only; every directory entry is selectable; a map failure leaves the list usable."},
    {"id": "filters-links-and-csv", "title": "Filters, shareable links and CSV export",
     "summary": "Readers and researchers can reproduce a view: nine filters are kept in the link, and the CSV keeps source URLs.",
     "area": "interface", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "2.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_explorer.mjs::shared view restores every filter", "label": "Permalinks restore every filter"},
       {"kind": "test", "ref": "tests/test_explorer.mjs::CSV preserves attribution, quoted text, and guards formula injection", "label": "CSV keeps sources and escapes formulas"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "Permalinks restore 9 filters; CSV keeps source URLs, the recorded-status note and formula escaping."},
    {"id": "status-ageing-72-hours", "title": "72-hour status ageing",
     "summary": "Old reports cannot stay 'Reported ongoing': the label lapses 72 hours after the latest evidence.",
     "area": "editorial", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "1.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_explorer.mjs::time filters use observation date", "label": "72-hour boundary and observation windows"},
       {"kind": "test", "ref": "tests/test_pipeline.py::test_newer_build_does_not_make_old_observation_fresh", "label": "A rebuild never refreshes an observation"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "'Reported ongoing' becomes 'Needs review' at exactly 72 hours from the latest evidence; re-reading a source never extends it (tested boundary)."},
    {"id": "sourced-endings-and-outcomes", "title": "Sourced endings and outcomes",
     "summary": "What changed, and for whom, without claiming that the protest caused it.",
     "area": "editorial", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "3.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_history.py::test_ended_needs_local_status_evidence_and_end_date", "label": "Endings need sourced status evidence"},
       {"kind": "test", "ref": "tests/test_explorer.mjs::outcome view preserves inference, source links and unknown end", "label": "Outcome wording keeps inference and causation caveats"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "18 sourced ended or suspended episodes; 57 documented outcomes labelled 'Assessment / inference' where inferred, with causation caveats."},
    {"id": "country-search-ledger", "title": "Country search ledger",
     "summary": "Shows where we looked, not only what we found: a first search is logged for every one of 249 countries and territories.",
     "area": "data", "status": "shipped", "last_reviewed": "2026-10-02", "shipped_in": "3.0", "shipped_on": "2026-10-02",
     "evidence": [
       {"kind": "test", "ref": "tests/test_history.py::test_search_failures_are_not_zero_result_successes", "label": "Failed searches are not zero results"},
       {"kind": "test", "ref": "tests/test_coverage.py::test_repository_ledger_matches_actual_source_checked_countries", "label": "Ledger matches source-checked countries"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "249 first searches logged; 'searched' is never shown as 'reviewed' or as 'no protests'."},
    {"id": "mobile-first-redesign", "title": "Mobile-first redesign",
     "summary": "A phone-first rebuild: reports, map, Ahead, countries and About as separate views, readable record cards and a full-height record sheet.",
     "area": "interface", "status": "in-progress", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [{"kind": "doc", "ref": "docs/UX_SPEC.md", "label": "UX specification"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "At 390×844 the disclosure and first record are in the first viewport; controls are at least 44 px; no map scroll trap; the record sheet closes reliably; no horizontal scroll at 320 px. Shipped only after the deployed build passes these checks."},
    {"id": "clear-dates-and-stale-warnings", "title": "Clear dates and stale warnings",
     "summary": "Separate, labelled times for the snapshot, the newest evidence, source re-reads, the announced-actions list and the site build, with warnings as the newest evidence ages.",
     "area": "interface", "status": "in-progress", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [{"kind": "test", "ref": "tests/test_freshness.mjs::dataset staleness follows newest evidence", "label": "Staleness uses the newest evidence"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "Every stamp names its subject; stale warnings at 72 hours and 7 days from the newest evidence, recomputed every minute; a missing build stamp shows a note, not an error."},
    {"id": "record-cards-key-dimensions", "title": "Cards show stance, intensity, state response, timeframe and source",
     "summary": "The questions readers ask most are answered on each card instead of deep inside the record.",
     "area": "interface", "status": "in-progress", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "All 84 cards show these rows; positions show their targets; 'not established' is never shown as zero or blank; each card shows publisher, publication date, link and 'AI-assisted check'."},
    {"id": "ahead-page", "title": "Ahead page: announced actions and this roadmap",
     "summary": "One place for what comes next: protest actions that organisations have announced, kept separate from plans for this website. The announcement list itself is blocked (see 'List announced protest actions').",
     "area": "interface", "status": "in-progress", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [{"kind": "test", "ref": "tests/test_upcoming.py::test_future_announcement_is_valid_but_not_an_event", "label": "Announcements validated as not events"}],
     "blocked_by": null, "depends_on": [],
     "acceptance": "The empty state explains why it is empty; upcoming.json is validated in the build; tests cover date-passed, postponed and cancelled items; no times, routes or meeting points."},
    {"id": "add-reports-after-2-oct-2026", "title": "Add reports after 2 Oct 2026",
     "summary": "Without fresh reporting nothing in this atlas can be current.",
     "area": "data", "status": "blocked", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [],
     "blocked_by": "The research environment cannot open news websites: the 2 Oct 2026 search logged results but no article could be opened. Needs a fetch-capable connector or a network allowlist for news domains.",
     "depends_on": [],
     "acceptance": "Each new record cites an article that was opened and read, with an access time; the research window advances only for days actually searched; newest evidence is under 72 hours old at publication."},
    {"id": "list-announced-actions", "title": "List announced protest actions",
     "summary": "Readers asked what is planned next. An announcement is listed only after the announcing article is opened and read.",
     "area": "data", "status": "blocked", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [],
     "blocked_by": "Blocked for the same reason as new reports: no announcing article can be opened from the research environment.",
     "depends_on": ["add-reports-after-2-oct-2026"],
     "acceptance": "Each item is read from its source; city and day level only; the announcer is an organisation or institution; it passes validate_upcoming; date-passed handling verified."},
    {"id": "human-editorial-review", "title": "Human editorial review",
     "summary": "AI-assisted checks are not independent verification. Until a person checks records, the pilot label stays on every page.",
     "area": "editorial", "status": "blocked", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": "No human editor or backup has been appointed.", "depends_on": [],
     "acceptance": "A named editor and backup; sampled records signed off; one real correction completed end to end; only then may the disclosure change."},
    {"id": "records-current-within-72-hours", "title": "Keep records current within 72 hours",
     "summary": "A tracker has to keep up with events, and this one cannot yet.",
     "area": "data", "status": "blocked", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": "Needs new reports and a human editor; both are blocked.",
     "depends_on": ["add-reports-after-2-oct-2026", "human-editorial-review"],
     "acceptance": "Newest evidence under 72 hours old on 30 consecutive days, published as a metric; expiring records checked daily."},
    {"id": "local-language-coverage", "title": "Local-language coverage",
     "summary": "123 of 128 cited sources are in English, so coverage of many places is thin.",
     "area": "editorial", "status": "blocked", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": "Needs fetch access to news websites and language reviewers.",
     "depends_on": ["add-reports-after-2-oct-2026", "human-editorial-review"],
     "acceptance": "Per-country language and review windows in the coverage ledger; sensitive translated claims checked by a person."},
    {"id": "structured-state-response", "title": "Structured police and state response types",
     "summary": "Free text cannot be filtered safely, and keyword guesses misfile entries. Each response would be coded with a controlled vocabulary in the Mass Mobilization Project style (CC0, cited).",
     "area": "data", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": ["add-reports-after-2-oct-2026"],
     "acceptance": "Fields for acting body, announced or observed, alleged or officially stated, and date; all 37 entries coded from a re-read source; 'not recorded' stays distinct; filter chips only from coded data."},
    {"id": "turnout-ranges-with-estimators", "title": "Turnout ranges with who estimated them",
     "summary": "Size is asked for, but no number is recorded today.",
     "area": "data", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": ["add-reports-after-2-oct-2026"],
     "acceptance": "Low and high figures with the estimator (organisers, police, officials, media) and method; competing estimates side by side, never averaged; vague words stay text; 'not established' stays distinct."},
    {"id": "issue-tags-normalised", "title": "Issue tags normalised",
     "summary": "66 tags, 36 used once; Labor, Labour and Labour rights split the issue filter.",
     "area": "data", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "A controlled list of about 15 to 20 groups with the original tag kept; old links still resolve; CSV keeps the original tag; the list is ordered alphabetically, not by count."},
    {"id": "position-roles-in-data", "title": "Position roles recorded in data",
     "summary": "Cards cannot honestly say 'government response' without a field for it.",
     "area": "data", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "All 92 positions coded as demonstrators, counter-demonstrators or institutional response from stored records; the pro-Yoon rallies marked as a counter-demonstration; still no tallies."},
    {"id": "research-window-beyond-2026", "title": "Research window and years beyond 2026",
     "summary": "The research window end is fixed at 2 Oct 2026 in the validators, which blocks newer records and breaks in 2027.",
     "area": "data", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Year options derived from data; the window end advances only for searched days; tests updated."},
    {"id": "added-and-corrected-dates", "title": "Added and corrected dates, with a public corrections log",
     "summary": "Readers need to know what changed and when; any feed depends on this.",
     "area": "editorial", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Per-record added and corrected dates validated; a corrections page lists ID, date, field and reason; an empty log says 'No corrections published yet'."},
    {"id": "automated-accessibility-and-link-checks", "title": "Automated accessibility, link and deploy checks",
     "summary": "Protect the redesign from regressions with checks that run on every pull request.",
     "area": "infrastructure", "status": "next", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "axe or pa11y at 320 and 390 px; internal link check on pull requests; Lighthouse accessibility at least 0.95; Node 24 action pins; a deploy that newer pushes cannot cancel; a post-deploy build-stamp check."},
    {"id": "episode-grouping-and-movement-links", "title": "Episode grouping and movement links",
     "summary": "Related episodes and counter-demonstrations should connect, but only where a source documents the link.",
     "area": "editorial", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": ["human-editorial-review"],
     "acceptance": "Links only where a source documents the relationship; no inferred continuity."},
    {"id": "feed-of-atlas-changes", "title": "RSS/Atom feed and notifications",
     "summary": "For return visits, a feed of records published or corrected in the atlas. Never announced actions.",
     "area": "interface", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null,
     "depends_on": ["human-editorial-review", "records-current-within-72-hours", "added-and-corrected-dates"],
     "acceptance": "Items show both the evidence date and the atlas date. No push alerts until moderation capacity and a demonstrated need exist."},
    {"id": "versioned-snapshots", "title": "Versioned snapshots and archive",
     "summary": "Readers should be able to cite a fixed snapshot.",
     "area": "data", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Each release snapshot is immutable and dated; comparisons only where coverage is comparable."},
    {"id": "shareable-record-pages", "title": "Shareable per-record pages",
     "summary": "Sharing and search engines need a page per record.",
     "area": "interface", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Each page carries the disclosure and all dates; preview text never implies that reporting is current or continuous."},
    {"id": "date-range-filter-and-timeline-view", "title": "Date-range filter and episode timeline view",
     "summary": "Exploring timeframes beyond the 7- and 30-day options.",
     "area": "interface", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Marks only at dated entries; no filled spans between them."},
    {"id": "lighter-map-download", "title": "Lighter map download",
     "summary": "Load only the D3 modules the map uses: about 50 KB less to download on the Map view.",
     "area": "infrastructure", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Map add-on under 105 KB gzip with identical rendering; vendored modules licensed and pinned."},
    {"id": "typo-tolerant-search", "title": "Typo-tolerant search",
     "summary": "Search that forgives misspellings, once the atlas holds more than about 500 records.",
     "area": "interface", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "Typo-tolerant matching with unchanged ordering rules; under 20 KB gzip added; existing search tests still pass."},
    {"id": "weekly-source-link-check", "title": "Weekly check of cited source links",
     "summary": "Find cited articles that have moved or disappeared, without blocking publication.",
     "area": "infrastructure", "status": "later", "last_reviewed": "2026-10-02", "shipped_in": null, "shipped_on": null,
     "evidence": [], "blocked_by": null, "depends_on": [],
     "acceptance": "A weekly non-blocking job reports broken source links; records are never changed automatically."}
  ]
}
```

Counts: shipped 6, in-progress 4, blocked 5, next 7, later 8 (30 items). Every shipped `test` ref resolves against HEAD `7f0b1d5` (the substring occurs verbatim in the named file). When the lead later flips a WIP item to shipped, it must gain a `test` evidence entry from this round's new tests (e.g. `tests/test_shell.mjs::…`, `tests/test_record.mjs::…`) and `shipped_in: "4.0"`, in the same commit as RELEASE_EVIDENCE (§22.4).

---

## 21. Phase-0 checklist (lead; before WP1–WP5 start)

1. **Branch.** Work on a feature branch, never `main`. Confirm the tree is clean and HEAD is `7f0b1d5` or later.
2. **Folders.** `js/` exists (`js/html.js` is already committed verbatim); create `css/`.
3. **`js/model.js`.** Move `getDisplayStatus` and `dateLabel` **verbatim** from `app.js`. Add `HOUR`, `PAGE_SIZE = 12`, and `STATUS_LABELS` with C-06 values. Add stubs for every model export (tech §4.6 + C-02, C-06–C-09, C-27):
   - `statusLabel`, `foldText`, `searchableText`, `queryTokens`, `indexContexts`, `eventMatches`, `sortByObservation`, `selectEvents`, `selectFiltered`, `activeFilterCount`, `availableYears`, `cityOptions`, `refinementOptions`, `statusOptions`, `datasetStats`, `snapshotState`, `evidenceAgeDays`, `sweepFact`, `groupByBand`, `emptyBandNotice`, `timeSnapshot`.
   - Stubs return `''`, `[]`, `null`, `false`, `'unknown'` or `{}` as the type requires.
4. **`app.js`.** Replace with the ● imports of its §19.0 row as bare side-effect-free imports (`import './explore.js'; import './js/list.js'; …`), then `export {getDisplayStatus, dateLabel} from './js/model.js'; async function boot() {} if (typeof document !== 'undefined') boot();`. The page is static-only until WP2 lands, but the static graph is already the final 21-module set (C-48).
5. **`explore.js`.** Keep `withinWindow`, `readViewState`, `encodeViewState` and `csvForEvents` byte-for-byte (the year allowlist changes in WP2). Delete `createExplorer` and the `map.js` import. Add `FILTER_KEYS` plus `droppedParams` and `shareURL` stubs.
6. **`?v=` specifiers.** Strip `?v=3.1` from every import specifier in `map.js` and `history.js` (for example `'./history.js'`). Change nothing else in those files.
7. **Stub modules** (exact names; bodies `return '' | [] | null | {render(){}}`):
   - `js/store.js`: `createStore`, `initialState`.
   - `js/router.js`: `VIEWS`, `RECORD_ID`, `ROUTE_ALIASES`, `VIEW_NAMES`, `parseRoute`, `formatRoute`, `createRouter`.
   - `js/data.js`: `CRITICAL`, `LAZY` (incl. `mapCodes`), `REQUIRED`, `SHAPES`, `DataError`, `fetchJSON`, `loadCritical`, `createLazyLoader`.
   - `js/actions.js`: `createActions`, `exportAllowed`.
   - `js/filters.js`: `QUICK_CHIPS`, `mountFilters`.
   - `js/list.js`: `mountList`.
   - `js/stamps.js`: `STAMP_ROWS`, `stampItems`, `chipModel`, `footerStampsHTML`, `refreshTimes`, `mountStamps`.
   - `js/notice.js`: `PILOT_DISCLOSURE` (exact string), `noticeModel`, `mountNotice`.
   - `js/sheet.js`: `initSheets`, `openSheet`, `closeSheet`, `isOpen`, `initChromeMetrics`, `sheetScroller`.
   - `js/record-facts.js`: `VERIFICATION_LABELS`, `NOT_ESTABLISHED`, `positionView`, `positionSentence`, `positionList`, `stateActionSummary`, `intensityFacets`, `intensitySummary`, `timeframe`, `evidenceLine`, `primarySource`.
   - `js/cards.js`: `renderCard`, `renderCardSkeleton`.
   - `js/detail.js`: `RECORD_SECTIONS` (C-15 values), `renderRecord`, `patchRecordStatus`, `mountRecordChrome`.
   - `js/map-view.js`: `mountMap`.
   - `js/country-brief.js`: `overviewModel`, `briefModel`, `renderOverview`, `renderBrief`.
   - `js/ahead.js`: `groupAnnouncements`, `announcementView`, `roadmapGroups`, `evidenceHref`, `reviewOverdue`, `aheadTeaserHTML` (returns `''`), `NOT_PLANNED` (§18.2 list), `mountAhead`.
   - `js/countries.js`: `directoryRows`, `regionGroups`, `entriesLabel`, `mountCountries`.
   - `js/about.js`: `researchScope`, `discoveryView`, `mountAbout`.

   Every stub is DOM-free at import, and carries the ● edges of its §19.0 row as `import` lines: `js/list.js` → `./cards.js`, `./ahead.js`; `js/cards.js` → `./record-facts.js`; `js/detail.js` → `../history.js`, `./record-facts.js`; `js/map-view.js` → `../map.js`, `./country-brief.js`.
8. **CSS stubs.** `css/feed.css`, `css/record.css` and `css/map.css` each contain `@layer components {}`; `css/pages.css` contains `@layer views {}`. Leave the existing `styles.css` in place for WP1 to rewrite (it stays linked by `review.html`).
9. **`index.html`.** Write the §4.6 skeleton with **every pinned id** (including the 3 Oct additions `map-selbar`, `record-announcer`, `record-feedback`, `filters-status`), `h1` view titles, the import map (v4.0, one entry per root module and per `js/*.js`), modulepreload for the 21-module set of §19.0, the five CSS links, an empty `<svg id="icon-sprite" hidden></svg>`, the static H1 in `#data-notice`, P1/P2, and placeholder static text for About and the footer.
10. **`404.html`.** A minimal self-contained page: `noindex`, inline style, H1, a link to `./`. WP1 completes it.
11. **`public/roadmap.json`.** Write §20 verbatim. Check every `test` ref with `grep -F` against the named file.
12. **`public/world-map-codes.json` placeholder.** `{"schema_version": 1, "source": "placeholder until WP4 regenerates from public/world-110m.topo.json", "topology_sha256": null, "codes": {}}`. WP4 replaces it.
13. **`scripts/build.py`.** Set `PUBLIC_FILES` to tech §3.3 exactly (adds `404.html`, `css/*`, `js/*`, `freshness.js`, `public/roadmap.json`, `public/world-map-codes.json`; removes `atlas.css`, `history.css`, `public/world-countries.geo.json`). Keep `OPTIONAL_FILES`. Do not wire `validate_roadmap` yet (WP5 does).
14. **Green check.** Run:
    - `PYTHONDONTWRITEBYTECODE=1 python -m unittest discover -s tests -v`;
    - `node --test tests/*.mjs` (test_explorer + test_freshness);
    - `python scripts/build.py`;
    - `for f in js/*.js *.js; do node -e "import('./$f')"; done`.

    All must be green. `grep -rn "?v=" --include=*.js .` must return nothing. A short Node script that walks `import … from '…'` and bare `import '…'` from `app.js` must print exactly the 21 modules of §19.0, and the modulepreload hrefs in `index.html` must match it.
15. **Commit.** "Scaffold 4.0 module layout" (with attribution lines). Hand each WP its §19 section, §2, §4.6 and §17.
16. **Freeze.** Any change to ids, exports, tokens or classes after this point goes through the lead and is recorded as an addendum to §2.

---

## 22. Integration and verification

### 22.1 Phase 2 order (lead)

1. Merge WP1, then WP2 and WP3 (the list needs cards), then WP4 and WP5.
2. If the lead approved an import edge outside §19.0, regenerate the modulepreload links from the static graph (the Phase-0 script in §21 step 14) and rerun test_shell. Then run `python scripts/build.py`.
3. Run `NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs --root _site --prefix /protest-atlas/ --shots <scratch>/shots`.
4. Fix mismatches in the owning file.
5. Look at the screenshots at 360, 390, 768 and 1440, light and dark, on both the 2 Oct and 9 Oct clocks.

### 22.2 Smoke checks (`tests/browser/smoke.cjs`; tech §10.4 with C-31)

Viewports: 360×780, 390×844 (mobile, touch, DSF 2), 768×1024, 1440×900; 320×640 for overflow only; and the short viewports **640×410, 844×390 (mobile, touch) and 320×256** for checks 1 and 7 (C-42). The clock is fixed at 2026-10-02T23:00:00Z unless a check names another.

1. 0 console, page or request errors (allowlist: `public/build-info.json` 404 when serving the repo). Checks 18–20 run in their own pages and allowlist only the request they block. No horizontal overflow at any viewport.
2. `#data-notice` contains H1 verbatim on `#/latest`, `#/map`, `#/ahead`, `#/ahead/roadmap`, `#/countries`, `#/about`; the open record contains D1. The chip is checked by state: if `snapshotState` is current, `#stamp-chip time` matches `\d{2}:\d{2} UTC`; otherwise the chip text matches `/newest evidence \d+ days old/` (long form, at 1440).
   - **H1 visible** (editorial check 1): on every route, reached by a tab or nav tap, at 390×844 and 1440×900, the `.notice-pilot` bounding box lies inside [header bottom, `innerHeight` − tab-bar height].
   - **Scroll reset and restore** (C-35): at 390×844, scroll `#/latest` by 3000 px, tap the Map tab, and assert the H1 box rule above and `document.activeElement === #map-title`. Then `page.goBack()`: `scrollY` is within 50 px of 3000. Tapping the Reports tab while on Reports scrolls to 0.
3. Every route shows its `#<view>-title` (an `h1`) with matching `aria-current`. `#methodology` → About; `#/reports` → Reports; `#/coming-next` → the roadmap section with `#ahead-roadmap-title` focused. On `#/ahead/roadmap` at 1440, exactly one `#primary-nav` link has `aria-current="page"` ("Coming next"); at 1024, "Ahead" has it.
4. Record sheet regression (tech 4.1–4.5), plus:
   - 4.6 **Share feedback inside the sheet** (C-36): with `navigator.share` removed and `navigator.clipboard.writeText` rejecting, press `#record-share`. `#record-feedback` is visible, `elementFromPoint` at its centre is inside it, and `.toast-url` holds the record URL, is focused and fully selected. It is still visible after 5 s; Close hides it and focus returns to `#record-share`. With the clipboard allowed, "Link copied." appears in `#record-feedback`, and `#action-feedback` stays empty.
   - 4.7 **Stepping** (C-46): at the last record of the view, `#record-next` has `aria-disabled="true"` and keeps focus when pressed; after a step `sheetScroller` is at 0 and `#record-announcer` contains the new title. A record opened from a brief link outside the filters shows the eyebrow "Record" and no prev/next.
5. Permalinks: `?country=FR&window=30` restores `#country-filter` and `#window-filter input[value="30"]:checked`; `?status=live&year=1999` shows the dropped-params line; the query survives view changes; `?status=ongoing` shows E7.
6. Map (tech 6, with C-41 replacing the svg-box aspect assertion below 1440) + the selection overlay and the C-40 focus-ring checks (§19 WP4).
7. **Targets, text, DOM and obscured focus** at 390 and at 640×410, 844×390 and 320×256:
   - every visible control is ≥ 44×44 in the first two screens of each view, **and** inside the open record sheet (glance cells, `.rec-tabs` links, `.source-ref`, prev, next, share, close) and the open filter sheet (segments, radio rows, selects, footer buttons), including every `summary`, `.brief-country` and `.brief-records` link;
   - no visible text is < 12 px; first `#/latest` DOM ≤ 1,500 nodes;
   - Tab through the first 40 focusables of each view and of both sheets: `elementFromPoint` at each focused element's centre returns it or a descendant (never the header, tab bar, `.ahead-switch` or `.rec-tabs`);
   - at the short viewports, after scrolling 400 px, fixed or sticky elements cover at most 45 % of `innerHeight`, and the record and filter sheets fill the viewport.
8. Ahead and roadmap (§19 WP5).
9. Example mode: watermark on cards, detail and map (`.map-watermark`). The Reports `.feed-actions [data-action="export-csv"]` and the About CSV row both have `aria-disabled="true"`. Pressing the **Reports** button gives feedback containing "excluded"; `[data-action="share-view"]` gives "Sharing is off in example mode." In reported mode, "Copy link to this view" with `?country=FR&window=30` copies a URL whose query restores both filters.
10. `review.html` at 390 and 1440: no errors, no overflow, `#candidate-file` enabled after load. The boxes of `.site-header`, `.brand`, `.brand-mark`, `.site-header nav` and `.edition` match a baseline render of the same page within 4 px. The baseline is made by serving `git show 7f0b1d5:styles.css` for `styles.css` through `page.route`, so no baseline file is committed. Both screenshots are saved side by side to `--shots`.
11. Dark and reduced motion.
12. Screenshots of every view at 390 and 1440, light and dark.
13. **9 Oct clock** (`page.clock.setFixedTime(new Date('2026-10-09T12:00:00Z'))` before navigation):
    - chip `data-state="stale"` and text "Stale snapshot";
    - S5 present on `#/latest` **and** `#/map`;
    - `.feed-gap` contains the "in the last 7 days" E4;
    - the first `.feed-group-title` starts "7 to 30 days ago";
    - no `.feed-group-title` contains "within 72 hours";
    - no element text equals "0";
    - no `.band-text`, `.status`, `.chip` or `.feed-group-title` text matches `/^(latest|new)\b/i` unless it starts with "Latest evidence" (editorial check 2).
    - A second page opened at 2 Oct 23:59 and advanced with `page.clock.runFor` past 2026-10-05T00:00Z must show S4 without a reload. Advanced further to 2026-10-12T00:01Z, the chip reads "newest evidence 10 days old" and S5 contains "10 days ago" (C-52).
14. **Banned vocabulary** (§18.1) on the 2 Oct and 9 Oct DOMs (all views, five records, both sheets).
15. **Worked cases:** open kr-yoon, ng-pengassan, nz-wellington, es-housing and as-noaa; assert the §19 WP3 strings in the card and the D4 list.
16. **Status before band:** on the tz-drivers card, `.status` precedes `.band` and reads "Ended / suspended 30 Sep 2026".
17. **First viewport (2 Oct clock only;** on 6–9 Oct the S4/S5 line and `.feed-gap` legitimately push the first card down): at 390×844 the first `.card-title` bottom ≤ `innerHeight − tabbar height`. At 360×780 the first `.card` top < `innerHeight − tabbar height` (hard), and the title position is reported (target: visible).
18. **Example load failure** (C-38): with `public/examples.json` answering 404, press `#about-example`. The hash becomes `#/latest`; the list shows "The illustrative example could not load." and "Nothing here is reported data."; `#example-banner` is visible; no E1 or true-empty copy appears. On `#/map` the legend reads "Illustrative example unavailable" and no `.map-country` has the example fill. `[Back to reported data]` restores the 84-record list; after unblocking, `[Retry example]` shows the example card.
19. **Events failure** (C-37): with `public/events.json` answering 500, on every route `#data-notice` contains H1 **and** E5, and the chip has `data-state="error"`. `#/map` has no reported fill or hatch and shows "Coverage cannot be shown because published records did not load."; every `#/countries` row reads "Coverage unavailable"; the filter sheet shows its error body. Nowhere in the DOM does "Searched · no published episode" or "Close · no records match" appear. After unblocking, `[Retry]` restores everything without a reload.
20. **Countries-only failure:** with `public/countries.json` answering 500, the list renders 84 records, the notice has the countries-error line and no E5, and `#/countries` shows "The country directory could not load."
21. **Sticky targets** (WCAG 2.4.11): at 390×844 open tz-drivers and tap the "Police / state" glance cell: the `#rec-state` heading top is at or below the `.rec-tabs` bottom. Tap "Source 1": the `#detail-source-1` top is at or below the `.rec-tabs` bottom. On `#/ahead/roadmap`, Tab through the roadmap links: none has its top above the `.ahead-switch` bottom.
22. **Segmented focus:** open the filter sheet and Tab into `#window-filter`: the focused radio's `label` has computed `outline-style: solid` and `outline-width` > 0. Arrow to "Last 30 days": its `.filter-check` is displayed.
23. **Stance totals** (editorial check 3): the §18.1 stance-total scan on the 2 Oct and 9 Oct DOMs (all views, five records, both sheets) finds nothing.

### 22.3 Editorial acceptance (editorial §14), mapped

| Check | Covered by |
|---|---|
| 1. H1 visible on every view | smoke 2 (bounding box inside the visible area on every route, and after the scroll reset) |
| 2. 9 Oct state, no record labelled "latest" or "new" | smoke 13 |
| 3. Worked cases, no totals | smoke 15 + test_record + smoke 23 (whole-DOM stance-total scan) |
| 4. Intensity C6 and not-established display | test_record |
| 5. D6-empty and "Not established in this record" | test_record |
| 6. Banned vocabulary | smoke 14 + test_shell |
| 7. Ahead A3–A6, A8, no month countdown | test_pages (week **and month** fixtures) + smoke 8 |
| 8. Footer T1/T2 | test_core (`footerStampsHTML`) + smoke on the repo root (T2) and `_site` (T1) |
| 9. tz-drivers status before band | smoke 16 |
| 10. Evidence row on every card | test_record |

### 22.4 Flipping roadmap items to shipped (lead, Phase 3 only)

After merging to `main`, the lead waits for the Pages `verify` job (tech §10.3) and runs smoke against the live URL (`--prefix /protest-atlas/`, or a manual phone check recorded in RELEASE_EVIDENCE). For each WIP item whose acceptance passes on the deployed site, one commit does all of the following:
- sets `status: "shipped"`, `shipped_in: "4.0"`, `shipped_on`;
- adds at least one `test` evidence entry from this round's tests;
- updates `last_reviewed` and `updated_at`;
- rewrites `note` to "Site features we are building, considering or blocked on. Planned items are intentions, not promises, and carry no dates. Shipped items cite tests that run on every build." (still matching the validator's `intentions, not` rule). The old "were available before this release" would become false;
- updates RELEASE_EVIDENCE.

`docs/UX_SPEC.md` (cited as evidence by `mobile-first-redesign`) is rewritten for 4.0 in Phase 3 **before or in** the flip commit, so the evidence never describes the 3.x interface.

Items that fail stay `in-progress`. The working names of the design directions never appear in any file that is published.

---

## 23. Revision log

### Revision 2, 3 Oct 2026 (pre-freeze review)

The pre-freeze review found 13 major and 21 minor gaps; all are resolved here. Contract changes are C-34 to C-52 (§2.1), and C-02, C-03, C-13, C-18, C-22, C-24, C-26, C-31 and C-33 are amended in place. No file is added to tech §3.2/§3.3 or to `PUBLIC_FILES`. New pinned ids: `map-selbar`, `record-announcer`, `record-feedback`, `filters-status`.

**Major**

| # | Gap | Resolution | Where |
|---|---|---|---|
| 1 | Share feedback was invisible behind the modal record sheet | `#record-feedback` inside the sheet; app.js routes feedback there while the sheet is open; the clipboard fallback is a persistent, selectable input with Close; smoke 4.6 | C-36, §4.5, §4.6, §8.1 |
| 2 | No state for an example that fails to load | Loading and error copy, `[Retry example]` (`data-retry="examples"`) and `[Back to reported data]`; neutral map with "Illustrative example unavailable"; banner stays; `#about-example` goes to `#/latest`; test_core + smoke 18 | C-38, §6.1, §6.4, §11, §16.1 |
| 3 | An events failure read as zero coverage | E5 notice line on every view; neutral map with an error legend; "Coverage unavailable" rows; filter-sheet and brief error copy; separate countries-only line; per-file settlement; smoke 19–20 | C-37, §4.2, §6, §9, §11, §13, §16.1 |
| 4 | The disclosure scrolled out of view after a tab switch | Manual scroll restoration, scroll to top + `focus({preventScroll})` on navigation, per-entry `scrollY` restored on Back; smoke 2 extended | C-35, §3.2 |
| 5 | Chip and notice day counts froze between band boundaries | `timeSnapshot` includes `evidenceAgeDays`; test_core midnight case; smoke 13 at 12 Oct | C-52, C-02, §4.1, §16.2 |
| 6 | Map keyboard focus hidden under the selection, and at 1.7:1 | Focus halo + ring cloned as the last overlay children; ring against halo 6.19 / 8.90; smoke 6 | C-40, §11.3, §11.4, §17.5 |
| 7 | `.map-selbar` both inside the clipped stage and in flow | Pinned `#map-selbar` between stage and legend; `#map-controls` holds overlay buttons only | C-39, C-18, §4.6, §11 |
| 8 | Smoke check 6 could not pass with the 16:10 stage | Option (b): svg fills the stage; assert `viewBox` and the k = 1 land box (984/432); the svg-box aspect only at 1440 | C-41, §11.1, §22.2 |
| 9 | No rules for 200 % zoom or short viewports | `(max-height: 500px)` rules: static header, switch and tabs; 48 px tab bar; full-viewport sheets that scroll as one; 640×410, 844×390, 320×256 in smoke 1 and 7; "200 % zoom" restored to WP1 acceptance | C-42, §5, §8.1, §17.10 |
| 10 | Sticky record tabs and the Ahead switch covered their targets | `scroll-padding-top: 52px` on the record body and on Ahead; `scrollIntoView({block:'start'})`; smoke 21 | §8.1, §12.1, §17.5 |
| 11 | "Copy view link" and "Export reports" dropped from Reports | `.feed-actions` with `share-view` and `export-csv`; About row relabelled; `aria-disabled` on every export control from `exportAllowed`; smoke 9 on the Reports button | C-43, §6.3, §14 |
| 12 | Segmented window control had no visible keyboard focus | Label outline via `:has(input:focus-visible)`; checked segment shows an `i-check` and an inset border; smoke 22 | §9, §17.5 |
| 13 | Input borders at about 1.45:1 | `--border-input` (light #7a7d74, dark #8d9188; ≥ 3.42:1 on every surface) for inputs, selects, segments and unpressed chips | C-44, §9, §17.1, §17.8 |

**Minor**

| # | Gap | Resolution | Where |
|---|---|---|---|
| 1 | Final import graph not pinned | §19.0 import table with mandatory edges; Phase 0 stubs carry them, so the 21-module modulepreload set is final from Phase 0 | C-48, §19.0, §21, §22.1 |
| 2 | Two "current page" links; Ahead focus targets | Most specific displayed match per nav container; `#ahead-actions-title` tabindex; per-param focus table | C-24, §3.2, §3.3, §12.1 |
| 3 | Record prev/next undefined outside the list and at the ends | "Record" eyebrow and hidden arrows outside the list; scroll reset, kept focus, `#record-announcer`; `aria-disabled` at the ends | C-46, §8.1 |
| 4 | Sheet initial focus, closing links, inert result count | Sheet titles `tabindex="-1"` as default focus; no `preventDefault` on `<a data-close-sheet>`; `#filters-status` | C-47, §9, §10 |
| 5 | E7 wrong for planned and needs-review | Per-status rule sentences; ended and unknown fall to E1 | §6.4, §18.4 |
| 6 | E2 read a failed search as 0 results | Failed, not-searched, loading and ledger-failed variants; test_map | §11.6, §18.4 |
| 7 | "Planned for today" for range, week and month items; no month test; blocker jump | `announcementView` override; month fixtures; `data-ahead-target` to `#roadmap-item-list-announced-actions` | §12.2, §19 WP5 |
| 8 | No map watermark in example mode; directory taps in example mode | `.map-watermark`; directory taps return to reported mode, with a dek line | C-38, §11.1, §13 |
| 9 | 404 links could break at depth | Absolute fallbacks + runtime `home`; test_site rule | C-33, §15 |
| 10 | styles.css rewrite could break review.html; undefined chrome tokens | Compatibility selectors, `.brand-mark` min-width, `.site-footer--app`, CSS defaults for `--header-h`/`--tabbar-h`; review baseline diff in smoke 10 | C-44, §17.4, §17.8 |
| 11 | Heading outline, band `aria-label`, chip names, unnamed tabs | `h1` view titles and h2 groups; visually hidden band label; "Remove filter: "; `aria-label="Record sections"` | C-45, C-51, §6.2, §7.2, §8.2 |
| 12 | Map-failure UI incomplete | `aspect-ratio: auto`, hidden controls, app.js owns the rejected-import E6 | §11.1, §11.2 |
| 13 | Secondary load states had no copy | Discovery, malformed build, ledger loading, research-scope failure strings | §10, §13, §14, §18.4 |
| 14 | Ambiguous cross-package signatures | `load = state.load`; `extras.discovery = discoveryView(…)`; `researchScope` positions and episodes; `list-*`; class-based grid; app.js owns feedback | C-03, C-49, C-44, C-36 |
| 15 | Editorial checks under-tested | H1 box check; "latest"/"new" check; stance-total scan; smoke 17 on 2 Oct only; sheets and `summary` targets in smoke 7 | §18.1, §22.2, §22.3 |
| 16 | Tie order contradicted the walkthrough | Stable file order; first card `in-electoral-20261002` asserted | C-34, §6.4, §16.2 |
| 17 | List density dropped C3, C5 and C6 | Issues line and a "Timeframe · Intensity" line in List density | C-51, §7.5, §7.6 |
| 18 | Focus rings and text on the example stripes | `--example-stripe` (#6b54a3, 6.14:1 white), `--on-example` outlines | C-44, §4.3, §17.1 |
| 19 | Forced colours and side safe areas | `(forced-colors: active)` rules; `max(gutter, env(safe-area-inset-*))` padding | §17.10 |
| 20 | Roadmap note and UX_SPEC evidence after release | The flip commit rewrites the note; UX_SPEC is updated before or with it | §22.4 |
| 21 | The notice rewrite reset "What this means"; H3 numbers while loading | Patch-only line updates; `<details>` only once counts are known | C-26, §4.2 |

### Integration addendum, 3 Oct 2026 (Phase 2, lead)

**Payload budgets (tech §6.2):** CI now enforces integration budgets, set at the size measured after the integration cuts plus about 10 % (gzip -9, summed per file, as `tests/test_shell.mjs` measures): CSS ≤ 28 KB (25,627 B measured), critical JS ≤ 91 KB (84,091 B), critical total ≤ 191 KB (177,248 B), map add-on ≤ 174 KB (161,124 B) and map-first ≤ 364 KB (338,372 B). `index.html` (12 KB) and `events.json` (120 KB) keep their §6.2 numbers. The §6.2 figures stay in the test as targets, and every run prints how far over them each bucket is. To get back under them, load Ahead, Countries and About lazily (about 17 KB of critical JS; needs a C-48 change) and add a build-time minifier (about 14 KB of JS comments). Raising the budgets again is not the way to do it. The measurements and the reasoning are in [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) §4.

These decisions supersede the sections named. Each question, its decision and the files changed are logged in [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) §2.

| ID | Area | Decision | Supersedes |
|---|---|---|---|
| I-01 | Dates | `freshness.absoluteLabel` writes fixed English month names, so every date on the site reads "Sep" and none reads "Sept". The ICU workarounds are gone: `html.js` `absoluteText` and `datedTimeTag` are removed, and cards, the record meta and the D9 rows use `timeTag(…, 'both')` as written. | §7.2 row 4, §8.2 item 2, §8.8 |
| I-02 | Card facts | The 104 px label column switches on when the card's content box is at least 340 px wide, which is the literal `@container (min-width: 340px)`. That means a card at least 374 px wide. Phones get the label above the value, which reads better and makes long cards shorter (all 84 cards at 390 px: max 779 against 850, p90 651 against 688). | §7.2 row 6, §17.7 |
| I-03 | Size targets | The 430–560 px card height at 390, "title visible" at 360×780 and "first two cards visible" at 1440 become reported targets: smoke 17 prints them, and verbatim C4, C6 and C7 text is never clamped. The hard requirements (first title above the tab bar at 390×844; first card top inside the viewport at 360×780) are unchanged. | §5, §7.2 |
| I-04 | Day counts | `model.snapshotAgeText` with `<time data-days="utc">`: once a snapshot is a day old, S1 and the dates-sheet "Snapshot assembled" value count whole UTC days, as the chip and S5 do. `freshness.relativeLabel` stays frozen. | §16.2 item 8 |
| I-05 | Layout | `--page-max` is 1128. From 900 to 1199 px the Reports column is left-aligned (it stays centred from 600 to 899). The wordmark stacks on two lines only when the header container is 323 px or narrower. Below 600 px the search field is full width and the Filters pill leads the chip row. From 600 px `#result-summary` and `.feed-actions` share a row. The density buttons carry a static `.feed-density-check` in `index.html`. | §4.1, §5, §6.2, §6.3, §17.4, §17.7 |
| I-06 | Controls | The chip border is `--border-input`, because §17.1 says `--border` is never a control boundary. `.rec-tabs` stick at `top: calc(-1 * var(--sp-4))`. `.sheet-body` is `position: relative`. | §4.1, §8.2 item 7 |
| I-07 | Map | Below 600 px the example watermark sits bottom-right. There is no keyboard-focus tooltip. A touch tap draws the selection and never the C-40 focus ring. AQ (clipped by the land fit) and AS (no polygon) are accepted as known limits. | §11.1, §11.4 |
| I-08 | Copy | New strings (§18.4 additions): "No published record matches your filters"; "Showing {n} of {n} illustrative record(s)"; "Region: {x}" and the "Active filters" group label; the singular S3 and "CSV downloaded: 1 record."; "{n} published episodes, none match your filters"; "no published episode in this atlas"; the countries-failure overview lead "Published episodes in {n} countries and territories."; "no results"; the brief subheading "Records"; **"{Country}: no record in the illustrative example."**; "Roadmap groups"; the ledger stages "First search logged", "Search failed" and "Not yet searched"; the Countries dek "A first search was logged for {n} of {total}; …"; **"Search log unavailable"** with **"The search log could not load, so whether each country or territory was searched is not shown here."** before its Retry. When a source or position lacks a publisher or actor, that segment is left out; no fallback text is invented. | §18.4, §7.2, §8.8, §11.6, §13 |
| I-09 | Contracts | Additive exports are accepted as built, and frozen signatures are unchanged. The additions: `createRouter({…, beforePush})`; `history.state = {key, view, param, record, scrollY}`; `outcomeHTML(event, context, {scope, headingId})`; `stampItems` rows `{key, label, note, value, html, text, present}` with `value === html`; `html.js` `bandTag`, `dateTag`, `dayParts`, `sourceLinkKept`, `sourceRefsBlock` and `patchHTML`; `model.js` `countryNamer` and `snapshotAgeText`; and the WP2, WP4 and WP5 test-facing exports listed in INTEGRATION_NOTES §2. `ui.mapStatus` reads `unavailable` when map-view shows its own E6. | tech §4.6, §19 |
| I-10 | Smoke | Under §18.1(b), "verbatim in a value" means the whole JSON value, or a fragment of at least 24 characters at the same offsets. Check 6 tests France by a stage-centre hit test. Assertions added at integration: the touch tap in check 6; the `.ledger-wrap` fit at 320, 360 and 390 in check 8; the error legend keeping M1 in check 19; and in check 21, the "What this means" jump and a reverse Tab walk through the record. | §18.1, §22.2 |
| I-11 | CI | Pins `configure-pages` v6.0.0 and `deploy-pages` v5.0.1. The verify job accepts a 404 for the optional `public/upcoming.json`. | tech §10.3 |

### Verification round 1 addendum, 3 Oct 2026 (Phase 3, lead)

Round 1 ran five read-only verification lenses (editorial honesty, accessibility, mobile UX, code correctness, deployment readiness) on the integrated build. They reported 14 major and 29 minor findings. The verifiers and the fixers were AI agents; no human reviewed the findings or the fixes. Outcome: **36 resolved, 2 resolved in part, 2 declined, 3 deferred to the data-pipeline owner.** The full record is in [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) §8. Everything below was verified locally at commit `b260087`; none of it has been checked on the deployed site.

**Resolved, by area**

| Area | Findings | Resolution |
|---|---|---|
| Editorial honesty | Major 1; Minor 1, 2, 3, 4 | About ledger column relabelled to what it counts; R3 "In progress" no longer says features the reader is using are unavailable; the Ahead teaser counts only upcoming items, and a list with items but none upcoming says so with the sweep fact; stale roadmap claims corrected ("57 episodes with documented outcomes", the research-window and CI items); the illustrative record no longer claims a source check |
| Accessibility | Major 2, 3, 4; Minor 5–12 | Explore button keeps its position on focus; the brief's live status node survives selections (the fragment lookup no longer uses `:scope >`); focus goes to the view title when a mode switch hides its trigger, and to the section or its title after a Retry; the dates-sheet body is a focusable labelled region; hidden `h2` in example mode; example banner is a named region and the 404 notice sits in a landmark; sheet heads and foots are plain `div`s; Escape hides the hover tooltip from anywhere; scrollers leave 5 px for focus rings; the forced-colours focus ring is dashed CanvasText against the Highlight selection; the search label contains its visible words |
| Mobile UX | Major 5, 6, 7, 8, 9, 10; Minor 13, 15, 16, 20 | Stale state as the primary layout: one warning line with "Why?" (E4 and S7 moved behind it, no `.feed-gap`), S1 hidden below 600 px, the share and CSV row under the list on phones; first card top 603 px at 390 and 360 on 9 Oct (was 895), now a hard smoke-17 requirement on the stale and archive clocks. List density is a scan row (status · evidence date · country, title, stance line with targets, evidence); card intensity collapses to one line when two or more facets are not established. Enter blurs the search on touch and the results scroll up. Short display names and search aliases. In Explore the selection bar stays above the tab bar. The selection-bar control is "Back to world"; the region chip and the zoom "World" only move the view. Share button reads "Share this view" when the OS sheet is used, and the shared title names the filters. Enabled quiet buttons get a solid outline. The record glance Intensity cell uses labelled rows |
| Code correctness | Major 11, 12, 13; Minor 21, 22, 23, 24 | Countries rows wait during a records retry and never read "Searched · no published episode" without records; a context-file failure is unknown everywhere (notice line, paused city and outcome filters, record Outcome with Retry, CSV "not loaded"); snapshot-pinned tests moved to `tests/fixtures/snapshot-20261002/`, with invariant-only checks on `public/*.json`, and code and data budgeted separately; retry focus fallback; the 60 s tick keeps the reader's card in place; `SHAPES.countries` requires string names; roadmap test evidence must start a `test(` title (≥ 8 characters) or name a method inside its class |
| Deployment | Major 14; Minor 28, 29 | Fixtures make a valid data refresh keep CI green (checked with a synthetic 85th record and a one-off script, not committed: Python 87 and Node 227 pass); DEPLOYMENT.md pins and the verify job documented; `actions/setup-node` v6.5.0 pinned to Node 22 |

**Resolved in part**
- **Minor 18** (Countries): the search field has an icon, a 44 px clear button, the alias hint and the new no-match copy with "Browse A–Z". Not done: a "Published episodes only" toggle and region jump chips; the directory stays one 249-row list.
- **Minor 19** (roadmap density): the per-item status pill is now screen-reader-only text under the group heading. Not done: per-item disclosures for "Done when" and "Depends on", and moving the legend into a `<details>`.

**Declined**
- **Minor 14, map tap accuracy at world zoom.** Making a tap on a small country zoom to its region or list neighbours would change what a tap does on the map, and the touch contract that smoke check 6 tests, at the end of the release. A wrong pick is visible at once in the selection bar and undone with "Back to world"; region chips, zoom, Explore and the Countries list reach every country reliably. Recorded as a known limit in MAP_IMPLEMENTATION.md.
- **Minor 17, swipe-down to dismiss sheets.** A custom swipe needs its own touch handling on top of the sheet body's scrolling and adds no route that keyboard or assistive-technology users lack. Close, Escape, Back and the backdrop already dismiss every sheet; the dates sheet gained a bottom "Done" button instead. The record sheet keeps Close at the top, with stepping and "Read the source" in its foot.

**Deferred to the data-pipeline owner** (HANDOFF_DATA_REFRESH.md §2.2: until the data PR merges, this branch commits no change to `scripts/merge_history.py` or the four data validators)
- **Minor 25:** a future date in `validate_data.moment` is reported as "invalid date/timestamp". It still fails; only the message is wrong.
- **Minor 26:** week and month precision do not pin `planned_start`. Until the validator does, handoff §4 requires `planned_end` at the last day of the stated week or month.
- **Minor 27:** the coverage note's window date is a literal beside `WINDOW_END`. The consolidate step edits both together; roadmap item `research-window-beyond-2026` tracks the fix.

**Open, not a finding to close here:** the "Taiwan" short name (Major 9) was meant to go through editorial review. No human editor is appointed, so it stands as an AI decision for the editorial owner to confirm. "Palestine" (ISO "Palestine, State of") is an analogous sensitive short name and belongs to the same open item. The c09b7d8 commit message says disputed names keep their ISO form; they do not (TW → Taiwan, PS → Palestine), and "reviewed" there means reviewed by an AI agent.

**Reproducibility:** the synthetic-refresh check, the axe-core run and the map tap count were made with one-off scripts in the session scratch directory. They are not committed, so those three results cannot be rerun from the repository as it stands; the unit tests and browser smoke can.

**Copy changes** (superseding the sections named)

| Where | Before | After | Supersedes |
|---|---|---|---|
| About ledger, fourth column | "Source pages read"; bare "0" | **"Pages opened in the first search"**; caption note: "Pages opened in the first search counts only the pages logged during that first search. Each published record lists every article it cites, including later reads. A dash means no page was logged."; empty cell "—" with hidden "None logged" | §14 item 6 |
| Roadmap legend R3, In progress | "being built; not available yet." | **"built or being built; not yet confirmed on the deployed site."** The other four statuses are unchanged | §12.3, §18.2 |
| Example mode | card "AI-assisted check"; D1 "AI-assisted source check · no human editorial review"; D9 re-read row | card evidence ends **"no source was checked"**; D1 **"Illustrative example · no source was checked"**; no re-read row; Outcome **"Illustrative example · no source was checked; a fictional record has no outcome or end evidence."** | §7.2 row 8, §8.2, §8.8 |
| Countries, no match | "No country or territory matches '{q}'." | **"No country or territory name starts with '{q}'. Try another spelling, or browse A–Z."** with a **[Browse A–Z]** button; field hint **"Common names work too, such as South Korea, UK or Ivory Coast."** | §13 |
| Notice, context-file failure (new `contexts-error` line, after `countries-error`) | none | **"Outcomes, endings and cities could not load, so they are unknown here, not absent. City and outcome filters are paused."** Record Outcome: "The outcome and end evidence for this record could not load, so it is not shown here. That is unknown, not a sign that nothing changed." + [Retry]; filter sheet: "City and outcome filters are paused because record context could not load. They are not applied until it loads."; paused chips end "(paused)"; CSV context cells "not loaded" | §4.2, §9, §16.1 |
| Ahead | teaser "{n} listed." | teaser counts upcoming only: "{n} upcoming action(s) listed." or "no upcoming action is listed. An empty list does not mean nothing is planned."; actions with none upcoming: "No upcoming announced actions are listed. An empty list does not mean nothing is planned." + sweep fact | §6.5, §12.2 |
| Map selection bar | "World" | "Back to world" | §11.6 |
| Countries during a records retry | — | rows "Checking published records…"; dek "Loading published records…" with a disabled "Retrying…" | §13, §16.1 |
| Reports share button on coarse pointers with Web Share | "Copy link to this view" | "Share this view" | §6.3 |

**Contract and test changes:** C-51 is amended for the List density above. §6.6's `sweepFact` values, §19 WP3's "33 records" count, the first card (C-34) and the §16.2 walkthrough are asserted on the frozen copy in `tests/fixtures/snapshot-20261002/`; on `public/*.json` the tests check only what any valid snapshot satisfies (scope numbers, sort order and grouping derived from the records, the stale walkthrough a week after the newest evidence, every record findable by its country display name). Smoke check 17 adds the stale and archive clocks as hard requirements; checks 13, 17, 18 and 20 derive their clocks and counts from `public/events.json`; check 24 (search and filter feedback, country names in search) is new, making 24 checks. test_shell budgets code (html + css + js; map code and geometry) apart from data, with ceilings from the integration measurements less their data share: critical code 125 KB, map add-on 170 KB, map-first code 294 KB; data guards `events.json` 120 KB, critical data 180 KB, `cities.json` 16 KB. Critical JS is now 92,483 B against its 91 KB (93,184 B) ceiling, so the next feature needs the lazy-view split from INTEGRATION_NOTES §4.
