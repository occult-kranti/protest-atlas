#!/usr/bin/env node
// Local-only browser smoke for Protest Atlas 4.0 (SPEC §22.2, tech §10.4). CommonJS because NODE_PATH does not apply to ESM.
//   NODE_PATH=$(npm root -g) node tests/browser/smoke.cjs [--root _site] [--prefix /protest-atlas/] [--direction live|atlas]
//                                                          [--shots <dir>] [--only 1,2,13] [--skip 12] [--verbose]
// Starts its own static server, drives Chromium through every check and prints a JSON summary. Exit 1 on any failure.
// It never runs in CI (outside the tests/*.mjs and test_*.py globs).
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

let chromium;
try { ({chromium} = require('playwright')); } catch {
  console.error('Playwright is not resolvable. Run with NODE_PATH=$(npm root -g).');
  process.exit(2);
}

// ---------------------------------------------------------------------------------------------------------------
// Arguments and constants
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback; };
const flag = name => argv.includes(`--${name}`);
const REPO = path.resolve(__dirname, '..', '..');
const ROOT = path.resolve(arg('root', REPO));
const SERVING_REPO = ROOT === REPO;
let PREFIX = arg('prefix', '/');
if (!PREFIX.startsWith('/')) PREFIX = `/${PREFIX}`;
if (!PREFIX.endsWith('/')) PREFIX += '/';
const DIRECTION = arg('direction', 'live');
const SHOTS = arg('shots') ? path.resolve(arg('shots')) : null;
const ONLY = arg('only') ? new Set(arg('only').split(',').map(s => s.trim())) : null;
const SKIP = new Set((arg('skip') || '').split(',').map(s => s.trim()).filter(Boolean));
const VERBOSE = flag('verbose');
if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});

const CLOCK = '2026-10-02T23:00:00Z';
const STALE_CLOCK = '2026-10-09T12:00:00Z';
const BASELINE_COMMIT = '7f0b1d5';
const H1 = 'AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.';
const D1 = 'AI-assisted source check · no human editorial review';
const E5 = 'Published records could not be loaded, so coverage is unknown at the moment, not zero.';
const VIEWS = ['latest', 'map', 'ahead', 'countries', 'about'];
const ROUTES = ['#/latest', '#/map', '#/ahead', '#/ahead/roadmap', '#/countries', '#/about'];
const WORKED = {
  kr: 'kr-yoon-removal-protests-2024-2025', ng: 'ng-pengassan-20250928', nz: 'nz-wellington-treaty-hikoi-20241119',
  es: 'es-housing-20261002', as: 'as-noaa-seabed-mining-protest-20260902', tz: 'tz-drivers-20260929',
};

const VP = {
  '360': {viewport: {width: 360, height: 780}, isMobile: true, hasTouch: true, deviceScaleFactor: 2},
  '390': {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2},
  '768': {viewport: {width: 768, height: 1024}},
  '1024': {viewport: {width: 1024, height: 768}},
  '1440': {viewport: {width: 1440, height: 900}},
  '320': {viewport: {width: 320, height: 640}, isMobile: true, hasTouch: true, deviceScaleFactor: 2},
  '640x410': {viewport: {width: 640, height: 410}},
  '844x390': {viewport: {width: 844, height: 390}, isMobile: true, hasTouch: true, deviceScaleFactor: 2},
  '320x256': {viewport: {width: 320, height: 256}},
};
const MAIN_VPS = ['360', '390', '768', '1440'];
const SHORT_VPS = ['640x410', '844x390', '320x256'];

// Which package must land before a check can pass (SPEC §19 acceptance lists).
const OWNERS = {
  1: 'all', 2: 'WP2 (+WP1 notice/header)', 3: 'WP2 router', 4: 'WP2 + WP3 + WP1 sheets', 5: 'WP2', 6: 'WP4', 7: 'all (WP1 primitives)',
  8: 'WP5', 9: 'WP2 + WP3 + WP4', 10: 'WP1', 11: 'WP1', 12: 'all', 13: 'WP2', 14: 'all', 15: 'WP3', 16: 'WP3', 17: 'WP2 + WP3',
  18: 'WP2 + WP4', 19: 'WP2 + WP4 + WP5', 20: 'WP2 + WP5', 21: 'WP3 + WP5 + WP1 sheets', 22: 'WP2', 23: 'WP3',
};

// ---------------------------------------------------------------------------------------------------------------
// Static server (correct MIME types; emulates the Pages base path with --prefix)
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8'};

