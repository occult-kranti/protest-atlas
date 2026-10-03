// Pure record derivations (WP3). Phase-0 stub; VERIFICATION_LABELS (C-14) and NOT_ESTABLISHED (§7.4) are final. DOM-free.

export const VERIFICATION_LABELS = {'single-source': 'Single source', corroborated: 'Corroborated', contested: 'Contested', illustrative: 'Illustrative'};
export const NOT_ESTABLISHED = {
  disruptionViolence: ['unknown', 'not established', 'not established by this record', 'disruption not established by this record', 'violence not established by this record'],
  turnout: ['not established', 'no reliable event-wide count established', 'no single verified numerical estimate adopted', 'no verified numerical estimate retained', 'reliable comparable count not established'],
};

export function positionView(p) { return {}; }
export function positionSentence(position) { return ''; }
export function positionList(event) { return []; }
export function stateActionSummary(event) { return {}; }
export function intensityFacets(event) { return []; }
export function intensitySummary(event) { return {}; }
export function timeframe(event, context, now) { return {}; }
export function evidenceLine(event) { return {}; }
export function primarySource(event) { return {}; }
