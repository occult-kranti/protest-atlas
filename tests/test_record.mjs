// WP3 contracts: record facts, cards (both densities), the record body and the outcome section.
// SPEC §7, §8, §19 WP3 acceptance; editorial §5, §6, §7, §8, §9. Node only, offline, no DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  VERIFICATION_LABELS, NOT_ESTABLISHED, positionView, positionSentence, positionList, stateActionSummary,
  intensityFacets, intensitySummary, timeframe, evidenceLine, primarySource,
} from '../js/record-facts.js';
import {renderCard, renderCardSkeleton} from '../js/cards.js';
import {RECORD_SECTIONS, renderRecord, patchRecordStatus, mountRecordChrome} from '../js/detail.js';
import {outcomeHTML, contextFor} from '../history.js';
import * as history from '../history.js';
import {bandTag, absoluteText} from '../js/html.js';
import {BAND_BADGES, BAND_LABELS} from '../freshness.js';

const load = async name => JSON.parse(await readFile(new URL(`../public/${name}`, import.meta.url)));
const envelope = await load('events.json');
const contexts = await load('event-context.json');
const examples = await load('examples.json');
const countries = await load('countries.json');
const events = envelope.events;
const SNAPSHOT_2_OCT = envelope.generated_at === '2026-10-02T22:45:35Z';
const NOW = Date.parse('2026-10-02T23:00:00Z');
const NINE_OCT = Date.parse('2026-10-09T12:00:00Z');
const names = new Map(countries.map(c => [c.code, c.name]));
const countryName = code => names.get(code) ?? code;
const byId = prefix => {
  const event = events.find(e => e.id.startsWith(prefix));
  assert.ok(event, `fixture ${prefix} exists`);
  return event;
};
const ctx = event => contextFor(contexts, event.id) ?? null;
const card = (event, opts = {}) => renderCard(event, {context: ctx(event), now: NOW, countryName, ...opts});
const record = (event, opts = {}) => renderRecord(event, {context: ctx(event), mode: 'reported', now: NOW, countryName, ...opts});

