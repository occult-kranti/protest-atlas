import {createWorldMap, zoomButtonState, REGION_VIEWS} from '../map.js';
import {overviewModel, briefModel, renderOverview, renderBrief, countSentence, BRIEF_COPY} from './country-brief.js';
import {esc, icon, plural} from './html.js';
import {selectFiltered, selectEvents, displayCountryName, contextsPaused} from './model.js';
import {CONFLICT_COPY} from './conflicts.js';   // 4.1 C-53 edge: WP-C renders EC1/EC2 from it; the legend is 4.0 until then

export const REGIONS = ['World', ...Object.keys(REGION_VIEWS)];
export const MAP_COPY = Object.freeze({
  hintCoarse: 'One finger scrolls the page. To move the map, pinch with two fingers, use + and −, or turn on Explore map.',
  hintFine: 'Drag to move the map. Use + and −, or Ctrl and scroll, to zoom.',
  // While Explore is on (gestures 'map'): one finger and the wheel move the map, so the page hint would be false.
  hintCoarseExplore: 'One finger moves the map. Tap Done exploring to scroll the page again.',
  hintFineExplore: 'Drag to move the map. Scroll, or use + and −, to zoom. Choose Done exploring, or press Escape, to scroll the page again.',
  dragHint: 'Use two fingers, or Explore map, to move the map.',
  legendTitle: 'What the colours mean',
  reported: 'Published episode matches your filters',
  example: 'Illustrative example country (fictional record)',
  gap: "No published episode matches. A coverage gap, not 'no protests'",
  selected: 'Selected',
  ended: 'Shadow: includes a sourced ended or suspended episode. It does not mean the movement ended or won',
  city: 'City reference point (approximate). Not a protest site',
  smallLead: 'Small territories are not drawn at this scale. ',
  smallLink: 'Use the country list',
  footnote: 'Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe.',
  citiesError: 'City points could not load; city names stay in records and filters.',
  failure: 'The map could not load. Every country and territory is still available in the list and the A–Z directory.',
  explore: 'Explore map',
  exploreDone: 'Done exploring',
});
export const windowNote = days => `Showing episodes with latest evidence in the last ${days} days`;
let dragHintShown = false;

export function hasNonPlaceFilters(f = {}) {
  return ['query', 'region', 'issue', 'status', 'year', 'outcome'].some(key => f?.[key]) || (!!f?.window && f.window !== 'all');
}

export function describeCountry(list, {mode = 'reported', example = 'ready', error = false, loading = false, filtered = false} = {}) {
  if (mode === 'example') return example === 'error' ? BRIEF_COPY.exampleError : example === 'loading' ? BRIEF_COPY.exampleLoading : list?.length ? MAP_COPY.example : '';
  if (error) return BRIEF_COPY.eventsError;
  if (loading) return BRIEF_COPY.loading;
  return list?.length ? countSentence(list.length, filtered, list.some(e => e.status === 'ended')) : MAP_COPY.gap;
}

