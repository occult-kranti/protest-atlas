# Protest Atlas 4.1 — Encoding design: colour, pattern and kind

Author role: encoding designer (data visualisation and accessibility) on the 4.1 panel. AI agent; no human designer or editor reviewed this. Written 4 Oct 2026 against the deployed 4.0 (`fcd35a7`, clean tree). Read-only against the repository; every number below was computed with the dataviz skill's `validate_palette.js` (exported `validate`, `validateOrdinal`, `contrast`) or with the same OKLab and Machado-2009 maths copied from it, never estimated by eye. Scripts and raw output sit beside this file (`palette*.mjs`, `search-*.txt`, `validator-*.txt`).

Binding references, in order of precedence: `docs/EDITORIAL_POLICY.md` v1.2 and `docs/design/EDITORIAL_GUIDANCE.md` (colour means publication coverage; no severity score; "not established" never zero; nothing reads as live; §2 banned vocabulary; §3.2 "hue never encodes recency" on badges) · the dataviz skill (`SKILL.md`, `color-formula.md`, `palette.md`, `anti-patterns.md`, `marks-and-anatomy.md`) · `docs/design/SPEC.md` §11, §17, §23 · `docs/design/TECH_ARCHITECTURE.md` §4.9, §5.6 · `inputs.md` (the six questions).

Surfaces every fill was validated against: light ocean `#e4e9e3`, light land/card `#f2f2ec`; dark ocean `#0e1311`, dark land `#2b312e`. Choropleth rule: `--pairs all`.

---

## 0. Decisions at a glance

| # | Decision | Where |
|---|---|---|
| D1 | "Hot/cold" is **not** a thermal red–blue scale. The only honest thing a colour scale can encode here is **how recently a cited source reported activity or a development** (the existing `observationBand`). It is offered as an opt-in "Colour by: Newest evidence" mode; coverage-only stays the default. The words hot, cold, heat, active, hotspot never appear. | §1 |
| D2 | The recency scale is **sequential, one hue (the coverage ochre), four ordinal steps + a neutral**, not diverging: there is no honest baseline for a midpoint, and a red pole would read as "live/danger" (editorial §3.1 "no red"). Newest = farthest from the surface (darkest in light, lightest in dark: the anchor flips). The existing `--map-reported` ochre is a step of the ramp, so Coverage and Newest-evidence modes share a colour. | §1, §2.1 |
| D3 | "Date not established" is a **neutral grey with an always-on cross-hatch**, never a zero or a ramp end. | §2.3, §5 |
| D4 | Kind on the map is **three hue families**, the cap the all-pairs rule allows: **ochre = protest or strike** (the existing coverage hue; every 4.0 record lands here), **blue = civil unrest**, **mauve = armed conflict**. The two within-family sub-kinds (strike; interstate) are **folded on the fill and faceted** through a Kind filter, and named on every card, row and brief. A country whose matching records span more than one family is painted "**Several kinds**" (neutral + cross-hatch), never the "most serious" one. | §4 |
| D5 | Textures: gap = 45° sparse lines (unchanged, always on); several kinds / date not established = cross-hatch (always on); **civil unrest = 135° lines; armed conflict = dots** — the last two switch on with a visible **Patterns** control, under `forced-colors`, and in print. Hue alone is validated for the three families (worst CVD ΔE 14.8), so this follows the skill's "texture is opt-in" rule while still giving colour-blind readers a one-tap pattern layer. | §4.3, §5, §6 |
| D6 | One **"Colour by"** segmented control (Coverage · Newest evidence · Kind) in flow under the stage, above the legend; the mode is in the URL (`?colour=`), not a filter, never persisted; nothing animates. The legend is rebuilt per mode and keeps M3–M9. | §7, §8 |
| D7 | Cards and list rows carry a **kind badge** (text + 14 px swatch in the kind family colour and pattern) and keep the **neutral band badge**; the band text is the recency carrier off the map, so hue never encodes recency on cards (editorial §3.2 is kept). | §9 |
| D8 | Status colours (`--ok --warn --danger`, status symbols) stay reserved; none is reused for a kind. The one same-family pair (dark ochre vs `--warn`/`--danger` text, 13.6/14.0) is a 4.0 condition already mitigated by icon + label. | §10 |
| D9 | Deviations from the skill, each with its relief: the pale "over 30 days" step at 2.2–2.4:1 (ordinal floor is 2:1; band is on every card); the neutral grey 12.5–14.1 ΔE from the nearest hue (its cross-hatch is mandatory); the recency option is withheld under `forced-colors` (no lightness there; the Reports list carries the same grouping). | §12 |

---

## 1. What "hot/cold" may honestly encode (question 1)

**Candidates examined.**

| Candidate | Verdict | Why |
|---|---|---|
| Intensity, severity, "activity", crowd size, number of episodes | Rejected | Editorial policy: no combined severity score; counts cannot be compared across uneven coverage; the data holds no numbers (turnout min/max null 84/84). A warm colour for "more" would be exactly the "Hotspots / Escalating" framing the banned list forbids. |
| Status (ongoing / ended) | Rejected | Status is already a reserved text-plus-symbol scale; the shadow already marks a sourced ending. Colouring it would double-encode and could read as live. |
| Recency of newest evidence (`observationBand`: within 72 h / 3–7 d / 7–30 d / over 30 d / not established) | **Accepted, opt-in** | It is the one time dimension the data supports, it is already a sorting aid in Reports (grouped by band), it is computed from `last_observed_at` only, and it ages honestly: on 9 Oct 2026 no country is in the two newest steps and the map visibly fades. It must be labelled as evidence recency, never as what is happening now. |
| Nothing (reject the feature) | Not taken | The reader's request ("hot/cold") is a request to see where the dataset is recent versus old. That is answerable; only the thermal metaphor is not. |

**Sequential, not diverging.** The skill allows diverging only for polarity around a neutral midpoint that reads as "nothing". The 72-hour rule is a threshold, not a baseline: one band on one side, three on the other, and no band means "nothing". A red↔blue thermal pair was rejected for a second reason: editorial §3.1 forbids red and anything that looks like a live indicator for the 72-hour band, and red↔blue would make the five freshest countries read as danger. So: **one hue, four ordinal steps, `--ordinal` validated**, with "not established" off the ramp as a neutral.

**Which hue.** The coverage ochre. In Coverage mode every published country is `--map-reported`; in Newest-evidence mode the same hue is stepped, so the mode reads as "the same coverage, shaded by evidence age" rather than a different map. The skill's default sequential blue was rejected because blue is the focus-ring family and is now the civil-unrest family (§4).

**Direction.** The quantity encoded is recency (more recent = more). The lightest step recedes toward the surface and means "near zero recency": **over 30 days**. In light mode the newest band is the darkest step; in dark mode the anchor flips and the newest band is the lightest step. In both modes "newest = farthest from the surface", so emphasis is consistent. The alternative (keep ochre for "over 30 days" and add darker steps for newer bands) was rejected: it needs a step at L ≈ 0.34 that approaches the ink selection outline and the city dots, and it makes the stale map look identical to the coverage map.

**What the ramp never says** (legend footnote, §7): whether a protest is happening now, how many episodes there were, how large or how severe. Status still leads on every card; the band badge stays neutral text.

---

## 2. Token table

All hexes are documented palette values (skill check 6). Light values go on `:root`; dark values under both `@media (prefers-color-scheme: dark) { :root[data-color-scheme="auto"] }` and `:root[data-color-scheme="dark"]`, as every other token. OKLCH figures are from the hexes.

### 2.1 Recency ramp (`--ordinal` validated, one hue, ΔL ≥ 0.06 between steps)

