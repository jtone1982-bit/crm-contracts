-- Create alerts tables for CRM Контракты
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    title text NOT NULL,
    body text,
    importance text DEFAULT 'Обычная',
    target_manager_ids uuid[] DEFAULT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.alert_reads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE,
    manager_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at timestamptz DEFAULT now(),
    UNIQUE(alert_id, manager_id)
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_reads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;
CREATE POLICY "Admins can manage alerts" ON public.alerts
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "All can view alerts" ON public.alerts;
CREATE POLICY "All can view alerts" ON public.alerts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Managers can mark reads" ON public.alert_reads;
CREATE POLICY "Managers can mark reads" ON public.alert_reads
    FOR ALL USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Admins can manage alert_reads" ON public.alert_reads;
CREATE POLICY "Admins can manage alert_reads" ON public.alert_reads
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Verify
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('alerts', 'alert_reads');
