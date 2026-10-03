"""The public roadmap may never claim "shipped" without a CI-run test, promise dates or cite unreal evidence."""
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_data import ValidationError  # noqa: E402
from validate_roadmap import validate_roadmap, validate_roadmap_repository  # noqa: E402

REPOSITORY = Path(__file__).resolve().parents[1]
NOW = datetime(2026, 10, 3, 12, 0, tzinfo=timezone.utc)


def item(**changes):
    base = {
        'id': 'mobile-first-redesign', 'title': 'Mobile-first redesign', 'summary': 'Separate views with readable cards.',
        'area': 'interface', 'status': 'shipped', 'last_reviewed': '2026-10-02', 'shipped_in': '4.0',
        'shipped_on': '2026-10-02',
        'evidence': [{'kind': 'test', 'ref': 'tests/test_x.py::test_feature', 'label': 'Feature test'},
                     {'kind': 'file', 'ref': 'index.html', 'label': 'Shell'}],
        'blocked_by': None, 'depends_on': [],
        'acceptance': 'A phone reader reaches the first record within 1.5 screens.',
    }
    base.update(changes)
    return base


def planned(**changes):
    return item(**{'id': 'issue-tags-normalised', 'status': 'next', 'shipped_in': None, 'shipped_on': None,
                   'evidence': [], **changes})


def manifest(*items):
    return {
        'schema_version': 1,
        'updated_at': '2026-10-02T23:00:00Z',
        'note': 'Planned items are intentions, not promises, and carry no dates.',
        'items': list(items) or [item(), planned()],
    }


class RoadmapValidatorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / 'tests/browser').mkdir(parents=True)
        (self.root / 'tests/test_x.py').write_text(
            'import unittest\n\nclass FeatureTests(unittest.TestCase):\n    def test_feature(self):\n        pass\n')
        (self.root / 'tests/y.mjs').write_text("import test from 'node:test';\ntest('shell works', () => {});\n")
        (self.root / 'tests/browser/smoke.cjs').write_text("check('shell works');\n")
        (self.root / 'tests/browser/test_z.py').write_text('def test_feature():\n    pass\n')
        (self.root / 'index.html').write_text('<!doctype html>')
        (self.root / 'docs').mkdir()
        (self.root / 'docs/UX_SPEC.md').write_text('# UX')
        (self.root / 'research').mkdir()
        (self.root / 'research/notes.md').write_text('leads')

    def tearDown(self):
        self.tmp.cleanup()

    def check(self, data):
        return validate_roadmap(data, NOW, evidence_root=self.root)

    def fails(self, data, pattern):
        with self.assertRaisesRegex(ValidationError, pattern):
            self.check(data)

    def test_valid_manifest_passes(self):
        self.check(manifest())
        self.check(manifest(item(evidence=[{'kind': 'test', 'ref': 'tests/y.mjs::shell works', 'label': 'Shell'}]),
                            planned(evidence=[{'kind': 'doc', 'ref': 'docs/UX_SPEC.md', 'label': 'Spec'},
                                              {'kind': 'commit', 'ref': 'cf3349d', 'label': 'Scaffold'},
                                              {'kind': 'url', 'label': 'Run',
                                               'ref': 'https://github.com/occult-kranti/protest-atlas/actions/runs/1'}])))
        self.check(manifest(item(evidence=[{'kind': 'test', 'label': 'Class form',
                                            'ref': 'tests/test_x.py::FeatureTests.test_feature'}])))

    def test_shipped_without_evidence_fails(self):
        self.fails(manifest(item(evidence=[])), 'needs test evidence')

    def test_shipped_with_only_file_evidence_needs_test(self):
        self.fails(manifest(item(evidence=[{'kind': 'file', 'ref': 'index.html', 'label': 'Shell'}])), 'needs test')

    def test_test_ref_with_absent_name_fails(self):
        for ref in ('tests/test_x.py::test_missing', 'tests/y.mjs::map works', 'tests/test_x.py::Missing.test_feature',
                    'tests/test_x.py::FeatureTests', 'tests/test_x.py::', 'tests/test_x.py'):
            with self.subTest(ref=ref):
                self.fails(manifest(item(evidence=[{'kind': 'test', 'ref': ref, 'label': 'Test'}])), 'test')

    def test_browser_and_non_ci_test_refs_fail(self):
        for ref in ('tests/browser/smoke.cjs::shell works', 'tests/browser/test_z.py::test_feature',
                    'tests/browser/y.mjs::shell works', 'index.html::doctype'):
            with self.subTest(ref=ref):
                self.fails(manifest(item(evidence=[{'kind': 'test', 'ref': ref, 'label': 'Smoke'}])), 'CI runs')

    def test_unresolvable_files_fail(self):
        (self.root / 'linked.html').symlink_to(self.root / 'index.html')
        cases = {'missing.html': 'does not exist', '../secret': 'inside the repository', '/etc/passwd': 'absolute',
                 'linked.html': 'symlink', 'research/notes.md': 'research', './index.html': 'normalised',
                 'tests/../index.html': 'inside the repository'}
        for ref, pattern in cases.items():
            with self.subTest(ref=ref):
                self.fails(manifest(item(), planned(evidence=[{'kind': 'file', 'ref': ref, 'label': 'File'}])), pattern)
        self.fails(manifest(item(), planned(evidence=[{'kind': 'doc', 'ref': 'index.html', 'label': 'Doc'}])), 'docs/')

    def test_symlinked_test_file_fails(self):
        (self.root / 'tests/test_link.py').symlink_to(self.root / 'tests/test_x.py')
        self.fails(manifest(item(evidence=[{'kind': 'test', 'ref': 'tests/test_link.py::test_feature', 'label': 'T'}])),
                   'symlink')

    def test_non_shipped_with_ship_fields_fails(self):
        self.fails(manifest(item(), planned(shipped_on='2026-10-02')), 'ship date')
        self.fails(manifest(item(), planned(shipped_in='4.0')), 'release')
        self.fails(manifest(item(shipped_in=None)), 'release')
        self.fails(manifest(item(shipped_in='v4')), 'release')

    def test_blocked_needs_blocker_and_only_blocked_has_one(self):
        self.fails(manifest(item(), planned(status='blocked')), 'blocked_by')
        self.fails(manifest(item(), planned(blocked_by='No editor appointed.')), 'only blocked items')
        self.fails(manifest(item(blocked_by='Nothing.')), 'only blocked items')
        self.check(manifest(item(), planned(status='blocked', blocked_by='No editor appointed.')))

    def test_future_and_inconsistent_dates_fail(self):
        self.fails(manifest(item(), planned(last_reviewed='2026-10-04')), 'future')
        self.fails(manifest(item(shipped_on='2026-10-03', last_reviewed='2026-10-02')), 'shipped after')
        data = manifest(item(last_reviewed='2026-10-03', shipped_on='2026-10-03'))
        self.fails(data, 'reviewed after the roadmap was updated')
        data = manifest()
        data['updated_at'] = '2026-10-03T13:00:00Z'
        self.fails(data, 'future')
        data['updated_at'] = '2026-10-02'
        self.fails(data, 'timestamp')
        self.fails(manifest(item(last_reviewed='2 Oct 2026')), 'ISO day')

    def test_unknown_fields_ids_and_dependencies_fail(self):
        self.fails(manifest(item(target_date='2026-12-01')), 'exactly')
        data = manifest()
        data['owner'] = 'lead'
        self.fails(data, 'exactly')
        self.fails(manifest(item(), planned(id='mobile-first-redesign')), 'duplicate')
        self.fails(manifest(item(), planned(depends_on=['not-an-item'])), 'unknown dependency')
        self.fails(manifest(item(), planned(depends_on=['issue-tags-normalised'])), 'itself')
        self.fails(manifest(item(), planned(depends_on=['mobile-first-redesign', 'mobile-first-redesign'])), 'duplicate')
        self.fails(manifest(item(depends_on=['issue-tags-normalised']), planned(depends_on=['mobile-first-redesign'])),
                   'cycle')
        self.fails(manifest(item(), planned(id='Bad ID')), 'slug')

    def test_types_and_lengths_fail(self):
        self.fails(manifest(item(title='x' * 81)), 'title')
        self.fails(manifest(item(summary='x' * 401)), 'summary')
        self.fails(manifest(item(acceptance='')), 'acceptance')
        self.fails(manifest(item(area='design')), 'area')
        self.fails(manifest(item(status='done')), 'status')
        self.fails(manifest(item(), planned(status='blocked', blocked_by='x' * 301)), 'blocked_by')
        long_label = [{'kind': 'test', 'ref': 'tests/test_x.py::test_feature', 'label': 'x' * 121}]
        self.fails(manifest(item(evidence=long_label)), 'label')
        self.fails(manifest(item(evidence=[{'kind': 'blog', 'ref': 'x', 'label': 'x'}])), 'kind')
        data = manifest()
        data['schema_version'] = True
        self.fails(data, 'schema')
        data = manifest()
        data['items'] = []
        self.fails(data, 'empty')

    def test_note_must_disclaim_promises(self):
        data = manifest()
        data['note'] = 'Everything below will ship by December.'
        self.fails(data, 'intentions')
        for note in ('These are not promises.', 'Not a commitment to any date.', 'Intentions, not plans.'):
            data['note'] = note
            self.check(data)

    def test_url_evidence_outside_repository_fails(self):
        for ref in ('https://example.org/protest-atlas/run', 'http://github.com/occult-kranti/protest-atlas/x',
                    'https://github.com/someone-else/protest-atlas/actions', 'javascript:alert(1)',
                    'https://github.com.evil.example/occult-kranti/protest-atlas/x'):
            with self.subTest(ref=ref):
                self.fails(manifest(item(), planned(evidence=[{'kind': 'url', 'ref': ref, 'label': 'Run'}])), 'URL')

    def test_url_evidence_that_normalises_out_of_the_repository_fails(self):
        # Browsers resolve these to github.com/evil/... although the string starts with the repository URL.
        base = 'https://github.com/occult-kranti/protest-atlas/'
        for ref in (base + '../../evil/x', base + '%2e%2e/%2E%2E/evil/x', base + '.%2e/.%2e/evil', base + './actions',
                    base + 'a/../../../evil', base + 'a%2f..%2f..%2fevil', base + 'a\\..\\..\\evil',
                    'https://user@github.com/occult-kranti/protest-atlas/x', base + '/evil'):
            with self.subTest(ref=ref):
                self.fails(manifest(item(), planned(evidence=[{'kind': 'url', 'ref': ref, 'label': 'Run'}])), 'URL')
        for ref in (base + 'actions/runs/37067775278', base + 'blob/main/docs/ROADMAP.md', base + 'tree/main/'):
            with self.subTest(ref=ref):
                self.check(manifest(item(), planned(evidence=[{'kind': 'url', 'ref': ref, 'label': 'Run'}])))
        self.fails(manifest(item(), planned(evidence=[{'kind': 'commit', 'ref': 'HEAD', 'label': 'Head'}])), 'SHA')

    def test_real_roadmap_validates_against_repository_with_real_clock(self):
        data = validate_roadmap_repository(REPOSITORY)
        raw = json.loads((REPOSITORY / 'public/roadmap.json').read_text(encoding='utf-8'))
        # Counts follow the file, so a roadmap edit or the §22.4 flip does not turn CI red without a defect.
        self.assertEqual(len(data['items']), len(raw['items']))
        self.assertTrue(data['items'])
        self.assertEqual(len({entry['id'] for entry in data['items']}), len(data['items']))
        # Work from this release stays in progress until the deployed build passes its checks (SPEC §20, §22.4).
        shipped = {entry['id'] for entry in data['items'] if entry['status'] == 'shipped'}
        self.assertFalse(shipped & {'mobile-first-redesign', 'clear-dates-and-stale-warnings',
                                    'record-cards-key-dimensions', 'ahead-page'})
        for entry in data['items']:
            if entry['status'] == 'shipped':
                self.assertTrue(any(e['kind'] == 'test' for e in entry['evidence']), entry['id'])

    def test_repository_file_is_required(self):
        with self.assertRaisesRegex(ValidationError, 'required roadmap'):
            validate_roadmap_repository(self.root)

    def test_build_fails_on_invalid_roadmap(self):
        from build import PUBLIC_COPIES, OPTIONAL_FILES, build
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in PUBLIC_COPIES:
                if name in OPTIONAL_FILES and not (REPOSITORY / name).exists():
                    continue
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(REPOSITORY / name, target)
            roadmap = json.loads((root / 'public/roadmap.json').read_text(encoding='utf-8'))
            broken = copy.deepcopy(roadmap)
            first_planned = next(entry for entry in broken['items'] if entry['status'] == 'next')
            first_planned.update(status='shipped', shipped_in='4.0', shipped_on='2026-10-02')
            (root / 'public/roadmap.json').write_text(json.dumps(broken), encoding='utf-8')
            with self.assertRaisesRegex(ValidationError, 'needs test evidence'):
                build(root)
            os.remove(root / 'public/roadmap.json')
            with self.assertRaisesRegex(ValidationError, 'roadmap.json'):
                build(root)


if __name__ == '__main__':
    unittest.main()
