# Protest Atlas 4.1: technical architecture for colour, pattern, kind and the conflict layer

Author role: tech architect on the 4.1 panel. AI agent. Written 4 Oct 2026 against the deployed 4.0 tree at `fcd35a7` (clean), the panel inputs (`design2/inputs.md`), the editorial skeptic's 4.1 decisions (`design2/editorial.md`, same day), docs/design/EDITORIAL_GUIDANCE.md, SPEC.md §17 and §23, TECH_ARCHITECTURE.md §4.4–§6, INTEGRATION_NOTES.md §4–§5, OPEN_SOURCE_RESEARCH.md, docs/EDITORIAL_POLICY.md v1.2, public/roadmap.json, and the code named in the brief. Every byte count below was measured in this session with test_shell's own method (gzip -9 per file, summed); every palette claim was produced with the dataviz validator in this session (§1.3).

Where this document and `editorial.md` differ, the editorial document wins on copy and on what may be encoded; this document decides mechanism, files, budgets and tests. The two disagree in one place (fixtures, §2.7) and this document explains why.

---

## 0. Decisions at a glance

| # | Question | Decision |
|---|---|---|
| D1 | Data model for kind | **Both.** `kind` + `kind_basis` become required exact keys on every `events.json` record (and the illustrative example). Armed conflict lives in a separate `public/conflicts.json` with its own schema, clock and validator (`scripts/validate_conflicts.py`). The protest schema is never widened with parties, dyads or death counts. |
| D2 | How the 84 records get a kind | `scripts/merge_history.py` writes `kind: "collective-action"` and a `contract-default` basis for every record that lacks one. No keyword guessing, no client derivation. A later round may change a kind only in an `*-updates.json` entry that carries a `kind_basis` (mirrors the `status_basis` rule). |
| D3 | Fixtures | `tests/fixtures/snapshot-20261002/` stays byte-for-byte frozen (its README forbids edits). A new `tests/fixtures/snapshot-20261002-kind/` holds only `events.json` and `examples.json` as written by the merge, plus a README. The UI treats a missing `kind` as "not stated" (`kindOf(event) === null`), never as a derived default, so the old fixture keeps passing. |
| D4 | Colour control | Store `ui.colourBy: 'coverage' | 'recency'`, default `'coverage'`; URL `?colour=recency` (validated; anything else is dropped and reported like a bad filter); never persisted. **`kind` is not a colourBy value**: kind is a texture and a layer, never a hue (editorial §3.4). Layers are `ui.layers: {episodes, conflicts}`, both true, not in the URL. |
| D5 | What hue encodes | On the map only, while `colourBy === 'recency'`: the date of the newest cited evidence per country, as a one-hue ochre lightness ramp, four steps = the existing `observationBand` edges. Tokens `--map-recency-{fresh,week,month,older}`; attribute `data-recency`. Ramps validated ALL CHECKS PASS, both modes, both surfaces (§1.3). |
| D6 | Kind on the map | Texture, never hue. Episodes keep the solid ochre fill. A UCDP conflict location is a two-tone diagonal hatch (ink line on a casing line, opposite diagonal to the gap hatch, wider spacing) drawn in an overlay layer so it sits on whatever the base fill is (land, ochre or a recency step). One extra `<pattern>` with no background rect. |
| D7 | IA for conflicts | Conflicts are a **context layer**, not feed items. They appear on the map (hatch, legend rows, tooltip), in the country brief (EC3/EC4 with links), and open in the record sheet at `#/record/ucdp-<id>` with their own sections (CD1–CD7, lazy module). In Reports they appear **only** when the Kind filter selects a conflict kind: the list then shows conflict rows under their own heading, never interleaved with episodes, never summed. |
| D8 | Loading conflicts | `public/conflicts.json` joins the critical set with 404 tolerated (`errors.conflicts === 'absent'`, like `upcoming`). Absent = EC1 everywhere; error = EC2 with Retry. It is in `build.py` `OPTIONAL_FILES`. |
| D9 | Budget | Phase 0 ships the lazy-view split before any feature work (**−19,890 B of critical JS; +≈2 KB for the new static `js/teaser.js` and the loader**), and build-time CSS comment stripping measured the same way in test_shell (**−4,643 B CSS**). Ceilings are unchanged: 91 KB JS, 28 KB CSS, 170 KB map add-on. JS comment stripping is **not** done in 4.1 (needs a real tokenizer; roadmap). |
| D10 | Work packages | Four, disjoint: **A** shell + app + build + CI; **B** kind in state, URL, Reports, cards, sheet; **C** map shading, patterns, layers, legend, brief; **D** validators, merge, conflicts schema, UCDP ingest, conflict JS modules. Phase 0 (lead) lands the split, the stubs and the contract edges first. |

---

## 1. Ground truth measured on 4 Oct 2026 (fcd35a7)

### 1.1 Payload buckets (gzip -9 bytes, test_shell method)

