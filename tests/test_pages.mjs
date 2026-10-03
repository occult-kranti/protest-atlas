// WP5 pure helpers: Ahead (announced actions + roadmap), Countries directory, About research scope and discovery.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  NOT_PLANNED, PERIOD_NOW_LABEL, actionsHTML, aheadTeaserHTML, announcementView, evidenceHref, groupAnnouncements,
  mountAhead, reviewOverdue, roadmapGroups, roadmapHTML,
} from '../js/ahead.js';
import {directoryDek, directoryHTML, directoryRows, entriesLabel, mountCountries, regionGroups} from '../js/countries.js';
import {
  discoveryHTML, discoveryView, ledgerTableHTML, mountAbout, researchScope, researchScopeHTML,
} from '../js/about.js';
import {absoluteLabel, relativeLabel} from '../freshness.js';

const read = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [events, countries, upcoming, roadmap, research, contexts, discovery, mapCodes] = await Promise.all([
  read('public/events.json'), read('public/countries.json'), read('public/upcoming.json'), read('public/roadmap.json'),
  read('public/research-ledger.json'), read('public/event-context.json'), read('public/discovery-status.json'),
  read('public/world-map-codes.json'),
]);

const NOW = Date.parse('2026-10-02T23:00:00Z');
// Values that live data owns (the roadmap and upcoming.json are edited and refreshed) are derived from the files, so a
// data change never turns CI red without a code defect. Fixed literals are kept for fixtures and SPEC-mandated checks.
const DAY_MS = 86_400_000;
const label = value => absoluteLabel(value).replace(/\bSept\b/, 'Sep');
const STATUS_ORDER = ['in-progress', 'next', 'blocked', 'later', 'shipped'];
const STATUS_NAMES = {'in-progress': 'In progress', next: 'Next', blocked: 'Blocked', later: 'Later', shipped: 'Shipped'};
const GLYPHS = {'in-progress': '◑', next: '→', blocked: '⊘', later: '…', shipped: '✓'};
const roadmapCounts = STATUS_ORDER.map(status => [status, roadmap.items.filter(i => i.status === status).length]).filter(([, n]) => n);
const lastReviewed = Math.max(...roadmap.items.map(i => Date.parse(i.last_reviewed)));
// The 2 Oct 2026 announcement note, as a fixture (SPEC §19 WP5 acceptance: "On 2 Oct 2026, our search …").
const NOTE_2_OCT = 'Announcements of planned collective actions, attributed to named organisers or institutions and linked to their reporting. An announcement is not evidence that an action will occur, of its size or of its legality. City and date level only; AI-assisted source check without independent human editorial review. Missing announcements are a coverage gap. Latest search for announcements: 2026-10-02, 167 searches logged, 0 source pages could be opened; unread search results are leads, not sources, and are not published.';
const STALE = Date.parse('2026-10-09T12:00:00Z');
const READY = {critical: 'ready', errors: {}, lazy: {}};
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
// SPEC §18.1: banned in UI text even when negated (data-verbatim exception does not apply to our own copy).
const BANNED = /\b(?:live|live now|happening now|right now|breaking|real-time|active protests|current protests|ongoing now|tracking \d+ protests|\d+ protests worldwide|hotspots?|trending|most active|escalating|unrest index|severity|danger|risk level|top countries|top issues|sides|vs|as of|synced|join|attend|rsvp|remind me|add to calendar|live desk)\b/i;

function item(overrides = {}) {
  return {
    id: 'fr-teachers-strike', event_id: 'fr-schools-20261002', country: 'FR', cities: ['Paris', 'Lyon'],
    action: 'Nationwide teachers’ strike', announced_by: 'Teaching unions', planned_start: '2026-10-07', planned_end: null,
    date_precision: 'day', announcement: 'Unions said they would strike over school conditions.', status: 'announced',
    source_ids: ['fr-teachers-announcement'],
    sources: [{id: 'fr-teachers-announcement', url: 'https://example.org/report', title: 'Report', publisher: 'Example News',
      published_at: '2026-10-02', accessed_at: '2026-10-02T21:00:00Z'}],
    note: 'Announcement only.', ...overrides,
  };
}

