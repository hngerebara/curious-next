"""Catch unsafe expectations and broken rubric provenance in review fixtures."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('calibration', ROOT / 'scripts/validate_calibration.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class CalibrationTests(unittest.TestCase):
    def setUp(self):
        self.pack = json.loads((ROOT / 'docs/curriculum/calibration-fixtures.json').read_text())

    def case(self, identifier):
        return next(case for case in self.pack['cases'] if case['id'] == identifier)

    def test_review_pack(self):
        self.assertEqual(checker.validate(self.pack), [])

    def test_assistance_cannot_be_independent_demonstration(self):
        self.case('AI-substantive-help')['expected']['outcome'] = 'demonstrated'
        self.assertTrue(any('evidence outcome' in error for error in checker.validate(self.pack)))

    def test_dangerous_choice_overrides_fluent_reasoning(self):
        self.case('CY-dangerous-choice')['expected']['criteria']['C2'] = 'met'
        self.assertTrue(any('unsafe action' in error for error in checker.validate(self.pack)))

    def test_failed_assessment_awards_nothing(self):
        case = self.case('AI-assessment-failed')
        case['expected']['criteria'] = {key: 'met' for key in case['expected']['criteria']}
        case['expected']['outcome'] = 'demonstrated'
        self.assertTrue(any('evidence outcome' in error for error in checker.validate(self.pack)))

    def test_recall_and_transfer_are_separate(self):
        for identifier in ('CY-recall-policy', 'CY-transfer-policy'):
            self.case(identifier)['expected']['outcome'] = 'demonstrated'
        self.assertEqual(sum('evidence outcome' in error for error in checker.validate(self.pack)), 2)

    def test_duplicate_ids_and_wrong_versions_fail(self):
        self.pack['cases'].append(copy.deepcopy(self.pack['cases'][0]))
        self.pack['rubrics']['AI-2-v2']['heading'] = '## Rubric AI-2 v99'
        errors = checker.validate(self.pack)
        self.assertTrue(any('duplicate' in error for error in errors))
        self.assertTrue(any('document/version' in error for error in errors))

    def test_changed_rubric_requires_fixture_review(self):
        self.pack['rubrics']['AI-2-v2']['sha256'] = 'stale'
        self.assertTrue(any('stale rubric fingerprint' in error for error in checker.validate(self.pack)))


if __name__ == '__main__':
    unittest.main()
