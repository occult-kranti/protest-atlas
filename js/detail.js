// Record sheet body, section nav, status patching and scroll-spy (WP3; SPEC §8, C-15, C-42, C-46).
// DOM-free when loaded: only patchRecordStatus and mountRecordChrome touch the DOM.
import {outcomeHTML} from '../history.js';
import {positionList, positionLineHTML, morePositions, intensityFacets, intensitySummary, stateActionSummary, timeframe,
  evidenceLine, placeView, VERIFICATION_NOTES, EXAMPLE_WATERMARK, ILLUSTRATIVE_CHECK} from './record-facts.js';
import {esc, icon, hostOf, sourceLink, sourceLinkKept, sourceRefs, sourceRefsBlock as refsHTML, timeTag, bandTag, dateTag, REPO_URL} from './html.js';
import {getDisplayStatus, statusLabel} from './model.js';
import {observationBand} from '../freshness.js';

export const RECORD_SECTIONS = [{id: 'rec-overview', label: 'Overview'}, {id: 'rec-positions', label: 'For/against'},
  {id: 'rec-intensity', label: 'Intensity'}, {id: 'rec-state', label: 'Police/state'}, {id: 'rec-outcome', label: 'Outcome'},
  {id: 'rec-timeline', label: 'Timeline'}, {id: 'rec-sources', label: 'Sources'}];

// Copy deck D1–D10 and SPEC §8 (verbatim).
const D1 = 'AI-assisted source check · no human editorial review';
const D4_SUB = "Each line is one actor's position toward a named target, as reported in the cited source. 'For' and 'against' only mean something with their target. A government, party or company position is a response, not a counter-protest. Positions are not head-counts and do not show which view has more support.";
const D5_SUB = "Turnout, disruption and violence are reported separately. There is no combined score. 'Not established' means the sources did not give a reliable figure or description; it never means zero or none.";
const D5_VIOLENCE_NOTE = 'Can include force used by police or security services, as the source reports it. Arrests or police force are not evidence that participants were violent.';
const D5_NO_SOURCE = 'No source is attached because none of these was established in this record.';
const D6_SUB = 'As reported by the cited source. This can include police, military, ministers, legislatures and courts. Announced measures are not the same as actions that were observed.';
const D6_EMPTY = 'No police or state response is recorded in this record. That is not evidence that none occurred.';
const D8_SUB = 'Dated entries only. Gaps between dates are not assumed activity.';
const TIMELINE_RULE = "'Reported ongoing' needs evidence dated within the last 72 hours. A newer source re-read alone cannot renew it.";
const NEEDS_REVIEW_NOTE = "Needs review: the latest evidence for this record is more than 72 hours old, so it can no longer be labelled 'Reported ongoing'. Its current status is not established.";
const EXAMPLE_NOTE = 'This record is fictional and is excluded from counts and export.';
const D1_ILLUSTRATIVE = `Illustrative example · ${ILLUSTRATIVE_CHECK}`;
export const CONTEXT_UNAVAILABLE = 'The outcome and end evidence for this record could not load, so it is not shown here. That is unknown, not a sign that nothing changed.';

const temporalHTML = () => `<p id="temporal-update" class="rec-temporal">${esc(NEEDS_REVIEW_NOTE)}</p>`;
const section = (id, heading, body, sub = '', extra = '') =>
  `<section id="${id}" class="rec-section${extra}" aria-labelledby="${id}-title"><h3 class="rec-h" id="${id}-title">${esc(heading)}</h3>${sub}${body}</section>`;

// ---------------------------------------------------------------- overview and glance (D2, D3)

function glanceHTML(event, timing) {
  const positions = positionList(event);
  const more = morePositions(positions.length - 2);
  const sides = positions.length
    ? positions.slice(0, 2).map(p => `<span class="rec-glance-line">${positionLineHTML(p)}</span>`).join('')
      + (more ? `<span class="rec-glance-line rec-glance-more">${more}</span>` : '')
    : 'No position is recorded in this record.';
  const cell = (target, label, value) =>
    `<a class="rec-glance-cell" href="#${target}" data-scroll-to="${target}"><span class="rec-glance-label">${esc(label)}</span><span class="rec-glance-value">${value}</span></a>`;
  return `<div class="rec-glance" role="group" aria-labelledby="rec-glance-title"><h3 id="rec-glance-title" class="rec-glance-title">At a glance</h3><div class="rec-glance-grid">${[
    cell('rec-positions', 'For / against', sides),
    cell('rec-intensity', 'Intensity', glanceIntensityHTML(event)),
    cell('rec-state', 'Police / state', esc(stateActionSummary(event).text)),
    cell('rec-timeline', 'Timeframe', `<span class="rec-glance-line">${esc(timing.line)}</span><span class="rec-glance-line rec-glance-sub">Latest evidence ${dateTag(event?.last_observed_at)}</span>`),
  ].join('')}</div></div>`;
}

