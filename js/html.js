// Shared DOM-free HTML string helpers. Pure; safe to import in Node.
import {absoluteLabel, relativeLabel, BAND_BADGES, BAND_LABELS} from '../freshness.js';

export const REPO_URL = 'https://github.com/occult-kranti/protest-atlas';
const ENTITIES = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ENTITIES[c]);

/** http(s) URLs only; '' otherwise. */
export function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}
export function hostOf(value) {
  const url = safeURL(value);
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
}
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function icon(name, label = '') {
  const svg = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${esc(name)}"></use></svg>`;
  return label ? `${svg}<span class="visually-hidden">${esc(label)}</span>` : svg;
}

/** External source link: new tab, no referrer, accessible "opens in a new tab". */
export function sourceLink(source, label) {
  const url = safeURL(source?.url);
  const text = esc(label || source?.title || 'Source URL unavailable');
  return url
    ? `<a class="source-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}${icon('external')}<span class="visually-hidden"> (opens in a new tab)</span></a>`
    : text;
}

/** 1-based position of each source id in event.sources. */
export function sourceNumbers(event) {
  return new Map((event?.sources ?? []).map((s, i) => [s.id, i + 1]));
}

/** In-sheet citation chips. href kept for history/outcome tests; data-scroll-to avoids hash routing. */
export function sourceRefs(event, ids = []) {
  const numbers = sourceNumbers(event);
  return (ids ?? []).map(id => numbers.get(id)).filter(Boolean)
    .map(n => `<a class="source-ref" href="#detail-source-${n}" data-scroll-to="detail-source-${n}">Source ${n}</a>`).join('');
}

/** Visible text for a time element. format: 'both' | 'absolute' | 'relative'. */
export function timeText(value, now, format = 'both') {
  if (format === 'absolute') return absoluteLabel(value);
  if (format === 'relative') return relativeLabel(value, now);
  return `${absoluteLabel(value)} · ${relativeLabel(value, now)}`;
}

/** <time> that js/stamps.js refreshTimes() can update in place. */
export function timeTag(value, now, format = 'both', className = 'stamp-time') {
  if (!value || !Number.isFinite(Date.parse(value))) return `<span class="${esc(className)}">Not established</span>`;
  return `<time class="${esc(className)}" datetime="${esc(value)}" data-rel="${esc(value)}" data-format="${esc(format)}">${esc(timeText(value, now, format))}</time>`;
}

/**
 * Neutral, text-only observation-band badge (C-05, C-51; WP3 addition). The short F-label is visible and
 * aria-hidden; the long label is visually hidden text, never an aria-label on a <span>.
 */
export function bandTag(band) {
  const key = Object.hasOwn(BAND_BADGES, band) ? band : 'unknown';
  return `<span class="band" data-band="${key}"><span class="band-text" aria-hidden="true">${esc(BAND_BADGES[key])}</span><span class="visually-hidden">${esc(BAND_LABELS[key])}</span></span>`;
}

/**
 * absoluteLabel() with the copy deck's month abbreviations: newer ICU data writes September as "Sept";
 * the deck (and js/model.js statusLabel) write "Sep". WP3 addition.
 */
export const absoluteText = value => absoluteLabel(value).replace(/\bSept\b/, 'Sep');

/** <time> with the absolute label only, for days or timestamps (no data-rel, so refreshTimes leaves it alone). WP3 addition. */
export function dateTag(value, className = '') {
  const cls = className ? ` class="${esc(className)}"` : '';
  if (!value || !Number.isFinite(Date.parse(value))) return `<span${cls}>Not established</span>`;
  return `<time${cls} datetime="${esc(value)}">${esc(absoluteText(value))}</time>`;
}
