import {esc, plural, timeTag} from './html.js';
import {getDisplayStatus, statusLabel, STATUS_LABELS, displayCountryName} from './model.js';
import {absoluteLabel, toTime} from '../freshness.js';
import {contextFor} from '../history.js';

export const RECENT_LIMIT = 5;
const GAP = 'This is a coverage gap, not evidence that no protests occurred.';
export const BRIEF_COPY = Object.freeze({
  eventsError: 'Coverage cannot be shown because published records did not load.',
  loading: 'Loading published records…',
  example: 'Illustrative example: one fictional record.',
  exampleNone: 'no record in the illustrative example.',   // lead-approved at integration (INTEGRATION_NOTES)
  exampleLoading: 'Loading the illustrative example…',
  exampleError: 'Illustrative example unavailable',
  watermark: 'Illustrative example • not a real event',
  noMatch: 'No published episode matches these filters.',
  noMatchNote: 'That describes this atlas, not the world. It does not mean no protests happened in this place, on this issue or in this period.',
  ledgerLoading: 'Checking the search log…',
  ended: 'Includes a sourced ended or suspended episode.',
  cityNote: 'City dots are approximate reference points, not protest sites.',
});

const dayText = v => (typeof v === 'string' && Number.isFinite(toTime(v)) ? absoluteLabel(v.slice(0, 10)) : '');
const time = e => { const t = toTime(e?.last_observed_at); return Number.isFinite(t) ? t : -Infinity; };
const newestFirst = events => events.map((e, i) => [e, i]).sort((a, b) => time(b[0]) - time(a[0]) || a[1] - b[1]).map(([e]) => e);
const list = v => (Array.isArray(v) ? v : []);
const directory = countries => new Map(list(countries).filter(c => c?.code).map(c => [c.code, c]));
const results = n => (n === null ? 'results not recorded' : n ? plural(n, 'result') : 'no results');
const button = (attrs, text, cls = 'btn') => `<button type="button" class="${cls}" ${attrs}>${esc(text)}</button>`;
const actions = (...buttons) => `<div class="brief-actions">${buttons.join('')}</div>`;
const lead = (text, prefix = '') => `<p class="brief-lead" role="status">${prefix ? `<span class="visually-hidden">${esc(prefix)}: </span>` : ''}${esc(text)}</p>`;
const WATERMARK = `<p class="brief-watermark">${esc(BRIEF_COPY.watermark)}</p>`;
const BACK_TO_DATA = button('data-set-mode="reported"', 'Back to reported data');
const RETRY_EXAMPLE = button('data-retry="examples"', 'Retry example');

export function countSentence(n, filtered = false, ended = false) {
  const count = `${plural(n, 'published episode')}${filtered ? (n === 1 ? ' matches' : ' match') + ' your filters' : ''}.`;
  return ended ? `${count} ${BRIEF_COPY.ended}` : count;
}

export function overviewModel({mapEvents = [], countries = [], mode = 'reported', filtered = false, status = 'ready'} = {}) {
  const events = list(mapEvents), names = directory(countries), latest = new Map();
  for (const e of newestFirst(events)) if (/^[A-Z]{2}$/.test(e?.country ?? '') && !latest.has(e.country)) latest.set(e.country, e.last_observed_at ?? null);
  return {count: events.length, countryCount: latest.size, directoryTotal: names.size, status, filtered: !!filtered, mode: mode === 'example' ? 'example' : 'reported',
    recent: [...latest].slice(0, RECENT_LIMIT).map(([code, lastObserved]) => ({code, name: displayCountryName(code, names.get(code)?.name) || code, lastObserved}))};
}

export function renderOverview(model, {now} = {}) {
  const m = model ?? overviewModel();
  const head = '<h2 id="country-panel-title" class="brief-title" tabindex="-1">World</h2>';
  const link = `<p class="brief-all"><a href="#/countries">All ${m.directoryTotal ? `${m.directoryTotal} ` : ''}countries and territories, A to Z</a></p>`;
  if (m.status === 'error' || m.status === 'loading') return head + lead(BRIEF_COPY[m.status === 'error' ? 'eventsError' : 'loading']) + link;
  if (m.mode === 'example') {
    const failed = m.status === 'example-error';
    return head + WATERMARK + lead(failed ? BRIEF_COPY.exampleError : m.status === 'example-loading' ? BRIEF_COPY.exampleLoading : BRIEF_COPY.example)
      + (failed ? actions(RETRY_EXAMPLE, BACK_TO_DATA) : '') + link;
  }
  if (!m.count) return head + lead(BRIEF_COPY.noMatch) + `<p class="brief-note">${esc(BRIEF_COPY.noMatchNote)}</p>` + link;
  const rows = m.recent.map(r => `<li><button type="button" class="brief-country" data-select-country="${esc(r.code)}"><span class="brief-country-name">${esc(r.name)}</span>`
    + ` · <span class="brief-country-date">latest evidence ${esc(dayText(r.lastObserved) || 'not established')}</span></button></li>`).join('');
  return head + lead(`Published episodes in ${m.countryCount}${m.directoryTotal ? ` of ${m.directoryTotal}` : ''} countries and territories${m.filtered ? ' match your filters' : ''}.`)
    + `<h3 class="brief-subtitle">Most recent evidence</h3><ul class="brief-countries">${rows}</ul>${link}`;
}

