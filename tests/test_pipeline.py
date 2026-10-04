"""Tests focus on publication and editorial trust boundaries."""
import copy
from datetime import datetime, timezone
import hashlib
import json
import shutil
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build import GENERATED_FILES, OPTIONAL_FILES, PUBLIC_COPIES, build, strip_css_comments
from discover_gdelt import normalize, write_candidates
from merge_history import KIND_DEFAULT_BASIS, apply_kind_defaults, write as write_json
import apply_kind_defaults as apply_kind_defaults_script
from validate_data import KINDS, ValidationError, load_json, validate_countries, validate_envelope

NOW = datetime(2026, 10, 2, 20, tzinfo=timezone.utc)
COUNTRIES = [{'code': 'FR', 'name': 'France', 'region': 'Europe'}]
REPOSITORY = Path(__file__).resolve().parents[1]
FROZEN = REPOSITORY / 'tests/fixtures/snapshot-20261002'
KIND_FIXTURE = REPOSITORY / 'tests/fixtures/snapshot-20261002-kind'
# sha256 of the frozen 2 Oct 2026 events.json at fcd35a7 (4.1 SPEC §6.3; the fixture README forbids edits).
FROZEN_EVENTS_SHA256 = '526598835a79726339fde24954fd177216c5bb54ab2fea7ecde22e5d198a0f5d'
# 4.1 SPEC §5.2(7): the records whose text matches \b(riot\w*|clash\w*|unrest|loot\w*|arson|violen\w*)\b (case-insensitive,
# every string value except sources[].url) on the frozen fixture. Leads for a source re-read, never evidence of a kind:
# they stay collective-action / contract-default until an agent re-reads the cited source. \b(war|wars|warfare|armed)\b
# matches no record.
KEYWORD_LEADS = (
    'am-border-policy-protests-2024', 'ao-fuel-20250728', 'ar-labor-reform-protests-2026', 'au-victorian-hospital-strike-20261001',
    'bd-quota-uprising-2024', 'bg-budget-protests-2025', 'ec-diesel-subsidy-strike-2025', 'fj-yaqara-pastoral-strike-20260216',
    'fr-schools-20261002', 'gr-tempe-accountability-2025', 'id-lawmakers-perks-protests-2025', 'ir-economic-unrest-2025-2026',
    'nc-electoral-reform-unrest-2024', 'np-gen-z-protests-2025', 'pg-port-moresby-payroll-protest-20240110', 'sn-electiondelay-202402',
    've-election-protests-2024', 'vu-teachers-resumed-strike-20240810',
)


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
                'kind': 'collective-action', 'kind_basis': dict(KIND_DEFAULT_BASIS),
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


