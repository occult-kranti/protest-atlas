// Pilot disclosure, snapshot/error/dropped-param notice lines, example banner (WP2). DOM-free when loaded.
import {snapshotState, evidenceAgeDays, datasetStats, E5} from './model.js';
import {esc, icon} from './html.js';
import {absoluteLabel, updateStamps} from '../freshness.js';

export const PILOT_DISCLOSURE = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';

const COUNTRIES_ERROR = 'The country directory could not load; records are listed by country code.';
const LINE_ORDER = ['error', 'countries-error', 'snapshot', 'dropped'];
const daysAgo = n => `${n} ${n === 1 ? 'day' : 'days'} ago`;

/** H3 body, numbers from data only. */
const h3 = ({withRecords, total, gaps}) => `An AI system opened and read the cited news articles and recorded what they report. No human editor has reviewed these records. Published episodes exist for ${withRecords} of ${total} countries and territories; the other ${gaps} are gaps in this atlas, not places without protests. Sources are mostly in English.`;

/**
 * → {tone: 'info'|'warn', counts: {withRecords, total, gaps} | null, lines: [{kind, text}]}
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
  if (envelope && !errors.events) {
    const snap = snapshotState(envelope, now);
    const days = evidenceAgeDays(envelope, now);
    const newest = absoluteLabel(updateStamps({events: envelope}).latestObservation);
    if (snap === 'aging') lines.push({kind: 'snapshot', text: `No evidence newer than ${newest} (${daysAgo(days)}) is in this snapshot. More recent protests are missing.`});
    if (snap === 'stale') lines.push({kind: 'snapshot', text: `This snapshot has nothing newer than ${newest}, ${daysAgo(days)}. Read it as an archive of past reporting, not as a picture of protests today.`});
    if (snap === 'archive') lines.push({kind: 'snapshot', text: `Archive: newest evidence ${newest}. This atlas is not currently being maintained as a tracker.`});
  }
  const dropped = state?.ui?.droppedParams ?? [];
  if (dropped.length) lines.push({kind: 'dropped', text: `Some link filters were not recognised and were removed: ${dropped.join(', ')}.`});
  let counts = null;
  if (envelope && !errors.events && !errors.countries && countries.length && load.critical !== 'loading') {
    const stats = datasetStats(envelope, countries, now);
    counts = {withRecords: stats.countriesWithRecords, total: stats.directoryTotal, gaps: stats.directoryTotal - stats.countriesWithRecords};
  }
  const tone = lines.some(l => l.kind === 'error' || l.kind === 'countries-error' || l.kind === 'snapshot') ? 'warn' : 'info';
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

  function patchLines(el, lines) {
    const byKind = new Map(lines.filter(l => l.kind !== 'pilot').map(l => [l.kind, l.text]));
    let anchor = el.querySelector('.notice-more') || el.querySelector('.notice-pilot');
    for (const kind of LINE_ORDER) {
      let node = el.querySelector(`.notice-line[data-kind="${kind}"]`);
      if (!byKind.has(kind)) { node?.remove(); continue; }
      if (!node) {
        node = doc.createElement('p');
        node.className = 'notice-line';
        node.dataset.kind = kind;
        node.innerHTML = `${icon('alert')}<span class="notice-line-text"></span>`;
        anchor.after(node);
      } else if (node.previousElementSibling !== anchor) {
        anchor.after(node);
      }
      const span = node.querySelector('.notice-line-text');
      const text = byKind.get(kind);
      // Written only when the text changes; "2 Oct 2026" sits in a nowrap span so a date never splits.
      if (span.textContent !== text) span.innerHTML = esc(text).replace(/\d{1,2} [A-Z][a-z]{2} \d{4}/g, '<span class="notice-date">$&</span>');
      anchor = node;
    }
  }

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
