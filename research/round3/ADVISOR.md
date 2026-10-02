# Independent skeptical audit

Reviewed 2026-10-02 at 21:09:52 UTC. This is an AI source audit, not human sign-off. Scope is the three existing seeds plus the historical expansion contract. No public data or code was edited.

**All three October 2, 2026 dates survive the audit.** A hypothesis of bad dates was tested and not substantiated. Preserve the episodes with unknown status. The companion `seed-audit.json` records exact source URLs, access limits, publication/version details and corrections.

## Findings requiring action

1. **France's source access needs a precise audit trail.** Direct Reuters fetch failed with HTTP 401. The [updated Reuters wire on MarketScreener](https://www.marketscreener.com/news/about-400-french-schools-closed-as-some-student-protests-turn-violent-ce785ddadc8bf325) was read and supports the present claims, including tear gas. Its Oct 2 publication and afternoon update account for the discrepancy between the early shorter text/byline and the later Foroudi/Skvortsova version. Add this source URL and accurately label the wire origin. Multiple Reuters copies do not warrant `corroborated`.

2. **India's direct AP extraction is partial.** [AP's own captions/video](https://apnews.com/article/1d43de28dfd6fa920133d98e9d0e8e35) support dated New Delhi activity. The [complete AP text carried by Seattle Times](https://www.seattletimes.com/nation-world/indias-cockroach-youth-protesters-are-to-rally-again-and-demand-ouster-of-election-chief/) supports Mumbai and the separate police action. Add that accessed copy. The Seattle Oct 1 late-evening display and Oct 2 metadata are compatible with time zones. Do not recast the July education-minister resignation as the October electoral protest's outcome.

3. **Spain has an outcome, without an established end.** The [underlying article](https://www.aljazeera.com/news/2026/10/2/spains-parliament-rejects-govt-housing-decrees-amid-mass-protests) establishes an October 2 legislative rejection. That supports a limited policy setback for the government/supporters of those measures, not a causal claim that demonstrators caused the vote or a general verdict on renters' welfare. Any beneficiary coding should be labeled inference and tied to the specific policy preference. A preliminary agreement for one tenant is conditional relief, not a completed restoration or movement victory.

## Critical contract and implementation risks

| Risk | Concrete evidence | Required boundary |
| --- | --- | --- |
| End, concession and historical age become equivalent | Spain's defeat coexists with protest activity; India mentions an earlier campaign success | Dark shadow only for evidence-backed episode end/suspension. Unknown must remain visibly distinct even for 2024 records. A suspended strike is a pause, not necessarily termination of all action. |
| Episode outcome is borrowed from the movement's past | India AP text explicitly links July resignation to education protests while October action targets election administration | Episode scope and outcome date must align. A politician's resignation can benefit one demand while leaving other grievances unresolved. |
| Two source URLs imply independent corroboration | France wire versions and India syndications have common original authors/reporting | Keep single-source unless another independently reported source supports the relevant claim. Publisher brands and mirrors are not independent evidence. |
| Source-check date becomes event date | All seeds were checked Oct 2; France text also discusses prior days and India contains July background | Refresh `accessed_at`/review time only after actual access. Preserve `last_observed_at` as the last supported occurrence and never automatically assign publication date as an outcome date. |
| Outcome “favours” becomes total victory | Spain tenant relief is preliminary and limited; parliament rejected the broad package | Display concrete actor/effect/note together and expose inference. Keep `causality: not-established` when only temporal association is known. |
| 249 screens become an exhaustive census | Contract requires one initial query per directory entry and explicitly recognizes language/search limits | Display searched-directory breadth separately from countries with reviewed episodes and cities with sourced mentions. Zero candidate URLs, failed fetch and no published record are three different states. |
| JSON validity disguises unsupported claims | Existing validator enforces shape/date/reference membership, but cannot prove an outcome or source independence | One bounded semantic review of final ended records, outcome claims and source chains remains necessary. New context data must have referential validation and exactly one context row per public event. |

The contract's strongest safeguards are event-local sources, explicit outcome inference, an honest search ledger, and unknown status by default. Preserve them in UI wording. Add a visible “reported as of” date to every status, avoid calling the episode totals a count of demonstrations, and ensure hidden/no-result countries are described as unreviewed or without a published record rather than peaceful.

Final merged-file review is pending. This memo is not a blanket approval of future data.
