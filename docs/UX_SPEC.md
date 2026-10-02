# Protest Atlas UX specification

## Information architecture

The first viewport identifies the atlas, shows its editorial limitations, and introduces the event index. Readers can filter source-linked records or choose a clearly separated illustrative example. A regional directory of all 249 ISO countries and territories follows; selecting a country switches to reported data and focuses the country filter. The methodology explains attribution, multidimensional intensity, recency, and coverage gaps.

## Record browsing

Persistent visible labels accompany search, country, and status filters. Region and issue filters appear in a native disclosure. Counts describe published records only. Search includes titles, summaries, issues, location, actors, claims, and targets. Results sort by last source-check timestamp. Reset clears all filters. Mode changes clear previous filters so examples remain discoverable.

Reported data and examples are fetched separately. Example rows, the index banner, and the detail dialog all display “Illustrative example • not a real event.” The country directory always describes reported coverage, never example coverage.

## Status and dates

`last_observed_at` governs current-status freshness. `ongoing` is displayed as “Reported ongoing” only while the last observation is in the past and less than 72 hours old. Exactly 72 hours or older becomes “Needs review”; source-check recency cannot refresh old activity. Future start dates always display Planned. Past planned dates beyond 72 hours require review. Unknown and ended statuses retain their meaning.

Dates render in UTC, including date-only source dates. Unknown onset renders “Not established · onset unknown.” The displayed source-check date does not imply a current ground-truth observation. A minute interval and visibility-change check refresh age-dependent labels; a modal open at a threshold receives a status update without replacing its contents.

## Detail dialog

A native `dialog` names itself from the event heading. Opening focuses that heading; Close, Escape, or clicking the backdrop dismisses the dialog. Closing restores focus to the originating button or search field if the trigger disappeared. Native modal behavior suppresses background interaction and contains keyboard focus. Body scrolling is locked while open.

Record details show country, location precision, event period, last observation, AI-assisted source check, attributed positions, turnout uncertainty, disruption, violence, state response, verification note, timeline, and original source evidence. Source references link to the relevant source entry; original reporting opens in a new tab with a stated accessible label. URLs accept HTTP(S) only; rendered data text is escaped.

## Loading and recovery

Loading labels keep the work surface recognizable. Data-load errors show unavailable coverage rather than zero events, preserve filters, and expose Retry and the public JSON link. Directory errors have their own recovery message. Empty reported data retains the useful directory, methodology, and explicit example entry point. Zero matches warns against interpreting missing coverage as no protests. A stale editorial timestamp is flagged in the data notice.

## Visual and access system

Semantic canvas, surface, ink, muted, action, border, green status, and warning tokens drive the interface. Statuses use text plus a symbol rather than hue alone. Visible focus, skip navigation, landmarks, named native controls, reduced-motion handling, 16px mobile inputs, wrapping layouts, and enlarged mobile controls are implemented. No font service or asset request is needed.

Country data attribution links to the original ISO regional dataset and CC BY-SA 4.0. Source, published data, corrections, and editorial policy links appear in the footer.

## Verification evidence

Executed: JavaScript module syntax check; pure temporal and UTC-date assertions; source inspection for IDs, labels, focus management, responsive breakpoints, and reduced motion; a DOM simulation of data loading, the 249-entry directory, pilot caveat, search/country/reset filters, explicit example separation, unavailable-data recovery, true-empty coverage, stale observations, escaped data, and example-load error recovery. Eleven temporal/UTC assertions passed, including the exact 72-hour boundary. Principal text contrast pairs were measured; the ochre token was darkened after its initial 4.37:1 result fell below 4.5:1. Final measured ratios: ink/canvas 13.28:1, muted/canvas 5.61:1, ochre/canvas 4.84:1, green/canvas 6.94:1, warning/canvas 6.81:1, muted/filter 5.22:1, muted/surface 6.18:1.

Browser verification was attempted with installed Playwright, but its Chromium executable was missing. A cloud-browser localhost preview was blocked by ERR_BLOCKED_BY_CLIENT. An official Chromium installation was then attempted for the remaining runtime checks; the CDN returned invalid/truncated zero-MiB ZIP downloads on all five retries and installation failed. Source and DOM simulation are not substitutes for rendered visual, keyboard, or assistive-technology verification.

Not yet verified: rendered layouts at 320/390/768/1440 CSS pixels, 200% browser zoom, native dialog Tab/Shift+Tab/Escape/focus restoration, screen-reader experience, and browser console/network checks.
