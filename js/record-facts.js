// Record derivations (WP3; SPEC §7.4, §7.6). DOM-free. Recorded text stays verbatim: no numbers parsed
// from prose, no stance tallies, and an unknown never becomes a zero.
import {esc, safeURL, hostOf, plural, dayParts} from './html.js';
import {observationBand, toTime, absoluteLabel} from '../freshness.js';

export const EXAMPLE_WATERMARK = 'Illustrative example • not a real event';
export const VERIFICATION_LABELS = {'single-source': 'Single source', corroborated: 'Corroborated', contested: 'Contested', illustrative: 'Illustrative'};

/** SPEC §8.8, verbatim. */
export const VERIFICATION_NOTES = {
  'single-source': 'One newsroom or reporting chain, however many links. Two copies of one wire story count as one source.',
  corroborated: 'The AI-assisted check found more than one independent source for key claims. This is not independent human verification.',
  contested: 'Sources disagree on key claims; the record keeps both accounts.',
};

export const NOT_ESTABLISHED = {
  disruptionViolence: ['unknown', 'not established', 'not established by this record', 'disruption not established by this record', 'violence not established by this record'],
  turnout: ['not established', 'no reliable event-wide count established', 'no single verified numerical estimate adopted', 'no verified numerical estimate retained', 'reliable comparable count not established'],
};

export const NOT_ESTABLISHED_TEXT = 'Not established in this record';
export const ALL_INTENSITY_UNKNOWN = 'Turnout, disruption and violence: not established in this record.';

const DAY = 86_400_000;
const STANCES = ['support', 'oppose', 'mixed', 'unclear'];
const PILL = {support: 'For', oppose: 'Against', mixed: 'Mixed', unclear: 'Unclear'};
const PILL_LONG = {support: 'For', oppose: 'Against', mixed: 'Mixed position on', unclear: 'Position unclear on'};
const text = value => (typeof value === 'string' ? value.trim() : '');
const ids = value => (Array.isArray(value) ? value.filter(id => typeof id === 'string') : []);

/** Exact allowlist comparison (editorial §6.2): trim, lower-case, drop one trailing period. */
const normalise = value => text(value).toLowerCase().replace(/\.$/, '');

// ---------------------------------------------------------------- positions

/** One position as displayed: hue-free pill text, the named target and the actor, never a tally. */
export function positionView(p) {
  const stance = STANCES.includes(p?.stance) ? p.stance : 'unclear';
  return {
    stance,
    pill: PILL[stance],
    pillLong: PILL_LONG[stance],
    target: text(p?.target) || 'target not established',
    actor: text(p?.actor),
    claim: text(p?.claim),
    sourceIds: ids(p?.source_ids),
  };
}

/** "Against · Yoon’s removal — Pro-Yoon demonstrators". */
export function positionSentence(position) {
  const view = positionView(position);
  return `${view.pill} · ${view.target}${view.actor ? ` — ${view.actor}` : ''}`;
}

/** C4 line markup (cards and the glance): hue-free pill, target, actor. */
export const positionLineHTML = p => `<span class="side-pill" data-stance="${esc(p.stance)}">${esc(p.pill)}</span> `
  + `<span class="side-target">${esc(p.target)}</span>${p.actor ? ` — <span class="side-actor">${esc(p.actor)}</span>` : ''}`;

/** C10 text, or '' when nothing is left over. */
export const morePositions = n => (n > 0 ? `+${plural(n, 'more position')} recorded` : '');

/** Every position in recorded order. No grouping, no counts. */
export function positionList(event) {
  return (Array.isArray(event?.positions) ? event.positions : []).map(positionView);
}

// ---------------------------------------------------------------- police and state response

/** C7: "{action} — {attribution}" per entry, verbatim; none → "Not established in this record". */
export function stateActionSummary(event) {
  const items = (Array.isArray(event?.state_response) ? event.state_response : [])
    .map(entry => ({action: text(entry?.action), attribution: text(entry?.attribution), sourceIds: ids(entry?.source_ids)}))
    .filter(entry => entry.action);
  return {
    present: items.length > 0,
    items,
    text: items.length
      ? items.map(entry => (entry.attribution ? `${entry.action} — ${entry.attribution}` : entry.action)).join('; ')
      : NOT_ESTABLISHED_TEXT,
  };
}

// ---------------------------------------------------------------- intensity

const count = value => (Number.isFinite(value) && value > 0 ? value : null);
const number = value => value.toLocaleString('en');

function turnoutFacet(turnout) {
  const min = count(turnout?.min);
  const max = count(turnout?.max);
  const qualifier = text(turnout?.qualifier);
  if (min !== null || max !== null) {
    const range = min !== null && max !== null
      ? (min === max ? number(min) : `${number(Math.min(min, max))}–${number(Math.max(min, max))}`)
      : min !== null ? `At least ${number(min)}` : `Up to ${number(max)}`;
    return {text: qualifier ? `${range}. ${qualifier}` : range, known: true};
  }
  if (!qualifier || NOT_ESTABLISHED.turnout.includes(normalise(qualifier))) return {text: NOT_ESTABLISHED_TEXT, known: false};
  return {text: qualifier, known: true};
}

function proseFacet(value) {
  const recorded = text(value);
  if (!recorded || NOT_ESTABLISHED.disruptionViolence.includes(normalise(recorded))) return {text: NOT_ESTABLISHED_TEXT, known: false};
  return {text: recorded, known: true};
}

