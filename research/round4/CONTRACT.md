# Round 4 — recent-activity and announced-action research contract

Purpose: refresh the atlas with **recently reported** protest activity and **publicly announced upcoming collective actions**, without weakening the release-3 evidence rules (`research/round3/CONTRACT.md`). This is a selective, AI-assisted, predominantly English-language sweep, not a live census.

Window for new observations: activity that a source reports as occurring between **2026-09-18 and 2026-10-02 (UTC) inclusive**. Announced actions must have a planned date **on or after 2026-10-03**. Use the real UTC clock (`date -u +%Y-%m-%dT%H:%M:%SZ`) for every `accessed_at` and `attempted_at`; never invent or backdate an access time.

Each regional agent owns only files with its own prefix inside `research/round4/`: `REGION-events.json`, `REGION-context.json`, `REGION-updates.json`, `REGION-upcoming.json`, `REGION-languages.json`, `REGION-screening.json`. Do not edit `public/`, code, tests or another agent's files. Write incremental checkpoints.

## A. New episodes (`REGION-events.json`, `REGION-context.json`)

- Event objects follow the strict v1 schema enforced by `scripts/validate_data.py` (compare `public/events.json`). Context objects follow the release-3 context contract exactly (`research/round3/CONTRACT.md`).
- Before creating an episode, check `public/events.json` for an existing record of the same country and issue. If one exists, write an update (section B) instead of a duplicate.
- IDs: lowercase slug `<cc>-<topic>-<yyyymmdd>`; source IDs must start with the event slug or the country code and be globally unique.
- `status`: use `ongoing` only when a source explicitly reports activity continuing on a date from 2026-09-30 to 2026-10-02 (for example "the strike entered its third day"), and set `last_observed_at` to that reported date. Use `ended` only with a reported end/suspension, `end_date` and a sourced `status_basis`. Otherwise `unknown`. A government concession alone does not end an episode.
- `start_date` stays null with precision `unknown` unless the source establishes the onset.
- Turnout: null bounds unless a source gives an attributed estimate; keep competing estimates in the qualifier text.
- `positions` must name a collective actor or institution, a stance (`support`/`oppose`/`mixed`/`unclear`) **towards a named target**, and an attributed claim. Do not convert participation into national popularity. Do not label officials as counter-demonstrators.
- `state_response` covers police, administrative, judicial and legislative actions, each attributed and sourced. Arrest, injury and death counts must quote their attributed source and remain approximate where the source is approximate.
- No private participant names, faces, meeting points, exact routes or times.

## B. Updates to existing episodes (`REGION-updates.json`)

Array of objects:
```json
{"event_id":"existing-id","last_observed_at":"2026-10-02","status":"unknown","new_sources":[{"id":"…","url":"https://…","title":"…","publisher":"…","published_at":"2026-10-02","accessed_at":"2026-10-02T22:10:00Z"}],"timeline_additions":[{"date":"2026-10-02","text":"…","source_ids":["…"]}],"state_response_additions":[{"action":"…","attribution":"…","source_ids":["…"]}],"note":"What the new reporting establishes and what it does not."}
```
Only include fields the new reporting actually supports; leave arrays empty otherwise. `last_observed_at` must not move backwards.

## C. Announced upcoming actions (`REGION-upcoming.json`)

Array of objects with exactly these fields:
```json
{"id":"fr-teachers-strike-20261007","event_id":"fr-schools-20261002","country":"FR","cities":["Paris"],"action":"Nationwide teachers' strike","announced_by":"Named union, coalition, party or institution","planned_start":"2026-10-07","planned_end":null,"date_precision":"day","announcement":"Short paraphrase of what was announced, attributed.","status":"announced","source_ids":["fr-teachers-reuters"],"sources":[{"id":"fr-teachers-reuters","url":"https://…","title":"…","publisher":"…","published_at":"2026-10-02","accessed_at":"2026-10-02T22:10:00Z"}],"note":"Limits: announcement only, turnout and occurrence not established."}
```
- `event_id` links an existing or new episode in this round when the source connects them; otherwise null.
- `date_precision`: `day`, `week`, `month` or `range` (use `planned_end` for ranges).
- `announced_by` is a collective or public institution, never a private individual.
- City-level only. No assembly points, routes, times or tactical instructions.
- An announcement is not evidence that the action will occur, its size or its legality.

## D. Provenance (`REGION-languages.json`, `REGION-screening.json`)

- Languages: `{"source-id": "English"}` for the language actually read.
- Screening: array of `{"query":"exact text","attempted_at":"UTC","provider":"WebSearch","result_count":5,"reviewed_urls":["only pages actually fetched and read"],"note":"…"}`. Record failed attempts as well.

## Evidence standards

- Deep-read the article (WebFetch) before writing claims; a search snippet is a lead, not a source. If a page cannot be fetched, do not cite it as read.
- Syndicated wire copies (AP/Reuters/AFP on other sites) are one reporting chain, not independent corroboration; say so in `verification.note`.
- Wikipedia may help discovery but not stand as sole evidence.
- Every record's verification note must say: AI-assisted source check, no independent human editorial review, plus what remains unknown.
- Quality before quantity. A target of roughly 4–10 well-sourced new episodes and every announcement you can source is a work target, not a reason to lower standards.