function startServer() {
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    if (!pathname.startsWith(PREFIX)) { res.writeHead(404, {'Content-Type': 'text/plain'}).end('not found'); return; }
    let rel = pathname.slice(PREFIX.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404, {'Content-Type': 'text/plain'}).end('not found'); return; }
      res.writeHead(200, {'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ---------------------------------------------------------------------------------------------------------------
// Data used by the checks (record ids, data-verbatim exception for the vocabulary scans)
const readJSON = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const EVENTS = readJSON('public/events.json');
const PUBLIC_STRINGS = (() => {
  const out = [];
  const walk = v => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  for (const f of fs.readdirSync(path.join(ROOT, 'public')).filter(n => n.endsWith('.json'))) {
    try { walk(readJSON(`public/${f}`)); } catch { /* unreadable file: no exception granted */ }
  }
  return out.join('\u0000');
})();

const BANNED = ['live', 'live now', 'happening now', 'right now', 'breaking', 'real-time', 'active protests', 'current protests',
  'ongoing now', 'hotspots?', 'trending', 'most active', 'escalating', 'unrest index', 'severity', 'danger', 'risk level',
  'top countries', 'top issues', 'sides', 'vs', 'as of', 'synced', 'join', 'attend', 'rsvp', 'remind me', 'add to calendar', 'live desk'];
const BANNED_SOURCES = [...BANNED.map(w => `(?<![\\w-])${w.replace(/ /g, '\\s+')}(?![\\w-])`), '\\btracking\\s+\\d+\\s+protests\\b', '\\b\\d+\\s+protests\\s+worldwide\\b'];
const ALLOWLIST = ['Sparse coverage, not a comprehensive live feed.', 'Sparse coverage; not a live feed.'];
const STANCE_TOTAL = '\\b\\d+\\s+(for|against|support|supports|oppose|opposes)\\b';

// ---------------------------------------------------------------------------------------------------------------
// Harness
const results = {};
let browser;
let BASE;

function record(id, status, details) {
  results[id] = {status, owner: OWNERS[id], details};
  const mark = status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : 'FAIL';
  console.error(`[${mark}] check ${id}${details && (status !== 'pass' || VERBOSE) ? ` — ${typeof details === 'string' ? details : JSON.stringify(details).slice(0, 1500)}` : ''}`);
}

class Failures {
  constructor() { this.list = []; this.notes = []; }
  ok(cond, message) { if (!cond) this.list.push(message); return Boolean(cond); }
  note(message) { this.notes.push(message); }
}

async function launch() {
  try { return await chromium.launch(); } catch (error) {
    const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
    if (fs.existsSync(fallback)) return chromium.launch({executablePath: fallback});
    throw error;
  }
}

/** Opens a page with the fixed clock, error capture and optional request blocking. */
async function open(vpKey, {hash = '#/latest', search = '', clock = CLOCK, install = false, colorScheme = 'light', reducedMotion = 'no-preference',
  block = [], wait = true, keepScrollBehavior = false, path: pagePath = '', permissions = []} = {}) {
  const ctx = await browser.newContext({...VP[vpKey], colorScheme, reducedMotion, permissions});
  const page = await ctx.newPage();
  const errors = [];
  const allowed = url => (SERVING_REPO && /\/public\/build-info\.json(\?|$)/.test(url)) || block.some(b => url.includes(b.pattern));
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url || '';
    if (/Failed to load resource/.test(m.text()) && allowed(url)) return;
    errors.push(`console: ${m.text()} ${url}`.trim());
  });
  page.on('requestfailed', r => { if (!allowed(r.url())) errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ''}`); });
  page.on('response', r => { if (r.status() >= 400 && !allowed(r.url())) errors.push(`http ${r.status()}: ${r.url()}`); });
  for (const b of block) await page.route(`**/*${b.pattern}*`, route => route.fulfill({status: b.status, contentType: 'text/plain', body: 'blocked by smoke'}));
  if (!keepScrollBehavior) {
    await ctx.addInitScript(() => {
      const apply = () => { const s = document.createElement('style'); s.dataset.smoke = ''; s.textContent = '*,*::before,*::after{scroll-behavior:auto!important}'; (document.head || document.documentElement).appendChild(s); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
    });
  }
  if (install) await page.clock.install({time: new Date(clock)});
  else await page.clock.setFixedTime(new Date(clock));
  const url = `${BASE}${pagePath}${search}${hash}`;
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  if (wait) await ready(page);
  return {ctx, page, errors, close: () => ctx.close()};
}

async function ready(page, timeout = 12000) {
  await page.waitForFunction(() => {
    const html = document.documentElement;
    const list = document.querySelector('#event-list');
    return html.dataset.loading === 'false' || (list && list.getAttribute('aria-busy') === 'false');
  }, null, {timeout}).catch(() => {});
  await page.waitForTimeout(250);
}

async function go(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  await page.waitForTimeout(400);
}

const shot = async (page, name) => { if (SHOTS) await page.screenshot({path: path.join(SHOTS, `${name}.png`)}); };

async function overflow(page) {
  return page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
}

async function chrome(page) {
  return page.evaluate(() => {
    const vis = el => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const header = document.querySelector('#site-header');
    const tab = document.querySelector('#tab-bar');
    return {headerBottom: vis(header) ? header.getBoundingClientRect().bottom : 0, tabH: vis(tab) ? tab.getBoundingClientRect().height : 0,
      innerHeight, innerWidth, scrollY};
  });
}

async function openRecord(page, id, search = '') {
  await page.evaluate(({id, search}) => {
    if (search && location.search !== search) history.replaceState(history.state, '', `${search}${location.hash}`);
    location.hash = `#/record/${id}`;
  }, {id, search});
  await page.waitForFunction(() => document.querySelector('#record-sheet')?.open && document.querySelector('#detail-title'), null, {timeout: 6000});
  await page.waitForTimeout(300);
}

/** Text-level scans over the whole DOM: banned vocabulary (§18.1) and stance totals (§18.1, editorial check 3). */
async function scanDOM(page, label) {
  return page.evaluate(({banned, allow, stance, publicStrings, label}) => {
    const hits = [];
    const res = banned.map(s => new RegExp(s, 'i'));
    const stanceRe = new RegExp(stance, 'i');
    const verbatim = text => text.length > 3 && publicStrings.includes(text);
    const check = (where, raw, {stanceScan = true} = {}) => {
      const trimmed = raw.replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      let text = trimmed;
      for (const a of allow) text = text.split(a).join(' ');
      for (const re of res) if (re.test(text) && !verbatim(trimmed) && !verbatim(raw.trim())) hits.push({label, kind: 'banned', where, text: trimmed.slice(0, 160), term: re.source});
      if (stanceScan && (stanceRe.test(text) || text.includes('%')) && !verbatim(trimmed) && !verbatim(raw.trim())) hits.push({label, kind: 'stance-total', where, text: trimmed.slice(0, 160)});
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent || parent.closest('script, style, noscript, #icon-sprite')) continue;
      check(`${parent.tagName.toLowerCase()}${parent.id ? `#${parent.id}` : ''}${parent.className && typeof parent.className === 'string' ? `.${parent.className.split(/\s+/)[0]}` : ''}`, n.nodeValue);
    }
    for (const el of document.querySelectorAll('[aria-label], [title], [alt], [placeholder]')) {
      for (const a of ['aria-label', 'title', 'alt', 'placeholder']) if (el.hasAttribute(a)) check(`${el.tagName.toLowerCase()}[${a}]`, el.getAttribute(a), {stanceScan: false});
    }
    for (const m of document.querySelectorAll('meta[name="description"], meta[property^="og:"]')) check('meta', m.content, {stanceScan: false});
    check('title', document.title, {stanceScan: false});
    for (const el of document.querySelectorAll('.badge, .chip, .band, .band-text, .status, button, .tab-bar a, [role="tab"]')) {
      if (/^new$/i.test(el.textContent.trim())) hits.push({label, kind: 'new-badge', where: el.className, text: 'New'});
    }
    for (const el of document.querySelectorAll('.stamp-chip, .feed-stat, .footer-stamps, .stamp-list dt, time')) {
      if (/^(updated|last updated|reviewed|verified)\b/i.test(el.textContent.trim())) hits.push({label, kind: 'stamp-word', where: el.className, text: el.textContent.trim().slice(0, 80)});
    }
    return hits;
  }, {banned: BANNED_SOURCES, allow: ALLOWLIST, stance: STANCE_TOTAL, publicStrings: PUBLIC_STRINGS, label});
}

/** Controls smaller than 44×44 within the first `screens` viewports (inline links inside running text are exempt). */
async function smallTargets(page, {scope = 'body', screens = 2} = {}) {
  return page.evaluate(({scope, screens}) => {
    const root = document.querySelector(scope);
    if (!root) return [];
    const out = [];
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex="0"]';
    for (const el of root.querySelectorAll(sel)) {
      if (el.closest('svg, [hidden], [inert]') || el.matches('.map-country')) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // A radio or checkbox inside its label is operated through the label row (SPEC §9: 48 px rows).
      const target = el.matches('input[type="radio"], input[type="checkbox"]') && el.closest('label') ? el.closest('label') : el;
      const r = target.getBoundingClientRect();
      if (el.getBoundingClientRect().width <= 2 || r.width <= 2 || r.height <= 2) continue;   // visually hidden (the label is the target)
      if (r.bottom <= 0 || r.top >= innerHeight * screens || r.right <= 0 || r.left >= innerWidth) continue;
      if (el.tagName === 'A' && style.display === 'inline') {
        const block = el.parentElement?.closest('p, li, dd, td, figcaption, label, small');
        if (block && block.textContent.trim().length > el.textContent.trim().length) continue;   // inline text link in running text
      }
      if (r.width < 43.5 || r.height < 43.5) {
        out.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).split(/\s+/)[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    return out;
  }, {scope, screens});
}

async function smallText(page) {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.nodeValue.trim() || el.closest('script, style, noscript, svg, [hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2 || el.getClientRects().length === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const size = parseFloat(style.fontSize);
      if (size < 11.95) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/)[0]} ${size}px "${n.nodeValue.trim().slice(0, 30)}"`);
    }
    return [...new Set(out)];
  });
}

/** Tabs through `count` focusables; reports any whose centre is covered by other chrome (WCAG 2.4.11). */
async function obscuredFocus(page, count = 40) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    await page.keyboard.press('Tab');
    const res = await page.evaluate(() => {
      let el = document.activeElement;
      if (!el || el === document.body) return null;
      if (el.closest('svg')) return {skip: 'svg'};
      const box = node => (getComputedStyle(node).display === 'inline' && node.getClientRects().length ? node.getClientRects()[0] : node.getBoundingClientRect());
      let r = box(el);
      if (r.width <= 2 || r.height <= 2) { const label = el.closest('label') || (el.id && document.querySelector(`label[for="${el.id}"]`)); if (label) { el = label; r = box(el); } }
      if (r.width <= 2 || r.height <= 2) return {skip: 'hidden'};
      // Probe the centre of the part that lies inside the viewport (horizontal scrollers may clip the rest).
      const left = Math.max(r.left, 0); const right = Math.min(r.right, innerWidth); const top = Math.max(r.top, 0); const bottom = Math.min(r.bottom, innerHeight);
      if (right - left < 4 || bottom - top < 4) return {id: el.id || el.className || el.tagName, offscreen: true, top: Math.round(r.top), left: Math.round(r.left)};
      const x = (left + right) / 2;
      const y = Math.min((top + bottom) / 2, top + 20);
      const hit = document.elementFromPoint(x, y);
      const ok = hit && (hit === el || el.contains(hit) || hit.closest('label') === el);
      return ok ? {ok: true} : {id: el.id || el.className || el.tagName, by: hit ? `${hit.tagName.toLowerCase()}#${hit.id}.${String(hit.className).split(/\s+/)[0]}` : 'nothing', top: Math.round(r.top)};
    });
    if (res && !res.ok && !res.skip) out.push(res);
  }
  return out;
}

