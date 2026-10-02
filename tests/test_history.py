"""Publication invariants for historical context, honest screening and coarse maps."""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_data import ValidationError, validate_countries
from validate_history import (validate_context, validate_research_ledger, validate_cities,
                              validate_history_repository)

NOW = datetime(2026, 10, 2, 23, tzinfo=timezone.utc)
COUNTRY_LIST = [{'code': 'FR', 'name': 'France', 'region': 'Europe'}, {'code': 'IN', 'name': 'India', 'region': 'Asia'}]
COUNTRIES = validate_countries(COUNTRY_LIST)


def fixture():
    event = {'id': 'fr-episode', 'country': 'FR', 'status': 'unknown', 'start_date': '2024-06-01',
             'end_date': None, 'last_observed_at': '2024-06-03', 'last_verified': '2026-10-02T21:00:00Z',
             'sources': [{'id': 'fr-source', 'accessed_at': '2026-10-02T20:00:00Z'}]}
    record = {'event_id': event['id'], 'episode_scope': 'A bounded strike episode.',
              'cities': [{'name': 'Paris', 'source_ids': ['fr-source']}],
              'status_basis': {'text': 'No end has been established.', 'source_ids': []},
              'outcome_status': 'documented', 'outcomes': [{
                  'date': '2024-06-03', 'summary': 'A limited concession was announced.',
                  'favours': [{'actor': 'Workers', 'effect': 'benefit', 'basis': 'inference', 'note': 'Only one demand was addressed.'}],
                  'causality': 'reported-link', 'source_ids': ['fr-source']}],
              'research_note': 'AI-assisted; no human sign-off.'}
    window = {'schema_version': 1, 'window_start': '2024-01-01', 'window_end': '2026-10-02'}
    context = dict(window, records=[record])
    ledger = dict(window, generated_at='2026-10-02T22:00:00Z', note='Initial screen, not exhaustive.', countries=[
        {'code': country['code'], 'query': country['name'] + ' protests 2024 2025 2026',
         'attempted_at': '2026-10-02T20:00:00Z', 'provider': 'Exa', 'status': 'searched',
         'result_count': 0, 'candidate_urls': [], 'reviewed_urls': [], 'note': 'No reviewed episode; absence is not established.'}
        for country in COUNTRY_LIST])
    cities = {'schema_version': 1, 'source': 'Public gazetteer', 'source_url': 'https://example.org/cities',
              'source_sha256': 'a' * 64, 'precision': 'Coarse city reference points, rounded to one decimal; not protest locations.',
              'places': [{'id': 'FR:Paris', 'country': 'FR', 'name': 'Paris', 'lat': 48.9, 'lon': 2.3, 'source_name': 'Paris'}], 'unmapped': []}
    return {'events': [event]}, context, ledger, cities


