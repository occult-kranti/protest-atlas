# Round-4 sweep workflows

Scripts for the Workflow tool that refresh the atlas with recently reported protest activity and announced actions. Each region is scanned and checked by AI agents, then consolidated, merged and validated. Publication rules are in `../CONTRACT.md`.

| File | Purpose |
|---|---|
| `region-scan.v1.js` | The 2 Oct 2026 attempt. It was stopped by blocked news hosts. Kept unchanged as a record; do not run it. |
| `region-scan.js` | v2 scan for one region: preflight, then scan, inventory, verify and apply. |
| `consolidate.js` | v2 cross-region consistency check, then integration: window, merge, validators, tests, build and a release note draft. |

## What v2 changes

- **Preflight first.** The workflow fetches three news hosts with WebFetch and with curl. If both are blocked, the region stops before scanning and the run is logged as `blocked`. v1 ran a full scan that could not open a single article.
- **Leads before discovery.** The scan works `research/round4/LEADS.json` leads for the region first, in batches of 6. They are ordered P1 → P2 → P3. Within each priority, unexpired leads come first, by soonest `expires_on`, with announced actions first on ties. Discovery runs afterwards in groups of about 18 countries, and every catalog country is searched at least once. Each lead's outcome is recorded.
- **One clock reading per call.** The agent reads `date -u` immediately before every search or fetch and logs one screening row per call. Each cited source's `accessed_at` must equal the logged time of the fetch that read it. v1 reviewers rejected batch-level and rounded timestamps.
- **Tested checker.** The script embeds a region checker, written to `<scratch>/<region>/check_region.py`. It runs the repository's own `validate_event`, `validate_context` and `validate_upcoming`. It also simulates how `merge_history.apply_round4` folds in updates. Finally it checks global source-ID uniqueness, the window, the `ongoing` rule, language coverage, provenance and lead outcomes.
- **Date rules bind the current run only.** With `--since <run_id>`, three checks are errors only for records that cite a source read at or after that run started: a passed announcement date, a stale `ongoing`, and a `confirmed` lead without a record. Records from earlier runs get a warning marked "record from an earlier run", and consolidation removes or downgrades them. A top-up or a rerun on a later day therefore does not fail on earlier verified work. Never delete earlier runs' records to clear such a warning.
- **Append-safe.** Records from earlier runs are kept. The inventory step compares the files with `git HEAD`. Only new or changed records are verified, and committed records that went missing are restored.
- **Verification split.** Source-fidelity verifiers each take 5 records and run in parallel with one editorial/schema/provenance verifier. A record dropped by either verifier is removed. If a verifier fails twice, its records count as unverified and are dropped or reverted.
- **Moving window.** The window comes from the arguments, not fixed dates. Announcements must be dated on or after `window_end + 1`. `ongoing` needs reported activity in the last 3 days of the window and, at merge time, within 72 hours.
- **Region scopes fixed.** v1 skipped Cyprus, which the catalog files under Asia; it now belongs to `asia-west`. Antarctica (AQ) now belongs to `asia-east-oceania`.

## Before you run

1. Clone or pull the repository. These steps assume `/home/user/protest-atlas`. For any other path, change `scriptPath` and pass `repo`.
2. Confirm that `research/round4/LEADS.json` exists. Without it, the scan runs discovery only and logs that the file was missing.
3. Read the clock with `date -u +%Y-%m-%dT%H:%M:%SZ` and use it as `<NOW>`. `<YESTERDAY>` is the UTC day before it. Leaving out `window_end` gives the same default.
4. `<SCRATCH>` is a writable directory outside the repository, such as your session scratchpad followed by `/round4`.
5. Optionally, check network access by asking an agent to WebFetch `https://apnews.com/hub/protests`. If the fetch returns `EGRESS_BLOCKED` or a proxy 403, fix the environment's network settings before running. In Claude Code on the web, use the environment's network-access setting. The preflight step detects a block either way.

## Run the five regions

Each call scans one region and writes only that region's files, so the five calls can run at the same time: issue all five in one message. If they run one at a time, start with `europe`, `americas` and `asia-west`, which hold the most P1 leads (10, 4 and 4). Inside a region, lead batches and discovery groups run one after another. Run consolidation only after all five have finished.

```js
Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/region-scan.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<YESTERDAY>", region: { key: "americas" } } })

Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/region-scan.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<YESTERDAY>", region: { key: "europe" } } })

Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/region-scan.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<YESTERDAY>", region: { key: "asia-west" } } })

Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/region-scan.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<YESTERDAY>", region: { key: "asia-east-oceania" } } })

Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/region-scan.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<YESTERDAY>", region: { key: "africa" } } })
```

