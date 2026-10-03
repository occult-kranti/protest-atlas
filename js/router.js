// Route parse/format plus history binding (WP2). Phase-0 stub; constants are final (tech §2.2, §4.6; SPEC C-24).
// DOM-free when loaded: DOM work happens only inside createRouter().start()/go().

export const VIEWS = ['latest', 'map', 'ahead', 'countries', 'about'];
export const RECORD_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
export const ROUTE_ALIASES = {'#atlas': {view: 'map'}, '#countries': {view: 'countries'}, '#methodology': {view: 'about'},
  '#roadmap': {view: 'ahead', param: 'roadmap'}, '#/next': {view: 'ahead'}, '#/roadmap': {view: 'ahead', param: 'roadmap'},
  '#/reports': {view: 'latest'}, '#/coming-next': {view: 'ahead', param: 'roadmap'}};
export const VIEW_NAMES = {latest: 'Reports', map: 'Map', ahead: 'Ahead', countries: 'Countries', about: 'About'};

export function parseRoute(hash, defaultView = 'latest') { return null; }
export function formatRoute({view, param = null, record = null}) { return ''; }
export function createRouter({defaultView, onChange}) { return {start() {}, go() {}, current() { return null; }, closeRecord() {}}; }
