#!/usr/bin/env python3
"""Publish gate-reviewed UCDP conflict candidates as public/conflicts.json (4.1 SPEC §6.7).

    python3 scripts/publish_conflicts.py --candidates research/round5/conflicts.candidates.json \
        --gate research/round5/gate-review.json --out public/conflicts.json

Phase-0 stub with the frozen signature: it refuses every call, so no candidates file can reach public/ before WP-D
lands the step (gate result "pass" and a matching candidates sha256 required; withheld ids dropped and listed;
inputs[] mapped to sources[]; the §6.4 envelope written only after validate_conflicts passes against the live
countries.json and events.json ids). Never fetches, never edits a figure.
"""
import argparse
from pathlib import Path

from validate_data import ROOT, ValidationError


def publish(candidates_path, gate_path, out_path, root=ROOT):
    """Return the published envelope. Phase 0: refuses unconditionally and writes nothing."""
    raise ValidationError(f'{out_path}: publish step not implemented in Phase 0; nothing is published '
                          f'(candidates {candidates_path}, gate {gate_path})')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidates', required=True, type=Path)
    parser.add_argument('--gate', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        envelope = publish(args.candidates, args.gate, args.out, args.root)
    except ValidationError as exc:
        parser.exit(1, f'Refused: {exc}\n')
    print(f"Published {len(envelope['records'])} conflict records to {args.out}")


if __name__ == '__main__':
    main()
