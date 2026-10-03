#!/usr/bin/env python3
"""Validate public/roadmap.json: site plans only, no promised dates, and no "shipped" claim without a CI-run test.

Rules (tech §8.3 with SPEC §20):
- envelope keys are exactly schema_version, updated_at, note, items; the note disclaims promises;
- item keys are exactly the 12 fields, with the types and lengths below;
- shipped => shipped_in, shipped_on and at least one `test` evidence entry that resolves to a test file the
  CI globs run (tests/test_*.py or tests/*.mjs, never tests/browser/);
- every evidence entry must resolve against the repository (evidence_root), never the temporary build root;
- no future dates; no build-time staleness failure (staleness is shown in the UI instead);
- ids are unique, dependencies resolve, and there are no cycles.
"""
from datetime import date, datetime, timezone
import os
from pathlib import Path, PurePosixPath
import posixpath
import re
from urllib.parse import urlsplit

from validate_data import ROOT, ValidationError, array, https_url, identifier, load_json, obj, require, text

STATUSES = ('shipped', 'in-progress', 'next', 'later', 'blocked')
AREAS = ('interface', 'map', 'data', 'editorial', 'accessibility', 'infrastructure')
EVIDENCE_KINDS = ('test', 'file', 'doc', 'commit', 'url')
ENVELOPE_FIELDS = ('schema_version', 'updated_at', 'note', 'items')
ITEM_FIELDS = ('id', 'title', 'summary', 'area', 'status', 'last_reviewed', 'shipped_in', 'shipped_on',
               'evidence', 'blocked_by', 'depends_on', 'acceptance')
EVIDENCE_FIELDS = ('kind', 'ref', 'label')
NOTE_DISCLAIMER = re.compile(r'not (?:a )?(?:promise|commitment|guarantee)|intentions, not', re.I)
RELEASE = re.compile(r'^\d+\.\d+(\.\d+)?$')
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')
COMMIT = re.compile(r'^[0-9a-f]{7,40}$')
REPO_PREFIX = 'https://github.com/occult-kranti/protest-atlas/'
REPO_PATH = '/occult-kranti/protest-atlas/'
# Top-level CI test files only: `python -m unittest discover -s tests` and `node --test tests/*.mjs`.
PY_TEST_FILE = re.compile(r'^tests/test_[A-Za-z0-9_]+\.py$')
MJS_TEST_FILE = re.compile(r'^tests/[A-Za-z0-9_.-]+\.mjs$')
PY_TEST_NAME = re.compile(r'^(?:([A-Za-z_][A-Za-z0-9_]*)\.)?(test[A-Za-z0-9_]*)$')
FORBIDDEN_ROOTS = ('_site', '.git', 'research')


def _iso_day(value, path):
    require(isinstance(value, str) and bool(DAY.fullmatch(value)), path, 'requires an ISO day (YYYY-MM-DD)')
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ValidationError(f'{path}: invalid day') from exc


def _timestamp(value, path, now):
    require(isinstance(value, str) and 'T' in value, path, 'requires a timezone-qualified timestamp')
    try:
        result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ValidationError(f'{path}: invalid timestamp') from exc
    require(result.tzinfo is not None, path, 'timestamp needs a timezone')
    result = result.astimezone(timezone.utc)
    require(result <= now, path, 'future timestamp forbidden')
    return result


def _repository_file(relative, evidence_root, path):
    """A regular, non-symlinked file inside evidence_root, given as a clean relative POSIX path."""
    require(isinstance(relative, str) and relative.strip() == relative and relative != '', path, 'needs a relative path')
    require('\\' not in relative and '\0' not in relative and not re.search(r'\s', relative), path,
            'path must be plain POSIX without whitespace or backslashes')
    pure = PurePosixPath(relative)
    require(not pure.is_absolute() and not relative.startswith('/'), path, 'absolute paths are not evidence')
    require('..' not in pure.parts and '.' not in pure.parts and os.path.normpath(relative) == relative, path,
            'path must be normalised and stay inside the repository')
    require(pure.parts[0] not in FORBIDDEN_ROOTS, path, 'build output, git internals and research files are not evidence')
    root = Path(evidence_root).resolve()
    target = root.joinpath(*pure.parts)
    current = root
    for part in pure.parts:
        current = current / part
        require(not current.is_symlink(), path, 'symlinked evidence is not accepted')
    require(target.is_file(), path, f'evidence file does not exist: {relative}')
    require(target.resolve().is_relative_to(root), path, 'evidence escapes the repository')
    return target


