#!/usr/bin/env python3
"""Aggregate downloaded UCDP files into conflict candidate records: research/round5/conflicts.candidates.json.

Offline and standard library only. Inputs are local CSV files named in a download manifest (see MANIFEST_FIELDS):
one or more UCDP GED files (the annual release and the monthly, provisional Candidate releases), the UCDP/PRIO Armed
Conflict Dataset (conflict-year) and, optionally, the UCDP Battle-Related Deaths Dataset (conflict-level).

What it emits, per UCDP conflict with at least one event dated inside the window: UCDP's parties, type, location
countries (as UCDP codes them, mapped to ISO codes), start dates, the latest event date, and per calendar year the
sum of UCDP best/low/high (or the BRD figures when that dataset is supplied), each tied to the dataset version it came
from. Everything is a candidate for a gate review; nothing here publishes.

What it refuses to emit: coordinates, geometry, sub-national places (adm_1, adm_2, where_*), source articles and
headlines, individuals, any `status` field, and any field whose name suggests a severity, risk, danger, score or
trend. `check_candidates()` enforces this on the output and doubles as a draft of scripts/validate_conflicts.py.

Column names, codebook thresholds and the GW-to-ISO table below are written from memory of the UCDP codebooks
(GED 25.x, ACD 25.x, BRD 25.x). The data session confirms them against the downloaded codebooks; a missing column
is a hard error that names the column, never a guess.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 1
DEFAULT_WINDOW_START = '2024-10-01'
PUBLISHER = 'Uppsala Conflict Data Program (UCDP), Department of Peace and Conflict Research, Uppsala University'

# UCDP codes (confirm against the downloaded codebook).
TYPE_OF_VIOLENCE = {1: 'state-based', 2: 'non-state', 3: 'one-sided'}
TYPE_OF_CONFLICT = {1: 'extrasystemic', 2: 'interstate', 3: 'intrastate', 4: 'internationalised intrastate'}
INTENSITY = {1: 'armed conflict (25–999 battle-related deaths in the year)', 2: 'war (at least 1,000 battle-related deaths in the year)'}
DATE_PRECISION = {1: 'day', 2: 'days', 3: 'week', 4: 'month', 5: 'year'}

# Kind vocabulary (one place to rename when the architect fixes the schema). type_of_conflict 4 folds into intrastate
# and keeps its UCDP label in `ucdp.type_label`.
KINDS = {
    'interstate': 'armed-conflict-interstate',
    'intrastate': 'armed-conflict-intrastate',
    'non-state': 'non-state-conflict',
    'one-sided': 'one-sided-violence',
}
KIND_BY_TYPE_OF_CONFLICT = {2: KINDS['interstate'], 3: KINDS['intrastate'], 4: KINDS['intrastate']}

GED_REQUIRED = ('id', 'year', 'type_of_violence', 'conflict_new_id', 'conflict_name', 'dyad_new_id', 'side_a', 'side_b',
                'country', 'country_id', 'date_prec', 'date_start', 'date_end', 'best', 'low', 'high')
GED_OPTIONAL = ('active_year',)
ACD_REQUIRED = ('conflict_id', 'location', 'side_a', 'side_b', 'year', 'intensity_level', 'type_of_conflict', 'start_date', 'start_date2')
BRD_REQUIRED = ('conflict_id', 'year', 'bd_best', 'bd_low', 'bd_high')
MANIFEST_FIELDS = ('path', 'role', 'dataset', 'version', 'provisional', 'covers_through', 'url', 'downloaded_at', 'licence', 'citation', 'doi')
ROLES = ('ged', 'acd', 'brd')

# Never present as a key anywhere in the output: compared token by token on snake_case names, so "latest_evidence"
# passes while "lat", "latitude", "geom_wkt", "adm_1", "where_coordinates", "risk_level" and "status" fail.
FORBIDDEN_KEY_TOKENS = {'lat', 'latitude', 'lon', 'lng', 'long', 'longitude', 'coord', 'coords', 'coordinate', 'coordinates', 'geom',
                        'geometry', 'wkt', 'adm', 'adm1', 'adm2', 'where', 'priogrid', 'severity', 'risk', 'danger', 'score', 'scores',
                        'trend', 'trends', 'casualties', 'toll'}
# Exact names only: a conflict record never carries a `status` (editorial §4.2), while `status_basis` is the agreed field.
FORBIDDEN_EXACT_KEYS = {'status'}
COORDINATE_LIKE = re.compile(r'-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}')


def forbidden_key(key):
    name = str(key).lower()
    return name in FORBIDDEN_EXACT_KEYS or any(token in FORBIDDEN_KEY_TOKENS for token in re.split(r'[^a-z0-9]+', name) if token)

RECORD_FIELDS = ('id', 'kind', 'kind_basis', 'ucdp', 'countries', 'parties', 'start', 'latest_evidence', 'latest_evidence_precision',
                 'fatalities', 'status_basis', 'sources', 'verification', 'note')
KIND_BASIS_FIELDS = ('method', 'text', 'source_ids')
UCDP_FIELDS = ('conflict_id', 'conflict_name', 'type_of_violence', 'type_of_violence_label', 'type_of_conflict', 'type_label', 'dyad_ids', 'location')
COUNTRY_FIELDS = ('code', 'ucdp_name')
PARTIES_FIELDS = ('side_a', 'side_b')
START_FIELDS = ('ucdp_start_date', 'ucdp_start_date2', 'first_event_in_window')
FATALITY_FIELDS = ('year', 'low', 'best', 'high', 'estimator', 'provisional', 'through', 'events', 'source_ids')
STATUS_BASIS_FIELDS = ('basis', 'active_years', 'latest_month', 'text', 'source_ids')
STATUS_BASES = ('ucdp-active-year', 'ucdp-candidate-events', 'ucdp-not-in-latest-year')
SOURCE_FIELDS = ('id', 'dataset', 'version', 'provisional', 'url', 'publisher', 'licence', 'citation', 'doi', 'downloaded_at',
                 'covers_through', 'sha256', 'rows_read')
VERIFICATION_FIELDS = ('level', 'note')
ENVELOPE_FIELDS = ('schema_version', 'publication', 'generated_at', 'window', 'inputs', 'licence_note', 'method_note', 'counts',
                   'excluded', 'warnings', 'records')
WINDOW_FIELDS = ('start', 'end', 'first_year', 'last_year', 'last_provisional_month')
ESTIMATORS = ('UCDP GED', 'UCDP BRD')

# Gleditsch–Ward state numbers → ISO 3166-1 alpha-2, from memory; the data session verifies against UCDP's country
# names. An unmapped country is reported with code null, never guessed. Kosovo (347) has no ISO code.
GW_TO_ISO2 = {
    2: 'US', 20: 'CA', 31: 'BS', 40: 'CU', 41: 'HT', 42: 'DO', 51: 'JM', 52: 'TT', 53: 'BB', 70: 'MX', 80: 'BZ', 90: 'GT', 91: 'HN',
    92: 'SV', 93: 'NI', 94: 'CR', 95: 'PA', 100: 'CO', 101: 'VE', 110: 'GY', 115: 'SR', 130: 'EC', 135: 'PE', 140: 'BR', 145: 'BO',
    150: 'PY', 155: 'CL', 160: 'AR', 165: 'UY', 200: 'GB', 205: 'IE', 210: 'NL', 211: 'BE', 212: 'LU', 220: 'FR', 225: 'CH', 230: 'ES',
    235: 'PT', 255: 'DE', 290: 'PL', 305: 'AT', 310: 'HU', 316: 'CZ', 317: 'SK', 325: 'IT', 338: 'MT', 339: 'AL', 341: 'ME', 343: 'MK',
    344: 'HR', 345: 'RS', 346: 'BA', 349: 'SI', 350: 'GR', 352: 'CY', 355: 'BG', 359: 'MD', 360: 'RO', 365: 'RU', 366: 'EE', 367: 'LV',
    368: 'LT', 369: 'UA', 370: 'BY', 371: 'AM', 372: 'GE', 373: 'AZ', 375: 'FI', 380: 'SE', 385: 'NO', 390: 'DK', 395: 'IS', 402: 'CV',
    404: 'GW', 411: 'GQ', 420: 'GM', 432: 'ML', 433: 'SN', 434: 'BJ', 435: 'MR', 436: 'NE', 437: 'CI', 438: 'GN', 439: 'BF', 450: 'LR',
    451: 'SL', 452: 'GH', 461: 'TG', 471: 'CM', 475: 'NG', 481: 'GA', 482: 'CF', 483: 'TD', 484: 'CG', 490: 'CD', 500: 'UG', 501: 'KE',
    510: 'TZ', 516: 'BI', 517: 'RW', 520: 'SO', 522: 'DJ', 530: 'ET', 531: 'ER', 540: 'AO', 541: 'MZ', 551: 'ZM', 552: 'ZW', 553: 'MW',
    560: 'ZA', 565: 'NA', 570: 'LS', 571: 'BW', 572: 'SZ', 580: 'MG', 581: 'KM', 590: 'MU', 600: 'MA', 615: 'DZ', 616: 'TN', 620: 'LY',
    625: 'SD', 626: 'SS', 630: 'IR', 640: 'TR', 645: 'IQ', 651: 'EG', 652: 'SY', 660: 'LB', 663: 'JO', 666: 'IL', 670: 'SA', 678: 'YE',
    690: 'KW', 692: 'BH', 694: 'QA', 696: 'AE', 698: 'OM', 700: 'AF', 701: 'TM', 702: 'TJ', 703: 'KG', 704: 'UZ', 705: 'KZ', 710: 'CN',
    712: 'MN', 713: 'TW', 731: 'KP', 732: 'KR', 740: 'JP', 750: 'IN', 760: 'BT', 770: 'PK', 771: 'BD', 775: 'MM', 780: 'LK', 781: 'MV',
    790: 'NP', 800: 'TH', 811: 'KH', 812: 'LA', 816: 'VN', 820: 'MY', 830: 'SG', 835: 'BN', 840: 'PH', 850: 'ID', 860: 'TL', 900: 'AU',
    910: 'PG', 920: 'NZ', 940: 'SB', 950: 'FJ',
}
# UCDP spellings that differ from the ISO directory names in public/countries.json.
UCDP_NAME_TO_ISO2 = {
    'russia (soviet union)': 'RU', 'myanmar (burma)': 'MM', 'dr congo (zaire)': 'CD', 'yemen (north yemen)': 'YE',
    'cambodia (kampuchea)': 'KH', 'madagascar (malagasy)': 'MG', 'zimbabwe (rhodesia)': 'ZW', 'vietnam (north vietnam)': 'VN',
    'serbia (yugoslavia)': 'RS', 'united states of america': 'US', 'ivory coast': 'CI', 'bosnia-herzegovina': 'BA',
    'macedonia, fyr': 'MK', 'north macedonia': 'MK', 'czech republic': 'CZ', 'rumania': 'RO', 'iran': 'IR', 'syria': 'SY',
    'turkey': 'TR', 'tanzania': 'TZ', 'laos': 'LA', 'south korea': 'KR', 'north korea': 'KP', 'moldova': 'MD', 'brunei': 'BN',
    'bolivia': 'BO', 'venezuela': 'VE', 'congo': 'CG', 'israel': 'IL', 'russia': 'RU', 'cape verde': 'CV', 'swaziland': 'SZ',
    'east timor': 'TL', 'united kingdom': 'GB', 'netherlands': 'NL', 'taiwan': 'TW', 'vietnam': 'VN', 'micronesia': 'FM',
    'gambia': 'GM', 'bahamas': 'BS', 'palestine': 'PS',
}


class IngestError(ValueError):
    """A hard input error: the run stops and the message names the file and the field."""


# ---------------------------------------------------------------- small helpers

def normalize(value):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', str(value or '')).encode('ascii', 'ignore').decode().lower()).strip()


def slug(*parts):
    text = '-'.join(normalize(p) for p in parts if p not in (None, ''))
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text[:96]


def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def parse_day(value):
    """'2024-10-01', '2024-10-01 00:00:00.000' or '2024-10-01T00:00:00' → date; anything else → None."""
    text = str(value or '').strip()[:10]
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', text):
        return None
    try:
        return date.fromisoformat(text)
    except ValueError:
        return None


def parse_int(value):
    text = str(value if value is not None else '').strip()
    if re.fullmatch(r'-?\d+', text):
        return int(text)
    if re.fullmatch(r'-?\d+\.0+', text):
        return int(float(text))
    return None


def utc_now():
    return datetime.now(timezone.utc)


def timestamp(value, path):
    if not isinstance(value, str) or 'T' not in value:
        raise IngestError(f'{path}: requires a timezone-qualified timestamp (YYYY-MM-DDTHH:MM:SSZ)')
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise IngestError(f'{path}: invalid timestamp') from exc
    if parsed.tzinfo is None:
        raise IngestError(f'{path}: timestamp needs a timezone')
    return parsed.astimezone(timezone.utc)


# ---------------------------------------------------------------- manifest

def read_manifest(path):
    """The download manifest: which local files, which UCDP dataset and version, and the terms as read on the page."""
    path = Path(path)
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        raise IngestError(f'{path}: {exc}') from exc
    files = data.get('files') if isinstance(data, dict) else None
    if not isinstance(files, list) or not files:
        raise IngestError(f'{path}: manifest needs a non-empty "files" array')
    inputs = []
    for i, entry in enumerate(files):
        p = f'{path}:files[{i}]'
        if not isinstance(entry, dict) or set(entry) != set(MANIFEST_FIELDS):
            raise IngestError(f'{p}: fields must be exactly {", ".join(MANIFEST_FIELDS)}')
        if entry['role'] not in ROLES:
            raise IngestError(f'{p}.role: must be one of {", ".join(ROLES)}')
        for field in ('dataset', 'version', 'url', 'licence', 'citation'):
            if not isinstance(entry[field], str) or not entry[field].strip():
                raise IngestError(f'{p}.{field}: required text (copy it from the UCDP page as read)')
        if not isinstance(entry['provisional'], bool):
            raise IngestError(f'{p}.provisional: must be true (Candidate release) or false (annual release)')
        if entry['doi'] is not None and (not isinstance(entry['doi'], str) or not entry['doi'].startswith('10.')):
            raise IngestError(f'{p}.doi: must be null or a DOI such as 10.1177/0022343313484347')
        if parse_day(entry['covers_through']) is None:
            raise IngestError(f'{p}.covers_through: requires the last day the file covers (YYYY-MM-DD)')
        timestamp(entry['downloaded_at'], p + '.downloaded_at')
        file_path = Path(entry['path'])
        if not file_path.is_absolute():
            file_path = path.parent / file_path
        if not file_path.is_file():
            raise IngestError(f'{p}.path: file not found: {file_path}')
        source_id = slug('ucdp', entry['role'], 'candidate' if entry['provisional'] else None, entry['version'])
        inputs.append({**entry, 'file': file_path, 'source_id': source_id, 'order': i})
    if not any(entry['role'] == 'ged' for entry in inputs):
        raise IngestError(f'{path}: at least one GED file (role "ged") is required')
    if not any(entry['role'] == 'acd' for entry in inputs):
        raise IngestError(f'{path}: the UCDP/PRIO Armed Conflict Dataset (role "acd") is required to classify state-based conflicts')
    ids = [entry['source_id'] for entry in inputs]
    if len(set(ids)) != len(ids):
        raise IngestError(f'{path}: two files resolve to the same source id (same role, version and provisional flag)')
    return inputs


def open_csv(entry):
    try:
        handle = open(entry['file'], newline='', encoding='utf-8-sig')
    except OSError as exc:
        raise IngestError(f'{entry["file"]}: {exc}') from exc
    reader = csv.DictReader(handle)
    if not reader.fieldnames:
        handle.close()
        raise IngestError(f'{entry["file"]}: empty file or no header row')
    return handle, reader


def require_columns(reader, required, entry):
    missing = [column for column in required if column not in reader.fieldnames]
    if missing:
        raise IngestError(f'{entry["file"]}: missing column(s) {", ".join(missing)}; confirm the {entry["dataset"]} {entry["version"]} '
                          'codebook and rename nothing by hand')


# ---------------------------------------------------------------- readers

def read_ged(entry, window, warnings):
    """Event rows from one GED file, restricted to the window's calendar years. Forbidden columns are never read."""
    start, end = window
    handle, reader = open_csv(entry)
    rows, read_count = {}, 0
    with handle:
        require_columns(reader, GED_REQUIRED, entry)
        has_active = 'active_year' in reader.fieldnames
        for n, row in enumerate(reader, start=2):
            read_count += 1
            where = f'{entry["file"].name}:{n}'
            year = parse_int(row['year'])
            if year is None or year < start.year or year > end.year:
                continue
            event_id = str(row['id']).strip()
            tov = parse_int(row['type_of_violence'])
            conflict_id = parse_int(row['conflict_new_id'])
            date_start, date_end = parse_day(row['date_start']), parse_day(row['date_end'])
            best, low, high = (parse_int(row[k]) for k in ('best', 'low', 'high'))
            prec = parse_int(row['date_prec'])
            if not event_id or tov not in TYPE_OF_VIOLENCE or conflict_id is None or date_start is None or date_end is None:
                warnings.append(f'{where}: skipped (unreadable id, type_of_violence, conflict_new_id or dates)')
                continue
            if None in (best, low, high) or best < 0 or low < 0 or high < 0:
                warnings.append(f'{where}: skipped event {event_id} (best/low/high not all non-negative integers)')
                continue
            if not low <= best <= high:
                warnings.append(f'{where}: skipped event {event_id} (low <= best <= high violated: {low}/{best}/{high})')
                continue
            if date_start > end:
                warnings.append(f'{where}: skipped event {event_id} dated {date_start} after the window end {end}')
                continue
            if date_end < date_start:
                warnings.append(f'{where}: event {event_id} has date_end before date_start; using date_start')
                date_end = date_start
            if date_end > end:
                warnings.append(f'{where}: event {event_id} date_end {date_end} clamped to the window end {end}')
                date_end = end
            event = {
                'id': event_id, 'year': year, 'tov': tov, 'conflict_id': conflict_id, 'conflict_name': str(row['conflict_name']).strip(),
                'dyad_id': parse_int(row['dyad_new_id']), 'side_a': str(row['side_a']).strip(), 'side_b': str(row['side_b']).strip(),
                'country': str(row['country']).strip(), 'gw': parse_int(row['country_id']), 'prec': prec if prec in DATE_PRECISION else None,
                'date_start': date_start, 'date_end': date_end, 'best': best, 'low': low, 'high': high,
                'active_year': parse_int(row['active_year']) if has_active else None, 'source_id': entry['source_id'],
                'provisional': entry['provisional'], 'covers_through': parse_day(entry['covers_through']), 'order': entry['order'],
            }
            rows[event_id] = event
    return rows, read_count


