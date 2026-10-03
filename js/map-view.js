// Lazy map mount: regions, controls, legend, selection bar, failure and retry (WP4). Phase-0 stub.
// Loaded on demand by app.js (dynamic only), never part of the static graph. DOM-free when loaded.
// The two lines below are mandatory static edges (SPEC §19.0).
import '../map.js';
import './country-brief.js';

export function mountMap(ctx) { return {render() {}, ensure() { return Promise.resolve(); }}; }
