#!/usr/bin/env python3
"""Validate the publication boundary using only Python's standard library."""
import argparse
from datetime import date, datetime, timezone
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,95}$")
STANCES = {"support", "oppose", "mixed", "unclear"}
PRECISIONS = {"city", "region", "country", "multi-location"}
# Kind of episode (4.1 SPEC §5.1, §6.1). Every public record carries a kind and the basis it rests on; nothing is ever
# derived from a title, id, issue, summary or intensity text. 'contract-default' is the round-3 research contract
# ("sourced collective-action episode"); any other event kind needs a source re-read with event-local source ids.
KINDS = ('collective-action', 'protest', 'strike', 'civil-unrest')
KIND_METHODS = ('contract-default', 'source-reread')          # + 'illustrative' only when illustrative=True


class ValidationError(ValueError):
    pass


def require(condition, path, message):
    if not condition:
        raise ValidationError(f"{path}: {message}")


def obj(value, fields, path):
    require(isinstance(value, dict), path, "must be an object")
    require(set(value) == set(fields), path,
            f"fields must be exactly {', '.join(fields)} (unknown/private fields forbidden)")


def text(value, path, maximum=4000):
    require(isinstance(value, str) and 0 < len(value.strip()) <= maximum, path, "must be nonempty text")
    require(not any(ord(c) < 32 and c not in '\n\t' for c in value), path, "control characters forbidden")


def array(value, path):
    require(isinstance(value, list), path, "must be an array")
    return value


def identifier(value, path):
    require(isinstance(value, str) and bool(ID.fullmatch(value)), path, "invalid lowercase slug ID")


def moment(value, path, now, nullable=False, future=False):
    if value is None and nullable:
        return None
    require(isinstance(value, str), path, "must be an ISO date or timezone-qualified timestamp")
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            result = datetime.combine(date.fromisoformat(value), datetime.min.time(), timezone.utc)
            require(future or result.date() <= now.date(), path, "future date forbidden")
        else:
            result = datetime.fromisoformat(value.replace('Z', '+00:00'))
            require(result.tzinfo is not None, path, "timestamp needs a timezone")
            result = result.astimezone(timezone.utc)
            require(future or result <= now, path, "future timestamp forbidden")
    except (ValueError, OverflowError) as exc:
        raise ValidationError(f"{path}: invalid date/timestamp") from exc
    return result


def https_url(value, path):
    text(value, path, 2000)
    try:
        url = urlsplit(value)
        require(url.scheme == 'https' and bool(url.hostname) and '.' in url.hostname,
                path, "requires an absolute HTTPS source URL")
        require(not url.username and not url.password and url.port in (None, 443), path,
                "URL credentials and nonstandard ports forbidden")
        require(not re.search(r"[\s\\]", value), path, "URL whitespace/backslashes forbidden")
    except ValueError as exc:
        raise ValidationError(f"{path}: invalid URL") from exc


def refs(value, source_ids, path):
    array(value, path)
    require(bool(value), path, "every claim needs at least one event-local source")
    require(all(isinstance(ref, str) and ref in source_ids for ref in value), path,
            "unknown or foreign event source reference")
    require(len(value) == len(set(value)), path, "duplicate source references")


def validate_countries(countries):
    array(countries, 'countries')
    codes = {}
    for i, country in enumerate(countries):
        p = f'countries[{i}]'
        obj(country, ('code', 'name', 'region'), p)
        require(isinstance(country['code'], str) and bool(re.fullmatch(r'[A-Z]{2}', country['code'])), p, "invalid country code")
        require(country['code'] not in codes, p, "duplicate country code")
        text(country['name'], p + '.name', 200)
        text(country['region'], p + '.region', 200)
        codes[country['code']] = country
    return codes


