# Protest Atlas editorial policy

Version 1.1 · AI-assisted policy review 2 October 2026 · policy for a public, static reporting atlas

## Purpose and scope

Help readers understand reported demonstrations, their demands, opposing positions, timeframes, and documented state responses. Global coverage is an aspiration, not a claim of completeness. Every release must disclose the countries, languages, sources, and period actually reviewed. An empty country means **coverage unknown** or **no verified records in this dataset**, never “no protests.” The atlas is not a live coordination service, a census, an opinion poll, or a determination of criminal responsibility.

The publishable unit is a sourced demonstration episode with a bounded place and timeframe. Link related episodes to a movement when the relationship is evidenced; do not turn a months-long movement into months of assumed daily activity. Clearly label demonstrations, counter-demonstrations, planned events, and historical records. A news article, query hit, country source directory, or provider record is a discovery candidate until its underlying report is checked. The pilot distinction below must remain visible until human editorial review is actually available.

## Initial AI-assisted pilot

The initial public pilot may contain a small number of manually initiated, AI-assisted source checks of established newsroom reports. No human editor is enrolled and no human editorial sign-off is claimed. Publish these only as **source-checked reports**, not independently verified events or facts. This is a separate, explicitly disclosed launch mode, not completion of the human review workflow below.

The page must prominently say: **“AI-assisted reporting pilot. Source-checked news reports; no human editorial review. Sparse coverage, not a comprehensive live feed.”** Each card must show its publisher, event date, source publication date, link, source count/independence limitation, and that the check was AI-assisted. A single newsroom report remains `single-source`, however reliable its publisher. Describe serious allegations as that source's reporting and keep disagreement or unknown attribution visible. No current record may be based only on a search snippet or article title.

Pilot eligibility requires checking the article text for occurrence, date, place, demands, and any published state-response claim, and applying the same freshness, privacy, source-rights, and missing-data rules as the full workflow. The label “source-checked” means these checks were performed; it does not mean the underlying events were independently witnessed or all reported claims are established. Record evidence limitations rather than pretending that AI review equals a human editor. Do not automatically add future discoveries to the public feed.

## Evidence standard and workflow

1. **Discover:** collect a link and minimal metadata in a review queue, separate from public event data. Never promote an article merely because it contains “protest.”
2. **Read and resolve:** inspect the underlying source, distinguish event date from publication date, establish location and what actually happened, check whether the report repeats another outlet, and compare with existing IDs.
3. **Extract claims:** record demands, stance target, reported crowd scale, state actions, harms, and each claim's source. Preserve disagreements. Translate with the original language retained in the source record; human-review sensitive translated claims.
4. **Corroborate:** ordinarily require two independent sources, including credible local reporting when accessible. Two copies of the same wire report count as one. An editor may approve a single well-supported firsthand or established newsroom report with an explicit `single-source` limitation; a social post alone remains a candidate. Source count is not a confidence score.
5. **Review:** for the human-reviewed track, a second human reviewer checks the evidence, dates, claims, duplicate risk, publication rights, and exposure of participants. Record the reviewer and a decision internally. Automated extraction can propose fields; it cannot certify a record. Until that track exists, the pilot must retain its AI-assisted, non-human-reviewed disclosure.
6. **Publish:** release only minimal public fields admitted under the disclosed pilot or human-reviewed track, with citations, evidence limitations, and visible freshness. Keep the private review queue and sensitive evidence out of the public repository and its history.
7. **Revisit:** review ongoing records before their 72-hour freshness deadline; log substantive corrections and preserve stable IDs. If resources are insufficient, show stale status honestly.

Claims about deaths, injuries, detention, responsibility, or unlawful force require attributable evidence and explicit uncertainty. A police statement establishes what police said; it does not independently establish the disputed incident. An organizer's assertion receives the same treatment. Lack of corroboration is a limitation, not proof of falsity.

## Minimum record contract

These are semantic requirements; implementation field names may differ. Unknown values must be explicit, not converted to zero or “none.”

| Field or group | Required content and publication rule |
| --- | --- |
| Identity | Stable ID; short factual title; event type; related episode IDs where justified |
| Geography | Country/territory; city or broader region; declared granularity; public marker at a city centroid or coarser, labeled approximate |
| Time | Start date; end date or unknown; date precision; last evidenced activity; source publication dates; last editorial verification timestamp; timezone where relevant |
| Status | Planned, ongoing/recently observed, ended, historical, or needs review; evidence supporting the status |
| Issues and demands | Specific attributed demands and a small set of issue tags; allow multiple demands |
| Stance | Support, oppose, mixed, or unclear **toward an explicit policy, institution, action, or other target**; source for that interpretation |
| Perspectives | What demonstrators seek; what named institutions or organizations say in response; known counter-demonstration link or explicit unknown |
| Scale | Attributed reported crowd size or range, estimation method when available, and uncertainty; never infer from article count |
| Conduct and disruption | Separate observed participant conduct, disruption, and state/non-state responses; each attributable |
| Harm | Separate reported deaths, injuries, and detention counts/ranges with source, reporting time, and whether event-specific or cumulative |
| Evidence | Source URL, publisher, title, language, publication date, retrieval date, and the claims supported; independence notes internally |
| Verification | Review state, substantive limitations, last verified time, and revision identifier |

