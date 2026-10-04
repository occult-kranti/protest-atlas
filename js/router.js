// Route parse/format plus history binding (WP2). No imports (SPEC §19.0).
// DOM-free when loaded: DOM work happens only inside createRouter().start()/go() and the handlers they bind.

export const VIEWS = ['latest', 'map', 'ahead', 'countries', 'about'];
export const RECORD_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
export const ROUTE_ALIASES = {'#atlas': {view: 'map'}, '#countries': {view: 'countries'}, '#methodology': {view: 'about'},
  '#roadmap': {view: 'ahead', param: 'roadmap'}, '#/next': {view: 'ahead'}, '#/roadmap': {view: 'ahead', param: 'roadmap'},
  '#/reports': {view: 'latest'}, '#/coming-next': {view: 'ahead', param: 'roadmap'}};
export const VIEW_NAMES = {latest: 'Reports', map: 'Map', ahead: 'Ahead', countries: 'Countries', about: 'About'};

const AHEAD_PARAMS = ['actions', 'roadmap'];

/**
 * '#/map' → {view, param, record, alias, unknown}. Returns null for a hash that is not a route
 * (#main, #after-map, #detail-source-2), so native anchors keep working.
 * A record route carries `view: defaultView`; the router keeps the view underneath instead.
 */
export function parseRoute(hash, defaultView = 'latest') {
  const h = typeof hash === 'string' ? hash : '';
  const base = {view: defaultView, param: null, record: null, alias: false, unknown: false};
  if (h === '' || h === '#' || h === '#/') return base;
  if (Object.hasOwn(ROUTE_ALIASES, h)) {
    const alias = ROUTE_ALIASES[h];
    return {...base, view: alias.view, param: alias.param ?? null, alias: true};
  }
  if (!h.startsWith('#/')) return null;
  const parts = h.slice(2).split('/');
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
  const [view, param, ...rest] = parts;
  if (view === 'record') {
    return parts.length === 2 && RECORD_ID.test(param) ? {...base, record: param} : {...base, unknown: true};
  }
  if (!VIEWS.includes(view) || rest.length) return {...base, unknown: true};
  if (param === undefined) return {...base, view};
  if (view === 'ahead' && AHEAD_PARAMS.includes(param)) return {...base, view, param};
  return {...base, unknown: true};
}

/** {view:'map'} → '#/map'; {view:'ahead', param:'roadmap'} → '#/ahead/roadmap'; {record} → '#/record/<id>'. */
export function formatRoute({view, param = null, record = null} = {}) {
  if (record) return `#/record/${record}`;
  return param ? `#/${view}/${param}` : `#/${view}`;
}

const sameRoute = (a, b) => Boolean(a && b) && a.view === b.view && (a.param ?? null) === (b.param ?? null) && (a.record ?? null) === (b.record ?? null);
const effectiveParam = route => (route.view === 'ahead' ? route.param || 'actions' : route.param || null);
const sameView = (a, b) => Boolean(a && b) && a.view === b.view && effectiveParam(a) === effectiveParam(b);

/**
 * History binding (tech §2.3 + C-24 + C-35).
 * → {start(), go(route, {replace, user}), current(), closeRecord(), afterRender(), refreshNav()}
 * onChange(route, prev, meta) runs for every applied route; meta = {source: 'initial'|'user'|'pop'|'program', unknown, alias}.
 * beforePush() runs just before each pushState (app.js writes a pending query into the entry being left).
 *
 * Every entry the app sees carries history.state {key, view, param, record}. `positions` keeps, per key, the scrollY
 * the entry had when it was left (by a push, Back or Forward), so Back and Forward both restore it; scrollY in the
 * state itself survives a reload. The stored view lets Back to a non-route hash (#main) show the view it was on.
 */