def read_acd(entry):
    """Conflict-year rows → {conflict_id: {years: {year: {...}}, location, side_a, side_b, start_date, start_date2}}."""
    handle, reader = open_csv(entry)
    conflicts, read_count = {}, 0
    with handle:
        require_columns(reader, ACD_REQUIRED, entry)
        for n, row in enumerate(reader, start=2):
            read_count += 1
            conflict_id, year = parse_int(row['conflict_id']), parse_int(row['year'])
            if conflict_id is None or year is None:
                raise IngestError(f'{entry["file"].name}:{n}: conflict_id and year must be integers')
            intensity, type_of_conflict = parse_int(row['intensity_level']), parse_int(row['type_of_conflict'])
            if intensity not in INTENSITY or type_of_conflict not in TYPE_OF_CONFLICT:
                raise IngestError(f'{entry["file"].name}:{n}: intensity_level must be 1 or 2 and type_of_conflict 1–4')
            record = conflicts.setdefault(conflict_id, {'years': {}, 'location': str(row['location']).strip(), 'side_a': str(row['side_a']).strip(),
                                                        'side_b': str(row['side_b']).strip(), 'start_date': parse_day(row['start_date']),
                                                        'start_date2': parse_day(row['start_date2']), 'source_id': entry['source_id']})
            record['years'][year] = {'intensity_level': intensity, 'type_of_conflict': type_of_conflict}
    latest_year = max((year for c in conflicts.values() for year in c['years']), default=None)
    return conflicts, latest_year, read_count


