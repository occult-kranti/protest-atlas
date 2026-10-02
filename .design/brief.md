# Protest Atlas design brief

Product: a public, source-led index of collective action, hosted as a static GitHub Pages site.

Primary job: explore published protest records by country, issue, region, and status, then inspect attributed demands, positions, intensity, state response, and original reporting.

Audience: curious readers and researchers who need to distinguish reported activity from uncertain or missing coverage.

Direction: an editorial field index. Warm paper, deep ink, restrained ochre, serif story headings, compact sans-serif evidence labels, and ruled rows. The directory is the world overview; no inaccurate decorative map. Country labels include territories rather than implying 249 sovereign states.

Evidence: source links, source-check date, last source observation, verification notes, attribution, UTC dates, and explicit unknowns. The current pilot is AI-assisted and has no independent human editorial review; this disclosure belongs above the records.

Constraints: dependency-free HTML/CSS/JavaScript; no build requirement; relative JSON paths work under a GitHub Pages repository base path. No geolocation, analytics, identification of individual participants, or invented metrics. Synthetic examples must require an explicit switch and carry a clear watermark throughout.

Invariants: zero records is a useful coverage-gap state; zero matching results is not evidence of no protests. Ongoing statuses age against last_observed_at and become Needs review at 72 hours. Future start dates remain Planned. Unknown onset stays unknown. Turnout, disruption, violence, and state response are separate dimensions. Sources remain attached to claims.

Responsive composition: desktop record index with explanatory reading key; tablet/mobile stack the page, remove repeated side guidance, wrap filters, and reduce country-region columns. Dialog uses native modal behavior, explicit close, initial heading focus, Escape, and focus restoration.
