import {completionKind} from './history.js';

export const MAP_WIDTH = 1000, MAP_HEIGHT = 448, MAP_PADDING = 8;
export const ZOOM_MIN = 1, ZOOM_MAX = 12, ZOOM_STEP = 1.6, FOCUS_FILL = 0.7;
export const FIT_EXCLUDE = ['AQ'];
export const REGION_VIEWS = {Africa: [[-19, -36], [53, 38]], Americas: [[-170, -56], [-30, 72]], Asia: [[25, -11], [150, 56]],
  Europe: [[-25, 34], [45, 71]], Oceania: [[110, -48], [180, 0]]};
export const MAP_ASSETS = Object.freeze({topology: 'public/world-110m.topo.json', codes: 'public/world-map-codes.json',
  d3: 'vendor/d3.v7.9.0.min.js', topojson: 'vendor/topojson-client.v3.1.0.min.js'});
export const MAP_HELP = 'Arrow keys move between countries with reports in view; Enter selects; the country filter and directory list every territory.';
// CSS px at every zoom; CLEAR = the stage rows that hold the overlay controls.
const DOT = 3.5, HIT = 12, LABEL = 12, GAP = 4, SHADOW = 1.6, HATCH = 6, TILE = 8, ROW = 48, CLEAR = 60;
const W = MAP_WIDTH, H = MAP_HEIGHT;
const finite = list => list.every(Number.isFinite);

export function groupRecordsByCountry(events = []) {
  const groups = new Map();
  for (const event of events) {
    if (!event || !/^[A-Z]{2}$/.test(event.country ?? '')) continue;
    if (!groups.has(event.country)) groups.set(event.country, []);
    groups.get(event.country).push(event);
  }
  return groups;
}

export function countRecordsByCountry(events = []) {
  return Object.fromEntries([...groupRecordsByCountry(events)].map(([code, records]) => [code, records.length]));
}

export function attachCodes(features = [], codes = {}) {
  const table = codes && typeof codes === 'object' ? codes : {};
  return (features ?? []).map(f => {
    const id = f?.id == null ? null : String(f.id);
    const raw = id !== null && Object.hasOwn(table, id) ? table[id] : null;
    return {...f, properties: {...f?.properties, code: /^[A-Z]{2}$/.test(raw ?? '') ? raw : null, name: f?.properties?.name ?? ''}};
  });
}

export function ringParts(rings = []) {
  return (rings ?? []).filter(r => Array.isArray(r) && r.length > 2).map(ring => {
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
    return {area: Math.abs(area) / 2, bounds: [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]};
  }).filter(p => finite([p.area, ...p.bounds.flat()]));
}

export function focusParts(parts, {ratio = 0.5, maxPartWidth = W / 2} = {}) {
  const pool = (parts ?? []).filter(p => p?.area > 0 && Array.isArray(p.bounds) && finite(p.bounds.flat()) && p.bounds[1][0] - p.bounds[0][0] <= maxPartWidth);
  if (!pool.length) return null;
  const big = pool.reduce((a, b) => (b.area > a.area ? b : a));
  const [[lx0, ly0], [lx1, ly1]] = big.bounds;
  const reach = Math.max(lx1 - lx0, ly1 - ly0);
  let [x0, y0, x1, y1] = [lx0, ly0, lx1, ly1];
  for (const {area, bounds: [[a0, b0], [a1, b1]]} of pool) {
    if (area < ratio * big.area || Math.max(0, a0 - lx1, lx0 - a1, b0 - ly1, ly0 - b1) > reach) continue;
    x0 = Math.min(x0, a0); y0 = Math.min(y0, b0); x1 = Math.max(x1, a1); y1 = Math.max(y1, b1);
  }
  return [[x0, y0], [x1, y1]];
}

export function focusTransform(bounds, {width = W, height = H, fill = FOCUS_FILL, min = ZOOM_MIN, max = ZOOM_MAX} = {}) {
  if (!Array.isArray(bounds) || bounds.length !== 2 || !finite(bounds.flat())) return null;
  const [[x0, y0], [x1, y1]] = bounds;
  const extent = Math.max(Math.max(0, x1 - x0) / width, Math.max(0, y1 - y0) / height);
  const k = Math.min(max, Math.max(min, extent > 0 ? fill / extent : max));
  return {k, x: width / 2 - k * (x0 + x1) / 2, y: height / 2 - k * (y0 + y1) / 2};
}

