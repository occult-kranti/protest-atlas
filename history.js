// Historical context helpers and the record's outcome section (WP3). DOM-free; safe to import in Node.
// Frozen for tests: contextFor, matchesHistory, completionKind, outcomeHTML and its pinned strings
// ('Assessment / inference', 'protest causation is not established', 'End not established', #detail-source-N, escaping).
import {esc, sourceRefs, sourceRefsBlock as refsHTML, dateTag} from './js/html.js';

export const contextFor = (contexts,id) => contexts?.records?.find(row=>row.event_id===id);
export function matchesHistory(event,context,filters) {
  const dates=[event.start_date,event.end_date,event.last_observed_at,...(event.timeline||[]).map(row=>row.date)].filter(Boolean);
  return (!filters.year || dates.some(date=>date.slice(0,4)===filters.year)) &&
    (!filters.city || (context?.cities||[]).some(city=>`${event.country}:${city.name}`===filters.city)) &&
    (!filters.outcome || (context?.outcome_status||'not-established')===filters.outcome);
}
export function completionKind(events=[]) {
  const ended=events.filter(e=>e.status==='ended').length;
  return !ended?'none':ended===events.length?'ended-only':'mixed';
}

const CAUSALITY = {
  'reported-link': 'The source links this change to the action; causal certainty is limited.',
  'not-established': 'A subsequent change is documented; protest causation is not established.',
};

/** Cities that cite the same sources share one set of "Source N" links, in first-seen order. */
function cityGroups(cities = []) {
  const groups = new Map();
  for (const city of cities || []) {
    const ids = city?.source_ids || [];
    const key = ids.join('\u0000');
    if (!groups.has(key)) groups.set(key, {names: [], ids});
    groups.get(key).names.push(city?.name ?? '');
  }
  return [...groups.values()];
}

function favourHTML(favour) {
  return `<li class="outcome-favour"><p class="outcome-actor"><strong>${esc(favour.actor)} · ${esc(favour.effect)}</strong> <span class="assessment-label${favour.basis==='inference'?' assessment-label--inference':''}">${favour.basis==='inference'?'Assessment / inference':'Explicit in source'}</span></p><p class="outcome-note">${esc(favour.note)}</p></li>`;
}

function entryHTML(event, outcome) {
  const date = outcome.date && Number.isFinite(Date.parse(outcome.date)) ? dateTag(outcome.date) : esc(outcome.date || 'Date not established');
  return `<article class="outcome-entry"><p class="outcome-date">${date}</p><h4 class="outcome-summary">${esc(outcome.summary)}</h4><p class="outcome-causality">${CAUSALITY[outcome.causality] ?? CAUSALITY['not-established']}</p>${(outcome.favours||[]).length?`<ul class="outcome-favours">${outcome.favours.map(favourHTML).join('')}</ul>`:''}${refsHTML(event, outcome.source_ids)}</article>`;
}

/**
 * D7 "What changed — and for whom?". Optional third argument (WP3 addition; the two-argument call is unchanged):
 * `scope: false` leaves the episode scope to the record overview; `headingId` is the host's id for the heading.
 */
export function outcomeHTML(event,context,{scope = true, headingId = ''} = {}) {
  const sources = {sources: event?.sources || []};
  const cities=cityGroups(context?.cities).map(g=>`<span class="outcome-city">${g.names.map(esc).join(', ')} ${sourceRefs(sources,g.ids)}</span>`).join('<span class="outcome-sep" aria-hidden="true"> · </span>');
  const ended = event?.status==='ended';
  const documented = context?.outcome_status==='documented' && (context.outcomes||[]).length;
  return `<div class="outcome-section">`
    + `<h3 class="rec-h"${headingId ? ` id="${esc(headingId)}"` : ''}>What changed — and for whom?</h3>`
    + (scope || !context ? `<p class="episode-scope">${esc(context?.episode_scope||'The recorded episode; the wider movement may continue.')}</p>` : '')
    + (cities ? `<p class="outcome-cities"><strong>Reported cities:</strong> ${cities}</p>` : '')
    + `<div class="completion-note${ended?' confirmed-ended':''}"><p class="completion-title"><strong>${ended?'Ended / suspended episode':'End not established'}</strong></p><p>${esc(context?.status_basis?.text||'Age alone does not establish that this episode ended.')}</p>${refsHTML(sources, context?.status_basis?.source_ids)}</div>`
    + (documented ? context.outcomes.map(o=>entryHTML(sources,o)).join('') : '<p class="outcome-unknown">No sourced outcome established in this snapshot. This does not mean nothing changed.</p>')
    + `<p class="small-note">${esc(context?.research_note||'AI-assisted research. No independent human editorial sign-off.')}</p>`
    + `</div>`;
}
