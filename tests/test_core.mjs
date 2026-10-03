// WP2 core: model, router, store, data, explore additions, actions, stamps, notice and list states (SPEC §19 WP2).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {
  PAGE_SIZE, STATUS_LABELS, statusLabel, foldText, searchableText, queryTokens, indexContexts, eventMatches,
  sortByObservation, selectEvents, selectFiltered, activeFilterCount, availableYears, cityOptions, refinementOptions,
  statusOptions, datasetStats, snapshotState, evidenceAgeDays, sweepFact, groupByBand, emptyBandNotice, timeSnapshot, getDisplayStatus,
  sweepLine, E5,
} from '../js/model.js';
import {createStore, initialState} from '../js/store.js';
import {VIEWS, ROUTE_ALIASES, VIEW_NAMES, parseRoute, formatRoute, createRouter} from '../js/router.js';
import {CRITICAL, LAZY, SHAPES, DataError, fetchJSON, loadCritical, createLazyLoader} from '../js/data.js';
import {createActions, exportAllowed, controlStates, FEEDBACK} from '../js/actions.js';
import {QUICK_CHIPS} from '../js/filters.js';
import {statsHTML, summaryText, listHTML, moreHTML} from '../js/list.js';
import {STAMP_ROWS, stampItems, chipModel, footerStampsHTML, refreshTimes} from '../js/stamps.js';
import {PILOT_DISCLOSURE, noticeModel, mountNotice} from '../js/notice.js';
import {FILTER_KEYS, droppedParams, shareURL, readViewState, encodeViewState} from '../explore.js';
import {updateStamps} from '../freshness.js';

const root = new URL('../', import.meta.url);
const load = async name => JSON.parse(await readFile(new URL(`public/${name}`, root)));
const [events, countries, contexts, upcoming, examples] = await Promise.all(
  ['events.json', 'countries.json', 'event-context.json', 'upcoming.json', 'examples.json'].map(load));

const T = iso => Date.parse(iso);
const OCT2 = T('2026-10-02T23:00:00Z');
const OCT9 = T('2026-10-09T12:00:00Z');
const EMPTY = readViewState('');

/** A ready reported state on the real files. */
function readyState(over = {}) {
  const base = initialState({filters: EMPTY, defaultView: 'latest', mapGestures: 'page', now: OCT2});
  return {
    ...base,
    data: {...base.data, events, countries, contexts, upcoming, build: null},
    load: {...base.load, critical: 'ready', errors: {build: 'absent'}},
    ...over,
  };
}
const withFilters = (filters, over = {}) => readyState({filters: {...EMPTY, ...filters}, ...over});

/** Minimal fetch double: map of path → {status, body}. */
function fakeFetch(routes) {
  return async path => {
    const route = routes[path] ?? {status: 404};
    if (route.throws) throw new TypeError('network');
    const status = route.status ?? 200;
    return {ok: status >= 200 && status < 300, status, json: async () => {
      if (route.raw !== undefined) return JSON.parse(route.raw);
      return route.body;
    }};
  };
}
const realRoutes = () => ({
  [CRITICAL.events]: {body: events}, [CRITICAL.countries]: {body: countries}, [CRITICAL.contexts]: {body: contexts},
  [CRITICAL.upcoming]: {body: upcoming}, [CRITICAL.build]: {status: 404},
});

/** A router double that records navigation and keeps a current route. */
function fakeRouter(store) {
  const calls = [];
  let current = {view: 'latest', param: null, record: null};
  return {
    calls,
    current: () => current,
    go(route, opts = {}) {
      calls.push({route, opts});
      current = route.record ? {...current, record: route.record} : {view: route.view, param: route.param ?? null, record: null};
      store.set({route: current});
    },
    closeRecord() { calls.push({close: true}); current = {...current, record: null}; store.set({route: current}); },
  };
}

function harness(state = readyState(), {routes = realRoutes(), platform = {}} = {}) {
  const store = createStore(state);
  const router = fakeRouter(store);
  const lazy = createLazyLoader({fetchImpl: fakeFetch(routes)});
  const loader = {...lazy, critical: () => loadCritical({fetchImpl: fakeFetch(routes)})};
  const actions = createActions({store, router, loader, env: {defaultView: 'latest'}, platform: {
    location: () => ({origin: 'https://example.org', pathname: '/protest-atlas/'}),
    canShare: () => false,
    writeClipboard: async () => {},
    download: () => {},
    ...platform,
  }});
  return {store, router, actions};
}

// ---------------------------------------------------------------------------------------------- model

test('PAGE_SIZE is 12 and the initial list window matches it (C-04)', () => {
  assert.equal(PAGE_SIZE, 12);
  assert.equal(initialState({filters: EMPTY}).ui.listLimit, PAGE_SIZE);
  assert.equal(initialState({filters: EMPTY}).ui.density, 'card');
});

test('statusLabel gives ST1–ST5 with dates (C-06)', () => {
  assert.equal(STATUS_LABELS.unknown, 'Current status not established');
  assert.equal(statusLabel('ended', {end_date: '2026-09-30'}), 'Ended / suspended 30 Sep 2026');
  assert.equal(statusLabel('ongoing', {last_observed_at: '2026-10-02'}), 'Reported ongoing · evidence dated 2 Oct 2026');
  assert.equal(statusLabel('needs-review', {}), 'Needs review · current status unknown');
  assert.equal(statusLabel('planned'), 'Planned');
  assert.equal(statusLabel('ended', {end_date: null}), 'Ended / suspended');
  assert.equal(statusLabel('bogus'), 'Current status not established');
  const tz = events.events.find(e => e.id === 'tz-drivers-20260929');
  assert.equal(statusLabel(getDisplayStatus(tz, OCT2), tz), 'Ended / suspended 30 Sep 2026');
});

test('search folds diacritics, ANDs tokens and covers state response and intensity (C-09)', () => {
  assert.equal(foldText('São Paulo'), 'sao paulo');
  assert.deepEqual(queryTokens('  Tear   GAS  '), ['tear', 'gas']);
  assert.equal(queryTokens('a b c d e f g h i j').length, 8);
  const event = {title: 'Strike', summary: '', country_name: 'Brazil', location: {label: 'São Paulo'}, issues: ['Labour'],
    positions: [{actor: 'Union', claim: 'Wages', target: 'Ministry'}], state_response: [{action: 'Tear gas fired', attribution: 'Folha'}],
    intensity: {turnout: {min: null, max: null, qualifier: 'Thousands, as reported'}, disruption: 'Metro closed', violence: 'Injuries reported'}};
  for (const q of ['sao paulo', 'SÃO', 'tear gas', 'folha', 'thousands', 'metro closed', 'injuries', 'ministry wages']) {
    assert.equal(eventMatches(event, {...EMPTY, query: q}, {now: OCT2}), true, q);
  }
  assert.equal(eventMatches(event, {...EMPTY, query: 'tear housing'}, {now: OCT2}), false);
  const es = events.events.find(e => e.id === 'es-housing-20261002');
  assert.ok(searchableText(es).includes('parliament rejected the decrees'));
  assert.ok(searchableText(es).includes('disruption beyond the reported march'));
});

test('ignoreCountry also ignores the city, so the map keeps world context', () => {
  const index = indexContexts(contexts);
  const fr = events.events.find(e => e.id === 'fr-schools-20261002');
  const es = events.events.find(e => e.id === 'es-housing-20261002');
  const filters = {...EMPTY, country: 'FR', city: 'FR:Paris'};
  assert.equal(eventMatches(fr, filters, {context: index.get(fr.id), now: OCT2}), true);
  assert.equal(eventMatches(es, filters, {context: index.get(es.id), now: OCT2}), false);
  assert.equal(eventMatches(es, filters, {context: index.get(es.id), now: OCT2, ignoreCountry: true}), true);
});

test('sortByObservation is newest first and keeps file order on ties (C-34)', () => {
  const sorted = sortByObservation(events.events);
  assert.deepEqual(sorted.slice(0, 3).map(e => e.id), ['in-electoral-20261002', 'fr-schools-20261002', 'es-housing-20261002']);
  assert.notEqual(sorted, events.events);
  const rows = [{id: 'a', last_observed_at: '2026-01-01'}, {id: 'b', last_observed_at: 'bad'}, {id: 'c', last_observed_at: '2026-01-01'}, {id: 'd', last_observed_at: '2026-02-01'}];
  assert.deepEqual(sortByObservation(rows).map(e => e.id), ['d', 'a', 'c', 'b']);
});

