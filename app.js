// Bootstrap and controller (WP2): store, router, loaders, component mounting, delegated actions, 60 s tick.
// The static imports below are the final module graph (SPEC §19.0, C-48). The map is reached only through import().
import {readViewState, encodeViewState, droppedParams} from './explore.js';
import './freshness.js';
import {esc, icon} from './js/html.js';
import {selectEvents, selectFiltered, timeSnapshot, indexContexts, countryNamer} from './js/model.js';
import {createStore, initialState} from './js/store.js';
import {createRouter, parseRoute} from './js/router.js';
import {loadCritical, createLazyLoader} from './js/data.js';
import {createActions, controlStates, FEEDBACK} from './js/actions.js';
import {mountFilters} from './js/filters.js';
import {mountList} from './js/list.js';
import {mountStamps, refreshTimes} from './js/stamps.js';
import {mountNotice} from './js/notice.js';
import {initSheets, openSheet, closeSheet, isOpen, initChromeMetrics, sheetScroller} from './js/sheet.js';
import {primarySource} from './js/record-facts.js';
import {renderRecord, patchRecordStatus, mountRecordChrome} from './js/detail.js';
import {mountAhead} from './js/ahead.js';
import {mountCountries} from './js/countries.js';
import {mountAbout} from './js/about.js';

export {getDisplayStatus, dateLabel} from './js/model.js';

const TICK_MS = 60_000;
const FEEDBACK_MS = 4_000;
const URL_DEBOUNCE_MS = 250;
const E6 = 'The map could not load. Every country and territory is still available in the list and the A–Z directory.';
const M7 = 'Small territories are not drawn at this scale. <a href="#/countries">Use the country list</a>';
const M8 = 'Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe.';
const P1 = 'Protest Atlas: source-checked protest reports';

