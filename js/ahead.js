// Ahead view (WP5; SPEC §12): announced protest actions and the site roadmap. Lazy since 4.1 (C-53): app.js reaches
// it through import() on first visit; the Reports teaser and the announcement grouping live in the static js/teaser.js
// and are re-exported here. Pure helpers first; DOM work happens only inside mountAhead(). Safe to import in Node.
import {REPO_URL, esc, icon, plural, safeURL, sourceLink, timeTag, dayParts, patchHTML} from './html.js';
import {sweepFact, countryNamer} from './model.js';
import {ANNOUNCEMENT_LABELS, absoluteLabel, announcementState, countdownLabel, toTime, isoDay} from '../freshness.js';
import {groupAnnouncements, upcomingCount, aheadTeaserHTML} from './teaser.js';

export {groupAnnouncements, upcomingCount, aheadTeaserHTML};

const DAY = 86_400_000;
const RECORD_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** R4 (SPEC §18.2), in order. */
export const NOT_PLANNED = [
  'Any score that rates or ranks how serious a protest is.',
  'Popularity or approval percentages.',
  'Predictions of unrest.',
  'Tracking the positions of police, troops or crowds.',
  'Identification of participants.',
  'Reminders, calendar exports or sign-up buttons for planned protests.',
  'Country or region rankings.',
  'Automatic publication of discovered leads.',
];

// Copy (verbatim, SPEC §12 and the editorial copy deck §12). A2-sub and A7 are the same sentence.
const A7 = 'An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful.';
const A2_SUB = `Actions that a named organisation or institution has publicly announced for a future date. ${A7}`;
const A4 = 'This list includes an announced action only after the article announcing it has been opened and read. Nothing meets that standard in this snapshot.';
const A5_BLOCKED = day => `On ${day}, our search for announced and recent protest actions could not open news websites from the research environment. Search-result snippets were logged as leads, but a snippet is not a source, so none are listed here. An empty list does not mean nothing is planned.`;
// When items exist but none is upcoming, A5's '…so none are listed here. An empty list…' would repeat NONE_UPCOMING.
const A5_BLOCKED_LISTED = day => `On ${day}, our search for announced and recent protest actions could not open news websites from the research environment, so no new announcement could be added.`;
const A5_FALLBACK = 'Our latest search did not find an announcement that met this standard. An empty list does not mean nothing is planned.';
const A6 = "When items appear, each will show what was announced and by which organisation or institution, the country and city, the planned date and how precise it is, the source with its publisher and publication date, and when it was checked. Times, meeting points and routes are never listed. After the planned date passes, an item is marked 'occurrence not established' until a sourced report says what happened.";
const ACTIONS_ERROR = 'The announced-actions list could not load. This is not the same as an empty list.';
export const NONE_UPCOMING = 'No upcoming announced actions are listed. An empty list does not mean nothing is planned.';
const R2 = "What we have built, what we are working on and what is blocked, stated plainly. There are no promised dates. 'Shipped' means available on this site now and checked after it was deployed. This page is about the atlas itself. Announced protest actions are listed separately under Ahead.";
const NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';

/** C-50: the label for a non-day item whose planned period includes today (freshness.js stays frozen). */
export const PERIOD_NOW_LABEL = 'Planned period includes today · occurrence not established';

// ---- Announcements ----

const startOf = item => toTime(item?.planned_start);

// Day, short month and year come from absoluteLabel's fixed month names ("Sep"), so every date on the site agrees.
const fmt = options => value => new Intl.DateTimeFormat('en-GB', {...options, timeZone: 'UTC'}).format(value);
const weekdayShort = fmt({weekday: 'short'});
const monthLong = fmt({month: 'long', year: 'numeric'});
const part = index => time => dayParts(isoDay(time))[index];
const [dayNumber, monthShort, yearNumber] = [0, 1, 2].map(part);

