// Snapshot chip, dates sheet rows, footer stamps and time refresh (WP2). DOM-free when loaded.
// Every stamp names its own subject; stamps are never merged into one "updated" time (editorial §4).
import {discoveryView} from './about.js';
import {snapshotState, evidenceAgeDays, sweepFact, sweepLine, snapshotAgeText} from './model.js';
import {esc, plural, timeTag, timeText, REPO_URL} from './html.js';
import {absoluteLabel, updateStamps} from '../freshness.js';

/** T4: labels and explainers, editorial §4 verbatim (with the §18.2 discovery rewrite). */
export const STAMP_ROWS = Object.freeze([
  {key: 'dataUpdated', label: 'Snapshot assembled', note: 'When the published records were last compiled and validated by the AI-assisted pipeline. Not a time when protests were checked, and not proof that anything new was added.'},
  {key: 'editorialReview', label: 'AI-assisted review pass', note: 'An AI-assisted integration review. No human editorial sign-off.'},
  {key: 'latestObservation', label: 'Newest evidence', note: 'The most recent date on which a cited source reports protest activity or a development in an episode. Day precision.'},
  {key: 'latestSourceCheck', label: 'Latest source re-read', note: 'When an AI-assisted check last opened an article already cited by a record. Re-reading old reporting never makes a protest current.'},
  {key: 'announcementsUpdated', label: 'Announced-actions list compiled', note: 'Compilation time of the list only. The note under the list says when announcements were last searched and what that search could read.'},
  {key: 'siteBuilt', label: 'Site built', note: "When this website's code was deployed. A new build never adds or re-checks reports."},
  {key: 'discovery', label: 'Lead-discovery audit', note: 'A one-time audit of one automated lead list. Leads are never published automatically. It does not show whether the discovery service is working today.'},
  {key: 'humanReview', label: 'Human editorial review', note: 'No human editor is enrolled in this pilot.'},
]);