class KindTests(unittest.TestCase):
    """4.1 SPEC §6.1–§6.3: a kind on every record, set by the pipeline or a source re-read, never guessed."""

    def setUp(self):
        self.data = fixture()
        self.countries = validate_countries(COUNTRIES)

    def validate(self, illustrative=False):
        validate_envelope(self.data, self.countries, NOW, illustrative=illustrative)

    def test_kind_required_and_enumerated(self):
        self.assertEqual(KINDS, ('collective-action', 'protest', 'strike', 'civil-unrest'))
        self.validate()
        event = self.data['events'][0]
        del event['kind']
        with self.assertRaisesRegex(ValidationError, 'fields must be exactly'):
            self.validate()
        for kind in ('armed-conflict-intrastate', 'riot', '', None, 'Protest'):
            with self.subTest(kind=kind):
                self.data = fixture()
                self.data['events'][0]['kind'] = kind
                self.data['events'][0]['kind_basis'] = {'method': 'source-reread', 'text': 'Re-read.', 'source_ids': ['report']}
                with self.assertRaisesRegex(ValidationError, 'unsupported kind'):
                    self.validate()

    def test_contract_default_only_for_collective_action(self):
        for kind in ('protest', 'strike', 'civil-unrest'):
            with self.subTest(kind=kind):
                self.data = fixture()
                self.data['events'][0]['kind'] = kind
                with self.assertRaisesRegex(ValidationError, 'legal only for collective-action'):
                    self.validate()
        self.data = fixture()
        self.data['events'][0]['kind_basis']['source_ids'] = ['report']
        with self.assertRaisesRegex(ValidationError, 'cites no source'):
            self.validate()

    def test_source_reread_needs_event_local_sources(self):
        event = self.data['events'][0]
        event['kind'] = 'strike'
        event['kind_basis'] = {'method': 'source-reread', 'text': 'The cited report describes a withdrawal of labour by the union.', 'source_ids': ['report']}
        self.validate()
        for source_ids, message in (([], 'at least one event-local source'), (['foreign'], 'unknown or foreign'), (['report', 'report'], 'duplicate')):
            with self.subTest(source_ids=source_ids):
                event['kind_basis']['source_ids'] = source_ids
                with self.assertRaisesRegex(ValidationError, message):
                    self.validate()

    def test_kind_basis_exact_keys(self):
        for mutate in [lambda b: b.update(confidence='high'), lambda b: b.pop('text'), lambda b: b.update(method='keyword-match'),
                       lambda b: b.update(text=''), lambda b: b.update(text='x' * 601), lambda b: b.update(source_ids=None)]:
            self.data = fixture()
            mutate(self.data['events'][0]['kind_basis'])
            with self.subTest(basis=self.data['events'][0]['kind_basis']):
                with self.assertRaises(ValidationError):
                    self.validate()
        self.data = fixture()
        self.data['events'][0]['kind_basis'] = 'contract-default'
        with self.assertRaisesRegex(ValidationError, 'must be an object'):
            self.validate()

    def test_illustrative_kind_basis_only_in_examples(self):
        event = self.data['events'][0]
        event['kind_basis'] = {'method': 'illustrative', 'text': 'Illustrative example; no source was checked.', 'source_ids': []}
        with self.assertRaisesRegex(ValidationError, 'unsupported kind_basis.method'):
            self.validate()
        self.validate(illustrative=True)
        event['kind_basis']['source_ids'] = ['report']
        with self.assertRaisesRegex(ValidationError, 'illustrative basis cites no source'):
            self.validate(illustrative=True)
        examples = load_json(REPOSITORY / 'public/examples.json')
        for example in examples['events']:
            self.assertEqual((example['kind'], example['kind_basis']['method']), ('collective-action', 'illustrative'))

    def test_public_events_all_carry_kind(self):
        data = load_json(REPOSITORY / 'public/events.json')
        self.assertTrue(data['events'])
        for event in data['events']:
            self.assertIn(event['kind'], KINDS, event['id'])
            self.assertEqual(set(event['kind_basis']), {'method', 'text', 'source_ids'}, event['id'])
            if event['kind_basis']['method'] == 'contract-default':
                self.assertEqual((event['kind'], event['kind_basis']['source_ids']), ('collective-action', []), event['id'])
            else:
                self.assertEqual(event['kind_basis']['method'], 'source-reread', event['id'])
                self.assertTrue(event['kind_basis']['source_ids'], event['id'])

    def test_frozen_fixture_unchanged(self):
        self.assertEqual(hashlib.sha256((FROZEN / 'events.json').read_bytes()).hexdigest(), FROZEN_EVENTS_SHA256)
        frozen = load_json(FROZEN / 'events.json')
        self.assertFalse(any('kind' in event or 'kind_basis' in event for event in frozen['events']), 'the frozen fixture has no kind')

    def test_kind_regeneration_changes_only_kind_fields(self):
        # The Phase-0 events.json with kind and kind_basis stripped from every record is byte-identical to the frozen fixture:
        # generated_at, last_editorial_review, coverage_note and every other key are untouched (R27).
        data = load_json(REPOSITORY / 'public/events.json')
        self.assertEqual(data['generated_at'], '2026-10-02T22:45:35Z')
        self.assertEqual(data['last_editorial_review'], '2026-10-02T22:45:35Z')
        for event in data['events']:
            del event['kind']
            del event['kind_basis']
        self.assertEqual((json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'), (FROZEN / 'events.json').read_bytes())
        kind = load_json(KIND_FIXTURE / 'events.json')
        self.assertEqual(len(kind['events']), 84)
        self.assertEqual({(e['kind'], e['kind_basis']['method'], tuple(e['kind_basis']['source_ids'])) for e in kind['events']},
                         {('collective-action', 'contract-default', ())})
        self.assertEqual({e['kind_basis']['text'] for e in kind['events']}, {KIND_DEFAULT_BASIS['text']})
        self.assertEqual((kind['generated_at'], kind['last_editorial_review']), ('2026-10-02T22:45:35Z', '2026-10-02T22:45:35Z'))

    def test_apply_kind_defaults_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'public').mkdir()
            shutil.copyfile(FROZEN / 'events.json', root / 'public/events.json')
            self.assertEqual(apply_kind_defaults_script.main(root), 0)
            first = (root / 'public/events.json').read_bytes()
            self.assertEqual(first, (KIND_FIXTURE / 'events.json').read_bytes(), 'the script reproduces the kind fixture from the frozen one')
            self.assertEqual(apply_kind_defaults_script.main(root), 0)
            self.assertEqual((root / 'public/events.json').read_bytes(), first, 'a second run changes nothing')
        events = [{'id': 'a'}, {'id': 'b', 'kind': 'strike', 'kind_basis': {'method': 'source-reread', 'text': 't', 'source_ids': ['s']}}]
        self.assertEqual(apply_kind_defaults(events), 1)
        self.assertEqual(events[0]['kind'], 'collective-action')
        self.assertEqual(events[0]['kind_basis'], KIND_DEFAULT_BASIS)
        self.assertIsNot(events[0]['kind_basis'], KIND_DEFAULT_BASIS)
        self.assertEqual(events[1]['kind'], 'strike', 'an existing kind is kept')
        with self.assertRaisesRegex(ValueError, 'without a kind_basis'):
            apply_kind_defaults([{'id': 'c', 'kind': 'protest'}])

    def test_keyword_records_stay_collective_action(self):
        kind = {e['id']: e for e in load_json(KIND_FIXTURE / 'events.json')['events']}
        self.assertEqual(len(KEYWORD_LEADS), 18)
        for event_id in KEYWORD_LEADS:
            self.assertIn(event_id, kind)
            self.assertEqual((kind[event_id]['kind'], kind[event_id]['kind_basis']['method']), ('collective-action', 'contract-default'), event_id)
        kind_fixture_examples = load_json(KIND_FIXTURE / 'examples.json')
        self.assertEqual(kind_fixture_examples, load_json(REPOSITORY / 'public/examples.json'))


class PublishingTests(unittest.TestCase):
    def test_build_preserves_dates_and_excludes_nonpublic_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repository = Path(__file__).resolve().parents[1]
            for name in PUBLIC_COPIES:
                if name in OPTIONAL_FILES and not (repository / name).exists():
                    continue
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(repository / name, target)
            data = json.loads((root / 'public/events.json').read_text())
            (root / 'secret.env').write_text('private')
            (root / 'public/private.json').write_text('private')
            (root / 'data').mkdir()
            (root / 'data/candidates.json').write_text('unverified')
            output = build(root)
            self.assertEqual(json.loads((output / 'public/events.json').read_text()), data)
            self.assertEqual(set(str(p.relative_to(output)) for p in output.rglob('*') if p.is_file()),
                             {out for name, out in PUBLIC_COPIES.items() if (root / name).exists()}
                             | set(GENERATED_FILES) | {'.nojekyll'})
            info = json.loads((output / 'public/build-info.json').read_text())
            self.assertEqual(set(info), {'schema_version', 'built_at', 'commit', 'workflow_run_id', 'note'})
            self.assertIn('does not change', info['note'])

    def test_build_strips_css_comments(self):
        # 4.1 §8.1 step 6: CSS is served comment-stripped and blank-line collapsed; JS is served as written; the guard refuses
        # a comment opener inside a quoted string or url(...) on the same line.
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in PUBLIC_COPIES:
                if name in OPTIONAL_FILES and not (REPOSITORY / name).exists():
                    continue
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(REPOSITORY / name, target)
            output = build(root)
            sheets = [name for name in PUBLIC_COPIES if name.endswith('.css')]
            self.assertTrue(sheets)
            for name in sheets:
                built = (output / PUBLIC_COPIES[name]).read_text(encoding='utf-8')
                source = (root / name).read_text(encoding='utf-8')
                self.assertNotIn('/*', built, name)
                self.assertEqual(built, strip_css_comments(source), name)
                if '/*' in source:
                    self.assertNotEqual(built, source, f'{name}: the source keeps its contract comments')
            self.assertTrue(any('/*' in (root / name).read_text(encoding='utf-8') for name in sheets), 'at least one sheet carries comments')
            self.assertEqual((output / 'app.js').read_bytes(), (root / 'app.js').read_bytes(), 'JS is served as written')
        self.assertEqual(strip_css_comments('a { /* x */ color: var(--text); }\n\n/* b\nc */\n\nd { }\n'), 'a {  color: var(--text); }\nd { }\n')
        self.assertEqual(strip_css_comments('e { content: "a*/b"; } /* "quoted" */ f { background: url("x.png") }'),
                         'e { content: "a*/b"; }  f { background: url("x.png") }')
        for bad in ('a::before { content: "/*"; }', "b::after { content: '/*'; }", 'c { background: url(/*x*/); }', 'd { background: url("/*") }'):
            with self.subTest(css=bad):
                with self.assertRaisesRegex(ValidationError, 'cannot be stripped safely'):
                    strip_css_comments(bad)

    def test_build_with_and_without_conflicts_file(self):
        # public/conflicts.json is optional (4.1 §6.5): absent, the build publishes the absent state and no such file; present,
        # the Phase-0 stub validator refuses, so nothing reaches the site before the schema checks land (WP-D).
        self.assertIn('public/conflicts.json', OPTIONAL_FILES)
        self.assertIn('public/conflicts.json', PUBLIC_COPIES)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in PUBLIC_COPIES:
                if name in OPTIONAL_FILES and not (REPOSITORY / name).exists():
                    continue
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(REPOSITORY / name, target)
            if (root / 'public/conflicts.json').exists():
                (root / 'public/conflicts.json').unlink()
            output = build(root)
            self.assertFalse((output / 'public/conflicts.json').exists())
            (root / 'public/conflicts.json').write_text('{"schema_version": 1, "records": []}', encoding='utf-8')
            with self.assertRaisesRegex(ValidationError, 'Phase 0'):
                build(root)
            self.assertFalse((output / 'public/conflicts.json').exists(), 'a refused file is never published')

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