/** Three rows in fixed order: Turnout · Disruption · Violence or harm. Never reordered, hidden or combined. */
export function intensityFacets(event) {
  const intensity = event?.intensity ?? {};
  const sourceIds = ids(intensity.source_ids);
  return [
    {key: 'turnout', label: 'Turnout', ...turnoutFacet(intensity.turnout), sourceIds},
    {key: 'disruption', label: 'Disruption', ...proseFacet(intensity.disruption), sourceIds},
    {key: 'violence', label: 'Violence or harm', ...proseFacet(intensity.violence), sourceIds},
  ];
}

/** C6 for cards, the glance and the List density. */
export function intensitySummary(event) {
  const facets = intensityFacets(event);
  const allUnknown = facets.every(facet => !facet.known);
  const items = facets.map(facet => ({label: facet.label, text: facet.known ? facet.text : 'not established'}));
  return {
    allUnknown,
    line: allUnknown ? ALL_INTENSITY_UNKNOWN : items.map(item => `${item.label}: ${item.text}`).join(' · '),
    items,
  };
}

// ---------------------------------------------------------------- timeframe

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const day = value => (typeof value === 'string' && DAY_ONLY.test(value.slice(0, 10)) && Number.isFinite(toTime(value.slice(0, 10))) ? value.slice(0, 10) : null);

/** "29 Sep – 30 Sep 2026"; "21 Dec 2025 – 4 Jan 2026" across years. */
export function dayRange(from, to) {
  const [d1, m1, y1] = dayParts(from);
  const [, , y2] = dayParts(to);
  return y1 === y2 ? `${d1} ${m1} – ${absoluteLabel(to)}` : `${absoluteLabel(from)} – ${absoluteLabel(to)}`;
}

/** Editorial §8 templates; inclusive durations from start and end only, never from the timeline. */
export function timeframe(event, context = null, now = Date.now()) {
  const onset = day(event?.start_date);
  const end = day(event?.end_date);
  const latestEvidence = day(event?.last_observed_at) ?? (typeof event?.last_observed_at === 'string' ? event.last_observed_at : null);
  const band = observationBand(event, now);
  let spanDays = null;
  let line;
  if (onset && end) {
    const span = Math.round((toTime(end) - toTime(onset)) / DAY) + 1;
    spanDays = span >= 1 ? span : null;
    if (onset === end) line = `${absoluteLabel(onset)} (one day) · ended / suspended`;
    else if (spanDays) line = `${dayRange(onset, end)} (${spanDays} days) · ended / suspended`;
    else line = `${absoluteLabel(onset)} – ${absoluteLabel(end)} · ended / suspended`;
  } else if (onset) {
    line = `From ${absoluteLabel(onset)} · end not established`;
  } else if (end) {
    line = `Onset not established · ended ${absoluteLabel(end)}`;
  } else {
    const dates = [...new Set((Array.isArray(event?.timeline) ? event.timeline : []).map(entry => day(entry?.date)).filter(Boolean))].sort();
    if (dates.length >= 2) line = `Dated evidence ${dayRange(dates[0], dates.at(-1))} · onset and end not established`;
    else if (dates.length === 1) line = `Dated evidence ${absoluteLabel(dates[0])} only · onset and end not established`;
    else line = 'Onset and end not established';
  }
  return {line, onset, end, latestEvidence, band, spanDays};
}

// ---------------------------------------------------------------- evidence

const sourcesOf = event => (Array.isArray(event?.sources) ? event.sources : []);

/** The first source with a safe URL, else the first source (C8 and the sheet's primary link). */
function primary(event) {
  const sources = sourcesOf(event);
  return sources.find(source => safeURL(source?.url)) ?? sources[0] ?? null;
}

/** C8 parts; `text` is the row without link markup. An unnamed source without a URL leaves the publisher out. */
export function evidenceLine(event) {
  const source = primary(event);
  const url = safeURL(source?.url);
  const publisher = text(source?.publisher) || hostOf(url);
  const published = day(source?.published_at);
  const level = event?.verification?.level;
  const levelLabel = VERIFICATION_LABELS[level] ?? VERIFICATION_LABELS['single-source'];
  const linkCount = sourcesOf(event).length;
  const linkLabel = plural(linkCount, 'link');
  const publishedText = published ? `published ${absoluteLabel(published)}` : 'publication date not given';
  return {
    publisher, url, published, level: level in VERIFICATION_LABELS ? level : 'single-source', levelLabel,
    levelNote: VERIFICATION_NOTES[level] ?? '', linkCount, linkLabel, publishedText, source,
    text: [publisher, publishedText, levelLabel, linkLabel, 'AI-assisted check'].filter(Boolean).join(' · '),
  };
}

/** Sheet footer link (C-16). `label` is "Read {publisher}" up to 24 characters, else "Read the source". */
export function primarySource(event) {
  const source = primary(event);
  const url = safeURL(source?.url);
  const publisher = text(source?.publisher) || hostOf(url);
  const label = publisher && publisher.length <= 24 ? `Read ${publisher}` : 'Read the source';
  const named = label === 'Read the source' && publisher ? `Read the source: ${publisher}` : label;
  return {url, publisher, label, ariaLabel: `${named} (opens in a new tab)`};
}

// ---------------------------------------------------------------- place

const PRECISION_LABELS = {city: 'city-level', region: 'region-level', country: 'country-level', 'multi-location': 'several locations'};

/** C1 parts: countryName(code), else the code; the label is dropped when it repeats the country. */
export function placeView(event, countryName = code => code) {
  let named = '';
  try { named = text(countryName(event?.country)); } catch { named = ''; }
  const country = named || text(event?.country) || text(event?.country_name);
  const label = text(event?.location?.label);
  const repeats = [country, text(event?.country_name)].some(name => name && name.toLowerCase() === label.toLowerCase());
  return {country, label: repeats ? '' : label, precision: PRECISION_LABELS[event?.location?.precision] ?? ''};
}
