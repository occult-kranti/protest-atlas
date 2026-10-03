// About view data (WP5; SPEC §14): research scope, the lazy country-by-country ledger table and the
// lead-discovery audit. Pure helpers first; DOM work happens only inside mountAbout(). Safe to import in Node.
import {REPO_URL, esc, icon} from './html.js';
import {absoluteLabel, toTime} from '../freshness.js';

const RUN_URL = new RegExp(`^${REPO_URL.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/actions/runs/\\d+$`);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';
const LIMIT = 'A logged search is not a completed country history. No country is certified exhaustive. Regional totals reflect where we looked, so they cannot be compared or ranked.';
const DISCOVERY_EXPLAINER = 'A one-time audit of one automated lead list. Leads are never published automatically. It does not show whether the discovery service is working today.';
const collator = new Intl.Collator('en', {sensitivity: 'base'});

const eventsOf = events => (Array.isArray(events) ? events : (Array.isArray(events?.events) ? events.events : []));

/**
 * Scope counts for #research-scope. The window comes from the ledger, never from hard-coded dates.
 * cityCount is null when the event context is missing (not zero).
 */
export function researchScope({research, contexts, events, countries} = {}) {
  const list = eventsOf(events);
  const ledger = Array.isArray(research?.countries) ? research.countries : [];
  const directory = Array.isArray(countries) ? countries : [];
  const byId = new Map(list.map(event => [event.id, event]));
  let cityCount = null;
  if (Array.isArray(contexts?.records)) {
    const cities = new Set();
    for (const record of contexts.records) {
      const event = byId.get(record?.event_id);
      if (!event) continue;
      for (const city of Array.isArray(record.cities) ? record.cities : []) if (city?.name) cities.add(`${event.country}:${city.name}`);
    }
    cityCount = cities.size;
  }
  return {
    screened: ledger.filter(row => row?.status === 'searched').length,
    failed: ledger.filter(row => row?.status === 'search-failed').length,
    total: directory.length || ledger.length,
    countriesWithRecords: new Set(list.map(event => event.country).filter(Boolean)).size,
    cityCount,
    ended: list.filter(event => event.status === 'ended').length,
    positions: list.reduce((sum, event) => sum + (Array.isArray(event.positions) ? event.positions.length : 0), 0),
    episodes: list.length,
    windowStart: ISO_DAY.test(research?.window_start ?? '') ? research.window_start : null,
    windowEnd: ISO_DAY.test(research?.window_end ?? '') ? research.window_end : null,
  };
}

/**
 * The lead-discovery audit row (About and the dates sheet, C-03). null when the manifest is missing or invalid.
 * runUrl is kept only when it is this repository's Actions run URL.
 */
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

// ---- HTML ----

const retry = attrs => `<p class="scope-actions"><button type="button" class="btn" ${attrs}>Retry</button></p>`;

/** #research-scope body. status is state.load.lazy.research; eventsFailed follows load.errors.events (C-37). */
export function researchScopeHTML({scope, status, eventsFailed = false}) {
  if (eventsFailed) return `<p class="scope-status" role="status">Research scope unavailable.</p>${retry('data-action="retry-data"')}`;
  if (status === 'error') return `<p class="scope-status" role="status">Research scope unavailable.</p>${retry('data-retry="research"')}`;
  if (!scope) return `<p class="scope-status" role="status">Loading the research scope…</p>`;
  const row = (term, value) => `<div class="scope-row"><dt>${term}</dt><dd>${value}</dd></div>`;
  return `<dl class="scope-counts">`
    + row('First searches logged', `${scope.screened} of ${scope.total}`)
    + row('Countries and territories with a published episode', `${scope.countriesWithRecords}`)
    + row('City references in published records', scope.cityCount === null ? 'Not established' : `${scope.cityCount}`)
    + row('Ended or suspended episodes', `${scope.ended}`)
    + row('Positions recorded', `${scope.positions} across ${scope.episodes} episodes; each is tied to its own target.`)
    + `</dl><p class="scope-limit">${LIMIT}</p>`
    + `<details class="ledger-details" data-key="ledger"><summary>Inspect country-by-country research</summary><div class="ledger-body"></div></details>`;
}

const STAGES = {searched: 'First search logged', 'search-failed': 'Search failed'};

/** The country-by-country table, rendered on the first toggle only. Never includes candidate URLs. */
export function ledgerTableHTML({research, events, countries}) {
  const counts = new Map();
  for (const event of eventsOf(events)) counts.set(event.country, (counts.get(event.country) ?? 0) + 1);
  const entries = Array.isArray(research?.countries) ? research.countries : [];
  const ledger = new Map(entries.map(row => [row.code, row]));
  // A countries-only failure (C-37) still lists every ledger entry, by code.
  const directory = Array.isArray(countries) && countries.length ? countries
    : entries.filter(row => typeof row?.code === 'string').map(row => ({code: row.code, name: row.code}));
  const rows = directory.slice().sort((a, b) => collator.compare(a.name ?? '', b.name ?? '') || String(a.code).localeCompare(String(b.code)));
  const start = ISO_DAY.test(research?.window_start ?? '') ? absoluteLabel(research.window_start) : 'not established';
  const end = ISO_DAY.test(research?.window_end ?? '') ? absoluteLabel(research.window_end) : 'not established';
  const body = rows.map(country => {
    const entry = ledger.get(country.code);
    const count = counts.get(country.code) ?? 0;
    const pages = Array.isArray(entry?.reviewed_urls) ? entry.reviewed_urls.length : 0;
    return `<tr><th scope="row">${esc(country.name || country.code)}</th><td>${STAGES[entry?.status] ?? 'Not yet searched'}</td>`
      + `<td class="ledger-num">${count ? count : 'None published'}</td><td class="ledger-num">${pages}</td></tr>`;
  }).join('');
  return `<div class="ledger-wrap" tabindex="0" role="region" aria-labelledby="ledger-caption"><table class="ledger-table">`
    + `<caption id="ledger-caption">First searches, ${esc(start)} to ${esc(end)}</caption>`
    + `<thead><tr><th scope="col">Country or territory</th><th scope="col">Research stage</th><th scope="col">Published episodes</th><th scope="col">Source pages read</th></tr></thead>`
    + `<tbody>${body}</tbody></table></div>`;
}