async function fixedCoverage(page) {
  return page.evaluate(() => {
    const spans = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (s.position !== 'fixed' && s.position !== 'sticky') continue;
      if (el.closest('dialog') || el.getClientRects().length === 0 || s.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom <= 0 || r.top >= innerHeight) continue;
      if (s.position === 'sticky') {
        const top = parseFloat(s.top);
        if (!Number.isFinite(top) || Math.abs(r.top - top) > 1.5) continue;   // not stuck: part of the content flow
      }
      spans.push([Math.max(0, r.top), Math.min(innerHeight, r.bottom)]);
    }
    spans.sort((a, b) => a[0] - b[0]);
    let total = 0; let end = -1;
    for (const [a, b] of spans) { if (b <= end) continue; total += b - Math.max(a, end); end = b; }
    return {covered: total, ratio: total / innerHeight};
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Checks
const CHECKS = {};

// 1. Errors and horizontal overflow at every viewport (+ short viewports, 320 overflow-only).
CHECKS[1] = async f => {
  for (const vp of [...MAIN_VPS, '320', ...SHORT_VPS]) {
    const {page, errors, close} = await open(vp);
    for (const route of ROUTES) {
      await go(page, route);
      const o = await overflow(page);
      f.ok(o <= 0, `${vp} ${route}: horizontal overflow ${o}px`);
    }
    f.ok(errors.length === 0, `${vp}: errors ${JSON.stringify(errors.slice(0, 5))}`);
    await close();
  }
};

// 2. H1 on every route, D1 in the record, state-aware chip, H1 visible after tab/nav taps, scroll reset/restore.
CHECKS[2] = async f => {
  for (const vp of ['390', '1440']) {
    const {page, close} = await open(vp);
    const state = await page.evaluate(() => document.querySelector('#stamp-chip')?.dataset.state);
    const chipText = await page.textContent('#stamp-chip');
    if (state === 'current' || state === 'unknown') f.ok(/\d{2}:\d{2} UTC/.test(await page.textContent('#stamp-chip time').catch(() => '')), `${vp}: chip time hh:mm UTC`);
    else if (vp === '1440') f.ok(/newest evidence \d+ days old/.test(chipText), `${vp}: chip long form (${chipText})`);
    for (const route of ROUTES) {
      const view = route.split('/')[1];
      const sel = vp === '390' ? `#tab-bar a[data-nav="${view}"]` : `#primary-nav a[data-nav="${route.slice(2)}"]`;
      if (route === '#/ahead/roadmap' && vp === '390') await go(page, route);
      else await page.click(sel);
      await page.waitForTimeout(450);
      f.ok((await page.textContent('#data-notice')).replace(/\s+/g, ' ').includes(H1), `${vp} ${route}: H1 in #data-notice`);
      const box = await page.evaluate(() => { const r = document.querySelector('.notice-pilot').getBoundingClientRect(); return {top: r.top, bottom: r.bottom}; });
      const c = await chrome(page);
      f.ok(box.top >= c.headerBottom - 1 && box.bottom <= c.innerHeight - c.tabH + 1, `${vp} ${route}: H1 box ${JSON.stringify(box)} not inside [${c.headerBottom}, ${c.innerHeight - c.tabH}]`);
    }
    await openRecord(page, WORKED.tz);
    f.ok((await page.textContent('#record-body')).includes(D1), `${vp}: D1 in the record`);
    await close();
  }
  // Scroll reset (C-35) and Back restore at 390.
  const {page, close} = await open('390');
  await page.evaluate(() => scrollTo(0, 3000));
  await page.waitForTimeout(250);
  const before = await page.evaluate(() => scrollY);
  await page.click('#tab-bar a[data-nav="map"]');
  await page.waitForTimeout(600);
  const c = await chrome(page);
  const box = await page.evaluate(() => document.querySelector('.notice-pilot').getBoundingClientRect().toJSON());
  f.ok(box.top >= c.headerBottom - 1 && box.bottom <= c.innerHeight - c.tabH + 1, `scroll reset: H1 box after the Map tab ${JSON.stringify(box)}`);
  f.ok(await page.evaluate(() => document.activeElement?.id === 'map-title'), 'scroll reset: focus on #map-title');
  await page.goBack();
  await page.waitForTimeout(800);
  const restored = await page.evaluate(() => scrollY);
  f.ok(Math.abs(restored - before) <= 50, `Back restores scrollY (${restored} vs ${before})`);
  await page.click('#tab-bar a[data-nav="latest"]');
  await page.waitForTimeout(500);
  f.ok(await page.evaluate(() => scrollY) <= 1, 'tapping the current tab scrolls to the top');
  await close();
};

// 3. Routes, aria-current, aliases and the most-specific nav match.
CHECKS[3] = async f => {
  const {page, close} = await open('1440');
  for (const view of VIEWS) {
    await go(page, `#/${view}`);
    f.ok(await page.isVisible(`h1#${view}-title`), `#/${view}: h1#${view}-title visible`);
    f.ok(await page.evaluate(v => document.querySelector(`#primary-nav a[data-nav="${v}"]`)?.getAttribute('aria-current') === 'page', view), `#/${view}: primary nav aria-current`);
    f.ok(await page.evaluate(v => document.querySelector(`#tab-bar a[data-nav="${v}"]`)?.getAttribute('aria-current') === 'page', view), `#/${view}: tab aria-current`);
  }
  for (const [hash, view] of [['#methodology', 'about'], ['#/reports', 'latest'], ['#atlas', 'map'], ['#countries', 'countries']]) {
    await go(page, hash);
    f.ok(await page.evaluate(() => document.documentElement.dataset.view) === view, `${hash} → ${view}`);
  }
  await page.evaluate(() => { location.hash = '#/coming-next'; });
  await page.waitForTimeout(600);
  f.ok(await page.evaluate(() => document.documentElement.dataset.view === 'ahead' && location.hash === '#/ahead/roadmap'), '#/coming-next → #/ahead/roadmap');
  f.ok(await page.evaluate(() => document.activeElement?.id === 'ahead-roadmap-title'), '#/coming-next focuses #ahead-roadmap-title');
  const current = await page.$$eval('#primary-nav a[aria-current="page"]', as => as.map(a => a.textContent.trim()));
  f.ok(current.length === 1 && current[0] === 'Coming next', `1440 roadmap: one aria-current in #primary-nav (${current})`);
  await close();
  const narrow = await open('1024', {hash: '#/ahead/roadmap'});
  const cur = await narrow.page.$$eval('#primary-nav a[aria-current="page"]', as => as.map(a => a.textContent.trim()));
  f.ok(cur.length === 1 && cur[0] === 'Ahead', `1024 roadmap: "Ahead" carries aria-current (${cur})`);
  await narrow.close();
};

// 4. Record sheet regression (tech 4.1–4.5) + 4.6 share feedback + 4.7 stepping.
CHECKS[4] = async f => {
  const {page, close} = await open('390');
  const sheetOpen = () => page.evaluate(() => Boolean(document.querySelector('#record-sheet')?.open));
  await page.click('.card-link');
  await page.waitForTimeout(500);
  f.ok(await sheetOpen(), '4.1 the first card opens the record');
  await page.click('#record-close');
  await page.waitForTimeout(400);
  f.ok(!(await sheetOpen()), '4.1 Close closes it');
  await page.click('[data-open-sheet="filters-sheet"]');
  await page.waitForTimeout(400);
  await page.click('#window-filter label:has(input[value="30"])');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('.card-link');
  await page.waitForTimeout(400);
  await page.click('#record-close');
  await page.waitForTimeout(400);
  f.ok(!(await sheetOpen()), '4.2 closed after a filter change');
  const trigger = await page.$('.card-link');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  f.ok(!(await sheetOpen()), '4.3 Escape closes');
  f.ok(await page.evaluate(() => document.activeElement?.classList.contains('card-link')), '4.3 focus returns to the trigger');
  const hashBefore = await page.evaluate(() => location.hash);
  await page.click('.card-link');
  await page.waitForTimeout(400);
  await page.goBack();
  await page.waitForTimeout(500);
  f.ok(!(await sheetOpen()) && (await page.evaluate(() => location.hash)) === hashBefore, '4.4 Back closes the sheet and restores the hash');
  await page.click('.card-link');
  await page.waitForTimeout(400);
  const ref = await page.$('#record-body .source-ref');
  if (ref) {
    await ref.click();
    await page.waitForTimeout(300);
    f.ok(/^#\/record\//.test(await page.evaluate(() => location.hash)), '4.5 a .source-ref click keeps #/record/…');
  } else f.ok(false, '4.5 no .source-ref in the record');
  await close();

  // 4.6 Share feedback inside the sheet: no navigator.share, clipboard refused.
  const s = await open('390');
  await s.page.evaluate(() => {
    try { Object.defineProperty(navigator, 'share', {value: undefined, configurable: true}); } catch {}
    try { Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('denied'))}, configurable: true}); } catch {}
  });
  await openRecord(s.page, WORKED.tz);
  await s.page.click('#record-share');
  await s.page.waitForTimeout(500);
  const fb = await s.page.evaluate(() => {
    const el = document.querySelector('#record-feedback');
    if (!el || el.hidden) return {visible: false};
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const input = el.querySelector('.toast-url');
    return {visible: true, onTop: el.contains(hit), value: input?.value ?? '', focused: document.activeElement === input,
      selected: input ? input.selectionStart === 0 && input.selectionEnd === input.value.length : false};
  });
  f.ok(fb.visible && fb.onTop, `4.6 #record-feedback visible on top (${JSON.stringify(fb)})`);
  f.ok(fb.value.includes(`#/record/${WORKED.tz}`), '4.6 .toast-url holds the record URL');
  f.ok(fb.focused && fb.selected, '4.6 .toast-url focused and fully selected');
  await s.page.waitForTimeout(5000);
  f.ok(await s.page.evaluate(() => !document.querySelector('#record-feedback').hidden), '4.6 still visible after 5 s');
  await s.page.click('#record-feedback .toast-close').catch(() => f.ok(false, '4.6 no .toast-close'));
  await s.page.waitForTimeout(300);
  f.ok(await s.page.evaluate(() => document.querySelector('#record-feedback').hidden && document.activeElement?.id === 'record-share'), '4.6 Close hides it and focus returns to #record-share');
  await s.page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.resolve()}, configurable: true}));
  await s.page.click('#record-share');
  await s.page.waitForTimeout(400);
  f.ok((await s.page.textContent('#record-feedback')).includes('Link copied.'), '4.6 "Link copied." inside the sheet');
  f.ok(((await s.page.textContent('#action-feedback')) || '').trim() === '', '4.6 #action-feedback stays empty');
  await s.close();

  // 4.7 Stepping at the ends, scroll reset and the announcer; outside the filtered list.
  const t = await open('390', {search: '?country=FR'});
  const ids = await t.page.$$eval('.card[data-id]', cs => cs.map(c => c.dataset.id));
  if (ids.length >= 2) {
    await openRecord(t.page, ids.at(-1), '?country=FR');
    f.ok(await t.page.getAttribute('#record-next', 'aria-disabled') === 'true', '4.7 last record: #record-next aria-disabled');
    await t.page.focus('#record-next');
    await t.page.keyboard.press('Enter');
    await t.page.waitForTimeout(300);
    f.ok(await t.page.evaluate(() => document.activeElement?.id === 'record-next'), '4.7 focus stays on the disabled button');
    await t.page.evaluate(() => { const b = document.querySelector('#record-body'); if (b) b.scrollTop = 400; });
    await t.page.click('#record-prev');
    await t.page.waitForTimeout(400);
    const step = await t.page.evaluate(() => ({top: (document.querySelector('#record-body').scrollHeight > document.querySelector('#record-body').clientHeight ? document.querySelector('#record-body').scrollTop : 0) + (getComputedStyle(document.querySelector('#record-body')).overflowY === 'visible' ? document.querySelector('#record-sheet').scrollTop : 0),
      announcer: document.querySelector('#record-announcer')?.textContent ?? '', title: document.querySelector('#detail-title')?.textContent ?? ''}));
    f.ok(step.top === 0, `4.7 the scroller is at 0 after a step (${step.top})`);
    f.ok(step.title && step.announcer.includes(step.title.trim()), `4.7 #record-announcer names the new title (${step.announcer})`);
  } else f.ok(false, `4.7 ?country=FR lists ${ids.length} cards`);
  await openRecord(t.page, WORKED.tz, '?country=FR');
  const outside = await t.page.evaluate(() => ({eyebrow: document.querySelector('#record-eyebrow').textContent.trim(),
    prev: document.querySelector('#record-prev').hidden, next: document.querySelector('#record-next').hidden}));
  f.ok(outside.eyebrow === 'Record' && outside.prev && outside.next, `4.7 a record outside the filters: eyebrow "Record", no prev/next (${JSON.stringify(outside)})`);
  await t.close();
};

