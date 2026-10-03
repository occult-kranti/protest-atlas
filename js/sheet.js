// <dialog> sheet behaviour and chrome metrics (WP1). Tech §4.6 with SPEC C-01 (no detents), C-13, C-25, C-42, C-47.
// DOM-free when loaded: every `document`/`window` access happens inside a function call.

const DEFAULT_FOCUS = '[data-autofocus], h2[tabindex="-1"]';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), '
  + 'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** dialog -> {trigger, returnFocus, closing} for every sheet opened through openSheet. */
const sheets = new WeakMap();
/** document -> {destroy} so initSheets binds its listeners once per root. */
const bound = new WeakMap();
/** document -> chrome-metrics controller (initChromeMetrics is idempotent). */
const metrics = new WeakMap();

const docOf = node => node?.ownerDocument ?? (node?.nodeType === 9 ? node : null);
const viewOf = node => docOf(node)?.defaultView ?? null;
const isConnected = el => Boolean(el && el.isConnected !== false);
const displayed = el => Boolean(el && typeof el.getClientRects === 'function' && el.getClientRects().length > 0);

function emit(dialog, type, detail) {
  const Ctor = viewOf(dialog)?.CustomEvent ?? globalThis.CustomEvent;
  if (typeof Ctor === 'function' && typeof dialog.dispatchEvent === 'function') {
    dialog.dispatchEvent(new Ctor(type, {bubbles: true, detail}));
  }
}

function focusElement(el, {preventScroll = true, focusVisible} = {}) {
  if (!el || typeof el.focus !== 'function') return false;
  const options = focusVisible === undefined ? {preventScroll} : {preventScroll, focusVisible};
  el.focus(options);
  return docOf(el)?.activeElement === el;
}

function resolveTarget(dialog, focus) {
  if (focus && typeof focus === 'object' && typeof focus.focus === 'function') return focus;
  const tries = typeof focus === 'string' && focus ? [focus, DEFAULT_FOCUS] : [DEFAULT_FOCUS];
  for (const selector of tries) {
    let found = null;
    try { found = dialog.querySelector(selector); } catch { found = null; }
    if (found) return found;
  }
  return dialog.querySelector?.(FOCUSABLE) ?? dialog;
}

/** Element that scrolls the sheet: `.sheet-body`, or the dialog itself under `max-height: 500px` (C-42). */
export function sheetScroller(dialog) {
  if (!dialog) return null;
  const body = dialog.querySelector?.(':scope > .sheet-body') ?? null;
  if (!body) return dialog;
  const view = viewOf(dialog);
  const style = view?.getComputedStyle ? view.getComputedStyle(body) : null;
  if (style) return /(auto|scroll)/.test(`${style.overflowY} ${style.overflow}`) ? body : dialog;
  return view?.matchMedia?.('(max-height: 500px)').matches ? dialog : body;
}

export function isOpen(dialog) {
  return Boolean(dialog && dialog.open);
}

export function openSheet(dialog, {trigger = null, focus = DEFAULT_FOCUS, returnFocus = null} = {}) {
  if (!dialog) return;
  const doc = docOf(dialog);
  const active = doc?.activeElement;
  const known = sheets.get(dialog);
  if (!dialog.open) {
    const record = {
      trigger: trigger ?? (active && active !== doc?.body && !dialog.contains?.(active) ? active : null),
      returnFocus: typeof returnFocus === 'function' ? returnFocus : null,
      closing: false,
    };
    sheets.set(dialog, record);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.open = true;
    doc?.documentElement?.classList.add('sheet-open');
  } else if (known) {
    if (trigger) known.trigger = trigger;
    if (typeof returnFocus === 'function') known.returnFocus = returnFocus;
  }
  const target = resolveTarget(dialog, focus);
  const heading = target !== dialog && target.matches?.('h1, h2, h3, [tabindex="-1"]');
  if (target === dialog && !dialog.hasAttribute?.('tabindex')) dialog.setAttribute?.('tabindex', '-1');
  // Headings take programmatic focus without a ring (SPEC §8.1); a named control scrolls into view.
  focusElement(target, heading ? {preventScroll: true, focusVisible: false} : {preventScroll: false});
  emit(dialog, 'sheet:open', {reason: 'open', trigger: sheets.get(dialog)?.trigger ?? null});
}

