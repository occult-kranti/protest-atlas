"""Regression checks for coverage claims and the local editorial trust boundary."""
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build_review_queue import canonical_url, normalize_candidates, validate_review_packet, write_queue
from validate_coverage import validate_coverage, validate_discovery_status, validate_repository_coverage
from validate_data import ROOT, ValidationError, load_json, validate_countries

NOW = datetime(2026, 10, 2, 23, tzinfo=timezone.utc)
COUNTRIES = validate_countries([{'code': 'FR', 'name': 'France', 'region': 'Europe'}, {'code': 'IN', 'name': 'India', 'region': 'Asia'}])
EVENTS = {'events': [{'id': 'fr-known', 'sources': [{'id': 'fr-report', 'url': 'https://example.org/report?a=1', 'accessed_at': '2026-10-02T19:15:18Z', 'published_at': '2026-10-02'}], 'country': 'FR'}]}


def lead(url='https://example.org/new'):
    return {'id': 'candidate-test', 'title': '=Unverified article <script>alert(1)</script>', 'url': url,
            'publisher_domain': 'example.org', 'publisher_country': 'India', 'language': 'English',
            'gdelt_seen_at': '20261002T180000Z', 'review_status': 'unverified'}


def payload(*leads):
    return {'schema_version': 1, 'collected_at': '2026-10-02T19:27:06Z', 'candidates': list(leads)}


def packet(candidate=None):
    candidate = candidate or normalize_candidates(payload(lead()), EVENTS, NOW)['candidates'][0]
    return {'schema_version': 1, 'packet_kind': 'editorial-review-packet', 'exported_at': '2026-10-02T20:00:00Z',
            'source_collected_at': '2026-10-02T19:27:06Z', 'reviews': [{
                'candidate': candidate, 'disposition': 'unreviewed', 'notes': '=not a CSV formula',
                'observed_date': None, 'country': None, 'source_published_at': None, 'source_checked': False,
                'claim_summary': '', 'attribution': '', 'duplicate_event_id': None}]}


def coverage():
    return {'schema_version': 1, 'checked_at': '2026-10-02T20:00:00Z', 'human_editorial_review': False,
            'coverage_note': 'Limited English-source checks, no human review or local-language coverage.',
            'countries': [
                {'code': 'FR', 'status': 'limited-source-check', 'last_checked': '2026-10-02T19:15:18Z', 'review_window': {'start': '2026-10-02', 'end': '2026-10-02'}, 'languages': ['English'], 'source_ids': ['fr-report'], 'note': 'Single English-source check; no human review.'},
                {'code': 'IN', 'status': 'not-reviewed', 'last_checked': None, 'review_window': None, 'languages': [], 'source_ids': [], 'note': 'Coverage unknown, never no protests.'}]}


class CoverageLedgerTests(unittest.TestCase):
    def test_repository_ledger_retains_seed_only_coverage(self):
        data = validate_repository_coverage(ROOT, NOW)
        self.assertEqual(len(data['countries']), 249)
        checked = {row['code'] for row in data['countries'] if row['status'] == 'limited-source-check'}
        self.assertEqual(checked, {'FR', 'IN', 'ES'})
        self.assertFalse(data['human_editorial_review'])

    def test_ledger_cannot_freshen_source_time_or_expand_language(self):
        for field, value in [('last_checked', '2026-10-02T20:00:00Z'), ('languages', ['English', 'French']), ('source_ids', ['foreign-report']), ('review_window', {'start': '2026-09-01', 'end': '2026-10-02'})]:
            with self.subTest(field=field):
                data = coverage(); data['countries'][0][field] = value
                with self.assertRaises(ValidationError): validate_coverage(data, COUNTRIES, EVENTS, NOW)

    def test_missing_duplicate_or_invented_review_is_rejected(self):
        variants = []
        data = coverage(); data['countries'].pop(); variants.append(data)
        data = coverage(); data['countries'].append(copy.deepcopy(data['countries'][0])); variants.append(data)
        data = coverage(); data['human_editorial_review'] = True; variants.append(data)
        data = coverage(); data['countries'][1]['last_checked'] = '2026-10-02'; variants.append(data)
        data = coverage(); data['countries'][0] = dict(data['countries'][1], code='FR'); variants.append(data)
        for data in variants:
            with self.assertRaises(ValidationError): validate_coverage(data, COUNTRIES, EVENTS, NOW)

    def test_discovery_audit_provenance(self):
        status = load_json(ROOT / 'public/discovery-status.json')
        validate_discovery_status(status, NOW)
        self.assertEqual(status['candidate_count'], 97)
        self.assertEqual(status['last_success_basis'], 'artifact-created')
        status['workflow_run_url'] += '0'
        with self.assertRaises(ValidationError): validate_discovery_status(status, NOW)


