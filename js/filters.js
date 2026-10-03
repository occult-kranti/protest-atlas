// Search, quick chips, active chips and filter sheet controls (WP2). DOM-free when loaded.
// Live apply, no draft state. #filters-body is built once per data or mode change, then patched in place (C-12).
import {selectEvents, selectFiltered, statusOptions, activeFilterCount, availableYears, cityOptions, refinementOptions, indexContexts, STATUS_LABELS} from './model.js';
import {esc, icon} from './html.js';

export const QUICK_CHIPS = [{key: 'window', value: '7', label: 'Last 7 days'}, {key: 'window', value: '30', label: 'Last 30 days'},
  {key: 'status', value: 'ended', label: 'Ended / suspended'}, {key: 'outcome', value: 'documented', label: 'Outcome documented'}];

const SEARCH_DEBOUNCE_MS = 120;
const STATUS_ROWS = ['', 'ongoing', 'planned', 'needs-review', 'ended', 'unknown'];
const WINDOWS = [{value: 'all', label: 'Any date'}, {value: '7', label: 'Last 7 days'}, {value: '30', label: 'Last 30 days'}];
const CONTEXT_NOTE = 'City and outcome filters are unavailable because record context could not load.';
const checkIcon = cls => `<svg class="icon ${cls}" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>`;

const countryNames = state => new Map((state.data.countries ?? []).map(c => [c.code, c.name]));
const cityName = value => String(value).split(':').slice(1).join(':');
const showLabel = n => (n === 0 ? 'Close · no records match' : n === 1 ? 'Show 1 record' : `Show ${n} records`);
const statusText = n => (n === 0 ? 'No records match' : n === 1 ? '1 record matches' : `${n} records match`);

/** Removable chips for every active filter (§6.2), in a fixed order. */
function activeChips(state) {
  const f = state.filters;
  const names = countryNames(state);
  const chips = [];
  if (f.query) chips.push({key: 'query', label: `Search: ${f.query}`});
  if (f.country) chips.push({key: 'country', label: names.get(f.country) ?? f.country});
  if (f.region) chips.push({key: 'region', label: `Region: ${f.region}`});
  if (f.window && f.window !== 'all') chips.push({key: 'window', label: `Last ${f.window} days`});
  if (f.status) chips.push({key: 'status', label: `Status: ${STATUS_LABELS[f.status] ?? f.status}`});
  if (f.issue) chips.push({key: 'issue', label: `Issue: ${f.issue}`});
  if (f.year) chips.push({key: 'year', label: `Year: ${f.year}`});
  if (f.city) chips.push({key: 'city', label: `City: ${cityName(f.city)}`});
  if (f.outcome) chips.push({key: 'outcome', label: f.outcome === 'documented' ? 'Outcome documented' : 'Outcome not established'});
  return chips;
}

function barHTML() {
  return `<div class="filter-search">
  <label class="visually-hidden" for="query">Search published records</label>
  <svg class="icon filter-search-icon" aria-hidden="true" focusable="false"><use href="#i-search"></use></svg>
  <input id="query" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Search issues, places, actors">
  <button type="button" class="icon-btn filter-clear" data-clear-filter="query" aria-label="Clear search" hidden>${icon('close')}</button>
</div>
<button type="button" class="btn filter-open" data-open-sheet="filters-sheet" aria-haspopup="dialog">${icon('filter')}<span>Filters<span class="filter-count"></span></span></button>
<div class="quick-chips" role="group" aria-label="Quick filters"><div class="quick-chips-track">
${QUICK_CHIPS.map(c => `<button type="button" class="chip quick-chip" data-set-filter="${esc(c.key)}" data-value="${esc(c.value)}" aria-pressed="false">${checkIcon('chip-check')}${esc(c.label)}</button>`).join('')}
<button type="button" class="chip quick-chip quick-chip--sheet" data-open-sheet="filters-sheet" data-sheet-focus="#country-filter" aria-haspopup="dialog">Country or territory${icon('chevron-down')}</button>
</div></div>`;
}

const option = (value, label) => `<option value="${esc(value)}">${esc(label)}</option>`;

