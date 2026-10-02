// Local editorial drafts only. This module never sends imported files or decisions to a server.
const CANDIDATE_FIELDS = ['id', 'title', 'url', 'publisher_domain', 'publisher_country', 'language', 'gdelt_seen_at', 'review_status'];
const DISPOSITIONS = ['unreviewed', 'needs-source', 'reject', 'duplicate', 'ready-for-editor'];
const LABELS = {unreviewed: 'Unreviewed', 'needs-source': 'Needs source', reject: 'Reject', duplicate: 'Duplicate', 'ready-for-editor': 'Ready for editor'};
const MAX_BYTES = 2_000_000;
const $ = id => document.getElementById(id);
const state = {countries: [], events: [], reviews: [], selected: null, collectedAt: null};

function require(condition, message) { if (!condition) throw new Error(message); }
function boundedText(value, max, optional = false) {
  return typeof value === 'string' && value.length <= max && (optional || value.trim().length > 0) && !/[\u0000-\u0008\u000b-\u001f]/.test(value);
}
export function canonicalUrl(value) {
  require(boundedText(value, 2000) && !/[\s\\]/.test(value), 'Source URL contains invalid characters.');
  const url = new URL(value);
  require(url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password && (!url.port || url.port === '443'), 'Sources require HTTPS URLs without credentials or nonstandard ports.');
  const pairs = [...url.searchParams].filter(([key]) => !key.toLowerCase().startsWith('utm_') && !['fbclid', 'gclid'].includes(key.toLowerCase()));
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const query = new URLSearchParams(pairs).toString().replace(/%7E/gi, '~').replace(/\*/g, '%2A');
  return `https://${url.hostname}${url.pathname || '/'}${query ? '?' + query : ''}`;
}
function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
}
function validMoment(value) {
  return typeof value === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(value) ? validDay(value) : /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now());
}
async function candidateId(url) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
  return 'candidate-' + [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 20);
}
export async function normalizeCandidates(payload, events) {
  require(payload && typeof payload === 'object' && payload.schema_version === 1 && !('events' in payload) && !('reviews' in payload), 'Import a discovery candidate file, not public events or a review packet.');
  require(validMoment(payload.collected_at), 'Candidate collection date is missing, invalid or in the future.');
  require(Array.isArray(payload.candidates) && payload.candidates.length <= 1000, 'File must contain at most 1000 candidate leads.');
  const existing = new Map();
  for (const event of events) for (const source of event.sources) {
    const url = canonicalUrl(source.url);
    if (!existing.has(url)) existing.set(url, new Set());
    existing.get(url).add(event.id);
  }
  const seen = new Set(), candidates = [];
  for (const lead of payload.candidates) {
    require(lead && typeof lead === 'object' && !Array.isArray(lead), 'Every candidate must be an object.');
    const keys = Object.keys(lead).filter(key => key !== 'existing_event_ids').sort();
    require(JSON.stringify(keys) === JSON.stringify([...CANDIDATE_FIELDS].sort()), 'Unexpected candidate fields: imported occurrence or verification claims are forbidden.');
    require(typeof lead.id === 'string' && /^[a-z0-9][a-z0-9-]{0,95}$/.test(lead.id) && boundedText(lead.title, 2000) && lead.review_status === 'unverified', 'Candidate identity, title or unverified status is invalid.');
    const url = canonicalUrl(lead.url);
    require(lead.publisher_domain === new URL(lead.url).hostname, 'Publisher domain disagrees with the source URL.');
    for (const key of ['publisher_country', 'language', 'gdelt_seen_at']) require(lead[key] === null || boundedText(lead[key], 100), 'Invalid candidate metadata.');
    if (seen.has(url)) continue;
    seen.add(url);
    const candidate = Object.fromEntries(CANDIDATE_FIELDS.map(key => [key, lead[key]]));
    Object.assign(candidate, {id: await candidateId(url), url, publisher_domain: new URL(url).hostname, existing_event_ids: [...(existing.get(url) || [])].sort()});
    candidates.push(candidate);
  }
  return {collected_at: payload.collected_at, candidates};
}
export function reviewErrors(row, countryCodes, eventIds) {
  const errors = [];
  if (!DISPOSITIONS.includes(row.disposition)) errors.push('Choose a valid disposition.');
  for (const key of ['notes', 'claim_summary', 'attribution']) if (!boundedText(row[key], 4000, true)) errors.push('Notes, summary and attribution must be plain text, at most 4000 characters.');
  for (const key of ['observed_date', 'source_published_at']) if (row[key] !== null && !validDay(row[key])) errors.push('Evidence dates must be valid dates today or earlier.');
  if (row.country !== null && !countryCodes.has(row.country)) errors.push('Choose an occurrence country from the directory.');
  if (row.duplicate_event_id !== null && !eventIds.has(row.duplicate_event_id)) errors.push('Duplicate ID must match a published event.');
  if (typeof row.source_checked !== 'boolean') errors.push('Source-check acknowledgement is invalid.');
  if (row.disposition === 'duplicate' && !eventIds.has(row.duplicate_event_id)) errors.push('A duplicate decision needs a published event ID.');
  if (row.disposition === 'ready-for-editor') {
    if (!row.source_checked) errors.push('Read the underlying report and acknowledge the source check.');
    if (!row.observed_date) errors.push('Enter the reported occurrence date manually.');
    if (!row.country) errors.push('Enter the occurrence country manually.');
    if (!row.claim_summary.trim()) errors.push('Summarize the sourced claim.');
    if (!row.attribution.trim()) errors.push('Attribute the claim to its source.');
    if (row.candidate.existing_event_ids.length) errors.push('This source URL is already published. Review it as a duplicate.');
  }
  return [...new Set(errors)];
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function notice(message, error = false) { $('review-notice').textContent = message; $('review-notice').classList.toggle('is-error', error); }
function option(value, label) { const node = element('option', label); node.value = value; return node; }
function renderList() {
  const query = $('lead-query').value.toLowerCase(), disposition = $('lead-disposition').value;
  const rows = state.reviews.filter(row => (!disposition || row.disposition === disposition) && [row.candidate.title, row.candidate.publisher_domain, row.candidate.publisher_country || '', row.candidate.language || '', row.notes].join(' ').toLowerCase().includes(query));
  $('lead-count').textContent = `${rows.length} of ${state.reviews.length} unverified leads · collected ${state.collectedAt || 'unknown'}`;
  const nodes = rows.map(row => {
    const button = element('button', undefined, 'lead-button');
    button.type = 'button'; button.setAttribute('aria-pressed', String(state.selected === row.candidate.id));
    button.append(element('strong', row.candidate.title), element('span', `${row.candidate.publisher_domain} · ${row.candidate.language || 'Language unknown'} · ${LABELS[row.disposition]}${row.candidate.existing_event_ids.length ? ' · Existing source URL' : ''}`));
    button.addEventListener('click', () => { state.selected = row.candidate.id; renderList(); renderEditor(); });
    return button;
  });
  $('lead-list').replaceChildren(...(nodes.length ? nodes : [element('p', 'No leads match these filters.', 'review-empty')]));
}
function field(label, input) { const wrapper = element('div'), labelNode = element('label', label); labelNode.htmlFor = input.id; wrapper.append(labelNode, input); return wrapper; }
function input(id, value, type = 'text') { const node = element('input'); node.id = id; node.type = type; node.value = value || ''; if (type === 'date') node.max = new Date().toISOString().slice(0, 10); return node; }
function textarea(id, value) { const node = element('textarea'); node.id = id; node.value = value; node.maxLength = 4000; return node; }
function readForm(form, row, includeDisposition = false) {
  const value = id => form.querySelector('#' + id).value;
  return {...row, disposition: includeDisposition ? value('edit-disposition') : row.disposition,
    notes: value('edit-notes'), observed_date: value('edit-observed') || null, country: value('edit-country') || null,
    source_published_at: value('edit-published') || null, source_checked: form.querySelector('#edit-checked').checked,
    claim_summary: value('edit-summary'), attribution: value('edit-attribution'), duplicate_event_id: value('edit-duplicate') || null};
}
function errorsFor(row) { return reviewErrors(row, new Set(state.countries.map(c => c.code)), new Set(state.events.map(e => e.id))); }
function renderEditor() {
  const row = state.reviews.find(item => item.candidate.id === state.selected);
  if (!row) return;
  const editor = $('lead-editor'), candidate = row.candidate;
  const heading = element('h2', candidate.title); heading.id = 'editor-title';
  const link = element('a', `Read underlying report at ${candidate.publisher_domain} ↗`); link.href = candidate.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  const metadata = element('dl', undefined, 'lead-metadata');
  for (const [label, value] of [['Lead status', 'Unverified article metadata'], ['Publisher country', candidate.publisher_country || 'Unknown'], ['Source language', candidate.language || 'Unknown'], ['GDELT seen time', candidate.gdelt_seen_at || 'Unknown'], ['Publication date', 'Unknown until manually checked below'], ['Existing source URLs', candidate.existing_event_ids.join(', ') || 'No URL match; this does not prove event uniqueness']]) metadata.append(element('dt', label), element('dd', value));
  const form = element('form', undefined, 'review-form');
  const disposition = element('select'); disposition.id = 'edit-disposition';
  for (const value of DISPOSITIONS) disposition.append(option(value, LABELS[value])); disposition.value = row.disposition;
  const country = element('select'); country.id = 'edit-country'; country.append(option('', 'Unknown · select from reporting'));
  for (const c of state.countries) country.append(option(c.code, c.name)); country.value = row.country || '';
  const duplicate = element('select'); duplicate.id = 'edit-duplicate'; duplicate.append(option('', 'No duplicate assigned'));
  for (const event of state.events) duplicate.append(option(event.id, `${event.id} · ${event.title}`)); duplicate.value = row.duplicate_event_id || '';
  const dates = element('div', undefined, 'review-two-fields'); dates.append(field('Observed occurrence date · manual', input('edit-observed', row.observed_date, 'date')), field('Source publication date · manual / optional', input('edit-published', row.source_published_at, 'date')));
  const checkbox = input('edit-checked', '', 'checkbox'); checkbox.checked = row.source_checked;
  const checkedLabel = element('label', undefined, 'checkbox-label'); checkedLabel.htmlFor = checkbox.id; checkedLabel.append(checkbox, element('span', 'I read the underlying source and checked its occurrence, date, place and claim attribution. This is a draft source check, not editorial approval.'));
  const errors = element('p', '', 'review-errors'); errors.hidden = true; errors.setAttribute('role', 'alert');
  const saved = element('p', 'Edits stay in memory. Apply a disposition, then export to keep them.', 'review-save-note'); saved.setAttribute('role', 'status');
  const save = element('button', 'Apply disposition', 'review-button'); save.type = 'submit';
  form.append(field('Review disposition', disposition), field('Occurrence country · manual', country), dates, checkedLabel,
    field('Claim summary · original, sourced wording', textarea('edit-summary', row.claim_summary)), field('Claim attribution · publisher / actor / evidence limitations', textarea('edit-attribution', row.attribution)), field('Duplicate published event ID', duplicate), field('Review notes · omit private identifying information', textarea('edit-notes', row.notes)), errors, save, saved);
  form.addEventListener('input', () => { Object.assign(row, readForm(form, row)); saved.textContent = 'Evidence edits kept in memory. Apply disposition to record the selected decision.'; });
  form.addEventListener('submit', event => {
    event.preventDefault(); const draft = readForm(form, row, true), issues = errorsFor(draft);
    errors.hidden = !issues.length; errors.textContent = issues.join(' ');
    if (issues.length) { saved.textContent = 'Disposition unchanged. Complete the evidence or choose an earlier review stage.'; return; }
    Object.assign(row, draft); renderList(); saved.textContent = `Draft decision applied: ${LABELS[row.disposition]}. Export to keep this work; publication requires a separate editorial review.`;
  });
  editor.replaceChildren(heading, link, element('p', 'Metadata is unverified. Publisher country and GDELT seen time cannot fill occurrence fields.', 'review-help'), metadata, form);
}
async function importFile(file) {
  require(file && file.size <= MAX_BYTES, 'Select a candidate JSON file no larger than 2 MB.');
  const payload = JSON.parse(await file.text());
  const normalized = await normalizeCandidates(payload, state.events);
  state.reviews = normalized.candidates.map(candidate => ({candidate, disposition: 'unreviewed', notes: '', observed_date: null, country: null, source_published_at: null, source_checked: false, claim_summary: '', attribution: '', duplicate_event_id: null}));
  state.collectedAt = normalized.collected_at; state.selected = state.reviews[0]?.candidate.id || null;
  $('lead-query').disabled = false; $('lead-disposition').disabled = false; $('export-packet').disabled = false;
  $('lead-query').value = ''; $('lead-disposition').value = '';
  renderList();
  if (state.selected) renderEditor(); else $('lead-editor').replaceChildren(element('h2', 'No candidates in this file'), element('p', 'An empty sampled queue does not establish absence of protests.', 'review-help'));
  notice(`Imported ${state.reviews.length} unique unverified leads. ${state.reviews.filter(row => row.candidate.existing_event_ids.length).length} URLs already appear in the published index. Nothing was uploaded or published.`);
}
function exportPacket() {
  const invalid = state.reviews.map(row => ({row, errors: errorsFor(row)})).filter(item => item.errors.length);
  if (invalid.length) { state.selected = invalid[0].row.candidate.id; renderList(); renderEditor(); notice(`Export blocked: ${invalid[0].errors.join(' ')} Review the selected lead.`, true); return; }
  const packet = {schema_version: 1, packet_kind: 'editorial-review-packet', exported_at: new Date().toISOString(), source_collected_at: state.collectedAt, reviews: state.reviews};
  const blob = new Blob([JSON.stringify(packet, null, 2) + '\n'], {type: 'application/json'}), url = URL.createObjectURL(blob);
  const link = element('a'); link.href = url; link.download = `protest-atlas-review-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(`Exported ${state.reviews.length} draft decisions as a local JSON packet. No approval or public data changes performed.`);
}
async function start() {
  try {
    const responses = await Promise.all(['./public/countries.json', './public/events.json'].map(url => fetch(url, {cache: 'no-store'})));
    require(responses.every(response => response.ok), 'Published directory/source data could not be loaded. Import stays disabled to preserve duplicate and country checks.');
    const [countries, envelope] = await Promise.all(responses.map(response => response.json()));
    require(Array.isArray(countries) && countries.length && Array.isArray(envelope.events), 'Published directory/source data is invalid.');
    state.countries = [...countries].sort((a, b) => a.name.localeCompare(b.name)); state.events = envelope.events;
    // Validate source URLs before enabling the import boundary.
    for (const event of state.events) for (const source of event.sources) canonicalUrl(source.url);
    $('candidate-file').disabled = false;
    $('candidate-file').addEventListener('change', async event => { try { await importFile(event.target.files[0]); } catch (error) { notice(`Import rejected: ${error.message} Previous work is unchanged.`, true); } finally { event.target.value = ''; } });
    $('lead-query').addEventListener('input', renderList); $('lead-disposition').addEventListener('change', renderList);
    $('review-filters').addEventListener('submit', event => event.preventDefault()); $('export-packet').addEventListener('click', exportPacket);
    notice(`Ready to import. Duplicate checking uses ${state.events.length} published records; ${state.countries.length} country/territory choices available.`);
  } catch (error) { notice(error.message, true); }
}
if (typeof document !== 'undefined') start();