def _resolve_test(ref, evidence_root, path):
    require(isinstance(ref, str) and ref.count('::') == 1, path, 'test evidence needs "tests/<file>::<test name>"')
    file_part, name = ref.split('::')
    require(bool(name) and name.strip() == name, path, 'test evidence needs a test name after "::"')
    if file_part.endswith('.py'):
        require(bool(PY_TEST_FILE.fullmatch(file_part)), path,
                'Python test evidence must be a top-level tests/test_*.py file that CI runs')
        match = PY_TEST_NAME.fullmatch(name)
        require(bool(match), path, 'Python test evidence must name test_method or TestClass.test_method')
        source = _repository_file(file_part, evidence_root, path).read_text(encoding='utf-8')
        cls, method = match.groups()
        require(re.search(rf'^\s*def {re.escape(method)}\(', source, re.M) is not None, path,
                f'test {method} not found in {file_part}')
        if cls:
            require(re.search(rf'^class {re.escape(cls)}\b', source, re.M) is not None, path,
                    f'test class {cls} not found in {file_part}')
        return
    require(bool(MJS_TEST_FILE.fullmatch(file_part)), path,
            'test evidence must be a top-level tests/test_*.py or tests/*.mjs file that CI runs (not tests/browser/)')
    source = _repository_file(file_part, evidence_root, path).read_text(encoding='utf-8')
    require(name in source, path, f'test title not found in {file_part}: {name}')


def _resolve_evidence(entry, evidence_root, path):
    obj(entry, EVIDENCE_FIELDS, path)
    kind, ref = entry['kind'], entry['ref']
    require(kind in EVIDENCE_KINDS, path, 'unsupported evidence kind')
    text(entry['label'], path + '.label', 120)
    require(isinstance(ref, str) and ref != '', path + '.ref', 'needs a reference')
    if kind == 'test':
        _resolve_test(ref, evidence_root, path + '.ref')
    elif kind == 'file':
        _repository_file(ref, evidence_root, path + '.ref')
    elif kind == 'doc':
        require(ref.startswith('docs/') and ref.endswith('.md'), path + '.ref', 'doc evidence must be a docs/*.md file')
        _repository_file(ref, evidence_root, path + '.ref')
    elif kind == 'commit':
        require(bool(COMMIT.fullmatch(ref)), path + '.ref', 'commit evidence must be a 7-40 character lowercase SHA')
    else:
        _repository_url(ref, path + '.ref')
    return kind


def _repository_url(ref, path):
    """An https://github.com/occult-kranti/protest-atlas/... URL that still points there after browser normalisation."""
    https_url(ref, path)
    require(ref.startswith(REPO_PREFIX), path, 'URL evidence must point into this repository')
    url = urlsplit(ref)
    require(url.netloc == 'github.com' and url.username is None and url.password is None, path,
            'URL evidence must point into this repository (github.com, no credentials)')
    # Browsers resolve "." and ".." segments, also when percent-encoded, so ".../protest-atlas/../../x" leaves the repo.
    require(not re.search(r'%2e|%2f|%5c', url.path, re.I), path,
            'URL evidence must point into this repository (no encoded dots or slashes)')
    segments = url.path.split('/')[1:]
    require('.' not in segments and '..' not in segments and posixpath.normpath(url.path) == url.path.rstrip('/'),
            path, 'URL evidence must point into this repository (normalised path)')
    require((posixpath.normpath(url.path) + '/').startswith(REPO_PATH), path, 'URL evidence must point into this repository')


def _check_cycles(graph):
    state = {}

    def visit(node, trail):
        state[node] = 'active'
        for dependency in graph[node]:
            if state.get(dependency) == 'active':
                cycle = trail[trail.index(dependency):] + [dependency] if dependency in trail else [node, dependency]
                raise ValidationError(f"roadmap.items: dependency cycle {' -> '.join(cycle)}")
            if dependency not in state:
                visit(dependency, trail + [dependency])
        state[node] = 'done'

    for node in graph:
        if node not in state:
            visit(node, [node])


