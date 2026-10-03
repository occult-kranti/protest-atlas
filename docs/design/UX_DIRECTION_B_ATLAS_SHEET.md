# Protest Atlas — Direction B: "Atlas sheet" (map-first)

Design panel proposal · 2 October 2026 · mobile-first (390 → 768 → 1440)

**Artefacts**

- Prototype: `/tmp/claude-0/-home-user-protest-atlas/e94248a0-8792-5aa0-a9db-ea6e1ee70eab/scratchpad/design/ux-b/prototype.html`. It is self-contained, about 560 KB, and has no network dependencies. It carries all 84 real records and the 84 contexts, plus real Equal Earth geometry projected from the vendored D3 7.9.0.
- Build inputs: `ux-b/prep.cjs` reads the repository read-only and writes `data.json`. `ux-b/template.html` plus `build.cjs` produce `prototype.html`.
- Screen presets: `prototype.html?screen=<home|list|list-card|ended|country|detail|detail-mid|detail-nz|filters|ahead|ahead-lower|next|countries|method|explore|stamps>&now=2026-10-02T22:30:00Z`. Add `&density=full` for full-fact cards and `&theme=dark` for dark mode.
- Screenshots: `ux-b/shots/` (29 PNGs; list in §11).
- Measurement scripts: `shoot.cjs`, `metrics.cjs`, `geo.cjs`, `land.cjs`. Each runs with `NODE_PATH=$(npm root -g) node <script>` against `python3 -m http.server 8772` in `…/scratchpad/design`.
- No repository file was modified.

**Featured real records** (from `public/events.json` and `public/event-context.json`):

| Record | Why it is featured |
|---|---|
| `fr-schools-20261002` | Violence and disruption are described; tear gas reported |
| `in-electoral-20261002` | Police prevented a gathering; all intensity dimensions not established |
| `es-housing-20261002` | FOR and AGAINST toward different targets, where the AGAINST side is a legislative response, not a counter-protest |
| `tz-drivers-20260929` | Ended; sourced onset and end; outcome with a reported link |
| `au-victorian-hospital-strike-20261001` | Onset known; end not established |
| `nz-wellington-treaty-hikoi-20241119` | Ended; documented outcome with causation not established; FOR and AGAINST toward the same target; **no state response**, which shows "Not established in this record" |

---

## 1. Thesis

The current phone experience puts 6.9 screens of hero, filters and an 81-row country list ahead of the first record (35,102 px page, first record at 5,812 px). It hides stance, intensity and state action inside a 2,809 px dialog, and it shows no time of day anywhere.

"Atlas sheet" turns the site into a single-screen instrument, as Apple Maps and Google Maps do:

- **The map is always present and never scrolls the page.** It sits outside any scroll container, so the scroll trap disappears by construction rather than by gesture filtering.
- **The reports live in a bottom sheet** with the search pill and filter chips on top. You pull the sheet up to read and push it down to look at the map.
- **Selecting a country snaps the sheet to a country brief**, and the map frames the country's mainland.
- **Detail opens as a sheet over the map** and leads with an "At a glance" grid of the four dimensions the user asked for.
- **Ahead, Countries, Method and Coming next** are one tap away in a five-item tab bar. On desktop they become a top nav.

Measured result at 390×844: the first record card starts at **676 px (0.8 screens)**. The whole first viewport is the product: identity, the update time, the full pilot disclosure, the world map with its key, search, filters, the result count with its caveat, the recency group header and the first record.

---

## 2. Information architecture and navigation

### 2.1 Destinations

| Destination | Phone / tablet entry | Desktop entry | What it holds |
|---|---|---|---|
| **Atlas** (default) | Tab 1 | Top nav | Map, reports sheet, country brief, record detail, filters |
| **Ahead** | Tab 2. Also the "Ahead" banner after the recent-reports group | Top nav | Announced protest actions (`public/upcoming.json`). Honest empty state this round |
| **Countries** | Tab 3. Also the empty-results state ("Browse all 249 countries") | Top nav | A–Z directory of all 249 entries by region; the complete keyboard alternative to the map |
| **Method** | Tab 4. Also "How it works" in the disclosure | Top nav | Update times (all clocks), map key, ageing rules, coverage numbers, CSV, JSON, policy, corrections, editor desk, example switch |
| **Coming next** | Tab 5. Also links from the Ahead empty state | Top nav | Product roadmap with statuses, dependencies and "Track" buttons |

Persistent on every view:

- **Masthead**: the brand, plus the "Data updated" chip, which opens Update times.
- **Pilot disclosure strip.**
- **Tab bar** on phone and tablet.

### 2.2 Atlas states (one view, several states)

| State | Trigger | Map | Sheet |
|---|---|---|---|
| **Half** (default) | Load, close detail, select country | World fitted to width (390×175), key below | From y = 378 to the tab bar: search, chips, results bar, first card |
| **Full** | Drag up, or tap the grab handle | Covered | Full-height list (to y = 128) |
| **Peek / Explore** | "Explore" button or drag down | Grows to about 530 px. Region chips, + / − / World controls | Only the search pill and chips are visible |
| **Country brief** | Tap a country, a directory row or a search suggestion | Mainland framed, selected fill, city dots with labels | Brief: ledger plus that country's records |
| **Detail** (modal sheet) | Tap a card title or anywhere on the card | Dimmed behind | Full-height sheet, 40 px of dimmed masthead still visible |
| **Filters** (modal sheet) | "Filters" chip, or the Region / Issue / Year chips | Dimmed | All refinements, live count, Reset / "Show N reports" |
| **Update times** (modal sheet, auto height) | Masthead chip | Dimmed | Four separate clocks |

### 2.3 URL model (keeps the tested contract)

`readViewState` / `encodeViewState` stay byte-compatible: the same 9 keys (`q, country, region, issue, status, window, year, city, outcome`), as tests require.

View and record are carried in the **hash**, which `renderEvents` already preserves:

- `#ahead`, `#countries`, `#method`, `#next`
- `#record/fr-schools-20261002` (shareable record link; opening it opens the detail sheet)

Example mode never writes the URL, as today. Card density (compact / full) is a per-viewer convenience held in `localStorage` inside try/catch. It never goes in the URL.

---

## 3. Screens

Measurements are CSS px at 390×844 unless stated.

### 3.1 Home / first view — `shots/390-home.png`

