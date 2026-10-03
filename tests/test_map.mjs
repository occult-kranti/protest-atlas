// WP4: pure map helpers, real-geometry framing, country brief and legend copy. Offline; no DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {
  MAP_WIDTH, MAP_HEIGHT, MAP_PADDING, ZOOM_MIN, ZOOM_MAX, FOCUS_FILL, FIT_EXCLUDE, REGION_VIEWS, MAP_ASSETS,
  groupRecordsByCountry, countRecordsByCountry, attachCodes, ringParts, focusParts, focusTransform, zoomButtonState,
  readingOrder, nextInDirection, gestureFilter, placeLabels,
} from '../map.js';
import {overviewModel, renderOverview, briefModel, renderBrief, searchSentence, countSentence, RECENT_LIMIT, BRIEF_COPY} from '../js/country-brief.js';
import {legendHTML, selectionBarHTML, regionChipsHTML, controlsHTML, hasNonPlaceFilters, describeCountry, displayCountries, directChild, MAP_COPY, REGIONS,
  pressedRegion} from '../js/map-view.js';
import {displayCountryName} from '../js/model.js';
import {CONTEXTS_ERROR} from '../js/notice.js';

const root = new URL('../', import.meta.url);
const text = path => readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await text(path));
const NOW = Date.parse('2026-10-02T23:00:00Z');
const rect = (x0, y0, x1, y1, area = (x1 - x0) * (y1 - y0)) => ({area, bounds: [[x0, y0], [x1, y1]]});
const size = b => [b[1][0] - b[0][0], b[1][1] - b[0][1]];

async function geography() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(await text('vendor/d3.v7.9.0.min.js'), context);
  vm.runInContext(await text('vendor/topojson-client.v3.1.0.min.js'), context);
  const {d3, topojson} = context;
  const topology = await json(MAP_ASSETS.topology);
  const codes = await json(MAP_ASSETS.codes);
  const features = attachCodes(topojson.feature(topology, topology.objects.countries).features, codes.codes);
  const projection = d3.geoEqualEarth()
    .fitExtent([[MAP_PADDING, MAP_PADDING], [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING]],
      {type: 'FeatureCollection', features: features.filter(f => !FIT_EXCLUDE.includes(f.properties.code))})
    .clipExtent([[0, 0], [MAP_WIDTH, MAP_HEIGHT]]);
  const path = d3.geoPath(projection);
  const rings = feature => {
    const out = [];
    let current = null;
    d3.geoPath(projection, {moveTo(x, y) { current = [[x, y]]; out.push(current); }, lineTo(x, y) { current.push([x, y]); }, closePath() {}, arc() {}})(feature);
    return out;
  };
  const byCode = code => features.find(f => f.properties.code === code);
  const frame = code => focusParts(ringParts(rings(byCode(code))));
  return {features, path, frame, byCode, codes};
}
const geo = geography();

test('constants: land fit 1000×448, zoom 1–12, Antarctica excluded from the fit', () => {
  assert.equal(MAP_WIDTH, 1000);
  assert.equal(MAP_HEIGHT, 448);
  assert.equal(MAP_PADDING, 8);
  assert.deepEqual([ZOOM_MIN, ZOOM_MAX, FOCUS_FILL], [1, 12, 0.7]);
  assert.deepEqual(FIT_EXCLUDE, ['AQ']);
  assert.equal(MAP_ASSETS.topology, 'public/world-110m.topo.json');
  assert.equal(MAP_ASSETS.codes, 'public/world-map-codes.json');
  assert.ok(!Object.values(MAP_ASSETS).some(p => p.includes('geo.json')), 'the GeoJSON is never fetched at runtime');
});

