#!/usr/bin/env python3
"""Validate and publish only the explicit static-site allowlist."""
from pathlib import Path
import shutil
import tempfile

from validate_data import ROOT, ValidationError, validate_repository
from validate_coverage import validate_repository_coverage

PUBLIC_FILES = (
    'index.html', 'styles.css', 'app.js', 'atlas.css', 'explore.js', 'map.js',
    'review.html', 'review.css', 'review.js',
    'public/events.json', 'public/countries.json', 'public/examples.json',
    'public/coverage.json', 'public/discovery-status.json',
    'public/world-countries.geo.json', 'public/world-110m.topo.json',
    'public/world-map-metadata.json',
    'vendor/d3.v7.9.0.min.js', 'vendor/topojson-client.v3.1.0.min.js',
    'vendor/D3_LICENSE', 'vendor/TOPOJSON_CLIENT_LICENSE', 'vendor/WORLD_ATLAS_LICENSE',
)
PUBLIC_COPIES = {name: name for name in PUBLIC_FILES} | {'tests/layout-preview.html': 'checks.html'}


def build(root=ROOT):
    root = Path(root).resolve()
    for name in PUBLIC_COPIES:
        source = root / name
        if name == 'public/examples.json' and not source.exists():
            continue
        if not source.is_file() or any(parent.is_symlink() for parent in (source, *source.parents) if parent != root.parent):
            raise ValidationError(f'{name}: missing file or symlink at publication boundary')
    validate_repository(root)
    validate_repository_coverage(root)
    destination = root / '_site'
    if destination.is_symlink():
        raise ValidationError('_site: symlink output forbidden')
    with tempfile.TemporaryDirectory(prefix='.site-build-', dir=root) as temporary:
        staging = Path(temporary)
        for name, output_name in PUBLIC_COPIES.items():
            source = root / name
            if not source.exists():
                continue
            target = staging / output_name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        (staging / '.nojekyll').write_text('', encoding='utf-8')
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(staging, destination)
    return destination


if __name__ == '__main__':
    try:
        print(f'Validated public files published to {build()}')
    except ValidationError as exc:
        raise SystemExit(f'Build failed: {exc}') from exc
