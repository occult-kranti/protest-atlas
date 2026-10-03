// A–Z directory of all countries and territories with coverage-honest labels (WP5; SPEC §13, E9).
// Pure helpers first; DOM work happens only inside mountCountries(). Safe to import in Node.
import {esc, icon} from './html.js';

const LABELS = {
  checking: 'Checking the search log…',
  searched: 'Searched · no published episode',
  failed: 'Search failed · no published episode',
  'not-searched': 'Not yet searched',
  unavailable: 'Coverage unavailable',
};
const NOT_DRAWN = 'Not drawn on the map at this scale';
const collator = new Intl.Collator('en', {sensitivity: 'base'});

/** NFD, strip combining marks, lower-case (the same folding as the Reports search, tech §4.6). */
const fold = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en');

export function entriesLabel(n) {
  return `${n} ${n === 1 ? 'entry' : 'entries'}`;
}

const episodesLabel = n => `${n} ${n === 1 ? 'episode' : 'episodes'} published`;

function failures(loadError) {
  if (!loadError) return {events: false, research: false};
  if (loadError === true || loadError === 'events') return {events: true, research: false};
  if (loadError === 'research') return {events: false, research: true};
  return {events: Boolean(loadError.events), research: Boolean(loadError.research)};
}

/** Set of ISO codes drawn on the map, or null when the code table is absent, empty or malformed. */
function drawnCodes(mapCodes) {
  const codes = mapCodes?.codes;
  if (!codes || typeof codes !== 'object') return null;
  const values = Object.values(codes).filter(code => typeof code === 'string' && /^[A-Z]{2}$/.test(code));
  return values.length ? new Set(values) : null;
}

/**
 * One row per directory entry, A–Z by name.
 * - events: the reported envelope ({events: [...]}) or an array of events; example records never count here.
 * - research: the research ledger, or null while it is still loading (rows read "Checking the search log…").
 * - loadError: null | 'events' | 'research' | {events, research}. An events failure makes every row
 *   "Coverage unavailable" (C-37); a ledger failure does so only for rows without a published episode.
 * - mapCodes: public/world-map-codes.json once loaded; drawn is null until then.
 */
export function directoryRows({countries, events, research, loadError, mapCodes = null} = {}) {
  const failed = failures(loadError);
  const list = Array.isArray(events) ? events : (Array.isArray(events?.events) ? events.events : []);
  const counts = new Map();
  for (const event of list) if (event?.country) counts.set(event.country, (counts.get(event.country) ?? 0) + 1);
  const ledger = Array.isArray(research?.countries) ? new Map(research.countries.map(row => [row.code, row])) : null;
  const drawn = drawnCodes(mapCodes);
  return (Array.isArray(countries) ? countries : [])
    .filter(country => country && typeof country.code === 'string')
    .map(country => {
      const count = counts.get(country.code) ?? 0;
      let status;
      if (failed.events) status = 'unavailable';
      else if (count > 0) status = 'published';
      else if (failed.research) status = 'unavailable';
      else if (!ledger) status = 'checking';
      else {
        const row = ledger.get(country.code);
        status = row?.status === 'searched' ? 'searched' : row?.status === 'search-failed' ? 'failed' : 'not-searched';
      }
      return {
        code: country.code,
        name: country.name || country.code,
        region: country.region || '',
        count: failed.events ? null : count,
        status,
        label: status === 'published' ? episodesLabel(count) : LABELS[status],
        drawn: drawn ? drawn.has(country.code) : null,
      };
    })
    .sort((a, b) => collator.compare(a.name, b.name) || a.code.localeCompare(b.code));
}

const words = value => fold(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * [{region, rows}] with regions A–Z and empty regions dropped. Folded search: every query word must start a word of
 * the name or region, or equal the ISO code ("aland" finds Åland Islands, not New Zealand).
 */
export function regionGroups(rows, query = '') {
  const tokens = words(query);
  const matches = row => {
    if (!tokens.length) return true;
    const haystack = words(`${row.name} ${row.region}`);
    const code = fold(row.code);
    return tokens.every(token => token === code || haystack.some(word => word.startsWith(token)));
  };
  const groups = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!matches(row)) continue;
    const region = row.region || 'Other';
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => collator.compare(a, b)).map(([region, list]) => ({region, rows: list}));
}

// ---- HTML ----

