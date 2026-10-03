export const meta = {
  name: 'atlas-region-scan-v2',
  description: 'Network preflight, lead-first sourced scan of one region with a logged clock reading per fetch, independent source and editorial verification, then apply',
  whenToUse: 'Protest Atlas round-4 refresh: run once per region (americas, europe, asia-west, asia-east-oceania, africa), then run consolidate.js',
  phases: [
    { title: 'Preflight', detail: 'probe news hosts, list region leads, check prior state' },
    { title: 'Scan', detail: 'leads in priority order, then country-group discovery' },
    { title: 'Inventory', detail: 'new or changed records compared with git HEAD' },
    { title: 'Verify', detail: 'source-fidelity re-fetch and editorial/schema skeptics' },
    { title: 'Apply', detail: 'apply verdicts, validate, close the run log' },
  ],
}

// Portable v2 of region-scan.v1.js (v1 is kept unchanged for the record). See README.md in this folder.
// No Date.now()/Math.random(): the run clock comes from args.now or the preflight agent's clock reading.

const A = (typeof args === 'string' ? JSON.parse(args) : args) || {}
if (!A.scratch) throw new Error('args.scratch is required: a writable scratch directory, e.g. "<session scratchpad>/round4"')
const REPO = String(A.repo || '/home/user/protest-atlas').replace(/\/+$/, '')
const SCRATCH = String(A.scratch).replace(/\/+$/, '')
const LEADS = A.leads_file || 'research/round4/LEADS.json'
const PRESETS = {
  americas: 'every entry with region "Americas" in public/countries.json (North, Central and South America and the Caribbean)',
  europe: 'every entry with region "Europe" in public/countries.json',
  'asia-west': 'these region "Asia" entries of public/countries.json: AE AF AM AZ BD BH BT CY GE IL IN IQ IR JO KG KW KZ LB LK MV NP OM PK PS QA SA SY TJ TM TR UZ YE (Western Asia/Middle East, South Asia, Central Asia; the catalog files Cyprus under Asia, so CY is scanned here)',
  'asia-east-oceania': 'these region "Asia" entries of public/countries.json: BN CN HK ID JP KH KP KR LA MM MN MO MY PH SG TH TL TW VN, plus every entry with region "Oceania" and the single "Antarctic" entry (AQ)',
  africa: 'every entry with region "Africa" in public/countries.json',
}
const REGION = typeof A.region === 'string' ? { key: A.region } : (A.region || {})
const KEY = REGION.key
if (!KEY || !(KEY in PRESETS)) throw new Error('args.region.key must be one of ' + Object.keys(PRESETS).join(', ') + ' (merge_history.ROUND4)')
const SCOPE = REGION.scope || PRESETS[KEY]
const LEADS_PER_AGENT = A.leads_per_agent || 6
const GROUP_SIZE = A.discovery_group_size || 18
const VERIFY_CHUNK = A.verify_chunk || 5
const PRIORITY_SET = ['P1', 'P2', 'P3']
const PRIORITIES = Array.isArray(A.lead_priorities) && A.lead_priorities.length ? A.lead_priorities.filter(x => PRIORITY_SET.includes(x)) : PRIORITY_SET
if (!PRIORITIES.length) throw new Error('args.lead_priorities must list some of ' + PRIORITY_SET.join(', '))
// apply_attempt changes only the apply prompt, so a resumed run (resumeFromRunId) reuses the cached
// preflight, scan, inventory and verify steps and runs apply live again.
const APPLY_ATTEMPT = Number(A.apply_attempt) || 0
const WORK = `${SCRATCH}/${KEY}`
const CHECKER = `${WORK}/check_region.py`
const FILES = ['events', 'context', 'updates', 'upcoming', 'languages', 'screening'].map(f => `research/round4/${KEY}-${f}.json`)
const OUTCOMES_FILE = `research/round4/${KEY}-lead-outcomes.json`
const OUTCOME_ENUM = ['confirmed', 'refuted', 'unconfirmed', 'unreachable', 'expired', 'not-attempted']