/** Glance Intensity: labelled rows unless nothing is described (MINOR 20). */
function glanceIntensityHTML(event) {
  const summary = intensitySummary(event);
  if (summary.allUnknown) return esc(summary.line);
  return summary.items.map(item => `<span class="rec-glance-line"><span class="facet-name">${esc(item.label)}:</span> ${esc(item.text)}</span>`).join('');
}

function overviewHTML(event, context, timing) {
  const issues = (Array.isArray(event?.issues) ? event.issues : []).filter(Boolean);
  return section('rec-overview', 'What happened', [
    event?.summary ? `<p class="rec-summary">${esc(event.summary)}</p>` : '',
    issues.length ? `<ul class="rec-issues" aria-label="Issues">${issues.map(issue => `<li class="rec-issue">${esc(issue)}</li>`).join('')}</ul>` : '',
    glanceHTML(event, timing),
    context?.episode_scope ? `<p class="rec-scope"><strong>Scope of this record:</strong> ${esc(context.episode_scope)}</p>` : '',
  ].join(''), '', ' rec-section--overview');
}

function tabsHTML() {
  return `<nav class="rec-tabs" aria-label="Record sections"><ul class="rec-tabs-list">${RECORD_SECTIONS.map((s, i) =>
    `<li><a class="rec-tab" href="#${s.id}" data-scroll-to="${s.id}"${i === 0 ? ' aria-current="true"' : ''}>${esc(s.label)}</a></li>`).join('')}</ul></nav>`;
}

// ---------------------------------------------------------------- D4 positions

function positionsHTML(event) {
  const positions = positionList(event);
  const body = positions.length
    ? `<ul class="rec-positions">${positions.map(p => `<li class="rec-position">${p.actor ? `<p class="rec-actor">${esc(p.actor)}</p>` : ''}`
      + `<p class="rec-stance"><span class="side-pill" data-stance="${esc(p.stance)}">${esc(p.pillLong)}</span> <span class="side-target">${esc(p.target)}</span></p>`
      + (p.claim ? `<p class="rec-claim"><span class="rec-claim-label">As reported:</span> ${esc(p.claim)}</p>` : '')
      + `${refsHTML(event, p.sourceIds)}</li>`).join('')}</ul>`
    : '<p class="rec-empty">No position is recorded in this record.</p>';
  return section('rec-positions', 'Who is for or against what', body, `<p class="rec-sub">${esc(D4_SUB)}</p>`);
}

// ---------------------------------------------------------------- D5 intensity

function intensityHTML(event) {
  const facets = intensityFacets(event);
  const rows = facets.map(facet => `<div class="facet"><dt class="facet-label">${esc(facet.label)}</dt><dd class="facet-value">`
    + (facet.known ? `<span class="facet-text">${esc(facet.text)}</span>`
      : `<span class="facet-text">${esc(facet.text)}</span> <a class="facet-help" href="#rec-intensity-help" data-scroll-to="rec-intensity-help">What this means</a>`)
    + (facet.key === 'violence' ? `<span class="facet-note">${esc(D5_VIOLENCE_NOTE)}</span>` : '')
    + '</dd></div>').join('');
  const refs = sourceRefs(event, facets[0]?.sourceIds ?? []);
  const source = refs ? `<p class="rec-source-line">Source: ${refs}</p>` : `<p class="rec-source-line">${esc(D5_NO_SOURCE)}</p>`;
  return section('rec-intensity', 'Reported intensity', `<dl class="rec-facets">${rows}</dl>${source}`,
    `<p class="rec-sub" id="rec-intensity-help" tabindex="-1">${esc(D5_SUB)}</p>`);
}

// ---------------------------------------------------------------- D6 police and state

function stateHTML(event) {
  const summary = stateActionSummary(event);
  const body = summary.present
    ? `<ul class="rec-state-list">${summary.items.map(item => `<li class="rec-state-entry"><p class="rec-action">${esc(item.action)}</p>`
      + (item.attribution ? `<p class="rec-attribution">Reported by: ${esc(item.attribution)}</p>` : '')
      + `${refsHTML(event, item.sourceIds)}</li>`).join('')}</ul>`
    : `<p class="rec-empty">${esc(D6_EMPTY)}</p>`;
  return section('rec-state', 'Police and state response', body, `<p class="rec-sub">${esc(D6_SUB)}</p>`);
}

