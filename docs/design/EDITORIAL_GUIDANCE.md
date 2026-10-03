# Protest Atlas redesign: editorial standards and skeptic guidance

Author role: editorial skeptic and advisor (standards editor; conflict-data and verification background). AI agent, not a human journalist. Written 2 Oct 2026, about 22:40 UTC, against committed HEAD 7ff6dca plus the lead's groundwork (freshness.js, validate_upcoming.py, build-info stamp).
Applies to both directions under test: **"Live desk"** (feed first, bottom tab bar) and **"Atlas sheet"** (map first, bottom sheet). Wherever the two differ, section 13 covers it.
Nothing here weakens docs/EDITORIAL_POLICY.md (v1.2) or .design/brief.md. Where this document is stricter, this document wins for the redesign.

---

## 0. Verdict in one paragraph

The user asked for "live tracking across all countries". The honest product this release can ship is **a dated, source-checked snapshot of reported protests, newest first, with searches logged for all 249 countries and territories and published episodes in 81**. Nothing in it is live. Five of 84 episodes have evidence dated 1–2 Oct 2026, one of which (Tanzania drivers) has already ended. The recent-activity refresh on 2 Oct logged 381 searches across five regions but could not open a single news article, so no record was added, and the announced-actions list is empty. Every requested dimension can still be shown truthfully: for/against, issues, timeframe, intensity, police and state response, what is coming next, and when the data was updated. That only works if the interface describes **what this dataset holds and how old it is**, not what is happening in the world. The design that wins is the one that stays correct on **9 Oct**, when nothing in the snapshot is recent, as well as on 2 Oct.

---

## 1. Facts that constrain every label (verified in the repo, 2 Oct 2026)

| Fact | Value | Consequence for copy |
|---|---|---|
| Published episodes / countries | 84 / 81 of 249 directory entries; 168 have no published episode | Always write "in 81 of 249 countries and territories". Never write "all countries". |
| Status | 66 unknown, 18 ended, 0 ongoing, 0 planned | "Reported ongoing" never appears this release. Never show "Ongoing: 0". |
| Recent evidence | `last_observed_at` = 2 Oct for in-electoral, fr-schools and es-housing; 1 Oct for tz-drivers (**ended**) and au-victorian | "Recent" ≠ "active". An ended episode sits in the 72-hour group. |
| Snapshot clocks | generated_at = last_editorial_review = 2026-10-02T21:31:50Z (AI-assisted integration); last_verified 21:09–21:25Z | These are two different stamps. Neither one is a protest observation. |
| Round-4 refresh | 381 search rows logged at about 22:06 UTC on 2 Oct; `reviewed_urls` is empty in all 381; notes record that the egress proxy blocked news hosts | Refresh is **blocked**. The leads in those notes (Nigeria JNPSNC warning strike, Chile CONFECH march, France CGT-RATP and others) are **unread** and must never appear in the UI. |
| upcoming.json | Will exist with 0 items. Schema and validator are ready. | "Ahead" ships as an empty state that explains itself. |
| Positions | 92 in total (56 support, 36 oppose, 0 mixed, 0 unclear). 8 events have 2 positions; 6 have both stances, and in all 6 the second actor is an institution. kr-yoon has both positions coded "oppose" with opposite targets. ng-pengassan has two "support" positions in conflict. | Showing the target is what makes a stance true. Any tally is false. |
| Turnout | min/max null 84/84. 82 qualifiers are "not established" variants. Two give numbers only in prose ("Hundreds, as reported"; "RNZ reported more than 42,000") | No numbers, charts or size scales. Show the text exactly as recorded. |
| Disruption / violence | About half have no description of disruption. 63 of 84 have no description of violence. The `violence` field mixes participant conduct with **state force** ("Police gunfire and deaths reported"; "HRW documented excessive force"; "soldiers used tear gas") | The label must not say "protester violence". |
| State response | 37 free-text entries (at most 1 per event); 47 events have none | Show it as written, with attribution. No keyword chips (section 7). |
| Verification | 62 single-source (13 of these have 2–4 links), 20 corroborated, 2 contested | Source count is not a confidence score. |
| Language | 123 of 128 sources are in English | Every claim about coverage needs a language caveat. |
| Pipeline text | merge_history.py would write a coverage_note saying "with a selective recent-activity sweep for 18 Sep–2 Oct 2026". | **False implication** (the sweep produced no records). Must be reworded before any rerun (section 16). |

---

## 2. Vocabulary

**Banned anywhere in the UI, page titles, meta and OG text, alt text, tab labels, button labels and toasts:**
"Live", "LIVE", "Live now", "Happening now", "Right now", "Breaking", "Real-time", "Active protests", "Current protests", "Ongoing now", "Tracking N protests", "N protests worldwide", "Hotspots", "Trending", "Most active", "Escalating", "Unrest index", "Severity", "Danger", "Risk level", "Top countries", "Top issues", "Sides", "vs", "Updated" or "Last updated" used on its own, "As of" (it implies a state of the world), "Verified" used on its own, "Reviewed" used on its own, "Synced", "New" badges (no `added_at` field exists yet), "Join", "Attend", "RSVP", "Remind me", "Add to calendar".

The designer's working name "Live desk" must never reach the interface.

**Preferred terms:**

| Concept | Use | Why |
|---|---|---|
| The dataset | "snapshot" | It is frozen between builds. |
| `last_observed_at` | "latest evidence" (dated …) | Covers both activity and later developments. NZ's value is a parliamentary vote, not a march. Cannot be confused with a publication or check time. |
| `last_verified` | "source re-read" | It is an AI-assisted re-read of an article. It is not an observation. |
| `generated_at` | "snapshot assembled" | A rerun restamps this even when nothing changed, so "updated" would overclaim. |
| Records | "episode(s)" or "record(s)" | "Protest(s)" implies a count of world events. |
| Coverage | "published", "searched", "no published episode" | "Searched" ≠ "reviewed" ≠ "no protests". |
| Stance | "For" / "Against" / "Mixed" / "Unclear" + target | — |

---

## 3. "Live" and freshness rules

### 3.1 What can honestly be called live
Nothing in this release can be called live. The only time-sensitive claim the data supports is **"latest evidence dated within the last 72 hours"**: a sourced activity or development was reported for that day. It does not mean the protest is happening now. Of the 5 episodes in that band on 2 Oct, 4 have status "not established" and 1 has ended. The 72-hour band is a sorting aid. It is not a status, and it must never look like a live indicator: no pulsing dot, no red, no motion, no "now".

"Reported ongoing" is the only status that asserts continuing activity. It appears only when `status === 'ongoing'` and the evidence is less than 72 hours old (getDisplayStatus). It always carries its date: "Reported ongoing as of 2 Oct 2026". No record qualifies this release.

### 3.2 Bands (per record, from `last_observed_at` only; date-only values count from 00:00 UTC; strict edges as freshness.js)

