-- Таблица разделов обучения
CREATE TABLE IF NOT EXISTS training_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    source_sheet text NOT NULL,
    description text,
    passing_score int NOT NULL DEFAULT 85,
    order_index int NOT NULL DEFAULT 0,
    is_final boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Таблица вопросов
CREATE TABLE IF NOT EXISTS training_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    options jsonb NOT NULL DEFAULT '[]'::jsonb,
    correct_answer text NOT NULL,
    explanation text,
    source_row_data jsonb DEFAULT '{}'::jsonb,
    question_type text DEFAULT 'single_choice',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Таблица попыток
CREATE TABLE IF NOT EXISTS training_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
    score int NOT NULL DEFAULT 0,
    passing_score int NOT NULL DEFAULT 85,
    passed boolean NOT NULL DEFAULT false,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_final boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Таблица прогресса
CREATE TABLE IF NOT EXISTS training_progress (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'not_started',
    best_score int NOT NULL DEFAULT 0,
    attempts_count int NOT NULL DEFAULT 0,
    last_attempt_at timestamptz,
    completed_at timestamptz,
    PRIMARY KEY (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_training_questions_module ON training_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_training_attempts_user ON training_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_training_attempts_module ON training_attempts(module_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_order ON training_modules(order_index);

-- RLS
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_modules_read_all ON training_modules;
CREATE POLICY training_modules_read_all ON training_modules FOR SELECT USING (true);

DROP POLICY IF EXISTS training_questions_read_all ON training_questions;
CREATE POLICY training_questions_read_all ON training_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS training_attempts_user ON training_attempts;
CREATE POLICY training_attempts_user ON training_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS training_progress_user ON training_progress;
CREATE POLICY training_progress_user ON training_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow service role bypass (implicit)
