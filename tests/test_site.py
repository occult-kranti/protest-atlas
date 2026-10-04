"""Offline internal link check of the built site (tech §10.2, SPEC §15).

Builds the publication allowlist into a temporary root, then checks that every local reference in the published
HTML, import map, CSS and JavaScript resolves to a published file, that 404.html is self-contained, and that the
GeoJSON is not published.
"""
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from build import OPTIONAL_FILES, PUBLIC_COPIES, build  # noqa: E402

REPOSITORY = Path(__file__).resolve().parents[1]
EXTERNAL = ('https://', 'http://', 'mailto:', 'data:')
JS_SPECIFIERS = (
    re.compile(r'''\bimport\s+(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]'''),
    re.compile(r'''\bexport\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]'''),
    re.compile(r'''\bimport\(\s*['"]([^'"]+)['"]\s*\)'''),
)
PUBLIC_JSON = re.compile(r'''['"`](public/[A-Za-z0-9_.-]+\.json)['"`]''')
CSS_URL = re.compile(r'''url\(\s*['"]?([^'")]+)['"]?\s*\)''')


class RefCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.importmaps, self.meta, self._script = [], [], [], None

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for name in ('href', 'src', 'srcset', 'poster', 'action', 'data'):
            if attributes.get(name) is not None:
                self.refs.append((tag, name, attributes[name]))
        if tag == 'meta':
            self.meta.append(attributes)
        if tag == 'script' and attributes.get('type') == 'importmap':
            self._script = []

    def handle_data(self, data):
        if self._script is not None:
            self._script.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self._script is not None:
            self.importmaps.append(''.join(self._script))
            self._script = None


def parse(path):
    collector = RefCollector()
    collector.feed(path.read_text(encoding='utf-8'))
    collector.close()
    return collector


class BuiltSiteLinkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        for name in PUBLIC_COPIES:
            source = REPOSITORY / name
            if name in OPTIONAL_FILES and not source.exists():
                continue
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        cls.site = build(root)
        cls.files = {p.relative_to(cls.site).as_posix() for p in cls.site.rglob('*') if p.is_file()}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def resolve(self, owner, reference):
        """Output-relative path for a local reference made from the file `owner`, or None for non-file refs."""
        parts = urlsplit(reference)
        if parts.scheme or parts.netloc:
            return None
        path = unquote(parts.path)
        if not path:
            return None  # same-document fragment or query only
        base = PurePosixPath(owner).parent
        target = PurePosixPath(path.lstrip('/')) if path.startswith('/') else base / path
        normalised = []
        for part in target.parts:
            if part == '..':
                self.assertTrue(normalised, f'{owner}: {reference} escapes the site root')
                normalised.pop()
            elif part not in ('.', ''):
                normalised.append(part)
        resolved = '/'.join(normalised)
        if not resolved or reference.endswith('/'):
            resolved = f'{resolved}/index.html'.lstrip('/')
        return resolved

    def assert_published(self, owner, reference):
        resolved = self.resolve(owner, reference)
        if resolved is not None:
            self.assertIn(resolved, self.files, f'{owner}: broken internal reference {reference!r}')

    def html_files(self):
        return sorted(name for name in self.files if name.endswith('.html'))

    def test_every_html_reference_resolves(self):
        pages = self.html_files()
        self.assertTrue({'index.html', '404.html', 'review.html'} <= set(pages))
        for page in pages:
            if page == '404.html':
                continue  # absolute /protest-atlas/ links; checked separately below
            for tag, attribute, value in parse(self.site / page).refs:
                with self.subTest(page=page, tag=tag, ref=value):
                    self.assertFalse(value.strip().lower().startswith('javascript:'), 'javascript: URLs are forbidden')
                    if value.startswith(EXTERNAL) or value.startswith('#'):
                        continue
                    self.assert_published(page, value)

    def test_import_map_targets_and_modulepreloads_resolve(self):
        collector = parse(self.site / 'index.html')
        self.assertEqual(len(collector.importmaps), 1, 'index.html has exactly one import map')
        imports = json.loads(collector.importmaps[0])['imports']
        self.assertTrue(imports)
        for key, target in imports.items():
            with self.subTest(key=key):
                self.assert_published('index.html', key)
                self.assert_published('index.html', target)
        preloads = [value for tag, attribute, value in collector.refs if tag == 'link' and attribute == 'href' and '.js' in value]
        self.assertTrue(preloads, 'modulepreload links exist')
        for value in preloads:
            self.assert_published('index.html', value)

    def test_every_javascript_import_resolves(self):
        scripts = sorted(name for name in self.files if name.endswith('.js') and not name.startswith('vendor/'))
        self.assertIn('app.js', scripts)
        for script in scripts:
            source = (self.site / script).read_text(encoding='utf-8')
            for pattern in JS_SPECIFIERS:
                for specifier in pattern.findall(source):
                    with self.subTest(script=script, specifier=specifier):
                        self.assertTrue(specifier.startswith(('./', '../')), f'{script}: bare or absolute specifier {specifier}')
                        self.assertNotIn('?v=', specifier, 'versioning lives in the import map (tech §4.1)')
                        self.assert_published(script, specifier)

    def test_public_json_constants_resolve(self):
        for script in ('js/data.js', 'map.js', 'js/map-view.js'):
            if script not in self.files:
                continue
            for path in PUBLIC_JSON.findall((self.site / script).read_text(encoding='utf-8')):
                if path in OPTIONAL_FILES and not (REPOSITORY / path).exists():
                    continue   # optional data with a designed absent state (upcoming.json, conflicts.json; 4.1 §6.8)
                with self.subTest(script=script, path=path):
                    self.assertIn(path, self.files, f'{script} names {path}, which is not published')

    def test_stylesheet_urls_resolve(self):
        for sheet in sorted(name for name in self.files if name.endswith('.css')):
            for value in CSS_URL.findall((self.site / sheet).read_text(encoding='utf-8')):
                if value.startswith(EXTERNAL) or value.startswith('#'):
                    continue
                with self.subTest(sheet=sheet, url=value):
                    self.assert_published(sheet, value)

    def test_404_is_self_contained_and_noindex(self):
        collector = parse(self.site / '404.html')
        for tag, attribute, value in collector.refs:
            with self.subTest(tag=tag, ref=value):
                self.assertTrue(value.startswith(('/protest-atlas/', 'https://')),
                                f'404.html {tag}[{attribute}]={value!r} must start with /protest-atlas/ or https:// (SPEC §15)')
                if value.startswith('/protest-atlas/'):
                    self.assert_published('index.html', value[len('/protest-atlas/'):] or './')
        robots = [m.get('content', '') for m in collector.meta if (m.get('name') or '').lower() == 'robots']
        self.assertTrue(any('noindex' in content.lower() for content in robots), '404.html needs <meta name="robots" content="noindex">')
        source = (self.site / '404.html').read_text(encoding='utf-8')
        self.assertNotRegex(source, r'<link[^>]+rel=["\']?stylesheet', 'no external stylesheet')
        self.assertNotRegex(source, r'<script[^>]+\bsrc=', 'no external script')

    def test_geojson_and_private_files_are_not_published(self):
        self.assertNotIn('public/world-countries.geo.json', self.files)
        self.assertNotIn('atlas.css', self.files)
        self.assertNotIn('history.css', self.files)
        self.assertFalse(any(name.startswith(('research/', 'scripts/', 'tests/', 'docs/', '.git')) for name in self.files))
        self.assertIn('public/roadmap.json', self.files)
        self.assertIn('public/build-info.json', self.files)

    def test_review_page_references_resolve(self):
        refs = [value for tag, attribute, value in parse(self.site / 'review.html').refs
                if not value.startswith(EXTERNAL) and not value.startswith('#')]
        self.assertTrue(refs)
        for value in refs:
            with self.subTest(ref=value):
                self.assert_published('review.html', value)