function rangeText(start, end) {
  const a = new Date(start), b = new Date(end);
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${absoluteLabel(isoDay(start))} – ${absoluteLabel(isoDay(end))}`;
  if (a.getUTCMonth() !== b.getUTCMonth()) return `${dayNumber(start)} ${monthShort(start)} – ${absoluteLabel(isoDay(end))}`;
  return `${dayNumber(start)}–${dayNumber(end)} ${monthShort(start)} ${yearNumber(start)}`;
}

/** Precision-aware date text and the decorative date block (editorial §10.2). Never pretends to day precision. */
function dateDisplay(item) {
  const start = startOf(item);
  const precision = item?.date_precision;
  if (!Number.isFinite(start)) return {text: 'Planned date not established', block: null};
  const end = toTime(item?.planned_end);
  if (precision === 'week') {
    return {text: `Week of ${absoluteLabel(item.planned_start)} · exact day not announced`,
      block: {top: 'Week of', main: dayNumber(start), bottom: monthShort(start)}};
  }
  if (precision === 'month') {
    return {text: `${monthLong(start)} · exact day not announced`, block: {top: yearNumber(start), main: monthShort(start), bottom: ''}};
  }
  if (Number.isFinite(end) && end > start) {
    const sameMonth = new Date(start).getUTCMonth() === new Date(end).getUTCMonth();
    return {text: rangeText(start, end),
      block: {top: sameMonth ? monthShort(start) : `${monthShort(start)}–${monthShort(end)}`,
        main: `${dayNumber(start)}–${dayNumber(end)}`, bottom: yearNumber(end)}};
  }
  return {text: `${weekdayShort(start)} ${absoluteLabel(item.planned_start)}`,
    block: {top: monthShort(start), main: dayNumber(start), bottom: weekdayShort(start)}};
}

/** Everything an announcement card shows. countdown only for day/range precision in the upcoming state. */
export function announcementView(item, now, {countryName = code => code, eventTitle = () => ''} = {}) {
  const state = announcementState(item, now);
  const precision = ['day', 'week', 'month', 'range'].includes(item?.date_precision) ? item.date_precision : 'day';
  const stateLabel = state === 'scheduled-now' && precision !== 'day' ? PERIOD_NOW_LABEL : ANNOUNCEMENT_LABELS[state];
  const countdown = state === 'upcoming' && (precision === 'day' || precision === 'range') ? countdownLabel(item, now) : null;
  const {text: dateText, block: dateBlock} = dateDisplay(item);
  const cities = (Array.isArray(item?.cities) ? item.cities : []).filter(c => typeof c === 'string' && c.trim());
  const country = typeof item?.country === 'string' ? item.country : '';
  const name = (country && countryName(country)) || country;
  const sources = (Array.isArray(item?.sources) ? item.sources : []).map(source => ({
    href: safeURL(source?.url),
    url: source?.url ?? '',
    publisher: source?.publisher || source?.title || 'Source',
    title: source?.title ?? '',
    published: source?.published_at ?? null,
    publishedText: source?.published_at ? absoluteLabel(source.published_at) : 'date not given',
    accessed: source?.accessed_at ?? null,
    accessedText: absoluteLabel(source?.accessed_at),
  }));
  const eventId = typeof item?.event_id === 'string' && RECORD_ID.test(item.event_id) ? item.event_id : null;
  return {
    id: item?.id ?? '', state, stateLabel, countdown, precision, dateText, dateBlock,
    startISO: ISO_DAY.test(item?.planned_start ?? '') ? item.planned_start : null,
    action: item?.action ?? '', country, countryName: name, cities,
    place: [name, cities.join(', ')].filter(Boolean).join(' · '),
    announcedBy: item?.announced_by ?? '', announcement: item?.announcement ?? '', sources,
    eventId, recordHref: eventId ? `#/record/${eventId}` : null, recordTitle: eventId ? (eventTitle(eventId) || '') : '',
  };
}

// ---- Roadmap ----

const ROADMAP_ORDER = ['in-progress', 'next', 'blocked', 'later', 'shipped'];
export const ROADMAP_LABELS = {'in-progress': 'In progress', next: 'Next', blocked: 'Blocked', later: 'Later', shipped: 'Shipped'};
const ROADMAP_GLYPHS = {shipped: '✓', 'in-progress': '◑', next: '→', later: '…', blocked: '⊘'};
// R3 (SPEC §18.2), in its own order.
const ROADMAP_LEGEND = [
  ['shipped', 'available on this site now.'],
  ['in-progress', 'built or being built; not yet confirmed on the deployed site.'],
  ['next', 'planned, and can start without outside help.'],
  ['later', 'only after the listed conditions are met.'],
  ['blocked', 'cannot proceed until the named blocker is resolved.'],
];
const AREA_LABELS = {interface: 'Interface', map: 'Map', data: 'Data', editorial: 'Editorial', accessibility: 'Accessibility', infrastructure: 'Infrastructure'};

