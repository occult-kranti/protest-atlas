# Round 5 research files: UCDP conflict context (data session)

This directory receives the round-5 data work described in `docs/HANDOFF_DATA_REFRESH.md` (§10, written by WP-D from `docs/design/4.1/HANDOFF_ROUND5_DRAFT.md`). Nothing here is published directly: `scripts/build.py` publishes only its allowlist, and `public/conflicts.json` is written by `scripts/publish_conflicts.py` after a gate review.

Expected contents once the data session runs (none of it exists at Phase 0):

- `downloads/inputs.json`: the download manifest naming each local UCDP file with its `role`, `dataset`, `version`, `provisional` flag, `covers_through`, `url`, `downloaded_at`, and the `licence` and `citation` **as read on the UCDP page**. The CSV, ZIP and PDF downloads themselves are ignored by git (`.gitignore`).
- `country-map.json`: `{"<GW number or UCDP name>": "<ISO2>"}` overrides for `scripts/ingest_ucdp.py`, so every mapping the data session adds is reproducible. Empty `{}` until needed.
- `conflicts.candidates.json`: the ingest output (`publication: "candidate"`), never the published file.
- `gate-review.json`: the gate result the publish step checks (`result`, `candidates_file_sha256`, `withheld[]`).

## The ingest skeleton (moved into the repository at Phase 0)

`scripts/ingest_ucdp.py`, `tests/test_ingest_ucdp.py` and `tests/fixtures/ucdp-synthetic/` were written on 4 Oct 2026 by the 4.1 data planner (an AI agent) in the design scratchpad and moved here unchanged by the lead. Offline, standard library only, Python 3.11; 28 unit tests on **fictional** fixtures (the fixture README says what is synthetic). It never fetches: UCDP hosts are unreachable from the research container, and the download belongs to the data session.

Run:

```bash
python3 scripts/ingest_ucdp.py --inputs research/round5/downloads/inputs.json --out research/round5/conflicts.candidates.json \
  --countries public/countries.json [--country-map research/round5/country-map.json] [--window-end YYYY-MM-DD] [--include-non-state] [--include-one-sided]
```

What it does: reads the manifest (every field required; SHA-256 and row counts recorded); streams the GED annual and Candidate CSVs reading only the named columns (never coordinates, `adm_*`, `where_*`, `source_*`, `priogrid`); deduplicates events across releases by GED `id` (annual beats Candidate; a later Candidate beats an earlier one); takes `type_of_conflict`, `intensity_level`, `location`, `start_date` and `start_date2` from the UCDP/PRIO ACD only, excluding and naming any state-based conflict the supplied ACD lacks; maps UCDP country names to ISO codes through `countries.json` names, the built-in GW table and `country-map.json`, emitting `code: null` with a warning when nothing maps; runs `check_candidates()` on its own output and refuses to write if it fails; writes `publication: "candidate"`; is deterministic.

What it refuses: coordinates, geometry, sub-national places, source articles and headlines; any `status`, `severity`, `risk`, `danger`, `score`, `trend`, `casualties` or `toll` field; a figure without integer `low <= best <= high`; the words `ongoing`, `casualt…`, `death toll`, `hotspot`, `escalat…`, `so far`, `to date` in a note; individuals (parties are UCDP's `side_a`/`side_b` strings).

## Rename to the published schema (WP-D, before any real run)

The skeleton still emits its planning-time record shape. 4.1 SPEC-4.1 §6.4 fixes the published schema and §6.6 lists the renames, each a constant or one `aggregate()` block:

- `RECORD_FIELDS` → `id kind kind_basis ucdp parties location start years provisional latest_recorded activity_basis note`.
- `countries[]` → `location[]` (`{code, ucdp_name}`, `code` null or an ISO code in `countries.json`).
- `fatalities[]` → `years[]` (BRD rows only, with `intensity_level`/`intensity_label` from the ACD year) **plus** `provisional[]` (Candidate months: event count and best/low/high sums). Estimators are never mixed within a record (R10): a year the BRD does not cover is absent, and a Candidate month inside a BRD year is dropped with a warning.
- Drop `estimator`, `through`, `latest_evidence`, `latest_evidence_precision`, `verification` and `status_basis`; add `latest_recorded` and the `activity_basis` enum (`active-year | provisional-months | not-in-latest-year`, computed as §6.4 says).
- `window` gains `inclusion_start`/`inclusion_end` and loses `start`/`end`; `sources[]` gains `role` and loses `publisher`, `doi`, `provisional`, `rows_read` (they stay in the candidates file's `inputs[]`).
- The candidates envelope keeps `publication`, `inputs`, `counts`, `warnings`, `excluded`; `scripts/publish_conflicts.py` maps them to the §6.4 envelope.
- Column names are validated against the header row; a missing column is a named hard error.

`tests/test_ingest_ucdp.py` is renamed with the schema and gains the determinism-through-publish case and the Candidate-month-in-BRD-year warning (SPEC-4.1 §11.2). `tests/fixtures/conflicts-sample/conflicts.json` (labelled synthetic, ids `ucdp-900001`…`ucdp-900004`) is produced from `tests/fixtures/ucdp-synthetic/` through ingest **and** publish, byte for byte.

## Rules that do not change

- GW-to-ISO and UCDP-name tables are from memory. The data session verifies them against the downloaded file's `country` values before any record is published; unmapped names surface as warnings and null codes, not as guesses.
- Thresholds (25 / 1,000 battle-related deaths), column names and `start_date`/`start_date2` semantics are confirmed from the downloaded codebooks; a mismatch is a correction, never a reason to publish the remembered version.
- Licence and citation are copied from the UCDP download page into the manifest; `docs/design/OPEN_SOURCE_RESEARCH.md` records the licence as unconfirmed until then.
- Conflict records are context, not Protest Atlas research: no `status`, no "ongoing", no single death figure, no coordinates, no individuals, no front lines.