| Band key | Badge (short, visible) | Accessible / long label (replaces BAND_LABELS) | Feed group heading |
|---|---|---|---|
| fresh (<72 h) | Within 72 h | Latest evidence dated within the last 72 hours | Latest evidence within 72 hours |
| week (72 h–7 d) | 3–7 days ago | Latest evidence dated 3 to 7 days ago | 3 to 7 days ago |
| month (7–30 d) | 7–30 days ago | Latest evidence dated 7 to 30 days ago | 7 to 30 days ago |
| older | Over 30 days ago | Latest evidence dated more than 30 days ago | Earlier research, 2024–2026 |
| unknown | Date not established | Latest evidence date not established | Evidence date not established |

Rules:
- The badge is always next to the absolute day plus a relative day: "Latest evidence 2 Oct 2026 · today". Day-only values never show a time of day.
- **Status leads and the band follows.** "Ended / suspended 30 Sep 2026" sits above "Within 72 h" on tz-drivers.
- The band never changes map fill. Only an explicit filter the user chooses (7 or 30 days) changes the map, and the legend then says so.
- Badges are neutral ink on neutral fill in every band. Hue never encodes recency.

### 3.3 Dataset staleness (one rule for the whole site)
Measure staleness from the **newest evidence date in the snapshot** (`updateStamps().latestObservation`). Do not measure it from `generated_at`. Generated time is always later than or equal to the newest evidence, so newest evidence is the worse clock. A merge rerun with no new data restamps `generated_at` and would otherwise hide staleness. The reasoning: protests happen somewhere every day, so a worldwide dataset whose newest evidence is more than 72 hours old is not keeping up, whatever its build or assembly time says.

| State | Condition (newest evidence age, day precision from 00:00 UTC) | With today's data |
|---|---|---|
| current | < 72 h | 2 Oct → until **5 Oct 00:00 UTC** |
| aging | ≥ 72 h and < 7 days | 5 Oct 00:00 → 9 Oct 00:00 UTC |
| stale | ≥ 7 days and < 30 days | from **9 Oct 00:00 UTC** |
| archive | ≥ 30 days | from 1 Nov 2026 |

Recompute every 60 s and on `visibilitychange`, **whether or not any record's status changed**. Today refreshAges re-renders only when a status changes, so the notice never updates on a long-open page. The disclosure line is **never replaced** by the staleness line. Both show.

### 3.4 Home view on 9 Oct 2026 (nothing fresh), for both directions
- Header chip reads "Stale snapshot · newest evidence 7 days old" in the warning style. Tapping it opens "What the dates on this page mean".
- The disclosure (policy text) stays in full. The stale banner appears under it: "This snapshot has nothing newer than 2 Oct 2026, 7 days ago. Read it as an archive of past reporting, not as a picture of current protests."
- **Feed / Reports**: the default view is unchanged: all records, newest evidence first, grouped by band. Empty groups collapse into one sentence at the top: "No episode in this snapshot has evidence dated in the last 7 days. That is a gap in this dataset, not a sign that no protests happened." The first visible group is "7 to 30 days ago (5)", and its cards show "7 days ago".
- **Map**: fill is unchanged (binary coverage). The stale banner sits on the map view itself, in the sheet peek or above the map. A map that looks identical on 2 Oct and 9 Oct with no warning fails this rule.
- **Never** silently widen a 7-day window to fill the screen. **Never** relabel older records as "latest". **Never** show "0 in the last 7 days" as a stat tile.
- **Default filter**: there is no default time window, in either direction. A 7-day default would make the home view empty from 9 Oct onwards. A silent fallback would mislead.
- Ahead: unchanged (empty state).

### 3.5 Status labels (display status from getDisplayStatus)
| Key | Label |
|---|---|
| ongoing | Reported ongoing as of {last_observed day} |
| needs-review | Needs review · current status unknown |
| unknown | Current status not established |
| ended | Ended / suspended {end_date} |
| planned (examples only) | Planned |

Status filter: hide options that match no record in the current snapshot ("Reported ongoing", "Planned", "Needs review" today). A permalink that requests one of them gets the empty state in §12 (E7). It must not show a zero.

---

## 4. "Updated" stamps

No stamp may be read as "protests checked at …". Each stamp names its own subject, in the label itself, not only in a tooltip.

| Stamp (freshness.js key) | Visible label | Value format | Explainer (in the "dates" sheet) | Where |
|---|---|---|---|---|
| dataUpdated (`events.generated_at`) | **Snapshot assembled** | 2 Oct 2026, 21:31 UTC · 1 hour ago | When the published records were last compiled and validated by the AI-assisted pipeline. Not a time when protests were checked, and not proof that anything new was added. | Header chip (current state), status strip, footer, dates sheet |
| editorialReview (`last_editorial_review`) | Show only when it differs from generated_at: **AI-assisted review pass** | 2 Oct 2026, 21:31 UTC | An AI-assisted integration review. No human editorial sign-off. | Dates sheet only |
| latestObservation | **Newest evidence** | dated 2 Oct 2026 · today (day only) | The most recent date on which a cited source reports protest activity or a development in an episode. Day precision. | Status strip, header chip (aging/stale), dates sheet, footer |
| latestSourceCheck | **Latest source re-read** | 2 Oct 2026, 21:25 UTC | When an AI-assisted check last opened an article already cited by a record. Re-reading old reporting never makes a protest current. | Dates sheet only |
| announcementsUpdated | **Announced-actions list compiled** | 2 Oct 2026, hh:mm UTC · 0 items | Compilation time of the list only. The note under the list says when announcements were last searched and what that search could read. | Ahead page, dates sheet |
| siteBuilt + commit | **Site built** | 2 Oct 2026, hh:mm UTC · commit 1a2b3c4 (links to the commit) | When this website's code was deployed. A new build never adds or re-checks reports. | Footer, dates sheet. **Never in the header.** |
| (absent build-info) | Site build stamp not available in this preview | — | — | Footer when it returns 404 locally |
| discovery-status | **Lead-discovery audit** | GDELT artifact created 2 Oct 2026, 19:27 UTC · 97 unverified leads | A one-time audit of one automated lead list. Leads are never published automatically. This is not a live service check. | Dates sheet, About |
| per record `last_observed_at` | Latest evidence | 2 Oct 2026 · today | — | Card, detail |
| per record `last_verified` | Source re-read (AI-assisted) | 2 Oct 2026, 21:09 UTC | — | Detail evidence section |
| per source `published_at` | Published | 2 Oct 2026 | — | Card evidence row, sources |
| per source `accessed_at` | Opened | 2 Oct 2026, 21:13 UTC | — | Sources list |
| coverage `last_checked` | Last article check for this country | 2 Oct 2026, 21:13 UTC | — | Country sheet / panel |
| research-ledger attempt | First search logged | 2 Oct 2026, 21:07 UTC · n results (not reviewed) | — | Country sheet / panel |

Every stamp is a `<time datetime>` element. Show the absolute time in UTC first, then the relative time. Stamps are never merged, for example as "Updated 1 h ago" built from whichever clock is newest.

---

## 5. Support vs against

### 5.1 Rendering rule (every position, card and detail)
Each position renders as: **actor + stance + target + attributed claim + source reference**. The pattern is:
- Card (one line per position, up to 2 lines each when clamped): `[For] Improved school conditions and education funding — Student demonstrators`
- Detail:
  ```
  Student demonstrators
  For · Improved school conditions and education funding
  As reported: Demands described by Reuters.  [Source 1 · Reuters]
  ```