def validate_event(event, countries, now, path, illustrative=False):
    obj(event, ('id', 'title', 'country', 'country_name', 'region', 'location', 'issues',
                'start_date', 'start_date_precision', 'end_date', 'status', 'last_verified', 'last_observed_at', 'summary', 'positions',
                'intensity', 'state_response', 'sources', 'verification', 'timeline', 'kind', 'kind_basis'), path)
    identifier(event['id'], path + '.id')
    for field in ('title', 'country_name', 'region', 'summary'):
        text(event[field], path + '.' + field)
    require(isinstance(event['country'], str) and event['country'] in countries, path, 'country absent from catalog')
    country = countries[event['country']]
    require(event['country_name'] == country['name'] and event['region'] == country['region'], path,
            'country name/region disagree with catalog')
    obj(event['location'], ('label', 'precision'), path + '.location')
    text(event['location']['label'], path + '.location.label', 300)
    require(isinstance(event['location']['precision'], str) and event['location']['precision'] in PRECISIONS, path, 'exact participant locations forbidden')
    require(not re.search(r'\b\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}', event['location']['label']), path,
            'coordinate-like location forbidden')
    require(not re.search(r'\b\d+\s+.+\b(street|road|avenue|lane|drive|apartment|flat)\b', event['location']['label'], re.I), path,
            'street address location forbidden')
    require(bool(array(event['issues'], path + '.issues')), path, 'at least one issue required')
    for issue in event['issues']:
        text(issue, path + '.issues', 100)
    require(isinstance(event['status'], str) and event['status'] in {'planned', 'ongoing', 'ended', 'unknown'}, path, 'unsupported status')
    start = moment(event['start_date'], path + '.start_date', now, nullable=True, future=event['status'] == 'planned')
    require(event['start_date_precision'] == ('unknown' if start is None else 'day'), path, 'start date precision must agree with known/unknown onset')
    end = moment(event['end_date'], path + '.end_date', now, nullable=True, future=event['status'] == 'planned')
    verified = moment(event['last_verified'], path + '.last_verified', now, nullable=illustrative)
    observed = moment(event['last_observed_at'], path + '.last_observed_at', now, nullable=illustrative or event['status'] == 'planned')
    require(observed is None or verified is None or observed <= verified, path, 'observation occurs after verification')
    require(start is None or end is None or start <= end, path, 'end precedes start')
    require(event['status'] != 'ended' or end is not None, path, 'ended event needs an end date')
    require(event['status'] != 'ongoing' or end is None, path, 'ongoing event cannot have an end date')
    require(event['status'] != 'planned' or (start is not None and start.date() >= now.date()), path, 'planned event needs a current/future start date')
    if verified is not None and event['status'] != 'planned':
        require(start is None or start.date() <= verified.date(), path, 'start occurs after verification')
        require(end is None or end.date() <= verified.date(), path, 'end occurs after verification')
    source_ids = set()
    for i, source in enumerate(array(event['sources'], path + '.sources')):
        p = f'{path}.sources[{i}]'
        obj(source, ('id', 'url', 'title', 'publisher', 'published_at', 'accessed_at'), p)
        identifier(source['id'], p + '.id')
        require(source['id'] not in source_ids, p, 'duplicate source ID')
        source_ids.add(source['id'])
        https_url(source['url'], p + '.url')
        text(source['title'], p + '.title')
        text(source['publisher'], p + '.publisher', 300)
        published = moment(source['published_at'], p + '.published_at', now, nullable=True)
        accessed = moment(source['accessed_at'], p + '.accessed_at', now)
        require(published is None or published.date() <= accessed.date(), p, 'publication occurs after access')
        require(verified is None or accessed.date() <= verified.date(), p, 'source accessed after event verification')
    require(illustrative or bool(source_ids), path, 'public event needs sources')
    obj(event['verification'], ('level', 'note'), path + '.verification')
    levels = {'corroborated', 'single-source', 'contested'} | ({'illustrative'} if illustrative else set())
    require(isinstance(event['verification']['level'], str) and event['verification']['level'] in levels, path, 'unsupported verification level; discovery is not publishable')
    text(event['verification']['note'], path + '.verification.note')
    for i, position in enumerate(array(event['positions'], path + '.positions')):
        p = f'{path}.positions[{i}]'
        obj(position, ('actor', 'stance', 'target', 'claim', 'source_ids'), p)
        for field in ('actor', 'target', 'claim'):
            text(position[field], p + '.' + field)
        require(isinstance(position['stance'], str) and position['stance'] in STANCES, p, 'unsupported stance')
        array(position['source_ids'], p + '.source_ids')
        if not illustrative or position['source_ids']:
            refs(position['source_ids'], source_ids, p)
    obj(event['intensity'], ('turnout', 'disruption', 'violence', 'source_ids'), path + '.intensity')
    array(event['intensity']['source_ids'], path + '.intensity.source_ids')
    if event['intensity']['source_ids']:
        refs(event['intensity']['source_ids'], source_ids, path + '.intensity.source_ids')
    turnout = event['intensity']['turnout']
    obj(turnout, ('min', 'max', 'qualifier'), path + '.intensity.turnout')
    for field in ('min', 'max'):
        require(turnout[field] is None or (type(turnout[field]) is int and turnout[field] >= 0), path, 'turnout must be a nonnegative integer or null')
    require(turnout['min'] is None or turnout['max'] is None or turnout['min'] <= turnout['max'], path, 'turnout bounds contradictory')
    for field in ('disruption', 'violence'):
        text(event['intensity'][field], path + '.intensity.' + field)
    text(turnout['qualifier'], path + '.intensity.turnout.qualifier')
    if not event['intensity']['source_ids']:
        require(illustrative or (event['intensity']['disruption'].lower() == 'unknown' and event['intensity']['violence'].lower() == 'unknown'
                                and turnout['min'] is None and turnout['max'] is None), path,
                'described intensity requires event-local evidence')
    for i, response in enumerate(array(event['state_response'], path + '.state_response')):
        p = f'{path}.state_response[{i}]'
        obj(response, ('action', 'attribution', 'source_ids'), p)
        text(response['action'], p + '.action')
        text(response['attribution'], p + '.attribution')
        array(response['source_ids'], p + '.source_ids')
        if not illustrative or response['source_ids']:
            refs(response['source_ids'], source_ids, p)
    previous = None
    for i, item in enumerate(array(event['timeline'], path + '.timeline')):
        p = f'{path}.timeline[{i}]'
        obj(item, ('date', 'text', 'source_ids'), p)
        day = moment(item['date'], p + '.date', now, future=event['status'] == 'planned')
        require(previous is None or day >= previous, p, 'timeline must be chronological')
        require(verified is None or event['status'] == 'planned' or day.date() <= verified.date(), p, 'timeline occurs after verification')
        require(observed is None or event['status'] == 'planned' or day.date() <= observed.date(), p, 'timeline occurs after latest observation')
        previous = day
        text(item['text'], p + '.text')
        array(item['source_ids'], p + '.source_ids')
        if not illustrative or item['source_ids']:
            refs(item['source_ids'], source_ids, p)
    validate_kind(event, source_ids, path, illustrative)