test('activeFilterCount, availableYears, refinements and city options', () => {
  assert.equal(activeFilterCount(EMPTY), 0);
  assert.equal(activeFilterCount({...EMPTY, window: '7', query: 'x', country: 'FR'}), 3);
  assert.deepEqual(availableYears(events.events), ['2026', '2025', '2024']);
  const {regions, issues} = refinementOptions(events.events);
  assert.deepEqual(regions, ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']);
  assert.ok(issues.includes('Labor') && issues.includes('Labour'));
  assert.deepEqual([...issues].sort((a, b) => a.localeCompare(b, 'en')), issues);
  const cities = cityOptions(events.events, indexContexts(contexts), 'FR');
  assert.ok(cities.some(c => c.value === 'FR:Paris' && c.label === 'Paris · France'));
  assert.ok(cities.every(c => c.value.startsWith('FR:')));
});

test('statusOptions hides zero-count statuses unless selected (C-07), and the list renders E7', () => {
  const values = statusOptions(readyState()).map(o => o.value);
  assert.deepEqual(values, ['', 'ended', 'unknown']);
  assert.equal(statusOptions(readyState())[0].count, 84);
  const ongoing = withFilters({status: 'ongoing'});
  const options = statusOptions(ongoing);
  assert.deepEqual(options.find(o => o.value === 'ongoing'), {value: 'ongoing', label: 'Reported ongoing', count: 0});
  assert.equal(selectFiltered(ongoing).length, 0);
  const {html} = listHTML(ongoing, selectFiltered(ongoing));
  assert.match(html, /No episode in this snapshot is currently labelled &#39;Reported ongoing&#39;\./);
  assert.match(html, /within 72 hours/);
  assert.match(html, /It does not mean no protests are happening\./);
  assert.match(html, /data-clear-filter="all"/);
  const planned = withFilters({status: 'planned'});
  assert.match(listHTML(planned, selectFiltered(planned)).html, /sourced future start date/);
  const review = withFilters({status: 'needs-review'});
  assert.match(listHTML(review, selectFiltered(review)).html, /more than 72 hours old/);
});

test('empty results give E8 for a search alone, E1 otherwise, and a true-empty envelope offers the example', () => {
  const search = withFilters({query: 'zzzz-nothing'});
  const e8 = listHTML(search, selectFiltered(search)).html;
  assert.match(e8, /No published episode mentions &#39;zzzz-nothing&#39;\./);
  assert.match(e8, /data-clear-filter="query"/);
  assert.match(e8, /href="#\/countries"/);
  const both = withFilters({query: 'zzzz', window: '7'});
  const e1 = listHTML(both, selectFiltered(both)).html;
  assert.match(e1, /No published episode matches these filters\./);
  assert.match(e1, /That describes this atlas, not the world\./);
  const ended = withFilters({status: 'ended', country: 'IS'});
  assert.match(listHTML(ended, selectFiltered(ended)).html, /No published episode matches these filters\./);
  const empty = readyState({data: {...readyState().data, events: {...events, events: []}}});
  const none = listHTML(empty, []).html;
  assert.match(none, /No episodes are published in this snapshot\./);
  assert.match(none, /data-set-mode="example"/);
});

test('datasetStats: scope only, never "N in the last 7 days" (C-08)', () => {
  const stats = datasetStats(events, countries, OCT2);
  assert.deepEqual(stats, {episodes: 84, countriesWithRecords: 81, directoryTotal: 249, newestEvidence: '2026-10-02', fresh: 5});
  assert.equal('observed7' in stats, false);
});

test('snapshotState boundaries from the newest evidence day (C-02)', () => {
  const at = iso => snapshotState(events, T(iso));
  assert.equal(at('2026-10-04T23:59:59.999Z'), 'current');
  assert.equal(at('2026-10-05T00:00:00Z'), 'aging');
  assert.equal(at('2026-10-08T23:59:59.999Z'), 'aging');
  assert.equal(at('2026-10-09T00:00:00Z'), 'stale');
  assert.equal(at('2026-10-31T23:59:59.999Z'), 'stale');
  assert.equal(at('2026-11-01T00:00:00Z'), 'archive');
  assert.equal(snapshotState(null, OCT2), 'unknown');
  assert.equal(snapshotState({events: []}, OCT2), 'unknown');
  assert.equal(evidenceAgeDays(events, OCT9), 7);
  assert.equal(evidenceAgeDays(events, T('2026-10-11T23:59:00Z')), 9);
  assert.equal(evidenceAgeDays(events, T('2026-10-12T00:00:00Z')), 10);
  assert.equal(evidenceAgeDays({events: []}, OCT2), null);
});

test('sweepFact parses the real files and never invents a date (§6.6)', () => {
  assert.deepEqual(sweepFact({events, upcoming}), {
    records: {day: '2026-10-02', blocked: true},
    announcements: {day: '2026-10-02', blocked: true, searches: 167, pagesRead: 0},
  });
  assert.deepEqual(sweepFact({events: {coverage_note: 'A recent-activity search on 9 Nov 2026 read 12 source pages and added two.'}, upcoming: {note: 'Latest search for announcements: 2026-11-09, 40 searches logged, 3 source pages could be opened.'}}), {
    records: {day: '2026-11-09', blocked: false},
    announcements: {day: '2026-11-09', blocked: false, searches: 40, pagesRead: 3},
  });
  assert.deepEqual(sweepFact({events: {coverage_note: 'No sweep sentence.'}, upcoming: {note: ''}}), {records: null, announcements: null});
  assert.deepEqual(sweepFact({}), {records: null, announcements: null});
});

test('groupByBand and emptyBandNotice on the 2, 6 and 9 Oct clocks (§6.4, §16.2)', () => {
  const sorted = sortByObservation(events.events);
  const oct2 = groupByBand(sorted, OCT2);
  assert.deepEqual(oct2.map(g => [g.heading, g.events.length]), [['Latest evidence within 72 hours', 5], ['Earlier research, 2024–2026', 79]]);
  assert.equal(oct2[0].events[0].id, 'in-electoral-20261002');
  const oct9 = groupByBand(sorted, OCT9);
  assert.ok(oct9[0].heading.startsWith('7 to 30 days ago'));
  assert.equal(oct9[0].events.length, 5);
  assert.ok(oct9.every(g => !g.heading.includes('within 72 hours') && g.events.length > 0));
  assert.equal(emptyBandNotice(events.events, OCT2), null);
  assert.equal(emptyBandNotice(events.events, T('2026-10-06T00:00:00Z')), 'fresh');
  assert.equal(emptyBandNotice(events.events, OCT9), 'week');
  assert.equal(emptyBandNotice([], OCT9), null);
});

test('timeSnapshot changes at band, snapshot and UTC-midnight boundaries (C-52)', () => {
  const snap = iso => timeSnapshot(readyState({now: T(iso)}));
  assert.equal(snap('2026-10-02T23:00:00Z'), snap('2026-10-02T23:59:00Z'));
  assert.notEqual(snap('2026-10-04T23:59:59.999Z'), snap('2026-10-05T00:00:00Z'));
  assert.notEqual(snap('2026-10-08T23:59:59.999Z'), snap('2026-10-09T00:00:00Z'));
  assert.notEqual(snap('2026-10-31T23:59:59.999Z'), snap('2026-11-01T00:00:00Z'));
  assert.notEqual(snap('2026-10-10T23:59:00Z'), snap('2026-10-11T00:00:00Z'));
  const item = {id: 'x', planned_start: '2026-10-07', planned_end: null, date_precision: 'day', status: 'announced'};
  const withItem = iso => timeSnapshot(readyState({now: T(iso), data: {...readyState().data, upcoming: {...upcoming, items: [item]}}}));
  assert.notEqual(withItem('2026-10-03T23:59:00Z'), withItem('2026-10-04T00:00:00Z'));
});

test('selectEvents and selectFiltered follow the mode', () => {
  const ex = readyState({mode: 'example', data: {...readyState().data, examples}});
  assert.deepEqual(selectEvents(ex).map(e => e.id), ['example-civic-services']);
  assert.equal(selectFiltered(readyState()).length, 84);
  assert.equal(selectFiltered(withFilters({window: '7'})).length, 5);
  assert.equal(selectFiltered(withFilters({window: '7'}, {now: OCT9})).length, 0);
});

// --------------------------------------------------------------------------------------------- explore

test('explore: year regex, dropped params and the 9-key codec (tech §2.4)', () => {
  assert.equal(readViewState('?year=2027').year, '2027');
  assert.equal(readViewState('?year=1999').year, '');
  const state = {...EMPTY, query: 'tear gas', country: 'FR', window: '30', year: '2027', city: 'FR:Paris', outcome: 'documented'};
  assert.deepEqual(readViewState(encodeViewState(state)), state);
  assert.deepEqual(Object.keys(readViewState('')), FILTER_KEYS);
  assert.deepEqual(droppedParams('?status=live&year=1999&window=999'), ['status', 'window', 'year']);
  assert.deepEqual(droppedParams('?status=live&year=1999'), ['status', 'year']);
  assert.deepEqual(droppedParams('?country=fr&q=ok&utm_source=x'), ['country']);
  assert.deepEqual(droppedParams('?window=all&status=ended&year=2025'), []);
  assert.deepEqual(droppedParams(''), []);
});

test('shareURL: view link carries filters; the default view hash is omitted; record links drop filters', () => {
  const base = {origin: 'https://occult-kranti.github.io', pathname: '/protest-atlas/', defaultView: 'latest'};
  assert.equal(shareURL({...base, filters: {...EMPTY, country: 'FR', window: '30'}, route: {view: 'latest'}}), 'https://occult-kranti.github.io/protest-atlas/?country=FR&window=30');
  assert.equal(shareURL({...base, filters: EMPTY, route: {view: 'map'}}), 'https://occult-kranti.github.io/protest-atlas/#/map');
  assert.equal(shareURL({...base, filters: {...EMPTY, status: 'ended'}, route: {view: 'ahead', param: 'roadmap'}}), 'https://occult-kranti.github.io/protest-atlas/?status=ended#/ahead/roadmap');
  assert.equal(shareURL({...base, filters: {...EMPTY, country: 'FR'}, route: {view: 'map', record: 'fr-schools-20261002'}, kind: 'record'}), 'https://occult-kranti.github.io/protest-atlas/#/record/fr-schools-20261002');
  const restored = new URL(shareURL({...base, filters: {...EMPTY, country: 'FR', window: '30'}, route: {view: 'latest'}}));
  assert.equal(readViewState(restored.search).country, 'FR');
  assert.equal(readViewState(restored.search).window, '30');
});

// ---------------------------------------------------------------------------------------------- router

test('parseRoute and formatRoute: views, params, records, aliases, unknown and non-routes', () => {
  for (const view of VIEWS) {
    assert.deepEqual(parseRoute(`#/${view}`), {view, param: null, record: null, alias: false, unknown: false});
    assert.equal(formatRoute({view}), `#/${view}`);
  }
  for (const hash of ['', '#', '#/']) assert.equal(parseRoute(hash, 'latest').view, 'latest');
  assert.equal(parseRoute('', 'map').view, 'map');
  assert.deepEqual(parseRoute('#/ahead/roadmap'), {view: 'ahead', param: 'roadmap', record: null, alias: false, unknown: false});
  assert.equal(parseRoute('#/ahead/actions').param, 'actions');
  assert.equal(parseRoute('#/ahead/other').unknown, true);
  assert.equal(formatRoute({view: 'ahead', param: 'roadmap'}), '#/ahead/roadmap');
  assert.equal(parseRoute('#/record/fr-schools-20261002').record, 'fr-schools-20261002');
  assert.equal(formatRoute({view: 'map', record: 'fr-schools-20261002'}), '#/record/fr-schools-20261002');
  assert.equal(parseRoute('#/record/<svg>').unknown, true);
  assert.equal(parseRoute('#/record/%3Csvg%3E').unknown, true);
  assert.equal(parseRoute('#/record/').unknown, true);
  const alias = (hash, view, param = null) => {
    const route = parseRoute(hash);
    assert.equal(route.alias, true, hash);
    assert.equal(route.view, view, hash);
    assert.equal(route.param, param, hash);
  };
  alias('#atlas', 'map'); alias('#countries', 'countries'); alias('#methodology', 'about');
  alias('#roadmap', 'ahead', 'roadmap'); alias('#/next', 'ahead'); alias('#/roadmap', 'ahead', 'roadmap');
  alias('#/reports', 'latest'); alias('#/coming-next', 'ahead', 'roadmap');
  assert.equal(Object.keys(ROUTE_ALIASES).length, 8);
  assert.deepEqual(parseRoute('#/x'), {view: 'latest', param: null, record: null, alias: false, unknown: true});
  for (const hash of ['#main', '#after-map', '#detail-source-2', '#rec-overview']) assert.equal(parseRoute(hash), null);
  assert.deepEqual(VIEW_NAMES, {latest: 'Reports', map: 'Map', ahead: 'Ahead', countries: 'Countries', about: 'About'});
});

// ----------------------------------------------------------------------------------------------- store

test('store: immutable top level, synchronous listeners, no-op patches and unsubscribe', () => {
  const store = createStore({a: 1, nested: {b: 1}});
  const seen = [];
  const off = store.subscribe((state, prev, meta) => seen.push([state, prev, meta]));
  const before = store.get();
  store.set({a: 2}, {reason: 'x'});
  assert.equal(seen.length, 1);
  assert.notEqual(store.get(), before);
  assert.equal(before.a, 1);
  assert.equal(seen[0][1], before);
  assert.deepEqual(seen[0][2], {reason: 'x'});
  assert.equal(store.get().nested, before.nested);
  assert.throws(() => { 'use strict'; store.get().a = 5; });
  store.set({a: 2});
  assert.equal(seen.length, 1, 'unchanged values do not notify');
  store.set(s => ({a: s.a + 1}));
  assert.equal(store.get().a, 3);
  off();
  store.set({a: 4});
  assert.equal(seen.length, 2);
});

// ------------------------------------------------------------------------------------------------ data

test('loadCritical settles each file independently (C-37)', async () => {
  const ok = await loadCritical({fetchImpl: fakeFetch(realRoutes())});
  assert.equal(ok.critical, 'ready');
  assert.deepEqual(ok.errors, {build: 'absent'});
  assert.equal(ok.data.events.events.length, 84);

  const absentUpcoming = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.upcoming]: {status: 404}})});
  assert.equal(absentUpcoming.errors.upcoming, 'absent');
  const brokenUpcoming = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.upcoming]: {status: 500}})});
  assert.equal(brokenUpcoming.errors.upcoming, 'error');
  const malformedBuild = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.build]: {body: {schema_version: 1}}})});
  assert.equal(malformedBuild.errors.build, 'error');

  const countriesDown = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.countries]: {status: 500}})});
  assert.equal(countriesDown.critical, 'error');
  assert.equal(countriesDown.errors.countries, 'error');
  assert.equal(countriesDown.data.events.events.length, 84, 'events survive a countries failure');
  assert.deepEqual(countriesDown.data.countries, []);

  const shape = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.events]: {body: {events: 'nope'}}})});
  assert.equal(shape.critical, 'error');
  assert.equal(shape.errors.events, 'error');
  assert.equal(shape.data.events, null);
  const events404 = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.events]: {status: 404}})});
  assert.equal(events404.errors.events, 'error', 'a missing events file is an error, never "absent"');
  const badJSON = await loadCritical({fetchImpl: fakeFetch({...realRoutes(), [CRITICAL.contexts]: {raw: '{'}})});
  assert.equal(badJSON.errors.contexts, 'error');
  assert.equal(badJSON.critical, 'ready');
});

