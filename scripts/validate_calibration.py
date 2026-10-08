"""Validate synthetic calibration fixtures, not learner submissions or model accuracy."""
import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate(pack, root=ROOT):
    errors = []
    if pack.get('format_version') != 1 or pack.get('release_status') != 'draft':
        errors.append('fixtures must remain explicitly draft, format 1')
    rubrics = pack.get('rubrics', {})
    for version, rubric in rubrics.items():
        path = root / rubric['path']
        if not path.is_file() or rubric['heading'] not in path.read_text().splitlines():
            errors.append(f'{version}: rubric document/version missing')
        elif rubric.get('sha256') != hashlib.sha256(path.read_bytes()).hexdigest():
            errors.append(f'{version}: stale rubric fingerprint, review fixture judgments before updating')
        elif any(f'| {criterion} ' not in path.read_text() for criterion in rubric['criteria']):
            errors.append(f'{version}: criterion missing from rubric')
    seen = set()
    for case in pack.get('cases', []):
        identifier = case['id']
        if identifier in seen:
            errors.append(f'{identifier}: duplicate fixture')
        seen.add(identifier)
        rubric = rubrics.get(case['rubric_version'])
        if not rubric:
            errors.append(f'{identifier}: unknown rubric')
            continue
        scores = case['expected']['criteria']
        if set(scores) != set(rubric['criteria']) or not set(scores.values()) <= {'met', 'unmet', 'uncertain'}:
            errors.append(f'{identifier}: incomplete or invalid criterion judgments')
            continue
        if case['assistance'] not in {'none', 'substantive', 'accessibility'} or case['evidence_kind'] not in {'initial', 'recall', 'transfer'} or case['assessment_status'] not in {'succeeded', 'uncertain', 'failed'}:
            errors.append(f'{identifier}: unsupported evidence metadata')
            continue
        if case['policy_version'] != 'reference-evidence-v1' or not case['submission'] or not case['note']:
            errors.append(f'{identifier}: missing provenance/submission')
        if case['rubric_version'] == 'CY-2-v2':
            actions = case['submission'].get('actions', {})
            chosen = [action for choices in actions.values() for action in choices]
            if set(actions) != {'closure', 'reminder'} or not set(chosen) <= {'verify', 'use-link', 'send-password', 'report-known', 'delete', 'continue-routine'}:
                errors.append(f'{identifier}: invalid scenario actions')
            if {'use-link', 'send-password'}.intersection(chosen) and scores['C2'] != 'unmet':
                errors.append(f'{identifier}: unsafe action cannot pass Safe action')
        if case['assessment_status'] == 'failed':
            outcome = 'unavailable'
        elif case['assessment_status'] == 'uncertain' or 'uncertain' in scores.values():
            outcome = 'pending'
        elif 'unmet' in scores.values() or case['assistance'] == 'substantive':
            outcome = 'developing'
        elif case['evidence_kind'] == 'recall':
            outcome = 'recall-recorded'
        elif case['evidence_kind'] == 'transfer':
            outcome = 'transfer-recorded'
        else:
            outcome = 'demonstrated'
        if case['expected']['outcome'] != outcome:
            errors.append(f'{identifier}: unsafe or inconsistent evidence outcome')
    if not seen:
        errors.append('calibration pack is empty')
    return errors


if __name__ == '__main__':
    data = json.loads((ROOT / 'docs/curriculum/calibration-fixtures.json').read_text())
    problems = validate(data)
    for problem in problems:
        print(f'ERROR: {problem}')
    print(f'{"FAIL" if problems else "PASS"}: {len(data["cases"])} synthetic calibration fixtures (no assessor run)')
    raise SystemExit(bool(problems))