class HistoryTests(unittest.TestCase):
    def setUp(self):
        self.events, self.context, self.ledger, self.cities = fixture()

    def validate(self):
        validate_context(self.context, self.events, NOW)
        validate_research_ledger(self.ledger, COUNTRIES, NOW)
        validate_cities(self.cities, COUNTRIES, self.events, self.context)

    def test_valid_unknown_with_documented_outcome_and_empty_search(self):
        self.validate()
        self.context['records'][0]['outcomes'][0]['date'] = None
        self.validate()

    def test_ongoing_requires_sourced_status_basis_and_no_end(self):
        self.events['events'][0]['status'] = 'ongoing'
        with self.assertRaises(ValidationError):
            self.validate()
        self.context['records'][0]['status_basis'] = {'text': 'Reported continuing on 3 June.', 'source_ids': ['fr-source']}
        self.validate()
        self.events['events'][0]['end_date'] = '2024-06-03'
        with self.assertRaisesRegex(ValidationError, 'ongoing status must not imply'):
            self.validate()
        self.events['events'][0].update(status='planned', end_date=None)
        with self.assertRaisesRegex(ValidationError, 'requires unknown'):
            self.validate()

    def test_every_event_requires_exactly_one_context(self):
        for records in ([], self.context['records'] * 2, [dict(self.context['records'][0], event_id='foreign')]):
            self.context['records'] = records
            with self.assertRaises(ValidationError): validate_context(self.context, self.events, NOW)

    def test_ended_needs_local_status_evidence_and_end_date(self):
        self.events['events'][0].update(status='ended', end_date='2024-06-03')
        with self.assertRaises(ValidationError): self.validate()
        self.context['records'][0]['status_basis']['source_ids'] = ['fr-source']
        self.validate()
        for value in (None, '2026-10-03', '2023-12-31'):
            self.events['events'][0]['end_date'] = value
            with self.assertRaises(ValidationError): self.validate()

    def test_policy_concession_does_not_require_ended_status(self):
        self.validate()
        self.events['events'][0]['end_date'] = '2024-06-03'
        with self.assertRaises(ValidationError): self.validate()

    def test_every_claim_reference_is_event_local(self):
        for field in ('cities', 'outcomes'):
            data = copy.deepcopy(self.context)
            data['records'][0][field][0]['source_ids'] = ['foreign-source']
            with self.assertRaises(ValidationError): validate_context(data, self.events, NOW)
        self.context['records'][0]['status_basis']['source_ids'] = ['foreign-source']
        with self.assertRaises(ValidationError): self.validate()

    def test_outcome_dates_cannot_exceed_check_or_precede_episode(self):
        outcome = self.context['records'][0]['outcomes'][0]
        for value in ('2026-10-03', '2023-12-31', '2024-05-31', '2024-02-30'):
            outcome['date'] = value
            with self.subTest(value=value), self.assertRaises(ValidationError): self.validate()
        outcome['date'] = '2024-06-03'
        self.events['events'][0]['sources'][0]['accessed_at'] = '2024-06-02T22:00:00Z'
        with self.assertRaises(ValidationError): self.validate()

    def test_outcome_consistency_and_causal_inference_boundary(self):
        for mutate in (
            lambda r: r.update(outcome_status='not-established'),
            lambda r: r.update(outcomes=[]),
            lambda r: r['outcomes'][0].update(causality='proven'),
            lambda r: r['outcomes'][0]['favours'][0].update(basis='assumed'),
            lambda r: r['outcomes'][0]['favours'][0].update(effect='victory'),
        ):
            data = copy.deepcopy(self.context); mutate(data['records'][0])
            with self.assertRaises(ValidationError): validate_context(data, self.events, NOW)

    def test_catalog_screening_is_complete_without_claiming_event_coverage(self):
        self.validate()
        self.ledger['countries'].pop()
        with self.assertRaises(ValidationError): self.validate()
        self.ledger['countries'].append(copy.deepcopy(self.ledger['countries'][0]))
        with self.assertRaises(ValidationError): self.validate()

    def test_search_failures_are_not_zero_result_successes(self):
        row = self.ledger['countries'][0]; row['status'] = 'search-failed'
        self.validate()
        row.update(result_count=1, candidate_urls=['https://example.org/news'])
        with self.assertRaises(ValidationError): self.validate()

    def test_ledger_time_url_count_and_exhaustive_claim_guards(self):
        mutations = [
            lambda d: d.update(note='A complete census of all protests.'),
            lambda d: d.update(window_start='2023-01-01'),
            lambda d: d['countries'][0].update(attempted_at='2026-10-02'),
            lambda d: d['countries'][0].update(attempted_at='2026-10-02T22:30:00Z'),
            lambda d: d['countries'][0].update(status='complete'),
            lambda d: d['countries'][0].update(candidate_urls=['https://example.org/news']),
            lambda d: d['countries'][0].update(reviewed_urls=['javascript:alert(1)']),
        ]
        for mutate in mutations:
            data = copy.deepcopy(self.ledger); mutate(data)
            with self.assertRaises(ValidationError): validate_research_ledger(data, COUNTRIES, NOW)

    def test_city_mapping_must_partition_cited_city_references(self):
        place = self.cities['places'].pop()
        with self.assertRaises(ValidationError): self.validate()
        self.cities['unmapped'] = [{key: place[key] for key in ('id', 'country', 'name')}]
        self.validate()
        self.cities['places'].append(place)
        with self.assertRaises(ValidationError): self.validate()

    def test_city_coordinates_are_coarse_bounded_reference_points(self):
        for field, value in [('lat', 48.8566), ('lat', 91), ('lon', -181), ('lat', True), ('lat', float('nan'))]:
            data = copy.deepcopy(self.cities); data['places'][0][field] = value
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_cities(data, COUNTRIES, self.events, self.context)
        self.cities['places'][0]['route'] = 'Extra private field'
        with self.assertRaises(ValidationError): self.validate()

    def test_repository_entrypoint_reads_all_three_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); public = root / 'public'; public.mkdir()
            for name, data in [('countries', COUNTRY_LIST), ('events', self.events), ('event-context', self.context), ('research-ledger', self.ledger), ('cities', self.cities)]:
                (public / (name + '.json')).write_text(json.dumps(data))
            result = validate_history_repository(root, NOW)
            self.assertEqual(set(result), {'context', 'ledger', 'cities'})
            (public / 'event-context.json').unlink()
            with self.assertRaises(ValidationError): validate_history_repository(root, NOW)


if __name__ == '__main__':
    unittest.main()
