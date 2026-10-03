// Feed stats, result summary, grouped and paginated list (WP2). DOM-free when loaded.
// The first two imports are mandatory static edges (SPEC §19.0).
import {renderCard, renderCardSkeleton} from './cards.js';
import {aheadTeaserHTML} from './ahead.js';
import {selectEvents, selectFiltered, groupByBand, emptyBandNotice, sweepFact, sweepLine, datasetStats, activeFilterCount, indexContexts,
  snapshotAgeText, absText, E5, STATUS_LABELS, PAGE_SIZE} from './model.js';
import {esc} from './html.js';

const COPY = Object.freeze({
  loading: 'Loading published records…',
  exampleLoading: 'Loading the illustrative example…',
  exampleStats: 'Illustrative example mode: one fictional record. It is excluded from counts, the directory and CSV export.',
  exampleStatsError: 'Illustrative example unavailable. Nothing here is reported data.',
  exampleSummaryError: 'Illustrative example unavailable',
  e1Title: 'No published episode matches these filters.',
  e1Body: 'That describes this atlas, not the world. It does not mean no protests happened in this place, on this issue or in this period.',
  e8Body: 'Try another word, or browse by country.',
  e7Tail: 'It does not mean no protests are happening.',
  trueEmpty: 'No episodes are published in this snapshot.',
  exampleErrorTitle: 'The illustrative example could not load.',
  exampleErrorBody: 'Nothing here is reported data.',
  e4: {
    fresh: 'No episode in this snapshot has evidence dated within the last 72 hours. That is a gap in this dataset, not a sign that no protests happened.',
    week: 'No episode in this snapshot has evidence dated in the last 7 days. That is a gap in this dataset, not a sign that no protests happened.',
  },
});

/** E7 rule sentence per status (C-50). */
const E7_RULES = {
  ongoing: 'That label needs evidence dated within 72 hours.',
  planned: 'That label applies only to an episode with a sourced future start date.',
  'needs-review': "That label applies when a 'Reported ongoing' episode's latest evidence is more than 72 hours old.",
};

const BROWSE = '<a class="btn" href="#/countries">Browse countries</a>';
const CLEAR_ALL = '<button type="button" class="btn btn--primary" data-clear-filter="all">Clear filters</button>';

function emptyState(title, body, actions) {
  return `<div class="empty-state feed-empty"><h2 class="feed-empty-title">${esc(title)}</h2>${body ? `<p>${esc(body)}</p>` : ''}<div class="empty-state-actions">${actions}</div></div>`;
}


/** S3 for the fresh group. */
const s3 = n => `${n} ${n === 1 ? 'has' : 'have'} evidence dated within the last 72 hours. That is not confirmation that ${n === 1 ? 'it is' : 'they are'} ongoing.`;

const examplesState = state => state.load.lazy.examples;
const eventsReady = state => state.mode === 'example'
  ? examplesState(state) === 'ready'
  : Boolean(state.data.events) && !state.load.errors.events;

/** A <time> that refreshTimes keeps in step with the UTC-day counts (data-days="utc"). */
function ageTag(value, now, className) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not established';
  return `<time class="${className}" datetime="${esc(value)}" data-rel="${esc(value)}" data-format="both" data-days="utc">${esc(snapshotAgeText(value, now))}</time>`;
}

/** #feed-stats (S1, S2 and their state variants, §6.1). */
export function statsHTML(state) {
  if (state.mode === 'example') {
    const lazy = examplesState(state);
    const text = lazy === 'error' ? COPY.exampleStatsError : lazy === 'ready' ? COPY.exampleStats : COPY.exampleLoading;
    return `<p class="feed-stat feed-stat--example">${esc(text)}</p>`;
  }
  if (state.load.errors.events) return '';
  const envelope = state.data.events;
  if (!envelope) return `<p class="feed-stat feed-stat--loading">${esc(COPY.loading)}</p>`;
  const stats = datasetStats(envelope, state.data.countries, state.now);
  const s1 = `<p class="feed-stat feed-stat--assembled">Snapshot assembled ${ageTag(envelope.generated_at, state.now, 'feed-stat-time')}</p>`;
  const newest = stats.newestEvidence
    ? ` · newest evidence dated <time datetime="${esc(stats.newestEvidence)}">${esc(absText(stats.newestEvidence))}</time>` : '';
  const episodes = `<strong>${stats.episodes}</strong> published ${stats.episodes === 1 ? 'episode' : 'episodes'}`;
  const scope = state.load.errors.countries || !stats.directoryTotal
    ? `${episodes}${newest}`
    : `${episodes} in <strong>${stats.countriesWithRecords}</strong> of <strong>${stats.directoryTotal}</strong> countries and territories${newest}`;
  return `${s1}<p class="feed-stat feed-stat--scope">${scope}</p>`;
}