// 5. Permalinks.
CHECKS[5] = async f => {
  const a = await open('390', {search: '?country=FR&window=30'});
  f.ok(await a.page.evaluate(() => document.querySelector('#country-filter')?.value) === 'FR', '?country=FR restores #country-filter');
  f.ok(await a.page.evaluate(() => document.querySelector('#window-filter input[value="30"]')?.checked), '?window=30 checks the radio');
  await a.page.click('#tab-bar a[data-nav="map"]');
  await a.page.waitForTimeout(400);
  f.ok(await a.page.evaluate(() => location.search.includes('country=FR') && location.search.includes('window=30')), 'the query survives view changes');
  await a.close();
  const b = await open('390', {search: '?status=live&year=1999'});
  f.ok(/were not recognised and were removed/.test(await b.page.textContent('#data-notice')), 'dropped-params line');
  await b.close();
  const c = await open('390', {search: '?status=ongoing'});
  f.ok(/currently labelled 'Reported ongoing'/.test(await c.page.textContent('#event-list')), '?status=ongoing shows E7');
  await c.close();
};

// 6. Map (tech 6 + C-40/C-41).
CHECKS[6] = async f => {
  for (const vp of ['390', '1440']) {
    const {page, close, errors} = await open(vp, {hash: '#/map'});
    await page.waitForSelector('#world-map svg .map-country', {timeout: 8000}).catch(() => {});
    const info = await page.evaluate(() => {
      const svg = document.querySelector('#world-map svg');
      const paths = [...document.querySelectorAll('.map-country')];
      const rects = paths.map(p => p.getBoundingClientRect()).filter(r => r.width > 0);
      const u = rects.reduce((a, r) => ({l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom)}), {l: 1e9, t: 1e9, r: -1e9, b: -1e9});
      const sb = svg?.getBoundingClientRect();
      return {count: paths.length, viewBox: svg?.getAttribute('viewBox'), touch: svg ? getComputedStyle(svg).touchAction : '',
        land: (u.r - u.l) / (u.b - u.t), landW: (u.r - u.l) / (sb?.width || 1), svgAspect: sb ? sb.width / sb.height : 0,
        zoomOut: document.querySelector('#zoom-out')?.disabled || document.querySelector('#zoom-out')?.getAttribute('aria-disabled') === 'true',
        roving: document.querySelectorAll('.map-countries [tabindex="0"], .map-country[tabindex="0"]').length};
    });
    f.ok(info.count === 177, `${vp}: 177 .map-country (${info.count})`);
    f.ok(info.viewBox === '0 0 1000 448', `${vp}: viewBox ${info.viewBox}`);
    f.ok(info.touch.includes('pan-y'), `${vp}: touch-action ${info.touch}`);
    f.ok(Math.abs(info.land / (984 / 432) - 1) <= 0.02, `${vp}: land aspect ${info.land.toFixed(3)} vs 2.278`);
    f.ok(Math.abs(info.landW - 0.984) <= 0.01, `${vp}: land width ratio ${info.landW.toFixed(3)}`);
    if (vp === '1440') f.ok(Math.abs(info.svgAspect / (1000 / 448) - 1) <= 0.02, `1440: svg aspect ${info.svgAspect.toFixed(3)}`);
    f.ok(info.zoomOut, `${vp}: #zoom-out disabled at 1×`);
    f.ok(info.roving <= 1, `${vp}: at most one tabindex=0 (${info.roving})`);
    await page.click('#zoom-in').catch(() => {});
    await page.waitForTimeout(500);
    f.ok(await page.evaluate(() => !(document.querySelector('#zoom-out')?.disabled || document.querySelector('#zoom-out')?.getAttribute('aria-disabled') === 'true')), `${vp}: Zoom in enables Zoom out`);
    const y0 = await page.evaluate(() => scrollY);
    const stage = await page.$('#map-stage');
    if (stage) {
      const b = await stage.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(400);
      if (vp === '390') f.ok(await page.evaluate(() => scrollY) > y0, `${vp}: wheel over the map scrolls the page`);
    }
    f.ok(!errors.some(e => /world-countries\.geo\.json/.test(e)), `${vp}: no GeoJSON request`);
    await close();
  }
  const fr = await open('1440', {hash: '#/map', search: '?country=FR'});
  const geo = [];
  fr.page.on('request', r => { if (/world-countries\.geo\.json/.test(r.url())) geo.push(r.url()); });
  await fr.page.waitForSelector('.map-selection', {timeout: 8000}).catch(() => {});
  await fr.page.waitForTimeout(1200);
  const sel = await fr.page.evaluate(() => {
    const svg = document.querySelector('#world-map svg');
    const p = document.querySelector('.map-country[data-country="FR"]');
    const sb = svg?.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    // The FR feature includes overseas departments, so the check is that mainland France is framed: the stage centre hits FR.
    const hit = sb ? document.elementFromPoint(sb.left + sb.width / 2, sb.top + sb.height / 2) : null;
    return {zoom: Number(svg?.getAttribute('data-zoom') || 0), inside: Boolean(hit && hit === p),
      selection: Boolean(document.querySelector('path.map-selection')), fill: p ? getComputedStyle(p).fill : '', reported: root.getPropertyValue('--map-reported').trim()};
  });
  f.ok(sel.zoom >= 4, `FR: data-zoom ${sel.zoom}`);
  f.ok(sel.inside, 'FR: mainland France is framed (the stage centre lies on the FR path)');
  f.ok(sel.selection, 'FR: path.map-selection exists');
  await fr.page.focus('.map-country[tabindex="0"]').catch(() => f.ok(false, 'no .map-country[tabindex="0"] to focus'));
  await fr.page.waitForTimeout(200);
  const ring = await fr.page.evaluate(() => {
    const overlay = document.querySelector('g.map-overlay');
    return {last: overlay?.lastElementChild?.classList.contains('map-focus-ring'), overlayLast: overlay?.parentElement?.lastElementChild === overlay,
      afterSelection: (() => { const kids = [...(overlay?.children || [])]; return kids.findIndex(k => k.classList.contains('map-focus-ring')) > kids.findIndex(k => k.classList.contains('map-selection')); })()};
  });
  f.ok(ring.last && ring.overlayLast && ring.afterSelection, `focus ring is the overlay's last child (${JSON.stringify(ring)})`);
  const before = await fr.page.evaluate(() => document.activeElement?.getAttribute('data-country'));
  await fr.page.keyboard.press('ArrowRight');
  await fr.page.waitForTimeout(300);
  const after = await fr.page.evaluate(() => document.activeElement?.getAttribute('data-country'));
  f.ok(before && after && after !== before, `ArrowRight moves focus (${before} → ${after})`);
  f.ok(geo.length === 0, 'no request for world-countries.geo.json');
  await fr.close();
};

