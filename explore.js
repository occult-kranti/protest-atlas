const DAY = 86_400_000;
export function withinWindow(event, window, now = Date.now()) {
  if (!window || window === 'all') return true;
  const time = Date.parse(event.last_observed_at);
  return Number.isFinite(time) && time <= now && now - time < Number(window) * DAY;
}
export function readViewState(search) {
  const q = new URLSearchParams(search);
  const read = key => (q.get(key) || '').slice(0,200);
  return {query:read('q'),country:/^[A-Z]{2}$/.test(read('country')) ? read('country') : '',region:read('region'),issue:read('issue'),status:['ongoing','planned','ended','needs-review','unknown'].includes(read('status')) ? read('status') : '',window:['7','30'].includes(read('window')) ? read('window') : 'all',year:/^20\d{2}$/.test(read('year'))?read('year'):'',city:read('city'),outcome:['documented','not-established'].includes(read('outcome'))?read('outcome'):''};
}
export function encodeViewState(state) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries({q:state.query,country:state.country,region:state.region,issue:state.issue,status:state.status,year:state.year,city:state.city,outcome:state.outcome,window:state.window === 'all' ? '' : state.window})) if (value) params.set(key,value);
  return params.toString();
}
export const CSV_NOT_LOADED = 'not loaded';
export function csvForEvents(events,contexts=null) {
  const context=id=>contexts?.records?.find(c=>c.event_id===id);
  const loaded = Array.isArray(contexts?.records);
  const ctx = (id, read) => loaded ? read(context(id)) : CSV_NOT_LOADED;
  const cell = value => { let s=String(value ?? ''); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r]/.test(s)) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
  const rows = [['record_id','country','title','issues','last_observed','recorded_status','status_note','cities','completion_basis','what_changed','whose_favour','source_urls'], ...events.map(e => [e.id,e.country_name,e.title,e.issues.join('; '),e.last_observed_at,e.status,'Recorded status only; consult observation age and source uncertainty',ctx(e.id,c=>(c?.cities||[]).map(x=>x.name).join('; ')),ctx(e.id,c=>c?.status_basis?.text||'End not established'),ctx(e.id,c=>(c?.outcomes||[]).map(o=>o.summary).join(' | ')),ctx(e.id,c=>(c?.outcomes||[]).flatMap(o=>o.favours.map(f=>f.actor+': '+f.effect+' ('+f.basis+') — '+f.note)).join(' | ')),e.sources.map(s=>s.url).join(' | ')])];
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

// 4.0 additions (WP2). Pure; DOM-free. Signatures frozen by tech §4.6.
export const FILTER_KEYS = ['query', 'country', 'region', 'issue', 'status', 'window', 'year', 'city', 'outcome'];

// URL parameter name for each filter key (the codec writes `q` for `query`).
const PARAM = {query: 'q', country: 'country', region: 'region', issue: 'issue', status: 'status', window: 'window', year: 'year', city: 'city', outcome: 'outcome'};

/**
 * URL parameter names that were present in `search` but rejected or normalised by readViewState
 * (`?status=live&year=1999` → ['status', 'year']). Empty values and `window=all` are not drops.
 * Unknown, non-filter parameters are ignored. Order follows FILTER_KEYS.
 */
export function droppedParams(search) {
  const q = new URLSearchParams(search || '');
  const state = readViewState(search || '');
  const dropped = [];
  for (const key of FILTER_KEYS) {
    const name = PARAM[key];
    if (!q.has(name)) continue;
    const raw = q.get(name) || '';
    if (!raw) continue;
    if (key === 'window' && raw === 'all') continue;
    if (state[key] !== raw) dropped.push(name);
  }
  return dropped;
}

/**
 * Share link. View: origin + pathname + ?filters + #/view (the default view's hash is omitted).
 * Record: origin + pathname + #/record/<id>, filters omitted.
 */
export function shareURL({origin, pathname, filters, route, defaultView, kind = 'view'}) {
  const base = `${origin || ''}${pathname || '/'}`;
  if (kind === 'record') return route?.record ? `${base}#/record/${route.record}` : base;
  const q = encodeViewState({...readViewState(''), ...(filters || {})});
  const view = route?.view || defaultView;
  const param = route?.param || null;
  const hash = view === defaultView && !param ? '' : `#/${view}${param ? `/${param}` : ''}`;
  return `${base}${q ? `?${q}` : ''}${hash}`;
}