function restoreFocus(dialog, record) {
  const doc = docOf(dialog);
  const candidates = [];
  try { candidates.push(record?.returnFocus?.()); } catch { /* returnFocus is advisory */ }
  candidates.push(record?.trigger, doc?.getElementById?.('main'));
  for (const el of candidates) {
    if (!el || el === doc?.body || !isConnected(el) || dialog.contains?.(el)) continue;
    if (el.id !== 'main' && !displayed(el)) continue;
    if (focusElement(el, {preventScroll: true})) return el;
  }
  return null;
}

function finishClose(dialog, reason) {
  const record = sheets.get(dialog) ?? {};
  sheets.delete(dialog);
  const doc = docOf(dialog);
  const anyOpen = doc?.querySelector?.('dialog.sheet[open]');
  if (!anyOpen) doc?.documentElement?.classList.remove('sheet-open');
  restoreFocus(dialog, record);
  emit(dialog, 'sheet:close', {reason});
}

/** reason: 'button' | 'escape' | 'backdrop' | 'link' | 'route' | 'programmatic' */
export function closeSheet(dialog, reason = 'programmatic') {
  if (!dialog || !dialog.open) return;
  const record = sheets.get(dialog) ?? {trigger: null, returnFocus: null};
  record.closing = true;
  sheets.set(dialog, record);
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.open = false;
  finishClose(dialog, reason);
}

function scrollTargetIntoView(target) {
  const dialog = target.closest?.('dialog');
  if (dialog && dialog.open) {
    const scroller = sheetScroller(dialog);
    const view = viewOf(dialog);
    const padTop = parseFloat(view?.getComputedStyle?.(scroller).scrollPaddingTop) || 0;
    const delta = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - (scroller.clientTop || 0);
    const top = Math.max(0, scroller.scrollTop + delta - padTop);
    if (typeof scroller.scrollTo === 'function') scroller.scrollTo({top, behavior: 'auto'});
    else scroller.scrollTop = top;
    return;
  }
  target.scrollIntoView?.({block: 'start', behavior: 'auto'});
}