def read_brd(entry):
    """Conflict-level yearly figures → {(conflict_id, year): {best, low, high}}."""
    handle, reader = open_csv(entry)
    figures, read_count = {}, 0
    with handle:
        require_columns(reader, BRD_REQUIRED, entry)
        for n, row in enumerate(reader, start=2):
            read_count += 1
            key = (parse_int(row['conflict_id']), parse_int(row['year']))
            best, low, high = (parse_int(row[k]) for k in ('bd_best', 'bd_low', 'bd_high'))
            if None in key or None in (best, low, high) or not 0 <= low <= best <= high:
                raise IngestError(f'{entry["file"].name}:{n}: bd_low <= bd_best <= bd_high must hold with integer conflict_id and year')
            if key in figures:
                raise IngestError(f'{entry["file"].name}:{n}: duplicate conflict-year {key}; use the conflict-level file, not the dyad-level one')
            figures[key] = {'best': best, 'low': low, 'high': high, 'source_id': entry['source_id'],
                            'covers_through': parse_day(entry['covers_through']), 'provisional': entry['provisional']}
    return figures, read_count


# ---------------------------------------------------------------- countries

def load_catalog(path):
    """public/countries.json → {normalised name: code}; None when no catalog is given."""
    if not path:
        return {}
    try:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        raise IngestError(f'{path}: {exc}') from exc
    if not isinstance(data, list):
        raise IngestError(f'{path}: expected the countries.json array')
    return {normalize(entry['name']): entry['code'] for entry in data if isinstance(entry, dict) and entry.get('code') and entry.get('name')}


