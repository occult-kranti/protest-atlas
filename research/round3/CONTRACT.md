# Historical expansion research contract

Requested window: 2024-01-01 through 2026-10-02 inclusive. The unit is a sourced collective-action episode, not an entire country, ideology or social movement. Worldwide recall cannot be established from search.

Each regional agent owns three files: REGION-events.json (array of existing v1 event objects), REGION-context.json (array of the objects below), REGION-screening.json (array of country screening rows). Read public/countries.json and scripts/validate_data.py; copy exact country/region names. Do not edit shared public data, code, tests or other agents' files.

Search every assigned directory entry at least once. Retain exact query and actual attempt timestamp, including failures. Query explicit 2024, 2025 and 2026 through October 2; this is an initial historical screen, not three separate complete annual reviews. Include cities when a source identifies them. Deep-read underlying articles before writing event claims. Search results alone are candidate discovery. Prefer original reporting, official announcements and primary rights/union records with incentives explained. Do not falsely present syndicated wire copies as independent sources. Avoid Wikipedia as sole public evidence. Retain sourced uncertainty; no fabricated source URLs, dates, exact crowd estimates or current activity.

Aim for substantial distinct-country breadth, about 12-18 well-sourced episodes per large region and 5-10 for Oceania, while screening every assigned entry. This is a work target, not a license to lower evidence standards. Include both 2024 and 2025 and seek 2026, but never invent future/current evidence if searches do not support it. Search retrieved-result counts are not read-source counts.

Public event object: existing strict schema in public/events.json and scripts/validate_data.py, with globally unique source IDs beginning country/event slug; conservative unknown turnout/intensity allowed. Use status unknown unless an actual end or suspension is reported. A policy concession alone does not establish protest end. If explicit ended episode, end_date required plus status_basis below. Single-day article reports are not enough to prove the wider movement ended. Use current actual UTC source access time, not an invented prior review. No private participant names or exact rally routes.

Context object exact fields:
```json
{"event_id":"slug","episode_scope":"Describe the bounded episode and exclusions","cities":[{"name":"City name","source_ids":["event-source"]}],"status_basis":{"text":"Why status is ended or remains unknown","source_ids":["event-source"]},"outcome_status":"documented","outcomes":[{"date":"2024-06-26","summary":"What the source establishes changed","favours":[{"actor":"Named collective or institution","effect":"benefit","basis":"inference","note":"Limited, explicit reasoning; no national popularity claim"}],"causality":"reported-link","source_ids":["event-source"]}],"research_note":"Source breadth, contradiction, follow-up limits; AI-assisted, no human sign-off."}
```
outcome_status: documented | not-established. If not-established, outcomes must be []. outcome date may be null if unknown; never substitute publication day automatically. favours effect: benefit | setback | mixed | unclear. basis: explicit | inference. causality: reported-link | not-established. Event-local source_ids are mandatory for all substantive claims. Status_basis source_ids can be [] only when status is unknown and text explains uncertainty. Cities may be empty if no city is established. No city coordinates here; root will handle generalized geography separately.

Screening row exact fields:
```json
{"code":"FR","query":"exact query sent","attempted_at":"actual UTC timestamp","provider":"Exa","status":"searched","result_count":5,"candidate_urls":["returned URLs only"],"reviewed_urls":["actually fetched/read URLs only"],"note":"Initial English-language screen; not exhaustive; country identification/dates checked where possible."}
```
status searched | search-failed. Empty results do not establish absence. candidate_urls <=5, reviewed_urls only relevant fetched pages. Name collisions (Georgia, Jersey, Guinea etc.) need disambiguation. Territories and uninhabited entries stay honest if no reliable local episode found. Do not mark completed research from a single query; this row records a performed screen only.

Return counts of countries searched, failed attempts, source pages actually read and proposed events. Write incremental checkpoints. No nested agents. Use Exa plugin, skills and official/strong sources; generic web may verify/fill coverage but keep actual provider provenance. Do not count requested search results as sources read. Respect source text copyright; paraphrase briefly and retain links.