| Region | y / height | Content |
|---|---|---|
| Masthead | 0 / 52 | `P↗` mark + "Protest Atlas" (serif 19/700). Right: update chip, two lines: label "DATA UPDATED" (12px caps), value "**58 min ago**" (14px/650), clock icon. 44 px tall |
| Pilot disclosure | 52 / 76 | Exact policy copy (§4.2), 14 px, 3 lines on an ochre wash |
| Map area | 128 / 250 | World 390×175 (Equal Earth, Antarctica cropped, land-fitted). Key (3 rows, 14 px) on the left; **Explore** button (44 px) on the right |
| Sheet (half) | 378 → 780 | Grab handle (44 px target), search pill (48), chip row (44), results bar ("84 reports", Share, CSV, caveat line), group header, first card from y = 676 |
| Tab bar | 780 / 64 | Atlas · Ahead · Countries · Method · Coming next (22 px icons, 12 px labels, 3 px top indicator on the current tab) |

### 3.2 Record list (sheet full) — `shots/390-list.png`, `390-list-full.png`, `390-list-card-full.png`, `390-ended.png`

- **Results bar.** "84 reports" (17/700), then **Share** and **CSV** buttons (44 px, icon + label). A sub-line follows: "Newest observation first. Counts are published records, not how many protests happened."
- **Group headers** by observation band (`observationBand` / `BAND_LABELS` in freshness.js), each with a glyph and a count:
  - "● OBSERVED IN THE LAST 72 HOURS · 5", sub-line "Recent reports, not proof of activity right now."
  - "○ OBSERVED MORE THAN 30 DAYS AGO · 79", sub-line "Historical reports. Their current status is not established."
  - The `week` and `month` bands appear only when non-empty.
- **Ahead banner** after the first group, dashed, 56 px: "**Ahead: no announced actions on file**" / "Zero means none recorded, not none planned. See why ›" → Ahead.
- **Pagination.** 12 cards, then "Show 12 more of N remaining" (48 px). This drops DOM nodes from 6,972 to about 1,150.
- **Footer note:** "Counts describe this dataset's published records — never how many protests happened or how popular a cause is."
- **Zero results:** "No published report matches these filters" / "That is a gap in this dataset or in the current filters — not evidence that no protests happened." Buttons: [Clear filters] [Browse all 249 countries].

### 3.3 Country brief — `shots/390-country.png`, `1440-country.png`

- **Search pill** shows the country ("France ×"). Chip counts re-scope to the country ("Last 7 days 1", "Ended 1").
- **Header:** eyebrow "COUNTRY BRIEF · EUROPE", serif 28 "France", a "× World" button.
- **Lead copy** has three variants, invariant (a)/(b)/(c):
  - (a) "2 published reports match the current filters."
  - (b) "N published reports exist for {country}, but none match the current filters." plus [Clear filters to see them]
  - (c) "No published record for {country} in this snapshot. An initial search was logged; that is not a finding that no protests occurred."
