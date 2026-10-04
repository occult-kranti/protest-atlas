# Deployment and editorial operation

The repository is ready for a static GitHub Pages deployment. A maintainer still needs repository access and must enable Pages. There is no paid service or additional server dependency in this design.

## Enable Pages

1. Push the repository to GitHub with `main` as the default branch, or change the workflow branch filters to match your branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Enable GitHub Actions if organization policy requires it.
3. In **Settings → Environments → github-pages**, permit deployment only from `main`. Add required reviewers if the repository plan supports that control.
4. Protect `main` with required pull requests, at least one editorial approval, and the **validate-build** check. Review both factual data and workflow/script changes. Avoid bypassing review for routine data updates.
5. Run **Validate and deploy Pages**, or push an approved change to `main`. The build validates data and tests before producing the Pages artifact. Pull requests validate and build without publishing.
6. Open the deployment URL shown in the workflow's `github-pages` environment. Test filters, the country detail view, source links and the data-freshness labels after deployment. Relative asset/data paths support project sites such as `https://OWNER.github.io/REPO/`.

### Post-deploy check and queueing

After every deploy from `main`, the **verify** job checks the live site from the GitHub runner. It polls `public/build-info.json` for up to 10 minutes until its `commit` equals the pushed commit (`github.sha`), so a stale CDN copy cannot pass. Then it requires HTTP 200 from the site root, `index.html`, `public/roadmap.json` and `public/events.json`, and those two JSON files must also parse. `public/upcoming.json` is optional: a 404 is reported as a notice, because the Ahead view has an "absent" state; when it is published (200) it must parse as JSON too. `public/conflicts.json` (the re-published UCDP conflict context dataset, 4.1) is optional in the same way: until the data session publishes it, every visit to the live site requests it and receives a 404, which appears in the browser console as a failed resource. That is the designed absent state (the legend, About and the dates sheet say the dataset has not been loaded, and that absence is not peace), the same mechanism as `upcoming.json` before 4.0 and `build-info.json` when serving the repository; the verify job reports it as a notice, not an error. Finally, an unknown path must return the 404 page with `noindex`. The job writes the stamp and the response headers to the run summary. It runs only after a deploy and is not a pull-request gate, so a failed verify marks the run red without blocking the next merge.

**What is served (4.1).** CSS is measured and served comment-stripped: `scripts/build.py` removes `/* … */` comments and collapses the blank lines they leave from every stylesheet as it copies it into `_site` (a comment opener inside a quoted string or `url(…)` fails the build rather than being mangled), and `tests/test_shell.mjs` measures the CSS budget the same way. JS is served as written, with its contract comments. Every module, stylesheet and the import map carry the `?v=4.1` cache key; the lazy views (Ahead, Countries, About) and the conflict record module are listed in the import map so a dynamic `import()` shares that key, but only the static graph is preloaded.

Runs on `main` queue rather than cancel: the workflow concurrency group cancels superseded runs only for pull requests, and the deploy job has its own `pages-deploy` group with `cancel-in-progress: false`. A newer push never cancels a running build or deploy. It waits for the whole previous run, including verify (up to 15 minutes), then builds and deploys its own validated artifact. If several pushes arrive, GitHub keeps only the newest waiting run: a third push cancels the second while it is still waiting, never the run in progress. The manual checks in step 6 remain necessary; verify proves which build is served, not that it reads correctly.

Only the deploy job has `pages: write` and `id-token: write`. Discovery has no repository write or deployment permission. Checkout does not persist credentials, and no credentials are compiled into public files.

## Candidate schedule and review

The optional **Discover unverified news candidates** workflow requests leads at **01:37, 07:37, 13:37 and 19:37 UTC**, with a manual run available. It searches a 24-hour overlapping window and uploads a 14-day `unverified-news-candidates-RUN_ID` artifact. Overlap limits some missed observations but does not guarantee completeness. Deduplication happens within a run; reviewers should deduplicate overlapping artifacts against existing event records. Do not publish artifacts wholesale. Artifacts are excluded from the website but are not confidential storage: repository readers may be able to download them. Only public news metadata belongs there; never private testimony or personal evidence.

Inspect **Actions** for failures and download a candidate artifact. Open relevant source URLs yourself; a headline alone is not evidence for an event. Assess dates, location, outlet reliability, source independence, conflicting positions, reported turnout and state response. Edit `public/events.json` only with claims you can support. Link each position, timeline entry, response and described intensity to source IDs local to that event. Mark unresolved dimensions as unknown. Update `last_observed_at` only when evidence supports a new observation, `last_verified` only after a source check, and `last_editorial_review` only after actual review. Rebuild without changing those values when no new review occurred.

Submit and approve an editorial pull request. After merge, the deployment workflow publishes the validated snapshot. The schedule does **not** provide autonomous verified updates: fresh public event data depends on active human editorial review. If staffing stops, observation dates remain visible and the site must show the resulting stale/unknown status. The initial records' verification notes describe how they were checked; a field name is not a claim that a human editor independently verified them.

GitHub schedules are best effort. Jobs may be delayed or dropped under load; the minute offset reduces a known busy period but is not an SLA. Scheduled workflows run only on the default branch. In public repositories they are disabled after 60 days without repository activity. Re-enable a disabled workflow and use the manual run if necessary. Provider outages, quotas, network errors, Actions availability, artifact retention and repository policy can all interrupt discovery. No artifact means no successful collection; it does not mean no protests.

During the 2026-10-02 implementation check, one local GDELT request returned HTTP 429 (rate limited). The subsequent GitHub-hosted discovery run [37054141060](https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060) succeeded. Continue monitoring each run; one success is not evidence of guaranteed uptime, coverage or scheduled delivery.

To disable discovery, disable that workflow in GitHub Actions or remove its `schedule` trigger. Static deployment remains independent. To recover a broken deployment, revert the offending public-data/UI change through a reviewed pull request and rerun the Pages workflow. Existing verified data should not be replaced with candidates as an outage workaround.

## Dependency pins

Actions are pinned to full commit SHAs. checkout, setup-python, upload-pages-artifact and upload-artifact were read from the official `actions/*` GitHub API tag references on 2026-10-02. configure-pages, deploy-pages and setup-node were re-verified with `git ls-remote --tags https://github.com/actions/<name>` on 2026-10-03:

| Action | Version | Commit SHA |
| --- | --- | --- |
| checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| setup-python | v7.0.0 | `5fda3b95a4ea91299a34e894583c3862153e4b97` |
| setup-node | v6.5.0 | `249970729cb0ef3589644e2896645e5dc5ba9c38` |
| configure-pages | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| upload-pages-artifact | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| deploy-pages | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |
| upload-artifact | v7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |

setup-node installs Node.js 22 (`package.json` engines: `>=22`) with `package-manager-cache: false` (there is no lockfile), so `node --test` runs on a chosen major version instead of whatever the runner image ships.

Review release notes and verify the full SHA in the upstream repository before updating a pin. The official Pages artifact action also has its own internal dependencies; an outer SHA does not freeze every upstream/transitive action reference. Review those dependencies when updating.

## Primary references

- [GitHub: configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- [GitHub: scheduled workflow event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- [GitHub: managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
- [Official actions repositories](https://github.com/actions) and their immutable tag commit references.
- [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/).
