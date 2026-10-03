// Lazy map mount (WP4): region chips, overlay controls, legend (M1–M9), selection bar, country panel, Explore,
// failure and retry. Reached only through app.js's import(); DOM-free at import. Copy is verbatim from SPEC §11.
import {createWorldMap, zoomButtonState, REGION_VIEWS} from '../map.js';
import {overviewModel, briefModel, renderOverview, renderBrief, countSentence, BRIEF_COPY} from './country-brief.js';
import {esc, icon, plural} from './html.js';
import {selectFiltered, selectEvents} from './model.js';

export const REGIONS = ['World', ...Object.keys(REGION_VIEWS)];
export const MAP_COPY = Object.freeze({
  hintCoarse: 'One finger scrolls the page. To move the map, pinch with two fingers, use + and −, or turn on Explore map.',
  hintFine: 'Drag to move the map. Use + and −, or Ctrl and scroll, to zoom.',
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
let dragHintShown = false;  // once per page session

/** Any filter other than country and city (the map ignores both, tech §4.6). */
export function hasNonPlaceFilters(f = {}) {
  return ['query', 'region', 'issue', 'status', 'year', 'outcome'].some(key => f?.[key]) || (!!f?.window && f.window !== 'all');
}

/** #map-legend (SPEC §11.5); the hint comes first except when the map is unavailable (M7 + M8 only). */
export function legendHTML({mode = 'reported', example = 'ready', eventsError = false, unavailable = false, window = 'all', citiesError = false, coarse = false} = {}) {
  const note = (kind, text) => `<p class="legend-note" data-kind="${kind}">${text}</p>`;
  const tail = note('small', `${esc(MAP_COPY.smallLead)}<a href="#/countries">${esc(MAP_COPY.smallLink)}</a>`) + note('footnote', esc(MAP_COPY.footnote));
  if (unavailable) return tail;
  const hint = `<p class="map-hint">${esc(coarse ? MAP_COPY.hintCoarse : MAP_COPY.hintFine)}</p>`;
  const status = (text, button) => `<p class="legend-note legend-status" role="status">${esc(text)}</p><div class="legend-actions">${button}</div>`;
  const isExample = mode === 'example';
  if (eventsError && !isExample) return hint + status(BRIEF_COPY.eventsError, '<button type="button" class="btn" data-action="retry-data">Retry</button>');
  const item = (kind, text) => `<li><i class="legend-swatch" data-kind="${kind}" aria-hidden="true"></i><span>${esc(text)}</span></li>`;
  const head = `${hint}<h2 class="legend-title">${esc(MAP_COPY.legendTitle)}</h2>`;
  if (isExample && example === 'error') {
    return head + status(BRIEF_COPY.exampleError, '<button type="button" class="btn" data-set-mode="reported">Back to reported data</button>')
      + `<ul class="legend-list">${item('city', MAP_COPY.city)}</ul>${tail}`;
  }
  const first = !isExample ? item('reported', MAP_COPY.reported) : item('example', example === 'loading' ? BRIEF_COPY.exampleLoading : MAP_COPY.example);
  return `${head}<ul class="legend-list">${first}${item('gap', MAP_COPY.gap)}${item('selected', MAP_COPY.selected)}${item('ended', MAP_COPY.ended)}`
    + `${item('city', MAP_COPY.city)}</ul>${tail}${window === '7' || window === '30' ? note('window', esc(windowNote(window))) : ''}`
    + (citiesError ? note('cities', esc(MAP_COPY.citiesError)) : '');
}

/** #map-selbar: "{France} · {2 published episodes match}" + [See brief] (< 900, CSS) + [World]; example mode shows the name only. */
export function selectionBarHTML({name = '', state = 'records', count = 0, publishedCount = 0, filtered = false, mode = 'reported'} = {}) {
  const detail = mode === 'example' ? ''
    : state === 'records' ? plural(count, 'published episode') + (filtered ? (count === 1 ? ' matches' : ' match') : '')
      : state === 'filtered-out' ? `${plural(publishedCount, 'published episode')}, none match your filters`
        : state === 'no-record' ? 'no published episode in this atlas' : '';
  return `<p class="map-selbar-text"><strong class="map-selbar-name">${esc(name)}</strong>${detail ? ` · <span>${esc(detail)}</span>` : ''}</p>`
    + '<div class="map-selbar-actions"><a class="btn btn--quiet map-selbar-brief" href="#country-panel" data-scroll-to="country-panel">See brief</a>'
    + '<button type="button" class="btn map-selbar-clear" data-clear-filter="country">World</button></div>';
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

const FOCUS_KEYS = ['data-open-record', 'data-select-country', 'data-select-city', 'data-clear-filter', 'data-set-mode', 'data-retry', 'data-action', 'id', 'href'];

/** Component protocol (tech §4.5): mountMap({store, actions, env}) → {render(state, prev), ensure(): Promise<void>}. */
export function mountMap({actions = {}, env = {}} = {}) {
  const doc = globalThis.document, $ = id => doc.getElementById(id);
  const [view, stage, container, tip, controls, regions, selbar, legend, panel] = ['view-map', 'map-stage', 'world-map', 'map-tooltip', 'map-controls',
    'map-regions', 'map-selbar', 'map-legend', 'country-panel'].map($);
  if (!view || !stage || !container) return {render() {}, ensure: () => Promise.resolve()};
  const media = query => globalThis.matchMedia?.(query);
  const reducedMotion = typeof env.reducedMotion === 'function' ? env.reducedMotion : () => !!media('(prefers-reduced-motion: reduce)')?.matches;
  const coarse = media('(pointer: coarse)'), gestures = env.mapGestures === 'map' ? 'map' : 'page';
  let map = null, mapPromise = null, mapStatus = 'idle', explore = false, region = 'World', latest = null, flags = {}, counts = new Map();
  let framed, framedVia = '', citiesTried = false, payloadKey = '', drawnData = [], hintTimer = 0, touchStart = null;
  const painted = {}, requested = new Set();

  Object.assign(regions, {innerHTML: regionChipsHTML(region)});
  regions.setAttribute('role', 'group');
  regions.setAttribute('aria-label', 'Map regions');
  controls.innerHTML = controlsHTML();
  tip?.setAttribute('aria-hidden', 'true');
  panel?.setAttribute('tabindex', '-1');  // target of the selection bar's data-scroll-to
  const [zoomIn, zoomOut, reset, exploreButton] = ['zoom-in', 'zoom-out', 'reset-map', 'map-explore'].map($);
  const panelTitle = () => $('country-panel-title');

  function setRegion(next) {
    region = next;
    for (const chip of regions.querySelectorAll('[data-value]')) chip.setAttribute('aria-pressed', String(chip.dataset.value === region));
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
    if (region === 'World' && s.zoomOut) setRegion(null);
    else if (region === null && ok && !s.zoomOut) setRegion('World');
  }
  /** Replaces content and restores focus by data-* signature (tech §4.5). keepLead keeps the role="status" lead node
   *  connected and only changes its text, so screen readers announce the new lead. */
  function setHTML(el, html, key, keepLead = false) {
    if (painted[key] === html) return;
    const active = el.contains(doc.activeElement) ? doc.activeElement : null;
    const name = active && FOCUS_KEYS.find(k => active.hasAttribute(k));
    const value = name && active.getAttribute(name);
    const template = doc.createElement('template');
    template.innerHTML = html;
    const oldLead = keepLead && el.querySelector(':scope > .brief-lead'), newLead = oldLead && template.content.querySelector(':scope > .brief-lead');
    if (newLead) {
      const nodes = [...template.content.childNodes], at = nodes.indexOf(newLead);
      for (const child of [...el.childNodes]) if (child !== oldLead) child.remove();
      oldLead.before(...nodes.slice(0, at));
      oldLead.after(...nodes.slice(at + 1));
      if (oldLead.innerHTML !== newLead.innerHTML) oldLead.innerHTML = newLead.innerHTML;
    } else el.replaceChildren(template.content);
    painted[key] = html;
    if (active) ([...el.querySelectorAll(`[${name}]`)].find(n => n.getAttribute(name) === value) ?? panelTitle())?.focus({preventScroll: true});
  }
  function requestLazy(name) {
    if ((latest?.load?.lazy?.[name] ?? 'idle') !== 'idle' || requested.has(name) || !actions.loadLazy) return;
    requested.add(name);
    queueMicrotask(() => { requested.delete(name); if ((latest?.load?.lazy?.[name] ?? 'idle') === 'idle') actions.loadLazy(name); });
  }
  function setExplore(on, focus = false) {
    if ((on = !!on && mapStatus === 'ready') === explore) return;
    explore = on;
    stage.dataset.explore = String(on);
    map?.setGestures(on ? 'map' : gestures);
    exploreButton.setAttribute('aria-pressed', String(on));
    exploreButton.querySelector('span').textContent = on ? MAP_COPY.exploreDone : MAP_COPY.explore;
    if (on) stage.scrollIntoView?.({block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth'});
    if (focus) exploreButton.focus({preventScroll: true});
  }
  /** Auto-focus (tech §5.4): mainland cluster, else city points (no polygon), else the region, else the world. */
  function frameCountry(code) {
    if (!map?.ready) return '';
    setRegion(null);
    if (code && map.focusCountry(code)) return 'polygon';
    if (code && map.focusCities(code)) return 'cities';
    const home = latest?.data?.countries?.find?.(c => c.code === code)?.region;
    if (code && home && map.focusRegion(home)) { setRegion(home); return 'region'; }
    map.reset();
    setRegion('World');
    return 'world';
  }
  /** Tooltip and aria-label text for a country, from the same sentences as the brief. */
  function describe(code) {
    if (flags.error) return BRIEF_COPY.eventsError;
    if (flags.loading) return BRIEF_COPY.loading;
    const list = counts.get(code);
    if (flags.isExample) return list ? MAP_COPY.example : '';
    return list ? countSentence(list.length, hasNonPlaceFilters(latest?.filters), list.some(e => e.status === 'ended')) : MAP_COPY.gap;
  }

  view.addEventListener('click', event => {
    const target = event.target.closest?.('[data-action]');
    const action = view.contains(target) && target.dataset.action;
    if (action === 'map-zoom-in') map?.zoomIn();
    else if (action === 'map-zoom-out') map?.zoomOut();
    else if (action === 'map-reset' || (action === 'map-region' && target.dataset.value === 'World')) { map?.reset(); setRegion('World'); }
    else if (action === 'map-region') { if (map?.focusRegion(target.dataset.value)) setRegion(target.dataset.value); }
    else if (action === 'map-explore') setExplore(!explore);
    else if (action === 'map-focus') framedVia = frameCountry(latest?.filters?.country);
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
  // A chip reached by Tab in the sideways-scrolling row must be fully visible (WCAG 2.4.11).
  regions.addEventListener('focusin', e => e.target.scrollIntoView?.({block: 'nearest', inline: 'nearest'}));
  // One-time hint when a coarse pointer drags one finger sideways in page mode.
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
  coarse?.addEventListener?.('change', () => latest && paint(latest));

  function paint(state) {
    const lazy = state.load?.lazy ?? {}, filters = state.filters ?? {}, data = state.data ?? {};
    const isExample = state.mode === 'example';
    const example = !isExample ? null : lazy.examples === 'error' ? 'error' : lazy.examples === 'ready' && data.examples ? 'ready' : 'loading';
    const eventsError = !isExample && !!state.load?.errors?.events;
    flags = {isExample, example, eventsError, loading: isExample ? example === 'loading' : !eventsError && !data.events, error: isExample ? example === 'error' : eventsError};
    const off = flags.loading || flags.error;
    const code = /^[A-Z]{2}$/.test(filters.country ?? '') ? filters.country : '';
    const countries = Array.isArray(data.countries) ? data.countries : [];
    const now = state.now ?? Date.now(), unavailable = mapStatus === 'unavailable', filtered = hasNonPlaceFilters(filters);
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

    setHTML(legend, legendHTML({mode: state.mode, example: example ?? 'ready', eventsError, unavailable, window: filters.window,
      citiesError: lazy.cities === 'error', coarse: !!coarse?.matches}), 'legend');

    let brief = null;
    if (!code) {
      const status = isExample ? (example === 'ready' ? 'ready' : `example-${example}`) : flags.error ? 'error' : flags.loading ? 'loading' : 'ready';
      setHTML(panel, renderOverview(overviewModel({mapEvents, countries, mode: state.mode, filtered, status}), {now}), 'panel', true);
    } else {
      brief = briefModel({code, mapEvents: off ? [] : selectFiltered(state), allEvents: off ? [] : selectEvents(state), countries, mode: state.mode,
        coverage: data.coverage ?? null, research: data.research ?? null, contexts: data.contexts ?? null, filtered: filtered || !!filters.city, ...flags});
      setHTML(panel, renderBrief(brief, {now, hasPolygon: !map?.ready || map.hasCountry(code), selectedCity: filters.city ?? '',
        lazy: {coverage: lazy.coverage, research: lazy.research}}), 'panel', true);
    }
    // Selection bar (C-39): in flow between the stage and the legend, only while a country is selected.
    const showBar = !!code && !unavailable;
    if (showBar) {
      setHTML(selbar, selectionBarHTML({name: brief.name, state: brief.state, count: brief.matching.length, publishedCount: brief.publishedCount,
        filtered: filtered || !!filters.city, mode: state.mode}), 'selbar');
    }
    if (selbar.hidden === showBar) {
      const hadFocus = selbar.contains(doc.activeElement);
      selbar.hidden = !showBar;
      if (hadFocus) panelTitle()?.focus({preventScroll: true});
    }

    if (map?.ready) {
      const key = [mapEvents.map(e => e.id), code, state.mode, flags.loading, flags.error, filtered, countries.length, !!data.cities, !!data.contexts].join('|');
      if (key !== payloadKey || data.events !== drawnData[0] || data.examples !== drawnData[1]) {
        [payloadKey, drawnData] = [key, [data.events, data.examples]];
        map.update({events: mapEvents, countries, selectedCountry: code, mode: state.mode, loading: flags.loading, error: flags.error,
          contexts: isExample ? null : data.contexts ?? null, cityGeography: data.cities ?? null, filtered});
      }
      // Frame on selection change, and once more when city points arrive for a territory that fell back to its region.
      const refine = code && code === framed && /region|world/.test(framedVia) && data.cities && !citiesTried;
      if (code !== framed || refine) {
        citiesTried = refine || !!data.cities;
        framed = code;
        framedVia = frameCountry(code);
      }
    }
    syncZoom();
    if (mapStatus !== 'idle') requestLazy('cities');
    if (code && !isExample) { requestLazy('coverage'); requestLazy('research'); }
  }

  function ensure() {
    if (!mapPromise) {
      mapStatus = stage.dataset.mapState = 'loading';
      mapPromise = createWorldMap({container, tooltip: tip, gestures, reducedMotion, describe,
        onSelect: code => (code === latest?.filters?.country ? (framedVia = frameCountry(code)) : actions.selectCountry?.(code)),
        onSelectCity: (country, name) => actions.selectCity?.(country, name),
        labelObstacles: () => [...stage.querySelectorAll('.map-btn, .map-watermark')].map(el => el.getBoundingClientRect()),
      }).then(api => { map = api; mapStatus = api.ready ? 'ready' : 'unavailable'; }, () => { mapStatus = 'unavailable'; })
        .then(() => { [payloadKey, framed] = ['', undefined]; if (latest) paint(latest); });
    }
    return mapPromise;
  }

  function render(state) {
    if (!state) return;
    latest = state;
    if (state.route?.view !== 'map') return setExplore(false);
    ensure();
    paint(state);
  }
  return {render, ensure};
}
