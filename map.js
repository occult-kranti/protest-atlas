/* Local D3 / Natural Earth map. Counts describe the index, never protest severity. */
const WIDTH = 1000;
const HEIGHT = 530;
const COLORS = { ocean: '#f3f6f3', land: '#d9ded8', reported: '#c78d43', example: '#bcaed0', selected: '#174e4a', border: '#f5f5ee', grid: '#cbd4cd', outline: '#c4cec6' };
let mapInstance = 0;
const asset = (path) => new URL(path, import.meta.url).href;
let dependencies;

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

function loadScript(path, globalName) {
  if (globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = asset(path);
    script.async = true;
    script.onload = () => globalThis[globalName] ? resolve(globalThis[globalName]) : reject(new Error(`Missing ${globalName} export`));
    script.onerror = () => { script.remove(); reject(new Error(`Could not load local ${globalName}`)); };
    document.head.append(script);
  });
}

async function loadDependencies() {
  if (!dependencies) {
    dependencies = Promise.all([loadScript('vendor/d3.v7.9.0.min.js', 'd3'), loadScript('vendor/topojson-client.v3.1.0.min.js', 'topojson')]);
    dependencies.catch(() => { dependencies = null; });
  }
  return dependencies;
}

async function localJSON(path) {
  const response = await fetch(asset(path));
  if (!response.ok) throw new Error(`Map asset unavailable: ${path}`);
  return response.json();
}

