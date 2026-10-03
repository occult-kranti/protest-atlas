// State transitions, share and export (WP2). Imports per SPEC §19.0. DOM-free when loaded:
// browser APIs are reached only inside the default `platform` functions, at call time.
import {PAGE_SIZE, STATUS_LABELS, selectEvents, selectFiltered, cityOptions, indexContexts, refinementOptions, countryNamer} from './model.js';
import {FILTER_KEYS, readViewState, encodeViewState, csvForEvents, shareURL} from '../explore.js';

export const FEEDBACK = Object.freeze({
  unknownSection: "That section doesn't exist.",
  unknownRecord: 'This record is not in the current snapshot.',
  copied: 'Link copied.',
  copyFallback: 'Copy this link:',
  shareExample: 'Sharing is off in example mode.',
  csvExample: 'Export is off in example mode: illustrative records are excluded.',
  csvEmpty: 'Nothing to export: no records match these filters.',
  csvNotLoaded: 'Records are not loaded yet, so there is nothing to export.',
  contextsFailed: 'Outcomes, endings and cities still could not load.',
});

const csvDone = n => `CSV downloaded: ${n} ${n === 1 ? 'record' : 'records'}.`;

/** Share sheet title with the view's filters or the record's title: "Protest Atlas · France · Last 30 days" (MINOR 15). */
export function shareTitle(state, kind = 'view') {
  if (kind === 'record') {
    const title = selectEvents(state).find(e => e.id === state?.route?.record)?.title;
    return title ? `${title} — Protest Atlas` : 'Protest Atlas';
  }
  const f = state?.filters ?? {};
  const parts = [f.query && `Search: ${f.query}`, f.country && countryNamer(state?.data?.countries)(f.country), f.region,
    f.city && f.city.split(':').slice(1).join(':'), f.window && f.window !== 'all' && `Last ${f.window} days`, f.status && STATUS_LABELS[f.status],
    f.issue, f.year, f.outcome && (f.outcome === 'documented' ? 'Outcome documented' : 'Outcome not established')].filter(Boolean);
  return ['Protest Atlas', ...parts].join(' · ');
}

/** Guard used by the export handler itself and by every export control's aria-disabled (C-43). */
export function exportAllowed(state) {
  if (state?.mode === 'example') return {ok: false, reason: FEEDBACK.csvExample};
  if (state?.load?.critical === 'loading' || state?.load?.errors?.events || !state?.data?.events) return {ok: false, reason: FEEDBACK.csvNotLoaded};
  if (!selectFiltered(state).length) return {ok: false, reason: FEEDBACK.csvEmpty};
  return {ok: true, reason: ''};
}

/** aria-disabled for every export control and for the share controls (C-43); app.js applies it after each render. */
export function controlStates(state) {
  return {csvDisabled: !exportAllowed(state).ok, shareDisabled: state?.mode === 'example'};
}

const EMPTY_FILTERS = Object.freeze(readViewState(''));
const sanitize = filters => readViewState(encodeViewState(filters));
const sameFilters = (a, b) => FILTER_KEYS.every(key => a?.[key] === b?.[key]);

