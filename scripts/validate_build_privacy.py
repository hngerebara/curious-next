"""Reject private development files in Next.js deployment traces."""
import json
from pathlib import Path


def validate(root):
    traces = list(root.rglob('*.nft.json'))
    if not traces:
        return ['production build traces missing, run npm run build first']
    errors = []
    for trace in traces:
        for entry in json.loads(trace.read_text()).get('files', []):
            parts = Path(entry).parts
            name = Path(entry).name
            if any(part in {'.local-mail', '.auth-test'} for part in parts) or (name.startswith('.env') and name != '.env.example'):
                errors.append(f'{trace.name}: private development file included')
    return errors


if __name__ == '__main__':
    errors = validate(Path('.next/server'))
    for error in errors:
        print('ERROR: ' + error)
    print('FAIL: build privacy' if errors else 'PASS: private development files excluded from deployment traces')
    raise SystemExit(bool(errors))