/** [{status, label, items}] in the order in-progress, next, blocked, later, shipped; empty groups are omitted. */
export function roadmapGroups(roadmap) {
  const items = Array.isArray(roadmap) ? roadmap : (Array.isArray(roadmap?.items) ? roadmap.items : []);
  return ROADMAP_ORDER.map(status => ({status, label: ROADMAP_LABELS[status], items: items.filter(item => item?.status === status)}))
    .filter(group => group.items.length > 0);
}

const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9_.\-/]+$/;

/** test/file/doc → blob link; commit → commit link; url → only inside `repo` after URL normalisation. Else null. */
export function evidenceHref(evidence, repo = REPO_URL) {
  const ref = typeof evidence?.ref === 'string' ? evidence.ref : '';
  if (!ref) return null;
  switch (evidence.kind) {
    case 'test': case 'file': case 'doc': {
      const path = evidence.kind === 'test' ? ref.split('::')[0] : ref;
      return SAFE_PATH.test(path) && !path.includes('//') ? `${repo}/blob/main/${path}` : null;
    }
    case 'commit': return /^[0-9a-f]{7,40}$/.test(ref) ? `${repo}/commit/${ref}` : null;
    case 'url': {
      // new URL() resolves "..", "%2e%2e" and backslashes, so ".../protest-atlas/../../evil" no longer matches.
      const href = safeURL(ref);
      return href && href.startsWith(`${repo}/`) ? href : null;
    }
    default: return null;
  }
}

/** True once the last status check is more than `days` whole UTC days old (or not established). Never fails a build. */
export function reviewOverdue(lastReviewed, now, days = 90) {
  const reviewed = toTime(lastReviewed);
  if (!Number.isFinite(reviewed)) return true;
  return Math.floor(now / DAY) - Math.floor(reviewed / DAY) > days;
}

// ---- HTML ----

const glyph = status => `<span class="roadmap-glyph" data-glyph="${esc(status)}" aria-hidden="true">${ROADMAP_GLYPHS[status] ?? ''}</span>`;
const statusPill = status => `<span class="roadmap-status" data-status="${esc(status)}">${glyph(status)} ${esc(ROADMAP_LABELS[status] ?? status)}</span>`;
const dayTag = day => (ISO_DAY.test(day ?? '') ? `<time class="roadmap-date" datetime="${esc(day)}">${esc(absoluteLabel(day))}</time>` : 'not established');
const external = (href, label, className) => `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}${icon('external')}${NEW_TAB}</a>`;
const retryButton = attrs => `<p class="announce-empty-actions"><button type="button" class="btn btn--primary" ${attrs}>Retry</button></p>`;

const label = text => `<span class="announce-label">${text}</span>`;

function announcementItemHTML(view) {
  const b = view.dateBlock;
  const block = b
    ? `<p class="announce-dateblock" aria-hidden="true"><span class="announce-dateblock-top">${esc(b.top)}</span><span class="announce-dateblock-main">${esc(b.main)}</span>${b.bottom ? `<span class="announce-dateblock-bottom">${esc(b.bottom)}</span>` : ''}</p>`
    : '';
  const sources = view.sources.map(s => `<p class="announce-source">${label('Source:')} ${s.href ? sourceLink({url: s.href, title: s.title}, s.publisher) : esc(s.publisher)}, published ${esc(s.publishedText)} · opened ${s.accessed ? `<time datetime="${esc(s.accessed)}">${esc(s.accessedText)}</time>` : esc(s.accessedText)} (AI-assisted)</p>`).join('');
  const related = view.recordHref
    ? `<p class="announce-related"><a href="${esc(view.recordHref)}" data-open-record="${esc(view.eventId)}">Related episode: ${esc(view.recordTitle || view.eventId)} <span aria-hidden="true">→</span></a></p>`
    : '';
  const titleId = `announce-${esc(view.id)}-title`;
  return `<li class="announce-entry"><article class="announce-item" data-state="${esc(view.state)}" data-precision="${esc(view.precision)}" aria-labelledby="${titleId}">${block}`
    + `<div class="announce-body">`
    + `<p class="announce-state"><span class="announce-pill">${esc(view.stateLabel)}</span>${view.countdown ? ` <span class="announce-countdown">${esc(view.countdown)}</span>` : ''}</p>`
    + `<p class="announce-date">${view.startISO ? `<time datetime="${esc(view.startISO)}">${esc(view.dateText)}</time>` : esc(view.dateText)}</p>`
    + `<h3 class="announce-action" id="${titleId}">${esc(view.action)}</h3>`
    + (view.place ? `<p class="announce-place">${esc(view.place)}</p>` : '')
    + `<p class="announce-by">${label('Announced by:')} ${esc(view.announcedBy)}</p>`
    + `<p class="announce-what">${label('What was announced:')} ${esc(view.announcement)}</p>`
    + sources + related
    + `<p class="announce-caveat">${A7}</p>`
    + `</div></article></li>`;
}