Do not publish private participant names, handles, faces, contact information, affiliation lists, individual movements, precise routes, meeting points, shelter locations, or live police positions. Do not infer a person's politics from attendance. Public institutions and organizations can be named when relevant and sourced; no participant identification feature belongs in this product.

## Support, opposition, and counter-demonstrations

“For” and “against” are meaningless without a target. A rally supporting a ceasefire must not be coded as supporting a government, armed group, or every position associated with a movement. A demonstration may support one demand while opposing another. Use separate issue/target entries or `mixed`; never force a binary.

A government statement opposing a demand is a **response**, not evidence that an opposing protest occurred. An actual counter-demonstration gets its own sourced episode, connected only when the relationship is documented. Do not manufacture a matching “other side” for visual symmetry. Unsupported claims do not earn equal evidentiary status because they oppose a supported claim. Describe the evidence and attribute disagreements without suppressing well-supported findings.

Event totals, participant estimates, geographic spread, social engagement, and source volume cannot establish which view is more popular. Public opinion requires a separately sourced, appropriately described survey and is outside the initial event tracker.

## Intensity and state response

There is no combined “severity,” “danger,” or “intensity” score. Show distinct dimensions: reported scale, geographic spread, duration/frequency, disruption, participant violence, intervention, and reported harms. Their uncertainty and denominators differ. Do not rank countries by these observations without comparable coverage.

Report state actions in descriptive, sourced terms: police presence, dispersal orders, arrests, tear gas, water cannon, kinetic impact projectiles, live ammunition, curfews, communications restrictions, or military deployment, only when documented. Distinguish announced deployment from observed deployment. Distinguish military forces from police. Do not use arrests or police force as automatic proof of participant violence. Identify who allegedly did what instead of relying on ambiguous “clashes.”

These are retrospective city/region summaries, never tactical maps, force movement feeds, equipment-location tracking, or evasion guidance. Avoid “non-lethal” as a blanket description of weapons capable of causing death. Legal characterizations such as “unlawful” or “excessive” must be attributed to a competent finding or clearly labeled allegation; an imported provider category retains its provider-specific definition.

## Time, freshness, and conflicts

- Use UTC for system timestamps, retain local event dates and their precision. Date-only evidence is not an exact instant.
- A report published today about last month's rally does not make that rally current. A retrieval timestamp or successful pipeline run does not establish new activity.
- An ongoing claim expires after **72 hours from the latest evidenced activity**. Changing `lastVerified` without new activity must not extend it. The UI and build must downgrade stale ongoing claims to **needs review / current status unknown**, not “ended.”
- Planned activity remains planned until occurrence is evidenced. An end date requires evidence; silence does not establish an end.
- If source dates, article body, or metadata conflict, preserve the discrepancy and quarantine current-status claims pending review. Never silently rewrite an event year to fit the current year. An undated page or search snippet cannot establish current activity.
- Future publication/verification timestamps relative to the build clock fail validation. Future scheduled event dates are permitted only for planned records.
- Show last successful editorial data update separately from site deployment time. A frozen build must continue to display record age, and an aged release must visibly stop claiming current completeness.

## Coverage, corrections, and operational accountability

Maintain a public coverage ledger: reviewed country/region, language, source types, period searched, last checked, known restrictions, and unresolved gaps. Display a conspicuous gap notice when discovery feeds fail. A provider's worldwide footprint does not establish this project's worldwide coverage.

Provide a correction route that does not request private participant evidence in public issues. A correction entry includes record ID, date, changed claim, reason, and supporting source; redact sensitive material. Withdraw dangerous or unsupported claims promptly. Keep a public correction note, but do not preserve harmful personal information merely for auditability. Public Git history can retain deleted information: do not commit it in the first place.

Publish source links and original summaries, not copied articles. Check each data provider's current license and redistribution terms before ingestion or export. Open-source application code does not make third-party source data openly licensed. Never commit API credentials. A static site may read a reviewed public snapshot; ingestion and secrets belong in a controlled build process.

## Methodological references

The following primary sources informed this policy. The concrete schema, 72-hour rule, publication restrictions, and launch gates above are **Protest Atlas design decisions**, not claims of certification or affiliation.

- [ACLED Codebook](https://acleddata.com/methodology/acled-codebook), accessed 2 October 2026: separates event occurrence from broader movements, documents source/date precision, and distinguishes participant violence from force directed at peaceful protesters. Atlas uses these distinctions conceptually; it does not claim to reproduce ACLED coding, data, or its treatment of missing fatality counts.
- [Berkeley Human Rights Center: Developing the Berkeley Protocol](https://humanrights.berkeley.edu/projects/developing-the-berkeley-protocol-on-digital-open-source-investigations/), accessed 2 October 2026: describes the joint OHCHR/UC Berkeley standards for identifying, collecting, preserving, verifying, and analyzing digital open-source information. Atlas adopts a provenance-and-review workflow; it is not an evidentiary archive or legal investigation.
- [Reuters Standards and Values](https://reutersagency.com/about/standards-values/), accessed 2 October 2026: prioritizes accuracy, attributable reporting, independence, and transparent corrections. Atlas applies consistent evidence standards and a visible corrections process.
