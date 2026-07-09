-- Update candidate_files file_type check constraint to include all used types

-- First, drop existing constraint if exists
ALTER TABLE public.candidate_files
  DROP CONSTRAINT IF EXISTS candidate_files_file_type_check;

-- Add new check constraint with allowed file types
ALTER TABLE public.candidate_files
  ADD CONSTRAINT candidate_files_file_type_check
  CHECK (file_type IN ('ticket', 'contract', 'scar_photo', 'document_scan', 'other'));
