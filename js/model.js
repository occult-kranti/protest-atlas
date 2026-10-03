// Pure selectors and status, search, filter, sort and snapshot helpers (WP2).
// Phase-0 scaffold: constants and the two moved functions are final; every other export is a stub.
// DOM-free; safe to import in Node.

export const HOUR = 3_600_000;
export const PAGE_SIZE = 12;
export const STATUS_LABELS = {ongoing: 'Reported ongoing', planned: 'Planned', ended: 'Ended / suspended', 'needs-review': 'Needs review · current status unknown', unknown: 'Current status not established'};

// Moved verbatim from app.js 3.1.
export function dateLabel(value) { if (!value) return 'Not established'; const date = new Date(value); if (!Number.isFinite(date.getTime())) return 'Not established'; return new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',year:'numeric', timeZone:'UTC'}).format(date); }
export function getDisplayStatus(event, now = Date.now()) {
  const start = Date.parse(event.start_date);
  if (Number.isFinite(start) && start > now) return 'planned';
  if (event.status === 'ongoing') { const observed = Date.parse(event.last_observed_at); return Number.isFinite(observed) && observed <= now && now - observed < 72 * HOUR ? 'ongoing' : 'needs-review'; }
  if (event.status === 'planned' && Number.isFinite(start) && start + 72 * HOUR < now) return 'needs-review';
  return ['planned','ended','unknown'].includes(event.status) ? event.status : 'unknown';
}

// Stubs below (WP2 implements; signatures frozen by tech §4.6 + SPEC §2).
export function statusLabel(status, event = null) { return ''; }
export function foldText(value) { return ''; }
export function searchableText(event) { return ''; }
export function queryTokens(query) { return []; }
export function indexContexts(contexts) { return new Map(); }
export function eventMatches(event, filters, {context = null, now = Date.now(), ignoreCountry = false} = {}) { return false; }
export function sortByObservation(events) { return []; }
export function selectEvents(state) { return []; }
export function selectFiltered(state, {ignoreCountry = false} = {}) { return []; }
export function activeFilterCount(filters) { return 0; }
export function availableYears(events) { return []; }
export function cityOptions(events, contextIndex, country = '') { return []; }
export function refinementOptions(events) { return {regions: [], issues: []}; }
export function statusOptions(state) { return []; }
export function datasetStats(envelope, countries, now) { return {}; }
export function snapshotState(envelope, now) { return 'unknown'; }
export function evidenceAgeDays(envelope, now) { return null; }
export function sweepFact({events, upcoming}) { return {records: null, announcements: null}; }
export function groupByBand(events, now) { return []; }
export function emptyBandNotice(allEvents, now) { return null; }
export function timeSnapshot(state) { return ''; }