// ---------------------------------------------------------------- D8 timeline

function timelineHTML(event, timing) {
  const entries = (Array.isArray(event?.timeline) ? event.timeline : [])
    .map((entry, index) => ({entry, index}))
    .sort((a, b) => String(a.entry?.date ?? '').localeCompare(String(b.entry?.date ?? '')) || a.index - b.index)
    .map(({entry}) => `<li class="rec-timeline-item"><span class="rec-mark" aria-hidden="true"></span><p class="rec-timeline-body">`
      + `${dateTag(entry?.date, 'rec-timeline-date')} <span class="rec-timeline-text">${esc(entry?.text)}</span> ${sourceRefs(event, entry?.source_ids)}</p></li>`);
  if (!timing.onset) {
    entries.unshift('<li class="rec-timeline-item rec-timeline-item--open"><span class="rec-mark rec-mark--open" aria-hidden="true"></span><p class="rec-timeline-body"><span class="rec-timeline-text">Onset not established</span></p></li>');
  }
  return section('rec-timeline', 'Timeline',
    `<p class="rec-timeframe">${esc(timing.line)}</p>${entries.length ? `<ol class="rec-timeline">${entries.join('')}</ol>` : ''}<p class="rec-rule">${esc(TIMELINE_RULE)}</p>`,
    `<p class="rec-sub">${esc(D8_SUB)}</p>`);
}

// ---------------------------------------------------------------- D9, D10 evidence and sources

// Illustrative: nothing was checked, so no re-read row and no "opened" dates.
function sourcesHTML(event, now, illustrative) {
  const evidence = evidenceLine(event);
  const sources = Array.isArray(event?.sources) ? event.sources : [];
  const note = VERIFICATION_NOTES[evidence.level];
  const reread = illustrative ? ''
    : `<div class="rec-evidence-row"><dt>Source re-read (AI-assisted):</dt><dd>${timeTag(event?.last_verified, now)}</dd></div>`;
  const verification = `<dl class="rec-evidence">`
    + `<div class="rec-evidence-row"><dt>Verification:</dt><dd><strong>${esc(evidence.levelLabel)}</strong></dd>${note ? `<dd class="rec-evidence-note">${esc(note)}</dd>` : ''}</div>`
    + reread
    + `<div class="rec-evidence-row"><dt>Latest evidence:</dt><dd>${timeTag(event?.last_observed_at, now)}</dd></div>`
    + `</dl>${event?.verification?.note ? `<p class="rec-verification-note">${esc(event.verification.note)}</p>` : ''}`;
  const list = sources.length
    ? `<ol class="source-list">${sources.map((source, i) => {
      const publisher = (typeof source?.publisher === 'string' && source.publisher.trim()) || hostOf(source?.url);
      return `<li id="detail-source-${i + 1}" class="source-item" tabindex="-1"><span class="source-title">${sourceLinkKept(source, source?.title)}</span>`
        + `${publisher ? ` — ${esc(publisher)}` : ''}\u00a0· ${source?.published_at ? `published ${dateTag(source.published_at)}` : 'published date not given'}`
        + `${source?.accessed_at && !illustrative ? `\u00a0· opened ${dateTag(source.accessed_at)}` : ''}</li>`;
    }).join('')}</ol>`
    : '';
  const footer = `<div class="rec-footer"><p class="rec-id">Record ID: <code>${esc(event?.id)}</code></p>`
    + `<p class="rec-correction">${sourceLink({url: `${REPO_URL}/issues/new/choose`}, 'Report a correction')}</p>`
    + '<p class="rec-privacy">Please do not post private details about participants.</p></div>';
  return `<section id="rec-sources" class="rec-section" aria-labelledby="rec-sources-title">`
    + `<h3 class="rec-h" id="rec-sources-title">Evidence and verification</h3>${verification}`
    + `<h3 class="rec-h rec-h--sources" id="rec-sources-list-title">Sources</h3>${list}<p class="source-caveat">Source count is not a confidence score.</p>${footer}</section>`;
}

// ---------------------------------------------------------------- record

