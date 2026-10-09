CREATE TABLE learner_goal (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 version integer NOT NULL, input jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(learner_id, version)
);
CREATE TABLE course_plan (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 goal_id text NOT NULL REFERENCES learner_goal(id) ON DELETE CASCADE,
 request_key text NOT NULL, catalogue_version text NOT NULL, configuration text NOT NULL,
 state text NOT NULL, result jsonb, attempts integer NOT NULL DEFAULT 0,
 lease text, lease_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(learner_id, request_key)
);
CREATE INDEX course_plan_owner_goal ON course_plan(learner_id, goal_id, created_at);
CREATE TABLE preview_enrollment (
 id text PRIMARY KEY, learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 plan_id text NOT NULL UNIQUE REFERENCES course_plan(id) ON DELETE CASCADE,
 placement jsonb, start_objective_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE enrollment_request (
 learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE, request_key text NOT NULL,
 plan_id text NOT NULL REFERENCES course_plan(id) ON DELETE CASCADE,
 PRIMARY KEY(learner_id, request_key)
);
