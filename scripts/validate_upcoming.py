#!/usr/bin/env python3
"""Validate announced upcoming collective actions; an announcement is never an occurrence."""
from datetime import date, datetime, timezone
from pathlib import Path
import re

from validate_data import (ROOT, ValidationError, array, https_url, identifier, load_json, moment,
                           obj, refs, require, text, validate_countries)

ITEM_FIELDS = ('id', 'event_id', 'country', 'cities', 'action', 'announced_by', 'planned_start', 'planned_end',
               'date_precision', 'announcement', 'status', 'source_ids', 'sources', 'note')
SOURCE_FIELDS = ('id', 'url', 'title', 'publisher', 'published_at', 'accessed_at')
PRECISIONS = {'day', 'week', 'month', 'range'}
STATUSES = {'announced', 'postponed', 'cancelled'}
# Operational detail (clock times, assembly points, routes) does not belong in a public index.
OPERATIONAL = re.compile(r'\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:a\.m\.|p\.m\.|am|pm)(?=\W|$)'
                         r'|\b(?:assembly|meeting|gathering|muster) point\b|\bmeet(?:ing)? at\b'
                         r'|\b(?:march|protest|rally|procession) route\b|\broute of the (?:march|protest|rally)\b', re.I)


def _day(value, path):
    require(isinstance(value, str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)), path, 'requires an ISO day')
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError(f'{path}: invalid day') from exc


def validate_upcoming(data, countries, events, now=None):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'generated_at', 'note', 'items'), 'upcoming')
    require(type(data['schema_version']) is int and data['schema_version'] == 1, 'upcoming', 'unsupported schema')
    generated = moment(data['generated_at'], 'upcoming.generated_at', now)
    text(data['note'], 'upcoming.note')
    require(bool(re.search(r'not evidence|does not establish|no guarantee', data['note'], re.I)), 'upcoming.note',
            'must state that an announcement does not establish occurrence')
    event_ids = {event['id'] for event in events['events']}
    event_sources = {source['id'] for event in events['events'] for source in event['sources']}
    seen, seen_sources = set(), set()
    for i, item in enumerate(array(data['items'], 'upcoming.items')):
        p = f'upcoming.items[{i}]'
        obj(item, ITEM_FIELDS, p)
        identifier(item['id'], p + '.id')
        require(item['id'] not in seen, p, 'duplicate upcoming ID')
        seen.add(item['id'])
        require(item['event_id'] is None or item['event_id'] in event_ids, p, 'event_id must be null or a published episode')
        require(isinstance(item['country'], str) and item['country'] in countries, p, 'country absent from catalog')
        names = set()
        for j, city in enumerate(array(item['cities'], p + '.cities')):
            text(city, f'{p}.cities[{j}]', 200)
            require(city == city.strip() and city.casefold() not in names, p, 'duplicate or padded city')
            names.add(city.casefold())
        for field in ('action', 'announced_by', 'announcement', 'note'):
            text(item[field], p + '.' + field, 1200)
            require(not OPERATIONAL.search(item[field]), p + '.' + field,
                    'clock times, assembly points and routes are operational detail; keep city/date level')
        require(item['date_precision'] in PRECISIONS, p, 'unsupported date precision')
        start = _day(item['planned_start'], p + '.planned_start')
        end = None if item['planned_end'] is None else _day(item['planned_end'], p + '.planned_end')
        require(end is None or end >= start, p, 'planned end precedes planned start')
        require(item['date_precision'] != 'range' or end is not None, p, 'range precision needs planned_end')
        require(item['status'] in STATUSES, p, 'unsupported status; occurrence belongs in the event ledger')
        source_ids = set()
        published_days = []
        for j, source in enumerate(array(item['sources'], p + '.sources')):
            q = f'{p}.sources[{j}]'
            obj(source, SOURCE_FIELDS, q)
            identifier(source['id'], q + '.id')
            require(source['id'] not in source_ids and source['id'] not in seen_sources, q, 'duplicate source ID')
            require(source['id'] not in event_sources, q, 'upcoming source IDs must not collide with event source IDs')
            source_ids.add(source['id'])
            https_url(source['url'], q + '.url')
            text(source['title'], q + '.title')
            text(source['publisher'], q + '.publisher', 300)
            published = moment(source['published_at'], q + '.published_at', now, nullable=True)
            accessed = moment(source['accessed_at'], q + '.accessed_at', now)
            require('T' in source['accessed_at'], q, 'actual access timestamp required')
            require(accessed <= generated, q, 'source accessed after manifest generation')
            require(published is None or published.date() <= accessed.date(), q, 'publication occurs after access')
            if published is not None:
                published_days.append(published.date())
        seen_sources |= source_ids
        require(bool(source_ids), p, 'announcement needs at least one source')
        refs(item['source_ids'], source_ids, p + '.source_ids')
        require(set(item['source_ids']) == source_ids, p, 'every listed source must support the announcement')
        # The plan must have been ahead of its announcement; later reporting may be added.
        require(not published_days or min(published_days) <= (end or start), p,
                'earliest announcement source is dated after the planned action')
    return data


def validate_upcoming_repository(root=ROOT, now=None):
    root = Path(root)
    path = root / 'public/upcoming.json'
    if not path.exists():
        return None
    countries = validate_countries(load_json(root / 'public/countries.json'))
    return validate_upcoming(load_json(path), countries, load_json(root / 'public/events.json'), now)


if __name__ == '__main__':
    validate_upcoming_repository()
    print('Announced actions validated; announcements do not establish occurrence, size or legality.')