test('fetchJSON errors carry the file and kind; the lazy loader memoises and resets', async () => {
  await assert.rejects(fetchJSON('public/x.json', {fetchImpl: fakeFetch({}), name: 'x'}), e => e instanceof DataError && e.kind === 'absent' && e.name === 'x');
  await assert.rejects(fetchJSON('public/x.json', {fetchImpl: fakeFetch({'public/x.json': {throws: true}})}), e => e.kind === 'network');
  await assert.rejects(fetchJSON('public/x.json', {fetchImpl: fakeFetch({'public/x.json': {status: 503}})}), e => e.kind === 'http' && e.status === 503);
  let calls = 0;
  const loader = createLazyLoader({fetchImpl: async path => { calls += 1; return fakeFetch({[LAZY.roadmap]: {body: {items: []}}})(path); }});
  assert.equal(loader.state('roadmap'), 'idle');
  const a = loader.load('roadmap');
  assert.equal(loader.state('roadmap'), 'loading');
  assert.equal(loader.load('roadmap'), a);
  await a;
  assert.equal(loader.state('roadmap'), 'ready');
  assert.equal(calls, 1);
  loader.reset('roadmap');
  await loader.load('roadmap');
  assert.equal(calls, 2);
  assert.equal(LAZY.mapCodes, 'public/world-map-codes.json');
  assert.equal(SHAPES.events(events), true);
  assert.equal(SHAPES.countries(countries), true);
  assert.equal(SHAPES.contexts(contexts), true);
  assert.equal(SHAPES.upcoming(upcoming), true);
  assert.equal(SHAPES.build({built_at: '2026-10-02T23:40:00Z', commit: null}), true);
  assert.equal(SHAPES.build({built_at: 'soon'}), false);
});

