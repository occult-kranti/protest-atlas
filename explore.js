import { createWorldMap } from './map.js';

const DAY = 86_400_000;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value)) : 'Not established';
export function withinWindow(event, window, now = Date.now()) {
  if (!window || window === 'all') return true;
  const time = Date.parse(event.last_observed_at);
  return Number.isFinite(time) && time <= now && now - time < Number(window) * DAY;
}
export function readViewState(search) {
  const q = new URLSearchParams(search);
  const read = key => (q.get(key) || '').slice(0,200);
  return {query:read('q'),country:/^[A-Z]{2}$/.test(read('country')) ? read('country') : '',region:read('region'),issue:read('issue'),status:['ongoing','planned','ended','needs-review','unknown'].includes(read('status')) ? read('status') : '',window:['7','30'].includes(read('window')) ? read('window') : 'all'};
}
export function encodeViewState(state) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries({q:state.query,country:state.country,region:state.region,issue:state.issue,status:state.status,window:state.window === 'all' ? '' : state.window})) if (value) params.set(key,value);
  return params.toString();
}
export function csvForEvents(events) {
  const cell = value => { let s=String(value ?? ''); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r]/.test(s)) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
  const rows = [['record_id','country','title','issues','last_observed','recorded_status','status_note','source_urls'], ...events.map(e => [e.id,e.country_name,e.title,e.issues.join('; '),e.last_observed_at,e.status,'Recorded status only; consult observation age and source uncertainty',e.sources.map(s=>s.url).join(' | ')])];
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