/** The placeholder-only specimen (collapsed), then the state vocabulary, always visible (SPEC §12.2). */
function specimenHTML() {
  const states = ['upcoming', 'scheduled-now', 'period-now', 'date-passed', 'postponed', 'cancelled', 'unknown']
    .map(state => `<li><span class="announce-pill" data-state="${state}">${esc(state === 'period-now' ? PERIOD_NOW_LABEL : ANNOUNCEMENT_LABELS[state])}</span></li>`).join('');
  return `<details class="announce-specimen" data-key="specimen"><summary>How an announcement will appear</summary>`
    + `<div class="announce-specimen-body"><div class="announce-item announce-item--specimen" data-state="specimen">`
    + `<p class="announce-watermark">Layout specimen • not an announcement</p>`
    + `<div class="announce-body">`
    + `<p class="announce-state"><span class="announce-pill">{State}</span></p>`
    + `<p class="announce-date">{Planned date}</p>`
    + `<p class="announce-action">{Action}</p>`
    + `<p class="announce-place">{Country} · {City}</p>`
    + `<p class="announce-by">${label('Announced by:')} {organisation or institution}</p>`
    + `<p class="announce-what">${label('What was announced:')} {attributed paraphrase}</p>`
    + `<p class="announce-source">${label('Source:')} {publisher}, published {date} ↗ · opened {time} (AI-assisted)</p>`
    + `<p class="announce-caveat">${A7}</p>`
    + `</div></div></div></details>`
    + `<h3 class="announce-states-title">Every announcement shows one of these states</h3>`
    + `<ul class="announce-states">${states}</ul>`;
}

function emptyActionsHTML(sweep) {
  const a5 = sweep?.blocked && ISO_DAY.test(sweep.day ?? '') ? A5_BLOCKED(absoluteLabel(sweep.day)) : A5_FALLBACK;
  return `<div class="announce-empty" role="status">`
    + `<p class="announce-empty-icon">${icon('calendar-empty')}</p>`
    + `<h3 class="announce-empty-title">No announced actions are listed yet</h3>`
    + `<p>${A4}</p><p>${esc(a5)}</p><p>${A6}</p>`
    + `<p class="announce-empty-actions">`
    + `<a class="btn btn--primary" href="#/ahead/roadmap" data-ahead-target="roadmap-item-list-announced-actions">What's blocking this <span aria-hidden="true">→</span></a>`
    + `<a class="btn" href="#/latest">Read the most recent reports</a></p>`
    + `</div>`;
}

/** Items exist, but none is upcoming or today: say so, with the latest sweep fact (A5), before any other item. */
function noneUpcomingHTML(sweep) {
  const day = ISO_DAY.test(sweep?.day ?? '') ? absoluteLabel(sweep.day) : '';
  const fact = !day ? '' : sweep.blocked ? A5_BLOCKED_LISTED(day) : `Latest search for announcements: ${day}.`;
  return `<div class="announce-none"><p class="announce-none-title">${esc(NONE_UPCOMING)}</p>`
    + (fact ? `<p>${esc(fact)}</p>` : '') + `</div>`;
}

function safeSweep(events, upcoming) {
  try { return sweepFact({events, upcoming})?.announcements ?? null; } catch { return null; }
}

