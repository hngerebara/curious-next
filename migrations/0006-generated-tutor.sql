-- Additive owned paths, isolated from legacy curriculum and attempt tables.
CREATE TABLE tutor_path (
  id text PRIMARY KEY,
  learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  request_key text NOT NULL,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learner_id, request_key)
);
CREATE INDEX tutor_path_owner_created ON tutor_path(learner_id, created_at DESC);