// 7. Targets, text size, DOM size, obscured focus; short viewports: chrome coverage and full-viewport sheets.
CHECKS[7] = async f => {
  const {page, close} = await open('390');
  f.ok(await page.evaluate(() => document.getElementsByTagName('*').length) <= 1500, `first #/latest DOM ${await page.evaluate(() => document.getElementsByTagName('*').length)} > 1500 nodes`);
  for (const route of ROUTES) {
    await go(page, route);
    await page.evaluate(() => scrollTo(0, 0));
    const small = await smallTargets(page);
    f.ok(small.length === 0, `390 ${route}: targets < 44 px: ${small.slice(0, 8).join('; ')}`);
    const text = await smallText(page);
    f.ok(text.length === 0, `390 ${route}: text < 12 px: ${text.slice(0, 6).join('; ')}`);
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur(); });
    const hidden = await obscuredFocus(page, 40);
    f.ok(hidden.length === 0, `390 ${route}: obscured focus ${JSON.stringify(hidden.slice(0, 4))}`);
  }
  await openRecord(page, WORKED.tz);
  const inRecord = await smallTargets(page, {scope: '#record-sheet', screens: 3});
  f.ok(inRecord.length === 0, `record sheet targets < 44 px: ${inRecord.slice(0, 8).join('; ')}`);
  const recFocus = await obscuredFocus(page, 40);
  f.ok(recFocus.length === 0, `record sheet obscured focus ${JSON.stringify(recFocus.slice(0, 4))}`);
  await page.click('#record-close');
  await page.waitForTimeout(300);
  await go(page, '#/latest');
  await page.click('[data-open-sheet="filters-sheet"]');
  await page.waitForTimeout(400);
  const inFilters = await smallTargets(page, {scope: '#filters-sheet', screens: 3});
  f.ok(inFilters.length === 0, `filter sheet targets < 44 px: ${inFilters.slice(0, 8).join('; ')}`);
  const filFocus = await obscuredFocus(page, 40);
  f.ok(filFocus.length === 0, `filter sheet obscured focus ${JSON.stringify(filFocus.slice(0, 4))}`);
  await close();

  for (const vp of SHORT_VPS) {
    const s = await open(vp);
    for (const route of ROUTES) {
      await go(s.page, route);
      await s.page.evaluate(() => scrollTo(0, 400));
      await s.page.waitForTimeout(200);
      const cov = await fixedCoverage(s.page);
      f.ok(cov.ratio <= 0.45, `${vp} ${route}: fixed/sticky chrome covers ${(cov.ratio * 100).toFixed(0)}% after scrolling`);
      f.ok((await overflow(s.page)) <= 0, `${vp} ${route}: horizontal overflow`);
      await s.page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur(); });
      const hidden = await obscuredFocus(s.page, 25);
      f.ok(hidden.length === 0, `${vp} ${route}: obscured focus ${JSON.stringify(hidden.slice(0, 3))}`);
    }
    await go(s.page, '#/latest');
    for (const which of ['record', 'filters']) {
      if (which === 'record') await openRecord(s.page, WORKED.tz);
      else { await s.page.click('[data-open-sheet="filters-sheet"]'); await s.page.waitForTimeout(400); }
      const fill = await s.page.evaluate(id => {
        const d = document.querySelector(id); const r = d.getBoundingClientRect();
        return {fills: Math.abs(r.top) <= 1 && Math.abs(r.left) <= 1 && Math.abs(r.width - innerWidth) <= 1 && Math.abs(r.height - innerHeight) <= 1,
          scrolls: getComputedStyle(d).overflowY, rect: [r.left, r.top, r.width, r.height].map(Math.round)};
      }, which === 'record' ? '#record-sheet' : '#filters-sheet');
      f.ok(fill.fills && /auto|scroll/.test(fill.scrolls), `${vp}: the ${which} sheet fills the viewport and scrolls as one (${JSON.stringify(fill)})`);
      await shot(s.page, `short-${which}-${vp}`);
      await s.page.keyboard.press('Escape');
      await s.page.waitForTimeout(300);
    }
    await s.close();
  }
};

// 8. Ahead and roadmap.
CHECKS[8] = async f => {
  const {page, close} = await open('390', {hash: '#/ahead'});
  await page.waitForTimeout(500);
  const text = (await page.textContent('#view-ahead')).replace(/\s+/g, ' ');
  if (!(EVENTS && readJSON('public/upcoming.json').items?.length)) {
    f.ok(text.includes('No announced actions are listed yet'), 'A3 empty-state title');
    f.ok(text.includes('This list includes an announced action only after the article announcing it has been opened and read.'), 'A4');
    f.ok(/On \d{1,2} [A-Z][a-z]{2} \d{4}, our search for announced and recent protest actions could not open news websites/.test(text) || text.includes('An empty list does not mean nothing is planned.'), 'A5');
  }
  f.ok(await page.isVisible('.ahead-switch'), 'the Ahead switch is shown');
  await go(page, '#/ahead/roadmap');
  await page.waitForSelector('.roadmap-item', {timeout: 8000}).catch(() => {});
  const items = await page.$$eval('.roadmap-item', els => els.map(e => ({id: e.id, status: e.dataset.status, links: e.querySelectorAll('a[href]').length})));
  f.ok(items.length > 0, 'roadmap items render');
  for (const item of items.filter(i => i.status === 'shipped')) f.ok(item.links >= 1, `shipped ${item.id} has an evidence link`);
  await go(page, '#/ahead/actions');
  const jump = await page.$('[data-ahead-target="roadmap-item-list-announced-actions"]');
  if (jump) {
    await jump.click();
    await page.waitForTimeout(900);
    const land = await page.evaluate(() => {
      const t = document.querySelector('#roadmap-item-list-announced-actions'); const sw = document.querySelector('.ahead-switch');
      return {focused: document.activeElement === t, top: t?.getBoundingClientRect().top, switchBottom: sw?.getBoundingClientRect().bottom};
    });
    f.ok(land.focused && land.top >= land.switchBottom - 1, `"What's blocking this" lands below the switch with focus (${JSON.stringify(land)})`);
  } else f.ok(false, 'no [data-ahead-target] jump');
  await close();
};

