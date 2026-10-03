export const meta = {
  name: 'atlas-round4-consolidate',
  description: 'Cross-region consistency fixes for round-4 research files, then advance the window, merge, validate, test, build and draft a release note',
  whenToUse: 'Protest Atlas round-4 refresh, after region-scan.js has run for the regions to publish',
  phases: [
    { title: 'Consistency', detail: 'global IDs, duplicate episodes, wire chains, stale announcements, ongoing evidence, dry-run merge' },
    { title: 'Integrate', detail: 'WINDOW_END, merge, validators, tests, build, release note' },
  ],
}

// Portable consolidation step for research/round4 (see README.md in this folder). Never commits or pushes.

const A = (typeof args === 'string' ? JSON.parse(args) : args) || {}
if (!A.scratch) throw new Error('args.scratch is required: a writable scratch directory, e.g. "<session scratchpad>/round4"')
const REPO = String(A.repo || '/home/user/protest-atlas').replace(/\/+$/, '')
const SCRATCH = String(A.scratch).replace(/\/+$/, '')
const WORK = `${SCRATCH}/consolidate`
const REGIONS = ['americas', 'europe', 'asia-west', 'asia-east-oceania', 'africa']
const NO_GIT = 'Do not spawn agents. Never run git commit, push, checkout, stash or reset (read-only git such as git show/diff/log is fine).'
const RETRY_NOTE = '\n\nNOTE: an earlier attempt at this exact step stopped without returning a result. It may have changed files: inspect git status and the files first, continue from there, and do not repeat changes already made.'
async function attempt(prompt, opts) {
  const first = await agent(prompt, opts)
  if (first) return first
  log(`${opts.label} returned nothing; retrying once`)
  return agent(prompt + RETRY_NOTE, { ...opts, label: `${opts.label}:retry` })
}

const CONSISTENCY = { type: 'object', properties: {
  merge_time: { type: 'string' },
  current_window_end: { type: 'string' },
  regions: { type: 'array', items: { type: 'object', properties: {
    key: { type: 'string' }, latest_run_status: { type: 'string' },
    latest_completed_searched_through: { type: ['string', 'null'] },
    events: { type: 'number' }, updates: { type: 'number' }, upcoming: { type: 'number' } },
    required: ['key', 'latest_run_status', 'latest_completed_searched_through', 'events', 'updates', 'upcoming'] } },
  proposed_window_end: { type: 'string' },
  findings: { type: 'array', items: { type: 'object', properties: {
    kind: { type: 'string', enum: ['source-id', 'duplicate-episode', 'wire-chain', 'stale-announcement', 'ongoing', 'dry-run', 'other'] },
    region: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } }, action: { type: 'string' } },
    required: ['kind', 'region', 'ids', 'action'] } },
  follow_ups: { type: 'array', items: { type: 'string' } },
  dryrun: { type: 'string', enum: ['pass', 'fail'] },
  dryrun_errors: { type: 'array', items: { type: 'string' } },
  unresolved: { type: 'array', items: { type: 'string' } },
}, required: ['merge_time', 'current_window_end', 'regions', 'proposed_window_end', 'findings', 'follow_ups', 'dryrun', 'dryrun_errors', 'unresolved'] }