test('groupAnnouncements separates today, upcoming, postponed, cancelled, passed and range-spanning-today', () => {
  const items = [
    item({id: 'later', planned_start: '2026-10-09'}),
    item({id: 'soon', planned_start: '2026-10-04'}),
    item({id: 'today', planned_start: '2026-10-02'}),
    item({id: 'yesterday', planned_start: '2026-10-01'}),
    item({id: 'range-now', planned_start: '2026-10-01', planned_end: '2026-10-04', date_precision: 'range'}),
    item({id: 'postponed', planned_start: '2026-10-05', status: 'postponed'}),
    item({id: 'cancelled', planned_start: '2026-10-06', status: 'cancelled'}),
    item({id: 'cancelled-old', planned_start: '2026-09-20', status: 'cancelled'}),
  ];
  const groups = groupAnnouncements(items, NOW);
  const ids = list => list.map(entry => entry.id);
  assert.deepEqual(ids(groups.today), ['range-now', 'today']);
  assert.deepEqual(ids(groups.upcoming), ['soon', 'later']);
  assert.deepEqual(ids(groups.postponed), ['postponed']);
  assert.deepEqual(ids(groups.cancelled), ['cancelled']);
  assert.deepEqual(ids(groups.passed), ['yesterday', 'cancelled-old']);
  // Display order (editorial §10.4): today first, then upcoming with postponed/cancelled in place by planned start.
  assert.deepEqual(ids(groups.list), ['range-now', 'today', 'soon', 'postponed', 'cancelled', 'later']);
  assert.ok(!ids(groups.list).includes('yesterday'));
  assert.deepEqual(groupAnnouncements(null, NOW).list, []);
});

test('a fixture item dated yesterday appears only under the A8 date-passed group', () => {
  const data = {...upcoming, items: [item({id: 'yesterday-strike', planned_start: '2026-10-01', action: 'Yesterday strike'})]};
  const html = actionsHTML({upcoming: data, events, load: READY, now: NOW});
  const passed = html.match(/<details class="announce-passed"[\s\S]*<\/details>/)?.[0] ?? '';
  assert.match(passed, /Planned dates that have passed \(1\) · occurrence not established/);
  assert.match(passed, /Yesterday strike/);
  assert.equal(html.split('Yesterday strike').length - 1, 1, 'listed exactly once');
  assert.doesNotMatch(html, /<ol class="announce-list">/, 'no main list for a passed item');
  assert.match(passed, /Planned date passed · occurrence not established \(not recorded here\)/);
  assert.doesNotMatch(passed, /✓|took place|happened/i);
});

test('announcementView: date text by precision, countdown only for day and range', () => {
  const day = announcementView(item(), NOW, {countryName: code => ({FR: 'France'})[code]});
  assert.equal(day.state, 'upcoming');
  assert.equal(day.stateLabel, 'Announced');
  assert.equal(day.countdown, 'in 5 days');
  assert.equal(day.dateText, 'Wed 7 Oct 2026');
  assert.equal(day.place, 'France · Paris, Lyon');
  assert.equal(day.recordHref, '#/record/fr-schools-20261002');
  const range = announcementView(item({planned_start: '2026-10-07', planned_end: '2026-10-09', date_precision: 'range'}), NOW);
  assert.equal(range.dateText, '7–9 Oct 2026');
  assert.equal(range.countdown, 'in 5 days');
  // The copy deck writes "Sep", whatever the ICU data says.
  assert.equal(announcementView(item({planned_start: '2026-09-30', planned_end: '2026-10-02', date_precision: 'range'}), Date.parse('2026-09-20T00:00:00Z')).dateText,
    '30 Sep – 2 Oct 2026');
  assert.equal(announcementView(item({planned_start: '2026-09-29'}), Date.parse('2026-09-20T00:00:00Z')).dateText, 'Tue 29 Sep 2026');
  assert.equal(announcementView(item({planned_start: '2026-12-30', planned_end: '2027-01-02', date_precision: 'range'}), NOW).dateText,
    '30 Dec 2026 – 2 Jan 2027');
  const week = announcementView(item({planned_start: '2026-10-05', date_precision: 'week'}), NOW);
  assert.equal(week.countdown, null);
  assert.equal(week.dateText, 'Week of 5 Oct 2026 · exact day not announced');
  const month = announcementView(item({planned_start: '2026-11-01', date_precision: 'month'}), NOW);
  assert.equal(month.countdown, null);
  assert.equal(month.dateText, 'November 2026 · exact day not announced');
  const october = announcementView(item({planned_start: '2026-10-01', date_precision: 'month'}), Date.parse('2026-09-15T00:00:00Z'));
  assert.equal(october.countdown, null);
  assert.equal(october.dateText, 'October 2026 · exact day not announced');
  assert.equal(announcementView(item({event_id: 'javascript:alert(1)'}), NOW).recordHref, null);
  const html = actionsHTML({upcoming: {...upcoming, items: [item({planned_start: '2026-11-01', date_precision: 'month'}),
    item({id: 'w', planned_start: '2026-10-12', date_precision: 'week'})]}, events, load: READY, now: NOW});
  assert.doesNotMatch(html, /announce-countdown/, 'no countdown for week or month precision');
});