| Bucket | Measured | Ceiling (CI) | Headroom |
|---|---|---|---|
| Critical JS (21-module static graph of app.js) | **92,586** | 93,184 (91 KB) | 598 |
| CSS (styles.css + css/*.css) | **27,351** | 28,672 (28 KB) | 1,321 |
| index.html | 6,119 | 12,288 | 6,169 |
| Map add-on (d3 93,276 · topojson 2,587 · topo 38,063 · codes 969 · map.js 9,033 · map-view.js 7,867 · country-brief.js 4,608 · map.css 3,802) | **156,403** (+ map.css counted in CSS too) | 174,080 (170 KB) | 17,677 |

Per module (gz): app.js 7,298 · explore 1,942 · freshness 2,753 · history 1,951 · html 2,842 · model 7,371 · store 1,077 · router 4,019 · data 1,901 · actions 4,432 · filters 6,431 · list 5,184 · stamps 4,639 · notice 3,034 · sheet 4,220 · record-facts 4,062 · cards 2,616 · detail 6,924 · **ahead 10,276 · countries 5,059 · about 4,555**.

The three views that render only on first visit cost **19,890 B** of critical JS. The only static edges that keep them in the graph are `list.js → ahead.js` (`aheadTeaserHTML`) and `stamps.js → about.js` (`discoveryView`).

### 1.2 CSS comment stripping (regex `/\*[\s\S]*?\*/` plus blank-line collapse)

styles.css 8,255 → 7,588 · feed.css 4,930 → 3,497 · record.css 5,246 → 3,982 · map.css 3,802 → 3,376 · pages.css 5,118 → 4,265. **Total 27,351 → 22,708 (−4,643 B).** No stylesheet uses `/*` inside a quoted string or `url()` (the stripper must assert this, §5.3).

### 1.3 Palette validation (dataviz `validate_palette.js`, this session)

```
#c89a52,#b4772a,#935f1f,#6e4514  --mode light --surface #f2f2ec --ordinal   ALL CHECKS PASS (light end 2.28:1)
#c89a52,#b4772a,#935f1f,#6e4514  --mode light --surface #e4e9e3 --ordinal   ALL CHECKS PASS (2.08:1)
#8f5f22,#bd8236,#d4a45c,#e6c48f  --mode dark  --surface #2b312e --ordinal   ALL CHECKS PASS (2.42:1)
#8f5f22,#bd8236,#d4a45c,#e6c48f  --mode dark  --surface #0e1311 --ordinal   ALL CHECKS PASS (3.42:1)
```

Order is older → fresh. Step 2 of each ramp is today's `--map-reported`, so the 7–30 day band equals the coverage fill and the map keeps its identity when the control is toggled. The newest band is the step farthest from `--map-land` in each mode (darkest in light, lightest in dark); the legend swatches make the direction explicit.

The editorial document's categorical runs (a third map hue beside ochre and the example violet) FAIL the chroma and normal-vision floors in both modes; the sibling run in `validator-kind.txt` confirms it. **No new hue is added to the map.**

### 1.4 Conflict hatch legibility (WCAG contrast, `validate_palette.js` `contrast()`)

A single ink colour cannot clear 3:1 over every fill it may sit on (light: ink `#1a1c19` on the freshest step `#6e4514` is 2.06:1; dark: ink `#efede6` on ochre is 2.80:1). The hatch is therefore **two strokes per line**: a casing in `--map-selected-halo` (3.4 px) under an ink line in `--text` (1.6 px). Worst cases: light casing on the fresh step 8.18:1, light ink on ochre 4.59:1; dark casing on ochre 5.72:1, dark ink on land 11.34:1; casing against ink ≥ 15:1 in both modes. Under every underlying fill at least one of the two strokes clears 3:1, and the pair reads as one two-tone line.

---

## 2. Data model

### 2.1 Why two datasets (mechanism view; the editorial reasons are in editorial §3.1)

- `validate_data.py` is an exact-key validator: every field added to the event schema is a field every protest record must carry. Parties, dyads and yearly death estimates would be `null` on 84 records forever.
- The two datasets have different clocks (`last_observed_at` → 72 h bands versus UCDP calendar years and provisional months), different identity (episode versus UCDP conflict id), different sources (event-local articles versus dataset-level files) and different producers (`merge_history.py` versus an offline `ingest_ucdp.py`). Separate files mean the data session and the UCDP ingest never touch each other's outputs.
- The test and budget regimes stay separate: `events.json` keeps its 120 KB guard; `conflicts.json` gets its own.

### 2.2 `events.json`: `kind` and `kind_basis` (WP-D owns the Python; WP-B consumes)

Exact event keys become the 4.0 tuple plus `'kind', 'kind_basis'` (order in the tuple is irrelevant to `obj()`).

```python
# scripts/validate_data.py
KINDS = ('collective-action', 'protest', 'strike', 'civil-unrest')
KIND_METHODS = ('contract-default', 'source-reread')          # + 'illustrative' only when illustrative=True

require(isinstance(event['kind'], str) and event['kind'] in KINDS, path, 'unsupported kind')
obj(event['kind_basis'], ('method', 'text', 'source_ids'), path + '.kind_basis')
basis = event['kind_basis']
methods = KIND_METHODS + (('illustrative',) if illustrative else ())
require(basis['method'] in methods, path, 'unsupported kind_basis.method')
text(basis['text'], path + '.kind_basis.text', 600)
array(basis['source_ids'], path + '.kind_basis.source_ids')
if basis['method'] == 'contract-default':
    require(event['kind'] == 'collective-action', path, 'contract-default basis is legal only for collective-action')
    require(basis['source_ids'] == [], path, 'contract-default basis cites no source')
elif basis['method'] == 'source-reread':
    refs(basis['source_ids'], source_ids, path + '.kind_basis')   # non-empty, event-local, no duplicates
else:  # illustrative
    require(basis['source_ids'] == [], path, 'illustrative basis cites no source')
```

Rules in words (editorial §3.2–§3.3 and §10.2 made exact): a kind other than `collective-action` requires `source-reread` with at least one event-local source; `collective-action` may carry either method; nothing is derived from `title`, `id`, `issues`, `summary` or `intensity.violence`. `kind_basis.text` for the default is the fixed sentence in editorial §3.2.

### 2.3 `scripts/merge_history.py` changes (WP-D)

```python
KIND_DEFAULT_BASIS = {'method': 'contract-default',
  'text': 'Researched as a sourced collective-action episode under the round-3 research contract; protest and industrial action were not distinguished at research time.',
  'source_ids': []}

def apply_kind_defaults(events):
    for e in events:
        if 'kind' not in e:
            e['kind'] = 'collective-action'; e['kind_basis'] = dict(KIND_DEFAULT_BASIS)
        elif 'kind_basis' not in e:
            raise ValueError('Episode carries a kind without a kind_basis: ' + e['id'])
```

- Called in `assemble()` after `apply_round4(...)` and before the sort, so research files need no edit and every output record carries both keys.
- In the round-4 update loop (and the round-5 successor): `if 'kind' in update: require update.get('kind_basis') and update['kind_basis']['method'] == 'source-reread' else raise ValueError('Kind change needs a source-reread kind_basis: ' + event['id'])`; then `event['kind'] = update['kind']; event['kind_basis'] = update['kind_basis']`. A re-read that does not speak to the form of action carries no `kind` key and changes nothing.
- `public/examples.json` is hand-maintained: its one record gets `kind: "collective-action"` and `kind_basis: {"method": "illustrative", "text": "Illustrative example; no source was checked.", "source_ids": []}`.
- `coverage_note`, `write_upcoming`, `sweep_sentence` templates are unchanged (the UI parses them).
- **Handoff rule (HANDOFF_DATA_REFRESH §2.2):** this touches `merge_history.py`, `validate_data.py` and the regenerated `public/events.json`. The 4.1 branch pushes these before the data session imports, or asks it to re-import from the new SHA; the handoff gains the kind clauses (§9). Before every UI commit the usual `git checkout -- public/{event-context,coverage,research-ledger,cities,upcoming}.json` applies to the files that merely restamp; `events.json` is committed once, with the kind fields.

### 2.4 `public/conflicts.json`: schema (WP-D)

Envelope, exact keys: `schema_version` (int 1) · `generated_at` (timestamp ≤ now, ≥ every `sources[].downloaded_at`) · `window` · `licence_note` (text) · `method_note` (text, must contain the sentence "Absence of a country is a threshold and coverage fact, not evidence of peace.") · `sources` · `records`.

`window`, exact keys: `first_year` (int ≥ 2024) · `last_year` (int, `first_year ≤ last_year ≤ now.year`) · `last_provisional_month` (`"YYYY-MM"` strictly after December of `last_year` and ≤ the current month, or `null`).

`sources[]` (dataset level; records reference them by id), exact keys: `id` (slug) · `dataset` (text, e.g. "UCDP/PRIO Armed Conflict Dataset") · `version` (text, `^\d+\.\d+$`) · `url` (`https_url()`) · `licence` (text) · `citation` (text) · `downloaded_at` (timestamp ≤ `generated_at`). Ids unique; at least one source.

`records[]`, exact keys: `id` · `kind` · `kind_basis` · `ucdp` · `parties` · `location_countries` · `start` · `years` · `provisional` · `latest_recorded` · `activity_basis` · `note`.

| Key | Rule |
|---|---|
| `id` | `^ucdp-\d+$` and equal to `f"ucdp-{ucdp.conflict_id}"`; unique; **not present in `events.json` ids** (cross-check) |
| `kind` | one of `armed-conflict-intrastate`, `armed-conflict-interstate`, `non-state-conflict`, `one-sided-violence` |
| `kind_basis` | exact keys `method` (= `"ucdp-coding"`), `text`, `source_ids` (non-empty, envelope source ids) |
| `ucdp` | exact keys `conflict_id` (int > 0), `dataset_family` ∈ `state-based | non-state | one-sided`, `conflict_name` (text ≤ 300), `type_of_conflict` (2, 3 or 4 when `state-based`; `null` otherwise), `type_label` (`"interstate"` ⇔ 2, `"intrastate"` ⇔ 3, `"internationalised intrastate"` ⇔ 4, `null` otherwise), `dyad_ids` (array of ints, may be empty, unique). Consistency: `kind === 'armed-conflict-interstate'` ⇔ `type_of_conflict === 2`; `armed-conflict-intrastate` ⇔ 3 or 4; `non-state-conflict` ⇔ family `non-state`; `one-sided-violence` ⇔ family `one-sided` |
| `parties` | exact keys `side_a`, `side_b`: non-empty arrays of text ≤ 200, as UCDP names them |
| `location_countries` | non-empty, unique ISO codes present in `countries.json` |
| `start` | exact keys `ucdp_start_date`, `ucdp_start_date2`: ISO days, `start_date ≤ start_date2 ≤ now` |
| `years` | non-empty, ascending, unique `year` ints within `[window.first_year, window.last_year]`; each exact keys `year`, `intensity_level` (1 or 2), `intensity_label` (`"armed conflict"` ⇔ 1, `"war"` ⇔ 2), `deaths` (exact keys `best`, `low`, `high`: ints ≥ 0, `low ≤ best ≤ high`), `source_ids` (non-empty envelope ids) |
| `provisional` | array, may be empty; ascending unique `month` (`"YYYY-MM"` > December of `window.last_year`, ≤ `window.last_provisional_month`); exact keys `month`, `events` (int ≥ 0), `deaths` (as above), `source_ids` |
| `latest_recorded` | string; equals the last `provisional[].month` when provisional is non-empty, else `str(years[-1].year)` |
| `activity_basis` | `provisional-months` when provisional non-empty; else `active-year` when `years` includes `window.last_year`; else `not-in-latest-year`. Exactly that value (the UI maps it to the three editorial §4.2 labels) |
| `note` | text ≤ 600 or `null` |

**Forbidden anywhere in the file** (recursive key and value scan after the schema pass): any key matching `/(^|_)(lat|lon|lng|latitude|longitude|coord|coordinates|geometry|geojson|status|severity|risk|danger|score|trend|casualt|toll)(_|$)/i`; any string value matching the coordinate pattern used by `validate_data` for locations; any URL that is not HTTPS. Exact-key `obj()` already rejects unknown keys at every level; the scan is a second fence for nested arrays.

Every rule maps to editorial §4.2–§4.6. The validator does **not** check thresholds (25 / 1,000) against the data: UCDP's coding is the basis, and the ingest copies `intensity_level` as given.

### 2.5 `scripts/validate_conflicts.py` and `scripts/ingest_ucdp.py` (WP-D)

```python
# validate_conflicts.py (stdlib; reuses validate_data helpers: obj, text, array, identifier, moment, https_url, require, load_json, validate_countries)
def validate_conflicts(data, countries, events, now=None) -> dict
def validate_conflicts_repository(root=ROOT, now=None)   # returns None when public/conflicts.json is absent
```

`build.py`: add `'public/conflicts.json'` to `PUBLIC_FILES` and `OPTIONAL_FILES`; call `validate_conflicts_repository(root)` after the upcoming validator. `tests/test_pipeline.py::test_build_preserves_dates_and_excludes_nonpublic_files` derives the expected set from `PUBLIC_COPIES` and skips absent optional files, so it keeps passing with or without the file.

`ingest_ucdp.py` runs **offline** from a manifest, never fetches:

```
python3 scripts/ingest_ucdp.py --manifest research/ucdp/manifest.json --out public/conflicts.json
```

`manifest.json` (written by the data session at download time, exact keys): `downloaded_at`, `licence_note`, `files: [{role: acd|brd|candidate, path, dataset, version, url, licence, citation, sha256}]`, `first_year`, `aliases_path`. The script: reads the UCDP/PRIO ACD CSV for conflict id, name, type, sides and start dates; the BRD CSV for `bd_best/bd_low/bd_high` per conflict-year; the Candidate monthly CSVs for provisional months (event count and summed best/low/high per `conflict_new_id` and month); maps UCDP location names to ISO codes through `countries.json` names and `research/ucdp/aliases.json` (explicit, reviewed; e.g. "Myanmar (Burma)" → MM) and **fails listing every unmapped name**; keeps `first_year` from the manifest and never backfills earlier years; writes `window.last_year` and `last_provisional_month` from what the files actually contain; is deterministic (sorted records, no timestamps other than the manifest's). Column names are taken from the codebooks as the data session downloads them; the script validates the header row against the names it expects and stops with a clear message otherwise. Its output must pass `validate_conflicts.py` before it is written (the script runs the validator itself).

### 2.6 Build allowlist, CI, site tests

- `build.py`: `PUBLIC_FILES` gains `public/conflicts.json` (optional). `tests/test_pipeline.py` needs no change for the allowlist; it gains the kind tests (§8.2).
- `.github/workflows/pages.yml` verify job: treat `public/conflicts.json` exactly like `public/upcoming.json` (200 → parse; 404 → notice "not published in this build; the map and Kind filter show the absent state"; other → error). `tests/test_site.py::test_verify_parses_every_required_json_file` keeps passing because the required list is unchanged.
- `tests/test_site.py::test_public_json_constants_resolve` reads `js/data.js` paths and asserts each is published: it must skip paths in `build.OPTIONAL_FILES` that are absent (import `OPTIONAL_FILES`; today it would fail for `upcoming.json` too if that file were missing, so the fix is overdue).

### 2.7 Fixtures and how tests handle the new field

`tests/fixtures/snapshot-20261002/README.md`: "Never edit these files to match new data. Add a new fixture directory if a new walkthrough is needed." The editorial draft (§10.2) proposed regenerating the frozen fixtures; this document keeps the README's rule because the fixture is the only guarantee that a data refresh cannot turn CI red.

- **Frozen:** `tests/fixtures/snapshot-20261002/` is byte-identical. Its records carry no `kind`.
- **New:** `tests/fixtures/snapshot-20261002-kind/` with `events.json` and `examples.json` copied once from `public/` after the kind merge (same 84 records, same evidence dates, `kind`/`kind_basis` added, `generated_at` whatever the merge wrote), plus a README stating the commit and "never edit". Tests that pin kind literals (84 × `collective-action`, 84 × `contract-default`, the 13 keyword records unchanged, the badge-hidden rule) read it. Everything else keeps reading the frozen dir.
- **New:** `tests/fixtures/conflicts-sample/conflicts.json`: a **labelled synthetic** file (`licence_note` and `method_note` start with "SYNTHETIC TEST FIXTURE, not UCDP data:", conflict names "Synthetic test conflict A/B", parties "Government of (test)"), valid under `validate_conflicts.py`, with one intrastate record (two location countries), one interstate record (country also present in events: FR), one record with provisional months and one `not-in-latest-year`. It is never published (not in `PUBLIC_FILES`). The browser smoke routes it to `public/conflicts.json` in-page.
- **New:** `tests/fixtures/ucdp-sample/` synthetic CSVs in the UCDP column layout (README says synthetic) plus a manifest; `test_conflicts.py` runs the ingest on them and asserts the output equals `conflicts-sample/conflicts.json` byte for byte (determinism) and that an unmapped location name fails.
- **UI rule that makes the frozen fixture safe:** `kindOf(event)` returns the kind only when it is one of `KINDS`, else `null`. `null` renders as "Kind: not stated in this record" in the Overview, never as a badge, and never matches a Kind filter value. Production data always has a kind (validator), so the null path exists for fixtures and robustness only; it is not a client-side default.
- Tests on `public/*.json` assert invariants only: every record has `kind ∈ KINDS`; `contract-default ⇒ collective-action`; `source-reread ⇒ non-empty sources`.

---

## 3. State, URL and routing (WP-B owns `store.js`, `explore.js`, `actions.js`, `data.js`, `model.js`; WP-A owns `app.js`)

### 3.1 Store additions (`js/store.js`)

```js
filters: {…existing nine…, kind: ''}                        // tenth filter key
data:    {…, conflicts: null}                               // the conflicts.json envelope or null
load:    {errors: {…, conflicts: 'absent' | 'error'}}      // only when not loaded
ui:      {…, colourBy: 'coverage', layers: {episodes: true, conflicts: true}}
```

`FIRST_PAGE`, `LAZY_NAMES` unchanged. `initialState({filters, ui})` accepts an optional `ui` patch so the URL reader can seed `colourBy`.

### 3.2 `js/data.js`

`CRITICAL.conflicts = 'public/conflicts.json'`; `SHAPES.conflicts = v => isObject(v) && Array.isArray(v.records) && isObject(v.window)`; `loadCritical` maps a 404 to `'absent'` for `conflicts` as it does for `upcoming` and `build` (`['upcoming', 'build', 'conflicts']`). `data.conflicts` defaults to `null`. `loadFile('conflicts')` serves the EC2 Retry (`data-action="retry-conflicts"`, handled in actions as `retryConflicts()`, modelled on `retryContexts`).

### 3.3 `explore.js` (pure)

```js
export const FILTER_KEYS = ['query', 'country', 'region', 'issue', 'status', 'window', 'year', 'city', 'outcome', 'kind'];
export const KIND_VALUES = ['collective-action', 'protest', 'strike', 'civil-unrest',
  'armed-conflict-intrastate', 'armed-conflict-interstate', 'non-state-conflict', 'one-sided-violence'];
export const COLOUR_VALUES = ['coverage', 'recency'];
export function readViewState(search)   // + kind: KIND_VALUES.includes(v) ? v : ''
export function encodeViewState(state)  // + kind
export function readUIState(search)     // → {colourBy: 'coverage' | 'recency'}  ('?colour=recency' only)
export function encodeUIState(ui)       // → 'colour=recency' or ''
export function droppedParams(search)   // also reports 'kind' and 'colour' when present and rejected
export function shareURL({…, ui})       // appends colour=recency after the filters when set
```

`csvForEvents` is unchanged (episodes only; conflicts are never exported in the episode CSV). The URL keeps the `kind=` filter because a shared view must reproduce the list; it keeps `colour=recency` because a shared map must reproduce its legend (editorial §2.2 (1)); it is written by the same debounced `replaceState` path and never read from storage.

### 3.4 `js/actions.js`

- `sanitize` already round-trips through `readViewState`, so `kind` is validated for free.
- `validateFilters()` adds: a conflict kind with `data.conflicts === null` is dropped with `'kind'` in `droppedParams`; an event kind not present in `kindsPresent(state)` is likewise dropped (so `?kind=strike` on today's data reads "Some link filters were not applied", exactly like an unknown region).
- New: `setColourBy(value)` (validated against `COLOUR_VALUES`; no-op in example mode), `setLayer(name, on)` (`episodes` | `conflicts`), `retryConflicts()`.
- `setMode('example')` resets `colourBy` to `'coverage'` and both layers on (editorial §2.2 (10)).
- `controlStates(state)`: `csvDisabled` is also true when `kindScope(state.filters) === 'conflicts'`; the About row and feed action carry the title "CSV export covers protest and strike records" (copy for editorial check).

### 3.5 `js/model.js` additions (pure)

```js
export const EVENT_KINDS = ['collective-action', 'protest', 'strike', 'civil-unrest'];
export const CONFLICT_KINDS = ['armed-conflict-intrastate', 'armed-conflict-interstate', 'non-state-conflict', 'one-sided-violence'];
export const KIND_LABELS = {/* editorial K5, verbatim */ 'collective-action': 'Collective action', protest: 'Protest', strike: 'Strike',
  'civil-unrest': 'Civil unrest, as reported', 'armed-conflict-intrastate': 'Armed conflict · intrastate',
  'armed-conflict-interstate': 'Armed conflict · interstate', 'non-state-conflict': 'Non-state conflict', 'one-sided-violence': 'One-sided violence'};