const N = { type: 'number' }
const INTEGRATE = { type: 'object', properties: {
  window_end_previous: { type: 'string' }, window_end_set: { type: 'string' },
  coverage_note_date_updated: { type: 'boolean' },
  steps: { type: 'array', items: { type: 'object', properties: {
    command: { type: 'string' }, result: { type: 'string', enum: ['pass', 'fail', 'not-run'] }, detail: { type: 'string' } },
    required: ['command', 'result', 'detail'] } },
  data_fixes: { type: 'array', items: { type: 'string' } },
  non_data_failures: { type: 'array', items: { type: 'string' } },
  newest_evidence_day: { type: 'string' }, fresh_until: { type: 'string' },
  announcements_passing_before_deadline: { type: 'array', items: { type: 'string' } },
  ongoing_expiring: { type: 'array', items: { type: 'string' } },
  counts: { type: 'object', properties: {
    new_episodes: N, updated_episodes: N, announced_actions: N, countries_touched: N, total_episodes: N, total_countries_with_episodes: N },
    required: ['new_episodes', 'updated_episodes', 'announced_actions', 'countries_touched', 'total_episodes', 'total_countries_with_episodes'] },
  release_note: { type: 'string' },
  unknowns: { type: 'array', items: { type: 'string' } },
}, required: ['window_end_previous', 'window_end_set', 'coverage_note_date_updated', 'steps', 'data_fixes', 'non_data_failures', 'newest_evidence_day', 'fresh_until', 'announcements_passing_before_deadline', 'ongoing_expiring', 'counts', 'release_note', 'unknowns'] }

// ---------------------------------------------------------------- 1. cross-region consistency
phase('Consistency')
const proposal = A.window_end
  ? `the operator-supplied day ${A.window_end}`
  : 'the latest searched_through among the regions\' latest completed runs'
const cons = await attempt(`You are the cross-region CONSISTENCY editor for the Protest Atlas round-4 refresh in ${REPO}. ${NO_GIT}
You may edit ONLY research/round4/<region>-{events,context,updates,upcoming,languages,lead-outcomes}.json for regions ${REGIONS.join(', ')} (screening files are append-only and should not need changes). Never edit public/, scripts/, tests/, docs/ or front-end files. Scratch work goes under ${WORK}/.
Read: research/round4/CONTRACT.md, research/round4/workflows/README.md, scripts/merge_history.py (assemble, apply_round4, write_upcoming, WINDOW_END), scripts/validate_data.py, scripts/validate_history.py, scripts/validate_upcoming.py, scripts/validate_coverage.py.
0. Clock: date -u +%Y-%m-%dT%H:%M:%SZ is MERGE_TIME; MERGE_DAY is its date. Report the current WINDOW_END from scripts/merge_history.py as current_window_end.
1. Region table: for each region read <region>-lead-outcomes.json (it may be missing: the v1 attempt left none) and report the latest run's status, the searched_through of the latest run with status "completed" (null if none) and the record counts. Regions that are blocked, incomplete or never run keep their files untouched apart from the fixes below; never delete their earlier verified records.
2. Global source IDs. Build the set merge_history will publish: seed and round-3 sources as assemble() builds them, plus every round-4 events source, update new_source and upcoming source. Every id must occur exactly once, and no upcoming source id may equal an event source id. Also list ids in public/events.json that no research file produces (a red flag; report, do not edit public/). Resolve a collision by renaming the round-4 id (prefix it with its event slug) consistently in every reference: source_ids in positions, intensity, state_response and timeline; context cities, status_basis and outcomes; update additions; upcoming source_ids; languages keys.
3. Duplicate episodes: the same country and episode in two round-4 region files, or a new round-4 episode that duplicates a seed or round-3 episode. Keep one: fold the duplicate's sourced material into the kept record (or into an update object for a round-3 episode, in that country's region file). Never lose a source and never invent a claim.
   Lead outcomes follow the records: whenever you merge, rename or remove a record, rewrite every record_refs entry in research/round4/*-lead-outcomes.json that points to it (to the kept record, or out of the list when it is removed), so that no "confirmed" outcome points to a record that no longer exists.
4. Wire chains: find sources that are the same wire story (AP, Reuters, AFP and the like republished on different sites; identical titles or bylines; "via" publishers), within one record or across records. A record whose "corroborated" level rests on one chain becomes "single-source", and its verification.note names the chain dependence.
5. Announcements past their date: for each upcoming item, last planned day = planned_end or planned_start. Keep it only if still useful: last planned day on or after MERGE_DAY (a range that started before MERGE_DAY stays only if its note says the start date has passed and occurrence is not established), or a postponed item whose sourced new date is on or after MERGE_DAY (set planned dates to that sourced date). Otherwise remove it. When a lead outcome points to it, set that outcome to "expired", remove the reference from record_refs and append to its note "announcement removed at consolidation on <MERGE_DAY>: planned date passed; occurrence not established". Never turn an announcement into an occurrence (event or update); if you suspect it took place, add it to follow_ups for a future scan.
6. "ongoing": every round-4 event with status ongoing, and every update whose status is ongoing, needs a cited source reporting continuing activity on a date within 72 hours before MERGE_TIME (last_observed_at on or after MERGE_DAY minus 3 days, and the source must support it). Otherwise set the event to "unknown" and rewrite its context status_basis text as "Activity reported on <date>; continuation after that date is not established." (keep the source_ids that support that report); for an update, set status back to the existing episode's status and remove status_basis.
7. Dry run: rm -rf ${WORK}/dryrun; mkdir -p it; tar -C ${REPO} --exclude=.git --exclude=_site --exclude=node_modules -cf - . | tar -C ${WORK}/dryrun -xf -. In the copy only, set WINDOW_END in scripts/merge_history.py to the proposed window end (below). Run python3 ${WORK}/dryrun/scripts/merge_history.py, then validate_data.py, validate_history.py, validate_upcoming.py, validate_coverage.py and any other validate_*.py present in the copy's scripts/. For each failure, fix the data cause in the REAL research/round4 files (never code), recopy and rerun, until everything passes or the remaining problem is not data-side (report it in unresolved).
Proposed window end: ${proposal}; never later than MERGE_DAY, never earlier than current_window_end, and never earlier than the latest last_observed_at of any round-4 event or update. If no region has a completed run, propose current_window_end unchanged.
Return the structured report; describe every change in findings (kind, region, ids, action taken).`,
  { label: 'consistency', phase: 'Consistency', schema: CONSISTENCY })
