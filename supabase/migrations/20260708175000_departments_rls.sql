alter table public.departments enable row level security;

-- Allow all authenticated users to read departments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'departments' 
    AND policyname = 'departments_select_authenticated'
  ) THEN
    CREATE POLICY departments_select_authenticated
    ON public.departments
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END
$$;

-- Allow admins full access to departments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'departments' 
    AND policyname = 'departments_admin_all'
  ) THEN
    CREATE POLICY departments_admin_all
    ON public.departments
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );
  END IF;
END
$$;