test('a period that includes today gets the period label; a day item today keeps "Planned for today"', () => {
  const range = announcementView(item({planned_start: '2026-10-01', planned_end: '2026-10-04', date_precision: 'range'}), NOW);
  assert.equal(range.state, 'scheduled-now');
  assert.equal(range.stateLabel, 'Planned period includes today · occurrence not established');
  assert.equal(range.stateLabel, PERIOD_NOW_LABEL);
  assert.equal(range.countdown, null);
  const month = announcementView(item({planned_start: '2026-10-01', date_precision: 'month'}), NOW);
  assert.equal(month.state, 'scheduled-now');
  assert.equal(month.stateLabel, PERIOD_NOW_LABEL);
  const week = announcementView(item({planned_start: '2026-09-30', date_precision: 'week'}), NOW);
  assert.equal(week.stateLabel, PERIOD_NOW_LABEL);
  const today = announcementView(item({planned_start: '2026-10-02'}), NOW);
  assert.equal(today.stateLabel, 'Planned for today · occurrence not established');
  assert.equal(announcementView(item({status: 'postponed'}), NOW).stateLabel, 'Reported postponed · new date not established');
  assert.equal(announcementView(item({status: 'cancelled'}), NOW).stateLabel, 'Reported cancelled');
});

test('A5 states the sweep from upcoming.json, with a fallback when the note has no sweep sentence', () => {
  const fixture = {...upcoming, items: [], note: NOTE_2_OCT};
  const html = actionsHTML({upcoming: fixture, events, load: READY, now: NOW});
  assert.match(text(html), /On 2 Oct 2026, our search for announced and recent protest actions could not open news websites from the research environment\./);
  // The real file: the A5 day is whatever its own note says (parsed here independently of sweepFact).
  const sweep = /Latest search for announcements: (\d{4}-\d{2}-\d{2}), \d+ searches logged, (\d+) source pages could be opened/.exec(upcoming.note);
  if (Array.isArray(upcoming.items) && !upcoming.items.length) {
    const real = text(actionsHTML({upcoming, events, load: READY, now: NOW}));
    if (sweep && sweep[2] === '0') assert.ok(real.includes(`On ${label(sweep[1])}, our search for announced and recent protest actions`));
    else assert.ok(real.includes('Our latest search did not find an announcement that met this standard.'));
  }
  for (const copy of ['No announced actions are listed yet',
    'This list includes an announced action only after the article announcing it has been opened and read. Nothing meets that standard in this snapshot.',
    'Times, meeting points and routes are never listed.',
    'How an announcement will appear', 'Layout specimen • not an announcement', 'Every announcement shows one of these states',
    PERIOD_NOW_LABEL]) {
    assert.ok(text(html).includes(copy), copy);
  }
  assert.ok(text(html).includes(`Announced-actions list compiled ${absoluteLabel(upcoming.generated_at)} · ${relativeLabel(upcoming.generated_at, NOW)} · 0 items`));
  assert.ok(html.includes(`<time class="stamp-time" datetime="${upcoming.generated_at}" data-rel=`), 'refreshTimes can update the A9 stamp');
  assert.match(text(actionsHTML({upcoming: {...fixture, generated_at: '2026-10-02T22:45:35Z'}, events, load: READY, now: NOW})),
    /Announced-actions list compiled 2 Oct 2026, 22:45 UTC · 14 minutes ago · 0 items/);
  assert.match(html, /<h2 id="ahead-actions-title"[^>]*tabindex="-1"/);
  assert.match(html, /<h3 class="announce-empty-title">/);
  assert.match(html, /data-ahead-target="roadmap-item-list-announced-actions"/);
  assert.match(html, /class="announce-empty" role="status"/);
  // The state vocabulary is always visible: after the collapsed specimen, not inside it (SPEC §12.2 "Then …").
  const specimen = html.match(/<details class="announce-specimen"[\s\S]*?<\/details>/)?.[0] ?? '';
  assert.ok(specimen.includes('Layout specimen • not an announcement'));
  assert.ok(!specimen.includes('Every announcement shows one of these states'));
  assert.ok(html.indexOf('</details><h3 class="announce-states-title">Every announcement shows one of these states</h3><ul class="announce-states">') > 0);
  assert.equal((html.match(/<span class="announce-pill" data-state=/g) ?? []).length, 7);
  const plain = actionsHTML({upcoming: {...fixture, note: 'An announcement is not evidence that an action will occur.'}, events, load: READY, now: NOW});
  assert.ok(text(plain).includes('Our latest search did not find an announcement that met this standard. An empty list does not mean nothing is planned.'));
  assert.doesNotMatch(plain, /On 2 Oct 2026/);
  // Hard-coded dates are forbidden: a later blocked sweep shows its own day.
  const later = actionsHTML({upcoming: {...fixture, note: NOTE_2_OCT.replace('2026-10-02', '2026-10-05')}, events, load: READY, now: STALE});
  assert.match(text(later), /On 5 Oct 2026, our search/);
});

test('actions section: absent, error and loading states are distinct from an empty list', () => {
  const absent = text(actionsHTML({upcoming: null, events, load: {...READY, errors: {upcoming: 'absent'}}, now: NOW}));
  assert.ok(absent.includes('The announced-actions list is not published in this snapshot.'));
  const error = actionsHTML({upcoming: null, events, load: {...READY, errors: {upcoming: 'error'}}, now: NOW});
  assert.ok(text(error).includes('The announced-actions list could not load. This is not the same as an empty list.'));
  assert.match(error, /data-action="retry-data"/);
  assert.equal(text(actionsHTML({upcoming: null, events: null, load: {critical: 'loading', errors: {}}, now: NOW})).endsWith('Loading…'), true);
  assert.doesNotMatch(absent + text(error), /No announced actions are listed yet/);
});

