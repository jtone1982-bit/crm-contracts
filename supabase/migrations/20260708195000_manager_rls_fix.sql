-- RLS policies to allow managers to update candidates, upload files, and send messages

-- Candidates: admins can do everything, managers can update their own
DROP POLICY IF EXISTS candidates_update_managers ON public.candidates;
CREATE POLICY candidates_update_managers
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR p.id = manager_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'admin' OR p.id = manager_id)
    )
  );

-- Candidate files: managers can add files to their own candidates
DROP POLICY IF EXISTS candidate_files_insert_managers ON public.candidate_files;
CREATE POLICY candidate_files_insert_managers
  ON public.candidate_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE c.id = candidate_id
        AND (p.role = 'admin' OR c.manager_id = p.id)
    )
  );

-- Messages: authenticated users can send messages (general and private)
DROP POLICY IF EXISTS messages_insert_authenticated ON public.messages;
CREATE POLICY messages_insert_authenticated
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Messages: users can read general chat and their own private messages
DROP POLICY IF EXISTS messages_select_authenticated ON public.messages;
CREATE POLICY messages_select_authenticated
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    is_general = true
    OR sender_id = auth.uid()
    OR receiver_id = auth.uid()
  );
