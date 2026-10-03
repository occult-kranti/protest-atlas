// Critical and lazy loaders, shape checks (WP2). No imports (SPEC §19.0). DOM-free.
// File maps are final (tech §4.6; SPEC C-20).

export const CRITICAL = Object.freeze({events: 'public/events.json', countries: 'public/countries.json',
  contexts: 'public/event-context.json', upcoming: 'public/upcoming.json', build: 'public/build-info.json'});
export const LAZY = Object.freeze({coverage: 'public/coverage.json', research: 'public/research-ledger.json',
  cities: 'public/cities.json', discovery: 'public/discovery-status.json', roadmap: 'public/roadmap.json', examples: 'public/examples.json',
  mapCodes: 'public/world-map-codes.json'});
export const REQUIRED = Object.freeze(['events', 'countries']);

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const validTime = v => typeof v === 'string' && Number.isFinite(Date.parse(v));

/** name → (value) => boolean. A file that fails its shape check counts as an error, never as empty data. */
export const SHAPES = Object.freeze({
  events: v => isObject(v) && Array.isArray(v.events),
  countries: v => Array.isArray(v) && v.every(c => isObject(c) && typeof c.code === 'string'),
  contexts: v => isObject(v) && Array.isArray(v.records),
  upcoming: v => isObject(v) && Array.isArray(v.items),
  build: v => isObject(v) && validTime(v.built_at),
  coverage: v => isObject(v) && Array.isArray(v.countries),
  research: v => isObject(v) && Array.isArray(v.countries),
  cities: v => isObject(v) && Array.isArray(v.places),
  discovery: v => isObject(v),
  roadmap: v => isObject(v) && Array.isArray(v.items),
  examples: v => isObject(v) && Array.isArray(v.events),
  mapCodes: v => isObject(v) && isObject(v.codes),
});

/** .name = file key; .kind = 'absent' (404) | 'http' | 'network' | 'shape'. */
export class DataError extends Error {
  constructor(message, {file = 'data', kind = 'http', status = null} = {}) {
    super(message);
    this.name = file;
    this.kind = kind;
    this.status = status;
  }
}

/** Same-origin JSON with ETag revalidation (cache: 'no-cache'). */
export async function fetchJSON(path, {fetchImpl = globalThis.fetch, signal, name = path} = {}) {
  let response;
  try {
    response = await fetchImpl(path, {cache: 'no-cache', signal, credentials: 'same-origin'});
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new DataError(`Could not reach ${path}`, {file: name, kind: 'network'});
  }
  if (!response?.ok) {
    const status = response?.status ?? null;
    throw new DataError(`Could not load ${path} (${status})`, {file: name, kind: status === 404 ? 'absent' : 'http', status});
  }
  try {
    return await response.json();
  } catch {
    throw new DataError(`Could not read ${path}`, {file: name, kind: 'shape'});
  }
}

async function loadOne(name, path, fetchImpl) {
  const value = await fetchJSON(path, {fetchImpl, name});
  if (SHAPES[name] && !SHAPES[name](value)) throw new DataError(`Unexpected shape in ${path}`, {file: name, kind: 'shape'});
  return value;
}

/**
 * The critical set, each file settled independently (C-37): data.events survives a countries failure.
 * → {data: {events, countries, contexts, upcoming, build}, errors: {name: 'absent'|'error'}, critical: 'ready'|'error'}
 * Only upcoming and build may be 'absent' (404); a failed events or countries file makes critical 'error'.
 */
export async function loadCritical({fetchImpl = globalThis.fetch} = {}) {
  const names = Object.keys(CRITICAL);
  const results = await Promise.allSettled(names.map(name => loadOne(name, CRITICAL[name], fetchImpl)));
  const data = {events: null, countries: [], contexts: null, upcoming: null, build: null};
  const errors = {};
  results.forEach((result, i) => {
    const name = names[i];
    if (result.status === 'fulfilled') data[name] = result.value;
    else errors[name] = (name === 'upcoming' || name === 'build') && result.reason?.kind === 'absent' ? 'absent' : 'error';
  });
  if (!Array.isArray(data.countries)) data.countries = [];
  const critical = REQUIRED.some(name => errors[name]) ? 'error' : 'ready';
  return {data, errors, critical};
}

/** Memoised lazy files. load(name) resolves with the data or rejects with a DataError; reset(name) allows a retry. */
export function createLazyLoader({fetchImpl = globalThis.fetch} = {}) {
  const promises = new Map();
  const states = new Map();
  return {
    load(name) {
      if (!Object.hasOwn(LAZY, name)) return Promise.reject(new DataError(`Unknown file ${name}`, {file: name, kind: 'absent'}));
      if (!promises.has(name)) {
        states.set(name, 'loading');
        const promise = loadOne(name, LAZY[name], fetchImpl).then(
          value => { states.set(name, 'ready'); return value; },
          error => { states.set(name, 'error'); throw error; });
        promises.set(name, promise);
      }
      return promises.get(name);
    },
    state(name) { return states.get(name) ?? 'idle'; },
    reset(name) { promises.delete(name); states.delete(name); },
  };
}
