# Deployment and editorial operation

The repository is ready for a static GitHub Pages deployment. A maintainer still needs repository access and must enable Pages. There is no paid service or additional server dependency in this design.

## Enable Pages

1. Push the repository to GitHub with `main` as the default branch, or change the workflow branch filters to match your branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Enable GitHub Actions if organization policy requires it.
3. In **Settings → Environments → github-pages**, permit deployment only from `main`. Add required reviewers if the repository plan supports that control.
4. Protect `main` with required pull requests, at least one editorial approval, and the **validate-build** check. Review both factual data and workflow/script changes. Avoid bypassing review for routine data updates.
5. Run **Validate and deploy Pages**, or push an approved change to `main`. The build validates data and tests before producing the Pages artifact. Pull requests validate and build without publishing.
6. Open the deployment URL shown in the workflow's `github-pages` environment. Test filters, the country detail view, source links and the data-freshness labels after deployment. Relative asset/data paths support project sites such as `https://OWNER.github.io/REPO/`.

Only the deploy job has `pages: write` and `id-token: write`. Discovery has no repository write or deployment permission. Checkout does not persist credentials, and no credentials are compiled into public files.

## Candidate schedule and review

The optional **Discover unverified news candidates** workflow requests leads at **01:37, 07:37, 13:37 and 19:37 UTC**, with a manual run available. It searches a 24-hour overlapping window and uploads a 14-day `unverified-news-candidates-RUN_ID` artifact. Overlap limits some missed observations but does not guarantee completeness. Deduplication happens within a run; reviewers should deduplicate overlapping artifacts against existing event records. Do not publish artifacts wholesale. Artifacts are excluded from the website but are not confidential storage: repository readers may be able to download them. Only public news metadata belongs there; never private testimony or personal evidence.

Inspect **Actions** for failures and download a candidate artifact. Open relevant source URLs yourself; a headline alone is not evidence for an event. Assess dates, location, outlet reliability, source independence, conflicting positions, reported turnout and state response. Edit `public/events.json` only with claims you can support. Link each position, timeline entry, response and described intensity to source IDs local to that event. Mark unresolved dimensions as unknown. Update `last_observed_at` only when evidence supports a new observation, `last_verified` only after a source check, and `last_editorial_review` only after actual review. Rebuild without changing those values when no new review occurred.

Submit and approve an editorial pull request. After merge, the deployment workflow publishes the validated snapshot. The schedule does **not** provide autonomous verified updates: fresh public event data depends on active human editorial review. If staffing stops, observation dates remain visible and the site must show the resulting stale/unknown status. The initial records' verification notes describe how they were checked; a field name is not a claim that a human editor independently verified them.

GitHub schedules are best effort. Jobs may be delayed or dropped under load; the minute offset reduces a known busy period but is not an SLA. Scheduled workflows run only on the default branch. In public repositories they are disabled after 60 days without repository activity. Re-enable a disabled workflow and use the manual run if necessary. Provider outages, quotas, network errors, Actions availability, artifact retention and repository policy can all interrupt discovery. No artifact means no successful collection; it does not mean no protests.

During the 2026-10-02 implementation check, one local GDELT request returned HTTP 429 (rate limited). The subsequent GitHub-hosted discovery run [37054141060](https://github.com/occult-kranti/protest-atlas/actions/runs/37054141060) succeeded. Continue monitoring each run; one success is not evidence of guaranteed uptime, coverage or scheduled delivery.

To disable discovery, disable that workflow in GitHub Actions or remove its `schedule` trigger. Static deployment remains independent. To recover a broken deployment, revert the offending public-data/UI change through a reviewed pull request and rerun the Pages workflow. Existing verified data should not be replaced with candidates as an outage workaround.

## Dependency pins

Actions are pinned to full commit SHAs. These versions and SHAs were read from the official `actions/*` GitHub API tag references on 2026-10-02:

| Action | Version | Commit SHA |
| --- | --- | --- |
| checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| setup-python | v7.0.0 | `5fda3b95a4ea91299a34e894583c3862153e4b97` |
| configure-pages | v5.0.0 | `983d7736d9b0ae728b81ab479565c72886d7745b` |
| upload-pages-artifact | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| deploy-pages | v4.0.5 | `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` |
| upload-artifact | v7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |

Review release notes and verify the full SHA in the upstream repository before updating a pin. The official Pages artifact action also has its own internal dependencies; an outer SHA does not freeze every upstream/transitive action reference. Review those dependencies when updating.

## Primary references

- [GitHub: configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
- [GitHub: scheduled workflow event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- [GitHub: managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
- [Official actions repositories](https://github.com/actions) and their immutable tag commit references.
- [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/).