function shiftDay(day, delta) {
  let [y, m, d] = day.slice(0, 10).split('-').map(Number)
  const dim = (yy, mm) => [31, (yy % 4 === 0 && (yy % 100 !== 0 || yy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mm - 1]
  d += delta
  while (d < 1) { m -= 1; if (m < 1) { m = 12; y -= 1 } d += dim(y, m) }
  while (d > dim(y, m)) { d -= dim(y, m); m += 1; if (m > 12) { m = 1; y += 1 } }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
function balanced(list, maxSize) {
  // Even groups of at most maxSize (sizes differ by at most one).
  const groups = Math.ceil(list.length / maxSize)
  return Array.from({ length: groups }, (_, i) => list.slice(Math.floor(i * list.length / groups), Math.floor((i + 1) * list.length / groups)))
}
const RETRY_NOTE = '\n\nNOTE: an earlier attempt at this exact step stopped without returning a result. It may have written partial work: inspect the files (and this run\'s screening rows and lead outcomes) first, continue from there, and do not duplicate records or rows.'
async function attempt(prompt, opts) {
  const first = await agent(prompt, opts)
  if (first) return first
  log(`${opts.label} returned nothing; retrying once`)
  return agent(prompt + RETRY_NOTE, { ...opts, label: `${opts.label}:retry` })
}

// ---------------------------------------------------------------- region checker (tested; embedded verbatim)
const CHECKER_PY = String.raw`#!/usr/bin/env python3
"""Round-4 region checker written by research/round4/workflows/region-scan.js. Read-only; never edits files.
Usage: python3 check_region.py REPO REGION WINDOW_START WINDOW_END [--codes FR,DE] [--since RUN_ID] [--recent-from DAY]
--since: the earliest run_id whose work is being checked. Date rules (announcement date passed, stale "ongoing",
confirmed lead without a record) are errors only for records with a source read at or after it; records from
earlier runs get warnings instead, because consolidate.js removes or downgrades them. Without --since every
record is checked as new.
Exit 1 when any error is found. Prints a JSON report."""
import argparse, copy, json, re, sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ap = argparse.ArgumentParser()
for name in ('repo', 'region', 'window_start', 'window_end'):
    ap.add_argument(name)
ap.add_argument('--codes', default='')
ap.add_argument('--since', default='')
ap.add_argument('--recent-from', default='')
a = ap.parse_args()
ROOT = Path(a.repo).resolve()
sys.path.insert(0, str(ROOT / 'scripts'))
from validate_data import load_json, validate_countries, validate_event
from validate_history import validate_context
from validate_upcoming import validate_upcoming
from merge_history import REGIONS, ROUND4

NOW = datetime.now(timezone.utc)
NOW_S = NOW.isoformat(timespec='seconds').replace('+00:00', 'Z')
R3, R4 = ROOT / 'research/round3', ROOT / 'research/round4'
TS = re.compile(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z')
SLUG = re.compile(r'[a-z]{2}-[a-z0-9]+(?:-[a-z0-9]+)*-\d{8}')
OUTCOMES = {'confirmed', 'refuted', 'unconfirmed', 'unreachable', 'expired', 'not-attempted'}
UPDATE_FIELDS = {'event_id', 'last_observed_at', 'status', 'new_sources', 'timeline_additions', 'state_response_additions', 'note'}
errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def mine(sources):
    # True when the record cites a source read in the run(s) being checked (or no --since was given).
    return (not a.since) or any(isinstance(s, dict) and str(s.get('accessed_at', '')) >= a.since for s in sources or [])


def dated(own_record, msg):
    # Date rules bind this run's records; earlier runs' records are consolidate's job and must not be deleted here.
    if own_record:
        err(msg)
    else:
        warn(msg + ' [record from an earlier run: consolidate.js removes or downgrades it; never delete it to clear this warning]')


def part(region, name, default):
    path = R4 / (region + '-' + name + '.json')
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except Exception as exc:
        # Another region may be mid-write; only this region's files are errors.
        (err if region == a.region else warn)(path.name + ': invalid JSON (' + str(exc) + ')')
        return default


def run(label, fn, *args):
    try:
        fn(*args)
        return True
    except Exception as exc:
        err(label + ': ' + str(exc))
        return False


ws, we, key = a.window_start, a.window_end, a.region
ann_from = (date.fromisoformat(we) + timedelta(days=1)).isoformat()
ongoing_from = (date.fromisoformat(we) - timedelta(days=2)).isoformat()
recent_from = a.recent_from or (date.fromisoformat(we) - timedelta(days=150)).isoformat()
if key not in ROUND4:
    err('region ' + key + ' is not in merge_history.ROUND4 ' + str(ROUND4))
if not ws <= we <= NOW_S[:10]:
    err('window must satisfy window_start <= window_end <= today UTC')
catalog = validate_countries(load_json(ROOT / 'public/countries.json'))
codes = {c.strip() for c in a.codes.split(',') if c.strip()}

# Baseline episodes exactly as merge_history assembles them (seed + round-3 regions).
seeds = load_json(R3 / 'seed-events.json')
for addition in load_json(R3 / 'seed-source-additions.json'):
    base_event = next(e for e in seeds if e['id'] == addition['event_id'])
    if not any(s['id'] == addition['source']['id'] for s in base_event['sources']):
        base_event['sources'].append(addition['source'])
base = {e['id']: e for e in seeds + [e for r in REGIONS for e in load_json(R3 / (r + '-events.json'))]}
taken = {s['id']: 'existing episode ' + e['id'] for e in base.values() for s in e['sources']}
other_events = []
for r in ROUND4:
    if r == key:
        continue
    for e in part(r, 'events', []):
        other_events.append(e)
        for s in e.get('sources', []):
            taken[s['id']] = r + ' event ' + e['id']
    for u in part(r, 'updates', []):
        for s in u.get('new_sources', []):
            taken[s['id']] = r + ' update ' + str(u.get('event_id'))
    for item in part(r, 'upcoming', []):
        for s in item.get('sources', []):
            taken[s['id']] = r + ' upcoming ' + str(item.get('id'))

events = part(key, 'events', [])
contexts = part(key, 'context', [])
updates = part(key, 'updates', [])
upcoming = part(key, 'upcoming', [])
languages = part(key, 'languages', {})
screening = part(key, 'screening', [])
outcomes = part(key, 'lead-outcomes', None)
for name, value, kind in (('events', events, list), ('context', contexts, list), ('updates', updates, list),
                          ('upcoming', upcoming, list), ('languages', languages, dict), ('screening', screening, list)):
    if not isinstance(value, kind):
        err(key + '-' + name + '.json must be a JSON ' + kind.__name__)
if errors:
    print(json.dumps({'region': key, 'errors': errors, 'warnings': warnings}, indent=1))
    sys.exit(1)

# Source IDs: unique within the region and against everything merge_history will publish.
own = []
for e in events:
    for s in e.get('sources', []):
        own.append((s, 'event ' + str(e.get('id'))))
for u in updates:
    for s in u.get('new_sources', []):
        own.append((s, 'update ' + str(u.get('event_id'))))
for item in upcoming:
    for s in item.get('sources', []):
        own.append((s, 'upcoming ' + str(item.get('id'))))
seen_sources = {}
for s, where in own:
    sid = s.get('id')
    if sid in seen_sources:
        err('source id ' + str(sid) + ' used twice (' + seen_sources[sid] + '; ' + where + ')')
    if sid in taken:
        err('source id ' + str(sid) + ' (' + where + ') collides with ' + taken[sid])
    seen_sources[sid] = where

# New episodes.
event_ids = set()
for i, e in enumerate(events):
    p = key + '-events[' + str(i) + ']'
    if not run(p, validate_event, e, catalog, NOW, p):
        continue
    eid = e['id']
    if eid in event_ids or eid in base or any(o.get('id') == eid for o in other_events):
        err(p + ': duplicate episode id ' + eid)
    event_ids.add(eid)
    if not SLUG.fullmatch(eid) or eid[:2] != e['country'].lower():
        err(p + ': id must be <cc>-<topic>-<yyyymmdd> with the lowercase country code')
    if codes and e['country'] not in codes:
        err(p + ': country ' + e['country'] + ' is outside this region scope')
    if not ws <= e['last_observed_at'] <= we:
        err(p + ': last_observed_at ' + e['last_observed_at'] + ' outside window ' + ws + '..' + we)
    if e['status'] == 'planned':
        err(p + ': announced actions belong in upcoming, not events')
    if e['status'] == 'ongoing' and e['last_observed_at'] < ongoing_from:
        dated(mine(e['sources']), p + ': ongoing needs reported continuing activity on ' + ongoing_from + '..' + we)
    note = e['verification']['note']
    if not re.search(r'AI-assisted', note, re.I) or not re.search(r'no (?:independent )?human', note, re.I):
        err(p + ': verification.note must disclose AI-assisted checking and no independent human editorial review')
    for b in base.values():
        if b['country'] == e['country'] and set(b['issues']) & set(e['issues']) and b['last_observed_at'] >= recent_from:
            warn(p + ': possible duplicate of existing episode ' + b['id'] + ' (same country, shared issue); prefer an update')
run(key + '-context', validate_context,
    {'schema_version': 1, 'window_start': '2024-01-01', 'window_end': we, 'records': contexts}, {'events': events}, NOW)

# Updates are folded in by merge_history.apply_round4; simulate that and validate the merged episode.
for i, u in enumerate(updates):
    p = key + '-updates[' + str(i) + ']'
    if not isinstance(u, dict) or UPDATE_FIELDS - set(u) or set(u) - UPDATE_FIELDS - {'status_basis'}:
        err(p + ': fields must be exactly ' + str(sorted(UPDATE_FIELDS)) + ' (+ status_basis on a status change)')
        continue
    eid = u['event_id']
    if eid in event_ids:
        err(p + ': ' + eid + ' is a new episode in this region file; amend it in place instead of writing an update')
        continue
    if eid not in base:
        err(p + ': unknown episode ' + str(eid) + '; updates may only target seed/round-3 episodes')
        continue
    if codes and base[eid]['country'] not in codes:
        err(p + ': episode ' + eid + ' is outside this region scope')
    merged = copy.deepcopy(base[eid])
    merged['country_name'] = catalog[merged['country']]['name']
    merged['region'] = catalog[merged['country']]['region']
    if not ws <= u['last_observed_at'] <= we:
        err(p + ': last_observed_at outside window ' + ws + '..' + we)
    if u['last_observed_at'] < merged['last_observed_at']:
        err(p + ': last_observed_at must not move backwards from ' + merged['last_observed_at'])
    for t in u['timeline_additions']:
        if not ws <= str(t.get('date')) <= we:
            err(p + ': timeline addition dated ' + str(t.get('date')) + ' is outside the window')
    known = {s['id'] for s in merged['sources']}
    merged['sources'].extend(s for s in u['new_sources'] if s.get('id') not in known)
    if u['last_observed_at'] > merged['last_observed_at']:
        merged['last_observed_at'] = u['last_observed_at']
    merged['timeline'] = sorted(merged['timeline'] + u['timeline_additions'], key=lambda t: str(t.get('date')))
    merged['state_response'] = merged['state_response'] + u['state_response_additions']
    if u['status'] != merged['status']:
        basis = u.get('status_basis')
        if u['status'] == 'ended':
            err(p + ': updates cannot end an episode (merge cannot set end_date); describe the reported end in note/timeline')
        if not isinstance(basis, dict) or not basis.get('text') or not set(basis.get('source_ids') or []) <= {s.get('id') for s in merged['sources']}:
            err(p + ': status change needs status_basis {text, source_ids} citing this update or the episode')
        if u['status'] == 'ongoing' and u['last_observed_at'] < ongoing_from:
            dated(mine(u['new_sources']), p + ': ongoing needs reported continuing activity on ' + ongoing_from + '..' + we)
        merged['status'] = u['status']
    if merged['sources']:
        merged['last_verified'] = max(s.get('accessed_at', '') for s in merged['sources'])
    run(p + ' (merged into ' + eid + ')', validate_event, merged, catalog, NOW, p)

# Announced actions.
linked = list(base.values()) + events + other_events
envelope = {'schema_version': 1, 'generated_at': NOW_S, 'note': 'An announcement is not evidence that an action will occur.',
            'items': copy.deepcopy(upcoming)}
run(key + '-upcoming', validate_upcoming, envelope, catalog, {'events': linked}, NOW)
for i, item in enumerate(upcoming):
    p = key + '-upcoming[' + str(i) + ']'
    last_day = item.get('planned_end') or item.get('planned_start') or ''
    if last_day < ann_from:
        dated(mine(item.get('sources')), p + ': planned date ' + str(last_day) + ' is before ' + ann_from + '; an announcement must be for ' + ann_from + ' or later')
    elif str(item.get('planned_start')) < ann_from:
        warn(p + ': planned_start precedes ' + ann_from + ' (range already running); occurrence is not established')
    if codes and item.get('country') not in codes:
        err(p + ': country outside this region scope')

# Languages cover every source read.
for s, where in own:
    lang = languages.get(s.get('id'))
    if not isinstance(lang, str) or not lang.strip():
        err('languages: missing language for source ' + str(s.get('id')) + ' (' + where + ')')
for sid in set(languages) - set(seen_sources):
    warn('languages: entry ' + sid + ' does not belong to a current source')

# Provenance: one real clock reading per call; every source read in this run has a matching logged fetch.
recent = []
for i, row in enumerate(screening):
    p = key + '-screening[' + str(i) + ']'
    if not isinstance(row, dict) or {'query', 'attempted_at', 'provider', 'result_count', 'reviewed_urls', 'note'} - set(row):
        err(p + ': needs query, attempted_at, provider, result_count, reviewed_urls, note')
        continue
    t = str(row['attempted_at'])
    if t > NOW_S:
        err(p + ': attempted_at is in the future')
    if not isinstance(row['reviewed_urls'], list) or any(not str(u).startswith('https://') for u in row['reviewed_urls']):
        err(p + ': reviewed_urls must be a list of https URLs')
    if a.since and t >= a.since:
        recent.append(row)
        if not TS.fullmatch(t):
            err(p + ': attempted_at must be a real clock reading YYYY-MM-DDTHH:MM:SSZ')
        if row['provider'] in ('WebFetch', 'curl') and not {'url', 'outcome'} <= set(row):
            warn(p + ': fetch rows should carry url and outcome')
if recent:
    stamps = [r['attempted_at'] for r in recent]
    repeated = len(stamps) - len(set(stamps))
    if repeated > max(2, len(stamps) // 10):
        warn(str(repeated) + " repeated attempted_at values among this run's rows: looks like batch timestamps")
    if len(stamps) >= 6 and sum(s.endswith(':00Z') for s in stamps) > len(stamps) / 2:
        warn('most attempted_at values end in :00 seconds: looks rounded')
fetched = {}
for row in screening:
    if isinstance(row, dict) and row.get('provider') in ('WebFetch', 'curl'):
        for url in row.get('reviewed_urls') or []:
            fetched.setdefault(url, set()).add(row.get('attempted_at'))
for s, where in own:
    if a.since and str(s.get('accessed_at', '')) >= a.since:
        if s.get('accessed_at') not in fetched.get(s.get('url'), set()):
            err('source ' + str(s.get('id')) + ' (' + where + '): accessed_at has no logged fetch row of the same URL at that exact time')

# Lead outcomes.
if outcomes is not None:
    if not isinstance(outcomes, dict) or not {'schema_version', 'region', 'runs', 'outcomes'} <= set(outcomes):
        err(key + '-lead-outcomes.json needs schema_version, region, runs, outcomes')
    else:
        refs = {('event', e.get('id')) for e in events} | {('update', u.get('event_id')) for u in updates} | {('upcoming', x.get('id')) for x in upcoming}
        for j, o in enumerate(outcomes['outcomes']):
            p = key + '-lead-outcomes.outcomes[' + str(j) + ']'
            if o.get('outcome') not in OUTCOMES:
                err(p + ': outcome must be one of ' + str(sorted(OUTCOMES)))
            live = [r for r in o.get('record_refs') or [] if (r.get('record_type'), r.get('id')) in refs]
            if o.get('outcome') == 'confirmed' and not live:
                (err if (not a.since or str(o.get('run_id', '')) >= a.since) else warn)(
                    p + ': confirmed lead ' + str(o.get('lead_id')) + ' (run ' + str(o.get('run_id')) + ') points to no current record')
counts = {'events': len(events), 'contexts': len(contexts), 'updates': len(updates), 'upcoming': len(upcoming),
          'own_sources': len(own), 'screening_rows': len(screening), 'rows_since_run_start': len(recent)}
print(json.dumps({'region': key, 'window': [ws, we], 'since': a.since or None, 'errors': errors, 'warnings': warnings, 'counts': counts}, indent=1))
sys.exit(1 if errors else 0)`
const ENSURE_CHECKER = `The region checker lives at ${CHECKER}. If that file is missing or empty (test -s), create its directory and write the text between the CHECK_REGION_PY markers below to it verbatim, then run python3 -m py_compile on it. Never edit it to make errors disappear.
<<<CHECK_REGION_PY
${CHECKER_PY}
CHECK_REGION_PY`

// ---------------------------------------------------------------- schemas
const PREFLIGHT = { type: 'object', properties: {
  clock_utc: { type: 'string' },
  status: { type: 'string', enum: ['ok', 'degraded', 'blocked'] },
  fetch_method: { type: 'string', enum: ['webfetch', 'curl', 'both', 'none'] },
  websearch: { type: 'string', enum: ['ok', 'failed', 'unavailable'] },
  probes: { type: 'array', items: { type: 'object', properties: {
    url: { type: 'string' }, method: { type: 'string' }, attempted_at: { type: 'string' },
    result: { type: 'string', enum: ['works', 'blocked', 'site-refused', 'error'] }, detail: { type: 'string' } },
    required: ['url', 'method', 'attempted_at', 'result', 'detail'] } },
  region_codes: { type: 'array', items: { type: 'string' } },
  leads_file_status: { type: 'string', enum: ['found', 'missing', 'invalid'] },
  leads: { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string' }, priority: { type: 'string' }, kind: { type: 'string' }, country: { type: 'string' },
    expires_on: { type: ['string', 'null'] }, expired: { type: 'boolean' } },
    required: ['id', 'priority', 'kind', 'country', 'expires_on', 'expired'] } },
  prior_state: { type: 'string' },
  baseline_checker: { type: 'string' },
  notes: { type: 'string' },
}, required: ['clock_utc', 'status', 'fetch_method', 'websearch', 'probes', 'region_codes', 'leads_file_status', 'leads', 'prior_state', 'baseline_checker', 'notes'] }

const TOUCHED = { type: 'array', items: { type: 'object', properties: {
  record_type: { type: 'string', enum: ['event', 'update', 'upcoming'] }, id: { type: 'string' },
  change: { type: 'string', enum: ['new', 'amended'] } }, required: ['record_type', 'id', 'change'] } }

const SCAN = { type: 'object', properties: {
  lead_outcomes: { type: 'array', items: { type: 'object', properties: {
    lead_id: { type: 'string' }, outcome: { type: 'string', enum: OUTCOME_ENUM },
    record_refs: { type: 'array', items: { type: 'string' } }, note: { type: 'string' } },
    required: ['lead_id', 'outcome', 'record_refs', 'note'] } },
  touched: TOUCHED,
  countries_searched: { type: 'array', items: { type: 'string' } },
  searches: { type: 'number' }, fetch_attempts: { type: 'number' }, pages_read: { type: 'number' }, failed_fetches: { type: 'number' },
  checker: { type: 'string', enum: ['pass', 'fail'] }, checker_errors: { type: 'array', items: { type: 'string' } },
  notes: { type: 'string' },
}, required: ['lead_outcomes', 'touched', 'countries_searched', 'searches', 'fetch_attempts', 'pages_read', 'failed_fetches', 'checker', 'checker_errors', 'notes'] }

const INVENTORY = { type: 'object', properties: {
  files_ok: { type: 'boolean' }, parse_errors: { type: 'array', items: { type: 'string' } },
  records: { type: 'array', items: { type: 'object', properties: {
    record_type: { type: 'string', enum: ['event', 'update', 'upcoming'] }, id: { type: 'string' },
    change: { type: 'string', enum: ['new', 'amended', 'removed'] } }, required: ['record_type', 'id', 'change'] } },
  checker_errors: { type: 'array', items: { type: 'string' } }, checker_warnings: { type: 'array', items: { type: 'string' } },
  counts: { type: 'object', properties: { events: { type: 'number' }, updates: { type: 'number' }, upcoming: { type: 'number' }, sources: { type: 'number' } },
    required: ['events', 'updates', 'upcoming', 'sources'] },
}, required: ['files_ok', 'parse_errors', 'records', 'checker_errors', 'checker_warnings', 'counts'] }

const VERDICTS = { type: 'object', properties: {
  lens: { type: 'string' },
  verdicts: { type: 'array', items: { type: 'object', properties: {
    record_type: { type: 'string', enum: ['event', 'update', 'upcoming'] }, id: { type: 'string' },
    verdict: { type: 'string', enum: ['keep', 'fix', 'drop'] },
    reasons: { type: 'array', items: { type: 'string' } }, corrections: { type: 'array', items: { type: 'string' } } },
    required: ['record_type', 'id', 'verdict', 'reasons', 'corrections'] } },
  fetch_log: { type: 'array', items: { type: 'object', properties: {
    url: { type: 'string' }, attempted_at: { type: 'string' }, method: { type: 'string', enum: ['WebFetch', 'curl'] },
    outcome: { type: 'string', enum: ['read', 'partial', 'blocked', 'http-error', 'paywalled', 'irrelevant'] }, note: { type: 'string' } },
    required: ['url', 'attempted_at', 'method', 'outcome', 'note'] } },
  general_notes: { type: 'string' },
}, required: ['lens', 'verdicts', 'fetch_log', 'general_notes'] }

const N = { type: 'number' }
const APPLIED = { type: 'object', properties: {
  kept: { type: 'array', items: { type: 'string' } }, fixed: { type: 'array', items: { type: 'string' } },
  dropped: { type: 'array', items: { type: 'string' } }, reverted: { type: 'array', items: { type: 'string' } },
  restored: { type: 'array', items: { type: 'string' } },
  validation: { type: 'string', enum: ['pass', 'fail'] }, checker_errors: { type: 'array', items: { type: 'string' } },
  screening_rows_appended: N, run_status: { type: 'string', enum: ['completed', 'incomplete'] },
  lead_outcomes: { type: 'object', properties: { confirmed: N, refuted: N, unconfirmed: N, unreachable: N, expired: N, not_attempted: N },
    required: ['confirmed', 'refuted', 'unconfirmed', 'unreachable', 'expired', 'not_attempted'] },
  final_counts: { type: 'object', properties: {
    events_total: N, events_new_this_run: N, events_amended_this_run: N, updates_total: N, updates_this_run: N,
    upcoming_total: N, upcoming_this_run: N, pages_read_this_run: N },
    required: ['events_total', 'events_new_this_run', 'events_amended_this_run', 'updates_total', 'updates_this_run', 'upcoming_total', 'upcoming_this_run', 'pages_read_this_run'] },
  notes: { type: 'string' },
}, required: ['kept', 'fixed', 'dropped', 'reverted', 'restored', 'validation', 'checker_errors', 'screening_rows_appended', 'run_status', 'lead_outcomes', 'final_counts', 'notes'] }

// ---------------------------------------------------------------- 0. preflight
phase('Preflight')
const hintStart = A.window_start || '2026-09-18'
const hintEnd = A.window_end || 'the day before your clock reading (UTC)'
const pre = await attempt(`You are the PREFLIGHT step of a protest-research workflow for region "${KEY}" in the git repository ${REPO}. Do not spawn agents. Never run git commit, push, checkout, stash or reset (read-only git such as git show/diff/log is fine).
1. Clock: run date -u +%Y-%m-%dT%H:%M:%SZ and return the exact output as clock_utc. It becomes this run's run_id.
2. Network probe. Load WebFetch and WebSearch with ToolSearch ("select:WebFetch,WebSearch"). For each URL below, read the clock immediately before the call, then WebFetch it: https://apnews.com/hub/protests , https://www.bbc.com/news/world , https://www.aljazeera.com/news/ . Then probe the same three URLs with curl, one Bash command each: ts=$(date -u +%Y-%m-%dT%H:%M:%SZ); curl -sS -L --max-time 25 -o /dev/null -w '%{http_code} %{size_download}' URL; echo " $ts". Use the environment's proxy settings as they are: never pass -k/--insecure and never unset proxy variables. Classify each probe: "works" = HTTP 200 with substantive page text; "blocked" = the environment refused it (e.g. EGRESS_BLOCKED, proxy 403/407, CONNECT refused, DNS failure, empty body); "site-refused" = the site's own bot wall or 401/403; "error" = anything else. Then run one WebSearch for recent protest news in this region to see whether search works.
   status = "blocked" when no probe "works" with either method; otherwise "ok", or "degraded" when fetching works but WebSearch does not. fetch_method = the method(s) with at least one working probe ("webfetch", "curl", "both"; "none" when blocked). If /root/.ccr/README.md exists you may read it and run curl -sS "$HTTPS_PROXY/__agentproxy/status" to explain a block; quote the decisive line in notes.
3. Region codes: with a short python script over ${REPO}/public/countries.json, list every catalog code in this scope: ${SCOPE}. Return them sorted as region_codes.
4. Leads: read ${REPO}/${LEADS} if it exists (leads_file_status found, missing or invalid). Select leads whose country is in region_codes (country is authoritative; use the lead's region field only when it has no valid country) and whose priority is ${PRIORITIES.join(' or ')}${PRIORITIES.length < 3 ? ' (this run is limited to those priorities: in notes, say how many region leads of other priorities were left out)' : ''}. Order them: priority P1, then P2, then P3; within a priority, leads not yet expired (expires_on null or on/after today UTC) before expired ones, then soonest expires_on first (null last), then announced-action kinds before other kinds, then id. Return them in that order (country "" when missing). In notes, name any lead whose region field is "${KEY}" but whose country is outside region_codes.
5. Prior state (read-only): for ${FILES.join(', ')} and ${OUTCOMES_FILE}, report in prior_state whether each exists and parses, its record count, and how many records are already committed (git -C ${REPO} show HEAD:<path>). Earlier runs' records must survive this run.
6. Only if status is "blocked": append a run entry to ${REPO}/${OUTCOMES_FILE} (create it as {"schema_version":1,"region":"${KEY}","runs":[],"outcomes":[]} if missing; keep everything already there; write JSON with indent=2, ensure_ascii=False): {"run_id":<clock_utc>,"started_at":<clock_utc>,"finished_at":<a fresh clock reading>,"status":"blocked","window_start":null,"window_end":null,"searched_through":null,"preflight":{"status":"blocked","fetch_method":"none","websearch":<result>},"leads_file":"${LEADS}","verified_record_ids":[],"dropped_record_ids":[],"note":<one line: what was blocked and how you know>}. Write nothing else anywhere in the repository. When not blocked, write nothing in the repository.
7. ${ENSURE_CHECKER}
   Then run it once as a baseline: python3 ${CHECKER} ${REPO} ${KEY} ${hintStart} <window end: ${hintEnd}> --codes <region_codes joined by commas>. Report the exit status and the error count in baseline_checker (pre-existing errors are information, not yours to fix).`,
  { label: `preflight:${KEY}`, phase: 'Preflight', schema: PREFLIGHT })
if (!pre) throw new Error(`preflight:${KEY} failed twice; nothing was scanned`)
const RUN_ID = pre.clock_utc
const TODAY = RUN_ID.slice(0, 10)
log(`${KEY}: preflight ${pre.status} (fetch ${pre.fetch_method}, search ${pre.websearch}); ${pre.region_codes.length} countries; ${pre.leads.length} leads (${pre.leads_file_status})`)
if (pre.status === 'blocked') {
  log(`${KEY}: news hosts are blocked from this environment; region stopped before scanning. Fix network access and rerun this region.`)
  return { region: KEY, status: 'blocked', run_id: RUN_ID, preflight: pre }
}
if (!pre.region_codes.length) throw new Error(`${KEY}: preflight returned no region codes for scope: ${SCOPE}`)

const NOW = A.now || RUN_ID
let W_END = A.window_end || shiftDay(NOW, -1)
if (W_END > TODAY) { log(`${KEY}: window_end ${W_END} is after today ${TODAY}; clamped`); W_END = TODAY }
const W_START = A.window_start || '2026-09-18'
if (W_START > W_END) throw new Error(`window_start ${W_START} is after window_end ${W_END}`)
const ANN_FROM = shiftDay(W_END, 1)
const ONGOING_FROM = shiftDay(W_END, -2)
const RECENT_FROM = A.recent_from || shiftDay(W_END, -150)
const CODES = [...pre.region_codes].sort()
const CODES_CSV = CODES.join(',')
const CHECK_CMD = `python3 ${CHECKER} ${REPO} ${KEY} ${W_START} ${W_END} --codes ${CODES_CSV} --since ${RUN_ID} --recent-from ${RECENT_FROM}`
const FETCH_HINT = pre.fetch_method === 'curl'
  ? 'WebFetch did not work in preflight: read pages with curl (-sS -L --max-time 30, proxy settings untouched, never -k) and extract the article text with a small python html.parser script under ' + WORK + '/; read that extracted text before citing.'
  : pre.fetch_method === 'webfetch' ? 'Use WebFetch to read pages (curl did not work in preflight).' : 'WebFetch is the default reader; curl plus text extraction is a fallback.'
const RUN_ENTRY = `{"run_id":"${RUN_ID}","started_at":"${RUN_ID}","finished_at":null,"status":"in-progress","window_start":"${W_START}","window_end":"${W_END}","searched_through":null,"preflight":{"status":"${pre.status}","fetch_method":"${pre.fetch_method}","websearch":"${pre.websearch}"},"leads_file":"${LEADS}","verified_record_ids":[],"dropped_record_ids":[],"note":""}`

const COMMON = `SCOPE AND WINDOW
- Region "${KEY}": ${SCOPE}. Catalog codes: ${CODES.join(' ')}. Current UTC time is about ${NOW}; run_id ${RUN_ID}.
- Occurrences: activity that a source reports as occurring between ${W_START} and ${W_END} inclusive (UTC days). Announced actions: planned date on or after ${ANN_FROM}. Status "ongoing" only when a source explicitly reports activity continuing on a date from ${ONGOING_FROM} to ${W_END}, with last_observed_at set to that reported date. These dates replace the fixed dates printed in research/round4/CONTRACT.md; everything else in that contract applies.
- Read first: research/round4/CONTRACT.md (all of it), research/round3/CONTRACT.md (context object), scripts/validate_data.py (validate_event), scripts/validate_history.py (validate_context), scripts/validate_upcoming.py, research/round4/workflows/README.md (lead-outcomes file), and two or three records of public/events.json and public/event-context.json to copy exact shapes.
FILES
- You may write only ${FILES.join(', ')} and ${OUTCOMES_FILE} in ${REPO}. Helper scripts and logs go under ${WORK}/. Do not spawn agents. Never run git commit, push, checkout, stash or reset; read-only git is fine.
- Append-safe: read every file before writing. Records already present (earlier runs, earlier steps of this run) stay; never delete or rewrite them except to amend an episode with newer sourced reporting. Screening rows are append-only. Write JSON atomically (dump to <file>.tmp, then os.replace) with indent=2 and ensure_ascii=False, and checkpoint after every record you finish.
- Run log: if ${OUTCOMES_FILE} has no run entry with run_id "${RUN_ID}", append this one to its "runs" (create the file as {"schema_version":1,"region":"${KEY}","runs":[],"outcomes":[]} if missing): ${RUN_ENTRY}
- Existing episodes: before creating an episode, look for the same country and issue in public/events.json, research/round3/*-events.json and research/round4/*-events.json. A seed/round-3 episode gets an update object in ${KEY}-updates.json (one object per event_id: if one exists, append to it and keep last_observed_at the later date). An episode already in ${KEY}-events.json is amended in place (append sources, timeline, state_response; move last_observed_at forward; last_verified = max accessed_at). An update may not set status "ended" (the merge cannot set end_date); an update that changes status to "ongoing" needs "status_basis": {"text", "source_ids"}.
FETCH AND PROVENANCE PROTOCOL (the previous run was rejected for batch-level and rounded timestamps)
- Load WebSearch and WebFetch with ToolSearch ("select:WebSearch,WebFetch"). ${FETCH_HINT}
- Immediately before EVERY WebSearch, WebFetch or curl call, read the real clock with date -u +%Y-%m-%dT%H:%M:%SZ (for curl, inside the same Bash command). That reading is the call's attempted_at, at full seconds precision. Never round it, never reuse one reading for two calls, never reconstruct or backdate it later. Tip: one Bash call can append the previous call's row to your JSONL log and print the clock for the next call.
- One screening row per call in ${KEY}-screening.json: {"query": exact search text, or "FETCH <url>", "attempted_at", "provider": "WebSearch" | "WebFetch" | "curl", "result_count": results returned (fetch: 1 when text came back, else 0), "reviewed_urls": [the URL, only if you actually read its text], "note": what it gave or why it failed (language used, lead id if any), "codes": [country codes concerned]} and, for fetches, also "url" and "outcome": "read" | "partial" | "blocked" | "http-error" | "paywalled" | "irrelevant". Log failures too. Keep a JSONL log under ${WORK}/ and flush it into the screening file at every checkpoint, at least every ~10 calls and before you return.
- A cited source's accessed_at is copied exactly from the attempted_at of the logged fetch row in which you read that page. A time with no matching row is not allowed.
EVIDENCE AND SAFETY RULES
- Deep-read every page you cite. Search snippets, lead summaries, aggregator blurbs and headlines are leads, never sources. If a page cannot be opened, find another outlet's report you can read, or leave the claim out. Partial or paywalled text: claims only from the text you saw.
- Syndicated wire copies (AP, Reuters, AFP, dpa, EFE, ANSA, Xinhua and the like, on any site) are ONE reporting chain, not independent corroboration. "corroborated" needs at least two independent chains; state any wire-chain dependence in verification.note. Wikipedia never stands as sole evidence.
- Every verification.note says: AI-assisted source check, no independent human editorial review, and what remains unknown.
- No private individuals: name only public officials, public figures, organisations and institutions, never participants, bystanders, or injured or detained private people. No faces, meeting points, routes, street addresses or clock times. Announcements stay at city and day level; announced_by is a collective or public institution; an announcement is not evidence of occurrence, size or legality.
- positions: a named collective actor or institution, stance support/oppose/mixed/unclear toward a NAMED target, and an attributed claim. Officials are not counter-demonstrators; no national-popularity inference. state_response: attributed actions; arrest, injury and death counts quoted from their attributed source and approximate where it is. Turnout bounds null unless a source gives an attributed estimate (competing estimates go in the qualifier). start_date null with precision unknown unless a source establishes onset.
- Quality before quantity. Never invent URLs, titles, dates, numbers or quotes.
VALIDATION
- ${ENSURE_CHECKER}
- Run: ${CHECK_CMD}
  Fix every error in records you wrote, by correcting them from what you read or by removing the unsupported claim or record. Errors in records you did not touch go in notes; do not delete other runs' records to silence them. Warnings marked "record from an earlier run" (a passed announcement date, a stale "ongoing") belong to consolidate.js: leave those records as they are. Resolve or explain every possible-duplicate warning.
RETURN honest counts: pages_read counts only pages whose text you actually read; touched lists every record you created or amended.`

// ---------------------------------------------------------------- 1. scan: leads first, then discovery
phase('Scan')
const leadChunks = chunk(pre.leads, LEADS_PER_AGENT)
const groups = balanced(CODES, GROUP_SIZE)
const scans = []
for (let i = 0; i < leadChunks.length; i++) {
  const mine = leadChunks[i]
  const res = await attempt(`You are a careful, skeptical protest-reporting researcher: SCAN step, leads batch ${i + 1}/${leadChunks.length}, region "${KEY}", repository ${REPO}.
${COMMON}
YOUR LEADS, in this exact order (work them in order; if you run out of room, stop and mark the rest "not-attempted"): ${JSON.stringify(mine)}
For each lead, read its full entry in ${REPO}/${LEADS} (summary, claimed_dates, planned_start, outlets_or_urls, cautions, existing_event_id, expires_on). Fetch and deep-read the named outlets/URLs first (logging each call), then search for independent reporting. Respect the lead's cautions; a lead is never evidence and its wording must not be copied into records. Decide one outcome:
- confirmed: read reporting establishes it under these rules. Write or amend the record(s): an existing_event_id or matching published episode gets an update (or an in-place amendment if the episode is in ${KEY}-events.json); a dated future action gets an upcoming item; otherwise a new episode with its context record.
- refuted: read reporting contradicts it (wrong date, place or actor; did not happen; ended before the window). Write no record.
- unconfirmed: you read relevant pages but they do not establish it to this standard. Write no record.
- unreachable: every attempt to open the relevant pages failed (each failure logged).
- expired: an announced action whose planned date is before ${ANN_FROM} with no read reporting that it occurred inside the window. If read reporting shows it did occur inside the window, record the occurrence (episode or update) and mark it confirmed.
Record each decision in ${OUTCOMES_FILE} "outcomes" as {"lead_id","run_id":"${RUN_ID}","outcome","record_refs":[{"record_type":"event"|"update"|"upcoming","id"}],"checked_at":<clock reading when you decided>,"urls_read":[...],"urls_failed":[...],"note":<one or two sentences: what the reading established and what it did not>} (replace an existing entry with the same lead_id and run_id; keep entries from other runs). In the returned lead_outcomes, write record_refs as "event:<id>", "update:<event_id>" or "upcoming:<id>".`,
    { label: `leads:${KEY}:${i + 1}/${leadChunks.length}`, phase: 'Scan', schema: SCAN })
  scans.push({ step: `leads ${i + 1}`, result: res })
  if (!res) log(`${KEY}: leads batch ${i + 1} failed twice; its leads stay unworked: ${mine.map(l => l.id).join(', ')}`)
}
const leadIds = pre.leads.map(l => l.id)
for (let g = 0; g < groups.length; g++) {
  const codes = groups[g]
  const res = await attempt(`You are a careful, skeptical protest-reporting researcher: SCAN step, discovery group ${g + 1}/${groups.length}, region "${KEY}", repository ${REPO}.
${COMMON}
YOUR COUNTRIES: ${codes.join(' ')}.
${g === 0 ? 'First run 6 to 10 region-wide searches for the largest and most-reported protest, strike and demonstration activity in the window and for announced actions (English plus at least two major languages of the region), and follow big episodes in any country of the region.\n' : ''}Then screen EVERY country listed with at least one window-specific search (more for large or turbulent countries), in English and, where a substantial local-language press exists, in that language too (name the language in the row note). Look beyond the anglophone press: regional outlets, wire services, union, organiser and official statements. For each of your countries also look for newer reporting on recent existing episodes (public/events.json with last_observed_at on or after ${RECENT_FROM}) and on episodes already in ${KEY}-events.json, and write updates or amendments instead of duplicates.
Leads were worked earlier in this run (${leadIds.length ? leadIds.join(', ') : 'none'}): do not redo them, and do not rewrite records that already exist; amend them only with new read reporting. Deep-read before writing anything. Work target for the whole region: roughly 4 to 10 well-sourced new episodes and every announcement you can source; this is a target, not a reason to lower standards. Return countries_searched as the codes you actually searched, and an empty lead_outcomes array.`,
    { label: `discover:${KEY}:${g + 1}/${groups.length}`, phase: 'Scan', schema: SCAN })
  scans.push({ step: `discovery ${g + 1}`, result: res })
  if (!res) log(`${KEY}: discovery group ${g + 1} failed twice; not screened this run: ${codes.join(' ')}`)
}
const okScans = scans.map(s => s.result).filter(Boolean)
const discoveryComplete = scans.filter(s => s.step.startsWith('discovery')).every(s => s.result)
const outcomeMap = {}
okScans.forEach(s => s.lead_outcomes.forEach(o => { outcomeMap[o.lead_id] = o }))
const unworked = leadIds.filter(id => !outcomeMap[id])
if (unworked.length) log(`${KEY}: ${unworked.length} lead(s) have no outcome and count as not-attempted: ${unworked.join(', ')}`)
const searched = new Set(okScans.flatMap(s => s.countries_searched))
const unscreened = CODES.filter(c => !searched.has(c))
if (unscreened.length) log(`${KEY}: countries without a logged search this run: ${unscreened.join(' ')}`)
const sum = k => okScans.reduce((n, s) => n + (Number(s[k]) || 0), 0)
log(`${KEY}: scan read ${sum('pages_read')} pages from ${sum('fetch_attempts')} fetch attempts and ${sum('searches')} searches`)

// ---------------------------------------------------------------- 2. inventory against git HEAD
phase('Inventory')
const inv = await attempt(`INVENTORY step (read-only) for region "${KEY}" in ${REPO}. Do not edit anything in the repository and do not spawn agents. Never run git commit, push, checkout, stash or reset.
Write a python script ${WORK}/inventory.py that, for research/round4/${KEY}-events.json (records keyed by id), ${KEY}-updates.json (keyed by event_id) and ${KEY}-upcoming.json (keyed by id), compares the working-tree JSON with the committed version (git -C ${REPO} show HEAD:<path>; a path missing at HEAD counts as empty) and lists each record as change "new" (absent at HEAD), "amended" (present but different; for events, compare together with the matching ${KEY}-context.json record) or "removed" (at HEAD but no longer in the file). Unchanged records are not listed. Also report whether all seven region files (${FILES.join(', ')}, ${OUTCOMES_FILE}) parse.
${ENSURE_CHECKER}
Then run: ${CHECK_CMD}
Return the lists, the checker's errors and warnings verbatim, and counts (events, updates, upcoming, sources across the three record files).`,
  { label: `inventory:${KEY}`, phase: 'Inventory', schema: INVENTORY, effort: 'low' })
let targets
if (inv) {
  targets = inv.records.filter(r => r.change !== 'removed')
} else {
  log(`${KEY}: inventory failed; falling back to the scanners' own touched lists`)
  const seen = new Set()
  targets = okScans.flatMap(s => s.touched).filter(t => !seen.has(`${t.record_type}:${t.id}`) && seen.add(`${t.record_type}:${t.id}`))
}
const removed = inv ? inv.records.filter(r => r.change === 'removed') : []
if (removed.length) log(`${KEY}: ${removed.length} committed record(s) disappeared during the scan; apply will restore them unless a verifier drops them`)
log(`${KEY}: ${targets.length} new or amended record(s) to verify`)

// ---------------------------------------------------------------- 3. independent verification
phase('Verify')
const WINDOW_LINE = `Window: occurrences ${W_START}..${W_END}; announcements planned on or after ${ANN_FROM}; "ongoing" only with continuing activity explicitly reported on ${ONGOING_FROM}..${W_END}.`
const RECORD_FILES = `research/round4/${KEY}-events.json (with ${KEY}-context.json), ${KEY}-updates.json and ${KEY}-upcoming.json`
let verdicts = []
let unverified = []
if (targets.length) {
  const chunks = chunk(targets, VERIFY_CHUNK)
  const sourceJobs = chunks.map((c, i) => () => attempt(`You are an adversarial SOURCE-FIDELITY verifier (${i + 1}/${chunks.length}) for region "${KEY}" in ${REPO}. Do NOT edit repository files; scratch work goes under ${WORK}/verify-sources-${i + 1}/. Do not spawn agents. Never run git commit, push, checkout, stash or reset. Load WebFetch and WebSearch with ToolSearch ("select:WebFetch,WebSearch"). Fetch method from preflight: ${pre.fetch_method}.
Read research/round4/CONTRACT.md. ${WINDOW_LINE}
Records to verify (new, or amended relative to git HEAD; for an amended record verify what changed, seen with git -C ${REPO} diff HEAD -- <file>): ${JSON.stringify(c)}
They live in ${RECORD_FILES}.
For EVERY cited source of those records: read the clock (date -u +%Y-%m-%dT%H:%M:%SZ) immediately before each fetch and put the call in fetch_log with that exact reading; fetch the URL yourself and read it. Confirm the page exists and concerns this country and episode; publisher, title and published_at are right; reported activity dates fall inside the window (events, updates) or the planned date is on or after ${ANN_FROM} (upcoming); and every claim (summary, positions with stance and target, turnout, disruption and violence text, state_response including counts, timeline entries, cities, outcomes, status_basis, announced action, date and announcer) is supported by text you read. Flag invented or rounded numbers, misattributed actors, syndicated copies presented as independent corroboration, "ongoing" without explicit continuing activity, private individuals' names, and claims that look lifted from search snippets rather than the page.
If a source will not open, retry once (both attempts in fetch_log); still unreadable means its claims are unconfirmed: verdict "fix" when they can be removed or softened and the record survives on other read sources, otherwise "drop". Corrections must be concrete: field path, old -> new, and the source that supports the new text. Default to "drop" when a record's core claim is not supported by text you read.`,
    { label: `verify-sources:${KEY}:${i + 1}/${chunks.length}`, phase: 'Verify', schema: VERDICTS }))
  const editorialJob = () => attempt(`You are an adversarial EDITORIAL + SCHEMA + PROVENANCE verifier for region "${KEY}" in ${REPO}. Do NOT edit repository files; scratch work goes under ${WORK}/verify-editorial/. Do not spawn agents. Never run git commit, push, checkout, stash or reset.
Read research/round4/CONTRACT.md, research/round3/CONTRACT.md, docs/EDITORIAL_POLICY.md, scripts/validate_data.py, scripts/validate_history.py, scripts/validate_upcoming.py and research/round4/workflows/README.md. ${WINDOW_LINE}
Records to verify (new or amended relative to git HEAD): ${JSON.stringify(targets)}. Records removed relative to HEAD: ${JSON.stringify(removed)}. They live in ${RECORD_FILES}; lead decisions for run ${RUN_ID} are in ${OUTCOMES_FILE}; the call log is ${KEY}-screening.json.
${ENSURE_CHECKER}
Run: ${CHECK_CMD} and turn every error that concerns a listed record into a verdict reason.
Then check each listed record for: duplicates of existing episodes (public/events.json, research/round3 and other round-4 region files: same country and issue should be an update or amendment); status rules for this window (ended needs end_date and a sourced status_basis; updates cannot end episodes); stance/target logic (stance toward a named target; officials are not counter-demonstrators; no national-popularity inference); privacy (no private individuals, faces, meeting points, routes, addresses or clock times); upcoming items (exact contract fields, city/day level, announced_by is a collective or institution, an announcement is not an occurrence); honest verification notes (AI-assisted, no independent human editorial review, wire-chain dependence stated, "corroborated" only with two independent chains); provenance (each cited source has a logged fetch row of the same URL with attempted_at equal to its accessed_at; this run's rows carry their own second-precision clock readings, with no batch-shared or rounded times; reviewed_urls lists only pages read; no claim rests on a page that was never read); and lead outcomes for run ${RUN_ID} (a confirmed lead points to a record that exists; a refuted or unconfirmed lead has a note saying what was read). Verdict per record keep, fix or drop, with concrete corrections (field path, old -> new). Leave fetch_log empty unless you fetched something (then log it with clock readings).`,
    { label: `verify-editorial:${KEY}`, phase: 'Verify', schema: VERDICTS })
  const results = await parallel([...sourceJobs, editorialJob])
  results.forEach((r, i) => {
    if (r) { verdicts.push(r); return }
    const missing = i < chunks.length ? chunks[i] : targets
    log(`${KEY}: ${i < chunks.length ? `source verifier ${i + 1}` : 'editorial verifier'} failed twice; ${missing.length} record(s) count as unverified and will be dropped or reverted`)
    unverified.push(...missing)
  })
  const tally = { keep: 0, fix: 0, drop: 0 }
  verdicts.forEach(v => v.verdicts.forEach(x => { tally[x.verdict] += 1 }))
  log(`${KEY}: verdicts keep ${tally.keep}, fix ${tally.fix}, drop ${tally.drop}`)
} else {
  log(`${KEY}: nothing new or amended; verification skipped`)
}

// ---------------------------------------------------------------- 4. apply
phase('Apply')
const applied = await attempt(`You own research/round4/${KEY}-*.json in ${REPO}: the six region files and ${OUTCOMES_FILE}. Edit nothing else. Do not spawn agents. Never run git commit, push, checkout, stash or reset.
${WINDOW_LINE}
Inventory (relative to git HEAD): ${JSON.stringify(inv ? inv.records : targets)}
Verdicts from independent verifiers: ${JSON.stringify(verdicts)}
Unverified records (a verifier failed twice): ${JSON.stringify(unverified)}
Apply strictly:
1. "drop" from EITHER verifier, or listed as unverified: remove a new record together with its context record, its sources' language entries, and any upcoming event_id that points to it (set to null). For an amended record that exists at HEAD, revert it to its HEAD version (git -C ${REPO} show HEAD:<path>) instead of deleting it.
2. "fix": apply every concrete correction. If a correction needs a claim you cannot support from text that was read, remove that claim (or the record). When one verifier says keep and the other fix, apply the fix.
3. Records removed relative to HEAD that no verifier dropped: restore them from HEAD (earlier runs' verified records are kept).
4. Append every verifier fetch_log entry to ${KEY}-screening.json as {"query":"FETCH <url>","attempted_at":<as logged, unchanged>,"provider":<method>,"result_count":1 if text came back else 0,"reviewed_urls":[<url>] only when outcome is read or partial,"note":"verification re-fetch (<lens>): <note>","url":<url>,"outcome":<outcome>}. When a correction rewrites a claim on the strength of a verifier's read, you may set that source's accessed_at to the verifier's logged time for that URL, then recompute last_verified.
5. Lead outcomes for run ${RUN_ID}: a confirmed lead whose records were all dropped becomes "unconfirmed" with a note saying why; every lead of this run without an entry gets "not-attempted". Leads of this run: ${JSON.stringify(leadIds)}.
6. ${ENSURE_CHECKER}
   Validate with: ${CHECK_CMD}
   Repeat fixes (removing, never inventing) until it reports no errors, or explain what remains. Warnings marked "record from an earlier run" are for consolidate.js: never delete or rewrite earlier runs' records to clear them.
7. Close this run's entry in ${OUTCOMES_FILE} "runs" (run_id ${RUN_ID}; create it from ${RUN_ENTRY} if missing): finished_at = a fresh clock reading; status "completed" only if the checker passes and discovery covered every country group (${discoveryComplete ? 'it did' : 'it did NOT'}), otherwise "incomplete"; searched_through = "${W_END}" when completed, else null; verified_record_ids = surviving records new or amended in this run ("event:<id>", "update:<event_id>", "upcoming:<id>"); dropped_record_ids likewise; note = one line on coverage limits${unscreened.length ? ` (countries not screened this run: ${unscreened.join(' ')})` : ''}.
Return what you kept, fixed, dropped, reverted and restored, the validation result, and final counts read from the files.${APPLY_ATTEMPT ? `
This is apply attempt ${APPLY_ATTEMPT + 1} for run ${RUN_ID}: an earlier apply returned nothing and may have changed the files already. Inspect them first (git -C ${REPO} diff HEAD -- research/round4/${KEY}-*.json), finish the job from where it stands, and do not apply a correction twice.` : ''}`,
  { label: `apply:${KEY}`, phase: 'Apply', schema: APPLIED })
if (!applied) log(`${KEY}: apply failed twice; the record files may hold unverified records. Commit only ${KEY}-screening.json and ${KEY}-lead-outcomes.json, then resume this run with resumeFromRunId and apply_attempt: ${APPLY_ATTEMPT + 1} (README, Resuming).`)
else log(`${KEY}: ${applied.run_status}; validation ${applied.validation}; ${applied.final_counts.events_new_this_run} new episode(s), ${applied.final_counts.updates_this_run} update(s), ${applied.final_counts.upcoming_this_run} announcement(s) this run`)

return {
  region: KEY,
  status: applied ? applied.run_status : 'apply-failed',
  run_id: RUN_ID,
  window: { start: W_START, end: W_END, announcements_from: ANN_FROM, ongoing_from: ONGOING_FROM, recent_from: RECENT_FROM },
  lead_priorities: PRIORITIES,
  preflight: { status: pre.status, fetch_method: pre.fetch_method, websearch: pre.websearch, leads_file: pre.leads_file_status },
  leads: { total: leadIds.length, outcomes: applied ? applied.lead_outcomes : null, without_outcome_after_scan: unworked },
  scan: { steps: scans.length, failed_steps: scans.filter(s => !s.result).map(s => s.step), searches: sum('searches'), fetch_attempts: sum('fetch_attempts'), pages_read: sum('pages_read'), failed_fetches: sum('failed_fetches'), unscreened_countries: unscreened },
  verify: { records: targets.length, removed_vs_head: removed.length, verifiers_returned: verdicts.length, unverified: unverified.length },
  counts: applied ? applied.final_counts : null,
  applied,
}
