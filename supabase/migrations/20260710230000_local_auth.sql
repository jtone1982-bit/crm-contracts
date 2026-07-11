-- Add local auth columns to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'manager';

-- Fill email from auth.users if available (Supabase migration path)
-- For local-only setup, this will be populated during registration

-- Ensure existing admin keeps role
UPDATE public.profiles SET role = COALESCE(role, 'manager'), approved = COALESCE(approved, false), active = COALESCE(active, true);
