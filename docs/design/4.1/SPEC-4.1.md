# Protest Atlas 4.1 — binding build spec: shading by newest evidence, kind, patterns and the UCDP context layer

Author role: lead designer/architect for 4.1. AI agent; no human designer, engineer or editor reviewed this. Written 4 Oct 2026 against the deployed 4.0 tree at `fcd35a7` (`main == ccr-77796c82-ka7vhp`, clean). It synthesises the four panel documents in this directory (`encoding.md`, `editorial.md`, `tech.md`, `handoff-round5.md` with `ingest/`) and the repository documents named in `inputs.md`. Every byte count was re-measured in this session with `tests/test_shell.mjs`'s method (gzip -9 per file, summed); every palette claim was re-run with the dataviz validator in this session (§3.3); every WCAG figure was computed here. **Revision 2 (4 Oct 2026):** revised after the critic's review of revision 1; every change is listed in §16 and every repository fact the changes rest on was re-read in this session (§0.1). **KB in this document means 1,024 bytes**, as `tests/test_shell.mjs` defines it; expected sizes are given in bytes.

**Precedence.** `docs/EDITORIAL_POLICY.md` v1.2 and `docs/design/EDITORIAL_GUIDANCE.md` stand, with the two narrow amendments in §13. Within the panel, `editorial.md` wins on copy and on what may be encoded; `tech.md` wins on mechanism, files, budgets and tests; `encoding.md` wins on pattern geometry and validator method; `handoff-round5.md` wins on the data session's procedure. Where they disagree, §2 resolves it and the resolution here is binding. Where this document is stricter than any of them, this document wins for 4.1.

**What ships in 4.1 and what does not.** 4.1 ships: the lazy-view budget split; a `kind` on every record (pipeline default "collective action"); an opt-in map shading by the date of each country's newest cited evidence (one hue, lightness ramp, coverage-only stays the default); the UCDP conflict context layer as **code, validator, offline ingest, publish step, fixtures and empty state**; a conflict texture (two-tone dots) that reads under colour-vision deficiency, forced colours and in print; the Kind filter and badge, shown only once the data hold more than one kind. 4.1 does **not** ship any conflict record or any re-typed episode: this environment cannot reach UCDP or news hosts, so those two roadmap items are `blocked` and the interface ships their honest empty states. "Hot/cold", "heat", "war map", a severity or danger score, red, motion and anything that reads as live are not built, and the words are added to the banned list.

---

## 0. The request, read honestly

| The user asked for | What 4.1 does | Why not more |
|---|---|---|
| "hot and cold color feature" | An opt-in map shading, **"Shade countries by: Date of newest evidence"**: four ordinal lightness steps of the coverage ochre for the existing `observationBand` edges (72 h / 7 d / 30 d / older). Default stays published coverage. | The only time dimension the data support is the date of the newest cited evidence. A two-pole thermal scale has no honest midpoint; red reads as danger and fails the validator beside ochre (ΔE 13.4, editorial §1); a cool pole reads as "calm", which is the coverage-gap lie M3 exists to prevent. The words hot/cold/heat never appear (§4.7). |
| "other colors" | The four ramp steps (§3.2). No new hue family is added to the map. | A second hue for armed conflict would turn a protest atlas into a war map at a glance (editorial §3.4), and a "several kinds" fold would hide protest coverage in every country that also has a UCDP conflict (§2 R3). Kind is a texture and a text badge, never a hue. |
| "patterns for the color blind" | A two-tone dot texture for UCDP conflict locations, drawn as an overlay on whatever the base fill is; the gap hatch keeps its 45° lines; legend swatches use the same tokens; forced-colours and grayscale-print variants (§3.4–§3.5). Textures are always on when their layer is on. Until the data session publishes `conflicts.json`, the only texture on the live map is the 4.0 gap hatch; the dots, their legend swatches and their forced-colours and print behaviour ship as code exercised by the labelled fixture (§12). | Texture is the encoding here (as the 4.0 gap hatch is), not decoration added to a colour series; so the dataviz "opt-in texture" rule does not apply and no Patterns switch exists. |
| "live protest" | Unchanged 4.0 rules: nothing reads as live; the staleness banner is unchanged; the shading is off by default and ages honestly (on 9 Oct every shaded country is pale and the legend says why). | Editorial §3.1. |
| "now civil unrest" | A `kind` field with `civil-unrest` as a value and strict evidence rules (§5); the Kind filter and badge once the data hold two kinds. **No existing record is re-typed in 4.1.** | Riot versus protest is a reporting judgement; it needs a source re-read, which needs news access (blocked). Keyword guessing is rejected on the actual records (editorial §3.2). |
| "ongoing internal as well as external war for the past 2 years" | A separate, re-published UCDP context dataset (`public/conflicts.json`) with intrastate/interstate kinds, parties as UCDP names them, yearly best/low/high death estimates with dataset version, an activity basis instead of "ongoing", its own window and clock, and an empty state until the data session lands it. | UCDP hosts are unreachable here and the licence is unconfirmed (blocked). "Past 2 years" is the owner's intent, not a product claim: each dataset states its own window (§5.4). |
| "use skills and plugins to plan roadmap and code and submodels to execute" | This spec, the roadmap items in §12, four disjoint work packages in §9, the Phase-0 checklist in §10. | — |

### 0.1 Hard facts this spec is built on (verified 4 Oct 2026)

- 84 episodes, 81 countries, newest evidence 2 Oct 2026; **no `kind` on any record**; all researched under the round-3/round-4 "sourced collective-action episode" contract. 66 unknown status, 18 ended, 0 ongoing. `last_observed_at` is non-null on every published record (the validator requires it for non-planned public events), so "evidence date not established" cannot occur in published data.
- Budgets (this session, test_shell method): critical JS **92,586 B** against 93,184 (598 B headroom); CSS **27,351 B** against 28,672 (1,321 B; comment-stripped it would be 22,708 B); map add-on **160,205 B** against 174,080 (13,875 B); `index.html` 6,119 B against 12,288. Ahead + Countries + About = **19,890 B** of critical JS and are kept static only by `list.js → ahead.js` (`aheadTeaserHTML`) and `stamps.js → about.js` (`discoveryView`).
- Network: no UCDP, HDX, Wikipedia or news host is reachable (proxy 403). `public/countries.json` has 249 entries and **no code for Kosovo** (ISO has none); PS is "Palestine, State of", TW "Taiwan, Province of China".
- `docs/design/OPEN_SOURCE_RESEARCH.md` does **not** contain a UCDP row; the "CC BY 4.0" figure in `inputs.md` is unconfirmed and must be read on the UCDP download page by the data session (§6.6, §12).
- `tests/test_shell.mjs` `ALLOWED_MEDIA` has no `print`; `BANNED` has 29 patterns; `TOKENS`/`LIGHT`/`DARK` pin names and values; `STATIC_GRAPH_21` pins the import graph; smoke has 25 checks.
- The four 4.0 interface roadmap items stay `in-progress` (RELEASE_EVIDENCE: no browser check of the deployed pages yet).
- **Frozen contracts.** `tests/test_explorer.mjs:24-25` deep-equals `readViewState(encodeViewState(state))` against a **9-key** literal, and `tests/test_core.mjs:279` asserts `Object.keys(readViewState(''))` equals `FILTER_KEYS`; TECH_ARCHITECTURE §3.2/§10.1 and INTEGRATION_NOTES keep `test_explorer.mjs` and `test_freshness.mjs` unchanged as regression contracts. Their sha256 at `fcd35a7`: `3c4040349b1e6adbba815f5799ca34b02eced5de17a8f39f9ceaf78f460b9b9f` (`test_explorer.mjs`) and `3646ed5b9eb2201b8c00c4c70d86943f5706b965ba5270da0e426dd6986f272a` (`test_freshness.mjs`).
- **Stamps.** `scripts/merge_history.py` line 20 takes `now` at run time and writes it as `generated_at` and `last_editorial_review` of `events.json` (line 53), and into `research-ledger.json`, `coverage.json` (`checked_at`) and `upcoming.json`. `write()` is `json.dumps(data, ensure_ascii=False, indent=2) + '\n'`; re-serialising the committed `events.json` that way is byte-identical (checked this session), so a script that edits `events[]` and writes through `write()` leaves the envelope untouched. With the two kind keys on all 84 records `events.json` is 39,110 B gzip (was 38,377) against the 120 KB guard.
- **Smoke harness.** `tests/browser/smoke.cjs` `open()` (lines 164–173) records every response ≥ 400 and every "Failed to load resource" console error unless `allowed(url)`, which exempts only `build-info.json` while serving the repo plus the explicitly blocked patterns.
- **Shell test.** `tests/test_shell.mjs` lines 268–279 require exactly one versioned import-map entry per root module and per `js/*.js` file; `KB = 1024` (line 334); `CRITICAL_DATA` lists five files (line 340).
- **Forced colours.** `css/map.css` lines 175–196: under `(forced-colors: active)`, `.map-svg` has `forced-color-adjust: none` and `.map-country { fill: var(--map-gap-fill, Canvas); stroke: CanvasText; }` has specificity (0,1,0), so any more specific author rule paints its author colour in forced-colours mode unless the block overrides it.
- **Focus.** `js/map-view.js` line 104: `FOCUS_KEYS = ['data-focus-key', 'data-open-record', 'data-select-country', 'data-select-city', 'data-clear-filter', 'data-set-mode', 'data-retry', 'data-action', 'id', 'href']`; `setHTML` restores focus only to an element carrying one of them, within the same scope; otherwise focus goes to the country-panel title.
- **Geometry.** `public/world-countries.geo.json` has features for LU, CY, LB, AM, IL, PS, SI, ME, TL, KW and QA (LU spans 0.57° × 0.69°, under 1 px at world zoom on a 390 px viewport) and none for XK, BH, MT or SG.
- **Keyword leads.** Over every string value of each record except `sources[].url`, `/\b(riot\w*|clash\w*|unrest|loot\w*|arson|violen\w*)\b/i` matches **18** records and `/\b(war|wars|warfare|armed)\b/i` matches **0**; the "12 + 1" count in `inputs.md` used an unstated field set and is not reproducible, so the 18 are pinned in §5.2(7).
- **Dropped-parameter copy.** `js/notice.js` line 44 renders "Some link filters were not recognised and were removed: {names}."; `shade` is a display setting, not a filter.

---

## 1. Decisions at a glance

| # | Decision |
|---|---|
| D1 | Hue encodes exactly one new thing, on the map only, opt-in: the date of each country's newest cited evidence, as a one-hue ochre lightness ramp with four steps on the existing `observationBand` edges. Coverage-only is the default on every load. Never red, never two-poled, never animated, never persisted, never called hot, cold or heat. |
| D2 | Kind is a **texture and a text badge, never a hue**. UCDP conflict locations are a two-tone dot overlay (casing `--map-selected-halo` under ink `--text`), drawn on land, ochre or any ramp step. Episodes keep the solid coverage fill in every mode. |
| D3 | The control is **"Shade countries by"** with options **"Published coverage"** (default) and **"Date of newest evidence"**, pinned as `#map-shade` inside `#map-legend`. State: `ui.shadeBy`; URL `?shade=evidence`; never `localStorage`. |
| D4 | Data model: **both**. `kind` + `kind_basis` become required exact keys on `events.json` (84 × `collective-action` / `contract-default`, written by `merge_history.apply_kind_defaults` on every future merge and applied once in Phase 0 by `scripts/apply_kind_defaults.py`, which rewrites `events[]` and leaves `generated_at`, `last_editorial_review` and `coverage_note` byte-identical); armed conflict lives in a separate optional `public/conflicts.json` with its own schema (§6.4), validator, offline ingest and publish step. Counts are never summed. |
| D5 | Kind vocabulary (eight values, editorial §3.1): `collective-action protest strike civil-unrest` on events; `armed-conflict-intrastate armed-conflict-interstate non-state-conflict one-sided-violence` on conflicts. Sub-typing only by source re-read; conflict kinds only by UCDP coding. |
| D6 | Conflicts are a **context layer**, not feed items: map overlay + legend rows + tooltip, country brief subsection, record sheet at `#/record/ucdp-<id>` (lazy module), and in Reports only under a conflict Kind filter in their own section. |
| D7 | Phase 0 lands the lazy-view split (`js/teaser.js` static; Ahead, Countries, About via `import()`) and build-time **CSS** comment stripping before any feature work. Phase 0 also owns every 4.1 edit to `scripts/build.py`, the `.side-pill` move and `test_build_strips_css_comments`, so no lane depends on another lane's intermediate state (R30), and its first commit is the kind pipeline (§10 step 2), made on the assigned branch so the data session can base on it (R28). Ceilings are unchanged (91 KB JS, 28 KB CSS, 170 KB map add-on). JS minification is a later roadmap item. |
| D8 | Fixtures: `tests/fixtures/snapshot-20261002/` stays byte-frozen; `snapshot-20261002-kind/`, `conflicts-sample/` and `ucdp-synthetic/` are added, all labelled. `kindOf(event)` returns `null` for a missing kind; the UI never derives a kind. |
| D9 | Four disjoint work packages (A shell/app/build/CI/docs; B state/URL/Reports/cards/sheet; C map; D validators/merge/conflicts/ingest/conflict modules) with byte caps and frozen interfaces (§9). |
| D10 | Roadmap: eight items added or amended (§12); `in-progress` for what this round builds, `blocked` with the named blocker for the two items that need the data session. |
| D11 | Frozen things stay frozen: `tests/test_explorer.mjs`, `tests/test_freshness.mjs` and `tests/fixtures/snapshot-20261002/` are byte-identical to `fcd35a7` (sha256 asserted in tests); `readViewState`, `encodeViewState` and `FILTER_KEYS` keep their 9 keys and `kind` travels in its own codec (`readKindParam`/`encodeKindParam`, R26); Phase 0 never re-stamps `generated_at` or `last_editorial_review` (R27). |

---

## 2. Resolutions of panel disagreements (each binding)

