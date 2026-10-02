#!/usr/bin/env python3
"""Validate historical publication provenance; source truth still needs editorial review."""
from datetime import datetime, timezone
from decimal import Decimal
import math
from pathlib import Path
import re

from validate_data import (ROOT, ValidationError, array, https_url, load_json, moment,
                           obj, refs, require, text, validate_countries)

WINDOW_START = '2024-01-01'
# Earliest research window end. Later sweeps move window_end forward (never into the future).
WINDOW_END = '2026-10-02'


def _window(data, path, now):
    require(type(data['schema_version']) is int and data['schema_version'] == 1,
            path, 'unsupported schema')
    end = data['window_end']
    require(data['window_start'] == WINDOW_START and isinstance(end, str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', end))
            and end >= WINDOW_END, path, 'research window must start 2024-01-01 and end on or after 2026-10-02')
    moment(data['window_start'], path + '.window_start', now)
    moment(end, path + '.window_end', now)
    return end


def _day(value, path, now, nullable=False, end=WINDOW_END):
    if value is None and nullable:
        return None
    require(isinstance(value, str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)),
            path, 'requires an ISO day')
    day = moment(value, path, now).date()
    require(WINDOW_START <= value <= end, path, 'date outside research window')
    return day


def _timestamp(value, path, now):
    require(isinstance(value, str) and 'T' in value, path, 'actual timezone-qualified timestamp required')
    return moment(value, path, now)


def validate_context(data, events, now=None):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'window_start', 'window_end', 'records'), 'context')
    window_end = _window(data, 'context', now)
    event_map = {}
    all_sources = set()
    for event in events['events']:
        require(event['id'] not in event_map, 'events', 'duplicate event ID')
        event_map[event['id']] = event
        # Ongoing is allowed only with sourced status evidence; the browser still ages it after 72 hours.
        require(event['status'] in {'unknown', 'ended', 'ongoing'}, event['id'],
                'publication requires unknown, evidence-backed ended or evidence-backed ongoing status')
        for field in ('start_date', 'end_date', 'last_observed_at'):
            _day(event[field], event['id'] + '.' + field, now, nullable=field != 'last_observed_at', end=window_end)
        for source in event['sources']:
            require(source['id'] not in all_sources, event['id'], 'source IDs must be globally unique')
            all_sources.add(source['id'])
    seen = set()
    for i, record in enumerate(array(data['records'], 'context.records')):
        p = f'context.records[{i}]'
        obj(record, ('event_id', 'episode_scope', 'cities', 'status_basis', 'outcome_status', 'outcomes', 'research_note'), p)
        key = record['event_id']
        require(isinstance(key, str) and key in event_map and key not in seen, p, 'unknown or duplicate event context')
        seen.add(key)
        event = event_map[key]
        sources = {source['id']: source for source in event['sources']}
        source_ids = set(sources)
        verified = moment(event['last_verified'], p + '.event.last_verified', now)
        for field in ('episode_scope', 'research_note'):
            text(record[field], p + '.' + field)
        names = set()
        for j, city in enumerate(array(record['cities'], p + '.cities')):
            q = f'{p}.cities[{j}]'
            obj(city, ('name', 'source_ids'), q)
            text(city['name'], q + '.name', 200)
            require(city['name'] == city['name'].strip() and city['name'].casefold() not in names,
                    q, 'duplicate or whitespace-padded city')
            names.add(city['name'].casefold())
            refs(city['source_ids'], source_ids, q)
        basis = record['status_basis']
        obj(basis, ('text', 'source_ids'), p + '.status_basis')
        text(basis['text'], p + '.status_basis.text')
        array(basis['source_ids'], p + '.status_basis.source_ids')
        if basis['source_ids'] or event['status'] != 'unknown':
            refs(basis['source_ids'], source_ids, p + '.status_basis')
        if event['status'] == 'ended':
            end = _day(event['end_date'], p + '.end_date', now, end=window_end)
            for ref in basis['source_ids']:
                checked = moment(sources[ref]['accessed_at'], p + '.status_source.accessed_at', now)
                require(end <= checked.date(), p, 'end occurs after status evidence check')
        else:
            require(event['end_date'] is None, p, 'unknown or ongoing status must not imply a known end date')
        require(record['outcome_status'] in ('documented', 'not-established'), p, 'unsupported outcome status')
        outcomes = array(record['outcomes'], p + '.outcomes')
        require(bool(outcomes) == (record['outcome_status'] == 'documented'), p, 'outcome status contradicts outcomes')
        for j, outcome in enumerate(outcomes):
            q = f'{p}.outcomes[{j}]'
            obj(outcome, ('date', 'summary', 'favours', 'causality', 'source_ids'), q)
            text(outcome['summary'], q + '.summary')
            require(outcome['causality'] in ('reported-link', 'not-established'), q, 'unsupported causal attribution')
            refs(outcome['source_ids'], source_ids, q)
            day = _day(outcome['date'], q + '.date', now, nullable=True, end=window_end)
            if day:
                require(day <= verified.date(), q, 'outcome occurs after event verification')
                if event['start_date']:
                    require(day >= moment(event['start_date'], q, now).date(), q, 'outcome precedes scoped episode')
                for ref in outcome['source_ids']:
                    checked = moment(sources[ref]['accessed_at'], q + '.source.accessed_at', now)
                    require(day <= checked.date(), q, 'outcome occurs after cited source check')
            for k, effect in enumerate(array(outcome['favours'], q + '.favours')):
                r = f'{q}.favours[{k}]'
                obj(effect, ('actor', 'effect', 'basis', 'note'), r)
                for field in ('actor', 'note'):
                    text(effect[field], r + '.' + field)
                require(effect['effect'] in ('benefit', 'setback', 'mixed', 'unclear'), r, 'unsupported actor effect')
                require(effect['basis'] in ('explicit', 'inference'), r, 'effect needs explicit or inferred basis')
    require(seen == set(event_map), 'context', 'every public event needs exactly one context')
    return data


