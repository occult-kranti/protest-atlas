export const meta = {
  name: 'atlas-region-scan',
  description: 'Sourced scan of recent protest activity and announced actions for one region, adversarially verified by two independent skeptics, then applied',
  phases: [
    { title: 'Scan', detail: 'sourced regional scan' },
    { title: 'Verify', detail: 'source-fidelity and editorial/schema skeptics' },
    { title: 'Apply', detail: 'apply verdicts and validate' },
  ],
}

const REPO = '/home/user/protest-atlas'
const SCRATCH = args.scratch
const NOW = args.now
const r = args.region

const SCAN = { type: 'object', properties: {
  region: { type: 'string' }, files_written: { type: 'array', items: { type: 'string' } },
  new_episodes: { type: 'number' }, updates: { type: 'number' }, upcoming: { type: 'number' },
  sources_read: { type: 'number' }, failed_attempts: { type: 'number' }, notes: { type: 'string' },
}, required: ['region', 'files_written', 'new_episodes', 'updates', 'upcoming', 'sources_read', 'failed_attempts', 'notes'] }

const VERDICTS = { type: 'object', properties: {
  region: { type: 'string' }, lens: { type: 'string' },
  verdicts: { type: 'array', items: { type: 'object', properties: {
    record_type: { type: 'string', enum: ['event', 'update', 'upcoming'] }, id: { type: 'string' },
    verdict: { type: 'string', enum: ['keep', 'fix', 'drop'] },
    reasons: { type: 'array', items: { type: 'string' } },
    corrections: { type: 'array', items: { type: 'string' } } }, required: ['record_type', 'id', 'verdict', 'reasons', 'corrections'] } },
  general_notes: { type: 'string' },
}, required: ['region', 'lens', 'verdicts', 'general_notes'] }

const APPLIED = { type: 'object', properties: {
  region: { type: 'string' }, kept: { type: 'array', items: { type: 'string' } }, fixed: { type: 'array', items: { type: 'string' } },
  dropped: { type: 'array', items: { type: 'string' } }, validation: { type: 'string', enum: ['pass', 'fail'] }, notes: { type: 'string' },
}, required: ['region', 'kept', 'fixed', 'dropped', 'validation', 'notes'] }

const FILES = ['events', 'context', 'updates', 'upcoming', 'languages', 'screening'].map(f => `research/round4/${r.key}-${f}.json`).join(', ')

phase('Scan')
const scan = await agent(`You are a careful, skeptical protest-reporting researcher working in ${REPO}. Current UTC time is about ${NOW} (always read the real clock with \`date -u +%Y-%m-%dT%H:%M:%SZ\` for access timestamps). Load WebSearch and WebFetch with ToolSearch ("select:WebSearch,WebFetch").
Read research/round4/CONTRACT.md fully and follow it exactly; also read research/round3/CONTRACT.md, scripts/validate_data.py and several records in public/events.json and public/event-context.json to copy the exact schema. Your region prefix is "${r.key}" and your scope is ${r.scope}.
Task: find protest/strike/demonstration activity REPORTED AS OCCURRING between 2026-09-18 and 2026-10-02 in your scope, and publicly ANNOUNCED upcoming collective actions dated 2026-10-03 or later. Prioritise breadth across countries and the largest/most-reported episodes, and look beyond the anglophone press (regional outlets, wire services, union/organiser and official statements). Use WebSearch for discovery and WebFetch to deep-read every article you cite; if a page will not load, try another outlet's report rather than citing it unread. For existing recent episodes in your scope (public/events.json with last_observed_at >= 2026-05-01) look for newer reporting and write updates rather than duplicates.
Write ONLY ${FILES} (always write all six; use [] or {} when empty). Validate event objects by writing a small python script in ${SCRATCH}/${r.key}/ that does sys.path.insert(0,'${REPO}/scripts') and calls validate_event(event, catalog, now, path) from validate_data (catalog = {c['code'] for c in countries} — check validate_countries' return shape in validate_data.py), and fix every error. Do not spawn nested agents. Return counts honestly — sources_read counts only pages you actually fetched and read.`, { label: `scan:${r.key}`, phase: 'Scan', schema: SCAN })

