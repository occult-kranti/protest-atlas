// Record cards, HTML strings (WP3; SPEC §7, C-11, C-51). DOM-free and safe to import in Node.
// Both densities carry C1–C8: status (leads, dated), place, title, latest evidence + band, issues,
// timeframe, for/against with named targets, intensity, police/state, and the evidence row.
import {positionList, intensitySummary, stateActionSummary, timeframe, evidenceLine, placeView} from './record-facts.js';
import {esc, sourceLink, timeTag, bandTag, dateTag} from './html.js';
import {getDisplayStatus, statusLabel} from './model.js';
import {observationBand} from '../freshness.js';

const MAX_POSITIONS = 2;
export const EXAMPLE_WATERMARK = 'Illustrative example • not a real event';

/** ST1–ST5 with dates (C-06), from js/model.js statusLabel. */
const statusHTML = (status, event) =>
  `<span class="status" data-status="${esc(status)}">${esc(statusLabel(status, event))}</span>`;

function placeHTML(event, countryName) {
  const place = placeView(event, countryName);
  return `<p class="card-place"><strong>${esc(place.country)}</strong>${place.label ? ` · ${esc(place.label)}` : ''}</p>`;
}

function whenHTML(event, now, band) {
  return `<p class="card-when">Latest evidence ${timeTag(event?.last_observed_at, now, 'both')} ${bandTag(band)}</p>`;
}

function issuesHTML(event) {
  const issues = (Array.isArray(event?.issues) ? event.issues : []).filter(Boolean);
  return issues.length ? `<p class="card-issues"><span class="visually-hidden">Issues: </span>${issues.map(esc).join(' · ')}</p>` : '';
}

/** C4 + C10: at most two positions in recorded order, never clamped; the pill is hue-free. */
function sidesHTML(event) {
  const positions = positionList(event);
  if (!positions.length) return '<p class="card-sides-none">No position is recorded in this record.</p>';
  const shown = positions.slice(0, MAX_POSITIONS).map(p =>
    `<li class="card-side"><span class="side-pill" data-stance="${esc(p.stance)}">${esc(p.pill)}</span> <span class="side-target">${esc(p.target)}</span> — <span class="side-actor">${esc(p.actor)}</span></li>`).join('');
  const more = positions.length - MAX_POSITIONS;
  return `<ul class="card-sides">${shown}</ul>${more > 0 ? `<p class="card-more">+${more} more ${more === 1 ? 'position' : 'positions'} recorded</p>` : ''}`;
}

/** C6: one line when nothing is described, otherwise three fixed rows shown verbatim. */
function intensityHTML(event) {
  const summary = intensitySummary(event);
  if (summary.allUnknown) return `<p class="facet-none">${esc(summary.line)}</p>`;
  return `<ul class="facet-list">${summary.items.map(item =>
    `<li class="facet-item"><span class="facet-name">${esc(item.label)}:</span> ${esc(item.text)}</li>`).join('')}</ul>`;
}

/** C7: "{action} — {attribution}" verbatim; none → "Not established in this record". */
function stateHTML(event) {
  const summary = stateActionSummary(event);
  if (!summary.present) return esc(summary.text);
  return summary.items.map(item =>
    `${esc(item.action)}${item.attribution ? ` — <span class="card-attribution">${esc(item.attribution)}</span>` : ''}`).join('; ');
}

/** C8: publisher link (above the stretched card link) · published date · level · links · AI-assisted check. */
function evidenceHTML(event) {
  const line = evidenceLine(event);
  const published = line.published ? `published ${dateTag(line.published)}` : 'publication date not given';
  return `<p class="card-evidence">${sourceLink(line.source, line.publisher)} · ${published} · <span class="card-level">${esc(line.levelLabel)}</span> · ${esc(line.linkLabel)} · AI-assisted check</p>`;
}

/** C9: the only element that may be clamped. */
function outcomeHTML(context) {
  if (context?.outcome_status !== 'documented') return '';
  const summary = (Array.isArray(context.outcomes) ? context.outcomes : []).map(o => o?.summary).find(s => typeof s === 'string' && s.trim());
  return summary ? `<p class="card-outcome"><span class="card-outcome-label">What changed:</span> ${esc(summary.trim())}</p>` : '';
}

const fact = (label, value) => `<div class="card-fact"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;

/**
 * One record card. `density` is 'card' (compact label-column, default) or 'row' (List).
 * The title link is stretched over the card; the publisher link sits above it. No chevron.
 */
export function renderCard(event, {context = null, mode = 'reported', now = Date.now(), countryName = code => code, density = 'card'} = {}) {
  const status = getDisplayStatus(event, now);
  const band = observationBand(event, now);
  const row = density === 'row';
  const id = esc(event?.id);
  const ended = status === 'ended' ? ' data-ended="true"' : '';
  const watermark = mode === 'example' ? `<p class="card-watermark">${esc(EXAMPLE_WATERMARK)}</p>` : '';
  const title = `<h3 class="card-title"><a class="card-link" href="#/record/${id}" data-open-record="${id}">${esc(event?.title)}</a></h3>`;
  const statusLine = `<p class="card-status">${statusHTML(status, event)}</p>`;
  const frame = body => `<article class="card" data-id="${id}" data-status="${esc(status)}" data-band="${esc(band)}"${ended} data-density="${row ? 'row' : 'card'}">${watermark}${body}</article>`;
  const timing = timeframe(event, context, now);

  if (row) {
    return frame([
      `<div class="card-meta">${statusLine}${whenHTML(event, now, band)}</div>`,
      placeHTML(event, countryName),
      title,
      issuesHTML(event),
      sidesHTML(event),
      `<p class="card-row-facts"><span class="card-row-label">Timeframe:</span> ${esc(timing.line)} · <span class="card-row-label">Intensity:</span> ${esc(intensitySummary(event).line)}</p>`,
      `<p class="card-row-state"><span class="card-row-label">Police / state:</span> ${stateHTML(event)}</p>`,
      evidenceHTML(event),
    ].join(''));
  }

  return frame([
    statusLine,
    placeHTML(event, countryName),
    title,
    whenHTML(event, now, band),
    issuesHTML(event),
    `<dl class="card-facts">${[
      fact('Timeframe', esc(timing.line)),
      fact('For / against', sidesHTML(event)),
      fact('Intensity', intensityHTML(event)),
      fact('Police / state', stateHTML(event)),
    ].join('')}</dl>`,
    outcomeHTML(context),
    evidenceHTML(event),
  ].join(''));
}

/** Placeholder cards while records load (aria-hidden; static, no shimmer). */
export function renderCardSkeleton(count = 3) {
  const n = Math.max(0, Math.min(12, Number.isFinite(count) ? Math.floor(count) : 3));
  const lines = ['short', 'medium', 'title', 'title-2', 'medium', 'long', 'long', 'short'];
  const card = `<div class="card card-skeleton">${lines.map(kind => `<span class="card-skeleton-line card-skeleton-line--${kind}"></span>`).join('')}</div>`;
  return n ? `<div class="card-skeletons" aria-hidden="true">${card.repeat(n)}</div>` : '';
}
