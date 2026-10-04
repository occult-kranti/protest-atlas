# Round 5 handoff: armed conflict (UCDP re-publication) and civil unrest

Written 4 Oct 2026 (about 05:30 UTC) by the 4.1 panel's data planner, an AI agent, against the deployed 4.0 tree at `fcd35a7`. It is meant to be merged by the lead into `docs/HANDOFF_DATA_REFRESH.md` as a new top-level section (suggested heading: **"10. Round 5: armed conflict and civil unrest"**), after §9. Nothing in it replaces §1–§9: the round-4 protest sweep, its branch rules, its scope check and its 72-hour deadline rule continue unchanged. Where this section is stricter, it wins for round 5.

This container cannot reach ucdp.uu.se, ucdpapi.pcr.uu.se, data.humdata.org, en.wikipedia.org or any news host (proxy 403). Everything below about UCDP file names, versions, columns, thresholds and licence terms is **written from memory and must be confirmed on the live pages by the data session before any record is published**. Where a fact is uncertain it says so. The editorial decisions it applies are the skeptic's (`design2/editorial.md` §3–§6, §10) and the encoding designer's data needs (`design2/encoding.md` §4, §9); the schema it emits is the ingest skeleton's (`design2/ingest/README.md`), pending the architect's ruling.

Contents: [10.0 Scope and prerequisites](#100-what-round-5-is-and-is-not) · [10.1 Sources and licences](#101-sources-and-licences-from-memory-confirm-every-row-on-the-live-page) · [10.2 Preflight (UCDP)](#102-preflight-for-stream-a-ucdp-hosts) · [10.3 Steps, stream A](#103-steps-for-stream-a-ucdp-re-publication) · [10.4 Steps, stream B](#104-steps-for-stream-b-civil-unrest-and-kind-re-reads) · [10.5 Acceptance](#105-acceptance-criteria) · [10.6 Evidence rules](#106-evidence-rules) · [10.7 Window](#107-the-window) · [10.8 Branch, paths, commits](#108-branch-paths-and-commits-same-rules-as-2-extended) · [10.9 Risks](#109-risks) · [10.10 Roadmap statuses](#1010-roadmap-statuses-the-lead-sets) · [10.11 Paste-ready prompt](#1011-paste-ready-prompt-stream-a) · [10.12 Open questions](#1012-open-questions-for-the-architect-and-the-lead)

---

## 10.0 What round 5 is, and is not

Round 5 adds two things the owner asked for on 4 Oct 2026, each with its own evidence and its own clock, and it keeps them apart:

| Stream | What it produces | Evidence | Clock | Needs |
|---|---|---|---|---|
| **A. Armed conflict** | `public/conflicts.json`: a **re-published context layer from UCDP** (parties, type, location countries, calendar-year best/low/high death estimates, dataset version and licence). Not Protest Atlas research. | Downloaded UCDP files, aggregated **offline** by `scripts/ingest_ucdp.py`. No news reading, ever. | Calendar years plus provisional months; **never** the 72-hour rule, never "ongoing". | Network access to UCDP hosts; the licence confirmed from the download page; the lead's prerequisites below. |
| **B. Civil unrest and kind** | `kind` on existing episodes re-typed to `protest`, `strike` or `civil-unrest` from a **re-read source**, and new civil-unrest episodes. | News articles opened and read under `research/round4/CONTRACT.md` plus the kind clause in §10.4. | The existing 72-hour evidence rule. | News access (the §3 preflight), exactly as round 4. |

What round 5 is **not**: a conflict tracker, a casualty counter, a front-line or territorial map, a severity or danger rating, a "past two years" dataset (each dataset states its own window, §10.7), or a licence to type an existing record from its title, id, issue tag or stored one-liners (§10.4).

**Prerequisites the lead lands on `main` before the data session runs stream A to publication** (the session can still download, confirm terms and run the ingest from this scratch copy without them, but it cannot publish; it says so in the PR):

1. `scripts/ingest_ucdp.py` and `tests/test_ingest_ucdp.py` with `tests/fixtures/ucdp-synthetic/` moved in from `design2/ingest/` (28 tests pass there on 4 Oct 2026), with the schema fixed by the architect (§10.12).
2. `scripts/validate_conflicts.py` (port of `check_candidates()` in `validate_data` style), `public/conflicts.json` listed in `build.py` as an **optional** file, `tests/test_pipeline.py` and the frozen-fixture set aware of it, and the UI's EC1/EC2 empty and failure states (editorial §7.5) so an absent file is honest.
3. A **publish step** (`scripts/publish_conflicts.py`, name to confirm) that takes the gate-reviewed `research/round5/conflicts.candidates.json`, drops records the gate marked, re-stamps `publication` to `published`, writes `public/conflicts.json` and runs the validator. The ingest never writes to `public/`.
4. For stream B: `kind` and `kind_basis` in `validate_data.py` with the `collective-action` default written by `merge_history.py` (skeptic §3.2, §10.2), `apply_round4` accepting `kind` + `kind_basis` on an update and refusing a kind change without a basis, and the region-scan and verify prompts carrying the kind clause (§10.4).
5. `.gitignore` entries for `research/round5/downloads/*.csv`, `*.zip` and `*.pdf`, so raw UCDP files are never committed by accident (the scope check in §10.8 also rejects them).

---

## 10.1 Sources and licences (from memory; confirm every row on the live page)

Decisions already taken in `docs/design/OPEN_SOURCE_RESEARCH.md` stand: ACLED rejected (EULA forbids redistribution and export); Wikipedia text CC BY-SA, never sole evidence; CrisisWatch borrow-the-window-idea only; Mass Mobilization vocabulary CC0. The rows below add what stream A needs. "Confirm" means: open the page, copy the licence sentence and the citation UCDP requests **verbatim** into `research/round5/UCDP_TERMS.md` with the URL and the clock reading, and copy the same text into the manifest's `licence` and `citation` fields. If the page says something other than CC BY 4.0, the atlas follows the page, and the roadmap item stays blocked until the lead has read it.

| Source | What it is (as remembered) | Where (expected; confirm) | Licence and citation (as remembered; confirm) | Decision for round 5 |
|---|---|---|---|---|
| **UCDP Georeferenced Event Dataset (GED), Global version, annual** | Event-level, 1989 to the last complete year; one row per event with `type_of_violence` (1 state-based, 2 non-state, 3 one-sided), `conflict_new_id`, `dyad_new_id`, `side_a`/`side_b`, `country`/`country_id` (Gleditsch–Ward number), `date_start`/`date_end`/`date_prec` (1 day … 5 year), `best`/`low`/`high`, `active_year`, plus coordinates and sub-national fields the atlas never reads. Roughly 400,000 rows; the CSV zip is a few hundred MB. Version `YY.1` is released once a year (mid-year) covering through the previous calendar year, so in Oct 2026 expect **26.1 covering 1989–2025**; if only 25.1 (through 2024) exists, say so. | Download page `https://ucdp.uu.se/downloads/` (GED section; file name pattern `ged261-csv.zip`); API `https://ucdpapi.pcr.uu.se/api/gedevents/26.1?pagesize=1000&page=0` (JSON pages, same field names). | UCDP states its data are free to use and asks for citation; OPEN_SOURCE_RESEARCH.md recorded **CC BY 4.0 (unconfirmed)**. Citation UCDP requests for GED (confirm the current pair): Davies, Engström, Pettersson & Öberg (2025), *Organized violence 1989–2024, and the challenges of identifying civilian victims*, Journal of Peace Research 62(4); and Sundberg & Melander (2013), *Introducing the UCDP Georeferenced Event Dataset*, JPR 50(4): 523–532, DOI 10.1177/0022343313484347. | **Adopt.** Event dates, parties, dyads and UCDP location countries; yearly best/low/high **sums only where the BRD does not reach** (the current year). Coordinates, `adm_1/2`, `where_*`, `source_*` are never read. Prefer the zip download to the API (one file, one SHA-256). |
| **UCDP Candidate Events Dataset (monthly, provisional)** | Same columns as GED; preliminary events for the months after the last annual release, revised before they enter the annual dataset. Released monthly, about a month in arrears; version pattern `YY.0.M` (expected `26.0.8` for Aug 2026, `26.0.9` for Sep 2026 if out). Several monthly files may exist; an event id can appear in more than one release. | Same download page (Candidate section) and API `gedevents/26.0.8`. | Same terms expected. Citation (confirm): Hegre, Croicu, Eck & Högbladh (2020), *Introducing the UCDP Candidate Events Dataset*, Research & Politics 7(3), DOI 10.1177/2053168020935257. | **Adopt, flagged `provisional: true`** in the manifest; every figure derived from it carries `provisional: true` and the month it covers. Download **every** monthly release after the annual year; the ingest dedupes by event id and lets the later release win. |
| **UCDP/PRIO Armed Conflict Dataset (conflict-year)** | One row per state-based conflict per active year (≥ 25 battle-related deaths), 1946 to the last complete year: `conflict_id` (equals GED `conflict_new_id`), `location`, `side_a`, `side_b`, `year`, `intensity_level` (1 minor 25–999; 2 war ≥ 1,000), `type_of_conflict` (1 extrasystemic, 2 interstate, 3 intrastate, 4 internationalised intrastate), `start_date` (first battle-related death), `start_date2` (first year the 25-death threshold was reached), `ep_end`. Expected version 26.1 covering through 2025. | Download page (Armed Conflict Dataset section; pattern `ucdp-prio-acd-261.csv`); API `https://ucdpapi.pcr.uu.se/api/ucdpprioconflict/26.1`. | Same terms expected. Citation (confirm): Gleditsch, Wallensteen, Eriksson, Sollenberg & Strand (2002), *Armed Conflict 1946–2001: A New Dataset*, JPR 39(5), DOI 10.1177/0022343302039005007, plus the current Davies et al. article. | **Adopt; required.** It is the only source for interstate/intrastate classification, active years, intensity level and the two start dates. A state-based conflict that is in GED but not in the supplied ACD (new in the current year) is **excluded and named**, never classified by guess. |
| **UCDP Battle-Related Deaths Dataset (conflict-level)** | Yearly `bd_best`/`bd_low`/`bd_high` per state-based conflict, 1989 to the last complete year. Use the **conflict-level** file, not the dyad-level one (the ingest rejects duplicate conflict-years). | Download page (Battle-Related Deaths section; pattern `ucdp-brd-conf-261.csv`); API `battledeaths/26.1`. | Same terms expected; cite with the GED/ACD articles. | **Adopt as the yearly figure wherever it covers the year** (`estimator: "UCDP BRD"`); GED sums stand in only for later, provisional years. UCDP builds the BRD from GED, so the two should be close but need not match. |
| UCDP Non-State Conflict Dataset; One-sided Violence Dataset | Yearly figures for the other two UCDP categories. | Download page. | Same terms expected. | **Only if the panel widens scope** (`--include-non-state`, `--include-one-sided` in the ingest). Default scope is state-based, which is what "internal and external war" asked for. The About copy must then say that non-state fighting and one-sided violence against civilians are **not** in the layer. |
| UCDP codebooks (PDF, one per dataset and version) | Definitions and thresholds the UI quotes. | Download page, beside each file. | Copyright UCDP; quoting definitions with attribution is normal academic practice. | **Read and quote.** The 25- and 1,000-death thresholds, the `type_of_conflict` labels, the `date_prec` scale and the meaning of `start_date` vs `start_date2` go into `UCDP_TERMS.md` verbatim with page references; About copy follows the codebook, not this document. |
| HDX (data.humdata.org) | Humanitarian data mirror. It is **uncertain** whether UCDP publishes GED/ACD there; ACLED does (rejected). | `https://data.humdata.org/` search "UCDP". | Per dataset page. | **Fallback only**, and only if the HDX page names the same UCDP version and the same licence as ucdp.uu.se and the primary host is unreachable. Record the mirror URL in the manifest `url` and note it in the PR. Never take a version from HDX that the primary does not list. |
| Wikipedia, *List of ongoing armed conflicts* and conflict articles | Crowd-edited list with its own fatality tiers (major wars ≥ 10,000 deaths/yr, wars 1,000–9,999, minor 100–999, skirmishes < 100), which are **not** UCDP's. | `https://en.wikipedia.org/wiki/List_of_ongoing_armed_conflicts` | CC BY-SA 4.0 text. | **Discovery and coverage cross-check only**: after the ingest, read the list to see whether a conflict a reader would expect is absent from the UCDP window and why (threshold, lag, dataset scope). Write the finding into the PR and, if it is a dataset limit, into the About copy. Never a source, never a figure, never a tier, never prose. |
| International Crisis Group, CrisisWatch | Monthly qualitative tracker with deteriorated/improved arrows. | `https://www.crisisgroup.org/crisiswatch` | Copyright ICG; no open licence found. | **Link-out context only**, as already decided; no ingestion, no arrows, no risk alerts. |
| Geneva Academy, RULAC (Rule of Law in Armed Conflicts) | Legal classification of armed conflicts under international humanitarian law (international / non-international). | `https://www.rulac.org/` | Copyright Geneva Academy; no open licence found (uncertain). | **Link-out only**, as attributed external context on a conflict record; its legal classification is not UCDP's and must not be merged with `type_of_conflict`. |
| ACLED | Human-coded political violence and demonstration events. | — | Proprietary EULA (recorded 8 Jul 2025 version). | **Rejected**, including as a download for private cross-checking: the EULA question is not worth re-opening and the atlas must be able to say it never held ACLED data. |
| News reporting (stream B) | Articles opened and read. | Publishers' sites. | Publishers' rights; the contract requires paraphrase, attribution and a link. | **The only basis for civil unrest and kind re-reads**, under `research/round4/CONTRACT.md` and §10.4. Never a basis for a conflict record or a death figure. |

Two UCDP coding facts the data session must check because they decide what the map shows: (1) **country placement**: GED's `country` is UCDP's own location coding; events in Gaza and the West Bank are believed to be coded under *Israel* (confirm on the download). The atlas shows the UCDP name beside the mapped code (`countries[].ucdp_name`) and does not re-code; if the gate finds the placement misleading for a record, the record is withheld, not edited. (2) **Kosovo** (GW 347) has no ISO code; the ingest emits `code: null` with a warning and the gate decides whether the record ships without a map placement.

---

## 10.2 Preflight for stream A (UCDP hosts)

Do this before any branch work, exactly as §3 does for news hosts. Read the clock first.

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
[ -n "$HTTPS_PROXY" ] && curl -sS "$HTTPS_PROXY/__agentproxy/status" | head -40
for u in https://ucdp.uu.se/downloads/ https://ucdpapi.pcr.uu.se/api/ucdpprioconflict/25.1?pagesize=1 https://ucdp.uu.se/; do
  printf '%s ' "$(date -u +%H:%M:%S)"; curl -sS -L --max-time 30 -o /dev/null -w "%{http_code} %{size_download} $u\n" "$u" || echo "FAILED $u"
done
```

- **Works:** 200 with a substantive body from the download page, and JSON from the API probe.
- **Environment block:** `EGRESS_BLOCKED`, a proxy 403/407, a refused CONNECT or DNS failure. **Stop.** Commit nothing. Tell the user the hosts to allow: `ucdp.uu.se`, `ucdpapi.pcr.uu.se` (and `pcr.uu.se` if the download redirects there), plus `data.humdata.org` only if the HDX fallback is wanted. The settings path is the one §3 gives for news domains.
- **Site refusal:** a 403 or 429 from UCDP itself says nothing about the environment; wait and retry once, then report.

Then open the download page and read, before downloading anything: the exact versions on offer, the licence sentence, the citation UCDP asks for, and the codebook link for each file. Write them into `research/round5/UCDP_TERMS.md` as you read them, each with the URL and the clock reading of the read.

Stream B uses the §3 news preflight unchanged. The two preflights are independent; a session may have one and not the other, and says which.

---

## 10.3 Steps for stream A (UCDP re-publication)

`<REPO>`, `<SCRATCH>` and `<NOW>` as in §4. Raw UCDP files live under `<SCRATCH>/round5/downloads/`, **outside the repository**; only the manifest, the terms file, the country map and the candidates file are committed.

**Step A1: branch** (§10.8; same rules as §2.1 with `origin/main` as base and `data/round5-<YYYYMMDD>` as the fallback name). Confirm a clean tree and run the baseline: `python3 -m unittest discover -s tests && node --test tests/*.mjs`.

**Step A2: download and log.** For each file: read the clock, download with `curl -sS -L -o`, read the clock again, compute `sha256sum`, unzip if needed, and append an entry to `research/round5/downloads/inputs.json`:

```json
{"files": [
  {"path": "<SCRATCH>/round5/downloads/ged261.csv", "role": "ged", "dataset": "UCDP Georeferenced Event Dataset (GED) Global version", "version": "26.1",
   "provisional": false, "covers_through": "2025-12-31", "url": "https://ucdp.uu.se/downloads/ged/ged261-csv.zip", "downloaded_at": "<clock reading>",
   "licence": "<the licence sentence copied from the page>", "citation": "<the citation UCDP requests, verbatim>", "doi": "10.1177/0022343313484347"},
  {"path": "<SCRATCH>/round5/downloads/GEDEvent_v26_0_8.csv", "role": "ged", "dataset": "UCDP Candidate Events Dataset", "version": "26.0.8", "provisional": true,
   "covers_through": "2026-08-31", "url": "…", "downloaded_at": "…", "licence": "…", "citation": "…", "doi": "10.1177/2053168020935257"},
  {"path": "<SCRATCH>/round5/downloads/ucdp-prio-acd-261.csv", "role": "acd", "dataset": "UCDP/PRIO Armed Conflict Dataset", "version": "26.1", "provisional": false,
   "covers_through": "2025-12-31", "url": "…", "downloaded_at": "…", "licence": "…", "citation": "…", "doi": "10.1177/0022343302039005007"},
  {"path": "<SCRATCH>/round5/downloads/ucdp-brd-conf-261.csv", "role": "brd", "dataset": "UCDP Battle-Related Deaths Dataset (conflict-level)", "version": "26.1", "provisional": false,
   "covers_through": "2025-12-31", "url": "…", "downloaded_at": "…", "licence": "…", "citation": "…", "doi": null}
]}
```

Rules: `covers_through` is the last day the file's own documentation says it covers (the annual year's 31 Dec; the Candidate month's last day), never today. `downloaded_at` is the clock reading of the fetch, as `accessed_at` is in round 4. Every monthly Candidate release after the annual year is listed. Paths may be absolute (outside the repo) or relative to the manifest. The manifest holds no secrets and is committed; the CSVs are not.

**Step A3: confirm columns, thresholds and country names.** Run the ingest once against the manifest:

```bash
python3 scripts/ingest_ucdp.py --inputs research/round5/downloads/inputs.json --out <SCRATCH>/round5/conflicts.candidates.json \
  --countries public/countries.json --window-start 2024-10-01 --window-end <YESTERDAY or today UTC>
```

- A **missing column** is a hard error that names the column. Do not rename columns by hand: read the codebook, and if UCDP renamed a field, report it in the PR so the lead changes the script with a test (the §2.2 narrow-fix rule).
- Read every **warning**. Skipped rows are expected in small numbers (malformed figures); report their count. An unmapped country (`code null`) needs a decision: add it to `research/round5/country-map.json` as `{"<GW number>": "<ISO2>"}` **only when the ISO code is beyond doubt** (a spelling difference), and leave it null when there is none (Kosovo) or when the mapping is a political judgement; the gate decides what ships.
- Check the **thresholds and labels** the script hard-codes (`INTENSITY`, `TYPE_OF_CONFLICT`, `DATE_PRECISION`) against the downloaded codebooks; a mismatch is a correction for the lead, reported in the PR with the codebook page, never silently edited.
- Note the **`excluded`** list: conflicts with no event in the window; state-based conflicts absent from the ACD (expected for conflicts new in 2026); non-state and one-sided conflicts (outside default scope). The counts go into the PR and the About copy ("{n} UCDP conflicts in the Candidate data could not be classified and are not shown").

**Step A4: produce the candidates.** Re-run with `--out research/round5/conflicts.candidates.json` (and `--country-map research/round5/country-map.json` if one was written). Commit `research/round5/downloads/inputs.json`, `research/round5/UCDP_TERMS.md`, `research/round5/country-map.json` and `research/round5/conflicts.candidates.json` by explicit path: `git commit -m "Round 5: UCDP candidates from <versions>, window 2024-10-01..<end>"`, then push.

**Step A5: gate review.** One fresh agent that took no part in A2–A4. It may only **remove or annotate**, never add or edit a figure. It checks, record by record:

1. Every `fatalities[]` entry has integer `low <= best <= high`, a `year`, an `estimator`, a `through` date, and cites a dataset entry whose version equals the downloaded file; provisional entries are flagged.
2. `status_basis.basis` is one of the three bases; the text contains "does not know whether fighting is taking place today" or "not evidence of peace"; no record anywhere says ongoing, casualties, death toll, so far, to date, escalating.
3. Parties are UCDP strings; no individual's name appears anywhere (search for titles such as "General", "President", "Colonel", "Sheikh" and for personal-name patterns); if UCDP's own party name contains a person's name (it can, for some groups), keep UCDP's string and note it in the PR.
4. `countries[]`: placement matches UCDP's `location` string and the GED `country` values; a null code is either accepted with the record's `ucdp_name` showing, or the record is withheld (listed in `research/round5/gate-review.json` with the reason). No re-coding.
5. No coordinate, place or source text survived (`check_candidates` already enforces this; the gate repeats the grep on the committed file).
6. The `licence_note` and every `sources[].licence` equal the text in `UCDP_TERMS.md`; versions equal the manifest; `window.last_provisional_month` equals the newest Candidate file actually downloaded, not the current month.
7. Scope statement: the file's `method_note` says what is excluded (non-state, one-sided, unclassified new conflicts) and that absence is not peace.

The gate writes `research/round5/gate-review.json`: `{"reviewed_at": "<clock>", "candidates_file_sha256": "…", "withheld": [{"id": "ucdp-…", "reason": "…"}], "notes": ["…"], "result": "pass"|"fail"}`. Commit it ("Round 5 gate review").

**Step A6: publish (only if prerequisite 3 is on `main`).** `python3 scripts/publish_conflicts.py --candidates research/round5/conflicts.candidates.json --gate research/round5/gate-review.json` writes `public/conflicts.json`; then run every `scripts/validate_*.py`, `python3 -m unittest discover -s tests`, `node --test tests/*.mjs` and `python3 scripts/build.py`. If the publish step is absent, **stop here**: open the PR with the candidates, the terms and the gate review, and say that publication waits on the lead's step. Never hand-write `public/conflicts.json`.

**Step A7: scope check, commit, PR** (§10.8). PR title: "Round 5: UCDP conflict records, <versions>, through <last provisional month> (candidates | published)". Body: versions and download times; the licence sentence as read; counts (emitted, excluded by reason, withheld by the gate); unmapped countries and what was decided; codebook mismatches found; the Wikipedia coverage cross-check findings (§10.1), if done; the conflict dataset stamp the UI should show (`window.last_provisional_month`, `downloaded_at`); a line that the protest snapshot's staleness is unchanged by this PR.

**Cadence.** Re-run A2–A7 when UCDP publishes a new Candidate month or a new annual release. Each run replaces the candidates file and changes only the conflict dataset stamp; it never touches `WINDOW_END`, `events.json` or the header chip.

---

## 10.4 Steps for stream B (civil unrest and kind re-reads)

Stream B is the round-4 sweep with one more clause. It runs only with news access (§3) and only after prerequisite 4 (the `kind` field and the update path) is on `main`.

**The kind clause** (to be added to `research/round4/CONTRACT.md` or its round-5 successor; wording follows the skeptic's §3.3 and §5.1, which are binding):

> **Kind.** Every episode carries `kind`, one of `collective-action`, `protest`, `strike`, `civil-unrest`, with `kind_basis` `{"method", "text", "source_ids"}`. A record researched without a reading of the form of action keeps `collective-action` with `method: "contract-default"`. A record may carry `protest`, `strike` or `civil-unrest` only with `method: "source-reread"`, a `text` that paraphrases **the cited source's own words for the form of action and, for civil unrest, the sentence that attributes violent acts to participants, naming who did what**, and event-local `source_ids` for the article that says so. `civil-unrest` requires that the source itself attributes violence or destruction (rioting, looting, arson, fighting between groups of residents) to participants or a crowd connected to the action. The following never make an episode civil unrest: police or security-force dispersal, arrests or force (that is `state_response`); force called excessive or unlawful by a finding or an allegation (that is `state_response` with its attribution kept); violence the source separates from the protesting actor (that goes in the "Violence or harm" row); the words "clashes", "turned violent", "unrest" or "tensions" on their own; a government's or official's characterisation ("riots", "unlawful assembly"), which is a claim to record as a position or a state-response attribution. In a high-repression context `civil-unrest` needs independent national or international reporting that itself attributes the acts. Kind is single-valued; an episode that is both a strike and a demonstration stays `collective-action` with a `text` saying both are reported. Kind is never set from a title, an id, an issue tag, a summary or the stored `intensity.violence` line. The badge label for the kind is "Civil unrest, as reported".

**B1: re-read candidates.** The first re-read candidates are the existing records whose sources already discuss participant conduct, which the skeptic's 4 Oct scan found with this regex over `title`, `summary` and `intensity.violence` (13 matches on 4 Oct 2026; recompute on the current `public/events.json`, because new records may have arrived):

```bash
python3 -c "
import json,re
p=re.compile(r'riot|clash|unrest|looting|violen|arson|torch', re.I)
for e in json.load(open('public/events.json'))['events']:
    if any(p.search(str(e.get(k) if k!='intensity' else e['intensity']['violence'])) for k in ('title','summary','intensity')): print(e['id'])"
```

These are **leads for a re-read, never evidence**: the skeptic's §3.2 shows that several of them (the PNG payroll protest with separate looting, the New Caledonia record whose source refuses collective attribution, the Greek record matching "riot police", the Iranian record with "unrest" in its stable id) would be mistyped by their words. Re-reading them first is a courtesy to the reader, not a presumption about the result; most are expected to stay `collective-action` or become `protest` or `strike`.

**B2: how a re-read is recorded.** In `research/round4/<region>-updates.json` (or the round-5 region files the lead defines), an update may carry `"kind": "protest" | "strike" | "civil-unrest"` and `"kind_basis": {"method": "source-reread", "text": "…", "source_ids": ["…"]}`. The cited source must be one the agent **opened and read in this run** (its `accessed_at` equal to a logged fetch row, as acceptance 4 requires), either an existing source re-fetched or a new one added in `new_sources`. `merge_history.apply_round4` refuses a `kind` without a `kind_basis` (prerequisite 4), as it does for `status` without `status_basis`. A re-read that does not speak to the form of action records nothing about kind.

**B3: new civil-unrest episodes** are ordinary round-4 new episodes (`<region>-events.json` + `<region>-context.json`) with `kind: "civil-unrest"` and a `kind_basis` under the clause above. Everything else in the round-4 contract applies: deep-read, two chains for "corroborated", no private individuals, the "Violence or harm" row keeps its own attributed text, `state_response` stays separate, and `verification.note` says AI-assisted with no human review. Titles describe the episode, not the people: no "rioters", "mob", "looters".

**B4: verification and gate.** The source-fidelity verifiers check, for every re-typed record, that the `kind_basis.text` paraphrase is supported by the opened page and that the attribution of violent acts to participants is the source's, not the agent's. The gate agent (§4 Step 4) adds: in a high-repression context, `civil-unrest` without independent reporting is reverted to `collective-action` with the note "kind withheld under the kind clause (high-repression context)".

**B5: checker and consolidate.** The region checker needs two new checks (lead's work before stream B runs): `kind` ∈ the four values; `kind_basis.method` matches the kind (`contract-default` only with `collective-action`; otherwise `source-reread` with non-empty event-local `source_ids` whose `accessed_at` is in this run's fetch log). Consolidate counts re-typed records in the release note ("n episodes re-typed from a re-read source; m stay collective action").

---

## 10.5 Acceptance criteria

Stream A:

1. **Terms read before download.** `research/round5/UCDP_TERMS.md` quotes the licence sentence, the citation and the thresholds verbatim with URLs and clock readings; the manifest's `licence` and `citation` fields equal those quotes; no row of §10.1 remains "as remembered" without a confirmed or corrected value in the PR.
2. **Versions pinned.** Every `sources[]` entry names the dataset, version, `covers_through`, URL, `downloaded_at` and SHA-256 of the file actually used; `window.last_provisional_month` equals the newest Candidate file downloaded.
3. **Figures are bounded estimates.** Every figure has integer `low <= best <= high`, a calendar year, an estimator (BRD where it covers the year, GED sums otherwise), a `through` date, `provisional` set correctly, and a dataset citation. No figure anywhere is a single number, a sum across years or conflicts, a rate or a rank.
4. **"Ongoing" is absent.** No record has a `status`; `status_basis` uses only the three bases; the words ongoing, casualties, death toll, so far, to date, escalating, front line (except in negation inside the fixed `note`) do not appear in the committed JSON; `check_candidates()` passes on the committed file.
5. **No coordinates, places, individuals.** The committed JSON contains none of `latitude`, `longitude`, `geom`, `adm_`, `where_`, no coordinate-like text and no personal names outside UCDP's own party strings (gate check 3).
6. **Placement is UCDP's.** `countries[]` codes derive from the GED `country`/`country_id` values via the built-in tables, `public/countries.json` names or the committed `country-map.json`; no mapping exists only in a session's head; null codes are either shipped with the UCDP name visible or withheld with a reason.
7. **Exclusions are named.** The `excluded` list and the gate's `withheld` list are in the PR and summarised for the About copy; non-state and one-sided scope is stated as excluded unless the panel widened it.
8. **Publication is a separate step.** `research/round5/conflicts.candidates.json` has `publication: "candidate"`; `public/conflicts.json`, if present, was written by the publish step after a `pass` gate review and validates; the ingest never wrote to `public/`.
9. **Clocks stay apart.** The PR changes no protest data, no `WINDOW_END`, no `events.json`; the UI's header chip and staleness state are unchanged by the merge; the conflict dataset stamp changes.
10. **All checks pass** (§4 Step 6 commands) on the branch, and the scope check (§10.8) prints "scope ok", "no raw downloads" and "no tmp files".

Stream B (in addition to §5 acceptance 1–12):

11. **Kind only from a read source.** Every record whose `kind` is not `collective-action` has `kind_basis.method: "source-reread"`, a `text` naming who the source says did what, and `source_ids` whose `accessed_at` equals a logged fetch in this run; the region checker reports 0 kind errors.
12. **The keyword leads were treated as leads.** Each B1 candidate has a lead outcome (`confirmed` re-type, `refuted` re-type, `unconfirmed` or `unreachable`); none was re-typed without a re-read; the release note counts re-typed and unchanged records.
13. **No criminalising copy.** No title, actor or note added in this round uses "rioters", "mob", "thugs" or "looters"; the violence row keeps its attribution; government characterisations appear as attributed claims.

---

## 10.6 Evidence rules

Stream A (UCDP):

- **UCDP figures are estimates with bounds.** Publish best, low and high together, for a named calendar year and a named dataset version, or publish nothing for that year. Provisional (Candidate) figures say so and name the month they reach. A year absent from the dataset is "not recorded", never zero; zero is published only when UCDP publishes zero.
- **"Active" is UCDP's yearly threshold, and nothing here says what is happening today.** A conflict's basis is one of: recorded as active by UCDP in the named year(s) (at least 25 battle-related deaths in that calendar year); provisional UCDP events recorded through the named month; not recorded by UCDP as active in the latest annual year (absence is a threshold and coverage fact, not peace). The 72-hour protest rule, `observationBand`, the staleness clock and the recency shading never read conflict dates.
- **Parties as UCDP names them**; governments as institutions; no individuals, leaders or spokespeople; no labels such as "rebels", "terrorists", "militants" or "regime" except inside UCDP's own party string.
- **Country placement is UCDP's location coding**, shown with UCDP's name. The atlas does not move a conflict to another country, does not resolve disputed placements, and marks a conflict with several location countries in each of them.
- **No front lines, no coordinates, no sub-national places**, no troop positions, controlled territory, event points, trend arrows, risk or severity scores, and no comparison or sum between protest and conflict counts. UCDP GED has coordinates; the ingest never reads them and the validator refuses them.
- **No news-sourced death figures** in a conflict record, ever; a news article cannot amend a UCDP figure. If a reader-facing need arises for a figure UCDP does not have, the answer is "not recorded by UCDP", not a newspaper number.
- **Versions, licence and citation travel with the data.** Every record cites the dataset entries it draws on; the file carries the licence sentence as read and the citation UCDP requests; a new download replaces the file as a whole and re-stamps only the conflict dataset stamp.
- **The window decides inclusion, not figures.** A conflict is included when a UCDP event is dated inside the window; its yearly figures cover whole calendar years from the files supplied (2024 includes January–September 2024), because a yearly figure is a yearly figure whatever the window start. The `note` says so.

Stream B (news):

- All round-4 rules (§4, §5, `research/round4/CONTRACT.md`) plus the kind clause in §10.4. In one line: **riot versus protest is a reporting judgement, so the source's own attribution of violent acts to participants is required, named, and cited; police force never makes an episode civil unrest; officials' characterisations are claims; keyword matches are leads.**

---

## 10.7 The window

- **Stream A:** `--window-start 2024-10-01`, `--window-end` the run day (UTC), never in the future; inclusion by UCDP event `date_start`. Yearly figures cover calendar years 2024, 2025 and 2026-through-the-last-Candidate-month. The committed file states `window.start`, `window.end`, `window.first_year`, `window.last_year` and `window.last_provisional_month`; the UI and About copy name those, in the paired sentence the skeptic's §6 fixes ("Armed conflict records: UCDP {datasets and versions}, calendar years 2024 to {Y}, with provisional events through {Mon YYYY}; downloaded {date}"). "Past two years" is the owner's intent and appears nowhere as a product claim.
- **Stream B:** the round-4 window rules apply unchanged (`window_start` of the round, `WINDOW_END` advanced only for days actually searched). A re-read of an old source for its kind never changes `last_observed_at`, `WINDOW_END` or the staleness clock; a kind change is not new activity.
- **The two clocks never merge.** A UCDP download never makes the protest snapshot "current"; a protest sweep never refreshes the conflict dataset stamp. The dates sheet gets a separate "Conflict dataset" row (skeptic §7.8).

---

## 10.8 Branch, paths and commits (same rules as §2, extended)

- **Branch:** §2.1 applies. The base is `origin/main` (it already contains the round-4 pipeline). Fallback name `data/round5-<YYYYMMDD>`. Never `main`, never the UI branch, never force-push. Streams A and B may share a branch only if both run in the same session; otherwise one branch each (`data/round5-ucdp-<date>`, `data/round5-unrest-<date>`), because their review questions differ.
- **Allowed paths**, in addition to §2.2:

  | Allowed | Notes |
  |---|---|
  | `research/round5/downloads/inputs.json`, `research/round5/UCDP_TERMS.md`, `research/round5/country-map.json`, `research/round5/conflicts.candidates.json`, `research/round5/gate-review.json`, `research/round5/release-notes/*.md` | Stream A outputs. **Never** `research/round5/downloads/*.csv|zip|pdf` (raw UCDP files stay in `<SCRATCH>`). |
  | `public/conflicts.json` | Written **only** by the publish step after a `pass` gate review; never by hand. |
  | `research/round4/**` region, update and lead-outcome files | Stream B, exactly as round 4. |
  | `scripts/ingest_ucdp.py`, `scripts/validate_conflicts.py`, `scripts/publish_conflicts.py` | **Only** for a narrow bug that blocks valid data, with a new `tests/test_data_refresh_<topic>.py`; a column rename by UCDP is reported, not patched, unless the lead asks. |

  Everything the UI session owns stays untouchable (§2.2 "Never touch"), including `public/roadmap.json`, `docs/**`, `styles.css`, `css/*`, `js/*`, `map.js`, `tests/` existing files and fixtures.
- **Scope check** (run before every push; replaces the §2.2 regex for a round-5 branch):

  ```bash
  ALLOWED='^(research/round4/.+|research/round5/(downloads/inputs\.json|UCDP_TERMS\.md|country-map\.json|conflicts\.candidates\.json|gate-review\.json|release-notes/.+)|public/(events|event-context|coverage|research-ledger|cities|upcoming|conflicts)\.json|scripts/merge_history\.py|scripts/validate_(data|history|coverage|upcoming|conflicts)\.py|scripts/(ingest|publish)_(ucdp|conflicts)\.py|tests/test_data_refresh_[a-z0-9_]+\.py)$'
  { git log --first-parent --no-merges --name-only --format= origin/main..HEAD; git status --porcelain --untracked-files=all | cut -c4- | sed 's/ -> /\n/'; } \
    | sed '/^$/d' | sort -u | grep -v -E "$ALLOWED" && echo "OUT OF SCOPE: the files above must not change" || echo "scope ok"
  git ls-files research/round5/downloads | grep -E '\.(csv|zip|pdf)$' && echo "RAW DOWNLOADS COMMITTED: remove them from history before pushing" || echo "no raw downloads"
  git status --porcelain --untracked-files=all | grep -E '\.tmp$' && echo "TMP FILES: delete them" || echo "no tmp files"
  ```
- **Staging:** explicit paths only, never `git add -A` and never a whole `research/round5/` folder (the downloads directory sits inside it).
- **Commits:** one per step (A2 "Round 5: UCDP candidates from <versions>, window …", A5 "Round 5 gate review", A6 "Round 5: publish UCDP conflict records <versions>"; stream B as §4 Step 3). Push after each.
- **PR into `main`** as §2.3: a person merges; `docs/DEPLOYMENT.md`'s editorial approval applies. The PR body names the conflict dataset stamp and says the protest deadline rule (§6) is unaffected by stream A. If both streams are in one PR, the §6 deadline applies to the stream B records.

---

## 10.9 Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | UCDP hosts blocked, as every other host was on 2 Oct | §10.2 preflight stops before any work; the user is told the two hosts to allow. The roadmap item stays blocked and says so. |
| 2 | Licence or citation quoted from memory and published | A1–A3 require the verbatim page text in `UCDP_TERMS.md` and the manifest before the ingest runs; the gate compares; the layer stays blocked on the roadmap until the lead has read the quoted terms. |
| 3 | Column renames or threshold changes in a new UCDP version | The ingest fails loudly on a missing column; thresholds are checked against the codebook in A3; mismatches are reported for the lead, never patched in the data session. |
| 4 | GED sums and BRD figures mixed in one year, or a provisional month read as a yearly figure | One estimator per year, named; `provisional` and `through` on every figure; BRD preferred wherever it covers the year. |
| 5 | A new 2026 conflict is silently dropped because the ACD lags | It is listed in `excluded` with the reason, counted in the PR and in About ("could not be classified; not shown"). |
| 6 | Country placement reads as a political statement (Gaza coded under Israel; Kosovo unmapped; multi-location conflicts) | UCDP's name shown beside the code; no re-coding; null codes decided by the gate record by record and listed; "placement follows UCDP, not this atlas" on every record (skeptic CD3-sub). |
| 7 | Candidate month lag read as "nothing happened" | `last_provisional_month` is the newest file downloaded; the UI copy says "through {month}" and "subject to revision"; EC4 wording for countries without a record. |
| 8 | Raw UCDP CSVs (hundreds of MB) committed | Downloads live in `<SCRATCH>`; the scope check rejects them; prerequisite 5 adds `.gitignore` lines. |
| 9 | The conflict file re-stamps the site as current | Separate stamp row; `events.json` and `WINDOW_END` untouched; acceptance 9. |
| 10 | Kind guessed from keywords, ids or tags in stream B | The kind clause; B1 candidates are leads; the checker's kind checks; `apply_round4` refuses kind without basis. |
| 11 | "Civil unrest" criminalises participants or imports officials' labels | Clause rules 2–5; "Civil unrest, as reported" label; gate reverts in high-repression contexts without independent reporting. |
| 12 | Stream A and B mixed in one review, so a death figure and a protest re-read get the same scrutiny | Separate branches unless one session does both; separate gate checklists; separate PR sections. |
| 13 | The ingest skeleton's schema differs from the architect's final schema | The schema is constants (`RECORD_FIELDS`, `KINDS`, …) and one `aggregate()` block; the deltas are listed in `design2/ingest/README.md` and §10.12; the lead reconciles before moving the script. |
| 14 | HDX mirror serves a different version than ucdp.uu.se | Mirror used only when the primary is down and only when the page names the same version and licence; recorded in the PR. |

---

## 10.10 Roadmap statuses the lead sets

The skeptic's §7.7 item texts are adopted; the data side's honest statuses on 4 Oct 2026:

| id | status | note |
|---|---|---|
| `ucdp-ingest-and-validator` | **next** (the lead flips to **in-progress** when the skeleton is moved into `scripts/` with its tests, and to **shipped** only when `tests/test_ingest_ucdp.py` and a `validate_conflicts` test run in CI) | The skeleton exists in the design scratchpad and passes 28 tests offline; the validator port and the publish step do not exist yet. |
| `armed-conflict-context-layer` | **blocked** | `blocked_by`: "This environment cannot reach ucdp.uu.se or ucdpapi.pcr.uu.se, and the UCDP licence terms have not been confirmed from the download page. Needs the data session with network access to UCDP hosts, the terms read on the page, and the ingest, validator and publish step on main." |
| `kind-field-collective-action` | **next** | No network needed; pipeline default plus validator, fixtures and tests. |
| `kind-subtyping-by-source-reread` | **blocked** | `blocked_by`: the §3 news-access blocker, as `add-reports-after-2-oct-2026`. |
| `colour-blind-patterns`, `shading-by-newest-evidence`, `lazy-views-and-budget-headroom` | as the skeptic and designer set them (UI side) | Not data items. |

"Shipped" needs CI test evidence, as `validate_roadmap.py` enforces; the data session never edits `public/roadmap.json`.

---

## 10.11 Paste-ready prompt (stream A)

```text
You are the round-5 data session for Protest Atlas (GitHub: occult-kranti/protest-atlas). This run has one job: re-publish UCDP armed-conflict data as candidate records, under docs/HANDOFF_DATA_REFRESH.md §10 (read it in full first, then research/round4/CONTRACT.md and design2's editorial §4 if the lead has merged it into docs). Never edit interface files, public/roadmap.json or docs/**.

1. Preflight (§10.2): read the clock, probe https://ucdp.uu.se/downloads/ and https://ucdpapi.pcr.uu.se/api/ucdpprioconflict/25.1?pagesize=1. If blocked, stop, commit nothing, and tell me the hosts to allow and the proxy's stated reason.
2. Read the UCDP download page and codebooks before downloading. Copy the licence sentence, the citation UCDP requests and the 25/1,000-death thresholds verbatim into research/round5/UCDP_TERMS.md with URLs and clock readings. If the licence is not what OPEN_SOURCE_RESEARCH.md recorded (CC BY 4.0), say so and continue only with candidates, never publication.
3. Branch from origin/main (§10.8); download the GED annual release, every Candidate monthly release after it, the Armed Conflict Dataset and the conflict-level Battle-Related Deaths file into your scratch directory, record SHA-256 and clock readings, and write research/round5/downloads/inputs.json (§10.3 A2). Never commit the CSVs.
4. Run scripts/ingest_ucdp.py (§10.3 A3–A4) with --countries public/countries.json; read every warning; map a country only when its ISO code is beyond doubt; leave the rest null. Commit the manifest, terms, country map and research/round5/conflicts.candidates.json.
5. Run the gate review with a fresh agent (§10.3 A5) and commit research/round5/gate-review.json.
6. If scripts/publish_conflicts.py exists on main, publish (A6) and run every validator, test and the build; otherwise stop at candidates and say so.
7. Scope check (§10.8), push, open a PR into main titled "Round 5: UCDP conflict records, <versions>, through <month> (candidates|published)" with the §10.3 A7 body. Do not merge.
8. Report: versions and download times, the licence sentence as read, counts emitted/excluded/withheld with reasons, unmapped countries, codebook mismatches, the PR link, and what remains unknown. Say explicitly that nothing in this run changes the protest snapshot's dates.
```

Stream B uses the §8 prompt with one added line after item 6: "Kind: apply the kind clause in handoff §10.4. Re-read the B1 candidates first as leads; set a kind only from the opened source's own words with a kind_basis; police force never makes an episode civil unrest; officials' characterisations are claims."

---

## 10.12 Open questions for the architect and the lead

1. **Schema reconciliation.** The skeleton emits the lead's named keys (`id, kind, countries, parties, start, latest_evidence, fatalities[], status_basis, sources, verification, note`) plus `kind_basis`, `ucdp`, `latest_evidence_precision`, and `provisional`/`through`/`events` on each fatality entry; the skeptic's §4.6 wants `years[]` with `intensity_level` separate from `provisional[]` months, `ucdp.dyad_ids`, `location_countries` and `activity_basis`. Decide the exact keys; the deltas and their reasons are in `design2/ingest/README.md`. Adding `intensity_level` and its label per active year is a five-line change.
2. **Mixing estimators.** The skeleton uses BRD figures for the years the BRD covers and GED sums for later provisional years, labelled per figure. If "never mix within a record" is preferred, GED sums are dropped and those years read "not recorded".
3. **Null country codes.** Should `validate_conflicts.py` refuse `code: null` (then Kosovo-located conflicts cannot ship) or allow it with the UCDP name shown and no map placement? The gate needs the rule before A5.
4. **Kind vocabulary.** Skeptic: `armed-conflict-interstate`/`-intrastate`, `non-state-conflict`, `one-sided-violence`, `collective-action`, `protest`, `strike`, `civil-unrest`. Designer: `armed-interstate`/`armed-intrastate`, `unrest`. One table (`KINDS`) in the ingest and one in `validate_data` must agree with the UI.
5. **`kind_basis.method` for a new record** whose source was read in the round that created it: `source-reread` (two methods only) or a third value `source-read`? The clause above uses `source-reread` for both; a third value needs the validator and the checker to know it.
6. **`verification.level` for conflict records** is `republished-dataset`, a value `validate_data` does not know; it lives only in `validate_conflicts.py`. Confirm, or choose a different carrier for "not Protest Atlas research".
7. **Where the publish step lives** and what it does with gate-withheld records (drop, or keep with a `withheld` marker in a non-public file). The skeleton assumes drop.
8. **Non-state and one-sided scope.** Default off. If the panel wants them, the About copy and the kind filter need the two extra kinds, and the `KIND_BY_TYPE_OF_CONFLICT` table is untouched.
9. **Lazy load and budget.** `public/conflicts.json` should be a lazy file (`LAZY` in `js/data.js`), outside the critical-data guard; at about 60 state-based conflicts with four source entries each it is roughly 80–120 KB raw, 15–25 KB gzip. Confirm the bucket before the publish step exists.
10. **The conflict dataset stamp.** `window.last_provisional_month` and the newest `downloaded_at` are the two values the dates sheet row needs; confirm which `freshness.js` or `stamps.js` export carries them so the file shape is final.
