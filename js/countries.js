// A–Z directory of all countries and territories with coverage-honest labels (WP5; SPEC §13, E9).
// Pure helpers first; DOM work happens only inside mountCountries(). Safe to import in Node.
import {esc, icon, plural, patchHTML} from './html.js';
import {foldText as fold, displayCountryName, countrySearchTerms} from './model.js';

const LABELS = {
  checking: 'Checking the search log…',
  pending: 'Checking published records…',
  searched: 'Searched · no published episode',
  failed: 'Search failed · no published episode',
  'not-searched': 'Not yet searched',
  unavailable: 'Coverage unavailable',
  logUnavailable: 'Search log unavailable',   // lead-approved at integration (INTEGRATION_NOTES)
};
const LOG_ERROR = 'The search log could not load, so whether each country or territory was searched is not shown here.';
const NOT_DRAWN = 'Not drawn on the map at this scale';
const collator = new Intl.Collator('en', {sensitivity: 'base'});

export const entriesLabel = n => plural(n, 'entry', 'entries');
const episodesLabel = n => `${plural(n, 'episode')} published`;

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
 * Rows A–Z by display name (E9). research null = still loading; loadError null|'events'|'research'|{events, research} (C-37).
 * eventsPending: published records are (re)loading, so no row may be labelled from the search log yet (never
 * "Searched · no published episode" without records). `name` is the short display name; `isoName` the directory name.
 */
export function directoryRows({countries, events, research, loadError, mapCodes = null, eventsPending = false} = {}) {
  const failed = failures(loadError);
  const pending = !failed.events && Boolean(eventsPending);
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
      else if (pending) status = 'pending';
      else if (count > 0) status = 'published';
      else if (failed.research) status = 'unavailable';
      else if (!ledger) status = 'checking';
      else {
        const row = ledger.get(country.code);
        status = row?.status === 'searched' ? 'searched' : row?.status === 'search-failed' ? 'failed' : 'not-searched';
      }
      const isoName = country.name || country.code;
      return {
        code: country.code,
        name: displayCountryName(country.code, country.name) || country.code,
        isoName,
        terms: countrySearchTerms(country.code, isoName),
        region: country.region || '',
        count: failed.events || pending ? null : count,
        status,
        label: status === 'published' ? episodesLabel(count) : status === 'unavailable' && !failed.events ? LABELS.logUnavailable : LABELS[status],
        drawn: drawn ? drawn.has(country.code) : null,
      };
    })
    .sort((a, b) => collator.compare(a.name, b.name) || a.code.localeCompare(b.code));
}