test('filled items follow editorial §10.2 order, escape data and offer no attendance controls', () => {
  const evil = item({action: '<script>alert(1)</script>', announcement: '<img src=x onerror=alert(1)>'});
  const html = actionsHTML({upcoming: {...upcoming, items: [evil]}, events, load: READY, now: NOW,
    countryName: code => ({FR: 'France'})[code], eventTitle: id => (id === 'fr-schools-20261002' ? 'Schools strike' : '')});
  assert.doesNotMatch(html, /<script>|<img/);
  const plain = text(html);
  const order = ['Announced', 'in 5 days', 'Wed 7 Oct 2026', '<script>alert(1)</script>', 'France · Paris, Lyon', 'Announced by: Teaching unions',
    'What was announced:', 'Source: Example News', 'published 2 Oct 2026 · opened 2 Oct 2026, 21:00 UTC (AI-assisted)',
    'Related episode: Schools strike', 'An announcement is not evidence that the action will happen, how large it will be, or whether it is lawful.'];
  let at = -1;
  for (const part of order) { const next = plain.indexOf(part, at + 1); assert.ok(next > at, `${part} after the previous field`); at = next; }
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /data-open-record="fr-schools-20261002"/);
  assert.doesNotMatch(plain, /\b(join|attend|rsvp|remind me|add to calendar|calendar export)\b/i);
  assert.doesNotMatch(html, /\.ics|webcal:|data-map-pin/);
});

test('aheadTeaserHTML covers 0 items, n items, absent, error and loading', () => {
  const zero = text(aheadTeaserHTML({upcoming, load: READY, now: NOW}));
  assert.ok(zero.includes('Announced protest actions: none are listed yet. An empty list does not mean nothing is planned.'));
  assert.ok(zero.includes('Coming next to Protest Atlas: what we are building, what is blocked and what we will not build.'));
  const some = text(aheadTeaserHTML({upcoming: {...upcoming, items: [item(), item({id: 'b'})]}, load: READY, now: NOW}));
  assert.ok(some.includes('Announced protest actions: 2 listed. An announcement is not evidence that the action will happen.'));
  assert.ok(text(aheadTeaserHTML({upcoming: null, load: {...READY, errors: {upcoming: 'absent'}}, now: NOW}))
    .includes('Announced protest actions: the list is not published in this snapshot.'));
  assert.ok(text(aheadTeaserHTML({upcoming: null, load: {...READY, errors: {upcoming: 'error'}}, now: NOW}))
    .includes('Announced protest actions: the list could not load.'));
  assert.equal(aheadTeaserHTML({upcoming: null, load: {critical: 'loading', errors: {}}, now: NOW}), '');
  const html = aheadTeaserHTML({upcoming, load: READY, now: NOW});
  assert.match(html, /<aside class="ahead-teaser" aria-labelledby="ahead-teaser-title"><h2 class="ahead-teaser-title" id="ahead-teaser-title">Ahead<\/h2>/);
  assert.match(html, /href="#\/ahead\/actions"/);
  assert.match(html, /href="#\/ahead\/roadmap"/);
  assert.doesNotMatch(html, /\b0\b/, 'no zero count');
});

test('roadmapGroups order and counts; empty groups are omitted', () => {
  const groups = roadmapGroups(roadmap);
  assert.deepEqual(groups.map(g => g.status), roadmapCounts.map(([status]) => status));
  assert.deepEqual(groups.map(g => g.items.length), roadmapCounts.map(([, n]) => n));
  assert.deepEqual(groups.map(g => g.label), roadmapCounts.map(([status]) => STATUS_NAMES[status]));
  const fixture = ['shipped', 'later', 'blocked', 'next', 'in-progress', 'next'].map((status, i) => ({id: `i${i}`, status}));
  assert.deepEqual(roadmapGroups({items: fixture}).map(g => [g.status, g.items.length]),
    [['in-progress', 1], ['next', 2], ['blocked', 1], ['later', 1], ['shipped', 1]]);
  assert.deepEqual(roadmapGroups({items: [{id: 'a', status: 'shipped'}, {id: 'b', status: 'next'}]}).map(g => g.status), ['next', 'shipped']);
  assert.deepEqual(roadmapGroups(null), []);
});