// `cities`: city dots can be drawn (event-context.json and cities.json loaded); the example draws none.
export function legendHTML({mode = 'reported', example = 'ready', eventsError = false, unavailable = false, window = 'all', citiesError = false, coarse = false,
  explore = false, cities = true} = {}) {
  const note = (kind, text) => `<p class="legend-note" data-kind="${kind}">${text}</p>`;
  const tail = note('small', `${esc(MAP_COPY.smallLead)}<a href="#/countries">${esc(MAP_COPY.smallLink)}</a>`) + note('footnote', esc(MAP_COPY.footnote));
  if (unavailable) return tail;
  const hint = explore ? (coarse ? MAP_COPY.hintCoarseExplore : MAP_COPY.hintFineExplore) : coarse ? MAP_COPY.hintCoarse : MAP_COPY.hintFine;
  const head = `<p class="map-hint">${esc(hint)}</p><h2 class="legend-title">${esc(MAP_COPY.legendTitle)}</h2>`;
  const status = (text, attr, label) => `${head}<p class="legend-note legend-status" role="status">${esc(text)}</p><div class="legend-actions"><button type="button" class="btn" ${attr}>${label}</button></div>`;
  const isExample = mode === 'example';
  if (eventsError && !isExample) return status(BRIEF_COPY.eventsError, 'data-action="retry-data"', 'Retry');
  const item = (kind, text) => `<li><i class="legend-swatch" data-kind="${kind}" aria-hidden="true"></i><span>${esc(text)}</span></li>`;
  const city = cities && !isExample ? item('city', MAP_COPY.city) : '';
  if (isExample && example === 'error') return status(BRIEF_COPY.exampleError, 'data-set-mode="reported"', 'Back to reported data') + tail;
  const first = !isExample ? item('reported', MAP_COPY.reported) : item('example', example === 'loading' ? BRIEF_COPY.exampleLoading : MAP_COPY.example);
  return `${head}<ul class="legend-list">${first}${item('gap', MAP_COPY.gap)}${item('selected', MAP_COPY.selected)}${item('ended', MAP_COPY.ended)}${city}</ul>${tail}`
    + (window === '7' || window === '30' ? note('window', esc(windowNote(window))) : '') + (citiesError ? note('cities', esc(MAP_COPY.citiesError)) : '');
}

export function selectionBarHTML({name = '', state = 'records', count = 0, publishedCount = 0, filtered = false, mode = 'reported'} = {}) {
  const detail = mode === 'example' ? ''
    : state === 'records' ? plural(count, 'published episode') + (filtered ? (count === 1 ? ' matches' : ' match') : '')
      : state === 'filtered-out' ? `${plural(publishedCount, 'published episode')}, none match your filters`
        : state === 'no-record' ? 'no published episode in this atlas' : '';
  return `<p class="map-selbar-text"><strong class="map-selbar-name">${esc(name)}</strong>${detail ? ` · <span>${esc(detail)}</span>` : ''}</p>`
    + '<div class="map-selbar-actions"><a class="btn btn--quiet map-selbar-brief" href="#country-panel" data-scroll-to="country-panel">See brief</a>'
    + '<button type="button" class="btn map-selbar-clear" data-clear-filter="country">Back to world</button></div>';
}

/** The pressed region chip: the zoom target, unless the selected country lies outside it (so never "World" with a country). */
export function pressedRegion(region, code = '', countries = []) {
  return !code || region === countries?.find?.(c => c?.code === code)?.region ? region : null;
}

export function regionChipsHTML(pressed = 'World') {
  return REGIONS.map(name => `<button type="button" class="chip map-region" data-action="map-region" data-value="${esc(name)}" aria-pressed="${name === pressed}">`
    + `<svg class="icon chip-check" aria-hidden="true" focusable="false"><use href="#i-check"></use></svg>${esc(name)}</button>`).join('');
}

export function controlsHTML() {
  const button = (id, action, body, label = '') => `<button type="button" id="${id}" class="map-btn${label ? '' : ' map-btn--text'}" data-action="${action}"${label ? ` aria-label="${label}"` : ''} disabled>${body}</button>`;
  return `<div class="map-zoom">${button('reset-map', 'map-reset', `${icon('world')}<span>World</span>`)}<div class="map-zoom-steps">`
    + `${button('zoom-in', 'map-zoom-in', icon('plus'), 'Zoom in')}${button('zoom-out', 'map-zoom-out', icon('minus'), 'Zoom out')}</div></div>`
    + button('map-explore', 'map-explore', `${icon('hand')}<span class="map-explore-label">${MAP_COPY.explore}</span>`).replace('map-btn--text"', 'map-btn--text map-explore" aria-pressed="false"');
}

const displayCache = new WeakMap();
/** countries.json with short display names (model.COUNTRY_SHORT_NAMES) for every map label, tooltip and aria-label. */
export function displayCountries(countries) {
  if (!Array.isArray(countries)) return [];
  if (!displayCache.has(countries)) {
    displayCache.set(countries, countries.map(c => (c && typeof c === 'object' ? {...c, name: displayCountryName(c.code, c.name), isoName: c.isoName ?? c.name} : c)));
  }
  return displayCache.get(countries);
}

