// Time and freshness helpers. Pure functions: every caller passes `now` so tests and labels agree.
const HOUR = 3_600_000;
const DAY = 86_400_000;
export const LIVE_WINDOW_HOURS = 72;

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Milliseconds since epoch for an ISO day (UTC midnight) or timestamp; NaN when absent/invalid. */
export function toTime(value) {
  if (typeof value !== 'string' || !value) return NaN;
  return Date.parse(value);
}

const utcDay = time => Math.floor(time / DAY);

/** ISO day (YYYY-MM-DD) for a time in UTC. */
export function isoDay(time) {
  return new Date(time).toISOString().slice(0, 10);
}

const relative = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

/**
 * Human relative label: "2 hours ago", "yesterday", "in 3 days".
 * Day-only values never pretend to hour precision.
 */
export function relativeLabel(value, now = Date.now()) {
  const time = toTime(value);
  if (!Number.isFinite(time)) return 'date not established';
  if (DAY_ONLY.test(value)) {
    const days = utcDay(time) - utcDay(now);
    if (Math.abs(days) < 60) return relative.format(days, 'day');
    return relative.format(Math.round(days / 30.44), 'month');
  }
  const diff = time - now;
  const abs = Math.abs(diff);
  if (abs < 60_000) return diff <= 0 ? 'just now' : 'in under a minute';
  if (abs < HOUR) return relative.format(Math.round(diff / 60_000), 'minute');
  if (abs < DAY) return relative.format(Math.round(diff / HOUR), 'hour');
  if (abs < 60 * DAY) return relative.format(Math.round(diff / DAY), 'day');
  return relative.format(Math.round(diff / (30.44 * DAY)), 'month');
}

/** Absolute UTC label: "2 Oct 2026" for days, "2 Oct 2026, 21:31 UTC" for timestamps. */
export function absoluteLabel(value) {
  const time = toTime(value);
  if (!Number.isFinite(time)) return 'Not established';
  const options = {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'};
  if (DAY_ONLY.test(value)) return new Intl.DateTimeFormat('en-GB', options).format(time);
  return `${new Intl.DateTimeFormat('en-GB', {...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(time)} UTC`;
}

/**
 * How recently a source observed activity, from `last_observed_at` only.
 * 'fresh' (< 72 h) is the only band that may sit beside "reported ongoing"; it is never a live feed.
 */
export function observationBand(event, now = Date.now()) {
  const observed = toTime(event?.last_observed_at);
  if (!Number.isFinite(observed) || observed > now) return 'unknown';
  const age = now - observed;
  if (age < LIVE_WINDOW_HOURS * HOUR) return 'fresh';
  if (age < 7 * DAY) return 'week';
  if (age < 30 * DAY) return 'month';
  return 'older';
}

export const BAND_LABELS = {
  fresh: 'Observed in the last 72 hours',
  week: 'Observed in the last 7 days',
  month: 'Observed in the last 30 days',
  older: 'Observed more than 30 days ago',
  unknown: 'Observation date not established',
};

/**
 * State of an announced action relative to today (UTC). An announcement never becomes an occurrence here:
 * once its date passes it reads "date passed", not "happened".
 */
export function announcementState(item, now = Date.now()) {
  if (item?.status === 'cancelled') return 'cancelled';
  if (item?.status === 'postponed') return 'postponed';
  const start = toTime(item?.planned_start);
  if (!Number.isFinite(start)) return 'unknown';
  const end = Number.isFinite(toTime(item?.planned_end)) ? toTime(item.planned_end) : start;
  const today = utcDay(now);
  if (utcDay(end) < today) return 'date-passed';
  if (utcDay(start) <= today) return 'scheduled-now';
  return 'upcoming';
}

export const ANNOUNCEMENT_LABELS = {
  upcoming: 'Announced',
  'scheduled-now': 'Scheduled for today · occurrence not confirmed',
  'date-passed': 'Planned date passed · occurrence not recorded here',
  postponed: 'Reported postponed',
  cancelled: 'Reported cancelled',
  unknown: 'Date not established',
};

/** Whole UTC days until the planned start (negative once passed). */
export function daysUntil(item, now = Date.now()) {
  const start = toTime(item?.planned_start);
  return Number.isFinite(start) ? utcDay(start) - utcDay(now) : NaN;
}

/** Countdown text for an announcement, at day precision. */
export function countdownLabel(item, now = Date.now()) {
  const state = announcementState(item, now);
  if (state !== 'upcoming') return ANNOUNCEMENT_LABELS[state];
  const days = daysUntil(item, now);
  const precision = item.date_precision === 'day' || item.date_precision === 'range' ? '' : ` (${item.date_precision} precision)`;
  return `${relative.format(days, 'day')}${precision}`;
}

const latest = values => values.map(toTime).filter(Number.isFinite).reduce((a, b) => Math.max(a, b), -Infinity);

/**
 * Distinct "updated" stamps. They answer different questions and must never be merged into one:
 * data integration, newest source observation, newest source check, announcements, and site build.
 */
export function updateStamps({events = null, upcoming = null, build = null} = {}) {
  const list = events?.events ?? [];
  const pick = time => (Number.isFinite(time) ? new Date(time).toISOString().replace('.000Z', 'Z') : null);
  const observedDays = list.map(e => e.last_observed_at).filter(v => Number.isFinite(toTime(v)));
  return {
    dataUpdated: events?.generated_at ?? null,
    editorialReview: events?.last_editorial_review ?? null,
    latestObservation: observedDays.length ? observedDays.reduce((a, b) => (toTime(a) >= toTime(b) ? a : b)) : null,
    latestSourceCheck: pick(latest(list.map(e => e.last_verified))),
    announcementsUpdated: upcoming?.generated_at ?? null,
    siteBuilt: build?.built_at ?? null,
    commit: typeof build?.commit === 'string' ? build.commit : null,
  };
}
