# Bounded semantic publication review

Review completed 2026-10-02 at 21:28:24 UTC. Final merged snapshot rechecked: 84 episodes in 81 countries, 128 sources, 18 ended/suspended, 66 unknown; 249 successful initial country/territory screens. AI-assisted independent check; no human sign-off. No public data or code edited.

**Decision: correct 13 reversed stance fields before publication.** The precise changes are in `final-review-corrections.json`. This is a factual presentation blocker: several records say demonstrators support the exact policy, officeholder or detention their accompanying claim says they oppose. This affects Iran, Timor-Leste, Nepal, Indonesia, Malaysia, Mongolia, South Korea, Türkiye, Pakistan, Bangladesh, Armenia, Georgia and Jordan. For example, Nepal currently renders support for corruption/social-media restrictions while its claim explicitly says opposition; Korea similarly says anti-Yoon demonstrators support Yoon's presidency. Correct `positions[0].stance` from `support` to `oppose` relative to the existing target. Leave each attributed claim and event-local source intact.

A small provenance correction is also required: Tanzania's status basis says both reports confirm suspension/resumption, but cites only the first. Add the already-published second source ID as specified in the correction file.

## All ended/suspended records reviewed

I fetched the principal status source for each of the 18 records, using direct web text where Exa's Reuters/AP extraction was partial. Four additional pages checked source dependence, employer follow-up or the exact acceptance date. These 22 distinct pages read are a bounded check, not a re-review of every source for all 84 records.

| Episode | End/suspension date | Evidence and judgment |
| --- | --- | --- |
| Tanzania drivers | 2026-09-30 | Daily News explicitly dates the talks and suspension. Keep bounded end; add second citation for the extra resumption assertion. |
| Fiji Yaqara | 2026-02-19 | Fiji Times explicitly gives strike dates February 16–19 and return after agreement. Union characterizes benefit; no universal victory inferred. |
| Egypt Jade Textile | 2026-02-10 | Al Manassa reports Tuesday return after bargaining, while workers reserve renewed action. Mixed outcome correctly preserves uncertainty. |
| Vanuatu teachers | 2025-12-22 | Daily Post body dated Dec 23 says action was called off the previous day after the agreement. Payment implementation remains unverified. |
| Ecuador diesel | 2025-10-22 | AP body says alliance announced end of highway blockades while resistance continued. Direct English extraction has no visible publication date; the AP Spanish version and matching AP video search metadata independently date the announcement Oct 22. Retain the narrow blockades scope. |
| Nigeria PENGASSAN | 2025-10-01 | PUNCH reports provisional suspension and expressly distinguishes it from permanently calling off the dispute. Display must retain “ended / suspended,” never imply final resolution. |
| Ghana TEWU | 2025-10-01 | 3News gives immediate provisional suspension with return instructions for October 2. Current onset is correctly null. |
| New Zealand hīkoi final day | 2024-11-19 | RNZ describes proceedings wrapping up and attendees moving to the post-hīkoi concert. Local Nov 20 publication versus UTC Nov 19 extraction does not change the event date. Narrow final-day scope is essential. |
| Canada postal strike | 2024-12-17 | December 16 employer notice sets the return date; December 18 follow-up confirms workers back and network operating. Employer incentives remain identified. |
| US ports | 2024-10-03 | Reuters says wage deal announced Thursday, ports reopened Friday. Tentative agreement and unresolved automation issue remain distinguishable from permanent resolution. |
| England resident doctors | 2024-09-16 | BMA says acceptance ended this pay dispute; government dates acceptance September 16. Later pursuit of full pay restoration does not invalidate this bounded settlement. |
| Israel Histadrut | 2024-09-02 | Reuters body explicitly says union accepted court ruling and called off strike. Wider rallies continued; record scope is correctly narrow. |
| Guyana teachers | 2024-06-21 | News Room reports agreement to end strike and return within two working days. Date is agreement, not claimed universal reopening. |
| Faroe Islands workers | 2024-06-09 | Local.fo says Sunday agreement immediately ended strike; photo and June 10 article body identify June 9. |
| Poland border blockades | 2024-04-29 | Reuters says final crossing reopened Monday; renewed action remained possible. Subsidy amount is sourced and not equivalent to paid compensation. |
| Guinea general strike | 2024-02-28 | Reuters body datelines Feb 28 and explicitly links Wednesday suspension to release. Feb 29 updated-publication label is not the event date. |
| France farmers | 2024-02-01 | RFI identifies suspension by two major unions and other-union continuation. Context properly excludes the entire farmers' movement. |
| Estonia teachers | 2024-01-30 | ERR explicitly says strike over that day and schooling resumes the following day. Mixed benefit reflects compromise below initial demand. |

Source URLs for these findings are the event-local references in the public records. Date checks for Ecuador additionally used https://apnews.com/article/noboa-paro-indigena-ecuador-combustible-vias-90ce5727cbe311c6cf15612ab490cc6d and https://apnews.com/video/ecuadors-indigenous-alliance-ends-highway-blocking-protests-after-military-threat-a40e848af26d448182c3af25d21b9ff8 (search metadata, not counted as full-page reads).

## Outcomes, source chains and geography

All outcome summaries and beneficiary/effect labels were screened. No additional total-victory or exclusive-causation claim requiring removal was found. Important limits are retained: proposed or promised benefits are not delivered benefits; the New Zealand bill rejection is not asserted to be caused solely by the march; Spain's parliamentary defeat does not imply protest cessation; Madagascar's takeover is not characterized as an unqualified protester victory. Conditional commitments coded benefit must keep their adjacent explanatory note visible.

I screened the corroborated labels and checked the concrete overlap risks in Nepal and New Caledonia. ABC's Nepal explainer includes its South Asia correspondent as well as wire material, and its dependency note correctly limits independence. RNZ's New Caledonia report has original regional reporting/analysis with an identified author. Neither record should imply every detail is independently verified. France and India seed syndications remain single-source chains, as required. Court/union/employer records are evidence from interested institutions, not neutral proof of every surrounding claim.

No city/country mismatch was identified in the final 101 mapped reference points and 17 explicitly unmapped city references. Portsmouth remains unmapped, avoiding a same-name geocoder guess; its Reuters caption specifies Virginia. Cities are associated reporting places, not exact crowd locations. Coarse coordinates and their reference-point label remain necessary.

Coverage v2 preserves language provenance and null spans where no source publication date exists. The screening ledger explicitly discloses limited initial searches. Its 249 successful rows are not 249 complete country histories. The merged reviewed-URL union should remain described as accumulated inspected URLs rather than all resulting from the one displayed first-success query.

Once the specified stance/provenance corrections are applied and ordinary validators pass, this bounded semantic review has no additional factual publication blocker. This statement does not certify exhaustiveness, present activity, unreviewed source claims or independent human verification.

## Integration resolution

All 13 stance corrections and the Tanzania citation correction were applied to their owning regional inputs before publication. The public snapshot was then regenerated and validated. Original findings above are retained as the review audit.