def load_extra_map(path):
    if not path:
        return {}
    try:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        raise IngestError(f'{path}: {exc}') from exc
    if not isinstance(data, dict) or not all(isinstance(v, str) and re.fullmatch(r'[A-Z]{2}', v) for v in data.values()):
        raise IngestError(f'{path}: expected {{"<GW number or UCDP country name>": "<ISO2>"}}')
    return {normalize(k): v for k, v in data.items()}


def country_code(name, gw, catalog, extra):
    key = normalize(name)
    for table, lookup in ((extra, str(gw) if gw is not None else None), (extra, key)):
        if lookup is not None and lookup in table:
            return table[lookup]
    if gw in GW_TO_ISO2:
        return GW_TO_ISO2[gw]
    if key in UCDP_NAME_TO_ISO2:
        return UCDP_NAME_TO_ISO2[key]
    return catalog.get(key)


# ---------------------------------------------------------------- aggregation

def dedupe(ged_rows_by_file):
    """One row per GED event id: an annual (non-provisional) row beats a candidate row; later releases beat earlier ones."""
    events = {}
    for rows in ged_rows_by_file:
        for event_id, event in rows.items():
            current = events.get(event_id)
            if current is None:
                events[event_id] = event
            elif current['provisional'] and not event['provisional']:
                events[event_id] = event            # the annual release beats a candidate row
            elif current['provisional'] == event['provisional'] and event['order'] > current['order']:
                events[event_id] = event            # a later release beats an earlier one
    return events


