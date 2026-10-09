ALTER TABLE preview_enrollment ADD COLUMN preferences jsonb;
CREATE INDEX preview_enrollment_owner_created ON preview_enrollment(learner_id, created_at);
