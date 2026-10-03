# Protest Atlas: Direction A, "Live desk" (feed-first, mobile-first)

Design panel proposal, UX-A · 2 October 2026 · prototype built on real published records.

- Prototype (self-contained, about 560 KB including all 84 real records, contexts and the projected map): `ux-a/prototype.html`
- Served for review at `http://localhost:8771/ux-a/prototype.html`. Add `?shot=1` to hide the purple prototype menu, `?theme=dark`, `?now=2026-10-06T09:00:00Z` (stale state), `?example=1` (example mode), `?build=<ISO>` (simulated deploy stamp) or `?density=list`. Routes: `#latest #map #map/FR #ahead #roadmap #countries #more #filters #stamps #record/<id>`.
- Screenshots: `ux-a/shots/` (33 PNGs; the list is at the end).
- Build sources: `ux-a/build/` (`proto.css`, `proto.js`, `proto.src.html`, `data.js` extracted from `public/`, `genmap.cjs` pre-projecting Equal Earth with the vendored D3 7.9.0, `shots.cjs`, `metrics.cjs`, `func.cjs`, `geo.cjs`).

The clock is frozen at **2 Oct 2026 22:30 UTC** so relative labels are reproducible ("Data · 58 min ago").

---

## 1. The idea in one paragraph

The phone home works like a news desk, not a magazine cover. A thin, always-visible pilot disclosure comes first. Below it sits a compact **desk status** (counts plus four separate update stamps), then a search and filter bar, then the five reports **observed in the last 72 hours** as full "dossier" cards. Each card answers *who stands where, against what · intensity as three separate measures · police/state action · timeframe with unknowns · evidence* without opening anything. Older bands follow, then a small coverage map that never traps scrolling, then the historical archive as compact rows. A bottom tab bar (Latest · Map · Ahead · Countries · About) gives thumb reach to everything else. Tapping a record opens a **full-screen sheet** that leads with a 4-cell summary (Positions · Intensity · Police/State · Timeframe) and then the sourced sections.

## 2. Measured result (current site → prototype, 390×844 unless stated)

| Measure | Current site (audit) | Prototype |
|---|---|---|
| Distance to first record card | 5,812 px (6.9 screens) | **607 px**; first headline fully visible by 725 px, above the tab bar (visible area ends at 780) |
| Same at 360×780 | 5,861 px | 652 px (headline partly visible; see critique) |
| Document height (Latest) | 35,102 px | 7,496 px (5 cards + 8 archive rows, "Show 10 more") |
| DOM nodes | 6,972 | 3,503 (includes the 249-row directory and two map SVGs) |
| Visible time of day | none | 4 stamps with relative + absolute UTC time, plus a header chip |
| Horizontal overflow, 360 and 390 | 0 | **0** on all 15 measured states (11 screens + stale, dark ×2, example) |
| Interactive targets under 44 px | 19 controls + 273 map shapes in the first 2 screens | **0** (only exceptions: visually hidden radio inputs whose 48 px label rows are the targets, and the inline "How it works" link inside the disclosure sentence) |
| Reading text under 14 px | 34 elements in the first 2 screens | **0**. Only uppercase tracked labels are 12 px, tab labels 13 px, and the decorative brand arrow 10 px (aria-hidden) |
| Text contrast under 4.5:1 (computed against effective background) | n/a | **0** across light, dark, stale and example states |
| Dialog close bug (`[data-event]` rebinding) | confirmed | fixed by design: delegation on `[data-open]`. Close works after a filter re-render (verified in `func.cjs`) |
| Map scroll trap | `touch-action:none` over 285 px | Home map is a static button (pan-y); the Map tab uses buttons and two-finger gestures |

Functional checks (`build/func.cjs`): opening with Enter focuses `#d-title`; Escape closes and restores focus to the card's title button; the URL returns from `#record/<id>` to `#latest`; Close still works after a re-render; a quick chip shows "5 of 84 match"; the filter sheet's Apply label previews the count ("Show 20 records") and adds an active chip and a badge; prev/next works inside the sheet ("2 of 20 in this view"). No page errors in 33 screenshot runs.

## 3. Information architecture and navigation

### 3.1 Top-level structure (phone)

```
Header (sticky 56px):  [P↗ Protest Atlas]          [⏱ Data · 58 min ago]  [⌕]
                        brand = #latest             opens Update times    focuses search
Tab bar (fixed 64px):   Latest · Map · Ahead · Countries · About
```

| Tab | Route | Job |
|---|---|---|
| **Latest** (home) | `#latest` | Desk status, filters, bands by observation age, map module, archive, share/CSV, gap note, footer |
| **Map** | `#map`, `#map/FR` | Coverage map, region zoom chips, country brief (ledger + records + cities), list twin of all countries in view |
| **Ahead** | `#ahead` | Announced actions from `public/upcoming.json`. Empty this round, with an honest empty state |
| **Countries** | `#countries` | All 249 directory entries by region, searchable; each row opens the country brief |
| **About** | `#more` | Coming next (featured), update times, methodology/policy, example mode, CSV, JSON, corrections, editor desk |
| (deep) **Coming next** | `#roadmap` | Product roadmap: Next / Needs people / Later / Not planned / Shipped |
| (overlay) Record | `#record/<id>` | Full-screen sheet on phone; 680 px right drawer at ≥700 px |
| (overlay) Filters | `#filters` | Bottom sheet on phone; inline rail on desktop |
| (overlay) Update times | `#stamps` | Sheet explaining every stamp |

The tab is labelled "About" rather than "More" because a vague bucket hides content. "Coming next" is its first row and carries a ROADMAP badge.

