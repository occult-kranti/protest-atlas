# Protest Atlas advisory and skeptic review

Review date: 2 October 2026. This is a project design review by an AI advisor/skeptic, not an endorsement by named experts, journalists, ACLED, Reuters, or the UN. Sources and binding editorial choices are in [EDITORIAL_POLICY.md](EDITORIAL_POLICY.md).

## Recommendation

Launch a small, clearly bounded **source-checked reporting pilot** before promising a current worldwide tracker. If checks are AI-assisted and no human editor is enrolled, disclose that prominently; do not call this human editorial review or independently verified event data. A polished globe plus a source catalogue is useful discovery infrastructure, but it does not establish that any protest is happening now. The launch claim must match the published evidence. If article-level checks cannot be completed, ship the working interface with an honest empty state or unmistakably separate demonstration mode and show source discovery separately.

## Advisor positions and skeptical challenges

| Perspective | Recommendation | Skeptical challenge / acceptance evidence |
| --- | --- | --- |
| Reader usefulness | Make place, demands, dates, stance target, sources, and update age visible without interpreting a color legend | Can a reader tell what “against” is against, and whether the protest actually occurred? |
| Evidence and journalism | Treat sources as claim evidence; retain conflicting attributable reports | Are two independent sources actually two copies of one wire? Does the citation support this date and claim? |
| Human rights and safety | Show city-level retrospective summaries and actor-specific descriptions | Could a record, export, source link, or Git history identify participants or expose a meeting place? |
| Statistics | Present intensity as separate observations with uncertainty | Does a high-coverage country look “more unstable” merely because it has more reports? Are missing harms shown as zero? |
| Global coverage | Maintain a language/region coverage ledger and explicit gaps | Is English-language discovery being presented as a worldwide census? |
| Engineering | Keep static delivery simple; enforce freshness and provenance in both build and UI | Does an old deployment still say “ongoing” after 72 hours? Does refreshing verification falsely reset activity age? |
| Operations | Start with the volume that reviewers can revisit reliably | Who reviews records when they expire, resolves corrections, and handles feed failure? |

## Release gates

The following are acceptance criteria, not assertions that the repository currently passes them. A release checklist must record pass/fail and evidence for each applicable gate.

| Priority | Gate | Evidence required |
| --- | --- | --- |
| P0 | Truthful currentness | No discovery candidate, historical demonstration, fixture, or planned action counted as a verified current event; dataset and editorial update dates visible |
| P0 | Source-backed records | Every public report has checked underlying article text, resolved occurrence dates, explicit location granularity, and claim attribution; single-source limitations labeled; AI-assisted checks and lack of human review disclosed |
| P0 | Stance integrity | Support/oppose always includes a target; responses and counter-demonstrations are distinct; no popularity inference |
| P0 | Expiration | Boundary checks for 71h59m, 72h, and 72h01m since activity; stale ongoing becomes needs review; future and invalid timestamps rejected |
| P0 | Date conflicts | A newly published historical article remains historical; an undated or conflicting article cannot establish currentness |
| P0 | Missing data | Unknown country coverage, crowd size, harm totals, and state action stay unknown; zero and absent are distinguishable |
| P0 | Publication safety | Public snapshot, HTML, exports, issues, and repository history contain no private participant identifiers, precise routes, or tactical positions |
| P0 | Dimensions | No aggregate severity metric; force against demonstrators is not relabeled participant violence; deployment announcements not treated as observations |
| P0 | Functionality | Keyboard-accessible filtering, clear empty/error states, mobile layout, readable source links, and usable list view without relying on a map |
| P0 | Deployment | GitHub Pages path-safe assets; no secrets; build/validation succeeds; actual deployment state distinguished from local readiness |
| P0 | Rights and corrections | Provider terms checked before reuse; attribution included; a working corrections route with privacy guidance |
| P1 | Review capacity | Named editorial owner or role, a refresh schedule, review queue, and a record limit that can be maintained within that schedule |
| P1 | Coverage accountability | Public coverage ledger with languages, review windows, outages, and gaps; country totals labeled as observed records |
| P1 | Reproducibility | Stable event IDs, deduplication decisions, revision history, and a reproducible reviewed-data build |

## Prioritized launch roadmap

**Phase 0 — a usable and honest site.** Deliver responsive list/map views, country and issue filters, source cards, clear data status, and static GitHub Pages deployment instructions. Use an empty verified feed when evidence is not ready. Keep fixtures in tests or an explicitly separate demo view. Publish methodology and the source catalogue. Exit: P0 gates relevant to the interface pass and no fabricated event content is presented as factual.

**Phase 1 — human-reviewed pilot.** Choose a manageable set of countries and languages based on reviewer availability, publish that scope, and verify a small set of current or clearly historical episodes. Add source-level claim attribution, independent human review, freshness downgrade, correction log, and coverage ledger. Test the full publication workflow with a real correction. Exit: every published record has a defensible evidence trail and an owner can keep current records within the 72-hour window. Initial AI-assisted source-checked reports can be published before this phase only under the explicit pilot disclosure in the editorial policy; they must not be presented as having passed human review.

**Phase 2 — assisted intake.** Add scheduled discovery into an unpublished candidate queue (workflow artifacts are not confidential storage), deduplication proposals, original-language extraction, source-dependency detection, link checks, and failure monitoring. Automation may suggest updates but cannot promote a candidate or refresh activity evidence by itself. Exit: measured review throughput, low duplicate rate, visible outages, and bounded reviewer load.