if (!cons) throw new Error('consistency agent failed twice; nothing was integrated')
cons.regions.forEach(r => log(`${r.key}: latest run ${r.latest_run_status}; searched through ${r.latest_completed_searched_through || '-'}; ${r.events} new episode(s), ${r.updates} update(s), ${r.upcoming} announcement(s)`))
log(`consistency: ${cons.findings.length} change(s); dry run ${cons.dryrun}; proposed WINDOW_END ${cons.proposed_window_end}`)
const completed = cons.regions.filter(r => r.latest_completed_searched_through)
const missing = REGIONS.filter(k => !completed.some(r => r.key === k))
if (missing.length) log(`regions without a completed scan (their coverage stays as before): ${missing.join(', ')}`)
if (!completed.length && !A.force) {
  log('No region has a completed scan; skipping integration. Pass force: true to merge anyway.')
  return { status: 'nothing-to-integrate', consistency: cons }
}
const MERGE_DAY = String(cons.merge_time).slice(0, 10)
if (cons.dryrun !== 'pass') log(`dry-run merge still failing (${cons.dryrun_errors.length} error(s)); integration will try data-side fixes and report the rest`)

// ---------------------------------------------------------------- 2. integrate
phase('Integrate')
const target = A.window_end || cons.proposed_window_end
const integ = await attempt(`You are the INTEGRATE step for the Protest Atlas round-4 refresh in ${REPO}. ${NO_GIT} The operator commits after reading your report.
Consistency report: ${JSON.stringify(cons)}
1. Clock: date -u +%Y-%m-%dT%H:%M:%SZ; TODAY is its date.
2. Window: the last day actually searched is ${target}. Clamp it: never later than TODAY, never earlier than the current WINDOW_END in scripts/merge_history.py. In scripts/merge_history.py set WINDOW_END to that day. If the coverage_note f-string in assemble() still hardcodes the end date ("2 Oct 2026"), replace that literal with {datetime.fromisoformat(WINDOW_END).strftime('%-d %b %Y')} so the public note follows the window. Make no other code change.
3. From ${REPO} run, in order: python3 scripts/merge_history.py; python3 scripts/validate_data.py; python3 scripts/validate_history.py; python3 scripts/validate_upcoming.py; python3 scripts/validate_coverage.py; every other scripts/validate_*.py present (for example validate_roadmap.py); python3 -m unittest discover -s tests; node --test tests/*.mjs; python3 scripts/build.py. Record each in steps.
4. A failure caused by DATA: fix it in research/round4/<region>-*.json only (never hand-edit public/*.json, which merge_history regenerates; never edit code, tests or front-end files), then rerun from merge_history onward. Data fixes remove or correct unsupported material; they never add claims, sources or records. Keep lead-outcome record_refs consistent with any record you remove, as in the consistency step. A failure that is not data-side (front-end, tests, build code, environment): do not fix it; put the command and the exact error in non_data_failures.
5. Counts, comparing the regenerated public files with git HEAD (git show HEAD:public/events.json and HEAD:public/upcoming.json): new_episodes (ids absent at HEAD), updated_episodes (ids at both whose sources, timeline, state_response, status or last_observed_at changed), announced_actions (items in public/upcoming.json), countries_touched (countries with new or updated episodes or announcements), totals.
6. Freshness: newest_evidence_day = the latest last_observed_at in the regenerated public/events.json. fresh_until = 00:00 UTC on newest_evidence_day + 3 days (YYYY-MM-DDT00:00:00Z): after it the snapshot is no longer "current" (editorial guidance §3.3), and the Pages deploy of the merge must finish before it. List in announcements_passing_before_deadline every public/upcoming.json item whose planned_end (or planned_start) is earlier than the fresh_until day ("<id> <date>"), and in ongoing_expiring every "ongoing" episode with the time its evidence turns 72 hours old ("<id> <last_observed_at + 3 days>T00:00:00Z").
7. release_note: a markdown draft to be saved as research/round4/release-notes/${MERGE_DAY}.md (the consolidate day); a release integrator later copies it into CHANGELOG.md and docs/RELEASE_EVIDENCE.md, so do not edit those files. Include the window searched (overall, and searched_through per region), the counts, notable new or updated episodes (one attributed line each, no private individuals), regions blocked or incomplete, a lead-outcome summary from research/round4/*-lead-outcomes.json, and what remains unknown (unreadable sources, countries not screened, languages not read, statuses not established, announcements not verified as occurring). State that checks were AI-assisted with no independent human editorial review. Put the unknowns in unknowns as well.`,
  { label: 'integrate', phase: 'Integrate', schema: INTEGRATE })