export const KIND_FILTER_LABELS = {/* editorial K2 option labels */};
export function kindOf(record)                       // KINDS member or null; never derives
export function kindScope(filters)                   // 'all' | 'events' | 'conflicts'
export function kindsPresent(state)                  // Set of kinds across selectEvents(state) and data.conflicts.records (reported mode); example mode → Set(['collective-action'])
export function kindOptions(state)                   // [{value:'', label:'Any kind', count}, …kinds present or selected, alphabetical by label] (statusOptions pattern, counts never 0)
export function showKindBadges(state)                // kindsPresent(state).size >= 2  (editorial §3.2, EC5)
export function eventMatches(event, filters, opts)   // + `if (f.kind && kindOf(event) !== f.kind) return false;` and `if (CONFLICT_KINDS.includes(f.kind)) return false;`
export function selectConflicts(state, {ignoreCountry = false} = {})
  // data.conflicts.records filtered by: kind (must be a conflict kind, else []), country (location_countries), region (any location country's region),
  // year (years[].year or provisional month year), query (folded conflict_name, parties, country names); window !== 'all' → [] (editorial §6); sorted latest_recorded desc, id asc
export function conflictsByCountry(records)          // Map<ISO, ConflictRecord[]> over location_countries
export function findRecord(state, id)                // {record, dataset: 'events' | 'conflicts'} | null
export function visibleRecords(state)                // kindScope === 'conflicts' ? selectConflicts(state) : selectFiltered(state)  (stepping, result summary)
```

`timeSnapshot` is unchanged (conflicts have no 72 h clock). `datasetStats` is unchanged (episodes only; counts are never summed, editorial §6).

### 3.6 Record route for conflicts (`app.js`, WP-A)

`syncRecord` resolves the id with `findRecord(state, id)`. For `dataset === 'conflicts'` it renders `<p class="rec-loading" role="status">Loading this record…</p>` into `#record-body`, awaits `import('./js/conflict-detail.js')` (cached promise; a retry adds `?retry=n` like the map), then `renderConflictRecord(record, {envelope: state.data.conflicts, now, countryName})`. Chrome: eyebrow from `conflictChrome(record).eyebrow` ("Conflict record · UCDP data"), mini-title `ucdp.conflict_name`, prev/next over `visibleRecords(state)`, share allowed, the external source button links the envelope source `url` with label "{dataset} {version}". Import failure: `#record-body` shows "This record could not load." + `[Retry]` (`data-action="retry-record"`). An unknown id keeps today's behaviour (FEEDBACK.unknownRecord, route reset).