def validate_roadmap(data, now=None, evidence_root=ROOT):
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(timezone.utc).date()
    obj(data, ENVELOPE_FIELDS, 'roadmap')
    require(type(data['schema_version']) is int and data['schema_version'] == 1, 'roadmap', 'unsupported schema')
    updated = _timestamp(data['updated_at'], 'roadmap.updated_at', now)
    updated_day = updated.date()
    text(data['note'], 'roadmap.note', 1000)
    require(bool(NOTE_DISCLAIMER.search(data['note'])), 'roadmap.note',
            'must say that planned items are intentions, not promises')
    items = array(data['items'], 'roadmap.items')
    require(bool(items), 'roadmap.items', 'must not be empty')
    ids, graph = [], {}
    for i, item in enumerate(items):
        p = f'roadmap.items[{i}]'
        obj(item, ITEM_FIELDS, p)
        identifier(item['id'], p + '.id')
        require(item['id'] not in ids, p, f"duplicate roadmap ID {item['id']}")
        ids.append(item['id'])
        p = f"roadmap.items[{item['id']}]"
        text(item['title'], p + '.title', 80)
        text(item['summary'], p + '.summary', 400)
        text(item['acceptance'], p + '.acceptance', 400)
        require(item['area'] in AREAS, p + '.area', 'unsupported area')
        status = item['status']
        require(status in STATUSES, p + '.status', 'unsupported status')
        reviewed = _iso_day(item['last_reviewed'], p + '.last_reviewed')
        require(reviewed <= today, p + '.last_reviewed', 'future date forbidden')
        require(reviewed <= updated_day, p + '.last_reviewed', 'reviewed after the roadmap was updated')
        if status == 'shipped':
            require(isinstance(item['shipped_in'], str) and bool(RELEASE.fullmatch(item['shipped_in'])),
                    p + '.shipped_in', 'shipped items need a release such as 4.0')
            shipped_on = _iso_day(item['shipped_on'], p + '.shipped_on')
            require(shipped_on <= reviewed, p + '.shipped_on', 'shipped after its last status check')
        else:
            require(item['shipped_in'] is None, p + '.shipped_in', 'only shipped items carry a release')
            require(item['shipped_on'] is None, p + '.shipped_on', 'only shipped items carry a ship date')
        if status == 'blocked':
            text(item['blocked_by'], p + '.blocked_by', 300)
        else:
            require(item['blocked_by'] is None, p + '.blocked_by', 'only blocked items name a blocker')
        kinds = [_resolve_evidence(entry, evidence_root, f'{p}.evidence[{j}]')
                 for j, entry in enumerate(array(item['evidence'], p + '.evidence'))]
        if status == 'shipped':
            require('test' in kinds, p + '.evidence', 'a shipped item needs test evidence that CI runs')
        dependencies = array(item['depends_on'], p + '.depends_on')
        for j, dependency in enumerate(dependencies):
            identifier(dependency, f'{p}.depends_on[{j}]')
        require(item['id'] not in dependencies, p + '.depends_on', 'an item cannot depend on itself')
        require(len(set(dependencies)) == len(dependencies), p + '.depends_on', 'duplicate dependency')
        graph[item['id']] = list(dependencies)
    known = set(ids)
    for item_id, dependencies in graph.items():
        for dependency in dependencies:
            require(dependency in known, f'roadmap.items[{item_id}].depends_on', f'unknown dependency {dependency}')
    _check_cycles(graph)
    return data


def validate_roadmap_repository(root=ROOT, now=None, evidence_root=ROOT):
    """Validate root/public/roadmap.json. The file is required; evidence always resolves against evidence_root."""
    path = Path(root) / 'public/roadmap.json'
    require(path.is_file() and not path.is_symlink(), 'public/roadmap.json', 'required roadmap file is missing')
    return validate_roadmap(load_json(path), now, evidence_root)


if __name__ == '__main__':
    try:
        roadmap = validate_roadmap_repository()
    except ValidationError as exc:
        raise SystemExit(f'Roadmap invalid: {exc}') from exc
    shipped = sum(item['status'] == 'shipped' for item in roadmap['items'])
    print(f"Roadmap validated: {len(roadmap['items'])} items, {shipped} shipped with resolving CI test evidence.")
