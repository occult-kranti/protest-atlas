// Shared HTML string helpers. Pure and safe to import in Node; patchHTML touches the DOM only when called.
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

/** sourceRefs() as a `.rec-refs` paragraph, or '' when no id resolves (record and outcome sections). */
export function sourceRefsBlock(event, ids) {
  const refs = sourceRefs(event, ids);
  return refs ? `<p class="rec-refs">${refs}</p>` : '';
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

/** ['29', 'Sep', '2026'] for an ISO day: the parts of absoluteLabel(), which writes fixed month names. */
export const dayParts = value => absoluteLabel(value).split(' ');

/** <time> with the absolute label only (no data-rel, so refreshTimes leaves it alone). WP3 addition. */
export function dateTag(value, className = '') {
  const cls = className ? ` class="${esc(className)}"` : '';
  if (!value || !Number.isFinite(Date.parse(value))) return `<span${cls}>Not established</span>`;
  return `<time${cls} datetime="${esc(value)}">${esc(absoluteLabel(value))}</time>`;
}

/** sourceLink() whose last word and icon never part at a line break. WP3 addition. */
export function sourceLinkKept(source, label) {
  const html = sourceLink(source, label);
  const m = html.match(/^(<a [^>]+>)((?:[^<]*\s)?)([^\s<]{1,24})(<svg[^]*?<\/svg>)/);
  return m ? `${m[1]}${m[2]}<span class="source-nowrap">${m[3]}${m[4]}</span>${html.slice(m[0].length)}` : html;
}

// Attributes that identify a focused control across a re-render, most specific first.
const FOCUS_KEYS = ['id', 'data-select-country', 'data-ahead-target', 'data-open-record', 'data-scroll-to', 'data-retry', 'data-action', 'href'];

/**
 * Mount helper (tech §4.5): replace el.innerHTML only when the markup changed, then reopen <details data-key> that
 * were open and give focus back to the same control (by FOCUS_KEYS, or a keyed summary). `cache` is a WeakMap.
 */
/** Focus target when the focused control left with a re-render: the nearest focusable section title, else the view h1. */
function fallbackTitle(el) {
  const doc = el.ownerDocument;
  for (let node = el; node && node !== doc.body; node = node.parentElement) {
    const id = node.getAttribute?.('aria-labelledby');
    const title = id ? doc.getElementById(id.split(/\s+/)[0]) : null;
    if (title?.hasAttribute('tabindex') && title.getClientRects().length) return title;
  }
  return el.closest('.view')?.querySelector('h1[tabindex="-1"]') ?? null;
}

export function patchHTML(el, html, cache) {
  if (cache.get(el) === html) return false;
  const active = el.ownerDocument.activeElement;
  const hadFocus = Boolean(active && active !== el && el.contains(active));
  let focus = null;
  if (hadFocus) {
    const key = FOCUS_KEYS.find(name => active.getAttribute(name));
    const details = active.tagName === 'SUMMARY' && active.parentElement?.dataset.key;
    if (key) focus = key === 'id' ? `#${CSS.escape(active.id)}` : `[${key}="${CSS.escape(active.getAttribute(key))}"]`;
    else if (details) focus = `details[data-key="${CSS.escape(details)}"] > summary`;
  }
  const open = [...el.querySelectorAll('details[data-key][open]')].map(d => d.dataset.key);
  el.innerHTML = html;
  cache.set(el, html);
  for (const key of open) el.querySelector(`details[data-key="${CSS.escape(key)}"]`)?.setAttribute('open', '');
  const target = focus ? el.querySelector(focus) : null;
  if (target) target.focus({preventScroll: true});
  else if (hadFocus) fallbackTitle(el)?.focus({preventScroll: true});
  return true;
}
