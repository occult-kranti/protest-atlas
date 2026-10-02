# Historical research audit — release 3

Window: **1 January 2024–2 October 2026**. Research performed on 2 October 2026. All work is AI-assisted; no independent human editorial approval is claimed.

## What was actually covered

| Measure | Snapshot | Meaning |
| --- | ---: | --- |
| Directory entries searched | 249 / 249 | Each country/territory has at least one successful initial query logged |
| Countries with published episodes | 81 | Article-level source checks produced selected records |
| Countries without a published episode | 168 | Unresolved coverage gaps, not absence of protest |
| Published episodes | 84 | Bounded reports, not complete movements |
| Distinct city references | 118 | Source-named cities; 101 mapped, 17 remain in text/filter |
| Ended/suspended episodes | 18 | Explicit bounded end/suspension evidence |
| Episodes with documented results | 57 | A change is sourced; effects and causal limitations are separate |
| Source records | 128 | URLs/copies are not necessarily independent reporting |

By latest recorded observation year: 32 episodes in 2024, 37 in 2025 and 15 in 2026. The UI reported-year filter also matches recorded start/end/timeline dates, so its totals can differ. By region: Africa 18, Americas 18, Asia 19, Europe 20, Oceania 9. No Antarctic episode was published. Counts are dataset scope, not a global recall estimate.

## Research and skeptical review

Five regional agents used the Exa search/extraction plugin and source-page checks; the coordinator integrated data and a separate skeptical advisor checked evidence semantics, endings, outcomes and geography. Regional research used GPT-6.1-Sol; the skeptical advisor used GPT-6-Astra. These are model roles, not consultation with human regional experts. Exa search guidance, data-quality analysis and Design Partner guidance informed the work.

Every assigned country received an explicit 2024/2025/2026 query. Queries, actual timestamps, provider, result counts, candidate links and inspected-source URLs are retained in `research/round3/*-screening.json`. There are 315 attempt rows, including 39 failed attempts, principally provider rate limits; every country ultimately has a successful screen. The public ledger presents one initial success per country and discloses retained attempts and limitations. Inspected URLs may include partial extracts; a count of inspected pages is not a count of fully read independent sources.

Only source-supported episodes entered the public ledger. Initial query results remain unverified leads, including in empty-country panels. Regional drafts keep event-local source references for positions, intensity, state actions, cities, endings and outcomes. Syndicated Reuters/AP/AFP copies are treated as reporting chains, not automatically as independent corroboration. The France and India seed articles were rechecked using accessible wire syndications; their October 2026 observed dates were supported.

The skeptical review detected stance labels that contradicted their named targets and required corrections before publication. Mexico’s judicial strike has conflicting end accounts, so it remains unknown/contested. A later report of Timor-Leste demonstrations prevents treating an earlier withdrawal as the movement’s final end. A concession alone does not earn a black shadow. The separate advisor findings and exact field corrections are retained beside the regional inputs.

## Language and search limitations

The 128 source records comprise 123 English texts, three Spanish, one Portuguese and one Estonian. This is a strong language bias. English translations of local events do not establish original-language review. Many countries have only one episode and one reporting chain. Initial screens can miss local terminology, small cities, inaccessible archives, rural action, censorship, unindexed sources and events outside dominant news coverage. The window is shared by the queries, not an exhaustive review of each year in every country.

A defensible next pass starts with the 168 countries without published records, then underrepresented country-year combinations and secondary cities. Use local-language searches and regional sources; read the articles; resolve duplicate episodes and contradictory dates; then add sources. Keep a country open even after one episode is published. Never infer no protests from zero hits or declare a country done because its search ran.

## Map and results interpretation

Black shadow identifies a displayed ended/suspended episode. A shadowed country may also contain unknown episodes. It does not mean all protests ended, all demands succeeded or country research is complete. Event cards and details provide the bounded scope and source-backed status basis.

City dots use Natural Earth public city reference points, rounded to one decimal; they are not protest sites, routes or participant locations. Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson . SHA-256: `fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f`. Reference dataset: 7,342 populated-place features. Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/ . Missing city matches stay unmapped rather than receiving guessed coordinates.

Results explain what changed and name actors with benefit, setback, mixed or unclear effects. Every assessment identifies whether it is explicit in the source or an inference. A source-reported link to a protest is distinguished from temporal sequence without established causation. There is no national popularity estimate, universal winner or combined intensity score. Turnout, disruption, violence and state responses remain separately attributed.

## Reproduce and extend

1. Inspect the regional source and context files and the advisor correction log.
2. Edit the owning regional inputs, not only their generated public copies.
3. Run `python3 scripts/merge_history.py`. This updates integration time while preserving actual observation/source access dates.
4. Run the Python and JavaScript tests, then `python3 scripts/build.py`.
5. Review changed source claims and inspect the map/list/filter interactions before publishing through the Pages workflow.

The roadmap keeps editorial staffing, independent review, local-language expansion, source-dependency assessment and comparable historical analysis open. This release expands a research index; it does not complete worldwide protest history.