// 9. Example mode.
CHECKS[9] = async f => {
  const {page, close} = await open('390', {hash: '#/about'});
  await page.evaluate(() => {
    try { Object.defineProperty(navigator, 'share', {value: undefined, configurable: true}); } catch {}
    Object.defineProperty(navigator, 'clipboard', {value: {writeText: t => { window.__copied = t; return Promise.resolve(); }}, configurable: true});
  });
  await page.click('#about-example');
  await page.waitForTimeout(1200);
  f.ok(await page.evaluate(() => location.hash) === '#/latest', '#about-example goes to #/latest');
  f.ok(await page.isVisible('.card-watermark'), 'card watermark');
  f.ok(await page.evaluate(() => document.querySelector('.feed-actions [data-action="export-csv"]')?.getAttribute('aria-disabled') === 'true'), 'Reports CSV aria-disabled');
  f.ok(await page.evaluate(() => document.querySelector('#view-about [data-action="export-csv"]')?.getAttribute('aria-disabled') === 'true'), 'About CSV aria-disabled');
  await page.click('.feed-actions [data-action="export-csv"]', {force: true});   // aria-disabled stays operable (C-43)
  await page.waitForTimeout(300);
  f.ok(/excluded/.test(await page.textContent('#action-feedback')), 'CSV refusal mentions "excluded"');
  await page.click('.feed-actions [data-action="share-view"]', {force: true});
  await page.waitForTimeout(300);
  f.ok((await page.textContent('#action-feedback')).includes('Sharing is off in example mode.'), 'share refusal');
  await page.click('.card-link');
  await page.waitForTimeout(500);
  f.ok(/Illustrative example • not a real event/.test(await page.textContent('#record-sheet')), 'record watermark');
  await page.keyboard.press('Escape');
  await page.click('#tab-bar a[data-nav="map"]');
  await page.waitForSelector('.map-watermark', {timeout: 8000}).catch(() => {});
  f.ok(await page.isVisible('.map-watermark'), 'map watermark');
  await close();
  const r = await open('390', {search: '?country=FR&window=30'});
  await r.page.evaluate(() => {
    try { Object.defineProperty(navigator, 'share', {value: undefined, configurable: true}); } catch {}
    Object.defineProperty(navigator, 'clipboard', {value: {writeText: t => { window.__copied = t; return Promise.resolve(); }}, configurable: true});
  });
  await r.page.click('.feed-actions [data-action="share-view"]');
  await r.page.waitForTimeout(400);
  const copied = await r.page.evaluate(() => window.__copied || '');
  f.ok(/country=FR/.test(copied) && /window=30/.test(copied), `Copy link to this view copies the filters (${copied})`);
  await r.close();
};

// 10. review.html against the 3.1 baseline (styles.css from the baseline commit through page.route).
CHECKS[10] = async f => {
  let baselineCSS;
  try { baselineCSS = execFileSync('git', ['-C', REPO, 'show', `${BASELINE_COMMIT}:styles.css`], {encoding: 'utf8'}); } catch (e) { f.ok(false, `git show ${BASELINE_COMMIT}:styles.css failed`); return; }
  const boxes = async (vp, baseline) => {
    const ctx = await browser.newContext({...VP[vp]});
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (baseline) await page.route('**/styles.css*', route => route.fulfill({status: 200, contentType: 'text/css', body: baselineCSS}));
    await page.goto(`${BASE}review.html`);
    await page.waitForFunction(() => !document.querySelector('#candidate-file').disabled, null, {timeout: 8000}).catch(() => {});
    const out = await page.evaluate(() => ({
      boxes: Object.fromEntries(['.site-header', '.brand', '.brand-mark', '.site-header nav', '.edition'].map(s => {
        const r = document.querySelector(s)?.getBoundingClientRect(); return [s, r ? [r.x, r.y, r.width, r.height].map(Math.round) : null];
      })),
      overflow: document.documentElement.scrollWidth - innerWidth, enabled: !document.querySelector('#candidate-file').disabled}));
    await shot(page, `review-${baseline ? 'baseline' : 'current'}-${vp}`);
    await ctx.close();
    return {...out, errors};
  };
  for (const vp of ['390', '1440']) {
    const base = await boxes(vp, true);
    const now = await boxes(vp, false);
    f.ok(now.errors.length === 0, `${vp}: review errors ${now.errors}`);
    f.ok(now.overflow <= 0, `${vp}: review overflow ${now.overflow}`);
    f.ok(now.enabled, `${vp}: #candidate-file enabled after load`);
    for (const [sel, b] of Object.entries(base.boxes)) {
      const n = now.boxes[sel];
      f.ok(Boolean(b) === Boolean(n) && (!b || b.every((v, i) => Math.abs(v - n[i]) <= 4)), `${vp}: ${sel} ${JSON.stringify(n)} vs baseline ${JSON.stringify(b)}`);
    }
  }
};

// 11. Dark mode and reduced motion.
CHECKS[11] = async f => {
  const light = await open('390');
  const lightBg = await light.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await light.close();
  const dark = await open('390', {colorScheme: 'dark'});
  const darkInfo = await dark.page.evaluate(() => ({bg: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color}));
  f.ok(darkInfo.bg !== lightBg, `dark body background differs (${darkInfo.bg} vs ${lightBg})`);
  await dark.close();
  const rm = await open('390', {reducedMotion: 'reduce', keepScrollBehavior: true});
  const motion = await rm.page.evaluate(() => {
    const probe = document.querySelector('.btn, .chip, .stamp-chip');
    return {scroll: getComputedStyle(document.documentElement).scrollBehavior, transition: probe ? getComputedStyle(probe).transitionDuration : '0s',
      dur: getComputedStyle(document.documentElement).getPropertyValue('--dur-2').trim(), vt: document.getAnimations().filter(a => String(a.effect?.pseudoElement || '').includes('view-transition')).length};
  });
  f.ok(motion.scroll === 'auto', `reduced motion: scroll-behavior ${motion.scroll}`);
  f.ok(motion.transition.split(',').every(d => parseFloat(d) === 0), `reduced motion: transitions ${motion.transition}`);
  f.ok(parseFloat(motion.dur) === 0, `reduced motion: --dur-2 ${motion.dur}`);
  f.ok(motion.vt === 0, 'no ::view-transition animations');
  await rm.close();
};

// 12. Screenshots of every view at 390 and 1440, light and dark.
CHECKS[12] = async f => {
  if (!SHOTS) { f.note('no --shots directory; screenshots skipped'); return; }
  for (const scheme of ['light', 'dark']) for (const vp of ['390', '1440']) {
    const {page, close} = await open(vp, {colorScheme: scheme});
    for (const route of ROUTES) {
      await go(page, route);
      await page.waitForTimeout(route === '#/map' ? 1500 : 300);
      await page.evaluate(() => scrollTo(0, 0));
      await shot(page, `view-${route.slice(2).replace('/', '-')}-${vp}-${scheme}`);
    }
    await openRecord(page, WORKED.tz);
    await shot(page, `record-tz-${vp}-${scheme}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.click('#stamp-chip');
    await page.waitForTimeout(500);
    await shot(page, `sheet-stamps-${vp}-${scheme}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await go(page, '#/latest');
    await page.click('[data-open-sheet="filters-sheet"]');
    await page.waitForTimeout(500);
    await shot(page, `sheet-filters-${vp}-${scheme}`);
    await close();
  }
  f.note(`screenshots in ${SHOTS}`);
};

// 13. The 9 Oct clock, and a page left open across midnights.
CHECKS[13] = async f => {
  for (const vp of ['390', '1440']) {
    const {page, close} = await open(vp, {clock: STALE_CLOCK});
    const chip = await page.evaluate(() => ({state: document.querySelector('#stamp-chip').dataset.state, text: document.querySelector('#stamp-chip').textContent}));
    f.ok(chip.state === 'stale' && /Stale snapshot/i.test(chip.text), `${vp}: chip ${JSON.stringify(chip)}`);
    const s5 = 'This snapshot has nothing newer than 2 Oct 2026, 7 days ago.';
    f.ok((await page.textContent('#data-notice')).includes(s5), `${vp}: S5 on #/latest`);
    f.ok(/in the last 7 days/.test(await page.textContent('.feed-gap').catch(() => '')), `${vp}: .feed-gap E4 "in the last 7 days"`);
    const titles = await page.$$eval('.feed-group-title', ts => ts.map(t => t.textContent.trim()));
    f.ok(titles.length && titles[0].startsWith('7 to 30 days ago'), `${vp}: first group "${titles[0]}"`);
    f.ok(!titles.some(t => t.includes('within 72 hours')), `${vp}: no "within 72 hours" group`);
    const zeros = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && e.textContent.trim() === '0' && e.getClientRects().length).length);
    f.ok(zeros === 0, `${vp}: ${zeros} elements read "0"`);
    const latestNew = await page.$$eval('.band-text, .status, .chip, .feed-group-title', els => els.map(e => e.textContent.trim()).filter(t => /^(latest|new)\b/i.test(t) && !t.startsWith('Latest evidence')));
    f.ok(latestNew.length === 0, `${vp}: labels starting latest/new: ${latestNew}`);
    await go(page, '#/map');
    f.ok((await page.textContent('#data-notice')).includes(s5), `${vp}: S5 on #/map`);
    await close();
  }
  const live = await open('1440', {clock: '2026-10-02T23:59:00Z', install: true});
  await live.page.clock.fastForward((48 * 60 + 2) * 60 * 1000);
  await live.page.clock.runFor(61000);
  await live.page.waitForTimeout(500);
  f.ok((await live.page.textContent('#data-notice')).includes('No evidence newer than 2 Oct 2026'), 'S4 appears without a reload past 5 Oct 00:00');
  await live.page.clock.fastForward((7 * 24 * 60) * 60 * 1000);
  await live.page.clock.runFor(61000);
  await live.page.waitForTimeout(500);
  const later = await live.page.evaluate(() => ({chip: document.querySelector('#stamp-chip').textContent, notice: document.querySelector('#data-notice').textContent}));
  f.ok(/newest evidence 10 days old/.test(later.chip), `12 Oct: chip "${later.chip.trim()}"`);
  f.ok(/10 days ago/.test(later.notice), '12 Oct: S5 contains "10 days ago"');
  await live.close();
};