// --------------------------------------------------------------------------------------------- actions

test('exportAllowed: false in example mode, while loading, on error and with 0 matches', () => {
  assert.deepEqual(exportAllowed(readyState()), {ok: true, reason: ''});
  assert.equal(exportAllowed(readyState({mode: 'example'})).reason, FEEDBACK.csvExample);
  const loading = initialState({filters: EMPTY});
  assert.equal(exportAllowed(loading).reason, FEEDBACK.csvNotLoaded);
  assert.equal(exportAllowed(readyState({load: {...readyState().load, errors: {events: 'error'}}})).ok, false);
  assert.equal(exportAllowed(withFilters({query: 'zzzz-nothing'})).reason, FEEDBACK.csvEmpty);
});

test('actions: filters sanitise, country clears a foreign city, reset and clear-except-country', () => {
  const {store, actions} = harness(withFilters({country: 'FR', city: 'FR:Paris'}, {ui: {...readyState().ui, listLimit: 36, droppedParams: ['status']}}));
  actions.setFilter('window', '999');
  assert.equal(store.get().filters.window, 'all');
  assert.equal(store.get().ui.listLimit, PAGE_SIZE);
  assert.deepEqual(store.get().ui.droppedParams, [], 'the dropped-params line goes after the next filter change');
  actions.setFilter('country', 'ES');
  assert.equal(store.get().filters.city, '');
  actions.selectCity('ES', 'Madrid');
  assert.deepEqual([store.get().filters.country, store.get().filters.city], ['ES', 'ES:Madrid']);
  actions.setFilter('nonsense', 'x');
  assert.equal('nonsense' in store.get().filters, false);
  actions.setFilters({query: 'housing', status: 'live'});
  assert.equal(store.get().filters.status, '');
  actions.clearExceptCountry();
  assert.deepEqual(store.get().filters, {...EMPTY, country: 'ES'});
  actions.resetFilters();
  assert.deepEqual(store.get().filters, EMPTY);
});

test('actions: setMode resets filters and loads the example; a 404 sets the example error state (C-38)', async () => {
  const {store, actions} = harness(withFilters({country: 'FR'}), {routes: {...realRoutes(), [LAZY.examples]: {status: 404}}});
  actions.setMode('example');
  assert.equal(store.get().mode, 'example');
  assert.deepEqual(store.get().filters, EMPTY);
  assert.equal(store.get().load.lazy.examples, 'loading');
  await actions.loadLazy('examples');
  assert.equal(store.get().load.lazy.examples, 'error');
  const state = store.get();
  const {html} = listHTML(state, []);
  assert.match(html, /The illustrative example could not load\./);
  assert.match(html, /Nothing here is reported data\./);
  assert.match(html, /data-retry="examples"/);
  assert.match(html, /data-set-mode="reported"/);
  assert.doesNotMatch(html, /No published episode matches|No episodes are published/);
  assert.equal(summaryText(state, 0, 0), 'Illustrative example unavailable');
  assert.match(statsHTML(state), /Illustrative example unavailable\. Nothing here is reported data\./);
  assert.equal(exportAllowed(state).ok, false);
});

test('actions: the example loads, then reported mode returns', async () => {
  const {store, actions} = harness(readyState(), {routes: {...realRoutes(), [LAZY.examples]: {body: examples}}});
  actions.setMode('example');
  const loading = listHTML(store.get(), []);
  assert.match(loading.html, /Loading the illustrative example…/);
  assert.equal(summaryText(store.get(), 0, 0), '');
  await actions.loadLazy('examples');
  const state = store.get();
  assert.equal(state.load.lazy.examples, 'ready');
  assert.equal(selectFiltered(state).length, 1);
  assert.doesNotMatch(listHTML(state, selectFiltered(state)).html, /feed-group|ahead-teaser/);
  assert.match(statsHTML(state), /Illustrative example mode: one fictional record\./);
  actions.setMode('reported');
  assert.equal(store.get().mode, 'reported');
});

test('actions: share refuses example mode, copies, and falls back to a persistent link (C-36)', async () => {
  let copied = null;
  const {store, actions} = harness(withFilters({country: 'FR', window: '30'}), {platform: {writeClipboard: async text => { copied = text; }}});
  assert.equal(await actions.share('view'), 'copied');
  assert.equal(copied, 'https://example.org/protest-atlas/?country=FR&window=30');
  assert.equal(store.get().ui.feedback, 'Link copied.');
  const seq = store.get().ui.feedbackSeq;
  const failing = harness(readyState(), {platform: {writeClipboard: async () => { throw new Error('denied'); }}});
  failing.store.set({route: {view: 'latest', param: null, record: 'fr-schools-20261002'}});
  assert.equal(await failing.actions.share('record'), 'fallback');
  assert.equal(failing.store.get().ui.feedback, 'Copy this link:');
  assert.equal(failing.store.get().ui.feedbackURL, 'https://example.org/protest-atlas/#/record/fr-schools-20261002');
  const example = harness(readyState({mode: 'example'}));
  assert.equal(await example.actions.share('view'), 'refused');
  assert.equal(example.store.get().ui.feedback, 'Sharing is off in example mode.');
  actions.dismissFeedback();
  assert.equal(store.get().ui.feedback, '');
  assert.ok(seq > 0);
});

test('actions: exportCSV is guarded inside the action and reports the count', () => {
  const downloads = [];
  const {store, actions} = harness(withFilters({country: 'FR'}), {platform: {download: (text, name) => downloads.push({text, name})}});
  assert.equal(actions.exportCSV(), true);
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].name, 'protest-atlas-reports.csv');
  const n = selectFiltered(store.get()).length;
  assert.equal(store.get().ui.feedback, `CSV downloaded: ${n} ${n === 1 ? 'record' : 'records'}.`);
  const example = harness(readyState({mode: 'example'}), {platform: {download: () => downloads.push('leak')}});
  assert.equal(example.actions.exportCSV(), false);
  assert.equal(example.store.get().ui.feedback, 'Export is off in example mode: illustrative records are excluded.');
  const none = harness(withFilters({query: 'zzzz'}), {platform: {download: () => downloads.push('leak')}});
  assert.equal(none.actions.exportCSV(), false);
  assert.equal(none.store.get().ui.feedback, 'Nothing to export: no records match these filters.');
  assert.equal(downloads.length, 1);
});

test('actions: stepRecord walks the filtered order with replace and stops at the ends (C-46)', () => {
  const {store, router, actions} = harness(readyState());
  const list = selectFiltered(store.get());
  actions.openRecord(list[0].id, {trigger: null});
  assert.equal(store.get().route.record, list[0].id);
  assert.equal(actions.stepRecord(-1), false);
  assert.equal(actions.stepRecord(1), true);
  assert.equal(store.get().route.record, list[1].id);
  assert.equal(router.calls.at(-1).opts.replace, true);
  actions.openRecord(list.at(-1).id);
  assert.equal(actions.stepRecord(1), false);
  actions.openRecord('not-in-list');
  assert.equal(actions.stepRecord(1), false);
  actions.closeRecord();
  assert.equal(router.calls.at(-1).close, true);
});