test('evidenceHref maps every kind and rejects unsafe references', () => {
  const repo = 'https://github.com/occult-kranti/protest-atlas';
  assert.equal(evidenceHref({kind: 'test', ref: 'tests/test_history.py::test_ended_needs_local_status_evidence_and_end_date'}),
    `${repo}/blob/main/tests/test_history.py`);
  assert.equal(evidenceHref({kind: 'test', ref: 'tests/test_explorer.mjs::map totals agree with reported data'}), `${repo}/blob/main/tests/test_explorer.mjs`);
  assert.equal(evidenceHref({kind: 'file', ref: 'index.html'}), `${repo}/blob/main/index.html`);
  assert.equal(evidenceHref({kind: 'doc', ref: 'docs/UX_SPEC.md'}), `${repo}/blob/main/docs/UX_SPEC.md`);
  assert.equal(evidenceHref({kind: 'commit', ref: 'cf3349d'}), `${repo}/commit/cf3349d`);
  assert.equal(evidenceHref({kind: 'url', ref: `${repo}/actions/runs/37067775278`}), `${repo}/actions/runs/37067775278`);
  assert.equal(evidenceHref({kind: 'url', ref: 'javascript:alert(1)'}), null);
  // URL evidence must still be inside the repository after the browser normalises it.
  for (const ref of [`${repo}/../../evil/x`, `${repo}/%2e%2e/%2E%2E/evil`, `${repo}\\..\\..\\evil`, 'https://github.com/evil/x',
    `https://user@github.com/occult-kranti/protest-atlas/x`, `${repo}.evil.example/x`, `http://github.com/occult-kranti/protest-atlas/x`]) {
    assert.equal(evidenceHref({kind: 'url', ref}), null, ref);
  }
  assert.equal(evidenceHref({kind: 'url', ref: `${repo}/a/../actions/runs/1`}), `${repo}/actions/runs/1`, 'normalised inside the repo');
  assert.equal(evidenceHref({kind: 'file', ref: '../secret'}), null);
  assert.equal(evidenceHref({kind: 'file', ref: '/etc/passwd'}), null);
  assert.equal(evidenceHref({kind: 'doc', ref: 'javascript:alert(1)'}), null);
  assert.equal(evidenceHref({kind: 'commit', ref: 'HEAD'}), null);
  assert.equal(evidenceHref({kind: 'blog', ref: 'x'}), null);
  assert.equal(evidenceHref(null), null);
  assert.equal(evidenceHref({kind: 'file', ref: 'index.html'}, 'https://example.org/r'), 'https://example.org/r/blob/main/index.html');
});

test('reviewOverdue turns on after 90 whole days', () => {
  const at = days => Date.parse('2026-10-02T12:00:00Z') + days * 86_400_000;
  assert.equal(reviewOverdue('2026-10-02', at(89)), false);
  assert.equal(reviewOverdue('2026-10-02', at(90)), false);
  assert.equal(reviewOverdue('2026-10-02', at(91)), true);
  assert.equal(reviewOverdue('2026-10-02', at(10), 7), true);
  assert.equal(reviewOverdue('not a date', NOW), true);
});

