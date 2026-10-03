# Data refresh handoff: round 4, v2 sweep

Written 3 Oct 2026 (about 01:10 UTC) and revised about 01:45 UTC after an independent review, by the session building the 4.0 interface on branch `ccr-77796c82-ka7vhp`. It is meant for a **separate** Claude Code session whose cloud environment can open news websites. That session's only job is the data refresh.

This file is a work plan. It is not a source. Every lead it mentions is an unverified search-snippet claim.

**Pinned inputs.**
- **Import commit:** `__IMPORT_SHA__`. It is the commit on `ccr-77796c82-ka7vhp` that added this handoff, `research/round4/LEADS.json`, `LEADS.md` and the v2 workflows. If this shows a placeholder instead of a 40-character SHA, resolve it with `git log -1 --format=%H origin/ccr-77796c82-ka7vhp -- research/round4/LEADS.json`.
- **Lead checksums** (acceptance 12):
  ```
  8b1f4d43c189fe30fe2332cd1bc844271ccc0b57e4fb5eccc2df919c0d562815  research/round4/LEADS.json
  26187dca74b0a578f192621a1781276efbba82da8631694dcc43ac98251cdaf0  research/round4/LEADS.md
  ```

Contents: [1. Purpose and current state](#1-purpose-and-current-state) · [2. Branch strategy](#2-branch-strategy) · [3. Preflight](#3-preflight-access-check) · [4. Run plan](#4-run-plan) · [5. Acceptance criteria](#5-acceptance-criteria) · [6. Freshness and cadence](#6-freshness-and-cadence) · [7. Risks](#7-risks) · [8. Paste-ready prompt](#8-paste-ready-prompt) · [9. Improvements over v1](#9-improvements-over-v1)

---

## 1. Purpose and current state

**Purpose.** Add protest activity reported after the current snapshot, sourced updates to existing episodes, and publicly announced upcoming actions. The evidence rules stay those of `research/round4/CONTRACT.md` and the editorial guidance. The work runs as multi-agent workflows: separate agents verify each record, and a record is published only if it survives that check. The result reaches the live site through a pull request into `main`.

**Current state (checked 3 Oct 2026):**

| Item | Value |
|---|---|
| Published episodes | 84, in 81 countries and territories. 66 have status "unknown" and 18 "ended/suspended". None is "ongoing". |
| Newest evidence | 2 Oct 2026. Five episodes have evidence dated 1–2 Oct: `in-electoral-20261002`, `fr-schools-20261002`, `es-housing-20261002`, `tz-drivers-20260929` and `au-victorian-hospital-strike-20261001`. Under the staleness rule (editorial guidance §3.3) the snapshot is "current" until **5 Oct 00:00 UTC**, "aging" until 9 Oct and "stale" from **9 Oct 00:00 UTC**. |
| Announced actions | 0. `public/upcoming.json` has `"items": []`. |
| Last sweep (2 Oct 2026, v1) | It logged 381 screening rows: 167 searches, 210 WebFetch attempts, 3 curl attempts and 1 summary row. **0 pages were opened**, because every fetch failed with `EGRESS_BLOCKED`, "unable to fetch" or a rate-limited domain check. Nothing was published, which is correct under the contract. |
| Leads | `research/round4/LEADS.json` and `LEADS.md` hold **192 unverified leads: 21 P1, 48 P2, 123 P3**. By kind: 144 new-episode, 16 update, 32 announced-action. 17 leads carry a date-trap caution, and the md lists 18 more collisions. |
| Pipeline groundwork | Commit **`e633dfe`** (`e633dfe2bb7849cec1e2ca0e8ba2e1741a6c6c57`) is pushed to `origin/ccr-77796c82-ka7vhp` but **is not on `main`**. It is the newest commit that holds the pipeline groundwork and no 4.0 interface code. The groundwork adds `validate_upcoming.py`, the sourced-basis rule for "ongoing", an advanceable `WINDOW_END`, `apply_round4` and `write_upcoming` in `merge_history.py`, and a real-clock repository test. |
| Live site | Deployed from `main` (`6f71f16`). It runs the 3.x interface and serves the same 84 episodes. `main` has no `upcoming.json` yet. |

Leads by region:

| Region | Leads | P1 | P2 | P3 |
|---|---:|---:|---:|---:|
| americas | 42 | 4 | 13 | 25 |
| europe | 60 | 10 | 8 | 42 |
| asia-west | 21 | 4 | 4 | 13 |
| asia-east-oceania | 32 | 1 | 7 | 24 |
| africa | 37 | 2 | 16 | 19 |

The P1 leads fall into two groups:
- Updates to four of the five episodes observed on 1–2 Oct (ES, IN, TZ, AU).
- Announced actions dated 3–17 Oct: ES housing demonstrations on 3–4 Oct, the PK PTI march on 4 Oct, PT strikes on 6 Oct, AR on 8 and 15 Oct, BE on 9 and 12 Oct, CO and the US Brigham nurses on 14 Oct, the IT school strike on 16 Oct and the PT CGTP demonstration on 17 Oct. A Jamaat-e-Islami march in PK is also P1 but has no firm date.

Several of these dates will have passed before the run, and some will pass before the merge.

**Verified at e633dfe on 3 Oct 2026, using a `git archive` copy:**
- `python3 -m unittest discover -s tests` passes 49 tests, and `node --test tests/*.mjs` passes 14.
- All four `scripts/validate_*.py` pass, and so does `scripts/build.py`.
- Setting `WINDOW_END` to 2026-10-03, and making the coverage note follow it, passes the merge, every validator, the tests and the build.
- The v2 region checker embedded in `region-scan.js` (revised 3 Oct) reports 0 errors for all five regions over the window 2026-09-18..2026-10-02.
- Fixture tests of the revised checker: an announcement dated 3 Oct is accepted with window end 2 Oct. With window end 3 Oct, it is an error for the run that wrote it and a warning for a later top-up. The same holds for a stale "ongoing" update and for a "confirmed" lead whose record was removed.
- Both workflow scripts pass a syntax check inside an async wrapper. Their `meta` objects are pure literals whose phase titles match the `phase()` calls. Mock runs cover a completed run, a blocked run, an apply that fails twice, `apply_attempt` and `lead_priorities`. A changed `apply_attempt` alters only the apply prompt.

---

## 2. Branch strategy

The UI session keeps pushing to `ccr-77796c82-ka7vhp`, and GitHub Pages deploys only from `main`. The refresh therefore runs on its own branch, which starts from the pipeline commit rather than from either moving branch.

```
main 6f71f16 ── 0f4854f … 11bdb7f ── 7f0b1d5 ── c1ca039 ── e633dfe ── aa44280 ── cf3349d ── … ── import commit ── … (UI work, keeps moving)
                \_______ pipeline groundwork ________/          │
                                                                └── data branch (new): import leads/workflows → region scans → gate → consolidate
```

### 2.1 Create the branch

1. **Pick the base.** Normally it is `e633dfe`. If `origin/main` already contains `e633dfe` (an earlier data PR or 4.0 has merged), branch from `origin/main` instead.
2. **Pick the branch.** Use the branch the harness assigned, if it can be fast-forwarded to the base. Create `data/refresh-<YYYYMMDD>` instead in any of these cases:
   - no branch was assigned;
   - the assigned branch is `main` or `ccr-77796c82-ka7vhp`;
   - the assigned branch holds commits the base lacks.

   Never reset or force-push a branch.
3. Run:
   ```bash
   git fetch origin main ccr-77796c82-ka7vhp
   git cat-file -e e633dfe2bb7849cec1e2ca0e8ba2e1741a6c6c57^{commit} || git fetch --deepen=100 origin ccr-77796c82-ka7vhp
   BASE=e633dfe2bb7849cec1e2ca0e8ba2e1741a6c6c57
   git merge-base --is-ancestor $BASE origin/main && BASE=$(git rev-parse origin/main)
   if git merge-base --is-ancestor HEAD $BASE && ! git rev-parse --abbrev-ref HEAD | grep -qxE 'main|ccr-77796c82-ka7vhp|HEAD'; then
     git merge --ff-only $BASE                      # assigned branch, fast-forward only
   else
     git switch -c data/refresh-$(date -u +%Y%m%d) $BASE
   fi
   echo "BASE=$BASE"                                # note it: the scope check uses it
   ```
4. **Import the inputs.** `LEADS.json`, `LEADS.md` and the v2 workflows are not in `e633dfe`. They were committed on the UI branch in the import commit named at the top of this file. If `origin/main` already has `research/round4/LEADS.json`, skip this step and set `IMPORT=$BASE`.
   ```bash
   IMPORT=__IMPORT_SHA__
   git cat-file -e "$IMPORT^{commit}" 2>/dev/null || IMPORT=$(git log -1 --format=%H origin/ccr-77796c82-ka7vhp -- research/round4/LEADS.json)
   git checkout $IMPORT -- research/round4/LEADS.json research/round4/LEADS.md research/round4/workflows
   sha256sum research/round4/LEADS.json research/round4/LEADS.md   # must equal the checksums at the top of this file
   python3 -c "import json;d=json.load(open('research/round4/LEADS.json'));print(len(d['leads']), d['status'])"   # expect: 192 unverified-leads-not-sources
   git commit -m "Import round-4 leads and v2 sweep workflows for the data refresh (from $IMPORT)"
   echo "IMPORT=$IMPORT"                            # note it: the scope check and acceptance 12 use it
   ```
   After the import, `LEADS.json` and `LEADS.md` are read-only inputs. Lead outcomes go in `research/round4/<region>-lead-outcomes.json`.
5. **Read this handoff once, at the start.** Use `git show origin/ccr-77796c82-ka7vhp:docs/HANDOFF_DATA_REFRESH.md`. If that branch is gone, use `git show $IMPORT:docs/HANDOFF_DATA_REFRESH.md`. Do not commit the handoff on the data branch.
6. **First push:** `git push -u origin HEAD`.
   - **Refused for workflow files.** A new branch whose history changes `.github/workflows/pages.yml` (commits `0f4854f` and `efe1080`) may need the GitHub `workflow` permission. Create the branch on GitHub at `e633dfe`, then push again; only the import and data commits are new, and they touch no workflow file:
     ```bash
     gh api repos/occult-kranti/protest-atlas/git/refs -f ref=refs/heads/<branch> -f sha=e633dfe2bb7849cec1e2ca0e8ba2e1741a6c6c57
     ```
     A GitHub connector's create-branch tool does the same.
   - **Refused for the branch name.** The cloud git proxy may accept only the assigned branch. Stop, and report the assigned name and the exact refusal.

### 2.2 Paths the data branch may change

| Allowed | Notes |
|---|---|
| `research/round4/**` | Region files, lead-outcome files, release notes, and fixes to the v2 workflow scripts if one blocks the run (say so in the PR). **Not** `LEADS.json` or `LEADS.md`, which stay byte-identical to the import. |
| `public/events.json`, `public/event-context.json`, `public/coverage.json`, `public/research-ledger.json`, `public/cities.json`, `public/upcoming.json` | Regenerated only by `python3 scripts/merge_history.py`, never edited by hand |
| `scripts/merge_history.py` | Only the `WINDOW_END` constant and the coverage-note date literal. The consolidate step makes both edits. |
| `scripts/validate_{data,history,coverage,upcoming}.py`, `scripts/merge_history.py` (logic) | **Only** when a validator or merge bug blocks valid data. Fix it narrowly and add a **new** test file `tests/test_data_refresh_<topic>.py`. Never edit an existing test file. |

**Never touch** anything the UI session owns:
- `app.js`, `explore.js`, `index.html`, `404.html`, `styles.css`, `css/*`, `js/*`, `map.js`, `history.js`, `freshness.js`;
- `scripts/build.py`, `scripts/validate_roadmap.py`, `public/roadmap.json`, `public/world-map-codes.json`;
- existing files under `tests/`, `.github/workflows/*`, `package.json`;
- `docs/**`, including `CHANGELOG.md`, `docs/ROADMAP.md` and `docs/RELEASE_EVIDENCE.md`, which the UI session updates at release.

Do not reword the sentence templates in `merge_history.sweep_sentence` or `write_upcoming`: the 4.0 interface parses them (SPEC §6.6).

**Ownership runs both ways.** From the handoff push until the data PR merges, the UI branch commits no change to:
- `research/round4/**`;
- the six public data JSON files above;
- `scripts/merge_history.py`;
- the four data validators.

If such a change is unavoidable, the UI session pushes it before the data session imports, or asks the data session to re-import from the new SHA. Before every UI commit, the UI session runs `git checkout -- public/events.json public/event-context.json public/coverage.json public/research-ledger.json public/cities.json public/upcoming.json`. This discards local merge reruns: `merge_history.py` restamps `generated_at` and `last_editorial_review` on every run.

**Scope check.** Run this from the repository root before every push. `BASE` and `IMPORT` are the values noted in §2.1.
```bash
ALLOWED='^(research/round4/.+|public/(events|event-context|coverage|research-ledger|cities|upcoming)\.json|scripts/merge_history\.py|scripts/validate_(data|history|coverage|upcoming)\.py|tests/test_data_refresh_[a-z0-9_]+\.py)$'
{ git log --first-parent --no-merges --name-only --format= $BASE..HEAD; git status --porcelain --untracked-files=all | cut -c4- | sed 's/ -> /\n/'; } \
  | sed '/^$/d' | sort -u | grep -v -E "$ALLOWED" && echo "OUT OF SCOPE: the files above must not change" || echo "scope ok"
git diff --quiet $IMPORT HEAD -- research/round4/LEADS.json research/round4/LEADS.md && echo "leads ok" || echo "LEADS CHANGED: restore them from $IMPORT"
git status --porcelain --untracked-files=all | grep -E '\.tmp$' && echo "TMP FILES: delete them, never commit them" || echo "no tmp files"
git diff $BASE HEAD -- scripts/merge_history.py   # expect only WINDOW_END and the coverage-note date
```

**Staging.** Always `git add` explicit paths or region globs, never `git add -A` or the whole `research/round4/`. Steps 3 and 7 give the exact commands.

### 2.3 How the result reaches `main`

1. Push the data branch, then open a **pull request from the data branch into `main`**. Its diff also contains the nine pipeline commits, `0f4854f` through `e633dfe`. Those are the validators, the merge changes, `freshness.js`, `js/html.js` and the design records. They do not change the live 3.x site: the build allowlist at `e633dfe` adds `public/upcoming.json` but publishes neither `freshness.js` nor `js/html.js`. The Pages workflow validates and builds the PR, but does not deploy it.
2. A person merges the PR. Do not merge it yourself unless the user asks: `docs/DEPLOYMENT.md` requires editorial approval. The merge to `main` deploys Pages. New episodes and updates then show in the 3.x interface. Announced actions are published only as JSON until the 4.0 Ahead view ships.
3. The UI session then runs `git merge origin/main` on `ccr-77796c82-ka7vhp`. The files do not overlap as long as both sides keep the ownership rule in §2.2. The imported `research/round4/LEADS*` and `workflows/` files are identical on both sides, so they merge cleanly.
4. If `main` has moved before the data PR opens (for example, 4.0 merged first), merge `origin/main` into the data branch. Do not rebase pushed commits. Then rerun every check. A UI test that fails **only** because it pins the old data is not yours to edit: report it in the PR for the UI owner. ROADMAP task 4 requires the UI side to move such assertions onto a frozen fixture before the 4.0 PR, so this should not arise.
5. After the first data PR merges, the pipeline is on `main`. **Later refreshes branch from `origin/main`**, not from `e633dfe`.

---

## 3. Preflight (access check)

Do this before any branch work. v1 spent a whole sweep against blocked hosts; v2 stops first.

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
[ -n "$HTTPS_PROXY" ] && curl -sS "$HTTPS_PROXY/__agentproxy/status" | head -40   # explains proxy decisions, when a proxy exists
for u in https://apnews.com/hub/protests https://www.bbc.com/news/world https://www.aljazeera.com/news/ \
         https://www.infobae.com/ https://www.rr.pt/ https://www.vrt.be/vrtnws/nl/ https://www.thehindu.com/ https://www.thecitizen.co.tz/; do
  printf '%s ' "$(date -u +%H:%M:%S)"; curl -sS -L --max-time 25 -o /dev/null -w "%{http_code} %{size_download} $u\n" "$u" || echo "FAILED $u"
done
```

Then load WebFetch and WebSearch with ToolSearch (`select:WebFetch,WebSearch`). WebFetch `https://apnews.com/hub/protests` and one P1 lead URL from `LEADS.json`, and run one WebSearch such as "protest strike news this week". Never pass `-k`, never unset the proxy variables, and never disable TLS checks.

How to read the results:
- **Works:** HTTP 200 with a substantive body (tens of kB) and readable article text from WebFetch.
- **Environment block:** `EGRESS_BLOCKED`, a proxy 403/407, a refused CONNECT, a DNS failure or an empty body.
- **Site refusal:** the site's own bot wall, 401/403 or 429. This says nothing about the environment. Try another outlet.

What to do:
- **Blocked** (none of the three probe hosts works with either method): **stop**. Commit nothing and run no scans. Tell the user which hosts were denied and quote the decisive line from the proxy status.
  - The user changes **Network access** in the environment settings: the cloud environment menu in the session title bar, then Edit. Steps: <https://code.claude.com/docs/en/cloud-environments#network-access>.
  - Either choose a broader access level, or choose Custom, add the news domains and keep the default package-manager list. Discovery needs open-ended news access, so a broad level is the realistic choice; a custom allowlist can cover the leads but not discovery.
  - **With Custom,** include `apnews.com`, `bbc.com` and `aljazeera.com` as well as the lead domains. The workflows' own preflight probes those three and returns `blocked` without them, even when the lead outlets work.
  - After the change, rerun this section. If it is still blocked, the running session may not have picked up the new policy: start a new session in the edited environment.
- **Degraded** (the probe hosts work but 3 or more of the 5 lead outlets above are environment-blocked, or WebSearch fails): the allowlist is too narrow. Ask for broader access. Continue only if the user accepts thin coverage, and name the limit in the PR. To list all 122 lead domains (P1 alone uses 23):
  ```bash
  git show $IMPORT:research/round4/LEADS.json | python3 -c "import json,sys,urllib.parse as u;print('\n'.join(sorted({(u.urlparse(x).hostname or '').removeprefix('www.') for l in json.load(sys.stdin)['leads'] for x in l['outlets_or_urls'] if x.startswith('http')})))"
  ```
  Before §2.1 has set `IMPORT`, use `origin/ccr-77796c82-ka7vhp` in its place.
- **OK:** continue. The region workflows run their own preflight as well and record it.

The Workflow tool runs the scans. If it is not listed, load it with ToolSearch. If it is not available at all, do not fall back to a single-agent sweep. Either reproduce the scripts' phases with separate sub-agents (scan, then independent source and editorial verifiers, then apply), using the scripts' prompts as the specification, or stop and report.

---

## 4. Run plan

`<REPO>` is the clone path; `/home/user/protest-atlas` is the default, so pass `repo` and adjust `scriptPath` if yours differs. `<SCRATCH>` is any writable directory outside the repository, for example your session scratchpad followed by `/round4`. `<NOW>` is `date -u +%Y-%m-%dT%H:%M:%SZ` and `<YESTERDAY>` is `date -u -d yesterday +%F`.

**Step 1: set up.** Complete §2.1, the branch and the import commit. Confirm a clean tree and run the baseline: `python3 scripts/validate_upcoming.py && python3 -m unittest discover -s tests`.

**Step 2: decide the window, then scan all five regions.**

*Run-day rule.* The published `WINDOW_END` is 2026-10-02. The deadline is always the newest evidence day + 3, at 00:00 UTC, and the Pages deploy of the merge must finish before it.
- **Started on 3 Oct UTC.** `<YESTERDAY>` is 2026-10-02, equal to the current `WINDOW_END`. Such a run cannot move the window, its newest possible evidence (2 Oct) is current only until **5 Oct 00:00 UTC**, and it cannot ship the roadmap item "Add reports after 2 Oct 2026". So:
  1. Scan all five regions now with `window_end: "2026-10-02"`. This works the P1 leads while the 3–4 Oct announcements (ES housing, PK PTI) are still upcoming.
  2. Do the Step 3 checkpoints and the Step 4 gate.
  3. Wait until after **4 Oct 00:00 UTC**. Use a scheduled wake-up if the session has one; otherwise ask the user to send "continue" after 00:30 UTC.
  4. Top up every region (below) with `window_end: "2026-10-03"`, a new `now` and `lead_priorities: ["P1"]`. Gate the top-up, then consolidate.
  5. If any published record then has evidence dated 3 Oct, the deadline becomes **6 Oct 00:00 UTC**; otherwise it stays 5 Oct 00:00 UTC.
  6. If the top-up cannot run, consolidate the 3 Oct results anyway. The deadline stays 5 Oct 00:00 UTC and the roadmap item stays open; say both in the PR.
- **Started on or after 4 Oct UTC.** Use `<YESTERDAY>` as written. Top up only if the merge slips (§6).

Issue all five calls **in one message**. Each writes only its own region's files. If they run one at a time, keep this order, which follows the P1 lead counts (10, 4, 4, 2, 1):

```js
Workflow({ scriptPath: "<REPO>/research/round4/workflows/region-scan.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<WINDOW_END for this run>", region: { key: "europe" } } })
Workflow({ scriptPath: "<REPO>/research/round4/workflows/region-scan.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<WINDOW_END for this run>", region: { key: "americas" } } })
Workflow({ scriptPath: "<REPO>/research/round4/workflows/region-scan.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<WINDOW_END for this run>", region: { key: "asia-west" } } })
Workflow({ scriptPath: "<REPO>/research/round4/workflows/region-scan.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<WINDOW_END for this run>", region: { key: "africa" } } })
Workflow({ scriptPath: "<REPO>/research/round4/workflows/region-scan.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>", now: "<NOW>", window_start: "2026-09-18", window_end: "<WINDOW_END for this run>", region: { key: "asia-east-oceania" } } })
```

A **top-up** is the same call with a new `now`, the new `window_end` and `lead_priorities: ["P1"]`. It is a new run with a new `run_id`. Earlier records stay, and discovery still covers every country.

`window_start` stays at 2026-09-18 for every run, because v1 recorded nothing and the checker applies it to every record in a region file. Announcements must be dated on or after `window_end + 1`. A P1 announcement whose date falls inside the window becomes an occurrence only when read reporting shows it happened; otherwise its outcome is `expired`.

Record each region's `runs[].started_at` and `finished_at` from its lead-outcomes file for the PR. Lead batches and discovery groups run one after another inside a region (Europe has 10 lead batches and 3 discovery groups), so durations are unknown until this first run.

**Step 3: checkpoint each region as it returns.** Containers can be replaced, and uncommitted research would be lost.
- Read the result's `status` (`completed`, `incomplete`, `blocked` or `apply-failed`), `applied.validation`, `scan.pages_read`, `scan.failed_fetches` against `scan.fetch_attempts`, `scan.failed_steps`, `scan.unscreened_countries` and `leads.outcomes`.
- If `pages_read` is 0, or more than half the fetches failed for environment reasons, treat the region as degraded (§3).
- Commit only that region's files, and never those of a region whose workflow is still running. What to commit depends on the result:

  | Result | Commit |
  |---|---|
  | `completed`, or `incomplete` with `applied.validation` = `pass` | All seven region files: `git add research/round4/<region>-{events,context,updates,upcoming,languages,screening,lead-outcomes}.json` |
  | `blocked` | `git add research/round4/<region>-lead-outcomes.json` |
  | `apply-failed`, or `applied.validation` = `fail` | **Only** `git add research/round4/<region>-screening.json research/round4/<region>-lead-outcomes.json`. The record files may hold records the verifiers' drop and fix verdicts never reached. Once committed, the next run's inventory would treat them as verified earlier work. |

  Then run `git commit -m "Round-4 v2 scan: <region> (<status>, searched through <day>)" && git push -u origin HEAD`.
- **Apply-failed or validation fail:** resume with the same `scriptPath` and `args`, plus `resumeFromRunId: "<runId>"` and `apply_attempt: 1` (2 on the next try). Preflight, scan, inventory and verify come from the cache, and apply runs live. Commit the record files only after apply returns `completed` or `incomplete` with validation `pass`. If the container was replaced first, the uncommitted records are gone: run the region fresh.
- **Blocked, or a scan step failed twice** (`scan.failed_steps` not empty): run the region fresh, after access is fixed if it was blocked. Earlier verified records survive, because the scans only append.

**Step 4: gate review of announcements and new records.** Run one fresh agent per run (or per region) that took no part in scanning. It may only remove or soften material, never add it. It may edit only `research/round4/<region>-{events,context,updates,upcoming,languages,lead-outcomes}.json`, and it keeps lead-outcome `record_refs` consistent with anything it removes. It checks:
- **High-repression contexts:** withhold an announcement unless independent national or international outlets already report it widely (editorial guidance §10.4). A withheld lead becomes `unconfirmed`, with the note "withheld under editorial guidance §10.4 (high-repression context)". The v2 prompts do not encode this rule.
- **Week and month precision:** set `planned_end` to the last day of the stated week or month, so the item is not shown as "date passed" while the period continues (editorial guidance §10.4 bug note). Plain `planned_start` is not enough.
- **Operational detail:** the validator's regex does not catch street names, squares used as assembly points, or times written in words. City and day level only.
- **Privacy:** no names of private people, minors (for example school strikers) or detained or injured individuals.
- **Announcers:** `announced_by` is an organisation or public institution.
- **Episodes vs updates:** each P1 update lead lands as an update to its existing episode, not as a new episode. Placeholder country codes (`gp-overseas-…`, `nc-pre-election-…`) are resolved from the read source, or dropped.

Afterwards, rerun the checker for each touched region, with the gated run's `window_end` and `run_id`:

```bash
python3 <SCRATCH>/<region>/check_region.py <REPO> <region> 2026-09-18 <window_end of the gated run> --since <run_id>
```

- **`--since`:** the earliest `run_id` among the runs gated together, for example a run and its resumption. Gate a top-up separately, with the top-up's own `window_end` and `run_id`. The checker then reports earlier runs' passed announcements and stale "ongoing" records as warnings marked "record from an earlier run". Consolidate removes or downgrades those records; never delete them to clear a warning.
- **`--codes`:** optional. Without it, the region-scope check is skipped.
- **Missing checker:** if `check_region.py` is gone because the container was replaced, rewrite it with the "Recovering the checker" block in `research/round4/workflows/README.md`.

Errors must be zero. Commit with the message "Round-4 gate review", staging the edited region files by explicit path.

**Step 5: consolidate and integrate.** Run this after every region, including any top-up, has returned and been gated.

```js
Workflow({ scriptPath: "<REPO>/research/round4/workflows/consolidate.js",
  args: { repo: "<REPO>", scratch: "<SCRATCH>" } })
```

The consistency step reads the clock. Its date is **`MERGE_DAY`**, the consolidate day. The step then:
- makes source IDs unique globally;
- merges duplicate episodes;
- keeps wire chains from counting as corroboration;
- drops announcements whose last planned day is before `MERGE_DAY` and marks their leads `expired` (it never turns an announcement into an occurrence);
- downgrades unsupported "ongoing" status;
- keeps lead-outcome `record_refs` in step;
- runs a dry-run merge.

The integrate step then:
- sets `WINDOW_END` to the last day actually searched, never later than today;
- makes the coverage-note date follow it;
- runs the merge, the validators, the tests and the build;
- drafts a release note.

The result carries `merge_day`, `release_note_path` and `freshness`. `freshness` holds the newest evidence day, `deploy_before` (the deadline), the announcements whose dates pass before the deadline, and each "ongoing" record with the time its evidence turns 72 hours old. If no region completed, the step does nothing. `force: true` overrides that, so use it only deliberately.

**Step 6: validate locally.** All of these must pass:
```bash
python3 scripts/merge_history.py
for v in scripts/validate_*.py; do python3 "$v" || echo "FAIL $v"; done
python3 -m unittest discover -s tests
node --test tests/*.mjs
python3 scripts/build.py
```

**Step 7: release note and commit.**
- Save the consolidate step's `release_note` as `research/round4/release-notes/<MERGE_DAY>.md`, the `release_note_path` it returned. Do not edit `CHANGELOG.md` or `docs/RELEASE_EVIDENCE.md`: whoever integrates the release copies the note there.
- Delete any `research/round4/*.tmp` file, then run the scope check (§2.2).
- Stage by explicit path:
  ```bash
  git add research/round4/release-notes/ \
    research/round4/*-{events,context,updates,upcoming,languages,screening,lead-outcomes}.json \
    public/{events,event-context,coverage,research-ledger,cities,upcoming}.json scripts/merge_history.py
  ```
  Add a validator or `tests/test_data_refresh_*.py` file only if §2.2 allowed the fix.
- Commit with a message such as "Refresh data through <WINDOW_END>: N new episodes, M updates, K announced actions", and push.

**Step 8: pull request into `main`.**
- **Title:** "Data refresh: reports through <WINDOW_END> and announced actions".
- **Body:**
  - the release note;
  - per-region status, `searched_through` and run duration (`started_at` → `finished_at`);
  - lead outcomes by priority;
  - the counts;
  - blocked hosts and failed steps;
  - the **deadline**: newest evidence day + 3, at 00:00 UTC. The Pages deploy of the merge must finish before it. If review will miss it, top up before merging (§6).
  - the announcements whose dates pass before the deadline, and each "ongoing" record with the time its evidence turns 72 hours old (from `freshness`);
  - a line saying the PR also carries the pipeline commits `0f4854f` through `e633dfe`.

  Use whichever GitHub tool the session has, either the `gh` CLI or a GitHub connector. Do not merge.

**Step 9: report.** Give the user:
- each region's status, searched-through day, pages read and run duration;
- lead outcomes by priority;
- the counts of new episodes, updated episodes and announced actions;
- the `WINDOW_END` set and the PR link;
- the deadline;
- every blocked host and failed step;
- what remains unknown.

---

## 5. Acceptance criteria

1. **Preflight logged.** Every region has a run entry in `research/round4/<region>-lead-outcomes.json`. No scan ran while blocked.
2. **Regions complete.** The target is all five with status `completed` and a `searched_through` day. Any region that is `blocked` or `incomplete` is named in the PR and in the release note.
3. **Leads worked.** Every P1 and P2 lead has an outcome other than `not-attempted`. P3 leads may be `not-attempted` only if time ran out, and those leads are listed.
4. **Provenance holds.** Every cited source in new or amended records was opened and read, and its `accessed_at` exactly equals the `attempted_at` of a logged fetch row for the same URL. For every run of this session, the region checker reports no errors with that run's `window_end` and `--since <run_id>` (Step 4).
5. **Verification notes are honest.** Every verification note says the check was AI-assisted, that there was no independent human editorial review, and what remains unknown. "Corroborated" requires two independent reporting chains.
6. **Announcements meet the gate.** Each item:
   - is dated on or after the consolidate day (`MERGE_DAY` in `consolidate.js`);
   - has status `announced`, `postponed` or `cancelled`;
   - has a `planned_end` if its precision is week or month;
   - stays at city and day level;
   - names an organisation or institution as announcer;
   - passed the high-repression gate.
7. **No unsupported "ongoing".** At consolidate time, no "ongoing" status rests on evidence older than 72 hours. The PR lists when each "ongoing" record's evidence turns 72 hours old.
8. **Window is honest.**
   - `WINDOW_END` equals the last day actually searched and is not later than today.
   - The coverage note, `event-context.json` and `research-ledger.json` all show that day.
   - The release note names any region not searched through it.
9. **All checks pass.** All commands in Step 6 pass on the data branch, and the PR's Pages `validate-build` check is green.
10. **Scope holds.** The scope check prints "scope ok", "leads ok" and "no tmp files". The `merge_history.py` diff is only the window and the note date, unless a validator fix was needed, in which case it comes with a new test.
11. **Fresh at publication.**
    - The deadline is the newest evidence day + 3, at 00:00 UTC.
    - The Pages deploy of the merge must finish before it.
    - The PR states the deadline and lists the announcements whose dates pass before it.
    - If review will miss the deadline, top up before merging (§6).
12. **Inputs untouched.** `LEADS.json` and `LEADS.md` are byte-identical to the import commit, and their SHA-256 values match the top of this file.

---

## 6. Freshness and cadence

**The 72-hour rule** comes from editorial guidance §3.3 and `freshness.js`. Ages are counted from 00:00 UTC of the evidence day. Data observed on day **D** is "current" only until **D+3 00:00 UTC**. It is "aging" until D+7, "stale" until D+30 and "archive" after that. Rerunning the merge, rebuilding, or re-reading an old source never makes data newer.

**The deadline** is the newest evidence day + 3, at 00:00 UTC. The Pages deploy of the merge must finish before it. The PR states it. If review will miss it, top up before merging. This one rule applies here, in §5.11, in Step 8 and in ROADMAP task 1.

**What this means for a run.** A run on day R searches through R−1, so its best newest evidence is D = R−1, and it stays current until **R+2 00:00 UTC**. Scanning, the gate, consolidating, reviewing the PR and deploying must all fit inside that window, roughly 48 hours. The first run is the exception: see the run-day rule in §4 Step 2.

**Top-ups.** A top-up rescans the regions with the new `window_end` (`lead_priorities: ["P1"]` keeps it short), then consolidates again. Before a top-up, passed announcements and stale "ongoing" records from earlier runs show as checker warnings, not errors. Consolidate removes them and marks the leads expired. Never delete earlier runs' records to clear a warning. Do not merge a snapshot that is already aging without saying so in the PR.

**Proposed cadence.** Once the first refresh succeeds, sweep daily. The times below are estimates; size them from the run durations recorded in the first PR.

| When (UTC) | What |
|---|---|
| ~05:45 | Run starts. `window_end` is yesterday, which by then is a complete UTC day. |
| ~05:45–09:30 | Preflight, then leads (new leads, plus earlier `unconfirmed` and `unreachable` ones), then updates to episodes observed in the last 7 days (expiring records first), then announcements dated in the next 14 days, then region-wide searches, then a **rotating seventh of the catalog**, so every country is screened weekly. |
| ~10:00 | Consolidate, open the PR, notify. |
| same day | A person reviews and merges, and Pages deploys. |

If one daily run is missed, the evidence stays at D = R−1. The site is then "aging" from R+2 00:00 UTC until the next merge, about half a day. Each further missed day adds a full day of "aging", and after a week it turns "stale". The site says so each time. That is the honest failure mode. A late-evening run with `window_end` set to today would close the gap, but it would claim a day searched before that day is over, so it is not proposed.

**What a daily routine needs:**
1. **Environment:** the cloud environment with news-domain network access created for this refresh. The routine is created in that environment.
2. **Routine:** a scheduled trigger that creates a fresh session on each fire. Its standalone prompt is §8 adapted for daily mode: base the branch on `origin/main`, compute the window, keep within budget. Schedule it daily at a jittered minute, for example `47 5 * * *` UTC. Set completion notifications.
3. **Workflow changes before daily use:**
   - Split the window. The checker applies `window_start` to *every* record in a region file, so raising it would reject earlier records. Options: a `focus_start` argument for scan prompts while acceptance stays at the round start, or a per-month rollover to `research/round5/` with `ROUND5` support in `merge_history.py`.
   - Replace the hard-coded `window_start` default (`2026-09-18`) in `region-scan.js` with the round start or a required argument. The two `2026-05-01` literals (the checker's duplicate warning and the discovery prompt) are already replaced by `recent_from`, which defaults to `window_end` minus 150 days.
   - Add a `codes` subset argument for the rotation.
   - Add a lead cap. A priority filter (`lead_priorities`) already exists.
   - Add a lead generator that turns the previous run's screening notes, and optionally the six-hourly GDELT discovery artifact, into `LEADS.json`. These remain unverified leads.
   - Add the high-repression and week/month rules from Step 4 to the scan and verify prompts.
4. **Permissions:** push to a data branch and open PRs. **Merging stays human.** `DEPLOYMENT.md` protects `main` with editorial approval, and nothing publishes automatically. An auto-merge policy is a separate decision that depends on the human editorial review roadmap item.
5. **Stop rule:** after two consecutive `blocked` preflights, the routine disables itself and notifies the user. It does not run empty sweeps.
6. **Metric:** record the newest-evidence age at each merge in a ledger file. The "Keep records current within 72 hours" roadmap item needs 30 consecutive days under 72 hours, published as a metric.

---

## 7. Risks

| # | Risk | Examples from the leads | Mitigation |
|---|---|---|---|
| 1 | **Date traps.** Snippets that match an earlier year or a different place. | 17 flagged leads and 18 collisions in `LEADS.md`. Examples: the FR intersyndicale and IT flotilla strikes of 2025, GR Tempi 2023, the NZ nurses' strike of Oct 2025, PH rallies of 2025, NG NLC 2023 and EC CONAIE 2025. | Confirm the year and place on the page itself. Check the `LEADS.md` collision list before recording anything. |
| 2 | **Wire chains** counted as independent sources. | PT CGTP (likely one Lusa chain across ECO, TSF and Sábado). FR La Libre (AFP/Belga). IN: the ABC News wire story, and possibly US News, may repeat the AP copy that is already cited via the Seattle Times. ES Europa Press via Infobae. KR Reuters via TradingView. | One chain counts as one source. "Corroborated" needs two independent chains. Name the dependence in `verification.note`. |
| 3 | **Advocacy, partisan or state-run outlets** as the only basis. | massnurses.org, Mirage News union releases, STML, WSWS, the Observatorio Cubano de Conflictos, Amnesty. State media: APS, Prensa Latina, Xinhua/CGTN. | Attribute their claims. Never use them alone for occurrence, size or arrests. Pair with independent reporting. |
| 4 | **High-repression contexts** for announcements. | The PK PTI march: containers and security deployments are reported. | Withhold unless widely reported (editorial guidance §10.4). Step 4 gate. |
| 5 | **Operational detail** leaks in. | The elDiario.es route and timing preview for the ES housing demonstrations, MX Tlatelolco route previews, IT CSLE "orari" pages. | City and day only. `validate_upcoming` blocks clock times and route or assembly phrases. The gate catches street names and squares. |
| 6 | **Announcements expire before merge.** | ES 3–4 Oct, PK 4 Oct, PT 6 Oct, AR 8 Oct, BE 9 and 12 Oct, CO and US 14 Oct. | Leads are ordered by soonest expiry. Consolidate drops items whose last planned day is before `MERGE_DAY` and marks their leads expired. One becomes an occurrence only from read after-the-fact reporting. The PR lists the announcements that pass before the deadline. Merge quickly, and rerun consolidate if the merge slips a day. |
| 7 | **Partial network access.** The three probe hosts pass but local outlets are blocked. | Most leads are local-language outlets: there are 122 lead domains. | Watch `failed_fetches` against `fetch_attempts` for each region. If degraded, widen access and rerun (§3). |
| 8 | **Snippet laundering:** lead wording copied into records. | Lead summaries paraphrase snippets and URL slugs, for example the Times of India slug "over 700 detained". | Records are written only from read pages. Verifiers flag text lifted from snippets. Numbers that appear only in a slug are not sources. |
| 9 | **Duplicate episodes.** | ES, IN, TZ and AU updates against their existing episodes. The 29 Sep FR strike against its GF, GP, MQ, RE and YT relays. | Updates go to existing episodes. Consolidate merges duplicates. The relays carry double-counting cautions. |
| 10 | **Competing figures.** | CGT vs Interior Ministry (FR). CONFECH vs Carabineros (CL). Organisers vs police (DE). | Keep both figures, attributed, in the qualifier text. Never average them. |
| 11 | **Privacy.** | DE school strikers (minors), detainees in IN and CL. | No private names, faces, meeting points or addresses. |
| 12 | **Week/month announcements shown as passed early.** | BE "week of 23 Nov", the "late October" items. | `planned_end` set to the end of the period (Step 4). |
| 13 | **Collision with the UI session.** | Shared working files. 4.0 tests specified against today's data may break: SPEC §6.6 (the `sweepFact` 2 Oct/167/0 assertion), §19 WP3 (the "33 records" count) and §22.2 (the "84 records" smoke check). | Scope check and two-way ownership (§2.2). Keep the sweep sentences unchanged. On the UI side (ROADMAP task 4), before the 4.0 PR: literal assertions read a frozen fixture copy (for example `tests/fixtures/snapshot-20261002/`), tests on real `public/*.json` assert only invariants, and SPEC §6.6, §19 WP3 and §22.2 change to match. Until then, a data PR whose only red check is a UI test pinning old data reports it and does not edit the test. |
| 14 | **Window overreach.** | Some regions completed while others were blocked. | `WINDOW_END` is set to the last day actually searched. The PR and the release note name every region not covered through that day. |
| 15 | **Long runs and container loss.** | Five regions with sequential lead and discovery batches. | Commit and push after each region (Step 3). Resume apply with `resumeFromRunId` and `apply_attempt`. The scans only append. |
| 16 | **Restamping** reads as review. | `merge_history.py` rewrites `generated_at` and `last_editorial_review` on every run. | Known issue (editorial guidance §16.3). Never describe a rerun as a review. The 4.0 interface labels it "Snapshot assembled". |
| 17 | **v2 is untested against real news hosts.** | It was tested only with mock agents and a real checker. | Treat the first run as the v2 field test. Read every region's result and report anything surprising. |
| 18 | **Run-day squeeze.** | A 3 Oct start cannot move `WINDOW_END` past 2 Oct, and 2 Oct evidence is current only until 5 Oct 00:00 UTC. | The run-day rule in §4 Step 2: scan now, top up after 4 Oct 00:00 UTC, then consolidate. |
| 19 | **Unverified records committed.** | A region returns `apply-failed` and its files are committed anyway. The next inventory treats them as verified earlier work. | Step 3 commits only the screening and lead-outcome files in that case and resumes apply with `apply_attempt`. |

---

## 8. Paste-ready prompt

Paste this into the new session. It is self-contained.

```text
You are the data-refresh session for Protest Atlas (GitHub: occult-kranti/protest-atlas). Your only job is to refresh the published data with recent protest reporting and announced actions, under strict evidence rules. Another session is rebuilding the interface on branch ccr-77796c82-ka7vhp: never edit its files, merge it, or push to it.

1. Read first. Run `git fetch origin main ccr-77796c82-ka7vhp`, then read `git show origin/ccr-77796c82-ka7vhp:docs/HANDOFF_DATA_REFRESH.md` in full (if that branch is gone: `git show __IMPORT_SHA__:docs/HANDOFF_DATA_REFRESH.md`) and follow it; where this prompt is less specific, the handoff wins. Then read research/round4/CONTRACT.md and research/round4/workflows/README.md.

2. Check access before anything else (handoff §3). If news pages cannot be opened, stop, commit nothing, and tell me which hosts were denied and the proxy's stated reason so I can widen network access. Never disable TLS checks or unset proxy variables.

3. Branch (handoff §2). Base it on commit e633dfe2bb7849cec1e2ca0e8ba2e1741a6c6c57; if origin/main already contains that commit, branch from origin/main. Use your assigned branch only if it fast-forwards to that base; otherwise create data/refresh-<YYYYMMDD>. Never use main or ccr-77796c82-ka7vhp, and never force-push. Import research/round4/LEADS.json, LEADS.md and research/round4/workflows/ from commit __IMPORT_SHA__, check their SHA-256 values against the handoff, and commit. Change only the paths it allows, stage by explicit path, and run its scope check before every push.

4. Run the plan (handoff §4) with the Workflow tool: region-scan.js for all five regions (issue the five calls in one message), the gate review, then consolidate.js. Never replace these independently verified multi-agent runs with a single-agent sweep. Commit each region as it returns, following Step 3 exactly (apply-failed: commit only screening and lead-outcomes, then resume). If today is 3 Oct UTC, scan now with window_end 2026-10-02, then after 4 Oct 00:00 UTC top up every region with window_end 2026-10-03 before consolidating.

5. Gate before consolidating (handoff Step 4): withhold announcements in high-repression contexts unless widely reported, set planned_end for week or month items, and allow no private names, meeting points, routes or clock times.

6. Evidence rules, no exceptions: a lead or search snippet is never a source; cite only pages you opened and read, with accessed_at equal to that fetch's logged clock reading; copies of one wire story are one source; announcements come from a named organisation and are never evidence that anything happened; "ongoing" needs reported activity within 72 hours; every record says it was AI-assisted with no independent human editorial review.

7. Validate (handoff Step 6), commit, push, and open a pull request into main with the release note and the deadline: newest evidence day + 3 at 00:00 UTC, by which the Pages deploy must finish. Do not merge unless I ask.

8. Report as handoff Step 9 lists, with the PR link and that deadline.
```

---

## 9. Improvements over v1

v1 (`research/round4/workflows/region-scan.v1.js`, run on 2 Oct 2026) logged 381 rows, opened 0 pages and published nothing. v2 changes the following.

| Change | v1 | v2 | Why |
|---|---|---|---|
| **Preflight stop** | Ran full scans against blocked hosts | Probes three hosts with WebFetch and curl, plus one WebSearch. Logs a `blocked` run and returns before scanning. | v1's only output was 381 failure rows. Spending time on a blocked network produces no evidence. |
| **Per-request timestamps** | Batch-level and rounded times, which v1's reviewers rejected | The agent reads the clock immediately before every search or fetch, and each call gets one screening row. `accessed_at` must equal the logged fetch time; the checker enforces this and warns on repeated or `:00` stamps. | Provenance has to show *when* each page was actually read. A reconstructed time is not a record. |
| **Lead prioritisation** | No leads; findings were buried in free-text notes | `LEADS.json` is worked first, P1 → P2 → P3, 6 leads per agent. Within a priority, unexpired leads come before expired ones, soonest `expires_on` first, announcements first on ties. `lead_priorities` limits a run, for example a top-up, to P1. | The most time-sensitive and best-sourced claims get read before the session runs out of time. |
| **Expiring announcements first** | No announcement logic | Leads are ordered by expiry and carry an `expired` outcome. Consolidate drops items whose date has passed by the consolidate day, marks their leads expired and never turns one into an occurrence. | An announcement is useful only before its date. After the date, only a read report of what happened counts. |
| **Lead-outcome tracking** | None | `<region>-lead-outcomes.json` holds a run log (status, window, `searched_through`, preflight) and one outcome per lead: `confirmed`, `refuted`, `unconfirmed`, `unreachable`, `expired` or `not-attempted`. | Later sessions can see what was checked and what is still open. `WINDOW_END` advances only for days actually searched. |
| **Consolidation and cross-region dedupe** | None; regions merged as they were | One step for source-ID uniqueness across everything published, duplicate-episode merging, wire-chain downgrades, the 72-hour "ongoing" rule and a dry-run merge on a copy, before integration. It returns the deadline and the announcements that pass before it. | Five regions working in parallel produce collisions that no single region can see. |
| **Moving window** | Dates fixed in the contract | The window comes from the arguments. `WINDOW_END` is clamped to the days searched, and the coverage-note date follows it. The checker's date rules bind only the current run's records, so top-ups and later reruns do not fail on earlier verified work. | Lets the same scripts run on any day without editing code. |
| **Verification split and append-safety** | One agent scanned the whole region and rewrote all six files. One source verifier and one editorial verifier each covered every record. No retries. | Leads and discovery are split across batches of agents, each retried once. The inventory compares with git HEAD. Parallel source re-fetch verifiers (5 records each) run alongside an editorial/schema/provenance verifier. A drop by either removes the record; a verifier that fails twice leaves its records unverified, so they are removed. Committed records are restored. A failed apply is resumed with `apply_attempt`, and its records are not committed until it passes. | Adversarial checks with no single point of trust, and earlier verified work is never lost. |
| **Scopes fixed** | Cyprus and Antarctica were never scanned | CY is in asia-west and AQ in asia-east-oceania. | Every catalog entry is now in exactly one region. |

This handoff adds the following to the scripts:
- **Branch isolation** from `e633dfe`, with an explicit list of allowed paths, two-way ownership and a scope check. This keeps the data refresh out of the UI session's way and keeps the data PR reviewable.
- **A pinned import step**, because the leads and the v2 scripts are not in `e633dfe`, with checksums for the leads.
- **Per-region commit and push**, as checkpoints that survive container loss, without committing unverified records.
- **A gate review** for high-repression contexts, week/month `planned_end`, operational detail and privacy. The scripts do not encode these rules.
- **A degraded-access threshold**, so a narrow allowlist cannot pass as a full sweep.
- **One deadline rule** derived from the 72-hour rule, a run-day rule for a 3 Oct start, and a top-up step if the merge slips.
- **The release note kept in `research/round4/release-notes/`**, which avoids conflicts on `CHANGELOG.md` and `docs/` with the UI session.
- **A daily-cadence design** (§6), including the checker's window limitation that must be fixed before a routine can run daily.
