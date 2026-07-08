alter table public.candidates
  add column if not exists age text,
  add column if not exists citizen_rf text default null,
  add column if not exists health_group_reason text,
  add column if not exists other_health_issues text,
  add column if not exists criminal_record text,
  add column if not exists criminal_article text,
  add column if not exists foreign_documents text,
  add column if not exists driver_license text,
  add column if not exists family_relation text,
  add column if not exists departure_datetime timestamptz,
  add column if not exists reason_for_failure text,
  add column if not exists failure_comment text,
  add column if not exists last_activity_at timestamptz,
  add column if not exists last_manager_login_at timestamptz;

-- Ensure arrays for multi-select fields
do $$
begin
  -- diseases and documents should be text arrays for multi-select
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'candidates' and column_name = 'diseases' and data_type = 'ARRAY'
  ) then
    alter table public.candidates alter column diseases type text[] using array[diseases];
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'candidates' and column_name = 'documents' and data_type = 'ARRAY'
  ) then
    alter table public.candidates alter column documents type text[] using array[documents];
  end if;
end
$$;

-- Enum-like check constraints (optional but helpful)
-- We keep these loose to avoid breaking on future Bitrix values