export function createExplorer({onSelectCountry,onOpenEvent,onExport,onShare}) {
  let map, latest, unavailable=false;
  const $ = id=>document.getElementById(id);
  const container=$('world-map');
  createWorldMap({container,tooltip:$('map-tooltip'),onSelect:onSelectCountry}).then(instance=>{map=instance; unavailable=container.dataset.mapState==='unavailable'; update(latest);}).catch(()=>{unavailable=true; container.innerHTML='<div class="map-fallback"><h3>The map could not load.</h3><p>The country selector, directory and reports remain available below.</p><button id="retry-map" class="small-button">Reload map</button></div>'; $('retry-map').addEventListener('click',()=>location.reload()); update(latest);});
  $('zoom-in').addEventListener('click',()=>map?.zoomIn());
  $('zoom-out').addEventListener('click',()=>map?.zoomOut());
  $('reset-map').addEventListener('click',()=>map?.reset());
  $('clear-country').addEventListener('click',()=>{onSelectCountry('');$('country-filter').focus({preventScroll:true});});
  $('share-view').addEventListener('click',onShare);
  $('export-records').addEventListener('click',onExport);
  function update(data) {
    if (!data) return;
    latest=data;
    const {events=[],allEvents=[],countries=[],selectedCountry='',mode='reported',coverage,discovery,loading,error}=data;
    const isExample=mode==='example';
    map?.update({events,countries,selectedCountry,mode,loading,error});
    $('map-mode-label').textContent=isExample ? 'Illustrative geography · fictional data' : 'Published coverage · country view';
    $('map-mode-label').classList.toggle('example-watermark',isExample);
    $('legend-report-text').textContent=isExample?'Illustrative records':'Published reports';
    $('legend-gap-text').textContent=isExample?'No example in this view':'No report in this view';
    $('legend-report-swatch').style.background=isExample?'#bcaed0':'#c78d43';
    $('map-total').textContent=error ? 'Data unavailable' : loading ? 'Loading reports…' : `${events.length} ${isExample?'illustrative':'published'} ${events.length===1?'report':'reports'} · ${new Set(events.map(e=>e.country)).size} ${new Set(events.map(e=>e.country)).size===1?'country':'countries'}`;
    for (const id of ['zoom-in','zoom-out','reset-map']) $(id).disabled=!map||unavailable;
    $('export-records').disabled=!!error||!!loading||isExample||!events.some(e=>!selectedCountry||e.country===selectedCountry);
    $('share-view').disabled=isExample;
    $('share-view').title=isExample?'View links are available for reported data':'Copy these reporting filters';
    $('export-records').title=isExample ? 'Illustrative records are excluded from exports' : 'Download the filtered reporting snapshot';
    $('clear-country').hidden=!selectedCountry;
    const health = discovery?.last_success_at || discovery?.artifact_created_at || discovery?.collected_at;
    const runURL=discovery?.workflow_run_url || discovery?.run_url || discovery?.workflow_url;
    $('discovery-summary').textContent=health ? `Last audited discovery: ${date(health)} · ${Number.isInteger(discovery.candidate_count)?discovery.candidate_count:'Unknown count of'} unverified leads. Scheduled every 6h; articles require review.` : 'Discovery checks run every 6h. The latest successful run is not available in this snapshot.';
    if (runURL && /^https:\/\/github\.com\/occult-kranti\/protest-atlas\//.test(runURL)) $('discovery-run').href=runURL;
    renderPanel();
  }
  function renderPanel() {
    const {events=[],allEvents=[],countries=[],selectedCountry='',mode,coverage,error,loading}=latest;
    const panel=$('country-panel');
    if (loading) {panel.innerHTML='<p class="eyebrow">WORLD OVERVIEW</p><h3>Loading the evidence…</h3>';return;}
    if (error) {panel.innerHTML='<p class="eyebrow">COVERAGE UNAVAILABLE</p><h3>Reporting data did not load.</h3><p>Map color cannot establish protest activity. Reload the published data to try again.</p>';return;}
    if (!selectedCountry) {
      const codes=[...new Set(events.map(e=>e.country))];
      panel.innerHTML=`<p class="eyebrow">WORLD OVERVIEW</p><h3>Start with a place.</h3><p class="panel-lead">Select a country to see what was reported, when it was observed, and what remains unknown.</p><div class="coverage-stat"><strong>${events.length}</strong><span>${mode==='example'?'illustrative':'published'} reports<br>in ${codes.length} ${codes.length===1?'country':'countries'}</span></div><p class="small-note">Report counts are publication scope, not the number or intensity of protests.</p><div class="country-shortlist">${codes.map(code=>{const c=countries.find(c=>c.code===code);const n=events.filter(e=>e.country===code).length;return `<button class="country-jump" data-select-country="${esc(code)}"><span>${esc(c?.name || code)}</span><span>${n} report${n===1?'':'s'} <span aria-hidden="true">↗</span></span></button>`;}).join('') || '<p>No reports match the current filters.</p>'}</div><a class="panel-link" href="#countries">Browse all ${countries.length} countries & territories →</a>`;
    } else {
      const country=countries.find(c=>c.code===selectedCountry);
      const records=events.filter(e=>e.country===selectedCountry);
      const published=allEvents.filter(e=>e.country===selectedCountry);
      const entry=coverage?.countries?.find(c=>c.code===selectedCountry);
      const langs=entry?.languages || [];
      panel.innerHTML=`<p class="eyebrow">${esc(country?.region || 'COUNTRY RECORD')} / ${esc(selectedCountry)}</p><h3>${esc(country?.name || selectedCountry)}</h3><p class="panel-lead">${records.length ? `${records.length} ${mode==='example'?'illustrative':'published'} report${records.length===1?' matches':'s match'} the filters.` : published.length ? 'Published reports exist, but none match the other filters.' : 'No published report in this snapshot. This is a coverage gap, not evidence of no protests.'}</p><dl class="panel-ledger"><div><dt>Source coverage</dt><dd>${mode==='example'?'Fictional example only':entry?.status==='limited-source-check'?'Limited source check':entry?'Not reviewed':'Ledger unavailable'}</dd></div><div><dt>Languages checked</dt><dd>${mode==='example'?'Not applicable':langs.length?esc(langs.join(', ')):'Not established'}</dd></div><div><dt>Last source check</dt><dd>${mode==='example'?'Not applicable':date(entry?.last_checked)}</dd></div><div><dt>Human editorial review</dt><dd>Not completed</dd></div></dl><p class="small-note">${mode==='example'?'This view contains synthetic data only.':esc(entry?.note || 'Local-language and country-wide coverage have not been established.')}</p><div class="panel-records">${records.map(e=>`<button class="panel-record" data-open-record="${esc(e.id)}"><small>Observed ${date(e.last_observed_at)}</small><span>${esc(e.title)} <span aria-hidden="true">↗</span></span></button>`).join('')}</div><button id="focus-selected" class="small-button">Zoom to country</button><p id="geometry-note" class="small-note"></p>`;
      $('focus-selected').disabled=!map || unavailable || !map.hasCountry(selectedCountry);
      if(map && !map.hasCountry(selectedCountry)) $('geometry-note').textContent='No separate polygon at this map scale. Use the index and coverage directory.';
      $('focus-selected').addEventListener('click',()=>{const result=map?.focusCountry(selectedCountry);if(result===false)$('geometry-note').textContent='This country or territory is not represented separately at this map scale. Its reporting remains available in the index.';});
    }
    panel.querySelectorAll('[data-select-country]').forEach(b=>b.addEventListener('click',()=>{onSelectCountry(b.dataset.selectCountry);$('country-filter').focus({preventScroll:true});}));
    panel.querySelectorAll('[data-open-record]').forEach(b=>b.addEventListener('click',()=>onOpenEvent(b.dataset.openRecord,b)));
  }
  return {update,reset:()=>map?.reset()};
}
