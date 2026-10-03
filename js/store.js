// Store and initial state (WP2). DOM-free, no imports (SPEC §19.0). Signatures frozen by tech §4.4.

// Equals model.PAGE_SIZE (C-04); test_core asserts they agree.
const FIRST_PAGE = 12;

/**
 * Immutable-update store. set() shallow-merges the patch into a NEW top-level object and
 * notifies listeners synchronously with (state, prev, meta). A patch that changes nothing is a no-op.
 */
export function createStore(initial) {
  let state = Object.freeze({...(initial ?? {})});
  const listeners = new Set();
  return {
    get() { return state; },
    set(patch, meta = {}) {
      const value = typeof patch === 'function' ? patch(state) : patch;
      if (!value || typeof value !== 'object') return;
      const keys = Object.keys(value);
      if (!keys.some(key => !Object.is(state[key], value[key]))) return;
      const prev = state;
      state = Object.freeze({...state, ...value});
      for (const fn of [...listeners]) fn(state, prev, meta);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const LAZY_NAMES = ['coverage', 'research', 'cities', 'discovery', 'roadmap', 'examples', 'mapCodes'];

/** The full State shape (tech §4.4 + C-11 density + C-36 feedbackURL). */
export function initialState({filters, defaultView = 'latest', mapGestures = 'page', now = Date.now()} = {}) {
  return {
    now,
    mode: 'reported',
    route: {view: defaultView, param: null, record: null},
    filters: {query: '', country: '', region: '', issue: '', status: '', window: 'all', year: '', city: '', outcome: '', ...(filters ?? {})},
    data: {
      events: null, countries: [], contexts: null, upcoming: null, build: null,
      coverage: null, research: null, cities: null, discovery: null, roadmap: null, examples: null, mapCodes: null,
    },
    load: {
      critical: 'loading',
      errors: {},
      lazy: Object.fromEntries(LAZY_NAMES.map(name => [name, 'idle'])),
    },
    ui: {
      listLimit: FIRST_PAGE,
      droppedParams: [],
      feedback: '',
      feedbackURL: null,
      feedbackSeq: 0,
      mapStatus: 'idle',
      density: 'card',
      gestures: mapGestures,
    },
  };
}