| # | Question | Panel positions | Resolution and reason |
|---|---|---|---|
| R1 | What may hue encode? | All three: newest-evidence recency, opt-in; nothing else. | **Adopted.** Editorial §2.2's ten conditions are all requirements of this spec (§4). |
| R2 | Which ramp hexes? | Encoding: light `#ce9046 #b4772a #935a04 #714402`, dark `#8e5a04 #a76d1c #bd8236 #d4984d` (dark anchored on the 3–7 day step). Editorial and tech: light `#c89a52 #b4772a #935f1f #6e4514`, dark `#8f5f22 #bd8236 #d4a45c #e6c48f` (7–30 day step = `--map-reported` in both modes). Both pass `--ordinal`. | **Editorial/tech set adopted** (§3.2, validator output §3.3). Reason: the coverage colour is the same step (7–30 days) in light and dark, so the map keeps one identity across colour schemes and the legend sentence "the coverage colour is the 7–30 day step" is true in both; the dark light-end also clears 3:1 on ocean (3.42) where encoding's does not (3.23 but 2.29 on land vs 2.42). Encoding's set is recorded as a validated alternative and not used. |
| R3 | Kind on the map: hue or texture? | Encoding: three hue families (ochre / blue `#4c83de` / mauve `#7b3660`), validated ALL CHECKS PASS, "Several kinds" neutral fold. Editorial: never hue (war-map reading; all-pairs cap). Tech: texture overlay. | **Texture, not hue** (§3.4). Reasons, any one sufficient: (a) editorial §3.4(b): a conflict hue reads as danger whatever the legend says, and the harness requires that nothing reads as a danger score; (b) encoding's own fold rule would paint "Several kinds" neutral grey over every country holding both an episode and a UCDP conflict, hiding the protest coverage of exactly the countries readers will look at; an overlay shows both; (c) in 4.1 no conflict or sub-kind data exist, so a Kind colour mode would be all-ochre; (d) the user asked for patterns for colour-blind readers, which a texture satisfies without a hue. Encoding's validated hues are recorded in SPEC §17.2 as "validated, not adopted" so the search is not repeated; adopting them later needs a human editorial owner. |
| R4 | Conflict texture geometry | Encoding: dots for armed conflict (geometry must differ from the gap hatch's lines, especially under forced colours). Tech: opposite-diagonal two-tone hatch, `filter: invert(1)` for the "both" case under forced colours. Editorial: ink texture at a visibly different angle/spacing/colour from the gap hatch; must survive CVD simulation, forced colours and grayscale print. | **Two-tone dots** (§3.4): encoding's dot geometry with tech's casing-under-ink construction. Dots differ from the gap lines in geometry (editorial), one of the two inks clears 3:1 on every fill the overlay can sit on (table in §3.4), and under forced colours a `Canvas` ring under a `CanvasText` dot is legible over both `Canvas` and `CanvasText` fills, so tech's `filter: invert(1)` and its fallback are not needed. |
| R5 | Patterns switch and `localStorage` | Encoding: visible Patterns switch, `localStorage` key. Editorial: URL or nothing, never storage. Tech: no switch needed. | **No switch, no storage.** The texture is the encoding and is always on when the conflict layer is on. Nothing in 4.1 writes to `localStorage`. |
| R6 | Control copy and URL parameter | Encoding: "Colour by" · Coverage / Newest evidence / Kind; `?colour=`. Editorial: "Shade countries by" · Published coverage / Date of newest evidence. Tech: editorial copy, `?colour=recency`, `ui.colourBy`, `--map-recency-*`. | **Editorial copy; one vocabulary everywhere:** `ui.shadeBy ∈ {'coverage','evidence'}`, URL `shade=evidence`, actions `setShadeBy`, attribute `data-shade` on `.world-map` and `data-evidence-band` on countries, tokens `--map-evidence-{fresh,week,month,older}`. "recency"/"recent" is a feature-scoped banned word (editorial §2.5) and must not leak into identifiers that reach the DOM or the URL. |
| R7 | "Date not established" under shading | Encoding: neutral grey + cross-hatch. Editorial: coverage fill + legend row M2e. | **Editorial.** No token is spent on a case the validator makes impossible in published data; `data-evidence-band="unknown"` paints `--map-reported` and M2e appears only when the count is non-zero, with the suffix " · shown in the coverage colour". |
| R8 | Fixtures | Editorial §10.2: regenerate the frozen fixture. Tech: keep it frozen, add a kind fixture. | **Tech.** The frozen README forbids edits and the fixture is the guarantee that a data refresh cannot turn CI red. `kindOf` returns `null` for a missing kind so the frozen records still render. |
| R9 | Conflict record schema | Ingest skeleton: `countries[{code, ucdp_name}]`, `fatalities[]` (yearly, with `estimator`, `provisional`, `through`, `events`), `status_basis` object, `verification`, `latest_evidence(+precision)`. Tech §2.4 / editorial §4.6: `location_countries`, `years[]` + `provisional[]`, `activity_basis` enum, `ucdp.dyad_ids`, `latest_recorded`. | **Reconciled in §6.4:** `location[{code: ISO2 or null, ucdp_name}]` (the skeleton's transparency, editorial's placement rule); `years[]` (annual, BRD figures, `intensity_level`) separate from `provisional[]` (Candidate months); `activity_basis` enum mapped to the three editorial labels; `latest_recorded`; no `verification` object (the envelope's `method_note` carries "not Protest Atlas research"); `excluded[]` in the published envelope. The skeleton's constants are renamed, not redesigned (§6.6). |
| R10 | Estimator mixing | Skeleton: BRD where it covers the year, GED sums for later years. Editorial: never mix within a record. | **Never mixed.** `years[]` holds BRD figures only; a year without a BRD figure is absent ("not recorded"); Candidate months live only in `provisional[]` and are never summed into a year. The `estimator` field disappears. |
| R11 | Null country code (Kosovo) | Skeleton: emit `code: null` with the UCDP name, gate decides. Tech: codes must exist in `countries.json`. | **Allowed:** `code` is `null` or an ISO code present in `countries.json`; `ucdp_name` is always present. A record whose every `location[].code` is null has no map placement and is reachable through the Kind filter and the record route; the brief never lists it. |
| R12 | Kind vocabulary | Skeptic: `armed-conflict-interstate` etc. Designer: `armed-interstate`, `unrest`. | **Skeptic's eight values** (§5). One `KINDS` table in `scripts/validate_data.py` (event kinds), one in `scripts/validate_conflicts.py` (conflict kinds), one `EVENT_KINDS`/`CONFLICT_KINDS` pair in `js/model.js`; `tests/test_conflicts.py` asserts the Python and JS lists agree by reading both files. |
| R13 | `kind_basis.method` for a record read in its own round | Skeleton: reuse `source-reread` or add `source-read`. | **No third value.** `source-reread` means "an agent opened and read the cited source for the form of action", whether or not the record existed before. Methods: `contract-default`, `source-reread` (events); `illustrative` (examples only); `ucdp-coding` (conflicts only). |
| R14 | Kind badge from day one? | Encoding: always, with a family swatch. Editorial and tech: only when ≥ 2 kinds exist; Overview row always. | **Editorial/tech.** 84 identical badges inform no one and cost first-viewport height (smoke 17 margins). No swatch exists because no kind hue exists. |
| R15 | Where conflicts appear in Reports | Tech D7. | **Adopted:** only under a conflict Kind filter, in one `feed-group` of their own, never interleaved with band groups, never counted in S2, `datasetStats`, the result summary's episode count or the CSV. |
| R16 | How `conflicts.json` loads | Tech: critical set, 404 tolerated. Data planner: lazy. | **Critical with 404 tolerated** (like `upcoming.json`): the legend, Kind filter and brief must know absent/loaded at first paint. It joins `CRITICAL_DATA` (absent counts as 0 B) **and** has its own ≤ 24 KB guard (R29); the smoke harness and the verify job treat its 404 as the absent state (§6.8). |
| R17 | `print` media query | Encoding: add `print` to `ALLOWED_MEDIA`. Tech: works by construction. | **No `@media print`; `ALLOWED_MEDIA` unchanged.** The ramp is monotone in lightness and the dots differ from the hatch in geometry, so a grayscale print reads without it; `print-color-adjust: exact` is set unconditionally on `.map-stage`, `.legend-swatch` and `.map-svg` (harmless on screen). |
| R18 | Segmented control class | Encoding: promote `.filter-segment*` to a `.segment*` primitive. Tech: reuse WP2's class by recorded exception. | **Reuse** (saves bytes; no rule change). Recorded exception: `js/map-view.js` may emit `filter-group filter-segment filter-segment-track filter-rows filter-row filter-row-label` inside `#map-legend`; WP-B does not change those rules in 4.1. |
| R19 | Headroom | All: lazy split first; encoding and editorial name the minifier; tech defers JS minification. | **Tech:** lazy views + build-time CSS comment stripping in 4.1; `build-time-js-minifier` is a `later` roadmap item (regex stripping is unsafe for template literals and regex literals). |
| R20 | Copy the architecture needed that the editorial deck lacked | Tech open question 1. | **Adopted as written in §4.8**, by the lead acting as editorial owner (an AI decision, recorded as such). Every string was checked against the global and feature-scoped banned lists. |
| R21 | Roadmap statuses | Editorial/data: `next` until code lands. Harness: `in-progress` for what this round builds. | **`in-progress`** for the six items this round builds (lazy views, shading, patterns, kind field, UCDP ingest/validator, and the four conflict-layer UI states are inside those); **`blocked`** for the context layer and kind sub-typing with the blocker named; `later` for the JS minifier. "Shipped" only under SPEC §22.4 with CI test evidence. |
| R22 | Reports copy "newest evidence" vs "latest evidence" | The 4.0 site uses "latest evidence" on cards; editorial §2.4 writes "newest evidence" in the shading copy. | Both stay: "Latest evidence" is the record-level label (frozen, 4.0); "newest evidence" is the dataset-level and country-level phrase (S2, stamps, shading). The feature-scoped ban on "latest" exempts the fixed phrase "latest evidence". |
| R23 | Conflict dataset and the shading | Encoding open question 2. | Conflict records have no `last_observed_at` and are **never** read by `observationBand`, the shading, `timeSnapshot` or the staleness clock. A conflict-only country under shading keeps plain land under its dots. |
| R24 | Layers control | Editorial §3.4 "Show on the map"; tech `#map-layers`. | **Adopted, narrowed:** rendered only when the conflict file is `'loaded'` (R25); both options on by default; not in the URL; hidden in example mode and while events failed. On `'error'` the legend's EC2 Retry is the only control. |
| R25 | What the legend shows when `conflicts.json` is absent | Editorial §3.4 and §7.5: the "Armed conflict (UCDP)" layer option rendered `disabled` with EC6 "not loaded in this snapshot". Revision 1 rendered `#map-layers` only when loaded or errored, so EC6 could never appear and the absent state was self-contradictory (critic). | **A note, not a control.** `conflicts === 'absent'` renders the 4.0 rows plus one `legend-note[data-kind="conflicts-absent"]` carrying EC1 and no `#map-layers`; **EC6 is deleted**. Reason: a disabled control for data that does not exist is a dead control on every map view of the deployed 4.1, which has no conflict data. Recorded deviation from editorial §3.4, taken by the lead as editorial owner (an AI decision, §15). |
| R26 | How `kind` reaches the URL | Tech/WP-B draft: widen `readViewState`/`encodeViewState` to 10 keys and add a case to `tests/test_explorer.mjs`. Critic: that file is a frozen regression contract whose 9-key deep-equal fails even if the file is never edited. | **Separate codec.** `readViewState`, `encodeViewState` and `FILTER_KEYS` are unchanged; `readKindParam(search)`/`encodeKindParam(kind)` carry `kind` and `readUIState`/`encodeUIState` carry `shade`; `app.js` merges them (§4.6, WP-B). `tests/test_shell.mjs` asserts the sha256 of both frozen tests (§0.1). |
| R27 | How the 84 records get `kind` in Phase 0 | Revision 1: run `merge_history.py` and commit. Critic: `assemble()` re-stamps `generated_at`/`last_editorial_review`, moving "Snapshot assembled" and "AI-assisted review pass" to the Phase-0 day and resetting the 72 h editorial clock without new research (EDITORIAL_POLICY: "a successful pipeline run does not establish new activity"). | **`scripts/apply_kind_defaults.py`** (§6.2): reads `public/events.json`, applies `merge_history.apply_kind_defaults(events)`, writes through `merge_history.write`; envelope byte-identical, idempotent, tested by `test_kind_regeneration_changes_only_kind_fields`. `merge_history.assemble()` also calls `apply_kind_defaults` so a real refresh carries the field. |
| R28 | Branch and base for the data session | Revision 1: `release/4.1` for the UI; data session from `origin/main` (HANDOFF §2.1, handoff-round5 §10.8). Critic: the cloud git proxy may accept only the assigned branch, and `origin/main` will not contain the kind-aware validator or the regenerated `events.json` until 4.1 deploys, so round 5 would regenerate `events.json` without `kind` and conflict on merge. | **Pipeline first, on the assigned branch.** The first 4.1 commit on `ccr-77796c82-ka7vhp` is the kind pipeline alone (`PHASE0_SHA`, §10 step 2); HANDOFF §2.1 and the new §10.8 name it as round 5's `BASE` unless `origin/main` already contains it. A `release/4.1` push is tried once and the plan does not depend on it (§10 step 1). The data PR into `main` then carries `PHASE0_SHA` exactly as the round-4 PR carried `e633dfe`. |
| R29 | `conflicts.json` and the critical-data ceiling | Revision 1: own 24 KB guard, excluded from `CRITICAL_DATA`. Critic: the 180 KB guard has 118 KB of room, so the exclusion buys only an exception to "boot-time data is budgeted together". | **Both:** in `CRITICAL_DATA` (absent = 0) and under its own 24 KB guard. |
| R30 | Cross-package edits | Revision 1 spread `scripts/build.py` between A and D, `test_build_strips_css_comments` to D, and the `.side-pill` move across A (`styles.css`) and B (`css/record.css`). | **Phase 0 (lead)** does all three (§10 steps 5–6); after Phase 0 no lane edits `scripts/build.py` or the `.side-pill, .kind` block. |

---

## 3. Encoding: tokens, validator output, pattern definitions

### 3.1 What hue encodes, in one sentence each

- **Coverage (default, unchanged):** `--map-reported` means "a published episode matches your filters"; the gap hatch means "no published episode matches"; the shadow means a sourced ended episode; the example purple is example mode only.
- **Shading by date of newest evidence (opt-in):** per country, the `observationBand` of the newest `last_observed_at` among the records currently matching the filters (`selectFiltered(state, {ignoreCountry: true})`), with the edges of `freshness.observationBand` (strict `< 72 h`, `< 7 d`, `< 30 d`, else older), recomputed on the 60 s tick and `visibilitychange`. The newest band is the step farthest from `--map-land` in each mode (darkest in light, lightest in dark). It says how recently a cited source reported something, never how much happened or whether anything continues.
- **Kind:** never a hue. Texture for UCDP conflict locations; neutral text badge for every kind off the map.

### 3.2 Final token table (`styles.css` `@layer tokens`; light on `:root`, dark in both dark blocks; names added to test_shell `TOKENS`, values to `LIGHT`/`DARK`)

| Token | Band / use | Light | OKLCH L | vs ocean `#e4e9e3` | vs land `#f2f2ec` | Dark | OKLCH L | vs ocean `#0e1311` | vs land `#2b312e` |
|---|---|---|---|---|---|---|---|---|---|
| `--map-evidence-fresh` | Newest evidence within 72 h | `#6e4514` | 0.42 | 6.76 | 7.40 | `#e6c48f` | 0.84 | 11.30 | 8.00 |
| `--map-evidence-week` | 3 to 7 days ago | `#935f1f` | 0.53 | 4.38 | 4.80 | `#d4a45c` | 0.75 | 8.27 | 5.86 |
| `--map-evidence-month` | 7 to 30 days ago (**= `--map-reported`**) | `#b4772a` | 0.62 | 3.04 | 3.33 | `#bd8236` | 0.65 | 5.72 | 4.05 |
| `--map-evidence-older` | More than 30 days ago | `#c89a52` | 0.72 | 2.08 ‡ | 2.28 ‡ | `#8f5f22` | 0.52 | 3.42 | 2.42 ‡ |
| `--map-conflict-ink` | dot | `var(--text)` (#1a1c19) | — | — | — | `var(--text)` (#efede6) | — | — | — |
| `--map-conflict-casing` | ring under the dot | `var(--map-selected-halo)` (#fffdf8) | — | — | — | `var(--map-selected-halo)` (#0e1311) | — | — | — |

‡ The pale end sits between the ordinal floor (2:1) and the 3:1 mark rule. Relief (binding): the band is text on every card, list row, brief entry and tooltip; the gap hatch separates the pale step from bare land; the legend row carries the hex as its swatch. Selection outline on the two darkest light steps (2.06 and 3.18) and on the two lightest dark steps (1.42 and 1.94) is carried by the 5 px `--map-selected-halo` beneath it (8.18 / 5.30 light; 11.30 / 8.27 dark), the mechanism 4.0 already uses in dark mode (SPEC §17.2). City dots keep their 1 px land ring (≥ 2.28 on every fill).

Unchanged tokens this design relies on: `--map-ocean --map-land --map-hatch --map-reported --map-example --map-selected --map-selected-halo --map-border --map-city --map-shadow --map-focus --ended-shadow`. `--map-example` never shares a screen with the ramp (example mode hides the control).

**Validated, not adopted** (record in SPEC §17.2 so the search is not repeated): encoding's kind hues `#4c83de`/`#5991ed` (260°) and `#7b3660`/`#a9628b` (345°) pass `--pairs all` beside ochre on both surfaces in both modes (worst CVD ΔE 20.9 light / 14.8 dark; dark tritan 7.2, reported). They are not used in 4.1 for the reasons in R3. Encoding's alternative ramp is likewise recorded.

### 3.3 Validator output (dataviz `validate_palette.js`, run 4 Oct 2026 in this session; `--ordinal`, order older → fresh)

```
### light, land #f2f2ec
Palette (light, surface #f2f2ec, ordinal ramp): 4 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #c89a52 at 2.28:1 vs surface
  [PASS] Single hue             hue spread 11°
  → ALL CHECKS PASS  (ordinal: one hue, monotone L, visible step gaps, light end clears surface)
exit 0
### light, ocean #e4e9e3
  [PASS] Lightness monotone · [PASS] Adjacent ΔL · [PASS] Light-end contrast #c89a52 at 2.08:1 vs surface · [PASS] Single hue 11°
  → ALL CHECKS PASS
exit 0
### dark, land #2b312e   (#8f5f22,#bd8236,#d4a45c,#e6c48f)
  [PASS] Lightness monotone · [PASS] Adjacent ΔL · [PASS] Light-end contrast #8f5f22 at 2.42:1 vs surface · [PASS] Single hue 10°
  → ALL CHECKS PASS
exit 0
### dark, ocean #0e1311
  [PASS] Lightness monotone · [PASS] Adjacent ΔL · [PASS] Light-end contrast #8f5f22 at 3.42:1 vs surface · [PASS] Single hue 10°
  → ALL CHECKS PASS
exit 0
```

Rejected with the validator (editorial §2.6, verbatim): `#b4772a,#c0392b` (ochre + red) `--pairs all` light land: CVD WARN ΔE 7.3 deutan · Normal-vision floor **FAIL** ΔE 13.4 < 15. `#e3c89b,#cfa463,#b4772a,#7f5219` light-end 1.44:1 FAIL (vanishes into land). `#c9a05f,#b4772a,#8f5a1c,#6b4213` ocean 1.97:1 FAIL. The 4.0 pair (`--map-reported` + `--example`) still passes exactly as SPEC §17.2 recorded (CVD 22.8 / 21.3).

WP-C re-runs the four `--ordinal` commands on the final `styles.css` values and pastes the output into its hand-off (as WP1 did in 4.0).

### 3.4 Pattern definitions

**Mechanism (generalised from 4.0).** `map.js` keeps every pattern at a fixed screen size: a square user-unit tile (`width` = `height`: 8 for the gap hatch, 10 for the conflict dots) with `patternUnits="userSpaceOnUse"` and, on every zoom, `patternTransform = scale(period · s / width)` where `s = 1 / (k · unitPx)` and `width` is read from each pattern's own attribute. Each `<pattern>` carries `data-period` (CSS px) and `scaleMarks()` loops over `defs.selectAll('pattern[data-period]')`. The dot tile is 10 units so that both casing circles (r 2.5 at (2.5, 2.5) and (7.5, 7.5)) lie entirely inside it: SVG clips a pattern to its tile, and revision 1's 8-unit tile (r 2.6 at (2, 2) and (6, 6)) flattened each ring by 0.6 units on two sides. The gap hatch avoids clipping by drawing wrapped segments and is unchanged. `map.js` writes no colour: it sets attributes and `url()` custom properties; `css/map.css` paints.

**Defs (raw SVG; `n` is the map instance number).** The gap pattern is unchanged except for `data-period`; the conflict pattern has **no `<rect>`** so it overlays any fill.

```svg
<defs>
  <pattern id="map-no-records-n" class="map-no-records-pattern map-pattern" data-period="6" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8"/><path d="M-2,2L2,-2M0,8L8,0M6,10L10,6"/>
  </pattern>
  <pattern id="map-conflict-n" class="map-conflict-pattern map-pattern" data-period="10" patternUnits="userSpaceOnUse" width="10" height="10">
    <circle class="map-conflict-casing" cx="2.5" cy="2.5" r="2.5"/><circle class="map-conflict-ink" cx="2.5" cy="2.5" r="1.5"/>
    <circle class="map-conflict-casing" cx="7.5" cy="7.5" r="2.5"/><circle class="map-conflict-ink" cx="7.5" cy="7.5" r="1.5"/>
  </pattern>
</defs>
```

Geometry at every zoom: dots of radius 1.5 CSS px on a 1.0 px casing ring (outer radius 2.5), staggered 7.07 px apart (period 10), no ring clipped; the gap hatch stays 45° lines, ~1.05 px stroke, 6 px period. The two textures differ in geometry (dots vs lines), density and contrast, so they stay distinct under deuteranopia/protanopia simulation, in forced colours and in a grayscale print.

**Overlay layer.** `<g class="map-conflict-layer" aria-hidden="true">` sits between `.map-countries` and `.map-borders` inside the zoom layer. `paint()` joins one `<path class="map-conflict" data-country="XX">` per conflict country, with the base path's `d` (already in `byCode`), `pointer-events: none`. The base country path gets `data-conflict="true"` so CSS can drop the gap hatch for a conflict-only country: it is painted plain `--map-land` under the dots in normal colours and `Canvas` under `CanvasText` dots in forced colours (explicit rule in §3.5, because the author `--map-land` rule is more specific than 4.0's forced-colours `.map-country` rule and `.map-svg` has `forced-color-adjust: none`). Once the layer is loaded, M3's hatch means "neither an episode nor a conflict record".

**WCAG contrast of the two inks on every fill the overlay can sit on** (computed this session; at least one of the two clears 3:1 everywhere, and ink vs casing is 16.9 / 16.0):

| Fill | Light: ink `#1a1c19` / casing `#fffdf8` | Dark: ink `#efede6` / casing `#0e1311` |
|---|---|---|
| land | 15.27 / 1.11 | 11.34 / 1.41 |
| `--map-reported` (= month step) | 4.59 / 3.68 | 2.80 / 5.72 |
| older step | 6.70 / 2.52 | 4.68 / 3.42 |
| week step | 3.18 / 5.30 | 1.94 / 8.27 |
| fresh step | 2.06 / 8.18 | 1.42 / 11.30 |

**`css/map.css` additions (`@layer components`; tokens only; written above the loading/error neutral rule so that rule still wins by source order):**

```css
.map-pattern path, .map-pattern circle { vector-effect: none; }
.map-conflict-pattern .map-conflict-casing { fill: var(--map-conflict-casing); }
.map-conflict-pattern .map-conflict-ink    { fill: var(--map-conflict-ink); }
.map-conflict { fill: var(--map-conflict-fill); pointer-events: none; }
.map-country[data-conflict="true"]:not([data-has-records="true"]) { fill: var(--map-land); }   /* conflict only: plain land under the dots (M3 variant) */
.world-map[data-shade="evidence"] .map-country[data-has-records="true"][data-evidence-band="fresh"] { fill: var(--map-evidence-fresh); }
.world-map[data-shade="evidence"] .map-country[data-has-records="true"][data-evidence-band="week"]  { fill: var(--map-evidence-week); }
.world-map[data-shade="evidence"] .map-country[data-has-records="true"][data-evidence-band="month"] { fill: var(--map-evidence-month); }
.world-map[data-shade="evidence"] .map-country[data-has-records="true"][data-evidence-band="older"] { fill: var(--map-evidence-older); }
/* data-evidence-band="unknown" keeps var(--map-reported) (R7). Example mode, loading and error keep their 4.0 rules. */
.world-map[data-mode="example"] .map-conflict-layer,
.world-map:is([data-map-state="data-loading"], [data-map-state="data-error"]) .map-conflict-layer { display: none; }
.map-stage, .map-svg, .legend-swatch { print-color-adjust: exact; }
.legend-swatch[data-kind="evidence-fresh"] { background: var(--map-evidence-fresh); }
.legend-swatch[data-kind="evidence-week"]  { background: var(--map-evidence-week); }
.legend-swatch[data-kind="evidence-month"] { background: var(--map-evidence-month); }
.legend-swatch[data-kind="evidence-older"] { background: var(--map-evidence-older); }
.legend-swatch:is([data-kind="conflict"], [data-kind="both"]) {
  background-image: radial-gradient(circle at 2.5px 2.5px, var(--map-conflict-ink) 1.5px, var(--map-conflict-casing) 1.6px, var(--map-conflict-casing) 2.5px, transparent 2.6px),
                    radial-gradient(circle at 7.5px 7.5px, var(--map-conflict-ink) 1.5px, var(--map-conflict-casing) 1.6px, var(--map-conflict-casing) 2.5px, transparent 2.6px);
  background-size: 10px 10px; }   /* same 10 px tile and radii as the SVG pattern */
.legend-swatch[data-kind="both"] { background-color: var(--map-reported); }
```

No `transition` on `fill` anywhere in `css/map.css` (test asserts it). Nothing animates; a mode switch is a synchronous repaint.

### 3.5 Forced colours, dark mode, print, example mode

```css
@media (forced-colors: active) {
  .world-map[data-shade="evidence"] .map-country[data-has-records="true"][data-evidence-band] { fill: CanvasText; stroke: Canvas; }  /* shading unavailable (SH5); JS also paints coverage */
  .map-country[data-conflict="true"]:not([data-has-records="true"]) { fill: Canvas; stroke: CanvasText; }   /* conflict only: the §3.4 --map-land rule (0,3,0) would otherwise beat 4.0's .map-country rule (0,1,0) */
  .map-conflict-pattern .map-conflict-casing { fill: Canvas; }
  .map-conflict-pattern .map-conflict-ink { fill: CanvasText; }
  .legend-swatch:is([data-kind^="evidence-"]) { background: CanvasText; }
  .legend-swatch[data-kind="conflict"] { background: Canvas radial-gradient(circle at 2.5px 2.5px, CanvasText 1.5px, Canvas 1.6px, Canvas 2.5px, transparent 2.6px) 0 0 / 10px 10px; }
  .legend-swatch[data-kind="both"] { background: CanvasText radial-gradient(circle at 2.5px 2.5px, CanvasText 1.5px, Canvas 1.6px, Canvas 2.5px, transparent 2.6px) 0 0 / 10px 10px; }
}
```

| Context | Shading | Conflict dots | Badges |
|---|---|---|---|
| Dark mode | dark tokens; newest band is the lightest step | ink `#efede6` ringed in `#0e1311` | neutral ink |
| `(forced-colors: active)` | **unavailable**: the "Date of newest evidence" radio is `disabled`, SH5 is shown, the map paints coverage whatever the URL says (`matchMedia('(forced-colors: active)').matches`) | `CanvasText` dots ringed in `Canvas`: legible over `Canvas` land and over `CanvasText` coverage; a conflict-only country is `Canvas` with a `CanvasText` stroke by the explicit rule above (smoke 28 and test_map assert it); the gap hatch stays solid `CanvasText` lines | `.kind` outlined in `CanvasText` (the `.side-pill` rule) |
| Print | tokens as is; the ramp is monotone in lightness, so grayscale keeps the order | dots vs lines differ in geometry | text |
| Example mode | `#map-shade` and `#map-layers` hidden; coverage only; `shadeBy` reset to `coverage` | layer hidden | "Collective action" only in the Overview row |
| Events loading / error | fieldsets hidden; neutral land (4.0 rule) | hidden | — |

Four ordered lightness steps cannot be expressed in two system colours, and ordered textures would collide with the conflict texture's meaning; the Reports grouping, the band badge, the tooltip and the brief carry the same facts, so nothing is withheld except the map rendering.

---

## 4. The "Shade countries by" control and the legend per mode (exact copy)

### 4.1 Placement and markup (`js/map-view.js`; ids pinned; rendered through `setHTML` with focus kept)

Both fieldsets render inside `#map-legend`, before `h2.legend-title`. Hidden (`hidden` attribute) in example mode, while events are loading or failed, and when the map is unavailable; `#map-shade` is also hidden while `ui.layers.episodes` is false (there is no episode fill to shade; `ui.shadeBy` and the URL are left as they are, so switching the layer back restores the shading). `#map-layers` renders only when `conflicts === 'loaded'` (§4.3, R25).

```html
<fieldset id="map-shade" class="filter-group filter-segment legend-control"><legend>Shade countries by</legend>                        <!-- SH1 -->
  <div class="filter-segment-track">
    <label><input class="visually-hidden" type="radio" name="shade-by" value="coverage" data-focus-key="shade-coverage" checked>{i-check}<span>Published coverage</span></label>   <!-- SH2 -->
    <label><input class="visually-hidden" type="radio" name="shade-by" value="evidence" data-focus-key="shade-evidence">{i-check}<span>Date of newest evidence</span></label>     <!-- SH3 -->
  </div>
  <p class="legend-note" data-kind="shade-help" hidden>SH4</p>
  <p class="legend-note" data-kind="shade-forced" hidden>SH5</p>
</fieldset>
<fieldset id="map-layers" class="filter-group filter-rows legend-control"><legend>Show on the map</legend>                                 <!-- L1 -->
  <label class="filter-row"><input type="checkbox" name="layer" value="episodes" data-focus-key="layer-episodes" checked><span class="filter-row-label">Protests and strikes</span></label>
  <label class="filter-row"><input type="checkbox" name="layer" value="conflicts" data-focus-key="layer-conflicts" checked><span class="filter-row-label">Armed conflict (UCDP)</span></label>   <!-- L2; the fieldset exists only when the file is loaded (R25) -->
</fieldset>
```

Visually hidden radios, 48 px label targets, the check icon on the checked label and `:has(input:focus-visible)` outline are the existing `.filter-segment` behaviour (SPEC §9, I-05). `change` on `name="shade-by"` → `actions.setShadeBy(value)`; on `name="layer"` → `actions.setLayer(value, checked)`. **Focus:** every input carries a `data-focus-key` (`shade-coverage`, `shade-evidence`, `layer-episodes`, `layer-conflicts`). `setHTML` restores focus only to an element carrying a `FOCUS_KEYS` attribute (§0.1), and the legend re-renders on every paint, including the paint the `change` event triggers, so without the key focus would jump to the country-panel title. test_map and smoke 26 assert `document.activeElement` is still the pressed radio after the repaint.

### 4.2 Copy: control (SH), from editorial §2.4, verbatim

- **SH1** "Shade countries by"
- **SH2** (default, pressed) "Published coverage"
- **SH3** "Date of newest evidence"
- **SH4** (shown only while SH3 is pressed) "Shading follows the date of the newest cited evidence among the records shown for each country. It does not show how much happened, or whether anything continues."
- **SH5** (forced colours; SH3 disabled, not hidden) "Shading by date is not available in high-contrast mode. Each country's newest evidence date is in its brief and in the list."
- **SH6** example mode: the control is hidden.

### 4.3 Legend: Published coverage (default), by conflict-file state

`js/map-view.js` derives `legendHTML`'s `conflicts` argument from the store: `null` while `load.critical === 'loading'`; `'absent'` when `load.errors.conflicts === 'absent'`; `'error'` when it is `'error'`; `'loaded'` when `data.conflicts` is an object. The four states are:

| `conflicts` | Legend rows | `#map-layers` |
|---|---|---|
| `null` (critical data still loading) | exactly the 4.0 M1–M9 | not rendered |
| `'absent'` (404; the deployed 4.1 until the data session publishes the file) | the 4.0 M1–M9 plus **one** `<p class="legend-note" data-kind="conflicts-absent">` carrying EC1, placed after M8 | not rendered (R25) |
| `'error'` (other HTTP status, network or shape failure) | the 4.0 M1–M9 plus `<p class="legend-note" data-kind="conflicts-error">` carrying EC2 and the `[Retry]` button | not rendered; the Retry is the control |
| `'loaded'` | the variants below | rendered, both options checked by default |

**When `'loaded'` and the conflict layer is on:**
- **M2 variant** "Published protest or strike episode matches your filters"
- **M2c1** "Armed conflict recorded by UCDP in {2024}, with a location in this country, matching your filters" (swatch `conflict`; `{2024}` is `window.last_year`, or "{2024}, with provisional events through {Aug 2026}" when `last_provisional_month` is set)
- **M2c2** "Both: a published episode and a UCDP conflict record" (swatch `both`)
- **M3 variant** "No published episode or conflict record matches. A coverage gap, not 'no protests' and not peace"
- **M11** footnote (after M8) "Conflict dots mark countries UCDP lists as a conflict location in the years shown. They are not a front line, a map of fighting, or a rating of how serious the conflict is. Small countries may show no dots at world scale; their records are in the list."
- **M12** (window ≠ all, layer on) "Time window filters apply to protest and strike records only; conflict records are yearly and monthly."

**When `'loaded'` and the conflict layer is off** (`layers.conflicts === false`): the 4.0 M2 and M3, no M2c1/M2c2, no M11, no M12; `#map-layers` stays rendered.

**When the episode layer is off or a conflict Kind filter is active** (`layers.episodes === false`, or `kindScope(filters) === 'conflicts'`; `mapEvents` is empty in both cases, §7.3): M2 (or its variant) carries the suffix **" · hidden by Show on the map"** or **" · hidden by the Kind filter"** respectively, the map paints no episode fill and no shading (`shading: null` to `api.update`), `#map-shade` is hidden while the layer is off (§4.1), and the staleness notice S4–S6 is unaffected (it reads the snapshot, not the map).

**Empty and failure copy (shared with About, the dates sheet and the brief):**
- **EC1** (absent; also in About and the dates sheet) "No conflict records in this snapshot: the dataset has not been loaded. Absence is not peace."
- **EC2** (error) "Conflict records could not load, so they are unknown here, not absent." + `[Retry]` (`data-action="retry-conflicts"`)
- ~~EC6~~ deleted (R25): no disabled layer option exists in any state.

### 4.4 Legend: Date of newest evidence (SH3 pressed)

Rows in order (M1 unchanged; swatches are `aria-hidden`, each the actual step for the current colour scheme):
1. **M2a** "Newest evidence dated within the last 72 hours" (`evidence-fresh`)
2. **M2b** "Newest evidence dated 3 to 7 days ago" (`evidence-week`)
3. **M2c** "Newest evidence dated 7 to 30 days ago" (`evidence-month`)
4. **M2d** "Newest evidence dated more than 30 days ago" (`evidence-older`)
5. **M2e** only when `counts.unknown > 0`: "Newest evidence date not established · shown in the coverage colour" (`reported`)
6. **Empty-band suffix** on any of M2a–M2d with zero countries in view: " · none in this view"
7. M3 (or its variant), M4, M5, M6, then M2c1/M2c2 when the layer is on.
8. Notes: M7; **M8a** replaces M8: "Shading shows how recently a cited source reported something in each country's published records. It does not show how many protests there were, how large they were, how severe, or whether they continue."; M9/M12; **M10** when `datasetState !== 'current'`: "No record in this snapshot has evidence newer than {2 Oct 2026}." (value from `updateStamps().latestObservation`); M11; EC1/EC2; cities note.

The staleness notice (S4–S6) is never replaced or moved, and neither the layer control nor the Kind filter changes it. On the 9 Oct clock M2a and M2b read " · none in this view", every shaded country is in the two pale steps, and M10 names 2 Oct 2026.

### 4.5 Tooltip, brief, About and dates sheet additions

- **Tooltip and `aria-label`** while SH3 is pressed: " · Newest evidence {2 Oct 2026} · {Within 72 h}" appended to `describeCountry` (the F1–F5 badge text). When the country has conflict records: the EC3 or EC3f sentence appended.
- **Country brief** gains `<h4 class="brief-subtitle">Armed conflict (UCDP)</h4>` after the records list with one of: **EC3** "{Country}: no published protest or strike episode. UCDP records {n} armed {conflict|conflicts} with a location in {Country} in {2024}." (when the country has **no published episode at all**, counted over `selectEvents(state)`, and ≥ 1 conflict); **EC3f** "{Country}: its published episodes are hidden by the Kind filter or the layer control. UCDP records {n} armed {conflict|conflicts} with a location in {Country} in {2024}." (when the country has published episodes but none is on the map because `kindScope(filters) === 'conflicts'` or `layers.episodes` is false; episodes excluded by other filters keep the 4.0 brief wording, with the conflict subsection appended); a list of conflict links when both exist; **EC4** "{Country}: no UCDP conflict record reaches the 25-death threshold for {2024}. That is a threshold, not a statement that there was no armed violence."; EC1; or EC2 + Retry. Each conflict is a link `#/record/ucdp-<id>` with `data-open-record`.
- **About, "How to read the map"** (static `index.html`, appended after the four existing items): "Shading by date, when you switch it on, follows the newest cited evidence per country. It is off by default and never shows how many protests there were, how large they were, how severe, or whether they continue." and "Dots mark countries that UCDP lists as the location of an armed conflict in the years shown. They are a coverage mark from a re-published dataset, not a front line and not a rating of how serious the conflict is."
- **About, new `h2` "Kinds of record"**: the editorial §7.6 paragraph, verbatim, followed by **EC5** while only one kind exists: "Every record in this snapshot is a collective-action episode (a protest or a strike, not distinguished at research time). No record has been re-read for its kind, and no conflict records have been loaded." (rendered by `js/about.js` from `kindsPresent(state)` and `data.conflicts`, so it disappears by itself).
- **About "Research scope"** paired sentence (from data): "Protest and strike records: news reports read for searched days from 1 Jan 2024 to {2 Oct 2026}, AI-assisted. Armed conflict records: {UCDP datasets and versions}, calendar years 2024 to {Y}, with provisional events through {Mon YYYY}; downloaded {date}." The second sentence is replaced by EC1 when the file is absent. No single "Oct 2024 – Oct 2026" range may exist anywhere.
- **Dates sheet T4 row "Conflict dataset"**: value "UCDP {datasets and versions}, downloaded {date} · newest provisional month {Aug 2026}"; explainer "When the re-published UCDP files were downloaded and the newest month they contain. UCDP revises provisional events, and a new download never makes a protest record more recent."; absent: "Conflict dataset: not loaded in this snapshot." The header chip, S1–S7 and the footer T1 line never read conflict data.

### 4.6 State, URL and rules (editorial §2.2, all ten conditions)

- `ui.shadeBy` defaults to `'coverage'` on every load. `?shade=evidence` (and only that value) seeds it through `readUIState(location.search)`; anything else is dropped and reported in `ui.droppedParams`. Because `shade` is a display setting and `kind` a filter, the notice line becomes the neutral **"Some link settings were not recognised and were removed: {names}."**, replacing 4.0's "Some link filters were not recognised and were removed: …" (`js/notice.js`; `tests/test_core.mjs` is updated; the frozen tests do not assert this string). `syncURL` writes `shade=evidence` after the filters when set and omits it otherwise. **Never** `localStorage`, never set by a filter, route alias or quick chip; "Clear all" and `activeFilterCount` ignore it; no active-filter chip.
- **Kind codec (R26).** `readViewState`, `encodeViewState` and `FILTER_KEYS` keep exactly their 9 keys. `kind` is read by `readKindParam(search)` (a `KIND_VALUES` member or `''`) and written by `encodeKindParam(kind)` (`'kind=<value>'` or `''`). `app.js` builds `initialState({filters: {...readViewState(search), kind: readKindParam(search)}, ui: readUIState(search)})`; `syncURL` joins `encodeViewState(filters)`, `encodeKindParam(filters.kind)` and `encodeUIState(ui)` in that order with `&`, omitting empty parts; `shareURL` does the same. `droppedParams(search)` keeps its 4.0 output and then appends `'kind'` and `'shade'` when those parameters are present, non-empty and not accepted. `js/actions.js` uses `ALL_FILTER_KEYS = [...FILTER_KEYS, 'kind']` for `sameFilters` and the `setFilters` patch loop, and `EMPTY_FILTERS = Object.freeze({...readViewState(''), kind: ''})`; `js/store.js` defaults `filters.kind` to `''`.
- `setMode('example')` resets `shadeBy` to `'coverage'` and both layers on. Forced colours force the paint to coverage and disable SH3 while leaving the URL untouched.
- Bands recompute on the 60 s tick: `map-view.paint` adds a digest of the per-country bands to `payloadKey`, so the map repaints exactly when the Reports groups would.
- No `transition`, no animation, no pulsing; reduced motion needs no rule because there is no motion.
- Cards, list rows, band badges, the directory, the brief and Ahead keep neutral ink in every mode (editorial §3.2 holds everywhere but the map fill).

### 4.7 Banned words (added to `tests/test_shell.mjs` `BANNED` and to the smoke scan; data-verbatim exception kept)

**Global additions:** `hot`, `cold`, `heat`, `heatmap`, `heat map`, `war map`, `warm`, `cool`, `temperature`, `thermal`, `flare-up`, `flaring`, `surge`, `spike`, `uptick`, `intensifying`, `de-escalating` (each a whole word or whole phrase; the data-verbatim exception is kept; bare `war` stays allowed for the UCDP intensity label of §5.1). Scanned this session: none of these occurs as a whole word in any rendered copy or JSON text value of `index.html`, `404.html`, any `js/*.js`, `app.js`, `explore.js`, `freshness.js`, `history.js`, `map.js` or the public JSON. The repository's only whole-word hits (`heat` ×2, `surge` ×1) are inside candidate and reviewed URLs in `public/research-ledger.json`, which are never rendered as text, so the scan starts green. Self-tests: "Heat map" and "war map" hit; "Heathrow", "theatre" and "war" do not.

**Feature-scoped (unit test over the frozen `SHADE_COPY` object only):** `activity`, `active`, `recent`, `latest` (except inside "latest evidence"), `now`, `today`, `protests`, `intensity`, `quiet`, `calm`, `nothing happening`, `no activity`, `newest` not followed by "evidence" or "cited evidence" (regex `\bnewest\b(?! (cited )?evidence)`, so SH4's "the newest cited evidence" and the About line pass; revision 1's rule, taken verbatim from editorial §2.5, would have failed on the deck's own SH4 — a one-word amendment recorded in §13), `fresh`. The roadmap title is "Shading by date of newest evidence"; release notes and About follow §4.5.

### 4.8 Copy adopted by the lead (not in the editorial deck; checked against both banned lists)

- Reports conflict section heading **"Armed conflict records (UCDP)"**; note **"Yearly and monthly basis, from a re-published dataset. These records do not follow the 72-hour evidence clock."**
- Result summary under a conflict kind: **"Showing {n} of {m} UCDP conflict records matching your filters"**; never combined with the episode count.
- Lazy views: **"Loading this section…"** / **"This section could not load."** + `[Retry]`; lazy record: **"Loading this record…"** / **"This record could not load."** + `[Retry]`.
- CSV control title when a conflict kind is selected or the export is otherwise disabled by kind scope: **"CSV export covers protest and strike records"**.
- Conflict row evidence line: **"{dataset} {version} · downloaded {date} · re-published UCDP data, not Protest Atlas research"**.
- Conflict row latest line: **"Latest recorded {2024 | Aug 2026}"**.

---

## 5. Kind taxonomy and rules

### 5.1 The eight kinds (editorial §3.1; one sentence each; single-valued)

| Key | Badge (K5) | Filter option (K2) | Definition (our words) | Basis | Set by |
|---|---|---|---|---|---|
| `collective-action` | Collective action | Collective action (protest or strike) | A sourced episode in which a collective actor acts publicly to press a demand or position against a named target, where the record does not distinguish a demonstration from industrial action. | research/round3/CONTRACT.md | pipeline default |
| `protest` | Protest | Protest / demonstration | A public gathering, march, rally, sit-in, vigil or similar action in which participants express a position toward a named target and, as the cited source describes it, do not themselves engage in violence against people or property, whatever force is used against them. | ACLED "Protests" concept, in our words | source re-read |
| `strike` | Strike | Strike / industrial action | A temporary collective withdrawal of labour by one or more groups of workers or their union to enforce or resist demands or express grievances, as the cited source describes it. | ILO 15th ICLS (1993), paraphrased | source re-read |
| `civil-unrest` | Civil unrest, as reported | Civil unrest, as reported | An episode in which the cited source itself attributes violence or destruction (rioting, looting, arson, fighting between groups of residents) to participants or a crowd connected with the collective action, as distinct from force used against them. | ACLED "Riots" concept in our words, not their data | source re-read under §5.2 |
| `armed-conflict-intrastate` | Armed conflict · intrastate | Armed conflict, intrastate | Organised armed fighting over government or territory between a state's government and one or more organised non-state armed groups inside that state, coded by UCDP with at least 25 battle-related deaths in a calendar year (`type_of_conflict` 3, or 4 "internationalised" when another state intervenes with troops). | UCDP/PRIO ACD codebook | UCDP coding |
| `armed-conflict-interstate` | Armed conflict · interstate | Armed conflict, interstate | Organised armed fighting between the governments of two or more states coded by UCDP with at least 25 battle-related deaths in a calendar year (`type_of_conflict` 2). | same | UCDP coding |
| `non-state-conflict` (schema allows; ingest default off) | Non-state conflict | Non-state conflict | Armed fighting between two organised armed groups, neither the government of a state, coded by UCDP with at least 25 battle-related deaths in a calendar year. | UCDP Non-State codebook | UCDP coding |
| `one-sided-violence` (schema allows; ingest default off) | One-sided violence | One-sided violence | Deliberate use of armed force by a state's government or a formally organised group against civilians, coded by UCDP with at least 25 deaths in a calendar year. | UCDP One-sided codebook | UCDP coding |

**Thresholds as the product states them** (to be checked against the downloaded codebooks before any conflict record is published; a mismatch is a correction, never a reason to publish the remembered version): armed conflict ≥ 25 battle-related deaths in a calendar year (UCDP intensity level 1, "minor", 25–999); war ≥ 1,000 (level 2). The atlas uses "war" **only** as "UCDP intensity: war (at least 1,000 battle-related deaths in {year})", never as a free adjective. UCDP `start_date` (first battle-related death) and `start_date2` (first year the 25-death threshold was reached) are shown with their UCDP names.

### 5.2 Civil unrest: evidence rules (editorial §5, binding for the data session)

1. A record becomes `civil-unrest` only when the cited source itself attributes violence or destruction to participants or a crowd connected to the action; `kind_basis.text` paraphrases that attribution naming who did what, with event-local `source_ids`. "Clashes", "turned violent", "unrest" and "tensions" never qualify alone.
2. Not civil unrest: protest with intervention (police dispersal, arrests, force — `state_response`); excessive force against protesters (`state_response` with attribution kept; never a bare adjective); violence the source separates from the protesting actor (goes in "Violence or harm" with its own attribution).
3. Officials' characterisations ("riots", "unlawful assembly") are claims, recorded as positions or state-response attributions. In high-repression contexts `civil-unrest` needs independent national or international reporting; otherwise the record stays `collective-action` and the gate notes "kind withheld under the kind clause (high-repression context)".
4. Communal violence is `civil-unrest` only where the source says so and names the groups as the source does.
5. One kind per episode; a mixed strike-and-demonstration stays `collective-action` with a `text` saying both are reported.
6. Copy that protects participants: badge "Civil unrest, as reported"; actors print exactly as stored; "rioters", "mob", "thugs", "looters" never appear in our copy; D5-violence-note stays; no filter or sort ranks "violent" records; Kind options are alphabetical after "Any kind".
   - **K4** filter help beside the civil-unrest option: "Episodes where the cited source itself reports violence or destruction by participants. Force used by police or security services does not make an episode 'civil unrest'."
   - **Record note** under the K7 row on every `civil-unrest` record: "Kind follows the cited source's own account of what participants did. It is not a finding about any person, and arrests or police force are not evidence of participant violence."
7. The keyword-matching records are **leads for a re-read, never evidence**, and stay `collective-action` / `contract-default` in 4.1, asserted on the kind fixture by this id list. The list is reproducible: over every string value of each record (keys excluded; `sources[].url` excluded), case-insensitive, `\b(riot\w*|clash\w*|unrest|loot\w*|arson|violen\w*)\b` matches **18** records and `\b(war|wars|warfare|armed)\b` matches none; `inputs.md`'s "12 + 1" used an unstated field set and is not reproducible, so the 18 replace it. Command (run on `tests/fixtures/snapshot-20261002/events.json`, pinned as `KEYWORD_LEADS` in `tests/test_pipeline.py` with this regex in a comment):
   ```
   python3 -c "import json,re;rx=re.compile(r'\b(riot\w*|clash\w*|unrest|loot\w*|arson|violen\w*)\b',re.I)
   def s(o,p=''):
     yield from ([(p,o)] if isinstance(o,str) else [x for k,v in (o.items() if isinstance(o,dict) else enumerate(o)) for x in s(v,p+'.'+str(k))] if isinstance(o,(dict,list)) else [])
   print(sorted(e['id'] for e in json.load(open('tests/fixtures/snapshot-20261002/events.json'))['events'] if any(rx.search(v) for p,v in s(e) if not (p.startswith('.sources') and p.endswith('.url')))))"
   ```
   The 18: `am-border-policy-protests-2024`, `ao-fuel-20250728`, `ar-labor-reform-protests-2026`, `au-victorian-hospital-strike-20261001`, `bd-quota-uprising-2024`, `bg-budget-protests-2025`, `ec-diesel-subsidy-strike-2025`, `fj-yaqara-pastoral-strike-20260216`, `fr-schools-20261002`, `gr-tempe-accountability-2025`, `id-lawmakers-perks-protests-2025`, `ir-economic-unrest-2025-2026`, `nc-electoral-reform-unrest-2024`, `np-gen-z-protests-2025`, `pg-port-moresby-payroll-protest-20240110`, `sn-electiondelay-202402`, `ve-election-protests-2024`, `vu-teachers-resumed-strike-20240810`. Several match only on an `intensity.violence` value such as "No violence described in the reviewed report", which is why the list is a lead list and nothing more.

### 5.3 Armed conflict: what "ongoing" means and what is forbidden (editorial §4)

- Conflict records carry **no `status`** and never the words ongoing, Reported ongoing, needs review, casualties, death toll, so far, to date, rising, live, killed today, escalating, front line (outside the fixed CD6 negation). They carry an `activity_basis`:

| `activity_basis` | Condition | Label (exact) |
|---|---|---|
| `active-year` | in the UCDP annual data for `window.last_year` | "Recorded as active by UCDP in {2024}" (one line per year in `years[]`) |
| `provisional-months` | `provisional[]` non-empty | "Provisional UCDP events recorded through {Aug 2026}, subject to revision" |
| `not-in-latest-year` | absent from `window.last_year` | "Not recorded by UCDP as active in {2025}. Absence from the dataset is not evidence of peace." |

- Definition shown once per record and in About: "'Recorded as active' means UCDP coded at least 25 battle-related deaths in that calendar year. This atlas does not know whether fighting is taking place today."
- Fatalities only as UCDP best/low/high for a named calendar year and dataset version: "Battle-related deaths, {2024}: best estimate {n} · low {l} · high {h} (UCDP {Battle-Related Deaths Dataset 26.1})"; provisional: "Provisional events, {Aug 2026}: best {n} · low {l} · high {h} (UCDP Candidate, subject to revision)". Never a single number, sum, rate, rank or superlative. Fixed note under every figure block: "Battle-related deaths as UCDP defines and estimates them: combatants and civilians killed in fighting between the parties, per calendar year, with UCDP's low and high bounds. Not a total for the war, and not a count of everyone who died because of it." Zero is shown as UCDP publishes it; a missing year is "not recorded".
- Parties exactly as UCDP names them, with "Parties as named by UCDP."; governments as institutions; no individuals. Location: "UCDP conflict location: {names}" with "A conflict may have more than one location country; placement follows UCDP, not this atlas."
- **Forbidden** (validator-rejected keys and reviewer-rejected content): coordinates or any key matching `/(^|_)(lat|lng|lon|latitude|longitude|coord|coordinates|geom|geometry|geojson|wkt|adm\d?|where|priogrid|status|severity|risk|danger|score|trend|casualt|toll)(_|$)/i`; event-level rows; names of individuals; front lines, troop positions, controlled or contested territory; danger/risk/intensity scores; trend arrows; predictions; comparison tiles or sums with protest counts; "N countries at war" tiles (a scope count of records is allowed: "{n} UCDP conflict records in this snapshot"); news-sourced casualty claims.

### 5.4 The window

"Past 2 years" is the owner's intent, not a product claim. Protest records: 1 Jan 2024 to `WINDOW_END` (61 of 84 episodes have newest evidence on or after 4 Oct 2024; 23 are earlier in 2024; none is dropped or relabelled). Conflict inclusion: a UCDP event dated inside `window.inclusion_start` (2024-10-01) to `inclusion_end` (the run day); yearly figures cover whole calendar years from the supplied files (2024 includes January–September). Every dataset states its own window in the paired sentence (§4.5). Clocks never merge: staleness stays measured from newest protest evidence; the conflict dataset has its own T4 row; window filters (7/30 days) apply to protest records only, with M12.

---

## 6. Data model, validators and pipeline

### 6.1 `public/events.json`: `kind` and `kind_basis` (WP-D)

Exact event keys become the 4.0 tuple plus `'kind', 'kind_basis'`.

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
    refs(basis['source_ids'], source_ids, path + '.kind_basis')      # non-empty, event-local, no duplicates
else:
    require(basis['source_ids'] == [], path, 'illustrative basis cites no source')
```

Nothing is derived from `title`, `id`, `issues`, `summary` or `intensity.violence`, in Python or in JS.

### 6.2 `scripts/merge_history.py` (WP-D)

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

Called in `assemble()` after `apply_round4(...)` and before the sort, so every future merge run carries the field. In the round-4 update loop (and its round-5 successor): `if 'kind' in update:` require `update.get('kind_basis')` with `method == 'source-reread'`, else `raise ValueError('Kind change needs a source-reread kind_basis: ' + event['id'])`; then copy `kind` and `kind_basis`. The `coverage_note`, `sweep_sentence` and `write_upcoming` templates are unchanged (the UI parses them). `public/examples.json` (hand-maintained) gets `kind: "collective-action"`, `kind_basis: {"method": "illustrative", "text": "Illustrative example; no source was checked.", "source_ids": []}`.

**Phase 0 applies the defaults without re-stamping (R27).** `merge_history.assemble()` is **not** run in Phase 0: it would write `generated_at` and `last_editorial_review` = now (§0.1), moving "Snapshot assembled" (S1, the header chip, the dates sheet) and "AI-assisted review pass" to the Phase-0 day, resetting `editorialStale` for 72 h, and leaving `event-context.json`/`research-ledger.json` at 2 Oct after the usual `git checkout --`, so the stamps would disagree; EDITORIAL_POLICY: a successful pipeline run does not establish new activity. Instead, new **`scripts/apply_kind_defaults.py`** (stdlib; `python3 scripts/apply_kind_defaults.py [--root .]`): reads `public/events.json` with `merge_history.read`, calls `apply_kind_defaults(data['events'])`, writes with `merge_history.write` (`json.dumps(…, ensure_ascii=False, indent=2) + '\n'`, which reproduces the committed file byte for byte, §0.1), prints how many records gained the keys, exits 0. Idempotent: a second run changes nothing. The commit carries `generated_at` = `last_editorial_review` = `2026-10-02T22:45:35Z` and the unchanged `coverage_note`; `tests/test_pipeline.py::test_kind_regeneration_changes_only_kind_fields` loads `public/events.json`, deletes `kind` and `kind_basis` from every record, re-serialises through `merge_history.write`'s format and asserts byte equality with `tests/fixtures/snapshot-20261002/events.json`; `::test_apply_kind_defaults_is_idempotent` runs the script twice on a temp copy.

**Handoff rule (R28).** This touches files HANDOFF_DATA_REFRESH §2.2 reserves for the data session, so it lands **first and alone**: the first 4.1 commit on the assigned branch `ccr-77796c82-ka7vhp` contains only `scripts/validate_data.py`, `scripts/merge_history.py`, `scripts/apply_kind_defaults.py`, `public/events.json`, `public/examples.json`, `tests/test_pipeline.py` and `tests/fixtures/snapshot-20261002-kind/` (§10 step 2), with both test suites green at that SHA. Its hash is **`PHASE0_SHA`**, written into `docs/HANDOFF_DATA_REFRESH.md` (a dated note at the top and in §2.1, and the new §10.8): round 5 runs `git fetch origin ccr-77796c82-ka7vhp main; BASE=<PHASE0_SHA>; git merge-base --is-ancestor $BASE origin/main && BASE=$(git rev-parse origin/main)` and branches from `$BASE` with the §2.1 fallback name. The data branch is then `fcd35a7` + the pipeline commit + data work; its PR into `main` carries the pipeline commit the way the round-4 PR carried `e633dfe` (HANDOFF §2.3), the 4.0 interface on `main` ignores `kind` (`SHAPES.events` checks only `Array.isArray(v.events)`), and `merge_history.py` at `$BASE` already applies the defaults, so the regenerated `events.json` merges without conflict. Before every later UI commit the usual `git checkout -- public/{event-context,coverage,research-ledger,cities,upcoming}.json` applies; `events.json` is committed once, in `PHASE0_SHA`.

### 6.3 Fixtures (WP-D; D8)

- `tests/fixtures/snapshot-20261002/` byte-identical (a test pins its `events.json` sha256).
- `tests/fixtures/snapshot-20261002-kind/`: `events.json`, `examples.json` copied once from `public/` after the kind merge, plus a README ("copied at commit …; never edit"). Tests that pin kind literals (84 × `collective-action`, 84 × `contract-default`, the 18 keyword ids of §5.2(7) unchanged, `showKindBadges === false`) read it.
- `tests/fixtures/conflicts-sample/conflicts.json`: labelled synthetic (`licence_note` and `method_note` start "SYNTHETIC TEST FIXTURE, not UCDP data:"; names "Synthetic test conflict A/B/C/D"; ids `ucdp-900001` … `ucdp-900004` with `ucdp.conflict_id` 900001 … 900004 (the schema requires `^ucdp-\d+$`); parties "Government of (test)"), valid under `validate_conflicts.py`: one intrastate record with two location countries, one of them `LU` (under 1 px at world zoom on a 390 px viewport, for the small-country checks in smoke 27–28), one interstate record whose location is also in events (FR), one with provisional months, one `not-in-latest-year`, one location with `code: null` ("Synthetic unmapped territory"). Never published. Smoke 27 routes it to `public/conflicts.json`.
- `tests/fixtures/ucdp-synthetic/`: the skeleton's 20-row GED files, ACD, BRD, manifest and README, moved in; `tests/test_ingest_ucdp.py` reproduces `conflicts-sample` from them byte for byte through the ingest **and** the publish step.

### 6.4 `public/conflicts.json`: final schema (exact keys; `obj()` rejects unknown keys at every level)

**Envelope:** `schema_version` (int 1) · `generated_at` (timestamp ≤ now, ≥ every `sources[].downloaded_at`) · `window` · `licence_note` (text) · `method_note` (text; must contain "Absence of a country is a threshold and coverage fact, not evidence of peace.") · `sources` · `excluded` · `records`.

`window`: `first_year` (int ≥ 2024) · `last_year` (int, `first_year ≤ last_year ≤ now.year`) · `last_provisional_month` (`"YYYY-MM"` after December of `last_year` and ≤ the current month, or `null`) · `inclusion_start` (ISO day, `2024-10-01`) · `inclusion_end` (ISO day ≤ `generated_at`'s day).

`sources[]` (dataset level): `id` (slug) · `role` ∈ `acd | brd | ged | candidate | non-state | one-sided` · `dataset` (text) · `version` (`^\d+\.\d+(\.\d+)?$`) · `url` (`https_url()`) · `licence` (text) · `citation` (text) · `downloaded_at` (timestamp ≤ `generated_at`) · `covers_through` (ISO day) · `sha256` (`^[0-9a-f]{64}$`). Ids unique; at least one `acd` source when any record is state-based.

`excluded[]`: `conflict_id` (int > 0) · `conflict_name` (text ≤ 300) · `reason` (text ≤ 300). May be empty.

`records[]`, exact keys: `id` · `kind` · `kind_basis` · `ucdp` · `parties` · `location` · `start` · `years` · `provisional` · `latest_recorded` · `activity_basis` · `note`.

| Key | Rule |
|---|---|
| `id` | `^ucdp-\d+$`, equal to `f"ucdp-{ucdp.conflict_id}"`, unique, **not an id in `events.json`** |
| `kind` | one of the four conflict kinds |
| `kind_basis` | exact keys `method` (= `"ucdp-coding"`), `text` (≤ 600; starts "Coded by UCDP, not by this atlas."), `source_ids` (non-empty envelope source ids) |
| `ucdp` | `conflict_id` (int > 0) · `dataset_family` ∈ `state-based` / `non-state` / `one-sided` · `conflict_name` (text ≤ 300) · `type_of_conflict` (2, 3 or 4 when `state-based`; `null` otherwise) · `type_label` (`"interstate"` ⇔ 2, `"intrastate"` ⇔ 3, `"internationalised intrastate"` ⇔ 4, `null` otherwise) · `dyad_ids` (array of ints, unique, may be empty). Consistency: `armed-conflict-interstate` ⇔ 2; `armed-conflict-intrastate` ⇔ 3 or 4; `non-state-conflict` ⇔ family `non-state`; `one-sided-violence` ⇔ family `one-sided` |
| `parties` | exact keys `side_a`, `side_b`: non-empty arrays of text ≤ 200, as UCDP names them |
| `location` | non-empty array of `{code, ucdp_name}`: `code` is `null` or an ISO code in `countries.json`; non-null codes unique; `ucdp_name` text ≤ 200 |
| `start` | `{ucdp_start_date, ucdp_start_date2}` ISO days with `start_date ≤ start_date2 ≤ now`; or `null` when `dataset_family ≠ state-based` |
| `years` | array, ascending unique `year` ints within `[first_year, last_year]`; each `{year, intensity_level (1 or 2, or null when family ≠ state-based), intensity_label ("armed conflict" ⇔ 1, "war" ⇔ 2, null ⇔ null), deaths {best, low, high}: ints ≥ 0 with low ≤ best ≤ high, source_ids}` where every `source_ids` entry has role `brd` (or `non-state`/`one-sided`). May be empty only when `provisional` is non-empty |
| `provisional` | array, may be empty; ascending unique `month` (`"YYYY-MM"` after December of `last_year`, ≤ `last_provisional_month`); each `{month, events (int ≥ 0), deaths {best, low, high}, source_ids}` with role `candidate` |
| `latest_recorded` | string; equals the last `provisional[].month` when non-empty, else `str(years[-1].year)` |
| `activity_basis` | `provisional-months` when `provisional` non-empty; else `active-year` when `years` includes `last_year`; else `not-in-latest-year`. Exactly that value |
| `note` | text ≤ 600 or `null` |

**Forbidden anywhere in the file** (recursive key and value scan after the schema pass): any key matching the §5.3 regex; any string value matching `validate_data`'s coordinate pattern; any `http://` URL; the strings `ongoing`, `casualt`, `death toll`, `so far`, `to date`, `escalat`, `hotspot` in any text value except `method_note`'s fixed negations. Thresholds (25 / 1,000) are **not** checked against the data: UCDP's coding is the basis.

### 6.5 `scripts/validate_conflicts.py` (WP-D; stdlib; reuses `validate_data` helpers)

```python
def validate_conflicts(data, countries, event_ids, now=None) -> dict
def validate_conflicts_repository(root=ROOT, now=None)   # None when public/conflicts.json is absent
```

`scripts/build.py`: `PUBLIC_FILES` gains `'public/conflicts.json'`; `OPTIONAL_FILES` gains it; `build()` calls `validate_conflicts_repository(root)` after the upcoming validator. All three edits, and the CSS stripping of §8.1 step 6, are **Phase-0 work by the lead** (§10 step 5, R30) against the Phase-0 stub of `validate_conflicts_repository`; no lane edits `scripts/build.py` afterwards. `tests/test_pipeline.py::test_build_preserves_dates_and_excludes_nonpublic_files` already skips absent optional files.

### 6.6 `scripts/ingest_ucdp.py` (WP-D; the skeleton moved from `design2/ingest/`, renamed to this schema, offline, never fetches)

```
python3 scripts/ingest_ucdp.py --inputs research/round5/downloads/inputs.json --out research/round5/conflicts.candidates.json \
  --countries public/countries.json [--country-map research/round5/country-map.json] [--window-end YYYY-MM-DD] [--include-non-state] [--include-one-sided]
```

Keeps from the skeleton: the manifest contract (every field required; licence and citation **as read on the page**; SHA-256 and row counts recorded); streaming of GED annual and Candidate CSVs reading only the named columns (never coordinates, `adm_*`, `where_*`, `source_*`, `priogrid`); dedupe across releases by GED `id` (annual beats Candidate; later Candidate beats earlier); the ACD as the only source of `type_of_conflict`, `intensity_level`, `location`, `start_date`/`start_date2`; a state-based conflict absent from the supplied ACD is **excluded and named**; `countries.json` names + `GW_TO_ISO2` + the committed `country-map.json` for codes, unmapped → `code: null` with a warning; `check_candidates()` on its own output; `publication: "candidate"`; determinism.

Changes (constants and one `aggregate()` block; `design2/ingest/README.md` lists each): `RECORD_FIELDS` → §6.4; `countries` → `location`; `fatalities[]` → `years[]` (BRD rows only, with `intensity_level`/`intensity_label` from the ACD year) + `provisional[]` (Candidate months, per month: event count and best/low/high sums); drop `estimator`, `through`, `latest_evidence`, `latest_evidence_precision`, `verification`, `status_basis` (→ `activity_basis` enum computed as §6.4); `window` gains `inclusion_start`/`inclusion_end` and loses `start`/`end`; `sources[]` gains `role` and loses `publisher`, `doi`, `provisional`, `rows_read` (they stay in the candidates file's `inputs[]`); `ENVELOPE_FIELDS` of the candidates file stay (`publication`, `inputs`, `counts`, `warnings`, `excluded`) and the publish step maps them. Column names are validated against the header row and a missing column is a named hard error. Candidate months for a calendar year that the BRD already covers are **dropped with a warning** (R10).

### 6.7 `scripts/publish_conflicts.py` (WP-D; the lead's step the data plan assumed)

```
python3 scripts/publish_conflicts.py --candidates research/round5/conflicts.candidates.json --gate research/round5/gate-review.json --out public/conflicts.json
```

Refuses unless `gate.result == "pass"` and `gate.candidates_file_sha256` equals the candidates file; drops records in `gate.withheld` (listing them on stdout); maps `inputs[]` → `sources[]`; drops `publication`, `counts`, `warnings`; keeps `excluded`; writes the §6.4 envelope; runs `validate_conflicts` with the live `countries.json` and `events.json` ids before writing. Never fetches, never edits a figure.

### 6.8 Loading, build, CI (Phase 0, WP-A and WP-B)

- `js/data.js`: `CRITICAL.conflicts = 'public/conflicts.json'`; `SHAPES.conflicts = v => isObject(v) && Array.isArray(v.records) && isObject(v.window) && Array.isArray(v.sources)`; `loadCritical` maps a 404 to `'absent'` for `['upcoming', 'build', 'conflicts']`; `loadFile('conflicts')` serves the Retry.
- `.github/workflows/pages.yml` verify job: treat `public/conflicts.json` exactly like `public/upcoming.json` (200 → parse; 404 → `::notice::public/conflicts.json is not published in this build; the map legend and Kind filter show the absent state`; other → error).
- `tests/test_site.py::test_public_json_constants_resolve`: skip paths in `build.OPTIONAL_FILES` that are absent.
- `tests/test_shell.mjs`: `CRITICAL_DATA` gains `'public/conflicts.json'` (absent = 0 B, so the 180 KB sum is unchanged today) **and** a per-file guard `conflicts: {label: 'conflicts.json (data)', target: 24, ceiling: 24}` is added (R29).
- `tests/browser/smoke.cjs` `open()`: `allowed` becomes `url => /\/public\/conflicts\.json(\?|$)/.test(url) || (SERVING_REPO && /\/public\/build-info\.json(\?|$)/.test(url)) || block.some(b => url.includes(b.pattern))`, **unconditionally**: R16 makes the boot request happen on every page load, and while the file is absent every response is a 404 that `open()` would otherwise record, failing checks 1–28 with `http 404: …/public/conflicts.json`. This edit lands in the same Phase-0 step that adds `CRITICAL.conflicts` (§10 step 4). Smoke 27's absent sub-check routes the file to a 404 explicitly, so it keeps holding after the data session publishes the file.
- `docs/DEPLOYMENT.md`: until `public/conflicts.json` is published, every visit to the live site requests it and receives a 404, which appears in the browser console as a failed resource. That is the designed absent state (EC1 in the legend, About and the dates sheet), the same mechanism as `upcoming.json` before 4.0 and `build-info.json` when serving the repo; the verify job reports it as a notice, not an error.
- `.gitignore`: `research/round5/downloads/*.csv`, `*.zip`, `*.pdf`.

---

## 7. UI changes per view

### 7.1 Reports (`#view-latest`; WP-B)

- **Filter sheet** (`js/filters.js`, after the Status fieldset): `<fieldset id="kind-filter" class="filter-group filter-rows" hidden><legend>Kind</legend>` with an "Any kind" row and one `.filter-row` per `kindOptions(state)` entry (counts in the C-07 style, zero-count rows omitted unless selected, alphabetical by label after "Any kind"); **K3** help "Kind is set from the research contract, from a re-read of the cited source, or from UCDP's own coding. It is never guessed from words in a title. 'Collective action' means the record did not distinguish a protest from a strike."; **K4** shown when the civil-unrest row exists. `#kind-filter` is `hidden` unless `showKindBadges(state)`. `change` on `name="kind"` behaves like `status`. **K8** active chip "Kind: {label}" (prefix "Remove filter: " visually hidden), cleared by `data-clear-filter="kind"`. No quick chip (the row is full at 390 px). **K9** no-match: "No published record of this kind matches these filters." + E1's second sentence.
- **Card badge** (`js/cards.js`): `renderCard(event, {…, showKind = false})`; when `showKind && kindOf(event)`, `.card-status` becomes `{status}{SEP}<span class="kind" data-kind="…">{K5}</span>`; the List row puts the same `.kind` after the status in `.card-meta`. **K6** accessible name for the default (visually hidden): "Kind: collective action; protest or strike not distinguished in this record". No glyph, no hue; `.kind` shares the `.side-pill` block (§7.6). `list.js` passes `showKind: showKindBadges(state)`.
- **Conflict section** (only when `kindScope(filters) === 'conflicts'`): `<section class="feed-group" data-kind="conflict">` with the §4.8 heading and note, rows from `renderConflictRow` (D exports), no band groups; `window !== 'all'` → no rows + M12; nothing matching → K9. Result summary per §4.8. CSV `aria-disabled` with the §4.8 title; `csvForEvents` unchanged (episodes only).
- S1/S2, `datasetStats`, `overviewModel`, the header chip and S3–S7 never count conflicts (tests assert 84 stays 84 with the sample loaded).

### 7.2 Record sheet (`#record-sheet`)

- **Episodes** (WP-B, `js/detail.js`): inside `rec-overview` after the issues list, before the glance: `<dl class="rec-kind"><div class="rec-evidence-row"><dt>Kind:</dt><dd>{K7}</dd>{basis line}</div></dl>`. **K7**: "Kind: {label}" with, for `contract-default`, " · protest or strike not distinguished in this record"; `source-reread`: second line "Basis: {kind_basis.text} [Source n]"; `illustrative`: "Illustrative example; no source was checked."; `null`: "not stated in this record". The §5.2 record note follows on `civil-unrest` records. `js/record-facts.js` gains the pure `kindFact(event) → {label, suffix, basisLine, sourceIds}`.
- **Conflicts** (WP-D `js/conflict-detail.js`, lazy; WP-A routing): `#/record/ucdp-<id>` resolves through `findRecord(state, id)`; `#record-body` shows "Loading this record…", awaits `import('./js/conflict-detail.js')` (cached; retry adds `?retry=n` like the map), then `renderConflictRecord(record, {envelope, now, countryName})`. Chrome: eyebrow **"Conflict record · UCDP data"**, title `ucdp.conflict_name`, prev/next over `visibleRecords(state)`, share allowed, external source button → the envelope source `url` with label "{dataset} {version}". Body, verbatim editorial §7.4: **CD1** meta "Re-published from UCDP {version} · downloaded {date} · not Protest Atlas research · no human editorial review"; **CD2** "{K5} · UCDP type {2|3|4}: {interstate | intrastate | internationalised intrastate}"; **CD3** "What UCDP records" (dl: Parties · Location · Start (UCDP start_date) · Threshold first met (UCDP start_date2)) + CD3-sub; **CD4** "Years recorded active" table (Year · UCDP intensity · Best · Low · High · Source) with the intensity cell "armed conflict (25–999 battle-related deaths)" or "war (at least 1,000 battle-related deaths)", CD4-sub (the fixed note), CD4-status, CD4-absent when applicable; **CD5** "Provisional months" table or "No provisional UCDP events are in this snapshot for months after {2024}. That is a limit of this download, not a statement about fighting." + CD5-sub "UCDP Candidate events are provisional and are revised before they enter the annual dataset."; **CD6** "What this record does not say": "This record does not show where fighting happened, who holds territory, whether the conflict is growing or shrinking, or how many people have died in total."; **CD7** "Source and licence": "{dataset} {version}, Uppsala Conflict Data Program · {licence} · downloaded {date} ↗" + the citation verbatim. Sticky tabs "Overview · Years · Months · Limits · Source" (`conf-overview conf-years conf-months conf-limits conf-source`). No For/against, Intensity, Police/state, Outcome, Timeline, `.status`, `.band` or `.side-pill` markup.

### 7.3 Map (`#view-map`; WP-C)

§3.4–§3.5 and §4.1–§4.6. In addition: `describeCountry` additions; `briefModel({…, conflicts, conflictsLoad})` and the brief subsection (§4.5); `mapEvents` is empty when `kindScope(filters) === 'conflicts'` or `!layers.episodes`, and in both cases M2 carries the matching suffix (§4.3), `shading` passed to `api.update` is `null`, and `#map-shade` is hidden while `!layers.episodes`; `conflictMap` is `layers.conflicts && data.conflicts ? conflictsByCountry(selectConflicts(state, {ignoreCountry: true}))` (all records when `kindScope` is `'all'`) else `null`. Candidates for the roving tabindex include conflict-only countries (they have an `aria-label` from `describe`).

### 7.4 Countries, Ahead, About, 404

- **Countries**: unchanged rows; the view is now lazy (§8.1) with the §4.8 loading/failure copy.
- **Ahead**: lazy; the roadmap renders from `roadmap.json` as today. **R4 "What we will not build"** (`js/ahead.js` list) gains four lines: "Front-line, territorial-control or troop-position maps." · "Any score that rates or ranks how serious a conflict is." · "Plotting the coordinates of conflict events." · "Daily or running counts of the dead."
- **About**: §4.5 copy; lazy module; "Kinds of record" section; the paired scope sentence; T4 row.
- **404.html**: unchanged.

### 7.5 Notice, stamps, header

- `js/notice.js`: new line `conflicts-error` after `contexts-error`: EC2 + `[Retry]` (`data-action="retry-conflicts"`). Absent is not a notice line (EC1 lives in the legend, About and the dates sheet).
- `js/stamps.js` `stampItems`: row `conflicts` (label "Conflict dataset", T4 copy; `present` only when loaded; absent text per §4.5). The header chip and footer are unchanged.

### 7.6 `.kind` primitive (`styles.css` `@layer base`; the block move is Phase 0 (R30), the `.kind` rule WP-A; ≈ 120 B)

The `.side-pill` declaration block moves to `styles.css` as `.side-pill, .kind { … }` **in Phase 0, by the lead, in one commit that edits `styles.css` and `css/record.css` together** (R30; neither WP-A nor WP-B starts from a tree with broken pills) (outlined pill, neutral ink, 12 px minimum, 4.5:1; `border: 1px solid CanvasText` under forced colours); `css/record.css` keeps only `.rec-stance .side-pill` spacing. No `data-kind`-specific colour rule may exist anywhere (test_shell asserts `css` does not match `/\.kind\[data-kind[^{]*\{[^}]*(color|background)/`).

---

## 8. Budget: measured, Phase 0, allocations

### 8.1 Phase 0: lazy Ahead, Countries and About (C-53) and CSS stripping (C-58)

1. New static `js/teaser.js` (≈ 1.4–1.7 KB gz): `aheadTeaserHTML`, `upcomingCount`, `groupAnnouncements` (+ private `byStart`, `byStartDesc`, `periodPassed`) from `js/ahead.js`; `discoveryView` and `RUN_URL` from `js/about.js`. Imports only `./html.js` and `../freshness.js`.
2. `js/list.js` imports `aheadTeaserHTML` from `./teaser.js`; `js/stamps.js` imports `discoveryView` from `./teaser.js`; `ahead.js` and `about.js` import from `./teaser.js` and **re-export** the four names so `tests/test_pages.mjs` imports keep working.
3. `app.js`: `firstVisit = {ahead: () => import('./js/ahead.js').then(m => m.mountAhead), countries: …, about: …}`; `flush()` caches the promise per view, renders `<p class="view-loading" role="status">Loading this section…</p>` into `#<view>-root`, mounts on resolve with the latest state; on rejection `<p class="view-error" role="status">This section could not load.</p><button class="btn" data-action="retry-view" data-view="…">Retry</button>` (re-import with `?retry=n`). Prefetch: one listener on `#primary-nav` and `#tab-bar` for `pointerover`, `focusin`, `touchstart` starting the same `import()` for the hovered `data-nav` view. Growth ≤ 600 B gz.
4. `index.html`: remove the three `modulepreload` links; add `./js/teaser.js` and `./js/conflicts.js` to the import map **and** the preloads, and `./js/conflict-detail.js` to the import map **only** (no `modulepreload`: it is lazy; `tests/test_shell.mjs` lines 268–279 require exactly one versioned entry per `js/*.js` file, and the dynamic `import('./js/conflict-detail.js')` would otherwise bypass the `?v=4.1` cache key); `?v=4.0` → `?v=4.1` everywhere.
5. `tests/test_shell.mjs`: `STATIC_GRAPH_21` → `STATIC_GRAPH_20` = the 21 minus `js/ahead.js js/countries.js js/about.js` plus `js/teaser.js js/conflicts.js`; `LAZY = ['map.js', 'js/map-view.js', 'js/country-brief.js', 'js/ahead.js', 'js/countries.js', 'js/about.js', 'js/conflict-detail.js']`; assert `app.js` contains each lazy specifier inside `import(`; the cycle walk covers every lazy entry; version `'4.1'`.
6. `scripts/build.py` (Phase 0, lead, R30): `strip_css_comments(text)` (pure; raises `ValidationError` if `/*` occurs inside a quoted string or `url(…)` on the same line) applied to every `.css` in `PUBLIC_COPIES` as it copies; sources keep their contract comments. `tests/test_shell.mjs` measures CSS as `gz(stripComments(css))` and asserts its regex literal equals `build.py`'s; `tests/test_pipeline.py::test_build_strips_css_comments`. `docs/DEPLOYMENT.md` and TECH §6.2: "CSS is measured and served comment-stripped; JS is served as written."
7. Expected after Phase 0 (gzip -9 bytes; KB = 1,024 B): critical JS 92,586 − 19,890 + ≈ 1,600 + ≈ 600 ≈ **74,896 B** (≈ 73.1 KB; headroom ≈ 18,288 B ≈ 17.9 KB against the 93,184 B ceiling; revision 1's "74.9 KB / 18.3 KB" used 1,000-byte units); CSS **22,708 B** (≈ 22.2 KB; headroom 5,964 B against 28,672). Record both in bytes in INTEGRATION_NOTES §4 ("after Phase 0, 4.1") and SPEC §23.

Routing and focus are unaffected (the router focuses the static `#<view>-title`). Smoke checks 2 and 8 wait for `#ahead-root .ahead-switch` / `#countries-root .dir-list` instead of asserting synchronously.

### 8.2 Allocations (gzip -9; KB = 1,024 B; hard caps per WP, measured at each hand-off; ceilings unchanged)

| WP | Grows | Cap |
|---|---|---|
| A | `app.js` (conflict record routing, `shade=` sync, retry-view/record, prefetch) | ≤ 1.5 KB critical JS; ≤ 300 B CSS (tokens, `.kind`, `.view-loading/.view-error`) |
| B | `model explore actions store data filters cards record-facts detail list stamps notice` | ≤ 4.5 KB critical JS; ≤ 400 B CSS (`feed.css`, `record.css`) |
| C | `map.js map-view.js country-brief.js map.css` | ≤ 6 KB of the map add-on; ≤ 900 B CSS |
| D | `js/conflicts.js` (critical) | ≤ 1.5 KB critical JS; `js/conflict-detail.js` lazy ≤ 4 KB; ≤ 400 B CSS |

Expected after 4.1 if every cap is used in full: critical JS 74,896 + 1,536 + 4,608 + 1,536 = **82,576 B** (≈ 80.6 KB; headroom 10,608 B ≈ 10.4 KB, so the "≥ 8 KB" = 8,192 B acceptance holds); CSS 22,708 + 300 + 400 + 900 + 400 = **24,708 B** (≈ 24.1 KB; headroom 3,964 B ≈ 3.9 KB); map add-on 160,205 + 6,144 = **166,349 B** (≈ 162.5 KB; headroom 7,731 B ≈ **7.5 KB, not 8 KB** as revision 1 said). `index.html` grows ≈ 400 B to ≈ 6,500 B against 12,288. If a WP exceeds its cap it cuts scope, never the ceiling; `public/conflicts.json` has its own ≤ 24 KB guard.

---

## 9. Work packages (disjoint files; exact interfaces; acceptance)

### WP-A: Shell, app wiring, CI, docs, roadmap (build.py is Phase 0)

**Files:** `app.js`, `index.html`, `styles.css`, `js/teaser.js`, `js/ahead.js`, `js/about.js`, `js/countries.js`, `.github/workflows/pages.yml`, `.gitignore`, `tests/test_shell.mjs`, `tests/test_site.py`, `tests/test_pages.mjs`, `tests/browser/smoke.cjs`, `public/roadmap.json`, `docs/DEPLOYMENT.md`, `docs/MAP_IMPLEMENTATION.md`, `docs/design/SPEC.md` (§17.1, §17.2, §18.1, §18.4, §19.0, §23 addendum), `docs/design/TECH_ARCHITECTURE.md`, `docs/design/INTEGRATION_NOTES.md`, `docs/design/OPEN_SOURCE_RESEARCH.md` (UCDP row), `CHANGELOG.md`, `docs/ROADMAP.md`, `docs/RELEASE_EVIDENCE.md`. **Not** `scripts/build.py`, whose 4.1 edits are Phase-0 work (R30), and not `tests/test_explorer.mjs` or `tests/test_freshness.mjs` (frozen; sha256 asserted).

**Interfaces (frozen):** `firstVisit` dynamic imports and `retry-view`; `syncRecord` resolves `findRecord(state, id)` and for `dataset === 'conflicts'` imports `./js/conflict-detail.js` and calls `renderConflictRecord(record, {envelope: state.data.conflicts, now, countryName})` with chrome from `conflictChrome(record)`; `initialState({filters: {...readViewState(search), kind: readKindParam(search)}, ui: readUIState(search)})`; `syncURL` writes `encodeViewState(filters)` + `encodeKindParam(filters.kind)` + `encodeUIState(ui)` (R26); the import map carries `./js/conflict-detail.js` without a `modulepreload`; `tests/test_shell.mjs` asserts the sha256 of `tests/test_explorer.mjs` and `tests/test_freshness.mjs` equal the §0.1 values; `retry-conflicts` → `actions.retryConflicts()`; `retry-record` re-imports. Tokens of §3.2 in all three token blocks; `.kind` primitive (§7.6); About copy (§4.5) static; R4 lines; `conflicts.json` optional in build and verify; CSS stripping; test_shell graph/lazy/tokens/CSS-rule/guard/banned-word changes; the `.kind` no-colour assertion; smoke 26–28 integration and the lazy-view waits.

**Acceptance:** all tests green; critical JS ≤ 91 KB with ≥ 8 KB headroom and CSS ≤ 28 KB with ≥ 3.9 KB, both recorded; a fresh `#/map` paints no `data-evidence-band` and no `#map-shade` radio other than SH2 checked; `#/ahead`, `#/countries`, `#/about` render after one dynamic import each, with loading and failure states reachable (route block on `js/countries.js` → failure copy and Retry); `#/record/ucdp-900001` with the sample fixture routed opens the conflict sheet through the lazy module (fixture ids are `ucdp-900001` … `ucdp-900004`, §6.3: the schema's `^ucdp-\d+$` forbids a `ucdp-test-a`); `?shade=evidence#/map` restores SH3 and `?shade=heat` is dropped with the neutral settings line of §4.6; the import map lists `./js/conflict-detail.js` and the modulepreload set does not; the frozen-test sha256 assertion passes; no banned word (old or new) in `index.html` or `404.html`; `public/roadmap.json` validates with §12's items.

### WP-B: Kind in state, URL, filters, Reports, cards and sheet

**Files:** `explore.js`, `js/store.js`, `js/data.js`, `js/actions.js`, `js/model.js`, `js/filters.js`, `js/list.js`, `js/cards.js`, `js/record-facts.js`, `js/detail.js`, `js/stamps.js`, `js/notice.js`, `css/feed.css`, `css/record.css`, `tests/test_core.mjs`, `tests/test_record.mjs`. **Not** `tests/test_explorer.mjs` (frozen regression contract; its sha256 is asserted by test_shell, R26).

**Interfaces (frozen for 4.1):**

```js
// explore.js — readViewState, encodeViewState and FILTER_KEYS are UNCHANGED (9 keys: the frozen test_explorer contract, R26)
export const FILTER_KEYS = ['query', 'country', 'region', 'issue', 'status', 'window', 'year', 'city', 'outcome'];   // unchanged
export const KIND_KEY = 'kind';
export const ALL_FILTER_KEYS = [...FILTER_KEYS, KIND_KEY];           // what actions.js compares (sameFilters) and patches (setFilters)
export const KIND_VALUES = [...EVENT_KINDS, ...CONFLICT_KINDS];      // literal list, same order as model.js
export const SHADE_VALUES = ['coverage', 'evidence'];
export function readKindParam(search)   // → KIND_VALUES member or ''   (`?kind=`); never touches readViewState
export function encodeKindParam(kind)   // → 'kind=<value>' | ''
export function readUIState(search)     // → {shadeBy: 'coverage' | 'evidence'}  (`shade=evidence` only)
export function encodeUIState(ui)       // → 'shade=evidence' | ''
export function droppedParams(search)   // 4.0 output, then 'kind' and 'shade' appended when present, non-empty and not accepted
export function shareURL({…, ui})       // appends kind=… and shade=evidence after the filters when set
// js/store.js
filters: {…, kind: ''}; data: {…, conflicts: null}; load.errors.conflicts: 'absent' | 'error'; ui: {…, shadeBy: 'coverage', layers: {episodes: true, conflicts: true}}
export function initialState({filters, ui, …})
// js/actions.js
setShadeBy(value); setLayer(name, on); retryConflicts(); validateFilters() drops a conflict kind when data.conflicts is null and an event kind not in kindsPresent(state); setMode('example') resets shadeBy and layers; controlStates(state).csvDisabled also when kindScope === 'conflicts'
// js/model.js
export const EVENT_KINDS = ['collective-action', 'protest', 'strike', 'civil-unrest'];
export const CONFLICT_KINDS = ['armed-conflict-intrastate', 'armed-conflict-interstate', 'non-state-conflict', 'one-sided-violence'];
export const KIND_LABELS = {/* K5 */}; export const KIND_FILTER_LABELS = {/* K2 */};
export function kindOf(record)                       // member of EVENT_KINDS ∪ CONFLICT_KINDS or null; never derives
export function kindScope(filters)                   // 'all' | 'events' | 'conflicts'
export function kindsPresent(state)                  // Set over selectEvents(state) and data.conflicts.records; example mode → Set(['collective-action'])
export function kindOptions(state)                   // [{value: '', label: 'Any kind', count}, …present or selected, alphabetical by label]; no zero counts
export function showKindBadges(state)                // kindsPresent(state).size >= 2
export function eventMatches(event, filters, opts)   // + kind: `if (f.kind && kindOf(event) !== f.kind) return false`
export function selectConflicts(state, {ignoreCountry = false} = {})   // kind (conflict kinds only, else []), country/region via location codes, year (years[].year or provisional month year), query (folded conflict_name, parties, country names); window !== 'all' → []; sorted latest_recorded desc, id asc
export function conflictsByCountry(records)          // Map<ISO, ConflictRecord[]> over location[].code (null codes skipped)
export function findRecord(state, id)                // {record, dataset: 'events' | 'conflicts'} | null
export function visibleRecords(state)                // kindScope === 'conflicts' ? selectConflicts(state) : selectFiltered(state)
// js/record-facts.js
export function kindFact(event)                      // {label, suffix, basisLine, sourceIds} per K7
// js/cards.js
export function renderCard(event, {…, showKind = false})
// js/stamps.js
stampItems row {key: 'conflicts', label: 'Conflict dataset', …}
// js/notice.js
line 'conflicts-error' (EC2 + Retry)
```

`timeSnapshot`, `datasetStats`, `csvForEvents`, `activeFilterCount` (ignores `shadeBy`; counts `kind`) and every frozen 4.0 signature are unchanged. `readViewState(encodeViewState(s))` still deep-equals the 9-key literal of `tests/test_explorer.mjs:24-25`, and `Object.keys(readViewState(''))` still equals `FILTER_KEYS` (`tests/test_core.mjs:279`, unchanged). `js/notice.js` renders the neutral settings line of §4.6.

**Acceptance:** `readViewState` output never contains `kind` and `Object.keys(readViewState(''))` equals the 9 `FILTER_KEYS`; `readKindParam('?kind=strike') === 'strike'`, `readKindParam('?kind=war') === ''`, `readKindParam('?' + encodeKindParam('civil-unrest')) === 'civil-unrest'`, `encodeKindParam('') === ''`; `tests/test_explorer.mjs` is untouched and passes; `readUIState('?shade=evidence').shadeBy === 'evidence'`, `readUIState('?shade=heat').shadeBy === 'coverage'`, `droppedParams('?kind=war&shade=heat')` → `['kind', 'shade']`; `kindOf({})` is `null` and every frozen-fixture record renders in both densities without a badge; on `snapshot-20261002-kind` all 84 are `collective-action`/`contract-default`, `showKindBadges` is false, `#kind-filter` is hidden, every Overview carries K7 with the suffix; with `conflicts-sample` loaded `kindsPresent` has ≥ 2 members, the badge and fieldset appear, `kindOptions` lists only kinds present (alphabetical after "Any kind", no zero counts), a conflict kind lists conflict rows under the §4.8 heading and disables CSV with the §4.8 title, `window: '7'` empties the conflict list with M12, `visibleRecords` drives prev/next, `datasetStats` still says 84; `noticeModel` emits EC2 on `errors.conflicts === 'error'` and the neutral settings line for dropped `kind`/`shade`; `stampItems` carries the T4 row present/absent; copy scan over the K strings and §4.8 strings passes both banned lists; WP cap ≤ 4.5 KB.

### WP-C: Map shading, conflict overlay, layers, legend, brief

**Files:** `map.js`, `js/map-view.js`, `js/country-brief.js`, `css/map.css`, `tests/test_map.mjs`.

**Interfaces (frozen):**

```js
// map.js (pure, Node-testable)
export function evidenceBandByCountry(events, now)   // Map<ISO, 'fresh'|'week'|'month'|'older'|'unknown'>: band of the newest last_observed_at per country via observationBand; 'unknown' when ANY record of the country lacks a parseable date
// map.js api.update(partial) additive keys: shading: null | Map<ISO, band>; conflicts: null | Set<ISO>
// paint(): container.dataset.shade = shading ? 'evidence' : 'coverage'; per country data-evidence-band (only while shading) and data-conflict="true"; overlay paths .map-conflict per conflict country; pattern defs per §3.4 with data-period; scaleMarks loops pattern[data-period]
// js/map-view.js
export const SHADE_COPY = Object.freeze({sh1, sh2, sh3, sh4, sh5, m2a, m2b, m2c, m2d, m2e, emptySuffix, m8a, m10: date => `No record in this snapshot has evidence newer than ${date}.`});
export const LAYER_COPY, CONFLICT_LEGEND_COPY;   // L1, L2; M2 variant, the two M2 suffixes (layer off / Kind filter), M2c1 (year, month) => …, M2c2, M3 variant, M11 (with the small-country sentence), M12, EC1, EC2, EC3, EC3f. No EC6 (R25)
export function legendHTML({…existing…, shadeBy, shading: {counts: {fresh, week, month, older, unknown}, latestObservation, datasetState}, conflicts: 'absent' | 'error' | 'loaded' | null, conflictYear, conflictMonth, layers, kindScope, forcedColors})
// conflicts: null → 4.0 rows; 'absent' → 4.0 rows + one legend-note[data-kind="conflicts-absent"] (EC1); 'error' → 4.0 rows + legend-note[data-kind="conflicts-error"] (EC2 + Retry); 'loaded' → the §4.3 variants. layers/kindScope drive the M2 suffixes.
export function controlsFieldsetsHTML({shadeBy, forcedColors, conflicts, layers})   // #map-shade (hidden while !layers.episodes) + #map-layers (only when conflicts === 'loaded'); every input carries data-focus-key
export function describeCountry(list, flags)   // + {shadeBand, newestDate, conflicts: n, conflictYear}
// js/country-brief.js
export function briefModel({…, conflicts = [], conflictsLoad = null, kindScope = 'all', layers})   // renderBrief adds the "Armed conflict (UCDP)" subsection per §4.5 (EC1, EC2, EC3, EC3f, EC4)
```

Ids `map-shade`, `map-layers`; classes `legend-control map-conflict-layer map-conflict map-conflict-pattern map-conflict-casing map-conflict-ink map-pattern`; attributes `data-shade`, `data-evidence-band`, `data-conflict`; legend swatch kinds `evidence-fresh evidence-week evidence-month evidence-older conflict both`.

**Acceptance:** `evidenceBandByCountry` edges equal `observationBand` at exactly 72 h / 7 d / 30 d with a fixed `now`, the unknown rule holds, ties take the newest; with `shadeBy: 'coverage'` and `conflicts: null`, `legendHTML` output equals the 4.0 rows text for text (the existing M1–M9 test still passes); with `conflicts: 'absent'` it equals the 4.0 rows plus exactly one `legend-note[data-kind="conflicts-absent"]` carrying EC1 and no `#map-layers`; with `'error'` the 4.0 rows plus EC2 and a `data-action="retry-conflicts"` button and no `#map-layers`; with `'evidence'` the rows are M2a–M2d with the suffix on empty bands, M2e only when `counts.unknown > 0`, M8a replaces M8, M10 on the 9 Oct clock; `forcedColors: true` renders SH3 `disabled` with SH5; example mode and events error hide both fieldsets; `#map-layers` only when `conflicts` is `'loaded'`; conflict rows, the M2/M3 variants, M11 (with the small-country sentence), M12, EC1/EC2 present in the right states; M2 carries " · hidden by Show on the map" when `layers.episodes` is false and " · hidden by the Kind filter" when `kindScope === 'conflicts'`, and `#map-shade` is hidden while `layers.episodes` is false; every legend input carries its `data-focus-key` and focus stays on the pressed radio across the repaint (test with a stub `document.activeElement`); the forced-colours block of `css/map.css` contains the conflict-only `Canvas` rule of §3.5 (text assertion; smoke 28 checks the computed fill); the scoped banned-word test over `SHADE_COPY` passes; swatches carry `data-kind` and no inline style; `css/map.css` stays in `@layer components`, uses only `--map-*`/`var(--text)` colours and contains no `transition` naming `fill`; the four `--ordinal` validator runs on the final hexes pasted in the hand-off; `briefModel` renders EC1–EC4 and EC3f; WP cap ≤ 6 KB (6,144 B) of the map add-on and ≤ 900 B CSS.

### WP-D: Validators, merge, conflicts schema, UCDP ingest and publish, conflict modules, fixtures

**Files:** `scripts/validate_data.py`, `scripts/merge_history.py`, `scripts/apply_kind_defaults.py` (new, Phase 0), `scripts/validate_conflicts.py` (new), `scripts/ingest_ucdp.py` (new), `scripts/publish_conflicts.py` (new), `research/round5/README.md` and `research/round5/country-map.json` (new, empty map), `public/events.json` and `public/examples.json` (regenerated / edited once), `tests/test_pipeline.py`, `tests/test_conflicts.py` (new), `tests/test_ingest_ucdp.py` (new), `tests/fixtures/snapshot-20261002-kind/`, `tests/fixtures/conflicts-sample/`, `tests/fixtures/ucdp-synthetic/`, `js/conflicts.js` (new, critical), `js/conflict-detail.js` (new, lazy), `tests/test_conflict_ui.mjs` (new), `docs/HANDOFF_DATA_REFRESH.md` (§10 from `handoff-round5.md` with the §6.4 schema and §6.7 publish step), `docs/EDITORIAL_POLICY.md` (v1.3 paste, §13), `docs/design/EDITORIAL_GUIDANCE.md` (§3.2 paste, §13).

**Interfaces (frozen):**

```js
// js/conflicts.js (critical; imports ./html.js, ./model.js, ../freshness.js only)
export const CONFLICT_COPY;                              // EC1, EC2, EC3, EC3f, EC4, EC5 (no EC6, R25), eyebrow, row strings of §4.8, activity labels of §5.3
export function conflictLatestLabel(record)              // "2024" | "Aug 2026"
export function activityLabel(record, envelope)          // one of the three §5.3 sentences, with years
export function renderConflictRow(record, {countryName, envelope})   // <li class="feed-item"><article class="card card--conflict" data-id data-kind data-density="row">…: .card-meta (kind badge · locations · Latest recorded …), h3 .card-title link #/record/ucdp-…, .card-row-sides "Parties as named by UCDP: {a} · {b}", .card-evidence (§4.8 line)
export function conflictChrome(record, envelope)         // {eyebrow, title, sourceLabel, sourceURL}
// js/conflict-detail.js (lazy; imports ./html.js, ./model.js, ./conflicts.js, ../freshness.js)
export const CONFLICT_SECTIONS;                          // [{id: 'conf-overview', label: 'Overview'}, …years, months, limits, source]
export function renderConflictRecord(record, {envelope, now, countryName})   // CD1–CD7 with <h2 id="detail-title" tabindex="-1">, sticky tabs, <table class="rec-table"> rows "best {n} · low {l} · high {h}"
```

```python
# scripts/apply_kind_defaults.py  (Phase 0; R27)
def main(root=ROOT) -> int      # rewrites public/events.json through merge_history.read/apply_kind_defaults/write; envelope byte-identical; idempotent
# scripts/validate_conflicts.py
CONFLICT_KINDS = ('armed-conflict-intrastate', 'armed-conflict-interstate', 'non-state-conflict', 'one-sided-violence')
def validate_conflicts(data, countries, event_ids, now=None) -> dict
def validate_conflicts_repository(root=ROOT, now=None)
# scripts/publish_conflicts.py
def publish(candidates_path, gate_path, out_path, root=ROOT) -> dict
```

**Acceptance:** `validate_data` rejects a missing `kind`, an unknown kind, `contract-default` on `strike`, `source-reread` without sources, `kind_basis` with an extra key, `illustrative` outside examples; accepts the regenerated `events.json`; a test asserts the frozen fixture's `events.json` sha256 is unchanged; `test_kind_regeneration_changes_only_kind_fields` passes (the Phase-0 `events.json` with `kind`/`kind_basis` stripped from every record is byte-identical to the frozen fixture's, so `generated_at`, `last_editorial_review` and `coverage_note` are untouched) and `test_apply_kind_defaults_is_idempotent` passes; the 18 keyword records of §5.2(7) are `collective-action`/`contract-default` on the kind fixture; `validate_conflicts` rejects each of: a `lat`/`latitude`/`coord`/`geom` key at any depth, a `status` key, `deaths` without `low`/`high`, `low > best`, id not `ucdp-{conflict_id}`, id colliding with an event id, `kind`/`type_of_conflict` mismatch, unknown location code, `latest_recorded` mismatch, wrong `activity_basis`, future `last_year`, provisional month inside `last_year`, unsorted years, a `years[]` entry citing a `candidate` source, `http://` source, `method_note` without the fixed sentence, `window.first_year < 2024`, an extra envelope key, "ongoing" in a note; the sample fixture passes; the ingest plus publish reproduce `conflicts-sample/conflicts.json` byte for byte from `ucdp-synthetic/` and the ingest fails on an unmapped location name and on a missing column; `publish` refuses a failed gate and a sha mismatch and drops withheld ids; `build()` succeeds with and without `public/conflicts.json`; `renderConflictRow`/`renderConflictRecord` output contains CD1–CD7, the three activity sentences, bounds beside every figure (regex: no digit sequence in a figure cell without "low" and "high" in the row), none of `ongoing casualt toll front controls escalat`, no `.status`/`.band`/`.side-pill`, and passes the banned scan; the Python and JS kind lists agree (test reads both files); `js/conflicts.js` ≤ 1.5 KB gz.

---

## 10. Phase-0 scaffold checklist (lead; in this order; each step is one commit unless stated)

1. **Branch.** Stay on the assigned branch `ccr-77796c82-ka7vhp` (`== main == fcd35a7`). Confirm with `git fetch origin && git rev-parse origin/main origin/ccr-77796c82-ka7vhp` and `git ls-remote --heads origin` that the data session has not pushed. Try `git push origin HEAD:refs/heads/release/4.1` **once**; if the proxy refuses the name (HANDOFF §2.1 warns it may accept only the assigned branch), record the exact refusal in INTEGRATION_NOTES §4 and keep every 4.1 commit on the assigned branch. Nothing below depends on `release/4.1` existing (R28).
2. **Kind pipeline commit = `PHASE0_SHA`** (the first 4.1 commit, directly on `fcd35a7`, touching pipeline files only, so the data session can base on it without carrying any UI work; R27, R28): `kind` + `kind_basis` in `scripts/validate_data.py` (§6.1) and `merge_history.apply_kind_defaults` (§6.2); new `scripts/apply_kind_defaults.py`; run it once on `public/events.json`; edit `public/examples.json` by hand (§6.2); create `tests/fixtures/snapshot-20261002-kind/` (copies of the two files plus a README "copied at commit …; never edit"); add to `tests/test_pipeline.py`: `test_frozen_fixture_unchanged` (sha256 of `tests/fixtures/snapshot-20261002/events.json`), `test_kind_regeneration_changes_only_kind_fields`, `test_apply_kind_defaults_is_idempotent`, `test_public_events_all_carry_kind`, `test_keyword_records_stay_collective_action` (the 18 ids of §5.2(7) as `KEYWORD_LEADS`) and the kind rejection cases of §9 WP-D. **Acceptance before pushing:** `python3 -m unittest discover -s tests` and `node --test tests/*.mjs` green at this SHA alone; `python3 scripts/build.py` succeeds; `git diff --stat fcd35a7` lists only `scripts/validate_data.py scripts/merge_history.py scripts/apply_kind_defaults.py public/events.json public/examples.json tests/test_pipeline.py tests/fixtures/snapshot-20261002-kind/*`; `public/events.json` still reads `"generated_at": "2026-10-02T22:45:35Z"` and `"last_editorial_review": "2026-10-02T22:45:35Z"`. Push. Then, as a docs-only commit, add the dated update note to `docs/HANDOFF_DATA_REFRESH.md` (top of file and §2.1, §13) naming `PHASE0_SHA` as round 5's `BASE`, and push again; the data session reads the handoff from `origin/ccr-77796c82-ka7vhp` (HANDOFF §2.1 step 5).
3. **Lazy-view split** (§8.1 steps 1–3 and 5, and step 4 for `teaser.js` and the version): `js/teaser.js`, re-exports, dynamic imports with loading/failure/retry/prefetch, `./js/teaser.js` in the import map and preloads, `?v=4.1`, `LAZY` with the three views, the static-graph constant set to the measured graph at this step (the frozen 21 minus `ahead countries about` plus `teaser` = 19). Run both suites; record critical JS and CSS **in bytes** in INTEGRATION_NOTES §4 ("after Phase 0 step 3, 4.1").
4. **Stubs with frozen signatures and 4.0 behaviour.** `js/conflicts.js` (constants; `renderConflictRow` → `''`), imported statically by `js/list.js` and `js/map-view.js`, so the static graph becomes the 20-module set of §8.1 step 5 and `./js/conflicts.js` joins the import map and preloads; `js/conflict-detail.js` (`renderConflictRecord` → the loading paragraph; `./js/conflict-detail.js` in the import map only; `LAZY` gains it; `app.js` holds its `import()`); `scripts/validate_conflicts.py` (`validate_conflicts_repository` → `None` when the file is absent, raises `ValidationError('conflicts validator not implemented in Phase 0')` when present, so nothing can be published through the stub); `scripts/publish_conflicts.py` (refuses); `scripts/ingest_ucdp.py` moved in with its tests and `tests/fixtures/ucdp-synthetic/` (tests may be skipped until the rename lands); `research/round5/README.md`; store, data, model and explore stubs: `filters.kind`, `ui.shadeBy`, `ui.layers`, `data.conflicts`, `CRITICAL.conflicts` + shape + absent rule; `EVENT_KINDS`/`CONFLICT_KINDS`/`KIND_LABELS`/`kindOf`/`kindScope`/`kindsPresent`/`showKindBadges`/`selectConflicts`/`conflictsByCountry`/`findRecord`/`visibleRecords` with trivial bodies; `KIND_KEY`, `ALL_FILTER_KEYS`, `KIND_VALUES`, `SHADE_VALUES`, `readKindParam`/`encodeKindParam`, `readUIState`/`encodeUIState` (R26; `FILTER_KEYS`, `readViewState`, `encodeViewState` untouched); `setShadeBy`/`setLayer`/`retryConflicts` setting state only. **In this same step:** the `tests/browser/smoke.cjs` `allowed()` change of §6.8, because the boot-time request for `conflicts.json` begins here.
5. **`scripts/build.py` and the publish path (R30):** `strip_css_comments` with the quoted-string guard applied to every `.css` in `PUBLIC_COPIES`; `public/conflicts.json` in `PUBLIC_FILES` and `OPTIONAL_FILES`; `build()` calls `validate_conflicts_repository(root)` after the upcoming validator; `tests/test_pipeline.py::test_build_strips_css_comments` and `::test_build_with_and_without_conflicts_file`; `tests/test_shell.mjs` measures CSS as `gz(stripComments(css))` and asserts stripper parity with `build.py`'s regex; `tests/test_site.py` optional-file skip; the verify-job notice in `.github/workflows/pages.yml`; the `.gitignore` lines; the two `docs/DEPLOYMENT.md` sentences of §6.8.
6. **`styles.css` and the shell tests:** tokens of §3.2 in all three blocks; the `.side-pill, .kind` block moved from `css/record.css` to `styles.css` in this one commit (R30); `.view-loading`/`.view-error` rules; in `tests/test_shell.mjs`: `TOKENS`/`LIGHT`/`DARK` additions, the §4.7 global banned words with self-tests, the `.kind` no-colour assertion, the `conflicts.json` guard and `CRITICAL_DATA` entry (R29), the frozen-test sha256 assertion (§0.1 values), and "no `transition` naming `fill` in `css/map.css`".
7. SPEC §19.0 import-table amendment (C-53): `list.js → teaser.js, conflicts.js`; `stamps.js → teaser.js`; `ahead.js, about.js → teaser.js`; `conflicts.js → html.js, model.js, freshness.js`; `conflict-detail.js (lazy) → html.js, model.js, conflicts.js, freshness.js`; `map-view.js → + conflicts.js`; `app.js` dynamic: `map-view, ahead, countries, about, conflict-detail`. Write SPEC §23 "4.1 addendum" header with the Phase-0 measurements in bytes.
8. `public/roadmap.json`: add the §12 items (statuses as given; `updated_at` = the Phase-0 day, `last_reviewed` 2026-10-04); run `scripts/validate_roadmap.py`.
9. Push; open the four WP lanes with this document as their brief. Each brief states that `scripts/build.py`, the `.side-pill, .kind` block, `tests/test_explorer.mjs`, `tests/test_freshness.mjs` and `tests/fixtures/snapshot-20261002/` are closed to every lane.

---

## 11. Tests

### 11.1 Node (`node --test tests/*.mjs`, offline)

| File | New cases |
|---|---|
| test_shell (A; parts land in Phase 0) | 20-module graph and the 7-entry lazy list; `import(` for each lazy module; `./js/conflict-detail.js` in the import map and not in modulepreload; tokens; CSS measured stripped and stripper parity with `build.py`; `conflicts.json` guard and `CRITICAL_DATA` entry; the §4.7 global banned words (including `war map`) with self-tests; `.kind` has no colour rule; `index.html` About copy passes the scan; no `transition` naming `fill` in `css/map.css`; sha256 of `tests/test_explorer.mjs` and `tests/test_freshness.mjs` equal the §0.1 values |
| test_core (B) | `readKindParam`/`encodeKindParam` round trip and rejection; `readViewState` never emits `kind`; `Object.keys(readViewState(''))` equals the 9 `FILTER_KEYS` (line 279 unchanged); `droppedParams('?kind=war&shade=heat')` → `['kind', 'shade']`; `shareURL` with `kind` and `ui`; `readUIState`/`encodeUIState`; `noticeModel` renders the neutral settings line; `initialState` defaults; `setShadeBy`/`setLayer`/`retryConflicts`; `validateFilters` drops; `loadCritical` → `errors.conflicts === 'absent'` on 404, `'error'` on 500 or bad shape; `kindOf` null rule; `kindsPresent`, `kindOptions`, `showKindBadges`; `selectConflicts` by kind/country/region/year/query and empty under a window; `conflictsByCountry` skips null codes; `findRecord`; `visibleRecords`; `controlStates.csvDisabled`; `noticeModel` EC2; `datasetStats` unchanged with the sample loaded |
| test_record (B) | badge only with `showKind`; K6 hidden text; K7 variants; civil-unrest note; both fixtures render in both densities; copy scan extended with the K strings, §4.8 strings and the §4.7 words |
| test_map (C) | `evidenceBandByCountry` edges, unknown rule, ties; `legendHTML` regression and the four conflict-file states of §4.3 (`null`, `'absent'` = 4.0 rows + EC1 note, `'error'`, `'loaded'`); the M2 suffixes; the evidence-mode rows; controls by state and forced colours; `data-focus-key` on every legend input and focus kept across a repaint; the forced-colours conflict-only `Canvas` rule present in `css/map.css`; conflict rows, variants, M11, M12, EC1/EC2; `SHADE_COPY` scoped banned words; `describeCountry` additions; `briefModel` conflict states; `map.css` layer/token rules; no inline style in legend output |
| test_pages (A) | mounts inert without DOM (unchanged); `teaser.js` exports equal the re-exports; stamps T4 row present/absent; R4 has twelve lines |
| test_conflict_ui (D, new) | `renderConflictRow`/`renderConflictRecord` on the sample: CD1–CD7, activity sentences, bounds beside every figure, forbidden strings absent, tabs, no `.status`/`.band`/`.side-pill` |

### 11.2 Python (`python3 -m unittest discover -s tests`, offline)

- `test_pipeline` (D): `test_kind_required_and_enumerated`, `test_contract_default_only_for_collective_action`, `test_source_reread_needs_event_local_sources`, `test_kind_basis_exact_keys`, `test_illustrative_kind_basis_only_in_examples`, `test_public_events_all_carry_kind` (invariant), `test_frozen_fixture_unchanged`, `test_kind_regeneration_changes_only_kind_fields`, `test_apply_kind_defaults_is_idempotent`, `test_keyword_records_stay_collective_action` (kind fixture, the 18 ids of §5.2(7)); and, written in Phase 0 by the lead (R30), `test_build_strips_css_comments`, `test_build_with_and_without_conflicts_file`.
- `test_conflicts` (D, new): the §9 WP-D rejection list; sample passes; `validate_conflicts_repository` returns `None` when absent; publish refusals; Python/JS kind lists agree.
- `test_ingest_ucdp` (D, new): the skeleton's 28 cases renamed to the §6.4 schema plus determinism through publish and the Candidate-month-in-BRD-year warning.
- `test_roadmap`: existing suite over the new items (blocked items name blockers; no "shipped" without test evidence).
- `test_site` (A): optional-file skip; verify job lists `conflicts.json` as optional.

### 11.3 Browser smoke (`tests/browser/smoke.cjs`; lead integrates at Phase 2)

- **Harness.** `allowed()` exempts `/public/conflicts.json` unconditionally (§6.8; landed in Phase 0 step 4). Without it every check fails on the boot-time 404 while the file is absent.

- **26 Shading.** Fresh `#/map` on the 2 Oct and 9 Oct clocks: every `.map-country` computed fill equals its 4.0 fill (compare with a run where `#map-shade` is removed via `page.evaluate`), SH2 pressed, no `data-evidence-band`. Press SH3: every `[data-has-records="true"]` fill is one of the four `--map-evidence-*` computed values; on 9 Oct M2a and M2b read " · none in this view" and M10 names 2 Oct 2026; S5 still above the map; `location.search` contains `shade=evidence`; reload with `?shade=evidence#/map` restores SH3; `?shade=heat` is dropped with the dropped-params line; five sampled cards and list rows on `#/latest` have byte-identical computed colours before and after; nothing animates (no `transition` on the fills); after pressing SH3, `document.activeElement` is the SH3 radio (focus kept across the repaint, `data-focus-key`); with "Protests and strikes" unchecked (sample routed) `#map-shade` is hidden and M2 carries " · hidden by Show on the map".
- **27 Conflict layer with the sample** (`page.route('**/public/conflicts.json', fulfill sample)`): one `pattern.map-conflict-pattern`; `.map-conflict` path count equals the fixture's distinct non-null location countries; a conflict-only country has no gap pattern fill; the `LU` location is reachable although it is too small to show dots at world zoom on 390 px: `[data-country="LU"]` carries `data-conflict="true"` and an `aria-label` containing EC3, the Kind filter lists its record, and its brief opens the record (no assertion is made about visible dots on it); legend rows M2c1/M2c2, M11 with the small-country sentence; `#map-layers` present; `#kind-filter` visible and lists exactly the kinds present; a conflict kind shows the §4.8 section, no band groups, CSV `aria-disabled`; window 7 → M12 and no rows; a conflict record shows CD1–CD7 and no forbidden string; the dates sheet shows "Conflict dataset"; S2 still says 84; with the file routed to a 404 (`route.fulfill({status: 404})`, so this holds after the data session publishes the file), EC1 appears as the single `legend-note[data-kind="conflicts-absent"]`, in About and in the dates sheet, `#map-layers` and `#kind-filter` are absent, and no `disabled` layer option exists.
- **28 Forced colours** (`page.emulateMedia({forcedColors: 'active'})`, sample routed): SH3 `disabled` with SH5; the computed `fill` of a conflict-only country's path equals the computed `background-color` of a probe element styled `background: Canvas` (the author `--map-land` must not win, §3.5); the `LU` path has the same fill; computed backgrounds of the `gap`, `conflict`, `both` and `reported` swatches are four different images; screenshots of the legend and a conflict country at 390 and 1440 (recorded in the hand-off); a grayscale conversion of the legend screenshot shows dots, lines and solid as three textures (visual check recorded when no decoder is available).
- Existing: 1 adds the view-failure state (block `js/countries.js`), 2 and 8 wait for the lazy views, 13 and 17 run with SH3 pressed as well, 14 carries the §4.7 words.

### 11.4 Editorial acceptance (editorial §9, run by the lead at Phase 3)

1. Fresh `#/map` on both clocks: every fill equals its 4.0 fill; SH2 pressed; no `data-evidence-band`. 2. SH3 on 9 Oct: no country in the 72 h or 3–7 day step; both rows " · none in this view"; M10 names 2 Oct 2026; S5 visible. 3. Fills under SH3 are ramp members only; no `--warn`/`--danger` on the map. 4. No §4.7 global word in DOM text or scanned attributes on any view, sheet or clock; `SHADE_COPY` passes the scoped test. 5. Cards, rows, badges, directory and brief are colour-identical to 4.0 with SH3 pressed. 6. `conflicts.json` absent: EC1 as the single absent note in the legend, in About and in the dates sheet; no `#map-layers`, no disabled option, no Kind filter; no badge; K7 with suffix on every record; the browser console shows the one 404 of the absent file and nothing else. 7. With the sample: CD1–CD7, bounds on every figure, no forbidden strings, Kind filter lists only kinds present. 8. The 18 keyword records of §5.2(7) stay `collective-action`/`contract-default`. 9. Forced-colours screenshots: dots, lines and solid are three textures; grayscale likewise. 10. Window 7 or 30 with the layer on: M12 present; no conflict on map or list. 11. Dates sheet shows "Conflict dataset" apart from "Snapshot assembled" and "Newest evidence"; changing only `conflicts.json` leaves the chip unchanged. 12. `roadmap.json` validates; blocked items name their blockers; nothing new is "shipped".

---

## 12. Roadmap (`public/roadmap.json`; `last_reviewed` 2026-10-04; `shipped_in`/`shipped_on` null; `evidence` [] until tests land, then `test` refs; the lead flips to shipped only under SPEC §22.4)

| id | title | area | status | blocked_by | depends_on | summary | acceptance |
|---|---|---|---|---|---|---|---|
| `lazy-views-and-budget-headroom` | Lighter first load before new features | infrastructure | **in-progress** | null | [] | The critical script budget had about 600 bytes of room. Ahead, Countries and About now load when first opened, and the build strips comments from stylesheets, so new features fit without raising any ceiling. | Critical JS at least 15 KB under its ceiling after the split and CSS at least 4 KB under; ceilings unchanged; the modulepreload set equals the 20-module static graph; loading and failure states for the three views are tested. |
| `shading-by-newest-evidence` | Shading by date of newest evidence (opt-in) | map | **in-progress** | null | [`lazy-views-and-budget-headroom`] | An optional map shading that follows the newest cited evidence per country, in one hue, off by default, legended, and never a measure of size, severity or whether a protest continues. | Default map identical to coverage-only; control and legend copy per the 4.1 editorial deck; the ramp passes the palette validator in both modes on land and ocean; on a stale clock every band in view is pale and the legend says nothing is newer than the snapshot date; URL `shade=evidence` reproduces the view and is never stored; no new banned word in the DOM. |
| `colour-blind-patterns` | Patterns alongside colour | accessibility | **in-progress** | null | [`lazy-views-and-budget-headroom`] | Textures, not only hue, carry meaning on the map: the coverage-gap hatch today, and two-tone dots for UCDP conflict locations once conflict records are published. Legend swatches, high-contrast mode and print use the same textures, so the map reads under colour-vision deficiency. On the deployed site only the gap hatch is visible until the conflict dataset lands. | Gap hatch and conflict dots differ in geometry; one of the two dot inks clears 3:1 on every fill in both modes; distinct under simulated protanopia and deuteranopia, in forced-colours mode and in a grayscale print; every pattern has a text legend row; no texture on cards; the conflict dots are exercised by the labelled test fixture, not by live data, until `armed-conflict-context-layer` unblocks. |
| `kind-field-collective-action` | A kind on every record, set by the pipeline | data | **in-progress** | null | [] | Every record states its kind. The 84 existing records are 'collective action', the research contract's own term, with the basis recorded; nothing is guessed from titles or tags. | `kind` and `kind_basis` on all records; the validator rejects a non-default kind without an event-local source; filter and badge appear only when more than one kind exists; the frozen 2 Oct fixture is untouched and a new kind fixture pins the literals. |
| `kind-subtyping-by-source-reread` | Protest, strike and civil unrest from a re-read source | editorial | **blocked** | "The research environment cannot open news websites, so no cited source can be re-read. Needs the same access as adding reports (a fetch-capable connector or a network allowlist for news domains)." | [`add-reports-after-2-oct-2026`, `kind-field-collective-action`] | A record becomes a protest, a strike, or civil unrest only after an agent re-reads the cited source and records its own words, including who the source says did what. | Each re-typed record cites the re-read source; 'civil unrest' requires the source's own attribution of violence to participants; no record is re-typed from its title, id or tags; the 18 keyword matches stay 'collective action' until re-read. |
| `ucdp-ingest-and-validator` | Offline ingest, validator and publish step for UCDP conflict data | data | **in-progress** | null | [] | Scripts turn downloaded UCDP files into a separate conflict dataset with parties, years, and best, low and high death estimates; a validator refuses coordinates, individuals, single death figures and any status, danger or trend field; a publish step applies the gate review. | `scripts/ingest_ucdp.py` runs from local CSVs without network; `scripts/validate_conflicts.py` enforces the exact keys and refusals of the 4.1 spec; `scripts/publish_conflicts.py` refuses a failed gate; labelled synthetic fixtures exercise all three; the build allowlist and `test_pipeline` know the optional file. |
| `armed-conflict-context-layer` | Armed conflict as a re-published UCDP context layer | data | **blocked** | "This environment cannot reach ucdp.uu.se or ucdpapi.pcr.uu.se, and the UCDP licence and citation have not been read on the download page. Needs the data session with network access to UCDP hosts, the terms read on the page, and a gate-reviewed candidates file." | [`ucdp-ingest-and-validator`, `colour-blind-patterns`, `kind-field-collective-action`] | Countries UCDP lists as conflict locations are dotted on the map and each conflict has a record with UCDP's parties, years and death estimates with bounds. It is context, not Protest Atlas research, and not a front-line map or a rating of how serious a conflict is. | Records pass the validator; licence and citation come from the downloaded terms; the window states years and provisional months actually present; every death figure carries low and high bounds, a year and a version; no 'ongoing', no coordinates, no score; the empty state shows until the file exists. |
| `build-time-js-minifier` | Comment stripping for scripts at build time | infrastructure | **later** | null | [`lazy-views-and-budget-headroom`] | Scripts ship with their contract comments (about 14 KB gzip). A tokenizer-based tool, not a regular expression, would strip them at build time and the budget test would measure the served output. | A tokenizer-based stripper with a test run against the built output; template literals and regular-expression literals untouched; the budget test measures scripts as served; ceilings unchanged. |

**Existing items:** no content change. The four 4.0 interface items stay `in-progress` until a smoke run against the live URL or a recorded phone check exists (RELEASE_EVIDENCE); if 4.1 verification produces that evidence, the lead flips them in the same commit as RELEASE_EVIDENCE. `updated_at` bumps to the Phase-0 day. `roadmap.note` unchanged. R4 "What we will not build" (`js/ahead.js`) gains the four §7.4 lines.

---

## 13. Documents to update (and the two editorial amendments, exact text)

| Document | Change |
|---|---|
| `docs/design/EDITORIAL_GUIDANCE.md` §3.2 | Replace the last bullet with: "Badges are neutral ink on neutral fill in every band. Hue never encodes recency on cards, list rows, badges, the directory, the brief or the Ahead page. On the map only, the **lightness** of the single coverage hue may encode the date of each country's newest cited evidence, and only while the reader has pressed 'Shade countries by: Date of newest evidence' (4.1 editorial §2). The default is coverage only, the legend names the clock, and the staleness notice is unchanged." |
| `docs/EDITORIAL_POLICY.md` → v1.3 | Add: the conflict-layer purpose sentence ("Armed conflict records are re-published context from UCDP, so that protest coverage is not read in a vacuum; they are not Protest Atlas research and they do not make this atlas a conflict tracker."); the kind rule (§5.1 first row and the re-read rule); the civil-unrest rule (§5.2 items 1–3); the §3.2 map-shading exception. Nothing else changes. |
| `docs/design/SPEC.md` | §17.1 tokens of §3.2 with the measured contrasts; §17.2 the §3.3 output and the "validated, not adopted" record; §18.1 the §4.7 words and the feature-scoped `newest` regex `\bnewest\b(?! (cited )?evidence)`, recorded as a one-word amendment of the 4.1 editorial deck §2.5 (whose literal rule failed on its own SH4); §18.4 the strings of §4.2–§4.5 and §4.8; §19.0 the import-table amendment (C-53) and the 20-module graph; §19.1 the `legend-control`, `map-conflict*`, `kind`, `conf-*`, `card--conflict`, `view-loading/-error` classes; §23 "4.1 addendum" with Phase-0 measurements, the resolutions table of §2 and the smoke checks 26–28. |
| `docs/design/TECH_ARCHITECTURE.md` | §3.2/§3.3 new files and `PUBLIC_FILES`; §4.4 state additions; §4.6 the exports of §9; §4.7 ids `map-shade`, `map-layers`, `kind-filter`; §4.8 `data-action` values `retry-view retry-record retry-conflicts`; §4.9 tokens and the recorded `.filter-segment` exception; §5.2/§5.6 `update` keys, attributes, patterns and the overlay; §6.2 the CSS-as-served rule and the `conflicts.json` guard. |
| `docs/design/INTEGRATION_NOTES.md` §4 | Rows "after Phase 0, 4.1" and "after 4.1" with measured bytes. |
| `docs/design/OPEN_SOURCE_RESEARCH.md` | Add a UCDP row (GED, Candidate, ACD, BRD, codebooks): licence **unconfirmed**, to be read on the download page; citation requested; decision "adopt as a re-published context layer". |
| `docs/HANDOFF_DATA_REFRESH.md` | **Phase 0 (lead):** a dated update note at the top and in §2.1: round 5 and any later refresh base on `PHASE0_SHA` (the 4.1 kind-pipeline commit on `ccr-77796c82-ka7vhp`) unless `origin/main` already contains it, with the `BASE=` lines of §6.2; §2.2's two-way ownership paragraph gains "the kind defaults are additive and `merge_history.py` at `$BASE` applies them". **WP-D:** new §10 from `handoff-round5.md`, with the §6.4 schema, the §6.7 publish step, the `location` null-code rule, the "no estimator mixing" rule, and §10.8 reading "the base is `PHASE0_SHA` or `origin/main` if it contains it" instead of "the base is `origin/main`". |
| `docs/DEPLOYMENT.md` | CSS served comment-stripped; `conflicts.json` optional in the verify job; the live-site 404 of `public/conflicts.json` while the file is absent documented as the designed absent state (§6.8); version 4.1 cache keys. |
| `docs/MAP_IMPLEMENTATION.md` | Shading mechanism, overlay layer, pattern scaling loop, forced-colours behaviour, the two-ink contrast table. |
| `CHANGELOG.md`, `docs/ROADMAP.md`, `docs/RELEASE_EVIDENCE.md` | 4.1 entry at release; the roadmap flips with evidence. |

---

## 14. Risks (consolidated; each has an owner in a WP)

| Risk | Mitigation (WP) |
|---|---|
| A builder reaches for a hue for kind, a red pole or a "heat" word | Tokens are the only colour source; test_shell asserts no `.kind` colour rule and the ramp hexes in `LIGHT`/`DARK`; map.css test asserts fills only from tokens; §4.7 words in `BANNED` (A, C) |
| Shading on by default, remembered or triggered by a filter or deep link | URL-only state; smoke 26 fresh-load equality; no `localStorage` anywhere (grep test) (A, B) |
| On 9 Oct the shaded map reads as "the world went quiet" | Default off; M10 from data; empty-band suffix; S5 unchanged (C) |
| Kind guessed from keywords, ids or tags | `kind_basis` required; validator rejects non-default kinds without sources; `kindOf` never derives; 13 ids pinned (D, B) |
| Empty conflict layer read as "no wars" | EC1 "Absence is not peace" in the legend, About and dates sheet; EC4 threshold wording (B, C) |
| Conflict and gap textures indistinguishable under CVD, forced colours or print | Dots vs lines; two inks; smoke 28 screenshots and grayscale check (C) |
| A conflict record says "ongoing", uses the 72 h clock or shows a single figure | Validator refuses `status` and the words; `activity_basis` enum; bounds required; `observationBand` never reads conflicts (D, C) |
| UCDP licence or thresholds quoted from memory and published | Blocked status; manifest requires the licence and citation as read; gate compares; About copy follows the codebook (D, data session) |
| Protest and conflict counts summed or compared | Separate datasets; `datasetStats`, S2, CSV and overview never see conflicts; tests assert 84 stays 84 (B) |
| A UCDP download re-stamps the site as current | Separate T4 row; staleness from protest evidence only; `WINDOW_END` untouched (B, data session) |
| Feature work raises a ceiling | Phase 0 first; per-WP caps; ceilings unchanged in test_shell (A) |
| The data session edits `merge_history.py` concurrently | Phase 0 pushes first and names the SHA; the kind defaults are additive (lead) |
| The frozen fixture gains a `kind` by accident | README rule; sha256 test (D) |
| `.filter-segment` reuse inside the legend breaks when WP-B restyles it | Recorded exception: WP-B does not change those rules in 4.1 (B, C) |
| The boot-time 404 of the absent `conflicts.json` turns every smoke check red, or alarms a visitor reading the console | `allowed()` exemption in Phase 0 step 4; DEPLOYMENT note; verify-job notice; EC1 explains the state in three places (lead, A) |
| A lane edits a frozen test, or widens `readViewState` so the 9-key deep-equal fails without any edit | sha256 assertion on both frozen tests; `kind` in its own codec; `Object.keys(readViewState(''))` test unchanged (A, B) |
| Phase 0 re-stamps the snapshot without new research | `apply_kind_defaults.py` writes `events[]` only; `test_kind_regeneration_changes_only_kind_fields`; the Phase-0 acceptance reads the stamps (lead) |
| The data session bases on `origin/main` and regenerates `events.json` without `kind`, or conflicts in `merge_history.py` | Pipeline commit first and alone; HANDOFF names `PHASE0_SHA` as `BASE`; `merge_history.py` at `BASE` applies the defaults (lead) |
| Forced colours paint a conflict-only country in an author colour | Explicit `Canvas` rule in the forced block; smoke 28 computed-fill check; test_map text assertion (C) |
| Keyboard focus lost on every legend repaint | `data-focus-key` on each input; smoke 26 and test_map (C) |
| A reader of the Ahead page looks for a conflict texture that cannot appear yet | `colour-blind-patterns` summary says what is visible now (A) |

---

## 15. Open items that remain after this spec (honest list)

1. UCDP licence, citation, dataset versions, column names, thresholds, `start_date`/`start_date2` semantics and the Gaza/West Bank placement must be confirmed by the data session from the downloaded files and codebooks before any conflict record is published; this spec's copy follows the codebook if they differ.
2. The two editorial amendments (§13) and the §4.8 copy are AI decisions; no human editorial owner exists to adopt them. They are recorded as such in the policy's version line.
3. Whether the four 4.0 interface items can flip to shipped depends on a live-site check 4.1 verification may or may not be able to run.
4. Non-state and one-sided UCDP categories are allowed by the schema and off by default in the ingest; turning them on is a data-session flag plus the About sentence, not a schema change.
5. Kosovo (no ISO code) ships, if at all, by UCDP name without map placement (R11); the gate may still withhold such a record.
6. Whether `git push origin HEAD:refs/heads/release/4.1` succeeds through the cloud git proxy is unknown until tried (§10 step 1); the plan does not depend on it.
7. The data PR into `main` will carry `PHASE0_SHA` (validator, merge defaults, regenerated `events.json`, kind fixture, tests) as the round-4 PR carried `e633dfe`; a person merges it under DEPLOYMENT's editorial approval, and that merge deploys `events.json` with `kind` to the 4.0 interface, which ignores the field (`SHAPES.events`; 39,110 B gzip against the 120 KB guard). Deploying 4.1 itself to `main` is a separate decision the owner takes (task 18).
8. R25 (an EC1 note instead of editorial §3.4's disabled layer option) and the one-word `newest` regex amendment are AI editorial decisions recorded here and in §13; no human editorial owner has adopted them.

---

## 16. Revision log

**Revision 2, 4 Oct 2026**, by the lead after the critic's review of revision 1. The critic's verdict: the palettes, WCAG figures and hard facts reproduce, the editorial resolution is consistent with EDITORIAL_POLICY and EDITORIAL_GUIDANCE, but one blocker and six majors had to be fixed before the four lanes could start. Every finding below was re-verified against the repository in this session before the change was written (§0.1 lists the facts); nothing in §1–§8's encoding, copy or data model changed except where a row says so.

| # | Severity | Finding (critic) | Change in revision 2 | Where |
|---|---|---|---|---|
| 1 | blocker | WP-B listed `tests/test_explorer.mjs` and §11.1 added a case there; widening `readViewState` to 10 keys fails its 9-key deep-equal even if the file is never edited. | `readViewState`/`encodeViewState`/`FILTER_KEYS` unchanged; `kind` in its own codec `readKindParam`/`encodeKindParam`, merged by `app.js`; `ALL_FILTER_KEYS` for actions; `test_explorer.mjs` removed from WP-B and §11.1; kind round-trip cases moved to `test_core`; test_shell asserts the sha256 of both frozen tests (values in §0.1). | R26, D11, §4.6, §9 WP-A/WP-B, §11.1, §14 |
| 2 | major | Forced-colours fill bug: the `--map-land` rule for conflict-only countries (0,3,0) beats 4.0's forced-colours `.map-country` rule (0,1,0) and `.map-svg` has `forced-color-adjust: none`. | Explicit `.map-country[data-conflict="true"]:not([data-has-records="true"]) { fill: Canvas; stroke: CanvasText; }` in the forced block; smoke 28 computed-fill check; test_map text assertion. | §3.4, §3.5, §9 WP-C, §11.3 |
| 3 | major | Absent-conflict legend state contradicted itself (4.0-identical vs EC1; EC6 could never render). | Four explicit `conflicts` states (`null`, `'absent'`, `'error'`, `'loaded'`) with a table; `'absent'` = 4.0 rows + one EC1 note and no `#map-layers`; EC6 deleted; deviation from editorial §3.4 recorded as R25; `#map-layers` only when `'loaded'` (R24 narrowed); WP-C acceptance and smoke 27 updated. | §4.3, R24, R25, §9 WP-C, §11.3, §11.4, §15 |
| 4 | major | Phase 0 regenerated `events.json` through `merge_history.assemble()`, re-stamping `generated_at`/`last_editorial_review`. | `scripts/apply_kind_defaults.py` rewrites `events[]` only through `merge_history.write` (byte-identical envelope, idempotent); `test_kind_regeneration_changes_only_kind_fields` and `test_apply_kind_defaults_is_idempotent`; Phase-0 acceptance reads the stamps. | R27, D4, §6.2, §9 WP-D, §10 step 2, §11.2 |
| 5 | major | Branch and handoff plan unfollowable: `release/4.1` may be refused by the proxy; the data session branches from `origin/main`, which lacks the kind pipeline. | The kind pipeline is the first 4.1 commit, alone, on the assigned branch (`PHASE0_SHA`); HANDOFF §2.1 and §10.8 base round 5 on it unless `origin/main` contains it; `release/4.1` tried once, not relied on. | R28, D7, §6.2, §10 steps 1–2, §13, §15 |
| 6 | major | Boot-time 404 of `conflicts.json` fails every smoke check and shows in every visitor's console. | `allowed()` exempts `/public/conflicts.json` unconditionally, in the Phase-0 step that adds the boot request; DEPLOYMENT documents the production 404 as the designed absent state; smoke 27's absent sub-check routes a 404 explicitly. | §6.8, §10 step 4, §11.3, §14 |
| 7 | major | Import map lacked `./js/conflict-detail.js`; test_shell requires one entry per `js/*.js` and the dynamic import would bypass the cache key. | Entry added (no `modulepreload`); named in §8.1 step 4, §10 step 4 and WP-A's acceptance. | §8.1, §9 WP-A, §10, §11.1 |
| 8 | minor | Feature-scoped ban on `newest` not followed by "evidence" failed on SH4's "the newest cited evidence". | Regex `\bnewest\b(?! (cited )?evidence)`; recorded as a one-word amendment of editorial §2.5. | §4.7, §13 |
| 9 | minor | Conflict pattern rings clipped at the 8-unit tile edge. | 10-unit tile, centres (2.5, 2.5)/(7.5, 7.5), r 2.5/1.5, `data-period="10"`, `scaleMarks` divides by each pattern's own `width`; legend swatch gradients and the forced-colours swatches follow. | §3.4, §3.5 |
| 10 | minor | Keyboard focus lost on the new legend controls after every repaint. | `data-focus-key` on all four inputs; focus assertions in test_map and smoke 26. | §4.1, §9 WP-C, §11.1, §11.3 |
| 11 | minor | Budget arithmetic mixed 1,000-byte and 1,024-byte units; map headroom overstated. | All expected sizes in bytes with KB (1,024) in brackets: 74,896 B after Phase 0 (headroom 18,288 B); 82,576 / 24,708 / 166,349 B after 4.1; map headroom corrected to 7,731 B (≈ 7.5 KB). | header, §8.1 step 7, §8.2 |
| 12 | minor | The 13 keyword records were never enumerated and the count was not reproducible. | Regex, field set and command stated; the reproducible list is **18** ids (0 for war/armed wording), pinned as `KEYWORD_LEADS`; every "13" replaced. | §0.1, §5.2(7), §6.3, §9 WP-D, §10, §11.2, §11.4, §12 |
| 13 | minor | §4.7 claimed no new banned word occurs in the public JSON; `heat` ×2 and `surge` ×1 occur inside ledger URLs. | Sentence corrected: no occurrence in rendered copy or JSON text values; the three URL hits named. | §4.7 |
| 14 | minor | `conflicts.json` sidestepped the critical-data ceiling. | In `CRITICAL_DATA` (absent = 0) and under its own 24 KB guard. | R16, R29, §6.8, §10 step 6 |
| 15 | minor | Layer-off and Kind-filtered states undefined (M2, EC3, shading control). | M2 suffixes " · hidden by Show on the map" / " · hidden by the Kind filter"; EC3f for the brief and tooltip; `#map-shade` hidden while the episode layer is off; S4–S6 unaffected. | §4.1, §4.3, §4.4, §4.5, §7.3, §9 WP-C |
| 16 | minor | "war map" promised for the banned list in §0 but missing from §4.7. | Added as a whole phrase with self-tests; bare `war` stays allowed for the UCDP intensity label. | §4.7, §11.1 |
| 17 | minor | `colour-blind-patterns` summary promised a conflict texture that cannot appear on the deployed 4.1. | Summary and acceptance say the dots show once UCDP records are published and what is visible now; §0 row says the same. | §0, §12, §14 |
| 18 | minor | Small-territory legibility unaddressed. | `LU` in the sample fixture; smoke 27 asserts reachability through attributes, filter and brief without asserting dots; smoke 28 checks its forced-colours fill; M11 gains "Small countries may show no dots at world scale; their records are in the list." | §0.1, §4.3, §6.3, §11.3 |
| 19 | minor | Cross-package edits without an owner (`build.py`, `test_build_strips_css_comments`, `.side-pill` move). | All three are Phase-0 work by the lead; `scripts/build.py` removed from WP-A's files; lanes told the files are closed. | R30, D7, §6.5, §7.6, §8.1, §9 WP-A, §10 steps 5–6, §11.2 |
| 20 | minor | Dropped `?shade=heat` reported with "Some link filters were not applied". | Neutral line "Some link settings were not recognised and were removed: {names}." replaces the 4.0 string in `js/notice.js`; tested in test_core. | §4.6, §9 WP-A/WP-B, §11.1 |
| 21 | lead's own | Revision 1's sample-fixture record id `ucdp-test-a` (WP-A acceptance, §11.3) violates §6.4's `^ucdp-\d+$` = `ucdp-{conflict_id}`. | Fixture ids `ucdp-900001` … `ucdp-900004` with integer `conflict_id`s, stated in §6.3 and WP-A's acceptance. | §6.3, §9 WP-A |
| 22 | lead's own | §6.4's `dataset_family` cell used unescaped `\|` separators, breaking the schema table's columns. | Separators changed to `/`. | §6.4 |

**Not changed, deliberately.** The ramp hexes and validator output (§3.2–§3.3), the kind vocabulary (§5.1), the conflict schema (§6.4), the copy of §4.2, §4.4, §4.8 and §5.3, the roadmap statuses, and the two editorial amendments of §13 stand as in revision 1; the critic confirmed each against the repository and the dataviz validator. R16 (critical load with 404 tolerated) stands because the legend, Kind filter and brief must know the absent state at first paint; the alternative the critic offered (lazy load with a loading state in the legend) is recorded here as not taken.

**Consistency pass.** After the edits above the document was searched for the superseded terms: no remaining "13 keyword", "EC6" outside R25 and §4.3's deletion line, "release/4.1" as a dependency, 1,000-byte KB figures, "loaded or errored", 8-unit dot geometry, or `test_explorer` as a lane file.
