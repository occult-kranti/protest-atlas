import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDisplayStatus} from '../app.js';
import {withinWindow, readViewState, encodeViewState, csvForEvents} from '../explore.js';
import {countRecordsByCountry} from '../map.js';
import {matchesHistory, completionKind, outcomeHTML} from '../history.js';
import {normalizeCandidates, reviewErrors, canonicalUrl} from '../review.js';

const now = Date.parse('2026-10-02T20:00:00Z');
const load = async name => JSON.parse(await readFile(new URL('../public/'+name, import.meta.url)));

test('time filters use observation date; future and expired observations stay out', () => {
  assert.equal(withinWindow({last_observed_at:'2026-10-02'},'7',now), true);
  assert.equal(withinWindow({last_observed_at:'2026-09-01',last_verified:'2026-10-02'},'7',now), false);
  assert.equal(withinWindow({last_observed_at:'2026-10-03'},'7',now), false);
  assert.equal(withinWindow({last_observed_at:'invalid'},'30',now), false);
  assert.equal(withinWindow({last_observed_at:'2026-09-25T20:00:00Z'},'7',now), false);
  assert.equal(getDisplayStatus({status:'ongoing',last_observed_at:'2026-09-29T20:00:00Z'},now), 'needs-review');
  assert.equal(getDisplayStatus({status:'ongoing',last_observed_at:'2026-09-29T20:00:01Z'},now), 'ongoing');
});

test('shared view restores every filter and rejects unsupported control values', () => {
  const state={query:'housing & wages',country:'ES',region:'Europe',issue:'housing',status:'unknown',window:'7',year:'2024',city:'ES:Madrid',outcome:'documented'};
  assert.deepEqual(readViewState(encodeViewState(state)),state);
  assert.equal(readViewState('?country=<svg>&status=live&window=999').country,'');
  assert.equal(readViewState('?status=live').status,'');
  assert.equal(readViewState('?window=999').window,'all');
});

test('CSV preserves attribution, quoted text, and guards formula injection', () => {
  const csv=csvForEvents([{id:'a',country_name:'Spain',title:' =SUM(1,2) "test"',issues:['housing'],last_observed_at:'2026-10-02',status:'unknown',sources:[{url:'https://example.org/report'}]}]);
  assert.ok(csv.includes('"\' =SUM(1,2) ""test"""'));
  assert.ok(csv.includes('https://example.org/report'));
  assert.ok(csv.includes('Recorded status only; consult observation age'));
});

test('map totals agree with reported data; examples remain a separate input', async () => {
  const reported=await load('events.json'), examples=await load('examples.json');
  const counts=countRecordsByCountry(reported.events);
  for(const [code,count] of Object.entries(counts))assert.equal(count,reported.events.filter(e=>e.country===code).length);
  assert.equal(Object.values(countRecordsByCountry(reported.events)).reduce((a,b)=>a+b,0),reported.events.length);
  assert.deepEqual(countRecordsByCountry([...examples.events,{country:'invalid'}]),{GB:1});
  const geo=await load('world-countries.geo.json');
  assert.equal(geo.features.length,177);
  for (const code of ['FR','IN','ES']) assert.equal(geo.features.filter(f=>f.properties.code===code).length,1);
  assert.equal(geo.features.filter(f=>f.properties.code===null).length,3);
});

test('candidate imports deduplicate sources without inventing occurrence fields', async () => {
  const events=(await load('events.json')).events, url=events[0].sources[0].url;
  const lead={id:'lead-1',title:'Unverified metadata',url,publisher_domain:new URL(url).hostname,publisher_country:'Canada',language:'English',gdelt_seen_at:'20261002T120000Z',review_status:'unverified'};
  const payload={schema_version:1,collected_at:'2026-10-02T19:27:06Z',candidates:[lead,{...lead,id:'lead-2',url:url+'#duplicate'}]};
  const normalized=await normalizeCandidates(payload,events);
  assert.equal(normalized.candidates.length,1);
  assert.deepEqual(normalized.candidates[0].existing_event_ids,[events[0].id]);
  assert.equal(normalized.candidates[0].country,undefined);
  assert.equal(normalized.candidates[0].observed_date,undefined);
  await assert.rejects(normalizeCandidates({...payload,candidates:[{...lead,country:'CA'}]},events),/Unexpected/);
  assert.throws(()=>canonicalUrl('javascript:alert(1)'));
  assert.equal(canonicalUrl('https://example.org/report?utm_source=x#top'),'https://example.org/report');
});

test('ready and duplicate decisions require manual evidence, never publication', () => {
  const row={candidate:{existing_event_ids:[]},disposition:'ready-for-editor',notes:'',claim_summary:'',attribution:'',observed_date:null,source_published_at:null,country:null,source_checked:false,duplicate_event_id:null};
  assert.equal(reviewErrors(row,new Set(['FR']),new Set(['fr-record'])).length,5);
  const complete={...row,country:'FR',observed_date:'2026-10-02',source_checked:true,claim_summary:'Attributed claim',attribution:'Publisher'};
  assert.deepEqual(reviewErrors(complete,new Set(['FR']),new Set(['fr-record'])),[]);
  assert.ok(reviewErrors({...complete,candidate:{existing_event_ids:['fr-record']}},new Set(['FR']),new Set(['fr-record'])).some(e=>e.includes('duplicate')));
  assert.ok(reviewErrors({...row,disposition:'duplicate'},new Set(['FR']),new Set(['fr-record'])).length);
  assert.deepEqual(reviewErrors({...row,disposition:'duplicate',duplicate_event_id:'fr-record'},new Set(['FR']),new Set(['fr-record'])),[]);
});


test('historical cities, years and outcome evidence are independent filters', () => {
  const event={country:'FR',start_date:'2024-01-20',end_date:'2024-02-01',last_observed_at:'2024-02-01',timeline:[]};
  const context={cities:[{name:'Paris'}],outcome_status:'documented'};
  assert.equal(matchesHistory(event,context,{year:'2024',city:'FR:Paris',outcome:'documented'}),true);
  assert.equal(matchesHistory(event,context,{year:'2025'}),false);
  assert.equal(matchesHistory(event,context,{city:'FR:Lyon'}),false);
  assert.equal(matchesHistory(event,null,{outcome:'documented'}),false);
  assert.equal(completionKind([{status:'ended'},{status:'unknown'}]),'mixed');
  assert.equal(completionKind([{status:'ended'}]),'ended-only');
  assert.equal(completionKind([{status:'unknown'}]),'none');
});

test('outcome view preserves inference, source links and unknown end', () => {
  const event={status:'unknown',sources:[{id:'s1'}]};
  const context={episode_scope:'Bounded episode',cities:[],status_basis:{text:'Not known',source_ids:[]},outcome_status:'documented',outcomes:[{date:'2024-01-01',summary:'<script>test</script>',causality:'not-established',source_ids:['s1'],favours:[{actor:'Workers',effect:'benefit',basis:'inference',note:'Only this demand'}]}],research_note:'Limited evidence'};
  const html=outcomeHTML(event,context);
  assert.ok(html.includes('Assessment / inference'));
  assert.ok(html.includes('protest causation is not established'));
  assert.ok(html.includes('End not established'));
  assert.ok(html.includes('#detail-source-1'));
  assert.ok(!html.includes('<script>'));
});
