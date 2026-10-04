"""Unit tests for scripts/ingest_ucdp.py on the SYNTHETIC fixtures in tests/fixtures/ucdp-synthetic (fictional data)."""
import copy
import json
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'scripts'))
import ingest_ucdp as ingest  # noqa: E402

FIXTURES = HERE / 'fixtures' / 'ucdp-synthetic'
WINDOW_END = '2026-10-04'
GENERATED = '2026-10-04T12:00:00Z'
GED_HEADER = ('id,year,type_of_violence,conflict_new_id,conflict_name,dyad_new_id,side_a,side_b,country,country_id,date_prec,'
              'date_start,date_end,best,low,high,active_year,latitude,longitude')


def run(manifest=FIXTURES / 'inputs.json', **options):
    return ingest.build(str(manifest), window_end=WINDOW_END, generated_at=GENERATED, **options)


def by_id(envelope):
    return {record['id']: record for record in envelope['records']}


class Workspace:
    """A temporary manifest with inline GED/ACD rows for the edge cases the fixtures do not hold."""

    def __init__(self):
        self.dir = Path(tempfile.mkdtemp(prefix='ingest-ucdp-'))

    def manifest(self, ged_rows, acd_rows='', extra_files=(), **overrides):
        (self.dir / 'ged.csv').write_text(GED_HEADER + '\n' + ged_rows.strip() + '\n', encoding='utf-8')
        (self.dir / 'acd.csv').write_text('conflict_id,location,side_a,side_b,year,intensity_level,type_of_conflict,start_date,start_date2\n'
                                          + acd_rows.strip() + ('\n' if acd_rows.strip() else ''), encoding='utf-8')
        base = {'url': 'https://ucdp.uu.se/downloads/', 'downloaded_at': '2026-10-10T08:00:00Z', 'licence': 'placeholder', 'citation': 'placeholder', 'doi': None}
        files = [
            {'path': 'ged.csv', 'role': 'ged', 'dataset': 'UCDP GED', 'version': '26.1', 'provisional': False, 'covers_through': '2025-12-31', **base},
            {'path': 'acd.csv', 'role': 'acd', 'dataset': 'UCDP/PRIO ACD', 'version': '26.1', 'provisional': False, 'covers_through': '2025-12-31', **base},
            *extra_files,
        ]
        for entry in files:
            entry.update({k: v for k, v in overrides.items() if k in entry})
        path = self.dir / 'inputs.json'
        path.write_text(json.dumps({'files': files}), encoding='utf-8')
        return path

    def close(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class FixtureRunTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.envelope = run()
        cls.records = by_id(cls.envelope)

    def test_default_scope_emits_state_based_conflicts_only_and_lists_exclusions(self):
        self.assertEqual(sorted(self.records), ['ucdp-9000001', 'ucdp-9000002', 'ucdp-9000003', 'ucdp-9000006', 'ucdp-9000007'])
        reasons = {e['conflict_id']: e['reason'] for e in self.envelope['excluded']}
        self.assertIn('non-state', reasons[9000004])
        self.assertIn('one-sided', reasons[9000005])
        self.assertEqual(self.envelope['counts']['conflicts_emitted'], 5)
        self.assertEqual(self.envelope['counts']['conflicts_excluded'], 2)
        self.assertEqual(self.envelope['publication'], 'candidate')

    def test_optional_scopes_add_non_state_and_one_sided_with_their_kinds(self):
        envelope = run(include_non_state=True, include_one_sided=True)
        records = by_id(envelope)
        self.assertEqual(records['ucdp-9000004']['kind'], 'non-state-conflict')
        self.assertEqual(records['ucdp-9000005']['kind'], 'one-sided-violence')
        self.assertIsNone(records['ucdp-9000004']['ucdp']['type_of_conflict'])
        self.assertEqual(records['ucdp-9000005']['parties']['side_b'], ['Civilians'])

    def test_kinds_follow_ucdp_type_of_conflict_and_internationalised_folds_into_intrastate(self):
        self.assertEqual(self.records['ucdp-9000001']['kind'], 'armed-conflict-intrastate')
        self.assertEqual(self.records['ucdp-9000002']['kind'], 'armed-conflict-interstate')
        self.assertEqual(self.records['ucdp-9000003']['kind'], 'armed-conflict-intrastate')
        self.assertEqual(self.records['ucdp-9000003']['ucdp']['type_of_conflict'], 4)
        self.assertEqual(self.records['ucdp-9000003']['ucdp']['type_label'], 'internationalised intrastate')
        for record in self.records.values():
            self.assertEqual(record['kind_basis']['method'], 'ucdp-coding')
            self.assertIn('Coded by UCDP, not by this atlas', record['kind_basis']['text'])
            self.assertTrue(record['kind_basis']['source_ids'])

    def test_yearly_figures_prefer_brd_and_sum_ged_for_provisional_years(self):
        figures = {f['year']: f for f in self.records['ucdp-9000001']['fatalities']}
        self.assertEqual(sorted(figures), [2024, 2025, 2026])
        # 2024 BRD 41/34/54 overrides the GED sum 42/35/55 (the September event is in the calendar year, outside the window).
        self.assertEqual((figures[2024]['low'], figures[2024]['best'], figures[2024]['high'], figures[2024]['estimator']), (34, 41, 54, 'UCDP BRD'))
        self.assertEqual(figures[2024]['events'], 2)
        self.assertFalse(figures[2024]['provisional'])
        self.assertEqual(figures[2024]['through'], '2024-12-31')
        self.assertEqual(figures[2024]['source_ids'], ['ucdp-brd-26-1'])
        # 2026 exists only in Candidate data: GED sum, provisional, through the file's covers_through.
        self.assertEqual((figures[2026]['low'], figures[2026]['best'], figures[2026]['high'], figures[2026]['estimator']), (13, 17, 23, 'UCDP GED'))
        self.assertTrue(figures[2026]['provisional'])
        self.assertEqual(figures[2026]['through'], '2026-08-31')
        self.assertEqual(figures[2026]['events'], 2)
        self.assertEqual(figures[2026]['source_ids'], ['ucdp-ged-candidate-26-0-8'])

    def test_without_brd_the_yearly_figure_is_the_ged_sum(self):
        manifest = json.loads((FIXTURES / 'inputs.json').read_text())
        manifest['files'] = [f for f in manifest['files'] if f['role'] != 'brd']
        with tempfile.TemporaryDirectory() as tmp:
            for name in ('ged-annual.csv', 'ged-candidate-26-0-7.csv', 'ged-candidate-26-0-8.csv', 'acd.csv'):
                shutil.copyfile(FIXTURES / name, Path(tmp) / name)
            path = Path(tmp) / 'inputs.json'
            path.write_text(json.dumps(manifest))
            figures = {f['year']: f for f in by_id(run(path))['ucdp-9000001']['fatalities']}
        self.assertEqual((figures[2024]['low'], figures[2024]['best'], figures[2024]['high'], figures[2024]['estimator']), (35, 42, 55, 'UCDP GED'))
        self.assertEqual(figures[2024]['source_ids'], ['ucdp-ged-26-1'])

    def test_duplicate_event_across_candidate_releases_keeps_the_later_release(self):
        figures = {f['year']: f for f in self.records['ucdp-9000002']['fatalities']}
        self.assertEqual((figures[2026]['low'], figures[2026]['best'], figures[2026]['high'], figures[2026]['events']), (7, 7, 7, 1))
        self.assertEqual(figures[2026]['source_ids'], ['ucdp-ged-candidate-26-0-8'])

    def test_latest_evidence_carries_the_ucdp_date_precision(self):
        record = self.records['ucdp-9000001']
        self.assertEqual(record['latest_evidence'], '2026-08-31')
        self.assertEqual(record['latest_evidence_precision'], 'month')
        self.assertEqual(self.records['ucdp-9000003']['latest_evidence'], '2025-06-16')
        self.assertEqual(self.records['ucdp-9000003']['latest_evidence_precision'], 'week')
        self.assertEqual(record['start'], {'ucdp_start_date': '2023-05-01', 'ucdp_start_date2': '2024-03-01', 'first_event_in_window': '2024-11-10'})

    def test_status_basis_never_says_ongoing(self):
        c1, c3, c7 = (self.records[k]['status_basis'] for k in ('ucdp-9000001', 'ucdp-9000003', 'ucdp-9000007'))
        self.assertEqual((c1['basis'], c1['active_years'], c1['latest_month']), ('ucdp-candidate-events', [2024, 2025], '2026-08'))
        self.assertEqual((c3['basis'], c3['active_years'], c3['latest_month']), ('ucdp-not-in-latest-year', [2024], None))
        self.assertIn('Not recorded by UCDP as active in 2025', c3['text'])
        self.assertIn('not evidence of peace', c3['text'])
        self.assertEqual((c7['basis'], c7['active_years']), ('ucdp-active-year', [2025]))
        for record in self.records.values():
            self.assertNotIn('ongoing', json.dumps(record).lower())
            if record['status_basis']['basis'] != 'ucdp-not-in-latest-year':
                self.assertIn('does not know whether fighting is taking place today', record['status_basis']['text'])

    def test_countries_are_ucdp_coded_mapped_to_iso_and_unmapped_stays_null(self):
        self.assertEqual(self.records['ucdp-9000002']['countries'], [{'code': 'BE', 'ucdp_name': 'Belgium'}, {'code': 'NL', 'ucdp_name': 'Netherlands'}])
        self.assertEqual(self.records['ucdp-9000006']['countries'], [{'code': None, 'ucdp_name': 'Kosovo'}])
        self.assertTrue(any('Kosovo' in w and 'code null' in w for w in self.envelope['warnings']))

    def test_parties_are_ucdp_strings_without_individuals(self):
        self.assertEqual(self.records['ucdp-9000001']['parties'], {'side_a': ['Government of France (SYNTHETIC)'], 'side_b': ['Synthetic Front A']})
        self.assertEqual(self.records['ucdp-9000001']['ucdp']['dyad_ids'], [9100001])

    def test_output_never_carries_coordinates_places_or_source_text(self):
        text = json.dumps(self.envelope)
        for marker in ('latitude', 'longitude', 'geom_wkt', 'adm_1', 'where_coordinates', 'priogrid', 'SYNTHETIC-SOURCE-TEXT-MUST-NOT-APPEAR',
                       'SYNTHETIC-HEADLINE-MUST-NOT-APPEAR', 'SYNTHETIC-PLACE-MUST-NOT-APPEAR', 'SYNTHETIC-ADM1-MUST-NOT-APPEAR', 'POINT ('):
            self.assertNotIn(marker, text, marker)
        self.assertIsNone(re.search(r'-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}', text))
        self.assertNotIn('"status"', text)

    def test_bad_rows_are_skipped_with_a_warning_not_silently(self):
        warnings = '\n'.join(self.envelope['warnings'])
        self.assertIn('9000105', warnings)      # empty best
        self.assertIn('9000303', warnings)      # dated after the window end
        self.assertIn('after the window end', warnings)

    def test_sources_cite_dataset_version_licence_citation_and_hash(self):
        record = self.records['ucdp-9000001']
        ids = [s['id'] for s in record['sources']]
        self.assertEqual(ids, ['ucdp-acd-26-1', 'ucdp-brd-26-1', 'ucdp-ged-26-1', 'ucdp-ged-candidate-26-0-8'])
        for source in record['sources']:
            self.assertEqual(set(source), set(ingest.SOURCE_FIELDS))
            self.assertRegex(source['sha256'], r'^[0-9a-f]{64}$')
            self.assertGreater(source['rows_read'], 0)
        self.assertEqual(self.envelope['window'], {'start': '2024-10-01', 'end': WINDOW_END, 'first_year': 2024, 'last_year': 2026, 'last_provisional_month': '2026-08'})
        self.assertIn('not evidence of peace', self.envelope['method_note'])

    def test_run_is_deterministic(self):
        again = run()
        self.assertEqual(json.dumps(again, sort_keys=True), json.dumps(self.envelope, sort_keys=True))

    def test_cli_writes_the_file_and_exits_zero(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / 'research' / 'round5' / 'conflicts.candidates.json'
            code = ingest.main(['--inputs', str(FIXTURES / 'inputs.json'), '--out', str(out), '--window-end', WINDOW_END, '--generated-at', GENERATED])
            self.assertEqual(code, 0)
            data = json.loads(out.read_text(encoding='utf-8'))
            self.assertEqual(len(data['records']), 5)
            ingest.check_candidates(data)


class EdgeCaseTests(unittest.TestCase):
    def setUp(self):
        self.ws = Workspace()
        self.addCleanup(self.ws.close)

    def test_conflict_with_events_only_before_the_window_is_excluded(self):
        manifest = self.ws.manifest(
            '1,2024,1,77,SYNTHETIC: Old,78,Government of France (SYNTHETIC),Synthetic X,France,220,1,2024-09-30,2024-09-30,30,30,30,1,48.1,2.1',
            '77,France,Government of France (SYNTHETIC),Synthetic X,2024,1,3,2024-01-01,2024-01-01')
        envelope = run(manifest)
        self.assertEqual(envelope['records'], [])
        self.assertIn('no UCDP event dated between 2024-10-01 and 2026-10-04', envelope['excluded'][0]['reason'])

    def test_state_based_conflict_missing_from_acd_is_excluded_and_named(self):
        manifest = self.ws.manifest(
            '1,2026,1,88,SYNTHETIC: New,89,Government of France (SYNTHETIC),Synthetic Y,France,220,1,2026-03-01,2026-03-01,30,30,30,1,48.1,2.1')
        envelope = run(manifest)
        self.assertEqual(envelope['records'], [])
        self.assertIn('absent from the supplied Armed Conflict Dataset', envelope['excluded'][0]['reason'])

    def test_date_end_after_the_window_end_is_clamped_with_a_warning(self):
        manifest = self.ws.manifest(
            '1,2026,1,99,SYNTHETIC: Clamp,98,Government of France (SYNTHETIC),Synthetic Z,France,220,4,2026-10-01,2026-10-31,3,3,3,1,48.1,2.1',
            '99,France,Government of France (SYNTHETIC),Synthetic Z,2025,1,3,2025-01-01,2025-01-01')
        envelope = run(manifest)
        self.assertEqual(envelope['records'][0]['latest_evidence'], WINDOW_END)
        self.assertTrue(any('clamped to the window end' in w for w in envelope['warnings']))

    def test_missing_column_is_a_named_hard_error(self):
        manifest = self.ws.manifest('1,2025,1,5,SYNTHETIC,6,A,B,France,220,1,2025-01-01,2025-01-01,1,1,1,1,0,0')
        (self.ws.dir / 'ged.csv').write_text(GED_HEADER.replace('best,', 'best_estimate,') + '\n1,2025,1,5,SYNTHETIC,6,A,B,France,220,1,2025-01-01,2025-01-01,1,1,1,1,0,0\n')
        with self.assertRaisesRegex(ingest.IngestError, r'missing column\(s\) best'):
            run(manifest)

    def test_manifest_needs_licence_citation_and_a_boolean_provisional_flag(self):
        for field, value, message in (('licence', '', 'licence'), ('provisional', 'no', 'provisional'), ('doi', 'not-a-doi', 'doi')):
            with self.subTest(field=field):
                manifest = self.ws.manifest('1,2025,1,5,SYNTHETIC,6,A,B,France,220,1,2025-01-01,2025-01-01,1,1,1,1,0,0', **{field: value})
                with self.assertRaisesRegex(ingest.IngestError, message):
                    run(manifest)

    def test_window_never_ends_in_the_future(self):
        manifest = self.ws.manifest('1,2025,1,5,SYNTHETIC,6,A,B,France,220,1,2025-01-01,2025-01-01,1,1,1,1,0,0')
        with self.assertRaisesRegex(ingest.IngestError, 'never ends in the future'):
            ingest.build(str(manifest), window_end='2099-01-01')

    def test_country_map_override_resolves_an_unmapped_name(self):
        manifest = self.ws.manifest(
            '1,2025,1,5,SYNTHETIC,6,Government of Kosovo (SYNTHETIC),Synthetic K,Kosovo,347,1,2025-01-01,2025-01-01,30,30,30,1,42.6,21.1',
            '5,Kosovo,Government of Kosovo (SYNTHETIC),Synthetic K,2025,1,3,2025-01-01,2025-01-01')
        (self.ws.dir / 'map.json').write_text(json.dumps({'347': 'XK'}))
        envelope = run(manifest, country_map_path=str(self.ws.dir / 'map.json'))
        self.assertEqual(envelope['records'][0]['countries'][0]['code'], 'XK')

    def test_catalog_name_fallback_uses_countries_json(self):
        manifest = self.ws.manifest(
            '1,2025,1,5,SYNTHETIC,6,Government of Testland,Synthetic T,Faroe Islands,,1,2025-01-01,2025-01-01,30,30,30,1,62.0,-6.8',
            '5,Faroe Islands,Government of Testland,Synthetic T,2025,1,3,2025-01-01,2025-01-01')
        (self.ws.dir / 'countries.json').write_text(json.dumps([{'code': 'FO', 'name': 'Faroe Islands', 'region': 'Europe'}]))
        envelope = run(manifest, countries_path=str(self.ws.dir / 'countries.json'))
        self.assertEqual(envelope['records'][0]['countries'][0]['code'], 'FO')


class CandidateCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.envelope = run()

    def mutated(self, mutate):
        data = copy.deepcopy(self.envelope)
        mutate(data)
        return data

    def test_valid_output_passes(self):
        ingest.check_candidates(copy.deepcopy(self.envelope))

    def test_coordinate_fields_are_refused(self):
        for key in ('latitude', 'lon', 'geom_wkt', 'adm_1', 'where_coordinates'):
            with self.subTest(key=key), self.assertRaisesRegex(ingest.IngestError, 'forbidden field name|exactly'):
                ingest.check_candidates(self.mutated(lambda d: d['records'][0].__setitem__(key, 1.0)))
        with self.assertRaisesRegex(ingest.IngestError, 'coordinate-like'):
            ingest.check_candidates(self.mutated(lambda d: d['records'][0].__setitem__('note', 'near 48.123456, 2.654321')))

    def test_status_severity_and_trend_fields_are_refused(self):
        for key in ('status', 'severity', 'risk_level', 'danger', 'score', 'trend'):
            with self.subTest(key=key), self.assertRaisesRegex(ingest.IngestError, 'forbidden field name|exactly'):
                ingest.check_candidates(self.mutated(lambda d: d['records'][0]['ucdp'].__setitem__(key, 'x')))

    def test_single_figure_without_bounds_is_refused(self):
        def mutate(d):
            d['records'][0]['fatalities'][0].update(low=d['records'][0]['fatalities'][0]['best'] + 1)
        with self.assertRaisesRegex(ingest.IngestError, 'low <= best <= high'):
            ingest.check_candidates(self.mutated(mutate))
        with self.assertRaisesRegex(ingest.IngestError, 'exactly'):
            ingest.check_candidates(self.mutated(lambda d: d['records'][0]['fatalities'][0].pop('low')))

    def test_ongoing_wording_and_unknown_kind_are_refused(self):
        with self.assertRaisesRegex(ingest.IngestError, 'banned wording'):
            ingest.check_candidates(self.mutated(lambda d: d['records'][0].__setitem__('note', 'Fighting is ongoing.')))
        with self.assertRaisesRegex(ingest.IngestError, 'unsupported kind'):
            ingest.check_candidates(self.mutated(lambda d: d['records'][0].__setitem__('kind', 'war')))
        with self.assertRaisesRegex(ingest.IngestError, 'candidates only'):
            ingest.check_candidates(self.mutated(lambda d: d.__setitem__('publication', 'published')))


if __name__ == '__main__':
    unittest.main()