// state: records | filtered-out | no-record | error | loading | example-loading | example-error. No leads (C-19).
export function briefModel({code, mapEvents = [], allEvents = [], countries = [], coverage = null, research = null, mode = 'reported',
  example = 'ready', contexts = null, filtered = false, error = false, loading = false} = {}) {
  const country = directory(countries).get(code), isExample = mode === 'example';
  const matching = newestFirst(list(mapEvents).filter(e => e?.country === code));
  const publishedCount = list(allEvents).filter(e => e?.country === code).length;
  const state = error ? 'error' : loading ? 'loading' : isExample && example !== 'ready' ? `example-${example === 'error' ? 'error' : 'loading'}`
    : matching.length ? 'records' : publishedCount ? 'filtered-out' : 'no-record';
  const entry = coverage?.countries && (list(coverage.countries).find(r => r?.code === code) ?? {});
  const row = research?.countries && (list(research.countries).find(r => r?.code === code) ?? {});
  const cities = new Map();
  if (state === 'records' && !isExample) {
    for (const e of matching) for (const {name} of contextFor(contexts, e.id)?.cities ?? []) if (name) cities.set(`${code}:${name}`, name);
  }
  const isoName = country?.isoName || country?.name || code;   // map-view passes display names with isoName kept
  return {code, name: displayCountryName(code, country?.name) || code, isoName, region: country?.region || '', mode: isExample ? 'example' : 'reported', state, filtered: !!filtered,
    matching: state === 'records' ? matching : [], publishedCount, hasEnded: state === 'records' && matching.some(e => e.status === 'ended'),
    cities: [...cities].map(([value, name]) => ({value, name})),
    ledger: {
      coverage: entry ? (entry.status === 'limited-source-check' ? 'Limited source check' : 'Not reviewed') : null,
      languages: entry ? list(entry.languages).filter(Boolean) : null,
      lastChecked: entry ? entry.last_checked ?? '' : null,
      screen: row ? {status: ['searched', 'search-failed'].includes(row.status) ? row.status : 'not-searched',
        attemptedAt: typeof row.attempted_at === 'string' ? row.attempted_at : null,
        resultCount: Number.isInteger(row.result_count) && row.result_count >= 0 ? row.result_count : null} : null,
      humanReview: 'Not completed',
    }};
}

export function searchSentence(model, researchLoad = 'idle') {
  const screen = model?.ledger?.screen, name = model?.name ?? '';
  if (!screen) return researchLoad === 'error' ? `The search log could not load, so whether ${name} was searched is not shown here. ${GAP}` : BRIEF_COPY.ledgerLoading;
  const when = dayText(screen.attemptedAt);
  if (screen.status === 'searched') return `A first search was logged on ${when || 'an unrecorded date'} (${results(screen.resultCount)}, not reviewed). ${GAP}`;
  if (screen.status === 'search-failed') return `A first search${when ? ` on ${when}` : ''} failed, so ${name} has not been checked yet. ${GAP}`;
  return `${name} has not been searched yet. ${GAP}`;
}

