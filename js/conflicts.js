// Conflict context layer, critical part (4.1 SPEC §9 WP-D; Phase-0 stub, frozen signatures): copy and Reports rows for
// re-published UCDP records. Imports only ./html.js, ./model.js, ../freshness.js (SPEC §19.0 C-53). DOM-free.
// Phase 0: the copy is final (EC1–EC5, §4.8, §5.3); renderConflictRow returns '' until public/conflicts.json exists (WP-D).
import {esc} from './html.js';
import {KIND_LABELS, kindOf} from './model.js';
import {absoluteLabel} from '../freshness.js';

/** Copy deck, verbatim; checked against both banned lists. No EC6 (R25). */
export const CONFLICT_COPY = Object.freeze({
  ec1: 'No conflict records in this snapshot: the dataset has not been loaded. Absence is not peace.',
  ec2: 'Conflict records could not load, so they are unknown here, not absent.',
  ec3: (country, n, year) => `${country}: no published protest or strike episode. UCDP records ${n} armed ${n === 1 ? 'conflict' : 'conflicts'} with a location in ${country} in ${year}.`,
  ec3f: (country, n, year) => `${country}: its published episodes are hidden by the Kind filter or the layer control. UCDP records ${n} armed ${n === 1 ? 'conflict' : 'conflicts'} with a location in ${country} in ${year}.`,
  ec4: (country, year) => `${country}: no UCDP conflict record reaches the 25-death threshold for ${year}. That is a threshold, not a statement that there was no armed violence.`,
  ec5: 'Every record in this snapshot is a collective-action episode (a protest or a strike, not distinguished at research time). No record has been re-read for its kind, and no conflict records have been loaded.',
  eyebrow: 'Conflict record · UCDP data',
  sectionHeading: 'Armed conflict records (UCDP)',
  sectionNote: 'Yearly and monthly basis, from a re-published dataset. These records do not follow the 72-hour evidence clock.',
  summary: (n, m) => `Showing ${n} of ${m} UCDP conflict records matching your filters`,
  csvTitle: 'CSV export covers protest and strike records',
  evidenceLine: (dataset, version, date) => `${dataset} ${version} · downloaded ${date} · re-published UCDP data, not Protest Atlas research`,
  latestLine: value => `Latest recorded ${value}`,
  parties: (a, b) => `Parties as named by UCDP: ${a} · ${b}`,
  activeYear: year => `Recorded as active by UCDP in ${year}`,
  provisionalMonths: month => `Provisional UCDP events recorded through ${month}, subject to revision`,
  notInLatestYear: year => `Not recorded by UCDP as active in ${year}. Absence from the dataset is not evidence of peace.`,
});

const MONTH = /^(\d{4})-(\d{2})$/;

/** "2024" for a yearly latest_recorded, "Aug 2026" for a provisional month. */
export function conflictLatestLabel(record) {
  const value = String(record?.latest_recorded ?? '');
  const m = MONTH.exec(value);
  return m ? absoluteLabel(`${m[1]}-${m[2]}-01`).replace(/^\d+ /, '') : value;
}

/** One of the three §5.3 activity sentences, with the year or month it rests on. */
export function activityLabel(record, envelope) {
  const basis = record?.activity_basis;
  const lastYear = envelope?.window?.last_year;
  if (basis === 'provisional-months') return CONFLICT_COPY.provisionalMonths(conflictLatestLabel(record));
  if (basis === 'active-year') return CONFLICT_COPY.activeYear(record?.latest_recorded ?? lastYear);
  return CONFLICT_COPY.notInLatestYear(lastYear);
}

/** Phase 0: '' (no conflict record exists); WP-D renders the §9 row (badge, locations, latest, title, parties, evidence). */
export function renderConflictRow(record, {countryName = code => code, envelope = null} = {}) {   // eslint-disable-line no-unused-vars
  return '';
}

/** Record-sheet chrome (§7.2): eyebrow, title, kind badge text and the dataset link. */
export function conflictChrome(record, envelope = null) {
  const source = (envelope?.sources ?? []).find(s => (record?.kind_basis?.source_ids ?? []).includes(s.id));
  return {eyebrow: CONFLICT_COPY.eyebrow, title: String(record?.ucdp?.conflict_name ?? ''), kindLabel: esc(KIND_LABELS[kindOf(record)] ?? ''),
    sourceLabel: source ? `${source.dataset} ${source.version}` : '', sourceURL: source?.url ?? null};
}
