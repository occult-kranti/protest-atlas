// Shell contract tests (WP1): DOM ids, import map and versioning, modulepreload == static graph, Node import safety,
// payload budgets, CSS layering, tokens, banned vocabulary in static copy, 404 self-containment and the sheet API.
// SPEC §4.6, §15, §17, §18.1, §19.0, §19 WP1; tech §4.1, §4.7, §4.9, §6.2, §10.1, §11.1. Offline; Node only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {dirname, join, normalize, relative} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(join(ROOT, file), 'utf8');
const gz = text => gzipSync(Buffer.isBuffer(text) ? text : Buffer.from(text), {level: 9}).length;
const INDEX = read('index.html');
const NOT_FOUND = read('404.html');
const STYLES = read('styles.css');
const CSS_DIR = readdirSync(join(ROOT, 'css')).filter(f => f.endsWith('.css')).sort().map(f => `css/${f}`);
const ROOT_MODULES = readdirSync(ROOT).filter(f => f.endsWith('.js') && f !== 'review.js').sort();
const JS_MODULES = readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js')).sort().map(f => `js/${f}`);

// ---------------------------------------------------------------------------------------------------------------
// Minimal HTML tokenizer (no DOM in Node): tags with attributes, text chunks, script/style bodies kept apart.
const ENTITY = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: '\u00a0'};
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
  return ENTITY[e.toLowerCase()] ?? m;
});
function tokens(html) {
  const out = [];
  const re = /<!--[\s\S]*?-->|<(script|style)\b([^>]*)>([\s\S]*?)<\/\1\s*>|<\/?([a-zA-Z][\w-]*)\b([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) out.push({kind: 'tag', name: m[1].toLowerCase(), attrs: attrs(m[2]), body: m[3], closing: false});
    else if (m[4]) out.push({kind: 'tag', name: m[4].toLowerCase(), attrs: attrs(m[5]), closing: m[0][1] === '/'});
    else out.push({kind: 'text', text: decode(m[6])});
  }
  return out;
}
function attrs(source = '') {
  const result = {};
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
  let m;
  while ((m = re.exec(source))) result[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return result;
}
const INDEX_TOKENS = tokens(INDEX);
const tagsOf = (toks, name) => toks.filter(t => t.kind === 'tag' && !t.closing && t.name === name);
const byId = (toks, id) => toks.find(t => t.kind === 'tag' && !t.closing && t.attrs.id === id);
const classes = t => (t?.attrs.class ?? '').split(/\s+/).filter(Boolean);

// ---------------------------------------------------------------------------------------------------------------
// DOM contract (SPEC §4.6 pinned ids, C-45, C-47; tech §4.7)
const PINNED_IDS = `site-header stamp-chip primary-nav data-notice example-banner main view-latest latest-title feed-stats filter-bar
  active-filters result-summary feed-explainer event-list list-more view-map map-title map-regions map-stage world-map map-tooltip
  map-controls map-legend map-selbar after-map country-panel view-ahead ahead-title ahead-root view-countries countries-title
  countries-root view-about about-title about-stamps about-discovery research-scope about-example tab-bar site-footer footer-stamps
  action-feedback record-sheet record-close record-eyebrow record-minititle record-share record-announcer record-body record-actions
  record-prev record-source record-next record-feedback filters-sheet filters-title filters-body filters-foot filters-status
  stamps-sheet stamps-title stamps-body icon-sprite`.split(/\s+/);
const VIEWS = ['latest', 'map', 'ahead', 'countries', 'about'];

test('index.html carries every pinned id exactly once', () => {
  const ids = INDEX_TOKENS.filter(t => t.kind === 'tag' && !t.closing && t.attrs.id).map(t => t.attrs.id);
  for (const id of PINNED_IDS) assert.equal(ids.filter(x => x === id).length, 1, `#${id} must appear exactly once`);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, [], 'no duplicate ids');
});

test('html element sets the chosen direction and colour-scheme hooks', () => {
  const html = tagsOf(INDEX_TOKENS, 'html')[0];
  assert.equal(html.attrs.lang, 'en');
  assert.equal(html.attrs['data-color-scheme'], 'auto');
  assert.equal(html.attrs['data-default-view'], 'latest');
  assert.equal(html.attrs['data-map-gestures'], 'page');
});

test('every view is a section with an h1 title (tabindex -1) and its data-view', () => {
  for (const view of VIEWS) {
    const section = byId(INDEX_TOKENS, `view-${view}`);
    assert.equal(section.name, 'section');
    assert.ok(classes(section).includes('view'));
    assert.equal(section.attrs['data-view'], view);
    assert.equal(section.attrs['aria-labelledby'], `${view}-title`);
    const title = byId(INDEX_TOKENS, `${view}-title`);
    assert.equal(title.name, 'h1', `#${view}-title is an h1 (C-45)`);
    assert.equal(title.attrs.tabindex, '-1');
  }
});

test('pinned classes, sheet titles, dialogs and live regions follow SPEC §4.6', () => {
  for (const cls of ['skip-link', 'skip-map', 'ahead-switch', 'feed-actions', 'site-footer--app']) {
    assert.ok(INDEX_TOKENS.some(t => t.kind === 'tag' && classes(t).includes(cls)), `.${cls}`);
  }
  for (const id of ['filters-title', 'stamps-title']) {
    const h = byId(INDEX_TOKENS, id);
    assert.equal(h.name, 'h2');
    assert.equal(h.attrs.tabindex, '-1');
  }
  for (const [id, cls] of [['record-sheet', 'sheet--record'], ['filters-sheet', 'sheet--filters'], ['stamps-sheet', 'sheet--stamps']]) {
    const d = byId(INDEX_TOKENS, id);
    assert.equal(d.name, 'dialog');
    assert.ok(classes(d).includes('sheet') && classes(d).includes(cls), `#${id}.sheet.${cls}`);
  }
  assert.equal(byId(INDEX_TOKENS, 'record-sheet').attrs['aria-labelledby'], 'detail-title');
  for (const id of ['action-feedback', 'record-feedback']) {
    const t = byId(INDEX_TOKENS, id);
    assert.equal(t.attrs.role, 'status');
    assert.equal(t.attrs['aria-live'], 'polite');
    assert.ok('hidden' in t.attrs, `#${id} starts hidden`);
  }
  assert.ok(classes(byId(INDEX_TOKENS, 'record-feedback')).includes('toast--sheet'));
  assert.equal(byId(INDEX_TOKENS, 'record-announcer').attrs.role, 'status');
  assert.equal(byId(INDEX_TOKENS, 'filters-status').attrs.role, 'status');
  assert.equal(byId(INDEX_TOKENS, 'record-source').name, 'a');
  assert.equal(byId(INDEX_TOKENS, 'record-source').attrs.rel, 'noopener noreferrer');
  assert.ok('data-close-sheet' in byId(INDEX_TOKENS, 'record-close').attrs);
  const chip = byId(INDEX_TOKENS, 'stamp-chip');
  assert.equal(chip.name, 'button');
  assert.equal(chip.attrs['data-open-sheet'], 'stamps-sheet');
  for (const opener of INDEX_TOKENS.filter(t => t.kind === 'tag' && !t.closing && t.attrs['data-open-sheet'] !== undefined)) {
    assert.equal(opener.attrs['aria-haspopup'], 'dialog', `[data-open-sheet="${opener.attrs['data-open-sheet']}"] has aria-haspopup="dialog"`);
  }
  assert.equal((INDEX.match(/<span aria-hidden="true">↗<\/span>/g) ?? []).length, (INDEX.match(/↗/g) ?? []).length, 'every ↗ is aria-hidden');
  assert.equal(byId(INDEX_TOKENS, 'main').attrs.tabindex, '-1');
  assert.equal(byId(INDEX_TOKENS, 'example-banner').attrs.hidden, '');
  assert.equal(byId(INDEX_TOKENS, 'about-example').attrs['data-set-mode'], 'example');
});

