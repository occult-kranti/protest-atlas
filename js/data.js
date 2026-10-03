// Critical and lazy loaders, shape checks (WP2). Phase-0 stub; file maps are final (tech §4.6; SPEC C-20). DOM-free.

export const CRITICAL = Object.freeze({events: 'public/events.json', countries: 'public/countries.json',
  contexts: 'public/event-context.json', upcoming: 'public/upcoming.json', build: 'public/build-info.json'});
export const LAZY = Object.freeze({coverage: 'public/coverage.json', research: 'public/research-ledger.json',
  cities: 'public/cities.json', discovery: 'public/discovery-status.json', roadmap: 'public/roadmap.json', examples: 'public/examples.json',
  mapCodes: 'public/world-map-codes.json'});
export const REQUIRED = Object.freeze(['events', 'countries']);
export const SHAPES = {};

export class DataError extends Error {}

export async function fetchJSON(path, {fetchImpl = globalThis.fetch, signal} = {}) { return null; }
export async function loadCritical({fetchImpl} = {}) { return {data: {}, errors: {}}; }
export function createLazyLoader({fetchImpl} = {}) { return {load() { return Promise.resolve(null); }, state() { return 'idle'; }, reset() {}}; }
