"""Tests focus on publication and editorial trust boundaries."""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build import build
from discover_gdelt import normalize, write_candidates
from validate_data import ValidationError, load_json, validate_countries, validate_envelope

NOW = datetime(2026, 10, 2, 20, tzinfo=timezone.utc)
COUNTRIES = [{'code': 'FR', 'name': 'France', 'region': 'Europe'}]


def fixture():
    return {'schema_version': 1, 'generated_at': '2026-10-02T19:00:00Z',
            'last_editorial_review': '2026-10-02T18:00:00Z', 'coverage_note': 'Limited source coverage.',
            'events': [{
                'id': 'fr-test', 'title': 'Test event', 'country': 'FR', 'country_name': 'France', 'region': 'Europe',
                'location': {'label': 'France', 'precision': 'country'}, 'issues': ['labor'],
                'start_date': None, 'start_date_precision': 'unknown', 'end_date': None,
                'status': 'ongoing', 'last_verified': '2026-10-02T17:00:00Z', 'last_observed_at': '2026-10-02',
                'summary': 'An attributed report of a protest.',
                'positions': [{'actor': 'Union', 'stance': 'oppose', 'target': 'Policy', 'claim': 'Reported objection.', 'source_ids': ['report']}],
                'intensity': {'turnout': {'min': None, 'max': None, 'qualifier': 'Unknown'},
                              'disruption': 'unknown', 'violence': 'unknown', 'source_ids': []},
                'state_response': [],
                'sources': [{'id': 'report', 'url': 'https://example.org/report', 'title': 'Report', 'publisher': 'Example',
                             'published_at': '2026-10-02', 'accessed_at': '2026-10-02T16:00:00Z'}],
                'verification': {'level': 'single-source', 'note': 'One source; no independent corroboration.'},
                'timeline': [{'date': '2026-10-02', 'text': 'Report describes a protest.', 'source_ids': ['report']}],
            }]}


class EditorialBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.data = fixture()
        self.countries = validate_countries(COUNTRIES)

    def validate(self):
        validate_envelope(self.data, self.countries, NOW)

    def test_valid_unknown_onset_and_date_precision(self):
        self.validate()
        self.data['schema_version'] = '1.0'
        self.validate()

    def test_future_verification_and_observation_rejected(self):
        for field in ['last_verified', 'last_observed_at']:
            with self.subTest(field=field):
                self.data = fixture()
                self.data['events'][0][field] = '2026-10-03'
                with self.assertRaises(ValidationError):
                    self.validate()

    def test_newer_build_does_not_make_old_observation_fresh(self):
        self.data['events'][0]['last_observed_at'] = '2026-09-01'
        self.data['events'][0]['timeline'] = []
        self.validate()
        self.assertEqual(self.data['events'][0]['last_observed_at'], '2026-09-01')

    def test_observation_cannot_omit_newer_timeline_evidence(self):
        self.data['events'][0]['last_observed_at'] = '2026-09-01'
        with self.assertRaisesRegex(ValidationError, 'latest observation'):
            self.validate()

    def test_foreign_claim_reference_rejected(self):
        other = copy.deepcopy(self.data['events'][0])
        other['id'] = 'fr-other'
        other['sources'][0]['id'] = 'foreign'
        other['positions'][0]['source_ids'] = ['foreign']
        other['timeline'][0]['source_ids'] = ['foreign']
        self.data['events'].append(other)
        self.data['events'][0]['positions'][0]['source_ids'] = ['foreign']
        with self.assertRaisesRegex(ValidationError, 'foreign'):
            self.validate()

    def test_unsafe_urls_rejected(self):
        for url in ['http://example.org/report', 'javascript:alert(1)', 'https://user:pass@example.org/report']:
            with self.subTest(url=url):
                self.data['events'][0]['sources'][0]['url'] = url
                with self.assertRaises(ValidationError):
                    self.validate()

    def test_contradictory_dates_rejected(self):
        event = self.data['events'][0]
        event.update(status='ended', start_date='2026-10-02', start_date_precision='day', end_date='2026-10-01')
        with self.assertRaisesRegex(ValidationError, 'end precedes'):
            self.validate()

    def test_private_fields_and_exact_locations_rejected(self):
        for mutate in [lambda e: e.update(participants=[{'name': 'Private person'}]),
                       lambda e: e['location'].update(latitude=48.123),
                       lambda e: e['location'].update(precision='exact'),
                       lambda e: e['location'].update(label='48.123456, 2.123456'),
                       lambda e: e['location'].update(label='23 Example Street')]:
            self.data = fixture()
            mutate(self.data['events'][0])
            with self.assertRaises(ValidationError):
                self.validate()

    def test_invalid_id_stance_and_candidate_status_rejected(self):
        for mutate in [lambda e: e.update(id='../private'),
                       lambda e: e['positions'][0].update(stance='violent'),
                       lambda e: e['verification'].update(level='unverified')]:
            self.data = fixture()
            mutate(self.data['events'][0])
            with self.assertRaises(ValidationError):
                self.validate()

    def test_intensity_claim_requires_evidence(self):
        self.data['events'][0]['intensity']['disruption'] = 'Road closures reported.'
        with self.assertRaisesRegex(ValidationError, 'evidence'):
            self.validate()

    def test_duplicate_keys_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'input.json'
            path.write_text('{"events": [], "events": []}')
            with self.assertRaisesRegex(ValidationError, 'duplicate key'):
                load_json(path)


