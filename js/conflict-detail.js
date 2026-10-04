// Conflict record sheet body, lazy (4.1 SPEC §7.2, §9 WP-D; Phase-0 stub with the frozen signatures).
// Reached only through import() from app.js when a route names a UCDP record; listed in the import map (cache key)
// but never preloaded. May import ./html.js, ./model.js, ./conflicts.js and ../freshness.js (SPEC §19.0, C-53).
// Phase 0: renderConflictRecord returns the title and the loading paragraph of §4.8; WP-D renders CD1–CD7.
import {esc} from './html.js';
import {conflictChrome} from './conflicts.js';

/** Sticky tabs of the conflict sheet (§7.2), in order. */
export const CONFLICT_SECTIONS = Object.freeze([
  {id: 'conf-overview', label: 'Overview'}, {id: 'conf-years', label: 'Years'}, {id: 'conf-months', label: 'Months'},
  {id: 'conf-limits', label: 'Limits'}, {id: 'conf-source', label: 'Source'},
]);

export const RECORD_LOADING = 'Loading this record…';

/** Phase 0: the title and the loading paragraph. WP-D renders CD1–CD7 (meta, tables with bounds on every figure, limits, source). */
export function renderConflictRecord(record, {envelope = null, now = Date.now(), countryName = code => code} = {}) {   // eslint-disable-line no-unused-vars
  const chrome = conflictChrome(record, envelope);
  return `<h2 id="detail-title" class="rec-title" tabindex="-1">${esc(chrome.title)}</h2><p class="view-loading" role="status">${esc(RECORD_LOADING)}</p>`;
}