### 3.2 URL model

- **Filters stay in the query string** using the existing 9-key codec (`q, country, region, issue, status, window, year, city, outcome`). `readViewState`/`encodeViewState` and their test are unchanged.
- **The view lives in the hash** (`#map`, `#record/es-housing-20261002`). This needs no new HTML pages, so `build.py PUBLIC_FILES` grows only by the JS/CSS modules.
- Share link for a view: `origin + pathname + ?query` (as today). Share link for a record: the same, plus `#record/<id>`.
- Source chips keep `href="#detail-source-N"` (pinned by the outcome test) but clicks are intercepted with `scrollIntoView`, so the hash is never polluted.
- Density preference (Cards/List) is a per-viewer convenience in `localStorage` (try/catch, default Cards). It is never in the URL, so the 9-key test stays.

### 3.3 Entry points for "what's coming next" (both senses)

Announced protest actions → **Ahead** tab (always visible).

Product roadmap → **Coming next**, reached from seven places:
1. the About tab's top row (badge "ROADMAP")
2. a teaser card in the Latest feed after the map module
3. the Ahead page's cross-link card "Also ahead: new atlas features"
4. the Ahead empty state's secondary button "What's coming to the atlas"
5. the desktop header nav item with a ring marker
6. contextual "coming next" rows where a feature is missing (the filter sheet's dashed row: "**Custom date ranges** and movement grouping are coming next")
7. the footer

Every roadmap item has a primary "Try what exists" button and a secondary "Discuss on GitHub ↗".

## 4. Screens

### 4.1 Latest, first viewport at 390×844 (`shots/01-home-390.png`)

Top to bottom, with measured heights:

1. **Header** (56): brand; **Updated chip** `⏱ Data · 58 min ago` (44 px tall, opens the Update times sheet); search.
2. **Pilot band** (90, inverted ink): **"AI-assisted reporting pilot."** Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed. <u>How it works</u>
3. **Desk status** (≈190): "**84** sourced episodes · **81** countries & territories" / "168 of 249 entries have no published episode: a coverage gap, not an absence of protest." Then the **update-times strip**: one 4-up tappable block (`UPDATE TIMES · UTC … What they mean ›`) with DATA / OBSERVED / CHECKED / BUILT, each showing relative and absolute time.
4. **Filter bar** (117, sticky under the header): search field "Issue, place or actor" + `Filters (n)` button; quick chips `Last 7 days · Last 30 days · Ended / suspended · Documented change · Country ▾` (scrollable, edge fade); removable active-filter chips.
5. **Results row** (54): "**84** records · newest first" + segmented `Cards | List`.
6. **Band** "Observed in the last 72 hours **5**" / "Recent reports, not confirmed as ongoing."
7. The first card's meta, place, headline and issue tags are visible (headline bottom at 725 px).

### 4.2 Record card list (`02-*`, `02d-list-390`, `03-*`, `03b-*`)

- **Bands are exclusive** and driven by `observationBand()` on `last_observed_at` only. They are: "Observed in the last 72 hours", "Observed 3 to 7 days ago", "Observed 8 to 30 days ago" and "Observed more than 30 days ago".
- Today's counts are 5 / 0 / 0 / 79. An empty middle band collapses to one ruled line: "**Observed 3 to 7 days ago:** none in this view".
- **The fresh, week and month bands render full cards** (or rows when the List density is chosen). **The archive band renders compact rows**, 8 at first, then "Show 10 more (n remaining)".
- After the recent bands come:
  - the **map module**: "Where reports are published · 81 in view". It is a static Equal Earth image inside a button to the Map tab, with the legend and the 6 polygon-less countries named.
  - two **teaser cards**: Ahead and Coming next.
  - the archive rows.
  - a **share row** ("Share or download this view": `Copy link`, `CSV`).
  - the **gap note**.
  - the **footer** (Methodology, Coming next, Editorial policy ↗, Source & corrections ↗, Published data (JSON), Editor desk ↗, attributions).

### 4.3 Record card anatomy (390, 696 to 854 px tall; one card per screen)

```
┌─────────────────────────────────────────────┐  surface #fffdf8, 1px rule, radius 12
│ ⏱ Observed today, 2 Oct        ◌ Status unknown │  meta: observation (relative + abs) | display status (symbol + text)
│ India · Mumbai and New Delhi                │  where: country bold + location label (country-wide when precision=country)
│ Electoral roll revisions and accountability │  Charter 21/26 semibold; the title is a button that opens the record
│ (Elections) (Government accountability)     │  issue tags, 14px, non-interactive
│ Demonstrators challenged … resignation.     │  summary, 15/22, clamped to 2 lines on phones
│ ─────────────────────────────────────────── │
│ POSITIONS                                   │
│ ▌Youth movement and student activists       │  actor (ink-2 semibold)
│ ▌− AGAINST  Electoral roll revision process │  stance word in ink + named target; 4px stance rule
│ ─────────────────────────────────────────── │
│ INTENSITY · THREE SEPARATE MEASURES         │
│ (?) Turnout, disruption and violence:       │  collapses to one line only when all three are
│     not established in this record          │  canonical placeholders; otherwise 3 rows verbatim
│ ─────────────────────────────────────────── │
│ POLICE / STATE ACTION                       │
│ Police prevented gathering and detained … · AP reporting │  verbatim action + attribution
│ ─────────────────────────────────────────── │
│ ◌-------------●-------------◌               │  time rail, not to scale: ONSET · OBSERVED · END
│ ONSET          OBSERVED       END           │  dashed ring + "not established" for unknowns
│ not established 2 Oct 2026   not established│
│ ─────────────────────────────────────────── │
│ Associated Press · published 2 Oct · Single-source (2 links, one reporting chain) · AI-assisted check 2 Oct, 21:09 UTC │
│ [ Read source ↗ ]          [■ Open record ] │  44px buttons
└─────────────────────────────────────────────┘
Ended episode: the same card with a 6px black offset shadow (dark mode adds a 1px light edge) and a ■ "Ended / suspended" status.
```

Rules:
- **The positions block never shows a tally, bar or "two sides".** Each position is actor + stance word + named target. The stance mark is a 4px rule: blue for `For`, magenta for `Against`, a double grey rule for `Mixed on`, a dashed grey rule for `Unclear on`. The words always carry the meaning (`+ FOR`, `− AGAINST`, `± MIXED ON`, `? UNCLEAR ON`).
- Institutional positions are not relabelled automatically, because the data has no actor-type field. The detail note says "A government or party position is a response, not a counter-protest". KR-Yoon (both `oppose`, opposite targets) and NG-Pengassan (two `support`) read correctly because the target is always printed.
- **Intensity is printed verbatim.** The audit of the 84 records shows why. Violence texts include "Described as peaceful", "Violence not reported in the reviewed accounts" and "HRW documented excessive force…". Turnout includes "RNZ reported more than 42,000…; exact comparable bounds not adopted" and "No verified numerical estimate retained". Any "reported / described / none" label derived from this text would misfile records in both directions.
- Only an **exact-match set** of canonical placeholders renders as "? Not established": `not established`, `unknown`, `not established by this record.`, `disruption not established by this record.` (case-insensitive, trimmed). There is no regex. Turnout with numeric `min`/`max` prints first ("At least 1,000", "1,000–2,000") followed by the qualifier.
- **State action** is printed verbatim with its attribution. If there is none: "? Not established in this record". The phrase "no police action" never appears. There is no chip classification of free text.
- **Timeframe rail**: nodes are ordered chronologically. When `end_date < last_observed_at` (TZ: ended 30 Sep, observed 1 Oct) the order is Onset → Ended → Observed. Known dates are filled dots, unknowns are dashed rings, and an ended node is a black-shadowed square. Any segment touching an unknown is dashed. The rail is never to scale.
- **Evidence line** (policy requirement per card): first publisher · its publication date · verification level, with link count and the independence caveat · "AI-assisted check" + `last_verified` in UTC · link to the original (Read source ↗).

**Compact row** (archive and List density): country · observed date / serif title (with ■ if ended) / one line per position (`− AGAINST target · actor`) / "State action recorded | not established" · status. The row is a 44+ px button.

### 4.4 Detail view, open state (`04-detail-es-390`, `04b`, `04c`, `04d`, `04e`, `13c`, `31-detail-1440`)

Phone: a native `<dialog>` with `showModal()`, full-screen.
- **Top bar** (56): `× Close` · "2 of 84 in this view" · Share (icon, 44).
- **Bottom bar** (64, thumb zone): `‹` · `Read Al Jazeera ↗` (primary) · `›`.

Body:
1. Meta (observed + status), where (· precision unless country-wide), **H2 title** (focused on open, no ring), summary.
2. **4-cell summary** (2×2, each cell links to its section):
   - **Positions**: stance word + target + actor.
   - **Intensity**: `Turnout: see text | not established` ×3. It never says "reported" or "none".
   - **Police / state**: the first action, or "Not established in this record".
   - **Timeframe**: Onset / Observed / End with unknowns.
3. **Sticky section chips** appear only after the 4-cell summary scrolls away (IntersectionObserver): Positions · Intensity · State action · Timeframe · What changed · Sources.
4. **Positions**: per position, actor / stance + target / *"claim"* in italic serif / Source chips (44 px). Note: "Each position names an actor, a stance and the target it is for or against. A government or party position is a response, not a counter-protest. Positions are not a count of support."
5. **Intensity**: Turnout / Disruption / Violence as separate blocks, verbatim, with source chips. Note: "Three separate measures, each with its own source. They are never combined into a severity score, and unknown is never counted as zero. Police force or arrests do not by themselves show participant violence."
6. **Police and state action**: the action (17 px semibold), "Attributed to: …", sources. Note: "Described as the source reports it. An announced deployment is not an observed one, and allegations stay attributed." If none, a dashed box: "**Not established in this record.** The reviewed sources did not establish any police or state action for this episode. This is not evidence that there was none."
7. **Timeframe**: the large rail plus "Not to scale. Dates are UTC days as reported; unknown onset or end stays unknown." Then the dated timeline with sources, then the status rule: "'Reported ongoing' would need a source observation less than 72 hours old. A newer source check alone cannot renew it." followed by **Status basis:** the sourced text.
8. **What changed, and for whom?** (keeps the strings pinned by `outcomeHTML`):
   - "**End not established.** No source in this record reports this episode ending or being suspended." / "**Ended / suspended episode.** This applies to the bounded episode only, not the wider movement, and does not mean its demands succeeded."
   - Each outcome: date, summary, actors with `BENEFIT|SETBACK|MIXED|UNCLEAR` and a dashed `Explicit in source` / `Assessment / inference` tag.
   - Causality: "**Causation not established.** … protest causation is not established." or "**Reported link.** …"
   - Episode scope.
   - If none: "Outcome not established · No sourced change is recorded for this episode. That does not mean nothing changed."
9. **Verification and sources**: level + note + research note + "Source check (AI-assisted): 2 Oct 2026, 21:09 UTC. Source count is not a confidence score." Then the numbered sources (`id="detail-source-N"`): publisher, title, Published · accessed (UTC), `Open original ↗`.

Ageing: the existing 60 s + visibilitychange `refreshAges` patches the status badge in place and inserts the existing needs-review note.

### 4.5 Filter sheet (`05-filters-390`, `05b-filters-more-390`)

Bottom sheet (max 92dvh, radius 16, grabber): "Filter records" · Close.
- **Observed within** (radio rows, 48 px, 16 px check): Any date · Last 7 days · Last 30 days. Help text: "Uses the date a source last observed activity, never publication or check time."
- **Status** (toggle chips with live counts): Any · Reported ongoing 0 · Ended / suspended 18 · Needs review 0 · Status unknown 66 · Planned 0. Help text: "'Reported ongoing' needs a source observation under 72 hours old." Zero counts are shown, not hidden.
- **Country or territory** (native select, 48 px, 16 px text so iOS doesn't zoom).
- **Region** chips (deliberately *without counts*, which would invite regional ranking).
- **Issue** (select).
- **History**: Reported year · Result evidence (two-up) · Reported city.
- Dashed "coming next" row.
- **Sticky footer**: `Reset` · `Show N records` (live preview count). Apply commits; Close discards.

Desktop renders the same form inline in the left rail and applies immediately.

### 4.6 Update times sheet (`11-stamps-390`)

"These times answer different questions. None of them means a protest is happening now."

| Stamp | Value (frozen clock) | Exact copy |
|---|---|---|
| Data integrated | 58 min ago · 2 Oct 2026, 21:31 UTC | When the published records were last assembled. This is AI-assisted integration, not a human editorial sign-off. |
| Newest observation | today · 2 Oct 2026 · day precision | The most recent day on which a source observed protest activity. Status and the 72-hour band count from here. |
| Newest source check | 1 h ago · 2 Oct 2026, 21:25 UTC | When an article was last read and checked (AI-assisted). A new check never renews an old observation. |
| Site built | Not available (local) / "6 min ago · 2 Oct 22:24" (deployed) | This copy has no build stamp. On the live site it shows when the pages were deployed, which says nothing about events. |
| Announcements file | Not available | No announced actions have been published yet, so there is no announcements time. |
| Discovery audit | 3 h ago · 2 Oct 2026, 19:27 UTC | A dated, static audit of one news-discovery run (97 unverified leads). Not live service health. |
| Human editorial review | Not completed | No human editor is enrolled in this pilot. |

These map one-to-one to `updateStamps()` in `freshness.js`. They are never merged. Day-only values never show a clock time.

### 4.7 Ahead, empty state (`06-ahead-390`, `06b-ahead-explain-390`)

- Eyebrow "AHEAD" · H1 "Announced actions" · lede "Strikes, marches and rallies that a named union, party, coalition or institution has publicly announced. City and date level only."
- Stamp line: "Announcements file: **none published yet** · Today: **2 Oct 2026** (UTC)"
- **Empty card** (dashed, calendar-with-question icon):
  - H2 "No announced actions are published yet"
  - "This round's research could not reach news sites from the build environment, so no announcement could be sourced and checked. **An empty list here does not mean nothing is planned.**"
  - Buttons: `See the latest observations` (primary) · `What's coming to the atlas`.
  - Copy variants:
    - file present with zero items: "No announced action has been sourced and checked yet. An empty list here does not mean nothing is planned."
    - file failed to load: "Announcements could not be loaded. This is not the same as no announcements." with `Retry`.
- **"When announcements appear, each will show"**:
  1. **Planned date** and how precise it is (day, week, month or range)
  2. **City and country**; never routes, clock times or meeting points
  3. **What was announced and who announced it** (union, party, coalition or institution; never a private person)
  4. **The source** with publication and access dates
  5. **A linked record** when the source connects it to a published episode
- **"How an announcement ages"** (pills mirror `ANNOUNCEMENT_LABELS`):
  - `Announced · in 5 days`: counts down in whole UTC days
  - `Scheduled for today`: occurrence not confirmed
  - dashed `Planned date passed`: "Occurrence not recorded here. It never turns into 'happened' on its own."
  - struck `Reported postponed`: or "Reported cancelled", with the source that says so
- Caveat (ink rule): "An announcement is not evidence that an action will happen, how many people will join, or whether it is lawful."
- Cross-link card: "Also ahead: new atlas features".

**Populated spec (ready for items):**
- Groups: *Upcoming* (planned_start ascending), *Today*, *Date passed* (a collapsed group, never mixed into Upcoming), *Postponed / cancelled*.
- Item card:
  - left date block: "7 Oct" big, with precision under it ("day" / "week of" / "October" / "7–9 Oct")
  - countdown pill from `countdownLabel()`
  - action (serif 19)
  - "Paris, Lyon · France"
  - "Announced by: <institution>"
  - announcement paraphrase (attributed)
  - `Linked record ›` when `event_id` is set
  - source line (publisher · published · accessed UTC) + `Read announcement ↗`
  - note
- No map pins for announcements. The map stays a coverage map.

### 4.8 Coming next (`07-roadmap-390`, `07b`, `07c`, `32-roadmap-1440`)

H1 "What we're building, and what we won't" · lede "Plans, not promises. Most timing depends on staffing a human editor. Nothing on this page changes what today's data establishes." · stamp line "Roadmap reviewed **2 Oct 2026** · Source: the public delivery tracker (docs/ROADMAP.md)" · stage chips All · Next · Needs people · Later · Not planned · Shipped.

| Stage | Item | "Waiting on" | Buttons |
|---|---|---|---|
| NEXT | Sourced announcements in Ahead | network access for sourcing; each item still needs an article-level check | See the empty state · Discuss on GitHub ↗ |
| NEXT | Structured police and state action (type, acting body, announced vs observed, dates; 37 of 84 have one today) | a schema change and a re-check of all 37 entries; no automatic classification of free text | See today's format · Discuss |
| NEXT | Cleaner issue labels (Labor/Labour, Pay/Wages) | a data migration with redirects for existing links | Discuss |
| NEXT | Lighter, faster map (one geometry file, deferred ledger, about 0.8 MB less) | engineering time only | Discuss |
| NEEDS PEOPLE (dashed) | Human editorial review ("Until this exists, the AI-assisted pilot label stays at the top of every page.") | staffing; no date until someone is appointed | Discuss |
| NEEDS PEOPLE | More languages (123 of 128 sources read are English) | reviewers for specific languages and regions | Discuss |
| LATER | Movements and episodes · Custom date ranges · Versioned snapshots and fuller exports | episode model / link format / licensing | Discuss |
| BY DESIGN: Not planned | Risk or unrest prediction scores · Popularity, approval or "who is winning" measures · Identifying or tracking participants · Live tactical maps · Push alerts and accounts | with a one-line reason each | none |
| SHIPPED (last, smaller type) | Live desk · Separate update times · Record at a glance · A home for announced actions | none | Try it |

Footer card: "Suggest a feature or report a problem. Public issue tracker. Please don't post private details about participants."

### 4.9 Map tab (`08-map-fr-390`, `08b-map-brief-390`)

- Lede: "Ochre marks a country or territory with a published report in this view. Colour never shows protest size, support or severity."
- Region chips World · Africa · Americas · Asia · Europe · Oceania · (selected country). Each is a curated viewBox, and the map height never changes.
- **Selection is an ink outline, not a fill.** Today's deep-green fill hides whether the selected country has coverage (Brazil turns green); the outline keeps colour meaning coverage only.
- **Focus zoom uses the largest polygon** (`mb` bounds), so France frames mainland France, not the Atlantic.
- **The black shadow and hatch scale with zoom** (offset = 4 map units × viewBox/1000, about 1.4 px on screen at any zoom).
- City dots (r about 3.2 px on screen) are always drawn. Labels use greedy collision culling, flipping left before being dropped. Rennes flips; Strasbourg is culled but still listed in the brief.
- `touch-action: pan-y`; zoom with buttons (44 px) or two fingers. Hint: "Swipe scrolls the page. Use the buttons or pinch with two fingers to zoom; tap a country, or pick one from the list below."
- Legend adds "Selected" (outline swatch) and "City reference point, not a protest site".
- **Country brief**: "COUNTRY BRIEF / France / 2 published records in this view, including a sourced ended or suspended episode." Then the ledger (Source coverage · Languages read · Last source check with relative + UTC · Historical screen "Searched once (not exhaustive)" · Human review "Not completed"), "Reported cities: …. City dots are generalised reference points, not protest sites.", the records as rows, and `Show in Latest` · `Clear selection`.
- The other two brief states keep today's copy: records filtered out ("N published records, but none matches the current filters.") and no record ("No published record. This is a coverage gap, not evidence that no protests happened.").
- **List twin**: "Countries with reports in this view (81)", expandable, including the 6 not drawn at this scale. It is the keyboard alternative: there are no per-path tab stops.

### 4.10 Countries (`09-countries-390`)

- H1 "Countries & territories" · "All 249 entries, A to Z by region. No published record is a coverage gap, never evidence that no protests happened."
- Search; key (■ "Published record(s)", hatched "Screened once · no published record").
- Region sections with correct plurals ("Antarctic · 1 entry").
- Rows (52 px): name + status ("1 published record" / "Screened once · no published record" / "Search failed · no published record" / "Not yet searched") + chevron. A row opens the Map brief.

### 4.11 About & data (`10-more-390`)

Rows (60 px):
- **Coming next** [ROADMAP]
- Ahead: announced actions
- Update times
- Methodology and editorial policy ↗
- Explore an illustrative example
- Download CSV of this view
- Published data (JSON)
- Source code and corrections ↗
- **Editor desk** ("Local review tool for unverified leads. Not a public feed")

### 4.12 System states

- **Stale** (`12-stale-390`, now = 6 Oct):
  - the header chip turns warning-tinted: `Data · 3 days old`
  - the pilot band keeps the full disclosure and adds "**Snapshot 3 days old.** It no longer claims to be current. Ages and statuses below keep counting."
  - the 72-hour band reads "**None in this view.** No published record has a source observation from the last 72 hours. That does not mean nothing is happening."
- **Example mode** (`14-example-390`):
  - a striped banner "**Illustrative example • not a real event** … excluded from counts, the directory and CSV export. Back to reported data"
  - a striped watermark header on each card and in the detail
  - desk text "Illustrative example mode. One fictional record."
  - CSV and Copy link refuse with a toast; `onExport` must check the mode itself, not rely on a disabled button
  - the map uses the example violet; the directory always shows reported coverage
- **Loading**: text, not skeletons: "Loading the published index…". The header chip reads "Data · loading".
- **events.json failed**: "**Published data could not be loaded.** Coverage is unavailable, not zero." `Retry` · `Open the data file`.
- **countries.json failed**: the directory gets its own retry.
- **Map failed** (a real visible state, not a 10 px line): "The map could not be drawn. Every country is still listed in Countries." `Retry map`.

## 5. Visual system

### 5.1 Type

System stacks only (no font service): serif `Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Georgia, serif` (Charter on macOS, Iowan Old Style on iOS, Sitka/Georgia on Windows, Noto Serif/Georgia fallback on Android; Linux screenshots use Bitstream Charter); sans `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Liberation Sans", sans-serif`. Numbers are proportional except in stamps, rails, timelines and dates (`tabular-nums`).

| Role | Phone | ≥700 | Weight / face |
|---|---|---|---|
| Page title (Ahead, Map, Coming next) | 30/34 | 30/34 (desktop 30) | Charter 600 |
| Detail title | 28/32 | 28/32 | Charter 600 |
| Card title | 21/26 | 24/29 (desktop 22) | Charter 600 |
| Row / roadmap / source title | 17–19/1.3 | same | Charter 600 |
| Band heading, section H3 | 20/25, 19/25 | same | Sans 700 |
| Body, lede | 16/24 | 16/24 | Sans 400 |
| Card summary, fact values, positions | 15/21 | 15/21 | Sans 400–600 |
| Meta, help, notes, evidence | 14/20 | 14/20 | Sans 400–600 |
| Labels (eyebrows, stance words, rail labels, stage pills) | 12/16 UPPER, +.06–.08em | same | Sans 700–800 |
| Tab labels | 13 | n/a | Sans 600 |

### 5.2 Space, shape, elevation

- 4 px grid: 4, 6, 8, 10, 12, 14, 16, 18, 22, 26. Gutters: 16 (phone), 28 (tablet), 24 (desktop).
- Radius: cards and sheets 12/16, buttons 10, chips and pills 22.
- Rules: 1 px hairlines (`--rule`) inside components; 1 px ink rules (`--rule-strong`) to open a section.
- **There is one elevation, and it has meaning**: the black offset shadow marks a sourced ended/suspended episode (cards 6 px, map 4 map units, glyphs 2 px). No decorative shadows anywhere, so the metaphor stays unambiguous.

### 5.3 Colour tokens (contrast measured with the dataviz validator's `contrast()`)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--paper` | #f6f4ee | #121411 | page |
| `--surface` | #fffdf8 | #1b1d1a | cards, sheets |
| `--surface-2` | #eeebe2 | #242722 | insets |
| `--ink` | #1a1c19 | #efede6 | 15.6 / 15.8 on paper |
| `--ink-2` | #3f423c | #cfccc3 | 9.3 / 11.5 on paper |
| `--muted` | #5f625b | #a3a69d | 5.64 paper · 6.10 surface · 5.20 surface-2 (light); 7.50 / 6.87 / 6.12 (dark) |
| `--rule` / `--rule-strong` | #d8d4c8 / ink | #363a33 / ink | |
| `--inverse` / `--on-inverse` | #1a1c19 / #f6f4ee | #efede6 / #121411 | pilot band 15.6 / 15.8 |
| `--warn-bg` / `--warn-ink` | #f7e6d3 / #7a3410 | #3a2414 / #f0a477 | stale chip; warn-ink ≥ 6.5 on all surfaces |
| `--cover` (map coverage only) | #c78d43 (+ stroke #8d6328, 4.67:1 on plate) | #b07a30 (+ stroke #e0b06a, 7.57:1) | **the only meaning of ochre** |
| `--example` | #8a74cf | #8f7fd0 | example mode only |
| `--map-plate` / gap / hatch | #eef1ec / #dfe3dd / #b9c2b8 | #232823 / #2f352f / #3f463f | gap = hatched, never zero-coloured |
| `--stance-for` | #2a78d6 | #3987e5 | marks only; text stays ink |
| `--stance-against` | #e87ba4 | #d55181 | marks only |
| `--ended-shadow` / `--ended-edge` | #0d0f0d / transparent | #000 / #8a8e85 | the edge makes the shadow readable on dark paper |

Ochre is **reserved for coverage**: the map fill, the legend, and directory "published" dots. It is no longer the link or accent colour. Interactive accent is ink (filled ink primary buttons, ink underlined links). Status uses **symbol + text, never hue**:
- ◌ dashed ring: Status unknown
- ■ with black shadow: Ended / suspended
- ● filled: Reported ongoing
- ○ ring: Planned
- warn-ink slashed ring: Needs review

### 5.4 Data colours, validated (`scripts/validate_palette.js`, `--pairs all`)

| Palette | Mode / surface | Result |
|---|---|---|
| Stance `#2a78d6, #e87ba4` (blue For, magenta Against) | light / #fffdf8 | **PASS.** CVD worst ΔE 13.0 (protan), normal 27.5; contrast WARN magenta 2.65:1, relieved by the always-visible ink stance word |
| Stance `#3987e5, #d55181` | dark / #1b1d1a | **PASS.** CVD 15.9, normal 26.5, contrast ≥3:1 |
| Map `#c78d43, #8a74cf` (coverage, example) | light / plate #eef1ec | **PASS.** CVD 23.7, normal 24.2; ochre contrast WARN 2.52, relieved by the 4.67:1 stroke, the legend and the list twin |
| Map `#b07a30, #8f7fd0` | dark / plate #232823 | **PASS.** CVD 21.8, normal 21.8, contrast ≥3:1 |
| Rejected: current selected fill `#c78d43, #174e4a` | light | **FAIL** (band L 0.387, chroma 0.057). Hence selection moves to an outline |
| Rejected: current example lilac `#bcaed0` | light | **FAIL** chroma 0.05 |
| Rejected: stance blue/violet `#3987e5, #9085e9` | dark | **FAIL** CVD ΔE 1.9, normal 9.8 (it passed in light, which is why both modes must be run) |

Choice rationale: stance is **nominal identity, never a diverging scale**. Blue and magenta are not warm/cool opposites, are not red/green (which would read as good/bad), and stay away from orange and ochre (which would collide with coverage on the same screen).

### 5.5 Icons

24 px, 1.8 stroke, round caps, inline SVG, `aria-hidden`: clock, search, sliders, newspaper (Latest), globe (Map), calendar-arrow (Ahead), A–Z list (Countries), info (About), external arrow, chevrons, link, download, calendar-question (empty Ahead).

## 6. Interaction and motion

- **Sheets** (filters, update times) rise 24 px with an opacity ramp from 0.6 over 260 ms `cubic-bezier(.2,.8,.2,1)`. The detail is a full sheet on phones and a right drawer (translateX 32 px) at ≥700 px. Close by: Close button, Escape, backdrop tap (sheets), and swipe-down on the grabber in production. Scroll lock comes from the native modal plus `overscroll-behavior: contain` on scroll containers.
- **No pulsing "live" dots** or tickers; nothing animates on the clock tick. Relative labels recompute every 60 s and on `visibilitychange`, and statuses age in place (the existing `refreshAges` pattern, extended so the header chip, stamps and the 72-hour band also refresh).
- Quick chips are toggles (`aria-pressed`) and apply instantly. The filter sheet previews counts and commits on Apply. Search is debounced 150 ms. The feed holds its layout while re-rendering (no skeleton flash).
- Section chips in the detail appear only after the summary leaves view. Jumps use `scrollIntoView` (smooth unless reduced motion).
- `prefers-reduced-motion`: all animation and smooth scrolling off.

## 7. Accessibility

- Landmarks: header, `main#main` (skip link "Skip to content"), and `nav` for both the tab bar and the desktop nav (`aria-current="page"`).
- **Dialogs**: native `<dialog>` with `showModal`, `aria-labelledby` on the title, focus on the H2 (`tabindex=-1`, no ring on programmatic focus), Escape, focus restored to the trigger or the search field.
- **Target sizes**: every control is ≥44×44, including source chips (raised from 20–32 px), zoom buttons, the stamp strip (one button), tabs and chips. Bottom-sheet radio rows are 48 px.
- **Text**: reading text ≥14 px (body 15–16); 12 px only for uppercase tracked labels; inputs are 16 px. Computed text contrast is ≥4.5:1 everywhere (0 failures in 30 measured states).
- **Not colour alone**: stance = word + glyph + rule; status = symbol + text; ended = shape + shadow + text; coverage = fill + stroke + legend + list twin; unknown = dashed ring + "?" + words.
- **Map**: the home map is `aria-hidden` inside a labelled button ("Open the full map. 81 countries and territories have a published report in this view."). The Map tab SVG is `role="group"` with titles per path, but **no per-path tab stops**; the list twin and the Countries directory are the keyboard route.
- **Live regions**: the result count is `aria-live="polite"`; toasts are `role="status"`.
- Visually hidden text: "(opens in a new tab)" on every external link; the publisher name on "Read source"; location precision on the place line.
- `forced-colors`: stance rules become CanvasText, and swatches and glyphs keep `forced-color-adjust: none`.
- Reflow: no horizontal overflow at 360 or 390; the chips rows scroll inside their own containers (with an edge fade), never the page.

## 8. Desktop and tablet adaptation (`20-home-768`, `30-home-1440`, `31-detail-1440`, `32-roadmap-1440`)

- **768 (tablet)**: the same single column, max 760. The four stamps run in one row with full labels ("Data integrated, Newest observation, Newest source check, Site built"). Inside cards, State action and Timeframe sit side by side. Sheets become centred modals (560 px). The detail is a 680 px right drawer. The tab bar stays.
- **≥1100 (desktop)**: a three-column desk inside 1440:
  - **Left rail, 300, sticky**: counts, 2×2 stamps, Copy link / CSV, and the full filter form inline.
  - **Centre, fluid (≈616)**: search, quick chips (wrapping), results row, bands and cards. Card facts are single column so the rail never collides.
  - **Right rail, 420, sticky**: the map module, the Ahead teaser and the Coming next teaser.
  - The pilot band becomes a single full-width line under the header.
  - The tab bar is replaced by a top nav (Latest · Map · Ahead · Countries · ○ Coming next · About & data) with the Updated chip and search at the right.
  - The detail stays a drawer, so the feed context remains visible behind a dimmed backdrop.

## 9. Build notes for the tech lead (how this maps onto the code)

- **Keep untouched**: `getDisplayStatus`, `withinWindow`, `readViewState` (9 keys), `encodeViewState`, `csvForEvents`, `countRecordsByCountry`, `matchesHistory`, `completionKind`, `outcomeHTML` strings, the `typeof document` guards, the `?v=` cache-busting discipline.
- **New modules** (for example `desk.js` for stamps, the card, rows, bands and the time rail; `views.js` for routing, Ahead and Coming next; `desk.css`) must be added to `PUBLIC_FILES`, as must the untracked `freshness.js`.
- **Leave `styles.css` base classes** for `review.html` (`.wrap .site-header .brand .brand-mark .edition .eyebrow .skip-link .site-footer .noscript`) or give the review desk its own base sheet.
- **`freshness.js`**: change `BAND_LABELS.week/month` to exclusive wording ("Observed 3 to 7 days ago", "Observed 8 to 30 days ago"). Checked: not pinned by tests.
- **Intensity**: add `isNotEstablished(text)` as an exact-match set (listed in §4.3) with a unit test. Do not add regex heuristics.
- **map.js**: keep the fill = coverage; make selection an outline (`data-selected` stroke via CSS); move COLORS to CSS variables; divide the shadow offset and hatch size by the zoom `k`; `touch-action: pan-y` plus a d3.zoom filter requiring two touches; `focusCountry` uses the largest polygon; greedy label culling; a Map-failure state with Retry.
- The **Roadmap** content lives as static copy in JS or HTML, sourced from `docs/ROADMAP.md`. If it becomes a JSON file, add it to `PUBLIC_FILES`.
- **Data hygiene that would improve this design** (each needs validator/merge/test changes): normalised casing ("Unknown" vs "unknown"); structured `intensity.*.known`; structured `state_response` type/actor/announced flag; an actor-type field (institution vs participants) so the UI could label responses explicitly.

## 10. Honest self-critique

1. **Cards are long.** They are 696–854 px at 390, so one card fills a phone screen. That is acceptable for 5 fresh records but not for 30. The `Cards | List` toggle helps, but the default should switch to List automatically when a band has more than about 10 items. I did not prototype that rule.
2. **360×780 still misses the bar.** The first headline is only partly visible above the tab bar (bottom at 791 px against 716 px visible). The pilot band, desk status and filters take about 600 px before any news, and returning visitors pay that every visit. A collapsed desk strip for repeat visits would help, but it weakens stamp visibility, and I chose visibility.
3. **"Status unknown" is noise.** It appears on 66 of 84 records and still sits in the top-right of every card. It is honest, but its repetition carries almost no information. A "status not established" note at band level, with only exceptions flagged per card, might read better. The panel should decide.
4. **The stance colours carry risk.** Blue and magenta are validated, yet some readers will see political, party or gender connotations. The light magenta is under 3:1 and relies on the ink word. A monochrome-rule-plus-glyph variant should be A/B tested.
5. **Verbatim intensity is honest but uneven.** "No reliable event-wide count established" renders as normal text while "Not established" gets the muted "?" treatment, so unknowns look inconsistent. The real fix is data-level `known` flags, not UI heuristics.
6. **The detail summary has weak spots.** "see text" is weak microcopy, and the 4-cell summary partly duplicates the sections below it. On short records it adds length without adding information.
7. **The black-shadow metaphor weakens in dark mode.** It needs the extra light edge to read at all.
8. **The gap hatch is faint.** At phone size it is close to the ocean plate, so "no report" land and water can blur at a glance. The legend and list twin compensate, but the gap fill could be a step darker.
9. **Coming next is one level deep on phones.** It sits under About, compensated by the feed teaser, the Ahead cross-link and contextual "coming next" rows. If the user's "clear button" requirement is read strictly, a dedicated tab would beat About, at the cost of crowding the bar to six.
10. **The Ahead page is an empty page.** It is honest and well explained, but it is still an empty tab in the primary navigation this round. Some will read that as broken. I removed a hard-coded hint about forward-looking text in two records because it was not data-driven.
11. **The prototype simulates parts of the system.** The clock is frozen; the deploy stamp is simulated only via `?build=`; zoom is viewBox presets rather than real pinch or d3.zoom; CSV and Copy link are toasts. No real-device touch test, screen-reader pass, Android font check (Charter falls back to Noto Serif or Georgia) or 200% zoom check was done.
12. **The inline "How it works" link is under 44 px tall.** It is the one sub-44 target I kept, under the WCAG 2.5.8 inline exception; the About tab provides a full-size route.
13. **The directory renders all 249 rows at once.** That is fine for DOM size (about 3.5 k nodes in total) but long to scroll. Region accordions or an A–Z jump bar would be better.

## 11. Screenshot index (`ux-a/shots/`)

| File | What it shows |
|---|---|
| 01-home-390 | First viewport: header + Updated chip, pilot band, desk status + 4 stamps, filter bar, results row, start of the 72-hour band and first card |
| 02-cards-390 | A full card (India): positions, all-unknown intensity line, state action, time rail, evidence |
| 02b-cards-es-390 | France card: verbatim intensity, tear gas, unknown onset and end |
| 02c-cards-tz-390 | Tanzania: ended episode with black shadow, rail ordered Onset → Ended → Observed |
| 02d-list-390 | List density for the 72-hour band (actor + stance + target per row) |
| 03-map-earlier-390, 03b-earlier-390 | Map module + legend; Ahead/Coming next teasers; archive rows |
| 04-detail-es-390, 04b, 04c | Detail top with the 4-cell summary; intensity and state action; outcome (Explicit vs Assessment / inference, causation not established) |
| 04d-detail-nz-390, 04e | Ended NZ record (ACT Party shown as an institution); state action "Not established in this record"; timeline |
| 05-filters-390, 05b | Filter sheet top and bottom (history, coming-next row, sticky Apply with count) |
| 06-ahead-390, 06b | Ahead empty state; item anatomy and ageing states |
| 07-roadmap-390, 07b, 07c | Coming next: Next items with buttons; Not planned; Shipped |
| 08-map-fr-390, 08b | Map tab focused on mainland France, outline selection, culled labels; country brief ledger |
| 09-countries-390, 10-more-390, 11-stamps-390 | Directory; About & data; Update times sheet |
| 12-stale-390 | Stale state on 6 Oct: warning chip, extra disclosure line, empty 72-hour band |
| 13-dark-home-390, 13b, 13c | Dark theme home, ended card, detail |
| 14-example-390 | Example mode watermark |
| 20-home-768, 30-home-1440, 31-detail-1440, 32-roadmap-1440 | Tablet and desktop adaptation |
