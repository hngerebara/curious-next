-- Additive activity modes. Existing frozen JSON and evidence remain unchanged.
ALTER TABLE learning_attempt DROP CONSTRAINT learning_attempt_mode_check;
ALTER TABLE learning_attempt ADD CONSTRAINT learning_attempt_mode_check
 CHECK (mode IN ('practice','independent','recall','transfer'));