def validate_kind(event, source_ids, path, illustrative=False):
    """4.1 §6.1: `kind` is one of KINDS and `kind_basis` says how it was set. The pipeline default is legal only for
    collective-action and cites nothing; a re-read kind must cite event-local sources; examples may be illustrative."""
    require(isinstance(event['kind'], str) and event['kind'] in KINDS, path, 'unsupported kind')
    obj(event['kind_basis'], ('method', 'text', 'source_ids'), path + '.kind_basis')
    basis = event['kind_basis']
    methods = KIND_METHODS + (('illustrative',) if illustrative else ())
    require(isinstance(basis['method'], str) and basis['method'] in methods, path, 'unsupported kind_basis.method')
    text(basis['text'], path + '.kind_basis.text', 600)
    array(basis['source_ids'], path + '.kind_basis.source_ids')
    if basis['method'] == 'contract-default':
        require(event['kind'] == 'collective-action', path, 'contract-default basis is legal only for collective-action')
        require(basis['source_ids'] == [], path, 'contract-default basis cites no source')
    elif basis['method'] == 'source-reread':
        refs(basis['source_ids'], source_ids, path + '.kind_basis')      # non-empty, event-local, no duplicates
    else:
        require(basis['source_ids'] == [], path, 'illustrative basis cites no source')


def validate_envelope(data, countries, now=None, illustrative=False):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'generated_at', 'last_editorial_review', 'coverage_note', 'events'), 'data')
    require(type(data['schema_version']) is int and data['schema_version'] == 1 or data['schema_version'] == '1.0', 'schema_version', 'unsupported version')
    generated = moment(data['generated_at'], 'generated_at', now)
    reviewed = moment(data['last_editorial_review'], 'last_editorial_review', now, nullable=True)
    require(reviewed is None or reviewed <= generated, 'data', 'review occurs after generation')
    text(data['coverage_note'], 'coverage_note')
    ids = set()
    for i, event in enumerate(array(data['events'], 'events')):
        p = f'events[{i}]'
        validate_event(event, countries, now, p, illustrative)
        require(event['id'] not in ids, p, 'duplicate event ID')
        ids.add(event['id'])
        require(illustrative or reviewed is not None, p, 'public events require an editorial review date')
        if reviewed is not None and event['last_verified'] is not None:
            verified = moment(event['last_verified'], p + '.last_verified', now)
            require(verified <= reviewed, p, 'verification occurs after editorial review')


def _unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'JSON', f'duplicate key: {key}')
        result[key] = value
    return result


def load_json(path):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'), object_pairs_hook=_unique_pairs,
                          parse_constant=lambda v: (_ for _ in ()).throw(ValidationError(f'JSON: invalid constant {v}')))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f'{path}: {exc}') from exc


def validate_repository(root=ROOT, now=None):
    countries = validate_countries(load_json(root / 'public/countries.json'))
    validate_envelope(load_json(root / 'public/events.json'), countries, now)
    examples = root / 'public/examples.json'
    if examples.exists():
        validate_envelope(load_json(examples), countries, now, illustrative=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        validate_repository(args.root)
    except ValidationError as exc:
        parser.exit(1, f'Validation failed: {exc}\n')
    print('Editorial data and examples validated; discovery candidates are excluded.')


if __name__ == '__main__':
    main()