test('actions: critical load with countries 500 keeps events; the notice shows countries-error only (C-37)', async () => {
  const {store, actions} = harness(initialState({filters: EMPTY, now: OCT2}), {routes: {...realRoutes(), [CRITICAL.countries]: {status: 500}}});
  await actions.loadCritical();
  const state = store.get();
  assert.equal(state.data.events.events.length, 84);
  assert.equal(state.load.errors.countries, 'error');
  const model = noticeModel(state);
  assert.deepEqual(model.lines.map(l => l.kind), ['pilot', 'countries-error']);
  assert.equal(model.lines[1].text, 'The country directory could not load; records are listed by country code.');
  assert.equal(model.counts, null);
  assert.equal(selectFiltered(state).length, 84);
  assert.match(statsHTML(state), /<strong>84<\/strong> published episodes · newest evidence dated/);
  assert.doesNotMatch(statsHTML(state), /of <strong>249/);
  assert.equal(chipModel(state).state, 'current');
  assert.equal(exportAllowed(state).ok, true);
});

test('actions: critical load with events 500 gives E5 everywhere and no counts (C-37)', async () => {
  const {store, actions} = harness(initialState({filters: EMPTY, now: OCT2}), {routes: {...realRoutes(), [CRITICAL.events]: {status: 500}}});
  await actions.loadCritical();
  const state = store.get();
  const model = noticeModel(state);
  const e5 = 'Published records could not be loaded, so coverage is unknown at the moment, not zero.';
  assert.deepEqual(model.lines.map(l => l.kind), ['pilot', 'error']);
  assert.equal(model.lines[1].text, e5);
  assert.equal(model.counts, null);
  assert.equal(model.tone, 'warn');
  assert.deepEqual(chipModel(state), {state: 'error', tone: 'warn', label: 'Snapshot', value: 'could not load', short: 'could not load', valueHTML: 'could not load'});
  const {html} = listHTML(state, []);
  assert.ok(html.includes(e5));
  assert.match(html, /data-action="retry-data"/);
  assert.match(html, /href="public\/events\.json"/);
  assert.equal(statsHTML(state), '');
  assert.equal(exportAllowed(state).ok, false);
});

test('actions: permalink filters the data cannot satisfy are dropped and named (tech §2.4)', async () => {
  const {store, actions} = harness(initialState({filters: {...EMPTY, country: 'ZZ', region: 'Atlantis', issue: 'Housing', city: 'FR:Nowhere'}, now: OCT2}));
  await actions.loadCritical();
  const state = store.get();
  assert.deepEqual(state.ui.droppedParams, ['country', 'region', 'city']);
  assert.equal(state.filters.issue, 'Housing');
  assert.equal(noticeModel(state).lines.at(-1).text, 'Some link filters were not recognised and were removed: country, region, city.');
});

// ------------------------------------------------------------------------------------------- notice