export function zoomButtonState({scale, min = ZOOM_MIN, max = ZOOM_MAX} = {}) {
  const s = Number.isFinite(scale) ? scale : min;
  return {zoomIn: s < max - 1e-3, zoomOut: s > min + 1e-3, reset: s > min + 1e-3};
}

export function readingOrder(items = []) {
  return [...items].sort((a, b) => Math.floor(a.cy / ROW) - Math.floor(b.cy / ROW) || a.cx - b.cx || String(a.code).localeCompare(b.code));
}

export function nextInDirection(items, fromCode, key) {
  const list = (items ?? []).filter(i => i?.code && Number.isFinite(i.cx) && Number.isFinite(i.cy));
  if (!list.length) return null;
  const ordered = readingOrder(list);
  if (key === 'Home') return ordered[0].code;
  if (key === 'End') return ordered.at(-1).code;
  const from = list.find(i => i.code === fromCode);
  const dir = {ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1]}[key];
  if (!from) return ordered[0].code;
  let best = null, bestScore = Infinity;
  for (const item of dir ? list : []) {
    const dx = item.cx - from.cx, dy = item.cy - from.cy, along = dx * dir[0] + dy * dir[1];
    const score = along + 2 * Math.abs(dx * dir[1] - dy * dir[0]);
    if (item !== from && along > 0 && (score < bestScore - 1e-9 || (score - bestScore <= 1e-9 && item.code < best.code))) [best, bestScore] = [item, score];
  }
  return best?.code ?? from.code;
}

export function gestureFilter(event, mode = 'page') {
  const type = event?.type;
  if (type === 'dblclick') return false;
  if (type === 'wheel') return mode === 'map' || !!event.ctrlKey;
  if (type === 'touchstart') return mode === 'map' || (event.touches?.length ?? 0) > 1;
  return !event?.ctrlKey && !event?.button;
}

export function placeLabels(items = [], {width = Infinity, height = Infinity, gap = GAP, lineHeight = 16, obstacles = []} = {}) {
  const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  const dots = items.map(i => [i.x - i.r - 1, i.y - i.r - 1, 2 * i.r + 2, 2 * i.r + 2]);
  const placed = [...obstacles];
  return new Map(items.map((i, n) => {
    const y = i.y - lineHeight / 2;
    for (const [side, x] of [['right', i.x + i.r + gap], ['left', i.x - i.r - gap - i.w]]) {
      const box = [x, y, i.w, lineHeight];
      if (x < 0 || y < 0 || x + i.w > width || y + lineHeight > height || placed.some(p => hit(p, box))
        || dots.some((d, j) => j !== n && (!i.free || items[j].free) && hit(d, box))) continue;
      placed.push(box);
      return [i.id, side];
    }
    return [i.id, null];
  }));
}

let instances = 0, dependencies = null, measurer = null;
const assetURL = path => new URL(path, import.meta.url).href;

function loadScript(path, name) {
  if (globalThis[name]) return Promise.resolve(globalThis[name]);
  return new Promise((resolve, reject) => {
    const script = Object.assign(document.createElement('script'), {src: assetURL(path), async: true});
    script.onload = () => (globalThis[name] ? resolve(globalThis[name]) : reject(new Error(name)));
    script.onerror = () => { script.remove(); reject(new Error(name)); };
    document.head.append(script);
  });
}
async function assetJSON(path) {
  const response = await fetch(assetURL(path));
  if (!response.ok) throw new Error(path);
  return response.json();
}
function textWidth(text, font) {
  try { measurer ??= document.createElement('canvas').getContext('2d'); measurer.font = font; return measurer.measureText(text).width; }
  catch { return text.length * LABEL * 0.58; }
}