/** Browser capabilities, resolved lazily so the module stays importable in Node. */
const defaultPlatform = {
  location: () => globalThis.location,
  canShare: () => typeof globalThis.navigator?.share === 'function' && Boolean(globalThis.matchMedia?.('(pointer: coarse)').matches),
  share: data => globalThis.navigator.share(data),
  writeClipboard: text => {
    const clipboard = globalThis.navigator?.clipboard;
    return clipboard?.writeText ? clipboard.writeText(text) : Promise.reject(new Error('no clipboard'));
  },
  download(text, filename) {
    const url = URL.createObjectURL(new Blob(['﻿', text], {type: 'text/csv;charset=utf-8'}));
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.hidden = true;
    globalThis.document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

/**
 * All state transitions (tech §4.4 + SPEC C-11, C-13, C-36, C-38, C-46).
 * `loader` is the lazy loader plus `critical()` (the controller wires js/data.js loadCritical in).
 * Optional `env.defaultView` and `platform` (share, clipboard, download) keep this testable in Node.
 */
export function createActions({store, router, loader, sheets = null, env = {}, platform = {}}) {
  const io = {...defaultPlatform, ...platform};
  const defaultView = env.defaultView ?? 'latest';
  let recordTrigger = null;

  const patchUI = patch => store.set(s => ({ui: {...s.ui, ...patch}}));
  const patchLoad = fn => store.set(s => ({load: fn(s.load)}));

  function setFeedback(text, {url = null} = {}) {
    store.set(s => ({ui: {...s.ui, feedback: text, feedbackURL: url, feedbackSeq: (s.ui.feedbackSeq ?? 0) + 1}}));
  }

  function setFilters(patch) {
    const s = store.get();
    let next = {...s.filters};
    for (const [key, value] of Object.entries(patch ?? {})) if (FILTER_KEYS.includes(key)) next[key] = value ?? '';
    // A country change clears a city that belongs to another country.
    if ('country' in (patch ?? {}) && !('city' in patch) && next.city && !next.city.startsWith(`${next.country}:`)) next.city = '';
    next = sanitize(next);
    const dropped = s.ui.droppedParams?.length ? [] : s.ui.droppedParams;
    if (sameFilters(next, s.filters) && dropped === s.ui.droppedParams) return;
    store.set({filters: sameFilters(next, s.filters) ? s.filters : next, ui: {...s.ui, listLimit: PAGE_SIZE, droppedParams: dropped}});
  }

  /** Drop permalink filters the loaded data cannot satisfy and record them for the notice (tech §2.4). */
  function validateFilters() {
    const s = store.get();
    if (s.mode !== 'reported' || !s.data.events || s.load.errors.events) return;
    const events = s.data.events.events;
    const f = {...s.filters};
    const drops = [];
    if (f.country && s.data.countries.length && !s.data.countries.some(c => c.code === f.country)) { f.country = ''; drops.push('country'); }
    const {regions, issues} = refinementOptions(events);
    if (f.region && !regions.includes(f.region)) { f.region = ''; drops.push('region'); }
    if (f.issue && !issues.includes(f.issue)) { f.issue = ''; drops.push('issue'); }
    if (f.city && s.data.contexts && !cityOptions(events, indexContexts(s.data.contexts), f.country).some(o => o.value === f.city)) { f.city = ''; drops.push('city'); }
    if (!drops.length) return;
    const droppedParams = [...new Set([...(s.ui.droppedParams ?? []), ...drops])];
    store.set({filters: sanitize(f), ui: {...s.ui, droppedParams}});
  }

  function loadLazy(name) {
    const s = store.get();
    if (s.load.lazy[name] === 'ready' && s.data[name] != null) return Promise.resolve(s.data[name]);
    if (s.load.lazy[name] !== 'loading') patchLoad(load => ({...load, lazy: {...load.lazy, [name]: 'loading'}}));
    return loader.load(name).then(value => {
      store.set(st => ({data: {...st.data, [name]: value}, load: {...st.load, lazy: {...st.load.lazy, [name]: 'ready'}}}));
      return value;
    }, () => {
      patchLoad(load => ({...load, lazy: {...load.lazy, [name]: 'error'}}));
      return null;
    });
  }

  async function loadCriticalData() {
    patchLoad(load => ({...load, critical: 'loading', errors: {}}));
    let result;
    try {
      result = await loader.critical();
    } catch {
      result = {data: {}, errors: {events: 'error', countries: 'error'}, critical: 'error'};
    }
    store.set(s => ({
      data: {...s.data, ...result.data, countries: Array.isArray(result.data?.countries) ? result.data.countries : []},
      load: {...s.load, critical: result.critical, errors: result.errors ?? {}},
    }));
    validateFilters();
    return result;
  }

  let contextsRetry = null;
  /** Retry only event-context.json (MAJOR 12); paused filters apply once it arrives. */
  function retryContexts() {
    if (contextsRetry) return contextsRetry;
    if (!store.get().load.errors.contexts || typeof loader.file !== 'function') return Promise.resolve(false);
    contextsRetry = loader.file('contexts').then(contexts => {
      store.set(s => {
        const {contexts: _failed, ...errors} = s.load.errors;
        return {data: {...s.data, contexts}, load: {...s.load, errors}};
      });
      validateFilters();
      return true;
    }, () => {
      setFeedback(FEEDBACK.contextsFailed);
      return false;
    }).finally(() => { contextsRetry = null; });
    return contextsRetry;
  }

  const actions = {
    setFilter(key, value) { setFilters({[key]: value}); },
    setFilters,
    resetFilters() {
      const s = store.get();
      if (sameFilters(s.filters, EMPTY_FILTERS) && !s.ui.droppedParams?.length) return;
      store.set({filters: {...EMPTY_FILTERS}, ui: {...s.ui, listLimit: PAGE_SIZE, droppedParams: []}});
    },
    /** Reset every filter except the country (C-13 `clear-except-country`). */
    clearExceptCountry() {
      const s = store.get();
      store.set({filters: {...EMPTY_FILTERS, country: s.filters.country}, ui: {...s.ui, listLimit: PAGE_SIZE, droppedParams: []}});
    },
    selectCountry(code, {view} = {}) {
      setFilters({country: code || ''});
      if (view) actions.navigate(view);
    },
    selectCity(country, name) {
      setFilters({country, city: country && name ? `${country}:${name}` : ''});
    },
    setMode(mode) {
      const s = store.get();
      if (mode !== 'reported' && mode !== 'example') return;
      if (mode === s.mode) {
        if (mode === 'example' && s.load.lazy.examples === 'error') actions.retry('examples');
        return;
      }
      if (router?.current?.()?.record) router.closeRecord();
      store.set({mode, filters: {...EMPTY_FILTERS}, ui: {...s.ui, listLimit: PAGE_SIZE, droppedParams: []}});
      if (mode === 'example') loadLazy('examples');
    },
    navigate(view, {param = null, replace = false} = {}) {
      router.go({view, param}, {replace});
    },
    openRecord(id, {trigger = null, replace = false} = {}) {
      recordTrigger = trigger;
      router.go({record: id}, {replace});
    },
    /** The element that opened the current record (focus returns to it on close). */
    recordTrigger() { return recordTrigger; },
    closeRecord() { router.closeRecord(); },
    /** Walk selectFiltered order with replaceState; false at the ends or outside the list (C-46). */
    stepRecord(delta) {
      const s = store.get();
      const id = s.route.record;
      const list = selectFiltered(s);
      const index = list.findIndex(e => e.id === id);
      const next = index < 0 ? null : list[index + delta];
      if (!next) return false;
      router.go({record: next.id}, {replace: true, user: false});
      return true;
    },
    showMore() {
      store.set(s => ({ui: {...s.ui, listLimit: (s.ui.listLimit || PAGE_SIZE) + PAGE_SIZE}}));
    },
    setDensity(density) {
      if (density !== 'card' && density !== 'row') return;
      if (store.get().ui.density === density) return;
      patchUI({density});
    },
    loadLazy,
    retry(name) {
      loader.reset(name);
      patchLoad(load => ({...load, lazy: {...load.lazy, [name]: 'idle'}}));
      return loadLazy(name);
    },
    loadCritical: loadCriticalData,
    retryCritical() { return loadCriticalData(); },
    retryContexts,
    validateFilters,
    setFeedback,
    dismissFeedback() {
      const s = store.get();
      if (!s.ui.feedback && !s.ui.feedbackURL) return;
      patchUI({feedback: '', feedbackURL: null});
    },
    /** share('view' | 'record'): navigator.share on coarse pointers, else the clipboard, else a persistent copy field. */
    async share(kind = 'view') {
      const s = store.get();
      if (s.mode === 'example') { setFeedback(FEEDBACK.shareExample); return 'refused'; }
      const loc = io.location();
      const url = shareURL({origin: loc?.origin ?? '', pathname: loc?.pathname ?? '/', filters: s.filters, route: s.route, defaultView, kind});
      if (io.canShare()) {
        try {
          await io.share({url, title: shareTitle(s, kind)});
          return 'shared';
        } catch (error) {
          if (error?.name === 'AbortError') return 'cancelled';
        }
      }
      try {
        await io.writeClipboard(url);
        setFeedback(FEEDBACK.copied);
        return 'copied';
      } catch {
        setFeedback(FEEDBACK.copyFallback, {url});
        return 'fallback';
      }
    },
    /** CSV of the records matching the current filters. Guarded here, not only by aria-disabled (tech risk 12). */
    exportCSV() {
      const s = store.get();
      const allowed = exportAllowed(s);
      if (!allowed.ok) { setFeedback(allowed.reason); return false; }
      const events = selectFiltered(s);
      io.download(csvForEvents(events, s.data.contexts), 'protest-atlas-reports.csv');
      setFeedback(csvDone(events.length));
      return true;
    },
    tick(now) { store.set({now}, {reason: 'tick'}); },
    sheets,
  };
  return actions;
}