| Token | Band (F1–F4 badge text) | Light hex | OKLCH L / C / h | vs ocean `#e4e9e3` | vs land `#f2f2ec` | Dark hex | OKLCH L / C / h | vs ocean `#0e1311` | vs land `#2b312e` |
|---|---|---|---|---|---|---|---|---|---|
| `--map-recency-72h` | Within 72 h | `#714402` | 0.430 / 0.094 / 68° | 6.74 | 7.39 | `#d4984d` | 0.723 / 0.117 / 70° | 7.50 | 5.31 |
| `--map-recency-7d` | 3–7 days ago | `#935a04` | 0.520 / 0.113 / 67° | 4.61 | 5.04 | `#bd8236` *(= `--map-reported` dark)* | 0.653 / 0.116 / 70° | 5.72 | 4.05 |
| `--map-recency-30d` | 7–30 days ago | `#b4772a` *(= `--map-reported` light)* | 0.620 / 0.118 / 68° | 3.04 | 3.33 | `#a76d1c` | 0.583 / 0.116 / 69° | 4.33 | 3.07 |
| `--map-recency-older` | Over 30 days ago | `#ce9046` | 0.701 / 0.117 / 69° | 2.22 ‡ | 2.43 ‡ | `#8e5a04` | 0.513 / 0.110 / 70° | 3.23 | 2.29 ‡ |
| `--map-scale-none` | Date not established (also "Several kinds") | `#6f6f6f` + cross-hatch | 0.540 / 0 | 4.08 | 4.47 | `#9e9e9e` + cross-hatch | 0.700 / 0 | 7.00 | 4.96 |

Validator: **ordinal PASS** in light on ocean and land, and in dark on ocean and land (§3). ‡ = the pale end sits at 2.2–2.4:1, above the ordinal 2:1 floor and below the 3:1 mark rule; relief channel: the band is printed on every card, list row and brief, and the gap hatch separates this step from bare land. Adjacent-step distances (information, not a gate): light normal ΔE 8.1 / 10.0 / 9.2, CVD min 8.1 / 9.9 / 8.5; dark 7.1 / 6.9 / 7.1, CVD 7.1 / 6.9 / 6.8. Dark is anchored on the existing dark ochre as the 3–7 day step, so steps are 0.07 L apart instead of 0.09; in dark the legend ramp with ticks carries the step identity.

### 2.2 Kind hues (categorical, `--pairs all` validated in both modes on both surfaces)

| Token | Family | Light hex | OKLCH L / C / h | vs ocean | vs land | Dark hex | OKLCH L / C / h | vs ocean | vs land |
|---|---|---|---|---|---|---|---|---|---|
| `--map-kind-collective` | Protest or strike (alias of `--map-reported`) | `#b4772a` | 0.620 / 0.118 / 68° | 3.04 | 3.33 | `#bd8236` | 0.653 / 0.116 / 70° | 5.72 | 4.05 |
| `--map-kind-unrest` | Civil unrest | `#4c83de` | 0.616 / 0.150 / 260° | 3.04 | 3.33 | `#5991ed` | 0.661 / 0.150 / 260° | 5.98 | 4.24 |
| `--map-kind-armed` | Armed conflict | `#7b3660` | 0.440 / 0.109 / 345° | 6.72 | 7.36 | `#a9628b` | 0.589 / 0.105 / 345° | 4.29 | 3.04 |

Validator: **ALL CHECKS PASS**, light and dark, ocean and land (§3). Worst all-pairs CVD ΔE 20.9 light (mauve↔blue, deutan) and 14.8 dark (mauve↔blue, deutan); worst normal 23.5 light, 16.2 dark. Tritan (reported, not gated): 18.5 light, **7.2 dark** (mauve↔blue) — one reason the Patterns control exists (§4.3).

How the two hues were chosen (not by eye): a search over the hue circle in 5° steps, lightness in 0.005 steps and chroma 0.105–0.15, with the ochre fixed, required in both modes: inside the band with a 0.005 margin, chroma ≥ 0.1025 as derived from the hex, ≥ 3.02:1 on ocean and land, CVD ΔE ≥ 8 and normal ≥ 15.3 for all three pairs, the same hue in light and dark. Teal/cyan (185–215°), the semantically obvious partner, **cannot** satisfy this: at the lightness the light ocean demands (L ≤ 0.61 for 3:1), its sRGB gamut tops out at chroma 0.096–0.103 (`debug.mjs`). Greens collide with `--ok` (150°). 156 pairs passed; every one of the top 40 is a blue (250–270°) with a mauve/pink (330–355°). 260° + 345° was taken for the largest worst-case CVD distance across both modes (14.75) and the largest distance from the example purple (298°) in light (18.5). Semantics: no red anywhere; armed conflict takes the darker, lower-chroma mauve (L 0.44 light), civil unrest the blue; the legend names both, and neither colour is a severity.

### 2.3 Texture inks and the neutral (tone-on-tone, same hue, first lightness step that reaches ≥ 3:1 against its own fill)

| Token | Light hex (L) | On fill | Dark hex (L) | On fill | Direction |
|---|---|---|---|---|---|
| `--map-kind-unrest-ink` | `#003586` (0.356) | 3.03 | `#084095` (0.396) | 3.08 | darker |
| `--map-kind-armed-ink` | `#d285b1` (0.710) | 3.04 | `#571740` (0.324) | 3.00 | **lighter** in light (a fill at L 0.44 has no darker 3:1 step), darker in dark |
| `--map-scale-none-ink` | `#262626` (0.29) | 3.01 | `#4f4f4f` (0.43) | 3.06 | darker |
| `--map-hatch` (gap, unchanged) | `#c3cbc1` | 1.48 | `#3f4844` | 1.40 | unchanged: the gap stays the quietest texture on the map |

The neutral `--map-scale-none` is not a hue slot and fails the chroma floor by design (it must read as "no value"). Against the kind hues it is CVD ΔE ≥ 10.2 (light) / 11.0 (dark) and normal ΔE 14.1 / 12.5 — under the 15 series floor, so its **cross-hatch is mandatory and always on**; the validator run with the grey appended is in §3 as information.

### 2.4 Unchanged tokens this design relies on

`--map-ocean --map-land --map-hatch --map-reported --map-example --map-selected --map-selected-halo --map-border --map-city --map-shadow --map-focus --ended-shadow`. Overlay checks on the new fills (WCAG, `search-5.txt` §G): the ink selection outline drops to 2.07:1 on the two darkest light fills (`#7b3660`, `#714402`) and 2.13 on the lightest dark fill; the 5 px `--map-selected-halo` beneath it is 8.1:1 / 7.5:1 against those fills and 16.9 / 16.0 against the outline, which is the mechanism 4.0 already uses in dark mode (SPEC §17.2). The focus ring stays on its halo (6.19 / 8.90). City dots keep their 1 px land ring (≥ 2.29 against every fill; ≥ 3.0 except the two pale ramp ends).

---

## 3. Validator output (verbatim, `validate_palette.js`, 4 Oct 2026)

Kind hues, light, ocean and land, all pairs:

```
### KIND categorical, light, ocean #e4e9e3, all pairs
Palette (light, surface #e4e9e3, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #7b3660↔#4c83de ΔE 20.9 (deutan) · tritan 18.5
  [PASS] Normal-vision floor    worst all-pairs #7b3660↔#b4772a ΔE 23.5 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
exit 0
### KIND categorical, light, land #f2f2ec, all pairs
Palette (light, surface #f2f2ec, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #7b3660↔#4c83de ΔE 20.9 (deutan) · tritan 18.5
  [PASS] Normal-vision floor    worst all-pairs #7b3660↔#b4772a ΔE 23.5 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
exit 0
```

Kind hues, dark, ocean and land, all pairs:

```
### KIND categorical, dark, ocean #0e1311, all pairs
Palette (dark, surface #0e1311, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.48–0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #a9628b↔#5991ed ΔE 14.8 (deutan) · tritan 7.2
  [PASS] Normal-vision floor    worst all-pairs #a9628b↔#bd8236 ΔE 16.2 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
exit 0
### KIND categorical, dark, land #2b312e, all pairs
Palette (dark, surface #2b312e, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.48–0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #a9628b↔#5991ed ΔE 14.8 (deutan) · tritan 7.2
  [PASS] Normal-vision floor    worst all-pairs #a9628b↔#bd8236 ΔE 16.2 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
exit 0
```