test('navigation: five tabs and five header links, plus Coming next; no count badges', () => {
  const navLinks = id => {
    const start = INDEX_TOKENS.indexOf(byId(INDEX_TOKENS, id));
    const end = INDEX_TOKENS.findIndex((t, i) => i > start && t.kind === 'tag' && t.closing && t.name === 'nav');
    return INDEX_TOKENS.slice(start, end).filter(t => t.kind === 'tag' && !t.closing && t.name === 'a');
  };
  const tabs = navLinks('tab-bar');
  assert.deepEqual(tabs.map(a => a.attrs['data-nav']), VIEWS);
  assert.deepEqual(tabs.map(a => a.attrs.href), VIEWS.map(v => `#/${v}`));
  const primary = navLinks('primary-nav');
  assert.deepEqual(primary.map(a => a.attrs['data-nav']), [...VIEWS, 'ahead/roadmap']);
  assert.ok(classes(primary.at(-1)).includes('primary-nav-extra'));
  assert.equal(byId(INDEX_TOKENS, 'tab-bar').attrs['aria-label'], 'Sections');
  assert.equal(byId(INDEX_TOKENS, 'primary-nav').attrs['aria-label'], 'Primary');
  const tabStart = INDEX.indexOf('>', INDEX.indexOf('id="tab-bar"')) + 1;
  const tabText = INDEX.slice(tabStart, INDEX.indexOf('</nav>', tabStart))
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(tabText, 'Reports Map Ahead Countries About');
  assert.doesNotMatch(tabText, /\d/);
});

// ---------------------------------------------------------------------------------------------------------------
// Static copy (verbatim from SPEC / editorial copy deck)
const H1 = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';
const P1 = 'Protest Atlas: source-checked protest reports';
const P2 = 'An AI-assisted, source-checked snapshot of reported protests, with searches logged for 249 countries and territories. Sparse coverage; not a live feed.';
const textOf = html => decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ').replace(/ ([.,;:])/g, '$1').trim();

test('page meta is P1/P2 and the notice paints H1 before JS', () => {
  assert.equal(tagsOf(INDEX_TOKENS, 'title').length, 1);
  assert.match(INDEX, new RegExp(`<title>${P1}</title>`));
  const meta = tagsOf(INDEX_TOKENS, 'meta');
  assert.equal(meta.find(m => m.attrs.name === 'description').attrs.content, P2);
  assert.equal(meta.find(m => m.attrs.property === 'og:title').attrs.content, P1);
  assert.equal(meta.find(m => m.attrs.property === 'og:description').attrs.content, P2);
  assert.equal(meta.find(m => m.attrs.name === 'viewport').attrs.content, 'width=device-width, initial-scale=1, viewport-fit=cover');
  const notice = INDEX.slice(INDEX.indexOf('id="data-notice"'), INDEX.indexOf('id="example-banner"'));
  assert.ok(textOf(notice).includes(H1), 'H1 verbatim in #data-notice');
  assert.equal(byId(INDEX_TOKENS, 'data-notice').attrs.role, 'status');
});

test('static About, footer and banner copy is verbatim', () => {
  const text = textOf(INDEX);
  const strings = [
    'Coming next to Protest Atlas — what we are building, what is blocked and what we will not build →',
    'Protest Atlas is a dated, source-checked snapshot of reported protests. An AI-assisted process opened and read each cited news report and recorded what it says. No human editor has checked these records yet.',
    'Latest evidence is the most recent day a cited source reports activity or a development. Records are sorted by it, newest first.',
    "'Reported ongoing' needs evidence dated within the last 72 hours. Re-reading an old source, assembling the snapshot or rebuilding the site never makes an episode more recent.",
    'For / against always names a target. Positions are not head-counts, and there is no tally.',
    "Turnout, disruption and violence or harm are reported separately. There is no combined score. 'Not established' never means zero or none.",
    'Police and state response is shown as the source reports it, with attribution. A missing entry is not evidence that nothing happened.',
    'Single source means one newsroom or reporting chain, however many links. Corroborated means the AI-assisted check found more than one independent source for key claims; it is not independent human verification.',
    'Colour shows what this atlas has published. It does not show how many protests there were, how large they were or how severe.',
    'No published episode is a coverage gap, not evidence that no protests happened.',
    'Shadow: includes a sourced ended or suspended episode. It does not mean the movement ended or won',
    'City reference point (approximate). Not a protest site',
    'How to read a record', 'How to read the map', 'What the dates mean', 'Research scope', 'Lead discovery', 'Data and tools',
    'Download CSV of the records matching your current filters', 'Published data (JSON)', 'Editorial policy ↗',
    'Source code and corrections ↗', 'Please do not post private details about participants.', 'Editor desk',
    'Local tool for reviewing leads. Nothing is published from it.', 'Explore an illustrative example',
    'A source-checked snapshot of reported protests.',
    'Illustrative example • not a real event. You are viewing one fictional record. It is excluded from counts, the directory and CSV export.',
    'Back to reported data', 'Copy link to this view', 'Download CSV', 'How this list is ordered',
    "Newest first, by the date of each episode's latest sourced activity or development. Not by when it was published or checked.",
    'What the dates on this page mean', 'Two separate lists: protest actions that organisations have announced, and what is coming next to this website.',
    'Countries and territories with a published episode that matches your filters.',
    'Country directory adapted from ISO country data · CC BY-SA 4.0. Map geometry: Natural Earth via world-atlas.',
  ];
  for (const s of strings) assert.ok(text.includes(s), `missing verbatim copy: ${s}`);
  // About order is fixed (SPEC §14).
  const order = ['Coming next to Protest Atlas', 'Protest Atlas is a dated', 'How to read a record', 'How to read the map',
    'What the dates mean', 'Research scope', 'Lead discovery', 'Data and tools'];
  const about = textOf(INDEX.slice(INDEX.indexOf('id="view-about"')));
  const positions = order.map(s => about.indexOf(s));
  assert.ok(positions.every(p => p >= 0) && positions.every((p, i) => i === 0 || p > positions[i - 1]), 'About order');
  const mounts = ['about-stamps', 'research-scope', 'about-discovery'].map(id => INDEX.indexOf(`id="${id}"`));
  assert.ok(mounts[0] < mounts[1] && mounts[1] < mounts[2]);
});

// ---------------------------------------------------------------------------------------------------------------
// Icon sprite (SPEC §17.9, C-29)
const ICONS = `i-latest i-map i-ahead i-countries i-about i-filter i-search i-close i-share i-download i-external i-chevron-left
  i-chevron-right i-chevron-down i-plus i-minus i-world i-clock i-check i-alert i-info i-hand i-expand i-collapse i-signpost
  i-calendar-empty i-link`.split(/\s+/);

test('the sprite defines every icon symbol on a 24 px stroke grid, and every <use> resolves', () => {
  const sprite = byId(INDEX_TOKENS, 'icon-sprite');
  assert.equal(sprite.name, 'svg');
  assert.ok('hidden' in sprite.attrs);
  const symbols = tagsOf(INDEX_TOKENS, 'symbol');
  assert.deepEqual(symbols.map(s => s.attrs.id).sort(), [...ICONS].sort());
  for (const s of symbols) {
    assert.equal(s.attrs.viewbox, '0 0 24 24', s.attrs.id);
    assert.equal(s.attrs.fill, 'none');
    assert.equal(s.attrs.stroke, 'currentColor');
    assert.equal(s.attrs['stroke-width'], '1.8');
  }
  for (const use of tagsOf(INDEX_TOKENS, 'use')) assert.ok(ICONS.includes(use.attrs.href.slice(1)), use.attrs.href);
  for (const svg of tagsOf(INDEX_TOKENS, 'svg').filter(s => classes(s).includes('icon'))) {
    assert.equal(svg.attrs['aria-hidden'], 'true');
    assert.equal(svg.attrs.focusable, 'false');
  }
});

// ---------------------------------------------------------------------------------------------------------------
// Import map, versioning, modulepreload == static graph (tech §10.1, §11.1; SPEC §19.0 C-48)
const STATIC_GRAPH_21 = `app.js explore.js freshness.js history.js js/html.js js/model.js js/store.js js/router.js js/data.js js/actions.js
  js/filters.js js/list.js js/stamps.js js/notice.js js/sheet.js js/record-facts.js js/cards.js js/detail.js js/ahead.js
  js/countries.js js/about.js`.split(/\s+/);
const LAZY = ['map.js', 'js/map-view.js', 'js/country-brief.js'];
const SPECIFIER = /^\s*(?:import|export)\b[^;'"()`]*?['"](\.{1,2}\/[^'"]+)['"]/gm;

function staticImports(file) {
  const source = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return [...source.matchAll(SPECIFIER)].map(m => m[1]);
}
function staticGraph(entry) {
  const seen = new Set();
  const visit = file => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const spec of staticImports(file)) {
      const target = relative(ROOT, normalize(join(ROOT, dirname(file), spec.split('?')[0]))).split('\\').join('/');
      assert.ok(existsSync(join(ROOT, target)), `${file} imports missing ${spec}`);
      visit(target);
    }
  };
  visit(entry);
  return [...seen].sort();
}