const slug = value => fold(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';

function rowHTML(row) {
  return `<li class="dir-item"><button type="button" class="dir-row" data-select-country="${esc(row.code)}" data-view-after="map" data-status="${esc(row.status)}">`
    + `<span class="dir-text"><span class="dir-name">${esc(row.name)}</span><span class="visually-hidden">, </span>`
    + `<span class="dir-status">${esc(row.label)}</span>`
    + (row.drawn === false ? `<span class="visually-hidden">, </span><span class="dir-note">${NOT_DRAWN}</span>` : '')
    + `</span>${icon('chevron-right')}</button></li>`;
}

/** The region sections for a filtered set of groups (SPEC §13). */
export function directoryHTML(groups) {
  return groups.map(group => {
    const id = `dir-region-${slug(group.region)}`;
    return `<section class="dir-region" aria-labelledby="${id}"><h2 class="dir-region-title" id="${id}">${esc(group.region)} <span class="dir-count">${entriesLabel(group.rows.length)}</span></h2>`
      + `<ul class="dir-list">${group.rows.map(rowHTML).join('')}</ul></section>`;
  }).join('');
}

/** Dek text (SPEC §13) from the reported data; null while the counts are not known. */
export function directoryDek({rows, research}) {
  if (!rows.length || rows.some(row => row.status === 'unavailable' && row.count === null)) return null;
  const total = rows.length;
  const withRecords = rows.filter(row => row.status === 'published').length;
  const first = `${withRecords} of ${total} have a published episode.`;
  if (!Array.isArray(research?.countries)) return first;
  const codes = new Set(rows.map(row => row.code));
  const logged = research.countries.filter(row => codes.has(row.code) && row.status === 'searched').length;
  const scope = logged === total ? `all ${total}` : `${logged} of ${total}`;
  return `${first} A first search was logged for ${scope}; searched is not reviewed, and no published episode does not mean no protests.`;
}

// ---- DOM (mountCountries) ----

function focusSelector(el) {
  const code = el.getAttribute?.('data-select-country');
  if (code) return `[data-select-country="${CSS.escape(code)}"]`;
  if (el.id) return `#${CSS.escape(el.id)}`;
  for (const attr of ['data-action', 'data-retry']) {
    const value = el.getAttribute?.(attr);
    if (value) return `[${attr}="${CSS.escape(value)}"]`;
  }
  return null;
}

function patch(el, html, cache) {
  if (cache.get(el) === html) return false;
  const active = el.ownerDocument.activeElement;
  const focus = active && active !== el && el.contains(active) ? focusSelector(active) : null;
  el.innerHTML = html;
  cache.set(el, html);
  if (focus) el.querySelector(focus)?.focus({preventScroll: true});
  return true;
}

/**
 * Mounts #countries-root on the first visit to #/countries (C-21), loads the research ledger and the map code
 * table lazily, and keeps the directory current. Row taps are handled by app.js (data-select-country +
 * data-view-after="map"; example mode returns to reported data first, C-38).
 */
export function mountCountries(ctx = {}) {
  const doc = globalThis.document;
  const root = doc?.getElementById('countries-root');
  if (!root) return {render() {}};
  const cache = new WeakMap();
  const requested = new Set();
  let parts = null;
  let query = '';
  let timer = 0;
  let lastState = null;

  function skeleton() {
    root.innerHTML = `<div class="dir-dek"></div>`
      + `<div class="dir-search"><label class="dir-search-label" for="dir-query">Find a country or territory</label>`
      + `<input id="dir-query" class="dir-search-input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false"></div>`
      + `<p class="dir-empty" role="status"></p><div class="dir-regions"></div>`;
    parts = {dek: root.querySelector('.dir-dek'), input: root.querySelector('#dir-query'),
      empty: root.querySelector('.dir-empty'), regions: root.querySelector('.dir-regions')};
    parts.input.value = query;
    parts.input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { query = parts.input.value; if (lastState) draw(lastState); }, 120);
    });
    cache.delete(root);
  }

  function message(html) {
    parts = null;
    patch(root, html, cache);
  }

  function request(name, state) {
    const status = state.load?.lazy?.[name];
    if (requested.has(name) || state.data?.[name] || (status && status !== 'idle')) return;
    requested.add(name);
    Promise.resolve().then(() => ctx.actions?.loadLazy?.(name)).catch(() => {});
  }

  function draw(state) {
    const load = state.load ?? {};
    const data = state.data ?? {};
    const errors = load.errors ?? {};
    if (errors.countries || (load.critical !== 'loading' && !Array.isArray(data.countries))) {
      message(`<div class="empty-state dir-error" role="status"><h2 class="dir-error-title">The country directory could not load.</h2>`
        + `<p class="dir-actions"><button type="button" class="btn btn--primary" data-action="retry-data">Retry</button></p></div>`);
      return;
    }
    if (load.critical === 'loading' && !(data.countries?.length)) {
      message(`<p class="dir-loading" role="status">Loading…</p>`);
      return;
    }
    if (!parts) skeleton();
    const researchStatus = load.lazy?.research;
    const rows = directoryRows({
      countries: data.countries,
      events: data.events,
      research: data.research ?? null,
      loadError: {events: Boolean(errors.events) || (!data.events && load.critical !== 'loading'), research: researchStatus === 'error'},
      mapCodes: data.mapCodes ?? null,
    });
    let dek;
    if (errors.events || !data.events) {
      dek = `<p class="dir-dek-text">Coverage cannot be shown because published records did not load.</p>`
        + `<p class="dir-actions"><button type="button" class="btn btn--primary" data-action="retry-data">Retry</button></p>`;
    } else {
      const text = directoryDek({rows, research: data.research});
      dek = text ? `<p class="dir-dek-text">${esc(text)}</p>` : '';
      if (researchStatus === 'error') dek += `<p class="dir-actions"><button type="button" class="btn" data-retry="research">Retry</button></p>`;
    }
    if (state.mode === 'example') dek += `<p class="dir-dek-text dir-dek-example">This directory shows reported data. Choosing a country returns you to it.</p>`;
    patch(parts.dek, dek, cache);
    const groups = regionGroups(rows, query);
    const trimmed = query.trim();
    const emptyText = groups.length || !trimmed ? '' : `No country or territory matches '${trimmed}'.`;
    if (parts.empty.textContent !== emptyText) parts.empty.textContent = emptyText;
    patch(parts.regions, directoryHTML(groups), cache);
  }

  return {
    render(state) {
      if (!state) return;
      const onView = state.route?.view === 'countries';
      if (!onView && !lastState) return;                       // C-21: nothing until the first visit
      if (onView) { request('research', state); request('mapCodes', state); }
      if (lastState && lastState.data === state.data && lastState.load === state.load && lastState.mode === state.mode) {
        lastState = state;
        return;
      }
      lastState = state;
      draw(state);
    },
  };
}
