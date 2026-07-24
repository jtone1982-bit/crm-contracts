-- Convert correct_answer to jsonb to support multiple correct answers
ALTER TABLE training_questions ALTER COLUMN correct_answer TYPE jsonb USING to_jsonb(correct_answer);