**Phase 3 — broader coverage and research exports.** Expand region by region with language expertise and partners. Add versioned snapshots and documented exports after checking provider redistribution rights. Evaluate completeness through documented sampling and missed-event audits; never infer it from sheer record volume. Add comparative charts only when coverage and denominators make the comparison defensible.

**Defer:** sentiment scores, “most supported” rankings, automated credibility numbers, predictive unrest heat maps, minute-by-minute movement tracking, participant identification, and unsupervised AI publication. These would add misleading precision or operational risk before the evidence workflow is mature.

## Adversarial editorial checks

1. A wire story is syndicated by five outlets: the UI must not imply five independent confirmations.
2. Today's article revisits a rally from 2024: it must not enter the current feed.
3. Police report 100 arrests and organizers report 300: retain attributed counts and scopes; do not average them.
4. A rally supports ending a war: do not infer support for any belligerent.
5. Officials condemn a march: that alone does not create a counter-protest record.
6. A peaceful crowd is dispersed with tear gas: describe the response without inferring crowd violence.
7. A feed stops returning results: show a coverage gap, not a country becoming protest-free.
8. A reviewer opens an old source today: `lastVerified` may change, but last observed activity cannot.
9. A large country has many reports and another has few: record counts are not a comparative instability or popularity metric.
10. A participant asks for removal of identifying information: a normal content edit may leave public Git history; handle the exposure and record a non-identifying correction.

## Implementation review status

This review began before application files were available. The gates above are proposed acceptance checks, not a completed code audit. Unresolved P0 findings block a claim that the site is a verified current global tracker.

Initial read-only inspection of `scripts/validate_data.py` identified two publication blockers for nonempty verified data, reported to the implementation owner:

- **Activity freshness:** the initial closed event schema had `last_verified` but no independent latest-activity timestamp or date precision. Currentness cannot safely be renewed merely by reviewing an old article. Resolution requires independent activity evidence and expiry based on that field.
- **Intensity provenance:** the initial turnout/disruption/violence fields had no claim-level source references, while positions/state responses/timeline items did. Resolution requires attributable evidence for these intensity observations too.

These findings describe an in-progress snapshot and require rechecking after implementation changes. They do not prevent an explicitly empty verified feed from being presented truthfully. Automated schema checks also cannot substitute for reading sources or detecting sensitive identifiers inside free text.

### Second panel round: source-checked pilot

Inspected the initial three-record France/India/Spain snapshot and evolving schema/UI on 2 October 2026. The country-level/city-level locations and aggregate descriptions contained no participant identifiers, routes, or tactical force locations. The data's AI-assisted/single-source/no-human-review note is appropriate. `last_observed_at` and `start_date_precision` now exist, resolving the original missing-field concern; `intensity.source_ids` now provides a shared citation contract for a minimal pilot. More granular citations by dimension remain a roadmap item.

Publication is acceptable **as a sparse AI-assisted reporting pilot** after the following content/UI checks, not as a verified worldwide live tracker:

- Show the AI-assisted/no-human-editor disclosure before readers interpret the records, and retain it on individual records. Replace blanket “Verified” and “Editorial verification” labels with “Source checked (AI-assisted)” and “Source-check date.”
- Do not set `ongoing` when the record's own note says present activity is unknown. Use unknown/recently reported status unless the underlying article supports an explicit continuing-activity claim. Publication today cannot establish observation today.
- Display the shared intensity citation in the modal; storing it in JSON alone does not make attribution visible.
- Keep restrictions imposed by authorities under state response; a reported march alone does not establish disruption.
- Ensure the 72-hour boundary and UI explanations use latest observed activity, independently of source-check time.

The initial Reuters/AP/Al Jazeera URLs were not accessible through this reviewer's direct retrieval tool. Independent search found Reuters syndications and an AP canonical URL. This does not invalidate the implementer's separate extraction, but this reviewer cannot certify all three original article bodies from those failed opens. The initial Reuters syndicated version available to this reviewer did not establish tear-gas use. The implementation owner subsequently supplied the original Reuters extraction's explicit reporting of police tear-gas use, including a Strasbourg passage, with the authors identified as Layli Foroudi and Katya Skvortsova. The tear-gas concern is therefore **resolved on the supplied supporting extraction**; differing source versions/retrieval access should remain documented. A placard alone would not have been adequate evidence.

These are actionable findings on an evolving snapshot, not a claim that every release gate has passed. The implementation owner must record the final resolutions and actual deployment verification.

### Resolution check

The final data inspection confirmed all three pilot records now use `status: unknown`, avoiding an unsupported claim of present activity. India and Spain disruption text now preserves uncertainty. The UI now renders the shared intensity citations and labels card timestamps “Source checked”; individual notes disclose AI assistance and the absence of independent human editorial review. The France tear-gas claim is supported by the implementation owner's separately retrieved Reuters passage, as described above. These specific content/citation findings are resolved.

Conditional acceptance is limited to the disclosed, sparse source-checked pilot. The remaining UI terminology cleanup and exact 72-hour boundary adjustment were assigned to the interface owner and should be confirmed in normal release checks. This review does not claim deployment completion, exhaustive coverage, human review, or independent observation of the events.