function importMap() {
  const scripts = tagsOf(INDEX_TOKENS, 'script');
  assert.equal(scripts[0].attrs.type, 'importmap', 'the import map is the first <script>');
  return JSON.parse(scripts[0].body).imports;
}

test('the import map has exactly one versioned entry per root module and js/*.js', () => {
  const map = importMap();
  const expected = [...ROOT_MODULES, ...JS_MODULES].map(f => `./${f}`).sort();
  assert.deepEqual(Object.keys(map).sort(), expected);
  const versions = new Set();
  for (const [key, value] of Object.entries(map)) {
    const m = value.match(/^(\.\/.+\.js)\?v=([\w.-]+)$/);
    assert.ok(m && m[1] === key, `${key} -> ${value}`);
    versions.add(m[2]);
  }
  assert.equal(versions.size, 1, 'one version for every module');
});

test('stylesheets, entry script and modulepreloads share the import-map version', () => {
  const version = Object.values(importMap())[0].split('?v=')[1];
  const links = tagsOf(INDEX_TOKENS, 'link');
  const sheets = links.filter(l => l.attrs.rel === 'stylesheet').map(l => l.attrs.href);
  assert.deepEqual(sheets, ['styles.css', 'css/feed.css', 'css/record.css', 'css/map.css', 'css/pages.css'].map(h => `${h}?v=${version}`));
  const entry = tagsOf(INDEX_TOKENS, 'script').filter(s => s.attrs.type === 'module');
  assert.deepEqual(entry.map(s => s.attrs.src), [`app.js?v=${version}`]);
  for (const l of links.filter(x => x.attrs.rel === 'modulepreload')) assert.match(l.attrs.href, new RegExp(`^\\./.+\\.js\\?v=${version.replace('.', '\\.')}$`));
  assert.equal(version, '4.0');
});

test('no JS import specifier carries ?v=', () => {
  for (const file of [...ROOT_MODULES, 'review.js', ...JS_MODULES]) {
    const dynamic = [...read(file).matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1]);
    for (const spec of [...staticImports(file), ...dynamic]) assert.ok(!spec.includes('?v='), `${file}: ${spec}`);
  }
});

