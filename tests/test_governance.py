"""Ensure governance failures are caught, rather than testing regex internals."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('checker', ROOT / 'scripts/validate_repo.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class GovernanceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for p in ROOT.glob('*.md'):
            shutil.copy(p, self.root / p.name)
        shutil.copytree(ROOT / 'docs', self.root / 'docs')
        shutil.copytree(ROOT / '.github', self.root / '.github')
        for folder in ('src', 'migrations', 'tests'):
            if (ROOT / folder).exists():
                shutil.copytree(ROOT / folder, self.root / folder, ignore=shutil.ignore_patterns('__pycache__'))
        self.config = json.loads((self.root / 'docs/governance.json').read_text())

    def tearDown(self):
        self.temp.cleanup()

    def source(self, path, text):
        p = self.root / 'src' / path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)

    def test_current_repository(self):
        self.assertEqual(checker.validate(self.root), [])

    def test_broken_link_and_stale_content(self):
        p = self.root / 'Plans.md'
        p.write_text(p.read_text() + '\n[Missing](absent.md)\n')
        errors = checker.validate(self.root)
        self.assertTrue(any('broken link' in e for e in errors))
        self.assertTrue(any('fingerprints stale' in e for e in errors))
        self.assertTrue(checker.validate(self.root, refresh=True))

    def test_missing_milestone(self):
        p = self.root / 'Documentation.md'
        p.write_text('\n'.join(l for l in p.read_text().splitlines() if not l.startswith('| M3 |')))
        self.assertTrue(any('status rows' in e for e in checker.validate(self.root)))

    def test_missing_fractional_milestone(self):
        p = self.root / 'Documentation.md'
        p.write_text('\n'.join(l for l in p.read_text().splitlines() if not l.startswith('| M1.5 |')))
        self.assertTrue(any('status rows' in e for e in checker.validate(self.root)))

    def test_valid_dependencies(self):
        self.source('application/use-case.ts', 'import { rule } from "../domain/rule"\n')
        self.source('domain/rule.ts', 'export const rule = true\n')
        self.assertEqual(checker.source_errors(self.root, self.config), [])

    def test_reverse_dependency_and_reexport(self):
        self.source('domain/rule.ts', 'export { store } from "../adapters/store"\n')
        self.assertTrue(any('domain -> adapters' in e for e in checker.source_errors(self.root, self.config)))

    def test_external_computed_and_multiline_imports(self):
        self.source('domain/rule.ts', 'import fs from "node:fs"\nimport(variable)\nimport {\n thing\n} from "../contracts/types"\n')
        errors = checker.source_errors(self.root, self.config)
        self.assertTrue(any('external' in e for e in errors))
        self.assertTrue(any('computed' in e for e in errors))
        self.assertTrue(any('multiline' in e for e in errors))

    def test_framework_bridge(self):
        self.source('app/page.tsx', 'export { HomePage as default } from "../bootstrap/home"\n')
        self.assertEqual(checker.source_errors(self.root, self.config), [])

    def test_framework_rejects_logic_and_provider_bypass(self):
        self.source('app/api/route.ts', 'export { GET } from "../../adapters/auth"\nexport const secret = process.env.SECRET\n')
        errors = checker.source_errors(self.root, self.config)
        self.assertTrue(any('app -> adapters' in e for e in errors))
        self.assertTrue(any('only re-export' in e for e in errors))

    def test_framework_rejects_external_and_reverse_imports(self):
        self.source('app/page.tsx', 'export { handler } from "better-auth"\n')
        self.source('ui/page.tsx', 'import page from "../app/page"\n')
        errors = checker.source_errors(self.root, self.config)
        self.assertTrue(any('only re-export' in e for e in errors))
        self.assertTrue(any('ui -> app' in e for e in errors))

    def test_framework_rejects_same_layer_bypass(self):
        self.source('app/page.tsx', 'export { handler } from "./other-page"\n')
        self.assertTrue(any('only re-export' in e for e in checker.source_errors(self.root, self.config)))

    def test_ignored_dependencies_are_not_governed(self):
        (self.root / 'node_modules/unused').mkdir(parents=True)
        (self.root / 'node_modules/unused/README.md').write_text('# Dependency\n')
        self.assertEqual(checker.validate(self.root), [])

    def test_taste_and_size(self):
        self.source('ui/BadName.ts', 'console.log("private")\ntry {} catch {}\n' + '\n' * 301)
        errors = checker.source_errors(self.root, self.config)
        self.assertTrue(any('kebab-case' in e for e in errors))
        self.assertTrue(any('line limit' in e for e in errors))
        self.assertTrue(any('taste' in e for e in errors))

    def test_required_document_sections(self):
        p = self.root / 'Plans.md'
        p.write_text(p.read_text().replace('## Milestones', '## Removed section'))
        self.assertTrue(any('missing heading ## Milestones' in e for e in checker.validate(self.root)))

    def test_unregistered_document(self):
        (self.root / 'unregistered.md').write_text('# Extra\n')
        self.assertTrue(any('registry mismatch' in e for e in checker.validate(self.root)))


if __name__ == '__main__':
    unittest.main()
