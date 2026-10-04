#!/usr/bin/env python3
"""Give every published episode its pipeline-default kind without re-stamping the snapshot (4.1 SPEC §6.2, R27).

Reads public/events.json, applies merge_history.apply_kind_defaults to events[] and writes the file back through
merge_history.write. The envelope (generated_at, last_editorial_review, coverage_note) is untouched byte for byte:
a successful pipeline run never establishes new activity, so this script must not move "Snapshot assembled" or the
72-hour editorial clock. Idempotent: a second run changes nothing. Never fetches, never reads research files.
"""
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from merge_history import ROOT, apply_kind_defaults, read, write  # noqa: E402


def main(root=ROOT):
    path = Path(root) / 'public/events.json'
    data = read(path)
    added = apply_kind_defaults(data['events'])
    write(path, data)
    print(f'{added} of {len(data["events"])} episodes gained kind/kind_basis; generated_at {data["generated_at"]} unchanged')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    raise SystemExit(main(parser.parse_args().root))
