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
import {RECORD_SECTIONS, CONTEXT_UNAVAILABLE, ILLUSTRATIVE_OUTCOME, renderRecord, patchRecordStatus, mountRecordChrome} from '../js/detail.js';
import {countryNamer} from '../js/model.js';
import {outcomeHTML, contextFor} from '../history.js';
import * as history from '../history.js';
import {bandTag} from '../js/html.js';
import {BAND_BADGES, BAND_LABELS} from '../freshness.js';

// Literal expectations (ids, counts, dates, worked cases) read the frozen 2 Oct copies; the loops marked "every
// record" also run over public/*.json, where they check invariants only, so a data refresh cannot fail them (MAJOR 13).
const load = async (name, dir = 'tests/fixtures/snapshot-20261002') => JSON.parse(await readFile(new URL(`../${dir}/${name}`, import.meta.url)));
const envelope = await load('events.json');
const contexts = await load('event-context.json');
const examples = await load('examples.json');
const countries = await load('countries.json');
const liveEnvelope = await load('events.json', 'public');
const liveContexts = await load('event-context.json', 'public');
const events = envelope.events;
const liveEvents = liveEnvelope.events;
const SNAPSHOT_2_OCT = envelope.generated_at === '2026-10-02T22:45:35Z';
const NOW = Date.parse('2026-10-02T23:00:00Z');
const NINE_OCT = Date.parse('2026-10-09T12:00:00Z');
// The app's namer: short common names (MAJOR 9), the countries.json name otherwise.
const countryName = countryNamer(countries);
const liveNow = Math.max(...liveEvents.map(e => Date.parse(e.last_observed_at)).filter(Number.isFinite)) + 3_600_000;
const liveCtx = event => contextFor(liveContexts, event.id) ?? null;
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
/** aria-label, title and alt values (SPEC §18.1 scans them with the text). */
const attrTexts = html => [...html.matchAll(/\s(?:aria-label|title|alt)="([^"]*)"/g)].map(m => decode(m[1]).trim()).filter(Boolean);
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

