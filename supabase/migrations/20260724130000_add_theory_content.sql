-- Add content JSONB field to training_modules
ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '[]'::jsonb;

-- Add theory_progress table to track viewed content
CREATE TABLE IF NOT EXISTS training_theory_progress (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
    viewed boolean NOT NULL DEFAULT false,
    viewed_at timestamptz,
    PRIMARY KEY (user_id, module_id)
);

ALTER TABLE training_theory_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_theory_progress_user ON training_theory_progress;
CREATE POLICY training_theory_progress_user ON training_theory_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
