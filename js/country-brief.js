// World overview and country brief models plus HTML (WP4, lazy). Phase-0 stub; signatures per tech §4.6 + SPEC C-19 (no leads). DOM-free.

export function overviewModel({mapEvents, countries, mode}) { return {}; }
export function briefModel({code, mapEvents, allEvents, countries, coverage, research, mode}) { return {}; }
export function renderOverview(model, {now}) { return ''; }
export function renderBrief(model, {now, hasPolygon, lazy}) { return ''; }
