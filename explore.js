const DAY = 86_400_000;
export function withinWindow(event, window, now = Date.now()) {
  if (!window || window === 'all') return true;
  const time = Date.parse(event.last_observed_at);
  return Number.isFinite(time) && time <= now && now - time < Number(window) * DAY;
}
export function readViewState(search) {
  const q = new URLSearchParams(search);
  const read = key => (q.get(key) || '').slice(0,200);
  return {query:read('q'),country:/^[A-Z]{2}$/.test(read('country')) ? read('country') : '',region:read('region'),issue:read('issue'),status:['ongoing','planned','ended','needs-review','unknown'].includes(read('status')) ? read('status') : '',window:['7','30'].includes(read('window')) ? read('window') : 'all',year:['2024','2025','2026'].includes(read('year'))?read('year'):'',city:read('city'),outcome:['documented','not-established'].includes(read('outcome'))?read('outcome'):''};
}
export function encodeViewState(state) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries({q:state.query,country:state.country,region:state.region,issue:state.issue,status:state.status,year:state.year,city:state.city,outcome:state.outcome,window:state.window === 'all' ? '' : state.window})) if (value) params.set(key,value);
  return params.toString();
}
export function csvForEvents(events,contexts=null) {
  const context=id=>contexts?.records?.find(c=>c.event_id===id);
  const cell = value => { let s=String(value ?? ''); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r]/.test(s)) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
  const rows = [['record_id','country','title','issues','last_observed','recorded_status','status_note','cities','completion_basis','what_changed','whose_favour','source_urls'], ...events.map(e => [e.id,e.country_name,e.title,e.issues.join('; '),e.last_observed_at,e.status,'Recorded status only; consult observation age and source uncertainty',(context(e.id)?.cities||[]).map(c=>c.name).join('; '),context(e.id)?.status_basis?.text||'End not established',(context(e.id)?.outcomes||[]).map(o=>o.summary).join(' | '),(context(e.id)?.outcomes||[]).flatMap(o=>o.favours.map(f=>f.actor+': '+f.effect+' ('+f.basis+') — '+f.note)).join(' | '),e.sources.map(s=>s.url).join(' | ')])];
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

// 4.0 additions (WP2 implements; signatures frozen by tech §4.6).
export const FILTER_KEYS = ['query', 'country', 'region', 'issue', 'status', 'window', 'year', 'city', 'outcome'];
export function droppedParams(search) { return []; }
export function shareURL({origin, pathname, filters, route, defaultView, kind = 'view'}) { return ''; }