/** D7 when event-context.json failed: unknown, with Retry, never a "none" fallback (MAJOR 12). */
function outcomeUnavailableHTML() {
  return '<div class="outcome-section"><h3 class="rec-h" id="rec-outcome-title" tabindex="-1">What changed — and for whom?</h3>'
    + `<div class="rec-unavailable"><p>${esc(CONTEXT_UNAVAILABLE)}</p>`
    + '<button type="button" class="btn" data-action="retry-contexts">Retry</button></div></div>';
}

/** D7 for a fictional record: nobody researched it, so no research note and no "none established" fallbacks (MINOR 4). */
export const ILLUSTRATIVE_OUTCOME = `Illustrative example · ${ILLUSTRATIVE_CHECK}; a fictional record has no outcome or end evidence.`;
function outcomeIllustrativeHTML() {
  return '<div class="outcome-section"><h3 class="rec-h" id="rec-outcome-title">What changed — and for whom?</h3>'
    + `<p class="outcome-unknown">${esc(ILLUSTRATIVE_OUTCOME)}</p></div>`;
}

/** HTML for #record-body (SPEC §8.2 order). app.js fills the eyebrow, so `position` is unused. */
export function renderRecord(event, {context = null, mode = 'reported', now = Date.now(), countryName = code => code, contextsError = false} = {}) {
  const status = getDisplayStatus(event, now);
  const band = observationBand(event, now);
  const timing = timeframe(event, context, now);
  const place = placeView(event, countryName);
  const illustrative = mode === 'example' || event?.verification?.level === 'illustrative';
  const iso = typeof event?.country_name === 'string' ? event.country_name.trim() : '';
  const isoLine = iso && iso !== place.country ? `<span class="rec-country-iso">ISO 3166 name: ${esc(iso)}</span>` : '';
  // A no-break space keeps each "·" off the start of a line.
  const placeLine = [`<strong>${esc(place.country)}</strong>`, place.label && esc(place.label), place.precision && `<span class="rec-precision">${esc(place.precision)}</span>`].filter(Boolean).join('\u00a0· ');
  const outcome = illustrative ? outcomeIllustrativeHTML()
    : contextsError ? outcomeUnavailableHTML() : outcomeHTML(event, context, {scope: false, headingId: 'rec-outcome-title'});
  return `<div class="rec-body">${[
    mode === 'example' ? `<div class="rec-example"><p class="rec-watermark">${esc(EXAMPLE_WATERMARK)}</p><p class="rec-example-note">${esc(EXAMPLE_NOTE)}</p></div>` : '',
    `<p class="rec-disclosure">${icon('info')}<span>${esc(illustrative ? D1_ILLUSTRATIVE : D1)}</span></p>`,
    `<p class="rec-meta"><span class="status rec-status" data-status="${esc(status)}">${esc(statusLabel(status, event))}</span> <span class="rec-when">Latest evidence ${timeTag(event?.last_observed_at, now)} ${bandTag(band)}</span></p>`,
    `<p class="rec-place">${placeLine}${isoLine}</p>`,
    `<h2 id="detail-title" class="rec-title" tabindex="-1">${esc(event?.title)}</h2>`,
    status === 'needs-review' ? temporalHTML() : '',
    overviewHTML(event, context, timing),
    tabsHTML(),
    positionsHTML(event),
    intensityHTML(event),
    stateHTML(event),
    `<section id="rec-outcome" class="rec-section" aria-labelledby="rec-outcome-title">${outcome}</section>`,
    timelineHTML(event, timing),
    sourcesHTML(event, now, illustrative),
  ].join('')}</div>`;
}

/** Clock tick on an open record: patch the status badge and band in place; add or remove the needs-review note. */
export function patchRecordStatus(root, event, now = Date.now()) {
  if (!root?.querySelector || !event) return;
  const status = getDisplayStatus(event, now);
  const badge = root.querySelector('.rec-status');
  const label = statusLabel(status, event);
  if (badge && (badge.getAttribute('data-status') !== status || badge.textContent !== label)) {
    badge.setAttribute('data-status', status);
    badge.textContent = label;
  }
  const band = observationBand(event, now);
  const bandEl = root.querySelector('.rec-meta .band');
  if (bandEl && bandEl.getAttribute('data-band') !== band) bandEl.outerHTML = bandTag(band);
  const note = root.querySelector('#temporal-update');
  if (status === 'needs-review' && !note) root.querySelector('#detail-title')?.insertAdjacentHTML('afterend', temporalHTML());
  else if (status !== 'needs-review' && note) note.remove();
}

// ---------------------------------------------------------------- scroll-spy and mini title