/** Jump to an in-page id without touching the hash route; honours scroll-padding (WCAG 2.4.11). */
function scrollToId(id, root) {
  const doc = docOf(root) ?? root;
  const target = id ? doc.getElementById(id) : null;
  if (!target) return null;
  scrollTargetIntoView(target);
  if (!target.matches(FOCUSABLE) && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  focusElement(target, {preventScroll: true});
  return target;
}

export function initSheets(root = document) {
  const doc = docOf(root) ?? root;
  if (bound.has(root)) return bound.get(root);
  let downOutside = null;

  const outside = (dialog, x, y) => {
    const r = dialog.getBoundingClientRect();
    return x < r.left || x > r.right || y < r.top || y > r.bottom;
  };

  const onPointerDown = event => {
    const dialog = event.target;
    downOutside = dialog?.matches?.('dialog.sheet[open]') ? (outside(dialog, event.clientX, event.clientY) ? dialog : null) : null;
  };

  const onClick = event => {
    const target = event.target;
    if (!target?.closest) return;

    // Backdrop: a click whose press and release both fall outside the open sheet's box.
    if (target.matches?.('dialog.sheet[open]')) {
      const wasOutside = downOutside === target;
      downOutside = null;
      if (wasOutside && outside(target, event.clientX, event.clientY)) closeSheet(target, 'backdrop');
      return;
    }

    const opener = target.closest('[data-open-sheet]');
    if (opener) {
      if (opener.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
      const dialog = doc.getElementById(opener.getAttribute('data-open-sheet'));
      if (dialog) {
        event.preventDefault();
        openSheet(dialog, {trigger: opener, focus: opener.getAttribute('data-sheet-focus') || DEFAULT_FOCUS});
      }
      return;
    }

    const closer = target.closest('[data-close-sheet]');
    if (closer) {
      const named = closer.getAttribute('data-close-sheet');
      const dialog = (named && doc.getElementById(named)) || closer.closest('dialog');
      const isLink = closer.matches('a[href]');
      if (!isLink) event.preventDefault();
      // An <a href data-close-sheet> closes the sheet and lets its navigation run (C-47).
      if (dialog) closeSheet(dialog, isLink ? 'link' : 'button');
      return;
    }

    const jump = target.closest('[data-scroll-to]');
    if (jump) {
      event.preventDefault();
      scrollToId(jump.getAttribute('data-scroll-to'), doc);
    }
  };

  // cancel and close do not bubble, so they are caught in the capture phase.
  const onCancel = event => {
    const dialog = event.target;
    if (!dialog?.matches?.('dialog.sheet')) return;
    event.preventDefault();
    closeSheet(dialog, 'escape');
  };
  const onClose = event => {
    const dialog = event.target;
    if (!dialog?.matches?.('dialog.sheet')) return;
    const record = sheets.get(dialog);
    if (record && !record.closing) finishClose(dialog, 'programmatic');
  };

  // Keeps a focused control fully inside a sideways-scrolling row (quick chips, region chips, record tabs). Browsers only
  // scroll "if needed", and a partly visible chip counts as visible, so its centre could sit outside the row (WCAG 2.4.11).
  const onFocusIn = event => {
    const el = event.target;
    const view = doc.defaultView;
    if (!el?.getBoundingClientRect || el.closest?.('svg') || !view) return;
    for (let node = el.parentElement; node && node !== doc.body && node !== doc.documentElement; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      if (!/(auto|scroll)/.test(style.overflowX) || node.scrollWidth <= node.clientWidth + 1) continue;
      const r = el.getBoundingClientRect();
      const box = node.getBoundingClientRect();
      const left = box.left + node.clientLeft + (parseFloat(style.scrollPaddingLeft) || 0);
      const right = box.left + node.clientLeft + node.clientWidth - (parseFloat(style.scrollPaddingRight) || 0);
      const delta = r.left < left ? r.left - left : (r.right > right ? Math.min(r.right - right, r.left - left) : 0);
      if (Math.abs(delta) >= 1) node.scrollBy({left: delta, behavior: 'auto'});
      return;
    }
  };

  root.addEventListener('pointerdown', onPointerDown, true);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('click', onClick);
  root.addEventListener('cancel', onCancel, true);
  root.addEventListener('close', onClose, true);
  const api = {
    destroy() {
      root.removeEventListener('pointerdown', onPointerDown, true);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('click', onClick);
      root.removeEventListener('cancel', onCancel, true);
      root.removeEventListener('close', onClose, true);
      bound.delete(root);
    },
  };
  bound.set(root, api);
  return api;
}

/** Writes measured --header-h and --tabbar-h on :root for displayed elements only (C-25, C-44). */
export function initChromeMetrics(root = document) {
  const doc = docOf(root) ?? root;
  if (metrics.has(doc)) { metrics.get(doc).refresh(); return metrics.get(doc); }
  const view = doc.defaultView;
  const html = doc.documentElement;
  const header = doc.getElementById('site-header');
  const tabbar = doc.getElementById('tab-bar');
  const write = (name, el) => {
    if (!el || !displayed(el)) { html.style.removeProperty(name); return; }
    const height = Math.round(el.getBoundingClientRect().height * 100) / 100;
    const value = `${height}px`;
    if (html.style.getPropertyValue(name) !== value) html.style.setProperty(name, value);
  };
  let frame = 0;
  const refresh = () => { write('--header-h', header); write('--tabbar-h', tabbar); };
  const schedule = () => {
    if (frame || !view?.requestAnimationFrame) { if (!frame) refresh(); return; }
    frame = view.requestAnimationFrame(() => { frame = 0; refresh(); });
  };
  const observer = typeof view?.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  for (const el of [header, tabbar]) if (el && observer) observer.observe(el);
  view?.addEventListener?.('resize', schedule);
  view?.addEventListener?.('orientationchange', schedule);
  refresh();
  const api = {
    refresh,
    disconnect() {
      observer?.disconnect();
      view?.removeEventListener?.('resize', schedule);
      view?.removeEventListener?.('orientationchange', schedule);
      if (frame) view?.cancelAnimationFrame?.(frame);
      metrics.delete(doc);
    },
  };
  metrics.set(doc, api);
  return api;
}