test('REGION_VIEWS keys are a subset of countries.json regions', async () => {
  const regions = new Set((await json('public/countries.json')).map(c => c.region));
  for (const name of Object.keys(REGION_VIEWS)) assert.ok(regions.has(name), name);
  assert.deepEqual(REGIONS, ['World', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']);
});

test('groupRecordsByCountry drops invalid codes; countRecordsByCountry agrees with it', () => {
  const events = [{id: 'a', country: 'FR'}, {id: 'b', country: 'FR'}, {id: 'c', country: 'fr'}, {id: 'd', country: 'XYZ'}, null, {id: 'e'}, {id: 'f', country: 'ES'}];
  const groups = groupRecordsByCountry(events);
  assert.deepEqual([...groups.keys()], ['FR', 'ES']);
  assert.deepEqual(groups.get('FR').map(e => e.id), ['a', 'b']);
  assert.deepEqual(countRecordsByCountry(events), {FR: 2, ES: 1});
  assert.deepEqual(countRecordsByCountry(), {});
});

test('attachCodes maps raw ids, leaves id-less areas null and never mutates its input', () => {
  const features = [{type: 'Feature', id: '250', properties: {name: 'France'}}, {type: 'Feature', properties: {name: 'Kosovo'}},
    {type: 'Feature', id: 'constructor', properties: {name: 'Proto'}}, {type: 'Feature', id: '999', properties: {name: 'Bad'}}, {type: 'Feature', id: '032'}];
  const out = attachCodes(features, {250: 'FR', 999: 'not-a-code', '032': 'AR'});
  assert.deepEqual(out.map(f => f.properties.code), ['FR', null, null, null, 'AR']);
  assert.deepEqual(out.map(f => f.properties.name), ['France', 'Kosovo', 'Proto', 'Bad', '']);
  assert.equal(features[0].properties.code, undefined);
  assert.notEqual(out[0], features[0]);
  assert.deepEqual(attachCodes(features, null).map(f => f.properties.code), [null, null, null, null, null]);
});

test('ringParts gives area and bounds per projected ring and skips degenerate rings', () => {
  const parts = ringParts([[[0, 0], [10, 0], [10, 5], [0, 5], [0, 0]], [[1, 1], [2, 2]], [[20, 20], [24, 20], [24, 23]]]);
  assert.equal(parts.length, 2);
  assert.equal(parts[0].area, 50);
  assert.deepEqual(parts[0].bounds, [[0, 0], [10, 5]]);
  assert.equal(parts[1].area, 6);
});

test('focusParts frames the largest cluster (FR-, US-, ID- and FJ-like inputs)', () => {
  // FR-like: mainland plus a distant overseas part at 15 % and a small island.
  assert.deepEqual(focusParts([rect(489, 72, 518, 99), rect(300, 250, 308, 264, 72), rect(520, 100, 522, 105, 8)]), [[489, 72], [518, 99]]);
  // US-like: contiguous states plus Alaska at 21 % of the largest part.
  assert.deepEqual(focusParts([rect(193, 77, 341, 157, 6742), rect(100, 40, 197, 79, 1416)]), [[193, 77], [341, 157]]);
  // ID-like: three parts of at least 50 %, close together, are united; a far part of 50 % is not.
  assert.deepEqual(focusParts([rect(780, 230, 808, 262, 450), rect(765, 229, 794, 262, 347), rect(795, 229, 825, 272, 373), rect(900, 230, 920, 260, 300)]),
    [[765, 229], [825, 272]]);
  // FJ-like: an antimeridian part as wide as the map is ignored, even when its area qualifies.
  assert.deepEqual(focusParts([rect(982, 310, 986, 313, 9.8), rect(8, 309, 992, 313, 6.6)]), [[982, 310], [986, 313]]);
  assert.equal(focusParts([]), null);
  assert.equal(focusParts([rect(0, 0, 800, 10)]), null, 'nothing narrower than half the map');
  assert.deepEqual(focusParts([rect(0, 0, 10, 10), rect(30, 0, 40, 10)], {ratio: 0.5}), [[0, 0], [10, 10]], 'gap beyond max(w, h) is left out');
});

test('focusTransform fits at 70 % and clamps k to [1, 12]', () => {
  const t = focusTransform([[489, 72], [518, 99]]);
  assert.ok(t.k > 4 && t.k <= 12);
  assert.ok(Math.abs(t.x + t.k * 503.5 - 500) < 1e-9 && Math.abs(t.y + t.k * 85.5 - 224) < 1e-9, 'centred');
  assert.equal(focusTransform([[0, 0], [1000, 448]]).k, 1);
  assert.equal(focusTransform([[-500, -500], [3000, 3000]]).k, 1);
  assert.equal(focusTransform([[500, 200], [500.5, 200.2]]).k, 12);
  assert.equal(focusTransform([[500, 200], [500, 200]]).k, 12, 'a point frames at the maximum');
  assert.equal(focusTransform(null), null);
  assert.equal(focusTransform([[0, NaN], [1, 1]]), null);
  assert.equal(focusTransform([[0, 0], [100, 100]], {fill: 1, max: 3}).k, 3);
});

test('zoomButtonState at min, mid and max', () => {
  assert.deepEqual(zoomButtonState({scale: 1, min: 1, max: 12}), {zoomIn: true, zoomOut: false, reset: false});
  assert.deepEqual(zoomButtonState({scale: 1.0005, min: 1, max: 12}), {zoomIn: true, zoomOut: false, reset: false});
  assert.deepEqual(zoomButtonState({scale: 4, min: 1, max: 12}), {zoomIn: true, zoomOut: true, reset: true});
  assert.deepEqual(zoomButtonState({scale: 12, min: 1, max: 12}), {zoomIn: false, zoomOut: true, reset: true});
  assert.deepEqual(zoomButtonState({scale: NaN}), {zoomIn: true, zoomOut: false, reset: false});
});

test('nextInDirection moves by projected centre; Home and End jump to the reading-order ends', () => {
  const items = [{code: 'ES', cx: 480, cy: 100}, {code: 'FR', cx: 500, cy: 85}, {code: 'DE', cx: 520, cy: 70}, {code: 'IT', cx: 530, cy: 100},
    {code: 'GB', cx: 490, cy: 60}, {code: 'NZ', cx: 920, cy: 395}, {code: 'BR', cx: 350, cy: 290}];
  // Bands of 48 map units from the top, then left to right.
  assert.deepEqual(readingOrder(items).map(i => i.code), ['GB', 'FR', 'DE', 'ES', 'IT', 'BR', 'NZ']);
  assert.equal(nextInDirection(items, 'FR', 'Home'), 'GB');
  assert.equal(nextInDirection(items, 'FR', 'End'), 'NZ');
  assert.equal(nextInDirection(items, 'FR', 'ArrowRight'), 'DE');
  assert.equal(nextInDirection(items, 'FR', 'ArrowLeft'), 'ES');
  assert.equal(nextInDirection(items, 'FR', 'ArrowUp'), 'GB');
  assert.equal(nextInDirection(items, 'FR', 'ArrowDown'), 'ES');
  assert.equal(nextInDirection(items, 'ES', 'ArrowDown'), 'BR');
  assert.equal(nextInDirection(items, 'NZ', 'ArrowRight'), 'NZ', 'no candidate that way: focus stays');
  assert.equal(nextInDirection(items, 'XX', 'ArrowRight'), 'GB', 'unknown origin: first in reading order');
  assert.equal(nextInDirection(items, 'FR', 'Tab'), 'FR');
  assert.equal(nextInDirection([], 'FR', 'Home'), null);
});

test('gestureFilter: one finger scrolls the page; two fingers, Ctrl+wheel or Explore move the map', () => {
  const touch = n => ({type: 'touchstart', touches: Array.from({length: n})});
  assert.equal(gestureFilter(touch(1), 'page'), false);
  assert.equal(gestureFilter(touch(2), 'page'), true);
  assert.equal(gestureFilter(touch(1), 'map'), true);
  assert.equal(gestureFilter({type: 'wheel', ctrlKey: false}, 'page'), false);
  assert.equal(gestureFilter({type: 'wheel', ctrlKey: true}, 'page'), true);
  assert.equal(gestureFilter({type: 'wheel', ctrlKey: false}, 'map'), true);
  assert.equal(gestureFilter({type: 'mousedown', button: 0}, 'page'), true);
  assert.equal(gestureFilter({type: 'mousedown', button: 2}, 'page'), false);
  assert.equal(gestureFilter({type: 'mousedown', button: 0, ctrlKey: true}, 'page'), false);
  assert.equal(gestureFilter({type: 'dblclick'}, 'map'), false);
});

test('placeLabels tries right, then left, then drops the label (the dot stays)', () => {
  const placed = placeLabels([
    {id: 'a', x: 100, y: 50, r: 3.5, w: 40},   // right is free
    {id: 'b', x: 70, y: 60, r: 3.5, w: 40},    // right would cover a's label → left
    {id: 'c', x: 120, y: 64, r: 3.5, w: 40},   // both sides collide → label dropped, dot kept
    {id: 'd', x: 395, y: 50, r: 3.5, w: 40},   // right would leave the 400 px frame → left
  ], {width: 400, height: 200});
  assert.deepEqual(Object.fromEntries(placed), {a: 'right', b: 'left', c: null, d: 'left'});
  assert.equal(placeLabels([{id: 'a', x: 100, y: 50, r: 3.5, w: 40}, {id: 'e', x: 130, y: 52, r: 3.5, w: 20}]).get('a'), 'left',
    'a label never covers another dot');
  assert.equal(placeLabels([{id: 'x', x: 5, y: 2, r: 3.5, w: 30}], {width: 100, height: 100}).get('x'), null, 'no room above the top edge');
  // AD-like: the selected territory's label (free) ignores the neighbours' dots on both sides; theirs then give way.
  const crowded = [{id: 'ad', x: 100, y: 50, r: 3.5, w: 90, free: true}, {id: 'es1', x: 150, y: 52, r: 3.5, w: 60}, {id: 'es2', x: 40, y: 48, r: 3.5, w: 60}];
  assert.equal(placeLabels(crowded.map(i => ({...i, free: false})), {width: 400, height: 200}).get('ad'), null);
  const freed = placeLabels(crowded, {width: 400, height: 200});
  assert.equal(freed.get('ad'), 'right');
  assert.equal(freed.get('es1'), null, 'a non-free label still avoids the placed label box (its dot stays)');
  assert.equal(placeLabels([{id: 'a', x: 100, y: 50, r: 3.5, w: 40, free: true}, {id: 'b', x: 130, y: 52, r: 3.5, w: 20, free: true}]).get('a'), 'left',
    'free labels still avoid each other\'s dots');
});

test('real geometry: codes reproduce the GeoJSON codes; land fits 984×432; Antarctica clips away', async () => {
  const {features, path, codes} = await geo;
  const reference = await json('public/world-countries.geo.json');
  assert.equal(features.length, 177);
  assert.deepEqual(features.map(f => f.properties.code), reference.features.map(f => f.properties.code));
  assert.equal(features.filter(f => f.properties.code === null).length, 3);
  assert.equal(Object.keys(codes.codes).length, 174);
  const boxes = features.filter(f => f.properties.code !== 'AQ').map(f => path.bounds(f));
  const union = [Math.min(...boxes.map(b => b[0][0])), Math.min(...boxes.map(b => b[0][1])), Math.max(...boxes.map(b => b[1][0])), Math.max(...boxes.map(b => b[1][1]))];
  assert.ok(Math.abs(union[0] - 8) < 0.05 && Math.abs(union[1] - 8) < 0.05 && Math.abs(union[2] - 992) < 0.05 && Math.abs(union[3] - 440) < 0.05, union.join());
  assert.equal(path(features.find(f => f.properties.code === 'AQ')), null, 'Antarctica lies wholly below the land fit');
});

test('real geometry: FR frames mainland France; US the contiguous states; RU and FJ survive the antimeridian', async () => {
  const {frame} = await geo;
  const fr = frame('FR');
  const [w, h] = size(fr);
  assert.ok(Math.abs(w - 29) < 1.5 && Math.abs(h - 27) < 1.5, `FR ${w}×${h}`);
  assert.ok(fr[0][1] > 60 && fr[1][1] < 110 && fr[0][0] > 480, 'not French Guiana');
  const t = focusTransform(fr);
  assert.ok(t.k >= 4, `FR k ${t.k}`);
  for (const [x, y] of fr) {
    const sx = t.x + t.k * x, sy = t.y + t.k * y;
    assert.ok(sx >= 0 && sx <= MAP_WIDTH && sy >= 0 && sy <= MAP_HEIGHT, 'FR box inside the frame');
  }
  const us = size(frame('US'));
  assert.ok(Math.abs(us[0] - 148) < 2 && Math.abs(us[1] - 80) < 2, `US ${us}`);
  const ru = size(frame('RU'));
  assert.ok(ru[0] > 250 && ru[0] < 500, `RU ${ru}`);
  const fj = size(frame('FJ'));
  assert.ok(fj[0] < 20, `FJ ${fj}`);
  const nz = size(frame('NZ'));
  assert.ok(Math.abs(nz[0] - 53) < 2 && Math.abs(nz[1] - 39) < 2, `NZ ${nz}`);
});

// ---------------------------------------------------------------- country brief and overview

// Walkthrough literals (84 records, the five newest countries, France's brief) read the frozen 2 Oct snapshot
// (tests/fixtures/snapshot-20261002), never public/*.json, so a data refresh cannot turn them red. `live` is the
// published data, for invariants derived from it.
const SNAPSHOT = 'tests/fixtures/snapshot-20261002';
const events = (await json(`${SNAPSHOT}/events.json`)).events;
const countries = await json(`${SNAPSHOT}/countries.json`);
const research = await json(`${SNAPSHOT}/research-ledger.json`);
const coverage = await json(`${SNAPSHOT}/coverage.json`);
const contexts = await json(`${SNAPSHOT}/event-context.json`);
const live = {events: (await json('public/events.json')).events, countries: await json('public/countries.json'),
  research: await json('public/research-ledger.json'), coverage: await json('public/coverage.json'), contexts: await json('public/event-context.json')};
const candidateURLs = [...research.countries, ...live.research.countries].flatMap(row => row.candidate_urls ?? []);
const noCandidateURL = html => { for (const url of candidateURLs) assert.ok(!html.includes(url), `candidate URL leaked: ${url}`); };

test('overviewModel lists the five most recently observed countries, not a ranking by count', () => {
  const m = overviewModel({mapEvents: events, countries, mode: 'reported'});
  assert.equal(RECENT_LIMIT, 5);
  assert.equal(m.count, 84);
  assert.equal(m.countryCount, 81);
  assert.equal(m.directoryTotal, 249);
  assert.deepEqual(m.recent.map(r => r.code), ['IN', 'FR', 'ES', 'TZ', 'AU']);
  const html = renderOverview(m, {now: NOW});
  assert.ok(html.includes('<h2 id="country-panel-title"'));
  assert.ok(html.includes('Published episodes in 81 of 249 countries and territories.'));
  assert.ok(html.includes('<p class="brief-lead" role="status">'));
  assert.ok(html.includes('<h3 class="brief-subtitle">Most recent evidence</h3>'));
  assert.equal((html.match(/class="brief-country"/g) ?? []).length, 5);
  assert.ok(html.includes('data-select-country="IN"') && html.includes('India</span> · <span class="brief-country-date">latest evidence 2 Oct 2026'));
  // Short display names (model.COUNTRY_SHORT_NAMES): "Tanzania", never "Tanzania, United Republic of".
  assert.ok(html.includes('Tanzania</span> · ') && !html.includes('United Republic'));
  assert.ok(html.includes('<a href="#/countries">All 249 countries and territories, A to Z</a>'));
  const filtered = renderOverview(overviewModel({mapEvents: events.slice(0, 3), countries, filtered: true}), {now: NOW});
  assert.ok(filtered.includes('Published episodes in 3 of 249 countries and territories match your filters.'));
  const none = renderOverview(overviewModel({mapEvents: [], countries, filtered: true}), {now: NOW});
  assert.ok(none.includes('No published episode matches these filters.') && !/\b0 of\b/.test(none));
  assert.ok(renderOverview(overviewModel({countries, status: 'error'})).includes('Coverage cannot be shown because published records did not load.'));
  assert.ok(!renderOverview(overviewModel({countries, status: 'error'})).includes('brief-country"'), 'rows omitted on error');
  assert.ok(renderOverview(overviewModel({countries, status: 'loading'})).includes('Loading published records…'));
  assert.ok(renderOverview(overviewModel({mapEvents: [{id: 'x', country: 'GB'}], countries, mode: 'example'})).includes('Illustrative example: one fictional record.'));
});

test('overviewModel on the published files: counts and the five newest countries follow the data', () => {
  const m = overviewModel({mapEvents: live.events, countries: live.countries, mode: 'reported'});
  assert.equal(m.count, live.events.length);
  assert.equal(m.directoryTotal, live.countries.length);
  assert.equal(m.countryCount, new Set(live.events.map(e => e.country).filter(c => /^[A-Z]{2}$/.test(c))).size);
  // Newest latest evidence first; ties keep file order; one row per country.
  const order = live.events.map((e, i) => [e, i]).sort((a, b) => (Date.parse(b[0].last_observed_at) - Date.parse(a[0].last_observed_at)) || a[1] - b[1]);
  const newest = [...new Set(order.map(([e]) => e.country))].slice(0, RECENT_LIMIT);
  assert.deepEqual(m.recent.map(r => r.code), newest);
  for (const row of m.recent) assert.equal(row.name, displayCountryName(row.code, live.countries.find(c => c.code === row.code)?.name));
  assert.ok(renderOverview(m, {now: NOW}).includes(`Published episodes in ${m.countryCount} of ${m.directoryTotal} countries and territories.`));
});

const brief = (code, extra = {}, opts = {}) => {
  const model = briefModel({code, mapEvents: events, allEvents: events, countries, coverage, research, contexts, ...extra});
  return {model, html: renderBrief(model, {now: NOW, lazy: {coverage: 'ready', research: 'ready'}, ...opts})};
};

test('briefModel has no leads; the FR brief shows records, the ledger, cities and actions', () => {
  const {model, html} = brief('FR');
  assert.equal('leads' in model, false);
  assert.equal(model.state, 'records');
  assert.equal(model.matching.length, 2);
  assert.ok(html.includes('<p class="brief-eyebrow">Country brief · Europe</p>'));
  assert.ok(html.includes('<h2 id="country-panel-title" class="brief-title" tabindex="-1">France</h2>'));
  assert.ok(html.includes('2 published episodes. Includes a sourced ended or suspended episode.'));
  for (const label of ['Source coverage', 'Languages read', 'Last article check for this country', 'First search logged', 'Human editorial review']) assert.ok(html.includes(`<dt>${label}</dt>`), label);
  assert.ok(html.includes('<dd>Limited source check</dd>') && html.includes('<dd>English</dd>') && html.includes('<dd>Not completed</dd>'));
  assert.ok(html.includes('5 results (not reviewed)'));
  assert.ok(html.includes('data-select-city="FR:Paris"') && html.includes('City dots are approximate reference points, not protest sites.'));
  assert.ok(html.includes('<ul class="brief-records">') && html.includes('href="#/record/fr-schools-20261002" data-open-record="fr-schools-20261002"'));
  assert.ok(html.includes('Current status not established · Latest evidence 2 Oct 2026'));
  assert.ok(html.includes('data-select-country="FR" data-view-after="latest">Show France in Reports</button>'));
  assert.ok(html.includes('data-clear-filter="country">Back to world</button>'));
  noCandidateURL(html);
  const one = brief('FR', {mapEvents: events.filter(e => e.id === 'fr-schools-20261002'), filtered: true}).html;
  assert.ok(one.includes('1 published episode matches your filters.') && !one.includes('Includes a sourced ended'));
  const pressed = renderBrief(brief('FR').model, {now: NOW, selectedCity: 'FR:Paris', lazy: {coverage: 'ready', research: 'ready'}});
  assert.ok(pressed.includes('data-clear-filter="city" aria-pressed="true">'));
});

test('brief: short display name with the ISO name as a secondary line; the live lead names the country', () => {
  const {model, html} = brief('TZ');
  assert.equal(model.name, 'Tanzania');
  assert.equal(model.isoName, 'Tanzania, United Republic of');
  assert.ok(html.includes('<h2 id="country-panel-title" class="brief-title" tabindex="-1">Tanzania</h2><p class="brief-iso">ISO name: Tanzania, United Republic of</p>'));
  // Moving between countries with the same count still changes the role="status" text (4.1.3).
  assert.match(html, /<p class="brief-lead" role="status"><span class="visually-hidden">Tanzania: <\/span>1 published episode\./);
  const fr = brief('FR').html;
  assert.ok(!fr.includes('brief-iso'), 'no secondary line when the names agree');
  assert.match(fr, /<p class="brief-lead" role="status"><span class="visually-hidden">France: <\/span>2 published episodes\./);
  const kr = brief('KR');
  assert.equal(kr.model.name, 'South Korea');
  assert.ok(kr.html.includes('Show South Korea in Reports'));
});

test('displayCountries maps to short names once per directory; directChild finds a fragment child', () => {
  const mapped = displayCountries(countries);
  assert.equal(mapped, displayCountries(countries), 'memoised per array');
  assert.equal(mapped.length, countries.length);
  assert.equal(mapped.find(c => c.code === 'GB').name, 'United Kingdom');
  assert.equal(mapped.find(c => c.code === 'GB').isoName, 'United Kingdom of Great Britain and Northern Ireland');
  // The brief built from map-view's display directory still shows the ISO line.
  const tz = renderBrief(briefModel({code: 'TZ', mapEvents: events, allEvents: events, countries: mapped}), {now: NOW});
  assert.ok(tz.includes('>Tanzania</h2><p class="brief-iso">ISO name: Tanzania, United Republic of</p>'));
  assert.equal(mapped.find(c => c.code === 'FR').name, 'France');
  assert.equal(countries.find(c => c.code === 'GB').name, 'United Kingdom of Great Britain and Northern Ireland', 'input untouched');
  assert.deepEqual(displayCountries(null), []);
  const lead = {matches: selector => selector === '.brief-lead'};
  assert.equal(directChild({children: [{matches: () => false}, lead]}, '.brief-lead'), lead);
  assert.equal(directChild({children: []}, '.brief-lead'), null);
  assert.equal(directChild(null, '.brief-lead'), null);
});

test('E3: records exist but none match the filters', () => {
  const {model, html} = brief('FR', {mapEvents: [], filtered: true});
  assert.equal(model.state, 'filtered-out');
  assert.ok(html.includes('France has 2 published episodes, but none match your current filters.'));
  assert.ok(html.includes('data-action="clear-except-country">Show all for France</button>'));
  assert.ok(!html.includes('brief-records'));
});

test('E2 variants for a country with no published episode (IS)', () => {
  const searched = brief('IS');
  assert.equal(searched.model.state, 'no-record');
  assert.ok(searched.html.includes('Iceland: no published episode in this atlas. A first search was logged on 2 Oct 2026 (5 results, not reviewed). This is a coverage gap, not evidence that no protests occurred.'));
  assert.ok(!searched.html.includes('Show Iceland in Reports'));
  noCandidateURL(searched.html);
  const failedLedger = {countries: [{code: 'IS', status: 'search-failed', attempted_at: '2026-10-02T21:09:14Z', result_count: 0, candidate_urls: ['https://example.org/lead']}]};
  const failed = brief('IS', {research: failedLedger});
  assert.ok(failed.html.includes('A first search on 2 Oct 2026 failed, so Iceland has not been checked yet. This is a coverage gap, not evidence that no protests occurred.'));
  assert.ok(failed.html.includes('<dd>Search failed</dd>'));
  assert.ok(!/0 results/.test(failed.html), 'never "0 results" for a failed search');
  assert.ok(!failed.html.includes('example.org/lead'));
  const unsearched = brief('IS', {research: {countries: []}});
  assert.ok(unsearched.html.includes('Iceland has not been searched yet. This is a coverage gap, not evidence that no protests occurred.'));
  assert.ok(unsearched.html.includes('<dd>Not yet searched</dd>'));
  const loading = brief('IS', {research: null}, {lazy: {coverage: 'ready', research: 'loading'}});
  assert.ok(loading.html.includes('Iceland: no published episode in this atlas. Checking the search log…'));
  const ledgerFailed = brief('IS', {research: null}, {lazy: {coverage: 'ready', research: 'error'}});
  assert.ok(ledgerFailed.html.includes('The search log could not load, so whether Iceland was searched is not shown here. This is a coverage gap, not evidence that no protests occurred.'));
  assert.equal((ledgerFailed.html.match(/data-retry="research"/g) ?? []).length, 1);
  const coverageFailed = brief('IS', {coverage: null}, {lazy: {coverage: 'error', research: 'ready'}});
  assert.ok(coverageFailed.html.includes('Ledger unavailable') && coverageFailed.html.includes('data-retry="coverage"'));
  assert.equal(searchSentence({name: 'Iceland', ledger: {screen: {status: 'searched', attemptedAt: '2026-10-02T21:09:14Z', resultCount: 0}}}).includes('no results'), true);
});

test('brief: events error, no-polygon line, example mode, escaping; no real brief says "0 results"', () => {
  const error = brief('FR', {error: true});
  assert.ok(error.html.includes('Coverage cannot be shown because published records did not load.') && error.html.includes('data-action="retry-data"'));
  assert.ok(!error.html.includes('brief-ledger') && !error.html.includes('published episodes.'));
  const ad = brief('AD', {}, {hasPolygon: false});
  assert.ok(ad.html.includes('Andorra is too small to draw on this map at this scale. Its records are listed below and in Reports.'));
  assert.ok(ad.html.includes('data-open-record="ad-housing-rally-2025"'));
  const mc = brief('MC', {}, {hasPolygon: false});
  assert.ok(mc.html.includes('Monaco is too small to draw on this map at this scale.') && !mc.html.includes('listed below'));
  const adFiltered = brief('AD', {mapEvents: [], filtered: true}, {hasPolygon: false});
  assert.equal(adFiltered.model.state, 'filtered-out');
  assert.ok(adFiltered.html.includes('Andorra is too small to draw on this map at this scale.</p>') && !adFiltered.html.includes('listed below'),
    'no "listed below" when every record is filtered out');
  const example = briefModel({code: 'GB', mapEvents: [{id: 'example-civic-services', country: 'GB', title: 'Example', last_observed_at: '2026-10-01', status: 'unknown'}],
    allEvents: [], countries, mode: 'example'});
  const exampleHTML = renderBrief(example, {now: NOW});
  assert.ok(exampleHTML.includes('Illustrative example • not a real event') && exampleHTML.includes('Illustrative example: one fictional record.'));
  assert.ok(exampleHTML.includes('data-set-mode="reported"') && !exampleHTML.includes('brief-ledger'));
  // A country without the example record: watermark and the way back, but no claim that it has a fictional record.
  const other = renderBrief(briefModel({code: 'FR', mapEvents: example.matching, allEvents: example.matching, countries, mode: 'example'}), {now: NOW});
  assert.ok(other.includes('Illustrative example • not a real event') && other.includes('data-set-mode="reported"'));
  assert.ok(!other.includes('one fictional record') && !other.includes('brief-ledger'));
  // Integration decision: the lead says so plainly (lead-approved copy, INTEGRATION_NOTES).
  assert.ok(other.includes('<p class="brief-lead" role="status">France: no record in the illustrative example.</p>'));
  const hostile = renderBrief(briefModel({code: 'FR', mapEvents: [{id: 'x', country: 'FR', title: '<script>alert(1)</script>'}], countries: [{code: 'FR', name: '<b>F</b>', region: 'Europe'}]}), {now: NOW});
  assert.ok(!hostile.includes('<script>') && !hostile.includes('<b>F</b>') && hostile.includes('&lt;script&gt;'));
  for (const country of countries) {
    const html = brief(country.code).html;
    assert.ok(!/\b0 results\b/.test(html), country.code);
    assert.ok(!/>0</.test(html), country.code);
  }
  // The same invariant on the published files.
  for (const country of live.countries) {
    const model = briefModel({code: country.code, mapEvents: live.events, allEvents: live.events, countries: live.countries,
      coverage: live.coverage, research: live.research, contexts: live.contexts});
    const html = renderBrief(model, {now: NOW, lazy: {coverage: 'ready', research: 'ready'}});
    assert.ok(!/\b0 results\b/.test(html) && !/>0</.test(html), country.code);
    noCandidateURL(html);
  }
});

// ---------------------------------------------------------------- legend, selection bar, controls

const M = ['What the colours mean', 'Published episode matches your filters', "No published episode matches. A coverage gap, not 'no protests'",
  'Selected', 'Shadow: includes a sourced ended or suspended episode. It does not mean the movement ended or won',
  'City reference point (approximate). Not a protest site', 'Small territories are not drawn at this scale. Use the country list',
  'Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe.'];
const decode = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const plain = html => decode(html.replace(/<[^>]+>/g, '\n')).split('\n').map(s => s.trim()).filter(Boolean);
const legendText = html => plain(html.replace(/<a [^>]*>/g, '').replace(/<\/a>/g, ''));

test('legend carries M1–M8 verbatim, the hint first, and M9 only with a time window', () => {
  const html = legendHTML({});
  const lines = legendText(html);
  assert.equal(lines[0], MAP_COPY.hintFine);
  assert.deepEqual(lines.slice(1), M);
  assert.ok(html.startsWith('<p class="map-hint">'));
  assert.ok(html.includes('<h2 class="legend-title">What the colours mean</h2>'));
  for (const kind of ['reported', 'gap', 'selected', 'ended', 'city']) assert.ok(html.includes(`<i class="legend-swatch" data-kind="${kind}"`), kind);
  assert.ok(html.includes('<a href="#/countries">Use the country list</a>'));
  assert.ok(!html.includes('data-kind="window"'));
  assert.equal(legendText(legendHTML({window: '7'})).at(-1), 'Showing episodes with latest evidence in the last 7 days');
  assert.equal(legendText(legendHTML({window: '30'})).at(-1), 'Showing episodes with latest evidence in the last 30 days');
  assert.equal(legendText(legendHTML({coarse: true}))[0], 'One finger scrolls the page. To move the map, pinch with two fingers, use + and −, or turn on Explore map.');
  assert.ok(legendHTML({citiesError: true}).includes('City points could not load; city names stay in records and filters.'));
});

test('legend hint follows Explore: one finger moves the map, so the page-scroll hint is not shown', () => {
  const coarse = legendText(legendHTML({coarse: true, explore: true}));
  assert.equal(coarse[0], 'One finger moves the map. Tap Done exploring to scroll the page again.');
  assert.ok(!coarse.some(line => /One finger scrolls the page|turn on Explore map/.test(line)));
  assert.equal(legendText(legendHTML({explore: true}))[0], MAP_COPY.hintFineExplore);
  assert.match(MAP_COPY.hintFineExplore, /Done exploring/);
  assert.deepEqual(legendText(legendHTML({coarse: true, explore: true})).slice(1), M, 'only the hint changes');
  assert.equal(legendText(legendHTML({eventsError: true, coarse: true, explore: true}))[0], MAP_COPY.hintCoarseExplore);
});

test('legend variants: events error, example, example loading and error, unavailable', () => {
  const error = legendHTML({eventsError: true});
  assert.ok(error.startsWith('<p class="map-hint">'));
  assert.deepEqual(legendText(error), [MAP_COPY.hintFine, M[0], 'Coverage cannot be shown because published records did not load.', 'Retry'],
    'the hint and M1 stay; the list and notes are replaced (§11.5)');
  assert.ok(error.includes('<p class="legend-note legend-status" role="status">Coverage cannot be shown because published records did not load.</p>'));
  assert.ok(error.includes('data-action="retry-data">Retry</button>') && !error.includes('legend-list'));
  const example = legendHTML({mode: 'example'});
  assert.ok(example.includes('data-kind="example"') && example.includes('Illustrative example country (fictional record)') && !example.includes('data-kind="reported"'));
  assert.ok(legendHTML({mode: 'example', example: 'loading'}).includes('Loading the illustrative example…'));
  const exampleError = legendHTML({mode: 'example', example: 'error'});
  assert.ok(exampleError.includes('Illustrative example unavailable') && exampleError.includes('data-set-mode="reported">Back to reported data</button>'));
  for (const gone of [M[1], M[2], M[3], M[4]]) assert.ok(!exampleError.includes(gone), gone);
  assert.deepEqual(legendText(legendHTML({unavailable: true})), [M[6], M[7]]);
});

test('legend: no city row when no city points are drawn (contexts or cities failed, example mode)', () => {
  const cityRow = html => html.includes('data-kind="city"') || html.includes(M[5]);
  assert.ok(cityRow(legendHTML({})), 'drawn by default');
  const noContexts = legendHTML({cities: false});
  assert.ok(!cityRow(noContexts));
  assert.deepEqual(legendText(noContexts).slice(1), M.filter((_, i) => i !== 5), 'only the city row goes');
  assert.ok(!cityRow(legendHTML({cities: false, citiesError: true})) && legendHTML({cities: false, citiesError: true}).includes(MAP_COPY.citiesError));
  for (const example of ['ready', 'loading', 'error']) assert.ok(!cityRow(legendHTML({mode: 'example', example})), `example ${example}`);
  assert.ok(!legendHTML({mode: 'example', example: 'error'}).includes('legend-list'), 'no empty list');
});

test('brief: reported cities that could not load are said to be unknown, not left out', () => {
  const failed = brief('FR', {contexts: null, contextsError: true});
  assert.equal(failed.model.citiesError, true);
  assert.deepEqual(failed.model.cities, []);
  assert.ok(failed.html.includes('<p class="brief-note">Reported cities could not load, so they are unknown here, not absent.</p>'));
  assert.ok(!failed.html.includes('brief-cities') && !failed.html.includes(BRIEF_COPY.cityNote));
  assert.match(CONTEXTS_ERROR, /cities could not load, so they are unknown here, not absent/, 'the same wording as the contexts-error notice');
  const ok = brief('FR');
  assert.equal(ok.model.citiesError, false);
  assert.ok(!ok.html.includes(BRIEF_COPY.citiesError) && ok.html.includes('data-select-city="FR:Paris"'));
  // Only a records brief lists cities, so only it carries the line; the example never does.
  assert.equal(brief('IS', {contexts: null, contextsError: true}).model.citiesError, false);
  assert.equal(briefModel({code: 'FR', mapEvents: events, allEvents: events, countries, mode: 'example', contextsError: true}).citiesError, false);
});

test('region chips: "World" is never pressed while a country is selected; a region is only when it holds that country', () => {
  assert.equal(pressedRegion('World', '', countries), 'World');
  assert.equal(pressedRegion('World', 'FR', countries), null, '#reset-map with ?country=FR');
  assert.equal(pressedRegion('Europe', 'FR', countries), 'Europe');
  assert.equal(pressedRegion('Asia', 'FR', countries), null);
  assert.equal(pressedRegion('Asia', '', countries), 'Asia');
  assert.equal(pressedRegion(null, 'FR', countries), null);
  assert.equal(pressedRegion('Europe', 'FR', []), null, 'no directory: no claim');
  assert.ok(!regionChipsHTML(pressedRegion('World', 'FR', countries)).includes('aria-pressed="true"'));
});

test('selection bar, region chips and controls', () => {
  const bar = selectionBarHTML({name: 'France', state: 'records', count: 2, filtered: true});
  assert.ok(plain(bar).join(' ').startsWith('France · 2 published episodes match'));
  assert.ok(bar.includes('href="#country-panel" data-scroll-to="country-panel">See brief</a>'));
  // One label for clearing the country, as in the brief (MINOR 13): the region chip and #reset-map only move the view.
  assert.ok(bar.includes('data-clear-filter="country">Back to world</button>'));
  assert.ok(selectionBarHTML({name: 'France', state: 'records', count: 1, filtered: true}).includes('1 published episode matches'));
  assert.ok(selectionBarHTML({name: 'France', state: 'records', count: 2}).includes('<span>2 published episodes</span>'));
  assert.ok(selectionBarHTML({name: 'France', state: 'filtered-out', publishedCount: 2}).includes('2 published episodes, none match your filters'));
  assert.ok(selectionBarHTML({name: 'Iceland', state: 'no-record'}).includes('no published episode in this atlas'));
  assert.ok(!/\b0\b/.test(plain(selectionBarHTML({name: 'Iceland', state: 'error'})).join(' ')));
  const chips = regionChipsHTML('Europe');
  assert.equal((chips.match(/data-action="map-region"/g) ?? []).length, 6);
  assert.ok(chips.includes('data-value="Europe" aria-pressed="true"') && chips.includes('data-value="World" aria-pressed="false"'));
  assert.ok(!/\d/.test(plain(chips).join('')), 'region chips carry no counts');
  const controls = controlsHTML();
  for (const id of ['zoom-in', 'zoom-out', 'reset-map', 'map-explore']) assert.ok(controls.includes(`id="${id}"`), id);
  assert.ok(controls.includes('aria-label="Zoom in"') && controls.includes('aria-label="Zoom out"') && controls.includes('<span>World</span>'));
  assert.ok(controls.includes('aria-pressed="false"') && controls.includes('Explore map'));
  assert.equal(hasNonPlaceFilters({country: 'FR', city: 'FR:Paris', window: 'all'}), false);
  assert.equal(hasNonPlaceFilters({window: '7'}), true);
  assert.equal(hasNonPlaceFilters({query: 'x'}), true);
});

test('WP4 copy contains no banned vocabulary (SPEC §18.1)', () => {
  const banned = new RegExp(`\\b(${['live', 'live now', 'happening now', 'right now', 'breaking', 'real-time', 'active protests', 'current protests', 'ongoing now',
    'tracking \\d+ protests', '\\d+ protests worldwide', 'hotspots?', 'trending', 'most active', 'escalating', 'unrest index', 'severity', 'danger', 'risk level',
    'top countries', 'top issues', 'sides', 'vs', 'as of', 'synced', 'join', 'attend', 'rsvp', 'remind me', 'add to calendar', 'live desk'].join('|')})\\b`, 'i');
  const stamp = /^(updated|last updated|reviewed|verified)\b/i;
  const exampleBrief = (state, extra = {}) => renderBrief(briefModel({code: 'FR', countries, mode: 'example', example: state, ...extra}), {now: NOW});
  const all = [legendHTML({}), legendHTML({eventsError: true}), legendHTML({mode: 'example'}), legendHTML({mode: 'example', example: 'loading'}),
    legendHTML({mode: 'example', example: 'error'}), legendHTML({unavailable: true}), legendHTML({window: '7', citiesError: true, coarse: true}),
    controlsHTML(), regionChipsHTML(), selectionBarHTML({name: 'France', count: 2}), selectionBarHTML({name: 'France', state: 'filtered-out', publishedCount: 2}),
    brief('FR').html, brief('IS').html, brief('AD', {}, {hasPolygon: false}).html, brief('FR', {error: true}).html, brief('FR', {loading: true}).html,
    exampleBrief('loading'), exampleBrief('error'), renderOverview(overviewModel({mapEvents: events, countries}), {now: NOW}),
    ...['error', 'loading', 'example-loading', 'example-error'].map(status => renderOverview(overviewModel({countries, status, mode: status.startsWith('example') ? 'example' : 'reported'}), {now: NOW})),
    ...Object.values(MAP_COPY)].join('\n');
  // M8 says "how severe" (allowed: it is not "severity"); check the plain text only.
  const lines = plain(all);
  const hit = lines.find(line => banned.test(line) || stamp.test(line) || /^new$/i.test(line));
  assert.equal(hit, undefined, hit);
});

// ---------------------------------------------------------------- example mode never borrows the events-error copy (C-38)

test('describeCountry: tooltip and aria-label text by state', () => {
  const fr = events.filter(e => e.country === 'FR');
  assert.equal(describeCountry(fr), '2 published episodes. Includes a sourced ended or suspended episode.');
  assert.equal(describeCountry(fr.slice(0, 1), {filtered: true}), countSentence(1, true, fr[0].status === 'ended'));
  assert.equal(describeCountry([]), MAP_COPY.gap);
  assert.equal(describeCountry(fr, {error: true}), 'Coverage cannot be shown because published records did not load.');
  assert.equal(describeCountry(fr, {loading: true}), 'Loading published records…');
  const example = [{id: 'example-civic-services', country: 'GB', status: 'unknown'}];
  assert.equal(describeCountry(example, {mode: 'example'}), MAP_COPY.example);
  assert.equal(describeCountry(undefined, {mode: 'example'}), '', 'no claim for a country without the example record');
  assert.equal(describeCountry(undefined, {mode: 'example', example: 'loading'}), 'Loading the illustrative example…');
  assert.equal(describeCountry(example, {mode: 'example', example: 'error'}), 'Illustrative example unavailable');
});

test('example loading and error: brief and overview say so, never that published records failed', () => {
  const states = {loading: 'Loading the illustrative example…', error: 'Illustrative example unavailable'};
  for (const [example, lead] of Object.entries(states)) {
    const model = briefModel({code: 'FR', mapEvents: [], allEvents: [], countries, mode: 'example', example});
    assert.equal(model.state, `example-${example}`);
    const html = renderBrief(model, {now: NOW});
    assert.ok(html.includes(`<p class="brief-lead" role="status">${lead}</p>`), example);
    assert.ok(html.includes('Illustrative example • not a real event') && html.includes('data-set-mode="reported">Back to reported data</button>'));
    assert.equal(html.includes('data-retry="examples">Retry example</button>'), example === 'error');
    for (const wrong of ['published records did not load', 'Loading published records', 'retry-data', 'brief-ledger', 'one fictional record']) assert.ok(!html.includes(wrong), `${example}: ${wrong}`);
    const overview = renderOverview(overviewModel({countries, mode: 'example', status: `example-${example}`}), {now: NOW});
    assert.ok(overview.includes(lead) && !overview.includes('published records did not load') && !overview.includes('retry-data'));
    assert.equal(overview.includes('data-retry="examples"'), example === 'error');
  }
});

test('city chips keep one focus key across both states', () => {
  const {model} = brief('FR');
  const key = html => html.match(/data-focus-key="city:FR:Paris"[^>]*/)?.[0] ?? '';
  const off = key(renderBrief(model, {now: NOW, lazy: {coverage: 'ready', research: 'ready'}}));
  const on = key(renderBrief(model, {now: NOW, selectedCity: 'FR:Paris', lazy: {coverage: 'ready', research: 'ready'}}));
  assert.ok(off.includes('data-select-city="FR:Paris"') && on.includes('data-clear-filter="city"'));
});