/** The element that scrolls the record: the dialog itself in the short-viewport layout, else .sheet-body. */
function scrollerOf(dialog) {
  const body = dialog.querySelector('.sheet-body');
  if (body && body.scrollHeight > body.clientHeight + 1 && getComputedStyle(body).overflowY !== 'visible') return body;
  return dialog;
}
const offsetOf = el => (el && getComputedStyle(el).position !== 'static' ? el.offsetHeight : 0);

/**
 * Scroll-spy (aria-current on the .rec-tabs link) and dialog[data-scrolled] once #detail-title is out of view.
 * Observers use root: dialog, so either scroller works (C-42). refresh() runs after each render.
 */
export function mountRecordChrome(dialog) {
  if (!dialog || typeof IntersectionObserver === 'undefined') return {refresh() {}, destroy() {}};
  const inView = new Set();
  let sections = [];
  let sectionObserver = null;
  let titleObserver = null;
  let frame = 0;
  let current = '';

  function reveal(tab, focused = false) {
    const strip = tab.closest('.rec-tabs');
    // The spy never scrolls the strip away from a tab the keyboard user is on.
    if (!strip || strip.scrollWidth <= strip.clientWidth || (!focused && strip.contains(document.activeElement))) return;
    const s = strip.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (t.left < s.left) strip.scrollLeft -= s.left - t.left + 16;
    else if (t.right > s.right) strip.scrollLeft += t.right - s.right + 16;
  }

  function setCurrent(id) {
    if (!id || id === current) return;
    current = id;
    for (const tab of dialog.querySelectorAll('.rec-tabs a[data-scroll-to]')) {
      if (tab.getAttribute('data-scroll-to') === id) {
        tab.setAttribute('aria-current', 'true');
        reveal(tab);
      } else tab.removeAttribute('aria-current');
    }
  }

  function update() {
    frame = 0;
    if (!sections.length) return;
    const scroller = scrollerOf(dialog);
    const atEnd = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 2 && scroller.scrollTop > 0;
    let active = sections.find(s => inView.has(s));
    if (atEnd) {
      const bottom = dialog.getBoundingClientRect().bottom;
      active = sections.filter(s => s.getBoundingClientRect().top < bottom - 48).at(-1) ?? active;
    }
    if (active) setCurrent(active.id);
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  function disconnect() {
    sectionObserver?.disconnect();
    titleObserver?.disconnect();
    sectionObserver = titleObserver = null;
    inView.clear();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function refresh() {
    disconnect();
    current = '';
    const head = dialog.querySelector('.sheet-head');
    const tabs = dialog.querySelector('.rec-tabs');
    const headInset = offsetOf(head);
    const tabsInset = tabs && getComputedStyle(tabs).position === 'sticky' ? tabs.offsetHeight : 0;
    sections = [...dialog.querySelectorAll('section[id^="rec-"]')];
    sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) entry.isIntersecting ? inView.add(entry.target) : inView.delete(entry.target);
      schedule();
    }, {root: dialog, rootMargin: `-${headInset + tabsInset + 8}px 0px -45% 0px`, threshold: 0});
    sections.forEach(s => sectionObserver.observe(s));
    setCurrent(sections[0]?.id ?? '');
    dialog.setAttribute('data-scrolled', 'false');
    const title = dialog.querySelector('#detail-title');
    if (title) {
      titleObserver = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        const above = !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
        dialog.setAttribute('data-scrolled', above ? 'true' : 'false');
      }, {root: dialog, rootMargin: `-${headInset}px 0px 0px 0px`, threshold: 0});
      titleObserver.observe(title);
    }
  }

  // A focused tab partly outside the sideways strip scrolls fully into view.
  const onFocus = event => { if (event.target.matches?.('.rec-tabs a')) reveal(event.target, true); };
  // The short-viewport layout (C-42) makes the head and tabs static, which changes the observer insets.
  const short = typeof matchMedia === 'function' ? matchMedia('(max-height: 500px)') : null;
  const onLayout = () => { if (sections.length) refresh(); };
  dialog.addEventListener('scroll', schedule, {capture: true, passive: true});
  dialog.addEventListener('focusin', onFocus);
  short?.addEventListener?.('change', onLayout);
  return {
    refresh,
    destroy() {
      disconnect();
      sections = [];
      dialog.removeEventListener('scroll', schedule, {capture: true});
      dialog.removeEventListener('focusin', onFocus);
      short?.removeEventListener?.('change', onLayout);
      dialog.removeAttribute('data-scrolled');
    },
  };
}
