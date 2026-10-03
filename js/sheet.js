// <dialog> sheet behaviour (WP1). Phase-0 stub; signatures per tech §4.6 + SPEC C-01, C-25, C-42, C-47 (no detents).
// DOM-free when loaded: `document` defaults are evaluated only when a function is called.

export function initSheets(root = document) {}
export function openSheet(dialog, {trigger = null, focus = '[data-autofocus], h2[tabindex="-1"]', returnFocus = null} = {}) {}
export function closeSheet(dialog, reason = 'programmatic') {}
export function isOpen(dialog) { return false; }
export function initChromeMetrics(root = document) {}
export function sheetScroller(dialog) { return null; }