def source_entries(inputs, hashes, rows_read):
    entries = []
    for entry in inputs:
        entries.append({
            'id': entry['source_id'], 'dataset': entry['dataset'], 'version': entry['version'], 'provisional': entry['provisional'],
            'url': entry['url'], 'publisher': PUBLISHER, 'licence': entry['licence'], 'citation': entry['citation'], 'doi': entry['doi'],
            'downloaded_at': entry['downloaded_at'], 'covers_through': entry['covers_through'], 'sha256': hashes[entry['source_id']],
            'rows_read': rows_read[entry['source_id']],
        })
    return entries


def aggregate(events, acd, acd_latest_year, brd, window, sources, catalog, extra_map, include_non_state=False, include_one_sided=False):
    """Conflict records from deduplicated GED events plus ACD and BRD. Returns (records, excluded, warnings)."""
    start, end = window
    warnings, excluded, records = [], [], []
    by_conflict = defaultdict(list)
    for event in events.values():
        by_conflict[event['conflict_id']].append(event)
    source_by_id = {s['id']: s for s in sources}
    for conflict_id in sorted(by_conflict):
        rows = sorted(by_conflict[conflict_id], key=lambda e: (e['date_start'], e['id']))
        name = rows[-1]['conflict_name']
        in_window = [e for e in rows if start <= e['date_start'] <= end]
        if not in_window:
            excluded.append({'conflict_id': conflict_id, 'conflict_name': name, 'reason': f'no UCDP event dated between {start} and {end}'})
            continue
        tov = rows[-1]['tov']
        acd_row = acd.get(conflict_id)
        if tov == 1:
            if not acd_row:
                excluded.append({'conflict_id': conflict_id, 'conflict_name': name,
                                 'reason': 'state-based in GED but absent from the supplied Armed Conflict Dataset, so interstate/intrastate '
                                           'cannot be classified; supply the ACD release that covers it, or report it as unclassified'})
                continue
            type_of_conflict = acd_row['years'][max(acd_row['years'])]['type_of_conflict']
            if type_of_conflict not in KIND_BY_TYPE_OF_CONFLICT:
                excluded.append({'conflict_id': conflict_id, 'conflict_name': name, 'reason': f'UCDP type_of_conflict {type_of_conflict} is outside this layer'})
                continue
            kind = KIND_BY_TYPE_OF_CONFLICT[type_of_conflict]
        elif tov == 2:
            if not include_non_state:
                excluded.append({'conflict_id': conflict_id, 'conflict_name': name, 'reason': 'non-state conflict; outside the default scope (--include-non-state)'})
                continue
            kind, type_of_conflict = KINDS['non-state'], None
        else:
            if not include_one_sided:
                excluded.append({'conflict_id': conflict_id, 'conflict_name': name, 'reason': 'one-sided violence; outside the default scope (--include-one-sided)'})
                continue
            kind, type_of_conflict = KINDS['one-sided'], None

        countries, seen = [], set()
        for event in in_window:
            if event['country'] in seen:
                continue
            seen.add(event['country'])
            code = country_code(event['country'], event['gw'], catalog, extra_map)
            if code is None:
                warnings.append(f'conflict {conflict_id}: UCDP country "{event["country"]}" (GW {event["gw"]}) has no ISO code in the tables; emitted with code null')
            countries.append({'code': code, 'ucdp_name': event['country']})
        countries.sort(key=lambda c: (c['code'] or '~', c['ucdp_name']))

        side_a = sorted({e['side_a'] for e in rows if e['side_a']})
        side_b = sorted({e['side_b'] for e in rows if e['side_b']})
        dyads = sorted({e['dyad_id'] for e in rows if e['dyad_id'] is not None})

        # Calendar-year figures use every event of that year in the supplied files (a yearly figure is a yearly figure,
        # whatever the window start); the window only decides which conflicts are included.
        fatalities = []
        for year in sorted({e['year'] for e in rows}):
            year_rows = [e for e in rows if e['year'] == year]
            figure = brd.get((conflict_id, year)) if tov == 1 else None
            if figure:
                fatalities.append({'year': year, 'low': figure['low'], 'best': figure['best'], 'high': figure['high'], 'estimator': 'UCDP BRD',
                                   'provisional': figure['provisional'], 'through': min(figure['covers_through'], date(year, 12, 31)).isoformat(),
                                   'events': len(year_rows), 'source_ids': [figure['source_id']]})
                continue
            source_ids = sorted({e['source_id'] for e in year_rows})
            through = min(max(e['covers_through'] for e in year_rows), date(year, 12, 31), end)
            fatalities.append({'year': year, 'low': sum(e['low'] for e in year_rows), 'best': sum(e['best'] for e in year_rows),
                               'high': sum(e['high'] for e in year_rows), 'estimator': 'UCDP GED',
                               'provisional': any(e['provisional'] for e in year_rows), 'through': through.isoformat(),
                               'events': len(year_rows), 'source_ids': source_ids})

        latest = max(in_window, key=lambda e: (e['date_end'], e['id']))
        latest_evidence = latest['date_end']
        precision = DATE_PRECISION.get(latest['prec'], 'unknown')

        active_years = sorted(y for y in (acd_row['years'] if acd_row else {}) if start.year <= y <= end.year)
        candidate_rows = [e for e in rows if e['provisional'] and (acd_latest_year is None or e['year'] > acd_latest_year)]
        latest_month = max((e['date_end'] for e in candidate_rows), default=None)
        acd_source = [acd_row['source_id']] if acd_row else []
        if candidate_rows:
            basis = 'ucdp-candidate-events'
            text = (f'Provisional UCDP Candidate events recorded through {latest_month.strftime("%b %Y")}, subject to revision'
                    + (f'; recorded as active by UCDP in {", ".join(map(str, active_years))}' if active_years else '')
                    + '. This atlas does not know whether fighting is taking place today.')
            basis_sources = sorted({e['source_id'] for e in candidate_rows}) + acd_source
        elif acd_row and acd_latest_year in acd_row['years']:
            basis = 'ucdp-active-year'
            text = (f'Recorded as active by UCDP in {", ".join(map(str, active_years))} (at least 25 battle-related deaths in the calendar year). '
                    'This atlas does not know whether fighting is taking place today.')
            basis_sources = acd_source
        else:
            basis = 'ucdp-not-in-latest-year'
            text = ((f'Not recorded by UCDP as active in {acd_latest_year}. ' if acd_latest_year else 'No conflict-year record supplied. ')
                    + 'Absence from the dataset is not evidence of peace; UCDP events below the yearly threshold may still exist.')
            basis_sources = acd_source

        type_label = TYPE_OF_CONFLICT.get(type_of_conflict) if type_of_conflict else TYPE_OF_VIOLENCE[tov]
        kind_text = (f'UCDP type_of_violence {tov} ({TYPE_OF_VIOLENCE[tov]})'
                     + (f'; type_of_conflict {type_of_conflict} ({type_label}) in the Armed Conflict Dataset for {max(acd_row["years"])}' if acd_row else '')
                     + '. Coded by UCDP, not by this atlas.')
        provisional_years = sum(1 for f in fatalities if f['provisional'])
        record = {
            'id': slug('ucdp', str(conflict_id)),
            'kind': kind,
            'kind_basis': {'method': 'ucdp-coding', 'text': kind_text, 'source_ids': sorted({e['source_id'] for e in rows}) + acd_source},
            'ucdp': {'conflict_id': conflict_id, 'conflict_name': name, 'type_of_violence': tov, 'type_of_violence_label': TYPE_OF_VIOLENCE[tov],
                     'type_of_conflict': type_of_conflict, 'type_label': type_label, 'dyad_ids': dyads,
                     'location': acd_row['location'] if acd_row else None},
            'countries': countries,
            'parties': {'side_a': side_a, 'side_b': side_b},
            'start': {'ucdp_start_date': acd_row['start_date'].isoformat() if acd_row and acd_row['start_date'] else None,
                      'ucdp_start_date2': acd_row['start_date2'].isoformat() if acd_row and acd_row['start_date2'] else None,
                      'first_event_in_window': in_window[0]['date_start'].isoformat()},
            'latest_evidence': latest_evidence.isoformat(),
            'latest_evidence_precision': precision,
            'fatalities': fatalities,
            'status_basis': {'basis': basis, 'active_years': active_years, 'latest_month': latest_month.strftime('%Y-%m') if latest_month else None,
                             'text': text, 'source_ids': sorted(set(basis_sources))},
            'sources': [source_by_id[s] for s in sorted({e['source_id'] for e in rows} | set(acd_source) | {f['source_ids'][0] for f in fatalities})],
            'verification': {'level': 'republished-dataset',
                             'note': 'Re-published from UCDP files by an offline, AI-assisted aggregation. No human editorial review, and UCDP\'s '
                                     'own coding was not re-checked by this atlas. Figures are UCDP best, low and high estimates per calendar year.'},
            'note': (f'Parties and country placement as coded by UCDP for events dated {in_window[0]["date_start"].isoformat()} to '
                     f'{latest_evidence.isoformat()} (latest event precision: {precision}). Yearly figures cover whole calendar years from the '
                     f'supplied files, {provisional_years} of {len(fatalities)} from provisional Candidate data; a missing year is not recorded, '
                     'not zero. No coordinates, sub-national places or individuals are included. This is not a front line and not a rating.'),
        }
        records.append(record)
    return records, excluded, warnings