class LocalReviewTests(unittest.TestCase):
    def test_normalization_dedups_tracking_and_uses_trusted_existing_ids(self):
        first = lead('https://example.org/report?utm_source=x&a=1#top')
        first['existing_event_ids'] = ['fabricated']
        queue = normalize_candidates(payload(first, lead('https://example.org/report?a=1')), EVENTS, NOW)
        self.assertEqual(len(queue['candidates']), 1)
        candidate = queue['candidates'][0]
        self.assertEqual(candidate['existing_event_ids'], ['fr-known'])
        self.assertEqual(candidate['review_status'], 'unverified')
        self.assertNotIn('country', candidate)
        self.assertNotIn('observed_date', candidate)
        self.assertNotIn('source_published_at', candidate)
        self.assertNotIn('events', queue)

    def test_metadata_cannot_import_approval_occurrence_or_unsafe_url(self):
        variants = []
        for key, value in [('review_status', 'verified'), ('country', 'IN'), ('published_at', '2026-10-02'), ('url', 'javascript:alert(1)'), ('url', 'https://user:secret@example.org/news'), ('url', 'https://example.org:8443/news')]:
            candidate = lead(); candidate[key] = value; variants.append(candidate)
        for candidate in variants:
            with self.subTest(candidate=candidate):
                with self.assertRaises(ValidationError): normalize_candidates(payload(candidate), EVENTS, NOW)

    def test_ready_needs_all_manual_evidence(self):
        data = packet(); row = data['reviews'][0]; row['disposition'] = 'ready-for-editor'
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        row.update(source_checked=True, observed_date='2026-10-02', country='FR', claim_summary='Reporting describes a demonstration.', attribution='Example reporting; single-source claim.')
        validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        for field, value in [('source_checked', False), ('observed_date', '2026-10-03'), ('observed_date', '2026-02-30'), ('country', 'XX'), ('claim_summary', ''), ('attribution', ''), ('source_published_at', '2026-10-03')]:
            variant = copy.deepcopy(data); variant['reviews'][0][field] = value
            with self.subTest(field=field):
                with self.assertRaises(ValidationError): validate_review_packet(variant, COUNTRIES, EVENTS, NOW)

    def test_duplicate_needs_published_id_and_existing_url_cannot_be_ready(self):
        candidate = normalize_candidates(payload(lead('https://example.org/report?a=1')), EVENTS, NOW)['candidates'][0]
        data = packet(candidate); row = data['reviews'][0]
        row.update(disposition='ready-for-editor', source_checked=True, observed_date='2026-10-02', country='FR', claim_summary='Sourced claim.', attribution='Example reporting.')
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        row['disposition'] = 'duplicate'
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        row['duplicate_event_id'] = 'fr-known'
        validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        row['duplicate_event_id'] = 'invented-event'
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)

    def test_packet_cannot_change_metadata_bypass_dedup_or_add_private_fields(self):
        for field, value in [('existing_event_ids', ['invented-event']), ('id', 'candidate-invented')]:
            data = packet(); data['reviews'][0]['candidate'][field] = value
            with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        data = packet(); data['reviews'][0]['private_participant'] = 'forbidden field'
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        data = packet(); data['reviews'].append(copy.deepcopy(data['reviews'][0]))
        with self.assertRaises(ValidationError): validate_review_packet(data, COUNTRIES, EVENTS, NOW)

    def test_json_preserves_untrusted_text_as_text(self):
        data = packet(); validate_review_packet(data, COUNTRIES, EVENTS, NOW)
        restored = json.loads(json.dumps(data))
        self.assertEqual(restored['reviews'][0]['notes'], '=not a CSV formula')
        self.assertIn('<script>', restored['reviews'][0]['candidate']['title'])

    def test_queue_writes_cannot_touch_public_or_follow_link(self):
        queue = normalize_candidates(payload(lead()), EVENTS, NOW)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); public = root / 'public'; public.mkdir()
            target = public / 'events.json'; target.write_text('unchanged')
            with self.assertRaises(ValidationError): write_queue(queue, target, root)
            directory = root / 'data/review-queues'; directory.mkdir(parents=True)
            link = directory / 'escape.json'; link.symlink_to(target)
            with self.assertRaises(ValidationError): write_queue(queue, link, root)
            link.unlink(); link.hardlink_to(target)
            write_queue(queue, link, root)
            self.assertEqual(target.read_text(), 'unchanged')
            self.assertEqual(json.loads(link.read_text())['queue_kind'], 'unverified-news-leads')
            self.assertNotEqual(link.stat().st_ino, target.stat().st_ino)

    def test_symlinked_queue_directory_cannot_redefine_output_allowlist(self):
        queue = normalize_candidates(payload(lead()), EVENTS, NOW)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root / 'data').mkdir(); (root / 'public').mkdir()
            (root / 'data/review-queues').symlink_to(root / 'public', target_is_directory=True)
            with self.assertRaises(ValidationError): write_queue(queue, root / 'data/review-queues/events.json', root)
            self.assertFalse((root / 'public/events.json').exists())

    def test_url_normalization_retains_meaningful_parameters(self):
        self.assertEqual(canonical_url('https://EXAMPLE.org:443/report?z=2&a=hello+world&utm_source=x#part'), 'https://example.org/report?a=hello+world&z=2')
        self.assertNotEqual(canonical_url('https://example.org/report?id=1'), canonical_url('https://example.org/report?id=2'))


if __name__ == '__main__':
    unittest.main()
