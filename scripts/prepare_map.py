#!/usr/bin/env python3
"""Prepare the pinned local Natural Earth topology for the country directory.

No network or third-party Python packages are needed. Shared arcs are decoded
without simplification; country polygons remain the world-atlas source geometry.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


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
        code = codes.get(str(geometry.get('id', '')).zfill(3))
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
    mapped = {feature['properties']['code'] for feature in features if feature['properties']['code']}
    metadata = {
        'source': 'world-atlas@2.0.2/countries-110m.json (Natural Earth Admin 0, 1:110m)',
        'projection_at_runtime': 'Equal Earth',
        'feature_count': len(features), 'mapped_iso_country_count': len(mapped),
        'directory_count': len(directory),
        'directory_codes_without_geometry': sorted(set(names) - mapped),
        'unmapped_source_areas': [feature['properties']['name'] for feature in features if not feature['properties']['code']],
        'source_sha256': hashlib.sha256(topology_path.read_bytes()).hexdigest(),
        'iso_mapping_sha256': hashlib.sha256(mapping_path.read_bytes()).hexdigest(),
        'geojson_sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
    }
    (root / 'public/world-map-metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return metadata


if __name__ == '__main__':
    metadata = prepare()
    print(f"Prepared {metadata['feature_count']} areas; {metadata['mapped_iso_country_count']} ISO countries; "
          f"{len(metadata['directory_codes_without_geometry'])} directory entries have no polygon at 1:110m.")
