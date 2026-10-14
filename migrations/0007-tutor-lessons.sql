CREATE TABLE tutor_session (
 id text PRIMARY KEY,
 learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 path_id text NOT NULL REFERENCES tutor_path(id) ON DELETE CASCADE,
 request_key text NOT NULL,
 revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
 snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (learner_id, request_key)
);
CREATE INDEX tutor_session_owner_path ON tutor_session(learner_id,path_id,created_at DESC);