---

## 4. UI

### 4.1 Where conflicts appear (D7) and why

The least surprising information architecture keeps Reports a feed of protest and strike records and makes armed conflict visible exactly where it is context:

| Surface | Episodes | Conflicts |
|---|---|---|
| Map fill | solid ochre (or recency step) | two-tone hatch overlay; legend rows M2c1/M2c2; tooltip and `aria-label` add the EC3 sentence |
| Country brief | records list as today | "Armed conflict (UCDP)" subsection: EC3 when no episode; EC4 when the layer is loaded but none for the country; each record a link to `#/record/ucdp-…` |
| Reports list | band groups as today | **only under a conflict kind filter**: one `<section class="feed-group" data-kind="conflict">` with heading "Armed conflict records (UCDP)" and the note "Yearly and monthly basis, from a re-published dataset; these records do not follow the 72-hour evidence clock." (copy for editorial sign-off); rows from `renderConflictRow`; `window !== 'all'` → no rows and the M12 sentence; the E1 variant K9 when nothing matches |
| Result summary | "Showing n of m published records …" | "Showing n of m UCDP conflict records matching your filters" (copy for sign-off); never a combined count |
| Record sheet | D1–D10 | CD1–CD7 from editorial §7.4, sections `conf-overview conf-years conf-months conf-limits conf-source`; no status, band, stance, intensity, state or timeline sections |
| Kind filter | event kinds present | conflict kinds present; the group exists only when ≥ 2 kinds exist (EC5) |
| Countries directory, feed stats, header chip, S4–S6 | unchanged | never counted |
| Dates sheet | unchanged | T4 row "Conflict dataset" from the envelope (`sources` versions, `generated_at`, `window.last_provisional_month`), or "not loaded in this snapshot" |

Rejected: interleaving conflicts in the band groups (their clock is yearly; `observationBand` cannot place them honestly); a sixth view (five pinned tabs, 320 px tab bar); a list that only the map can reach (not keyboard-discoverable).

### 4.2 Reports: Kind filter, chips, badge, Overview row (WP-B)

**Filter sheet** (`js/filters.js`, inside the form after the Status fieldset):

```html
<fieldset id="kind-filter" class="filter-group filter-rows" hidden><legend>Kind</legend>
  <label class="filter-row" data-kind=""><input type="radio" name="kind" value=""><span class="filter-row-label">Any kind</span> <span class="filter-n"></span></label>
  <!-- one row per kindOptions(state) entry; rows are rebuilt from kindOptions on each patch, hidden when absent (statusOptions pattern) -->
  <p class="filter-help">K3</p>
  <p class="filter-help" data-kind-help="civil-unrest" hidden>K4</p>   <!-- shown when that row exists -->
</fieldset>
```

`#kind-filter` is `hidden` unless `showKindBadges(state)`. The `change` handler treats `name="kind"` like `status`. The active chip is K8 (`Kind: {label}`), cleared by `data-clear-filter="kind"`. No quick chip is added (the quick row is full at 390 px). `QUICK_CHIPS` is unchanged.

**Card badge** (`js/cards.js`): `renderCard(event, {…, showKind = false})`. When `showKind` and `kindOf(event)`, the status line becomes `<p class="card-status">{status}{SEP}<span class="kind" data-kind="…">{KIND_LABELS}</span></p>`; the row density puts the same `.kind` after the status in `.card-meta`. Accessible name for the default: K6 as visually hidden text inside the span. No glyph, no hue: `.kind` reuses the outlined `.side-pill` look (§4.5). `list.js` passes `showKind: showKindBadges(state)` once per render.

**Overview row** (`js/detail.js`, inside `rec-overview` after the issues list, before the glance): `<dl class="rec-kind"><div class="rec-evidence-row"><dt>Kind:</dt><dd>{K7}</dd>{basis line}</div></dl>`. `js/record-facts.js` gains the pure `kindFact(event)` → `{label, suffix, basisLine, sourceIds}` implementing K7 for `contract-default` (suffix " · protest or strike not distinguished in this record"), `source-reread` ("Basis: {text}" + source refs), `illustrative` ("Illustrative example; no source was checked."), and `null` ("not stated in this record"). The civil-unrest record note (editorial §5.2) is rendered under the row when `kind === 'civil-unrest'`.

**Conflict rows** (`js/conflicts.js`, WP-D; consumed by `list.js`): `renderConflictRow(record, {countryName, now, envelope})` → `<li class="feed-item"><article class="card card--conflict" data-id data-kind data-density="row"><p class="card-meta"><span class="kind" data-kind="…">{K5}</span>{SEP}<span class="card-row-country">{location names}</span>{SEP}<span>Latest recorded {2024 | Aug 2026}</span></p><h3 class="card-title"><a class="card-link" href="#/record/ucdp-…" data-open-record="ucdp-…">{conflict_name}</a></h3><p class="card-row-sides">Parties as named by UCDP: {side_a} · {side_b}</p><p class="card-evidence">{dataset} {version} · downloaded {date} · re-published, not Protest Atlas research</p></article></li>`. No status, no band, no stance pills.

### 4.3 Map (WP-C: `map.js`, `js/map-view.js`, `js/country-brief.js`, `css/map.css`)

#### 4.3.1 Controls inside `#map-legend` (DOM contract; ids pinned)

```html
<fieldset id="map-shade" class="filter-group filter-segment legend-control"><legend>Shade countries by</legend>            <!-- SH1 -->
  <div class="filter-segment-track">
    <label><input class="visually-hidden" type="radio" name="colour-by" value="coverage">{i-check}<span>Published coverage</span></label>   <!-- SH2 -->
    <label><input class="visually-hidden" type="radio" name="colour-by" value="recency">{i-check}<span>Date of newest evidence</span></label> <!-- SH3 -->
  </div>
  <p class="legend-note" data-kind="shade-help" hidden>SH4</p>          <!-- shown while recency is pressed -->
  <p class="legend-note" data-kind="shade-forced" hidden>SH5</p>        <!-- shown, SH3 disabled, under (forced-colors: active) -->
</fieldset>
<fieldset id="map-layers" class="filter-group filter-rows legend-control"><legend>Show on the map</legend>                      <!-- L1; rendered only when data.conflicts is loaded or errored -->
  <label class="filter-row"><input type="checkbox" name="layer" value="episodes" checked><span class="filter-row-label">Protests and strikes</span></label>
  <label class="filter-row"><input type="checkbox" name="layer" value="conflicts" checked><span class="filter-row-label">Armed conflict (UCDP)</span></label>  <!-- disabled with EC6 text when absent -->
</fieldset>
```

The segmented control and row classes are the shared primitives already styled in `css/feed.css`; WP-C may use them inside `#map-legend` (ownership exception recorded here; WP-B does not change their rules in 4.1). `change` on `name="colour-by"` → `actions.setColourBy(value)`; on `name="layer"` → `actions.setLayer(value, checked)`. Both fieldsets are hidden in example mode and while events failed (editorial §2.2 (10)). Under `matchMedia('(forced-colors: active)').matches` the recency radio is `disabled`, SH5 is shown and the map paints as `coverage` whatever the URL says.

#### 4.3.2 `map.js` contract (pure helpers are Node-testable)