/** `section#ahead-actions` body (SPEC §12.2): A2, A2-sub, A9, then the empty, filled, absent, error or loading state. */
export function actionsHTML({upcoming = null, events = null, load = null, now = Date.now(), countryName = code => code, eventTitle = () => ''} = {}) {
  const head = `<h2 id="ahead-actions-title" class="ahead-section-title" tabindex="-1">Announced protest actions</h2><p class="ahead-section-dek">${A2_SUB}</p>`;
  const status = load?.errors?.upcoming;
  const unavailable = (text, retry = '') => `${head}<div class="empty-state announce-unavailable"><p class="announce-unavailable-text">${text}</p>${retry}</div>`;
  if (status === 'absent') return unavailable('The announced-actions list is not published in this snapshot.');
  if (status === 'error') return unavailable(ACTIONS_ERROR, retryButton('data-action="retry-data"'));
  if (!Array.isArray(upcoming?.items)) {
    if (load?.critical === 'loading' || !load) return `${head}<p class="announce-loading" role="status">Loading…</p>`;
    return unavailable(ACTIONS_ERROR, retryButton('data-action="retry-data"'));
  }
  const items = upcoming.items;
  const stamp = `<p class="announce-stamp">Announced-actions list compiled ${timeTag(upcoming.generated_at, now, 'both')} · ${plural(items.length, 'item')}</p>`;
  if (!items.length) return head + stamp + emptyActionsHTML(safeSweep(events, upcoming)) + specimenHTML();
  const groups = groupAnnouncements(items, now);
  const view = item => announcementItemHTML(announcementView(item, now, {countryName, eventTitle}));
  const none = groups.today.length + groups.upcoming.length ? '' : noneUpcomingHTML(safeSweep(events, upcoming));
  const list = groups.list.length ? `<ol class="announce-list">${groups.list.map(view).join('')}</ol>` : '';
  const passed = groups.passed.length
    ? `<details class="announce-passed" data-key="passed"><summary>Planned dates that have passed (${groups.passed.length}) · occurrence not established</summary><ol class="announce-list announce-list--passed">${groups.passed.map(view).join('')}</ol></details>`
    : '';
  return head + stamp + none + list + passed + specimenHTML();
}

/** One roadmap item (SPEC §12.3): title, pill, area, summary, Done when (+ shipped lines), Blocked by, Depends on, Status checked. */
function roadmapItemHTML(item, titles, now) {
  const id = esc(item.id);
  const shipped = item.status === 'shipped';
  const evidence = shipped ? (item.evidence ?? []).map(entry => {
    const href = evidenceHref(entry);
    return `<li>${href ? external(href, esc(entry.label), 'roadmap-evidence-link') : esc(entry.label)}</li>`;
  }).join('') : '';
  const deps = (item.depends_on ?? []).filter(dep => titles.has(dep))
    .map(dep => `<li><a href="#roadmap-item-${esc(dep)}" data-scroll-to="roadmap-item-${esc(dep)}">${esc(titles.get(dep))}</a></li>`).join('');
  const roadmapLabel = text => `<span class="roadmap-label">${text}</span>`;
  return `<article class="roadmap-item" id="roadmap-item-${id}" data-status="${esc(item.status)}" tabindex="-1" aria-labelledby="roadmap-title-${id}">`
    + `<h4 class="roadmap-item-title" id="roadmap-title-${id}">${esc(item.title)}</h4>`
    // The group heading carries the status glyph and label; each item repeats it for screen readers only (density on phones).
    + `<p class="roadmap-meta"><span class="visually-hidden">Status: ${esc(ROADMAP_LABELS[item.status] ?? item.status)}. Area: </span><span class="roadmap-area">${esc(AREA_LABELS[item.area] ?? item.area ?? '')}</span></p>`
    + `<p class="roadmap-summary">${esc(item.summary)}</p>`
    + (shipped ? `<p class="roadmap-shipped">Shipped in ${esc(item.shipped_in)} · ${dayTag(item.shipped_on)}</p>` : '')
    + `<p class="roadmap-done">${roadmapLabel('Done when:')} ${esc(item.acceptance)}</p>`
    + (evidence ? `<div class="roadmap-checkedby"><p class="roadmap-label">Checked by:</p><ul class="roadmap-evidence">${evidence}</ul></div>` : '')
    + (item.blocked_by ? `<p class="roadmap-blocked">${roadmapLabel('Blocked by:')} ${esc(item.blocked_by)}</p>` : '')
    + (deps ? `<div class="roadmap-deps"><p class="roadmap-label">Depends on:</p><ul class="roadmap-deps-list">${deps}</ul></div>` : '')
    + `<p class="roadmap-checked">Status checked ${dayTag(item.last_reviewed)}${reviewOverdue(item.last_reviewed, now) ? ' <span class="roadmap-overdue">Status check overdue</span>' : ''}</p>`
    + `</article>`;
}

