# Protest Atlas 4.1 design record — colour, pattern and kind

Panel outputs (AI agents in defined roles, 4 Oct 2026) for: an opt-in map shading by date of newest evidence (the owner's "hot/cold" request, built as a one-hue lightness ramp), an event-kind axis (collective action → protest, strike, civil unrest; armed conflict intrastate/interstate as a separate UCDP context layer), colour-blind textures, and the data plan for a news-access session.

| Document | Role |
| --- | --- |
| [SPEC-4.1.md](SPEC-4.1.md) | Binding build spec (revision 2 after the critic). Read with the lead amendment in §0.2 of this README. |
| [ENCODING.md](ENCODING.md) | Encoding designer: validated palettes (dataviz validator output quoted), SVG pattern defs, legend and control spec. |
| [EDITORIAL.md](EDITORIAL.md) | Editorial skeptic: taxonomy with cited bases, conflict-layer rules, banned words, copy deck, risks. |
| [TECH.md](TECH.md) | Tech architect: data model, validators, UI, budget split, work packages. |
| [HANDOFF_ROUND5_DRAFT.md](HANDOFF_ROUND5_DRAFT.md) | Data planner: round-5 section for docs/HANDOFF_DATA_REFRESH.md (UCDP ingest, civil-unrest sourcing). |
| [INPUTS.md](INPUTS.md) | The lead's brief: request, hard facts, constraints, questions. |

## 0.2 Lead amendment (binding over SPEC-4.1 where they differ)

**Kind mode uses colour and texture.** SPEC-4.1 adopted the editorial position that kind is never hue on the map. The owner asked for colours, and the encoding designer's three-family palette passes every dataviz check on both surfaces in light and dark (ochre = protest or strike, blue #4c83de/#5991ed = civil unrest, mauve #7b3660/#a9628b = armed conflict; worst CVD ΔE 20.9 light / 14.8 dark; see ENCODING.md). The example-mode violet never co-occurs with Kind mode, so that collision does not apply. Decision: the "Shade countries by" control gains a third option, Kind, which paints those three families and, with Patterns on, forced-colours or print, also their textures (unrest 135° lines, armed conflict dots); countries with records of more than one family paint "Several kinds" (neutral + cross-hatch), never the most serious. Coverage stays the default; nothing animates; no red; the conflict layer keeps every EDITORIAL.md rule (UCDP basis, bounded figures, no front lines). Badges on cards and rows keep text + swatch + pattern so the map is never the only carrier.
