# Protest Atlas: source research and coverage contract

Research date: **2 October 2026**. This is a source and implementation assessment, not an inventory of verified live protests. No feed was authenticated, no event dataset was downloaded, and no public records were created in this workstream.

## Decision

Build an independently curated, public-source event ledger. Use **GDELT for discovery**, permitted publisher RSS/Atom for supplementary discovery, and a review queue for event publication. Keep a separate, explicitly labeled automated news queue. Country coverage should mean *a source discovery channel exists*, not *every protest is known*. Use city or administrative-area geography and aggregate public facts; omit private participant identities and exact participant movements.

**ACLED is not an open redistributable event feed.** Exclude ACLED ingestion from the initial product. Any future ACLED integration needs a written license explicitly permitting the proposed public product, event-level publication, and any AI processing. Merely holding an API credential would not establish those permissions.

## Source comparison

| Source | Scope and unit | Timeliness documented or observed | Access and reuse | Role in this project |
|---|---|---|---|---|
| [GDELT](https://www.gdeltproject.org/) | Global news-derived machine-coded events and article metadata; its documentation describes monitoring over 100 languages, with DOC search across translations from 65 languages | GDELT 2.0 event/mention tables are documented as 15-minute updates; actual end-to-end lag must be measured | Official terms explicitly permit unrestricted use and rehosting of released datasets with GDELT citation/link. Publisher article text/images retain their own rights | Primary discovery input; not automatic verification |
| [ACLED](https://acleddata.com/) | Human-researched event data; country/territory coverage completed globally in 2022 | Weekly publication with review; tier-dependent availability. Research event data have a **12-month delay** | Open tier: aggregate data. Research: delayed events/API. Partner: weekly disaggregated events. Current EULA restricts rehosting and competing products | Excluded from default ingestion; link to independent analyses only |
| [Carnegie Global Protest Tracker](https://carnegieendowment.org/features/global-protest-tracker) | Significant **antigovernment** protest movements since 2017; triggers, drivers, duration, size, outcomes | Primary search result observed **9 September 2026** as last update; fixed monthly schedule not verified | Public web access. No event redistribution license or supported API confirmed in this review | Context and movement-level comparison; not a worldwide near-live feed |
| [Crowd Counting Consortium](https://ash.harvard.edu/programs/crowd-counting-consortium/) | United States political protest events, including marches/rallies/strikes and similar actions, since 2017 | Harvard says Dataverse published monthly. Project GitHub says weekly Wednesdays with reporting/processing delays | Official GitHub presents an MIT license and asks citation. Dataverse release-specific terms must be checked separately | Strong regional validation and historical source; not worldwide/live |
| [Mass Mobilization Project](https://massmobilization.github.io/about.html) | 162 countries, 1990–2018; antigovernment demonstrations of at least 50 people, demands and state responses | Site says data updated through **31 March 2018** | Public download links; precise dataset reuse license not confirmed | Historical schema/benchmark context only |
| [Mass Mobilization in Autocracies Database](https://mmadatabase.org/get/) | Selected countries/time periods in autocracies. Report-level and event-level releases are distinct | Historical/versioned; latest page names Version 5.0, without a near-live promise | Download page asks citation and observance of license; exact license not confirmed | Historical comparator; must not count reports as distinct events |
| [World Protests](https://www.worldprotests.org/about/) | Major protest episodes/issues; underlying study covers 2006–2020, 2,809 events across 101 countries | Historical research, not a near-live feed | Public website/book; downloadable dataset redistribution terms not confirmed | Issue taxonomy and historical context |
| [GLOCON](https://glocon.ku.edu.tr/about-glocon/) | Local-source contentious politics data for India, South Africa, Argentina, Brazil, Turkey | Site describes annual updates; some about-page statistics explicitly date to January 2023 | Raw-data access is application/research-study specific, with ethics assessment. No general open redistribution permission confirmed | Research methodology and multilingual extraction evaluation; no automatic ingestion |
| [GPR / Geopolitical Risk Index](https://www.policyuncertainty.com/gpr.html) | Newspaper attention to adverse geopolitical events; not protest-event records | Historical and updated macro series | Public downloads; precise reuse license not confirmed here | Do not use as protest intensity or protest count |

## ACLED: current access and contract constraints

The [myACLED FAQ](https://acleddata.com/myacled-faqs) defines Open/Research/Partner/Enterprise tiers; an institutional email determines affiliation benefits. Open users have aggregated data. Research adds lagged event data and API access. Partner adds weekly disaggregated data; Enterprise has weekly/expedited access. The [new-data FAQ](https://acleddata.com/faq-codebook-tools) explicitly defines the Research lag as twelve months and describes week-country-admin1-event-type aggregate files. A personal-email signup does not establish current event-level access.

The [EULA](https://acleddata.com/eula), marked **8 July 2025**, permits certain transformative noncommercial outputs but rejects a dashboard that merely supplements, excerpts, or reorganizes source data. It prohibits site scraping/crawling, exposing licensed content, and certain AI uses that substitute for ACLED or let third parties retrieve its data. Commercial entities require a corporate license. Section 10 additionally restricts development of competing datasets, APIs, and tools using licensed content or derived insights. These are material product constraints, not solved by citation alone.

The [codebook](https://acleddata.com/methodology/acled-codebook) is useful to understand the provider: a demonstration is an in-person gathering of three or more people, source collection spans over 75 languages, and publication follows multistage review. Its protest subtypes include peaceful protest, protest with intervention, and excessive force against protesters; violent demonstration belongs to Riots. Actors' field order does not establish aggressor/victim. Fatalities of zero can mean **no reported information**, not confirmed absence. Do not use this provider's event records, taxonomy, or structures to build a competing product without resolving its contract terms.

The [older access FAQ](https://acleddata.com/faq/how-can-i-access-and-use-acled-data), last updated 1 November 2023, says Monday/Tuesday updates and account-based export/API availability. The new myACLED documentation describes replacing access keys, with the old-key transition ending 15 September 2025. Prefer current tier documentation over old free-account tutorials or archived 2022/2023 access PDFs. A fixed weekday publication guarantee has not been established from current scheduling documentation.

## GDELT: practical ingestion contract

The [official terms](https://gdeltproject.org/about.html#termsofuse) permit academic, commercial, and governmental use without fee and rehosting of released GDELT datasets with attribution and link. This does not grant rights to republish source publishers' article bodies or photographs.

The [DOC 2.0 guide](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) describes JSON output, English keyword queries over 65 machine-translated languages, `sourcelang` filtering, `sourcecountry` filtering, exact UTC start/end windows, article-list modes, and a 250-record maximum. Its June 2017 guide states a rolling three-month search window; a December 2017 [update](https://blog.gdeltproject.org/updates-doc-2-0-api/) discusses extending search horizons and phasing out native-language query search. Verify the runtime window and response shape rather than assuming an old guide is the current service SLA. No current rate-limit contract or availability guarantee was confirmed.

Implementation implications (engineering recommendations, not provider guarantees):

- Query hourly with overlapping windows and `sort=datedesc`; start with a one-hour window and recursively split saturated windows. Partition by source language/region where helpful. If the smallest permitted time slice still hits the cap, expose a truncation/coverage warning and consider event/mention bulk files or BigQuery. Never label the first 250 stories as complete worldwide coverage.
- `sourcecountry` refers to publisher origin; it is not a reliable event-country filter. Match event location from the reporting and preserve uncertainty. A story can discuss several countries or historic events.
- Store canonical article URL, source domain, source language, publication/seen timestamp, query window, retrieved timestamp, and extraction version. Deduplicate syndication and AMP/mobile variants before counting independent sources.
- Keep article publication time, ingestion time, event occurrence date/time, and human review time separate. None implies the others.
- Retry timeout/429/5xx with backoff, keep the last successful snapshot, and record failed windows. Publish a health manifest with last successful fetch and latest human review.
- Treat article tone, mention counts, and Goldstein/CAMEO scores as properties of machine-coded news coverage. Do not convert them into approval percentages, crowd sizes, public opinion, or a validated protest-intensity score.

The [GDELT Event 2.0 codebook](https://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf), dated 19 February 2015, defines event and mention tables at 15-minute intervals, event dates at daily resolution, and `DATEADDED` in UTC. Mentions may refer to events from a year earlier. GDELT's own [global dashboard](https://www.gdeltproject.org/globaldashboard/) calls its display experimental and warns of many errors. Its dot sizes reflect **news coverage**, not attendance or physical severity.

## Honest worldwide and multilingual coverage

A country registry should have `monitoring_status = unconfigured | discovery_active | source_gap | review_backlog`, plus languages queried, local outlets configured, last successful discovery, last human review, known limitations, and recent candidate/reviewed counts. A blank country means “no reviewed records in this snapshot” or “coverage gap,” never “no protests.”

Start with GDELT's English queries over translated reporting and publisher-language filters. Add local-language RSS searches and issue terms reviewed by fluent speakers for priority countries. Preserve original-language headlines/links; show translations as translations. Register language coverage separately from geographical coverage. Missing local-language reporting, censorship, network shutdowns, rural underreporting, and source concentration all prevent exhaustive claims.

Two outlets repeating the same wire story or government statement are one evidence chain. Separate organizer estimates, police estimates, journalist estimates, and independent observations; retain each with attribution and date. Police statements can support “police report X”; they do not automatically verify organizer intent, crowd size, or the proportionality of police conduct.

For `support/against`, encode **positions toward a named issue/target**, attributed to each participating side. Do not infer whole-country support, or mark every event pro/antigovernment by default. Counterdemonstrations should be related events or separately attributed sides. Mixed/unclear is valid.

For intensity, initially show an evidence profile: reported crowd estimate/range and estimator, duration, number of reviewed locations, reported disruption, confrontation, state measures, and verified harm. Use separate fields for state action and protester behavior. Unknown and disputed values remain unknown/disputed; the count of articles is “media attention.” A composite score should wait for a published validation method and sensitivity analysis.

## Update and publication gates

| Stage | Proposed cadence | Publication behavior |
|---|---|---|
| Discovery | Hourly best-effort scheduled run | Automated links/candidates labeled unreviewed; fetch health visible |
| Event verification | Daily initial target; faster for priority incidents when reviewer available | A human checks that an event occurred, date/place, side/issue claims, and sources |
| Serious police/state-action claims | Priority review; do not promise latency | Claim-specific attribution and independent corroboration where possible; unresolved claims labeled reported/disputed |
| Corrections/backfills | Daily reconciliation | Append correction history, preserve stable ID, show changed claims and sources |
| Source terms/access audit | Monthly and before integrating a new provider | Pause imports when rights/access become uncertain; independent public-source pipeline continues |

Initial review policy: one credible report may produce a “reported, single-source” event; “corroborated” requires independent evidence, not two URLs. Do not silently promote discovery links into verified events. Treat “ongoing” as a dated claim with an expiry/review requirement rather than a permanent badge. A stale source cannot establish that a protest remains active now.

## Date drift, rejected shortcuts, and unresolved items

- Carnegie's current primary search result says **9 September 2026**. Exa surfaced related-page snippets saying **20 July 2026**, and an India mirror saying **2 June 2026**. Direct extraction of the interactive tracker returned only its title. Do not infer a complete current event feed from those pages. Methodology refresh schedule/API/redistribution license remain unconfirmed.
- GDELT documentation includes old 2015/2017 product descriptions. Search surfaced a daily-file listing ending 19 August 2026. That is a cached/listing observation, not evidence of a platform outage or latest feed timestamp. A production probe is required to measure October 2026 freshness.
- `docs.gdeltcloud.com` appeared prominently in searches, but affiliation with the official GDELT Project and its reuse terms were not established. Do not conflate that separate service with the unrestricted official dataset.
- A specific “Global Protest Report (GPR)” provider could not be resolved from targeted searches. GPR commonly resolved to the **Geopolitical Risk** index. Do not create an invented source connector or conflate macro attention with protest events.
- The MIT marker was observed on the official [CCC repository](https://github.com/nonviolent-action-lab/crowd-counting-consortium), but fetching its LICENSE file failed. Confirm exact file/license scope and the chosen Dataverse release before ingestion. An old fork says Friday updates; the maintained repository says Wednesday. Do not use forks as authority for cadence.
- Public Kaggle copies of Carnegie/MM data do not override original provider rights or establish fresh data. The MM project site ends March 2018; a third-party Kaggle result claims March 2020. Prefer the primary release and verify provenance before importing a newer copy.
- GLOCON's site currently lists five countries, despite an initial project description naming China too. Its figures/date ranges are mixed; record release metadata rather than assuming current global coverage.

## Research audit

Used Exa's Search skill and plugin for **12 search calls × 5 requested results = 60 requested result slots**, across provider/access, near-live discovery, historical datasets, and multilingual/US validation workstreams. This is the skill's accounting metric, **not 60 unique fully reviewed primary sources**. Exa fetch was called three times for **16 URLs**, with one explicit crawl failure for the CCC LICENSE; Carnegie returned title-only content. Targeted independent web search/open/find calls verified official access/terms and surfaced the Carnegie date discrepancy. No claim of exhaustive dataset discovery or current-event verification is made.

Primary URLs cited above form the reusable source registry. Search snippets, cached copies, third-party reposts, and unresolved sources are identified as such rather than silently promoted to authority.
