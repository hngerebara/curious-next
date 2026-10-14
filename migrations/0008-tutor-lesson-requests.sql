CREATE TABLE tutor_lesson_request (
 learner_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
 request_key text NOT NULL,
 path_id text NOT NULL,
 module_id text NOT NULL,
 session_id text NOT NULL REFERENCES tutor_session(id) ON DELETE CASCADE,
 PRIMARY KEY (learner_id, request_key)
);
INSERT INTO tutor_lesson_request (learner_id,request_key,path_id,module_id,session_id)
SELECT learner_id,request_key,path_id,snapshot->'module'->>'id',id FROM tutor_session;