- The stance pill text is exactly **For**, **Against**, **Mixed position on**, or **Position unclear on**. On a card the pill reads "For", "Against", "Mixed" or "Unclear".
- **All four stances share one visual style.** Use the same neutral outline and ink. Use no hue, no red/green, no up/down arrows, no +/− signs, no thumbs. A difference in hue would read as good/bad or as team colours. The dataviz anti-pattern list also bars status colour on a non-status series.
- **Single column, in the order recorded. Never use two columns, left and right, "versus", or mirrored layouts.** Columns would put kr-yoon's rival rallies (both "Against") in the same column as if they were allies. They would also give one ministry and one union equal visual weight, as if the public were split 50/50.
- **Do not put claims in quotation marks.** They are editorial paraphrases, not quotes. Label them "As reported:".
- **Do not label actor roles in the client** ("Protesters", "Government", "Counter-protest"). There is no role field. Positions[0] happens to be the demonstrators in all 8 two-position records, but nothing validates that. Print the actor name exactly as stored. Role labels are roadmap item NEXT-4.
- Fixed explainer under the detail heading (copy deck D4-sub), which covers institution counterparts in words rather than by classification.

### 5.2 Worked cases (the design passes only if these read correctly)
| Record | Renders as | Why it is right |
|---|---|---|
| kr-yoon-removal (rival rallies) | Against · Yoon's presidency — Anti-Yoon demonstrators / Against · Yoon's removal — Pro-Yoon demonstrators | Both are "Against", but the targets are opposite. The title says "Rival rallies". A tally would report "2 against, 0 for", which is false. |
| ng-pengassan | For · Union rights and reinstatement — PENGASSAN / For · Company reorganisation — Dangote management | Two "For" positions, in conflict, and the different targets make that visible. Management is a company response, not a crowd. |
| nz Treaty Principles Bill | Against · Treaty Principles Bill — Hīkoi mō te Tiriti supporters / For · Treaty Principles Bill — ACT Party | Same target, opposite stances. ACT is a party position. The explainer says a party position is a response, not a counter-protest. No symmetric layout. |
| es-housing | For · Tenant protection — Housing demonstrators / Against · Proposed housing decrees — Junts lawmakers | "For" and "Against" here point in the same broad direction (both reject the decrees). This shows why stance totals are meaningless. |
| as-noaa | Against · Research potentially facilitating commercial seabed mining — Finafinau and Greenpeace USA activists / For · Ocean-science research mission — NOAA research ship representatives | Different targets. A ship's crew is not a counter-demonstration. |
| mixed / unclear (schema allows both; 0 today) | Mixed position on {target} — {actor} / Position unclear on {target} — {actor} | First-class values. Never drop them, and never coerce them to For or Against. |
| no position (none today) | "No position is recorded in this record." | Never infer one from the title. |