Recency ramp, `--ordinal`, light (order: over 30 d → 7–30 d → 3–7 d → within 72 h):

```
### RECENCY ordinal, light, ocean #e4e9e3
Palette (light, surface #e4e9e3, ordinal ramp): 4 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #ce9046 at 2.22:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS  (ordinal: one hue, monotone L, visible step gaps, light end clears surface)
exit 0
### RECENCY ordinal, light, land #f2f2ec
Palette (light, surface #f2f2ec, ordinal ramp): 4 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #ce9046 at 2.43:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS
exit 0
```

Recency ramp, `--ordinal`, dark (same band order; the anchor flips, so the step nearest the dark surface is the oldest):

```
### RECENCY ordinal, dark, ocean #0e1311
Palette (dark, surface #0e1311, ordinal ramp): 4 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #8e5a04 at 3.23:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS
exit 0
### RECENCY ordinal, dark, land #2b312e
Palette (dark, surface #2b312e, ordinal ramp): 4 slots
  [PASS] Lightness monotone     steps read light→dark
  [PASS] Adjacent ΔL            all gaps >= 0.06
  [PASS] Light-end contrast     #8e5a04 at 2.29:1 vs surface
  [PASS] Single hue             hue spread 1°
  → ALL CHECKS PASS
exit 0
```

Information-only runs (expected results, kept so nobody "fixes" them):

```
### categorical validator on the light ramp — FAILS BY DESIGN (a ramp spans the band; judged by --ordinal above)
  [FAIL] Lightness band   outside band: [["#714402",0.43]]
  [FAIL] Chroma floor     below floor (reads gray): [["#714402",0.094]]
  [PASS] CVD separation   worst all-pairs #b4772a↔#ce9046 ΔE 8.1 (deutan) · tritan 8.1
  [FAIL] Normal-vision floor  worst all-pairs #b4772a↔#ce9046 ΔE 8.1 (normal)
  [WARN] Contrast vs surface  below 3:1 — relief required: [["#ce9046",2.22]]
### kind hues + neutral grey, light ocean — the grey is the "no single value" fold, carried by its cross-hatch
  [FAIL] Chroma floor     below floor (reads gray): [["#7a7a7a",0]]   (run made with #7a7a7a; the chosen #6f6f6f is 14.1 normal / 10.2 CVD from the nearest hue)
  [PASS] CVD separation   worst all-pairs #7a7a7a↔#b4772a ΔE 10.9 (protan)
  [FAIL] Normal-vision floor  worst all-pairs #7a7a7a↔#b4772a ΔE 12.4 (normal)
### kind hues + example purple, light ocean — never on screen together: example mode disables Colour by
  [FAIL] CVD separation   worst all-pairs #8a6cc2↔#4c83de ΔE 4.6 (deutan)
  [FAIL] Normal-vision floor  worst all-pairs #8a6cc2↔#4c83de ΔE 9.6 (normal)
### regression: the 4.0 pair (reported + example) still passes exactly as SPEC §17.2 recorded
  light: CVD 22.8 (deutan) · normal 22.6 · contrast ≥3:1 → ALL CHECKS PASS
  dark:  CVD 21.3 (deutan) · normal 21.1 · contrast ≥3:1 → ALL CHECKS PASS
```

Full logs: `validator-final.txt`, `validator-ramp-dark.txt`, `search-1.txt` … `search-5.txt`.

---

## 4. The categorical "kind" encoding (question 2, encoding part)

### 4.1 Five kinds, three hues: fold and facet

