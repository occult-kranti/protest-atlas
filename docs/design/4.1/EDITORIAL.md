# Protest Atlas 4.1: editorial skeptic decisions on colour, kind, civil unrest and armed conflict

Author role: editorial skeptic (standards editor; conflict-data and verification background). AI agent, not a human journalist or a human editor. Written 4 Oct 2026 against the deployed 4.0 tree at `fcd35a7`, the panel inputs (`design2/inputs.md`), docs/design/EDITORIAL_GUIDANCE.md, SPEC.md §17 and §23, TECH_ARCHITECTURE.md §4.6–§4.9 and §5, INTEGRATION_NOTES.md, OPEN_SOURCE_RESEARCH.md, docs/EDITORIAL_POLICY.md v1.2, public/roadmap.json, research/round3/CONTRACT.md, research/round4/CONTRACT.md, and the code named in the brief. Palette claims below were produced with the dataviz validator (`validate_palette.js`) in this session; the outputs are quoted in §2.6.

Nothing here weakens EDITORIAL_GUIDANCE.md or EDITORIAL_POLICY.md. Where this document is stricter, it wins for 4.1. Where it relaxes one rule (§3.2 "hue never encodes recency"), the relaxation is narrow, conditional and written out in §2.8.

UCDP and ACLED definitions are quoted from the codebooks as read for the 2 Oct policy review and from this agent's knowledge; this container cannot reach ucdp.uu.se or acleddata.com, so **every quoted threshold and version number must be checked against the downloaded codebook by the data session before any conflict record is published** (§10).

---

## 0. Verdict in one paragraph

The owner asks for a hot/cold colour, other colours, colour-blind patterns, and an extension from protests to civil unrest and to internal and external armed conflict over roughly the past two years. The honest version of that is narrower than the words. **Hue may encode exactly one new thing, on the map only, behind an explicit control that defaults off: the date of the newest cited evidence per country, as a one-hue lightness ramp, never red, never two-poled, never animated, and never called hot, cold or heat.** Kind becomes a data field set by the pipeline from the research contract (`collective-action` for all 84 records), with sub-typing to protest, strike or civil unrest only after a source re-read that records the source's own words; no kind is ever guessed from a title, an id or an issue tag. Armed conflict enters as a **separate, re-published context dataset from UCDP** with its own schema, clock, legend and empty state, and it is **blocked** in this environment because no conflict data can be fetched; the interface must therefore ship the empty state first ("No conflict records in this snapshot: the dataset has not been loaded. Absence is not peace."). "Past two years" is the owner's intent, not a product claim: each dataset states its own window. The design that wins is still the one that stays correct on 9 Oct 2026, when the shading, if switched on, must make the whole map paler and say why.

---

## 1. Facts that constrain every decision (verified in the repo, 4 Oct 2026)