/** `section#ahead-roadmap` body (SPEC §12.3). status is state.load.lazy.roadmap. */
export function roadmapHTML({roadmap = null, status = 'idle', now = Date.now()} = {}) {
  const head = `<h2 id="ahead-roadmap-title" class="ahead-section-title" tabindex="-1">Coming next to Protest Atlas</h2><p class="ahead-section-dek">${R2}</p>`;
  const valid = Array.isArray(roadmap?.items);
  if (status === 'error' || (status === 'ready' && !valid)) {
    return `${head}<div class="empty-state roadmap-unavailable"><p class="roadmap-unavailable-text">The roadmap could not load.</p>`
      + `<p class="roadmap-retry"><button type="button" class="btn btn--primary" data-retry="roadmap">Retry</button></p></div>`;
  }
  if (!valid) return `${head}<p class="roadmap-loading" role="status">Loading the roadmap…</p>`;
  const updatedDay = typeof roadmap.updated_at === 'string' ? roadmap.updated_at.slice(0, 10) : '';
  const stamp = `<p class="roadmap-stamp">Roadmap revised ${ISO_DAY.test(updatedDay) ? `<time datetime="${esc(updatedDay)}">${esc(absoluteLabel(updatedDay))}</time>` : 'not established'} · AI-assisted · no human editorial owner yet</p>`;
  const links = `<div class="roadmap-links">`
    + external(`${REPO_URL}/blob/main/docs/ROADMAP.md`, 'Follow progress on GitHub', 'btn btn--primary roadmap-follow')
    + external(`${REPO_URL}/issues/new/choose`, 'Suggest a feature or report a problem', 'btn roadmap-suggest')
    + `<p class="roadmap-privacy">Please do not post private details about participants.</p></div>`;
  const legend = `<ul class="roadmap-legend">${ROADMAP_LEGEND.map(([key, text]) => `<li>${statusPill(key)}<span class="visually-hidden">:</span> ${text}</li>`).join('')}</ul>`;
  const groups = roadmapGroups(roadmap);
  const jump = `<nav class="roadmap-jump" aria-label="Roadmap groups"><ul>${groups.map(group => `<li><a class="roadmap-jump-link" href="#roadmap-${group.status}" data-scroll-to="roadmap-${group.status}" data-status="${group.status}">${glyph(group.status)} ${group.label} <span class="roadmap-jump-count">(${group.items.length})</span></a></li>`).join('')}</ul></nav>`;
  const titles = new Map(roadmap.items.filter(item => item?.id).map(item => [item.id, item.title]));
  const body = groups.map(group => `<section class="roadmap-group" id="roadmap-${group.status}" data-status="${group.status}" aria-labelledby="roadmap-${group.status}-title" tabindex="-1">`
    + `<h3 class="roadmap-group-title" id="roadmap-${group.status}-title">${glyph(group.status)} ${group.label}</h3>`
    + `<div class="roadmap-items">${group.items.map(item => roadmapItemHTML(item, titles, now)).join('')}</div></section>`).join('');
  const notPlanned = `<section class="roadmap-notplanned" aria-labelledby="roadmap-notplanned-title"><h3 class="roadmap-group-title" id="roadmap-notplanned-title">What we will not build</h3>`
    + `<ul class="roadmap-notplanned-list">${NOT_PLANNED.map(text => `<li>${esc(text)}</li>`).join('')}</ul></section>`;
  return `<div class="roadmap-head">${head}${stamp}${links}</div>`
    + `<div class="roadmap-rail">${legend}${jump}</div>`
    + `<div class="roadmap-body">${body}${notPlanned}</div>`;
}

// ---- DOM (mountAhead) ----