# ---------------------------------------------------------------- envelope and self-check

def build(manifest_path, window_start=DEFAULT_WINDOW_START, window_end=None, countries_path=None, country_map_path=None,
          include_non_state=False, include_one_sided=False, generated_at=None):
    now = utc_now()
    start = parse_day(window_start)
    end = parse_day(window_end) if window_end else now.date()
    if start is None or end is None or start > end:
        raise IngestError('window: --window-start and --window-end must be ISO days with start <= end')
    if end > now.date():
        raise IngestError(f'window: --window-end {end} is after today {now.date()}; a window never ends in the future')
    generated = timestamp(generated_at, 'generated_at') if generated_at else now
    inputs = read_manifest(manifest_path)
    catalog, extra_map = load_catalog(countries_path), load_extra_map(country_map_path)
    warnings, hashes, rows_read = [], {}, {}
    ged_rows, acd, acd_latest_year, brd = [], {}, None, {}
    for entry in sorted(inputs, key=lambda e: e['order']):
        hashes[entry['source_id']] = sha256_of(entry['file'])
        if entry['role'] == 'ged':
            rows, count = read_ged(entry, (start, end), warnings)
            ged_rows.append(rows)
        elif entry['role'] == 'acd':
            if acd:
                raise IngestError('manifest: supply exactly one Armed Conflict Dataset file')
            acd, acd_latest_year, count = read_acd(entry)
        else:
            if brd:
                raise IngestError('manifest: supply at most one Battle-Related Deaths file')
            brd, count = read_brd(entry)
        rows_read[entry['source_id']] = count
    sources = source_entries(inputs, hashes, rows_read)
    events = dedupe(ged_rows)
    records, excluded, more = aggregate(events, acd, acd_latest_year, brd, (start, end), sources, catalog, extra_map, include_non_state, include_one_sided)
    warnings.extend(more)
    provisional_months = [f['through'][:7] for r in records for f in r['fatalities'] if f['provisional']]
    versions = ', '.join(f'{s["dataset"]} {s["version"]}' for s in sources)
    licences = sorted({s['licence'] for s in sources})
    envelope = {
        'schema_version': SCHEMA_VERSION,
        'publication': 'candidate',
        'generated_at': generated.isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'window': {'start': start.isoformat(), 'end': end.isoformat(), 'first_year': start.year, 'last_year': end.year,
                   'last_provisional_month': max(provisional_months) if provisional_months else None},
        'inputs': sources,
        'licence_note': 'Re-published UCDP data under the terms stated on the UCDP download pages at download time: ' + '; '.join(licences)
                        + '. Attribution and the citation UCDP requests accompany every record.',
        'method_note': (f'Re-published UCDP data, {versions}. Conflicts are included when at least one UCDP event is dated inside the window; '
                        'yearly figures are UCDP best, low and high estimates per calendar year (Battle-Related Deaths figures where supplied, '
                        'otherwise sums of GED events), with provisional Candidate months marked. Country placement follows UCDP\'s location '
                        'field. No event coordinates, sub-national places, individuals or Protest Atlas research are included. Absence of a '
                        'country or a year is a threshold and coverage fact, not evidence of peace.'),
        'counts': {'ged_events_read': sum(rows_read[s['id']] for s in sources if s['id'].startswith('ucdp-ged')),
                   'ged_events_in_years': len(events), 'conflicts_emitted': len(records), 'conflicts_excluded': len(excluded)},
        'excluded': excluded,
        'warnings': warnings,
        'records': records,
    }
    check_candidates(envelope)
    return envelope


