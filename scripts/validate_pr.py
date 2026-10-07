"""Validate PR structure. Reviewers assess meaning and evidence."""
import argparse
import json
from pathlib import Path
import re

HEADINGS = ['What does this PR do?', 'Related tickets', 'Screenshots', 'How to test', 'Additional notes']


def validate(title, body):
    errors = []
    if not title.strip() or len(title) > 50:
        errors.append('PR title must contain 1-50 characters')
    headings = re.findall(r'^### (.+)$', body, re.M)
    if headings != HEADINGS:
        errors.append('PR sections must match the required headings and order')
    for heading in HEADINGS[:-1]:
        marker = '### ' + heading
        if marker in body:
            content = body.split(marker, 1)[1].split('\n### ', 1)[0].strip()
            if not content or content.lower() in {'tbd', 'todo', '(describe the changes here)'}:
                errors.append(f'{heading}: provide concrete content')
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--event')
    parser.add_argument('--title')
    parser.add_argument('--body-file')
    args = parser.parse_args()
    if args.event:
        pr = json.loads(Path(args.event).read_text())['pull_request']
        title, body = pr['title'], pr.get('body') or ''
    else:
        title, body = args.title or '', Path(args.body_file).read_text()
    errors = validate(title, body)
    for error in errors:
        print('ERROR: ' + error)
    print('FAIL: PR structure' if errors else 'PASS: PR structure')
    raise SystemExit(bool(errors))