export async function createWorldMap({ container, tooltip, onSelect = () => {}, onHover = () => {} }) {
  if (!container) throw new Error('A map container is required');
  container.replaceChildren();
  let state = { events: [], countries: [], selectedCountry: '', mode: 'reported', loading: true, error: false };
  let records = new Map();
  let svg, viewport, countries, d3, projection, path, zoom, transform;
  let features = [];
  const emptyPattern = `map-no-records-${++mapInstance}`;
  let hovered = null;
  const status = document.createElement('p');
  status.className = 'map-status';
  status.setAttribute('role', 'status');
  container.append(status);
  container.dataset.mapState = 'loading';
  status.textContent = 'Loading the world map…';

  function dispatch(name, detail) { container.dispatchEvent(new CustomEvent(name, { detail })); }
  function hideTooltip() {
    hovered = null;
    if (tooltip) { tooltip.hidden = true; tooltip.replaceChildren(); }
    onHover(null);
  }
  function countryName(feature) {
    return state.countries.find((country) => country.code === feature.properties.code)?.name || feature.properties.name;
  }
  function countText(feature) {
    if (state.loading || state.error) return state.error ? 'Published coverage unavailable' : 'Published coverage loading';
    const count = records.get(feature.properties.code)?.length ?? 0;
    if (state.mode === 'example') return count ? `${count} illustrative ${count === 1 ? 'record' : 'records'} · not real events` : 'No illustrative records';
    return count ? `${count} source-linked ${count === 1 ? 'record' : 'records'} in this view` : 'No published records in this view';
  }
  function showTooltip(event, feature) {
    hovered = feature;
    const code = feature.properties.code;
    const name = countryName(feature);
    const label = countText(feature);
    onHover({ code, name, count: records.get(code)?.length ?? 0, mode: state.mode });
    if (!tooltip) return;
    const title = document.createElement('strong');
    title.textContent = name;
    const description = document.createElement('span');
    description.textContent = label;
    const note = document.createElement('small');
    note.textContent = code ? (state.mode === 'example' ? 'Select to explore the demonstration.' : 'Coverage is incomplete; absence does not establish no protests.') : 'Contextual map area; no separate ISO directory entry.';
    tooltip.replaceChildren(title, description, note);
    tooltip.hidden = false;
    tooltip.style.pointerEvents = 'none';
    if (event?.clientX != null) {
      const box = (tooltip.offsetParent || container).getBoundingClientRect();
      const maxX = Math.max(8, box.width - (tooltip.offsetWidth || 230) - 8);
      const maxY = Math.max(8, box.height - (tooltip.offsetHeight || 90) - 8);
      tooltip.style.left = `${Math.max(8, Math.min(maxX, event.clientX - box.left + 15))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(maxY, event.clientY - box.top + 15))}px`;
    } else {
      tooltip.style.left = '16px';
      tooltip.style.top = '16px';
    }
  }
  function choose(feature) {
    const code = feature.properties.code;
    if (code) { hideTooltip(); onSelect(code); }
  }
  function applyTransform(next) {
    viewport.attr('transform', next);
    transform = next;
    svg.attr('data-zoom', next.k.toFixed(2));
    hideTooltip();
    dispatch('mapzoom', { scale: next.k, min: 1, max: 8 });
  }
  function constrained(next) {
    return zoom.constrain()(next, [[0, 0], [WIDTH, HEIGHT]], [[0, 0], [WIDTH, HEIGHT]]);
  }
  function move(next) { if (svg) svg.interrupt().call(zoom.transform, constrained(next)); }
  function paint() {
    if (!countries) return;
    const unavailable = state.loading || state.error;
    svg.attr('aria-label', `World map of ${state.mode === 'example' ? 'illustrative example records, not real events' : 'published source-linked records'}. Select a country to filter the index. Country directory provides every territory.`);
    countries
      .attr('fill', (feature) => feature.properties.code === state.selectedCountry ? COLORS.selected : (!unavailable && records.has(feature.properties.code) ? (state.mode === 'example' ? COLORS.example : COLORS.reported) : `url(#${emptyPattern})`))
      .attr('data-has-records', (feature) => !unavailable && records.has(feature.properties.code) ? 'true' : 'false')
      .attr('data-selected', (feature) => feature.properties.code && feature.properties.code === state.selectedCountry ? 'true' : 'false')
      .attr('tabindex', (feature) => !unavailable && feature.properties.code && (records.has(feature.properties.code) || feature.properties.code === state.selectedCountry) ? 0 : null)
      .attr('role', (feature) => feature.properties.code ? 'button' : null)
      .attr('aria-label', (feature) => `${countryName(feature)}. ${countText(feature)}.${feature.properties.code ? ' Select country.' : ' Contextual map area.'}`)
      .attr('aria-pressed', (feature) => feature.properties.code ? String(feature.properties.code === state.selectedCountry) : null)
      .style('cursor', (feature) => feature.properties.code ? 'pointer' : 'default');
    countries.select('title').text((feature) => `${countryName(feature)} — ${countText(feature)}`);
    if (state.error) status.textContent = 'Published data unavailable. The map cannot show record coverage. Use the country directory or retry loading.';
    else if (state.loading) status.textContent = 'Loading published coverage…';
    else status.textContent = '';
    status.hidden = !status.textContent;
    container.dataset.mapState = state.error ? 'data-error' : state.loading ? 'loading' : 'ready';
    if (hovered) hideTooltip();
  }
  const api = {
    update(next = {}) { state = { ...state, ...next }; records = groupRecordsByCountry(state.events); paint(); },
    reset() { if (d3 && svg) move(d3.zoomIdentity); },
    zoomIn() { if (svg) svg.interrupt().call(zoom.scaleBy, 1.6, [WIDTH / 2, HEIGHT / 2]); },
    zoomOut() { if (svg) svg.interrupt().call(zoom.scaleBy, 1 / 1.6, [WIDTH / 2, HEIGHT / 2]); },
    hasCountry(code) { return !!svg && features.some((entry) => entry.properties.code === code); },
    focusCountry(code) {
      if (!svg) return false;
      const feature = features.find((entry) => entry.properties.code === code);
      if (!feature) return false;
      const [[x0, y0], [x1, y1]] = path.bounds(feature);
      const scale = Math.max(1, Math.min(6, 0.72 / Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT)));
      if (![x0, y0, x1, y1, scale].every(Number.isFinite)) return false;
      move(d3.zoomIdentity.translate(WIDTH / 2, HEIGHT / 2).scale(scale).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
      return true;
    },
  };

  try {
    const [libraries, geo, topology] = await Promise.all([loadDependencies(), localJSON('public/world-countries.geo.json'), localJSON('public/world-110m.topo.json')]);
    [d3] = libraries;
    const [, topojson] = libraries;
    if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features) || !geo.features.length) throw new Error('Invalid map geometry');
    features = geo.features;
    projection = d3.geoEqualEarth().fitExtent([[22, 22], [WIDTH - 22, HEIGHT - 22]], { type: 'Sphere' });
    path = d3.geoPath(projection);
    svg = d3.select(container).append('svg').attr('class', 'world-map-svg').attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`).attr('role', 'group').attr('preserveAspectRatio', 'xMidYMid meet').style('display', 'block').style('width', '100%').style('height', '100%').style('touch-action', 'none');
    svg.append('title').text('Protest Atlas — published coverage by country');
    svg.append('desc').text('Equal Earth projection using Natural Earth country boundaries. Color represents source-linked record coverage, not the number or intensity of protests. Drag to pan; use zoom controls. Country and territory filters provide a keyboard alternative.');
    const pattern = svg.append('defs').append('pattern').attr('id', emptyPattern).attr('class', 'map-no-records-pattern').attr('patternUnits', 'userSpaceOnUse').attr('width', 7).attr('height', 7);
    pattern.append('rect').attr('width', 7).attr('height', 7).attr('fill', COLORS.land);
    pattern.append('path').attr('d', 'M-1,1L1,-1M0,7L7,0M6,8L8,6').attr('stroke', '#cdd4cd').attr('stroke-width', 0.45);
    svg.append('rect').attr('width', WIDTH).attr('height', HEIGHT).attr('fill', COLORS.ocean);
    viewport = svg.append('g');
    viewport.append('path').datum({ type: 'Sphere' }).attr('class', 'map-sphere').attr('d', path).attr('fill', '#eaf0e9').attr('stroke', COLORS.outline).attr('stroke-width', 0.8).attr('vector-effect', 'non-scaling-stroke');
    viewport.append('path').datum(d3.geoGraticule10()).attr('class', 'map-graticule').attr('d', path).attr('fill', 'none').attr('stroke', COLORS.grid).attr('stroke-width', 0.45).attr('vector-effect', 'non-scaling-stroke').attr('pointer-events', 'none').attr('aria-hidden', 'true');
    countries = viewport.append('g').attr('class', 'map-countries').selectAll('path').data(features).join('path').attr('class', 'map-country').attr('data-country', (feature) => feature.properties.code ?? '').attr('d', path).attr('stroke', COLORS.border).attr('stroke-width', 0.65).attr('vector-effect', 'non-scaling-stroke')
      .on('click', (_, feature) => choose(feature))
      .on('pointerenter', showTooltip).on('pointermove', showTooltip).on('pointerleave', hideTooltip)
      .on('focus', (_, feature) => showTooltip(null, feature)).on('blur', hideTooltip)
      .on('keydown', (event, feature) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(feature); } else if (event.key === 'Escape') hideTooltip(); });
    countries.append('title');
    viewport.append('path').datum(topojson.mesh(topology, topology.objects.countries, (a, b) => a !== b)).attr('class', 'map-borders').attr('d', path).attr('fill', 'none').attr('stroke', COLORS.border).attr('stroke-width', 0.7).attr('vector-effect', 'non-scaling-stroke').attr('pointer-events', 'none').attr('aria-hidden', 'true');
    zoom = d3.zoom().extent([[0, 0], [WIDTH, HEIGHT]]).translateExtent([[0, 0], [WIDTH, HEIGHT]]).scaleExtent([1, 8]).filter((event) => !event.ctrlKey && !event.button && event.type !== 'wheel').on('zoom', (event) => applyTransform(event.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    transform = d3.zoomIdentity;
    paint();
    dispatch('mapready', { mappedCountries: features.filter((feature) => feature.properties.code).length, featureCount: features.length });
  } catch (error) {
    svg?.remove();
    svg = null;
    status.hidden = false;
    status.textContent = 'The world map could not be loaded. The published list and country directory remain available.';
    container.dataset.mapState = 'unavailable';
    dispatch('maperror', { message: error.message });
  }
  return api;
}