const ENTITIES = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"};
const decode = s => s.replace(/&(amp|lt|gt|quot|#39);/g, m => ENTITIES[m]);
/** Visible-ish text: tags become spaces, whitespace collapses. */
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** Text of the first element with this class (non-nested markup only). */
const textOf = (html, cls) => {
  const m = html.match(new RegExp(`<(\\w+) class="${cls}"[^>]*>([\\s\\S]*?)</\\1>`));
  return m ? text(m[2]) : null;
};
/** Every text node between tags. */
const textNodes = html => [...html.matchAll(/>([^<]+)</g)].map(m => decode(m[1]).trim()).filter(Boolean);
/** All string values in the published data, for the data-verbatim exception (SPEC §18.1 b). */
const dataStrings = [];
const collect = value => {
  if (typeof value === 'string') dataStrings.push(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};
[envelope, contexts, examples, countries].forEach(collect);
const dataBlob = dataStrings.join('\n');
const fromData = node => dataBlob.includes(node);

// Independent re-implementation of the editorial §6.2 allowlist, to check the computed set.
const norm = v => String(v ?? '').trim().toLowerCase().replace(/\.$/, '');
const DV = new Set(['unknown', 'not established', 'not established by this record', 'disruption not established by this record', 'violence not established by this record']);
const TU = new Set(['not established', 'no reliable event-wide count established', 'no single verified numerical estimate adopted', 'no verified numerical estimate retained', 'reliable comparable count not established']);
const allUndescribed = e => e.intensity.turnout.min == null && e.intensity.turnout.max == null
  && (!norm(e.intensity.turnout.qualifier) || TU.has(norm(e.intensity.turnout.qualifier)))
  && (!norm(e.intensity.disruption) || DV.has(norm(e.intensity.disruption)))
  && (!norm(e.intensity.violence) || DV.has(norm(e.intensity.violence)));

// ------------------------------------------------------------------ record-facts.js

test('frozen labels and the exact not-established allowlist (C-14, §7.4)', () => {
  assert.deepEqual(VERIFICATION_LABELS, {'single-source': 'Single source', corroborated: 'Corroborated', contested: 'Contested', illustrative: 'Illustrative'});
  assert.deepEqual(NOT_ESTABLISHED, {
    disruptionViolence: ['unknown', 'not established', 'not established by this record', 'disruption not established by this record', 'violence not established by this record'],
    turnout: ['not established', 'no reliable event-wide count established', 'no single verified numerical estimate adopted', 'no verified numerical estimate retained', 'reliable comparable count not established'],
  });
});

test('positionView and positionSentence: four stances, unknown stance, missing target', () => {
  const p = stance => positionView({actor: 'Union', stance, target: 'Pay rise', claim: 'Asked for pay.', source_ids: ['s1']});
  assert.deepEqual(['support', 'oppose', 'mixed', 'unclear'].map(s => [p(s).pill, p(s).pillLong]),
    [['For', 'For'], ['Against', 'Against'], ['Mixed', 'Mixed position on'], ['Unclear', 'Position unclear on']]);
  assert.equal(p('rioting').stance, 'unclear');
  assert.equal(p('rioting').pill, 'Unclear');
  assert.deepEqual(Object.keys(p('support')).sort(), ['actor', 'claim', 'pill', 'pillLong', 'sourceIds', 'stance', 'target']);
  assert.equal(positionView({actor: 'Union', stance: 'oppose'}).target, 'target not established');
  assert.equal(positionSentence({actor: 'Pro-Yoon demonstrators', stance: 'oppose', target: 'Yoon’s removal'}), 'Against · Yoon’s removal — Pro-Yoon demonstrators');
  assert.equal(positionSentence({actor: 'Party', stance: 'mixed', target: 'Bill'}), 'Mixed · Bill — Party');
});

test('positionList keeps recorded order and derives no counts (worked cases, editorial §5.2)', () => {
  const sentences = prefix => positionList(byId(prefix)).map(v => `${v.pill} · ${v.target} — ${v.actor}`);
  assert.deepEqual(sentences('kr-yoon'), ['Against · Yoon’s presidency — Anti-Yoon demonstrators', 'Against · Yoon’s removal — Pro-Yoon demonstrators']);
  assert.deepEqual(sentences('ng-pengassan'), ['For · Union rights and reinstatement — PENGASSAN', 'For · Company reorganisation — Dangote management']);
  assert.deepEqual(sentences('nz-wellington-treaty'), ['Against · Treaty Principles Bill — Hīkoi mō te Tiriti supporters', 'For · Treaty Principles Bill — ACT Party']);
  assert.deepEqual(sentences('es-housing-2026'), ['For · Tenant protection — Housing demonstrators', 'Against · Proposed housing decrees — Junts lawmakers']);
  assert.deepEqual(sentences('as-noaa'), ['Against · Research potentially facilitating commercial seabed mining — Finafinau and Greenpeace USA activists',
    'For · Ocean-science research mission — NOAA research ship representatives']);
  for (const view of positionList(byId('kr-yoon'))) {
    assert.ok(Object.values(view).every(v => typeof v !== 'number'), 'no numeric fields');
  }
  assert.deepEqual(positionList({}), []);
});

test('intensity facets: fixed order, exact allowlist, verbatim text, never 0 or none', () => {
  const facets = intensityFacets(byId('kr-yoon'));
  assert.deepEqual(facets.map(f => [f.key, f.label, f.text, f.known]), [
    ['turnout', 'Turnout', 'Not established in this record', false],
    ['disruption', 'Disruption', 'Not established in this record', false],
    ['violence', 'Violence or harm', 'Not established in this record', false],
  ]);
  const es = intensityFacets(byId('es-housing-2026'));
  assert.equal(es[0].text, 'Hundreds, as reported; no numeric range inferred.', 'turnout qualifier preserved');
  assert.equal(es[1].text, 'Disruption beyond the reported march not established.', 'partial description is described');
  assert.equal(es[1].known, true);
  assert.equal(es[2].known, false, '"Not established by this record." is on the list');
  assert.equal(intensityFacets(byId('as-noaa'))[1].text, 'Peaceful confrontation and radio exchange; operational disruption not established.');
  const synthetic = (turnout, disruption = 'unknown', violence = 'Unknown') => intensityFacets({intensity: {turnout, disruption, violence, source_ids: []}});
  assert.equal(synthetic({min: 1000, max: null, qualifier: ''})[0].text, 'At least 1,000');
  assert.equal(synthetic({min: null, max: 2000, qualifier: 'Police estimate.'})[0].text, 'Up to 2,000. Police estimate.');
  assert.equal(synthetic({min: 1000, max: 2000, qualifier: null})[0].text, '1,000–2,000');
  assert.equal(synthetic({min: null, max: null, qualifier: 'NOT ESTABLISHED.'})[0].known, false);
  assert.equal(synthetic({min: null, max: null, qualifier: 'Count unclear'})[0].text, 'Count unclear', 'a new variant stays verbatim');
  assert.equal(synthetic({min: 0, max: null, qualifier: 'not established'})[0].text, 'Not established in this record', 'zero is never a count');
  for (const event of events) {
    for (const facet of intensityFacets(event)) {
      assert.ok(!/^(0|none|n\/a|—|-)$/i.test(facet.text), `${event.id} ${facet.key}`);
      assert.ok(facet.text.trim().length > 0);
    }
  }
});

test('intensitySummary: the C6 single line for exactly the computed set (33 in the 2 Oct snapshot)', () => {
  const computed = events.filter(allUndescribed).map(e => e.id);
  const summarised = events.filter(e => intensitySummary(e).allUnknown).map(e => e.id);
  assert.deepEqual(summarised, computed);
  if (SNAPSHOT_2_OCT) assert.equal(computed.length, 33);
  assert.equal(intensitySummary(byId('kr-yoon')).line, 'Turnout, disruption and violence: not established in this record.');
  assert.equal(intensitySummary(byId('tz-drivers')).line,
    'Turnout: not established · Disruption: Passenger and freight transport halted, leaving travelers stranded. · Violence or harm: not established');
  assert.deepEqual(intensitySummary(byId('tz-drivers')).items.map(i => i.label), ['Turnout', 'Disruption', 'Violence or harm']);
});

test('stateActionSummary: verbatim "{action} — {attribution}"; none is "Not established in this record" (47 records)', () => {
  assert.deepEqual(stateActionSummary({state_response: []}), {present: false, items: [], text: 'Not established in this record'});
  assert.equal(stateActionSummary(byId('tz-drivers')).text, "Government suspended points system and opened a review — The Chanzo's reporting");
  const none = events.filter(e => !stateActionSummary(e).present);
  assert.equal(none.length, events.filter(e => !e.state_response.length).length);
  if (SNAPSHOT_2_OCT) assert.equal(none.length, 47);
});

test('timeframe: every editorial §8 template; unknown onset stays visible; never "Since"', () => {
  const tf = event => timeframe(event, null, NOW).line;
  assert.equal(tf(byId('tz-drivers')), '29 Sep – 30 Sep 2026 (2 days) · ended / suspended');
  assert.equal(tf(byId('nz-wellington-treaty')), '19 Nov 2024 (one day) · ended / suspended');
  assert.equal(tf(byId('kr-yoon')), 'Dated evidence 21 Dec 2024 – 4 Apr 2025 · onset and end not established');
  assert.equal(tf(byId('es-housing-2026')), 'Dated evidence 2 Oct 2026 only · onset and end not established');
  assert.equal(tf(byId('as-noaa')), 'From 2 Sep 2026 · end not established');
  assert.equal(tf({start_date: '2025-12-21', end_date: '2026-01-04'}), '21 Dec 2025 – 4 Jan 2026 (15 days) · ended / suspended');
  assert.equal(tf({start_date: null, end_date: '2026-09-30'}), 'Onset not established · ended 30 Sep 2026');
  assert.equal(tf({start_date: null, end_date: null, timeline: []}), 'Onset and end not established');
  assert.equal(tf({timeline: [{date: '2026-10-02'}, {date: '2026-10-02'}]}), 'Dated evidence 2 Oct 2026 only · onset and end not established');
  const view = timeframe(byId('tz-drivers'), null, NOW);
  assert.deepEqual({onset: view.onset, end: view.end, latestEvidence: view.latestEvidence, band: view.band, spanDays: view.spanDays},
    {onset: '2026-09-29', end: '2026-09-30', latestEvidence: '2026-10-01', band: 'fresh', spanDays: 2});
  assert.equal(timeframe(byId('kr-yoon'), null, NOW).spanDays, null, 'no duration from the timeline');
  for (const event of events) assert.ok(!/\bsince\b/i.test(tf(event)), event.id);
});

test('evidenceLine and primarySource (C8, C-16)', () => {
  const tz = evidenceLine(byId('tz-drivers'));
  assert.equal(tz.text, 'Daily News · published 30 Sep 2026 · Corroborated · 2 links · AI-assisted check');
  assert.equal(tz.url, byId('tz-drivers').sources[0].url);
  const chain = evidenceLine({verification: {level: 'single-source'}, sources: [1, 2, 3].map(n => ({id: `s${n}`, url: `https://example.org/${n}`, publisher: 'Wire', published_at: null}))});
  assert.equal(chain.levelLabel, 'Single source', 'three links of one chain are still one source');
  assert.equal(chain.text, 'Wire · publication date not given · Single source · 3 links · AI-assisted check');
  for (const id of ['sg-workers-placard-action-2024', 'mx-judges-strike-2024']) {
    const event = events.find(e => e.id === id);
    if (event) assert.equal(evidenceLine(event).levelLabel, 'Contested');
  }
  assert.deepEqual(primarySource(byId('kr-yoon')).label, 'Read Reuters');
  const es = primarySource(byId('es-housing-2026'));
  assert.equal(es.label, 'Read the source', '"Al Jazeera, with AP and Reuters" is over 24 characters');
  assert.equal(es.ariaLabel, 'Read the source: Al Jazeera, with AP and Reuters (opens in a new tab)');
  assert.equal(primarySource({sources: [{url: 'javascript:alert(1)', publisher: 'X'}]}).url, '');
});

// ------------------------------------------------------------------ cards.js

test('worked cases read correctly on cards, in both densities (smoke 15)', () => {
  const lines = {
    'kr-yoon': ['Against Yoon’s presidency — Anti-Yoon demonstrators', 'Against Yoon’s removal — Pro-Yoon demonstrators'],
    'ng-pengassan': ['For Union rights and reinstatement — PENGASSAN', 'For Company reorganisation — Dangote management'],
    'nz-wellington-treaty': ['Against Treaty Principles Bill — Hīkoi mō te Tiriti supporters', 'For Treaty Principles Bill — ACT Party'],
    'es-housing-2026': ['For Tenant protection — Housing demonstrators', 'Against Proposed housing decrees — Junts lawmakers',
      'Disruption: Disruption beyond the reported march not established.'],
    'as-noaa': ['Disruption: Peaceful confrontation and radio exchange; operational disruption not established.'],
  };
  for (const [prefix, expected] of Object.entries(lines)) {
    for (const density of ['card', 'row']) {
      const t = text(card(byId(prefix), {density}));
      for (const line of expected) assert.ok(t.includes(line), `${prefix} (${density}) contains "${line}"`);
    }
  }
  const nzRecord = text(record(byId('nz-wellington-treaty')));
  assert.ok(nzRecord.includes("Each line is one actor's position toward a named target, as reported in the cited source."), 'D4-sub in the detail');
});

test('card anatomy: status leads the band, dated (smoke 16); facts rows; no chevron', () => {
  const html = card(byId('tz-drivers'));
  assert.match(html, /^<article class="card" data-id="tz-drivers-20260929" data-status="ended" data-band="fresh" data-ended="true" data-density="card">/);
  assert.equal(textOf(html, 'status'), 'Ended / suspended 30 Sep 2026');
  assert.ok(html.indexOf('class="status"') < html.indexOf('class="band"'), 'status precedes band in DOM order');
  assert.equal(textOf(html, 'band-text'), 'Within 72 h');
  assert.ok(text(html).includes('Timeframe 29 Sep – 30 Sep 2026 (2 days) · ended / suspended'));
  assert.ok(html.includes('<a class="card-link" href="#/record/tz-drivers-20260929" data-open-record="tz-drivers-20260929">'));
  assert.equal(textOf(html, 'card-place'), 'Tanzania, United Republic of · Dar es Salaam and other cities');
  assert.ok(html.includes('<p class="card-outcome">'), 'C9 teaser when the outcome is documented');
  assert.ok(!/chevron|›/.test(html));
  const order = ['card-status', 'card-place', 'card-title', 'card-when', 'card-issues', 'card-facts', 'card-outcome', 'card-evidence'];
  const positions = order.map(cls => html.indexOf(`class="${cls}"`));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'card order §7.2');
  assert.deepEqual([...html.matchAll(/<dt>([^<]+)<\/dt>/g)].map(m => m[1]), ['Timeframe', 'For / against', 'Intensity', 'Police / state']);
  const fr = card(byId('fr-schools'));
  assert.equal(textOf(fr, 'card-place'), 'France', 'the label is dropped when it repeats the country');
  assert.equal(textOf(card(byId('tz-drivers'), {countryName: c => c}), 'card-place'), 'TZ · Dar es Salaam and other cities', 'countries failure shows the code');
});

test('List density keeps C1–C8 (C-51) and drops only the outcome teaser', () => {
  const html = card(byId('tz-drivers'), {density: 'row'});
  assert.ok(html.includes('data-density="row"'));
  assert.ok(!html.includes('card-outcome'));
  assert.ok(html.indexOf('class="status"') < html.indexOf('class="band"'));
  assert.equal(textOf(html, 'card-row-state'), "Police / state: Government suspended points system and opened a review — The Chanzo's reporting");
  assert.ok(text(html).includes('Timeframe: 29 Sep – 30 Sep 2026 (2 days) · ended / suspended · Intensity: Turnout: not established'));
});

test('every real card, both densities: evidence row, issues, timeframe and intensity lines (editorial check 10)', () => {
  for (const event of events) {
    for (const density of ['card', 'row']) {
      const html = card(event, {density});
      const t = text(html);
      const label = `${event.id} (${density})`;
      assert.match(html, /<p class="card-evidence"><a class="source-link" href="https:[^"]+" target="_blank" rel="noopener noreferrer">/, label);
      assert.match(t, /(published \d{1,2} [A-Z][a-z]{2} \d{4}|publication date not given)/, label);
      assert.match(t, / · (Single source|Corroborated|Contested) · \d+ links? · AI-assisted check/, label);
      assert.ok(html.includes('class="card-issues"'), label);
      assert.ok(t.includes(timeframe(event, null, NOW).line), label);
      const intensity = intensitySummary(event);
      if (density === 'row') assert.ok(t.includes(`Intensity: ${intensity.line}`), label);
      else if (intensity.allUnknown) assert.ok(t.includes(intensity.line), label);
      else for (const item of intensity.items) assert.ok(t.includes(`${item.label}: ${item.text}`), label);
      const state = stateActionSummary(event);
      if (!state.present) assert.ok(t.includes('Police / state Not established in this record') || t.includes('Police / state: Not established in this record'), label);
      assert.ok(t.includes('Latest evidence '), label);
    }
  }
});

test('the C6 single line appears on exactly the computed set; no 0, —, None or N/A for intensity or state', () => {
  const single = events.filter(e => card(e).includes('<p class="facet-none">Turnout, disruption and violence: not established in this record.</p>')).map(e => e.id);
  assert.deepEqual(single, events.filter(allUndescribed).map(e => e.id));
  const placeholder = /^(0|—|-|none|n\/a)$/i;
  for (const event of events) {
    for (const density of ['card', 'row']) {
      const t = text(card(event, {density}));
      const values = [...intensitySummary(event).items.map(i => i.text), stateActionSummary(event).text];
      for (const value of values) assert.ok(!placeholder.test(value.trim()), `${event.id}: ${value}`);
      assert.ok(!/(Turnout|Disruption|Violence or harm|Police \/ state):? (0|—|None|N\/A)( |$)/.test(t), `${event.id} (${density})`);
    }
  }
});

test('band badge: visible short label, visually hidden long label, never aria-label (C-51)', () => {
  for (const band of Object.keys(BAND_BADGES)) {
    const html = bandTag(band);
    assert.ok(!html.includes('aria-label'));
    assert.equal(textOf(html, 'band-text'), BAND_BADGES[band]);
    assert.equal(textOf(html, 'visually-hidden'), BAND_LABELS[band]);
  }
  for (const event of events) assert.ok(!/class="band"[^>]*aria-label/.test(card(event)), event.id);
});

test('9 Oct clock: stale bands and relative days, no "latest"/"new" band or status (§16.2)', () => {
  const tz = renderCard(byId('tz-drivers'), {context: ctx(byId('tz-drivers')), now: NINE_OCT, countryName});
  assert.equal(textOf(tz, 'status'), 'Ended / suspended 30 Sep 2026');
  assert.ok(text(tz).includes('Latest evidence 1 Oct 2026 · 8 days ago'));
  assert.equal(textOf(tz, 'band-text'), '7–30 days ago');
  const electoral = renderCard(byId('in-electoral'), {now: NINE_OCT, countryName});
  assert.ok(text(electoral).includes('Current status not established'));
  assert.ok(text(electoral).includes('Latest evidence 2 Oct 2026 · 7 days ago'));
  for (const event of events) {
    const html = renderCard(event, {now: NINE_OCT, countryName});
    for (const cls of ['band-text', 'status']) assert.ok(!/^(latest|new)\b/i.test(textOf(html, cls)), `${event.id} ${cls}`);
    assert.ok(!html.includes('Within 72 h'), event.id);
  }
});

test('example mode carries the C11 watermark on cards and the record', () => {
  const example = examples.events[0];
  for (const density of ['card', 'row']) {
    const html = renderCard(example, {mode: 'example', now: NOW, density});
    assert.ok(html.includes('<p class="card-watermark">Illustrative example • not a real event</p>'), density);
    assert.ok(text(html).includes('Illustrative'), 'level label');
  }
  assert.ok(!card(byId('tz-drivers')).includes('card-watermark'));
  const rec = renderRecord(example, {mode: 'example', now: NOW});
  assert.ok(text(rec).includes('Illustrative example • not a real event This record is fictional and is excluded from counts and export.'));
});

test('renderCardSkeleton is aria-hidden, static and sized by count', () => {
  const html = renderCardSkeleton(2);
  assert.ok(html.startsWith('<div class="card-skeletons" aria-hidden="true">'));
  assert.equal(html.match(/class="card card-skeleton"/g).length, 2);
  assert.equal(renderCardSkeleton(0), '');
  assert.equal(renderCardSkeleton().match(/class="card card-skeleton"/g).length, 3);
});

// ------------------------------------------------------------------ detail.js

test('renderRecord: D1, title, every section id, tabs, sources and outcome strings', () => {
  assert.deepEqual(RECORD_SECTIONS.map(s => s.label), ['Overview', 'For/against', 'Intensity', 'Police/state', 'Outcome', 'Timeline', 'Sources']);
  const html = record(byId('tz-drivers'));
  assert.ok(html.includes('<h2 id="detail-title" class="rec-title" tabindex="-1">'));
  assert.ok(text(html).includes('AI-assisted source check · no human editorial review'));
  for (const {id} of RECORD_SECTIONS) {
    assert.ok(html.includes(`<section id="${id}"`), id);
    assert.ok(html.includes(`<a class="rec-tab" href="#${id}" data-scroll-to="${id}"`), `tab ${id}`);
  }
  assert.ok(html.includes('<nav class="rec-tabs" aria-label="Record sections">'));
  assert.ok(html.includes('<li id="detail-source-1" class="source-item" tabindex="-1">'));
  assert.ok(html.includes('<li id="detail-source-2" class="source-item" tabindex="-1">'));
  assert.ok(html.includes('Assessment / inference'));
  assert.ok(html.includes('Ended / suspended episode'));
  assert.ok(text(record(byId('es-housing-2026'))).includes('protest causation is not established'));
  assert.ok(record(byId('fr-schools')).includes('End not established'));
  const t = text(html);
  for (const heading of ['What happened', 'At a glance', 'Who is for or against what', 'Reported intensity', 'Police and state response',
    'What changed — and for whom?', 'Timeline', 'Evidence and verification', 'Sources']) assert.ok(t.includes(heading), heading);
  assert.ok(t.includes('Verification: Corroborated'));
  assert.ok(t.includes('Source re-read (AI-assisted): 2 Oct 2026, 21:21 UTC'));
  assert.ok(t.includes('Source count is not a confidence score.'));
  assert.ok(t.includes('Record ID: tz-drivers-20260929'));
  assert.ok(html.includes('href="https://github.com/occult-kranti/protest-atlas/issues/new/choose"'));
  assert.ok(t.includes('Please do not post private details about participants.'));
  // §8.2 order
  const order = ['rec-disclosure', 'rec-meta', 'rec-place', 'id="detail-title"', 'id="rec-overview"', 'class="rec-tabs"', 'id="rec-positions"',
    'id="rec-intensity"', 'id="rec-state"', 'id="rec-outcome"', 'id="rec-timeline"', 'id="rec-sources"'].map(s => html.indexOf(s));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(html.indexOf('class="status rec-status"') < html.indexOf('class="band"'), 'status leads in the record meta');
});

test('glance: four linked cells; positions use "As reported:" and long pills; claims unquoted', () => {
  const html = record(byId('es-housing-2026'));
  const cells = [...html.matchAll(/<a class="rec-glance-cell" href="#(rec-[a-z]+)" data-scroll-to="\1"><span class="rec-glance-label">([^<]+)<\/span>/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(cells, [['rec-positions', 'For / against'], ['rec-intensity', 'Intensity'], ['rec-state', 'Police / state'], ['rec-timeline', 'Timeframe']]);
  assert.ok(html.includes('role="group" aria-labelledby="rec-glance-title"'));
  assert.ok(text(html).includes('Junts lawmakers Against Proposed housing decrees As reported: Argued the measures would constrain the rental market; parliamentary position, not a counterprotest.'));
  for (const event of events) {
    const rec = record(event);
    for (const m of rec.matchAll(/<p class="rec-claim">([\s\S]*?)<\/p>/g)) assert.ok(text(m[1]).startsWith('As reported: '), event.id);
  }
  const mixed = renderRecord({...byId('kr-yoon'), positions: [{actor: 'Party', stance: 'mixed', target: 'Bill', claim: 'Both.', source_ids: []}]}, {now: NOW});
  assert.ok(text(mixed).includes('Party Mixed position on Bill'));
});

test('intensity and state sections: D5 rows with help links and violence note; D6-empty for every record without a response', () => {
  const kr = record(byId('kr-yoon'));
  assert.equal((kr.match(/data-scroll-to="rec-intensity-help">What this means<\/a>/g) ?? []).length, 3);
  assert.ok(kr.includes('id="rec-intensity-help" tabindex="-1"'));
  assert.ok(text(kr).includes('No source is attached because none of these was established in this record.'));
  assert.ok(text(kr).includes('Violence or harm Not established in this record What this means Can include force used by police or security services'));
  const tz = record(byId('tz-drivers'));
  assert.ok(text(tz).includes('Source: Source 1'));
  assert.ok(text(tz).includes('Government suspended points system and opened a review Reported by: The Chanzo\'s reporting'));
  let empty = 0;
  for (const event of events) {
    const rec = record(event);
    const hasEmpty = rec.includes('No police or state response is recorded in this record. That is not evidence that none occurred.');
    assert.equal(hasEmpty, !event.state_response.length, event.id);
    if (hasEmpty) empty++;
  }
  assert.equal(empty, events.filter(e => !e.state_response.length).length);
});

test('timeline: dated marks only, open bracket for unknown onset, the 72-hour rule', () => {
  const kr = record(byId('kr-yoon'));
  const timeline = kr.slice(kr.indexOf('id="rec-timeline"'), kr.indexOf('id="rec-sources"'));
  assert.ok(timeline.includes('rec-mark rec-mark--open'));
  assert.ok(text(timeline).includes('Dated entries only. Gaps between dates are not assumed activity. Dated evidence 21 Dec 2024 – 4 Apr 2025 · onset and end not established Onset not established 21 Dec 2024'));
  assert.ok(text(timeline).includes("'Reported ongoing' needs evidence dated within the last 72 hours. A newer source re-read alone cannot renew it."));
  const tz = record(byId('tz-drivers'));
  assert.ok(!tz.slice(tz.indexOf('id="rec-timeline"')).includes('rec-mark--open'), 'known onset has no bracket');
  assert.equal((tz.match(/<span class="rec-mark" aria-hidden="true">/g) ?? []).length, byId('tz-drivers').timeline.length);
});

test('needs-review: the #temporal-update note and status (patchRecordStatus contract)', () => {
  const ongoing = {...byId('es-housing-2026'), status: 'ongoing'};
  const fresh = renderRecord(ongoing, {now: NOW});
  assert.ok(!fresh.includes('id="temporal-update"'));
  assert.ok(text(fresh).includes('Reported ongoing · evidence dated 2 Oct 2026'));
  const aged = renderRecord(ongoing, {now: Date.parse('2026-10-06T00:00:00Z')});
  assert.ok(aged.includes('<p id="temporal-update" class="rec-temporal">Needs review: the latest evidence for this record is more than 72 hours old'));
  assert.ok(aged.indexOf('id="detail-title"') < aged.indexOf('id="temporal-update"'));
  assert.ok(text(aged).includes('Needs review · current status unknown'));
  assert.doesNotThrow(() => patchRecordStatus(null, ongoing, NOW));
  const chrome = mountRecordChrome(null);
  assert.equal(typeof chrome.refresh, 'function');
  assert.equal(typeof chrome.destroy, 'function');
});

test('escaping: <script> in title, summary, claim, action and attribution', () => {
  const evil = '<script>alert(1)</script>';
  const event = {...byId('tz-drivers'), title: evil, summary: evil,
    positions: [{actor: evil, stance: 'oppose', target: evil, claim: evil, source_ids: []}],
    state_response: [{action: evil, attribution: evil, source_ids: []}], issues: [evil]};
  for (const html of [renderCard(event, {now: NOW}), renderCard(event, {now: NOW, density: 'row'}), renderRecord(event, {now: NOW})]) {
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  }
  const unsafe = renderCard({...byId('tz-drivers'), sources: [{id: 'x', url: 'javascript:alert(1)', publisher: 'Bad', published_at: '2026-10-01'}]}, {now: NOW});
  assert.ok(!unsafe.includes('javascript:'));
});

test('every real event + context, and the example, renders in both densities and as a record', () => {
  for (const event of [...events, ...examples.events]) {
    const mode = examples.events.includes(event) ? 'example' : 'reported';
    for (const density of ['card', 'row']) assert.doesNotThrow(() => renderCard(event, {context: ctx(event), mode, now: NOW, countryName, density}), event.id);
    assert.doesNotThrow(() => renderRecord(event, {context: ctx(event), mode, now: NOW, countryName}), event.id);
    assert.doesNotThrow(() => renderRecord(event, {now: NINE_OCT}), `${event.id} without context`);
  }
  assert.doesNotThrow(() => renderCard({id: 'empty'}, {now: NOW}));
  assert.doesNotThrow(() => renderRecord({id: 'empty'}, {now: NOW}));
});

test('copy scans: no quotation marks, tallies, "Sides", "Violence:", +/− glyphs or banned words outside data text', () => {
  const banned = /\b(live|breaking|real-time|happening now|right now|hotspots?|trending|most active|escalating|severity|danger|risk level|sides|vs|as of|synced|join|attend|rsvp|remind me|add to calendar)\b/i;
  const tally = /\b\d+\s+(for|against|support|supports|oppose|opposes)\b/i;
  for (const event of events) {
    const outputs = [card(event), card(event, {density: 'row'}), record(event), renderCard(event, {now: NINE_OCT}), renderRecord(event, {now: NINE_OCT})];
    for (const html of outputs) {
      assert.ok(!/[“”]/.test(html), `${event.id} curly quotes`);
      assert.ok(!/\+ ?FOR|− ?AGAINST|Violence:/.test(html), event.id);
      for (const node of textNodes(html)) {
        if (fromData(node)) continue;
        assert.ok(!banned.test(node), `${event.id}: "${node}"`);
        assert.ok(!tally.test(node), `${event.id}: "${node}"`);
        assert.ok(!node.includes('%'), `${event.id}: "${node}"`);
        assert.ok(!/^(updated|last updated|reviewed|verified)\b/i.test(node), `${event.id}: "${node}"`);
      }
    }
  }
});

// ------------------------------------------------------------------ history.js

test('outcomeHTML keeps its pinned strings, routes refs through data-scroll-to and drops the old eyebrow', () => {
  const event = {status: 'unknown', sources: [{id: 's1'}]};
  const context = {episode_scope: 'Bounded episode', cities: [{name: 'Lyon', source_ids: ['s1']}, {name: 'Paris', source_ids: ['s1']}],
    status_basis: {text: 'Not known', source_ids: []}, outcome_status: 'documented',
    outcomes: [{date: '2024-01-01', summary: '<script>test</script>', causality: 'not-established', source_ids: ['s1'],
      favours: [{actor: 'Workers', effect: 'benefit', basis: 'inference', note: 'Only this demand'}]}], research_note: 'Limited evidence'};
  const html = outcomeHTML(event, context);
  for (const pinned of ['Assessment / inference', 'protest causation is not established', 'End not established', '#detail-source-1']) assert.ok(html.includes(pinned), pinned);
  assert.ok(html.includes('data-scroll-to="detail-source-1"'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('RESULTS / FOLLOW THE CHANGE'));
  assert.ok(text(html).includes('Reported cities: Lyon, Paris Source 1'), 'cities that share sources share one link');
  assert.ok(html.includes('Bounded episode'));
  assert.ok(!outcomeHTML(event, context, {scope: false}).includes('Bounded episode'), 'the record overview owns the scope line');
  assert.equal(history.renderResearchCoverage, undefined, 'moved to js/about.js');
  assert.ok(text(outcomeHTML(event, {...context, outcome_status: 'not-established', outcomes: []})).includes('No sourced outcome established in this snapshot.'));
});

test('dates use the copy deck month abbreviations', () => {
  assert.equal(absoluteText('2026-09-30'), '30 Sep 2026');
  assert.equal(absoluteText('2026-10-02T21:31:50Z'), '2 Oct 2026, 21:31 UTC');
});

// ------------------------------------------------------------------ css/record.css

test('record.css: components layer only, tokens only, no data-stance or id selectors, required media rules', async () => {
  const css = await readFile(new URL('../css/record.css', import.meta.url), 'utf8');
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(body.trim(), /^@layer components \{[\s\S]*\}$/);
  assert.ok(!/!important/.test(body));
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(body), 'no hex literals');
  assert.ok(!/data-stance/.test(body), 'no CSS may select on data-stance');
  assert.ok(!/(^|[\s,{}>+~])#[a-z]/im.test(body.replace(/url\([^)]*\)/g, '')), 'no id selectors');
  assert.ok(!/rgb\(|hsl\(/i.test(body), 'colours come from tokens');
  const medias = [...body.matchAll(/@media\s*([^{]+)\{/g)].map(m => m[1].trim());
  const allowed = ['(min-width: 600px)', '(min-width: 900px)', '(min-width: 1200px)', '(hover: hover) and (pointer: fine)',
    '(prefers-reduced-motion: reduce)', '(max-height: 500px)', '(forced-colors: active)'];
  for (const media of medias) assert.ok(allowed.includes(media), media);
  assert.match(body, /@media \(max-height: 500px\) \{\s*\.rec-tabs \{ position: static; \}/);
  assert.match(body, /@media \(forced-colors: active\) \{[\s\S]*\.card\[data-ended="true"\][\s\S]*border: 3px solid CanvasText/);
  assert.match(body, /\.side-pill \{ border: 1px solid CanvasText; \}/);
  assert.match(body, /\.source-ref \{[^}]*min-height: var\(--tap\)/);
});
