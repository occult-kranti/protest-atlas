#!/usr/bin/env python3
"""Validate and publish only the explicit static-site allowlist."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

from validate_data import ROOT, ValidationError, validate_repository
from validate_coverage import validate_repository_coverage
from validate_history import validate_history_repository
from validate_upcoming import validate_upcoming_repository

PUBLIC_FILES = (
    'index.html', 'styles.css', 'app.js', 'atlas.css', 'explore.js', 'map.js',
    'review.html', 'review.css', 'review.js', 'history.js', 'history.css',
    'public/event-context.json', 'public/research-ledger.json', 'public/cities.json',
    'public/events.json', 'public/countries.json', 'public/examples.json',
    'public/coverage.json', 'public/discovery-status.json', 'public/upcoming.json',
    'public/world-countries.geo.json', 'public/world-110m.topo.json',
    'public/world-map-metadata.json',
    'vendor/d3.v7.9.0.min.js', 'vendor/topojson-client.v3.1.0.min.js',
    'vendor/NATURAL_EARTH_LICENSE.md', 'vendor/D3_LICENSE', 'vendor/TOPOJSON_CLIENT_LICENSE', 'vendor/WORLD_ATLAS_LICENSE',
)
PUBLIC_COPIES = {name: name for name in PUBLIC_FILES} | {'tests/layout-preview.html': 'checks.html'}
OPTIONAL_FILES = {'public/examples.json', 'public/upcoming.json'}
# Generated at build time. Describes the deployment only; never an observation, source check or review time.
GENERATED_FILES = ('public/build-info.json',)


def build_info(root):
    commit = os.environ.get('GITHUB_SHA', '')
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        try:
            commit = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=root, capture_output=True, text=True,
                                    timeout=10, check=True).stdout.strip()
        except (OSError, subprocess.SubprocessError):
            commit = ''
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    return {
        'schema_version': 1,
        'built_at': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'commit': commit if re.fullmatch(r'[0-9a-f]{40}', commit) else None,
        'workflow_run_id': int(run_id) if run_id.isdigit() else None,
        'note': 'Site build time only. It does not change or imply any observation, source-check or editorial-review date.',
    }


def build(root=ROOT):
    root = Path(root).resolve()
    for name in PUBLIC_COPIES:
        source = root / name
        if name in OPTIONAL_FILES and not source.exists():
            continue
        if not source.is_file() or any(parent.is_symlink() for parent in (source, *source.parents) if parent != root.parent):
            raise ValidationError(f'{name}: missing file or symlink at publication boundary')
    validate_repository(root)
    validate_repository_coverage(root)
    validate_history_repository(root)
    validate_upcoming_repository(root)
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
        (staging / 'public').mkdir(exist_ok=True)
        (staging / GENERATED_FILES[0]).write_text(json.dumps(build_info(root), indent=2) + '\n', encoding='utf-8')
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(staging, destination)
    return destination


if __name__ == '__main__':
    try:
        print(f'Validated public files published to {build()}')
    except ValidationError as exc:
        raise SystemExit(f'Build failed: {exc}') from exc