/** #result-summary text (§6.3). */
export function summaryText(state, total, shown) {
  if (state.mode === 'example') {
    const lazy = examplesState(state);
    if (lazy === 'error') return COPY.exampleSummaryError;
    if (lazy !== 'ready') return '';
    return `Showing ${shown} of ${total} illustrative ${total === 1 ? 'record' : 'records'}`;
  }
  if (!eventsReady(state)) return '';
  const filtered = activeFilterCount(state.filters) > 0;
  if (!filtered) return `Showing ${shown} of ${total} published ${total === 1 ? 'record' : 'records'}`;
  if (total === 0) return 'No published record matches your filters';
  if (shown >= total) return total === 1 ? '1 published record matches your filters' : `${total} published records match your filters`;
  return `Showing ${shown} of ${total} published records that match your filters`;
}

/** The empty-result state: E7, E8 or E1 (§6.4). */
function emptyResultHTML(state) {
  const f = state.filters;
  if (E7_RULES[f.status]) {
    return emptyState(`No episode in this snapshot is currently labelled '${STATUS_LABELS[f.status]}'.`, `${E7_RULES[f.status]} ${COPY.e7Tail}`, CLEAR_ALL);
  }
  if (f.query && activeFilterCount(f) === 1) {
    return emptyState(`No published episode mentions '${f.query}'.`, COPY.e8Body,
      `<button type="button" class="btn btn--primary" data-clear-filter="query">Clear search</button>${BROWSE}`);
  }
  return emptyState(COPY.e1Title, COPY.e1Body, `${CLEAR_ALL}${BROWSE}`);
}

/**
 * #event-list body for the current state. → {html, busy}
 * `limit` is ui.listLimit; only the first `limit` records render, across groups.
 */
export function listHTML(state, filtered, {countryName = code => code} = {}) {
  const load = state.load;
  const mode = state.mode;
  const density = state.ui.density === 'row' ? 'row' : 'card';
  const index = mode === 'reported' ? indexContexts(state.data.contexts) : new Map();
  const card = event => `<li class="feed-item">${renderCard(event, {context: index.get(event.id) ?? null, mode, now: state.now, countryName, density})}</li>`;

  if (mode === 'example') {
    const lazy = examplesState(state);
    if (lazy === 'error') {
      return {busy: false, html: emptyState(COPY.exampleErrorTitle, COPY.exampleErrorBody,
        '<button type="button" class="btn btn--primary" data-retry="examples">Retry example</button><button type="button" class="btn" data-set-mode="reported">Back to reported data</button>')};
    }
    if (lazy !== 'ready') return {busy: true, html: `<p class="feed-loading">${esc(COPY.exampleLoading)}</p><div class="feed-skeleton" aria-hidden="true">${renderCardSkeleton(1)}</div>`};
    if (!filtered.length) return {busy: false, html: emptyResultHTML(state)};
    return {busy: false, html: `<ol class="feed-list" data-density="${density}">${filtered.slice(0, state.ui.listLimit).map(card).join('')}</ol>`};
  }

  if (load.errors.events) {
    return {busy: false, html: emptyState(E5, '',
      '<button type="button" class="btn btn--primary" data-action="retry-data">Retry</button><a class="btn" href="public/events.json">Open the published data file</a>')};
  }
  if (!state.data.events) return {busy: true, html: `<p class="feed-loading">${esc(COPY.loading)}</p><div class="feed-skeleton" aria-hidden="true">${renderCardSkeleton(2)}</div>`};

  const all = state.data.events.events ?? [];
  if (!all.length) {
    return {busy: false, html: emptyState(COPY.trueEmpty, '', `${BROWSE}<button type="button" class="btn" data-set-mode="example">Explore an illustrative example</button>`)};
  }

  const s7 = sweepLine(sweepFact({events: state.data.events, upcoming: state.data.upcoming}));
  const gap = emptyBandNotice(all, state.now);
  const gapHTML = gap ? `<div class="feed-gap"><p class="feed-gap-line">${esc(COPY.e4[gap])}</p>${s7 ? `<p class="feed-gap-line">${esc(s7)}</p>` : ''}</div>` : '';
  if (!filtered.length) return {busy: false, html: gapHTML + emptyResultHTML(state)};

  let remaining = state.ui.listLimit;
  const parts = [gapHTML];
  let first = true;
  for (const group of groupByBand(filtered, state.now)) {
    if (remaining <= 0) break;
    const shown = group.events.slice(0, remaining);
    remaining -= shown.length;
    const id = `feed-group-${group.band}`;
    const note = group.band === 'fresh' ? `<p class="feed-group-note">${esc(s3(group.events.length))}</p>` : '';
    const endNote = group.band === 'fresh' && !gap && s7 ? `<p class="feed-group-note feed-group-note--end">${esc(s7)}</p>` : '';
    parts.push(`<section class="feed-group" data-band="${group.band}" aria-labelledby="${id}">`
      + `<h2 class="feed-group-title" id="${id}">${esc(group.heading)} <span class="feed-group-count">(${group.events.length})</span></h2>`
      + `${note}<ol class="feed-list" data-density="${density}">${shown.map(card).join('')}</ol>${endNote}</section>`);
    if (first) {
      first = false;
      parts.push(aheadTeaserHTML({upcoming: state.data.upcoming, load: state.load, now: state.now}) || '');
    }
  }
  return {busy: false, html: parts.join('')};
}