/** patchHTML, but a replaced Retry hands focus to `fallback()` instead of <body> (C-37; WCAG 2.4.3). */
function patchKeepingFocus(el, html, cache, fallback) {
  const doc = el.ownerDocument;
  const had = el.contains(doc.activeElement);
  const changed = patchHTML(el, html, cache);
  if (changed && had && !el.contains(doc.activeElement)) fallback()?.focus({preventScroll: true});
  return changed;
}

/** Mounts #ahead-root: one section at a time from route.param, rendered on first visit; lazy roadmap; blocker landing. */
export function mountAhead(ctx = {}) {
  const doc = globalThis.document;
  const root = doc?.getElementById('ahead-root');
  if (!root) return {render() {}};
  const view = doc.getElementById('view-ahead') ?? root;
  const cache = new WeakMap();
  const sections = {};
  let pendingTarget = null;
  let roadmapRequested = false;
  let last = null;

  // Only a plain primary click navigates in this tab; a modified click opens a new tab and must not arm the landing.
  view.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target?.closest?.('[data-ahead-target]');
    if (link && view.contains(link)) pendingTarget = link.getAttribute('data-ahead-target');
  });

  function section(name) {
    if (!sections[name]) {
      const el = doc.createElement('section');
      el.id = `ahead-${name}`;
      el.className = `ahead-section ahead-section--${name}`;
      el.setAttribute('aria-labelledby', `ahead-${name}-title`);
      el.hidden = true;
      if (name === 'actions') root.prepend(el); else root.append(el);
      sections[name] = el;
    }
    return sections[name];
  }

  // SPEC §12.2: after the router's own scroll and focus, land on the blocker item.
  function landOnTarget() {
    const target = doc.getElementById(pendingTarget);
    if (!target || !sections.roadmap?.contains(target) || sections.roadmap.hidden) return;
    pendingTarget = null;
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
      if (!target.isConnected) return;
      target.scrollIntoView({block: 'start', behavior: ctx.env?.reducedMotion?.() ? 'auto' : undefined});
      target.focus({preventScroll: true});
    }, 0)));
  }

  return {
    render(state) {
      if (!state) return;
      const route = state.route ?? {};
      const onAhead = route.view === 'ahead';
      if (!onAhead && !sections.actions) return;              // C-21: nothing until the first visit
      // tech §4.5: nothing this view reads has changed (e.g. a Reports search keystroke).
      if (last && state.data === last.data && state.load === last.load && state.route === last.route
        && state.now === last.now && state.mode === last.mode) return;
      last = state;
      const active = onAhead ? (route.param === 'roadmap' ? 'roadmap' : 'actions') : (root.dataset.section || 'actions');
      if (onAhead) root.dataset.section = active;
      // The landing belongs to the navigation it was armed for; any other route disarms it.
      if (pendingTarget && !(onAhead && active === 'roadmap')) pendingTarget = null;
      const data = state.data ?? {};
      const titles = new Map((data.events?.events ?? []).map(e => [e.id, e.title]));
      const actionsEl = section('actions');
      patchKeepingFocus(actionsEl, actionsHTML({
        upcoming: data.upcoming, events: data.events, load: state.load, now: state.now,
        countryName: countryNamer(data.countries), eventTitle: id => titles.get(id) || '',
      }), cache, () => actionsEl.querySelector('[data-action="retry-data"]') ?? doc.getElementById('ahead-actions-title'));
      if (active === 'roadmap' || sections.roadmap) {
        const status = state.load?.lazy?.roadmap ?? (data.roadmap ? 'ready' : 'idle');
        if (!data.roadmap && status === 'idle' && !roadmapRequested) {
          roadmapRequested = true;
          Promise.resolve().then(() => ctx.actions?.loadLazy?.('roadmap')).catch(() => {});
        }
        if (status === 'error') { roadmapRequested = false; pendingTarget = null; }
        const roadmapEl = section('roadmap');
        patchKeepingFocus(roadmapEl, roadmapHTML({roadmap: data.roadmap, status, now: state.now}), cache,
          () => roadmapEl.querySelector('[data-retry="roadmap"]') ?? doc.getElementById('ahead-roadmap-title'));
      }
      sections.actions.hidden = active !== 'actions';
      if (sections.roadmap) sections.roadmap.hidden = active !== 'roadmap';
      if (pendingTarget && active === 'roadmap') landOnTarget();
    },
  };
}