async function scanAllStates(clock) {
  const hits = [];
  const {page, close} = await open('390', {clock});
  for (const route of ROUTES) {
    await go(page, route);
    await page.waitForTimeout(route === '#/map' ? 1500 : 400);
    hits.push(...await scanDOM(page, `${clock} ${route}`));
  }
  await go(page, '#/latest');
  for (const id of [WORKED.kr, WORKED.ng, WORKED.nz, WORKED.es, WORKED.as]) {
    await openRecord(page, id);
    hits.push(...await scanDOM(page, `${clock} record ${id}`));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  await page.click('[data-open-sheet="filters-sheet"]');
  await page.waitForTimeout(400);
  hits.push(...await scanDOM(page, `${clock} filters sheet`));
  await page.keyboard.press('Escape');
  await page.click('#stamp-chip');
  await page.waitForTimeout(600);
  hits.push(...await scanDOM(page, `${clock} dates sheet`));
  await close();
  return hits;
}

// 14. Banned vocabulary on the 2 Oct and 9 Oct DOMs.
CHECKS[14] = async f => {
  for (const clock of [CLOCK, STALE_CLOCK]) {
    const hits = (await scanAllStates(clock)).filter(h => h.kind !== 'stance-total');
    f.ok(hits.length === 0, `${clock}: ${JSON.stringify(hits.slice(0, 6))}`);
  }
};

// 15. Worked cases (SPEC §19 WP3 acceptance).
CHECKS[15] = async f => {
  const noaa = EVENTS.events.find(e => e.id === WORKED.as)?.intensity?.disruption ?? '';
  const cases = [
    {code: 'KR', id: WORKED.kr, card: ['Against Yoon’s presidency — Anti-Yoon demonstrators', 'Against Yoon’s removal — Pro-Yoon demonstrators']},
    {code: 'NG', id: WORKED.ng, card: ['For Union rights and reinstatement — PENGASSAN', 'For Company reorganisation — Dangote management']},
    {code: 'NZ', id: WORKED.nz, card: ['Against Treaty Principles Bill — Hīkoi mō te Tiriti supporters', 'For Treaty Principles Bill — ACT Party'],
      detail: ["Each line is one actor's position toward a named target, as reported in the cited source."]},
    {code: 'ES', id: WORKED.es, card: ['For', 'Tenant protection', 'Against', 'Proposed housing decrees', 'Disruption: Disruption beyond the reported march not established.']},
    {code: 'AS', id: WORKED.as, card: [noaa]},
  ];
  for (const c of cases) {
    const {page, close} = await open('390', {search: `?country=${c.code}`});
    const card = await page.evaluate(id => document.querySelector(`.card[data-id="${id}"]`)?.textContent.replace(/\s+/g, ' ') ?? '', c.id);
    for (const s of c.card) f.ok(card.includes(s), `${c.id} card: "${s}"`);
    await openRecord(page, c.id, `?country=${c.code}`);
    const d4 = (await page.textContent('#rec-positions').catch(() => '')).replace(/\s+/g, ' ');
    f.ok(d4.length > 0, `${c.id}: #rec-positions renders`);
    for (const s of c.detail || []) f.ok(d4.includes(s), `${c.id} detail: "${s}"`);
    await close();
  }
};

// 16. Status before band on tz-drivers.
CHECKS[16] = async f => {
  const {page, close} = await open('390');
  const tz = await page.evaluate(id => {
    const card = document.querySelector(`.card[data-id="${id}"]`);
    const status = card?.querySelector('.status'); const band = card?.querySelector('.band');
    return {status: status?.textContent.trim(), before: Boolean(status && band && (status.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING))};
  }, WORKED.tz);
  f.ok(tz.status === 'Ended / suspended 30 Sep 2026', `tz status "${tz.status}"`);
  f.ok(tz.before, 'tz .status precedes .band');
  await close();
};

// 17. First viewport (2 Oct clock only).
CHECKS[17] = async f => {
  const a = await open('390');
  const r390 = await a.page.evaluate(() => {
    const t = document.querySelector('.card-title')?.getBoundingClientRect();
    const tab = document.querySelector('#tab-bar'); const tabH = tab && tab.getClientRects().length ? tab.getBoundingClientRect().height : 0;
    return {titleBottom: t?.bottom, limit: innerHeight - tabH};
  });
  f.ok(r390.titleBottom !== undefined && r390.titleBottom <= r390.limit, `390×844: first .card-title bottom ${Math.round(r390.titleBottom)} > ${Math.round(r390.limit)}`);
  await shot(a.page, 'first-viewport-390');
  await a.close();
  const b = await open('360');
  const r360 = await b.page.evaluate(() => {
    const c = document.querySelector('.card')?.getBoundingClientRect(); const t = document.querySelector('.card-title')?.getBoundingClientRect();
    const tab = document.querySelector('#tab-bar'); const tabH = tab && tab.getClientRects().length ? tab.getBoundingClientRect().height : 0;
    return {cardTop: c?.top, titleBottom: t?.bottom, limit: innerHeight - tabH};
  });
  f.ok(r360.cardTop !== undefined && r360.cardTop < r360.limit, `360×780: first .card top ${Math.round(r360.cardTop)} ≥ ${Math.round(r360.limit)}`);
  f.note(`360×780: first title bottom ${Math.round(r360.titleBottom)} (target ≤ ${Math.round(r360.limit)})`);
  const heights = await b.page.$$eval('.card', cs => cs.slice(0, 5).map(c => Math.round(c.getBoundingClientRect().height)));
  f.note(`card heights at 360: ${heights.join(', ')}`);
  await shot(b.page, 'first-viewport-360');
  await b.close();
};

// 18. Example load failure (C-38).
CHECKS[18] = async f => {
  const {page, close, errors} = await open('390', {hash: '#/about', block: [{pattern: 'public/examples.json', status: 404}]});
  await page.click('#about-example');
  await page.waitForTimeout(1200);
  const list = await page.textContent('#event-list');
  f.ok(await page.evaluate(() => location.hash) === '#/latest', 'hash is #/latest');
  f.ok(list.includes('The illustrative example could not load.') && list.includes('Nothing here is reported data.'), 'example error copy');
  f.ok(await page.isVisible('#example-banner'), 'the banner stays visible');
  f.ok(!list.includes('No published episode matches these filters.') && !list.includes('No episodes are published in this snapshot.'), 'no E1 or true-empty copy');
  await page.click('#tab-bar a[data-nav="map"]');
  await page.waitForTimeout(1500);
  f.ok((await page.textContent('#map-legend')).includes('Illustrative example unavailable'), 'map legend "Illustrative example unavailable"');
  f.ok(await page.evaluate(() => {
    const ex = getComputedStyle(document.documentElement).getPropertyValue('--map-example').trim();
    const probe = document.createElement('div'); probe.style.color = ex; document.body.append(probe); const rgb = getComputedStyle(probe).color; probe.remove();
    return ![...document.querySelectorAll('.map-country')].some(p => getComputedStyle(p).fill === rgb);
  }), 'no .map-country has the example fill');
  await page.click('#tab-bar a[data-nav="latest"]');
  await page.waitForTimeout(400);
  await page.click('#event-list [data-set-mode="reported"]');
  await page.waitForTimeout(800);
  f.ok(/of 84 published records/.test(await page.textContent('#result-summary')), 'Back to reported data restores the 84-record list');
  await page.unroute('**/*public/examples.json*');
  await page.click('#about-example').catch(async () => { await go(page, '#/about'); await page.click('#about-example'); });
  await page.waitForTimeout(500);
  const retry = await page.$('[data-retry="examples"]');
  if (retry) { await retry.click(); await page.waitForTimeout(1200); }
  f.ok(await page.isVisible('.card-watermark'), 'after unblocking, Retry example shows the example card');
  f.ok(errors.filter(e => !/examples\.json/.test(e)).length === 0, `errors ${errors}`);
  await close();
};

// 19. Events failure (C-37).
CHECKS[19] = async f => {
  const {page, close} = await open('390', {block: [{pattern: 'public/events.json', status: 500}]});
  for (const route of ROUTES) {
    await go(page, route);
    await page.waitForTimeout(route === '#/map' ? 1500 : 400);
    const notice = (await page.textContent('#data-notice')).replace(/\s+/g, ' ');
    f.ok(notice.includes(H1) && notice.includes(E5), `${route}: H1 + E5 in the notice`);
    f.ok(await page.evaluate(() => document.querySelector('#stamp-chip').dataset.state === 'error'), `${route}: chip data-state=error`);
    if (route === '#/map') {
      f.ok((await page.textContent('#map-legend')).includes('Coverage cannot be shown because published records did not load.'), 'map legend error copy');
      f.ok(await page.evaluate(() => {
        const rep = getComputedStyle(document.documentElement).getPropertyValue('--map-reported').trim();
        const probe = document.createElement('div'); probe.style.color = rep; document.body.append(probe); const rgb = getComputedStyle(probe).color; probe.remove();
        return ![...document.querySelectorAll('.map-country')].some(p => { const fill = getComputedStyle(p).fill; return fill === rgb || fill.startsWith('url('); });
      }), 'no reported fill or hatch');
    }
    if (route === '#/countries') {
      const rows = await page.$$eval('.dir-row .dir-status', els => els.map(e => e.textContent.trim()));
      f.ok(rows.length > 0 && rows.every(t => t === 'Coverage unavailable'), `every directory row reads "Coverage unavailable" (${rows.length})`);
    }
  }
  await go(page, '#/latest');
  await page.click('[data-open-sheet="filters-sheet"]');
  await page.waitForTimeout(400);
  f.ok((await page.textContent('#filters-sheet')).includes('Filters are unavailable because published records did not load.'), 'filter-sheet error body');
  const body = await page.evaluate(() => document.body.textContent);
  f.ok(!body.includes('Searched · no published episode') && !body.includes('Close · no records match'), 'no zero-coverage wording anywhere');
  await page.keyboard.press('Escape');
  await page.unroute('**/*public/events.json*');
  await page.click('[data-action="retry-data"]');
  await page.waitForTimeout(1500);
  f.ok(await page.evaluate(() => document.querySelectorAll('.card').length > 0 && document.querySelector('#stamp-chip').dataset.state !== 'error'), 'Retry restores everything without a reload');
  await close();
};

// 20. Countries-only failure.
CHECKS[20] = async f => {
  const {page, close} = await open('390', {block: [{pattern: 'public/countries.json', status: 500}]});
  f.ok(/of 84 published records/.test(await page.textContent('#result-summary')), 'the list renders 84 records');
  const notice = await page.textContent('#data-notice');
  f.ok(notice.includes('The country directory could not load; records are listed by country code.') && !notice.includes(E5), 'countries-error line, no E5');
  await go(page, '#/countries');
  await page.waitForTimeout(500);
  f.ok((await page.textContent('#view-countries')).includes('The country directory could not load.'), 'Countries error state');
  await close();
};

// 21. Sticky targets (WCAG 2.4.11).
CHECKS[21] = async f => {
  const {page, close} = await open('390');
  await openRecord(page, WORKED.tz);
  const below = async target => page.evaluate(t => {
    const el = document.querySelector(t); const tabs = document.querySelector('#record-sheet .rec-tabs');
    const head = el?.querySelector('h3, h2') || el;
    return {top: head?.getBoundingClientRect().top, tabs: tabs?.getBoundingClientRect().bottom};
  }, target);
  await page.click('.rec-glance-cell[data-scroll-to="rec-state"]');
  await page.waitForTimeout(700);
  const a = await below('#rec-state');
  f.ok(a.top >= a.tabs - 1, `#rec-state heading top ${Math.round(a.top)} under .rec-tabs bottom ${Math.round(a.tabs)}`);
  const ref = await page.$('#record-body .source-ref[data-scroll-to="detail-source-1"]');
  if (ref) {
    await ref.scrollIntoViewIfNeeded();
    await ref.click();
    await page.waitForTimeout(700);
    const b = await below('#detail-source-1');
    f.ok(b.top >= b.tabs - 1, `#detail-source-1 top ${Math.round(b.top)} under .rec-tabs bottom ${Math.round(b.tabs)}`);
    f.ok(await page.evaluate(() => document.activeElement?.id === 'detail-source-1'), '#detail-source-1 is focused');
  } else f.ok(false, 'no "Source 1" ref in tz-drivers');
  await close();
  const r = await open('390', {hash: '#/ahead/roadmap'});
  await r.page.waitForSelector('.roadmap-item', {timeout: 8000}).catch(() => {});
  await r.page.focus('#ahead-roadmap-title').catch(() => {});
  const bad = [];
  for (let i = 0; i < 30; i += 1) {
    await r.page.keyboard.press('Tab');
    const res = await r.page.evaluate(() => {
      const el = document.activeElement; const sw = document.querySelector('.ahead-switch');
      if (!el || !el.closest('#ahead-root')) return null;
      return {top: el.getBoundingClientRect().top, bottom: sw.getBoundingClientRect().bottom, text: el.textContent.trim().slice(0, 30)};
    });
    if (res && res.top < res.bottom - 1) bad.push(res);
  }
  f.ok(bad.length === 0, `roadmap links under the switch: ${JSON.stringify(bad.slice(0, 3))}`);
  await r.close();
};

// 22. Segmented focus in the filter sheet.
CHECKS[22] = async f => {
  const {page, close} = await open('390');
  await page.click('[data-open-sheet="filters-sheet"]');
  await page.waitForTimeout(400);
  for (let i = 0; i < 20 && !(await page.evaluate(() => Boolean(document.activeElement?.closest('#window-filter')))); i += 1) await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const label = document.activeElement?.closest('label'); const s = label ? getComputedStyle(label) : null;
    return {inside: Boolean(document.activeElement?.closest('#window-filter')), style: s?.outlineStyle, width: s ? parseFloat(s.outlineWidth) : 0};
  });
  f.ok(ring.inside && ring.style === 'solid' && ring.width > 0, `focused segment label outline ${JSON.stringify(ring)}`);
  for (let i = 0; i < 3 && !(await page.evaluate(() => document.querySelector('#window-filter input[value="30"]')?.checked)); i += 1) await page.keyboard.press('ArrowRight');
  f.ok(await page.evaluate(() => {
    const input = document.querySelector('#window-filter input[value="30"]'); const check = input?.closest('label')?.querySelector('.filter-check');
    return input?.checked && check && getComputedStyle(check).display !== 'none';
  }), '"Last 30 days" shows its .filter-check');
  await close();
};

