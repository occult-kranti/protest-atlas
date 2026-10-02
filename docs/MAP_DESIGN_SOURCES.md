# Map design rationale and sources

Design review: 2 October 2026. This is an AI-assisted design and engineering review, not consultation with named human experts.

## Reading applied

| Source actually consulted | Decision in this interface |
| --- | --- |
| Edward Tufte, [Envisioning Information](https://www.edwardtufte.com/book/envisioning-information/), author's public book overview | Layer geography, categorical coverage and evidence separately. Quiet graticules and low-emphasis borders preserve the overview; a country brief and source record provide detail. The full book was not accessed, and these decisions are our interpretation of its overview. |
| Jakob Nielsen, [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Show loading, failure, source age, selected country and coverage gaps; give separate clear-selection, reset-filter and world-view controls; preserve a plain country selector as an equivalent navigation path. |
| [D3 geographic documentation](https://d3js.org/d3-geo) and [world-atlas documentation](https://github.com/topojson/world-atlas) | Use a real Equal Earth projection and reproducible coarse geography, not illustrative continent shapes. Keep all runtime assets local and pinned. |
| [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) | Reuse public-domain coarse geography with source attribution and an explicit boundary convention. |
| Design Partner foundations/accessibility; Impeccable skill; compose-ui-theme contrast/state guidance | Retain warm paper, ink, serif headings and restrained ochre. Make controls labeled and keyboard usable, keep mobile inputs readable, add visible selected/focus states, and make unavailable geometry explicit. Impeccable's context loader was unavailable; the existing project brief supplied context. |

## Visual and interaction contract

- Ochre means one or more published records matching non-country filters. Dark teal means selected country. Gray hatch means no matching record in this view. None measures public support, turnout, unrest, or severity.
- Lavender and explicit wording distinguish the synthetic demonstration. Example records never enter reported totals or CSV exports; view-link sharing is disabled in example mode.
- Map selection narrows the evidence list while retaining a global view under the other filters. The country panel explains source language, actual check time, human review status and missing evidence.
- A 1:110m map omits many small territories. All 249 directory choices remain available; the country panel disables geographic zoom and explains missing geometry where necessary.
- Hover is supplementary. Country select, directory, keyboard focusable reported shapes and evidence buttons provide non-hover paths. Country shortlist selection transfers focus to the stable country selector.
- Reported areas have a contrasting outline. Keyboard focus uses a light outline and dark halo, including over a dark selected shape. Motion preferences are respected for page navigation; wheel scrolling remains page scrolling.
- View links encode filters. CSV includes recorded status, observation date, uncertainty reminder and source URLs. A fresh deployment does not refresh observations.

## Checks and remaining limits

See RELEASE_EVIDENCE.md for the observed verification results. The static responsive harness uses real iframe CSS widths and does not emulate physical touch hardware or a screen reader. No automated check establishes editorial truth, complete global coverage, or independent corroboration.