/** #about-discovery body. status is state.load.lazy.discovery. */
export function discoveryHTML({view, status}) {
  if (status === 'error' || (status === 'ready' && !view)) return `<p class="about-discovery-status" role="status">Discovery audit unavailable.</p>`;
  if (!view) return `<p class="about-discovery-status" role="status">Loading…</p>`;
  return `<p class="about-discovery-line">Lead-discovery audit: GDELT artifact created <time datetime="${esc(view.date)}">${esc(view.dateText)}</time> · ${esc(view.countText)}.</p>`
    + `<p class="about-discovery-note">${DISCOVERY_EXPLAINER}</p>`
    + (view.intervalText ? `<p class="about-discovery-note">${esc(view.intervalText)}</p>` : '')
    + (view.runUrl ? `<p class="about-discovery-run"><a href="${esc(view.runUrl)}" target="_blank" rel="noopener noreferrer">Workflow run${icon('external')}${NEW_TAB}</a></p>` : '');
}

// ---- DOM (mountAbout) ----

function patch(el, html, cache) {
  if (cache.get(el) === html) return false;
  const active = el.ownerDocument.activeElement;
  let focus = null;
  if (active && active !== el && el.contains(active)) {
    if (active.tagName === 'SUMMARY') focus = 'details > summary';
    else for (const attr of ['data-retry', 'data-action', 'href']) {
      const value = active.getAttribute(attr);
      if (value) { focus = `[${attr}="${CSS.escape(value)}"]`; break; }
    }
  }
  const open = [...el.querySelectorAll('details[data-key][open]')].map(d => d.dataset.key);
  el.innerHTML = html;
  cache.set(el, html);
  for (const key of open) el.querySelector(`details[data-key="${CSS.escape(key)}"]`)?.setAttribute('open', '');
  if (focus) el.querySelector(focus)?.focus({preventScroll: true});
  return true;
}

/**
 * Mounts #research-scope and #about-discovery on the first visit to #/about (C-21). Loads the research ledger and
 * the discovery manifest lazily; the ledger table renders only when its <details> is first opened.
 */
export function mountAbout(ctx = {}) {
  const doc = globalThis.document;
  const scopeEl = doc?.getElementById('research-scope');
  const discoveryEl = doc?.getElementById('about-discovery');
  if (!scopeEl && !discoveryEl) return {render() {}};
  const cache = new WeakMap();
  const requested = new Set();
  let lastState = null;
  let built = null;

  // Renders on the first open, and again only when one of its three inputs changed (e.g. countries after a retry).
  function fillLedger(details) {
    const body = details.querySelector('.ledger-body');
    if (!body || !lastState) return;
    const {research, events, countries} = lastState.data ?? {};
    if (body.childElementCount && built?.research === research && built.events === events && built.countries === countries) return;
    built = {research, events, countries};
    body.innerHTML = ledgerTableHTML({research, events, countries});
  }

  scopeEl?.addEventListener('toggle', event => {
    const details = event.target;
    if (details?.matches?.('details.ledger-details') && details.open) fillLedger(details);
  }, true);

  function request(name, state) {
    const status = state.load?.lazy?.[name];
    if (requested.has(name) || state.data?.[name] || (status && status !== 'idle')) return;
    requested.add(name);
    Promise.resolve().then(() => ctx.actions?.loadLazy?.(name)).catch(() => {});
  }

  return {
    render(state) {
      if (!state) return;
      const onView = state.route?.view === 'about';
      if (!onView && !lastState) return;                       // C-21: nothing until the first visit
      if (onView) { request('research', state); request('discovery', state); }
      if (lastState && lastState.data === state.data && lastState.load === state.load) { lastState = state; return; }
      lastState = state;
      const data = state.data ?? {};
      const load = state.load ?? {};
      if (scopeEl) {
        const researchStatus = load.lazy?.research;
        const eventsFailed = Boolean(load.errors?.events) || (load.critical === 'error' && !data.events);
        const ready = Array.isArray(data.research?.countries) && Array.isArray(data.events?.events);
        const scope = ready ? researchScope({research: data.research, contexts: data.contexts, events: data.events, countries: data.countries}) : null;
        patch(scopeEl, researchScopeHTML({scope, status: researchStatus, eventsFailed}), cache);
        const details = scopeEl.querySelector('details.ledger-details');
        if (details?.open) fillLedger(details);
      }
      if (discoveryEl) {
        const view = discoveryView(data.discovery);
        patch(discoveryEl, discoveryHTML({view, status: load.lazy?.discovery ?? (data.discovery ? 'ready' : 'idle')}), cache);
      }
    },
  };
}