test('roadmap section: R2, R5, legend, jump pills, groups in order, items and NOT_PLANNED', () => {
  const html = roadmapHTML({roadmap, status: 'ready', now: NOW});
  const plain = text(html);
  assert.match(html, /<h2 id="ahead-roadmap-title"[^>]*tabindex="-1">Coming next to Protest Atlas<\/h2>/);
  assert.ok(plain.includes("'Shipped' means available on this site now and checked after it was deployed."));
  assert.ok(plain.includes(`Roadmap revised ${label(roadmap.updated_at.slice(0, 10))} · AI-assisted · no human editorial owner yet`));
  assert.ok(text(roadmapHTML({roadmap: {...roadmap, updated_at: '2026-10-02T23:00:00Z'}, status: 'ready', now: NOW}))
    .includes('Roadmap revised 2 Oct 2026 · AI-assisted · no human editorial owner yet'));
  assert.ok(plain.includes('Follow progress on GitHub'));
  assert.ok(plain.includes('Suggest a feature or report a problem'));
  assert.ok(plain.includes('Please do not post private details about participants.'));
  assert.match(html, /href="https:\/\/github\.com\/occult-kranti\/protest-atlas\/blob\/main\/docs\/ROADMAP\.md"/);
  assert.match(html, /href="https:\/\/github\.com\/occult-kranti\/protest-atlas\/issues\/new\/choose"/);
  for (const line of ['Shipped : available on this site now.', 'In progress : being built; not available yet.',
    'Next : planned, and can start without outside help.', 'Later : only after the listed conditions are met.',
    'Blocked : cannot proceed until the named blocker is resolved.']) {
    assert.ok(plain.includes(line), line);
  }
  const jump = roadmapCounts.map(([status, n], i) => `${i ? `${GLYPHS[status]} ` : ''}${STATUS_NAMES[status]} (${n})`).join(' ');
  assert.ok(plain.includes(jump), jump);
  const order = [...html.matchAll(/<section class="roadmap-group" id="roadmap-([a-z-]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, roadmapCounts.map(([status]) => status));
  assert.deepEqual(order, STATUS_ORDER.filter(status => order.includes(status)), 'groups in SPEC order');
  assert.equal([...html.matchAll(/<article class="roadmap-item" id="roadmap-item-[a-z0-9-]+" data-status="[a-z-]+" tabindex="-1"/g)].length, roadmap.items.length);
  assert.match(html, /<h4 class="roadmap-item-title"/);
  // The blocker landing target and its dependency link (SPEC §12.2).
  const target = html.match(/<article class="roadmap-item" id="roadmap-item-list-announced-actions"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.match(target, /Blocked by:/);
  assert.match(target, /<ul class="roadmap-deps-list"><li><a href="#roadmap-item-add-reports-after-2-oct-2026" data-scroll-to="roadmap-item-add-reports-after-2-oct-2026">Add reports after 2 Oct 2026<\/a><\/li>/);
  // SPEC §12.3 field order: Done when, Blocked by, Depends on, Status checked.
  const fields = ['Done when:', 'Blocked by:', 'Depends on:', 'Status checked'].map(part => text(target).indexOf(part));
  assert.deepEqual([...fields].sort((a, b) => a - b), fields);
  assert.ok(fields.every(at => at > 0));
  // Every shipped item shows its release, date and resolving evidence links.
  for (const entry of roadmap.items.filter(i => i.status === 'shipped')) {
    const article = html.match(new RegExp(`<article class="roadmap-item" id="roadmap-item-${entry.id}"[\\s\\S]*?</article>`))?.[0] ?? '';
    assert.ok(text(article).includes(`Shipped in ${entry.shipped_in} · ${label(entry.shipped_on)}`), entry.id);
    assert.ok(text(article).indexOf('Done when:') < text(article).indexOf('Checked by:'), entry.id);
    assert.match(article, /Checked by:/);
    assert.match(article, /class="roadmap-evidence-link" href="https:\/\/github\.com\/occult-kranti\/protest-atlas\//);
  }
  for (const entry of roadmap.items) assert.ok(plain.includes(`Status checked ${label(entry.last_reviewed)}`), entry.id);
  assert.doesNotMatch(text(roadmapHTML({roadmap, status: 'ready', now: lastReviewed + 30 * DAY_MS})), /Status check overdue/);
  assert.ok(text(roadmapHTML({roadmap, status: 'ready', now: lastReviewed + 92 * DAY_MS})).includes('Status check overdue'));
  assert.ok(plain.includes('What we will not build'));
  for (const line of NOT_PLANNED) assert.ok(plain.includes(line), line);
  const loading = roadmapHTML({roadmap: null, status: 'loading', now: NOW});
  assert.ok(text(loading).endsWith('Loading the roadmap…'));
  const error = roadmapHTML({roadmap: null, status: 'error', now: NOW});
  assert.ok(text(error).includes('The roadmap could not load.'));
  assert.match(error, /data-retry="roadmap"/);
});

test('NOT_PLANNED has 8 items and no roadmap or Ahead copy uses banned vocabulary', () => {
  assert.equal(NOT_PLANNED.length, 8);
  for (const line of NOT_PLANNED) assert.doesNotMatch(line, BANNED, line);
  for (const entry of roadmap.items) {
    for (const field of ['title', 'summary', 'acceptance', 'blocked_by']) {
      if (entry[field]) assert.doesNotMatch(entry[field], BANNED, `${entry.id}.${field}`);
    }
  }
  const surfaces = [
    roadmapHTML({roadmap, status: 'ready', now: NOW}),
    actionsHTML({upcoming, events, load: READY, now: NOW}),
    actionsHTML({upcoming: {...upcoming, items: [item(), item({id: 'p', planned_start: '2026-09-01'})]}, events, load: READY, now: NOW}),
    aheadTeaserHTML({upcoming, load: READY, now: NOW}),
  ];
  for (const html of surfaces) {
    assert.doesNotMatch(text(html), BANNED);
    assert.doesNotMatch(html, /aria-label="[^"]*\b(?:live|join|sides)\b/i);
  }
  // No shipped claim for this release's own work (SPEC §20).
  const shipped = new Set(roadmap.items.filter(i => i.status === 'shipped').map(i => i.id));
  for (const id of ['mobile-first-redesign', 'clear-dates-and-stale-warnings', 'record-cards-key-dimensions', 'ahead-page']) assert.ok(!shipped.has(id), id);
});

test('directoryRows: E9 labels, ledger loading, failures and the drawn flag', () => {
  const codes = Object.keys(mapCodes.codes ?? {}).length ? mapCodes : {codes: {250: 'FR', 724: 'ES', 352: 'IS'}};
  const rows = directoryRows({countries, events, research, loadError: null, mapCodes: codes});
  const by = code => rows.find(row => row.code === code);
  assert.equal(rows.length, 249);
  assert.equal(by('AD').label, '1 episode published');
  assert.equal(by('AD').drawn, false);
  assert.equal(by('FR').label, '2 episodes published');
  assert.equal(by('FR').drawn, true);
  assert.equal(by('IS').label, 'Searched · no published episode');
  assert.equal(rows[0].name, 'Afghanistan');
  assert.ok(rows.findIndex(r => r.code === 'AX') < rows.findIndex(r => r.code === 'AL'), 'Åland sorts under A');
  const ledger = {...research, countries: research.countries.filter(r => r.code !== 'IS')
    .map(r => (r.code === 'AF' ? {...r, status: 'search-failed'} : r))};
  const partial = directoryRows({countries, events, research: ledger, loadError: null});
  assert.equal(partial.find(r => r.code === 'AF').label, 'Search failed · no published episode');
  assert.equal(partial.find(r => r.code === 'IS').label, 'Not yet searched');
  assert.equal(partial.find(r => r.code === 'IS').drawn, null, 'no note before the code table loads');
  const loading = directoryRows({countries, events, research: null, loadError: null});
  assert.equal(loading.find(r => r.code === 'IS').label, 'Checking the search log…');
  assert.equal(loading.find(r => r.code === 'FR').label, '2 episodes published');
  assert.ok(!loading.some(r => r.label === 'Coverage unavailable'));
  const failed = directoryRows({countries, events: null, research, loadError: 'events'});
  assert.ok(failed.every(r => r.label === 'Coverage unavailable'));
  assert.doesNotMatch(directoryHTML(regionGroups(failed, '')), /Searched · no published episode|episodes? published/);
  const ledgerFailed = directoryRows({countries, events, research: null, loadError: {research: true}});
  assert.equal(ledgerFailed.find(r => r.code === 'IS').label, 'Coverage unavailable');
  assert.equal(ledgerFailed.find(r => r.code === 'FR').label, '2 episodes published');
  assert.equal(directoryRows({countries, events, research, mapCodes: {codes: {}}}).find(r => r.code === 'AD').drawn, null,
    'an empty placeholder code table never marks entries as not drawn');
});

test('regionGroups, entriesLabel and the directory markup', () => {
  assert.equal(entriesLabel(1), '1 entry');
  assert.equal(entriesLabel(60), '60 entries');
  assert.equal(entriesLabel(0), '0 entries');
  const rows = directoryRows({countries, events, research, mapCodes: {codes: {250: 'FR'}}});
  const groups = regionGroups(rows, '');
  assert.deepEqual(groups.map(g => g.region), ['Africa', 'Americas', 'Antarctic', 'Asia', 'Europe', 'Oceania']);
  assert.equal(entriesLabel(groups.find(g => g.region === 'Antarctic').rows.length), '1 entry');
  assert.deepEqual(regionGroups(rows, 'sao tome').flatMap(g => g.rows.map(r => r.code)), ['ST']);
  assert.deepEqual(regionGroups(rows, 'aland').flatMap(g => g.rows.map(r => r.code)), ['AX']);
  assert.deepEqual(regionGroups(rows, 'zealand').flatMap(g => g.rows.map(r => r.code)), ['NZ']);
  assert.deepEqual(regionGroups(rows, 'cote').flatMap(g => g.rows.map(r => r.code)), ['CI']);
  assert.deepEqual(regionGroups(rows, 'us').flatMap(g => g.rows.map(r => r.code)), ['US']);
  assert.equal(regionGroups(rows, 'antarctic')[0].rows.length, 1);
  assert.equal(regionGroups(rows, 'fr').flatMap(g => g.rows.map(r => r.code)).includes('FR'), true);
  assert.deepEqual(regionGroups(rows, 'zzzz'), []);
  const html = directoryHTML(groups);
  assert.match(html, /<h2 class="dir-region-title" id="dir-region-antarctic">Antarctic <span class="dir-count">1 entry<\/span><\/h2>/);
  assert.match(html, /<button type="button" class="dir-row" data-select-country="FR" data-view-after="map"/);
  assert.equal((html.match(/data-select-country=/g) ?? []).length, 249);
  assert.match(html, /data-select-country="AD"[^>]*>[\s\S]*?Not drawn on the map at this scale/);
  assert.doesNotMatch(html.match(/data-select-country="FR"[\s\S]*?<\/button>/)[0], /Not drawn/);
  assert.equal(directoryDek({rows, research}),
    '81 of 249 have a published episode. A first search was logged for all 249; searched is not reviewed, and no published episode does not mean no protests.');
  assert.equal(directoryDek({rows, research: null}), '81 of 249 have a published episode.');
  assert.doesNotMatch(text(html), BANNED);
});

test('researchScope on the real files, with the window taken from the ledger', () => {
  const scope = researchScope({research, contexts, events, countries});
  assert.equal(scope.positions, 92);
  assert.equal(scope.episodes, 84);
  assert.equal(scope.screened, 249);
  assert.equal(scope.total, 249);
  assert.equal(scope.countriesWithRecords, 81);
  assert.equal(scope.cityCount, 118);
  assert.equal(scope.ended, 18);
  assert.equal(scope.windowStart, research.window_start);
  assert.equal(scope.windowEnd, research.window_end);
  const shifted = researchScope({research: {...research, window_start: '2025-02-01', window_end: '2026-11-30'}, contexts, events, countries});
  assert.equal(shifted.windowEnd, '2026-11-30');
  assert.equal(researchScope({research, contexts: null, events, countries}).cityCount, null);
  const html = researchScopeHTML({scope, status: 'ready'});
  const plain = text(html);
  for (const line of ['First searches logged 249 of 249', 'Countries and territories with a published episode 81',
    'City references in published records 118', 'Ended or suspended episodes 18',
    'Positions recorded 92 across 84 episodes; each is tied to its own target.',
    'A logged search is not a completed country history. No country is certified exhaustive. Regional totals reflect where we looked, so they cannot be compared or ranked.',
    'Inspect country-by-country research']) {
    assert.ok(plain.includes(line), line);
  }
  assert.ok(text(researchScopeHTML({scope: null, status: 'loading'})).includes('Loading the research scope…'));
  const failed = researchScopeHTML({scope: null, status: 'error'});
  assert.ok(text(failed).includes('Research scope unavailable.'));
  assert.match(failed, /data-retry="research"/);
  assert.match(researchScopeHTML({scope: null, status: 'ready', eventsFailed: true}), /data-action="retry-data"/);
});

test('the ledger table has every entry, its caption from the ledger window and no candidate URLs', () => {
  const html = ledgerTableHTML({research, events, countries});
  assert.equal((html.match(/<tr><th scope="row">/g) ?? []).length, 249);
  assert.ok(text(html).includes('First searches, 1 Jan 2024 to 2 Oct 2026'));
  assert.ok(text(html).includes('Country or territory Research stage Published episodes Source pages read'));
  assert.match(html, /<th scope="row">Iceland<\/th><td>First search logged<\/td><td class="ledger-num">None published<\/td>/);
  assert.match(html, /<th scope="row">France<\/th><td>First search logged<\/td><td class="ledger-num">2<\/td>/);
  assert.doesNotMatch(html, /https?:\/\//);
  for (const row of research.countries) for (const url of row.candidate_urls ?? []) assert.ok(!html.includes(url));
  // A countries-only failure (C-37) still lists every ledger entry, by code.
  for (const missing of [[], null]) {
    const fallback = ledgerTableHTML({research, events, countries: missing});
    assert.equal((fallback.match(/<tr><th scope="row">/g) ?? []).length, research.countries.length);
    assert.match(fallback, /<th scope="row">FR<\/th><td>First search logged<\/td><td class="ledger-num">2<\/td>/);
    assert.doesNotMatch(fallback, /https?:\/\//);
  }
});

test('discoveryView keeps only this repository\'s run URL and reads the schedule from data', () => {
  const view = discoveryView(discovery);
  assert.equal(view.date, '2026-10-02T19:27:08Z');
  assert.equal(view.count, 97);
  assert.equal(view.runUrl, 'https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060');
  assert.equal(view.intervalText, 'Scheduled every 6 hours; a schedule is not evidence that runs succeed.');
  assert.equal(view.summary, 'GDELT artifact created 2 Oct 2026, 19:27 UTC · 97 unverified leads');
  assert.equal(discoveryView({...discovery, workflow_run_url: 'https://github.com/someone/protest-atlas/actions/runs/1'}).runUrl, null);
  assert.equal(discoveryView({...discovery, workflow_run_url: 'https://github.com/occult-kranti/protest-atlas/actions/runs/1?x=javascript:'}).runUrl, null);
  assert.equal(discoveryView({...discovery, scheduled_interval_hours: 12}).intervalText, 'Scheduled every 12 hours; a schedule is not evidence that runs succeed.');
  assert.equal(discoveryView(null), null);
  assert.equal(discoveryView({...discovery, last_success_at: 'never'}), null);
  const html = discoveryHTML({view, status: 'ready'});
  const plain = text(html);
  assert.ok(plain.includes('Lead-discovery audit: GDELT artifact created 2 Oct 2026, 19:27 UTC · 97 unverified leads.'));
  assert.ok(plain.includes('A one-time audit of one automated lead list. Leads are never published automatically. It does not show whether the discovery service is working today.'));
  assert.ok(plain.includes('Workflow run'));
  assert.doesNotMatch(plain, BANNED);
  assert.ok(text(discoveryHTML({view: null, status: 'error'})).includes('Discovery audit unavailable.'));
  assert.ok(text(discoveryHTML({view: null, status: 'loading'})).includes('Loading…'));
  assert.doesNotMatch(discoveryHTML({view: {...view, runUrl: null}, status: 'ready'}), /Workflow run/);
});

test('mount functions are inert without a DOM', () => {
  for (const mount of [mountAhead, mountCountries, mountAbout]) {
    const component = mount({});
    assert.equal(typeof component.render, 'function');
    component.render({route: {view: 'ahead'}, data: {}, load: READY, now: NOW});
  }
});
