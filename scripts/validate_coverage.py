#!/usr/bin/env python3
"""Validate the country-language ledger without expanding source coverage claims."""
from datetime import datetime, timezone
from validate_data import ROOT, array, https_url, load_json, moment, obj, require, text, validate_countries


def validate_coverage(data, countries, events, now=None):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'checked_at', 'human_editorial_review', 'coverage_note', 'countries'), 'coverage')
    require(type(data['schema_version']) is int and data['schema_version'] == 1, 'coverage', 'unsupported schema')
    checked = moment(data['checked_at'], 'coverage.checked_at', now)
    require(data['human_editorial_review'] is False, 'coverage', 'this limited-source ledger cannot claim human review')
    text(data['coverage_note'], 'coverage.coverage_note')
    source_map = {}
    for event in events['events']:
        for source in event['sources']:
            require(source['id'] not in source_map, 'coverage', 'source IDs must be globally unique for ledger references')
            source_map[source['id']] = (event['country'], source)
    seen, seen_sources = set(), set()
    for i, row in enumerate(array(data['countries'], 'coverage.countries')):
        p = f'coverage.countries[{i}]'
        obj(row, ('code', 'status', 'last_checked', 'review_window', 'languages', 'source_ids', 'note'), p)
        require(isinstance(row['code'], str) and row['code'] in countries and row['code'] not in seen, p, 'unknown or duplicate country')
        seen.add(row['code'])
        text(row['note'], p + '.note')
        array(row['languages'], p + '.languages')
        array(row['source_ids'], p + '.source_ids')
        require(all(isinstance(s, str) for s in row['source_ids']), p, 'source IDs must be strings')
        require(len(row['source_ids']) == len(set(row['source_ids'])), p, 'duplicate source IDs')
        if row['status'] == 'not-reviewed':
            require(row['last_checked'] is None and row['review_window'] is None and not row['languages'] and not row['source_ids'], p, 'unreviewed country cannot imply a check, language or search window')
        else:
            require(row['status'] == 'limited-source-check' and bool(row['source_ids']), p, 'limited checks need existing evidence')
            require(row['languages'] == ['English'], p, 'seed checks support English-source coverage only')
            sources = []
            for source_id in row['source_ids']:
                require(source_id in source_map and source_map[source_id][0] == row['code'], p, 'unknown or foreign source')
                sources.append(source_map[source_id][1])
                seen_sources.add(source_id)
            last_checked = moment(row['last_checked'], p + '.last_checked', now)
            require(last_checked == max(moment(s['accessed_at'], p, now) for s in sources), p, 'last check must retain actual source access timestamp')
            require(last_checked <= checked, p, 'source check after ledger audit')
            obj(row['review_window'], ('start', 'end'), p + '.review_window')
            # The seed's window is only the dated reporting reviewed, never a census/search period.
            days = [s['published_at'][:10] for s in sources if s['published_at']]
            require(bool(days) and row['review_window'] == {'start': min(days), 'end': max(days)}, p, 'window must match dated source reporting')
    require(seen == set(countries), 'coverage', 'ledger must contain every catalog country exactly once')
    require(seen_sources == set(source_map), 'coverage', 'ledger must disclose every documented seed source check')
    return data


def validate_discovery_status(data, now=None):
    now = now or datetime.now(timezone.utc)
    obj(data, ('schema_version', 'audited_at', 'status', 'provider', 'scheduled_interval_hours', 'last_success_at', 'last_success_basis', 'candidate_count', 'workflow_run_id', 'workflow_run_url', 'artifact_name', 'note'), 'discovery-status')
    require(type(data['schema_version']) is int and data['schema_version'] == 1, 'discovery-status', 'unsupported schema')
    audited = moment(data['audited_at'], 'discovery-status.audited_at', now)
    successful = moment(data['last_success_at'], 'discovery-status.last_success_at', now)
    require(successful <= audited, 'discovery-status', 'success occurs after audit')
    require(data['status'] == 'success' and data['last_success_basis'] == 'artifact-created', 'discovery-status', 'manifest reports a known successful artifact, not live service health')
    require(type(data['scheduled_interval_hours']) is int and data['scheduled_interval_hours'] == 6, 'discovery-status', 'schedule must match configured six-hour interval')
    require(type(data['candidate_count']) is int and 0 <= data['candidate_count'] <= 100, 'discovery-status', 'candidate count outside discovery sample bound')
    require(type(data['workflow_run_id']) is int and data['workflow_run_id'] > 0, 'discovery-status', 'invalid workflow run ID')
    https_url(data['workflow_run_url'], 'discovery-status.workflow_run_url')
    require(data['workflow_run_url'] == f"https://github.com/occult-kranti/protest-atlas/actions/runs/{data['workflow_run_id']}", 'discovery-status', 'run URL must match provenance ID')
    require(data['artifact_name'] == f"unverified-news-candidates-{data['workflow_run_id']}", 'discovery-status', 'artifact name must match run ID')
    for field in ('provider', 'note'):
        text(data[field], 'discovery-status.' + field)
    return data


def validate_repository_coverage(root=ROOT, now=None):
    validate_discovery_status(load_json(root / 'public/discovery-status.json'), now)
    return validate_coverage(load_json(root / 'public/coverage.json'),
                             validate_countries(load_json(root / 'public/countries.json')),
                             load_json(root / 'public/events.json'), now)


if __name__ == '__main__':
    validate_repository_coverage()
    print('Coverage ledger validated; limited checks do not imply comprehensive or human review.')