Kinds in the data model (the architect's vocabulary; labels are the display strings):

| `kind` value | Display label (badge, filter, brief) | Map family | Definition basis |
|---|---|---|---|
| `protest` | Protest / demonstration | collective | round-3 research contract (sourced collective-action episode) |
| `strike` | Strike / industrial action | collective | same contract; the pipeline field, never a keyword guess |
| `unrest` | Civil unrest | unrest | riot, violent demonstration or communal violence, **as the cited source describes it** |
| `armed-intrastate` | Armed conflict · within a state | armed | UCDP state-based conflict, type intrastate or internationalised intrastate (≥ 25 battle-related deaths in a year) |
| `armed-interstate` | Armed conflict · between states | armed | UCDP type interstate |

The skill's all-pairs rule caps a choropleth at three hues, and the search in §2.2 confirms three is also the physical limit on these surfaces. So the fill carries the **family**: the thing a reader must never confuse at a glance (a labour dispute is not a war). The sub-kind is:

- **faceted**: a `kind` filter (filter sheet group "Kind", radio rows with counts in the C-07 style, zero-count rows hidden unless selected; an active-filter chip "Kind: Strike / industrial action"). With a sub-kind selected, every painted country is that sub-kind, which is the skill's "facet" answer to a fourth series.
- **named** on every card, list row, record sheet and brief entry (§9).

Why not sub-kind by texture on the fill (the alternative the brief suggested): seven fill classes (gap, protest, strike, unrest, intrastate, interstate, several) exceed the texture vocabulary the skill allows (solid, 45°, 135°, dots, cross-hatch) while keeping each texture's meaning constant across colour, print and forced-colours; the gap already consumes 45°; and under `forced-colors` a strike (135°) and "several kinds" would have had to share a texture or swap meanings between modes. A texture whose meaning changes with the rendering mode is worse than no texture.

### 4.2 Country fill rule in Kind mode

`families = set(family(record.kind) for record in matching records of the country)`:

- one family → that family's fill;
- more than one → **Several kinds**: `--map-scale-none` with the cross-hatch, legend text "Several kinds of episode match. Open the country brief to see each" (the brief lists every record with its kind badge). Painting the "most serious" family would be a severity ranking; painting the newest would hide the others.
- the ended shadow and the selection overlay behave exactly as in Coverage mode.

With the 4.0 data every record defaults to the collective family (pipeline default from the research contract), so Kind mode is all-ochre until unrest or conflict records arrive, and the legend says so honestly (§7.3).

### 4.3 Texture allocation (meanings constant in every mode)

| Fill class | Colour mode (default) | With Patterns on, in print, under `forced-colors` |
|---|---|---|
| No published episode (gap) | land + **45° sparse lines** (unchanged) | same |
| Protest or strike | solid ochre | solid (CanvasText under forced colours, as `reported` is today) |
| Civil unrest | solid blue | blue + **135° lines**, ink `--map-kind-unrest-ink` |
| Armed conflict | solid mauve | mauve + **dots**, ink `--map-kind-armed-ink` |
| Several kinds / date not established | neutral + **cross-hatch** (always) | same |

Armed conflict takes dots rather than lines so that the most consequential class can never be confused with the gap hatch (lines) at a glance or in forced colours. Textures are tone-on-tone at ≥ 3:1 against their own fill (WCAG 1.4.11 for a graphic that carries meaning), 1–1.7 CSS px strokes at 5.7–6.4 CSS px spacing, never animated, equal loudness across the two kinds.

Why the two kind textures are not on by default: the skill makes texture an opt-in accessibility channel ("never on by default"), and the three families already pass the CVD gate on hue alone (worst 14.8). The visible **Patterns** switch (§8.2) is the accessibility setting the skill names, and it auto-enables under `forced-colors` and print. The reasons it must be prominent rather than buried: the dark-mode tritan distance between blue and mauve is 7.2; grayscale print loses ochre vs blue entirely (both L ≈ 0.62 / 0.66, §J of `search-5.txt`); and the request was explicitly for colour-blind patterns.

---

## 5. Pattern specs

### 5.1 How patterns scale with zoom (existing mechanism, generalised)

`map.js` already keeps the gap hatch at a fixed screen size: an 8 × 8 user-unit tile with `patternUnits="userSpaceOnUse"` and, on every zoom, `patternTransform = scale(T · s / 8)` where `s = 1 / (k · unitPx)` and `T` is the wanted period in CSS px (6 for the gap). The new patterns use the same tile and the same loop: each `<pattern>` carries `data-period`, and `scaleMarks()` does

```js
defs.selectAll('pattern[data-period]').attr('patternTransform', function () { return `scale(${this.dataset.period * s / TILE})`; });
```

so lines stay ~1–1.7 CSS px and spacing stays 5.7–6.4 CSS px from k = 1 to k = 12. At k = 1 a 10 px country shows one or two marks; the legend M7 ("Small territories … use the country list") already covers that, and at k ≥ 3 every texture resolves.

### 5.2 Ready-to-paste `<defs>` (raw SVG; `n` is the map instance number map.js already appends)

```svg
<defs>
  <!-- existing: no published episode, 45° rising lines, period 6 CSS px, ~1.05 px stroke -->
  <pattern id="map-no-records-n" class="map-pattern map-pattern--gap" data-period="6" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8"/>
    <path d="M-2,2L2,-2M0,8L8,0M6,10L10,6"/>
  </pattern>
  <!-- civil unrest: 135° falling lines, period 9 CSS px (6.4 px between lines), ~1.7 px stroke -->
  <pattern id="map-kind-unrest-n" class="map-pattern map-pattern--unrest" data-period="9" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8"/>
    <path d="M-2,-2L10,10M-2,6L2,10M6,-2L10,2"/>
  </pattern>
  <!-- armed conflict: staggered dots, period 8 CSS px (5.7 px between dots), r 1.5 px -->
  <pattern id="map-kind-armed-n" class="map-pattern map-pattern--armed" data-period="8" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8"/>
    <circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="6" r="1.5"/>
  </pattern>
  <!-- several kinds / date not established: cross-hatch, period 8 CSS px, ~1.1 px stroke -->
  <pattern id="map-scale-none-n" class="map-pattern map-pattern--none" data-period="8" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8"/>
    <path d="M-2,2L2,-2M0,8L8,0M6,10L10,6M-2,-2L10,10M-2,6L2,10M6,-2L10,2"/>
  </pattern>
</defs>
```

The same, as the d3 calls map.js uses (one helper replaces the three hand-written `pattern.append` lines):

```js
const TILE = 8;
function patternDef(id, cls, period, draw) {
  const p = defs.append('pattern').attr('id', `${id}-${n}`).attr('class', `map-pattern map-pattern--${cls}`).attr('data-period', period)
    .attr('patternUnits', 'userSpaceOnUse').attr('width', TILE).attr('height', TILE);
  p.append('rect').attr('width', TILE).attr('height', TILE);
  draw(p);
  container.style.setProperty(`--map-${cls}-fill`, `url(#${id}-${n})`);
  return p;
}
patternDef('map-no-records', 'gap', 6, p => p.append('path').attr('d', 'M-2,2L2,-2M0,8L8,0M6,10L10,6'));
patternDef('map-kind-unrest', 'unrest', 9, p => p.append('path').attr('d', 'M-2,-2L10,10M-2,6L2,10M6,-2L10,2'));
patternDef('map-kind-armed', 'armed', 8, p => { p.append('circle').attr('cx', 2).attr('cy', 2).attr('r', 1.5); p.append('circle').attr('cx', 6).attr('cy', 6).attr('r', 1.5); });
patternDef('map-scale-none', 'none', 8, p => p.append('path').attr('d', 'M-2,2L2,-2M0,8L8,0M6,10L10,6M-2,-2L10,10M-2,6L2,10M6,-2L10,2'));
```

`--map-gap-fill` keeps its current name (`cls` = `gap`), so no 4.0 CSS changes. map.js still writes no colour: the pattern internals are painted by CSS (tech §5.6).

### 5.3 CSS: pattern internals, country fills per mode (goes in `css/map.css`, `@layer components`)

```css
/* pattern internals: colour only from tokens */
.map-pattern path { fill: none; }
.map-pattern--gap rect { fill: var(--map-land); }            .map-pattern--gap path { stroke: var(--map-hatch); stroke-width: 1.4; }
.map-pattern--unrest rect { fill: var(--map-kind-unrest); }  .map-pattern--unrest path { stroke: var(--map-kind-unrest-ink); stroke-width: 1.5; }
.map-pattern--armed rect { fill: var(--map-kind-armed); }    .map-pattern--armed circle { fill: var(--map-kind-armed-ink); }
.map-pattern--none rect { fill: var(--map-scale-none); }     .map-pattern--none path { stroke: var(--map-scale-none-ink); stroke-width: 1.1; }

/* Coverage (default): unchanged 4.0 rules apply. */
/* Newest evidence: newest band among the country's matching records (map.js sets data-band). */
.world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="fresh"]   { fill: var(--map-recency-72h); }
.world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="week"]    { fill: var(--map-recency-7d); }
.world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="month"]   { fill: var(--map-recency-30d); }
.world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="older"]   { fill: var(--map-recency-older); }
.world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="unknown"] { fill: var(--map-none-fill, var(--map-scale-none)); }
/* Kind: family among the country's matching records (map.js sets data-kind). */
.world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="collective"] { fill: var(--map-kind-collective); }
.world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="unrest"]     { fill: var(--map-kind-unrest); }
.world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="armed"]      { fill: var(--map-kind-armed); }
.world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="several"]    { fill: var(--map-none-fill, var(--map-scale-none)); }
/* Patterns on (viewer switch; html[data-patterns="on"] is set by app.js) */
html[data-patterns="on"] .world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="unrest"] { fill: var(--map-unrest-fill, var(--map-kind-unrest)); }
html[data-patterns="on"] .world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="armed"]  { fill: var(--map-armed-fill, var(--map-kind-armed)); }
/* No transition on fill anywhere: a mode switch repaints at once. */
```

Example mode keeps `--map-example` (the control is hidden there, §8). Loading and events-error states keep the neutral land rule that already exists (`.world-map:is([data-map-state="data-loading"], [data-map-state="data-error"]) .map-country { fill: var(--map-land); filter: none; }`), which wins by source order inside the layer; the new rules must be written above it.

### 5.4 CSS equivalents for legend swatches (22 × 14) and card swatches (14 × 14)

Angles: a CSS `repeating-linear-gradient(-45deg …)` draws rising (45°) stripes, which is how the gap swatch is drawn today; `45deg` draws falling (135°) stripes.

```css
.legend-swatch[data-kind="r72"]   { background: var(--map-recency-72h); }
.legend-swatch[data-kind="r7"]    { background: var(--map-recency-7d); }
.legend-swatch[data-kind="r30"]   { background: var(--map-recency-30d); }
.legend-swatch[data-kind="rold"]  { background: var(--map-recency-older); }
.legend-swatch[data-kind="none"], .kind-swatch[data-family="several"] {
  background: var(--map-scale-none)
    repeating-linear-gradient(45deg, var(--map-scale-none-ink) 0 1.1px, transparent 1.1px 5.66px),
    repeating-linear-gradient(-45deg, var(--map-scale-none-ink) 0 1.1px, transparent 1.1px 5.66px);
}
.legend-swatch[data-kind="collective"], .kind-swatch[data-family="collective"] { background: var(--map-kind-collective); }
.legend-swatch[data-kind="unrest"], .kind-swatch[data-family="unrest"] { background: var(--map-kind-unrest); }
.legend-swatch[data-kind="armed"], .kind-swatch[data-family="armed"]   { background: var(--map-kind-armed); }
html[data-patterns="on"] :is(.legend-swatch[data-kind="unrest"], .kind-swatch[data-family="unrest"]) {
  background: var(--map-kind-unrest) repeating-linear-gradient(45deg, var(--map-kind-unrest-ink) 0 1.7px, transparent 1.7px 6.4px);
}
html[data-patterns="on"] :is(.legend-swatch[data-kind="armed"], .kind-swatch[data-family="armed"]) {
  background-color: var(--map-kind-armed);
  background-image: radial-gradient(circle at 2px 2px, var(--map-kind-armed-ink) 1.5px, transparent 1.75px),
                    radial-gradient(circle at 6px 6px, var(--map-kind-armed-ink) 1.5px, transparent 1.75px);
  background-size: 8px 8px;
}
```

(The legend swatch attribute stays `data-kind`, whose values are swatch kinds; the episode kind on cards uses `data-family` / `data-episode-kind`, so the two vocabularies never mix.)

### 5.5 Combining with the hatch, the ended shadow and the selection without noise

Layer budget per country, in paint order, never more than these four: (1) fill, solid or one pattern; (2) `feDropShadow` for a sourced ended or suspended episode (outside the shape; unaffected by a patterned fill; unchanged); (3) selection halo + ink outline (overlay group, unchanged); (4) keyboard focus halo + ring (last overlay children, unchanged). Rules:

- A country carries **at most one texture**. "Several kinds" replaces the family fill; it never stacks a cross-hatch on dots.
- No new strokes, dashes or outlines on `.map-country` for any kind or band. Forced colours keep the one existing dashed stroke for ended (§17.10).
- The gap hatch is the quietest texture (1.48:1 ink on land) and the two kind textures are the loudest (3:1); the cross-hatch sits between by density, not by contrast.
- Patterns never animate and never change with the 60 s tick except when a band boundary moves a country to another step, which repaints without transition.
- In Explore and at k ≥ 3, city dots (ink with a land ring) sit above textured fills; the ring keeps them legible (≥ 2.29 against every fill).

---

## 6. Forced colours and print

**`@media (forced-colors: active)`** (an allowed query; `tests/test_shell.mjs` `ALLOWED_MEDIA`):

```css
@media (forced-colors: active) {
  .map-pattern rect { fill: Canvas; }  .map-pattern path { stroke: CanvasText; }  .map-pattern circle { fill: CanvasText; }
  /* Kind: patterns regardless of the viewer switch; the solid family is CanvasText as `reported` is today */
  .world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="unrest"] { fill: var(--map-unrest-fill, Canvas); stroke: CanvasText; }
  .world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="armed"]  { fill: var(--map-armed-fill, Canvas);  stroke: CanvasText; }
  .world-map[data-colour="kind"] .map-country[data-has-records="true"][data-kind="several"],
  .world-map[data-colour="recency"] .map-country[data-has-records="true"][data-band="unknown"] { fill: var(--map-none-fill, Canvas); stroke: CanvasText; }
  /* Newest evidence is withheld here (JS disables the option); any band fill that slips through is plain coverage */
  .world-map[data-colour="recency"] .map-country[data-has-records="true"]:not([data-band="unknown"]) { fill: CanvasText; stroke: Canvas; }
  .legend-swatch[data-kind="unrest"], .kind-swatch[data-family="unrest"] { background: Canvas repeating-linear-gradient(45deg, CanvasText 0 1.5px, transparent 1.5px 6px); }
  .legend-swatch[data-kind="armed"],  .kind-swatch[data-family="armed"]  { background: Canvas radial-gradient(circle at 2px 2px, CanvasText 1.5px, transparent 1.75px) 0 0 / 5.5px 5.5px; }
  .legend-swatch[data-kind="none"],   .kind-swatch[data-family="several"] { background: Canvas repeating-linear-gradient(45deg, CanvasText 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, CanvasText 0 1px, transparent 1px 5px); }
  .legend-swatch[data-kind="collective"], .kind-swatch[data-family="collective"] { background: CanvasText; }
  .map-colour-track label:has(input:checked) { border: 2px solid CanvasText; }   /* the check icon already carries state */
}
```

Under forced colours the map has two system colours and five fills: solid CanvasText (protest or strike), 135° lines (civil unrest), dots (armed conflict), cross-hatch (several / date not established), sparse 45° lines (gap); selection stays `Highlight`, focus the dashed CanvasText ring, ended the dashed stroke. **The Newest-evidence option is disabled** (`aria-disabled`, from `matchMedia('(forced-colors: active)')`) with the note "Shading by evidence date is not available in high-contrast mode. The Reports list groups records by evidence date." Four ordered lightness steps cannot be expressed in two colours, and ordered textures would collide with the kind textures' meanings; the Reports grouping and the band badge carry the same information, so nothing is withheld, only the map rendering.

**Print.** `@media print` is **not** in `ALLOWED_MEDIA`, so the design works in print by construction: the recency ramp is lightness-ordered and prints in grayscale; the kind families share lightness (ochre 0.62 vs blue 0.616 in light), so a print needs the kind textures. Two options for the lead: (a) add `print` to `ALLOWED_MEDIA` (a one-line, deliberate test change) and ship a `@media print` block that forces the kind patterns on and sets `print-color-adjust: exact` on `.map-stage, .legend-swatch, .kind-swatch`; (b) without the block, the Patterns switch does the same job before printing, and the legend is printed beside the map in any case. Recommendation: (a); it costs about 250 B gzip. Either way `print-color-adjust: exact` on `.map-stage` can be set unconditionally (harmless on screen) so the ocean prints.

---

## 7. Legend per mode

Common to every mode (M3–M9 unchanged): the hint, "What the colours mean" (M1), Selected (M4), Shadow (M5), City point (M6), small territories (M7), the footnote (M8 or its mode variant), M9 when a window filter is active, the cities-error note. Nothing animates; the legend is re-rendered through `setHTML` with focus kept.

### 7.1 Coverage (default)

Exactly the 4.0 legend (M1–M9). No ramp, no kind rows.

### 7.2 Newest evidence

Rows, in order:

1. **Ramp with ticks** (one `<li>`): four 56 × 14 swatches in band order oldest → newest with tick labels **F4 "Over 30 days ago" · F3 "7–30 days ago" · F2 "3–7 days ago" · F1 "Within 72 h"**, then, after a gap, the neutral cross-hatched swatch **F5 "Date not established"**. Each swatch carries the long label as visually hidden text (BAND_LABELS, e.g. "Latest evidence dated within the last 72 hours"). Caption under the ramp: **"Newest evidence among a country's matching episodes. Older on the left, newer on the right."**
2. M3 gap row (unchanged text).
3. M4, M5, M6.
4. Footnote replacing M8: **"Shade shows how recently a cited source reported activity or a development in a country's newest matching episode. It does not show whether a protest is happening now, how many there were, how large they were or how severe."**
5. When `emptyBandNotice(allEvents, now)` is `'fresh'` or `'week'`, the matching E4 sentence (`model.E4`), verbatim: "No episode in this snapshot has evidence dated within the last 72 hours. That is a gap in this dataset, not a sign that no protests happened." / "… in the last 7 days …". The empty steps stay on the ramp; the sentence says why nothing is painted with them. Never "0 countries".
6. M9 when a window is active; M7.

Status still leads on every card; a country in the "Within 72 h" step may contain only ended episodes (tz-drivers on 2 Oct), and the shadow says so.

### 7.3 Kind

Rows:

1. swatch `collective` — **"Protest or strike: demonstrations, marches, strikes and other collective action"**
2. swatch `unrest` — **"Civil unrest: riots, violent demonstrations or communal violence, as the cited source describes it"**
3. swatch `armed` — **"Armed conflict, within a state or between states (UCDP: at least 25 battle-related deaths in a year)"**
4. swatch `none` — **"Several kinds of episode match. Open the country brief to see each"**
5. M3 gap; M4; M5; M6.
6. Footnote replacing M8: **"Colour shows the kind of episode this atlas has published for a country, as recorded from the cited sources. It does not show how many episodes there were, how large they were or how severe. Strikes and conflicts between states are named on each record; use the Kind filter to show one kind."**
7. For each family with no matching record in the snapshot, one sentence: **"No published episode of this kind is in this snapshot. That is a coverage limit, not evidence that none occurred."** (collapsed to one sentence naming the families when two or more are empty: "No published civil-unrest or armed-conflict episode is in this snapshot. …").
8. Patterns state, one line: "Patterns: on. Lines mark civil unrest, dots mark armed conflict." or "Patterns: off. Turn them on so colour is never the only difference." (the switch itself is in the control, §8).

### 7.4 Mockup (inline SVG, light values as fallbacks; the page uses the tokens)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 268" width="540" height="268" role="img" aria-labelledby="lg-title"
     font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="12">
  <title id="lg-title">Legend mockup: the Newest-evidence ramp with ticks and the Kind rows with patterns on</title>
  <defs>
    <pattern id="lg-gap" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="6" style="fill:var(--map-land,#f2f2ec)"/><path d="M-1.5,1.5L1.5,-1.5M0,6L6,0M4.5,7.5L7.5,4.5" fill="none" style="stroke:var(--map-hatch,#c3cbc1);stroke-width:1.05"/></pattern>
    <pattern id="lg-none" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" style="fill:var(--map-scale-none,#6f6f6f)"/><path d="M-2,2L2,-2M0,8L8,0M6,10L10,6M-2,-2L10,10M-2,6L2,10M6,-2L10,2" fill="none" style="stroke:var(--map-scale-none-ink,#262626);stroke-width:1.1"/></pattern>
    <pattern id="lg-unrest" patternUnits="userSpaceOnUse" width="9" height="9"><rect width="9" height="9" style="fill:var(--map-kind-unrest,#4c83de)"/><path d="M-2.25,-2.25L11.25,11.25M-2.25,6.75L2.25,11.25M6.75,-2.25L11.25,2.25" fill="none" style="stroke:var(--map-kind-unrest-ink,#003586);stroke-width:1.69"/></pattern>
    <pattern id="lg-armed" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" style="fill:var(--map-kind-armed,#7b3660)"/><circle cx="2" cy="2" r="1.5" style="fill:var(--map-kind-armed-ink,#d285b1)"/><circle cx="6" cy="6" r="1.5" style="fill:var(--map-kind-armed-ink,#d285b1)"/></pattern>
  </defs>
  <rect width="540" height="268" style="fill:var(--bg,#f6f4ee)"/>
  <text x="12" y="22" font-size="14" font-weight="700" style="fill:var(--text,#1a1c19)">What the colours mean</text>

  <!-- Newest evidence -->
  <text x="12" y="44" font-weight="700" style="fill:var(--text-2,#3f423c)">Colour by: Newest evidence</text>
  <g transform="translate(12,52)">
    <rect x="0"   y="0" width="56" height="14" rx="2" style="fill:var(--map-recency-older,#ce9046)"/>
    <rect x="58"  y="0" width="56" height="14" rx="2" style="fill:var(--map-recency-30d,#b4772a)"/>
    <rect x="116" y="0" width="56" height="14" rx="2" style="fill:var(--map-recency-7d,#935a04)"/>
    <rect x="174" y="0" width="56" height="14" rx="2" style="fill:var(--map-recency-72h,#714402)"/>
    <rect x="250" y="0" width="56" height="14" rx="2" fill="url(#lg-none)" style="stroke:var(--map-border,#b9c1b8);stroke-width:1"/>
    <path d="M0.5,14v5M58.5,14v5M116.5,14v5M174.5,14v5M229.5,14v5" fill="none" style="stroke:var(--border-strong,#1a1c19);stroke-width:1"/>
    <g font-size="11" style="fill:var(--text-2,#3f423c)">
      <text x="0" y="31">Over 30 days ago</text><text x="99" y="31">7–30 days</text><text x="151" y="31">3–7 days</text><text x="207" y="31">Within 72 h</text>
      <text x="250" y="31">Date not established</text>
    </g>
    <text x="0" y="50" font-size="11" style="fill:var(--text-muted,#5f625b)">Newest evidence among a country's matching episodes. Older on the left, newer on the right.</text>
    <text x="0" y="66" font-size="11" style="fill:var(--text-muted,#5f625b)">Shade shows how recently a cited source reported activity or a development. Not whether a protest is</text>
    <text x="0" y="80" font-size="11" style="fill:var(--text-muted,#5f625b)">happening now, how many there were, how large they were or how severe.</text>
  </g>

  <!-- Kind -->
  <text x="12" y="158" font-weight="700" style="fill:var(--text-2,#3f423c)">Colour by: Kind · Patterns: on</text>
  <g transform="translate(12,166)" style="fill:var(--text,#1a1c19)">
    <rect x="0" y="3"  width="22" height="14" rx="3" style="fill:var(--map-kind-collective,#b4772a);stroke:var(--map-border,#b9c1b8)"/><text x="32" y="14">Protest or strike</text>
    <rect x="0" y="25" width="22" height="14" rx="3" fill="url(#lg-unrest)" style="stroke:var(--map-border,#b9c1b8)"/><text x="32" y="36">Civil unrest, as the cited source describes it</text>
    <rect x="0" y="47" width="22" height="14" rx="3" fill="url(#lg-armed)" style="stroke:var(--map-border,#b9c1b8)"/><text x="32" y="58">Armed conflict, within a state or between states</text>
    <rect x="0" y="69" width="22" height="14" rx="3" fill="url(#lg-none)" style="stroke:var(--map-border,#b9c1b8)"/><text x="32" y="80">Several kinds of episode match. Open the country brief to see each</text>
    <rect x="0" y="91" width="22" height="14" rx="3" fill="url(#lg-gap)" style="stroke:var(--map-border,#b9c1b8)"/><text x="32" y="102">No published episode matches. A coverage gap, not 'no protests'</text>
  </g>
</svg>
```