def validate_research_ledger(data, countries, now=None):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'window_start', 'window_end', 'generated_at', 'note', 'countries'), 'research-ledger')
    _window(data, 'research-ledger', now)
    generated = _timestamp(data['generated_at'], 'research-ledger.generated_at', now)
    text(data['note'], 'research-ledger.note')
    require(bool(re.search(r'not exhaustive|non[- ]exhaustive|not (?:a )?complete|initial.{0,40}screen', data['note'], re.I)),
            'research-ledger.note', 'must explicitly disclose limited/non-exhaustive screening')
    seen = set()
    for i, row in enumerate(array(data['countries'], 'research-ledger.countries')):
        p = f'research-ledger.countries[{i}]'
        obj(row, ('code', 'query', 'attempted_at', 'provider', 'status', 'result_count', 'candidate_urls', 'reviewed_urls', 'note'), p)
        code = row['code']
        require(isinstance(code, str) and code in countries and code not in seen, p, 'unknown or duplicate country')
        seen.add(code)
        for field in ('query', 'provider', 'note'):
            text(row[field], p + '.' + field)
        attempted = _timestamp(row['attempted_at'], p + '.attempted_at', now)
        require(attempted <= generated, p, 'search occurs after ledger generation')
        require(row['status'] in ('searched', 'search-failed'), p, 'only attempted screening states are supported')
        require(type(row['result_count']) is int and row['result_count'] >= 0, p, 'result count must be a nonnegative integer')
        for field in ('candidate_urls', 'reviewed_urls'):
            values = array(row[field], p + '.' + field)
            for url in values:
                https_url(url, p + '.' + field)
            require(len(values) == len(set(values)), p, 'duplicate URL within a source list')
        require(len(row['candidate_urls']) <= min(5, row['result_count']), p, 'candidate URL count exceeds results or five-item cap')
        if row['status'] == 'search-failed':
            require(row['result_count'] == 0 and not row['candidate_urls'] and not row['reviewed_urls'],
                    p, 'failed search cannot claim results or reviewed pages')
    require(seen == set(countries), 'research-ledger', 'every catalog country must appear exactly once')
    return data


def validate_cities(data, countries, events, context):
    obj(data, ('schema_version', 'source', 'source_url', 'source_sha256', 'precision', 'places', 'unmapped'), 'cities')
    require(type(data['schema_version']) is int and data['schema_version'] == 1, 'cities', 'unsupported schema')
    text(data['source'], 'cities.source')
    https_url(data['source_url'], 'cities.source_url')
    require(isinstance(data['source_sha256'], str) and bool(re.fullmatch(r'[a-f0-9]{64}', data['source_sha256'])),
            'cities', 'source SHA-256 required')
    text(data['precision'], 'cities.precision')
    require('reference' in data['precision'].lower() and any(word in data['precision'].lower() for word in ('coarse', 'generalized', 'rounded')),
            'cities.precision', 'must identify coarse city reference points')
    by_id = {event['id']: event for event in events['events']}
    expected = {f"{by_id[record['event_id']]['country']}:{city['name']}" for record in context['records'] for city in record['cities']}
    seen = set()
    for field in ('places', 'unmapped'):
        for i, place in enumerate(array(data[field], 'cities.' + field)):
            p = f'cities.{field}[{i}]'
            fields = ('id', 'country', 'name', 'lat', 'lon', 'source_name') if field == 'places' else ('id', 'country', 'name')
            obj(place, fields, p)
            text(place['name'], p + '.name', 200)
            require(isinstance(place['country'], str) and place['country'] in countries, p, 'unknown country')
            require(place['id'] == f"{place['country']}:{place['name']}" and place['id'] in expected and place['id'] not in seen,
                    p, 'unknown, duplicate or mismatched city reference')
            seen.add(place['id'])
            if field == 'places':
                text(place['source_name'], p + '.source_name', 200)
                for coordinate, bound in (('lat', 90), ('lon', 180)):
                    value = place[coordinate]
                    require(type(value) in (int, float) and math.isfinite(value) and -bound <= value <= bound,
                            p + '.' + coordinate, 'invalid coordinate')
                    require(Decimal(str(value)) * 10 == (Decimal(str(value)) * 10).to_integral_value(),
                            p + '.' + coordinate, 'city reference must be rounded to at most one decimal')
    require(seen == expected, 'cities', 'every cited city must be mapped or explicitly unmapped')
    return data


def validate_history_repository(root=ROOT, now=None):
    root = Path(root)
    now = now or datetime.now(timezone.utc)
    countries = validate_countries(load_json(root / 'public/countries.json'))
    events = load_json(root / 'public/events.json')
    context = validate_context(load_json(root / 'public/event-context.json'), events, now)
    ledger = validate_research_ledger(load_json(root / 'public/research-ledger.json'), countries, now)
    cities = validate_cities(load_json(root / 'public/cities.json'), countries, events, context)
    return {'context': context, 'ledger': ledger, 'cities': cities}


if __name__ == '__main__':
    validate_history_repository()
    print('Historical context, screening provenance and coarse city references validated.')
