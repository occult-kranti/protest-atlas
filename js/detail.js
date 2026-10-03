// Record sheet body, section nav and status patching (WP3). Phase-0 stub; RECORD_SECTIONS is final (C-15). DOM-free when loaded.
// The two lines below are mandatory static edges (SPEC §19.0).
import '../history.js';
import './record-facts.js';

export const RECORD_SECTIONS = [{id: 'rec-overview', label: 'Overview'}, {id: 'rec-positions', label: 'For/against'},
  {id: 'rec-intensity', label: 'Intensity'}, {id: 'rec-state', label: 'Police/state'}, {id: 'rec-outcome', label: 'Outcome'},
  {id: 'rec-timeline', label: 'Timeline'}, {id: 'rec-sources', label: 'Sources'}];

export function renderRecord(event, {context, mode, now, countryName, position = null}) { return ''; }
export function patchRecordStatus(root, event, now) {}
export function mountRecordChrome(dialog) { return {refresh() {}, destroy() {}}; }
