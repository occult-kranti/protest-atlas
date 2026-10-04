// Static helpers the critical graph needs from the lazy views (4.1 §8.1, C-53): the Reports teaser and its announcement
// grouping (from js/ahead.js) and the lead-discovery view the dates sheet shows (from js/about.js). ahead.js and about.js
// re-export them. Imports only ./html.js and ../freshness.js. Safe to import in Node.
import {REPO_URL, esc, icon, plural} from './html.js';
import {absoluteLabel, announcementState, toTime} from '../freshness.js';

/** Only this repository's Actions runs may be linked from the discovery audit (C-03). */
export const RUN_URL = new RegExp(`^${REPO_URL.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/actions/runs/\\d+$`);

// ---- Announcements ----

const startOf = item => toTime(item?.planned_start);
const byStart = (a, b) => (startOf(a) - startOf(b)) || String(a?.country ?? '').localeCompare(String(b?.country ?? ''))
  || String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
const byStartDesc = (a, b) => (startOf(b) - startOf(a)) || String(a?.id ?? '').localeCompare(String(b?.id ?? ''));

// Postponed or cancelled items keep their label, but leave the main list once their planned period is over.
const periodPassed = (item, now) => announcementState({...item, status: 'announced'}, now) === 'date-passed';

/** Groups by announcementState. `list` is the main display order (editorial §10.4); passed items go only to `passed`. */
export function groupAnnouncements(items, now) {
  const groups = {today: [], upcoming: [], postponed: [], cancelled: [], passed: [], unknown: [], list: []};
  for (const item of Array.isArray(items) ? items : []) {
    const state = announcementState(item, now);
    if (state === 'scheduled-now') groups.today.push(item);
    else if (state === 'upcoming') groups.upcoming.push(item);
    else if (state === 'date-passed') groups.passed.push(item);
    else if (state === 'postponed' || state === 'cancelled') (periodPassed(item, now) ? groups.passed : groups[state]).push(item);
    else groups.unknown.push(item);
  }
  for (const key of ['today', 'upcoming', 'postponed', 'cancelled', 'unknown']) groups[key].sort(byStart);
  groups.passed.sort(byStartDesc);
  groups.list = [...groups.today, ...[...groups.upcoming, ...groups.postponed, ...groups.cancelled].sort(byStart), ...groups.unknown];
  return groups;
}

/** Items whose planned day or period is today or later and that are not postponed or cancelled (editorial §10.4). */
export function upcomingCount(items, now) {
  const groups = groupAnnouncements(items, now);
  return groups.today.length + groups.upcoming.length;
}

/**
 * The Reports teaser (SPEC §6.5). '' while the critical load is pending. Only upcoming and today's items are counted:
 * a date-passed, postponed or cancelled item is never counted as upcoming.
 */
export function aheadTeaserHTML({upcoming = null, load = null, now = Date.now()} = {}) {
  if (load?.critical === 'loading') return '';
  const status = load?.errors?.upcoming;
  let first;
  if (status === 'absent') first = 'the list is not published in this snapshot.';
  else if (status === 'error' || !Array.isArray(upcoming?.items)) first = 'the list could not load.';
  else if (!upcoming.items.length) first = 'none are listed yet. An empty list does not mean nothing is planned.';
  else {
    const n = upcomingCount(upcoming.items, now);
    first = n ? `${plural(n, 'upcoming action')} listed. An announcement is not evidence that the action will happen.`
      : 'no upcoming action is listed. An empty list does not mean nothing is planned.';
  }
  return `<aside class="ahead-teaser" aria-labelledby="ahead-teaser-title">`
    + `<h2 class="ahead-teaser-title" id="ahead-teaser-title">Ahead</h2>`
    + `<a class="ahead-teaser-link" href="#/ahead/actions"><span class="ahead-teaser-text"><strong>Announced protest actions:</strong> ${esc(first)}</span>${icon('chevron-right')}</a>`
    + `<a class="ahead-teaser-link" href="#/ahead/roadmap"><span class="ahead-teaser-text"><strong>Coming next to Protest Atlas:</strong> what we are building, what is blocked and what we will not build.</span>${icon('chevron-right')}</a>`
    + `</aside>`;
}

// ---- Lead discovery ----

/** Lead-discovery audit (C-03); null when invalid. runUrl only for this repository's Actions runs. */
export function discoveryView(discovery) {
  if (!discovery || typeof discovery !== 'object') return null;
  const date = discovery.last_success_at;
  const count = discovery.candidate_count;
  if (!Number.isFinite(toTime(date)) || !Number.isInteger(count) || count < 0) return null;
  const hours = Number.isInteger(discovery.scheduled_interval_hours) && discovery.scheduled_interval_hours > 0
    ? discovery.scheduled_interval_hours : null;
  const runUrl = typeof discovery.workflow_run_url === 'string' && RUN_URL.test(discovery.workflow_run_url)
    ? discovery.workflow_run_url : null;
  const dateText = absoluteLabel(date);
  const countText = `${count} unverified ${count === 1 ? 'lead' : 'leads'}`;
  return {
    date, dateText, count, countText, runUrl, intervalHours: hours,
    intervalText: hours ? `Scheduled every ${hours === 1 ? 'hour' : `${hours} hours`}; a schedule is not evidence that runs succeed.` : null,
    summary: `GDELT artifact created ${dateText} · ${countText}`,
  };
}