---

## 8. The "Colour by" control (question 4, interaction)

### 8.1 Placement

A new in-flow block with a pinned id, **`#map-colour`**, between `#map-selbar` and `#map-legend` (both < 900 and ≥ 900, left column). Rationale: it sits directly above the legend it changes and directly below the stage it repaints, so on a phone the reader taps and sees both the fills above and the legend below change; it never overlaps the stage (C-39 keeps `#map-controls` for overlay buttons only); it is outside the clipped stage so focus rings are never cut. It is `hidden` in example mode, when the map is unavailable, and while events are loading or failed (the mode falls back to Coverage and the legend shows the existing state copy).

### 8.2 Markup (rendered by map-view.js; reuses the §9 segmented-control pattern)

```html
<fieldset id="map-colour" class="map-colour">
  <legend class="map-colour-legend">Colour by</legend>
  <div class="filter-segment-track map-colour-track" role="radiogroup" aria-label="Colour the map by">
    <label class="filter-segment"><input type="radio" name="map-colour" value="coverage" data-action="map-colour" checked>
      <svg class="icon filter-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>Coverage</label>
    <label class="filter-segment"><input type="radio" name="map-colour" value="recency" data-action="map-colour">
      <svg class="icon filter-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>Newest evidence</label>
    <label class="filter-segment"><input type="radio" name="map-colour" value="kind" data-action="map-colour">
      <svg class="icon filter-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>Kind</label>
  </div>
  <!-- only while value="kind" -->
  <label class="map-patterns"><input type="checkbox" data-action="map-patterns"> Patterns
    <span class="map-patterns-help">Adds lines or dots to each kind, so colour is never the only difference.</span></label>
  <p class="map-colour-note" id="map-colour-note" hidden></p>   <!-- forced-colours note; "Kind needs kind data" note -->
</fieldset>
```