/** "Show 12 more (67 remaining)". */
export function moreHTML(total, shown) {
  const remaining = total - shown;
  if (remaining <= 0) return '';
  return `<button type="button" class="btn list-more-btn" data-action="show-more">Show ${Math.min(PAGE_SIZE, remaining)} more (${remaining} remaining)</button>`;
}

const FOCUS_KEYS = ['openRecord', 'clearFilter', 'retry', 'action', 'setMode'];
const focusKeyOf = el => {
  const target = el?.closest?.('[data-open-record], [data-clear-filter], [data-retry], [data-action], [data-set-mode]');
  if (!target) return null;
  const key = FOCUS_KEYS.find(k => target.dataset[k] !== undefined);
  return key ? {key, value: target.dataset[key]} : null;
};
const attrName = key => `data-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`;

/** #feed-stats, #result-summary, #event-list, #list-more and the density toggle (§6). */
export function mountList(ctx) {
  const doc = globalThis.document;
  const $ = id => doc.getElementById(id);
  const stats = $('feed-stats'), summary = $('result-summary'), list = $('event-list'), more = $('list-more');
  const density = doc.querySelector('.feed-density');
  let last = {stats: null, summary: null, list: null, more: null};

  /**
   * Re-render and keep focus on the same control. When that control is gone (a Clear or Retry button whose state
   * has passed), focus moves to a stable target instead of falling to <body>: the search field after
   * "Clear search", otherwise the Reports title.
   */
  function replaceKeepingFocus(el, html) {
    const active = doc.activeElement;
    const inside = el.contains(active);
    const focus = inside ? focusKeyOf(active) : null;
    el.innerHTML = html;
    if (!inside) return;
    const target = focus && el.querySelector(`[${attrName(focus.key)}="${CSS.escape(focus.value)}"]`);
    const fallback = () => (focus?.key === 'clearFilter' && focus.value === 'query' && $('query')) || $('latest-title');
    (target || fallback())?.focus({preventScroll: true});
  }

  return {
    render(state, prev) {
      if (prev && state.data === prev.data && state.load === prev.load && state.filters === prev.filters && state.mode === prev.mode
        && state.now === prev.now && state.ui.listLimit === prev.ui.listLimit && state.ui.density === prev.ui.density) return;

      const ready = eventsReady(state);
      const filtered = ready ? selectFiltered(state) : [];
      const shown = Math.min(filtered.length, state.ui.listLimit);
      const names = new Map((state.data.countries ?? []).map(c => [c.code, c.name]));
      const countryName = code => names.get(code) ?? code;

      const statsHtml = statsHTML(state);
      if (stats && statsHtml !== last.stats) { last.stats = statsHtml; stats.innerHTML = statsHtml; }

      const text = summaryText(state, filtered.length, shown);
      if (summary && text !== last.summary) { last.summary = text; summary.textContent = text; }

      const {html, busy} = listHTML(state, filtered, {countryName});
      if (list) {
        list.setAttribute('aria-busy', String(busy));
        if (html !== last.list) {
          last.list = html;
          replaceKeepingFocus(list, html);
          const grew = prev && state.ui.listLimit > prev.ui.listLimit && state.filters === prev.filters && state.mode === prev.mode;
          if (grew) {
            const links = list.querySelectorAll('.card-link');
            links[prev.ui.listLimit]?.focus({preventScroll: false});
          }
        }
      }

      const moreHtml = ready && !(state.mode === 'reported' && state.load.errors.events) ? moreHTML(filtered.length, shown) : '';
      if (more && moreHtml !== last.more) { last.more = moreHtml; replaceKeepingFocus(more, moreHtml); }

      if (density) {
        for (const button of density.querySelectorAll('[data-set-density]')) {
          const pressed = String(button.dataset.setDensity === state.ui.density);
          if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
        }
      }
    },
  };
}
