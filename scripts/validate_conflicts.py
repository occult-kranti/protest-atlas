#!/usr/bin/env python3
"""Validate public/conflicts.json, the re-published UCDP conflict context dataset (4.1 SPEC §6.4–§6.5).

Phase-0 stub with the frozen signatures. The file is optional: when it is absent the repository validator returns
None and the build publishes the absent state (EC1). When it is present this stub refuses, so nothing can reach the
site through an unvalidated path before WP-D lands the schema checks (exact keys at every level, the forbidden-key
scan, bounds on every figure, the activity basis, no "ongoing"). Standard library only; reuses validate_data helpers.
"""
import argparse
from pathlib import Path

from validate_data import ROOT, ValidationError, load_json

# One table, shared by name with js/model.js CONFLICT_KINDS (tests/test_conflicts.py asserts the lists agree).
CONFLICT_KINDS = ('armed-conflict-intrastate', 'armed-conflict-interstate', 'non-state-conflict', 'one-sided-violence')
CONFLICTS_FILE = 'public/conflicts.json'


def validate_conflicts(data, countries, event_ids, now=None):
    """Return the validated envelope. Phase 0: not implemented, so every present file is refused."""
    raise ValidationError(f'{CONFLICTS_FILE}: conflicts validator not implemented in Phase 0; nothing can be published through the stub')


def validate_conflicts_repository(root=ROOT, now=None):
    """None when public/conflicts.json is absent (the designed empty state); the validated envelope otherwise."""
    path = Path(root) / CONFLICTS_FILE
    if not path.exists():
        return None
    data = load_json(path)
    countries = load_json(Path(root) / 'public/countries.json')
    event_ids = {event['id'] for event in load_json(Path(root) / 'public/events.json')['events']}
    return validate_conflicts(data, countries, event_ids, now)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        result = validate_conflicts_repository(args.root)
    except ValidationError as exc:
        parser.exit(1, f'Validation failed: {exc}\n')
    print('No conflict dataset is published in this snapshot (absent state).' if result is None
          else f"Conflict dataset validated: {len(result['records'])} records.")


if __name__ == '__main__':
    main()