test('noticeModel: the pilot disclosure in every state, S4–S6 verbatim, counts only when known (§4.2)', () => {
  assert.equal(PILOT_DISCLOSURE, 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.');
  const states = [initialState({filters: EMPTY}), readyState(), readyState({now: OCT9}), readyState({load: {...readyState().load, errors: {events: 'error'}}, data: {...readyState().data, events: null}})];
  for (const state of states) assert.deepEqual(noticeModel(state).lines[0], {kind: 'pilot', text: PILOT_DISCLOSURE});
  assert.equal(noticeModel(initialState({filters: EMPTY})).counts, null);
  assert.deepEqual(noticeModel(readyState()).counts, {withRecords: 81, total: 249, gaps: 168});
  assert.equal(noticeModel(readyState()).tone, 'info');
  const line = iso => noticeModel(readyState({now: T(iso)})).lines.find(l => l.kind === 'snapshot')?.text;
  assert.equal(line('2026-10-02T23:00:00Z'), undefined);
  assert.equal(line('2026-10-05T00:00:00Z'), 'No evidence newer than 2 Oct 2026 (3 days ago) is in this snapshot. More recent protests are missing.');
  assert.equal(line('2026-10-09T12:00:00Z'), 'This snapshot has nothing newer than 2 Oct 2026, 7 days ago. Read it as an archive of past reporting, not as a picture of protests today.');
  assert.equal(line('2026-10-12T00:01:00Z'), 'This snapshot has nothing newer than 2 Oct 2026, 10 days ago. Read it as an archive of past reporting, not as a picture of protests today.');
  assert.equal(line('2026-11-01T00:00:00Z'), 'Archive: newest evidence 2 Oct 2026. This atlas is not currently being maintained as a tracker.');
  assert.equal(noticeModel(readyState({now: OCT9})).tone, 'warn');
  const dropped = noticeModel(readyState({ui: {...readyState().ui, droppedParams: ['status', 'year']}}));
  assert.equal(dropped.lines.at(-1).text, 'Some link filters were not recognised and were removed: status, year.');
});

// ------------------------------------------------------------------------------------------- stamps

test('chipModel: H4 with a UTC hh:mm on 2 Oct; H5 aging; H6 stale with the warn tone (§4.1)', () => {
  const current = chipModel(readyState());
  assert.equal(current.state, 'current');
  assert.equal(current.label, 'Snapshot');
  assert.match(current.value, /\d{2}:\d{2} UTC/);
  assert.equal(current.value, '2 Oct 2026, 22:45 UTC');
  assert.equal(current.short, '2 Oct, 22:45 UTC');
  assert.match(current.valueHTML, /<time datetime="2026-10-02T22:45:35Z">2 Oct<span class="stamp-chip-year"> 2026<\/span>, 22:45 UTC<\/time>/);
  const aging = chipModel(readyState({now: T('2026-10-06T10:00:00Z')}));
  assert.deepEqual([aging.state, aging.tone, aging.label, aging.value, aging.short], ['aging', 'neutral', 'Snapshot', 'newest evidence 4 days old', 'evidence 4 days old']);
  assert.match(aging.valueHTML, /<span class="stamp-chip-long">newest <\/span>evidence 4 days old/);
  const stale = chipModel(readyState({now: OCT9}));
  assert.deepEqual([stale.state, stale.tone, stale.label, stale.value], ['stale', 'warn', 'Stale snapshot', 'newest evidence 7 days old']);
  assert.equal(chipModel(readyState({now: T('2026-10-12T00:00:00Z')})).value, 'newest evidence 10 days old');
  const archive = chipModel(readyState({now: T('2026-11-02T00:00:00Z')}));
  assert.deepEqual([archive.state, archive.label, archive.tone], ['archive', 'Stale snapshot', 'warn']);
  assert.equal(chipModel(initialState({filters: EMPTY})).state, 'loading');
  assert.equal(chipModel(initialState({filters: EMPTY})).value, 'loading');
});

test('stampItems: the §10 labels and explainers, T2 for a missing build, discovery states (C-03)', () => {
  const stamps = updateStamps({events, upcoming, build: null});
  const items = stampItems(stamps, OCT2, {announcementsCount: 0, discoveryLoad: 'idle'});
  assert.deepEqual(items.map(i => i.label), ['Snapshot assembled', 'Newest evidence', 'Latest source re-read', 'Announced-actions list compiled', 'Site built', 'Lead-discovery audit', 'Human editorial review']);
  const five = ['Snapshot assembled', 'Newest evidence', 'Latest source re-read', 'Announced-actions list compiled', 'Site built'];
  assert.equal(new Set(five).size, 5);
  assert.deepEqual(STAMP_ROWS.map(r => r.label), ['Snapshot assembled', 'AI-assisted review pass', ...five.slice(1), 'Lead-discovery audit', 'Human editorial review']);
  const by = key => items.find(i => i.key === key);
  assert.equal(by('dataUpdated').text, '2 Oct 2026, 22:45 UTC · 14 minutes ago');
  assert.equal(by('latestObservation').text, 'dated 2 Oct 2026 · today');
  assert.equal(by('announcementsUpdated').text, '2 Oct 2026, 22:45 UTC · 14 minutes ago · 0 items');
  assert.equal(by('siteBuilt').text, 'Not available in this preview');
  assert.equal(by('discovery').text, 'Loading…');
  assert.equal(by('humanReview').text, 'Not completed');
  assert.equal(by('dataUpdated').note, 'When the published records were last compiled and validated by the AI-assisted pipeline. Not a time when protests were checked, and not proof that anything new was added.');
  assert.equal(by('discovery').note, 'A one-time audit of one automated lead list. Leads are never published automatically. It does not show whether the discovery service is working today.');
  const review = stampItems({...stamps, editorialReview: '2026-10-02T23:10:00Z'}, OCT2);
  assert.equal(review[1].label, 'AI-assisted review pass');
  const sha = 'aa44280532273167efd838040d71015c06cf94d8';
  const built = stampItems({...stamps, siteBuilt: '2026-10-02T23:40:00Z', commit: sha}, OCT2).find(i => i.key === 'siteBuilt');
  assert.match(built.html, /commit <a class="stamp-list-commit" href="https:\/\/github\.com\/occult-kranti\/protest-atlas\/commit\/aa44280[0-9a-f]+">aa44280<\/a>/);
  assert.equal(stampItems(stamps, OCT2, {buildLoad: 'error'}).find(i => i.key === 'siteBuilt').text, 'Site build stamp could not be read');
  assert.equal(stampItems(stamps, OCT2, {announcementsLoad: 'absent'}).find(i => i.key === 'announcementsUpdated').text, 'Not published in this snapshot');
  assert.equal(stampItems(stamps, OCT2, {announcementsLoad: 'error'}).find(i => i.key === 'announcementsUpdated').text, 'Could not load');
  assert.equal(stampItems(stamps, OCT2, {discoveryLoad: 'error'}).find(i => i.key === 'discovery').text, 'Discovery audit unavailable.');
  const discovery = stampItems(stamps, OCT2, {discoveryLoad: 'ready', discovery: {date: '2026-10-02T19:27:08Z', count: 97}}).find(i => i.key === 'discovery');
  assert.equal(discovery.text, 'GDELT artifact created 2 Oct 2026, 19:27 UTC · 97 unverified leads');
});

test('footerStampsHTML: T1 with a linked commit, T2 when absent or malformed (§4.4)', () => {
  const sha = 'aa44280532273167efd838040d71015c06cf94d8';
  const text = html => html.replace(/<[^>]+>/g, '').replace(/ /g, ' ');
  const absent = footerStampsHTML(readyState());
  assert.equal(text(absent), 'Snapshot assembled 2 Oct 2026, 22:45 UTC (AI-assisted, no human sign-off) · Newest evidence dated 2 Oct 2026 · Site build stamp not available in this preview · All times UTC');
  const built = footerStampsHTML(readyState({data: {...readyState().data, build: {built_at: '2026-10-02T23:40:00Z', commit: sha}}, load: {...readyState().load, errors: {}}}));
  assert.equal(text(built), 'Snapshot assembled 2 Oct 2026, 22:45 UTC (AI-assisted, no human sign-off) · Newest evidence dated 2 Oct 2026 · Site built 2 Oct 2026, 23:40 UTC from aa44280 · All times UTC');
  assert.match(built, new RegExp(`href="https://github\\.com/occult-kranti/protest-atlas/commit/${sha}"`));
  const noSha = footerStampsHTML(readyState({data: {...readyState().data, build: {built_at: '2026-10-02T23:40:00Z', commit: 'main'}}, load: {...readyState().load, errors: {}}}));
  assert.doesNotMatch(noSha, /commit|from/);
  const malformed = footerStampsHTML(readyState({load: {...readyState().load, errors: {build: 'error'}}}));
  assert.match(text(malformed), /Site build stamp could not be read/);
  assert.equal(footerStampsHTML(initialState({filters: EMPTY})), '');
});

// --------------------------------------------------------------------------------------------- list

test('list: S1/S2, result summaries, groups with S3 and S7, teaser slot and pagination (§6)', () => {
  const state = readyState();
  const filtered = selectFiltered(state);
  const stats = statsHTML(state);
  assert.match(stats, /Snapshot assembled <time class="feed-stat-time" datetime="2026-10-02T22:45:35Z" data-rel="2026-10-02T22:45:35Z" data-format="both" data-days="utc">2 Oct 2026, 22:45 UTC · 14 minutes ago<\/time>/);
  assert.match(statsHTML(readyState({now: T('2026-10-12T00:01:00Z')})), /2 Oct 2026, 22:45 UTC · 10 days ago/, 'S1 agrees with the chip and S5 on 12 Oct (§16.2 item 8)');
  assert.match(stats, /<strong>84<\/strong> published episodes in <strong>81<\/strong> of <strong>249<\/strong> countries and territories · newest evidence dated <time datetime="2026-10-02">2 Oct 2026<\/time>/);
  assert.match(statsHTML(initialState({filters: EMPTY})), /Loading published records…/);
  assert.equal(summaryText(state, 84, 12), 'Showing 12 of 84 published records');
  assert.equal(summaryText(withFilters({country: 'FR'}), 5, 5), '5 published records match your filters');
  assert.equal(summaryText(withFilters({country: 'FR'}), 1, 1), '1 published record matches your filters');
  assert.equal(summaryText(withFilters({status: 'unknown'}), 30, 12), 'Showing 12 of 30 published records that match your filters');
  const {html, busy} = listHTML(state, filtered);
  assert.equal(busy, false);
  assert.match(html, /<h2 class="feed-group-title" id="feed-group-fresh">Latest evidence within 72 hours <span class="feed-group-count">\(5\)<\/span><\/h2>/);
  assert.match(html, /5 have evidence dated within the last 72 hours\. That is not confirmation that they are ongoing\./);
  assert.match(html, /feed-group-note--end">A search for newer reports on 2 Oct 2026 could not open news websites, so no records were added\. Recent coverage is especially thin\./);
  assert.match(html, /Earlier research, 2024–2026 <span class="feed-group-count">\(79\)<\/span>/);
  assert.doesNotMatch(html, /feed-gap/);
  assert.equal((html.match(/class="feed-item"/g) ?? []).length, 12);
  assert.ok(html.indexOf('feed-group-fresh') < html.indexOf('feed-group-older'));
  assert.equal(moreHTML(84, 12), '<button type="button" class="btn list-more-btn" data-action="show-more">Show 12 more (72 remaining)</button>');
  assert.equal(moreHTML(17, 12), '<button type="button" class="btn list-more-btn" data-action="show-more">Show 5 more (5 remaining)</button>');
  assert.equal(moreHTML(12, 12), '');
  assert.match(listHTML(initialState({filters: EMPTY}), []).html, /Loading published records…/);
  assert.equal(listHTML(initialState({filters: EMPTY}), []).busy, true);
});

test('list on the 9 Oct clock: E4 + S7 at the top, first group 7 to 30 days, no zero (§16.2)', () => {
  const state = readyState({now: OCT9});
  const {html} = listHTML(state, selectFiltered(state));
  assert.match(html, /<div class="feed-gap"><p class="feed-gap-line">No episode in this snapshot has evidence dated in the last 7 days\. That is a gap in this dataset, not a sign that no protests happened\.<\/p><p class="feed-gap-line">A search for newer reports on 2 Oct 2026/);
  assert.match(html, /^<div class="feed-gap">.*?<h2 class="feed-group-title" id="feed-group-month">7 to 30 days ago/s);
  assert.doesNotMatch(html, /within 72 hours <span/);
  assert.doesNotMatch(html, /feed-group-note--end/);
  assert.doesNotMatch(html, /\(0\)/);
  const week = readyState({now: T('2026-10-06T00:00:00Z')});
  assert.match(listHTML(week, selectFiltered(week)).html, /No episode in this snapshot has evidence dated within the last 72 hours\./);
  const chip = withFilters({window: '7'}, {now: OCT9});
  assert.match(listHTML(chip, selectFiltered(chip)).html, /No published episode matches these filters\./);
});

test('quick chips carry no counts (C-10)', () => {
  assert.deepEqual(QUICK_CHIPS.map(c => c.label), ['Last 7 days', 'Last 30 days', 'Ended / suspended', 'Outcome documented']);
  assert.ok(QUICK_CHIPS.every(c => !/\d+\)/.test(c.label)));
});

// ------------------------------------------------------------------------------------ review fixes

test('copy-deck months: every WP2 day reads "Sep", never "Sept"; S7 and E5 have one source each', () => {
  assert.equal(statusLabel('ended', {end_date: '2026-09-30'}), 'Ended / suspended 30 Sep 2026');
  assert.equal(sweepLine({records: {day: '2026-09-30', blocked: true}}),
    'A search for newer reports on 30 Sep 2026 could not open news websites, so no records were added. Recent coverage is especially thin.');
  assert.equal(sweepLine({records: {day: '2026-09-30', blocked: false}}), '');
  assert.equal(sweepLine(null), '');
  const sept = {...events, events: events.events.map(e => ({...e, last_observed_at: '2026-09-02'}))};
  const notice = noticeModel(readyState({data: {...readyState().data, events: sept}, now: T('2026-09-07T12:00:00Z')}));
  assert.match(notice.lines.find(l => l.kind === 'snapshot').text, /No evidence newer than 2 Sep 2026 \(5 days ago\)/);
  assert.match(statsHTML(readyState({data: {...readyState().data, events: sept}})), />2 Sep 2026<\/time>/);
  const failed = readyState({data: {...readyState().data, events: null}, load: {...readyState().load, critical: 'error', errors: {events: 'error'}}});
  assert.equal(noticeModel(failed).lines.find(l => l.kind === 'error').text, E5);
  assert.ok(listHTML(failed, []).html.includes(E5));
});

test('controlStates: CSV refused in example mode, while loading, on error and with 0 matches; share only in example mode (C-43)', () => {
  assert.deepEqual(controlStates(readyState()), {csvDisabled: false, shareDisabled: false});
  assert.deepEqual(controlStates(withFilters({query: 'zzqx'})), {csvDisabled: true, shareDisabled: false});
  assert.deepEqual(controlStates(withFilters({country: 'IS', status: 'ended'})), {csvDisabled: true, shareDisabled: false});
  const loading = initialState({filters: EMPTY, now: OCT2});
  assert.deepEqual(controlStates(loading), {csvDisabled: true, shareDisabled: false});
  const failed = readyState({data: {...readyState().data, events: null}, load: {...readyState().load, critical: 'error', errors: {events: 'error'}}});
  assert.deepEqual(controlStates(failed), {csvDisabled: true, shareDisabled: false});
  const example = readyState({mode: 'example', data: {...readyState().data, examples}, load: {...readyState().load, lazy: {...readyState().load.lazy, examples: 'ready'}}});
  assert.deepEqual(controlStates(example), {csvDisabled: true, shareDisabled: true});
});

test('refreshTimes: the snapshot stamp counts UTC days, so S1, the dates sheet, the chip and the notice agree (§16.2 item 8)', () => {
  const now = T('2026-10-12T00:01:00Z');
  const generated = events.generated_at;
  const utc = {dataset: {rel: generated, days: 'utc', format: 'both'}, textContent: 'stale'};
  const plain = {dataset: {rel: '2026-10-02T21:25:00Z', format: 'relative'}, textContent: 'stale'};
  refreshTimes({querySelectorAll: selector => (selector === 'time[data-rel]' ? [utc, plain] : [])}, now);
  assert.match(utc.textContent, /^2 Oct 2026, \d{2}:\d{2} UTC · 10 days ago$/);
  assert.equal(plain.textContent, '9 days ago');
  const state = readyState({now});
  assert.equal(chipModel(state).value, 'newest evidence 10 days old');
  assert.match(noticeModel(state).lines.find(l => l.kind === 'snapshot').text, /10 days ago/);
  let writes = 0;
  const counted = {dataset: utc.dataset, get textContent() { return utc.textContent; }, set textContent(v) { writes += 1; }};
  refreshTimes({querySelectorAll: () => [counted]}, now);
  assert.equal(writes, 0, 'unchanged text is not rewritten');
  refreshTimes(null, now);   // no root: no throw
});

test('stampItems rows carry value (tech §7.2) and "0 items" never splits from its number', () => {
  const items = stampItems(updateStamps({events, upcoming}), OCT2, {announcementsCount: 0});
  for (const item of items) assert.equal(item.value, item.html);
  const row = items.find(i => i.key === 'announcementsUpdated');
  assert.ok(row.html.endsWith('\u00a0· 0\u00a0items'), row.html);
  assert.match(row.html, /<time class="stamp-time" datetime="[^"]+" data-rel="[^"]+" data-format="relative">14 minutes ago<\/time>/);
  const discovery = stampItems(updateStamps({events}), OCT2, {discoveryLoad: 'ready', discovery: {date: '2026-09-30T19:27:08Z', count: 1}}).find(i => i.key === 'discovery');
  assert.equal(discovery.text, 'GDELT artifact created 30 Sep 2026, 19:27 UTC · 1 unverified lead');
});

/** A history and document double for createRouter: entries, push/replace/back/forward, popstate and hashchange. */
function fakeBrowser(hash = '#/latest') {
  const entries = [{url: `/protest-atlas/${hash}`, state: null}];
  let index = 0;
  const listeners = {};
  const focused = [];
  const fire = (type, event = {}) => { for (const fn of listeners[type] ?? []) fn(event); };
  const hashOf = url => (url.includes('#') ? url.slice(url.indexOf('#')) : '');
  const win = {
    scrollY: 0,
    location: {pathname: '/protest-atlas/', search: '', get hash() { return hashOf(entries[index].url); }},
    history: {
      scrollRestoration: 'auto',
      get state() { return entries[index].state; },
      pushState(state, _title, url) { entries.splice(index + 1); entries.push({url: url ?? entries[index].url, state: structuredClone(state)}); index += 1; },
      replaceState(state, _title, url) { entries[index] = {url: url ?? entries[index].url, state: structuredClone(state)}; },
      back() { index -= 1; fire('popstate'); fire('hashchange'); },
      forward() { index += 1; fire('popstate'); fire('hashchange'); },
    },
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    matchMedia: () => ({matches: false, addEventListener() {}}),
    scrollTo({top}) { win.scrollY = top; fire('scroll'); },
  };
  const titles = new Map();
  const doc = {
    title: '',
    documentElement: {dataset: {}},
    querySelector(selector) {
      if (!titles.has(selector)) titles.set(selector, {focus() { focused.push(selector); }, getClientRects: () => [{}]});
      return titles.get(selector);
    },
    querySelectorAll: () => [],
    dispatchEvent() {},
  };
  return {
    win, doc, entries, focused,
    get url() { return entries[index].url; },
    /** A native fragment navigation (skip link, typed hash): a new entry with no state, popstate, then hashchange. */
    jump(nextHash, y) {
      entries.splice(index + 1);
      entries.push({url: `/protest-atlas/${nextHash}`, state: null});
      index += 1;
      win.scrollY = y;   // the browser scrolls to the target before the events fire
      fire('popstate');
      fire('hashchange');
    },
    scroll(y) { win.scrollY = y; fire('scroll'); },
  };
}

test('router: user navigation scrolls to the top and focuses the title; Back AND Forward restore each entry (C-35)', () => {
  const browser = fakeBrowser('#/latest');
  const saved = {window: globalThis.window, document: globalThis.document};
  globalThis.window = browser.win;
  globalThis.document = browser.doc;
  try {
    const routes = [];
    let pushes = 0;
    const router = createRouter({defaultView: 'latest', onChange: route => routes.push(route), beforePush: () => { pushes += 1; }});
    router.start();
    assert.equal(browser.win.history.scrollRestoration, 'manual');
    assert.equal(browser.win.history.state.view, 'latest');
    assert.ok(browser.win.history.state.key);

    browser.scroll(1500);
    router.go({view: 'map'});
    router.afterRender();
    assert.equal(pushes, 1);
    assert.equal(browser.url, '/protest-atlas/#/map');
    assert.equal(browser.win.scrollY, 0);
    assert.equal(browser.focused.at(-1), '#map-title');
    assert.equal(browser.doc.title, 'Map — Protest Atlas');

    browser.scroll(400);
    browser.win.history.back();
    router.afterRender();
    assert.equal(router.current().view, 'latest');
    assert.equal(browser.win.scrollY, 1500, 'Back restores the Reports position');
    assert.equal(browser.focused.at(-1), '#latest-title');

    browser.win.history.forward();
    router.afterRender();
    assert.equal(router.current().view, 'map');
    assert.equal(browser.win.scrollY, 400, 'Forward restores the Map position');

    // A record overlay opened and closed by Back changes neither scroll nor focus.
    const focusCount = browser.focused.length;
    router.go({record: 'es-housing-20261002'});
    browser.scroll(400);
    browser.win.history.back();
    router.afterRender();
    assert.equal(router.current().record, null);
    assert.equal(browser.win.scrollY, 400);
    assert.equal(browser.focused.length, focusCount);

    // Re-selecting the shown view scrolls to the top; a query-only change is not the router's business.
    browser.scroll(900);
    router.go({view: 'map'});
    assert.equal(browser.win.scrollY, 0);
  } finally {
    globalThis.window = saved.window;
    globalThis.document = saved.document;
  }
});

test('router: Back to a non-route hash (#main) shows the view that entry was on', () => {
  const browser = fakeBrowser('#/latest');
  const saved = {window: globalThis.window, document: globalThis.document};
  globalThis.window = browser.win;
  globalThis.document = browser.doc;
  try {
    const router = createRouter({defaultView: 'latest'});
    router.start();
    browser.scroll(0);
    browser.jump('#main', 120);              // skip link: a new entry, the view stays
    assert.equal(router.current().view, 'latest');
    assert.equal(browser.win.history.state.view, 'latest');
    router.go({view: 'map'});
    router.afterRender();
    assert.equal(browser.doc.documentElement.dataset.view, 'map');
    browser.win.history.back();              // URL #main again
    router.afterRender();
    assert.equal(browser.url, '/protest-atlas/#main');
    assert.equal(router.current().view, 'latest');
    assert.equal(browser.doc.documentElement.dataset.view, 'latest');
    assert.equal(browser.win.scrollY, 120);
    browser.win.history.back();              // #/latest: same view, nothing moves
    assert.equal(router.current().view, 'latest');
    browser.jump('#/ahead/roadmap', 0);      // a typed route hash still navigates
    router.afterRender();
    assert.deepEqual([router.current().view, router.current().param], ['ahead', 'roadmap']);
    assert.equal(browser.focused.at(-1), '#ahead-roadmap-title');
  } finally {
    globalThis.window = saved.window;
    globalThis.document = saved.document;
  }
});

/** Just enough DOM for mountNotice: elements with classes, data-*, children, text and a tiny innerHTML parser. */
function miniDOM() {
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.parent = null; this.className = ''; this.dataset = {}; this.text = ''; this.hidden = false; this.writes = 0; }
    get textContent() { return this.text + this.children.map(c => c.textContent).join(''); }
    set textContent(value) { this.writes += 1; this.children = []; this.text = String(value); }
    set innerHTML(html) {
      this.writes += 1;
      this.children = [];
      this.text = '';
      const stack = [this];
      for (const [, close, tag, attrs, text] of html.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi)) {
        const top = stack.at(-1);
        if (text !== undefined) { const t = new Node('#text'); t.text = text; top.append(t); continue; }
        if (close) { stack.pop(); continue; }
        const el = new Node(tag.toUpperCase());
        el.className = /class="([^"]*)"/.exec(attrs)?.[1] ?? '';
        for (const [, key, value] of attrs.matchAll(/data-([a-z-]+)="([^"]*)"/g)) el.dataset[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
        top.append(el);
        stack.push(el);
      }
    }
    get siblings() { return this.parent ? this.parent.children : []; }
    get previousElementSibling() { const i = this.siblings.indexOf(this); return i > 0 ? this.siblings[i - 1] : null; }
    append(...nodes) { for (const n of nodes) { n.remove(); n.parent = this; this.children.push(n); } }
    prepend(node) { node.remove(); node.parent = this; this.children.unshift(node); }
    after(node) { node.remove(); node.parent = this.parent; this.siblings.splice(this.siblings.indexOf(this) + 1, 0, node); }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
    matches(selector) {
      const [, tag, cls, kind] = /^([a-z]*)(?:\.([a-z-]+))?(?:\[data-kind="([^"]+)"\])?$/.exec(selector) ?? [];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      if (cls && !this.className.split(' ').includes(cls)) return false;
      return !kind || this.dataset.kind === kind;
    }
    *walk() { for (const c of this.children) { yield c; yield* c.walk(); } }
    querySelector(selector) { for (const n of this.walk()) if (n.tagName !== '#text' && n.matches(selector)) return n; return null; }
  }
  const root = new Node('DIV');
  root.innerHTML = '<div class="notice-inner"><p class="notice-pilot"><strong>AI-assisted reporting pilot.</strong> Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.</p></div>';
  const banner = new Node('DIV');
  return {root, banner, document: {getElementById: id => ({'data-notice': root, 'example-banner': banner})[id] ?? null, createElement: tag => new Node(tag.toUpperCase())}};
}