def _check_keys(value, path, errors):
    if isinstance(value, dict):
        for key, child in value.items():
            if forbidden_key(key):
                errors.append(f'{path}.{key}: forbidden field name')
            _check_keys(child, f'{path}.{key}', errors)
    elif isinstance(value, list):
        for i, child in enumerate(value):
            _check_keys(child, f'{path}[{i}]', errors)
    elif isinstance(value, str) and COORDINATE_LIKE.search(value):
        errors.append(f'{path}: coordinate-like text')


def check_candidates(data):
    """Exact keys, forbidden names, bounds and dates. A draft of what scripts/validate_conflicts.py should enforce."""
    errors = []

    def exact(value, fields, path):
        if not isinstance(value, dict) or set(value) != set(fields):
            errors.append(f'{path}: fields must be exactly {", ".join(fields)}')
            return False
        return True

    if exact(data, ENVELOPE_FIELDS, 'conflicts'):
        exact(data['window'], WINDOW_FIELDS, 'conflicts.window')
        if data['publication'] != 'candidate':
            errors.append('conflicts.publication: this file holds candidates only; publishing is a separate, reviewed step')
        if data['schema_version'] != SCHEMA_VERSION:
            errors.append('conflicts.schema_version: unsupported')
        source_ids = set()
        for i, source in enumerate(data.get('inputs', [])):
            if exact(source, SOURCE_FIELDS, f'conflicts.inputs[{i}]'):
                source_ids.add(source['id'])
                if not str(source['url']).startswith('https://'):
                    errors.append(f'conflicts.inputs[{i}].url: requires https')
        ids = set()
        for i, record in enumerate(data.get('records', [])):
            p = f'conflicts.records[{i}]'
            if not exact(record, RECORD_FIELDS, p):
                continue
            if record['id'] in ids:
                errors.append(f'{p}.id: duplicate {record["id"]}')
            ids.add(record['id'])
            if record['kind'] not in KINDS.values():
                errors.append(f'{p}.kind: unsupported kind {record["kind"]}')
            exact(record['kind_basis'], KIND_BASIS_FIELDS, p + '.kind_basis')
            exact(record['ucdp'], UCDP_FIELDS, p + '.ucdp')
            exact(record['parties'], PARTIES_FIELDS, p + '.parties')
            exact(record['start'], START_FIELDS, p + '.start')
            exact(record['verification'], VERIFICATION_FIELDS, p + '.verification')
            if not record['countries']:
                errors.append(f'{p}.countries: at least one UCDP location country is required')
            for j, country in enumerate(record['countries']):
                if exact(country, COUNTRY_FIELDS, f'{p}.countries[{j}]'):
                    if country['code'] is not None and not re.fullmatch(r'[A-Z]{2}', str(country['code'])):
                        errors.append(f'{p}.countries[{j}].code: ISO2 or null')
            if parse_day(record['latest_evidence']) is None:
                errors.append(f'{p}.latest_evidence: ISO day required')
            if not record['fatalities']:
                errors.append(f'{p}.fatalities: at least one calendar year is required')
            for j, figure in enumerate(record['fatalities']):
                q = f'{p}.fatalities[{j}]'
                if not exact(figure, FATALITY_FIELDS, q):
                    continue
                if not all(isinstance(figure[k], int) for k in ('year', 'low', 'best', 'high')) or not 0 <= figure['low'] <= figure['best'] <= figure['high']:
                    errors.append(f'{q}: integers with low <= best <= high are required; a single figure without bounds is not accepted')
                if figure['estimator'] not in ESTIMATORS:
                    errors.append(f'{q}.estimator: must be one of {", ".join(ESTIMATORS)}')
                if not figure['source_ids'] or not set(figure['source_ids']) <= source_ids:
                    errors.append(f'{q}.source_ids: must cite the dataset entries in conflicts.inputs')
            if exact(record['status_basis'], STATUS_BASIS_FIELDS, p + '.status_basis') and record['status_basis']['basis'] not in STATUS_BASES:
                errors.append(f'{p}.status_basis.basis: unsupported')
            for j, source in enumerate(record['sources']):
                exact(source, SOURCE_FIELDS, f'{p}.sources[{j}]')
            # Editorial §4.3/§4.5 words that must never describe a conflict record (negations such as "not a front
            # line" are allowed, so "front" is not on this list; the UI copy test covers it).
            for text_field in ('note',):
                for banned in ('ongoing', 'casualt', 'death toll', 'hotspot', 'escalat', 'so far', 'to date'):
                    if banned in str(record[text_field]).lower():
                        errors.append(f'{p}.{text_field}: banned wording "{banned}"')
        _check_keys(data, 'conflicts', errors)
    if errors:
        raise IngestError('candidate check failed:\n  ' + '\n  '.join(errors[:40]))
    return data


