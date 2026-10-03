#!/usr/bin/env python3
"""Prepare the pinned local Natural Earth topology for the country directory and the map.

No network or third-party Python packages are needed. Shared arcs are decoded
without simplification; country polygons remain the world-atlas source geometry.

Outputs (all deterministic, so a re-run is byte-identical):
- public/world-countries.geo.json: kept in the repository for tests; not published or fetched.
- public/world-map-codes.json: raw topology geometry id -> ISO 3166-1 alpha-2 code. The browser
  decodes the topology with topojson-client and attaches codes from this table, so the 426 KB
  GeoJSON is never requested at runtime. Id-less areas (N. Cyprus, Somaliland, Kosovo) have no entry.
- public/world-map-metadata.json: counts, the directory entries without a polygon, and hashes.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODES_SOURCE = ('public/world-110m.topo.json (world-atlas 2.0.2) numeric ids mapped through '
                'vendor/iso-country-codes.json')


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def geometry_code(geometry, codes):
    """ISO alpha-2 for a topology geometry, or None (the id-less areas)."""
    return codes.get(str(geometry.get('id', '')).zfill(3))


def code_table(topology, codes):
    """{raw geometry id: alpha-2}, sorted by id (it gzips smaller); geometries without a mapped id are omitted."""
    table = {}
    for geometry in topology['objects']['countries']['geometries']:
        code = geometry_code(geometry, codes)
        if geometry.get('id') is not None and code:
            table[str(geometry['id'])] = code
    return dict(sorted(table.items()))


def prepare(root=ROOT):
    root = Path(root)
    topology_path = root / 'public/world-110m.topo.json'
    mapping_path = root / 'vendor/iso-country-codes.json'
    topology = json.loads(topology_path.read_text(encoding='utf-8'))
    mapping = json.loads(mapping_path.read_text(encoding='utf-8'))
    directory = json.loads((root / 'public/countries.json').read_text(encoding='utf-8'))
    codes = {row['country-code']: row['alpha-2'] for row in mapping}
    names = {row['code']: row['name'] for row in directory}
    transform = topology['transform']
    decoded = []
    for arc in topology['arcs']:
        x = y = 0
        points = []
        for dx, dy in arc:
            x += dx
            y += dy
            points.append([x * transform['scale'][0] + transform['translate'][0],
                           y * transform['scale'][1] + transform['translate'][1]])
        decoded.append(points)

    def ring(indices):
        points = []
        for index in indices:
            arc = decoded[index] if index >= 0 else list(reversed(decoded[~index]))
            points.extend(arc if not points else arc[1:])
        if points and points[-1] != points[0]:
            points.append(points[0][:])
        while len(points) < 4:
            points.append(points[0][:])
        return points

    features = []
    for geometry in topology['objects']['countries']['geometries']:
        code = geometry_code(geometry, codes)
        name = names.get(code, geometry['properties']['name'])
        kind = geometry['type']
        if kind == 'Polygon':
            coordinates = [ring(indices) for indices in geometry['arcs']]
        elif kind == 'MultiPolygon':
            coordinates = [[ring(indices) for indices in polygon] for polygon in geometry['arcs']]
        else:
            raise ValueError(f'Unexpected country geometry: {kind}')
        features.append({'type': 'Feature', 'properties': {'code': code, 'name': name},
                         'geometry': {'type': kind, 'coordinates': coordinates}})

    result = {'type': 'FeatureCollection', 'features': features}
    destination = root / 'public/world-countries.geo.json'
    destination.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

    codes_document = {
        'schema_version': 1,
        'source': CODES_SOURCE,
        'topology_sha256': sha256(topology_path),
        'codes': code_table(topology, codes),
    }
    codes_path = root / 'public/world-map-codes.json'
    codes_path.write_text(json.dumps(codes_document, ensure_ascii=False, separators=(',', ':')) + '\n',
                          encoding='utf-8')

    mapped = {feature['properties']['code'] for feature in features if feature['properties']['code']}
    metadata = {
        'source': 'world-atlas@2.0.2/countries-110m.json (Natural Earth Admin 0, 1:110m)',
        'projection_at_runtime': 'Equal Earth',
        'feature_count': len(features), 'mapped_iso_country_count': len(mapped),
        'directory_count': len(directory),
        'directory_codes_without_geometry': sorted(set(names) - mapped),
        'unmapped_source_areas': [feature['properties']['name'] for feature in features if not feature['properties']['code']],
        'source_sha256': sha256(topology_path),
        'iso_mapping_sha256': sha256(mapping_path),
        'geojson_sha256': sha256(destination),
        'codes_sha256': sha256(codes_path),
    }
    (root / 'public/world-map-metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return metadata


if __name__ == '__main__':
    metadata = prepare()
    print(f"Prepared {metadata['feature_count']} areas; {metadata['mapped_iso_country_count']} ISO countries; "
          f"{len(metadata['directory_codes_without_geometry'])} directory entries have no polygon at 1:110m; "
          f"code table written to public/world-map-codes.json.")
