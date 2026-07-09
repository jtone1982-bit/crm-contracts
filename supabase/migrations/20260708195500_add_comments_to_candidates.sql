-- Add missing comments column to candidates
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS comments text;
