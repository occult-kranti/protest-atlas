#!/usr/bin/env python3
"""Normalize local discovery leads; never approve candidates or write public data."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from validate_data import ROOT, ValidationError, array, https_url, identifier, load_json, moment, obj, require, text, validate_countries

DISPOSITIONS = {'unreviewed', 'needs-source', 'reject', 'duplicate', 'ready-for-editor'}
CANDIDATE_FIELDS = ('id', 'title', 'url', 'publisher_domain', 'publisher_country', 'language', 'gdelt_seen_at', 'review_status')
LEAD_NOTE = 'Unverified news leads only. Publisher country is not occurrence country. GDELT seen time is not source publication or occurrence time. Editorial review and a separate public-data pull request are required.'


def canonical_url(value):
    https_url(value, 'candidate.url')
    parts = urlsplit(value)
    query = sorted((k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                   if not k.lower().startswith('utm_') and k.lower() not in {'fbclid', 'gclid'})
    return urlunsplit(('https', parts.hostname.lower(), parts.path or '/', urlencode(query), ''))


def existing_urls(events):
    urls = {}
    for event in events['events']:
        for source in event['sources']:
            urls.setdefault(canonical_url(source['url']), set()).add(event['id'])
    return urls


def normalize_candidates(payload, events, now=None):
    now = now or datetime.now(timezone.utc)
    require(isinstance(payload, dict) and type(payload.get('schema_version')) is int and payload['schema_version'] == 1, 'queue', 'requires discovery schema 1')
    require('events' not in payload and 'reviews' not in payload, 'queue', 'public data and review packets are not candidate imports')
    collected_at = payload.get('collected_at')
    moment(collected_at, 'queue.collected_at', now)
    leads = array(payload.get('candidates'), 'queue.candidates')
    require(len(leads) <= 1000, 'queue', 'at most 1000 leads per packet')
    urls, seen, candidates = existing_urls(events), set(), []
    for i, lead in enumerate(leads):
        p = f'candidates[{i}]'
        require(isinstance(lead, dict), p, 'must be an object')
        require(set(lead) == set(CANDIDATE_FIELDS) or set(lead) == set(CANDIDATE_FIELDS) | {'existing_event_ids'}, p, 'unexpected candidate fields; occurrence and verification cannot be imported')
        identifier(lead['id'], p + '.id')
        text(lead['title'], p + '.title', 2000)
        require(lead['review_status'] == 'unverified', p, 'import cannot claim approval')
        url = canonical_url(lead['url'])
        require(lead['publisher_domain'] == urlsplit(lead['url']).hostname, p, 'publisher domain must agree with URL')
        for key in ('publisher_country', 'language', 'gdelt_seen_at'):
            require(lead[key] is None or isinstance(lead[key], str), p, 'nullable metadata must be text')
            if lead[key] is not None:
                text(lead[key], p + '.' + key, 100)
        if url in seen:
            continue
        seen.add(url)
        candidate = {key: lead[key] for key in CANDIDATE_FIELDS}
        candidate.update(id='candidate-' + hashlib.sha256(url.encode()).hexdigest()[:20],
                         url=url, publisher_domain=urlsplit(url).hostname,
                         existing_event_ids=sorted(urls.get(url, set())))
        candidates.append(candidate)
    return {'schema_version': 1, 'queue_kind': 'unverified-news-leads', 'collected_at': collected_at,
            'coverage_note': LEAD_NOTE, 'candidates': candidates}


def validate_review_packet(packet, countries, events, now=None):
    now = now or datetime.now(timezone.utc)
    obj(packet, ('schema_version', 'packet_kind', 'exported_at', 'source_collected_at', 'reviews'), 'packet')
    require(type(packet['schema_version']) is int and packet['schema_version'] == 1 and packet['packet_kind'] == 'editorial-review-packet', 'packet', 'unsupported review packet')
    exported = moment(packet['exported_at'], 'packet.exported_at', now)
    collected = moment(packet['source_collected_at'], 'packet.source_collected_at', now)
    require(collected <= exported, 'packet', 'collection after export')
    rows = array(packet['reviews'], 'packet.reviews')
    normalized = normalize_candidates({'schema_version': 1, 'collected_at': packet['source_collected_at'], 'candidates': [r.get('candidate') if isinstance(r, dict) else None for r in rows]}, events, now)
    require(len(normalized['candidates']) == len(rows), 'packet', 'duplicate candidate URLs')
    event_ids = {e['id'] for e in events['events']}
    for i, (row, candidate) in enumerate(zip(rows, normalized['candidates'])):
        p = f'packet.reviews[{i}]'
        obj(row, ('candidate', 'disposition', 'notes', 'observed_date', 'country', 'source_published_at', 'source_checked', 'claim_summary', 'attribution', 'duplicate_event_id'), p)
        require(row['candidate'] == candidate, p, 'candidate must match normalized metadata and trusted URL dedup')
        require(isinstance(row['disposition'], str) and row['disposition'] in DISPOSITIONS, p, 'unsupported disposition')
        require(type(row['source_checked']) is bool, p, 'source_checked must be boolean')
        for key in ('notes', 'claim_summary', 'attribution'):
            require(isinstance(row[key], str) and len(row[key]) <= 4000 and not any(ord(c) < 32 and c not in '\n\t' for c in row[key]), p, 'text field invalid or too long')
        for key in ('observed_date', 'source_published_at'):
            if row[key] is not None:
                require(isinstance(row[key], str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', row[key])), p, 'manual evidence dates must be day-level')
                moment(row[key], p + '.' + key, now)
        require(row['country'] is None or isinstance(row['country'], str) and row['country'] in countries, p, 'occurrence country absent from catalog')
        require(row['duplicate_event_id'] is None or isinstance(row['duplicate_event_id'], str) and row['duplicate_event_id'] in event_ids, p, 'duplicate must reference an existing event')
        if row['disposition'] == 'duplicate':
            require(row['duplicate_event_id'] in event_ids, p, 'duplicate needs an existing event ID')
        if row['disposition'] == 'ready-for-editor':
            require(row['source_checked'] and row['observed_date'] and row['country'] and row['claim_summary'].strip() and row['attribution'].strip(), p, 'ready needs manual source/date/country/claim/attribution evidence')
            require(not candidate['existing_event_ids'], p, 'existing source URL must be reviewed as duplicate')
    return packet


def write_queue(queue, output, root=ROOT):
    output = Path(output)
    # Compare against the lexical allowlist under the real repo root. Resolving
    # the allowlist itself would let a symlinked queue directory redefine it.
    allowed = Path(root).resolve() / 'data/review-queues'
    require(output.resolve().is_relative_to(allowed), 'output', 'must stay inside data/review-queues; public writes forbidden')
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(json.dumps(queue, ensure_ascii=False, indent=2) + '\n')
        os.replace(temporary, output)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'data/review-queues/latest.json')
    parser.add_argument('--validate-packet', action='store_true', help='validate an exported review packet without writing any file')
    args = parser.parse_args()
    try:
        require(args.input.stat().st_size <= 2_000_000, 'input', 'exceeds 2 MB limit')
        payload = load_json(args.input)
        events = load_json(ROOT / 'public/events.json')
        if args.validate_packet:
            validate_review_packet(payload, validate_countries(load_json(ROOT / 'public/countries.json')), events)
            print('Review packet valid; no approval or public data changes performed.')
        else:
            queue = normalize_candidates(payload, events)
            write_queue(queue, args.output)
            print(f"Normalized {len(queue['candidates'])} unverified leads to {args.output}; public events unchanged.")
    except (OSError, ValueError) as exc:
        parser.exit(1, f'Review queue failed (public events unchanged): {exc}\n')


if __name__ == '__main__':
    main()
