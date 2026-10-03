// Pilot disclosure, snapshot/error/dropped-param notice lines, example banner (WP2). DOM-free when loaded.
import {snapshotState, evidenceAgeDays, datasetStats, emptyBandNotice, sweepFact, sweepLine, E4, E5} from './model.js';
import {esc, icon, plural} from './html.js';
import {absoluteLabel, updateStamps} from '../freshness.js';

export const PILOT_DISCLOSURE = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';

const COUNTRIES_ERROR = 'The country directory could not load; records are listed by country code.';
export const CONTEXTS_ERROR = 'Outcomes, endings and cities could not load, so they are unknown here, not absent. City and outcome filters are paused.';
const LINE_ORDER = ['error', 'countries-error', 'contexts-error', 'snapshot', 'dropped'];
const WHY_ID = 'notice-why';
const daysAgo = n => `${plural(n, 'day')} ago`;

/** H3 body, numbers from data only. */
const h3 = ({withRecords, total, gaps}) => `An AI system opened and read the cited news articles and recorded what they report. No human editor has reviewed these records. Published episodes exist for ${withRecords} of ${total} countries and territories; the other ${gaps} are gaps in this atlas, not places without protests. Sources are mostly in English.`;

/**
 * → {tone: 'info'|'warn', counts: {withRecords, total, gaps} | null, lines: [{kind, text, why?}]}
 * The pilot line is always first and is never replaced; other lines are added under it (§4.2, C-26, C-37).
 */
export function noticeModel(state) {
  const now = state?.now ?? Date.now();
  const load = state?.load ?? {};
  const errors = load.errors ?? {};
  const envelope = state?.data?.events ?? null;
  const countries = state?.data?.countries ?? [];
  const lines = [{kind: 'pilot', text: PILOT_DISCLOSURE}];
  if (errors.events) lines.push({kind: 'error', text: E5});
  if (errors.countries && !errors.events) lines.push({kind: 'countries-error', text: COUNTRIES_ERROR});
  if (errors.contexts && !errors.events && envelope) lines.push({kind: 'contexts-error', text: CONTEXTS_ERROR});
  if (envelope && !errors.events) {
    const snap = snapshotState(envelope, now);
    const days = evidenceAgeDays(envelope, now);
    const newest = absoluteLabel(updateStamps({events: envelope}).latestObservation);
    // MAJOR 5: one warn line; E4 and S7 behind its "Why?".
    const gap = emptyBandNotice(envelope.events, now);
    const why = [gap ? E4[gap] : '', sweepLine(sweepFact({events: envelope, upcoming: state?.data?.upcoming}))].filter(Boolean);
    const line = text => lines.push({kind: 'snapshot', text, why});
    if (snap === 'aging') line(`No evidence newer than ${newest} (${daysAgo(days)}) is in this snapshot. More recent protests are missing.`);
    if (snap === 'stale') line(`This snapshot has nothing newer than ${newest}, ${daysAgo(days)}. Read it as an archive of past reporting, not as a picture of protests today.`);
    if (snap === 'archive') line(`Archive: newest evidence ${newest}. This atlas is not currently being maintained as a tracker.`);
  }
  const dropped = state?.ui?.droppedParams ?? [];
  if (dropped.length) lines.push({kind: 'dropped', text: `Some link filters were not recognised and were removed: ${dropped.join(', ')}.`});
  let counts = null;
  if (envelope && !errors.events && !errors.countries && countries.length && load.critical !== 'loading') {
    const stats = datasetStats(envelope, countries, now);
    counts = {withRecords: stats.countriesWithRecords, total: stats.directoryTotal, gaps: stats.directoryTotal - stats.countriesWithRecords};
  }
  const tone = lines.some(l => l.kind !== 'pilot' && l.kind !== 'dropped') ? 'warn' : 'info';
  return {tone, counts, lines};
}