test('modulepreload equals the static import graph of app.js, which is the frozen 21-module set', () => {
  const graph = staticGraph('app.js');
  assert.deepEqual(graph, [...STATIC_GRAPH_21].sort(), 'static graph (SPEC §19.0)');
  const preload = tagsOf(INDEX_TOKENS, 'link').filter(l => l.attrs.rel === 'modulepreload').map(l => l.attrs.href.replace(/^\.\//, '').split('?')[0]);
  assert.equal(new Set(preload).size, preload.length, 'no duplicate modulepreload');
  assert.deepEqual([...preload].sort(), graph);
  for (const lazy of LAZY) assert.ok(!graph.includes(lazy), `${lazy} stays lazy`);
  assert.match(read('app.js'), /\bimport\(/, 'app.js uses a dynamic import()');
  assert.ok(read('app.js').includes('./js/map-view.js'), 'map-view is reached through import()');
});

test('the static graph has no cycle', () => {
  const stack = new Set();
  const done = new Set();
  const walk = file => {
    if (done.has(file)) return;
    assert.ok(!stack.has(file), `import cycle through ${file}`);
    stack.add(file);
    for (const spec of staticImports(file)) walk(relative(ROOT, normalize(join(ROOT, dirname(file), spec))).split('\\').join('/'));
    stack.delete(file);
    done.add(file);
  };
  walk('app.js');
  for (const lazy of LAZY) walk(lazy);
});

for (const file of [...ROOT_MODULES, 'review.js', ...JS_MODULES]) {
  test(`${file} imports in Node with no DOM`, async () => {
    assert.equal(typeof globalThis.document, 'undefined');
    await import(pathToFileURL(join(ROOT, file)).href);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Budgets (gzip -9; tech §6.2)
const KB = 1024;
const sizeOf = file => existsSync(join(ROOT, file)) ? gz(readFileSync(join(ROOT, file))) : 0;

// Code and data are budgeted apart (MAJOR 13): a data refresh grows events.json, event-context.json and cities.json,
// and must never fail a code-size gate. Code buckets hold only html, css, js and the static map geometry and vendor files;
// data has its own generous guards (events.json at the §6.2 number, critical data, and the reported map data).
const CRITICAL_DATA = ['public/events.json', 'public/countries.json', 'public/event-context.json', 'public/upcoming.json', 'public/build-info.json'];
const MAP_CODE = ['vendor/d3.v7.9.0.min.js', 'vendor/topojson-client.v3.1.0.min.js', 'public/world-110m.topo.json', 'public/world-map-codes.json',
  'map.js', 'js/map-view.js', 'js/country-brief.js', 'css/map.css'];
function budgets() {
  const html = gz(INDEX);
  const css = ['styles.css', ...CSS_DIR].reduce((n, f) => n + sizeOf(f), 0);
  const js = staticGraph('app.js').reduce((n, f) => n + sizeOf(f), 0);
  const data = CRITICAL_DATA.reduce((n, f) => n + sizeOf(f), 0);
  const map = MAP_CODE.reduce((n, f) => n + sizeOf(f), 0);
  const mapData = sizeOf('public/cities.json');
  return {html, css, js, data, code: html + css + js, critical: html + css + js + data, map, mapData};
}
const B = budgets();

// `target` is the tech §6.2 table. `ceiling` is what CI enforces: the integration budget (SPEC §23 "Integration addendum",
// docs/design/INTEGRATION_NOTES.md §4). Method: gzip -9 per file, summed; source files as served (no build step minifies).
// Ceiling = ceil(1.1 × size measured after the integration cuts), in KB of 1,024 B. Measured 3 Oct 2026: css 25,627 B,
// critical JS 84,091 B, critical total 177,248 B (61,471 B of it data), map add-on 161,124 B (138 KB of it vendor d3,
// topojson and map data), map-first 338,372 B. Why §6.2 is not met: SPEC rev 2 scope (C-34–C-52) landed after §6.2 was
// sized, the 21-module static graph is frozen by C-48 (Ahead, Countries and About load eagerly, about 17 KB), and the
// sources ship with their contract comments (about 14 KB of the JS). Shrinking needs a lazy-view split or a build-time
// minifier (both open follow-ups), not a higher ceiling. html and events.json keep the §6.2 numbers.
// Code ceilings use the same method on the integration measurements with the data taken out: ceil(1.1 × measured)
// for critical code (177,248 − 61,471 B data → 125 KB), the map add-on without cities.json (161,124 − 3,225 B → 170 KB)
// and map-first code (338,372 − 61,471 − 3,225 B → 294 KB). Data guards: events.json keeps the §6.2 120 KB; critical
// data and cities.json get about 3× and 5× the 2 Oct snapshot (61,471 B and 3,225 B), so a refresh of a few hundred
// records passes. Targets are the §6.2 numbers less their data share.
const BUDGETS = {
  html: {label: 'index.html', target: 12, ceiling: 12},
  css: {label: 'styles.css + css/*.css', target: 16, ceiling: 28},
  js: {label: 'critical JS (static graph of app.js)', target: 40, ceiling: 91},
  code: {label: 'critical code (html + css + js)', target: 68, ceiling: 125},
  map: {label: 'map add-on code and geometry (no cities data)', target: 152, ceiling: 170},
  mapFirst: {label: 'map-first code (critical code + map add-on)', target: 220, ceiling: 294},
  events: {label: 'events.json (data)', target: 120, ceiling: 120},
  data: {label: 'critical data files (data)', target: 180, ceiling: 180},
  mapData: {label: 'cities.json (map data)', target: 16, ceiling: 16},
};
const MEASURED = {html: B.html, css: B.css, js: B.js, code: B.code, map: B.map, mapFirst: B.code + B.map, events: sizeOf('public/events.json'),
  data: B.data, mapData: B.mapData};

test('budget report (gzip -9 bytes)', t => {
  t.diagnostic(`html ${B.html}, css ${B.css} (styles.css ${sizeOf('styles.css')}), critical js ${B.js}, critical code ${B.code}, `
    + `critical data ${B.data}, critical total ${B.critical}, map add-on ${B.map} (+ cities ${B.mapData}), map-first code ${B.code + B.map}`);
  const over = Object.entries(BUDGETS).filter(([k, b]) => MEASURED[k] > b.target * KB).map(([k, b]) => `${b.label} ${MEASURED[k]} > ${b.target * KB}`);
  if (over.length) t.diagnostic(`over the tech §6.2 targets: ${over.join('; ')}`);
  for (const b of Object.values(BUDGETS)) assert.ok(b.ceiling >= b.target, `${b.label}: the ceiling never undercuts §6.2`);
});

test('code budgets ignore data: a larger events.json and event-context.json change no code bucket (MAJOR 13)', () => {
  for (const key of ['html', 'css', 'js', 'code', 'map', 'mapFirst']) assert.ok(!/data/.test(BUDGETS[key].label) || key === 'map', key);
  assert.ok(!MAP_CODE.some(f => CRITICAL_DATA.includes(f) || f === 'public/cities.json'));
  assert.equal(B.code, B.html + B.css + B.js);
});
for (const [key, {label, target, ceiling}] of Object.entries(BUDGETS)) {
  const note = ceiling === target ? '' : ` (tech §6.2 target ${target} KB; integration budget, SPEC §23)`;
  test(`budget: ${label} <= ${ceiling} KB gzip${note}`, () => {
    assert.ok(MEASURED[key] <= ceiling * KB, ['events', 'data', 'mapData'].includes(key) ? `${label} ${MEASURED[key]} > ${ceiling * KB}: split an events index` : `${label} ${MEASURED[key]} > ${ceiling * KB}`);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// CSS contract (tech §4.9; SPEC §17)
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
function topLevel(css) {
  // Splits a stylesheet into top-level statements: {head, body} for blocks and {head} for @-statements.
  const out = [];
  let depth = 0; let head = ''; let start = -1; let quote = null;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (quote) { if (c === quote && css[i - 1] !== '\\') quote = null; if (depth === 0) head += c; continue; }
    if (c === '"' || c === "'") { quote = c; if (depth === 0) head += c; continue; }
    if (c === '{') { if (depth === 0) start = i + 1; depth += 1; continue; }
    if (c === '}') { depth -= 1; if (depth === 0) { out.push({head: head.trim(), body: css.slice(start, i)}); head = ''; } continue; }
    if (depth === 0) {
      if (c === ';') { out.push({head: head.trim(), body: null}); head = ''; } else head += c;
    }
  }
  assert.equal(depth, 0, 'balanced braces');
  assert.equal(head.trim(), '', 'no dangling statement');
  return out;
}

test('styles.css declares the layer order first and has no unlayered rules', () => {
  const statements = topLevel(stripComments(STYLES));
  assert.equal(statements[0].head, '@layer reset, tokens, base, layout, components, views, utilities');
  assert.equal(statements[0].body, null);
  for (const s of statements.slice(1)) assert.match(s.head, /^@layer (reset|tokens|base|layout|utilities)$/, `unlayered or foreign layer: ${s.head}`);
});

test('css/* files contain only @layer components (feed, record, map) or @layer views (pages) blocks', () => {
  const expected = {'css/feed.css': 'components', 'css/record.css': 'components', 'css/map.css': 'components', 'css/pages.css': 'views'};
  assert.deepEqual(CSS_DIR, Object.keys(expected).sort());
  for (const file of CSS_DIR) {
    const statements = topLevel(stripComments(read(file)));
    assert.ok(statements.length >= 1, file);
    for (const s of statements) {
      assert.equal(s.head, `@layer ${expected[file]}`, `${file}: top-level statement "${s.head}"`);
      assert.notEqual(s.body, null, `${file}: layer blocks only`);
    }
  }
});

test('no !important in any stylesheet', () => {
  for (const file of ['styles.css', 'review.css', ...CSS_DIR]) assert.doesNotMatch(stripComments(read(file)), /!\s*important/i, file);
});

test('colour literals live only in styles.css @layer tokens', () => {
  const HEX = /#[0-9a-f]{3,8}\b/i;
  const outsideTokens = topLevel(stripComments(STYLES)).filter(s => s.head !== '@layer tokens').map(s => s.body ?? '').join('\n');
  // url(#id) fragments are not colours; strip them before scanning.
  const scrub = css => css.replace(/url\(\s*['"]?#[^)]*\)/g, '');
  assert.doesNotMatch(scrub(outsideTokens), HEX, 'styles.css outside @layer tokens');
  for (const file of CSS_DIR) assert.doesNotMatch(scrub(stripComments(read(file))), HEX, file);
});

const ALLOWED_MEDIA = new Set(['(min-width: 600px)', '(min-width: 900px)', '(min-width: 1200px)', '(max-height: 500px)',
  '(hover: hover) and (pointer: fine)', '(prefers-reduced-motion: reduce)', '(forced-colors: active)', '(prefers-color-scheme: dark)']);
const normalMedia = query => query.trim().replace(/\s+/g, ' ').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')').replace(/\s*:\s*/g, ': ');

test('only the SPEC §17.7 media queries are used (plus the §17.1 dark scheme)', () => {
  for (const file of ['styles.css', ...CSS_DIR]) {
    for (const [, list] of stripComments(read(file)).matchAll(/@media\s+([^{]+)\{/g)) {
      for (const query of list.split(',').map(normalMedia)) assert.ok(ALLOWED_MEDIA.has(query), `${file}: @media ${list.trim()} (${query})`);
    }
  }
  assert.ok(!ALLOWED_MEDIA.has(normalMedia('(hover:hover)')) && ALLOWED_MEDIA.has(normalMedia('(hover:hover) and (pointer:fine)')));
});

const TOKENS = `--bg --bg-raised --bg-sunken --notice-bg --text --text-2 --text-muted --border --border-input --border-strong --accent
  --accent-ink --accent-weak --focus-ring --ok --ok-weak --warn --warn-weak --danger --danger-weak --status-ongoing --status-planned
  --status-ended --status-review --status-unknown --band-fresh --band-week --band-month --band-older --stance-support --stance-oppose
  --stance-other --example --example-ink --example-stripe --on-example --ended-shadow --map-ocean --map-land --map-hatch --map-reported
  --map-example --map-selected --map-selected-halo --map-border --map-grid --map-city --map-city-ended --map-shadow --map-focus
  --font-serif --font-sans --fs-xs --fs-sm --fs-md --fs-lg --fs-xl --fs-2xl --fs-3xl --lh-tight --lh-body --sp-1 --sp-2 --sp-3 --sp-4
  --sp-5 --sp-6 --sp-7 --sp-8 --tap --header-h --tabbar-h --gutter --r-1 --r-2 --r-3 --r-pill --shadow-1 --shadow-2 --ease-out --dur-1
  --dur-2 --z-controls --z-sticky --z-header --z-tabbar --z-toast`.split(/\s+/);
const LEGACY = {'--canvas': '#f5f3eb', '--surface': '#fffef9', '--ink': '#202a28', '--muted': '#59635d', '--line': '#d3d5c9', '--ochre': '#926018',
  '--ochre-light': '#efe5cd', '--green': '#315b49', '--green-light': '#e5eee5', '--error': '#893d30', '--serif': 'var(--font-serif)',
  '--sans': 'var(--font-sans)', '--radius': '3px', '--space': '24px'};
const LIGHT = {'--bg': '#f6f4ee', '--bg-raised': '#fffdf8', '--text': '#1a1c19', '--text-muted': '#5f625b', '--border-input': '#7a7d74',
  '--focus-ring': '#1a5fb4', '--map-reported': '#b4772a', '--map-selected-halo': '#fffdf8', '--example-ink': '#5f4796', '--example-stripe': '#6b54a3'};
const DARK = {'--bg': '#121411', '--bg-raised': '#1b1d1a', '--text': '#efede6', '--text-muted': '#a3a69d', '--border-input': '#8d9188',
  '--focus-ring': '#8ab4f8', '--map-reported': '#bd8236', '--map-selected-halo': '#0e1311', '--ended-shadow': '#c9c6bc', '--map-shadow': '#d8d4c8'};
const declared = (block, name) => block.match(new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;]+);`))?.[1].trim();

test('every frozen token is defined, light and dark values match SPEC §17.1, legacy aliases keep 3.1 values', () => {
  const tokens = topLevel(stripComments(STYLES)).find(s => s.head === '@layer tokens').body;
  const rootBlock = tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('}', tokens.indexOf(':root {')));
  for (const name of TOKENS) assert.ok(declared(tokens, name) !== undefined, `${name} is defined`);
  for (const [name, value] of Object.entries(LEGACY)) assert.equal(declared(rootBlock, name), value, name);
  for (const [name, value] of Object.entries(LIGHT)) assert.equal(declared(rootBlock, name), value, `light ${name}`);
  const autoDark = tokens.slice(tokens.indexOf(':root[data-color-scheme="auto"]'));
  const forcedDark = tokens.slice(tokens.indexOf(':root[data-color-scheme="dark"]'));
  assert.ok(tokens.includes('@media (prefers-color-scheme: dark)'));
  for (const [name, value] of Object.entries(DARK)) {
    assert.equal(declared(autoDark, name), value, `auto dark ${name}`);
    assert.equal(declared(forcedDark, name), value, `forced dark ${name}`);
  }
  assert.match(tokens, /prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{\s*--dur-1: 0ms; --dur-2: 0ms;/);
});

test('review.html keeps its 3.1 classes styled through styles.css (C-44)', () => {
  const review = read('review.html');
  assert.match(review, /<link rel="stylesheet" href="styles\.css">/);
  for (const cls of ['wrap', 'site-header', 'brand', 'brand-mark', 'edition', 'eyebrow', 'skip-link', 'site-footer', 'noscript']) {
    assert.ok(review.includes(cls), `review.html uses .${cls}`);
    assert.match(STYLES, new RegExp(`\\.${cls}[\\s,:{.\\[)]`), `styles.css styles .${cls}`);
  }
  assert.match(STYLES, /\.site-header:not\(:has\(\.site-header-inner\)\)/);
  assert.match(STYLES, /\.brand small/);
  assert.match(STYLES, /\.brand-mark \{[^}]*min-width: 32px; height: 32px; padding-inline: 4px;/);
  assert.match(STYLES, /\.site-footer--app \{[^}]*calc\(var\(--tabbar-h\) \+ 24px\)/);
});

test('shell rules required by SPEC §17.5, §17.8, §17.10 are present', () => {
  const css = stripComments(STYLES);
  for (const re of [
    /html \{[^}]*scroll-padding-top: calc\(var\(--header-h\) \+ 8px\);\s*scroll-padding-bottom: calc\(var\(--tabbar-h\) \+ 8px\)/,
    /html\[data-view="ahead"\] \{ scroll-padding-top: calc\(var\(--header-h\) \+ 52px\); \}/,
    /\.sheet--record \.sheet-body \{ scroll-padding-top: 52px; \}/,
    /html\.sheet-open \{ overflow: hidden;/,
    /\[tabindex="-1"\]:focus:not\(:focus-visible\)/,
    /:focus-visible \{ outline: 3px solid var\(--focus-ring\); outline-offset: 2px; \}/,
    /summary \{ display: list-item; min-height: var\(--tap\); padding-block: 10px;/,
    /\[aria-disabled="true"\]:is\(\.btn, \.icon-btn\)/,
    /:root:has\(\.tab-bar\) \{ --tabbar-h: calc\(64px \+ env\(safe-area-inset-bottom\)\); \}/,
    /@media \(max-height: 500px\) \{[\s\S]*\.site-header \{ position: static; \}/,
    /@media \(forced-colors: active\)/,
    /\.example-banner :focus-visible, \.card-watermark :focus-visible, \.map-watermark :focus-visible \{ outline-color: var\(--on-example\); \}/,
    /\[hidden\]:not\(\[hidden="until-found"\]\) \{ display: none; \}/,
    /\.view\[data-view="latest"\]/,
    /@media \(forced-colors: active\) \{[^@]*\.stamp-chip\[data-tone="warn"\]:not\(:has\(\.icon\)\) \.stamp-chip-label::before \{ forced-color-adjust: none; background: CanvasText; \}/,
    /@media \(max-height: 500px\) \{[\s\S]*?\.toast--sheet \{\s*position: fixed;/,
  ]) assert.match(css, re);
  // The forced-colours override must use the painting rule's selector, or the higher-specificity rule keeps --warn.
  const paint = css.match(/(\.stamp-chip\[data-tone="warn"\][^{]*\.stamp-chip-label::before) \{\s*content/)?.[1];
  assert.equal(paint, '.stamp-chip[data-tone="warn"]:not(:has(.icon)) .stamp-chip-label::before');
  assert.doesNotMatch(css, /#view-latest/, 'the Reports grid selects the class, not the id (C-44)');
  assert.doesNotMatch(css, /data-detent|data-stance/);
  assert.doesNotMatch(css, /\.band[^{]*::before/, 'band badges carry no symbol (C-05)');
});

// ---------------------------------------------------------------------------------------------------------------
// Banned vocabulary in static text and attributes (SPEC §18.1)
const BANNED = ['live', 'live now', 'happening now', 'right now', 'breaking', 'real-time', 'active protests', 'current protests',
  'ongoing now', 'hotspots?', 'trending', 'most active', 'escalating', 'unrest index', 'severity', 'danger', 'risk level',
  'top countries', 'top issues', 'sides', 'vs', 'as of', 'synced', 'join', 'attend', 'rsvp', 'remind me', 'add to calendar', 'live desk'];
const BANNED_RE = [...BANNED.map(w => new RegExp(`(?<![\\w-])${w.replace(/ /g, '\\s+')}(?![\\w-])`, 'i')),
  /\btracking\s+\d+\s+protests\b/i, /\b\d+\s+protests\s+worldwide\b/i];
const ALLOW = [H1.slice(H1.indexOf('Sparse coverage')), P2.slice(P2.indexOf('Sparse coverage'))];
const SCANNED_ATTRS = ['aria-label', 'title', 'alt', 'placeholder', 'aria-description', 'aria-roledescription'];

function bannedHits(html) {
  const hits = [];
  const check = (where, raw) => {
    let text = raw.replace(/\s+/g, ' ').trim();
    if (!text) return;
    for (const a of ALLOW) text = text.split(a).join(' ');
    for (const re of BANNED_RE) if (re.test(text)) hits.push(`${where}: "${raw.trim()}" (${re.source})`);
    if (/^new$/i.test(text)) hits.push(`${where}: "New" as a whole element text`);
    if (/^(updated|last updated|reviewed|verified)\b/i.test(text)) hits.push(`${where}: stamp-like "${text}"`);
  };
  for (const t of tokens(html)) {
    if (t.kind === 'text') check('text', t.text);
    else if (!t.closing) {
      for (const a of SCANNED_ATTRS) if (t.attrs[a]) check(`${t.name}[${a}]`, t.attrs[a]);
      if (t.name === 'meta' && t.attrs.content && /description|title/.test(`${t.attrs.name ?? ''}${t.attrs.property ?? ''}`)) check('meta', t.attrs.content);
      if (t.name === 'title' && t.body) check('title', t.body);
    }
  }
  return hits;
}

test('static text and attributes of index.html and 404.html carry no banned vocabulary', () => {
  assert.deepEqual(bannedHits(INDEX), []);
  assert.deepEqual(bannedHits(NOT_FOUND), []);
  // The scanner itself catches the obvious cases.
  assert.equal(bannedHits('<p>Live updates</p>').length, 1);
  assert.equal(bannedHits('<button aria-label="Join the march">x</button>').length, 1);
  assert.equal(bannedHits('<span class="band">New</span>').length, 1);
  assert.equal(bannedHits('<p>Updated 2 Oct</p>').length, 1);
  assert.equal(bannedHits(`<p>${H1}</p>`).length, 0, 'H1 is allowlisted');
  assert.equal(bannedHits('<p>Delivered to the city</p>').length, 0, 'whole words only');
});

// ---------------------------------------------------------------------------------------------------------------
// 404.html (SPEC §15, C-33)
test('404.html is self-contained, noindex, absolute-linked and carries H1', () => {
  const toks = tokens(NOT_FOUND);
  assert.ok(tagsOf(toks, 'meta').some(m => m.attrs.name === 'robots' && /noindex/.test(m.attrs.content)));
  assert.match(NOT_FOUND, /<title>Page not found — Protest Atlas<\/title>/);
  assert.ok(textOf(NOT_FOUND).includes(H1));
  assert.ok(textOf(NOT_FOUND).includes('This page is not part of the atlas.'));
  for (const t of toks.filter(x => x.kind === 'tag' && !x.closing)) {
    for (const a of ['href', 'src']) {
      if (t.attrs[a] !== undefined) assert.match(t.attrs[a], /^(\/protest-atlas\/|https:\/\/)/, `${t.name}[${a}]="${t.attrs[a]}"`);
    }
  }
  assert.equal(tagsOf(toks, 'link').length, 0, 'no external stylesheet or icon');
  assert.ok(tagsOf(toks, 'style').length === 1 && tagsOf(toks, 'script').length === 1);
  const links = tagsOf(toks, 'a').filter(a => a.attrs['data-path'] !== undefined && a.attrs['data-path'] !== '');
  assert.deepEqual(links.map(a => a.attrs['data-path']), ['#/latest', '#/map', '#/ahead/roadmap', '#/countries', 'public/events.json']);
  assert.deepEqual(links.map(a => a.attrs.href), links.map(a => `/protest-atlas/${a.attrs['data-path']}`));
});

test('404.html computes home and redirects every alias (tech §2.5 + reports)', () => {
  const script = tagsOf(tokens(NOT_FOUND), 'script')[0].body;
  const run = (hostname, pathname, search = '') => {
    const calls = {replace: null, hrefs: {}};
    const links = ['', '#/latest', '#/map', '#/ahead/roadmap', '#/countries', 'public/events.json']
      .map(p => ({getAttribute: () => p, setAttribute: (k, v) => { calls.hrefs[p] = v; }}));
    const location = {hostname, pathname, search, replace: url => { calls.replace = url; }};
    const document = {querySelectorAll: () => links};
    new Function('location', 'document', script)(location, document);
    return calls;
  };
  const expected = {roadmap: '#/ahead/roadmap', 'roadmap.html': '#/ahead/roadmap', 'coming-next': '#/ahead/roadmap', ahead: '#/ahead',
    next: '#/ahead', map: '#/map', countries: '#/countries', about: '#/about', methodology: '#/about', reports: '#/latest'};
  for (const [alias, hash] of Object.entries(expected)) {
    assert.equal(run('occult-kranti.github.io', `/protest-atlas/${alias}`).replace, `/protest-atlas/${hash}`, alias);
    assert.equal(run('example.org', `/${alias}/`).replace, `/${hash}`, `${alias} at a custom domain`);
  }
  assert.equal(run('occult-kranti.github.io', '/protest-atlas/map', '?country=FR').replace, '/protest-atlas/?country=FR#/map');
  const deep = run('occult-kranti.github.io', '/protest-atlas/a/b/c');
  assert.equal(deep.replace, null);
  assert.equal(deep.hrefs['#/map'], '/protest-atlas/#/map');
  assert.equal(deep.hrefs['public/events.json'], '/protest-atlas/public/events.json');
  assert.equal(run('localhost', '/missing').hrefs['#/countries'], '/#/countries');
});

// ---------------------------------------------------------------------------------------------------------------
// js/sheet.js behaviour against small DOM stand-ins (the browser behaviour is covered by tests/browser/smoke.cjs).
const sheet = await import(pathToFileURL(join(ROOT, 'js/sheet.js')).href);

function fakeDocument() {
  const classes = new Set();
  const style = new Map();
  const doc = {
    nodeType: 9, activeElement: null, body: {id: 'body'}, defaultView: null, dialogs: [],
    documentElement: {classList: {add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c)},
      style: {setProperty: (k, v) => style.set(k, v), removeProperty: k => style.delete(k), getPropertyValue: k => style.get(k) ?? ''}},
    getElementById: id => doc.byId?.[id] ?? null,
    querySelector: sel => (sel === 'dialog.sheet[open]' ? doc.dialogs.find(d => d.open) ?? null : null),
    classes, style,
  };
  doc.body.ownerDocument = doc;
  doc.activeElement = doc.body;
  return doc;
}
function fakeFocusable(doc, name, {shown = true} = {}) {
  return {name, ownerDocument: doc, isConnected: true, focusCalls: [],
    focus(options) { this.focusCalls.push(options); doc.activeElement = this; },
    getClientRects: () => (shown ? [1] : []), matches: sel => (name === 'heading' && /h2/.test(sel))};
}
function fakeDialog(doc, inner = {}) {
  const events = [];
  const dialog = {open: false, ownerDocument: doc, events, attrs: {},
    showModal() { this.open = true; }, close() { this.open = false; },
    contains: el => Object.values(inner).includes(el),
    querySelector: sel => (sel.includes('h2[tabindex="-1"]') ? inner.heading ?? null : (sel.startsWith('#') ? inner[sel.slice(1)] ?? null : null)),
    hasAttribute: k => k in dialog.attrs, setAttribute: (k, v) => { dialog.attrs[k] = v; },
    dispatchEvent: e => { events.push(e); return true; }};
  doc.dialogs.push(dialog);
  return dialog;
}

test('sheet.js exports the frozen API and nothing about detents', () => {
  assert.deepEqual(Object.keys(sheet).sort(), ['closeSheet', 'initChromeMetrics', 'initSheets', 'isOpen', 'openSheet', 'sheetScroller']);
  assert.doesNotMatch(read('js/sheet.js'), /initDetentSheet|data-detent|\[data-detent/);
});

test('openSheet shows the modal, locks scroll, focuses the sheet title without a ring and emits sheet:open', () => {
  const doc = fakeDocument();
  const trigger = fakeFocusable(doc, 'trigger');
  doc.activeElement = trigger;
  const heading = fakeFocusable(doc, 'heading');
  const dialog = fakeDialog(doc, {heading});
  assert.equal(sheet.isOpen(dialog), false);
  sheet.openSheet(dialog);
  assert.equal(sheet.isOpen(dialog), true);
  assert.ok(doc.classes.has('sheet-open'));
  assert.equal(doc.activeElement, heading);
  assert.deepEqual(heading.focusCalls.at(-1), {preventScroll: true, focusVisible: false});
  assert.equal(dialog.events.at(-1).type, 'sheet:open');
  assert.equal(dialog.events.at(-1).detail.trigger, trigger, 'the active element is remembered as the trigger');
});

test('openSheet honours a data-sheet-focus selector and falls back to the title', () => {
  const doc = fakeDocument();
  const heading = fakeFocusable(doc, 'heading');
  const select = fakeFocusable(doc, 'select');
  const dialog = fakeDialog(doc, {heading, 'country-filter': select});
  sheet.openSheet(dialog, {focus: '#country-filter'});
  assert.equal(doc.activeElement, select);
  sheet.closeSheet(dialog);
  sheet.openSheet(dialog, {focus: '#missing'});
  assert.equal(doc.activeElement, heading);
});

test('closeSheet restores focus (returnFocus, then trigger, then #main), unlocks scroll and reports the reason', () => {
  const doc = fakeDocument();
  const main = fakeFocusable(doc, 'main');
  main.id = 'main';
  doc.byId = {main};
  const heading = fakeFocusable(doc, 'heading');
  const trigger = fakeFocusable(doc, 'trigger');
  const dialog = fakeDialog(doc, {heading});

  sheet.openSheet(dialog, {trigger});
  sheet.closeSheet(dialog, 'escape');
  assert.equal(sheet.isOpen(dialog), false);
  assert.ok(!doc.classes.has('sheet-open'));
  assert.equal(doc.activeElement, trigger);
  assert.deepEqual(trigger.focusCalls.at(-1), {preventScroll: true}, 'closing never scrolls the page (C-35)');
  assert.equal(dialog.events.at(-1).type, 'sheet:close');
  assert.equal(dialog.events.at(-1).detail.reason, 'escape');

  const card = fakeFocusable(doc, 'card');
  sheet.openSheet(dialog, {trigger, returnFocus: () => card});
  sheet.closeSheet(dialog, 'route');
  assert.equal(doc.activeElement, card, 'returnFocus wins when connected');

  const hidden = fakeFocusable(doc, 'hidden', {shown: false});
  sheet.openSheet(dialog, {trigger: hidden});
  sheet.closeSheet(dialog);
  assert.equal(doc.activeElement, main, 'an undisplayed trigger falls back to #main');
  assert.equal(dialog.events.at(-1).detail.reason, 'programmatic');

  sheet.closeSheet(dialog, 'button');
  assert.equal(dialog.events.filter(e => e.type === 'sheet:close').length, 3, 'closing a closed sheet is a no-op');
});

test('the scroll lock pads <html> by the removed scrollbar width, and only while a sheet is open', () => {
  const doc = fakeDocument();
  doc.defaultView = {innerWidth: 1440};
  doc.documentElement.clientWidth = 1425;
  const dialog = fakeDialog(doc, {heading: fakeFocusable(doc, 'heading')});
  sheet.openSheet(dialog);
  assert.equal(doc.documentElement.style.paddingInlineEnd, '15px');
  sheet.closeSheet(dialog, 'button');
  assert.equal(doc.documentElement.style.paddingInlineEnd, '');
  doc.documentElement.clientWidth = 1440;   // overlay scrollbars: nothing to compensate
  sheet.openSheet(dialog);
  assert.ok(!doc.documentElement.style.paddingInlineEnd);
  sheet.closeSheet(dialog, 'button');
});

test('scroll lock stays while another sheet is still open', () => {
  const doc = fakeDocument();
  const a = fakeDialog(doc, {heading: fakeFocusable(doc, 'heading')});
  const b = fakeDialog(doc, {heading: fakeFocusable(doc, 'heading')});
  sheet.openSheet(a);
  sheet.openSheet(b);
  sheet.closeSheet(b, 'button');
  assert.ok(doc.classes.has('sheet-open'));
  sheet.closeSheet(a, 'button');
  assert.ok(!doc.classes.has('sheet-open'));
});

test('sheetScroller returns .sheet-body when it scrolls and the dialog under max-height: 500px', () => {
  let overflow = 'auto';
  const body = {className: 'sheet-body'};
  const view = {getComputedStyle: el => (el === body ? {overflowY: overflow, overflow} : {})};
  const dialog = {ownerDocument: {defaultView: view}, querySelector: sel => (sel === ':scope > .sheet-body' ? body : null)};
  assert.equal(sheet.sheetScroller(dialog), body);
  overflow = 'visible';
  assert.equal(sheet.sheetScroller(dialog), dialog);
  const bare = {ownerDocument: {defaultView: view}, querySelector: () => null};
  assert.equal(sheet.sheetScroller(bare), bare, 'no body: the dialog scrolls');
  assert.equal(sheet.sheetScroller(null), null);
});

test('initChromeMetrics writes --header-h and --tabbar-h only for displayed elements', () => {
  const doc = fakeDocument();
  const header = {getClientRects: () => [1], getBoundingClientRect: () => ({height: 56.5})};
  let tabShown = true;
  const tabbar = {getClientRects: () => (tabShown ? [1] : []), getBoundingClientRect: () => ({height: 64})};
  doc.byId = {'site-header': header, 'tab-bar': tabbar};
  const observed = [];
  doc.defaultView = {ResizeObserver: class { constructor(cb) { this.cb = cb; } observe(el) { observed.push(el); } disconnect() {} },
    addEventListener() {}, removeEventListener() {}};
  const metrics = sheet.initChromeMetrics(doc);
  assert.deepEqual(observed, [header, tabbar]);
  assert.equal(doc.style.get('--header-h'), '56.5px');
  assert.equal(doc.style.get('--tabbar-h'), '64px');
  tabShown = false;
  metrics.refresh();
  assert.equal(doc.style.has('--tabbar-h'), false, 'a hidden tab bar falls back to the CSS default');
  assert.equal(sheet.initChromeMetrics(doc), metrics, 'idempotent per document');
  metrics.disconnect();
});

// ---------------------------------------------------------------------------------------------------------------
// initSheets delegation against a small element tree. The matcher covers the selectors sheet.js uses: tag, #id, .class,
// [attr], [attr="v"], :not([attr…]), selector lists, the descendant combinator and ':scope > x'.
function matchCompound(node, compound) {
  const m = compound.match(/^([a-z][\w-]*|\*)?((?:#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\(\[[^\]]+\]\))*)$/i);
  if (!m || !node?.tag) return false;
  if (m[1] && m[1] !== '*' && m[1].toLowerCase() !== node.tag) return false;
  for (const part of m[2].match(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:not\(\[[^\]]+\]\)/g) ?? []) {
    if (part[0] === '#') { if (node.id !== part.slice(1)) return false; continue; }
    if (part[0] === '.') { if (!node.classes.includes(part.slice(1))) return false; continue; }
    const negated = part.startsWith(':not(');
    const [, name, value] = (negated ? part.slice(6, -2) : part.slice(1, -1)).match(/^([\w-]+)(?:="([^"]*)")?$/);
    const has = node.hasAttribute(name) && (value === undefined || node.getAttribute(name) === value);
    if (has === negated) return false;
  }
  return true;
}
function matchesSelector(node, selector) {
  return selector.split(',').some(complex => {
    const parts = complex.trim().split(/\s+/);
    if (!matchCompound(node, parts.at(-1))) return false;
    let up = node.parentElement;
    for (let i = parts.length - 2; i >= 0; i -= 1) {
      while (up && !matchCompound(up, parts[i])) up = up.parentElement;
      if (!up) return false;
      up = up.parentElement;
    }
    return true;
  });
}
class FakeNode {
  constructor(doc, tag, attrs = {}, rect = {top: 0, left: 0, width: 100, height: 44}) {
    Object.assign(this, {ownerDocument: doc, tag, attrs: {...attrs}, children: [], parentElement: null, shown: true, focusCalls: [],
      events: [], scrollTop: 0, overflowY: 'visible', scrollPaddingTop: '0px', isConnected: true});
    this.place(rect);
  }
  place({top, left = 0, width = 100, height = 44}) { this.rect = {top, left, width, height, right: left + width, bottom: top + height}; return this; }
  get id() { return this.attrs.id ?? ''; }
  get classes() { return (this.attrs.class ?? '').split(/\s+/).filter(Boolean); }
  add(child) { child.parentElement = this; this.children.push(child); return child; }
  hasAttribute(name) { return name in this.attrs; }
  getAttribute(name) { return name in this.attrs ? this.attrs[name] : null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  matches(selector) { return matchesSelector(this, selector); }
  closest(selector) { for (let n = this; n?.tag; n = n.parentElement) if (n.matches(selector)) return n; return null; }
  contains(el) { for (let n = el; n; n = n.parentElement) if (n === this) return true; return false; }
  *descendants() { for (const c of this.children) { yield c; yield* c.descendants(); } }
  querySelectorAll(selector) {
    if (selector.startsWith(':scope >')) return this.children.filter(c => c.matches(selector.slice(8).trim()));
    return [...this.descendants()].filter(n => n.matches(selector));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  getClientRects() { return this.shown ? [this.rect] : []; }
  getBoundingClientRect() { return this.rect; }
  focus(options) { this.focusCalls.push(options); this.ownerDocument.activeElement = this; }
  dispatchEvent(event) { this.events.push(event); return true; }
  scrollIntoView(options) { this.scrolledWith = options; }
}
class FakeDialog extends FakeNode {
  get open() { return this.hasAttribute('open'); }
  showModal() { this.attrs.open = ''; }
  close() { delete this.attrs.open; }
}
function fakeDom({width = 390, height = 844} = {}) {
  const doc = {nodeType: 9, listeners: {}, classes: new Set()};
  doc.defaultView = {innerWidth: width, innerHeight: height,
    getComputedStyle: el => ({overflowY: el.overflowY, overflow: el.overflowY, overflowX: 'visible', scrollPaddingTop: el.scrollPaddingTop})};
  doc.documentElement = new FakeNode(doc, 'html');
  doc.documentElement.classList = {add: c => doc.classes.add(c), remove: c => doc.classes.delete(c)};
  doc.body = doc.documentElement.add(new FakeNode(doc, 'body'));
  doc.activeElement = doc.body;
  doc.getElementById = id => [...doc.documentElement.descendants()].find(n => n.id === id) ?? null;
  doc.querySelector = selector => doc.documentElement.querySelector(selector);
  doc.querySelectorAll = selector => doc.documentElement.querySelectorAll(selector);
  doc.addEventListener = (type, fn) => { (doc.listeners[type] ??= []).push(fn); };
  doc.removeEventListener = (type, fn) => { doc.listeners[type] = (doc.listeners[type] ?? []).filter(f => f !== fn); };
  doc.fire = (type, target, props = {}) => {
    const event = {type, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props};
    for (const fn of doc.listeners[type] ?? []) fn(event);
    return event;
  };
  const main = doc.body.add(new FakeNode(doc, 'main', {id: 'main', tabindex: '-1'}, {top: 120, height: 3000}));
  const title = main.add(new FakeNode(doc, 'h1', {id: 'latest-title', tabindex: '-1'}, {top: 140, height: 34}));
  const dialog = doc.body.add(new FakeDialog(doc, 'dialog', {id: 'filters-sheet', class: 'sheet sheet--filters'}, {top: 40, height: 804, width: 390}));
  const heading = dialog.add(new FakeNode(doc, 'h2', {id: 'filters-title', tabindex: '-1'}, {top: 50}));
  const body = dialog.add(new FakeNode(doc, 'div', {class: 'sheet-body'}, {top: 100, height: 680, width: 390}));
  body.overflowY = 'auto';
  const select = body.add(new FakeNode(doc, 'select', {id: 'country-filter'}, {top: 120}));
  return {doc, main, title, dialog, heading, body, select};
}
const closes = dialog => dialog.events.filter(e => e.type === 'sheet:close');

test('initSheets: openers open their sheet (trigger, data-sheet-focus); aria-disabled openers are ignored; idempotent per root', () => {
  const {doc, main, dialog, select} = fakeDom();
  const opener = main.add(new FakeNode(doc, 'button', {'data-open-sheet': 'filters-sheet', 'data-sheet-focus': '#country-filter'}));
  const icon = opener.add(new FakeNode(doc, 'svg'));
  const api = sheet.initSheets(doc);
  assert.equal(sheet.initSheets(doc), api);
  const click = doc.fire('click', icon);
  assert.ok(dialog.open && click.defaultPrevented);
  assert.equal(doc.activeElement, select, 'data-sheet-focus wins over the title');
  assert.equal(dialog.events.at(-1).detail.trigger, opener);
  sheet.closeSheet(dialog, 'button');
  assert.equal(doc.activeElement, opener);
  const disabled = main.add(new FakeNode(doc, 'button', {'data-open-sheet': 'filters-sheet', 'aria-disabled': 'true'}));
  const refused = doc.fire('click', disabled);
  assert.ok(!dialog.open && refused.defaultPrevented, 'an aria-disabled opener does nothing');
  api.destroy();
  doc.fire('click', icon);
  assert.ok(!dialog.open, 'destroy removes the listeners');
});

test('initSheets: a backdrop click closes only when press and release both fall outside the sheet box', () => {
  const {doc, dialog, heading} = fakeDom();
  const api = sheet.initSheets(doc);
  const tap = (down, up, target = dialog) => {
    doc.fire('pointerdown', dialog, {clientX: down[0], clientY: down[1]});
    doc.fire('click', target, {clientX: up[0], clientY: up[1]});
  };
  sheet.openSheet(dialog);
  tap([100, 200], [100, 10]);
  assert.ok(dialog.open, 'a drag that starts inside the sheet does not close it');
  tap([100, 10], [100, 200]);
  assert.ok(dialog.open, 'a release inside the sheet box does not close it');
  tap([100, 10], [100, 10], heading);
  assert.ok(dialog.open, 'a click on sheet content does not close it');
  tap([100, 10], [120, 12]);
  assert.ok(!dialog.open);
  assert.equal(closes(dialog).at(-1).detail.reason, 'backdrop');
  api.destroy();
});

test('initSheets: Escape closes with reason escape; [data-close-sheet] buttons close with button; links with link and navigate', () => {
  const {doc, main, dialog} = fakeDom();
  const api = sheet.initSheets(doc);
  sheet.openSheet(dialog);
  const cancel = doc.fire('cancel', dialog);
  assert.ok(cancel.defaultPrevented && !dialog.open);
  assert.equal(closes(dialog).at(-1).detail.reason, 'escape');

  const button = dialog.add(new FakeNode(doc, 'button', {'data-close-sheet': ''}));
  sheet.openSheet(dialog);
  assert.ok(doc.fire('click', button).defaultPrevented);
  assert.equal(closes(dialog).at(-1).detail.reason, 'button');

  const link = dialog.add(new FakeNode(doc, 'a', {href: '#/ahead/roadmap', 'data-close-sheet': ''}));
  sheet.openSheet(dialog);
  const follow = doc.fire('click', link);
  assert.ok(!dialog.open && !follow.defaultPrevented, 'the link closes the sheet and keeps its navigation (C-47)');
  assert.equal(closes(dialog).at(-1).detail.reason, 'link');

  const named = main.add(new FakeNode(doc, 'button', {'data-close-sheet': 'filters-sheet'}));
  sheet.openSheet(dialog);
  doc.fire('click', named);
  assert.ok(!dialog.open, 'data-close-sheet="<id>" closes that sheet from outside it');
  api.destroy();
});

test('initSheets: data-scroll-to scrolls the sheet scroller (honouring scroll-padding) or the page, then focuses the target', () => {
  const {doc, main, dialog, body} = fakeDom();
  const api = sheet.initSheets(doc);
  body.scrollTop = 50;
  body.scrollPaddingTop = '52px';
  const section = body.add(new FakeNode(doc, 'section', {id: 'rec-state'}, {top: 400}));
  const cell = body.add(new FakeNode(doc, 'button', {'data-scroll-to': 'rec-state'}));
  sheet.openSheet(dialog);
  assert.ok(doc.fire('click', cell).defaultPrevented);
  assert.equal(body.scrollTop, 50 + (400 - 100) - 52, 'block start under the 52 px padding');
  assert.equal(section.getAttribute('tabindex'), '-1');
  assert.equal(doc.activeElement, section);
  assert.deepEqual(section.focusCalls.at(-1), {preventScroll: true});
  body.overflowY = 'visible';   // max-height: 500px: the dialog itself scrolls (C-42)
  dialog.scrollTop = 0;
  section.place({top: 900});
  doc.fire('click', cell);
  assert.equal(dialog.scrollTop, 900 - 40);
  sheet.closeSheet(dialog);
  const target = main.add(new FakeNode(doc, 'section', {id: 'roadmap-item-x', tabindex: '-1'}, {top: 2000}));
  const jump = main.add(new FakeNode(doc, 'a', {href: '#/ahead/roadmap', 'data-scroll-to': 'roadmap-item-x'}));
  doc.fire('click', jump);
  assert.deepEqual(target.scrolledWith, {block: 'start', behavior: 'auto'});
  assert.equal(doc.activeElement, target);
  api.destroy();
});

test('initSheets: a late close event from a sheet closed and reopened in one task does not close the new session', () => {
  const {doc, main, dialog} = fakeDom();
  const api = sheet.initSheets(doc);
  const first = main.add(new FakeNode(doc, 'button', {id: 'first'}, {top: 200}));
  const second = main.add(new FakeNode(doc, 'button', {id: 'second'}, {top: 300}));
  sheet.openSheet(dialog, {trigger: first});
  sheet.closeSheet(dialog, 'button');
  sheet.openSheet(dialog, {trigger: second});
  doc.fire('close', dialog);   // the native event of the first close arrives now
  assert.ok(dialog.open);
  assert.equal(closes(dialog).length, 1, 'no spurious sheet:close');
  assert.ok(doc.classes.has('sheet-open'));
  doc.fire('cancel', dialog);
  assert.equal(doc.activeElement, second, 'the reopened session kept its trigger');
  sheet.openSheet(dialog, {trigger: first});
  dialog.close();   // closed without closeSheet (form method=dialog)
  doc.fire('close', dialog);
  assert.equal(closes(dialog).at(-1).detail.reason, 'programmatic');
  assert.equal(doc.activeElement, first);
  assert.ok(!doc.classes.has('sheet-open'));
  api.destroy();
});

test('closing never sends focus to an off-screen returnFocus target: the shown view title takes it (WCAG 2.4.11, C-35)', () => {
  const {doc, main, title, dialog} = fakeDom();
  const card = main.add(new FakeNode(doc, 'a', {href: '#/record/fj-x'}, {top: 7223}));
  sheet.openSheet(dialog, {returnFocus: () => card});   // deep link: no trigger
  sheet.closeSheet(dialog, 'escape');
  assert.equal(doc.activeElement, title);
  assert.deepEqual(title.focusCalls.at(-1), {preventScroll: true}, 'still no scroll on close');
  card.place({top: 400});
  sheet.openSheet(dialog, {returnFocus: () => card});
  sheet.closeSheet(dialog, 'escape');
  assert.equal(doc.activeElement, card, 'an on-screen returnFocus target wins');
  const trigger = main.add(new FakeNode(doc, 'button', {}, {top: 5000}));
  card.place({top: 7223});
  sheet.openSheet(dialog, {trigger, returnFocus: () => card});
  sheet.closeSheet(dialog, 'escape');
  assert.equal(doc.activeElement, trigger, 'the original trigger is kept even when it has scrolled away');
  title.shown = false;
  doc.activeElement = doc.body;
  sheet.openSheet(dialog, {returnFocus: () => card});
  sheet.closeSheet(dialog, 'escape');
  assert.equal(doc.activeElement, main, 'no shown title: #main');
});