- Visually hidden radios, 48 px label targets, check icon on the checked label, `:has(input:focus-visible)` outline: all exactly the existing `.filter-segment` behaviour (§9, I-05). The track class is WP2's; either reuse it from WP4 markup (no new CSS) or promote `.filter-segment*` to a WP1 `.segment*` primitive in `styles.css` with a one-line alias. Lead's call; the second is cleaner for the class-prefix rule.
- The Patterns checkbox renders only in Kind mode (it has no meaning in the other two) and is positioned after the track in the same row, so the track never moves. Under `forced-colors` it renders checked and disabled with the note "Patterns are always on in high-contrast mode."
- Under `forced-colors` the "Newest evidence" label gets `aria-disabled="true"`, the dashed disabled style, and `#map-colour-note` reads the sentence in §6.

### 8.3 State, URL, persistence

- `ui.mapColour ∈ {'coverage','recency','kind'}` in the store (`actions.setMapColour`). **Not a filter**: `activeFilterCount` ignores it, no active-filter chip, "Clear all" does not touch it.
- URL: `?colour=recency|kind` (omitted for coverage) parsed and formatted by `explore.js` as a view parameter beside the filters, so shared links and Back/Forward reproduce the view (the atlas's permalink rule); `droppedParams` rejects other values. It is **never persisted** in storage: coverage-only is the default on every fresh visit, which keeps the editorial default without a reader having to know a setting exists.
- Patterns: `html[data-patterns="on"|"off"]`, read from and written to `localStorage` key `atlas.patterns` inside `try/catch`; default off; a per-viewer convenience, not shared state and not in the URL.
- map.js: `update({…, colour, patterns})` is additive to the `update(partial)` keys; `paint()` sets `container.dataset.colour`, and per country `data-band` (newest band among matching records, via `observationBand(record, now)`) and `data-kind` (family or `several`). `data-has-records`, `data-selected`, `data-completion` are unchanged, so Coverage mode is byte-for-byte the 4.0 CSS path.
- The 60 s tick: `timeSnapshot` already changes when any record's band changes, so the map repaints in Newest-evidence mode exactly when the Reports groups do.

### 8.4 Nothing moves

No `transition` on `fill`, no legend animation, no pulsing, no "live" word. A mode switch is a synchronous repaint. Reduced motion needs no extra rule because there is no motion to reduce.

### 8.5 Copy added (for §18.4)

"Colour by" · "Coverage" · "Newest evidence" · "Kind" · "Patterns" · "Adds lines or dots to each kind, so colour is never the only difference." · the legend strings in §7.2–7.3 · "Shading by evidence date is not available in high-contrast mode. The Reports list groups records by evidence date." · "Patterns are always on in high-contrast mode." None contains a §2-banned word (checked against the list: no live, active, hot, heat, severity, danger, trending, hotspot, escalating, updated, as of).

---

## 9. Cards, list rows, record sheet, brief and filters: the map is never the only carrier

**Kind badge** (`js/record-facts.js` → `kindView(event)`; `js/cards.js` renders it): `<span class="kind" data-episode-kind="strike" data-family="collective"><i class="kind-swatch" aria-hidden="true"></i>Strike / industrial action</span>`. Text is the carrier; the 14 × 14 swatch (family colour, 1 px `--border-strong`, pattern when Patterns are on or under forced colours) is the visual link to the map legend. Style like `.band`: 12/600 sans, `--bg-sunken`, `--text-2`, 22 px tall, `--r-1`; text never wears the kind colour. Accessible name adds the basis where it matters: armed kinds get a visually hidden " (UCDP classification)", unrest " (as the cited source describes it)".

Placement:

- **Card** (density `card`): in the status line, after the status: `Current status not established · [■ Strike / industrial action]`. Status still leads (editorial §3.2). The band badge stays where it is on the "Latest evidence" line, neutral.
- **List row** (density `row`): `card-meta` reads `status · [kind] · Latest evidence {day} · Country`.
- **Record sheet**: the kind badge in the header meta under the title (beside D1), and a row "Kind: {label} · basis: {research contract | source description | UCDP type}" in D9 Evidence and verification.
- **Country brief** records list: `{status label} · {kind} · Latest evidence {date}`; the "Several kinds" fill is explained by this list.
- **Filter sheet**: group "Kind" (radio rows with counts, C-07 style); active chip "Kind: {label}"; CSV gains a `kind` column.
- **Recency**: unchanged carriers: the band badge (F1–F5 text), the Reports group headings (F6), the brief's "Most recent evidence" list, S2's "newest evidence dated". Hue stays off the band badge (editorial §3.2), and the legend tick labels are the badge strings, so the same words appear on the map and the card.

---

## 10. Status colours stay reserved (question (d))

No status token is reused: kinds use `--map-kind-*`, recency uses `--map-recency-*`, "not established" uses `--map-scale-none`. Status keeps text + symbol on `.status[data-status]`; the ended shadow and the roadmap statuses are untouched. Measured distances (normal ΔE / CVD ΔE, `search-5.txt` §F):

| Kind hue | `--ok` | `--warn` | `--danger` | `--focus-ring` | `--example` |
|---|---|---|---|---|---|
| ochre light `#b4772a` | 20.1 / 10.0 | 21.0 / 20.7 | 15.9 / 13.2 | 29.6 / 25.2 | 22.6 / 22.8 |
| blue light `#4c83de` | 24.7 / 23.2 | 31.8 / 29.3 | 30.4 / 26.5 | **12.4 / 12.3** | 9.6 / 4.6 |
| mauve light `#7b3660` | 20.5 / 7.0 | **11.0 / 10.3** | **12.1 / 11.4** | 19.2 / 14.4 | 18.5 / 17.4 |
| ochre dark `#bd8236` | 20.1 / 15.4 | **13.6 / 12.9** | **14.0 / 12.6** | 25.1 / 24.1 | 21.1 / 21.3 |
| blue dark `#5991ed` | 24.6 / 23.9 | 27.9 / 22.2 | 26.4 / 19.2 | **11.3 / 10.7** | 8.8 / 5.4 |
| mauve dark `#a9628b` | 29.0 / 21.7 | 22.6 / 22.4 | 20.6 / 19.8 | 22.9 / 18.9 | 11.0 / 9.6 |

Pairs under the 15 floor (bold) and what covers them, per the skill's rule that a series beside a same-family status cue leans on icon + label and placement: `--warn`/`--danger` appear only as text with an icon in notice lines and chips, never as a map fill or beside the map; the focus ring sits on its halo (6.19 / 8.90) and is keyboard-only; the example purple never shares a screen with the kind hues (example mode hides the control). The dark ochre vs warn/danger pair is the 4.0 condition unchanged.

---

## 11. Anti-pattern catalogue, checked line by line

| Anti-pattern | This design |
|---|---|
| Dual-axis charts | n/a (no chart axes). |
| Recolor-on-filter | Colour follows the entity: a kind family's hue and a band's step are fixed tokens; filtering never repaints survivors. The "Several kinds" fill resolves to a family only when the reader narrows the Kind filter, which is a change of what is shown, not of what a colour means. |
| Cycling or generating hues past 8 | Three hues, fixed; the fourth and fifth classes fold (facet + neutral), none generated. |
| Eyeballing colorblind safety | Every hex ran through `validate_palette.js`; outputs in §3. |
| Value-ramp on nominal categories | Kind is nominal → categorical hues. Recency is ordered → ordinal ramp, `--ordinal` validated. |
| Rainbow / non-neighbour sequential | One hue (ochre), four steps. |
| A hue at the diverging midpoint / two cool poles | No diverging scale; "not established" is a chroma-0 neutral off the ramp. |
| Status colour for a non-status series | None; §10 table. |
| Eight hues when the story is one number | n/a. |
| One-bar chart / 2-slice pie / donut | n/a; no aggregates of kind or band are drawn (editorial §5.3 forbids tallies). |
| More than ~7 colour classes | Recency: 4 + neutral; Kind: 3 + neutral; plus the gap. The Reports list and brief are the table twin. |
| Thick saturated blocks, heavy gridlines | Chroma 0.105–0.15; graticule unchanged, solid hairline; the fills are the data. |
| Dashed gridlines or axis rules | None added. |
| A number on every data point | No labels on countries. |
| A border drawn around marks to separate them | No new strokes; the existing 0.65 border and the 2 px gap conventions are unchanged. |
| Clipped labels, fixed heights that exclude an axis | The legend ramp's tick labels are set in 11 px with measured widths in the mockup; the legend grows with content. |
| Display or serif on hero figures; tabular-nums misuse | n/a. |
| **Texture on by default or as decoration** | Kind textures are off by default and switch on with the Patterns control, `forced-colors` and print; the always-on textures (gap, several/not established) are "no value" carriers, as the 4.0 gap already is; textures are 45°/135°/dots/cross only, tone-on-tone, never on the value ramp. |
| Tooltip as the only way to read a value | The brief, the list, the badges and the CSV carry everything; the hover tooltip only repeats `describeCountry`. |
| Pinpoint hover targets | Unchanged map hit areas; control targets 48 px. |
| Per-chart filters inside a chart card | "Colour by" is a view control, not a filter, and sits outside the stage; the Kind filter lives in the filter sheet with every other filter. |
| Skeleton flash on refetch | The map holds the previous render during state changes (existing behaviour). |
| No table view / colour-only encoding on a continuous scale | The ramp has a legend with ticks and the F1–F5 words; the Reports list grouped by band is the table twin; the band badge is text. |

---

## 12. Where this design departs from the skill, and the relief for each

1. **Pale ramp end below 3:1** (2.22 / 2.43 light; 2.29 on dark land). Legal for an ordinal ramp (floor 2:1), flagged here because a country fill is a mark. Relief: the band is text on every card, row and brief; the hatch separates the pale step from bare land; the step is the "recedes" end by design.
2. **Dark ramp steps 0.07 L apart** (the skill's ordinal floor is 0.06) because the ramp is anchored on the existing dark ochre. Relief: the legend ramp with ticks; adjacent CVD ΔE 6.8–7.1 is the warn band, carried by the tick labels and the band badge.
3. **Neutral grey at 12.5–14.1 normal ΔE from the nearest hue** (series floor 15). It is not a series slot; its cross-hatch is mandatory and always on; CVD ≥ 10.2 in both modes.
4. **"Newest evidence" withheld under `forced-colors`.** No lightness channel exists there and ordered textures would collide with the kind textures. The Reports grouping and badges carry the same facts.
5. **Kind textures as a visible switch** rather than hidden in a settings page: a stricter reading of "accessibility setting" than the skill's text, justified by the dark tritan 7.2, grayscale print, and the request.
6. **Dark tritan 7.2 (mauve↔blue)**: reported, not gated by the skill; covered by Patterns.

---

## 13. Implementation notes for the architect and builders

**Tokens** (styles.css `@layer tokens`, light on `:root`, dark in both dark scopes): the eleven new names in §2 (`--map-recency-72h --map-recency-7d --map-recency-30d --map-recency-older --map-scale-none --map-scale-none-ink --map-kind-collective --map-kind-unrest --map-kind-unrest-ink --map-kind-armed --map-kind-armed-ink`). `--map-kind-collective: var(--map-reported)`. Add them to tech §4.9's map list and SPEC §17.1 with the §2 contrast figures; paste §3 into SPEC §17.2.

**map.js**: `patternDef` helper (§5.2); `scaleMarks` loop over `pattern[data-period]`; `paint()` sets `data-band` and `data-kind` per country and `container.dataset.colour`; `update()` accepts `colour` and `now`. Pure helpers to export and test: `kindFamily(kind) → 'collective'|'unrest'|'armed'|null`, `countryFamily(records) → family|'several'|null`, `countryBand(records, now) → band of the newest last_observed_at`.

**map-view.js**: `colourControlHTML(state)`, `legendHTML({…, colour, patterns, emptyBands, emptyFamilies})`; `#map-colour` rendering through `setHTML` with focus kept; `matchMedia('(forced-colors: active)')` gate; `data-action="map-colour"` and `"map-patterns"` handled inside `#view-map` like the other map actions.

**explore.js / router / app.js**: `colour` view parameter; `ui.mapColour`; `html[data-patterns]` from storage in `try/catch`.

**record-facts.js / cards.js / detail.js / country-brief.js / filters.js**: `kindView`, the badge, the Kind filter group, CSV column (the frozen exports stay frozen; these are additive).

**CSS**: §5.3–5.4 and §6 go in `css/map.css` and `css/record.css` (the badge) inside `@layer components`; the control reuses `.filter-segment*` or a promoted `.segment*`. Estimated added weight: tokens ≈ 0.4 KB, map rules and swatches ≈ 1.0 KB, badge ≈ 0.2 KB, forced colours ≈ 0.3 KB → **about 1.9 KB gzip of CSS against 1.4 KB of headroom** (27,243 B of 28,672), and ≈ 1 KB of critical JS (cards badge, explore param, app state) against **701 B of headroom**. So, as `inputs.md` says, headroom comes first: the lazy-view split (−17 KB critical JS) and the build-time minifier (−4 KB CSS) from INTEGRATION_NOTES §4 are prerequisites, not options. map.js and map-view.js changes (≈ 3 KB) land in the map add-on bucket, which has 14 KB of headroom.

**Tests** to add: `test_shell` asserts the eleven tokens exist in the light block and both dark blocks, and that no `transition` property mentions `fill` in map.css; a new `tests/test_encoding.mjs` pins the hexes of §2 and re-derives the WCAG contrasts in §2.1–2.2 with a 20-line `contrast()` (no dependency on the skill); `test_map` covers `kindFamily`, `countryFamily` ('several' on mixed families, `null` on none), `countryBand` (newest wins; `unknown` when no date), `legendHTML` for each mode (F1–F5 present in recency, E4 sentence when bands are empty, the empty-family sentence in kind, no banned word), the control markup (three radios, Patterns only in kind, `aria-disabled` under forced colours); `test_core` for the `colour` URL parameter round trip and `activeFilterCount` ignoring it; `test_record` for the badge text per kind and that the band badge keeps `data-band` with no hue token; smoke: switch each mode and assert `#world-map[data-colour]`, a changed `fill` on a known country, no `.map-colour` element inside `#map-stage`, and a forced-colours run (`emulateMedia({forcedColors:'active'})`) in which the recency radio is disabled.

**Roadmap** (`public/roadmap.json`, honest statuses): "Colour by newest evidence on the map" — `next` (no outside dependency; needs the budget split first); "Kind of episode: badge, filter and map colour" — `next`, `depends_on` the kind field and validators; "Civil unrest and armed conflict records" — `blocked` on data access, with the UCDP download step in the handoff; "Patterns for colour-blind readers" folded into the Kind item's acceptance. Acceptance lines should quote the validator results (§3) and the forced-colours behaviour.

---

## 14. Open questions for the panel

1. **Kind for the 84 records**: the pipeline default must come from the round-3 contract field (protest vs strike), not from keywords (29 "strike-like" by keyword is a hint, not a coding). Who codes it, and does `validate_data.py` require `kind` on every event (exact-key `obj()` means fixtures, merge_history and tests move together)?
2. **Conflicts' newest-evidence day**: a conflict record (separate `conflicts.json` or not) must carry a comparable "latest evidence" day for the recency mode, or it falls to "Date not established" (neutral) — never into the 72-hour step on the strength of a UCDP active year.
3. **Ship order**: Coverage + Newest evidence can ship before any `kind` data; should the Kind option be hidden until at least one record carries `kind`, or shown all-ochre with the empty-family sentences?
4. **`print` in `ALLOWED_MEDIA`** (§6): recommended; a deliberate test change.
5. **Promote `.filter-segment` to a WP1 `.segment` primitive**, or let map-view.js reuse WP2's class.
6. **Neutral grey relief** (§12.3) and the pale ramp end (§12.1): the panel's editorial skeptic should confirm both reliefs are acceptable.
7. **Patterns default**: off (skill) is proposed; the alternative is on-by-default in Kind mode, which the skill lists as an anti-pattern. If the panel prefers on-by-default, nothing else in this document changes except §4.3 and §8.2.
8. **`localStorage` for the Patterns switch**: a per-viewer convenience wrapped in `try/catch`; confirm it is acceptable under the "no service worker / no persistence of snapshot state" rules (it stores nothing about the data).
