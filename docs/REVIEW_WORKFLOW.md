# Local editor workflow

The editor workspace at `review.html` is a static, local-file review tool. It handles **unverified news leads**, not a public event feed. Imported files and edits stay in tab memory. There is no account, server submission, browser storage or automatic publication. Export a JSON packet before refreshing or closing the tab. A new import replaces the current work.

## Import and triage

1. Open [the discovery workflow](https://github.com/occult-kranti/protest-atlas/actions/workflows/discovery.yml), select a successful run and download its `unverified-news-candidates-<run-id>` artifact. GitHub may require sign-in to download artifacts; the review workspace itself does not. Unzip it and select `latest.json` with the file input. It also accepts the normalized queue created by the CLI below. Candidate artifacts expire after 14 days under the current workflow.
2. Search headlines, source domains, source language and notes. Each imported candidate starts **unreviewed**. Headlines, publisher country, language and GDELT seen time remain unverified provider metadata. Publisher country is not occurrence country. GDELT seen time is neither the article publication date nor the occurrence date.
3. Open the source report. Resolve occurrence, date, place, source independence, attribution and limitations from its contents. Enter occurrence country from the directory and observed date manually. Enter source publication date only when the report establishes it; leave it blank otherwise. The workspace never fills evidence dates from GDELT metadata.
4. Choose **needs source**, **reject**, **duplicate** or **ready for editor** and click **Apply disposition**. Notes and evidence edits are kept in memory as you type; a selected disposition is recorded only after applying it. A duplicate needs an existing published event ID. “Ready for editor” needs a nonfuture observed date, a directory country, a source-read acknowledgement, an original claim summary and its attribution. This gate helps prepare a draft; it does not certify that a claim is true or satisfy final editorial policy by itself.
5. Export the JSON packet. No CSV is exported, so headline or note text beginning with spreadsheet formula characters is preserved as JSON text rather than a spreadsheet formula. Do not turn raw imported text into a CSV without formula escaping. Do not commit packets, candidate artifacts, private notes, identifying information or full article copies to public Git history. Review locally and extract only minimal public facts for an editorial pull request.

The queue compares canonical source URLs with the current `public/events.json`. URL normalization removes fragments and common tracking parameters and sorts remaining parameters; it does not merge wire syndications, AMP paths or distinct articles about the same event. A URL match blocks the “ready” disposition and identifies published IDs for duplicate review. No URL match proves uniqueness. A human reviewer must resolve episodes and independent evidence.

## CLI normalization and packet checks

From the repository root:

```sh
python scripts/build_review_queue.py /path/to/downloaded/latest.json
python scripts/build_review_queue.py /path/to/protest-atlas-review-2026-10-02.json --validate-packet
python scripts/validate_coverage.py
python -m unittest discover -s tests
```

Normalization writes only `data/review-queues/latest.json`, outside the public asset tree. Use `--output data/review-queues/name.json` for another queue filename. Paths outside that directory, including public paths and symlink escapes, are rejected. Writes replace the queue atomically and never modify `public/events.json`. Packet validation writes nothing, accepts only the exact draft schema, checks URL-derived metadata against the current public source list, and reapplies the evidence/disposition gate. Validation is not approval.

Review packet schema version 1 has `packet_kind: editorial-review-packet`, UTC `exported_at`, `source_collected_at`, and `reviews`. Each review contains the normalized `candidate`, `disposition`, `notes`, nullable manual `observed_date`, nullable occurrence `country`, nullable manual `source_published_at`, boolean `source_checked`, `claim_summary`, `attribution`, and nullable `duplicate_event_id`. The candidate stays `review_status: unverified` even when its draft disposition is ready. There is no public-event schema or publication action in the packet.

Before publication, follow `EDITORIAL_POLICY.md`: check article contents, corroboration and source independence, sensitive claims, privacy, source rights and dates. A second human editor is required for the human-reviewed track. The separate initial AI-assisted pilot must keep its non-human-reviewed disclosure. Final public data changes happen in a separately reviewed pull request, with ordinary public-data validation and stable event IDs; importing or exporting cannot perform them.

## Coverage and discovery manifests

`public/coverage.json` is a 249-entry country/territory ledger. Release 3 uses `schema_version: 2`, retaining the country fields and adding a source-ID-to-language map. The 81 countries with published episodes have limited source checks; the other 168 have no published episode and remain unreviewed at this level. Report windows describe dated checked sources, not continuous review; an unknown publication-date window stays null. `public/research-ledger.json` separately records an initial search for all 249 entries. A search alone never changes article-level review status. Source languages describe text actually inspected and are predominantly English. Integration and search timestamps must never refresh source observations or access times; no independent human editorial sign-off is claimed.

`public/discovery-status.json` is a static audit, not live service health. It records the first known successful run `37054141060`, its 97 sampled candidate leads, provenance link and artifact-created timestamp `2026-10-02T19:27:08Z`. `last_success_basis: artifact-created` states that this time is artifact availability, not a precisely known run-completion time. The configured schedule is six hours, with no guarantee that each scheduled run succeeds. No subsequent success is inferred. Show the audit time and known artifact age; consult Actions for later failures or successes. A successful discovery artifact never refreshes public event evidence or country-language review.

Corrections use the public GitHub **Public record correction** issue template. It asks for a record ID, relevant date, disputed claim and public reporting links, and warns against exposing private identifying information. Issues are public and do not automatically change records.

## Static-site integration

The static build allowlist must include `review.html`, `review.js`, `review.css`, `public/coverage.json` and `public/discovery-status.json`. Keep discovery and review queue files outside that allowlist. Run `validate_repository_coverage(root, now=None)` from `scripts/validate_coverage.py` alongside existing event validation. The function validates both manifests and returns the coverage envelope. `validate_coverage(data, countries_dict, events_envelope, now=None)` and `validate_discovery_status(data, now=None)` are available separately.

Map/directory consumers join coverage entries by `code`. Display “Limited English-source check · no human review” or “Not reviewed · coverage unknown,” retain the actual `last_checked`, and link the listed source IDs to their event sources. Show `review_window` as “Dated reports checked,” not as the period in which every protest was searched. A link to `review.html` opens the editor tool; it must not present imported leads as atlas records. The footer can link the correction template and the review guide.
