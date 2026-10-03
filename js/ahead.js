// Announced protest actions and the site roadmap (WP5). Phase-0 stub; NOT_PLANNED is final (SPEC §18.2, R4). DOM-free when loaded.
import {REPO_URL} from './html.js';

export const NOT_PLANNED = [
  'Any score that rates or ranks how serious a protest is.',
  'Popularity or approval percentages.',
  'Predictions of unrest.',
  'Tracking the positions of police, troops or crowds.',
  'Identification of participants.',
  'Reminders, calendar exports or sign-up buttons for planned protests.',
  'Country or region rankings.',
  'Automatic publication of discovered leads.',
];

export function groupAnnouncements(items, now) { return {}; }
export function announcementView(item, now) { return {}; }
export function roadmapGroups(roadmap) { return []; }
export function evidenceHref(evidence, repo = REPO_URL) { return null; }
export function reviewOverdue(lastReviewed, now, days = 90) { return false; }
export function aheadTeaserHTML({upcoming, load, now}) { return ''; }
export function mountAhead(ctx) { return {render() {}}; }