| Fact | Value | Consequence |
|---|---|---|
| Records and kind | 84 episodes, 81 countries; **no `kind` field** on any record. All were researched under research/round3/CONTRACT.md ("The unit is a sourced collective-action episode") and round4/CONTRACT.md (same rules). | The only honest kind for all 84 is the contract's own word: collective action. |
| Keyword scan (this session; the inputs' counts differ only by regex) | Riot/clash/unrest/looting/violent wording in 13 records; strike/walkout/stoppage wording in 33 titles or summaries; war/armed/militia/insurgent wording in 0. | Keyword guessing would mislabel real records (§3.2 lists them). It is rejected, as it was for state response in guidance §7.2. |
| What the "unrest" wording actually says | `pg-port-moresby…`: "Separate looting and fires followed during reduced police coverage." `nc-electoral-reform-unrest-2024`: "participants are not collectively assigned responsibility." `fr-schools-20261002`: "attribution varies by incident." `gr-tempe…`: "Clashes with **riot police**." `ir-economic-unrest-2025-2026`: the word is in the stable **id** and title. | The sources themselves refuse the attribution a `civil-unrest` tag would make. Ids never change, so an id can never be a basis. |
| Status | 66 unknown, 18 ended; 0 ongoing. | A kind that implies "war ongoing" has no precedent in the data model for "ongoing". |
| Newest evidence | 2 Oct 2026. From 5 Oct 00:00 UTC the snapshot is "aging", from 9 Oct "stale". | Any recency shading switched on from 9 Oct must show the lightest bands only. |
| "Past 2 years" | 61 of 84 episodes have newest evidence on or after 4 Oct 2024; 23 are earlier in 2024. Research window is 1 Jan 2024 → 2 Oct 2026. | The atlas is not a "past two years" dataset and must not say so. |
| Network | ucdp.uu.se, ucdpapi.pcr.uu.se, data.humdata.org, api.acleddata.com, wikipedia, news hosts: proxy 403. | No conflict or unrest record can be created in this environment. The conflict layer ships as an empty state plus an offline ingest script and validator. |
| Licences (OPEN_SOURCE_RESEARCH.md) | ACLED rejected (EULA). UCDP: CC BY 4.0 reported, to be confirmed. Wikipedia CC BY-SA, never sole evidence. | Conflict records come only from UCDP, re-published with attribution and version. |
| Banned vocabulary (guidance §2, SPEC §18.1, test_shell) | Includes Hotspots, Severity, Danger, Escalating, Unrest index, Live, Right now, Trending. | "Hot" is one letter from "Hotspots"; the metaphor itself is on the wrong side of the list. |
| Map colour today | `--map-reported` #b4772a / #bd8236 is "the only use of ochre"; `--example` #8a6cc2 / #9480cc validated against it all-pairs; the gap hatch `--map-hatch` exists; the ended shadow is the only semantic shadow. | Any new fill must validate against these on `--map-land` and `--map-ocean` in both modes. |
| Budget | Critical JS 92,483 B against a 93,184 B ceiling (701 B headroom); CSS 27,243 B against 28,672 B. | Nothing in this document ships before the lazy-view split or minifier (SPEC §23). |
| Palette validator runs (this session) | Light one-hue ochre ramp `#c89a52,#b4772a,#935f1f,#6e4514`: ALL CHECKS PASS (ordinal) on land #f2f2ec and ocean #e4e9e3. Dark ramp `#e6c48f,#d4a45c,#bd8236,#8f5f22`: ALL CHECKS PASS on dark land and ocean. Ochre+red pair: **FAIL** normal-vision floor (ΔE 13.4 < 15). Ochre+violet+slate (#3f7f8c): **FAIL** chroma floor and normal-vision floor. | A one-hue ramp is feasible. Red beside ochre is not. A third categorical hue on the map is not. |

---

## 2. Decision 1: hue for recency ("hot and cold")

### 2.1 What a hot/cold colour could honestly encode

Only the candidates below were considered. Everything else the words might suggest is already banned by policy.

| Candidate | Verdict | Why |
|---|---|---|
| Date of the newest cited evidence per country (`last_observed_at`, already banded 72 h / 7 d / 30 d / older as `observationBand`) | **Acceptable under the conditions in §2.2** | It is a dated fact about the dataset, already shown as text badges and feed groups. It describes our evidence, not the world. |
| "Activity", "how much is happening" | Rejected | There is no activity measure. Count of records per country is a coverage artefact (legend M8). |
| Intensity, severity, violence, danger, risk | Rejected | EDITORIAL_POLICY: "There is no combined 'severity,' 'danger,' or 'intensity' score." R4 publishes this as not planned. |
| Stance balance | Rejected | Guidance §5.3: stance cannot be summed. |
| Count of episodes per country | Rejected | Coverage, not protest volume; M8. |
| Nothing (keep coverage-only, no control) | Acceptable fallback | If any condition in §2.2 cannot be met in the build, ship this. |

### 2.2 Conditions under which a recency shading is acceptable (all of them, no exceptions)

1. **Opt-in, default off.** The map loads exactly as 4.0 does: binary coverage. A reader chooses the shading with a visible control (§2.4). The choice may live in the view URL so a shared link reproduces the view with its legend; it is never stored in `localStorage`, never remembered across visits, and never switched on by a filter, a route alias or a deep link that does not name it.
2. **The legend names the clock.** The shading uses one clock only: for each country, the newest `last_observed_at` among the records currently matching the filters (the same set that decides today's fill). Bands are the existing `observationBand` edges, from 00:00 UTC for day-only values, recomputed on the 60 s tick and on `visibilitychange` like every other age on the site. The legend says this in words (§2.4).
3. **Copy says "newest evidence", never "activity".** No string of this feature may contain any word in §2.5. The legend rows are the band labels of guidance §3.2 with "Newest evidence dated…" in front.
4. **One hue, sequential lightness, no red.** The ramp is the existing ochre family stepped in lightness, validated with `--ordinal` on `--map-land` and `--map-ocean` in both modes (§2.6). Diverging two-pole scales are rejected (§2.7). Red, orange and any `--warn`/`--danger` token are rejected.
5. **No motion.** No pulsing, no transition keyed to data, no animation when the control toggles beyond the existing 0 ms rule under reduced motion. The band of a country changes only when the clock crosses an edge, exactly as text badges do today.
6. **Neutral everywhere else.** Cards, list rows, band badges, the directory, the brief and the Ahead page keep neutral ink. §3.2's rule "Hue never encodes recency" continues to hold for every surface except the map fill under this control (§2.8).
7. **The staleness banner is unchanged and never substituted.** With the shading on and the snapshot aging or stale, the legend adds the line in §2.4 (from data), and the S4/S5/S6 notice lines stay exactly where they are.
8. **Secondary encoding exists.** The country tooltip and brief already print "Newest evidence {date}"; with the shading on, the tooltip adds the band badge text. Under `(forced-colors: active)` the shading is unavailable and the control says so (§2.4); the designer may offer an ordered hatch-density texture for the four bands (dataviz: textures are allowed when "ordered on value scales", 45°/135° only, opt-in), but a texture is never the only encoding and the legend keeps its text rows.
9. **Empty bands are declared.** A band with no country in view stays in the legend with the suffix " · none in this view", so the darkest step is never implied to exist off-screen.
10. **Example mode and failure states turn it off.** In example mode and when `events.json` failed, the control is hidden and the legend reads as today (C-37, C-38).

If any one of these cannot be met, the feature does not ship and the map stays coverage-only. There is no "partly on" version.

### 2.3 The clock, precisely

- Per country `C` and the filtered set `S` (what `selectFiltered(state, {ignoreCountry: true})` returns today): `newest(C) = max(last_observed_at over e in S with e.country === C)`.
- Band of `C` = `observationBand({last_observed_at: newest(C)}, now)`, so the edges are identical to the badges (strict `< 72 h`, `< 7 d`, `< 30 d`, else older; `unknown` when no date parses).
- A country where any matching record lacks a parseable `last_observed_at` takes the coverage-only fill and the legend adds the row "Newest evidence date not established" for as long as such a record is in view. "Not established" is never shown as the oldest band.
- The time window filter (7 / 30 days) keeps its M9 line; the shading then shows only the two or three bands the window allows, and the others read " · none in this view".
- Day-only values count from 00:00 UTC; nothing in this feature shows a time of day.

### 2.4 Exact copy: control and legend

Control (a segmented control or two radio chips inside `#map-legend`, above the list; the fieldset's legend is the group label):

- **SH1 Group label:** "Shade countries by"
- **SH2 Option 1 (default, pressed):** "Published coverage"
- **SH3 Option 2:** "Date of newest evidence"
- **SH4 Help line, shown only while SH3 is pressed:** "Shading follows the date of the newest cited evidence among the records shown for each country. It does not show how much happened, or whether anything continues."
- **SH5 Forced-colours / unavailable:** "Shading by date is not available in high-contrast mode. Each country's newest evidence date is in its brief and in the list." (SH3 is disabled, not hidden.)
- **SH6 Example mode:** control hidden; if the designer prefers a disabled control, its note reads "Shading by date is not available for the illustrative example."

Legend while SH3 is pressed (M1 "What the colours mean" unchanged; M3–M7 unchanged):

- **M2a:** "Newest evidence dated within the last 72 hours"
- **M2b:** "Newest evidence dated 3 to 7 days ago"
- **M2c:** "Newest evidence dated 7 to 30 days ago"
- **M2d:** "Newest evidence dated more than 30 days ago"
- **M2e (only when it occurs):** "Newest evidence date not established"
- **Empty-band suffix:** " · none in this view"
- **M8a (replaces M8 while SH3 is pressed):** "Shading shows how recently a cited source reported something in each country's published records. It does not show how many protests there were, how large they were, how severe, or whether they continue."
- **M10 (dataset aging, stale or archive; value from `updateStamps().latestObservation`):** "No record in this snapshot has evidence newer than {2 Oct 2026}."
- **Tooltip line added while SH3 is pressed:** "Newest evidence {2 Oct 2026} · {Within 72 h}" (the F1–F5 badge text).
- **About, "How to read the map" list, new item:** "Shading by date, when you switch it on, follows the newest cited evidence per country. It is off by default and never shows how many protests there were, how large they were, how severe, or whether they continue."

The swatches are `aria-hidden`; the text carries the meaning. Each row's swatch is the actual step hex for the current mode, so a reader can match map to legend without inferring the direction of the ramp.

### 2.5 Banned words for this feature

**Global additions to SPEC §18.1 and `test_shell` BANNED** (whole word or phrase, case-insensitive, with the existing data-verbatim exception): "hot", "cold", "heat", "heatmap", "heat map", "warm", "cool", "temperature", "thermal", "flare-up", "flaring", "surge", "spike", "uptick", "intensifying", "de-escalating".

**Feature-scoped bans** (a unit test over the shading copy object, because these words are legitimate elsewhere on the site): "activity", "active", "recent", "latest" (except inside the fixed phrase "latest evidence"), "now", "today", "protests" (the legend talks about records and evidence, never about protests in the world), "intensity", "quiet", "calm", "nothing happening", "no activity", "newest" without "evidence" following it, "fresh" (the internal band key must not leak into copy).

The product never uses the words "hot", "cold" or "heat" for this control, in the roadmap, in release notes or in the About page. The roadmap item is titled "Shading by date of newest evidence" (§7.7).

### 2.6 Sequential one-hue versus diverging two-pole: decided with the validator

The dataviz colour formula assigns diverging scales to **polarity** ("which side of a baseline") and sequential scales to **magnitude**. Recency has no baseline and no opposite pole; "older" is not the opposite of "newer" in the way "loss" is the opposite of "gain". A two-pole scale would also put a cool pole on the countries with the oldest evidence, and a cool colour on a world map reads as "quiet" or "calm", which is exactly the coverage-gap misreading M3 exists to prevent. Diverging is therefore rejected on structure before any hex is chosen.

Validator runs, light mode (`validate_palette.js … --ordinal`):

```
#c89a52,#b4772a,#935f1f,#6e4514  --surface #f2f2ec (land)   Lightness monotone PASS · Adjacent ΔL PASS · Light-end contrast 2.28:1 PASS · Single hue (11°) PASS → ALL CHECKS PASS
#c89a52,#b4772a,#935f1f,#6e4514  --surface #e4e9e3 (ocean)  Light-end contrast 2.08:1 PASS → ALL CHECKS PASS
#e3c89b,#cfa463,#b4772a,#7f5219  --surface #f2f2ec           Light-end contrast 1.44:1 FAIL   (rejected: the lightest step vanishes into land)
#c9a05f,#b4772a,#8f5a1c,#6b4213  --surface #e4e9e3           Light-end contrast 1.97:1 FAIL   (rejected on ocean)
```

Dark mode:

```
#e6c48f,#d4a45c,#bd8236,#8f5f22  --mode dark --surface #2b312e (land)   ALL CHECKS PASS (light end #8f5f22 at 2.42:1)
#e6c48f,#d4a45c,#bd8236,#8f5f22  --mode dark --surface #0e1311 (ocean)  ALL CHECKS PASS (3.42:1)
```

Why red is not an option even as a pole (`--pairs all`, light land):

```
#b4772a,#c0392b  CVD separation WARN (ΔE 7.3 deutan) · Normal-vision floor FAIL (ΔE 13.4 < 15) → FAILED
```

Decisions that follow:
- **Structure:** sequential, one hue (ochre), four steps for the four bands. Step 2 of each ramp is today's `--map-reported`, so coverage-only and shading share a hue family and the map does not change identity when the control is toggled.
- **Direction:** in both modes the **newest band is the step farthest from `--map-land`** (darkest in light mode, lightest in dark mode) and the oldest band is the step nearest to it. That is why the hex order flips between modes; the legend swatches make it explicit. WP1 may re-step the hexes, but the final set must reproduce ALL CHECKS PASS in both modes on both surfaces and the output goes into the hand-off, as §17.2 did for 4.0.
- **Tokens:** `--map-evidence-1 … --map-evidence-4` (newest → oldest), defined in `styles.css` only; `map.js` sets a data attribute (`data-evidence-band`) and `css/map.css` paints, per tech §5.6. No inline fills.
- **The no-record hatch, the ended shadow, the selection outline and the city dots are unchanged** in both modes of the control.

### 2.7 Rejected, with reasons

| Proposal | Why it is rejected |
|---|---|
| Diverging "hot ↔ cold" | No baseline; the cool pole reads as "calm", which is a coverage-gap lie; structure reserved for polarity by the colour formula. |
| Red or orange for the newest band | `--danger` is the load-error token; red on a world map reads as alarm or war; it fails the normal-vision floor beside ochre (ΔE 13.4). Status colour on a non-status series is an anti-pattern. |
| Shading by number of episodes per country | Coverage artefact (M8); the densest country is the best-searched one, not the most protested. |
| Any hue on cards, badges or the list | §3.2 holds; the feed is already sorted by date; colour there is the "live feed" look the 4.0 panel refused. |
| Default on | On 9 Oct the whole map would be pale and read as "the world went quiet". Coverage-only is the only default that is true every day. |
| Persisting the choice across visits | A reader returning on a stale day would meet a pale map without having asked for it. URL state is enough. |
| Animating the toggle or the tick | Motion on data is the single clearest "live" signal (§17.6; risk 1 of the 4.0 register). |
| A fifth or finer band (e.g. "today") | False precision for day-only dates; the badges stop at 72 h for the same reason. |
| Calling it "hot/cold", "heat", "temperature", "warm/cool" | Metaphor of danger and calm; adjacent to the banned "Hotspots"; see §2.5. |

### 2.8 Amendment to EDITORIAL_GUIDANCE.md §3.2 (exact replacement text)

Replace the last bullet of §3.2 ("Badges are neutral ink on neutral fill in every band. Hue never encodes recency.") with:

> Badges are neutral ink on neutral fill in every band. Hue never encodes recency on cards, list rows, badges, the directory, the brief or the Ahead page. On the map only, the **lightness** of the single coverage hue may encode the date of each country's newest cited evidence, and only while the reader has pressed "Shade countries by: Date of newest evidence" (4.1 editorial §2). The default is coverage only, the legend names the clock, and the staleness notice is unchanged.

---

## 3. Decision 2: kind taxonomy

### 3.1 Definitions

Each kind is one sentence, in our own words, with the basis it borrows from. Kinds are single-valued. The first four belong to `events.json`; the last four belong to `conflicts.json` (§4) and never appear on a protest record.

| Key | Badge label | Definition (one sentence) | Citable basis | How a record gets it |
|---|---|---|---|---|
| `collective-action` | Collective action | A sourced episode in which a collective actor (demonstrators, workers, a union, a movement) acts publicly to press a demand or position against a named target, where the record does not distinguish a demonstration from industrial action. | research/round3/CONTRACT.md: "The unit is a sourced collective-action episode, not an entire country, ideology or social movement"; EDITORIAL_POLICY "Purpose and scope". | Pipeline default for every record researched under the round-3 and round-4 contracts. |
| `protest` | Protest | A public gathering, march, rally, sit-in, vigil or similar action in which participants express a position toward a named target and, as the cited source describes it, do not themselves engage in violence against people or property, whatever force is used against them. | ACLED codebook concept "Protests" (participants not engaging in violence, though violence may be used against them), in our words; EDITORIAL_POLICY "Clearly label demonstrations, counter-demonstrations, planned events". No size threshold (Mass Mobilization's 50-person rule is not adopted). | Source re-read only (§3.3). |
| `strike` | Strike | A temporary collective withdrawal of labour (stoppage, walkout, go-slow, occupation) by one or more groups of workers or their union to enforce or resist demands or express grievances, as the cited source describes it. | ILO, Resolution concerning statistics of strikes, lockouts and other action due to labour disputes (15th ICLS, 1993), definition of a strike, paraphrased. | Source re-read only. |
| `civil-unrest` | Civil unrest, as reported | An episode in which the cited source itself attributes violence or destruction (rioting, looting, arson, fighting between groups of residents) to participants or a crowd connected with the collective action, as distinct from force used against them. | ACLED codebook concept "Riots" (violent demonstration; mob violence) **in our own words, not their data or their coding**; EDITORIAL_POLICY: "Identify who allegedly did what instead of relying on ambiguous 'clashes'." | Source re-read only, under the §5 rules. |
| `armed-conflict-intrastate` | Armed conflict · intrastate | Organised armed fighting over government or territory between the government of a state and one or more organised non-state armed groups, inside that state, that UCDP codes with at least 25 battle-related deaths in a calendar year (UCDP `type_of_conflict` 3, or 4 when another state intervenes with troops, labelled "internationalised"). | UCDP/PRIO Armed Conflict Dataset codebook: state-based armed conflict definition and `type_of_conflict`. | UCDP coding only (§4). |
| `armed-conflict-interstate` | Armed conflict · interstate | Organised armed fighting between the governments of two or more states that UCDP codes with at least 25 battle-related deaths in a calendar year (`type_of_conflict` 2). | Same codebook. | UCDP coding only. |
| `non-state-conflict` (optional) | Non-state conflict | Armed fighting between two organised armed groups, neither of which is the government of a state, that UCDP codes with at least 25 battle-related deaths in a calendar year. | UCDP Non-State Conflict Dataset codebook. | UCDP coding only. |
| `one-sided-violence` (optional) | One-sided violence | The deliberate use of armed force by the government of a state or by a formally organised group against civilians that UCDP codes with at least 25 deaths in a calendar year, excluding extrajudicial killings in custody. | UCDP One-sided Violence Dataset codebook. | UCDP coding only. |

**UCDP thresholds, as the product must state them (to be checked against the downloaded codebook):**
- Armed conflict: at least **25 battle-related deaths in one calendar year** (UCDP intensity level 1, "minor": 25–999).
- War: at least **1,000 battle-related deaths in one calendar year** (intensity level 2). The atlas uses the word "war" **only** as "UCDP intensity: war (at least 1,000 battle-related deaths in {year})", never as a free adjective.
- `type_of_conflict`: 1 extrasystemic (none coded after 1974), 2 interstate, 3 intrastate (internal, no outside troops), 4 internationalised intrastate.
- UCDP's `start_date` (first battle-related death) and `start_date2` (first year the 25-death threshold was reached) are different dates; the atlas shows the one it uses with its name.

**Why kinds live in two datasets, from an editorial view** (the architect decides the mechanism; these are the reasons it must be two): the editorial unit differs (an episode with positions, intensity facets and state response, versus a dyad with parties and yearly fatality estimates); the clocks differ (72-hour evidence ageing versus calendar years and provisional months); the sources differ (news articles read by an AI-assisted process versus a curated dataset re-published with its version); and the counts must never be summed ("84 episodes" never becomes "84 episodes and conflicts"). A single schema would weaken the protest validator and invite exactly that sum.

### 3.2 What the 84 existing records get

- **`kind: "collective-action"` on all 84**, written by `scripts/merge_history.py` from the research round, not by anyone reading titles. The rationale is the contract itself: every record was researched as a "sourced collective-action episode", and protests and strikes were not distinguished at research time. Defaulting to `protest` would be false for the 29–33 strike episodes; defaulting by keyword would be false for the records in §1.
- **`kind_basis`** accompanies `kind` on every record, with exact keys `{"method", "text", "source_ids"}`:
  - `method`: `"contract-default"` or `"source-reread"`.
  - For the 84: `{"method": "contract-default", "text": "Researched as a sourced collective-action episode under the round-3 research contract; protest and industrial action were not distinguished at research time.", "source_ids": []}`.
  - The validator requires `source_ids` to be non-empty, and event-local, whenever `kind !== "collective-action"`; a `contract-default` method is legal only with `kind === "collective-action"`.
- **Why keyword guessing is rejected, on the actual records** (the §7.2 argument, repeated because it holds again):
  1. *Wrong actor:* `pg-port-moresby-payroll-protest-20240110` would become civil unrest, but the source says "**Separate** looting and fires followed during reduced police coverage": the looters were not the protesting public servants.
  2. *Attribution refused by the source:* `nc-electoral-reform-unrest-2024` says "participants are not collectively assigned responsibility"; `fr-schools-20261002` says "attribution varies by incident".
  3. *Wrong referent:* `gr-tempe-accountability-2025` matches "riot" because the police unit is called riot police.
  4. *Stable ids and titles:* `ir-economic-unrest-2025-2026` carries "unrest" in its id, which can never change, and in its title, which describes a broadening movement, not participant violence.
  5. *Mixed episodes:* `ao-fuel-20250728` ("A taxi strike … expanded into unrest") and `tn-gabes-20251021` ("pollution protests and general strike") are a strike, a protest and in one case reported unrest; a single keyword pick would be arbitrary.
- **Display while every record shares one kind.** The record sheet Overview shows a fact row "Kind: Collective action · protest or strike not distinguished in this record". Cards and list rows **do not** carry a kind badge until the loaded data hold at least two distinct kinds across both datasets: 84 identical badges inform no one and cost first-viewport height (smoke 17 passes by small margins). The Kind filter group appears under the same condition. If the designer prefers a badge from day one for layout stability, its text is "Collective action" in the neutral `.status`-style ink; it is never a coloured pill.
- **Never derived client-side**, never from `issues` ("Public order" on the PNG record is a tag, not a finding), never from `title`, `id`, `summary` or `intensity.violence`.

### 3.3 How sub-typing to strike, protest or civil unrest may happen later

- Only through a **source re-read** in a research round (round 5 or later), by the data session with news access, under a contract clause added to research/round4/CONTRACT.md (or its successor): the re-reading agent opens a cited source, records the source's own words for the form of action (for example "general strike", "walkout", "march", "rally", "sit-in"; for unrest, the sentence that attributes violent acts to participants), and writes `kind` with `kind_basis = {"method": "source-reread", "text": "<paraphrase of the source's wording, naming who did what>", "source_ids": ["<event-local source>"]}`.
- `merge_history.py` refuses a kind change without a `kind_basis` (mirroring the existing `status_basis` rule in `apply_round4`).
- An episode that is both a strike and a demonstration stays `collective-action`, with `kind_basis.text` saying both are reported. Kind is not multi-valued.
- A kind is never changed by a validator rerun, a rebuild or a re-read of a source that does not speak to the form of action.
- The roadmap item for this is **blocked** on news access (§7.7); the field and validator ship first with the default.

### 3.4 Colour and pattern per kind: editorial constraints for the designer

- **Hue does not encode kind on the map.** Two reasons, either sufficient: (a) under the all-pairs cap the map has room for about three hues and ochre plus the example violet already hold two, and my run of a third (slate #3f7f8c) failed the chroma floor and the normal-vision floor against violet in both modes; (b) a second hue for armed conflict turns a protest atlas into a war map at a glance, and the eye reads the war hue as danger whatever the legend says.
- **Kind on the map is a texture**, which the owner's own request for colour-blind patterns supports: protest and strike coverage stays the solid ochre fill; a UCDP conflict location is a hatch in ink (`--text`) at a visibly different angle, spacing and colour from the light gap hatch (`--map-hatch`); a country with both shows both (ochre fill under the ink hatch) and the legend has a row for it. The designer owns the geometry; the editor requires: never hue alone; never a `--warn`/`--danger` token; the conflict hatch and the gap hatch distinguishable under deuteranopia and protanopia simulation, in `(forced-colors: active)` (the gap hatch is CanvasText there, so the conflict texture must differ in geometry, for example cross-hatch or dash) and in a grayscale print of the legend; the legend swatch painted from the same tokens; no texture on cards.
- **Kind on cards, rows and the sheet is text**: a `.kind[data-kind]` badge styled like `.status[data-status]` (text plus a `::before` glyph, neutral ink, 12 px minimum, 4.5:1). No red, no icons of fists, flames, helmets or weapons.
- **Layers.** When `conflicts.json` is loaded, a "Show on the map" group offers "Protests and strikes" and "Armed conflict (UCDP)". Both are on by default, because hiding published conflict coverage would misstate what the dataset holds; the legend separates them, and the conflict footnote (§7.3) says what the texture is not. When the file is absent, the conflict option is disabled with the empty-state note (§7.5).

---

## 4. Decision 3: armed conflict in a protest atlas

### 4.1 Scope test and the shape it may take

EDITORIAL_POLICY's purpose is "reported demonstrations, their demands, opposing positions, timeframes, and documented state responses". Armed conflict is outside that purpose, so adding it needs a policy amendment (v1.3) that states the layer's purpose in one sentence: *"Armed conflict records are re-published context from UCDP, so that protest coverage is not read in a vacuum; they are not Protest Atlas research and they do not make this atlas a conflict tracker."*

The only version this product may claim is a **context layer from one curated, openly licensed source, re-published with its version, its definitions and its uncertainty**. We do not research conflicts ourselves and we never build a conflict record from news sweeps: the evidence process behind the protest records (an AI-assisted read of single articles) is not adequate for death counts, and the policy says claims about deaths "require attributable evidence and explicit uncertainty". UCDP's best/low/high per calendar year is that evidence; a news paragraph is not.

### 4.2 What "ongoing" may mean for a conflict (and what it may never mean)

Our 72-hour rule is a rule about news evidence of collective action. Applying it to a yearly or monthly curated dataset would be false precision in both directions, so conflict records never use the words "ongoing", "Reported ongoing", "needs review" or any `.status` label. They carry an **activity basis** instead:

| Basis | Condition | Label (exact) |
|---|---|---|
| Active year | The conflict appears in the UCDP annual dataset for calendar year Y with at least 25 battle-related deaths | "Recorded as active by UCDP in {2024}" (one line per year in the window) |
| Provisional months | UCDP Candidate (monthly, provisional) events exist for the conflict in month M after the last annual year | "Provisional UCDP events recorded through {Aug 2026}, subject to revision" |
| Not in latest year | The conflict is absent from the latest annual year in the download | "Not recorded by UCDP as active in {2025}. Absence from the dataset is not evidence of peace." |

Definitions shown once on the record and in About: *"'Recorded as active' means UCDP coded at least 25 battle-related deaths in that calendar year. This atlas does not know whether fighting is taking place today."* The latest month or year in the download is the record's "latest evidence" for sorting and for the Kind filter; it is never fed into `observationBand`, the staleness clock or the shading of §2.

### 4.3 How fatality figures appear

- Always as UCDP's **best, low and high** for a named calendar year and a named dataset version: "Battle-related deaths, {2024}: best estimate {n} · low {l} · high {h} (UCDP {Battle-Related Deaths Dataset 25.1})". Provisional months: "Provisional events, {Aug 2026}: best {n} · low {l} · high {h} (UCDP Candidate, subject to revision)".
- Never a single number without its bounds; never a sum across years, datasets or conflicts; never a rate, a per-capita figure, a rank or a superlative ("deadliest").
- Never the words "casualties" (UCDP counts deaths, not the wounded), "death toll", "so far", "to date", "rising", "live", "latest casualties", "killed today".
- Fixed note under every figure block: *"Battle-related deaths as UCDP defines and estimates them: combatants and civilians killed in fighting between the parties, per calendar year, with UCDP's low and high bounds. Not a total for the war, and not a count of everyone who died because of it."*
- Zero is shown as UCDP publishes it and never as a dash; a missing year is "not recorded", never 0.

### 4.4 Parties

- Parties are named exactly as UCDP names them (`side_a`, `side_b`), with the line "Parties as named by UCDP." Governments appear as "Government of {state}". Organised groups appear under UCDP's name, including UCDP's aliases if the dataset gives them.
- No individuals, no leaders, no commanders, no spokespeople. No labels such as "terrorists", "rebels", "militants" or "regime" unless the string is UCDP's own party name, and then only as that name.
- Location: the country or countries UCDP lists as the conflict's location, shown as "UCDP conflict location: {names}" with the note "A conflict may have more than one location country; placement follows UCDP, not this atlas." Disputed names follow the existing open item on display names (TW, PS); no new judgement is made here.

### 4.5 Forbidden in the conflict layer

No front-line maps; no plotting of UCDP GED event coordinates (the map stays country-level coverage); no troop positions, bases, "controlled territory" or "contested areas"; no danger, risk, threat or "conflict intensity" score; no "safe/unsafe"; no travel advice; no predictions, trend arrows or "deteriorated/improved" flags (CrisisWatch was already rejected for this); no "escalating", "intensifying", "flare-up", "hot war", "active war zone"; no comparison tiles between protest and conflict counts; no "N countries at war" stat tile (a count of **records** in scope wording is allowed: "{n} UCDP conflict records in this snapshot"); no daily auto-refresh framed as monitoring; no news-sourced casualty claims mixed into a UCDP record.

### 4.6 What a conflict record must contain to be publishable, and what it must not

**Must contain (validator-enforced, exact keys):**
- `id` (stable slug), `kind` (one of the four conflict kinds), `kind_basis` `{"method": "ucdp-coding", "text": "...", "source_ids": [...]}`.
- `ucdp` `{"conflict_id", "dyad_ids": [...], "conflict_name", "type_of_conflict": 2|3|4, "type_label"}`.
- `parties` `{"side_a": [...], "side_b": [...]}` as UCDP strings.
- `location_countries`: ISO codes present in `countries.json`, from UCDP's location field.
- `start` `{"ucdp_start_date", "ucdp_start_date2"}` as UCDP gives them, with the field names kept.
- `years` array: `{"year", "intensity_level": 1|2, "intensity_label": "armed conflict"|"war", "deaths": {"best", "low", "high"}, "source_ids": [...]}` with `low <= best <= high`, integers, no nulls (a year not in the dataset is simply absent).
- `provisional` array (may be empty): `{"month": "2026-08", "events", "deaths": {"best", "low", "high"}, "source_ids": [...]}`.
- `latest_recorded`: the last year or month present, as an ISO string (`"2024"` or `"2026-08"`), and `activity_basis` with one of the three labels in §4.2.
- `sources`: UCDP dataset entries `{"id", "dataset", "version", "url", "licence", "citation", "downloaded_at"}`; every claim array references them.
- Envelope: `schema_version`, `generated_at`, `window` `{"first_year", "last_year", "last_provisional_month"}`, `licence_note`, `method_note` (fixed text in §7.6), `records`.

**Must not contain (validator-rejected):** latitude, longitude, geometry or any field with "lat", "lon", "coord" in its name; event-level rows; names of individuals; free-text casualty claims; any `status` field; any field named `severity`, `risk`, `danger`, `score`, `trend`.

**Must be true before publication (editorial gate):** the UCDP licence line and citation are confirmed from the downloaded dataset's own terms (CC BY 4.0 reported, unconfirmed here); the version numbers in the records equal the files downloaded; the window `last_year` and `last_provisional_month` are the newest actually present, never today's date; the About and legend copy name that window; the dataset is the same for every record (no mixing of GED sums with BRD dataset figures within one record).

---

## 5. Decision 4: civil unrest

### 5.1 Evidence rules

1. **Riot versus protest is a reporting judgement, so the source's own wording is required.** A record becomes `civil-unrest` only when the cited source itself attributes violence or destruction to participants or a crowd connected to the action, and `kind_basis.text` paraphrases that attribution naming who did what, with `source_ids`. "Clashes", "turned violent", "unrest" and "tensions" are not attributions and do not qualify on their own.
2. **Three things that are not civil unrest:**
   - *Protest with intervention:* police or security forces dispersed, arrested or blocked participants. That is `state_response` (and, when NEXT-1 ships, a coded state-response type), not a kind.
   - *Excessive force against protesters:* force that a competent finding (court, inquiry, OHCHR, a named rights body) or an attributed allegation calls excessive or unlawful. That is `state_response` with its attribution and qualifier kept, never a kind, and never a bare adjective (policy: "Legal characterizations such as 'unlawful' or 'excessive' must be attributed").
   - *Separate violence near a protest:* looting, arson or fighting that the source separates from the protesting actor (the PNG record). The kind stays `collective-action` or `protest`; the violence goes in the "Violence or harm" row with its own attribution.
   These are the ACLED conceptual distinctions (peaceful protest / protest with intervention / excessive force / riots) borrowed in our own words, as OPEN_SOURCE_RESEARCH.md decided; we do not reproduce ACLED's coding or data.
3. **The violence row stays separate.** `intensity.violence` continues to record participant conduct and state force as the source reports them, with D5-violence-note; a `civil-unrest` kind does not replace, summarise or colour that row.
4. **Government characterisations are claims.** When officials call an action a riot or unlawful assembly, that is a position or a state-response attribution ("described as riots by the interior ministry"), not evidence for the kind. In high-repression contexts, `civil-unrest` needs independent national or international reporting that itself attributes violent acts to participants; otherwise the record stays `collective-action`.
5. **Communal violence** is `civil-unrest` only where the source says so and names the groups as the source does; ethnicity, religion or politics are never inferred from a place or a crowd.
6. **One kind per episode; the episode is the unit.** A march on Monday and a riot on Tuesday that the source treats as one episode are one record whose kind follows the source's framing of the episode and whose timeline carries both days; if the source treats them as separate episodes, so do we.

### 5.2 Avoiding the criminalisation of protesters

- The badge reads "Civil unrest, as reported": the suffix is part of the label, not a tooltip, because the label describes reporting, not a verdict. The policy says the atlas is not "a determination of criminal responsibility".
- Actors print exactly as stored; "rioters", "mob", "thugs" and "looters" never appear as actor labels or in our copy. Titles describe the episode, not the people.
- D5-violence-note stays on every record: "Arrests or police force are not evidence that participants were violent."
- No filter or sort surfaces "violent" records as a ranking; the Kind filter chip lists kinds alphabetically after "Any kind" and shows no counts larger than the status filter shows today.
- Filter help for the chip (exact): *"Episodes where the cited source itself reports violence or destruction by participants. Force used by police or security services does not make an episode 'civil unrest'."*
- Record-sheet note on every `civil-unrest` record (exact): *"Kind follows the cited source's own account of what participants did. It is not a finding about any person, and arrests or police force are not evidence of participant violence."*
- No existing record acquires this kind in 4.1: all 13 keyword hits stay `collective-action` until a source re-read under §3.3, which is blocked on news access.

---

## 6. Decision 5: the "past 2 years" window

- **"Past 2 years" is the owner's intent, not a claim the product makes.** The protest research window is `window_start` 2024-01-01 to `WINDOW_END` 2026-10-02 (33 months, searched days only). 61 of 84 episodes have newest evidence on or after 4 Oct 2024; 23 are earlier in 2024. We neither drop the 23 nor relabel the atlas. UI copy writes "since January 2024" or "1 Jan 2024 – 2 Oct 2026", never "the past two years".
- **Conflict data have their own start and end.** UCDP annual datasets cover calendar years and are released once a year (GED and BRD 25.1 cover 1989–2024; a 26.1 release covering 2025 is expected in 2026: confirm what exists at download time). UCDP Candidate is monthly and provisional, released about a month in arrears. So the conflict window is "calendar years 2024–{Y}, plus provisional months through {Mon YYYY}", which ends earlier than the protest window and is coarser at both ends. The ingest keeps `first_year` = 2024 to match the research start; it never backfills earlier years into this snapshot.
- **Every dataset states its own window, every time, in the same sentence shape.** About "Research scope" and the dates sheet gain: *"Protest and strike records: news reports read for searched days from 1 Jan 2024 to {2 Oct 2026}, AI-assisted. Armed conflict records: UCDP {datasets and versions}, calendar years 2024 to {2024}, with provisional events through {Aug 2026}; downloaded {date}."* No single "Coverage: Oct 2024 – Oct 2026" line may exist anywhere.
- **Clocks never merge.** Site staleness stays measured from the newest protest evidence (`updateStamps().latestObservation`). The conflict dataset gets its own stamp row, "Conflict dataset" (§7.8), and never changes the header chip or the S4–S6 banners. A fresh UCDP download never makes the protest snapshot "current", and a fresh protest sweep never refreshes the conflict stamp.
- **Window filters apply to protest and strike records only.** The 7- and 30-day options and the band groups cannot describe yearly data; with a window active, conflict records are excluded from the list and map and the legend adds: *"Time window filters apply to protest and strike records only; conflict records are yearly and monthly."* The Year filter, when it includes conflicts, labels its basis: *"UCDP active year"* for conflict records versus evidence dates for episodes.
- **Honest labelling when the two ends differ** (the normal case): the legend's conflict row names its years ("Armed conflict recorded by UCDP in 2024, matching your filters"), the protest row names nothing (it is the dated snapshot the chip describes), and About carries the paired sentence above. A country hatched for 2024 while its protest record is dated 2 Oct 2026 is correct and the record sheet shows both dates with their names.

---

## 7. Copy deck (exact text; `{…}` is a data placeholder; all dates UTC)

### 7.1 Shading control and legend
SH1–SH6, M2a–M2e, M8a, M10 and the tooltip line are in §2.4 and are not repeated here.

### 7.2 Kind badges and filter
- **K1 Filter group label:** "Kind"
- **K2 Options** (only kinds present in the loaded data are listed, as the status filter does; alphabetical after the first): "Any kind" · "Armed conflict, interstate" · "Armed conflict, intrastate" · "Civil unrest, as reported" · "Collective action (protest or strike)" · "Non-state conflict" · "One-sided violence" · "Protest / demonstration" · "Strike / industrial action"
- **K3 Filter help:** "Kind is set from the research contract, from a re-read of the cited source, or from UCDP's own coding. It is never guessed from words in a title. 'Collective action' means the record did not distinguish a protest from a strike."
- **K4 Civil-unrest option help (shown beside that option):** §5.2 filter help, verbatim.
- **K5 Badge labels** (`.kind[data-kind]`, neutral ink, text plus glyph): "Collective action" · "Protest" · "Strike" · "Civil unrest, as reported" · "Armed conflict · intrastate" · "Armed conflict · interstate" · "Non-state conflict" · "One-sided violence"
- **K6 Badge accessible name for the default:** "Kind: collective action; protest or strike not distinguished in this record"
- **K7 Record Overview fact row:** "Kind: {label}" with, for `contract-default`, " · protest or strike not distinguished in this record"; for `source-reread`, a second line "Basis: {kind_basis.text} [Source n]"; for `ucdp-coding`, "Basis: UCDP coding, {dataset version}".
- **K8 Active-filter chip:** "Kind: {label}" (prefix "Remove filter: " visually hidden, as today).
- **K9 Filter no match (E1 variant):** "No published record of this kind matches these filters." followed by E1's second sentence verbatim.

### 7.3 Map legend rows for layers and kinds (reported mode, `conflicts.json` loaded)
- **L1 Layer group label:** "Show on the map"
- **L2 Layer options:** "Protests and strikes" · "Armed conflict (UCDP)"
- **M2 (replaces M2 only while the conflict layer exists):** "Published protest or strike episode matches your filters"
- **M2c1:** "Armed conflict recorded by UCDP in {2024}, with a location in this country, matching your filters"
- **M2c2:** "Both: a published episode and a UCDP conflict record"
- **M3 (replaces M3 while the conflict layer exists):** "No published episode or conflict record matches. A coverage gap, not 'no protests' and not peace"
- **M11 Conflict footnote:** "Conflict hatching marks countries UCDP lists as a conflict location in the years shown. It is not a front line, a map of fighting, or a rating of how serious the conflict is."
- **M12 Window note (window ≠ all, conflict layer on):** "Time window filters apply to protest and strike records only; conflict records are yearly and monthly."
- M4–M7 and M8 (or M8a) are unchanged.

### 7.4 Record sheet for a conflict record
- **Eyebrow:** "Conflict record · UCDP data"
- **Title:** "{ucdp.conflict_name}"
- **CD1 Meta:** "Re-published from UCDP {version} · downloaded {date} · not Protest Atlas research · no human editorial review"
- **CD2 Kind line:** "{K5 label} · UCDP type {2|3|4}: {interstate | intrastate | internationalised intrastate}"
- **CD3 "What UCDP records"** (dl): "Parties" {side_a} / {side_b} · "Location" {countries} · "Start (UCDP start_date)" {date} · "Threshold first met (UCDP start_date2)" {date}
  - **CD3-sub:** "Parties as named by UCDP. Governments are named as institutions; no individuals are named. A conflict may have more than one location country; placement follows UCDP, not this atlas."
- **CD4 "Years recorded active"** (table: Year · UCDP intensity · Best · Low · High · Source): intensity cell reads "armed conflict (25–999 battle-related deaths)" or "war (at least 1,000 battle-related deaths)".
  - **CD4-sub:** §4.3 fixed note, verbatim.
  - **CD4-status:** "'Recorded as active' means UCDP coded at least 25 battle-related deaths in that calendar year. This atlas does not know whether fighting is taking place today."
  - **CD4-absent (latest annual year missing):** "Not recorded by UCDP as active in {2025}. Absence from the dataset is not evidence of peace."
- **CD5 "Provisional months"** (table: Month · Events · Best · Low · High · Source), or when empty: "No provisional UCDP events are in this snapshot for months after {2024}. That is a limit of this download, not a statement about fighting."
  - **CD5-sub:** "UCDP Candidate events are provisional and are revised before they enter the annual dataset."
- **CD6 "What this record does not say":** "This record does not show where fighting happened, who holds territory, whether the conflict is growing or shrinking, or how many people have died in total."
- **CD7 "Source and licence":** "{dataset} {version}, Uppsala Conflict Data Program · {licence} · downloaded {date} ↗" and the citation line UCDP requests, verbatim from the download.
- **Sticky tabs:** "Overview · Years · Months · Limits · Source"
- No "For/against", "Intensity", "Police/state", "Outcome" or "Timeline" sections exist on a conflict record; the sheet never borrows them.

### 7.5 Empty and failure states
- **EC1 Conflict dataset absent (map legend, Kind filter note, About):** "No conflict records in this snapshot: the dataset has not been loaded. Absence is not peace."
- **EC2 Conflict file failed to load (notice line, legend, About):** "Conflict records could not load, so they are unknown here, not absent." [Retry]
- **EC3 Country brief, no episode but a conflict record:** "{Country}: no published protest or strike episode. UCDP records {n} armed {conflict|conflicts} with a location in {Country} in {2024}."
- **EC4 Country brief, conflict layer loaded, none for the country:** "{Country}: no UCDP conflict record reaches the 25-death threshold for {2024}. That is a threshold, not a statement that there was no armed violence."
- **EC5 Kind filter when only one kind exists:** the group is hidden; About states: "Every record in this snapshot is a collective-action episode (a protest or a strike, not distinguished at research time). No record has been re-read for its kind, and no conflict records have been loaded."
- **EC6 Layer option disabled:** "Armed conflict (UCDP) · not loaded in this snapshot"

### 7.6 About methodology paragraphs (static, verbatim)
Under "How to read the map", append after the existing four items:
- "Shading by date, when you switch it on, follows the newest cited evidence per country. It is off by default and never shows how many protests there were, how large they were, how severe, or whether they continue."
- "Hatching marks countries that UCDP lists as the location of an armed conflict in the years shown. It is a coverage mark from a re-published dataset, not a front line and not a rating of how serious the conflict is."

New section `h2` "Kinds of record":
> "Every protest and strike record carries a kind. Records researched under this atlas's own contract are 'collective action' until a cited source is re-read and its own words say whether the action was a protest, a strike, or civil unrest in which the source itself attributes violence or destruction to participants. Kind is never guessed from a title or a tag, and arrests or police force never make an episode 'civil unrest'. Armed conflict records are different in kind and in origin: they are re-published from the Uppsala Conflict Data Program (UCDP), which codes an armed conflict when fighting between organised parties causes at least 25 battle-related deaths in a calendar year, and a war at 1,000. Those records show UCDP's parties, years, and best, low and high death estimates with the dataset version and download date. They say nothing about where fighting happens, who holds territory, or how the conflict is changing, and their yearly clock is separate from the 72-hour evidence rule that governs protest records."

Method note stored in `conflicts.json` (`method_note`, so the UI can render it and the validator can require it): "Re-published UCDP data, {datasets and versions}, downloaded {date}, under {licence}. Country placement follows UCDP's location field. No event coordinates, individuals, or Protest Atlas research are included. Absence of a country is a threshold and coverage fact, not evidence of peace."

### 7.7 Roadmap item texts (for `public/roadmap.json`; statuses as of planning, 4 Oct 2026; the lead flips "next" to "in-progress" when code lands and to "shipped" only under §22.4)

| id | title | summary | area | status | blocked_by | depends_on | acceptance |
|---|---|---|---|---|---|---|---|
| `lazy-views-and-budget-headroom` | Lighter first load before new features | The critical script budget has about 700 bytes of room. Ahead, Countries and About will load when first opened, and a build step will strip comments, so new features fit without raising the ceiling. | infrastructure | next | null | [] | Critical JS at least 15 KB under its ceiling after the split; every existing test passes; the §6.2 targets are reported each run. |
| `shading-by-newest-evidence` | Shading by date of newest evidence (opt-in) | An optional map shading that follows the newest cited evidence per country, in one hue, off by default, legended, and never a measure of size, severity or whether a protest continues. | map | next | null | [`lazy-views-and-budget-headroom`] | Default map identical to coverage-only; control and legend copy per the 4.1 editorial deck; the ramp passes the palette validator in both modes on land and ocean; on a stale clock every band in view is pale and the legend says nothing is newer than the snapshot date; no new banned word in the DOM. |
| `colour-blind-patterns` | Patterns alongside colour | Textures, not only hue, mark coverage kinds on the map, and the legend swatches use the same patterns, so the map reads under colour-vision deficiency, in high-contrast mode and in print. | accessibility | next | null | [] | Gap hatch and conflict hatch distinguishable under simulated protanopia and deuteranopia, in forced-colours mode and in a grayscale print; every pattern has a text legend row; no texture on cards. |
| `kind-field-collective-action` | A kind on every record, set by the pipeline | Every record states its kind. The 84 existing records are 'collective action', the research contract's own term, with the basis recorded; nothing is guessed from titles or tags. | data | next | null | [] | `kind` and `kind_basis` on all records; validator rejects a non-default kind without an event-local source; filter and badge appear only when more than one kind exists; fixtures and tests updated. |
| `kind-subtyping-by-source-reread` | Protest, strike and civil unrest from a re-read source | A record becomes a protest, a strike, or civil unrest only after an agent re-reads the cited source and records its own words, including who the source says did what. | editorial | blocked | The research environment cannot open news websites, so no cited source can be re-read. Needs the same access as adding reports. | [`add-reports-after-2-oct-2026`, `kind-field-collective-action`] | Each re-typed record cites the re-read source; 'civil unrest' requires the source's own attribution of violence to participants; no record is re-typed from its title, id or tags; the 13 keyword matches stay 'collective action' until re-read. |
| `ucdp-ingest-and-validator` | Offline ingest and validator for UCDP conflict data | A script turns downloaded UCDP files into a separate conflict dataset with parties, years, and best, low and high death estimates, and a validator refuses coordinates, individuals, single death figures and any status, danger or trend field. | data | next | null | [] | `scripts/ingest_ucdp.py` runs from local CSVs without network; `scripts/validate_conflicts.py` enforces the exact keys and refusals in the 4.1 editorial §4.6; a labelled test fixture exercises both; the build allowlist and `test_pipeline` know the new file. |
| `armed-conflict-context-layer` | Armed conflict as a re-published UCDP context layer | Countries UCDP lists as conflict locations are hatched on the map and each conflict has a record with UCDP's parties, years and death estimates with bounds. It is context, not Protest Atlas research, and not a front-line map or a rating of how serious a conflict is. | data | blocked | This environment cannot reach ucdp.uu.se or data.humdata.org, and the UCDP licence terms have not been confirmed from the download. Needs the news-access data session or a network allowlist for UCDP hosts. | [`ucdp-ingest-and-validator`, `colour-blind-patterns`, `kind-field-collective-action`] | Records pass the validator; the licence and citation come from the downloaded terms; the window states years and provisional months actually present; every death figure carries low and high bounds, a year and a version; no 'ongoing', no coordinates, no score; the empty state shows until the file exists. |

**R4 "What we will not build" additions (append; keep the existing eight verbatim):**
9. "Front-line, territorial-control or troop-position maps."
10. "Any score that rates or ranks how serious a conflict is."
11. "Plotting the coordinates of conflict events."
12. "Daily or running counts of the dead."

(These four were checked against the §18.1 scan with the repo's own regexes: like the existing R4 items, they avoid the banned severity, danger and live wording even in negation, per SPEC §18.2. The whole §2.4 and §7 deck was scanned the same way: 104 quoted strings, no hits.)

### 7.8 Dates sheet and footer
- **T4 new row, "Conflict dataset":** value "UCDP {datasets and versions}, downloaded {date} · newest provisional month {Aug 2026}"; explainer: "When the re-published UCDP files were downloaded and the newest month they contain. UCDP revises provisional events, and a new download never makes a protest record more recent."
- **T4 row when absent:** "Conflict dataset: not loaded in this snapshot."
- The footer T1 line is unchanged; the conflict stamp appears only in the dates sheet and About.

---

## 8. Risk register (4.1)

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| 1 | The shading ships as "hot/cold" or "heat" in a label, tooltip, roadmap or release note | High / high | §2.5 banned words in test_shell and a feature-scoped copy test; title "Shading by date of newest evidence" everywhere |
| 2 | Shading on by default, remembered, or triggered by a filter or deep link | Medium / high | §2.2 (1); URL-only state; smoke check: fresh load equals 4.0 fills |
| 3 | A red or two-pole ramp, or a ramp that fails the validator on one surface or mode | Medium / high | §2.6 outputs required in the WP hand-off; CSS tokens only |
| 4 | On 9 Oct the shaded map reads as "the world went quiet" | High if default on / high | Default off; M10 from data; empty-band suffix; stale banner unchanged |
| 5 | Kind guessed from keywords, ids or tags (the 13 "unrest" matches, the "riot police" record, the PNG looting) | Medium / high | `kind_basis` required; validator rejects non-default kinds without sources; no client derivation |
| 6 | 84 identical "Collective action" badges push the first card below the fold | Medium / medium | Badge and Kind filter only when ≥ 2 kinds exist; Overview fact row otherwise |
| 7 | Armed conflict hue turns the atlas into a war map | High if hue used / high | Texture, not hue, for kind; M11 footnote; no danger tokens |
| 8 | Conflict and gap hatches indistinguishable under CVD, forced colours or print | Medium / high | Different geometry, colour and spacing; simulated-CVD and grayscale checks in acceptance |
| 9 | A conflict record says "ongoing", uses the 72 h clock, or shows a single death figure | Medium / high | §4.2 activity basis only; validator refuses `status`; best/low/high required |
| 10 | GED event points plotted "because the data have coordinates" | Medium / high | Validator rejects coordinate fields; §4.5; R4 item 11 |
| 11 | UCDP licence or version misquoted; thresholds quoted from memory published unverified | Medium / medium | §4.6 gate: licence, citation and thresholds from the downloaded files; flagged in §10 |
| 12 | "Past 2 years" appears as a coverage claim; protest and conflict windows merged into one line | Medium / medium | §6 paired sentence; no single coverage range anywhere |
| 13 | A UCDP download restamps the site as "current", or a protest sweep refreshes the conflict stamp | Medium / high | Separate stamps; staleness from protest evidence only |
| 14 | Protest and conflict counts summed or compared in a tile | Medium / high | Separate datasets; no cross-dataset totals; scope wording only |
| 15 | "Civil unrest" criminalises participants (labels, titles, sorting) | Medium / high | §5.2 label suffix, actor text as stored, D5-violence-note, no ranking |
| 16 | Government "riot" characterisations taken as evidence for the kind | Medium / high | §5.1 (4): independent reporting required; otherwise a claim in positions or state response |
| 17 | Empty conflict layer read as "no wars" | High / high | EC1 "Absence is not peace" everywhere the layer would show; EC4 threshold wording |
| 18 | Feature work raises the JS or CSS ceiling instead of creating headroom | High / medium | `lazy-views-and-budget-headroom` first; roadmap dependency |
| 19 | Window filters silently drop conflict records with no explanation | Medium / medium | M12 line whenever a window is active with the layer on |
| 20 | Roadmap marks conflict work "in progress" while no data can be fetched | Medium / medium | Statuses in §7.7: ingest "next", layer and sub-typing "blocked" with the blocker named |
| 21 | The shading's secondary encoding is lost in forced colours (hue-only map) | Medium / medium | SH5 disables the control; tooltip and brief carry dates |
| 22 | Kind labels drift ("riot", "war" as adjectives) in later copy | Medium / medium | K5 fixed labels; "war" only as "UCDP intensity: war (at least 1,000 battle-related deaths in {year})" |

---

## 9. Acceptance checks the editor will run on the 4.1 build

1. Fresh load of `#/map` on the 2 Oct and 9 Oct clocks: every country fill equals its 4.0 fill; SH2 is pressed; no `data-evidence-band` attribute is painted.
2. Press SH3 on the 9 Oct clock: no country takes the 72 h or 3–7 day step; both rows read " · none in this view"; M10 names 2 Oct 2026; S5 is still visible above the map.
3. Computed fills under SH3 are members of the validated ramp for the current mode and nothing else; no element uses `--warn` or `--danger` on the map.
4. DOM text and scanned attributes carry none of the §2.5 global words on any view, sheet or clock; the feature copy object passes the scoped test.
5. Cards, list rows, band badges, the directory and the brief are byte-identical in colour to 4.0 with SH3 pressed.
6. With `conflicts.json` absent: EC1 appears in the legend, About and the dates sheet row; the Kind filter group is absent; no record shows a kind badge; each record's Overview shows K7 with the "not distinguished" suffix.
7. With the test fixture `conflicts.json`: each conflict record shows CD1–CD7; every death figure has low and high beside it, a year or month, and a version; the strings "ongoing", "casualt", "toll", "front", "controls" do not occur on the sheet; the Kind filter lists only kinds present.
8. The 13 keyword-matching episodes still carry `kind: "collective-action"` and `method: "contract-default"`.
9. Forced-colours screenshots: the conflict hatch, the gap hatch and the solid fill are three different textures; a grayscale export of the legend shows the same.
10. Window filter 7 or 30 with the conflict layer on: M12 is present; no conflict record is in the list or on the map.
11. The dates sheet shows the "Conflict dataset" row separately from "Snapshot assembled" and "Newest evidence"; changing only `conflicts.json` leaves the header chip unchanged.
12. `public/roadmap.json` validates; the two blocked items name their blockers; no item is "shipped" without CI test evidence.

---

## 10. Notes for the lead, the architect and the data session

1. **Order of work.** Headroom first (lazy views and/or minifier), then `kind` + `kind_basis` with validator, fixtures and tests, then patterns, then the shading control, then the UCDP ingest and validator with a fixture and the empty state. The conflict layer itself and kind sub-typing are blocked and stay blocked on the public roadmap until the data session lands them.
2. **`validate_data.py`** gains `kind` and `kind_basis` in the exact-key list; `kind_basis` keys are exactly `method`, `text`, `source_ids`; `method ∈ {contract-default, source-reread}`; `kind ∈ {collective-action, protest, strike, civil-unrest}`; `source-reread` requires non-empty event-local `source_ids`; `contract-default` requires `kind === collective-action`. `merge_history.py` writes the default and refuses a kind change in an update without a basis. Fixtures under `tests/fixtures/snapshot-20261002/` are regenerated in the same commit, by the merge, not by hand. This touches the data session's files, so it follows HANDOFF_DATA_REFRESH.md §2.2: push before the data session imports, or ask it to re-import.
3. **UCDP source files for `scripts/ingest_ucdp.py`** (offline, from downloaded CSVs; confirm names and versions at download): the UCDP/PRIO Armed Conflict Dataset for the conflict list, type and start dates; the UCDP Battle-Related Deaths Dataset for yearly best/low/high per conflict (prefer it to summing GED events, and never mix the two in one record); GED only to derive location countries per year if the ACD location field is insufficient, never for coordinates; UCDP Candidate for provisional months. Record each file's version, URL, licence text and `downloaded_at`. If the Candidate release lags, the window says so rather than inventing a newer month.
4. **Licence.** OPEN_SOURCE_RESEARCH.md reports UCDP as CC BY 4.0; this must be confirmed from the downloaded terms and the exact citation UCDP requests must be copied into `sources[].citation`. Until confirmed, the layer stays blocked on the roadmap, whatever else is ready.
5. **Thresholds and codebook text in §3.1 and §4** are quoted from memory of the UCDP codebooks and from the ACLED codebook read on 2 Oct 2026. The data session checks them against the downloaded codebook version and corrects this document's text and the About copy before publication; a mismatch is a correction, not a reason to publish the memory version.
6. **Handoff additions for round 5** (research/round4/CONTRACT.md successor): a "Kind" clause with the §3.3 re-read rule and the §5.1 civil-unrest rules; the explicit instruction that keyword matches in existing records are leads for a re-read, never evidence; the instruction that officials' characterisations are claims; and that the 13 records in §1 are the first re-read candidates only because their sources already discuss participant conduct, not because of their words.
7. **Policy amendment v1.3.** Add the one-sentence conflict-layer purpose (§4.1), the kind rule (§3.3), the civil-unrest rule (§5.1) and the §2.8 map-shading exception. Nothing else in the policy changes.
8. **Tests to add:** the §2.5 banned words in `test_shell`; a scoped copy test for the shading strings; a `test_map` case that fills under SH3 come from the ramp tokens only; a Python test that `validate_data` rejects a `source-reread` kind without sources and a `contract-default` kind that is not `collective-action`; `test_pipeline` knowledge of `public/conflicts.json` as an **optional** file (absent is EC1, error is EC2); a conflict validator test on a labelled fixture that refuses a `lat` field, a `status` field and a `deaths.best` without bounds.
9. **Smoke.** Checks 2, 13 and 17 run with SH3 pressed as well as unpressed on the 2 Oct and 9 Oct clocks; check 14's scan carries the new words; a forced-colours screenshot of the legend is added to check 6 or 19.