export function renderBrief(m, {now, hasPolygon = true, lazy = {}, selectedCity = ''} = {}) {
  if (!m?.code) return '';
  const back = button('data-clear-filter="country"', 'Back to world', 'btn btn--quiet');
  const retry = (name, cls) => button(`data-retry="${name}"`, 'Retry', cls);
  let html = `<p class="brief-eyebrow">Country brief${m.region ? ` · ${esc(m.region)}` : ''}</p><h2 id="country-panel-title" class="brief-title" tabindex="-1">${esc(m.name)}</h2>`
    + (m.isoName && m.isoName !== m.name ? `<p class="brief-iso">ISO name: ${esc(m.isoName)}</p>` : '');
  if (m.state === 'error') return html + lead(BRIEF_COPY.eventsError) + actions(button('data-action="retry-data"', 'Retry'), back);
  if (m.state === 'loading') return html + lead(BRIEF_COPY.loading) + actions(back);
  const records = m.state !== 'records' ? '' : '<h3 class="brief-subtitle">Records</h3><ul class="brief-records">' + m.matching.map(e => {
    const status = getDisplayStatus(e, now);
    const mark = m.mode === 'example' ? `<span class="brief-record-mark">${esc(BRIEF_COPY.watermark)}</span>` : '';
    return `<li><a class="brief-record" href="#/record/${esc(e.id)}" data-open-record="${esc(e.id)}">${esc(e.title)}</a><p class="brief-record-meta">${mark}`
      + `${esc(statusLabel(status, e) || STATUS_LABELS[status] || STATUS_LABELS.unknown)} · Latest evidence ${esc(dayText(e.last_observed_at) || 'not established')}</p></li>`;
  }).join('') + '</ul>';
  if (m.mode === 'example') {
    const failed = m.state === 'example-error';
    const text = failed ? BRIEF_COPY.exampleError : m.state === 'example-loading' ? BRIEF_COPY.exampleLoading
      : m.state === 'records' ? BRIEF_COPY.example : `${m.name}: ${BRIEF_COPY.exampleNone}`;
    return html + WATERMARK + (text ? lead(text) : '') + records + actions(...(failed ? [RETRY_EXAMPLE] : []), BACK_TO_DATA, back);
  }

  const research = lazy?.research ?? 'idle', {ledger: l} = m, retryInLead = !l.screen && research === 'error';
  if (m.state === 'records') html += lead(countSentence(m.matching.length, m.filtered, m.hasEnded), m.name);
  else if (m.state === 'filtered-out') {
    html += lead(`${m.name} has ${plural(m.publishedCount, 'published episode')}, but none match your current filters.`)
      + actions(button('data-action="clear-except-country"', `Show all for ${m.name}`));
  } else html += lead(`${m.name}: no published episode in this atlas. ${searchSentence(m, research)}`) + (retryInLead ? actions(retry('research', 'btn')) : '');
  if (!hasPolygon) html += `<p class="brief-note">${esc(`${m.name} is too small to draw on this map at this scale.${m.state === 'records' ? ' Its records are listed below and in Reports.' : ''}`)}</p>`;

  const row = (label, value) => `<div><dt>${label}</dt><dd>${value}</dd></div>`;
  const unavailable = name => `Ledger unavailable ${retry(name, 'btn btn--quiet brief-retry')}`;
  let rows;
  if (l.coverage === null) {
    rows = lazy?.coverage === 'error' ? row('Source coverage', unavailable('coverage'))
      : ['Source coverage', 'Languages read', 'Last article check for this country'].map(label => row(label, 'Loading…')).join('');
  } else {
    rows = row('Source coverage', esc(l.coverage)) + row('Languages read', esc(l.languages.join(', ') || 'Not established'))
      + row('Last article check for this country', timeTag(l.lastChecked, now, 'both'));
  }
  const s = l.screen;
  rows += row('First search logged', !s ? (research === 'error' ? (retryInLead ? 'Ledger unavailable' : unavailable('research')) : 'Loading…')
    : s.status === 'searched' ? `${timeTag(s.attemptedAt, now, 'absolute')} · ${esc(results(s.resultCount))} (not reviewed)`
      : s.status === 'search-failed' ? 'Search failed' : 'Not yet searched') + row('Human editorial review', esc(l.humanReview));
  html += `<dl class="brief-ledger">${rows}</dl>`;

  if (m.cities.length) {
    html += '<div class="brief-cities"><p class="brief-label">Reported cities:</p><div class="brief-city-chips">' + m.cities.map(c => {
      const on = c.value === selectedCity;
      return `<button type="button" class="chip brief-city" data-focus-key="city:${esc(c.value)}" ${on ? 'data-clear-filter="city"' : `data-select-city="${esc(c.value)}"`} aria-pressed="${on}">`
        + `<svg class="icon chip-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>${esc(c.name)}</button>`;
    }).join('') + `</div><p class="brief-note">${esc(BRIEF_COPY.cityNote)}</p></div>`;
  }
  const show = m.publishedCount ? button(`data-select-country="${esc(m.code)}" data-view-after="latest"`, `Show ${m.name} in Reports`, 'btn btn--primary') : '';
  return html + records + actions(show, back);
}
