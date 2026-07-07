-- ============================================================
-- MARKUP 2026 - FULL SUPABASE / POSTGRESQL DATABASE SCHEMA
-- ============================================================

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT colleges_pkey PRIMARY KEY (id),
  CONSTRAINT colleges_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- 2. SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.slots (
  id TEXT NOT NULL,
  label TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT slots_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  college_id UUID NULL,
  leader_id UUID NULL,
  r1_avg_score NUMERIC NULL,
  r2_video_link TEXT NULL,
  qualified_r3 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges (id) ON DELETE CASCADE,
  CONSTRAINT teams_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.students (id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_teams_college_id ON public.teams USING btree (college_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams USING btree (leader_id) TABLESPACE pg_default;

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college_id UUID NOT NULL,
  slot_id TEXT NULL,
  round1_status TEXT NULL DEFAULT 'not-started'::text,
  round2_status TEXT NULL DEFAULT 'not-submitted'::text,
  round3_status TEXT NULL DEFAULT 'not-submitted'::text,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, NOW()),
  r1_score NUMERIC NULL,
  r2_score NUMERIC NULL,
  r3_score NUMERIC NULL,
  r2_link TEXT NULL,
  r2_note TEXT NULL,
  r3_link TEXT NULL,
  r3_note TEXT NULL,
  team_id UUID NULL,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_email_key UNIQUE (email),
  CONSTRAINT students_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges (id) ON DELETE CASCADE,
  CONSTRAINT fk_slot FOREIGN KEY (slot_id) REFERENCES public.slots (id),
  CONSTRAINT students_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_students_team_id ON public.students USING btree (team_id) TABLESPACE pg_default;

-- 5. JUDGES TABLE (Includes slot_id assignment for slot-specific reviews)
CREATE TABLE IF NOT EXISTS public.judges (
  id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  dept TEXT NOT NULL,
  college_id UUID NOT NULL,
  slot_ids TEXT[] NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT judges_pkey PRIMARY KEY (id),
  CONSTRAINT judges_email_key UNIQUE (email),
  CONSTRAINT judges_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_judges_college_id ON public.judges USING btree (college_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_judges_slot_ids ON public.judges USING gin (slot_ids) TABLESPACE pg_default;

-- 6. SCORES TABLE
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  round TEXT NOT NULL DEFAULT 'round1'::text,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 40,
  started_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, NOW()),
  submitted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, NOW()),
  proctoring_flagged BOOLEAN NULL DEFAULT FALSE,
  proctoring_note TEXT NULL,
  CONSTRAINT scores_pkey PRIMARY KEY (id),
  CONSTRAINT scores_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 7. QUESTION BANK TABLE
CREATE TABLE IF NOT EXISTS public."Question_bank" (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  "Question" TEXT NOT NULL,
  "Option A" TEXT NOT NULL,
  "Option B" TEXT NOT NULL,
  "Option C" TEXT NOT NULL,
  "Option D" TEXT NOT NULL,
  "Correct Option" TEXT NOT NULL,
  "Difficulty" TEXT NOT NULL,
  CONSTRAINT question_bank_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 8. COLLEGE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.college_settings (
  college_id UUID NOT NULL,
  round1_status TEXT NOT NULL DEFAULT 'not-started',
  round2_status TEXT NOT NULL DEFAULT 'not-submitted',
  round3_status TEXT NOT NULL DEFAULT 'not-submitted',
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT college_settings_pkey PRIMARY KEY (college_id),
  CONSTRAINT college_settings_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Function to synchronize inserted score into students table
CREATE OR REPLACE FUNCTION public.sync_student_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.round = 'round1' THEN
    UPDATE public.students
    SET r1_score = NEW.score,
        round1_status = 'submitted'
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute after score insertion
DROP TRIGGER IF EXISTS after_score_insert ON public.scores;
CREATE TRIGGER after_score_insert
AFTER INSERT ON public.scores
FOR EACH ROW
EXECUTE FUNCTION public.sync_student_scores();