export function createRouter({defaultView = 'latest', onChange = () => {}, beforePush = () => {}} = {}) {
  let current = null;
  let pending = null;      // {scroll: number, focus: string[]} applied after the next render
  let lastFocus = null;    // the focus list of the last settled job, for a lazily mounted view's late section titles (C-53)
  let started = false;
  let activeKey = null;    // key of the entry on screen
  let lastY = 0;           // scrollY at the last scroll event: an entry left by a fragment jump is stored pre-jump
  let seq = 0;
  const positions = new Map();

  const win = () => globalThis.window;
  const doc = () => globalThis.document;
  const newKey = () => `${Date.now().toString(36)}.${(seq++).toString(36)}.${Math.random().toString(36).slice(2, 6)}`;
  const routeState = route => ({view: route.view, param: route.param ?? null, record: route.record ?? null});

  function titleTargets(next, prev) {
    if (next.view === 'ahead') {
      if (prev?.view === 'ahead') return next.param === 'roadmap' ? ['#ahead-roadmap-title', '#ahead-title'] : ['#ahead-actions-title', '#ahead-title'];
      return next.param === 'roadmap' ? ['#ahead-roadmap-title', '#ahead-title'] : ['#ahead-title'];
    }
    return [`#${next.view}-title`];
  }

  /** Merge into the current entry's state (same URL). */
  function stamp(extra) {
    const w = win();
    try { w.history.replaceState({...(w.history.state ?? {}), ...extra}, ''); } catch { /* ignore */ }
  }

  function writeURL(route, {replace}) {
    const w = win();
    const url = `${w.location.pathname}${w.location.search}${formatRoute(route)}`;
    if (replace) {
      w.history.replaceState({...(w.history.state ?? {}), atlas: true, ...routeState(route)}, '', url);
      return;
    }
    beforePush();
    positions.set(activeKey, w.scrollY);
    stamp({scrollY: w.scrollY});
    activeKey = newKey();
    w.history.pushState({atlas: true, pushed: true, key: activeKey, ...routeState(route)}, '', url);
  }

  /** The browser moved to another entry (Back, Forward, a typed hash, a fragment link): store the one it left. */
  function arrive() {
    const w = win();
    const key = w.history.state?.key;
    if (key && key === activeKey) return;
    if (activeKey) positions.set(activeKey, key ? w.scrollY : lastY);
    activeKey = key ?? newKey();
    if (!key) stamp({key: activeKey});
  }

  /** aria-current="page" on the most specific displayed match inside each nav container (§3.3). */
  function refreshNav() {
    const d = doc();
    if (!d || !current) return;
    const groups = new Map();
    for (const link of d.querySelectorAll('[data-nav]')) {
      const key = link.closest('nav') || link.parentElement;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(link);
    }
    const param = effectiveParam(current);
    for (const links of groups.values()) {
      const scored = links.map(link => {
        const [view, linkParam] = String(link.dataset.nav).split('/');
        let score = 0;
        if (view === current.view) score = linkParam ? (linkParam === param ? 2 : 0) : 1;
        return {link, score, shown: link.getClientRects().length > 0};
      });
      const pool = scored.some(s => s.shown && s.score) ? scored.filter(s => s.shown) : scored;
      const best = Math.max(0, ...pool.map(s => s.score));
      const winner = best ? pool.find(s => s.score === best)?.link : null;
      for (const {link} of scored) {
        if (link === winner) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    }
  }

  function apply(next, meta) {
    const prev = current;
    current = Object.freeze({view: next.view, param: next.param ?? null, record: next.record ?? null});
    const d = doc();
    if (d) {
      d.documentElement.dataset.view = current.view;
      if (!sameView(prev, current) && !(meta.source === 'initial' && current.view === defaultView && !current.param)) {
        d.title = `${VIEW_NAMES[current.view]} — Protest Atlas`;
      }
      refreshNav();
    }
    const viewChanged = !sameView(prev, current);
    if (meta.source === 'initial' || !viewChanged) pending = null;
    else if (meta.source === 'pop') pending = {scroll: positions.get(activeKey) ?? (Number(win()?.history.state?.scrollY) || 0), focus: titleTargets(current, prev)};
    else pending = {scroll: 0, focus: titleTargets(current, prev)};
    onChange(current, prev, meta);
    d?.dispatchEvent(new CustomEvent('atlas:route', {detail: {route: current, prev}}));
  }

  function settle({scroll, focus}) {
    const w = win(), d = doc();
    if (!w || !d) return;
    w.scrollTo({top: scroll, left: 0, behavior: 'instant'});
    lastFocus = focus;
    const target = focus.map(sel => d.querySelector(sel)).find(el => el && el.getClientRects().length);
    target?.focus({preventScroll: true});
  }

  function fromLocation(source) {
    const w = win();
    const parsed = parseRoute(w.location.hash, defaultView);
    if (!parsed) {
      // Not a route (#main, #after-map). An entry that stored a view shows it again; a fresh jump keeps the
      // current view (the default one on first load), which is then stored in the entry.
      const saved = w.history.state;
      const next = VIEWS.includes(saved?.view) ? routeState(saved) : current ?? {view: defaultView, param: null, record: null};
      if (!sameRoute(current, next)) apply(next, {source});
      stamp(routeState(current));
      return;
    }
    if (parsed.unknown) {
      const fallback = current ? {view: current.view, param: current.param} : {view: defaultView};
      w.history.replaceState(w.history.state, '', `${w.location.pathname}${w.location.search}${formatRoute(fallback)}`);
      apply(fallback, {source, unknown: true});
      return;
    }
    const next = parsed.record ? {view: current?.view ?? defaultView, param: current?.param ?? null, record: parsed.record} : parsed;
    if (parsed.alias) w.history.replaceState(w.history.state, '', `${w.location.pathname}${w.location.search}${formatRoute(next)}`);
    if (sameRoute(current, next)) return;
    apply(next, {source, alias: parsed.alias});
  }

  return {
    start() {
      if (started) return;
      started = true;
      const w = win();
      try { w.history.scrollRestoration = 'manual'; } catch { /* ignore */ }
      activeKey = w.history.state?.key ?? newKey();
      lastY = w.scrollY;
      w.addEventListener('scroll', () => { lastY = w.scrollY; }, {passive: true});
      w.addEventListener('popstate', () => { arrive(); fromLocation('pop'); });
      w.addEventListener('hashchange', () => { arrive(); fromLocation('user'); });
      for (const query of ['(min-width: 900px)', '(min-width: 1200px)']) {
        w.matchMedia?.(query)?.addEventListener?.('change', refreshNav);
      }
      fromLocation('initial');
      stamp({atlas: true, key: activeKey, ...routeState(current)});
    },

    /** Navigate. A record route keeps the view underneath. Re-selecting the shown view scrolls to the top. */
    go(route, {replace = false, user = true} = {}) {
      if (!route) return;
      if (route.unknown) {
        apply(current ?? {view: defaultView}, {source: 'program', unknown: true});
        return;
      }
      const next = route.record
        ? {view: current?.view ?? defaultView, param: current?.param ?? null, record: route.record}
        : {view: route.view ?? defaultView, param: route.param ?? null, record: null};
      const reselect = user && !next.record && !current?.record && sameView(current, next);
      if (sameRoute(current, next)) {
        if (reselect) settle({scroll: 0, focus: titleTargets(next, null)});
        return;
      }
      writeURL(next, {replace});
      apply(next, {source: user ? 'user' : 'program'});
      if (reselect) pending = {scroll: 0, focus: titleTargets(next, null)};
    },

    current() { return current; },

    /** Close the record: Back when the router pushed the entry, otherwise replace with the view underneath. */
    closeRecord() {
      if (!current?.record) return;
      const w = win();
      if (w.history.state?.pushed) {
        w.history.back();
        return;
      }
      const next = {view: current.view, param: current.param, record: null};
      writeURL(next, {replace: true});
      apply(next, {source: 'program'});
    },

    /** Run the pending scroll and focus once the new view has rendered (C-35). */
    afterRender() {
      if (!pending) return;
      const job = pending;
      pending = null;
      settle(job);
    },

    /**
     * A lazily imported view (4.1 C-53) rendered its section titles after the route settled on the static view title:
     * move focus to the most specific title, unless the reader or a sheet has already moved it elsewhere. No scroll.
     */
    resettleFocus() {
      const d = doc();
      if (!d || !lastFocus || lastFocus.length < 2) return;
      const active = d.activeElement;
      if (active && active !== d.body && active !== d.querySelector(lastFocus.at(-1))) return;
      const target = lastFocus.map(sel => d.querySelector(sel)).find(el => el && el.getClientRects().length);
      if (target && target !== active) target.focus({preventScroll: true});
    },

    refreshNav,
  };
}
