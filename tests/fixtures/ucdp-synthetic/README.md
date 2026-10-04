# Synthetic UCDP-shaped fixtures (tests only)

Everything in this folder is **fictional**: the conflicts, parties, dyads, dates and death figures are invented so that
`scripts/ingest_ucdp.py` can be unit-tested in a container that cannot reach ucdp.uu.se. Real country names and
Gleditsch–Ward numbers (France 220, Belgium 211, Netherlands 210, Portugal 235, Ireland 205, Spain 230, Austria 305,
Kosovo 347) are used only so that the country-mapping code runs. **No row describes a real event.** Conflict names
carry the prefix `SYNTHETIC:` and party names carry `(SYNTHETIC)` or `Synthetic …`; the manifest's `licence` and
`citation` values are placeholders. Nothing here may be copied into `research/round5/` or `public/`.

The column sets copy the real UCDP layouts from memory (GED 25.x, ACD 25.x, BRD 25.x) so that the ingest's column
checks are exercised; the forbidden columns (`latitude`, `longitude`, `geom_wkt`, `adm_1`, `where_coordinates`,
`source_article`, `source_headline`) are present on purpose, each filled with a marker string, so the tests can prove
that none of them reaches the output.

20 event rows across three GED files: 16 in the "annual" file (one with an empty `best`, one dated after the window
end), 3 in candidate release 26.0.8 and 1 in candidate release 26.0.7 (a duplicate of event 9000204 with an earlier
estimate; the later release must win).
