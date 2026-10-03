# Protest Atlas UX specification — release 4.0

Status, 3 Oct 2026: **built and verified locally; not yet deployed.** The live site still runs the release-3 interface until 4.0 is merged to `main` and Pages deploys it. Nothing below has been checked on the deployed site; those checks follow the deploy (SPEC §22.4) and go into RELEASE_EVIDENCE.md.

This document summarises the interface as built. The binding build specification is [design/SPEC.md](design/SPEC.md), with the integration and verification decisions in its §23 and in [design/INTEGRATION_NOTES.md](design/INTEGRATION_NOTES.md). Copy rules and the risk register are in [design/EDITORIAL_GUIDANCE.md](design/EDITORIAL_GUIDANCE.md). The design panel and the verifiers were AI agents; no human designer, engineer, editor or assistive-technology user has reviewed this interface. The release-3 description this file used to hold is in Git history.

## Principles

- The pilot disclosure (H1: "AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.") is above the content of every view and inside the first viewport, in every state. Warnings are added under it, never in its place.
- Freshness comes from evidence dates. A build, deploy, merge or source re-read never makes a record or the snapshot look newer.
- Unknown is never zero. A missing record, an empty list, "not established" and a failed load each say what they are; none reads as "no protests".
- For/against always names its target. There are no stance tallies and no combined intensity score.
- Mobile first: 360 and 390 px wide are the primary layouts; 768 and 1440 are adaptations.

## Information architecture

| View | Route | Job |
|---|---|---|
| **Reports** (default) | `#/latest` | Snapshot facts, search and filters, records grouped by the age of their latest evidence, Ahead teaser |
| **Map** | `#/map` | Coverage map with region chips, zoom and Explore; legend; world overview or country brief |
| **Ahead** | `#/ahead/actions`, `#/ahead/roadmap` | Two separate sections behind a pinned switch: *Announced protest actions* and *Coming next to Protest Atlas* |
| **Countries** | `#/countries` | A–Z directory of all 249 entries by region; each row opens the country brief on Map |
| **About** | `#/about` | Reading key, what the dates mean, research scope and ledger, lead-discovery audit, data and tools, illustrative example |
| Record (overlay) | `#/record/<id>` | Record sheet over the last view |

- **Navigation:** below 900 px a fixed bottom tab bar with the five views (icon and label); from 900 px the same links in the header, plus a sixth "Coming next" link from 1200 px. No tab carries a count badge. In each nav, only the most specific displayed match has `aria-current="page"`.
- **Filters** live in the query string (`q`, `country`, `region`, `issue`, `status`, `year`, `city`, `outcome`, `window`), so Reports, Map, the country brief and the CSV always describe the same records, and a copied link restores them. Unrecognised values are dropped and named once in the notice. The country brief is `?country=FR#/map`.
- **Aliases:** release-3 links (`#atlas`, `#countries`, `#methodology`) and `#/reports`, `#/coming-next` open the matching view.
- **Scroll and focus:** moving to another view scrolls to the top and focuses that view's `h1` title, so the disclosure is in view; Back restores the previous scroll position. Query-only changes move neither.
- **Sheets:** three native `<dialog>` sheets. The record sheet is routed; the filter sheet and the dates sheet are not. Phones get bottom sheets; from 900 px the record opens as a right-hand drawer.

## Global chrome

**Header and snapshot chip.** The chip opens the dates sheet. Its state comes from the age of the newest evidence, counted in whole UTC days:

| State | When | Chip |
|---|---|---|
| current | newest evidence less than 72 hours old | "Snapshot · 2 Oct 2026, 22:45 UTC" (the snapshot's assembly time) |
| aging | 72 hours to 7 days | "Snapshot · newest evidence N days old" |
| stale | 7 to 30 days | "Stale snapshot · newest evidence N days old" (warning tone) |
| archive | 30 days or more | "Stale snapshot · newest evidence N days old" (warning tone) |
| loading / error | records pending / failed | "Snapshot · loading" / "Snapshot · could not load" |

A page left open re-evaluates every 60 seconds and on return to the tab, so the chip, notice and groups change at the boundary without a reload.

**Data notice** (outside `<main>`, on every view): H1, then "What this means" (counts from data; shown only once they are known), then any of these lines, each added or removed on its own:
- records failed: "Published records could not be loaded, so coverage is unknown at the moment, not zero."
- country directory failed: records are listed by country code;
- context file failed: "Outcomes, endings and cities could not load, so they are unknown here, not absent. City and outcome filters are paused."
- aging, stale or archive: **one** warning line (for example "This snapshot has nothing newer than 2 Oct 2026, 7 days ago. Read it as an archive of past reporting, not as a picture of protests today."), with a "Why?" disclosure that holds the empty-band notice and the blocked-search sentence;
- dropped link parameters.

**Example banner:** "Illustrative example • not a real event", with "Back to reported data". It is a named region, stays visible while the example loads or fails, and every example surface (card, record, map) carries a striped watermark.

**Footer:** separate stamps ("Snapshot assembled … (AI-assisted, no human sign-off)" · "Newest evidence dated …" · "Site built … from {commit}" · "All times UTC") and links to the roadmap, data, source and corrections.

**Dates sheet** (opened by the chip, and from 1200 px also by "What the dates on this page mean" in the Reports rail; About shows the same rows inline): one row per stamp, each with its own explanation — Snapshot assembled · AI-assisted review pass · Newest evidence · Latest source re-read · Announced-actions list compiled · Site built · Lead-discovery audit · Human editorial review: "Not completed". The stamps are never merged into a single "updated" time. The body is a focusable, labelled region and the sheet has a bottom "Done" button.

## Views

### Reports (`#/latest`)

Top to bottom on a phone:
1. Snapshot facts: "84 published episodes in 81 of 249 countries and territories · newest evidence dated 2 Oct 2026". The "Snapshot assembled" line shows from 600 px; on phones it would repeat the chip.
2. Search ("Search issues, places, actors"), the Filters button with the active count, and quick chips: Last 7 days, Last 30 days, Ended / suspended, Outcome documented, and "Country or territory", which opens the filter sheet at the country field. On a touch device, Enter closes the keyboard and brings the results up.
3. Active filter chips ("Remove filter: …").
4. Feed head: "Reports" (`h1`), the Cards | List layout switch, the result summary ("Showing 12 of 84 published records"), and "How this list is ordered" (newest latest-evidence date first; never by publication or check time). "Copy link to this view" and "Download CSV" sit in the head from 600 px and under the list on phones. Where the operating-system share sheet is used, the first button reads "Share this view" and the shared title names the filters.
5. Groups, each an `h2` with its count in the filtered result: "Latest evidence within 72 hours" · "3 to 7 days ago" · "7 to 30 days ago" · "Earlier research, 2024–2026" · "Evidence date not established". An empty group is never shown. The fresh group carries the note that recent evidence is not confirmation that an episode is ongoing.
6. The Ahead teaser after the first group: announced actions (counting only upcoming items, never passed or cancelled ones) and Coming next.
7. Twelve records at a time, with "Show 12 more (n remaining)"; focus moves to the first new record.

The filter sheet applies changes live and shows "Show n records" at its foot. Custom date ranges are not offered; the sheet points to Coming next. The CSV holds only reported records, with source URLs, recorded-status caveats and spreadsheet-formula escaping. It is refused in example mode and while records are loading or have failed; if the context file failed, its context columns read "not loaded".

### Record sheet (`#/record/<id>`)

D1 "AI-assisted source check · no human editorial review" · status and latest evidence with its age badge · place (short name, with the ISO name when it differs) · title (`h2`, initial focus) · overview with four "At a glance" cells (timeframe, for/against, intensity, police/state) · a sticky section bar (Overview, For/against, Intensity, Police/state, Outcome, Timeline, Sources) · sections in that order. The Sources section lists every source with publisher, publication date and its latest AI-assisted re-read, and notes that the number of sources is not a confidence score. "Read the source" and previous/next (through the list the record was opened from) are in the sheet foot; "Share this record" is in its head, with feedback inside the sheet. A record opened from outside the current list shows the eyebrow "Record" and no previous/next.

### Map (`#/map`)

Region chips (World and regions), the stage with zoom in, zoom out, World and "Explore map", a selection bar under the stage, the legend ("What the colours mean"), then the world overview or the country brief.
- **Gestures:** by default one finger scrolls the page and two fingers pinch the map; "Explore map" lets one finger and the wheel move the map until "Done exploring" or Escape. After a selection the page scrolls only as far as needed to keep the selection bar above the tab bar.
- **Colour** means published coverage under the current non-country filters: reported, no published record (hatched), selected, and an ended/suspended outline. Never intensity, support or completeness. City dots are coarse public reference points, not protest sites.
- **Brief:** country name (with the ISO name when different), a status line that is announced to screen readers, "Most recent evidence" rows, records, and "Back to world", which also clears the country filter. A country without a published episode reads as a gap in this atlas ("no published episode in this atlas"), with its search-ledger stage.
- Small territories that the 1:110m geometry does not draw stay reachable from Countries and the country filter; the brief says when a place is too small to draw.

### Ahead (`#/ahead/actions`, `#/ahead/roadmap`)

A pinned switch selects one of two sections, which are never mixed:
- **Announced protest actions.** States that an announcement is not evidence that an action will happen. In this snapshot the list is empty and says why: on 2 Oct the search for announced and recent actions could not open news websites, so snippets stayed leads and nothing is listed; an empty list does not mean nothing is planned. When items exist, each shows the announcing organisation, place, planned date and its precision, and the source; times, meeting points and routes are never listed. Items whose date has passed collapse under "Planned dates that have passed · occurrence not established". If items exist but none is upcoming, the section says so. A specimen shows how an item will look.
- **Coming next to Protest Atlas.** The site roadmap from `public/roadmap.json`, grouped In progress, Next, Blocked, Later and Shipped, with no dates. Legend: "Shipped: available on this site now. · In progress: built or being built; not yet confirmed on the deployed site. · Next: planned, and can start without outside help. · Later: only after the listed conditions are met. · Blocked: cannot proceed until the named blocker is resolved." Each item has a summary, "Done when", blockers, dependencies and "Status checked"; only shipped items link their evidence.

### Countries (`#/countries`)

A dek from data ("81 of 249 have a published episode. A first search was logged for all 249; searched is not reviewed, and no published episode does not mean no protests."), a search field with icon, clear button and the hint "Common names work too, such as South Korea, UK or Ivory Coast.", then regions A–Z. Each row shows the short name, the ISO name when it differs, and one of: "n published episodes", "Searched · no published episode", "Search failed · no published episode", "Not yet searched", or a note when the map does not draw the place. No match: "No country or territory name starts with '{q}'. Try another spelling, or browse A–Z." with a "Browse A–Z" button. A row opens the brief on Map; in example mode it returns to reported data first.

### About (`#/about`)

In order: the Coming next row; what the atlas is; how to read a record; how to read the map; what the dates mean (the dates-sheet rows); research scope (first searches logged 249 of 249, countries with a published episode, city references, ended or suspended episodes, positions recorded with their targets) and the "Inspect country-by-country research" table, which renders on first open with the column **"Pages opened in the first search"** (a dash where none was logged) and a caption explaining that each record lists its own, later reads; the lead-discovery audit (a static audit of one artifact, never a live-health signal); data and tools (CSV, JSON, editorial policy, source and corrections, editor desk); "Explore an illustrative example".

### 404

Self-contained, `noindex`, with the disclosure in a labelled region and links back into the atlas.

## Card and record anatomy

**Card (Cards layout), top to bottom:** example watermark (example mode only) · status, which always leads (for example "Ended / suspended 30 Sep 2026") · place: country short name · city or label · serif title, the whole card being its link · "Latest evidence {date} · {age}" with an age badge · issues · facts: Timeframe · For / against (at most two positions in recorded order, each as a For/Against/Mixed/Unclear pill with its target and actor, then "+n more position(s) recorded") · Intensity (three labelled rows for turnout, disruption and violence or harm; a single line when two or more are not established; "Turnout, disruption and violence: not established in this record." when none is) · Police / state ("{action} — {attribution}", or "Not established in this record") · "What changed: …" when an outcome is documented (the only clamped element) · evidence: the first source's publisher as an external link, publication date, verification level, number of links, "AI-assisted check". Ended records carry a heavier border and an offset shadow.

**List layout:** a scan row of status and latest evidence date with the country, the title, a stance line ("For: {target} · Against: {target}", two at most, then "+n more"), and the evidence line. The other facts are in the record. Both layouts keep the status, place, stance targets and evidence.

**Status labels:** "Reported ongoing · evidence dated {day}" only while that evidence is under 72 hours old; then "Needs review · current status unknown". "Planned" only for a sourced future start. "Ended / suspended {day}" needs sourced end evidence. Otherwise "Current status not established".

**Example mode:** one fictional record. Its card's evidence line ends "no source was checked" instead of "AI-assisted check", the record's disclosure reads "Illustrative example · no source was checked" and it shows no source re-read, the record's outcome section says a fictional record has no outcome or end evidence, and the list keeps a hidden `h2` so the heading outline holds.

## States

| State | What the reader sees |
|---|---|
| Loading | Skeleton cards (hidden from assistive technology), "Loading published records…", `aria-busy` on the list; the "What this means" counts wait for data |
| Current | Exact snapshot time in the chip; fresh group first |
| Aging (3–7 days) | Chip shows the evidence age; one warning line under H1 |
| Stale (7–30 days) / archive | "Stale snapshot"; the warning line says to read the atlas as an archive; "Why?" holds the empty-band notice and the blocked-search sentence. The first record still starts inside the first phone viewport (smoke 17) |
| Records failed | Notice error line on every view; chip "could not load"; Retry where the content would be; map neutral, with no reported fill or hatch; every Countries row "Coverage unavailable"; never "Searched · no published episode" or a zero |
| Records reloading after Retry | Countries rows wait ("Checking published records…") and the dek shows "Retrying…"; no row is labelled from the search log alone |
| Directory failed | Records still listed, by country code; notice line; Countries: "The country directory could not load." |
| Context file failed | Notice line; city and outcome filters paused and marked "(paused)"; record Outcome says it could not load, with Retry; CSV context columns "not loaded" |
| Search log failed | Countries rows without an episode read "Search log unavailable", with a Retry explained in the dek |
| Roadmap, ledger or announcements failed | Each section says it could not load (not that it is empty) and offers Retry; focus stays in the section |
| Announcements file absent | "The list is not published in this snapshot." |
| Map unavailable | Plain-language message with Retry; Reports, Countries and the country filter keep working |
| Example loading or failed | Banner stays; "The illustrative example could not load. Nothing here is reported data."; Retry example and Back to reported data; the map shows "Illustrative example unavailable" |
| No match (E1) | "No published episode matches these filters. That describes this atlas, not the world…" with Clear filters and Browse countries |
| Search only, no match (E8) | "No published episode mentions '{q}'. Try another word, or browse by country." |
| Status filter, no match (E7) | Per-status rule, for example "That label needs evidence dated within 72 hours." |
| True empty | "No episodes are published in this snapshot." with Browse countries and the example |

## Accessibility

- Landmarks: header, `main`, footer and the named example region; the notice is a live status region between the header and `main`. Sheet heads and foots are plain containers, not extra banners. One `h1` per view; groups are `h2`, cards `h3`.
- Focus: visible 3 px ring with a 2 px offset in both themes, with room left in the scrollers that clipped it in round 1 (map region chips, country panel); view titles take focus on navigation; when a control hides itself (mode switch, Retry, Back to reported data), focus goes to the section or view title, never to the page body. Sheets set initial focus to their title and return it to the trigger.
- Live regions: the result summary, the notice, the record announcer when stepping, the brief's status line on map selection, and feedback toasts.
- Targets at least 44 × 44 px in the first two screens of every view and inside the sheets; no visible text under 12 px.
- Map: countries with records and the selected country are in a roving tab order (Enter/Space selects); keyboard focus is drawn differently from the selection, including in forced colours; Escape dismisses the hover tooltip wherever focus is. Countries is the full keyboard and small-territory alternative.
- Short viewports (`max-height: 500px`, standing in for 200 % and 400 % zoom): the header scrolls away, the tab bar shrinks to 48 px and sheets fill the viewport. Reduced motion, dark mode and forced colours are handled.
- The search field's accessible name contains its visible words. Status is shown as text, never colour alone.

## Visual system

Warm paper and deep ink tokens on `:root` with a dark theme; ochre for published coverage; a striped violet watermark only for the illustrative example; serif titles, sans-serif evidence labels. Input and control borders use a dedicated token with at least 3.42:1 against every surface. Contrast pairs were measured with the palette validator (SPEC §17.2). No web fonts, no runtime CDN.

## Verification evidence (local only)

Run on 3 Oct 2026 against commit `b260087`. **None of it is deployed-site evidence.**

| Check | Result |
|---|---|
| `python3 -m unittest discover -s tests` | 87 tests, OK |
| `node --test tests/*.mjs` (Node 22.22.0) | 227 / 227 pass: test_core 53, test_shell 74, test_record 31, test_map 29, test_pages 26, test_explorer 8, test_freshness 6 |
| `python3 scripts/build.py` | every validator passes; allowlisted site written |
| Browser smoke, Pages layout (`--root _site --prefix /protest-atlas/`, Chromium; the clock is derived from the data, 2 Oct 23:00 UTC for this snapshot, unless a check sets another) | 24 / 24 checks pass. Check 10 needs the baseline from Git history and was rerun with `--baseline-css` because the run used an exported copy |
| First viewport (smoke 17) | The first record starts inside the visible area above the tab bar at 360 × 780 and 390 × 844 on the 2 Oct, 9 Oct (stale) and 5 Nov (archive) clocks. On 9 Oct: first card top 603 px; title bottom 722 px at 390 (limit 780) and 720 px at 360, 4 px past the 716 px target, which is reported rather than enforced |
| Data refresh simulation | A scratch copy with one valid synthetic record added (85 episodes, newest evidence 3 Oct) builds, and the Python and Node suites still pass (87 and 227). The UI tests read `tests/fixtures/snapshot-20261002/` |
| axe-core 4.13.0 (default rule set, including colour contrast) | 0 violations in 80 page states: the six routes, the open record sheet, the dates and filter sheets and example mode, at 390 × 844 and 1440 × 900, light and dark, on the 2 Oct and 9 Oct clocks |
| Payload (gzip -9, as CI measures) | critical code 125,845 B (budget 128,000), critical JS 92,483 B (budget 93,184), CSS 27,243 B (budget 28,672), map add-on 159,803 B, critical data 61,471 B. All are over the original tech §6.2 targets; the budgets are measured ceilings (SPEC §23) |

**Not verified:** anything on the deployed site (the `verify` job, smoke against the live URL and the roadmap flips come after the deploy); screen readers; physical phones, real touch and pinch; Safari/WebKit and Firefox (smoke and axe ran in Chromium only); browser zoom itself (short viewports stand in for it); actual file saving for CSV downloads. axe-core finds only part of WCAG failures; a clean run is not an accessibility certification.