test('mountNotice patches in place: the pilot line and "What this means" are never replaced; lines change only when their text does (C-26)', () => {
  const dom = miniDOM();
  const saved = globalThis.document;
  globalThis.document = dom.document;
  try {
    const notice = mountNotice({});
    const loading = initialState({filters: EMPTY, now: OCT2});
    notice.render(loading);
    const pilot = dom.root.querySelector('.notice-pilot');
    assert.equal(dom.root.querySelector('.notice-more'), null, 'no counts while loading');
    notice.render(readyState());
    const more = dom.root.querySelector('.notice-more');
    assert.ok(more, '"What this means" appears once counts are known');
    assert.match(more.textContent, /Published episodes exist for 81 of 249 countries and territories/);
    assert.equal(dom.root.querySelector('.notice-line'), null);
    notice.render(readyState({now: T('2026-10-05T00:00:00Z')}));
    const line = dom.root.querySelector('.notice-line[data-kind="snapshot"]');
    const span = line.querySelector('.notice-line-text');
    assert.equal(span.textContent, 'No evidence newer than 2 Oct 2026 (3 days ago) is in this snapshot. More recent protests are missing.');
    assert.equal(span.querySelector('.notice-date').textContent, '2 Oct 2026', 'the date sits in a nowrap span');
    const writes = span.writes;
    notice.render(readyState({now: T('2026-10-05T06:00:00Z')}));   // same text: no write
    assert.equal(span.writes, writes);
    notice.render(readyState({now: T('2026-10-06T00:00:00Z')}));   // new day count: the same node is updated
    assert.equal(dom.root.querySelector('.notice-line[data-kind="snapshot"]'), line);
    assert.equal(span.writes, writes + 1);
    assert.match(span.textContent, /\(4 days ago\)/);
    notice.render(readyState({now: T('2026-10-09T12:00:00Z'), ui: {...readyState().ui, droppedParams: ['status']}}));
    assert.equal(dom.root.querySelector('.notice-line[data-kind="snapshot"]'), line, 'S4 → S5 reuses the node');
    assert.match(span.textContent, /^This snapshot has nothing newer than/);
    assert.ok(dom.root.querySelector('.notice-line[data-kind="dropped"]'));
    assert.equal(dom.root.querySelector('.notice-pilot'), pilot);
    assert.equal(dom.root.querySelector('.notice-more'), more);
    assert.equal(dom.root.dataset.tone, 'warn');
    notice.render(readyState());
    assert.equal(dom.root.querySelector('.notice-line'), null, 'lines are removed when their state passes');
    assert.equal(dom.root.querySelector('.notice-pilot'), pilot);
    assert.equal(dom.root.dataset.tone, 'info');
    assert.equal(dom.banner.hidden, true);
  } finally {
    globalThis.document = saved;
  }
});

// ----------------------------------------------------------------------------------------- hygiene

test('WP2 modules use no localStorage and import in Node without a DOM', async () => {
  const files = ['app.js', 'explore.js', ...(await readdir(new URL('js/', root))).filter(f => ['model.js', 'store.js', 'router.js', 'data.js', 'actions.js', 'filters.js', 'list.js', 'stamps.js', 'notice.js'].includes(f)).map(f => `js/${f}`)];
  assert.equal(files.length, 11);
  for (const file of files) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(source, /localStorage|sessionStorage/, file);
    await import(new URL(file, root).href);
  }
});