const STAMPS_INTRO = 'Each date answers a different question. None of them shows that a protest is still going on.';
const T5 = 'Event dates are days, as reported. We do not invent times of day. Re-reading a source, assembling the snapshot or rebuilding the site never makes a protest more recent.';
const SHA = /^[0-9a-f]{40}$/;
/** "2 Oct 2026, 19:27 UTC" that can break only after the comma. */
const glued = value => absoluteLabel(value).replace(/^(\d{1,2}) (\S+) (\d{4})/, '$1\u00a0$2\u00a0$3').replace(/ UTC$/, '\u00a0UTC');
const dayTag = value => `<time class="stamp-time" datetime="${esc(value)}">${esc(glued(value))}</time>`;
const valid = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const stripTags = html => html.replace(/<[^>]*>/g, '').replace(/\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const commitLink = sha => `<a class="stamp-list-commit" href="${esc(`${REPO_URL}/commit/${sha}`)}">${esc(sha.slice(0, 7))}</a>`;

/**
 * Dates rows (§10). extras = {announcementsCount, discovery, discoveryLoad, sweep} (C-03), plus the optional
 * announcementsLoad and buildLoad ('absent' | 'error') from state.load.errors.
 * → [{key, label, note, value, html, text, present}]: value is the row's HTML (tech §7.2), html an alias of it,
 * text its plain text. Dates use the copy deck's month names; the relative parts are <time data-rel> for refreshTimes.
 */
export function stampItems(stamps, now, extras = {}) {
  const s = stamps ?? {};
  const rows = [];
  const row = (key, html, present = true) => {
    const def = STAMP_ROWS.find(r => r.key === key);
    rows.push({key, label: def.label, note: def.note, value: html, html, text: stripTags(html), present});
  };
  // A fixed date, then a relative part that refreshTimes updates; "·" ends a line, never starts one.
  const when = value => (valid(value) ? `${dayTag(value)}\u00a0· ${timeTag(value, now, 'relative')}` : 'Not established');
  const count = (n, noun) => `\u00a0· ${esc(plural(n, noun)).replace(' ', '\u00a0')}`;   // "0 items" never splits

  row('dataUpdated', valid(s.dataUpdated)
    ? `<time class="stamp-time" datetime="${esc(s.dataUpdated)}" data-rel="${esc(s.dataUpdated)}" data-format="both" data-days="utc">${esc(snapshotAgeText(s.dataUpdated, now))}</time>`
    : 'Not established', valid(s.dataUpdated));
  if (valid(s.editorialReview) && s.editorialReview !== s.dataUpdated) row('editorialReview', when(s.editorialReview));
  row('latestObservation', valid(s.latestObservation) ? `dated ${when(s.latestObservation)}` : 'Not established', valid(s.latestObservation));
  row('latestSourceCheck', when(s.latestSourceCheck), valid(s.latestSourceCheck));

  if (extras.announcementsLoad === 'error') row('announcementsUpdated', 'Could not load', false);
  else if (extras.announcementsLoad === 'absent' || !valid(s.announcementsUpdated)) row('announcementsUpdated', 'Not published in this snapshot', false);
  else {
    const n = extras.announcementsCount;
    row('announcementsUpdated', `${when(s.announcementsUpdated)}${Number.isInteger(n) ? count(n, 'item') : ''}`);
  }

  if (extras.buildLoad === 'error') row('siteBuilt', 'Site build stamp could not be read', false);
  else if (!valid(s.siteBuilt)) row('siteBuilt', 'Not available in this preview', false);
  else row('siteBuilt', `${when(s.siteBuilt)}${SHA.test(s.commit ?? '') ? ` · commit ${commitLink(s.commit)}` : ''}`);

  const view = extras.discovery;
  if (extras.discoveryLoad === 'error') row('discovery', 'Discovery audit unavailable.', false);
  else if (extras.discoveryLoad === 'ready' && view && valid(view.date) && Number.isFinite(Number(view.count))) {
    row('discovery', `GDELT artifact created ${dayTag(view.date)}${count(Number(view.count), 'unverified lead')}`);
  } else if (extras.discoveryLoad === 'ready') row('discovery', 'Discovery audit unavailable.', false);
  else row('discovery', 'Loading…', false);

  row('humanReview', 'Not completed', false);
  return rows;
}

/** The extras for stampItems from the store state (C-03, C-49). */
function extrasFor(state) {
  const discoveryLoad = state.load?.lazy?.discovery ?? 'idle';
  let discovery = null;
  if (discoveryLoad === 'ready' && state.data?.discovery) {
    try { discovery = discoveryView(state.data.discovery); } catch { discovery = null; }
  }
  return {
    announcementsCount: Array.isArray(state.data?.upcoming?.items) ? state.data.upcoming.items.length : null,
    announcementsLoad: state.load?.errors?.upcoming,
    buildLoad: state.load?.errors?.build,
    discovery,
    discoveryLoad,
    sweep: sweepFact({events: state.data?.events, upcoming: state.data?.upcoming}),
  };
}

const stampsOf = state => updateStamps({events: state.data?.events, upcoming: state.data?.upcoming, build: state.data?.build});

/** "2 Oct 2026, 22:45 UTC" split so the two-line chip can hide the year (§4.1). */
function chipTime(value) {
  const label = absoluteLabel(value);
  const match = /^(\d{1,2} \S+) (\d{4}), (\d{2}:\d{2}) UTC$/.exec(label);
  if (!match) return {html: esc(label), long: label, short: label};
  const [, dayMonth, year, time] = match;
  return {
    html: `<time datetime="${esc(value)}">${esc(dayMonth)}<span class="stamp-chip-year"> ${esc(year)}</span>, ${esc(time)} UTC</time>`,
    long: `${dayMonth} ${year}, ${time} UTC`,
    short: `${dayMonth}, ${time} UTC`,
  };
}

/**
 * Header chip (§4.1, H4–H6). → {state, tone, label, value, short, valueHTML}
 * value is the one-line (long) text; short the two-line text.
 */
export function chipModel(state) {
  const load = state?.load ?? {};
  const envelope = state?.data?.events ?? null;
  if (load.errors?.events) return {state: 'error', tone: 'warn', label: 'Snapshot', value: 'could not load', short: 'could not load', valueHTML: 'could not load'};
  if (!envelope) return {state: 'loading', tone: 'neutral', label: 'Snapshot', value: 'loading', short: 'loading', valueHTML: 'loading'};
  const now = state.now ?? Date.now();
  const snap = snapshotState(envelope, now);
  if (snap === 'current' || snap === 'unknown') {
    const t = valid(envelope.generated_at) ? chipTime(envelope.generated_at) : {html: 'date not established', long: 'date not established', short: 'date not established'};
    return {state: 'current', tone: 'neutral', label: 'Snapshot', value: t.long, short: t.short, valueHTML: t.html};
  }
  const days = evidenceAgeDays(envelope, now);
  const unit = days === 1 ? 'day' : 'days';
  return {
    state: snap,
    tone: snap === 'aging' ? 'neutral' : 'warn',
    label: snap === 'aging' ? 'Snapshot' : 'Stale snapshot',
    value: `newest evidence ${days} ${unit} old`,
    short: `evidence ${days} ${unit} old`,
    valueHTML: `<span class="stamp-chip-long">newest </span>evidence ${days} ${unit} old`,
  };
}

/** Inner HTML of #stamp-chip. WP1 styles the spans and draws the warn-tone i-alert before the label. */
function chipHTML(model) {
  return `<span class="stamp-chip-label">${esc(model.label)}</span><span class="stamp-chip-sep" aria-hidden="true"> · </span>`
    + `<span class="stamp-chip-value">${model.valueHTML}</span><span class="visually-hidden">. Open: what the dates on this page mean</span>`;
}

/** Absolute label with no-break spaces, so "2 Oct 2026" never splits across lines. */
const keep = value => esc(absoluteLabel(value)).replace(/ /g, '\u00a0');

/** Footer T1 / T2 (§4.4). '' while the critical files are loading. */
export function footerStampsHTML(state) {
  const load = state?.load ?? {};
  if (load.critical === 'loading') return '';
  const s = stampsOf(state);
  const parts = [];
  if (valid(s.dataUpdated)) parts.push(`Snapshot assembled <time datetime="${esc(s.dataUpdated)}">${keep(s.dataUpdated)}</time> (AI-assisted, no human sign-off)`);
  if (valid(s.latestObservation)) parts.push(`Newest evidence dated <time datetime="${esc(s.latestObservation)}">${keep(s.latestObservation)}</time>`);
  if (load.errors?.build === 'error') parts.push('Site build stamp could not be read');
  else if (!valid(s.siteBuilt)) parts.push('Site build stamp not available in this preview');
  else parts.push(`Site built <time datetime="${esc(s.siteBuilt)}">${keep(s.siteBuilt)}</time>${SHA.test(s.commit ?? '') ? ` from ${commitLink(s.commit)}` : ''}`);
  parts.push('All times UTC');
  return parts.join(' · ');
}

/**
 * Patch every time[data-rel] text in place (no DOM replacement, so focus and scroll stay).
 * data-days="utc" marks the snapshot stamp, whose relative part counts UTC days once it is a day old.
 */
export function refreshTimes(root, now) {
  if (!root?.querySelectorAll) return;
  for (const el of root.querySelectorAll('time[data-rel]')) {
    const text = el.dataset.days === 'utc' ? snapshotAgeText(el.dataset.rel, now) : timeText(el.dataset.rel, now, el.dataset.format || 'both');
    if (el.textContent !== text) el.textContent = text;
  }
}

/** The rows as a <dl> (shared by the dates sheet and About). */
function stampListHTML(items) {
  return `<dl class="stamp-list">${items.map(item => `<div class="stamp-list-row" data-key="${esc(item.key)}"><dt class="stamp-list-label">${esc(item.label)}</dt>`
    + `<dd class="stamp-list-value">${item.html}</dd><dd class="stamp-list-note">${esc(item.note)}</dd></div>`).join('')}</dl>`;
}

/** #stamp-chip, #stamps-body, #about-stamps (after the first About visit) and #footer-stamps. */
export function mountStamps(ctx) {
  const doc = globalThis.document;
  const chip = doc.getElementById('stamp-chip');
  const body = doc.getElementById('stamps-body');
  const about = doc.getElementById('about-stamps');
  const footer = doc.getElementById('footer-stamps');
  let chipKey = null, bodyKey = null, aboutKey = null, footKey = null, aboutVisited = false;

  return {
    render(state) {
      const model = chipModel(state);
      const key = JSON.stringify(model);
      if (chip && key !== chipKey) {
        chipKey = key;
        chip.dataset.state = model.state;
        chip.dataset.tone = model.tone;
        chip.innerHTML = chipHTML(model);
      }

      const extras = extrasFor(state);
      const stamps = stampsOf(state);
      const itemsKey = JSON.stringify([stamps, extras.announcementsCount, extras.announcementsLoad, extras.buildLoad, extras.discovery, extras.discoveryLoad, extras.sweep, state.load?.critical]);
      const items = () => stampItems(stamps, state.now, extras);
      if (body && itemsKey !== bodyKey) {
        bodyKey = itemsKey;
        const s7 = sweepLine(extras.sweep);
        body.innerHTML = `<p class="stamp-list-intro">${esc(STAMPS_INTRO)}</p>${stampListHTML(items())}`
          + `${s7 ? `<p class="stamp-list-sweep">${esc(s7)}</p>` : ''}<p class="stamp-list-closing">${esc(T5)}</p>`;
      }
      if (state.route?.view === 'about') aboutVisited = true;
      if (about && aboutVisited && itemsKey !== aboutKey) {
        aboutKey = itemsKey;
        about.innerHTML = `<p class="stamp-list-intro">${esc(STAMPS_INTRO)}</p>${stampListHTML(items())}<p class="stamp-list-closing">${esc(T5)}</p>`;
      }
      const foot = footerStampsHTML(state);
      if (footer && foot !== footKey) {
        footKey = foot;
        footer.innerHTML = foot;
      }
    },
  };
}