```js
export function recencyByCountry(events, now)
  // Map<ISO, 'fresh'|'week'|'month'|'older'|'unknown'>: for each country the band of the newest last_observed_at among its records,
  // computed with observationBand({last_observed_at}, now) so edges equal the badges; 'unknown' when ANY record of the country lacks a parseable date (editorial §2.3)
export function kindsByCountry(events, conflicts)
  // Map<ISO, 'episode' | 'conflict' | 'episode conflict'> from events[].country and conflicts[].location_countries
// update(partial) keys: {events, countries, selectedCountry, mode, loading, error, contexts, cityGeography,
//                        shading: null | Map<ISO, band>, conflicts: null | Map<ISO, ConflictRecord[]>}
```

`paint()` sets on each `path.map-country`: the 4.0 attributes unchanged (`data-has-records` = episodes only, so 4.0 fills are untouched) plus `data-recency="<band>"` when `shading` is a Map and the country has records (removed otherwise) and `data-kinds="episode" | "conflict" | "episode conflict"` (removed when neither). Candidates for the roving tabindex include conflict-only countries. `describe(code)` (map-view) appends " · Newest evidence {date} · {F badge}" while shading is on, and the EC3 sentence when the country has conflict records.

**Patterns and the overlay.** `<defs>` gains `<pattern id="map-conflict-<n>" class="map-conflict-pattern" patternUnits="userSpaceOnUse" width="10" height="10">` with **no rect** and two `<path>` elements sharing the opposite diagonal to the gap hatch (`"\"` where the gap hatch is `"/"`): `path.map-conflict-casing` then `path.map-conflict-ink`. `scaleMarks()` sets `patternTransform scale(CROSS * s / TILE2)` with `CROSS = 9` CSS px spacing (gap hatch stays at 6 px), so spacing is constant at every zoom like the gap hatch. `container.style.setProperty('--map-conflict-fill', 'url(#map-conflict-<n>)')`. A new `<g class="map-conflict-layer" aria-hidden="true">` sits between `.map-countries` and `.map-borders`; `paint()` joins one `<path class="map-conflict" data-country data-has-records d="…">` per country in `conflicts` using the base path's `d` (already in `byCode`), `pointer-events: none`. Over base fills this draws the hatch on land, ochre or any recency step without multiplying patterns.

#### 4.3.3 Tokens (`styles.css`, WP-A; names frozen, added to test_shell `TOKENS`)

| Token | Light | Dark |
|---|---|---|
| `--map-recency-fresh` | #6e4514 | #e6c48f |
| `--map-recency-week` | #935f1f | #d4a45c |
| `--map-recency-month` | #b4772a | #bd8236 |
| `--map-recency-older` | #c89a52 | #8f5f22 |
| `--map-conflict-ink` | var(--text) | var(--text) |
| `--map-conflict-casing` | var(--map-selected-halo) | var(--map-selected-halo) |

#### 4.3.4 `css/map.css` rules (consume tokens only; WP-C)

```css
.map-country[data-has-records="true"][data-recency="fresh"] { fill: var(--map-recency-fresh); }
.map-country[data-has-records="true"][data-recency="week"]  { fill: var(--map-recency-week); }
.map-country[data-has-records="true"][data-recency="month"] { fill: var(--map-recency-month); }
.map-country[data-has-records="true"][data-recency="older"] { fill: var(--map-recency-older); }
/* data-recency="unknown" keeps var(--map-reported) (editorial §2.3) */
.map-country[data-kinds~="conflict"]:not([data-has-records="true"]) { fill: var(--map-land); }   /* conflict only: no gap hatch (M3 wording) */
.map-conflict { fill: var(--map-conflict-fill); pointer-events: none; }
.map-conflict-pattern .map-conflict-casing { fill: none; stroke: var(--map-conflict-casing); stroke-width: 3.4; }
.map-conflict-pattern .map-conflict-ink    { fill: none; stroke: var(--map-conflict-ink); stroke-width: 1.6; }
.world-map[data-mode="example"] .map-conflict-layer, .world-map:is([data-map-state="data-loading"], [data-map-state="data-error"]) .map-conflict-layer { display: none; }
.legend-swatch[data-recency="fresh"] { background: var(--map-recency-fresh); } /* … week, month, older */
.legend-swatch[data-kind="conflict"], .legend-swatch[data-kind="both"] {
  background-image: repeating-linear-gradient(45deg, var(--map-conflict-ink) 0 1.6px, transparent 1.6px 9px),
                    repeating-linear-gradient(45deg, var(--map-conflict-casing) 0 3.4px, transparent 3.4px 9px); background-position: 0 0, -0.9px -0.9px; }
.legend-swatch[data-kind="both"] { background-color: var(--map-reported); }
.legend-swatch { print-color-adjust: exact; }
@media (forced-colors: active) {
  .map-country[data-has-records="true"][data-recency] { fill: CanvasText; }           /* shading is unavailable (SH5) */
  .map-conflict-pattern .map-conflict-casing { stroke: Canvas; }
  .map-conflict-pattern .map-conflict-ink { stroke: CanvasText; stroke-width: 2.2; stroke-dasharray: 4 3; }   /* dashed: differs in geometry from the solid gap hatch */
  .map-conflict[data-has-records="true"] { filter: invert(1); }                      /* ink over a CanvasText fill reads as Canvas dashes */
  .legend-swatch[data-kind="conflict"] { background: Canvas repeating-linear-gradient(45deg, CanvasText 0 2px, transparent 2px 9px); }
  .legend-swatch[data-kind="both"] { background: CanvasText repeating-linear-gradient(45deg, Canvas 0 2px, transparent 2px 9px); }
}
```

The `filter: invert(1)` trick for the both-case under forced colours is the one rule the builder must verify in a forced-colours screenshot (smoke 28); if a browser ignores it, the fallback is a second pattern with Canvas strokes selected by `data-has-records`, costing about 120 B. Everything else is attribute-to-token mapping, no inline styles (tech §5.6 holds). Reduced motion: no new transitions; a band changes only when the clock crosses an edge (editorial §2.2 (5)).

#### 4.3.5 Legend (`legendHTML` in `js/map-view.js`)

`legendHTML({…existing…, colourBy, shading: {counts: {fresh, week, month, older, unknown}, latestObservation, datasetState}, conflicts: 'absent' | 'error' | 'loaded' | null, layers, forcedColors})`:

- Controls (§4.3.1) first, then `h2.legend-title` M1, then the list.
- `colourBy === 'coverage'`: M2…M6 as today (M2 and M3 take the conflict-layer variants from editorial §7.3 when `conflicts === 'loaded'`), plus `item('conflict', M2c1)` and `item('both', M2c2)` when loaded and the layer is on.
- `colourBy === 'recency'`: the four `item('recency', M2a–M2d)` rows with `data-recency` swatches, each with " · none in this view" when its count is 0; `M2e` only when `counts.unknown > 0`; then M4, M5, M6 and the conflict rows; M8a replaces M8; M10 when `datasetState !== 'current'`.
- Notes: M7, M8 or M8a, M9 (window), M11 (conflict footnote, when loaded), M12 (window ≠ all with the layer on), EC1 (absent) or EC2 + Retry `data-action="retry-conflicts"` (error), cities note.
- `SHADE_COPY` is a separate frozen object (SH1–SH6, M2a–M2e, M8a, M10 template) so the scoped banned-word test (§8.1) can run over exactly those strings.

`paint()` in map-view computes `recency = colourBy === 'recency' && !forcedColors && !off ? recencyByCountry(mapEvents, now) : null`, `conflictMap = layers.conflicts && data.conflicts ? conflictsByCountry(selectConflicts(state, {ignoreCountry: true}) or all records when kindScope is 'all') : null`, and adds a digest of both to `payloadKey` so `map.update` runs when a band flips on the 60 s tick. `mapEvents` is empty when `kindScope(filters) === 'conflicts'` or `!layers.episodes`.

#### 4.3.6 Country brief (`js/country-brief.js`)

`briefModel({…, conflicts})` gains `conflicts: ConflictRecord[]` for the country (from `conflictsByCountry`) and `conflictsLoad: 'absent' | 'error' | 'loaded' | null`. `renderBrief` adds, after the records list, `<h4 class="brief-subtitle">Armed conflict (UCDP)</h4>` with EC3 (no episode, n conflicts), EC4 (loaded, none), EC1 (absent) or EC2 (error + Retry), and a `<ul class="brief-records">` of conflict links (`data-open-record`). `overviewModel` is unchanged (never counts conflicts).

### 4.4 Forced colours, dark mode, print, example mode (summary)

| Context | Shading | Conflict hatch | Badges |
|---|---|---|---|
| Dark mode | dark ramp tokens; direction flips so the newest band is lightest | ink `#efede6` cased in `#0e1311` | neutral ink |
| `(forced-colors: active)` | unavailable: control disabled, SH5 shown, fills CanvasText | dashed CanvasText (Canvas over records) | outlined in CanvasText (`.side-pill` rule) |
| Print | same tokens; `print-color-adjust: exact` on swatches; the ramp is monotone in lightness so it reads in grayscale | geometry differs from the gap hatch (angle, spacing, two-tone, 9 px vs 6 px) | text |
| Example mode | control hidden, coverage only | layer hidden | "Collective action" only via the Overview row |
| Events error / loading | control hidden; neutral land | hidden | — |

### 4.5 `.kind` primitive (`styles.css`, WP-A; ≈ 120 B)

