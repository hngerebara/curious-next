-- Enforce learner-wide submission request identity without rewriting old sessions.
CREATE UNIQUE INDEX tutor_submission_owner_key ON tutor_session
 (learner_id, (snapshot->'submission'->>'key'))
 WHERE snapshot->'submission' IS NOT NULL;
