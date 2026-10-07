"""Conservative repository governance checks, standard library only."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', 'node_modules', '.next', '.venv', '__pycache__', 'dist'}


def paths(root):
    return [p for p in root.rglob('*') if p.is_file() and not SKIP.intersection(p.relative_to(root).parts)]


def source_errors(root, config):
    errors = []
    for p in paths(root / 'src') if (root / 'src').exists() else []:
        if p.suffix not in {'.ts', '.tsx', '.js', '.jsx'}:
            continue
        rel = p.relative_to(root)
        layer = rel.parts[1]
        text = p.read_text()
        def fail(message):
            errors.append(f'{rel}: {message}')
        if layer not in config['layers']:
            fail('unknown source layer')
            continue
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', p.stem):
            fail('use kebab-case filenames')
        if len(text.splitlines()) > config['max_source_lines']:
            fail('source line limit exceeded')
        for pattern in [r'\bconsole\s*[.\[]', r'@ts-(?:ignore|nocheck)', r'\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}', r'\bvoid\s+\w+\s*\(']:
            if re.search(pattern, text):
                fail(f'forbidden taste pattern {pattern}')
        # Import declarations must be single-line. Check re-exports and literal calls too.
        for line in text.splitlines():
            if re.match(r'\s*(?:import|export)\s', line) and ('from' in line or re.match(r'\s*import\s', line)):
                if not re.search(r'[\"\'][^\"\']+[\"\']', line):
                    fail('unsupported multiline import or re-export')
        for call in re.finditer(r'\b(?:import|require)\s*\((.*?)\)', text, re.S):
            if not re.fullmatch(r'\s*[\"\'][^\"\']+[\"\']\s*', call.group(1)):
                fail('computed imports forbidden')
        imports = re.findall(r'\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)[\"\']([^\"\']+)[\"\']', text)
        for target in imports:
            if not target.startswith('.'):
                if target.startswith(('@/', 'src/')) or (layer in ('contracts', 'domain') and target not in config['external_allowlist'][layer]):
                    fail(f'forbidden external or alias import {target}')
                continue
            resolved = (p.parent / target).resolve()
            try:
                parts = resolved.relative_to((root / 'src').resolve()).parts
            except ValueError:
                fail(f'import escapes source boundary: {target}')
                continue
            destination = parts[0]
            if destination != layer and destination not in config['layers'][layer]:
                fail(f'forbidden dependency {layer} -> {destination}')
            if resolved.suffix in {'.css', '.svg', '.png'} and layer != 'ui':
                fail('assets allowed only in UI')
    return errors


def validate(root, refresh=False, base=None):
    config = json.loads((root / 'docs/governance.json').read_text())
    errors = []
    markdown = {str(p.relative_to(root)): p for p in paths(root) if p.suffix == '.md'}
    if set(markdown) != set(config['documents']):
        errors.append('Markdown registry mismatch: register/remove documents in governance.json')
    for name, spec in config['documents'].items():
        p = root / name
        if not p.exists():
            errors.append(f'missing document {name}')
            continue
        text = p.read_text()
        if len(text.splitlines()) > config['max_document_lines']:
            errors.append(f'{name}: document line limit exceeded')
        for heading in spec['required_headings']:
            if heading not in text.splitlines():
                errors.append(f'{name}: missing heading {heading}')
        for link in re.findall(r'\]\(([^)]+)\)', text):
            if re.match(r'(?:https?://|mailto:|#)', link):
                continue
            target, _, anchor = link.partition('#')
            linked = p.parent / target
            if not linked.is_file():
                errors.append(f'{name}: broken link {link}')
            elif anchor and linked.suffix == '.md':
                headings = re.findall(r'^#+\s+(.+)$', linked.read_text(), re.M)
                slugs = [re.sub(r'[^\w\- ]', '', h.lower()).replace(' ', '-') for h in headings]
                if anchor not in slugs:
                    errors.append(f'{name}: missing anchor {link}')
    plan = (root / 'Plans.md').read_text()
    status = (root / 'Documentation.md').read_text()
    plan_ids = set(re.findall(r'^\| (M\d+) \|', plan, re.M))
    status_rows = re.findall(r'^\| (M\d+) \| (pending|in_progress|completed|blocked) \| (.+) \|$', status, re.M)
    if plan_ids != {row[0] for row in status_rows} or len(status_rows) != len(plan_ids):
        errors.append('milestone status rows must match plan IDs exactly')
    for milestone, state, evidence in status_rows:
        if state == 'completed' and (not evidence.strip() or evidence.strip().lower() in {'none', 'pending', 'tbd'}):
            errors.append(f'{milestone}: completion needs evidence')
    errors.extend(source_errors(root, config))
    hashes = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in config['documents'] if (root / name).exists()}
    hashes['docs/governance.json'] = hashlib.sha256((root / 'docs/governance.json').read_bytes()).hexdigest()
    state_file = root / 'docs/doc-state.json'
    if refresh:
        if not errors:
            state_file.write_text(json.dumps(hashes, indent=2, sort_keys=True) + '\n')
    elif not state_file.exists() or json.loads(state_file.read_text()) != hashes:
        errors.append('documentation fingerprints stale: review docs then run --refresh')
    if base:
        result = subprocess.run(['git', 'diff', '--name-only', f'{base}...HEAD'], cwd=root, capture_output=True, text=True)
        if result.returncode:
            errors.append('cannot inspect PR base for freshness')
        else:
            changed = result.stdout.splitlines()
            if any(p.startswith('src/') for p in changed) and 'Documentation.md' not in changed:
                errors.append('source changes require milestone/status evidence update')
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--base')
    args = parser.parse_args()
    problems = validate(ROOT, args.refresh, args.base)
    for problem in problems:
        print(f'ERROR: {problem}')
    print(f'{"FAIL" if problems else "PASS"}: repository governance')
    raise SystemExit(bool(problems))
