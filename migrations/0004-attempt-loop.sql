CREATE TABLE learning_attempt (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 enrollment_id text NOT NULL REFERENCES preview_enrollment(id) ON DELETE CASCADE,
 request_key text NOT NULL, mode text NOT NULL CHECK (mode IN ('practice','independent')),
 task jsonb NOT NULL, draft jsonb NOT NULL, revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
 assisted boolean NOT NULL DEFAULT false, variant jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (learner_id,request_key)
);
CREATE INDEX attempt_enrollment ON learning_attempt(enrollment_id);
CREATE TABLE attempt_draft_revision (
 attempt_id text NOT NULL REFERENCES learning_attempt(id) ON DELETE CASCADE,
 revision integer NOT NULL, draft jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(attempt_id,revision)
);
CREATE TABLE attempt_lesson_variant (
 id text PRIMARY KEY, attempt_id text NOT NULL REFERENCES learning_attempt(id) ON DELETE CASCADE,
 level text NOT NULL, payload jsonb NOT NULL, UNIQUE(attempt_id,level)
);
CREATE TABLE practice_request (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 attempt_id text NOT NULL REFERENCES learning_attempt(id) ON DELETE CASCADE, request_key text NOT NULL,
 sequence integer NOT NULL, revision integer NOT NULL, prompt text NOT NULL, response text,
 state text NOT NULL CHECK(state IN ('pending','succeeded','failed')), code text, configuration text NOT NULL,
 calls integer NOT NULL DEFAULT 0 CHECK(calls BETWEEN 0 AND 3), lease text, lease_until timestamptz,
 UNIQUE(learner_id,request_key), UNIQUE(attempt_id,sequence)
);
CREATE TABLE attempt_assistance (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 attempt_id text NOT NULL REFERENCES learning_attempt(id) ON DELETE CASCADE, request_key text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('hint','worked_solution')), content text NOT NULL,
 delivered_at timestamptz NOT NULL DEFAULT now(), UNIQUE(learner_id,request_key)
);
CREATE TABLE attempt_submission (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 attempt_id text NOT NULL UNIQUE REFERENCES learning_attempt(id) ON DELETE CASCADE,
 request_key text NOT NULL, revision integer NOT NULL, hash text NOT NULL, frozen jsonb NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now(), UNIQUE(learner_id,request_key)
);
CREATE TABLE assessment_job (
 submission_id text PRIMARY KEY REFERENCES attempt_submission(id) ON DELETE CASCADE,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','succeeded','uncertain','failed')),
 claims integer NOT NULL DEFAULT 0 CHECK(claims BETWEEN 0 AND 3), lease text, lease_until timestamptz, configuration text
);
CREATE TABLE assessment_run (
 id text PRIMARY KEY, submission_id text NOT NULL REFERENCES attempt_submission(id) ON DELETE CASCADE,
 claim integer NOT NULL, decision jsonb NOT NULL, configuration text NOT NULL,
 assessed_at timestamptz NOT NULL DEFAULT now(), UNIQUE(submission_id,claim)
);
CREATE TABLE learning_evidence (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 enrollment_id text NOT NULL REFERENCES preview_enrollment(id) ON DELETE CASCADE,
 submission_id text NOT NULL UNIQUE REFERENCES attempt_submission(id) ON DELETE CASCADE, payload jsonb NOT NULL
);
CREATE TABLE learning_capability (
 enrollment_id text PRIMARY KEY REFERENCES preview_enrollment(id) ON DELETE CASCADE,
 learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, payload jsonb NOT NULL,
 recall_due_at timestamptz, transfer_available boolean NOT NULL DEFAULT false
);
CREATE TABLE learning_capability_change (
 evidence_id text PRIMARY KEY REFERENCES learning_evidence(id) ON DELETE CASCADE, before_state jsonb NOT NULL, after_state jsonb NOT NULL
);
CREATE TABLE learning_next (
 enrollment_id text PRIMARY KEY REFERENCES preview_enrollment(id) ON DELETE CASCADE,
 learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, payload jsonb NOT NULL
);
CREATE TABLE attempt_optional_review (
 submission_id text PRIMARY KEY REFERENCES attempt_submission(id) ON DELETE CASCADE, requested_at timestamptz NOT NULL DEFAULT now()
);