/** The first direct child of a fragment that matches `selector` (`:scope >` does not work on a DocumentFragment). */
export function directChild(fragment, selector) {
  return [...(fragment?.children ?? [])].find(node => node.matches(selector)) ?? null;
}

const FOCUS_KEYS = ['data-focus-key', 'data-open-record', 'data-select-country', 'data-select-city', 'data-clear-filter', 'data-set-mode', 'data-retry', 'data-action', 'id', 'href'];
const SLICES = ['route', 'filters', 'data', 'load', 'mode', 'now'];

export function mountMap({actions = {}, env = {}} = {}) {
  const doc = globalThis.document, $ = id => doc.getElementById(id);
  const [view, stage, container, tip, controls, regions, selbar, legend, panel] = ['view-map', 'map-stage', 'world-map', 'map-tooltip', 'map-controls',
    'map-regions', 'map-selbar', 'map-legend', 'country-panel'].map($);
  if (!view || !stage || !container) return {render() {}, ensure: () => Promise.resolve()};
  const media = query => globalThis.matchMedia?.(query);
  const reducedMotion = typeof env.reducedMotion === 'function' ? env.reducedMotion : () => !!media('(prefers-reduced-motion: reduce)')?.matches;
  const coarse = media('(pointer: coarse)'), gestures = env.mapGestures === 'map' ? 'map' : 'page';
  let map = null, mapPromise = null, mapStatus = 'idle', explore = false, region = 'World', latest = null, flags = {}, counts = new Map();
  let framed, payloadKey = '', drawnData = [], hintTimer = 0, touchStart = null, revealSelection = false, legendArgs = null;
  const painted = {};

  Object.assign(regions, {innerHTML: regionChipsHTML(region)});
  regions.setAttribute('role', 'group');
  regions.setAttribute('aria-label', 'Map regions');
  controls.innerHTML = controlsHTML();
  tip?.setAttribute('aria-hidden', 'true');
  panel?.setAttribute('tabindex', '-1');
  const [zoomIn, zoomOut, reset, exploreButton] = ['zoom-in', 'zoom-out', 'reset-map', 'map-explore'].map($);
  const panelTitle = () => $('country-panel-title');

  function setRegion(next) {
    region = next;
    const pressed = pressedRegion(region, latest?.filters?.country, latest?.data?.countries);
    for (const chip of regions.querySelectorAll('[data-value]')) chip.setAttribute('aria-pressed', String(chip.dataset.value === pressed));
  }
  function setDisabled(button, disabled) {
    if (button.disabled === disabled) return;
    const hadFocus = doc.activeElement === button;
    button.disabled = disabled;
    if (disabled && hadFocus) [zoomIn, zoomOut, reset].find(b => !b.disabled)?.focus({preventScroll: true});
  }
  function syncZoom(zoom = map?.getZoom()) {
    const ok = mapStatus === 'ready', s = zoomButtonState(ok ? zoom : {});
    setDisabled(zoomIn, !ok || !s.zoomIn);
    setDisabled(zoomOut, !ok || !s.zoomOut);
    setDisabled(reset, !ok || !s.reset);
    setDisabled(exploreButton, !ok);
    // Every call re-applies the chips, so a selection made or cleared while the view stays put updates them too.
    setRegion(region === 'World' && s.zoomOut ? null : region === null && ok && !s.zoomOut ? 'World' : region);
  }
  // Focus returns by signature within one scope, else to the panel title; keepLead keeps the role="status" node.
  function setHTML(el, html, key, scope = '', keepLead = false) {
    if (painted[key] === html) return;
    const active = el.contains(doc.activeElement) ? doc.activeElement : null;
    const name = active && painted[`${key}@`] === scope && FOCUS_KEYS.find(k => active.hasAttribute(k));
    const value = name && active.getAttribute(name);
    const template = doc.createElement('template');
    template.innerHTML = html;
    // The role="status" lead node must survive, or the new text is not announced (4.1.3): only its text changes.
    const oldLead = keepLead && el.querySelector(':scope > .brief-lead'), newLead = oldLead && directChild(template.content, '.brief-lead');
    if (newLead) {
      const nodes = [...template.content.childNodes], at = nodes.indexOf(newLead);
      for (const child of [...el.childNodes]) if (child !== oldLead) child.remove();
      oldLead.before(...nodes.slice(0, at));
      oldLead.after(...nodes.slice(at + 1));
      if (oldLead.innerHTML !== newLead.innerHTML) oldLead.innerHTML = newLead.innerHTML;
    } else el.replaceChildren(template.content);
    painted[key] = html;
    painted[`${key}@`] = scope;
    if (active) ((name && [...el.querySelectorAll(`[${name}]`)].find(n => n.getAttribute(name) === value)) || panelTitle())?.focus({preventScroll: true});
  }
  function setExplore(on, focus = false) {
    if ((on = !!on && mapStatus === 'ready') === explore) return;
    explore = on;
    stage.dataset.explore = String(on);
    map?.setGestures(on ? 'map' : gestures);
    exploreButton.setAttribute('aria-pressed', String(on));
    exploreButton.querySelector('span').textContent = on ? MAP_COPY.exploreDone : MAP_COPY.explore;
    paintLegend();
    // Top-aligned (under the header), so the selection bar below the stage stays above the tab bar on phones.
    if (on) stage.scrollIntoView?.({block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth'});
    if (focus) exploreButton.focus({preventScroll: true});
  }
  function paintLegend() {
    if (legendArgs) setHTML(legend, legendHTML({...legendArgs, explore}), 'legend');
  }
  // After a selection made on the map itself, the selection bar must not sit under the tab bar (Explore on phones),
  // and the scroll never takes the top of the stage (World, +, −) under the sticky header.
  function revealSelbar() {
    if (selbar.hidden || !latest || latest.route?.view !== 'map') return;
    const pinned = el => { const style = el && getComputedStyle(el); return !!style && style.display !== 'none' && ['fixed', 'sticky'].includes(style.position); };
    const bar = doc.getElementById('tab-bar'), header = doc.getElementById('site-header');
    const barTop = pinned(bar) ? bar.getBoundingClientRect().top : globalThis.innerHeight;
    const headerBottom = pinned(header) ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const over = Math.min(selbar.getBoundingClientRect().bottom + 8 - barTop, stage.getBoundingClientRect().top - headerBottom);
    if (over > 0) globalThis.scrollBy?.({top: over, behavior: reducedMotion() ? 'auto' : 'smooth'});
  }
  // Explore sizes the stage from the real selection-bar height (it wraps to two lines for long names on narrow phones).
  // Only a shown bar is measured, so the stage does not jump when the bar hides. The observer runs after layout and
  // before paint, so revealSelbar (two frames later) sees the final stage height.
  function syncSelbarHeight() {
    if (selbar.hidden || !selbar.offsetHeight) return;
    const margin = parseFloat(getComputedStyle(selbar).marginBlockStart) || 0;
    stage.style.setProperty('--selbar-h', `${Math.ceil(selbar.offsetHeight + margin)}px`);
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncSelbarHeight).observe(selbar);
  function frameCountry(code) {
    if (!map?.ready) return;
    setRegion(null);
    if (code && map.focusCountry(code)) return;
    const home = latest?.data?.countries?.find?.(c => c.code === code)?.region;
    if (code && home && map.focusRegion(home)) return setRegion(home);
    map.reset();
    setRegion('World');
  }

  view.addEventListener('click', event => {
    const target = event.target.closest?.('[data-action]');
    const action = view.contains(target) && target.dataset.action;
    if (action === 'map-zoom-in') map?.zoomIn();
    else if (action === 'map-zoom-out') map?.zoomOut();
    else if (action === 'map-reset' || (action === 'map-region' && target.dataset.value === 'World')) { map?.reset(); setRegion('World'); }
    else if (action === 'map-region') { if (map?.focusRegion(target.dataset.value)) setRegion(target.dataset.value); }
    else if (action === 'map-explore') setExplore(!explore);
    else if (action === 'map-focus') frameCountry(latest?.filters?.country);
    else if (action === 'retry-map' && mapStatus === 'unavailable') {
      map?.destroy();
      [map, mapPromise, mapStatus, framed, payloadKey] = [null, null, 'idle', undefined, ''];
      $('map-title')?.focus({preventScroll: true});
      ensure();
    }
  });
  doc.addEventListener('keydown', e => {
    if (e.key === 'Escape' && explore && !doc.querySelector('dialog[open]')) setExplore(false, view.contains(doc.activeElement));
  });
  container.addEventListener('mapzoom', e => syncZoom(e.detail));
  stage.addEventListener('touchstart', e => { touchStart = e.touches.length === 1 && !explore ? e.touches[0] : null; }, {passive: true});
  stage.addEventListener('touchmove', e => {
    if (!touchStart || dragHintShown || e.touches.length !== 1 || !coarse?.matches || !tip) return;
    const dx = e.touches[0].clientX - touchStart.clientX, dy = e.touches[0].clientY - touchStart.clientY;
    if (Math.abs(dx) < 24 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    dragHintShown = true;
    tip.replaceChildren(MAP_COPY.dragHint);
    Object.assign(tip.style, {left: '', top: ''});
    tip.dataset.kind = 'hint';
    tip.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { if (tip.dataset.kind === 'hint') { tip.hidden = true; tip.removeAttribute('data-kind'); } }, 4000);
  }, {passive: true});
  if (typeof IntersectionObserver === 'function') new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setExplore(false); }).observe(stage);

  function paint(state) {
    const lazy = state.load?.lazy ?? {}, filters = state.filters ?? {}, data = state.data ?? {}, now = state.now;
    const isExample = state.mode === 'example';
    const example = !isExample ? 'ready' : lazy.examples === 'error' ? 'error' : lazy.examples === 'ready' && data.examples ? 'ready' : 'loading';
    const error = !isExample && !!state.load?.errors?.events, loading = !isExample && !error && !data.events;
    const filtered = hasNonPlaceFilters(filters), off = error || loading || example !== 'ready';
    flags = {mode: state.mode, example, error, loading, filtered};
    const code = /^[A-Z]{2}$/.test(filters.country ?? '') ? filters.country : '';
    const countries = displayCountries(data.countries);
    const unavailable = mapStatus === 'unavailable';
    const mapEvents = off ? [] : selectFiltered(state, {ignoreCountry: true});
    counts = new Map();
    for (const e of mapEvents) counts.set(e.country, [...counts.get(e.country) ?? [], e]);

    stage.dataset.mapState = mapStatus === 'idle' ? 'loading' : mapStatus;
    regions.hidden = controls.hidden = unavailable;
    if (unavailable) {
      setExplore(false);
      if (!container.querySelector('.map-fallback')) {
        container.innerHTML = `<div class="map-fallback"><p class="map-fallback-text" role="status">${esc(MAP_COPY.failure)}</p><div class="map-fallback-actions">`
          + '<button type="button" class="btn" data-action="retry-map">Retry map</button><a class="btn btn--quiet" href="#/countries">Open Countries</a></div></div>';
      }
    }
    const watermark = stage.querySelector('.map-watermark');
    if (isExample && !watermark) stage.append(Object.assign(doc.createElement('p'), {className: 'map-watermark', textContent: BRIEF_COPY.watermark}));
    else if (!isExample) watermark?.remove();

    // No city dots without event-context.json or cities.json: no legend row (and no "names stay in records" note without contexts).
    const contextsError = contextsPaused(state), citiesError = !contextsError && lazy.cities === 'error';
    legendArgs = {mode: state.mode, example, eventsError: error, unavailable, window: filters.window, citiesError, coarse: !!coarse?.matches,
      cities: !contextsError && !citiesError};
    paintLegend();

    let brief = null;
    if (!code) {
      const status = isExample ? (example === 'ready' ? 'ready' : `example-${example}`) : error ? 'error' : loading ? 'loading' : 'ready';
      setHTML(panel, renderOverview(overviewModel({mapEvents, countries, mode: state.mode, filtered, status}), {now}), 'panel', 'world', true);
    } else {
      brief = briefModel({code, mapEvents: off ? [] : selectFiltered(state), allEvents: off ? [] : selectEvents(state), countries, mode: state.mode, example,
        coverage: data.coverage ?? null, research: data.research ?? null, contexts: data.contexts ?? null, contextsError, filtered: filtered || !!filters.city, error, loading});
      setHTML(panel, renderBrief(brief, {now, hasPolygon: !map?.ready || map.hasCountry(code), selectedCity: filters.city ?? '',
        lazy: {coverage: lazy.coverage, research: lazy.research}}), 'panel', code, true);
    }
    const showBar = !!code && !unavailable;
    if (showBar) {
      setHTML(selbar, selectionBarHTML({name: brief.name, state: brief.state, count: brief.matching.length, publishedCount: brief.publishedCount,
        filtered: filtered || !!filters.city, mode: state.mode}), 'selbar', code);
    }
    if (selbar.hidden === showBar) {
      const hadFocus = selbar.contains(doc.activeElement);
      selbar.hidden = !showBar;
      if (hadFocus) panelTitle()?.focus({preventScroll: true});
    }
    if (revealSelection) {
      revealSelection = false;
      if (showBar) requestAnimationFrame(() => requestAnimationFrame(revealSelbar));
    }

    if (map?.ready) {
      const key = [mapEvents.map(e => e.id), code, state.mode, example, error, loading, filtered, countries.length, !!data.cities, !!data.contexts].join('|');
      if (key !== payloadKey || data.events !== drawnData[0] || data.examples !== drawnData[1]) {
        [payloadKey, drawnData] = [key, [data.events, data.examples]];
        // Example loading or failed: neutral land (C-38).
        map.update({events: mapEvents, countries, selectedCountry: code, mode: state.mode, loading: loading || example === 'loading',
          error: error || example === 'error', contexts: isExample ? null : data.contexts ?? null, cityGeography: data.cities ?? null});
      }
      if (code !== framed) frameCountry(framed = code);
    }
    syncZoom();
    for (const name of [mapStatus !== 'idle' && 'cities', code && !isExample && 'coverage', code && !isExample && 'research']) {
      if (name && (lazy[name] ?? 'idle') === 'idle') actions.loadLazy?.(name);
    }
  }

  function ensure() {
    if (!mapPromise) {
      mapStatus = stage.dataset.mapState = 'loading';
      mapPromise = createWorldMap({container, tooltip: tip, gestures, reducedMotion,
        describe: code => describeCountry(counts.get(code), flags),
        onSelect: code => {
          if (code === latest?.filters?.country) { frameCountry(code); requestAnimationFrame(revealSelbar); return; }
          revealSelection = true;
          actions.selectCountry?.(code);
        },
        onSelectCity: (country, name) => actions.selectCity?.(country, name),
      }).then(api => { map = api; mapStatus = api.ready ? 'ready' : 'unavailable'; }, () => { mapStatus = 'unavailable'; })
        .then(() => { [payloadKey, framed] = ['', undefined]; if (latest) paint(latest); });
    }
    return mapPromise;
  }

  function render(state, prev) {
    if (!state) return;
    latest = state;
    if (state.route?.view !== 'map') return setExplore(false);
    ensure();
    if (prev && prev.route?.view === 'map' && SLICES.every(k => state[k] === prev[k])) return;
    paint(state);
  }
  return {render, ensure};
}