class WorkflowPinTests(unittest.TestCase):
    """Every action is pinned to a full SHA, and docs/DEPLOYMENT.md lists the same version and SHA (tech §10.3)."""

    USES = re.compile(r'^\s*(?:-\s*)?uses:\s*([\w.-]+/[\w.-]+)@(\S+)(?:\s+#\s*(\S+))?\s*$', re.M)

    def test_actions_are_sha_pinned_and_documented(self):
        docs = (REPOSITORY / 'docs/DEPLOYMENT.md').read_text(encoding='utf-8')
        table = {name: (version, sha) for name, version, sha in
                 re.findall(r'^\|\s*([\w.-]+)\s*\|\s*(v[\d.]+)\s*\|\s*`([0-9a-f]{40})`\s*\|', docs, re.M)}
        workflows = sorted((REPOSITORY / '.github/workflows').glob('*.yml'))
        self.assertTrue(workflows)
        seen = 0
        for workflow in workflows:
            for action, ref, version in self.USES.findall(workflow.read_text(encoding='utf-8')):
                seen += 1
                with self.subTest(workflow=workflow.name, action=action):
                    self.assertRegex(ref, r'^[0-9a-f]{40}$', f'{action} must be pinned to a full commit SHA')
                    self.assertTrue(version, f'{action} needs a "# vX.Y.Z" comment naming the pinned release')
                    name = action.split('/', 1)[1]
                    self.assertIn(name, table, f'docs/DEPLOYMENT.md has no pin row for {name}')
                    self.assertEqual(table[name], (version, ref), f'docs/DEPLOYMENT.md pin row for {name} is out of date')
        self.assertGreater(seen, 0)

    def test_verify_parses_every_required_json_file(self):
        """The verify job parses every required .json it checks for HTTP 200, as docs/DEPLOYMENT.md says."""
        workflow = (REPOSITORY / '.github/workflows/pages.yml').read_text(encoding='utf-8')
        parsed = re.search(r'^\s*json_paths="([^"]*)"\s*$', workflow, re.M)
        self.assertIsNotNone(parsed, 'verify must start json_paths with the required JSON files')
        required = re.search(r'^\s*for path in "" ((?:"[^"]*"\s*)+); do\s*$', workflow, re.M)
        self.assertIsNotNone(required, 'verify must list the paths that have to answer 200')
        json_required = {path for path in re.findall(r'"([^"]+)"', required.group(1)) if path.endswith('.json')}
        self.assertIn('public/events.json', json_required)
        self.assertLessEqual(json_required, set(parsed.group(1).split()))
        # Optional files (build.OPTIONAL_FILES) are reported as a notice on 404, never required (4.1 §6.8).
        for optional in ('public/upcoming.json', 'public/conflicts.json'):
            self.assertIn(optional, OPTIONAL_FILES)
            self.assertNotIn(optional, json_required)
            self.assertRegex(workflow, rf'404\) echo "::notice::{re.escape(optional)} is not published in this build')


if __name__ == '__main__':
    unittest.main()