phase('Verify')
const verdicts = (await parallel([
  () => agent(`You are an adversarial SOURCE-FIDELITY verifier for ${REPO}. Load WebFetch with ToolSearch ("select:WebFetch,WebSearch"). Read research/round4/CONTRACT.md. Then examine research/round4/${r.key}-events.json, ${r.key}-context.json, ${r.key}-updates.json and ${r.key}-upcoming.json (scanner summary: ${JSON.stringify(scan)}).
For EVERY record: WebFetch each cited source URL yourself. Confirm the page exists and is about this country/episode; the publisher and published_at are right; the reported activity date falls in 2026-09-18..2026-10-02 (events/updates) or the planned date is on/after 2026-10-03 (upcoming); and each claim (summary, positions with stance+target, turnout numbers, disruption/violence text, state_response actions incl. arrest/injury counts, timeline entries, cities, outcomes, announced action/date/announcer) is supported by the text. Flag invented or rounded numbers, misattributed actors, syndication presented as independent corroboration, and 'ongoing' statuses without explicit continuing-activity evidence within 2026-09-30..10-02. If you cannot fetch a source to confirm a claim, treat it as unconfirmed: verdict 'fix' if the claim can be removed/softened while the record survives, otherwise 'drop'. Corrections must be concrete (field, old → new). Do NOT edit files.`, { label: `verify-sources:${r.key}`, phase: 'Verify', schema: VERDICTS }),
  () => agent(`You are an adversarial EDITORIAL + SCHEMA verifier for ${REPO}. Read research/round4/CONTRACT.md, research/round3/CONTRACT.md, docs/EDITORIAL_POLICY.md and scripts/validate_data.py / scripts/validate_history.py. Then examine research/round4/${r.key}-events.json, ${r.key}-context.json, ${r.key}-updates.json, ${r.key}-upcoming.json (scanner summary: ${JSON.stringify(scan)}).
Check every record for: duplicates of existing public/events.json episodes (same country + issue → should be an update); status rules (ongoing only with explicit continuing activity 2026-09-30..10-02 — note validate_history.py currently only allows unknown/ended and will be extended to accept evidenced 'ongoing'; ended needs end_date + sourced status_basis); stance/target logic (stance toward a named target; officials are not counter-demonstrators; no national-popularity inference); privacy (no private individuals' names, meeting points, routes, times); upcoming items (exact contract fields, planned_start >= 2026-10-03, announced_by is a collective/institution, city-level only, announcement ≠ occurrence); honest verification notes (AI-assisted, no human review; wire-chain dependence stated); exact field sets per contract; accessed_at timestamps not in the future (current UTC ~${NOW}) and plausible. Run validate_event from scripts/validate_data.py on every event via a scratch script in ${SCRATCH}/verify-${r.key}/ and replicate the context field checks from validate_history.py; include every validator error. Verdict per record keep/fix/drop with concrete corrections. Do NOT edit repository files.`, { label: `verify-editorial:${r.key}`, phase: 'Verify', schema: VERDICTS }),
])).filter(Boolean)

phase('Apply')
const applied = await agent(`You own research/round4/${r.key}-*.json in ${REPO}. Two independent verifiers reviewed your region's records. Apply their verdicts strictly:
- 'drop' from EITHER verifier → remove the record (and its context record, and language entries for its sources; null an upcoming item's event_id if its episode is dropped).
- 'fix' → apply every concrete correction; if a correction requires a claim you cannot support, remove that claim (or the record).
- When verifiers disagree between keep and fix, apply the fix.
Verdicts: ${JSON.stringify(verdicts)}
Then validate: every remaining event with validate_event from scripts/validate_data.py (sys.path.insert the scripts dir; now = current UTC); context records match the release-3 context contract field set exactly and each context event_id exists in ${r.key}-events.json (one context per event); upcoming items have exactly the contract fields, planned_start >= 2026-10-03, and sources whose ids equal source_ids; updates reference existing public/events.json ids and their source ids are globally unique versus public/events.json; languages cover every new source id. Use a scratch script under ${SCRATCH}/apply-${r.key}/. Edit only research/round4/${r.key}-*.json. Return ids kept/fixed/dropped and whether validation passes.`, { label: `apply:${r.key}`, phase: 'Apply', schema: APPLIED })

return { region: r.key, scan, verdicts, applied }
