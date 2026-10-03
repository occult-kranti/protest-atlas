// Pilot disclosure, snapshot/error/dropped-param notice lines, example banner (WP2). Phase-0 stub; PILOT_DISCLOSURE is final (H1). DOM-free when loaded.

export const PILOT_DISCLOSURE = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';

export function noticeModel(state) { return {tone: 'info', counts: null, lines: []}; }
export function mountNotice(ctx) { return {render() {}}; }