`window_start` stays at 2026-09-18 because v1 recorded nothing. Each call returns `status` with one of these values:

- `completed`
- `incomplete`: a discovery group failed, or validation still has errors
- `blocked`
- `apply-failed`

It also returns the window used, preflight results, lead-outcome counts, scan totals (searches, fetches, pages read, countries left unscreened), verification totals, final record counts and `applied.validation` (`pass` or `fail`). If a region returns `blocked`, fix network access and rerun only that region. If it returns `apply-failed`, or `applied.validation` is `fail`, read [Resuming](#resuming) before committing anything.

Region presets (`region.scope` overrides one):

| key | scope |
|---|---|
| `americas` | every catalog entry with region "Americas" |
| `europe` | every catalog entry with region "Europe" |
| `asia-west` | AE AF AM AZ BD BH BT CY GE IL IN IQ IR JO KG KW KZ LB LK MV NP OM PK PS QA SA SY TJ TM TR UZ YE |
| `asia-east-oceania` | BN CN HK ID JP KH KP KR LA MM MN MO MY PH SG TH TL TW VN, plus every "Oceania" entry and AQ |
| `africa` | every catalog entry with region "Africa" |

Optional arguments, with defaults:

- `leads_file`: `research/round4/LEADS.json`
- `leads_per_agent`: 6
- `discovery_group_size`: 18
- `verify_chunk`: 5
- `lead_priorities`: `["P1", "P2", "P3"]`. Limits which leads the run works, for example `["P1"]` for a top-up. Discovery still covers every country.
- `recent_from`: `window_end` minus 150 days. Discovery checks existing episodes observed on or after this day for newer reporting. The checker's possible-duplicate warning uses the same day.
- `apply_attempt`: 0. Raise it (1, 2, …) only when you resume a run whose apply step failed. See [Resuming](#resuming).

## Top-ups

A top-up rescans regions after another UTC day has passed, so that `WINDOW_END` and the newest evidence can move forward, for example when a merge slips. Run `region-scan.js` again with:

- the same `repo`, `scratch` and `window_start`;
- a new `now`;
- `window_end` set to the new last complete UTC day.

Adding `lead_priorities: ["P1"]` keeps it short. A top-up is a new run with a new `run_id`, and earlier runs' records stay. Passed announcements and stale `ongoing` records from earlier runs show as warnings; consolidation removes them and marks their leads `expired`. Never delete earlier runs' records to clear a warning. Keep `window_start` unchanged, because the checker applies it to every record in the region files.

## Consolidate and integrate

```js
Workflow({ scriptPath: "/home/user/protest-atlas/research/round4/workflows/consolidate.js",
  args: { repo: "/home/user/protest-atlas", scratch: "<SCRATCH>" } })
```

Consolidation first runs a consistency step across regions. Its clock reading sets `MERGE_DAY`, the consolidate day.

- Source IDs must be unique across everything `merge_history.py` publishes.
- Duplicate episodes are merged.
- A single wire story is never counted as independent corroboration.
- Announcements whose last planned day is before `MERGE_DAY` are dropped, unless a range is still running or a postponed date was sourced. Their lead outcomes become `expired`. An announcement is never turned into an occurrence.
- `ongoing` is downgraded unless there is evidence from within 72 hours.
- Lead-outcome `record_refs` are updated for every merged, renamed or removed record.
- A dry-run merge of a repository copy runs under `<SCRATCH>/consolidate/dryrun`.

It then integrates:

- `WINDOW_END` in `scripts/merge_history.py` is set to the last day actually searched, never later than today UTC. The consistency step derives that day from the regions' completed runs. Pass `window_end` to set it yourself.
- `python3 scripts/merge_history.py` runs, followed by every `scripts/validate_*.py`, `python3 -m unittest discover -s tests`, `node --test tests/*.mjs` and `python3 scripts/build.py`.
- Only data problems are fixed.
- The step returns the counts (new episodes, updated episodes, announced actions, countries), failing steps and a draft release note that lists what remains unknown.
- It also returns `merge_day` and `release_note_path` (`research/round4/release-notes/<MERGE_DAY>.md`).
- It returns `freshness`:
  - the newest evidence day;
  - `deploy_before`, 00:00 UTC on the newest evidence day + 3, by which the Pages deploy of the merge must finish;
  - the announcements whose dates pass before then;
  - each `ongoing` record, with the time its evidence turns 72 hours old.

If no region has a completed run, integration is skipped. Pass `force: true` to integrate anyway.

## After the run

Neither workflow commits. Review the results in this order:

1. Check `git status` and `git diff --stat`. Delete any leftover `research/round4/*.tmp` checkpoint file, and never commit one.
2. Save the `release_note` as `research/round4/release-notes/<MERGE_DAY>.md`, the `release_note_path` returned. On a data branch (see `docs/HANDOFF_DATA_REFRESH.md`), do not edit `CHANGELOG.md` or anything under `docs/`. The release integrator copies the note.
3. Commit per region as the handoff's Step 3 describes. Add files by explicit path, never the whole `research/round4/` folder. Then push.

## Resuming

Rerun with the same `scriptPath` and `args`, plus `resumeFromRunId: "<runId from the earlier result>"`. The longest unchanged prefix of agent steps returns cached results, and everything after it runs live. Agents that retry or resume inspect the files first, because they may have written partial work. If the container was replaced, the checker is written again from the embedded copy.

A step that returned nothing can come back from the cache as nothing again. Two cases need care.

**`apply-failed`, or `applied.validation` is `fail`.** The record files may hold records that the verifiers' drop and fix verdicts never reached.
1. Commit only `research/round4/<region>-screening.json` and `<region>-lead-outcomes.json`. Leave the record files uncommitted: the next run's inventory treats committed records as verified earlier work and never checks them again.
2. Resume with the same `scriptPath` and `args`, plus `resumeFromRunId` and `apply_attempt: 1` (then 2, and so on). `apply_attempt` changes only the apply prompt, so preflight, scan, inventory and verify come from the cache and apply runs live.
3. Commit the record files only after apply returns `completed` or `incomplete` with validation `pass`.
4. If the container was replaced before that, the uncommitted records are gone. Start a fresh run for the region.

**A scan step failed twice** (status `incomplete`, `scan.failed_steps` not empty). Start a fresh run for the region instead of resuming. It gets a new `run_id`, and earlier records stay.

## Recovering the checker

The checker is the raw text of `CHECKER_PY` in `region-scan.js`. To write it without running a workflow, run this from the repository root:

```bash
mkdir -p <SCRATCH>/<region>
python3 - <SCRATCH>/<region>/check_region.py <<'PY'
import sys
s = open('research/round4/workflows/region-scan.js').read()
open(sys.argv[1], 'w').write(s.split('const CHECKER_PY = String.raw`', 1)[1].split('`\nconst ENSURE_CHECKER', 1)[0])
PY
python3 <SCRATCH>/<region>/check_region.py . <region> 2026-09-18 <window_end> --since <earliest run_id to check>
```

`--codes` is optional. Without it, the region-scope check is skipped. `--recent-from` defaults to `window_end` minus 150 days.

## `research/round4/<region>-lead-outcomes.json`

```json
{"schema_version": 1, "region": "europe",
 "runs": [{"run_id": "2026-10-04T09:12:33Z", "started_at": "…", "finished_at": "…", "status": "in-progress|completed|incomplete|blocked",
           "window_start": "2026-09-18", "window_end": "2026-10-03", "searched_through": "2026-10-03",
           "preflight": {"status": "ok|degraded|blocked", "fetch_method": "webfetch|curl|both|none", "websearch": "ok|failed|unavailable"},
           "leads_file": "research/round4/LEADS.json", "verified_record_ids": ["event:…", "update:…", "upcoming:…"], "dropped_record_ids": [], "note": "…"}],
 "outcomes": [{"lead_id": "…", "run_id": "…", "outcome": "confirmed|refuted|unconfirmed|unreachable|expired|not-attempted",
               "record_refs": [{"record_type": "event|update|upcoming", "id": "…"}], "checked_at": "UTC clock reading",
               "urls_read": [], "urls_failed": [], "note": "what the reading established and what it did not"}]}
```

`merge_history.py` does not read this file. Consolidation and later sessions use it to see which regions were searched, and through which day, and what happened to each lead.

Screening rows from v2 add `codes` to every row, and `url` and `outcome` to fetch rows. `merge_history.sweep_stats` ignores these extra fields.

## Rules that do not change

- No claim may rest on a search snippet. Every cited page is read in full first.
- Announcements stay at city and day level and come from a named collective or institution. An announcement is not evidence that the action happened, how large it was or whether it was legal.
- No private individuals, meeting points, routes, addresses or clock times.
- Copies of one wire story count as a single source.
- Every record discloses that it was checked with AI assistance, without independent human editorial review.
