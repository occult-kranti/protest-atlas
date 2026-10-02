#!/usr/bin/env python3
"""Collect unverified news candidates. Never writes public event data."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

from validate_data import ROOT, ValidationError, https_url

ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc'
QUERY = '(protest OR protests OR demonstration OR strike)'
MAX_BYTES = 2_000_000


def normalize(payload, collected_at, query=QUERY):
    if not isinstance(payload, dict) or not isinstance(payload.get('articles'), list):
        raise ValidationError('GDELT response must contain an articles array; upstream errors are not empty results')
    candidates, seen = [], set()
    skipped = 0
    for article in payload['articles'][:100]:
        if not isinstance(article, dict):
            skipped += 1
            continue
        url, title = article.get('url'), article.get('title')
        try:
            https_url(url, 'candidate.url')
        except ValidationError:
            skipped += 1
            continue
        if not isinstance(title, str) or not title.strip() or len(title) > 2000:
            skipped += 1
            continue
        if url in seen:
            continue
        seen.add(url)
        candidates.append({
            'id': 'candidate-' + hashlib.sha256(url.encode()).hexdigest()[:20],
            'title': title.strip(), 'url': url,
            'publisher_domain': urlsplit(url).hostname,
            # Source country is an outlet attribute, not a protest location.
            'publisher_country': str(article.get('sourcecountry', ''))[:100] or None,
            'language': str(article.get('language', ''))[:100] or None,
            # GDELT seendate is a discovery timestamp, not event onset/publication.
            'gdelt_seen_at': str(article.get('seendate', ''))[:100] or None,
            'review_status': 'unverified',
        })
    return {
        'schema_version': 1, 'collected_at': collected_at,
        'provider': 'GDELT DOC 2.0', 'query': query, 'timespan': '24h',
        'coverage_note': 'Sampled news leads only. No event occurrence, status, location, turnout or completeness is established. Human source review and an approved editorial pull request are required before publication.',
        'skipped_invalid_articles': skipped, 'candidates': candidates,
    }


def fetch(query=QUERY):
    params = {'query': query, 'mode': 'ArtList', 'format': 'json',
              'maxrecords': 100, 'timespan': '24h', 'sort': 'DateDesc'}
    request = Request(ENDPOINT + '?' + urlencode(params), headers={
        'User-Agent': 'ProtestAtlas/1.0 (editorial candidate discovery)', 'Accept': 'application/json'})
    with urlopen(request, timeout=30) as response:
        if not response.geturl().startswith(ENDPOINT):
            raise ValidationError('unexpected GDELT redirect')
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValidationError('GDELT response exceeds size limit')
    return json.loads(raw.decode('utf-8'))


def write_candidates(payload, output, now=None):
    output = Path(output)
    resolved = output.resolve()
    require_root = (ROOT / 'data/candidates').resolve()
    if not resolved.is_relative_to(require_root):
        raise ValidationError('candidate output must stay inside data/candidates; public writes forbidden')
    collected_at = (now or datetime.now(timezone.utc)).isoformat().replace('+00:00', 'Z')
    candidates = normalize(payload, collected_at)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Atomic replace never writes through a pre-existing symlink or hardlink.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(json.dumps(candidates, ensure_ascii=False, indent=2) + '\n')
        os.replace(temporary, output)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    return len(candidates['candidates'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'data/candidates/latest.json')
    args = parser.parse_args()
    try:
        count = write_candidates(fetch(), args.output)
    except (OSError, ValueError) as exc:
        parser.exit(1, f'Discovery failed (public events unchanged): {exc}\n')
    print(f'Collected {count} unverified candidates in {args.output}; public events unchanged.')


if __name__ == '__main__':
    main()