/** All countries and territories A–Z (or, after a directory failure, the countries present in the records). */
function countryList(state, events) {
  const directory = state.data.countries ?? [];
  const list = directory.length
    ? directory.map(c => ({code: c.code, name: c.name}))
    : [...new Map(events.map(e => [e.country, {code: e.country, name: e.country_name || e.country}])).values()];
  return list.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/**
 * The three long selects (country 249, city, issue) carry only their placeholder and current value until the
 * filter sheet first opens, which keeps the first #/latest render inside the DOM budget (tech §6.2).
 */
function longOptions(kind, state, events, contexts, full) {
  const f = state.filters;
  let rows;
  if (kind === 'country') rows = countryList(state, events).map(c => ({value: c.code, label: c.name}));
  else if (kind === 'issue') rows = refinementOptions(events).issues.map(i => ({value: i, label: i}));
  else rows = cityOptions(events, indexContexts(contexts), f.country);
  const placeholder = {country: ['', 'All countries and territories'], issue: ['', 'Any issue'], city: ['', 'Any city']}[kind];
  const current = f[kind];
  const shown = full ? rows : rows.filter(r => r.value === current);
  if (!full && current && !shown.length) shown.push({value: current, label: kind === 'city' ? cityName(current) : current});
  return option(...placeholder) + shown.map(r => option(r.value, r.label)).join('');
}

function bodyHTML(state, full) {
  const load = state.load;
  if (load.errors.events) {
    return `<div class="filter-error"><p>Filters are unavailable because published records did not load.</p>
<button type="button" class="btn btn--primary" data-action="retry-data">Retry</button></div>`;
  }
  if (load.critical === 'loading' && !state.data.events) return '<p class="filter-loading">Loading published records…</p>';
  const events = selectEvents(state);
  const contexts = state.mode === 'reported' ? state.data.contexts : null;
  const {regions} = refinementOptions(events);
  const years = availableYears(events);
  const contextsFailed = state.mode === 'reported' && Boolean(load.errors.contexts);
  const disabled = contextsFailed ? ' disabled' : '';
  return `<form class="filter-form" novalidate>
<fieldset id="window-filter" class="filter-group filter-segment"><legend>Latest evidence</legend>
<div class="filter-segment-track">${WINDOWS.map(w => `<label><input class="visually-hidden" type="radio" name="window" value="${w.value}">${checkIcon('filter-check')}<span>${esc(w.label)}</span></label>`).join('')}</div>
<p class="filter-help">Uses the date of each episode's latest sourced activity or development, never publication or check time.</p></fieldset>
<fieldset id="status-filter" class="filter-group filter-rows"><legend>Status</legend>
${STATUS_ROWS.map(s => `<label class="filter-row" data-status="${esc(s)}" hidden><input type="radio" name="status" value="${esc(s)}"><span class="filter-row-label">${esc(s ? STATUS_LABELS[s] : 'Any status')}</span> <span class="filter-n"></span></label>`).join('\n')}
<p class="filter-help">'Reported ongoing' needs evidence dated within the last 72 hours.</p></fieldset>
<div class="filter-field"><label for="country-filter">Country or territory</label><select id="country-filter">${longOptions('country', state, events, contexts, full)}</select></div>
<div class="filter-field"><label for="region-filter">Region</label><select id="region-filter">${option('', 'Any region')}${regions.map(r => option(r, r)).join('')}</select></div>
<div class="filter-field"><label for="issue-filter">Issue</label><select id="issue-filter">${longOptions('issue', state, events, contexts, full)}</select>
<p class="filter-help">Issue tags are not yet normalised: Labor and Labour are separate tags.</p></div>
<fieldset class="filter-group"><legend>History</legend>
<div class="filter-field"><label for="year-filter">Year of dated evidence</label><select id="year-filter">${option('', 'Any year')}${years.map(y => option(y, y)).join('')}</select></div>
<div class="filter-field"><label for="outcome-filter">Outcome</label><select id="outcome-filter"${disabled}>${option('', 'Any')}${option('documented', 'Outcome documented')}${option('not-established', 'Outcome not established')}</select></div>
<div class="filter-field"><label for="city-filter">City</label><select id="city-filter"${disabled}>${longOptions('city', state, events, contexts, full)}</select>
<p class="filter-help">City points are approximate references, not protest sites.</p></div>
${contextsFailed ? `<p class="filter-note" role="note">${esc(CONTEXT_NOTE)}</p>` : ''}</fieldset>
<p class="filter-roadmap">Custom date ranges are a later item on the roadmap. <a href="#/ahead/roadmap" data-close-sheet>See Coming next</a></p>
</form>`;
}

/**
 * #filter-bar, #active-filters, #filters-body and #filters-foot (§6.2, §9).
 * Handles data-set-filter inside the bar and the sheet; app.js handles data-clear-filter.
 */
export function mountFilters(ctx) {
  const {store, actions} = ctx;
  const doc = globalThis.document;
  const $ = id => doc.getElementById(id);
  const bar = $('filter-bar'), active = $('active-filters'), body = $('filters-body'), foot = $('filters-foot'), live = $('filters-status');
  let bodyKey = null, cityKey = null, activeKey = null, timer = null, full = false;
  let input = null, clearBtn = null, countEl = null, footClear = null, footShow = null;

  if (bar) {
    bar.innerHTML = barHTML();
    input = bar.querySelector('#query');
    clearBtn = bar.querySelector('.filter-clear');
    countEl = bar.querySelector('.filter-count');
    const commit = () => {
      clearTimeout(timer);
      timer = null;
      actions.setFilter('query', input.value.trim());
    };
    input.addEventListener('input', () => {
      clearBtn.hidden = !input.value;
      clearTimeout(timer);
      timer = setTimeout(commit, SEARCH_DEBOUNCE_MS);
    });
    input.addEventListener('keydown', event => { if (event.key === 'Enter') commit(); });
    input.addEventListener('search', commit);
  }

  const toggle = event => {
    const chip = event.target.closest('[data-set-filter]');
    if (!chip) return;
    const key = chip.dataset.setFilter;
    const value = chip.dataset.value ?? '';
    const current = store.get().filters[key];
    actions.setFilter(key, current === value ? (key === 'window' ? 'all' : '') : value);
  };
  bar?.addEventListener('click', toggle);
  body?.addEventListener('click', toggle);

  body?.addEventListener('change', event => {
    const el = event.target;
    if (el.name === 'window' || el.name === 'status') { if (el.checked) actions.setFilter(el.name, el.value); return; }
    const key = {'country-filter': 'country', 'region-filter': 'region', 'issue-filter': 'issue', 'year-filter': 'year', 'city-filter': 'city', 'outcome-filter': 'outcome'}[el.id];
    if (key) actions.setFilter(key, el.value);
  });
  body?.addEventListener('submit', event => event.preventDefault());

  if (foot) {
    footClear = doc.createElement('button');
    footClear.type = 'button';
    footClear.className = 'btn btn--quiet filter-foot-clear';
    footClear.dataset.clearFilter = 'all';
    footClear.textContent = 'Clear all';
    footShow = doc.createElement('button');
    footShow.type = 'button';
    footShow.className = 'btn btn--primary filter-foot-show';
    footShow.setAttribute('data-close-sheet', '');
    footShow.textContent = 'Close';
    const anchor = live && live.parentElement === foot ? live : null;
    foot.insertBefore(footClear, anchor);
    foot.insertBefore(footShow, anchor);
  }

  function patchBar(state) {
    if (!input) return;
    const f = state.filters;
    if (doc.activeElement !== input && timer === null && input.value.trim() !== f.query) input.value = f.query;
    clearBtn.hidden = !input.value && !f.query;
    const n = activeFilterCount(f);
    const text = n > 0 ? ` (${n})` : '';
    if (countEl.textContent !== text) countEl.textContent = text;
    for (const chip of bar.querySelectorAll('[data-set-filter]')) {
      const pressed = String(f[chip.dataset.setFilter] === chip.dataset.value);
      if (chip.getAttribute('aria-pressed') !== pressed) chip.setAttribute('aria-pressed', pressed);
    }
  }

  function patchActive(state) {
    if (!active) return;
    const chips = activeChips(state);
    const key = JSON.stringify(chips);
    if (key === activeKey) return;
    activeKey = key;
    const focused = active.contains(doc.activeElement) ? doc.activeElement : null;
    const focusKey = focused?.dataset.clearFilter ?? null;
    const focusIndex = focused ? [...active.querySelectorAll('[data-clear-filter]')].indexOf(focused) : -1;
    active.hidden = chips.length === 0;
    if (chips.length) active.setAttribute('role', 'group'); else active.removeAttribute('role');
    if (chips.length) active.setAttribute('aria-label', 'Active filters'); else active.removeAttribute('aria-label');
    active.innerHTML = chips.map(c => `<button type="button" class="chip active-chip" data-clear-filter="${esc(c.key)}"><span class="visually-hidden">Remove filter: </span>${esc(c.label)}<span class="active-chip-x" aria-hidden="true"> ×</span></button>`).join('')
      + (chips.length >= 2 ? '<button type="button" class="btn btn--quiet active-clear" data-clear-filter="all">Clear all</button>' : '');
    if (focused) {
      const buttons = [...active.querySelectorAll('[data-clear-filter]')];
      const target = buttons.find(b => b.dataset.clearFilter === focusKey) ?? buttons[Math.min(focusIndex, buttons.length - 1)] ?? bar?.querySelector('.filter-open');
      target?.focus({preventScroll: true});
    }
  }

  function patchBody(state) {
    if (!body) return;
    const key = [state.mode, state.data.events, state.data.examples, state.data.countries, state.data.contexts, state.load.critical, state.load.errors.events, state.load.errors.contexts];
    if (!bodyKey || key.some((v, i) => v !== bodyKey[i])) {
      bodyKey = key;
      body.innerHTML = bodyHTML(state, full);
      cityKey = [state.filters.country, full];
    }
    const form = body.querySelector('.filter-form');
    if (!form) return;
    const f = state.filters;
    for (const radio of form.querySelectorAll('input[name="window"]')) radio.checked = radio.value === f.window;
    const options = new Map(statusOptions(state).map(o => [o.value, o.count]));
    for (const row of form.querySelectorAll('.filter-row')) {
      const value = row.dataset.status;
      const shown = options.has(value);
      if (row.hidden === shown) row.hidden = !shown;
      const n = row.querySelector('.filter-n');
      const text = shown ? `(${options.get(value)})` : '';
      if (n.textContent !== text) n.textContent = text;
      row.querySelector('input').checked = value === f.status;
    }
    const events = selectEvents(state);
    const contexts = state.mode === 'reported' ? state.data.contexts : null;
    if (!cityKey || cityKey[0] !== f.country || cityKey[1] !== full || (!full && form.querySelector('#city-filter').value !== f.city)) {
      cityKey = [f.country, full];
      form.querySelector('#city-filter').innerHTML = longOptions('city', state, events, contexts, full);
    }
    if (!full) {
      for (const kind of ['country', 'issue']) {
        const select = form.querySelector(`#${kind}-filter`);
        if (select.value !== f[kind]) select.innerHTML = longOptions(kind, state, events, contexts, false);
      }
    }
    for (const [id, key] of [['country-filter', 'country'], ['region-filter', 'region'], ['issue-filter', 'issue'], ['year-filter', 'year'], ['city-filter', 'city'], ['outcome-filter', 'outcome']]) {
      const select = form.querySelector(`#${id}`);
      if (select && select.value !== f[key]) select.value = f[key];
    }
  }

  /** First open of the filter sheet: fill the long selects in place (focus and values stay). */
  function fillLongSelects() {
    if (full) return;
    full = true;
    const state = store.get();
    const form = body?.querySelector('.filter-form');
    if (!form) return;
    const events = selectEvents(state);
    const contexts = state.mode === 'reported' ? state.data.contexts : null;
    for (const kind of ['country', 'issue', 'city']) {
      const select = form.querySelector(`#${kind}-filter`);
      select.innerHTML = longOptions(kind, state, events, contexts, true);
      select.value = state.filters[kind];
    }
    cityKey = [state.filters.country, true];
  }
  $('filters-sheet')?.addEventListener('sheet:open', fillLongSelects);

  function patchFoot(state) {
    if (!footShow) return;
    const ready = state.mode === 'example'
      ? state.load.lazy.examples === 'ready'
      : state.load.critical !== 'loading' && !state.load.errors.events && Boolean(state.data.events);
    const n = ready ? selectFiltered(state).length : null;
    const label = n === null ? 'Close' : showLabel(n);
    if (footShow.textContent !== label) footShow.textContent = label;
    footClear.hidden = !ready;
    const status = n === null ? '' : statusText(n);
    if (live && live.textContent !== status) live.textContent = status;
  }

  return {
    render(state, prev) {
      if (prev && state.filters === prev.filters && state.data === prev.data && state.load === prev.load && state.mode === prev.mode && state.now === prev.now) return;
      patchBar(state);
      patchActive(state);
      patchBody(state);
      patchFoot(state);
    },
  };
}