if (!integ) throw new Error('integrate agent failed twice; check git status for a partial merge before rerunning')
const failed = integ.steps.filter(s => s.result === 'fail')
log(`WINDOW_END ${integ.window_end_previous} -> ${integ.window_end_set}; ${integ.counts.new_episodes} new, ${integ.counts.updated_episodes} updated, ${integ.counts.announced_actions} announced; ${failed.length} failing step(s)`)
log(`newest evidence ${integ.newest_evidence_day}: the Pages deploy of the merge must finish before ${integ.fresh_until}; ${integ.announcements_passing_before_deadline.length} announcement(s) pass their date before then`)

return {
  status: failed.length ? 'integrated-with-failures' : 'integrated',
  merge_day: MERGE_DAY,
  release_note_path: `research/round4/release-notes/${MERGE_DAY}.md`,
  window_end: { previous: integ.window_end_previous, set: integ.window_end_set },
  freshness: { newest_evidence_day: integ.newest_evidence_day, deploy_before: integ.fresh_until, announcements_passing_before_deadline: integ.announcements_passing_before_deadline, ongoing_expiring: integ.ongoing_expiring },
  regions: cons.regions,
  regions_without_completed_scan: missing,
  consistency_findings: cons.findings,
  follow_ups: cons.follow_ups,
  counts: integ.counts,
  failing_steps: failed,
  non_data_failures: integ.non_data_failures,
  data_fixes: integ.data_fixes,
  release_note: integ.release_note,
  unknowns: integ.unknowns,
}