- **Ledger** (ruled `dl`, kept from today's strong design):
  - Source coverage: Limited source check
  - Languages checked: English
  - Last source check: "2 Oct 2026, 21:14 UTC" with sub-line "1 hour ago"
  - Historical screen: Initial search logged
  - Human editorial review: Not completed
  - Note below: "Selected article-level AI-assisted checks only; no independent human editorial sign-off. The source date span is not a continuous review period."
- **Map:** the selected country is filled `--selected`, framed on its **largest polygon**. This fixes the French Guiana framing bug: mainland France now fills the map instead of the Atlantic. City dots are 10 px with a 2 px surface ring and a 44 px hit circle. Labels are 13 px on screen at any zoom, placed by greedy collision avoidance (right → left → above → below). A label that cannot be placed is dropped; the dot stays, and the city remains in the record and the filter.

### 3.4 Detail (sheet over map) — `shots/390-detail.png`, `390-detail-mid.png`, `390-detail-nz.png`, `1440-detail.png`

**Sheet chrome**

- Top at 40 px; the masthead shows dimmed behind it.
- Sticky head (56 px):
  - grab bar
  - "REPORT" label, which cross-fades to the truncated serif title after 150 px of scroll
  - Share (44)
  - "× Close" (44)
- Sticky foot: [‹ Prev] [Sources (n)] [Next ›] (48 px). Prev and Next follow the current filtered order.

**Body order**

1. "✦ AI-assisted source check · no human editorial review" (ochre text, 14/650). This is the per-record disclosure.
2. Meta: "● Observed today", then the status (e.g. "Status not established").
3. Place: "France · country-level".
4. Title (serif 27/1.15), summary (16/1.5), issue tags.
5. **At a glance**: a 2×2 grid of links that each jump to their section.
   - Stance: badge + target, up to 2.
   - When: Onset / Last observed / End.
   - Intensity: "Described: disruption, violence" / "*Not established: turnout*".
   - Police / state: the action, or "*Not established in this record*".
6. **Section nav** (sticky, scroll-spy, 44 px): Sides · When · Intensity · Police / state · Outcome · Sources.
7. **Sides & stance**. Sub-line: "Each stance is toward a named target. Positions are not a tally and say nothing about popularity." Per position: actor (15/650), stance badge + target (17/650), attributed claim, source chips.
8. **When**. A ruled table: Onset / Last observed / End, with relative sub-lines ("day only"; End not established reads "silence or age does not establish an end"). Then a **Timeline** with dated entries and source chips.
9. **Intensity — three separate measures**. Sub-line: "Never combined into a score. Unknown is not zero." Three rows (Turnout / Disruption / Violence) with the verbatim text. Not-established values sit in a dashed box.
10. **Police & state action**. Sub-line: "As reported and attributed. Police action alone does not show that participants were violent." The entry text is 16/600, then the attribution, then source chips.
    - **Empty** (47 of 84 records): a dashed card reading "**Not established in this record**" / "The reviewed sources for this episode do not document police or state action. That is not evidence that none took place."
11. **What changed—and for whom?** This is `outcomeHTML` from history.js, restyled only. The pinned strings stay: "Assessment / inference", "protest causation is not established", "End not established", `#detail-source-N`, escaping.
    - Ended episodes get the black-shadow completion note.
    - Outcome dates display with `absoluteLabel` (presentation only).
12. **Verification**. Level badge plus the note, then "Source checked 2 Oct 2026, 21:09 UTC · 1 hour ago. Checking a report again does not make the event current."
13. **Sources**. "{n} links, one reporting chain · Single-source. Source count is not a confidence score." Numbered list: title ↗ (new tab, with an accessible "opens in a new tab"), then "Publisher · published … · checked …".
14. Record footer: the ID, and "Report a correction ↗".

### 3.5 Filter sheet — `shots/390-filters.png`

The title is "Filter reports". The groups below update live, and the primary button reads "Show N reports".

1. **Observed** (segmented, 48 px): Any time **84** · Last 30 days **5** · Last 7 days **5**. Help text: "Uses the last date a source saw activity — not publication or check dates."
2. **Status** (radio rows, 48 px, with counts): Any status 84 · Ended / suspended 18 · Status not established 66 · Reported ongoing 0 · Planned 0 · Needs review 0. Zero rows stay visible, muted, with the sub-line "None in this snapshot". This avoids today's silent empty results.
3. **Region** (chips, alphabetical, never sorted by count). Help text: "Counts are published records, not how often protests happen."
4. **Issue** (the ten most-used tags). Help text: "Most-used tags. Tags are not yet normalised (Labor / Labour are separate)."
5. **Reported year**: All · 2024 · 2025 · 2026.
6. **Outcome**: Any · Outcome documented 57 · Outcome not established 27.
7. **Reported city** (select). Help text: "City points are generalized references, not protest sites."
8. **Card detail**: Compact · Full facts. Help text: "Compact keeps every fact on one or two lines. Full shows each fact in its own row."
9. **Show the illustrative example** (switch, 64×44): "Replaces reported data with one fictional record. Resets filters; export is off."

Footer: [Reset] [**Show 84 reports**].

### 3.6 Update times — `shots/390-stamps.png` (also embedded in Method)

Title "Update times". Each row shows a relative time (bold, right) and an absolute UTC time with `<time datetime>`:

| Row | Relative | Absolute | Explanation (exact copy) |
|---|---|---|---|
| Data integrated | 58 minutes ago | 2 Oct 2026, 21:31 UTC | "When AI-assisted research was merged into this snapshot. Not a human sign-off." |
| Newest observation | today | 2 Oct 2026 · day only | "The latest date any source saw protest activity. Records age from here." |
| Newest source check | 1 hour ago | 2 Oct 2026, 21:25 UTC | "When an article was last read. Re-checking an old report does not make it current." |
| Site build | *Not available* (local) / "x hours ago" (deployed) | "This copy carries no build stamp (it appears on the published site)" / "2 Oct 2026, HH:MM UTC · commit abc1234" | "When this website was last published. A new build is not new data." |
| Announcements file (Method and Ahead only) | from `upcoming.generated_at` | "… · 0 items" | "When the list of announced actions was last generated." |

The footnote reads "Times are UTC. Relative times update every minute." The values come from `updateStamps()`; they are never merged into one "updated" claim. The masthead chip shows *only* the data-integration clock, labelled "Data updated". On tablet and desktop the chip uses the long form "Data integrated 21:31 UTC · 58 minutes ago".

### 3.7 Ahead — `shots/390-ahead.png`, `390-ahead-lower.png`

**Empty state (this round)**

- Eyebrow "AHEAD", title "**Announced protest actions**". Dek: "Strikes, marches and other actions that a union, party or organisation has publicly announced for a future date."
- Callout: "**An announcement is not an event.** It does not show that an action will happen, how many people will join, or whether it is lawful." / "City and date only — never times, routes or meeting points."
- Stamp line: "Announcements list generated **58 minutes ago** · 2 Oct 2026, 21:31 UTC · 0 items". The values come from `upcoming.json`. If the file is absent, the line reads "Announcements list not published yet".
- Empty card (`role="status"`, dashed): icon, then "**No announced actions on file**". Body: "This round could not reach news sites, so no announcements were checked or added. **Zero here means nothing has been recorded — not that nothing is planned.**" Buttons: [See the 5 most recent reports] (sets Last 7 days and opens the list) and [What's blocking this] (opens Coming next).
- "Further action mentioned in published records", sub-line "Undated lines inside existing records. They were not checked as announcements and do not appear on any calendar." Each entry quotes the record's own status-basis text with its source, plus [Open record]:
  - France: "Reuters reports protests on 2 October and a later planned teachers' strike."
  - India: "AP describes renewed demonstrations and intended further mobilization."
- "How an announcement will appear": a **specimen** made of placeholders only, watermarked "Layout specimen • not an announcement" and with a rotated "SPECIMEN" ribbon. No fictional event is ever shown.
- "Every announcement shows one of these states". The labels are `ANNOUNCEMENT_LABELS` verbatim:
  - Announced
  - Scheduled for today · occurrence not confirmed
  - Planned date passed · occurrence not recorded here
  - Reported postponed / Reported cancelled

**Populated state (ready for later rounds)**

- Items are sorted by `planned_start`.
- A date block: month / day / weekday. A `range` shows "14–16 OCT"; `week` or `month` precision shows "Week of 12 Oct" or "Oct 2026" and never a fake day.
- Then `countdownLabel` ("in 12 days" or "in 3 days (week precision)").
- Then the action (serif 18), "Announced by {institution}", the cities, the status pill, the sources (publisher, published date, link) and "AI-assisted check".
- If `event_id` is set: "Linked record ›".
- `date-passed` items move to a collapsed group "Dates passed — occurrence not recorded here (n)". They are never listed as upcoming.

### 3.8 Coming next — `shots/390-next.png`

- Eyebrow "COMING NEXT", title "**What we're building next**". Dek: "Planned features for Protest Atlas and what each one depends on. Windows are plans, not promises."
- Primary buttons, full width on phone: [**Follow progress on GitHub**] (→ docs/ROADMAP.md) and [Suggest a feature or a fix ↗] (→ issue chooser).
- A jump row of status pills (44 px): ✓ IN THIS RELEASE · → NEXT UP · ◌ NEEDS PEOPLE · … LATER · ✕ NOT PLANNED. Status is encoded by glyph, fill and border style, never by hue alone.
- Sections; every item card has a title (serif 19), a one-line "why", "**Depends on:** …" and a button:
  - **In this release**: A map-and-list atlas built for phones · Ahead: a page for announced actions [Open Ahead] · Separate update times [See update times].
  - **Next up**, each with [Track this]:
    - Checked announcements for Ahead. Depends on: network access to news sites from the research environment (blocked this round).
    - One name per issue. Depends on: a data migration that keeps old shared links working.
    - Structured police & state action. Depends on: a schema and validator change; no guessing from free text.
    - Date ranges and movement links.
  - **Needs people**:
    - Human editorial review. Depends on: a named editor and a backup. [Read the review plan]
    - Local-language source checks. [Offer help]
  - **Later**: Versioned snapshots and fuller exports · Counter-demonstration links ("never a manufactured 'other side'").
  - **Not planned — by design**: risk scores or predictions of unrest · popularity, approval or "which side is bigger" figures · identifying or tracking participants, routes or police positions · a "real-time, everywhere" promise · accounts and alerts before moderation exists.

### 3.9 Countries — `shots/390-countries.png`

- Title "All 249 countries and territories". Dek: "81 have a published record. All 249 had an initial search logged — searched is not reviewed, and no record is not 'no protests'."
- Search box (16 px input).
- Region sections: "AFRICA … 60 ENTRIES" (correct singular "1 entry").
- Each row is 52 px:
  - the name
  - "Not drawn on the map at this scale", shown for the 75 unmapped codes, including AD, AS, CK, FO, SG and SX
  - the status: "N record(s)" in bold, or "Search logged · no record"
  - a chevron
- Tapping a row opens the Atlas country brief.

### 3.10 Method — `shots/390-method.png`

The disclosure banner already sits above the page, so the page does not repeat it. Instead the dek explains it: "What the pilot label above means: an AI-assisted process read each news report and checked its date, place, demands and any state response. No human editor reviewed the result. A record shows what a source reported — not an independently witnessed event."

Sections:

- **Update times** (§3.6).
- **Map key** with full meanings:
  - "**Filled:** … Colour shows publication coverage only — never size, intensity, popularity or a count."
  - "**Unfilled:** … a coverage gap, not evidence that nothing happened."
  - "**Black shadow:** includes a sourced ended or suspended episode. It does not mean the movement ended or its demands succeeded."
  - "**Selected country.** City dots are generalized reference points, not protest sites."
- **How a record ages**: the 72 h rule, unknowns are never zero, police/state "Not established in this record", no tally.
- **Coverage** (4 tiles, proportional figures): 249 · 81 · 118 · 18. Note: "Mostly English sources and one wire service. Regional totals reflect where we looked, so they cannot be compared or ranked."
- **Data and tools** (52 px rows):
  - Download this view as CSV
  - Public JSON
  - Editorial policy
  - Report a correction ("Never post private participant details")
  - **Editor desk** ("Local tool for reviewing leads. Nothing is published from it.")
  - Explore the illustrative example

### 3.11 Explore map — `shots/390-explore.png`, `844x390-landscape-explore.png`

- The sheet drops to peek and the map grows to about 530 px.
- Region chips (Africa, Americas, Asia, Europe, Oceania; 44 px) frame hand-drawn lon/lat boxes rather than country unions, which would be distorted by Russia and French territories.
- + / − / World controls (44×44), right edge.
- In this mode one-finger pan and pinch are enabled; tapping a country opens its brief.

### 3.12 System states (specified; most are shown in the prototype)

| State | Treatment |
|---|---|
| Loading | The sheet keeps its frame. The list shows three skeleton cards at reduced opacity; the map shows land at 40% with "Loading map…". Never "0 reports" |
| events.json failure | Sheet: "Reports could not be loaded. This is not a count of zero." [Retry] [Open the public JSON]. The map stays usable; the directory still works |
| Map failure | The map area collapses to a 120 px strip: "The map could not load. Every country is listed in Countries." [Retry map] [Open Countries]. The list is unaffected |
| Stale (> 72 h since `generated_at`) | The disclosure stays, plus a second line in warn colour: "Data last integrated 3 days ago (2 Oct 2026, 21:31 UTC). This snapshot is not being kept current." The chip value turns warn colour. Implemented in the prototype (`data-stale`) |
| Record ages to Needs review | The meta status reads "Needs review · current status unknown" (warn colour, 650). An open detail is patched in place by the 60 s and visibilitychange timer |
| Example mode | Map fills use `--example`. A banner at the top of the sheet: "ILLUSTRATIVE EXAMPLE • NOT A REAL EVENT" (white on `--example-ink`, 7.43:1). Each card and the detail carry the same mark; cards also get a diagonal tint. Share and CSV are disabled, and `onExport` itself refuses when `mode !== 'reported'` |
| 72 h group empties (frozen deploy after about 5 Oct) | That group header disappears; the list starts with "Observed in the last 7 days" or "more than 30 days ago". The "Last 7 days" chip shows 0 and, when tapped, gives the zero-results state |

---

## 4. Component specs

### 4.1 Update chip (masthead)

- A button with `aria-haspopup="dialog"`. Accessible name: "Update times. Data integrated 58 minutes ago, 2 Oct 2026, 21:31 UTC."
- 44 px tall, 999 px radius, surface background, 1 px `--line-2` border.
- Phone: two lines (label 12 px caps muted; value 14/650). ≥700 px: one line.
- It refreshes every 60 s and on `visibilitychange`.
- After 72 h it turns warn colour, and the disclosure adds its stale line.

### 4.2 Pilot disclosure (exact copy, never removed)

> **AI-assisted reporting pilot.** Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed. [How it works]

- Verbatim policy text in a `role="note"` strip, 14/1.38, on `--accent-wash` with a `--line-2` rule.
- Phone: three lines (76 px). Tablet: two lines. Desktop: one line (40 px).
- Stale variant: the second line is added (§3.12); the first line never changes.
- Inside the detail sheet the per-record line "AI-assisted source check · no human editorial review" repeats it, because the modal dims the strip.

### 4.3 Map

- **Projection:** Equal Earth, fitted to land extent without Antarctica, at an aspect of 1000×449.
- **Fill rules** (colour = publication coverage only):

  | Class | Light | Dark |
  |---|---|---|
  | Published report in view | `--reported` #b4772a | #bd8236 |
  | No record in view | `--land` #f2f2ec | #2b312e |
  | Has records but filtered out | `--land` (with the brief's lead variant b) | same |
  | Selected | `--selected` #00795a | #35a882 |
  | Example mode | `--example` #8a6cc2 | #9480cc |

  Ocean is `--ocean` (#e4e9e3 / #0e1311). Borders are 0.6 px `--land-stroke`, non-scaling.
- **Ended shadow:** a hard offset of 1.6 screen px, recomputed per zoom (`dx = 1.6 / scale`). It is drawn only for in-view countries whose `completionKind` is ended-only or mixed. In dark mode the offset is `#e9e6da` so it stays visible; the shape and meaning are unchanged (see critique).
- **Key**, always visible under the map at 14 px: "Published report" · "No record ≠ no protest" · "Shadow: sourced ended episode". The full meanings are in Method.
- **City dots** appear only at country zoom (scale ≥ 1.5). They are generalized references, with the title text "{City} — generalized city reference, not a protest site".
- **Gesture policy:**
  - App shell: the map is not inside a scroller, so one-finger pan and pinch are safe. Double-tap zoom is off; wheel zoom only with Ctrl or ⌘ on desktop.
  - Document fallback (§8): `touch-action: pan-y`, one finger scrolls the page, and two-finger pan or pinch moves the map (`d3.zoom().filter(e => e.type !== 'touchstart' || e.touches.length > 1)`). "Explore" opens a fixed full-screen map with [Done].
- **Keyboard:** the map is a single tab stop (`role="application"`, with instructions). Arrow keys move between countries that have records (roving tabindex in visual order); Enter selects. A "Skip map — go to reports" skip link comes first.

### 4.4 Bottom sheet

- Snap points (phone): `full` = 0 (top of the atlas, under the disclosure), `half` = map-area height (250 at 390), `peek` = atlas height − 132.
- **Drag:** pointer events on the sheet head (grab, search row and chips row), 6 px slop, snap to the nearest point on release.
- Transition: transform, 280 ms `cubic-bezier(.2,.8,.2,1)`. Off under reduced motion.
- **Grab** is a real `<button>` (44 px). Its label is "Expand list" or "Show map (collapse list)"; it toggles half ⇄ full.
- Content scroll: at `full` the list scrolls inside the sheet (`overscroll-behavior: contain`). At `half`, an upward drag on the content first expands to full; the prototype simplifies this to a non-scrolling half state (see critique).
- The sheet is a labelled region (`aria-labelledby="sheet-title"`, the "84 reports" heading). It is not modal: the map stays interactive.

### 4.5 Search pill and chips

- **Search:** 48 px, 16 px input (no iOS zoom), placeholder "Search issues, places, actors". Debounced 150 ms; it matches the existing `searchableText`.
  - Specified addition: the first suggestions are countries ("France — Country brief"), then records.
  - With a country selected the pill shows the name, and × clears it.
- **Chips** (44 px, horizontally scrolling row, never wrapping):
  - [⚙ Filters (n)], where the badge counts active refinements
  - [Last 7 days **5**] toggle
  - [Ended **18**] toggle
  - [Region ▾] [Issue ▾] [Year ▾], which open the filter sheet
  - Counts are computed with every other filter applied (faceted). Pressed chips are ink-filled; `aria-pressed` reflects the state.

### 4.6 Record card

Two densities share one anatomy and order. Compact is the phone default; Full is chosen in the filter sheet.

```
┌──────────────────────────────────────────────┐
│ ● Observed today   Status not established   › │  meta: band glyph + relative day (650) · status (muted)
│ Spain · Madrid                                │  place: country (650) · location (hidden if = country)
│ Housing affordability and tenant protection   │  title: serif 20/1.22 — the button (stretched link)
│ Housing · Cost of living                      │  issues (compact: text; full: tags)
│ ───────────────────────────────────────────── │
│ WHEN      Onset not established · last        │  every unknown is spelled out, italic
│           observed 2 Oct 2026 · end not est.  │
│ STANCE    Housing demonstrators [+ FOR]       │  actor + badge + TARGET (650), up to 2 positions,
│           Tenant protection                   │  dashed divider between them
│           ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│           Junts lawmakers [− AGAINST]         │
│           Proposed housing decrees            │
│ INTENSITY Described: turnout. Not established:│  never combined; unknown dims listed by name
│           disruption, violence                │
│ POLICE /  Parliament rejected the decrees     │  or "⬚ Not established in this record"
│ STATE                                         │
│ ───────────────────────────────────────────── │
│ Al Jazeera, with AP and Reuters ↗ · published │  publisher link (44 px hit box), pub date,
│ 2 Oct 2026 · 1 source, Single-source ·        │  source count + independence, AI marker
│ ✦ AI-assisted check                           │
└──────────────────────────────────────────────┘
```

- Measured heights (390): compact 433–485 px; full 601–748 px.
- **Ended:** the card gets a 1.5 px ink border plus a 4 px hard offset shadow in `--shadow-ink` (the map's black shadow). The status reads "◼ Ended / suspended". Full density adds an outcome teaser: "**Later:** {outcome summary} *Protest causation not established.* / *Source links it to the action.*"
- **Full density:**
  - The When block has three rows: "⬚ Onset not established" / "Last observed **2 Oct 2026** · today" / "⬚ End not established", or "Onset **29 Sep 2026**" / "End **30 Sep 2026** · sourced end".
  - Intensity shows each described dimension verbatim ("**Violence** — Clashes and property fires reported; attribution varies by incident.", clamped to 2 lines), then "⬚ Not established: turnout".
  - Police/state shows the action plus "— {attribution}".
- **Copy rules:**
  - Band labels: "Observed today / yesterday / N days ago / N months ago" (`relativeLabel` on the date-only value). They never fake an hour.
  - Status labels: "Status not established" (was "Status unknown"), "Ended / suspended", "Reported ongoing" (only for under 72 h), "Planned", "Needs review · current status unknown".
  - Independence: "{n} links, one reporting chain · Single-source" when single-source has several URLs; "1 source · Single-source"; "{n} sources · Corroborated" or "· Contested".
- **"Described" vs "not established"** is a display classification: `/\d/` → described; otherwise `/not established|unknown|no reliable/i` → not established. The verbatim text is always one tap away (Full density and detail).
- **Interaction:** the title button is stretched over the whole card (a single tab stop). The publisher link sits above it (`z-index: 2`). The chevron is decorative.

### 4.7 Stance badge (hue-free by design)

| Stance | Glyph + word | Fill |
|---|---|---|
| support | **+ FOR** | Solid ink, surface text |
| oppose | **− AGAINST** | Surface fill, 1.5 px ink border |
| mixed | **± MIXED** | Half ink / half surface |
| unclear | **? UNCLEAR** | Dashed ink border |

- Badges are 12 px caps (800, +0.06 em), 22 px tall in cards and 18 px in glance and compact rows.
- Rule: **always actor + badge + target**; never a badge on its own, never a tally, never a "two sides" bar.
- Reason for no hue: a red/green or warm/cool pair would read as good/bad, invite a two-camp reading, and collide with the coverage ochre. Glyph, word and fill survive greyscale, print, CVD and forced-colors (forced-colors maps FOR to CanvasText / Canvas).

### 4.8 Observation band glyph (ordinal, monochrome)

The glyph is an 11 px ink circle family, always paired with the label text:

- ● filled: last 72 h
- ◐ half: 7 days
- ◔ quarter: 30 days
- ○ ring: older or unknown

No hue: recency is not "status".

### 4.9 Detail glance grid

A 2×2 grid with 1 px `--line-2` gutters and 12 px radius. Each tile is an `<a href="#d-…">` link, at least 84 px tall, with a 12 px caps label and a 14/1.38 value. Unknowns are italic and worded in full; there are no "n/e" abbreviations.

### 4.10 Source chips

`<a class="ref" href="#detail-source-N">Source N</a>`: 44 px tall, 8 px gap, underlined label on `--surface-2`. In-sheet anchor clicks scroll inside the sheet and never write `#detail-source-N` into the page URL. This fixes today's hash leakage.

### 4.11 Roadmap item and Ahead item

- **Roadmap item:** a 14 px radius card with a serif title, a "why" line, a "Depends on" line and a 44 px button. The section pill carries the status, so cards do not repeat it.
- **Ahead item:** as in §3.7. The status pill words come from `ANNOUNCEMENT_LABELS`. No clock times, routes or assembly points; the validator already enforces this.

### 4.12 Empty-state copy (exact)

| Context | Heading | Body |
|---|---|---|
| Filtered list empty | No published report matches these filters | That is a gap in this dataset or in the current filters — not evidence that no protests happened. |
| Country with records filtered out | — | N published reports exist for {country}, but none match the current filters. |
| Country with no record | — | No published record for {country} in this snapshot. An initial search was logged; that is not a finding that no protests occurred. |
| Police / state empty | Not established in this record | The reviewed sources for this episode do not document police or state action. That is not evidence that none took place. |
| Outcome empty | — | No sourced outcome established in this snapshot. This does not mean nothing changed. *(pinned)* |
| Ahead empty | No announced actions on file | This round could not reach news sites, so no announcements were checked or added. Zero here means nothing has been recorded — not that nothing is planned. |
| Ahead banner (list) | Ahead: no announced actions on file | Zero means none recorded, not none planned. See why |
| Status filter zero rows | — | None in this snapshot |

---

## 5. Visual system

### 5.1 Type

Families use system fonts only; no font service.

- **Serif:** "Iowan Old Style", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif. Used for record titles, page titles, the country name, outcome headlines and roadmap titles.
- **Sans:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif. `system-ui` is deliberately not first, because on Linux it resolves to wide DejaVu.

| Role | Mobile | Desktop | Notes |
|---|---|---|---|
| Page title | serif 30/1.12, 600 | 40 | Ahead, Countries, Method, Coming next |
| Detail title | serif 27/1.15, 600 | 27 | |
| Country name | serif 28/1.1 | 28 | |
| Card title | serif 20/1.22, 600 | 20 | |
| Item title | serif 19/1.25 | 19 | Roadmap, outcome |
| Section heading | sans 17/1.3, 650 | 17 | |
| Body / dek | sans 15–16/1.5 | 15–16 | |
| Small body | sans 14/1.42 | 14 | **Minimum for any non-label text** (measured: 14) |
| Label / eyebrow | sans 12/1.3, 700, caps, +0.06–0.07 em | 12 | |
| Tab label | sans 12/1.1, 600 | — | |
| Hero figures (Method) | sans 28/1.05, 650, proportional | | `tabular-nums` only in stamp times and counts |

### 5.2 Space, shape, elevation

- **Spacing:** 4-pt base (4, 8, 10, 12, 14, 16, 24, 32). Gutter 16 px on phone, 24 px on tablet, 20 px inside the desktop panel.
- **Radius:** 18 px sheet, 12 px cards, chips and buttons, 14 px roadmap and Ahead cards, 999 px pills.
- **Elevation:** the sheet uses `0 -10px 30px rgba(0,0,0,.10)`; modal sheets `0 -10px 40px rgba(0,0,0,.25)`; map buttons 1 px. Ended cards use a hard 4 px offset (semantic, not elevation).
- **Rules:** a 1 px ink rule under the masthead and the results bar (the editorial ruled look); hairline `--line` elsewhere.

### 5.3 Colour tokens

These redefine for dark under `@media (prefers-color-scheme: dark)` with a `:root:not([data-theme="light"])` guard, and again under `:root[data-theme="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | #f4f2ea | #0f1211 | App plane, masthead |
| `--surface` | #fffdf8 | #171b19 | Sheet, cards, dialogs |
| `--surface-2` | #f2efe5 | #1f2422 | Chips, inset, search |
| `--surface-3` | #e8e4d7 | #2a302d | Placeholders |
| `--ink` | #1b1f1d | #ecebe4 | Text, FOR badge, primary buttons |
| `--ink-2` | #3a3f3c | #d0d2cb | Secondary text |
| `--muted` | #595e5a | #a6aba4 | Tertiary text, labels |
| `--line` / `--line-2` | #ddd8cb / #bfb9a9 | #2f3532 / #48504c | Hairlines / borders |
| `--accent` (ochre text) | #82540e | #e3ae63 | Eyebrows, AI marker |
| `--accent-wash` | #f6ebd6 | #2a2317 | Disclosure strip |
| `--warn` / `--warn-wash` | #a3341f / #fbebe6 | #f29c87 / #3a1e18 | Stale, Needs review, Not planned |
| `--focus` | #1a5fb4 | #8ab4f8 | 3 px focus ring |
| `--ocean` / `--land` / `--land-stroke` | #e4e9e3 / #f2f2ec / #b9c1b8 | #0e1311 / #2b312e / #3f4844 | Map |
| `--reported` / `--selected` / `--example` | #b4772a / #00795a / #8a6cc2 | #bd8236 / #35a882 / #9480cc | Map classes (validated) |
| `--example-ink` | #5f4796 | #5f4796 | Watermark background (white text) |
| `--shadow-ink` | #000 | #e9e6da | Ended offset (map, card, completion note) |

**WCAG text contrast** (computed):

| Pair | Light | Dark |
|---|---|---|
| ink / surface | 16.39 | 14.55 |
| ink / paper | 14.87 | 15.76 |
| ink-2 / surface | 10.56 | 11.40 |
| muted / surface | 6.51 | 7.44 |
| muted / paper | 5.90 | 8.06 |
| muted / surface-2 | 5.75 | 6.74 |
| accent / surface | 6.41 | 8.70 |
| accent / accent-wash | 5.51 | 7.77 |
| ink / accent-wash | 14.10 | 13.00 |
| warn / surface | 6.73 | 8.18 |
| surface / ink (buttons) | 16.39 | 14.55 |
| white / example-ink | 7.43 | 7.43 |

The DOM scan found **0 text elements below 4.5:1** (or 3:1 for large text) across 13 screens × 2 widths × 2 themes × 2 densities, down to three viewport heights.

### 5.4 Map palette — dataviz validator (`scripts/validate_palette.js`, `--pairs all`, because on a map any two classes can touch)

```
LIGHT  #b4772a,#00795a,#8a6cc2  --surface #e4e9e3 (ocean)
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #00795a↔#b4772a ΔE 8.4 (protan) · tritan 12.4
  [PASS] Normal-vision floor    worst all-pairs #00795a↔#b4772a ΔE 20.1 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
LIGHT  same  --surface #f2f2ec (no-record land)            → ALL CHECKS PASS (contrast all >= 3:1)
DARK   #bd8236,#35a882,#9480cc  --surface #0e1311 (ocean)
  [PASS] Lightness band         all 3 inside L 0.48–0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #35a882↔#bd8236 ΔE 9.4 (deutan) · tritan 11.7
  [PASS] Normal-vision floor    worst all-pairs #35a882↔#bd8236 ΔE 17.5 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
  → ALL CHECKS PASS
DARK   same  --surface #2b312e (no-record land)            → ALL CHECKS PASS
```

How we got there:

- **Rejected:** the current #174e4a selected colour (L 0.39, below the band) and the #bcaed0 example colour (chroma 0.05, reads as grey).
- **Teal candidates** (#1f6a63, #0b6e70, #11756f, #1d6f8f) all failed the 0.10 chroma floor.
- **#2563a8 blue** failed the normal-vision floor against the example violet (14.1).
- **#00795a green-teal** passes.
- **Ochre** was darkened from #c78d43 (2.33:1 against the ocean) to #b4772a.

Only three classes ever share the map, which is within the documented all-pairs cap. In practice reported and example never co-occur, because the mode switch replaces the data.

Stance, recency and status deliberately use **no hue** (§4.7, §4.8). Status words keep their reserved warn colour plus a symbol.

### 5.5 Iconography

Inline SVG symbols with a 1.8 stroke, rounded caps, 20–22 px: search, sliders, clock, map, calendar-arrow (Ahead), globe (Countries), book (Method), signpost (Coming next), share, download, close, chevron, expand, ± and AI sparkle. Icons always sit beside a text label, except for the zoom buttons, which have `aria-label`s.

---

## 6. Interaction and motion

- **Sheet:** a 280 ms ease-out snap; drag follows the finger 1:1 with no rubber-banding past full; tapping the grab toggles half ⇄ full.
- **Map in half state:** taps select; one-finger pan works because the map is outside the scroller. The map never zooms on its own except to frame a selected country (240 ms; instant under reduced motion).
- **Detail:** the sheet rises 260 ms from +40 px. Escape, Close or a backdrop tap closes it, and focus returns to the trigger, or to the search field if the trigger is gone. Scroll-spy updates the section tabs. The mini title fades in after 150 px.
- **Filters:** instant re-count; the primary button text updates live ("Show 5 reports").
- **Timers:** relative labels re-render every 60 s and on `visibilitychange`, including an open detail sheet (in-place status patch, as `refreshAges` does today). Notice staleness is recomputed even when no derived status changes, which fixes the stale-notice bug in the audit.
- **Reduced motion:** all transitions and animations off; scroll-into-view is instant.

---

## 7. Accessibility

- **Landmarks:** `header`, `aside role="note"` (disclosure), `main` with an "Atlas: map and reports" region, the sheet as a region named by "84 reports", and `nav` (tab bar / top nav).
- **Skip link:** "Skip map — go to reports". The map is one tab stop with roving arrow-key focus between countries that have records, which replaces 176 tab stops.
- **Native `<dialog>`** for detail, filters and update times:
  - showModal, heading focus (`tabindex=-1`, no ring on programmatic focus)
  - Escape and backdrop close; focus restoration
  - body scroll lock is unnecessary because the shell does not scroll
- **Fixes the audit's dialog bug:** `data-open` lives on card buttons only, through one delegated listener. The dialog never carries `[data-event]`.
- **Targets:** every control is at least 44×44, measured: chips, search, grab, source chips, switch (64×44), radios (48 px rows), tab items, map controls, city hits (44 px circles). Inline links get 44 px hit boxes through padding plus negative margins on their own box, not invisible overlays.
- **Text:** at least 14 px for all non-label text (measured minimum 14). Labels are 12 px caps. Inputs are 16 px.
- **Meaning never by colour alone:**
  - Stance: glyph + word + fill.
  - Recency: glyph + text.
  - Status: text (+ ◼ for ended).
  - Map: legend, a `<title>` per country, the Countries directory as the table view, and the forced-colors fallback (`Highlight` for reported).
- **Screen-reader copy:** the "opens in a new tab" suffix; issues are prefixed "Issues:"; times use `<time datetime>`.
- **Zoom and short viewports:** at 200% (tested at 640×410) and in landscape (844×390), the app shell becomes a normal scrolling document. No horizontal overflow at 360, 390, 640, 768, 844 or 1440.

---

## 8. Responsive and desktop adaptation

| Range | Layout |
|---|---|
| **< 700 px** (phone) | App shell: masthead 52, disclosure (3 lines), atlas (map + bottom sheet), tab bar 64. One-column cards. Chip short forms |
| **700–1099 px** (tablet) — `shots/768-home.png` | Same shell. The world draws at 768×344 above the sheet; two-column cards; long-form update chip; disclosure on 2 lines |
| **≥ 1100 px** (desktop) — `shots/1440-home.png`, `1440-country.png`, `1440-detail.png` | Masthead 60 with a top nav (5 destinations), long update chip and "Editor desk ↗". One-line disclosure. **Full-bleed map** behind a floating **424 px panel** (left 16, top 16, bottom 16, 16 px radius) that holds search, chips and the list; there is no drag. The map fits its target (world, region or country mainland) into the *unobstructed* rectangle right of the panel, so a country is never hidden under it. Region chips sit top-left of the map area, zoom controls top-right, the key bottom-right. Detail opens as a 600 px right drawer; update times as a centred 520 px dialog |
| **Short viewport** (`max-height:560px` under 1100 wide, or `max-height:480px`) — `shots/844x390-landscape.png`, `640x410-zoom200.png` | Document flow: the page scrolls, the map is in flow with `touch-action: pan-y` and two-finger map gestures, the tab bar is sticky, and "Explore" opens a fixed full-screen map with [Done] |

---

## 9. Engineering notes (fit with the existing code)

1. **Keep `createWorldMap`** (map.js) and re-skin it via CSS on its hooks. Add the following:
   - COLORS → CSS custom properties.
   - `focusCountry` on the largest polygon.
   - `fitInto(bounds, insetRect)` for the panel and sheet offsets.
   - Zoom-scaled shadow offset and city labels.
   - Greedy label collision.
   - A roving-tabindex keyboard model.
   - The touch filter for document mode.
   - Derive features from the TopoJSON alone, which drops the 426 KB GeoJSON.
2. **Use freshness.js directly:** `relativeLabel`, `absoluteLabel`, `observationBand`, `BAND_LABELS`, `updateStamps`, `announcementState`, `ANNOUNCEMENT_LABELS` and `countdownLabel`. The prototype mirrors their logic exactly.
3. **app.js:**
   - `getDisplayStatus` is unchanged.
   - The `statusLabel` strings change ("Status not established", "Needs review · current status unknown"). They are not test-pinned.
   - Delegated card handler (dialog bug fix).
   - Paginated rendering: 12 cards plus "Show more".
   - Search debounce of 150 ms.
   - Map repaint only when the in-view country set changes.
   - `onExport` must check `state.mode === 'reported'` itself.
4. **history.js `outcomeHTML`:** reused unchanged (pinned strings). Only CSS changes; the date formatting is optional.
5. **New front-end files** need PUBLIC_FILES entries and a consistent `?v=` bump across index.html and every import:
   - Suggested: `sheet.js` (snap and drag), `views.js` (Ahead, Countries, Method, Coming next renderers) and `ui.css` (this system).
   - The roadmap stays as static markup inside index.html, so no new JSON needs validating.
6. **review.html** keeps `styles.css` (tokens, masthead, footer, eyebrow, skip-link). The new `ui.css` loads only on index.html. If tokens move, add aliases (`--ochre` → `--accent`, `--canvas` → `--paper`) so the desk does not regress.
7. **Hash routes** for views and records (§2.3) leave the 9-key `readViewState` test intact.

---

## 10. What was verified (prototype, headless Chromium 1194)

- **Two critique-and-fix iterations, then four more passes.** Problems found and fixed:
  1. Uneven 3-column When strip wrapping → stacked rows.
  2. Orphaned stance badge → badge/target grid.
  3. 250 px of sheet chrome before the first card → compressed results bar.
  4. Vague "Data 58 min ago" chip → labelled two-line chip.
  5. A "0" notification-style badge on Ahead → contextual banner.
  6. Detail buried its key facts → glance grid.
  7. Paris/Rennes label collision → greedy placement.
  8. Explore button over Spain and over the key → in-row button with a stacked key.
  9. "n/e" abbreviations → full wording.
  10. Duplicate disclosure on Method → explanatory dek.
  11. Desktop map at 313 px tall → slot sizing, then full-bleed with an inset fit.
  12. Desktop region chips hidden → z-index.
  13. Invisible dark-mode ended shadow → light offset.
  14. 13 px text and 22/32 px targets → 14 px and 44 px.
  15. Watermark 4.13:1 → `--example-ink` 7.43:1.
  16. Card height 600–750 px → compact density, 433–485 px.
  17. The AGAINST position hidden behind "+1 more" → two positions shown.
  18. No short-viewport handling → document fallback.
- **Automated scan** (`metrics.cjs`) over 13 screens × {360, 390} × {light, dark} × {compact, full} = 104 runs:
  - **0** document-level horizontal overflow
  - **0** interactive targets under 44 px within three viewports
  - minimum non-label font **14 px**
  - **0** text contrast failures
  - **0** console or page errors
  - Landscape 844×390 and 640×410 (200%-zoom equivalent): scrollWidth equals clientWidth.

## 11. Screenshots (`…/scratchpad/design/ux-b/shots/`)

| Group | Files |
|---|---|
| Phone 390 | `390-home.png` · `390-list.png` (compact) · `390-list-full.png` · `390-list-card-full.png` · `390-ended.png` · `390-country.png` · `390-detail.png` · `390-detail-mid.png` · `390-detail-nz.png` · `390-filters.png` · `390-stamps.png` · `390-ahead.png` · `390-ahead-lower.png` · `390-next.png` · `390-countries.png` · `390-method.png` · `390-explore.png` |
| Dark | `390-home-dark.png` · `390-list-dark.png` · `390-detail-dark.png` |
| 360 | `360-home.png` · `360-list.png` |
| 768 | `768-home.png` |
| 1440 | `1440-home.png` · `1440-country.png` · `1440-detail.png` |
| Fallback | `844x390-landscape.png` · `844x390-landscape-explore.png` · `640x410-zoom200.png` |

---

## 12. Honest self-critique

1. **The map is orientation, not navigation, on a phone.** The world is 390×175. 172 country paths are under 44 px and Europe is a cluster. Tapping Belgium or Lebanon at world scale is a lottery; Explore mode and region chips help, but selection really runs through search, the brief and Countries. A map-first layout spends about 250 px of prime space on a picture whose main job is "where coverage exists". Direction A (list-first) would put two more records above the fold.
2. **Permanent chrome is 192 px (23% of 844):** masthead 52 + disclosure 76 + tab bar 64. The three-line verbatim disclosure is the biggest single cost. I kept it whole because the policy wording is explicit, but the editorial panel should decide whether a one-line variant that expands is "prominent" enough. I would not ship anything shorter without that sign-off.
3. **Cards are still tall.** Compact is 433–485 px, about 1.6 cards per full-sheet screen; full is 600–750 px. Spelling out every unknown has a real height cost. A third "headline" density (title + stance + recency only) may be needed for fast scanning. It is not designed here because it would hide intensity and state action, which the brief wants visible.
4. **Bottom sheet plus tab bar is gesture-heavy and fragile.**
   - Fragile across environments: `100dvh` app shells misbehave in iOS Safari URL-bar resizing, in in-app webviews (Twitter/X, WhatsApp) and with the keyboard open.
   - Screen-reader users get a non-modal sheet whose snap state they cannot perceive, apart from the grab button's label.
   - The prototype's half state does not scroll its content; the real build needs the expand-then-scroll hand-off, which is notoriously finicky.
   - None of this was tested on a real iPhone, Android, VoiceOver or TalkBack.
5. **Hue-free stance badges trade clarity for neutrality.** FOR is a solid fill and AGAINST an outline, so FOR is visually heavier and could read as emphasis or endorsement. The vocabulary also flattens "support/oppose toward a target" into FOR/AGAINST. Mixed and Unclear have no data examples to test against. Needs user testing.
6. **"Described / Not established" is a client heuristic over free text.** "Disruption beyond the reported march not established" (Spain) is summarised as "not established" although a march was reported. "No violence described in the reviewed report" (Australia) counts as "described". The verbatim text is one tap away, but the compact summary is lossy, and the editorial panel should review it.
7. **The recency grouping looks like a ranking and decays fast.** After about 5 Oct with no new data, the "last 72 hours" group vanishes and the list becomes uniformly "more than 30 days ago". That is honest, but it makes a frozen deploy look dead. It is the correct consequence, and it puts pressure on the research pipeline rather than the UI.
8. **Dark mode changes the "black shadow" into a light offset.** It keeps the shape and meaning but breaks the policy's literal word "black". The legend says "Shadow", deliberately. This needs editorial acceptance, or an alternative such as an ink outline.
9. **Region chips and per-region filter counts invite comparison** ("Europe 20, Oceania 9") despite the caveat. A purist reading of "no ranking of regions" would drop the counts from region chips.
10. **The Ahead "further action mentioned" list is a judgement call.** It surfaces undated prose from status-basis text. The copy says these are not announcements, but a hurried reader might still treat them as a calendar. If the skeptic disagrees, cut it; the empty state stands on its own.
11. **The roadmap page is hand-maintained markup** duplicating docs/ROADMAP.md. "In this release" claims go stale silently if not updated with each release. A small `public/roadmap.json` validated in build.py would be safer, at the cost of one more allowlisted file.
12. **The "Data updated" chip uses the word "updated"**, the very conflation the brief warns about. It is mitigated by the "Data" qualifier, the long form "Data integrated" on tablet and desktop, and the tap target showing four clocks. Some reviewers will still want "Data integrated" on phones too, which is 2 px wider.
13. **Prototype gaps** (designed, not built):
    - real d3.zoom pinch and pan
    - keyboard map navigation
    - URL and hash sync
    - wired Share, CSV and example mode
    - loading, error and map-failure states
    - search suggestions
    - the expand-then-scroll sheet hand-off
    - the desktop detail drawer covering the masthead (it should start below the disclosure)
    - "Coming next" wrapping to two lines in the 360 px tab bar
