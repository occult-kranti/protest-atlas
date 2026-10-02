import test from 'node:test';
import assert from 'node:assert/strict';
import {relativeLabel, absoluteLabel, observationBand, announcementState, countdownLabel, daysUntil, updateStamps} from '../freshness.js';

const now = Date.parse('2026-10-02T22:00:00Z');

test('relative labels respect day precision and timestamps', () => {
  assert.equal(relativeLabel('2026-10-02', now), 'today');
  assert.equal(relativeLabel('2026-10-01', now), 'yesterday');
  assert.equal(relativeLabel('2026-09-29', now), '3 days ago');
  assert.equal(relativeLabel('2026-10-05', now), 'in 3 days');
  assert.equal(relativeLabel('2026-10-02T21:31:50Z', now), '28 minutes ago');
  assert.equal(relativeLabel('2026-10-02T19:00:00Z', now), '3 hours ago');
  assert.equal(relativeLabel(null, now), 'date not established');
  assert.equal(relativeLabel('nonsense', now), 'date not established');
});

test('absolute labels are UTC and never invent a time for day-only values', () => {
  assert.equal(absoluteLabel('2026-10-02'), '2 Oct 2026');
  assert.equal(absoluteLabel('2026-10-02T21:31:50Z'), '2 Oct 2026, 21:31 UTC');
  assert.equal(absoluteLabel(undefined), 'Not established');
});

test('observation band uses last_observed_at only, with a strict 72-hour edge', () => {
  assert.equal(observationBand({last_observed_at: '2026-10-01'}, now), 'fresh');
  assert.equal(observationBand({last_observed_at: '2026-09-29T22:00:01Z'}, now), 'fresh');
  assert.equal(observationBand({last_observed_at: '2026-09-29T22:00:00Z'}, now), 'week');
  assert.equal(observationBand({last_observed_at: '2026-09-20', last_verified: '2026-10-02T21:00:00Z'}, now), 'month');
  assert.equal(observationBand({last_observed_at: '2025-01-01'}, now), 'older');
  assert.equal(observationBand({last_observed_at: '2026-10-03'}, now), 'unknown');
  assert.equal(observationBand({}, now), 'unknown');
});

test('announcements count down but never turn into occurrences', () => {
  const item = {planned_start: '2026-10-07', planned_end: null, date_precision: 'day', status: 'announced'};
  assert.equal(announcementState(item, now), 'upcoming');
  assert.equal(daysUntil(item, now), 5);
  assert.equal(countdownLabel(item, now), 'in 5 days');
  assert.equal(countdownLabel({...item, planned_start: '2026-10-03'}, now), 'tomorrow');
  assert.equal(countdownLabel({...item, date_precision: 'month'}, now), 'in 5 days (month precision)');
  assert.equal(announcementState({...item, planned_start: '2026-10-02'}, now), 'scheduled-now');
  assert.equal(announcementState({...item, planned_start: '2026-09-30', planned_end: '2026-10-04'}, now), 'scheduled-now');
  assert.equal(announcementState({...item, planned_start: '2026-10-01'}, now), 'date-passed');
  assert.match(countdownLabel({...item, planned_start: '2026-10-01'}, now), /not recorded/);
  assert.equal(announcementState({...item, status: 'cancelled'}, now), 'cancelled');
  assert.equal(announcementState({...item, planned_start: 'soon'}, now), 'unknown');
});

test('update stamps stay separate and ignore invalid values', () => {
  const stamps = updateStamps({
    events: {generated_at: '2026-10-02T21:31:50Z', last_editorial_review: '2026-10-02T21:31:50Z', events: [
      {last_observed_at: '2026-10-02', last_verified: '2026-10-02T21:09:52Z'},
      {last_observed_at: '2024-06-01', last_verified: 'bad'},
    ]},
    upcoming: {generated_at: '2026-10-02T21:40:00Z'},
    build: {built_at: '2026-10-02T21:45:00Z', commit: 'abc'},
  });
  assert.deepEqual(stamps, {
    dataUpdated: '2026-10-02T21:31:50Z', editorialReview: '2026-10-02T21:31:50Z', latestObservation: '2026-10-02',
    latestSourceCheck: '2026-10-02T21:09:52Z', announcementsUpdated: '2026-10-02T21:40:00Z',
    siteBuilt: '2026-10-02T21:45:00Z', commit: 'abc',
  });
  assert.equal(updateStamps().dataUpdated, null);
  assert.equal(updateStamps().latestSourceCheck, null);
});