/**
 * #data-notice and #example-banner. Patch-only: .notice-inner is never rewritten, "What this means" is created once,
 * and each .notice-line is added, updated (only when its text changes) or removed by data-kind.
 */
export function mountNotice(ctx) {
  const doc = globalThis.document;
  const root = doc.getElementById('data-notice');
  const banner = doc.getElementById('example-banner');
  let lastKey = null;

  function inner() {
    let el = root.querySelector('.notice-inner');
    if (!el) { el = doc.createElement('div'); el.className = 'notice-inner'; root.append(el); }
    if (!el.querySelector('.notice-pilot')) {
      const p = doc.createElement('p');
      p.className = 'notice-pilot';
      p.innerHTML = '<strong>AI-assisted reporting pilot.</strong> Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';
      el.prepend(p);
    }
    return el;
  }

  function patchMore(el, counts) {
    let more = el.querySelector('.notice-more');
    if (!counts) return;
    if (!more) {
      more = doc.createElement('details');
      more.className = 'notice-more';
      more.innerHTML = '<summary>What this means</summary><p></p>';
      el.querySelector('.notice-pilot').after(more);
    }
    const p = more.querySelector('p');
    const text = h3(counts);
    if (p.textContent !== text) p.textContent = text;
  }

  // "2 Oct 2026" sits in a nowrap span so a date never splits.
  const dated = text => esc(text).replace(/\d{1,2} [A-Z][a-z]{2} \d{4}/g, '<span class="notice-date">$&</span>');

  function patchWhy(node, why) {
    let button = node.querySelector('.notice-why-btn');
    let panel = node.querySelector('.notice-why');
    if (!why.length) { button?.remove(); panel?.remove(); return; }
    if (!button) {
      const body = node.querySelector('.notice-line-body');
      body.insertAdjacentHTML('beforeend', `<button type="button" class="notice-why-btn" aria-expanded="false" aria-controls="${WHY_ID}">Why?</button>`
        + `<div class="notice-why" id="${WHY_ID}" hidden></div>`);
      button = node.querySelector('.notice-why-btn');
      panel = node.querySelector('.notice-why');
    }
    const html = why.map(line => `<p class="notice-why-line">${dated(line)}</p>`).join('');
    if (panel.dataset.text !== why.join('\n')) { panel.dataset.text = why.join('\n'); panel.innerHTML = html; }
  }

  function patchLines(el, lines) {
    const byKind = new Map(lines.filter(l => l.kind !== 'pilot').map(l => [l.kind, l]));
    let anchor = el.querySelector('.notice-more') || el.querySelector('.notice-pilot');
    for (const kind of LINE_ORDER) {
      let node = el.querySelector(`.notice-line[data-kind="${kind}"]`);
      if (!byKind.has(kind)) { node?.remove(); continue; }
      if (!node) {
        node = doc.createElement('div');
        node.className = 'notice-line';
        node.dataset.kind = kind;
        node.innerHTML = `${icon('alert')}<div class="notice-line-body"><span class="notice-line-text"></span></div>`;
        anchor.after(node);
      } else if (node.previousElementSibling !== anchor) {
        anchor.after(node);
      }
      const span = node.querySelector('.notice-line-text');
      const {text, why = []} = byKind.get(kind);
      if (span.textContent !== text) span.innerHTML = dated(text);
      if (kind === 'snapshot') patchWhy(node, why);
      anchor = node;
    }
  }

  root?.addEventListener?.('click', event => {
    const button = event.target?.closest?.('.notice-why-btn');
    if (!button) return;
    const panel = root.querySelector(`#${WHY_ID}`);
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  });

  return {
    render(state) {
      if (banner) banner.hidden = state.mode !== 'example';
      if (!root) return;
      const model = noticeModel(state);
      const key = JSON.stringify(model);
      if (key === lastKey) return;
      lastKey = key;
      const el = inner();
      patchMore(el, model.counts);
      patchLines(el, model.lines);
      root.dataset.tone = model.tone;
    },
  };
}
