import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pr', Path(__file__).resolve().parents[1] / 'scripts/validate_pr.py')
pr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pr)


class PRTests(unittest.TestCase):
    def body(self):
        return '\n\n'.join('### ' + h + '\n\nSpecific evidence.' for h in pr.HEADINGS)

    def test_valid(self):
        self.assertEqual(pr.validate('A' * 50, self.body()), [])

    def test_long_title(self):
        self.assertTrue(pr.validate('A' * 51, self.body()))

    def test_missing_and_empty_sections(self):
        self.assertTrue(pr.validate('Change', '### What does this PR do?\n'))

    def test_additional_notes_optional_content(self):
        self.assertEqual(pr.validate('Change', self.body().rsplit('Specific evidence.', 1)[0]), [])