class PublishingTests(unittest.TestCase):
    def test_build_preserves_dates_and_excludes_nonpublic_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'public').mkdir()
            (root / 'public/countries.json').write_text(json.dumps(COUNTRIES))
            data = fixture()
            (root / 'public/events.json').write_text(json.dumps(data))
            for name in ['index.html', 'styles.css', 'app.js']:
                (root / name).write_text('test')
            (root / 'secret.env').write_text('private')
            (root / 'public/private.json').write_text('private')
            (root / 'data').mkdir()
            (root / 'data/candidates.json').write_text('unverified')
            output = build(root)
            self.assertEqual(json.loads((output / 'public/events.json').read_text()), data)
            self.assertEqual(set(str(p.relative_to(output)) for p in output.rglob('*') if p.is_file()),
                             {'index.html', 'styles.css', 'app.js', 'public/countries.json', 'public/events.json', '.nojekyll'})

    def test_build_rejects_symlink_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'public').mkdir()
            (root / 'public/countries.json').write_text(json.dumps(COUNTRIES))
            data = fixture()
            data['events'] = []
            (root / 'public/events.json').write_text(json.dumps(data))
            (root / 'outside.html').write_text('secret')
            (root / 'index.html').symlink_to(root / 'outside.html')
            with self.assertRaisesRegex(ValidationError, 'symlink'):
                build(root)

    def test_discovery_is_unverified_sample_only(self):
        article = {'url': 'https://example.org/protest', 'title': 'News', 'sourcecountry': 'Canada', 'seendate': '20261002T120000Z'}
        result = normalize({'articles': [article, article, {'url': 'http://example.org', 'title': 'Bad'}]}, '2026-10-02')
        self.assertEqual(len(result['candidates']), 1)
        candidate = result['candidates'][0]
        self.assertEqual(candidate['review_status'], 'unverified')
        self.assertNotIn('events', result)
        self.assertNotIn('country', candidate)
        self.assertNotIn('last_verified', candidate)
        self.assertEqual(result['skipped_invalid_articles'], 1)

    def test_discovery_cannot_write_public_and_upstream_error_is_failure(self):
        with self.assertRaisesRegex(ValidationError, 'public writes forbidden'):
            write_candidates({'articles': []}, Path(__file__).resolve().parents[1] / 'public/events.json')
        with self.assertRaises(ValidationError):
            normalize({'error': 'outage'}, '2026-10-02')


if __name__ == '__main__':
    unittest.main()
