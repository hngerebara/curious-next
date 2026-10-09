import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('build_privacy', Path(__file__).resolve().parents[1] / 'scripts/validate_build_privacy.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BuildPrivacyTests(unittest.TestCase):
    def test_requires_build_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertTrue(module.validate(Path(directory)))

    def test_rejects_private_paths_without_exposing_filename(self):
        for entry in ['../../.env.local', '../../.local-mail/message-secret.json', '../../.auth-test/session.json']:
            with self.subTest(entry=entry), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root / 'page.nft.json').write_text(json.dumps({'files': [entry]}))
                errors = module.validate(root)
                self.assertTrue(errors)
                self.assertNotIn('secret', '\n'.join(errors))

    def test_allows_public_and_dependency_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'page.nft.json').write_text(json.dumps({'files': ['../../node_modules/pg/lib/index.js', '../../.env.example']}))
            self.assertEqual(module.validate(root), [])