### 5.3 Aggregates: what is acceptable
- **Acceptable:** a per-record count of recorded positions, worded neutrally: "2 positions recorded" (for example in a card's "+1 more position recorded"). The label always says "recorded".
- **Acceptable, in the About/method section only:** a description of data completeness: "92 positions recorded across 84 episodes; each is tied to its own target." No breakdown by stance.
- **Not acceptable anywhere:** stance totals (56 / 36), for/against bars, meters, percentages, donuts, "balance" scales, per-country or per-issue stance summaries, a stance filter, sorting by stance, or "most supported/opposed". Stance is relative to a target, so it cannot be summed.
- If a cited opinion poll ever appears, it gets its own card with pollster, fieldwork dates, sample size and question wording. That is out of scope for this release.

---

## 6. Intensity

### 6.1 Rules
- There are three fixed rows in fixed order: **Turnout**, **Disruption**, **Violence or harm**. Never reorder them by which is described, never hide a row, and never combine them.
- There is no severity score, index, level, colour ramp, icon count (flames, stars), "high/medium/low", intensity sort or intensity filter.
- Text is shown exactly as recorded, with the shared `intensity.source_ids` reference shown once for the block ("Source: RNZ [1]"). When `source_ids` is empty, the block reads: "No source is attached because none of these was established in this record."
- **The 'violence' row label is "Violence or harm".** Do not call it "Protester violence" or "Clashes". The data includes force used by states. Fixed sub-copy: "Can include force used by police or security services, as the source reports it. Arrests or police force are not evidence that participants were violent."
- **Never parse numbers out of prose.** "RNZ reported more than 42,000 participants" stays as text. It does not become a "42,000" tile, a circle size or a sort key.
- Never turn "Described as peaceful" or "RNZ described peaceful protest" into a "Peaceful" badge or chip.

### 6.2 Detecting "not established" (fail safe: show the text as recorded)
Match **exactly** against this allowlist, after trimming, lower-casing and dropping a trailing period. Anything else counts as described and is shown verbatim:
- disruption / violence: `unknown`, `not established`, `not established by this record`, `disruption not established by this record`, `violence not established by this record`
- turnout (only when min and max are both null): `not established`, `no reliable event-wide count established`, `no single verified numerical estimate adopted`, `no verified numerical estimate retained`, `reliable comparable count not established`

Partial descriptions such as "Disruption beyond the reported march not established." and "Peaceful confrontation and radio exchange; operational disruption not established." are **described**. Show them verbatim. A new placeholder variant that is not on the list therefore appears as its own (honest) text. It is never silently turned into a zero.

### 6.3 How an undescribed dimension looks
- Same row, same type size, normal ink. Muted text must still reach 4.5:1 contrast. Value: **"Not established in this record"**, followed by a small "What this means" link to the fixed explainer.
- Do not use "—", "0", "None", "N/A", empty bars, zero-length meters, strike-through, greyed-out labels or a hidden row. A dash reads as zero, and "N/A" reads as "does not apply".
- Card summary: if all three are undescribed (34 records), show one line: "Turnout, disruption and violence: not established in this record." Otherwise: "Turnout: not established · Disruption: School disruption reported · Violence or harm: Clashes and property fires reported; attribution varies by incident." Clamp the line, never the attribution.

---

## 7. Police and state response

### 7.1 Rendering
- Heading: "Police and state response". The data covers police, military, ministers, legislatures, courts and commissions.
- Each entry shows **action exactly as stored** + "Reported by: {attribution}" + source reference. Text is at most 113 and 88 characters, so on cards show the action in full. Never truncate the attribution.
- No entry (47 records): **"No police or state response is recorded in this record. That is not evidence that none occurred."** Card: "Police / state: not established in this record".
- Keep the qualifiers already in the text: "alleged", "announced", "authorized", "reported by Amnesty", "OHCHR found". These are the evidence.

### 7.2 Decision: client-side keyword chips are **rejected** for this release
Justification from the 37 actual entries:
1. **Wrong actor or wrong kind.** "Research ship replied to protest message" (a ship's crew, not a police or state action on the protest). "OHCHR found reasonable grounds for systematic serious violations by the former government…" (a UN finding made later about a former government, not an action on the day). "Parliament rejected the decrees" (a legislative vote whose own attribution says "no police action established").
2. **Announced or authorised, not observed.** "Police announced monitoring of a protected strike" would become a "police" chip. "Defence personnel authorized to assist police" would become "military deployed". The policy requires announced and observed deployment to be kept separate.
3. **Qualifiers lost.** "Deadly force, arrests and internet restrictions alleged" would become a "Deadly force" chip with "alleged" removed. "Met union and workers while calling sit-in illegal" would carry a premier's legal characterisation as if it were a finding.
4. **Mixed entries.** "Tear gas and cabinet dismissal" and "Police made arrests; prime minister offered dialogue" are both coercive and accommodating. A single chip misstates them.
5. **Absence implies none.** On 47 records with no entry, a missing chip reads as "no police action".

Allowed instead, this release:
- Add `state_response[].action`, `state_response[].attribution` and the three intensity texts to `searchableText`. Searching "tear gas" then finds the cases through the user's own words, with no classification implied. Today search does not cover these fields.
- **No state-response filter** this release. A "has a recorded state response" toggle invites the reading "show protests without police action".
- Chips come only from **coded data** (roadmap NEXT-1). That means a controlled vocabulary in the Mass Mobilization style, with acting body, announced vs observed, alleged vs officially stated, and a date. It is coded from a re-read source and checked by the validator.

---

## 8. Timeframe

Card "Timeframe" row templates (all dates are UTC days, as reported):
| Data | Text |
|---|---|
| start and end, same day | 19 Nov 2024 (one day) · ended |
| start and end | 29 Sep – 30 Sep 2026 (2 days) · ended / suspended |
| start, no end | From 1 Oct 2026 · end not established |
| no start, end | Onset not established · ended 30 Sep 2026 |
| no start, no end, ≥2 timeline dates | Dated evidence 21 Dec 2024 – 4 Apr 2025 · onset and end not established |
| no start, no end, 1 date | Dated evidence 2 Oct 2026 only · onset and end not established |

- Show a duration ("(2 days)") only when both start and end are sourced. Never compute a duration from the first and last timeline entries.
- Use "From …", never "Since …". "Since" implies the activity continues.
- Timeline strips: one mark per dated entry. **No filled bar between entries.** Policy: "do not turn a months-long movement into months of assumed daily activity." Unknown onset is drawn as an open bracket, never as a guessed date.

---

## 9. Evidence row and verification (required on every card by policy)

Card: `Reuters ↗ · published 2 Oct 2026 · Single source · 2 links · AI-assisted check`
- The publisher name links to `sources[0].url`, using safeURL, opening in a new tab with the visually hidden text "opens in a new tab". Add "+n more" when there are more sources.
- Verification labels: "Single source", "Corroborated", "Contested". Never "Verified".
- Single-source explainer: "One newsroom or reporting chain, however many links. Two copies of one wire story count as one source."
- Corroborated explainer: "The AI-assisted check found more than one independent source for key claims. This is not independent human verification."
- "Contested" stays visible on the card (2 records: sg-workers-placard-action-2024, mx-judges-strike-2024).
- Every record detail repeats: "AI-assisted source check · no human editorial review."

---

## 10. Ahead: announced protest actions

### 10.1 This release (0 items): empty state (copy deck A3–A6)
Show this content in full. Do not reduce it to an "Empty" illustration. It must say three things:
1. **What qualifies:** a protest action publicly announced by a named organisation or institution for a future date, listed only after the announcing article has been opened and read.
2. **Why it is empty:** the 2 Oct 2026 search could not open news websites from the research environment. Search snippets were logged as leads, but a snippet is not a source, so none are listed.
3. **That empty ≠ nothing planned**, and what a filled item will show.

It links to roadmap items BLK-1 and BLK-2. It does **not** link to the round-4 screening files or name any lead. Publishing leads such as "Nigeria warning strike 2–4 Oct", even with caveats, would bypass the evidence gate.

The fact that the sweep was blocked should come from data, not hard-coded copy (§16.2). If it is hard-coded for this release, it must carry its date ("On 2 Oct 2026 …") and be deleted when the next sweep runs.

### 10.2 Filled item: required content and order
```
[Announced] in 5 days                       ← state label + countdown (day/range precision only)
Tue 7 Oct 2026                              ← planned date in the stated precision
Nationwide teachers' strike                 ← action
France · Paris                              ← country · cities (city level only)
Announced by: {announced_by}                ← organisation or institution, never a private person
What was announced: {announcement}          ← attributed paraphrase, no quotation marks
Source: {publisher}, published {date} ↗ · opened {accessed_at} (AI-assisted)
Related episode: {title} →                  ← only if event_id
An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful.
```
Date display by precision:
- day: "7 Oct 2026"
- range: "7–9 Oct 2026"
- week: "Week of 5 Oct 2026 · exact day not announced"
- month: "October 2026 · exact day not announced"

**No countdown for week or month precision.** "In 5 days (month precision)" is false precision. countdownLabel's month case is pinned by a test, so either the UI does not call it for week and month, or the test is updated deliberately.

### 10.3 States (replace ANNOUNCEMENT_LABELS)
| State | Label |
|---|---|
| upcoming | Announced |
| scheduled-now | Planned for today · occurrence not established (for a range: "Planned period includes today · occurrence not established") |
| date-passed | Planned date passed · occurrence not established (not recorded here). This contains "not recorded", which the test needs. |
| postponed | Reported postponed · new date not established (or "Reported postponed to {date}" when sourced) |
| cancelled | Reported cancelled |
| unknown | Planned date not established |

### 10.4 Behaviour
- Order: today first, then upcoming by planned start. Postponed and cancelled items stay in place with their label.
- **When the date passes:** the day after `planned_end` (or `planned_start`), the item moves to a collapsed group, "Planned dates that have passed (n) · occurrence not established". Items there are never counted as upcoming and never styled as having happened (no check mark, no "took place"). If `event_id` links an episode, show "See related episode". Do **not** infer that the announced action occurred.
- **Bug to fix before any week or month item ships:** announcementState treats `planned_start` as the end when `planned_end` is null. A month-precision item dated 2026-10-01 would read "date passed" on 2 Oct while October continues. Either require `planned_end` for week and month in validate_upcoming.py, or compute the end of the week or month.
- No map pins for announcements. A city dot next to a future date reads like an assembly point.
- No "Join", "Attend", "RSVP", "Remind me", "Add to calendar", ICS export, push alerts or share text that invites attendance. Policy: "not a live coordination service".
- No count badge on the Ahead tab. A badge like "3" reads as notifications.
- Gates before an item is published (editorial, not only the validator): the source article is opened and read; the announcer is an organisation or institution; city and day level only; no times, routes or meeting points; in high-repression contexts, withhold unless the announcement is already widely reported; the `note` states the limits.

### 10.5 Separation from the product roadmap
The Ahead page has two sections with distinct headings and visual treatment. **"Announced protest actions"** holds third-party claims, with sources. **"Coming next to Protest Atlas"** holds our product plans. Never mix them in one list, and never style a product plan like an event card.

---

## 11. "Coming next" product roadmap page

Intro, legend and the not-planned list are in the copy deck (R1–R4). Item rule: **"Shipped" means live on the deployed site and checked after deployment.** Items built in this release stay "In progress" on the published page until the deployed build passes their acceptance check. Only then does the lead flip them, in the same commit that records RELEASE_EVIDENCE. There are no dates. The page is a static allowlisted file and carries a "Roadmap revised {date}" stamp.

The full items (id, status, why, acceptance, dependency) are in the structured summary and repeated here:

| ID | Title | Status | Why | Acceptance | Dependency / blocker |
|---|---|---|---|---|---|
| SHIP-1 | Source-linked episode index | shipped | Every claim must trace to a source | 84 episodes in 81 countries/territories; every position, intensity, state response, city, ending and outcome cites an event-local source; validators pass; verified live 2 Oct 2026 (Pages run 37067775278) | — |
| SHIP-2 | World map with a complete 249-entry directory | shipped | Small territories and keyboard users need a route that does not depend on the map | Equal Earth map colours published coverage only; every directory entry is selectable; map failure leaves the list usable | — |
| SHIP-3 | Filters, shareable links and CSV export | shipped | Readers and researchers need to reproduce a view | Permalinks restore 9 filters; CSV keeps source URLs, the recorded-status note and formula escaping | — |
| SHIP-4 | 72-hour status ageing | shipped | Old reports must not stay "ongoing" | "Reported ongoing" becomes "Needs review" at exactly 72 h from the latest evidence; re-reading a source never extends it (tested boundary) | — |
| SHIP-5 | Sourced endings and outcomes | shipped | "What changed, for whom" without claiming causation | 18 sourced ended/suspended episodes; 57 documented outcomes with "Assessment / inference" labels and causation caveats | — |
| SHIP-6 | Country search ledger | shipped | Show where we looked, not only what we found | 249 initial searches logged; "searched" is never shown as "reviewed" or "no protests" | — |
| WIP-1 | Mobile-first redesign | in-progress | The current phone page is 35,000 px tall with the first record 7 screens down | At 390×844: disclosure and first record (or map plus first sheet row) in the first viewport; targets ≥44 px; no map scroll trap; record sheet closes reliably (dialog bug fixed); no horizontal scroll at 320 px; automated a11y check passes | Flip to shipped only after the deployed build passes the checks |
| WIP-2 | Clear dates and stale warnings | in-progress | One "updated" time would mix deploy, assembly and evidence times | Separate labelled stamps (§4); no bare "Updated"; stale banner at 72 h and 7 days from newest evidence; recomputed every minute; build stamp absent locally without error | build-info.json generated in CI |
| WIP-3 | Cards show for/against, intensity, police/state response, timeframe and source | in-progress | The user's key questions are buried at 1,900 px into a dialog | All 84 cards render these rows; positions show their targets; "not established" never shown as zero or blank; each card shows publisher, publication date, link and "AI-assisted check" | — |
| WIP-4 | Ahead page: announced actions and this roadmap | in-progress | Readers asked what comes next | Empty state explains why; upcoming.json validated in the build; fixture tests cover date-passed, postponed and cancelled; no times, routes or meeting points | Content blocked (BLK-2) |
| BLK-1 | Add reports after 2 Oct 2026 | blocked | Without fresh reporting nothing here can be current | Each new record cites an article actually opened and read, with an access time; research window end advanced in validators only for days actually searched; newest evidence < 72 h at publication | The research environment cannot open news websites: on 2 Oct, 381 searches were logged and 0 articles could be read. Needs a fetch-capable connector or a network allowlist for news domains |
| BLK-2 | List announced protest actions | blocked | Requested "what's planned next" | Each item read from its source; city and day level; announcer is an organisation; passes validate_upcoming; date-passed handling verified | Same as BLK-1 |
| BLK-3 | Human editorial review | blocked | AI-assisted checks are not independent verification | Named editor and backup; sampled records signed off; one real correction completed end to end; only then may the disclosure change | No editor appointed |
| BLK-4 | Keep records current within 72 hours | blocked | A tracker must keep up with events | Newest evidence < 72 h on 30 consecutive days, published as a metric; expiring records reviewed daily | BLK-1 and BLK-3 |
| BLK-5 | Local-language coverage | blocked | 123 of 128 sources are English | Per-country language and review windows in the coverage ledger; sensitive translated claims reviewed by a person | Fetch access (BLK-1) and language reviewers (BLK-3) |
| NEXT-1 | Structured police/state response types | next | Free text cannot be filtered safely; keyword guesses misfile | Controlled vocabulary in the Mass Mobilization Project style (CC0, cited), extended with legal, administrative and legislative action, communications restrictions and curfews; fields for acting body, announced vs observed, alleged vs officially stated, and date; every one of the 37 entries coded from a re-read source; "not recorded" stays distinct; chips only from coded data | Schema, validator and merge changes; source re-reads need BLK-1. Coding from the stored one-line summaries alone is not allowed |
| NEXT-2 | Turnout ranges with who estimated them | next | Size is asked for but no number is recorded | Low/high plus estimator (organisers, police, officials, media) plus method; competing estimates side by side, never averaged; vague words stay text; "not established" stays distinct | Schema change; source re-reads need BLK-1 |
| NEXT-3 | Issue tags normalised | next | 66 tags, 36 used once; Labor/Labour/Labour rights split the filter | Controlled list of about 15–20 groups, with the original tag kept; old permalinks still resolve; CSV keeps the original tag; list ordered alphabetically, not by count | Merge rerun and test updates. No network needed |
| NEXT-4 | Position roles recorded in data | next | Cards cannot honestly say "government response" without a field | All 92 positions coded demonstrators / counter-demonstrators / institution response from stored records; kr-yoon pro-Yoon marked as a counter-demonstration; still no tallies | Schema and validator change |
| NEXT-5 | Research window and years beyond 2026 | next | Year options and window end are hard-coded and break in 2027 | Year options derived from data; window end advanced only for searched days; tests updated | No network needed |
| NEXT-6 | "Added" and "corrected" dates plus a public corrections log | next | Readers need to know what changed; a feed depends on this | Per-record added/corrected dates validated; corrections page lists ID, date, field and reason; empty log says "No corrections published yet" | Schema change |
| NEXT-7 | Automated accessibility, link and deploy checks | next | Protect the redesign from regressions | axe or pa11y at 320 and 390 px; internal link check on PRs; Lighthouse a11y ≥0.95; Node 24 action pins; non-cancelling deploy; post-deploy build-stamp check | — |
| LATER-1 | Episode grouping and movement links | later | Related episodes and counter-demonstrations should connect | Links only where a source documents the relationship; no inferred continuity | Staffed review for duplicate judgements (BLK-3) |
| LATER-2 | RSS/Atom feed and notifications | later | Return visits | Only after BLK-4 is sustained, BLK-3 is staffed and NEXT-6 exists. Items are "published or corrected in the atlas", showing both the evidence date and the atlas date. Never announced actions. No push alerts until moderation capacity and a demonstrated need exist | BLK-3, BLK-4, NEXT-6 |
| LATER-3 | Versioned snapshots and archive | later | Readers should be able to cite a fixed snapshot | Each release snapshot immutable and dated; comparisons only where coverage is comparable | — |
| LATER-4 | Shareable per-record pages | later | Sharing and search | Each page carries the disclosure and all dates; preview text never implies live | — |
| LATER-5 | Date-range filter and episode timeline view | later | Exploring timeframes | Marks only at dated entries; no filled spans | — |

**Not planned (state publicly):** a severity or "danger" score; popularity or approval percentages; predictions of unrest; live tracking of police, troops or crowds; identification of participants; reminders, calendar exports or "join" buttons for planned protests; country or region rankings; automatic publication of discovered leads.

---

## 12. Copy deck (exact text)

`{…}` = data placeholder. All dates and times in UTC.

### Header and disclosure
- **H1 Disclosure (policy text, verbatim, full sentence visible in the first viewport of every primary view; never collapsed into an icon):** "AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed."
- **H2 Disclosure expander label:** "What this means"
- **H3 Expander body:** "An AI system opened and read the cited news articles and recorded what they report. No human editor has reviewed these records. Published episodes exist for 81 of 249 countries and territories; the other 168 are gaps in this atlas, not places without protests. Sources are mostly in English."
- **H4 Header chip, current:** "Snapshot · {2 Oct 2026, 21:31} UTC"
- **H5 Header chip, aging:** "Snapshot · newest evidence {4} days old"
- **H6 Header chip, stale / archive:** "Stale snapshot · newest evidence {7} days old"
- **H7 Compact persistent marker (sticky header, opens the dates sheet):** "AI-assisted pilot · not live"

### Status strip
- **S1 Line 1:** "Snapshot assembled {2 Oct 2026, 21:31 UTC} · {1 hour ago}"
- **S2 Line 2:** "{84} published episodes in {81} of {249} countries and territories · newest evidence dated {2 Oct 2026}"
- **S3 Line 3 (only when the fresh band is non-empty):** "{5} have evidence dated within the last 72 hours. That is not confirmation that they are ongoing."
- **S4 Aging banner:** "No evidence newer than {2 Oct 2026} ({3} days ago) is in this snapshot. More recent protests are missing."
- **S5 Stale banner:** "This snapshot has nothing newer than {2 Oct 2026}, {7} days ago. Read it as an archive of past reporting, not as a picture of current protests."
- **S6 Archive banner:** "Archive: newest evidence {2 Oct 2026}. This atlas is not currently being maintained as a tracker."
- **S7 Refresh-blocked line (Reports view intro and dates sheet; source it from data per §16.2):** "A search for newer reports on {2 Oct 2026} could not open news websites, so no records were added. Recent coverage is especially thin."

### Freshness badges and group headings
- **F1:** "Within 72 h" (aria: "Latest evidence dated within the last 72 hours")
- **F2:** "3–7 days ago" (aria: "Latest evidence dated 3 to 7 days ago")
- **F3:** "7–30 days ago" (aria: "Latest evidence dated 7 to 30 days ago")
- **F4:** "Over 30 days ago" (aria: "Latest evidence dated more than 30 days ago")
- **F5:** "Date not established" (aria: "Latest evidence date not established")
- **F6 Group headings:** "Latest evidence within 72 hours" · "3 to 7 days ago" · "7 to 30 days ago" · "Earlier research, 2024–2026" · "Evidence date not established"
- **F7 Feed explainer under the Reports heading:** "Newest first, by the date of each episode's latest sourced activity or development. Not by when it was published or checked."

### Status labels
- **ST1:** "Reported ongoing as of {date}"
- **ST2:** "Needs review · current status unknown"
- **ST3:** "Current status not established"
- **ST4:** "Ended / suspended {date}"
- **ST5 (examples only):** "Planned"

### Card fact rows (labels, then value template)
- **C1 Location line:** "{Country} · {location label}". Drop the label when it equals the country name.
- **C2 Time line:** "Latest evidence {2 Oct 2026} · {today}" + band badge + status label
- **C3 "Issues":** "{tag} · {tag}" (as recorded)
- **C4 "For / against":** "[{For|Against|Mixed|Unclear}] {target} — {actor}", one line per position. If none: "No position is recorded in this record."
- **C5 "Timeframe":** templates in §8
- **C6 "Intensity":** "Turnout: {text|not established} · Disruption: {text|not established} · Violence or harm: {text|not established}". All three undescribed: "Turnout, disruption and violence: not established in this record."
- **C7 "Police / state":** "{action} — {attribution}". If none: "Not established in this record"
- **C8 "Source":** "{Publisher} ↗ · published {date} · {Single source|Corroborated|Contested} · {n} {link|links} · AI-assisted check"
- **C9 Outcome teaser (when documented):** "What changed: {outcome summary}"
- **C10 More positions:** "+{1} more position recorded"
- **C11 Example watermark (example mode, card, map and detail):** "Illustrative example • not a real event"

### Detail sections (headings, then fixed sub-copy)
- **D1 Record header meta:** "AI-assisted source check · no human editorial review"
- **D2 "At a glance"** (4 cells): "For / against" · "Intensity" · "Police / state" · "Timeframe"
- **D3 "What happened"** (summary + episode scope, labelled "Scope of this record:")
- **D4 "Who is for or against what"**
- **D4-sub:** "Each line is one actor's position toward a named target, as reported in the cited source. 'For' and 'against' only mean something with their target. A government, party or company position is a response, not a counter-protest. Positions are not head-counts and do not show which view has more support."
- **D5 "Reported intensity"**
- **D5-sub:** "Turnout, disruption and violence are reported separately. There is no combined score. 'Not established' means the sources did not give a reliable figure or description; it never means zero or none."
- **D5 row labels:** "Turnout" · "Disruption" · "Violence or harm"
- **D5-violence-note:** "Can include force used by police or security services, as the source reports it. Arrests or police force are not evidence that participants were violent."
- **D5-no-source:** "No source is attached because none of these was established in this record."
- **D6 "Police and state response"**
- **D6-sub:** "As reported by the cited source. This can include police, military, ministers, legislatures and courts. Announced measures are not the same as actions that were observed."
- **D6-entry:** "{action}" / "Reported by: {attribution}" [Source n]
- **D6-empty:** "No police or state response is recorded in this record. That is not evidence that none occurred."
- **D7 "What changed — and for whom?"** (existing outcomeHTML; keep its test-pinned strings)
- **D8 "Timeline"**. Sub: "Dated entries only. Gaps between dates are not assumed activity."
- **D9 "Evidence and verification"**. Rows: "Verification: {label}" · "Source re-read (AI-assisted): {timestamp}" · "Latest evidence: {date}" · {verification note}
- **D10 "Sources"**. Per source: "{title} — {publisher} · published {date|date not given} · opened {timestamp} ↗"
- **D11 Sticky tabs (phone):** "Overview · For/against · Intensity · Police/state · Outcome · Sources"

### Empty and error states
- **E1 Filter, no match:** "No published episode matches these filters." / "That describes this atlas, not the world. It does not mean no protests happened in this place, on this issue or in this period." [Clear filters]
- **E2 Country, no published episode:** "{Country}: no published episode in this atlas." / "A first search was logged on {date} ({n} results, not reviewed). This is a coverage gap, not evidence that no protests occurred."
- **E3 Country, records outside the filters:** "{Country} has {n} published {episode|episodes}, but none match your current filters." [Show all for {Country}]
- **E4 Empty band group:** "No episode in this snapshot has evidence dated {within the last 72 hours|in the last 7 days}. That is a gap in this dataset, not a sign that no protests happened."
- **E5 Data load error:** "Published records could not be loaded, so coverage is unknown right now, not zero." [Retry]
- **E6 Map failure:** "The map could not load. Every country and territory is still available in the list and the A–Z directory." [Retry map]
- **E7 Status permalink with no match (e.g. ongoing):** "No episode in this snapshot is currently labelled '{Reported ongoing}'. That label needs evidence dated within 72 hours. It does not mean no protests are happening."
- **E8 Search, no match:** "No published episode mentions '{query}'. Try another word, or browse by country."
- **E9 Directory row statuses:** "{n} {episode|episodes} published" · "Searched · no published episode" · "Not yet searched" · "Coverage unavailable" (and fix the "1 entries" plural)

### Map legend (both directions)
- **M1 Title:** "What the colours mean"
- **M2:** "Published episode matches your filters"
- **M3:** "No published episode matches. A coverage gap, not 'no protests'"
- **M4:** "Selected"
- **M5:** "Shadow: includes a sourced ended or suspended episode. It does not mean the movement ended or won"
- **M6:** "City reference point (approximate). Not a protest site"
- **M7:** "Small territories are not drawn at this scale. Use the country list"
- **M8 Footnote:** "Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe."
- **M9 When a time filter is active:** "Showing episodes with latest evidence in the last {7|30} days"

### Ahead
- **A1 Page title:** "Ahead"
- **A2 Section heading 1:** "Announced protest actions"
- **A2-sub:** "Actions that a named organisation or institution has publicly announced for a future date. An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful."
- **A3 Empty-state title:** "No announced actions are listed yet"
- **A4 Empty-state body, para 1:** "This list includes an announced action only after the article announcing it has been opened and read. Nothing meets that standard in this snapshot."
- **A5 Empty-state body, para 2 (why):** "On {2 Oct 2026}, our search for announced and recent protest actions could not open news websites from the research environment. Search-result snippets were logged as leads, but a snippet is not a source, so none are listed here. An empty list does not mean nothing is planned."
- **A6 Empty-state body, para 3 (what an item will show):** "When items appear, each will show what was announced and by which organisation or institution, the country and city, the planned date and how precise it is, the source with its publisher and publication date, and when it was checked. Times, meeting points and routes are never listed. After the planned date passes, an item is marked 'occurrence not established' until a sourced report says what happened." [What's blocking this →]
- **A7 Item caveat (on every item):** "An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful."
- **A8 Date-passed group heading:** "Planned dates that have passed ({n}) · occurrence not established"
- **A9 List stamp:** "Announced-actions list compiled {timestamp} · {n} {item|items}"
- **A10 Section heading 2:** "Coming next to Protest Atlas"

### Roadmap
- **R1 Title:** "Coming next"
- **R2 Intro:** "What we have built, what we are working on and what is blocked, stated plainly. There are no promised dates. 'Shipped' means live on this site now and checked after it was deployed. This page is about the atlas itself. Announced protest actions are listed separately under Ahead."
- **R3 Status legend:** "Shipped: live on this site now. · In progress: being built; not live yet. · Next: planned, and can start without outside help. · Later: only after the listed conditions are met. · Blocked: cannot proceed until the named blocker is resolved."
- **R4 Not planned heading and body:** "What we will not build" / "A severity or 'danger' score. Popularity or approval percentages. Predictions of unrest. Live tracking of police, troops or crowds. Identification of participants. Reminders, calendar exports or 'join' buttons for planned protests. Country or region rankings. Automatic publication of discovered leads."
- **R5 Roadmap stamp:** "Roadmap revised {2 Oct 2026} · AI-assisted · no human editorial owner yet"

### Footer stamps and dates sheet
- **T1 Footer line:** "Snapshot assembled {2 Oct 2026, 21:31 UTC} (AI-assisted, no human sign-off) · Newest evidence dated {2 Oct 2026} · Site built {timestamp} from {1a2b3c4} · All times UTC"
- **T2 Footer, no build stamp:** "Site build stamp not available in this preview"
- **T3 Dates sheet title:** "What the dates on this page mean"
- **T4 Dates sheet rows:** the explainers in §4, verbatim
- **T5 Dates sheet closing line:** "Event dates are days, as reported. We do not invent times of day. Re-reading a source, assembling the snapshot or rebuilding the site never makes a protest more recent."

### Page meta
- **P1 `<title>`:** "Protest Atlas: source-checked protest reports"
- **P2 meta description / OG:** "An AI-assisted, source-checked snapshot of reported protests, with searches logged for 249 countries and territories. Sparse coverage; not a live feed."

---

## 13. Direction-specific guidance

**Live desk (feed first, tab bar).**
- Tabs: "Reports · Map · Countries · Ahead". About and method links live in the header. Never "Live" or "Now".
- Group the feed by band (F6) with visible empty-group lines (E4). No auto-scrolling ticker and no "new since your last visit".
- The stale banner sits above the first group, under the disclosure.
- Cards carry rows C1–C8. Clamping is allowed on summary and long texts, never on attribution, target or stance.
- A feed reads as a stream, so the date on each card is not optional chrome.

**Atlas sheet (map first, bottom sheet).**
- The peek detent must show the disclosure (H1, possibly wrapped), the snapshot chip and the stale banner when stale, before any country list.
- The map looks the same when stale, so the warning has to live in the sheet.
- Tapping a country with no record opens E2, never an empty sheet.
- The default sheet content is "Latest evidence" grouped by band, not "Top countries". There is no count ranking; list countries alphabetically or by newest evidence date.
- Legend (M1–M9) is reachable in one tap.
- The map must not take scroll gestures on a phone (pan-y, two-finger pan or an explicit "Explore map" button).
- Every drag action needs a button alternative (WCAG 2.5.7).

**Both.**
- The record detail is a full-height sheet with D11 tabs.
- Share and export must check example mode inside the handler, not only through a disabled button.
- No service worker or offline cache this release. A cached old snapshot could show without a recomputed stale state.
- Every stamp and band is recomputed against the real clock.

---

## 14. Acceptance checks the editor will run on the build

1. At 390×844 on first load, H1 is fully visible above any record or map, and stays visible in all four views.
2. With the system clock set to 2026-10-09T12:00Z, the header shows H6, S5 is visible on Reports **and** Map, E4 is shown for 72 h and 7 days, and no record is labelled "latest" or "new".
3. kr-yoon, ng-pengassan, nz-treaty, es-housing and as-noaa render exactly as in §5.2. No stance total appears anywhere (search the DOM for "support", "oppose" and "%").
4. All 34 fully undescribed records show C6's single line. None show "0", "—", "None" or "N/A" for intensity or state response.
5. All 47 records with no state response show D6-empty in detail and "Not established in this record" on the card.
6. No element contains the banned vocabulary in §2 (text, aria-label, title, alt, meta).
7. Ahead with 0 items shows A3–A6. A fixture item dated yesterday appears only under A8. A month-precision fixture shows no countdown.
8. The footer shows "Site built" separately from "Snapshot assembled". When build-info is missing, T2 appears and nothing breaks.
9. tz-drivers shows "Ended / suspended 30 Sep 2026" ahead of its "Within 72 h" badge.
10. Every card has a publisher link, a publication date, a verification label and "AI-assisted check".

---

## 15. Risk register (redesign)

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| 1 | "Live" framing creeps in (badges, pulsing dots, the "Live desk" name, "Now" tabs) | High / high | Banned-vocabulary list (§2); DOM text check in acceptance (§14.6) |
| 2 | Map-first view looks equally full and current when stale | High / high | Stale banner inside the map view and sheet peek; staleness driven by newest evidence |
| 3 | Disclosure hidden on mobile (behind an icon) or replaced by the stale notice | Medium / high | H1 in full in the first viewport; stale lines are added, never substituted |
| 4 | A single "Updated" stamp mixes deploy, assembly and evidence times; a merge rerun or rebuild makes data look refreshed | High / high | Labelled stamps (§4); staleness from newest evidence; "Site built" only in the footer |
| 5 | merge_history.py coverage_note claims a "selective recent-activity sweep for 18 Sep–2 Oct" that produced nothing | Certain if rerun / medium | Reword (§16.1) before any rerun |
| 6 | Stance tally, bar or two-column "sides" layout; kr-yoon's rivals shown as allies; NG's conflict hidden | Medium / high | Single-column rendering (§5.1); aggregates banned (§5.3); worked-case test |
| 7 | Client labels actor roles ("Protesters" / "Government") by guessing | Medium / medium | Actor printed exactly as stored; roles only from coded data (NEXT-4) |
| 8 | State-response keyword chips misfile entries (NOAA reply, OHCHR finding, "announced", "authorized", "alleged") and imply "no police action" on 47 records | High if built / high | Chips rejected (§7.2); search over the text instead |
| 9 | "Not established" shown as a dash, zero, empty meter or greyed-out row | Medium / high | Copy and visual rule in §6.3; acceptance check 4 |
| 10 | "Violence" labelled as protester violence although the field includes state force | Medium / high | "Violence or harm" label plus D5-violence-note |
| 11 | Severity creeps in through sorting, colour or icons ("most intense", red for violence) | Medium / high | No intensity sort or filter; neutral styling |
| 12 | Numbers parsed from prose ("42,000") into tiles or circle sizes | Low / high | Text shown as recorded only |
| 13 | Unread round-4 leads leak into Ahead or "possible upcoming" | Medium / high | Ahead reads only validated upcoming.json; no links to screening files |
| 14 | Countdown gives false precision for week or month; month item marked "date passed" on day 2 | Medium / medium | No countdown for week or month; fix announcementState or validator (§10.4) |
| 15 | Ahead becomes a mobilisation tool (calendar, join, reminders, map pins) | Low / high | Banned features (§10.4) |
| 16 | Roadmap overclaims "shipped" or promises dates; roadmap mixed with announced protests | Medium / medium | Shipped = deployed and verified; separate sections (§10.5); no dates |
| 17 | Rankings ("Top countries", "Top issues", regional totals) treat coverage artefacts as hotspots | Medium / high | Alphabetical or by-date ordering; no ranked lists; issue chips alphabetical |
| 18 | Default 7-day window makes the home empty after 9 Oct, or a silent fallback mislabels older records | Medium / medium | No default window (§3.4) |
| 19 | An ended record in the 72-hour group reads as active | High / medium | Status leads, badge follows (§3.2) |
| 20 | Truncation removes attribution, target or "alleged" | Medium / high | Clamp summaries only; never attribution, target or qualifiers |
| 21 | Claims shown in quotation marks as if verbatim | Medium / medium | "As reported:" label, no quote marks |
| 22 | Timeline bars imply continuous activity between dated entries | Medium / medium | Marks only at dated entries (§8) |
| 23 | Example records exported or shared through a new mobile action entry point | Low / high | Mode checked inside the handler |
| 24 | Hard-coded copy goes out of date ("2 Oct" blocked-sweep text, year options 2024–2026, "through 2 October 2026") | High / medium | Source it from data (§16.2); NEXT-5 |
| 25 | Stale page left open never updates its stale state | High / medium | Recompute every minute and on visibilitychange, independent of status changes |
| 26 | Share or OG previews say "live" or show counts as a census | Low / medium | P1/P2 copy |
| 27 | A service worker serves an old snapshot | Low / high | No service worker this release |
| 28 | "All countries" claim | Medium / medium | "Searches logged for 249; published episodes in 81" |
| 29 | Contrast and size regress on placeholders and badges (muted italic at 9 px) | Medium / medium | 4.5:1, minimum 12 px; text plus shape, never colour alone |
| 30 | Black-shadow and city-dot meanings dropped in the re-skin | Medium / medium | Legend M5/M6 required |

---

## 16. Notes for the lead (pipeline and data changes that support the copy)

1. **coverage_note wording** (merge_history.py line 53). Replace "with a selective recent-activity sweep for 18 Sep–2 Oct 2026" with: "Research snapshot, 1 Jan 2024–2 Oct 2026: {n} sourced episodes across {m} countries and territories. A recent-activity search on 2 Oct 2026 could not open news articles, so no newer records were added. AI-assisted, no independent human editorial sign-off. Missing records and unknown status are coverage limits, not evidence that no protests occurred."
2. **Put the blocked-sweep fact in data, not copy.** Have merge_history derive it from research/round4/*-screening.json (rows logged, rows with reviewed_urls) and write it into upcoming.json `note`. The validator already needs "does not establish" or "not evidence", which the note keeps. Ahead para A5 and strip line S7 then render it, and the text does not go stale when a later sweep succeeds.
3. **Rerunning merge restamps `generated_at`** even with no data change. That is acceptable only under the "Snapshot assembled" label and with staleness driven by newest evidence. The tests' fixed NOW (test_coverage.py: 2026-10-02T23:00Z) still matters if the restamp lands after 23:00.
4. **freshness.js text:** replace BAND_LABELS and ANNOUNCEMENT_LABELS with §3.2 and §10.3. No test pins BAND_LABELS. The date-passed test only needs /not recorded/. Stop calling countdownLabel for week and month, or update its test deliberately. Fix the week/month end-date logic in announcementState or the validator.
5. **searchableText:** add state_response action and attribution, plus intensity text (§7.2).
6. **refreshAges:** recompute the notice, stamps and band groups every tick, not only when a status changes.
7. **No new public fields this release** for roles, state-response kind or turnout ranges. They belong to NEXT-1, NEXT-2 and NEXT-4 with validators and tests. Client-side derivation of any of them is out of scope by this guidance.