export async function createWorldMap({container, tooltip = null, onSelect = () => {}, onSelectCity = () => {}, onHover = () => {},
  gestures = 'page', reducedMotion = () => false, describe = () => ''} = {}) {
  if (!container) throw new Error('A map container is required');
  const n = ++instances, doc = container.ownerDocument;
  let state = {events: [], countries: [], selectedCountry: '', mode: 'reported', loading: true, error: false, contexts: null, cityGeography: null};
  let mode = gestures === 'map' ? 'map' : 'page', ready = false, destroyed = false;
  let records = new Map(), names = new Map(), candidates = new Set(), cities = [], sides = new Map();
  const byCode = new Map(), frames = new Map(), centres = new Map(), drawn = new Set(), widths = new Map();
  let d3, svg, zoomLayer, cityLayer, labelLayer, overlay, countries, zoom, shadow, effect, dotEffect, pattern, projection, observer;
  let t = null, unit = 1, box = {width: 0, height: 0}, rover = null, lastSelected = null, focused = null, tipShown = false, font = '';

  container.replaceChildren();
  const help = Object.assign(doc.createElement('p'), {id: 'map-help', className: 'visually-hidden', textContent: MAP_HELP});
  const status = Object.assign(doc.createElement('p'), {className: 'map-status', textContent: 'Loading the world map…'});
  status.setAttribute('role', 'status');
  container.append(help, status);
  Object.assign(container.dataset, {mapState: 'loading', mode: 'reported', gestures: mode});
  const dispatch = (name, detail) => container.dispatchEvent(new CustomEvent(name, {detail}));
  const pointerHover = e => e?.pointerType === 'mouse' || e?.pointerType === 'pen';
  const visible = c => c.country === state.selectedCountry || t.k >= 3;

  function hideTip() {
    if (!tipShown) return;
    tipShown = false;
    if (tooltip) { tooltip.hidden = true; tooltip.replaceChildren(); tooltip.removeAttribute('data-kind'); }
    onHover(null);
  }
  // 1.4.13: Escape dismisses a hover tooltip wherever focus is, not only on a focused country.
  const onEscape = e => { if (e.key === 'Escape' && tipShown) hideTip(); };
  doc.addEventListener('keydown', onEscape);
  function showTip(title, text, x, y) {
    tipShown = true;
    if (!tooltip) return;
    const el = (tag, textContent) => Object.assign(doc.createElement(tag), {textContent});
    tooltip.replaceChildren(el('strong', title), ...(text ? [el('span', text)] : []));
    tooltip.dataset.kind = 'info';
    tooltip.hidden = false;
    const frame = (tooltip.offsetParent || container).getBoundingClientRect();
    const clamp = (v, size, room) => `${Math.max(8, Math.min(room - size - 8, v + 14))}px`;
    tooltip.style.left = clamp(x - frame.left, tooltip.offsetWidth, frame.width);
    tooltip.style.top = clamp(y - frame.top, tooltip.offsetHeight, frame.height);
  }

  function measure() {
    const rect = svg?.node().getBoundingClientRect();
    if (!rect?.width || !rect.height) return false;
    box = rect;
    unit = Math.min(rect.width / W, rect.height / H);
    return true;
  }
  function view() {
    const vw = box.width ? box.width / unit : W, vh = box.height ? box.height / unit : H;
    return {x: (W - vw) / 2, y: (H - vh) / 2, width: vw, height: vh};
  }
  const at = ([x, y]) => [t.x + t.k * x, t.y + t.k * y];
  function toScreen(p) {
    const v = view(), [x, y] = at(p);
    return [(x - v.x) * unit, (y - v.y) * unit];
  }
  function move(next) {
    const target = zoom.constrain()(d3.zoomIdentity.translate(next.x, next.y).scale(next.k), [[0, 0], [W, H]], [[0, 0], [W, H]]);
    svg.interrupt().transition().duration(reducedMotion() ? 0 : 450).call(zoom.transform, target);
  }
  function scaleBy(factor) { if (ready) svg.interrupt().transition().duration(reducedMotion() ? 0 : 200).call(zoom.scaleBy, factor, [W / 2, H / 2]); }
  function zoomed(next) {
    t = next;
    zoomLayer.attr('transform', next);
    svg.attr('data-zoom', next.k.toFixed(2));
    hideTip();
    scaleMarks();
    dispatch('mapzoom', {scale: next.k, min: ZOOM_MIN, max: ZOOM_MAX});
  }
  function scaleMarks() {
    if (!t) return;
    const s = 1 / (t.k * unit), u = 1 / unit, v = view(), left = c => sides.get(c.id) === 'left';
    effect.attr('dx', SHADOW * s).attr('dy', SHADOW * s);
    shadow.attr('x', (v.x - t.x) / t.k - 4 * s).attr('y', (v.y - t.y) / t.k - 4 * s).attr('width', v.width / t.k + 8 * s).attr('height', v.height / t.k + 8 * s);
    dotEffect.attr('dx', SHADOW * u).attr('dy', SHADOW * u);
    pattern.attr('patternTransform', `scale(${HATCH * s / TILE})`);
    overlay.selectAll('circle').attr('r', HIT * s);
    cityLayer.attr('data-visible', String(cities.some(visible)));
    cityLayer.selectAll('g').attr('display', c => (visible(c) ? null : 'none')).attr('transform', c => `translate(${at(c.xy)})`);
    cityLayer.selectAll('.city-point').attr('r', DOT * u);
    cityLayer.selectAll('.city-hit').attr('r', HIT * u);
    labelLayer.selectAll('text').attr('font-size', LABEL * u).attr('stroke-width', 3 * u)
      .attr('display', c => (visible(c) && sides.get(c.id) ? null : 'none')).attr('text-anchor', c => (left(c) ? 'end' : 'start'))
      .attr('x', c => at(c.xy)[0] + (left(c) ? -1 : 1) * (DOT + GAP) * u).attr('y', c => at(c.xy)[1]);
  }
  function place() {
    if (!t) return;
    const selected = state.selectedCountry, label = labelLayer.select('text').node();
    if (!font && label) font = `600 ${LABEL}px ${getComputedStyle(label).fontFamily}`;
    const width = name => widths.get(name) ?? widths.set(name, textWidth(name, font)).get(name);
    const shown = cities.filter(visible).sort((a, b) => (b.country === selected) - (a.country === selected) || b.count - a.count || a.name.localeCompare(b.name));
    sides = placeLabels(shown.map(c => { const [x, y] = toScreen(c.xy); return {id: c.id, x, y, r: DOT, w: width(c.name), free: c.country === selected}; }),
      {width: box.width, height: box.height, obstacles: [[box.width - 200, 0, 200, CLEAR], [0, box.height - CLEAR, 180, CLEAR]]});
    scaleMarks();
  }

  function items() { return [...candidates].map(code => ({code, ...centres.get(code)})).filter(i => Number.isFinite(i.cx)); }
  function setRover(code) {
    rover = code;
    for (const c of candidates) byCode.get(c).node.setAttribute('tabindex', c === rover ? '0' : '-1');
  }
  function paint() {
    const off = state.loading || state.error;
    records = off ? new Map() : groupRecordsByCountry(state.events);
    names = new Map((state.countries ?? []).filter(c => c?.code).map(c => [c.code, c.name]));
    Object.assign(container.dataset, {mode: state.mode === 'example' ? 'example' : 'reported', mapState: state.error ? 'data-error' : state.loading ? 'data-loading' : 'ready'});
    const selected = /^[A-Z]{2}$/.test(state.selectedCountry ?? '') ? state.selectedCountry : '';
    candidates = new Set([...records.keys(), ...(state.error ? [] : [selected])].filter(code => drawn.has(code)));
    if (selected !== lastSelected && candidates.has(selected)) rover = selected;
    lastSelected = selected;
    if (!candidates.has(rover)) rover = candidates.has(selected) ? selected : readingOrder(items())[0]?.code ?? null;
    countries.each(function paintCountry({properties: {code, name}}) {
      const list = records.get(code), candidate = candidates.has(code);
      const attrs = {'data-has-records': String(!!list), 'data-selected': String(!!code && code === selected), 'data-completion': list ? completionKind(list) : 'none',
        tabindex: candidate ? (code === rover ? '0' : '-1') : null, role: candidate ? 'button' : null,
        'aria-label': candidate ? `${names.get(code) || code}. ${describe(code)}`.trim() : null,
        'aria-current': candidate && code === selected ? 'true' : null, 'aria-hidden': candidate ? null : 'true'};
      for (const [key, value] of Object.entries(attrs)) value === null ? this.removeAttribute(key) : this.setAttribute(key, value);
    });
    paintCities(off);
    // C-17 selection (rings round the city points when there is no polygon), before any C-40 focus ring.
    overlay.selectAll('.map-selection-halo, .map-selection').remove();
    const d = !off && byCode.get(selected)?.d, dots = d ? [] : cities.filter(c => c.country === selected);
    for (const cls of ['map-selection-halo', 'map-selection']) {
      if (d) overlay.insert('path', '.map-focus-halo').attr('class', cls).attr('d', d);
      for (const c of dots) overlay.insert('circle', '.map-focus-halo').attr('class', cls).attr('cx', c.xy[0]).attr('cy', c.xy[1]);
    }
    if (focused && !candidates.has(focused)) ring(null);
    place();
    status.hidden = true;
    hideTip();
  }
  function ring(code) {
    focused = code;
    overlay.selectAll('.map-focus-halo, .map-focus-ring').remove();
    const d = byCode.get(code)?.d;
    for (const cls of d ? ['map-focus-halo', 'map-focus-ring'] : []) overlay.append('path').attr('class', cls).attr('d', d);
  }
  function reveal(code) {
    const c = centres.get(code);
    if (!c || !t) return;
    const [x, y] = toScreen([c.cx, c.cy]);
    if (x < 24 || y < 24 || x > box.width - 24 || y > box.height - 24) move({k: t.k, x: W / 2 - t.k * c.cx, y: H / 2 - t.k * c.cy});
  }
  function choose(code) {
    if (!code) return;
    hideTip();
    onSelect(code);
  }

  function paintCities(off) {
    const places = new Map((off ? [] : state.cityGeography?.places ?? []).map(p => [p.id, p]));
    const contexts = new Map((state.contexts?.records ?? []).map(r => [r.event_id, r]));
    const grouped = new Map();
    for (const event of state.events ?? []) {
      for (const {name} of contexts.get(event.id)?.cities ?? []) {
        const id = `${event.country}:${name}`, place = places.get(id), xy = place && projection([place.lon, place.lat]);
        if (!xy || !finite(xy)) continue;
        const c = grouped.get(id) ?? grouped.set(id, {id, country: event.country, name, xy, count: 0, ended: false}).get(id);
        c.count++;
        c.ended ||= event.status === 'ended';
      }
    }
    cities = [...grouped.values()];
    cityLayer.selectAll('g').data(cities, c => c.id).join(enter => {
      const g = enter.append('g').attr('class', 'city');
      g.append('circle').attr('class', 'city-hit')
        .on('click', (e, c) => { e.stopPropagation(); hideTip(); onSelectCity(c.country, c.name); })
        .on('pointerenter pointermove', (e, c) => { if (pointerHover(e)) showTip(c.name, 'City reference point (approximate). Not a protest site', e.clientX, e.clientY); })
        .on('pointerleave', hideTip);
      g.append('circle').attr('class', 'city-point');
      return g;
    }).attr('data-city', c => c.id).attr('data-country', c => c.country)
      .select('.city-point').attr('data-city', c => c.id).attr('data-ended', c => String(c.ended));
    labelLayer.selectAll('text').data(cities, c => c.id).join(enter => enter.append('text').attr('class', 'city-label').attr('dy', '.35em'))
      .attr('data-city', c => c.id).text(c => c.name);
  }
  function frame(bounds, options = {}) {
    if (!ready || !bounds) return false;
    const room = box.height > 2 * CLEAR ? (box.height - 2 * CLEAR) / unit / Math.max(1e-6, bounds[1][1] - bounds[0][1]) : ZOOM_MAX;
    const next = focusTransform(bounds, {...options, max: Math.max(ZOOM_MIN, Math.min(options.max ?? ZOOM_MAX, room))});
    if (next) move(next);
    return !!next;
  }

  const api = {
    get ready() { return ready; },
    update(next = {}) { state = {...state, ...next}; if (ready) paint(); },
    reset() { frame([[0, 0], [W, H]], {fill: 1}); },
    zoomIn() { scaleBy(ZOOM_STEP); },
    zoomOut() { scaleBy(1 / ZOOM_STEP); },
    hasCountry: code => ready && byCode.has(code),
    focusCountry: code => frame(frames.get(code)),
    focusRegion(name) {
      if (!ready || !Object.hasOwn(REGION_VIEWS, name)) return false;
      const [[lon0, lat0], [lon1, lat1]] = REGION_VIEWS[name], points = [];
      for (let i = 0; i <= 8; i++) {
        const lon = lon0 + (lon1 - lon0) * i / 8, lat = lat0 + (lat1 - lat0) * i / 8;
        points.push(...[[lon, lat0], [lon, lat1], [lon0, lat], [lon1, lat]].map(projection).filter(p => p && finite(p)));
      }
      const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
      return frame([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], {fill: 1});
    },
    setGestures(next) {
      mode = next === 'map' ? 'map' : 'page';
      container.dataset.gestures = mode;
      svg?.style('touch-action', mode === 'map' ? 'none' : 'pan-y');
      dispatch('mapgestures', {mode});
    },
    getZoom: () => ({scale: t?.k ?? ZOOM_MIN, min: ZOOM_MIN, max: ZOOM_MAX}),
    destroy() {
      destroyed = true;
      ready = false;
      doc.removeEventListener('keydown', onEscape);
      observer?.disconnect();
      svg?.interrupt();
      hideTip();
      container.replaceChildren();
    },
  };

  try {
    if (!dependencies) (dependencies = Promise.all([loadScript(MAP_ASSETS.d3, 'd3'), loadScript(MAP_ASSETS.topojson, 'topojson')])).catch(() => { dependencies = null; });
    const [[lib, topojson], topology, codes] = await Promise.all([dependencies, assetJSON(MAP_ASSETS.topology), assetJSON(MAP_ASSETS.codes)]);
    if (destroyed) return api;
    d3 = lib;
    if (!topology?.objects?.countries || typeof codes?.codes !== 'object') throw new Error('Invalid map geometry');
    const features = attachCodes(topojson.feature(topology, topology.objects.countries).features, codes.codes);
    projection = d3.geoEqualEarth().fitExtent([[MAP_PADDING, MAP_PADDING], [W - MAP_PADDING, H - MAP_PADDING]],
      {type: 'FeatureCollection', features: features.filter(f => !FIT_EXCLUDE.includes(f.properties.code))}).clipExtent([[0, 0], [W, H]]);
    const path = d3.geoPath(projection);
    svg = d3.select(container).append('svg').attr('class', 'map-svg').attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'group').attr('aria-labelledby', doc.getElementById('map-title') ? 'map-title' : null).attr('aria-describedby', 'map-help')
      .style('touch-action', mode === 'map' ? 'none' : 'pan-y');
    const defs = svg.append('defs');
    pattern = defs.append('pattern').attr('id', `map-no-records-${n}`).attr('class', 'map-no-records-pattern').attr('patternUnits', 'userSpaceOnUse').attr('width', TILE).attr('height', TILE);
    pattern.append('rect').attr('width', TILE).attr('height', TILE);
    pattern.append('path').attr('d', 'M-2,2L2,-2M0,8L8,0M6,10L10,6');
    container.style.setProperty('--map-gap-fill', `url(#map-no-records-${n})`);
    const filter = (id, attrs) => {
      const f = defs.append('filter').attr('id', `${id}-${n}`).attr('class', 'map-shadow-def').attr('color-interpolation-filters', 'sRGB');
      for (const [key, value] of Object.entries(attrs)) f.attr(key, value);
      container.style.setProperty(`--${id}-filter`, `url(#${id}-${n})`);
      return [f, f.append('feDropShadow').attr('stdDeviation', 0)];
    };
    [shadow, effect] = filter('map-shadow', {filterUnits: 'userSpaceOnUse'});
    // Dots use a bounding-box region, which follows each dot's translated user space.
    dotEffect = filter('map-city-shadow', {x: '-50%', y: '-50%', width: '200%', height: '200%'})[1];

    zoomLayer = svg.append('g').attr('class', 'map-zoom-layer');
    zoomLayer.append('path').datum(d3.geoGraticule10()).attr('class', 'map-graticule').attr('d', path).attr('aria-hidden', 'true');
    const countryLayer = zoomLayer.append('g').attr('class', 'map-countries');
    countries = countryLayer.selectAll('path').data(features).join('path').attr('class', 'map-country').attr('data-country', f => f.properties.code ?? '').attr('d', path);
    countries.each(function index(feature) {
      const code = feature.properties.code, d = this.getAttribute('d');
      if (!code) return;
      byCode.set(code, {feature, node: this, d});
      if (!d) return;
      drawn.add(code);
      const rings = [];
      d3.geoPath(projection, {moveTo(x, y) { rings.push([[x, y]]); }, lineTo(x, y) { rings.at(-1).push([x, y]); }, closePath() {}, arc() {}})(feature);
      const cluster = focusParts(ringParts(rings));
      if (cluster) {
        frames.set(code, cluster);
        centres.set(code, {cx: (cluster[0][0] + cluster[1][0]) / 2, cy: (cluster[0][1] + cluster[1][1]) / 2});
      }
    });
    zoomLayer.append('path').datum(topojson.mesh(topology, topology.objects.countries, (a, b) => a !== b)).attr('class', 'map-borders').attr('d', path).attr('aria-hidden', 'true');
    overlay = zoomLayer.append('g').attr('class', 'map-overlay').attr('aria-hidden', 'true');
    cityLayer = svg.append('g').attr('class', 'map-city-points').attr('aria-hidden', 'true');
    labelLayer = svg.append('g').attr('class', 'map-labels').attr('aria-hidden', 'true');

    countries.on('click', (e, f) => choose(f.properties.code))
      .on('pointerenter pointermove', (e, {properties: {code, name}}) => {
        if (pointerHover(e)) { showTip(names.get(code) || code || name, describe(code), e.clientX, e.clientY); onHover(code); }
      })
      .on('pointerleave', hideTip);
    // On the container: Blink makes an SVG element with focus listeners focusable.
    const country = e => (countryLayer.node().contains(e.target) ? e.target.getAttribute('data-country') : null);
    container.addEventListener('focusin', e => {
      const code = country(e);
      if (!candidates.has(code)) return;
      setRover(code);
      // The C-40 ring marks keyboard focus only.
      if (!e.target.matches(':focus-visible')) return;
      ring(code);
      reveal(code);
    });
    container.addEventListener('focusout', e => { if (country(e)) ring(null); });
    container.addEventListener('keydown', e => {
      const code = country(e);
      if (!code) return;
      if (/^(Arrow(Left|Right|Up|Down)|Home|End)$/.test(e.key)) {
        e.preventDefault();
        const next = nextInDirection(items(), code, e.key);
        if (next !== code && byCode.has(next)) { setRover(next); byCode.get(next).node.focus({preventScroll: true}); }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(code);
      } else if (e.key === 'Escape') hideTip();
    });

    zoom = d3.zoom().extent([[0, 0], [W, H]]).translateExtent([[0, 0], [W, H]]).scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .filter(e => gestureFilter(e, mode)).on('zoom', e => zoomed(e.transform)).on('end', place);
    svg.call(zoom).on('dblclick.zoom', null);
    measure();
    if (typeof ResizeObserver === 'function') (observer = new ResizeObserver(() => measure() && place())).observe(svg.node());
    ready = true;
    zoomed(d3.zoomIdentity);
    paint();
    dispatch('mapready', {mappedCountries: drawn.size, featureCount: features.length});
  } catch (error) {
    observer?.disconnect();
    svg?.remove();
    svg = null;
    ready = false;
    status.hidden = false;
    status.textContent = '';
    container.dataset.mapState = 'unavailable';
    dispatch('maperror', {message: error?.message ?? String(error)});
  }
  return api;
}
