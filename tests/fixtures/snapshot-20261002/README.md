# Frozen 2 Oct 2026 snapshot

Byte-for-byte copies of the published data at release 4.0 integration (`3c3ee82`). Tests that assert specific counts, ids, dates or walkthrough text (84 episodes, first card `in-electoral-20261002`, the 9 Oct stale walkthrough and similar) read these copies. They never read `public/*.json`, so a legitimate data refresh cannot turn CI red.

Tests on `public/*.json` check only invariants that hold for any valid snapshot.

Never edit these files to match new data. Add a new fixture directory if a new walkthrough is needed.