test('a position without an actor drops the actor rather than inventing copy', () => {
  const view = positionView({stance: 'oppose', target: 'Bill'});
  assert.equal(view.actor, '');
  assert.equal(positionSentence({stance: 'oppose', target: 'Bill'}), 'Against · Bill');
  const event = {...byId('tz-drivers'), positions: [{stance: 'support', target: 'Pay', claim: 'Asked.', source_ids: []}]};
  for (const html of [renderCard(event, {now: NOW}), renderRecord(event, {now: NOW})]) {
    assert.ok(text(html).includes('For Pay'));
    assert.ok(!/actor not established| — <span class="side-actor"><\/span>|class="rec-actor"/.test(html));
  }
  const unnamed = {...byId('tz-drivers'), sources: [{id: 's1', url: '', publisher: '', title: 'Notice', published_at: null}]};
  for (const html of [renderCard(unnamed, {now: NOW}), renderCard(unnamed, {now: NOW, density: 'row'}), renderRecord(unnamed, {now: NOW})]) {
    assert.ok(!/Source not named|Publisher not named/.test(html));
  }
  assert.ok(text(renderCard(unnamed, {now: NOW})).includes('publication date not given · Corroborated · 1 link · AI-assisted check'));
  assert.ok(text(renderRecord(unnamed, {now: NOW})).includes('Notice · published date not given'), 'D10 omits a missing publisher (§8.8 wording)');
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
  assert.ok(SNAPSHOT_2_OCT, 'the fixture is the 2 Oct snapshot');
  assert.equal(computed.length, 33);
  assert.deepEqual(liveEvents.filter(e => intensitySummary(e).allUnknown).map(e => e.id), liveEvents.filter(allUndescribed).map(e => e.id), 'public data');
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
  assert.equal(none.length, 47);
  assert.equal(liveEvents.filter(e => !stateActionSummary(e).present).length, liveEvents.filter(e => !e.state_response.length).length, 'public data');
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
  const unnamed = evidenceLine({verification: {level: 'corroborated'}, sources: [{id: 's1', url: '', publisher: '', published_at: '2026-10-01'}]});
  assert.equal(unnamed.publisher, '');
  assert.equal(unnamed.text, 'published 1 Oct 2026 · Corroborated · 1 link · AI-assisted check', 'no invented publisher name');
  assert.equal(evidenceLine({sources: [{id: 's1', url: 'https://www.example.org/a'}]}).publisher, 'example.org', 'host when unnamed');
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
  // List density names every target with its own stance, in recorded order, one entry per position (no grouping).
  const rows = {
    'kr-yoon': 'Against: Yoon’s presidency · Against: Yoon’s removal',
    'ng-pengassan': 'For: Union rights and reinstatement · For: Company reorganisation',
    'nz-wellington-treaty': 'Against: Treaty Principles Bill · For: Treaty Principles Bill',
    'es-housing-2026': 'For: Tenant protection · Against: Proposed housing decrees',
    'as-noaa': 'Against: Research potentially facilitating commercial seabed mining · For: Ocean-science research mission',
  };
  for (const [prefix, expected] of Object.entries(lines)) {
    const t = text(card(byId(prefix)));
    for (const line of expected) assert.ok(t.includes(line), `${prefix} (card) contains "${line}"`);
    assert.equal(textOf(card(byId(prefix), {density: 'row'}), 'card-row-sides'), rows[prefix], `${prefix} (row)`);
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
  assert.equal(textOf(html, 'card-place'), 'Tanzania · Dar es Salaam and other cities', 'short display name (MAJOR 9)');
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

test('List density is a scan row: status and latest evidence, country, title, one stance line, the C8 row (MAJOR 6)', () => {
  const html = card(byId('tz-drivers'), {density: 'row'});
  assert.ok(html.includes('data-density="row"'));
  assert.equal(textOf(html, 'card-meta'), 'Ended / suspended 30 Sep 2026 · Latest evidence 1 Oct 2026 · Tanzania');
  assert.ok(html.indexOf('class="status"') < html.indexOf('class="card-row-when"'), 'status leads');
  assert.equal(textOf(html, 'card-row-sides'), 'Against: 15-point licence system');
  // 'Reported ongoing' already carries the evidence date in ST1, so the row does not repeat it.
  const ongoing = card({...byId('es-housing-2026'), status: 'ongoing'}, {density: 'row'});
  assert.equal(textOf(ongoing, 'card-meta'), 'Reported ongoing · evidence dated 2 Oct 2026 · Spain');
  assert.ok(!ongoing.includes('card-row-when'));
  const order = ['card-meta', 'card-title', 'card-row-sides', 'card-evidence'].map(cls => html.indexOf(`class="${cls}"`));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order.every(i => i > 0));
  for (const gone of ['card-outcome', 'card-issues', 'card-facts', 'card-row-facts', 'card-row-state']) assert.ok(!html.includes(gone), gone);
  assert.match(text(html), /Daily News \(opens in a new tab\) · published 30 Sep 2026 · Corroborated · 2 links · AI-assisted check/);
  const three = {...byId('tz-drivers'), positions: [1, 2, 3].map(n => ({actor: `A${n}`, stance: 'oppose', target: `T${n}`, source_ids: []}))};
  assert.equal(textOf(card(three, {density: 'row'}), 'card-row-sides'), 'Against: T1 · Against: T2 · +1 more position recorded');
  assert.equal(textOf(card({...byId('tz-drivers'), positions: [{stance: 'support'}]}, {density: 'row'}), 'card-row-sides'), 'For: target not established');
  assert.ok(text(card({...byId('tz-drivers'), positions: []}, {density: 'row'})).includes('No position is recorded in this record.'));
});

test('Cards collapse Intensity to the C6 line when two or more facets are not established (MAJOR 6)', () => {
  const tz = card(byId('tz-drivers'));
  assert.equal(textOf(tz, 'facet-line'), 'Turnout: not established · Disruption: Passenger and freight transport halted, leaving travelers stranded. · Violence or harm: not established');
  assert.ok(!tz.includes('class="facet-list"'));
  for (const event of [...events, ...liveEvents]) {
    const unknown = intensityFacets(event).filter(f => !f.known).length;
    const html = card(event, {now: liveNow});
    assert.equal(html.includes('class="facet-none"'), unknown === 3, event.id);
    assert.equal(html.includes('class="facet-line"'), unknown === 2, event.id);
    assert.equal(html.includes('class="facet-list"'), unknown < 2, event.id);
  }
});

test('every real card (2 Oct copy and public data), both densities: evidence row; cards carry issues, timeframe and intensity (editorial check 10)', () => {
  for (const [event, context, now] of [...events.map(e => [e, ctx(e), NOW]), ...liveEvents.map(e => [e, liveCtx(e), liveNow])]) {
    for (const density of ['card', 'row']) {
      const html = renderCard(event, {context, now, countryName, density});
      const t = text(html);
      const label = `${event.id} (${density})`;
      assert.match(html, /<p class="card-evidence"><a class="source-link" href="https:[^"]+" target="_blank" rel="noopener noreferrer">/, label);
      assert.match(html, /<span class="source-nowrap">[^<\s]+<svg class="icon"/, `${label}: the icon never wraps alone`);
      assert.match(t, /(published \d{1,2} [A-Z][a-z]{2} \d{4}|publication date not given)/, label);
      assert.match(t, / · (Single source|Corroborated|Contested) · \d+ links? · AI-assisted check/, label);
      if (density === 'row' && html.includes('data-status="ongoing"')) {
        // ST1 carries the evidence date, so the row drops its "Latest evidence" span (no repeated date).
        assert.match(t, /Reported ongoing · evidence dated \d{1,2} [A-Z][a-z]{2} \d{4}/, label);
        assert.ok(!html.includes('class="card-row-when"'), `${label}: evidence date not repeated`);
      } else {
        assert.ok(t.includes('Latest evidence '), label);
        assert.ok(html.indexOf('class="status"') < html.indexOf(density === 'row' ? 'class="card-row-when"' : 'class="band"'), `${label}: status leads`);
      }
      if (density === 'row') {
        for (const p of positionList(event).slice(0, 2)) assert.ok(t.includes(`${p.pill}: ${p.target}`), `${label}: stance names its target`);
        continue;
      }
      assert.ok(html.includes('class="card-issues"'), label);
      assert.ok(t.includes(timeframe(event, null, now).line), label);
      const intensity = intensitySummary(event);
      if (intensity.allUnknown) assert.ok(t.includes(intensity.line), label);
      else for (const item of intensity.items) assert.ok(t.includes(`${item.label}: ${item.text}`), label);
      const state = stateActionSummary(event);
      if (!state.present) assert.ok(t.includes('Police / state Not established in this record'), label);
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

test('example mode carries the C11 watermark on cards and the record, and never claims a source check (MINOR 4)', () => {
  const example = examples.events[0];
  for (const density of ['card', 'row']) {
    const html = renderCard(example, {mode: 'example', now: NOW, density});
    assert.ok(html.includes('<p class="card-watermark">Illustrative example • not a real event</p>'), density);
    assert.ok(text(html).includes('Illustrative · 1 link · no source was checked'), `${density}: level label, no check claimed`);
    assert.ok(!text(html).includes('AI-assisted check'), density);
  }
  assert.ok(!card(byId('tz-drivers')).includes('card-watermark'));
  const rec = renderRecord(example, {mode: 'example', now: NOW});
  assert.ok(text(rec).includes('Illustrative example • not a real event This record is fictional and is excluded from counts and export.'));
  assert.ok(text(rec).includes('Illustrative example · no source was checked'), 'D1 for the fictional record');
  assert.ok(!/AI-assisted source check|Source re-read/.test(text(rec)), 'no D1 check claim and no D9 re-read row');
  // Nobody opened the fictional source, so its line has no "opened {date}" even though the file carries accessed_at.
  assert.ok(example.sources.some(s => s.accessed_at), 'the example source carries accessed_at');
  const sourceList = rec.match(/<ol class="source-list">[\s\S]*?<\/ol>/)?.[0] ?? '';
  assert.ok(sourceList && !/opened/.test(text(sourceList)), 'no "opened" date on the illustrative source');
  assert.match(text(record(byId('tz-drivers'))), /· opened \d{1,2} [A-Z][a-z]{2} \d{4}/, 'reported records keep the opened date');
  // D7 for a record nobody researched: no research note and no "none established" fallbacks.
  assert.ok(!/AI-assisted/.test(text(rec)), 'no AI-assisted research claim anywhere in the fictional record');
  assert.ok(!/No sourced outcome established|Age alone does not establish/.test(text(rec)), 'no research-based fallbacks');
  assert.ok(text(rec).includes(ILLUSTRATIVE_OUTCOME), 'illustrative D7 line');
  assert.ok(rec.includes('id="rec-outcome-title"'), 'D7 heading id kept for the section nav');
  assert.ok(!/AI-assisted/.test(text(renderRecord(example, {mode: 'example', now: NOW, contextsError: true}))));
  assert.ok(text(record(byId('tz-drivers'))).includes('Source re-read (AI-assisted):'), 'reported records keep D9');
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
  // The short display name leads; the ISO 3166 name stays as secondary text where it differs (MAJOR 9).
  assert.equal(textOf(html, 'rec-country-iso'), 'ISO 3166 name: Tanzania, United Republic of');
  assert.ok(text(html).includes('Tanzania · Dar es Salaam and other cities'));
  assert.ok(!record(byId('fr-schools')).includes('rec-country-iso'), 'no secondary line when the names agree');
});

test('contexts failure: the outcome section says the evidence could not load, with Retry, never "none" (MAJOR 12)', () => {
  for (const prefix of ['tz-drivers', 'es-housing-2026', 'fr-schools']) {
    const html = renderRecord(byId(prefix), {context: null, mode: 'reported', now: NOW, countryName, contextsError: true});
    const outcome = text(html.slice(html.indexOf('id="rec-outcome"'), html.indexOf('id="rec-timeline"')));
    assert.ok(outcome.includes(CONTEXT_UNAVAILABLE), prefix);
    assert.ok(html.includes('data-action="retry-contexts"'), prefix);
    assert.ok(!/No sourced outcome|Age alone|End not established|Ended \/ suspended episode/.test(outcome), `${prefix}: no false negative`);
    assert.ok(html.includes('<h3 class="rec-h" id="rec-outcome-title" tabindex="-1">What changed — and for whom?</h3>'));
  }
  assert.ok(!renderRecord(examples.events[0], {mode: 'example', now: NOW, contextsError: true}).includes('retry-contexts'), 'not in example mode');
});

test('glance: four linked cells; positions use "As reported:" and long pills; claims unquoted', () => {
  const html = record(byId('es-housing-2026'));
  // The Intensity cell uses the card's labelled rows when any facet is described (MINOR 20).
  assert.match(html, /<span class="rec-glance-line"><span class="facet-name">Turnout:<\/span> Hundreds, as reported; no numeric range inferred\.<\/span>/);
  assert.ok(record(byId('kr-yoon')).includes('<span class="rec-glance-value">Turnout, disruption and violence: not established in this record.</span>'));
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
  // A DOM stand-in with the four nodes patchRecordStatus reads: ongoing → needs-review → ongoing.
  const live = {status: '', label: '', band: '', note: false, calls: []};
  const meta = fresh.match(/<span class="status rec-status" data-status="([^"]+)">([^<]+)<\/span>/);
  Object.assign(live, {status: meta[1], label: decode(meta[2]), band: fresh.match(/class="band" data-band="([^"]+)"/)[1]});
  const root = {querySelector(sel) {
    if (sel === '.rec-status') return {getAttribute: () => live.status, setAttribute: (n, v) => { live.calls.push(n); live.status = v; },
      get textContent() { return live.label; }, set textContent(v) { live.label = v; }};
    if (sel === '.rec-meta .band') return {getAttribute: () => live.band, set outerHTML(v) { live.band = v.match(/data-band="([^"]+)"/)[1]; live.bandHTML = v; }};
    if (sel === '#temporal-update') return live.note ? {remove() { live.note = false; }} : null;
    if (sel === '#detail-title') return {insertAdjacentHTML(where, html) { assert.equal(where, 'afterend'); live.note = html.startsWith('<p id="temporal-update"'); }};
    return null;
  }};
  assert.deepEqual([live.status, live.band, live.note], ['ongoing', 'fresh', false]);
  patchRecordStatus(root, ongoing, NOW);
  assert.deepEqual(live.calls, [], 'no writes when nothing changed');
  patchRecordStatus(root, ongoing, Date.parse('2026-10-06T00:00:00Z'));
  assert.deepEqual([live.status, live.label, live.band, live.note], ['needs-review', 'Needs review · current status unknown', 'week', true]);
  assert.ok(!live.bandHTML.includes('aria-label') && live.bandHTML.includes('class="band-text" aria-hidden="true"'));
  patchRecordStatus(root, ongoing, Date.parse('2026-10-06T00:00:00Z'));
  assert.equal(live.note, true, 'the note is inserted once');
  patchRecordStatus(root, ongoing, NOW);
  assert.deepEqual([live.status, live.label, live.band, live.note], ['ongoing', 'Reported ongoing · evidence dated 2 Oct 2026', 'fresh', false]);
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

test('every real event + context (2 Oct copy and public data), and the example, renders in both densities and as a record', () => {
  for (const event of [...events, ...liveEvents, ...examples.events]) {
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
      for (const node of [...textNodes(html), ...attrTexts(html)]) {
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
  assert.ok(!html.includes(' id="'), 'the two-argument call adds no ids');
  assert.ok(outcomeHTML(event, context, {headingId: 'rec-outcome-title'}).includes('<h3 class="rec-h" id="rec-outcome-title">What changed — and for whom?</h3>'));
  assert.ok(record(byId('tz-drivers')).includes('<section id="rec-outcome" class="rec-section" aria-labelledby="rec-outcome-title"><div class="outcome-section"><h3 class="rec-h" id="rec-outcome-title">'));
  assert.equal(history.renderResearchCoverage, undefined, 'moved to js/about.js');
  assert.ok(text(outcomeHTML(event, {...context, outcome_status: 'not-established', outcomes: []})).includes('No sourced outcome established in this snapshot.'));
});

test('dates use the copy deck month abbreviations: no card or record mixes "Sept" with "Sep"', () => {
  for (const event of events) {
    for (const now of [NOW, NINE_OCT]) {
      const outputs = [card(event, {now}), card(event, {now, density: 'row'}), record(event, {now})];
      for (const html of outputs) assert.ok(!/\bSept\b/.test(html), event.id);
    }
  }
  // SPEC §7.2 row 4: timeTag(last_observed_at, now, 'both'), which js/stamps.js refreshTimes keeps current.
  const tz = card(byId('tz-drivers'));
  assert.ok(tz.includes('Latest evidence <time class="stamp-time" datetime="2026-10-01" data-rel="2026-10-01" data-format="both">1 Oct 2026 · yesterday</time>'));
  assert.ok(record(byId('tz-drivers')).includes('<span class="rec-when">Latest evidence <time class="stamp-time" datetime="2026-10-01" data-rel="2026-10-01" data-format="both">'));
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
  // 4.1 §7.6: the .side-pill primitive (and its forced-colours border) lives in styles.css as `.side-pill, .kind`; test_shell asserts it.
  assert.doesNotMatch(body, /(^|[,{}])\s*\.side-pill\s*\{/m, 'record.css keeps only the .rec-stance spacing for the pill');
  assert.match(body, /\.rec-stance \.side-pill \{ margin-inline-end: 2px; \}/);
  assert.match(body, /\.source-ref \{[^}]*min-height: var\(--tap\)/);
  // §8.1 geometry: the tabs stick at the scrollport edge (above .sheet-body's 16 px top padding), so the 52 px
  // scroll-padding clears them on every data-scroll-to jump and reverse-Tab focus.
  assert.match(body, /\.rec-tabs \{[^}]*position: sticky;\s*top: calc\(-1 \* var\(--sp-4\)\);/);
  assert.ok(!/\.source-item:focus \{[^}]*outline: none/.test(body), 'a keyboard "Source N" jump keeps its focus ring');
  // Forced colours: only the current tab keeps a bar; the glance keeps its dividers.
  const forced = body.slice(body.indexOf('@media (forced-colors: active)'));
  assert.match(forced, /\.rec-tab \{ border-block-end-color: Canvas; \}/);
  assert.match(forced, /\.rec-tab\[aria-current="true"\] \{ border-block-end-color: Highlight; \}/);
  assert.match(forced, /\.rec-glance-grid \{ forced-color-adjust: none; background: CanvasText;/);
  assert.match(forced, /\.rec-glance-cell \{ forced-color-adjust: auto; \}/);
});