// 23. Stance totals on the 2 Oct and 9 Oct DOMs.
CHECKS[23] = async f => {
  for (const clock of [CLOCK, STALE_CLOCK]) {
    const hits = (await scanAllStates(clock)).filter(h => h.kind === 'stance-total');
    f.ok(hits.length === 0, `${clock}: ${JSON.stringify(hits.slice(0, 6))}`);
  }
};

// ---------------------------------------------------------------------------------------------------------------
(async () => {
  const server = await startServer();
  BASE = `http://127.0.0.1:${server.address().port}${PREFIX}`;
  browser = await launch();
  const started = Date.now();
  if (DIRECTION !== 'live') console.error(`note: --direction ${DIRECTION}; SPEC C-01 fixes the live (feed-first) shell, checks assume it.`);
  for (const id of Object.keys(CHECKS)) {
    if ((ONLY && !ONLY.has(id)) || SKIP.has(id)) continue;
    const f = new Failures();
    try {
      await CHECKS[id](f);
      record(id, f.list.length ? 'fail' : 'pass', f.list.length ? {failures: f.list, notes: f.notes} : (f.notes.length ? {notes: f.notes} : undefined));
    } catch (error) {
      record(id, 'fail', {error: String(error && error.message || error).split('\n')[0], failures: f.list, notes: f.notes});
    }
  }
  await browser.close();
  server.close();
  const failed = Object.entries(results).filter(([, r]) => r.status === 'fail').map(([id]) => Number(id));
  const summary = {root: path.relative(REPO, ROOT) || '.', prefix: PREFIX, clock: CLOCK, seconds: Math.round((Date.now() - started) / 1000),
    passed: Object.values(results).filter(r => r.status === 'pass').length, failed, checks: results};
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch(error => { console.error(error); process.exit(2); });