`.kind` shares the `.side-pill` declaration block (outlined pill, neutral ink, 12 px minimum, 4.5:1), selected as `.side-pill, .kind { … }` where `.side-pill` is defined (record.css is WP3-owned in 4.0; in 4.1 the shared block moves to `styles.css` `@layer base` as a primitive and record.css keeps only `.rec-stance .side-pill`). Under forced colours it gets the existing `border: 1px solid CanvasText`. No `data-kind`-specific colour rule exists anywhere (test_shell asserts `css` does not match `/\.kind\[data-kind[^{]*\{[^}]*(color|background)/`).

---

## 5. Budget: the lazy-view split, CSS stripping and allocations

### 5.1 Phase 0: lazy Ahead, Countries and About (C-53; lead, before any WP starts)

1. **New static module `js/teaser.js`** (≈ 1.4–1.7 KB gz): move `aheadTeaserHTML`, `upcomingCount`, `groupAnnouncements` and its private helpers (`byStart`, `byStartDesc`, `periodPassed`) out of `js/ahead.js`; move `discoveryView` and `RUN_URL` out of `js/about.js`. Imports: `./html.js`, `../freshness.js` only.
2. `js/list.js` imports `aheadTeaserHTML` from `./teaser.js`; `js/stamps.js` imports `discoveryView` from `./teaser.js`. `js/ahead.js` and `js/about.js` import what they need from `./teaser.js` and **re-export** `upcomingCount`, `groupAnnouncements`, `aheadTeaserHTML` and `discoveryView`, so `tests/test_pages.mjs` imports keep working unchanged.
3. `app.js`: `const firstVisit = {ahead: () => import('./js/ahead.js').then(m => m.mountAhead), countries: () => import('./js/countries.js').then(m => m.mountCountries), about: () => import('./js/about.js').then(m => m.mountAbout)}`. `flush()` calls `mountView(view)` once per view: it caches the promise, renders `<p class="view-loading" role="status">Loading this section…</p>` into `#<view>-root`, and on resolve mounts and renders with the latest state. On rejection it renders `<p class="view-error" role="status">This section could not load.</p><button class="btn" data-action="retry-view" data-view="…">Retry</button>` (copy to editorial; the retry re-imports with `?retry=n` like the map, then reloads when online after two failures). Prefetch: one listener on `#primary-nav` and `#tab-bar` for `pointerover`, `focusin` and `touchstart` that starts the same `import()` for the hovered `data-nav` view (no mount). Expected app.js growth ≤ 600 B gz.
4. `index.html`: remove the three `modulepreload` links, add `./js/teaser.js` (and `./js/conflicts.js` once the Phase-0 stub exists); the import map gains the new modules (test_shell derives the expected keys from `readdirSync`, so every `js/*.js` file needs an entry); bump every `?v=4.0` to `?v=4.1`.
5. `tests/test_shell.mjs`: `STATIC_GRAPH_21` → `STATIC_GRAPH_20` = the 21 minus `js/ahead.js js/countries.js js/about.js` plus `js/teaser.js js/conflicts.js`; `LAZY` = `['map.js', 'js/map-view.js', 'js/country-brief.js', 'js/ahead.js', 'js/countries.js', 'js/about.js', 'js/conflict-detail.js']`; the test asserts `app.js` contains each lazy specifier inside an `import(`; the cycle walk covers every lazy entry; `assert.equal(version, '4.1')`.
6. `tests/test_pages.mjs` "mount functions are inert without a DOM" keeps importing the mounts directly (static import in a test is fine; only `app.js`'s graph matters).
7. Run everything; record the measurement in INTEGRATION_NOTES §4 and SPEC §23 (C-53). **Expected critical JS: 92,586 − 19,890 + ≈ 1,600 + ≈ 600 ≈ 74.9 KB → ≈ 18.3 KB under the 91 KB ceiling.**

Routing and focus are unaffected: the router already focuses `#<view>-title` on navigation and the title is static HTML; the view body fills a frame later. Smoke check 2 (H1 visible after nav taps) and check 8 (Ahead) must wait for `#ahead-root .ahead-switch` instead of asserting synchronously.

### 5.2 Critical-JS allocations for 4.1 (gz, hard caps per WP; measured at each WP hand-off)

| WP | Files that grow | Cap |
|---|---|---|
| A | app.js (conflict record routing, colour URL sync, retry-view/record), styles.css tokens are CSS | ≤ 1.5 KB |
| B | model, explore, actions, store, data, filters, cards, record-facts, detail, list, stamps | ≤ 4.5 KB |
| D | `js/conflicts.js` (critical: shapes, labels, `renderConflictRow`, `conflictChrome`) | ≤ 1.5 KB |
| C | map.js, map-view.js, country-brief.js, map.css | map add-on only: ≤ 6 KB of the 17.7 KB headroom |
| D | `js/conflict-detail.js` | lazy; not in any critical bucket; ≤ 4 KB |

Expected after 4.1: critical JS ≈ 82–83 KB (≥ 8 KB headroom), map add-on ≈ 162 KB (≥ 11 KB headroom). **Ceilings are not raised.** If a WP exceeds its cap, it cuts scope (the §6 "may" items go first), never the ceiling.

### 5.3 CSS: build-time comment stripping, measured the same way (C-58; WP-A)

- `scripts/build.py` strips `/* … */` comments and collapses blank lines from every `.css` in `PUBLIC_COPIES` as it copies (a pure function `strip_css_comments(text)`; it raises `ValidationError` if any `/*` occurs inside a quoted string or `url(…)` on the same line, so a future `content: "/*"` cannot be mangled silently). Sources keep their contract comments.
- `tests/test_shell.mjs` measures CSS as `gz(stripComments(css))` with its existing `stripComments` helper, and adds a test that the JS and Python strippers agree on every stylesheet (`node -e` fixture comparison is unnecessary: the test reads `scripts/build.py`'s regex literal and asserts it equals its own). `tests/test_pipeline.py` adds `test_build_strips_css_comments` (built CSS contains no `/*`, and equals the stripped source).
- `docs/DEPLOYMENT.md` and TECH §6.2 state the rule: "CSS is measured and served comment-stripped; JS is served as written."
- **Measured effect: 27,351 → 22,708 B (−4,643 B), headroom 5,964 B.** 4.1 CSS allocations: WP-A ≤ 300 B (tokens, `.kind`, view-loading), WP-B ≤ 400 B (kind fieldset tweaks, badge spacing, conflict row), WP-C ≤ 900 B (§4.3.4), WP-D ≤ 400 B (conflict sheet tables under `rec-*` reuse). Reserve ≥ 3.9 KB for 4.2.
- JS comment stripping is **not** adopted in 4.1: a regex cannot safely distinguish `//` inside template literals and regex literals, and `node --check` does not catch a changed string. It stays a roadmap item (`build-time-js-minifier`, later) with the requirement of a tokenizer-based tool and a test run against the built output.

### 5.4 Data guards

`public/conflicts.json` gets its own guard in test_shell: ≤ 24 KB gz (absent counts as 0), label "conflicts.json (data)". It is not added to `CRITICAL_DATA`'s 180 KB sum so a UCDP ingest cannot push the protest data bucket over. `index.html` grows by about 400 B gz for the About paragraphs and the extra preload/import-map lines (12 KB ceiling, 6.1 KB headroom).

---

## 6. Work packages (disjoint files; exact deliverables)

### WP-A: Shell, app wiring, build, CI, docs

**Files:** `app.js`, `index.html`, `styles.css`, `scripts/build.py`, `.github/workflows/pages.yml`, `tests/test_shell.mjs`, `tests/test_site.py`, `tests/browser/smoke.cjs` (integration of checks 26–28 from the other WPs' acceptance lists), `docs/DEPLOYMENT.md`, `docs/MAP_IMPLEMENTATION.md`, SPEC §23 / TECH / INTEGRATION_NOTES addenda, `CHANGELOG.md`, `public/roadmap.json` (§9).

**Delivers:** Phase-0 split hardening (retry-view, prefetch); conflict record routing (§3.6); `?colour=` read at boot (`initialState({ui: readUIState(location.search)})`) and written by `syncURL` (`encodeViewState(filters)` + `encodeUIState(ui)`); tokens of §4.3.3 in all three token blocks; `.kind` primitive (§4.5); About copy from editorial §7.6 (two "How to read the map" items, the "Kinds of record" section, EC5 line) as static HTML; CSS stripping (§5.3); `conflicts.json` optional in build and verify; test_shell: 20-module graph, lazy list, tokens, CSS measurement rule, `conflicts.json` guard, the §2.5 global banned words (`hot`, `cold`, `heat`, `heatmap`, `heat map`, `warm`, `cool`, `temperature`, `thermal`, `flare-up`, `flaring`, `surge`, `spike`, `uptick`, `intensifying`, `de-escalating`) added to `BANNED` with the data-verbatim exception, and the `.kind` no-colour assertion.

**Acceptance:** all tests green; critical JS and CSS measured and recorded; a fresh `#/map` load paints no `data-recency`; `#/ahead`, `#/countries`, `#/about` render after one dynamic import each, with the loading and failure states reachable in smoke (route block on `js/countries.js` → failure copy and Retry); `#/record/ucdp-test-a` with the sample fixture routed opens the conflict sheet through the lazy module; no banned word in `index.html` or `404.html`.

### WP-B: Kind in state, URL, filters, cards and sheet

**Files:** `explore.js`, `js/store.js`, `js/data.js`, `js/actions.js`, `js/model.js`, `js/filters.js`, `js/list.js`, `js/cards.js`, `js/record-facts.js`, `js/detail.js`, `js/stamps.js`, `js/notice.js` (EC2 notice line "Conflict records could not load, so they are unknown here, not absent." + Retry), `css/feed.css`, `css/record.css`, `tests/test_core.mjs`, `tests/test_record.mjs`, `tests/test_explorer.mjs`.

**Exports (frozen for 4.1):** everything in §3.3–§3.5; `kindFact(event)`; `renderCard(event, {…, showKind})`; `legendless` list branch for conflict kinds; `stampItems` row `conflicts` (key, label "Conflict dataset", T4 copy).

**Acceptance:** `readViewState(encodeViewState(s))` round-trips `kind`; `droppedParams('?kind=war&colour=heat')` → `['kind', 'colour']`; `kindOf({})` is `null` and the frozen-fixture records render without a badge; with `snapshot-20261002-kind` all 84 are `collective-action` / `contract-default`, `showKindBadges` is false, `#kind-filter` is hidden, every Overview carries K7 with the suffix; with the conflicts sample loaded `kindsPresent` has ≥ 2 members, the badge and the fieldset appear, `kindOptions` lists only kinds present (alphabetical after "Any kind", no zero counts), a conflict kind lists conflict rows and disables CSV, `window: '7'` empties the conflict list with M12; `visibleRecords` drives prev/next; no copy string contains a banned word (`test_record` copy scan extended with the K-strings).

### WP-C: Map shading, patterns, layers, legend, brief

**Files:** `map.js`, `js/map-view.js`, `js/country-brief.js`, `css/map.css`, `tests/test_map.mjs`.

**Exports/attributes/classes:** `recencyByCountry`, `kindsByCountry`, `update({shading, conflicts})`; attributes `data-recency`, `data-kinds`; classes `map-conflict-layer map-conflict map-conflict-pattern map-conflict-casing map-conflict-ink legend-control`; ids `map-shade`, `map-layers`; `SHADE_COPY`, `LAYER_COPY`, `CONFLICT_LEGEND_COPY` objects; `legendHTML` signature of §4.3.5; `describeCountry` additions; `briefModel({conflicts, conflictsLoad})`.

**Acceptance:** `recencyByCountry` edges equal `observationBand` at 72 h / 7 d / 30 d with a fixed `now`, the unknown rule holds, ties take the newest; with `colourBy: 'coverage'` `legendHTML` output equals 4.0 text row for row when `conflicts` is null (regression on the M-strings test); with `'recency'` the rows are M2a–M2d with the suffix on empty bands, M2e only when needed, M8a replaces M8, M10 on the 9 Oct clock; `forcedColors: true` disables SH3 and shows SH5; example mode hides both fieldsets; the scoped banned-word test over `SHADE_COPY` passes (editorial §2.5 feature list, with "latest evidence" allowed); legend swatches carry `data-recency` or `data-kind="conflict|both"` and no inline style; map.css stays in `@layer components` with tokens only (existing CSS test extended); the brief renders EC1–EC4.

### WP-D: Validators, merge, conflicts schema, UCDP ingest, conflict modules

**Files:** `scripts/validate_data.py`, `scripts/merge_history.py`, `scripts/validate_conflicts.py` (new), `scripts/ingest_ucdp.py` (new), `research/ucdp/README.md` + `aliases.json` (new, aliases reviewed by the data session), `public/events.json` and `public/examples.json` (regenerated / edited once), `tests/test_pipeline.py`, `tests/test_conflicts.py` (new), `tests/fixtures/snapshot-20261002-kind/`, `tests/fixtures/conflicts-sample/`, `tests/fixtures/ucdp-sample/`, `js/conflicts.js` (new, critical), `js/conflict-detail.js` (new, lazy), `tests/test_conflict_ui.mjs` (new), `docs/HANDOFF_DATA_REFRESH.md` (round-5 clauses), `docs/EDITORIAL_POLICY.md` v1.3 text is editorial-owned and only pasted here.

**Exports:** `js/conflicts.js`: `CONFLICT_COPY` (EC1–EC6, CD eyebrow, row strings), `conflictLatestLabel(record)` ("2024" | "Aug 2026"), `activityLabel(record, envelope)` (the three editorial §4.2 sentences), `renderConflictRow(record, {countryName, envelope})`, `conflictChrome(record)` → `{eyebrow, title, sourceLabel, sourceURL}`. `js/conflict-detail.js`: `CONFLICT_SECTIONS`, `renderConflictRecord(record, {envelope, now, countryName})` producing CD1–CD7 verbatim with `<h2 id="detail-title" tabindex="-1">`, sticky tabs "Overview · Years · Months · Limits · Source", a years table and a months table (`<table class="rec-table">`, every death figure as "best {n} · low {l} · high {h}" with year and version), the fixed notes, and no status, stance, intensity, state or timeline markup.

**Acceptance:** `validate_data` rejects a missing `kind`, an unknown kind, `contract-default` on `strike`, `source-reread` without sources, `kind_basis` with an extra key; accepts the regenerated `events.json`; the 13 keyword records are `collective-action`/`contract-default` (asserted on the kind fixture by id list); `validate_conflicts` rejects each case in §8.2; the sample fixture passes; the ingest reproduces the sample byte for byte and fails on an unmapped location; `build()` succeeds with and without `public/conflicts.json`; `renderConflictRecord` output contains no "ongoing", "casualt", "toll", "front", "controls", "escalat", no digit without its low and high beside it (test by regex over the rendered figures), and passes the banned scan; `js/conflicts.js` ≤ 1.5 KB gz.

---

## 7. Phase-0 scaffold (lead; in this order; about 90 minutes)

1. Branch `release/4.1` from `fcd35a7`; confirm `origin/main == fcd35a7` and that the data session has not pushed (`git ls-remote`).
2. The lazy-view split of §5.1 (teaser module, dynamic imports, preloads, version 4.1, test_shell graph) → run `node --test tests/*.mjs` and `python -m unittest discover -s tests`; record critical JS and CSS in INTEGRATION_NOTES §4 (new row "after Phase 0, 4.1").
3. Stubs with the frozen signatures and TODO bodies that return 4.0 behaviour: `js/conflicts.js` (constants + `renderConflictRow` returning `''`), `js/conflict-detail.js` (`renderConflictRecord` returning a loading paragraph), `scripts/validate_conflicts.py` (`validate_conflicts_repository` returning `None`), `tests/fixtures/snapshot-20261002-kind/README.md`.
4. Store, data and model stubs: `filters.kind`, `ui.colourBy`, `ui.layers`, `data.conflicts`, `CRITICAL.conflicts` + shape + absent rule, `KINDS`/`KIND_LABELS`/`kindOf`/`kindScope`/`kindsPresent`/`showKindBadges`/`selectConflicts`/`conflictsByCountry`/`findRecord`/`visibleRecords` with the trivial bodies; `explore.js` `FILTER_KEYS` + `kind`, `readUIState`/`encodeUIState`; `actions.setColourBy`/`setLayer`/`retryConflicts` no-ops that set state.
5. Tokens of §4.3.3 in `styles.css` (three blocks) and the test_shell `TOKENS`/`LIGHT`/`DARK` additions.
6. Import-table amendment (C-53) written into SPEC §19.0: `list.js → teaser.js, conflicts.js`; `stamps.js → teaser.js`; `ahead.js, about.js → teaser.js`; `conflicts.js → html.js, model.js, freshness.js`; `conflict-detail.js (lazy) → html.js, model.js, conflicts.js, freshness.js`; `map-view.js → + conflicts.js`; app.js dynamic: map-view, ahead, countries, about, conflict-detail.
7. `scripts/build.py` CSS stripping + `conflicts.json` optional; `tests/test_shell.mjs` CSS measurement rule; `tests/test_site.py` optional-file skip.
8. Push; tell the data session the SHA (HANDOFF §2.2); open the four WP lanes.

---

## 8. Tests

### 8.1 Node (`node --test tests/*.mjs`, offline)

| File | New cases |
|---|---|
| test_shell | 20-module graph and lazy list; `import(` for each lazy module; tokens; CSS measured stripped and the stripper-parity check; `conflicts.json` guard; §2.5 global banned words with self-tests ("Heat map" hit, "Heathrow" not); `.kind` has no colour rule; `index.html` About copy carries no banned word (existing scan) |
| test_core | `readViewState`/`encodeViewState`/`droppedParams`/`shareURL` with `kind` and `colour`; `initialState` defaults; `setColourBy`/`setLayer`/`retryConflicts`; `validateFilters` drops a conflict kind when conflicts are absent and an event kind that is not present; `loadCritical` → `errors.conflicts === 'absent'` on 404, `'error'` on 500 or bad shape; `kindOf` null rule; `kindsPresent`, `kindOptions` (no zero counts, alphabetical), `showKindBadges`; `selectConflicts` by kind/country/region/year/query and empty under a window; `findRecord` both datasets; `visibleRecords`; `controlStates.csvDisabled` under a conflict kind; `noticeModel` EC2 line |
| test_record | badge only with `showKind`; K6 hidden text; K7 variants (`contract-default`, `source-reread`, `illustrative`, null); civil-unrest record note; every card and record in both fixtures still renders in both densities; copy scan extended with K-strings and the §2.5 words |
| test_map | `recencyByCountry` edges, unknown rule, ties; `kindsByCountry`; `legendHTML` regression (coverage mode equals 4.0 rows when `conflicts` is null); recency rows, suffix, M2e, M8a, M10; controls present/hidden/disabled by mode and forced colours; conflict rows, M3 variant, M11, M12, EC1/EC2; `SHADE_COPY` scoped banned words; `describeCountry` additions; `briefModel` conflicts states; `map.css` layer/token rules; no inline style in legend output |
| test_pages | mounts inert without DOM (unchanged); `teaser.js` exports equal the re-exports; stamps T4 row present/absent |
| test_explorer | permalink round trip includes `kind`; shared view with `colour=recency` restores `ui.colourBy` |
| test_conflict_ui (new) | `renderConflictRow` and `renderConflictRecord` on the sample fixture: CD1–CD7 strings, three activity sentences, bounds beside every figure, forbidden strings absent, tabs, no `.status`/`.band`/`.side-pill` |

### 8.2 Python (`python -m unittest discover -s tests`, offline)

- `test_pipeline`: `test_kind_required_and_enumerated`, `test_contract_default_only_for_collective_action`, `test_source_reread_needs_event_local_sources`, `test_kind_basis_exact_keys`, `test_illustrative_kind_basis_only_in_examples`, `test_public_events_all_carry_kind` (invariant on `public/events.json`), `test_build_strips_css_comments`, `test_build_with_and_without_conflicts_file`.
- `test_conflicts` (new): valid sample passes; each rejection: `lat` key at any depth, `status` key, `deaths` without `low`/`high`, `low > best`, id not `ucdp-{conflict_id}`, id colliding with an event id, `kind`/`type_of_conflict` mismatch, unknown location code, `latest_recorded` mismatch, future `last_year`, `provisional` month inside `last_year`, unsorted years, `http://` source, `method_note` without the fixed sentence, `window.first_year < 2024`, extra envelope key; ingest determinism and the unmapped-name failure; `validate_conflicts_repository` returns `None` when the file is absent.
- `test_roadmap`: the new items validate (existing suite; blocked items name blockers; no "shipped" without test evidence).
- `test_site`: optional-file skip; verify job lists `conflicts.json` as optional (regex extended like `upcoming`).

### 8.3 Browser smoke (`tests/browser/smoke.cjs`; lead integrates at Phase 2)

- **26 Shading.** Fresh `#/map` on the 2 Oct and 9 Oct clocks: every `.map-country` computed fill equals its 4.0 fill (snapshot of `getComputedStyle(path).fill` per country compared with a run where `#map-shade` is absent, i.e. with the control removed via `page.evaluate`), SH2 pressed, no `data-recency`. Press SH3: every fill with `data-has-records="true"` is one of the four `--map-recency-*` computed values; on the 9 Oct clock the fresh and week rows read " · none in this view" and M10 names 2 Oct 2026; S5 still above the map; `location.search` contains `colour=recency`; reload with `?colour=recency#/map` restores SH3; `?colour=heat` is dropped and the dropped-params notice line appears; cards and list rows on `#/latest` have byte-identical computed colours before and after (sample five).
- **27 Conflict layer with the sample fixture** (`page.route('**/public/conflicts.json', fulfill sample)`): `pattern.map-conflict-pattern` exists once; `.map-conflict` path count equals the fixture's distinct location countries; a conflict-only country has no gap pattern fill; legend rows M2c1/M2c2, M11; `#kind-filter` visible and lists exactly the kinds present; choosing a conflict kind shows the conflict section and no band groups, CSV `aria-disabled`; window 7 → M12 and no rows; open a conflict record: CD1–CD7 present, forbidden strings absent; the dates sheet shows the "Conflict dataset" row; without the route, EC1 appears in the legend, About and the dates sheet.
- **28 Forced colours** (`page.emulateMedia({forcedColors: 'active'})`): SH3 `disabled` with SH5; computed backgrounds of the gap, conflict, both and reported swatches are four different images; screenshot of the legend and a conflict country at 390 and 1440; `.map-conflict-ink` dash array applied. Grayscale check: a `page.screenshot` converted to grayscale in Node (sharp is not available; use the existing PNG decode path if present, else a visual check recorded in the hand-off).
- Existing checks: 2 and 8 wait for the lazy views; 13, 17 run with SH3 pressed as well; 14's scan carries the §2.5 words; 1 adds the view-failure state (block `js/countries.js`) with no console error other than the blocked request.

---

## 9. Roadmap items (`public/roadmap.json`; statuses at planning; the lead flips)

Adopt the editorial §7.7 rows with these technical amendments:

| id | status | change from editorial §7.7 |
|---|---|---|
| `lazy-views-and-budget-headroom` | next → in-progress at Phase 0 | summary names the two levers that ship: lazy Ahead/Countries/About and build-time **CSS** comment stripping; acceptance "critical JS at least 15 KB under its ceiling after the split, CSS at least 4 KB under; ceilings unchanged; tests/test_shell.mjs::modulepreload equals the static import graph" |
| `build-time-js-minifier` | later | new: tokenizer-based JS comment stripping measured in test_shell; not a regex; blocked on nothing, deferred for safety |
| `shading-by-newest-evidence` | next | depends on `lazy-views-and-budget-headroom`; acceptance adds "URL `colour=recency` reproduces the view; never stored" |
| `colour-blind-patterns` | next | acceptance adds "two-tone hatch clears 3:1 on every fill in both modes (§1.4)" |
| `kind-field-collective-action` | next | acceptance adds "frozen 2 Oct fixture untouched; new kind fixture" |
| `kind-subtyping-by-source-reread` | blocked | unchanged |
| `ucdp-ingest-and-validator` | next | acceptance names `research/ucdp/manifest.json`, the alias table and the synthetic fixtures |
| `armed-conflict-context-layer` | blocked | unchanged; depends on the three above |

R4 "What we will not build" gains the four editorial lines (front-line maps, seriousness scores, event coordinates, running death counts).

---

## 10. Integration order, risks, open questions

**Order (Phase 2):** Phase 0 → WP-D Python and fixtures first (the kind fixture unblocks WP-B's literal tests) → WP-B and WP-C in parallel → WP-A wiring last (it consumes B's `findRecord` and D's `renderConflictRecord`) → smoke 26–28 → editorial acceptance (editorial §9) → roadmap flips with test evidence → docs.

| Risk | Mitigation |
|---|---|
| A builder reaches for a hue for kind or a red pole | Tokens are the only colour source; test_shell asserts no `.kind[data-kind]` colour rule; map.css test asserts fills only from `--map-*`; the ramp hexes are pinned in `LIGHT`/`DARK` |
| The lazy split changes first-visit timing on Ahead | Prefetch on hover/focus/touchstart; loading copy; smoke waits; measured in INTEGRATION_NOTES §5 under the mobile profile |
| `filter: invert(1)` under forced colours is ignored by a browser | Smoke 28 screenshot; fallback second pattern (≈ 120 B) |
| The frozen fixture gains a `kind` by accident | README rule; a test asserts the frozen `events.json` sha256 equals the recorded value |
| `conflicts.json` 404 on every load in production until the data lands | Same cost as `upcoming.json` today; the verify job reports it as a notice |
| Kind filter appears with one kind | `showKindBadges` gates the fieldset and the badges; test on the kind fixture |
| Counts summed across datasets | `datasetStats`, `overviewModel`, result summary and CSV never see conflicts; tests assert the 84 stays 84 with the sample loaded |
| The data session edits `merge_history.py` concurrently | Phase 0 pushes first and the handoff names the SHA; the kind defaults are additive |

**Open questions for the lead and the editor**

1. Copy not in the editorial deck that this document needed: the conflict section heading and note in Reports, the conflict result summary, "Loading this section…" / "This section could not load." / "Loading this record…" / "This record could not load.", the CSV title "CSV export covers protest and strike records", and the conflict row's evidence line. All avoid the banned lists; they need the editor's sign-off.
2. Fixtures: this document keeps `snapshot-20261002/` frozen and adds `snapshot-20261002-kind/`; the editorial draft §10.2 regenerates the frozen copy. Decide before Phase 0 step 3.
3. CSS stripping at build (§5.3) is a change to what the budget measures (stripped output, as served). It follows SPEC §23's named lever; confirm the lead accepts a build-time transform of CSS. If not, 4.1 CSS must fit in 1,321 B and WP-C's conflict legend swatches become the first cut.
4. `colour=` versus `shade=` as the URL parameter: this document uses `colour` as the brief asked; the control's label is "Shade countries by" (editorial SH1). Harmless, but one word should be chosen before WP-B freezes `explore.js`.
5. UCDP column names and the licence line in `research/ucdp/manifest.json` are the data session's to confirm from the download; the ingest refuses unknown headers rather than guessing.