const words = value => fold(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const haystacks = new WeakMap();

/**
 * [{region, rows}] A–Z. Each folded query word starts a word of the display name, the ISO name, a common alias
 * (model.countrySearchTerms: "South Korea", "UK", "Ivory Coast", "USA") or the region, or equals the code.
 */
export function regionGroups(rows, query = '') {
  const tokens = words(query);
  const haystack = row => {
    if (!haystacks.has(row)) haystacks.set(row, words([row.name, row.isoName, ...(row.terms ?? []), row.region].filter(Boolean).join(' ')));
    return haystacks.get(row);
  };
  const matches = row => {
    if (!tokens.length) return true;
    const code = fold(row.code);
    return tokens.every(token => token === code || haystack(row).some(word => word.startsWith(token)));
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
  const iso = row.isoName && row.isoName !== row.name
    ? `<span class="dir-iso"><span class="visually-hidden">, ISO name </span>${esc(row.isoName)}</span>` : '';
  return `<li class="dir-item"><button type="button" class="dir-row" data-select-country="${esc(row.code)}" data-view-after="map" data-status="${esc(row.status)}">`
    + `<span class="dir-text"><span class="dir-name">${esc(row.name)}</span>${iso}<span class="visually-hidden">, </span>`
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
  if (!rows.length || rows.some(row => row.count === null && (row.status === 'unavailable' || row.status === 'pending'))) return null;
  const total = rows.length;
  const withRecords = rows.filter(row => row.status === 'published').length;
  const first = `${withRecords} of ${total} have a published episode.`;
  if (!Array.isArray(research?.countries)) return first;
  const codes = new Set(rows.map(row => row.code));
  const logged = research.countries.filter(row => codes.has(row.code) && row.status === 'searched').length;
  const scope = logged === total ? `all ${total}` : `${logged} of ${total}`;
  return `${first} A first search was logged for ${scope}; searched is not reviewed, and no published episode does not mean no protests.`;
}

/** E-none for the directory search: actionable, and honest about how names are matched. */
export function noMatchText(query) {
  const q = String(query ?? '').trim();
  return q ? `No country or territory name starts with '${q}'. Try another spelling, or browse A–Z.` : '';
}

/**
 * patchHTML that never drops focus to <body>: when the focused control is replaced by one patchHTML cannot match
 * (a Retry that became "Retrying…", or the loaded content), focus moves to `fallback()` (SPEC C-37, WCAG 2.4.3).
 */
export function patchKeepingFocus(el, html, cache, fallback) {
  const doc = el.ownerDocument;
  const had = el.contains(doc.activeElement);
  const changed = patchHTML(el, html, cache);
  if (changed && had && !el.contains(doc.activeElement)) fallback?.()?.focus({preventScroll: true});
  return changed;
}

// ---- DOM (mountCountries) ----

/** Mounts #countries-root on first visit (C-21); lazy ledger and map codes. Row taps are app.js's (C-38). */
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
    root.innerHTML = `<div class="dir-dek" tabindex="-1"></div>`
      + `<div class="dir-search"><label class="dir-search-label" for="dir-query">Find a country or territory</label>`
      + `<div class="dir-search-field">${icon('search').replace('class="icon"', 'class="icon dir-search-icon"')}`
      + `<input id="dir-query" class="dir-search-input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false" aria-describedby="dir-search-hint">`
      + `<button type="button" class="icon-btn dir-clear" data-dir-clear aria-label="Clear search" hidden>${icon('close')}</button></div>`
      + `<p class="dir-search-hint" id="dir-search-hint">Common names work too, such as South Korea, UK or Ivory Coast.</p></div>`
      + `<div class="dir-empty"><p class="dir-empty-text" role="status"></p>`
      + `<p class="dir-empty-actions" hidden><button type="button" class="btn" data-dir-clear>Browse A–Z</button></p></div>`
      + `<div class="dir-regions"></div>`;
    parts = {dek: root.querySelector('.dir-dek'), input: root.querySelector('#dir-query'), clear: root.querySelector('.dir-clear'),
      empty: root.querySelector('.dir-empty-text'), emptyActions: root.querySelector('.dir-empty-actions'), regions: root.querySelector('.dir-regions')};
    parts.input.value = query;
    parts.clear.hidden = !query;
    parts.input.addEventListener('input', () => {
      parts.clear.hidden = !parts.input.value;
      clearTimeout(timer);
      timer = setTimeout(() => { query = parts.input.value; if (lastState) draw(lastState); }, 120);
    });
    cache.delete(root);
  }

  // Clear and "Browse A–Z" reset the search here; they carry no data-* hook app.js handles.
  root.addEventListener('click', event => {
    if (!event.target?.closest?.('[data-dir-clear]') || !parts) return;
    clearTimeout(timer);
    query = parts.input.value = '';
    parts.clear.hidden = true;
    if (lastState) draw(lastState);
    parts.input.focus({preventScroll: true});
  });

  function message(html) {
    parts = null;
    patchKeepingFocus(root, html, cache, () => root.querySelector('[data-action="retry-data"]') ?? doc.getElementById('countries-title'));
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
    // A retry keeps the directory but has no records yet: rows wait for them (never labelled from the ledger alone).
    const eventsPending = !data.events && !errors.events && load.critical === 'loading';
    const rows = directoryRows({
      countries: data.countries,
      events: data.events,
      research: data.research ?? null,
      loadError: {events: Boolean(errors.events) || (!data.events && load.critical !== 'loading'), research: researchStatus === 'error'},
      mapCodes: data.mapCodes ?? null,
      eventsPending,
    });
    let dek;
    if (eventsPending) {
      dek = `<p class="dir-dek-text" role="status">Loading published records…</p>`
        + `<p class="dir-actions"><button type="button" class="btn btn--primary" aria-disabled="true" data-retry-pending>Retrying…</button></p>`;
    } else if (errors.events || !data.events) {
      dek = `<p class="dir-dek-text">Coverage cannot be shown because published records did not load.</p>`
        + `<p class="dir-actions"><button type="button" class="btn btn--primary" data-action="retry-data">Retry</button></p>`;
    } else {
      const text = directoryDek({rows, research: data.research});
      dek = text ? `<p class="dir-dek-text">${esc(text)}</p>` : '';
      if (researchStatus === 'error') {
        dek += `<p class="dir-dek-text" id="dir-log-error">${LOG_ERROR}</p>`
          + `<p class="dir-actions"><button type="button" class="btn" data-retry="research" aria-describedby="dir-log-error">Retry</button></p>`;
      }
    }
    if (state.mode === 'example') dek += `<p class="dir-dek-text dir-dek-example">This directory shows reported data. Choosing a country returns you to it.</p>`;
    // Focus stays in the retry region: on its replacement control, else on the dek itself (tabindex="-1").
    patchKeepingFocus(parts.dek, dek, cache, () => parts.dek.querySelector('[data-retry-pending], [data-action="retry-data"], [data-retry]') ?? parts.dek);
    const groups = regionGroups(rows, query);
    const emptyText = groups.length ? '' : noMatchText(query);
    if (parts.empty.textContent !== emptyText) parts.empty.textContent = emptyText;
    parts.emptyActions.hidden = !emptyText;
    patchHTML(parts.regions, directoryHTML(groups), cache);
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
