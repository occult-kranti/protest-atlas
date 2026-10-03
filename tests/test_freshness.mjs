import test from 'node:test';
import assert from 'node:assert/strict';
import {relativeLabel, absoluteLabel, observationBand, announcementState, countdownLabel, daysUntil, updateStamps, datasetState} from '../freshness.js';

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
  // Independent of ICU month data ("Sept" in some versions).
  assert.equal(absoluteLabel('2026-09-30'), '30 Sep 2026');
  assert.equal(absoluteLabel('2026-09-30T04:05:59Z'), '30 Sep 2026, 04:05 UTC');
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
  assert.equal(countdownLabel({...item, date_precision: 'month'}, now), 'Planned for October 2026');
  assert.equal(countdownLabel({...item, date_precision: 'week'}, now), 'Planned for the week of 7 Oct 2026');
  // A month or week plan stays current until its period ends, not after its first day.
  assert.equal(announcementState({...item, planned_start: '2026-10-01', date_precision: 'month'}, now), 'scheduled-now');
  assert.equal(announcementState({...item, planned_start: '2026-09-01', date_precision: 'month'}, now), 'date-passed');
  assert.equal(announcementState({...item, planned_start: '2026-09-27', date_precision: 'week'}, now), 'scheduled-now');
  assert.equal(announcementState({...item, planned_start: '2026-09-25', date_precision: 'week'}, now), 'date-passed');
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

test('dataset staleness follows newest evidence, not assembly time', () => {
  assert.equal(datasetState('2026-10-02', now), 'current');
  assert.equal(datasetState('2026-09-30', now), 'current');
  assert.equal(datasetState('2026-09-29', now), 'aging');
  assert.equal(datasetState('2026-09-25', now), 'stale');
  assert.equal(datasetState('2026-09-02', now), 'archive');
  assert.equal(datasetState(null, now), 'unknown');
  assert.equal(datasetState('2026-10-09', now), 'unknown');
  assert.equal(datasetState('2026-10-02', Date.parse('2026-10-05T00:00:00Z')), 'aging');
  assert.equal(datasetState('2026-10-02', Date.parse('2026-10-09T00:00:00Z')), 'stale');
});