async function boot() {
  const doc = document;
  const html = doc.documentElement;
  const $ = id => doc.getElementById(id);
  const defaultView = html.dataset.defaultView || 'latest';
  const mapGestures = html.dataset.mapGestures || 'page';
  const reducedMotion = () => Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // ---- store, loaders, router, actions -------------------------------------------------------
  const store = createStore(initialState({filters: readViewState(location.search), defaultView, mapGestures, now: Date.now()}));
  const initialDrops = droppedParams(location.search);
  if (initialDrops.length) store.set(s => ({ui: {...s.ui, droppedParams: initialDrops}}));

  const lazy = createLazyLoader();
  const loader = {load: lazy.load, state: lazy.state, reset: lazy.reset, critical: () => loadCritical()};
  const recordSheet = $('record-sheet');
  const recordBody = $('record-body');
  const stampsSheet = $('stamps-sheet');
  const sheets = {openSheet, closeSheet, isOpen, record: recordSheet, filters: $('filters-sheet'), stamps: stampsSheet};

  let actions = null;
  const router = createRouter({
    defaultView,
    onChange(route, prev, meta) {
      store.set({route});
      if (meta.unknown) actions?.setFeedback(FEEDBACK.unknownSection);
    },
    beforePush: () => syncURL(store.get(), {now: true}),   // the entry being left keeps the filters it showed
  });
  actions = createActions({store, router, loader, sheets, env: {defaultView}});
  const ctx = {store, actions, env: {defaultView, mapGestures, reducedMotion}};

  initSheets(doc);
  initChromeMetrics(doc);
  const recordChrome = mountRecordChrome(recordSheet);

  // ---- components ---------------------------------------------------------------------------------
  const components = [mountNotice(ctx), mountStamps(ctx), mountFilters(ctx), mountList(ctx)];
  const firstVisit = {ahead: mountAhead, countries: mountCountries, about: mountAbout};   // C-21
  const mounted = new Map();
  let map = null;
  let mapPhase = 'idle';   // idle | loading | ready | failed
  let mapAttempt = 0;

  // ---- map: lazy import with an app-owned E6 when the module itself fails (§11.2) ------------------
  function showMapFallback() {
    const stage = $('map-stage');
    if (!stage) return;
    stage.dataset.mapState = 'unavailable';
    let box = stage.querySelector('.map-fallback');
    if (!box) {
      box = doc.createElement('div');
      box.className = 'map-fallback';
      stage.append(box);
    }
    box.innerHTML = `<p class="map-fallback-text" role="status">${esc(E6)}</p><div class="map-fallback-actions">`
      + '<button type="button" class="btn" data-action="retry-map">Retry map</button><a class="btn btn--quiet" href="#/countries">Open Countries</a></div>';
    for (const id of ['map-regions', 'map-controls', 'map-selbar']) { const el = $(id); if (el) el.hidden = true; }
    const legend = $('map-legend');
    if (legend) legend.innerHTML = `<p class="legend-note">${M7}</p><p class="legend-note">${esc(M8)}</p>`;
  }

  function clearMapFallback() {
    const stage = $('map-stage');
    stage?.querySelector('.map-fallback')?.remove();
    if (stage) delete stage.dataset.mapState;
    for (const id of ['map-regions', 'map-controls']) { const el = $(id); if (el) el.hidden = false; }
    const legend = $('map-legend');
    if (legend) legend.innerHTML = '';
  }

  async function loadMap() {
    if (mapPhase === 'loading' || mapPhase === 'ready') return;
    const retrying = mapPhase === 'failed';
    mapPhase = 'loading';
    if (retrying) {
      // [Retry map] is removed with the fallback, so focus moves to the view title instead of <body>.
      const refocus = $('map-stage')?.querySelector('.map-fallback')?.contains(doc.activeElement);
      clearMapFallback();
      if (refocus) $('map-title')?.focus({preventScroll: true});
    }
    store.set(s => ({ui: {...s.ui, mapStatus: 'loading'}}));
    try {
      // A retry keeps the import map's ?v= stamp and adds its own, so the browser fetches the module again.
      const base = import.meta.resolve?.('./js/map-view.js') ?? './js/map-view.js';
      const specifier = mapAttempt++ ? `${base}${base.includes('?') ? '&' : '?'}retry=${mapAttempt}` : './js/map-view.js';
      const module = await import(specifier);
      map = module.mountMap(ctx);
      mapPhase = 'ready';
      map.render(store.get(), null);
      await map.ensure?.();
      // map-view shows its own E6 when createWorldMap resolved without a drawable map (§11.2); mirror that here.
      const drawn = $('map-stage')?.dataset.mapState !== 'unavailable';
      store.set(s => ({ui: {...s.ui, mapStatus: s.ui.mapStatus === 'loading' ? (drawn ? 'ready' : 'unavailable') : s.ui.mapStatus}}));
    } catch (error) {
      if (map) {   // map-view owns failures after it has mounted (E6 with its own retry)
        store.set(s => ({ui: {...s.ui, mapStatus: 'unavailable'}}));
        return;
      }
      mapPhase = 'failed';
      store.set(s => ({ui: {...s.ui, mapStatus: 'unavailable'}}));
      showMapFallback();
    }
  }

  // ---- record sheet (tech §2.3, C-16, C-46) -------------------------------------------------------------
  let openId = null;
  let titleBeforeRecord = null;
  const eyebrow = $('record-eyebrow'), mini = $('record-minititle'), prevBtn = $('record-prev'), nextBtn = $('record-next');
  const sourceLink = $('record-source'), announcer = $('record-announcer');

  const setDisabled = (el, off) => {
    if (!el) return;
    if (off) { if (el.getAttribute('aria-disabled') !== 'true') el.setAttribute('aria-disabled', 'true'); }
    else if (el.hasAttribute('aria-disabled')) el.removeAttribute('aria-disabled');
  };

  function fillChrome(state, event, index, total) {
    if (eyebrow) eyebrow.textContent = state.mode === 'example' ? 'Illustrative example' : index >= 0 ? `Record ${index + 1} of ${total} in this view` : 'Record';
    if (mini) mini.textContent = event.title ?? '';
    const inList = index >= 0;
    for (const [button, disabled] of [[prevBtn, index <= 0], [nextBtn, index >= total - 1]]) {
      if (!button) continue;
      button.hidden = !inList;
      setDisabled(button, inList && disabled);
    }
    if (sourceLink) {
      let primary = null;
      try { primary = primarySource(event); } catch { primary = null; }
      if (primary?.url) {
        sourceLink.href = primary.url;
        sourceLink.innerHTML = `${esc(primary.label)}${icon('external')}`;
        sourceLink.setAttribute('aria-label', primary.ariaLabel);
        sourceLink.hidden = false;
      } else {
        sourceLink.hidden = true;
        sourceLink.removeAttribute('href');
      }
    }
  }

  /** The element that opened this record; a typed hash or Back/Forward has none (the last click was for another id). */
  const triggerFor = id => {
    const el = actions.recordTrigger();
    return el && (el.dataset?.openRecord === id || el.getAttribute?.('href') === `#/record/${id}`) ? el : null;
  };

  function recordReturnFocus(id) {
    const trigger = triggerFor(id);
    return () => {
      if (trigger?.isConnected && trigger.getClientRects().length) return trigger;
      return [...doc.querySelectorAll('[data-open-record]')]
        .find(el => el.dataset.openRecord === id && !recordSheet.contains(el) && el.getClientRects().length) ?? null;
    };
  }

  function syncRecord(state, prev) {
    const id = state.route.record;
    const shown = isOpen(recordSheet);
    if (!id) {
      if (shown) closeSheet(recordSheet, 'route');
      openId = null;
      return;
    }
    // Wait for the records; after an events failure the route stays pending until Retry succeeds (C-37).
    const ready = state.mode === 'example' ? state.load.lazy.examples === 'ready' : state.load.critical !== 'loading' && !state.load.errors.events;
    if (!ready) return;
    const event = selectEvents(state).find(e => e.id === id);
    if (!event) {
      if (shown) closeSheet(recordSheet, 'route');
      openId = null;
      actions.setFeedback(FEEDBACK.unknownRecord);
      router.go({view: state.route.view, param: state.route.param}, {replace: true, user: false});
      return;
    }
    const filtered = selectFiltered(state);
    const index = filtered.findIndex(e => e.id === id);
    const context = state.mode === 'reported' ? indexContexts(state.data.contexts).get(id) ?? null : null;
    if (openId !== id || !shown) {
      const stepping = shown && openId !== null && openId !== id;
      recordBody.innerHTML = renderRecord(event, {context, mode: state.mode, now: state.now, countryName: countryNamer(state.data.countries),
        position: index >= 0 ? {index, total: filtered.length} : null});
      fillChrome(state, event, index, filtered.length);
      if (stepping) {
        const scroller = sheetScroller(recordSheet);
        if (scroller) scroller.scrollTop = 0;
        if (announcer) announcer.textContent = `${event.title}. Record ${index + 1} of ${filtered.length} in this view.`;
      } else if (!shown) {
        titleBeforeRecord = doc.title;
        openSheet(recordSheet, {trigger: triggerFor(id), focus: '#detail-title', returnFocus: recordReturnFocus(id)});
      }
      openId = id;
      doc.title = `${event.title} — Protest Atlas`;
      recordChrome.refresh?.();
      return;
    }
    if (prev && (state.now !== prev.now || state.filters !== prev.filters || state.data !== prev.data)) {
      patchRecordStatus(recordBody, event, state.now);
      fillChrome(state, event, index, filtered.length);
    }
  }

  recordSheet?.addEventListener('sheet:close', event => {
    const reason = event.detail?.reason;
    openId = null;
    if (titleBeforeRecord !== null) { doc.title = titleBeforeRecord; titleBeforeRecord = null; }
    if (store.get().ui.feedbackURL) actions.dismissFeedback();
    if (reason !== 'route' && reason !== 'link' && store.get().route.record) actions.closeRecord();
  });
  stampsSheet?.addEventListener('sheet:open', () => { actions.loadLazy('discovery'); });

  // ---- feedback (§4.5, C-36) -----------------------------------------------------------------------
  const pageToast = $('action-feedback'), sheetToast = $('record-feedback');
  let feedbackKey = null, feedbackTimer = null, feedbackSeqShown = -1, shareTrigger = null;

  function renderFeedback(state) {
    const {feedback, feedbackURL, feedbackSeq} = state.ui;
    const inSheet = isOpen(recordSheet);
    const key = `${feedbackSeq}|${inSheet}|${feedback}|${feedbackURL ?? ''}`;
    if (key === feedbackKey) return;
    feedbackKey = key;
    const target = inSheet ? sheetToast : pageToast;
    const other = inSheet ? pageToast : sheetToast;
    if (other) { other.hidden = true; other.replaceChildren(); }
    if (!target) return;
    if (!feedback && !feedbackURL) {
      clearTimeout(feedbackTimer);
      target.hidden = true;
      target.replaceChildren();
      return;
    }
    target.hidden = false;
    if (feedbackURL) {
      clearTimeout(feedbackTimer);
      target.innerHTML = `<p class="toast-text">${esc(feedback || FEEDBACK.copyFallback)}</p><input class="toast-url" type="text" readonly value="${esc(feedbackURL)}" aria-label="Link to copy">`
        + '<button type="button" class="btn btn--quiet toast-close" data-action="dismiss-feedback">Close</button>';
      const input = target.querySelector('.toast-url');
      input.focus({preventScroll: true});
      input.select();
    } else {
      target.innerHTML = `<p class="toast-text">${esc(feedback)}</p>`;
      if (feedbackSeq !== feedbackSeqShown) {
        clearTimeout(feedbackTimer);
        feedbackTimer = setTimeout(() => actions.dismissFeedback(), FEEDBACK_MS);
      }
    }
    feedbackSeqShown = feedbackSeq;
  }

  // ---- aria-disabled on export and share controls (C-43) -------------------------------------------
  function syncDisabled(state) {
    const {csvDisabled, shareDisabled} = controlStates(state);
    for (const el of doc.querySelectorAll('[data-action="export-csv"]')) setDisabled(el, csvDisabled);
    for (const el of doc.querySelectorAll('[data-action="share-view"], #record-share')) setDisabled(el, shareDisabled);
  }

  // ---- URL query (tech §2.3: replaceState, debounced, reported mode, after the critical load) -------
  // Filters are not history: whichever entry is shown (after a filter change, a push, Back or Forward) has its
  // query rewritten to the filters on screen, so a reload or a copied address restores what the reader sees.
  let urlTimer = null;
  function syncURL(state, {now = false} = {}) {
    clearTimeout(urlTimer);
    if (state.mode !== 'reported' || state.load.critical === 'loading') return;
    const q = encodeViewState(state.filters);
    const search = q ? `?${q}` : '';
    if (search === location.search) return;
    const write = () => history.replaceState(history.state, '', `${location.pathname}${search}${location.hash}`);
    if (now) write(); else urlTimer = setTimeout(write, URL_DEBOUNCE_MS);
  }
  addEventListener('popstate', () => syncURL(store.get(), {now: true}));

  // ---- render loop: one subscription, coalesced per frame (tech §4.5) -------------------------------
  let rendered = null;
  let scheduled = false;
  let lastSnapshot = '';

  function flush() {
    scheduled = false;
    const state = store.get();
    const prev = rendered;
    rendered = state;
    html.dataset.mode = state.mode;
    html.dataset.loading = String(state.load.critical === 'loading');
    for (const component of components) component.render(state, prev);
    const view = state.route.view;
    for (const component of mounted.values()) component.render(state, prev);
    if (firstVisit[view] && !mounted.has(view)) {
      const component = firstVisit[view](ctx);
      mounted.set(view, component);
      component.render(state, null);
      if (view === 'about') actions.loadLazy('discovery');
    }
    if (view === 'map' && mapPhase === 'idle') loadMap();
    if (map) map.render(state, prev);
    syncDisabled(state);
    syncRecord(state, prev);
    renderFeedback(state);
    if (prev && state.route !== prev.route) syncURL(state, {now: true});
    else if (!prev || state.filters !== prev.filters || state.load.critical !== prev.load.critical || state.mode !== prev.mode) syncURL(state);
    lastSnapshot = timeSnapshot(state);
    router.afterRender();
    refreshTimes(doc, Date.now());
  }

  store.subscribe(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  });

  // ---- delegated clicks (tech §4.8 + C-13) ----------------------------------------------------------------
  function onAction(name, el) {
    switch (name) {
      case 'share-view': shareTrigger = el; actions.share('view'); return true;
      case 'share-record': shareTrigger = el; actions.share('record'); return true;
      case 'export-csv': actions.exportCSV(); return true;
      case 'show-more': actions.showMore(); return true;
      case 'record-prev':
      case 'record-next':
        if (el.getAttribute('aria-disabled') !== 'true') actions.stepRecord(name === 'record-next' ? 1 : -1);
        return true;
      case 'retry-data': actions.retryCritical(); return true;
      case 'clear-except-country': actions.clearExceptCountry(); return true;
      case 'dismiss-feedback':
        actions.dismissFeedback();
        if (shareTrigger?.isConnected) shareTrigger.focus({preventScroll: true});
        return true;
      case 'retry-map':
        if (map) return false;   // map-view.js owns it once loaded
        // A failed static dependency (map.js, country-brief.js) stays failed in the module map until a reload,
        // so after one failed re-import the retry reloads the page (only when online: offline it would lose the page).
        if (mapAttempt >= 2 && globalThis.navigator?.onLine !== false) location.reload();
        else loadMap();
        return true;
      default: return false;
    }
  }

  doc.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const state = store.get();

    const actionEl = target.closest('[data-action]');
    if (actionEl && onAction(actionEl.dataset.action, actionEl)) { event.preventDefault(); return; }

    const retryEl = target.closest('[data-retry]');
    if (retryEl) { event.preventDefault(); actions.retry(retryEl.dataset.retry); return; }

    const modeEl = target.closest('[data-set-mode]');
    if (modeEl) {
      event.preventDefault();
      const mode = modeEl.dataset.setMode;
      actions.setMode(mode);
      if (mode === 'example' && store.get().route.view !== 'latest') actions.navigate('latest');   // C-38
      return;
    }

    const densityEl = target.closest('[data-set-density]');
    if (densityEl) { event.preventDefault(); actions.setDensity(densityEl.dataset.setDensity); return; }

    const clearEl = target.closest('[data-clear-filter]');
    if (clearEl) {
      const key = clearEl.dataset.clearFilter;
      if (key === 'all') actions.resetFilters();
      else actions.setFilter(key, key === 'window' ? 'all' : '');
      if (clearEl.tagName === 'A') event.preventDefault();
      return;
    }

    const countryEl = target.closest('[data-select-country]');
    if (countryEl) {
      event.preventDefault();
      if (state.mode === 'example' && countryEl.closest('#view-countries')) actions.setMode('reported');   // C-38
      actions.selectCountry(countryEl.dataset.selectCountry, {view: countryEl.dataset.viewAfter || undefined});
      return;
    }

    const cityEl = target.closest('[data-select-city]');
    if (cityEl) {
      event.preventDefault();
      const [country, ...rest] = String(cityEl.dataset.selectCity).split(':');
      actions.selectCity(country, rest.join(':'));
      return;
    }

    const opener = target.closest('[data-open-record]');
    if (opener) {
      event.preventDefault();
      actions.openRecord(opener.dataset.openRecord, {trigger: opener});
      return;
    }

    const link = target.closest('a[href]');
    if (link && !link.target && !link.hasAttribute('download')) {
      const href = link.getAttribute('href');
      if (!href.startsWith('#')) return;
      const route = parseRoute(href, defaultView);
      if (!route || route.unknown) return;
      event.preventDefault();
      if (route.record) actions.openRecord(route.record, {trigger: link});
      else router.go(route, {user: true});
    }
  });

  // ---- time: 60 s tick + visibilitychange + pageshow (tech §7.3, §16.2 item 7) ---------------------
  function tick() {
    const now = Date.now();
    refreshTimes(doc, now);
    const next = timeSnapshot({...store.get(), now});
    if (next !== lastSnapshot) {
      lastSnapshot = next;
      actions.tick(now);
    }
  }
  setInterval(tick, TICK_MS);
  doc.addEventListener('visibilitychange', () => { if (!doc.hidden) tick(); });
  addEventListener('pageshow', event => { if (event.persisted) tick(); });

  // ---- start ------------------------------------------------------------------------------------------------
  if (!doc.title) doc.title = P1;
  router.start();
  if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  await actions.loadCritical();
}

if (typeof document !== 'undefined') boot();
