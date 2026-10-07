import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pr', Path(__file__).resolve().parents[1] / 'scripts/validate_pr.py')
pr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pr)


class PRTests(unittest.TestCase):
    def body(self):
        return '\n\n'.join('### ' + h + '\n\n' + ('[THE-10](https://linear.app/the-curious-tech-girl/issue/THE-10/example)' if h == 'Related tickets' else 'Specific evidence.') for h in pr.HEADINGS)

    def test_valid(self):
        self.assertEqual(pr.validate('A' * 50, self.body()), [])

    def test_long_title(self):
        self.assertTrue(pr.validate('A' * 51, self.body()))

    def test_missing_and_empty_sections(self):
        self.assertTrue(pr.validate('Change', '### What does this PR do?\n'))

    def test_additional_notes_optional_content(self):
        self.assertEqual(pr.validate('Change', self.body().rsplit('Specific evidence.', 1)[0]), [])

    def test_missing_ticket(self):
        body = self.body().replace('https://linear.app/the-curious-tech-girl/issue/THE-10/example', 'https://example.com/ticket')
        self.assertTrue(any('Linear issue' in e for e in pr.validate('Change', body)))

    def test_wrong_workspace_and_ticket_section(self):
        body = self.body().replace('the-curious-tech-girl', 'another-workspace')
        self.assertTrue(pr.validate('Change', body))
        body = self.body().replace('### Related tickets', '### Other tickets')
        self.assertTrue(pr.validate('Change', body))
