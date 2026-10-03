"""WP4 map assets: the code table reproduces the GeoJSON codes, hashes match, and prepare_map is deterministic."""
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import prepare_map  # noqa: E402

INPUTS = ('public/world-110m.topo.json', 'vendor/iso-country-codes.json', 'public/countries.json')
OUTPUTS = ('public/world-countries.geo.json', 'public/world-map-codes.json', 'public/world-map-metadata.json')


def load(relative):
    return json.loads((ROOT / relative).read_text(encoding='utf-8'))


def sha256(relative):
    return hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()


class MapAssetsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.topology = load('public/world-110m.topo.json')
        cls.geojson = load('public/world-countries.geo.json')
        cls.codes = load('public/world-map-codes.json')
        cls.metadata = load('public/world-map-metadata.json')
        cls.directory = load('public/countries.json')

    def test_code_table_reproduces_every_geojson_code_in_order(self):
        geometries = self.topology['objects']['countries']['geometries']
        self.assertEqual(len(geometries), 177)
        self.assertEqual(len(self.geojson['features']), 177)
        table = self.codes['codes']
        decoded = [table.get(str(g['id'])) if g.get('id') is not None else None for g in geometries]
        expected = [feature['properties']['code'] for feature in self.geojson['features']]
        self.assertEqual(decoded, expected)
        self.assertEqual(sum(code is None for code in decoded), 3)

    def test_code_table_shape(self):
        self.assertEqual(set(self.codes), {'schema_version', 'source', 'topology_sha256', 'codes'})
        self.assertEqual(self.codes['schema_version'], 1)
        self.assertIn('vendor/iso-country-codes.json', self.codes['source'])
        table = self.codes['codes']
        self.assertEqual(len(table), 174)
        self.assertEqual(len(set(table.values())), 174, 'one polygon per code')
        for key, code in table.items():
            self.assertRegex(key, r'^\d{3}$')
            self.assertRegex(code, r'^[A-Z]{2}$')
        self.assertEqual(table['250'], 'FR')
        self.assertEqual(table['032'], 'AR')
        self.assertEqual(table['010'], 'AQ')

    def test_every_code_exists_in_the_directory(self):
        directory = {row['code'] for row in self.directory}
        missing = sorted(set(self.codes['codes'].values()) - directory)
        self.assertEqual(missing, [])

    def test_metadata_hashes_match_the_files(self):
        self.assertEqual(self.metadata['source_sha256'], sha256('public/world-110m.topo.json'))
        self.assertEqual(self.metadata['iso_mapping_sha256'], sha256('vendor/iso-country-codes.json'))
        self.assertEqual(self.metadata['geojson_sha256'], sha256('public/world-countries.geo.json'))
        self.assertEqual(self.metadata['codes_sha256'], sha256('public/world-map-codes.json'))
        self.assertEqual(self.codes['topology_sha256'], sha256('public/world-110m.topo.json'))
        self.assertEqual(self.metadata['feature_count'], 177)
        self.assertEqual(self.metadata['mapped_iso_country_count'], 174)
        self.assertEqual(self.metadata['directory_count'], len(self.directory))
        self.assertEqual(self.metadata['unmapped_source_areas'], ['N. Cyprus', 'Somaliland', 'Kosovo'])

    def test_directory_entries_without_polygon(self):
        without = set(self.metadata['directory_codes_without_geometry'])
        self.assertEqual(len(without), 75)
        for code in ('AD', 'SG', 'AS', 'CK', 'FO', 'SX'):
            self.assertIn(code, without)
        self.assertFalse(without & set(self.codes['codes'].values()))

    def test_prepare_is_deterministic_and_reproduces_the_committed_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            for relative in INPUTS:
                target = Path(tmp) / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / relative, target)
            first = prepare_map.prepare(tmp)
            snapshot = {relative: (Path(tmp) / relative).read_bytes() for relative in OUTPUTS}
            second = prepare_map.prepare(tmp)
            self.assertEqual(first, second)
            for relative in OUTPUTS:
                rerun = (Path(tmp) / relative).read_bytes()
                self.assertEqual(rerun, snapshot[relative], f'{relative} differs between runs')
                self.assertEqual(rerun, (ROOT / relative).read_bytes(), f'{relative} differs from the committed file')

    def test_geojson_is_not_published_or_fetched(self):
        map_source = (ROOT / 'map.js').read_text(encoding='utf-8')
        self.assertNotIn('world-countries.geo.json', map_source)
        self.assertIn('public/world-110m.topo.json', map_source)
        self.assertIn('public/world-map-codes.json', map_source)


if __name__ == '__main__':
    unittest.main()