# ---------------------------------------------------------------- CLI

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--inputs', required=True, help='download manifest JSON (see MANIFEST_FIELDS); paths resolve relative to it')
    parser.add_argument('--out', required=True, help='output path, normally research/round5/conflicts.candidates.json')
    parser.add_argument('--window-start', default=DEFAULT_WINDOW_START)
    parser.add_argument('--window-end', default=None, help='ISO day; default today UTC; never in the future')
    parser.add_argument('--countries', default=None, help='public/countries.json, for exact-name fallback mapping')
    parser.add_argument('--country-map', default=None, help='JSON {"<GW number or UCDP name>": "<ISO2>"} overriding the built-in tables')
    parser.add_argument('--include-non-state', action='store_true')
    parser.add_argument('--include-one-sided', action='store_true')
    parser.add_argument('--generated-at', default=None, help='fixed generated_at for reproducible runs (tests)')
    args = parser.parse_args(argv)
    try:
        envelope = build(args.inputs, args.window_start, args.window_end, args.countries, args.country_map,
                         args.include_non_state, args.include_one_sided, args.generated_at)
    except IngestError as exc:
        parser.exit(1, f'Ingest failed: {exc}\n')
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(envelope, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    counts = envelope['counts']
    print(f'Wrote {out}: {counts["conflicts_emitted"]} conflict candidates, {counts["conflicts_excluded"]} excluded, '
          f'{len(envelope["warnings"])} warnings. Candidates only; a gate review and a separate publish step follow.')
    for warning in envelope['warnings']:
        print('warning:', warning, file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
