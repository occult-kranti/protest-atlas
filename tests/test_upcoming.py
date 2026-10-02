import copy
from datetime import datetime, timezone
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_data import ValidationError  # noqa: E402
from validate_upcoming import validate_upcoming  # noqa: E402

NOW = datetime(2026, 10, 2, 22, 0, tzinfo=timezone.utc)
COUNTRIES = {'FR': {'code': 'FR', 'name': 'France', 'region': 'Europe'}}
EVENTS = {'events': [{'id': 'fr-schools-20261002', 'sources': [{'id': 'fr-schools-reuters'}]}]}


def manifest():
    return {
        'schema_version': 1,
        'generated_at': '2026-10-02T21:59:00Z',
        'note': 'An announcement is not evidence that an action will occur.',
        'items': [{
            'id': 'fr-teachers-strike-20261007', 'event_id': 'fr-schools-20261002', 'country': 'FR',
            'cities': ['Paris'], 'action': 'Nationwide teachers’ strike', 'announced_by': 'Teaching unions',
            'planned_start': '2026-10-07', 'planned_end': None, 'date_precision': 'day',
            'announcement': 'Unions said they would strike over school conditions.', 'status': 'announced',
            'source_ids': ['fr-teachers-announcement'],
            'sources': [{'id': 'fr-teachers-announcement', 'url': 'https://example.org/report', 'title': 'Report',
                         'publisher': 'Example', 'published_at': '2026-10-02', 'accessed_at': '2026-10-02T21:00:00Z'}],
            'note': 'Announcement only; occurrence and turnout not established.',
        }],
    }


class UpcomingTests(unittest.TestCase):
    def check(self, data):
        return validate_upcoming(data, COUNTRIES, EVENTS, NOW)

    def mutated(self, **changes):
        data = manifest()
        data['items'][0].update(changes)
        return data

    def test_future_announcement_is_valid_but_not_an_event(self):
        self.check(manifest())
        with self.assertRaisesRegex(ValidationError, 'occurrence belongs'):
            self.check(self.mutated(status='occurred'))

    def test_manifest_must_disclaim_occurrence(self):
        data = manifest()
        data['note'] = 'Upcoming protests.'
        with self.assertRaisesRegex(ValidationError, 'does not establish occurrence'):
            self.check(data)

    def test_operational_detail_is_rejected(self):
        for text in ('March starts at 16:00 near the station', 'Meet at the square', 'The protest route runs north', 'Starts 4 pm'):
            with self.subTest(text=text), self.assertRaisesRegex(ValidationError, 'operational detail'):
                self.check(self.mutated(announcement=text))
        self.check(self.mutated(note='Bus route drivers union; pay rise of 12.50 euros claimed.'))

    def test_dates_and_links_are_consistent(self):
        with self.assertRaisesRegex(ValidationError, 'after the planned action'):
            self.check(self.mutated(planned_start='2026-10-01'))
        with self.assertRaisesRegex(ValidationError, 'range precision'):
            self.check(self.mutated(date_precision='range'))
        with self.assertRaisesRegex(ValidationError, 'end precedes'):
            self.check(self.mutated(planned_end='2026-10-06'))
        with self.assertRaisesRegex(ValidationError, 'published episode'):
            self.check(self.mutated(event_id='fr-unknown'))
        self.check(self.mutated(event_id=None, planned_end='2026-10-09', date_precision='range'))

    def test_sources_are_local_unique_and_dated_honestly(self):
        data = manifest()
        data['items'][0]['sources'][0]['id'] = 'fr-schools-reuters'
        data['items'][0]['source_ids'] = ['fr-schools-reuters']
        with self.assertRaisesRegex(ValidationError, 'collide'):
            self.check(data)
        data = manifest()
        data['items'][0]['sources'][0]['accessed_at'] = '2026-10-02'
        with self.assertRaisesRegex(ValidationError, 'actual access timestamp'):
            self.check(data)
        data = manifest()
        data['items'][0]['sources'][0]['accessed_at'] = '2026-10-03T01:00:00Z'
        with self.assertRaises(ValidationError):
            self.check(data)
        data = manifest()
        data['items'].append(copy.deepcopy(data['items'][0]))
        with self.assertRaisesRegex(ValidationError, 'duplicate'):
            self.check(data)

    def test_unknown_fields_and_countries_are_rejected(self):
        with self.assertRaisesRegex(ValidationError, 'exactly'):
            self.check(self.mutated(organiser_phone='000'))
        with self.assertRaisesRegex(ValidationError, 'catalog'):
            self.check(self.mutated(country='ZZ'))


if __name__ == '__main__':
    unittest.main()
