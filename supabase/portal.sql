-- Crestion Labs client portal: companies, richer projects, files, production, worlds, analytics.
-- Run after supabase/schema.sql in the Supabase SQL editor.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null default '',
  website text not null default '',
  details text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists company_id uuid;
alter table public.profiles add column if not exists notification_prefs jsonb not null
  default '{"production_updates":true,"review_requests":true,"world_ready":true,"newsletter":false}'::jsonb;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.profiles
    add constraint profiles_company_id_fkey foreign key (company_id)
    references public.companies (id) on delete set null;
exception when duplicate_object then null;
end $$;

insert into public.companies (owner_id, name)
select p.id, p.company_name
from public.profiles p
where not exists (select 1 from public.companies c where c.owner_id = p.id);

update public.profiles p
set company_id = c.id
from public.companies c
where c.owner_id = p.id and p.company_id is null;

alter table public.projects add column if not exists company_id uuid references public.companies (id) on delete set null;
alter table public.projects add column if not exists developer text not null default '';
alter table public.projects add column if not exists development_stage text not null default '';
alter table public.projects add column if not exists buildings integer not null default 0 check (buildings >= 0);
alter table public.projects add column if not exists floors integer not null default 0 check (floors >= 0);
alter table public.projects add column if not exists units integer not null default 0 check (units >= 0);
alter table public.projects add column if not exists unit_types text[] not null default '{}'::text[];
alter table public.projects add column if not exists interior_style text not null default '';
alter table public.projects add column if not exists exterior_style text not null default '';
alter table public.projects add column if not exists materials text not null default '';
alter table public.projects add column if not exists landscape text not null default '';
alter table public.projects add column if not exists lighting text not null default '';
alter table public.projects add column if not exists reference_projects text not null default '';
alter table public.projects add column if not exists visualization_scope jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists cover_path text;
alter table public.projects add column if not exists submitted_at timestamptz;

alter table public.projects drop constraint if exists projects_status_check;
update public.projects
set status = case status
  when 'Draft' then 'DRAFT'
  when 'Processing' then 'PROCESSING'
  when 'Review' then 'INTERNAL_REVIEW'
  when 'World Ready' then 'COMPLETED'
  else upper(replace(status, ' ', '_'))
end;
alter table public.projects alter column status set default 'DRAFT';
alter table public.projects add constraint projects_status_check check (
  status in ('DRAFT','SUBMITTED','REVIEWING','ASSETS_RECEIVED','PROCESSING','INTERNAL_REVIEW','CLIENT_REVIEW','COMPLETED')
);

update public.projects p
set company_id = c.id
from public.companies c
where c.owner_id = p.owner_id and p.company_id is null;

alter table public.project_files add column if not exists category text not null default 'documents';
alter table public.project_files add column if not exists uploaded_by uuid references public.profiles (id) on delete set null;
alter table public.project_files add column if not exists processing_status text not null default 'pending';
alter table public.project_files add column if not exists mime_type text not null default '';
alter table public.project_files drop constraint if exists project_files_category_check;
alter table public.project_files add constraint project_files_category_check check (
  category in ('floor_plans','elevations','site_plans','cad','references','documents','models','textures','exports','other')
);
alter table public.project_files drop constraint if exists project_files_processing_status_check;
alter table public.project_files add constraint project_files_processing_status_check check (
  processing_status in ('pending','processing','complete','failed')
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','review','completed','failed')),
  current_stage_key text,
  progress integer not null default 0 check (progress between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.processing_stages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.processing_jobs (id) on delete cascade,
  stage_key text not null,
  label text not null,
  sort_order integer not null,
  state text not null default 'pending' check (state in ('pending','active','completed','failed')),
  started_at timestamptz,
  completed_at timestamptz,
  message text not null default '',
  unique (job_id, stage_key)
);

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  status text not null default 'processing' check (status in ('processing','review','ready','failed')),
  world_url text,
  preview_path text,
  share_slug text unique,
  embed_url text,
  glb_path text,
  fbx_path text,
  obj_path text,
  source_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  recorded_on date not null default current_date,
  visits integer not null default 0,
  unique_visitors integer not null default 0,
  avg_session_seconds integer not null default 0,
  areas jsonb not null default '{}'::jsonb,
  engagement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, recorded_on)
);

alter table public.activity add column if not exists event_type text not null default 'general';
alter table public.activity add column if not exists actor_id uuid references public.profiles (id) on delete set null;

create index if not exists projects_company_idx on public.projects (company_id);
create index if not exists project_files_category_idx on public.project_files (project_id, category);
create index if not exists processing_stages_job_idx on public.processing_stages (job_id, sort_order);
create index if not exists analytics_project_date_idx on public.project_analytics (project_id, recorded_on desc);

alter table public.companies enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.processing_stages enable row level security;
alter table public.worlds enable row level security;
alter table public.project_analytics enable row level security;

drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own" on public.companies
  for select using (owner_id = auth.uid());

drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own" on public.companies
  for insert with check (owner_id = auth.uid());

drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own" on public.companies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and email = coalesce(auth.jwt() ->> 'email', email)
    and (
      company_id is null
      or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    )
  );

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert with check (
    owner_id = auth.uid()
    and (
      company_id is null
      or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    )
  );

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (owner_id = auth.uid() and status = 'DRAFT')
  with check (
    owner_id = auth.uid()
    and status in ('DRAFT','SUBMITTED')
    and (
      company_id is null
      or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    )
  );

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete using (owner_id = auth.uid() and status = 'DRAFT');

drop policy if exists "project_files_update_own" on public.project_files;
drop policy if exists "processing_jobs_select_own" on public.processing_jobs;
create policy "processing_jobs_select_own" on public.processing_jobs
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "processing_stages_select_own" on public.processing_stages;
create policy "processing_stages_select_own" on public.processing_stages
  for select using (
    exists (
      select 1 from public.processing_jobs j
      join public.projects p on p.id = j.project_id
      where j.id = job_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "worlds_select_own" on public.worlds;
create policy "worlds_select_own" on public.worlds
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "analytics_select_own" on public.project_analytics;
create policy "analytics_select_own" on public.project_analytics
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

grant select, insert, update on public.companies to authenticated;
grant select on public.processing_jobs, public.processing_stages, public.worlds, public.project_analytics to authenticated;
revoke all on public.companies, public.processing_jobs, public.processing_stages, public.worlds, public.project_analytics from anon;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_company uuid;
begin
  -- companies.owner_id references profiles.id, so the profile must exist first.
  insert into public.profiles (id, email, first_name, last_name, company_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    company_name = excluded.company_name,
    phone = excluded.phone;

  insert into public.companies (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'company_name', ''))
  on conflict (owner_id) do update set name = excluded.name
  returning id into client_company;

  update public.profiles
  set company_id = coalesce(public.profiles.company_id, client_company)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_project_submitted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'SUBMITTED' and new.submitted_at is null then
    new.submitted_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists projects_set_submitted_at on public.projects;
create trigger projects_set_submitted_at
  before update on public.projects
  for each row execute function public.set_project_submitted_at();

create or replace function public.handle_project_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_job uuid;
begin
  if new.status <> 'SUBMITTED' or old.status is not distinct from 'SUBMITTED' then
    return new;
  end if;

  insert into public.processing_jobs (project_id, status, current_stage_key, progress)
  values (new.id, 'queued', 'PLAN_ANALYSIS', 0)
  on conflict (project_id) do nothing
  returning id into client_job;

  if client_job is null then
    select id into client_job from public.processing_jobs where project_id = new.id;
  end if;

  insert into public.processing_stages (job_id, stage_key, label, sort_order, state, completed_at)
  values
    (client_job, 'PLAN_RECEIVED', 'Plan Received', 1, 'completed', now()),
    (client_job, 'PLAN_ANALYSIS', 'Plan Analysis', 2, 'pending', null),
    (client_job, 'ARCHITECTURAL_RECONSTRUCTION', 'Architectural Reconstruction', 3, 'pending', null),
    (client_job, 'MODEL_GENERATION', '3D Model Generation', 4, 'pending', null),
    (client_job, 'MATERIALS', 'Material Generation', 5, 'pending', null),
    (client_job, 'LIGHTING', 'Lighting & Environment', 6, 'pending', null),
    (client_job, 'FURNISHING', 'Interior Furnishing', 7, 'pending', null),
    (client_job, 'OPTIMIZATION', 'World Optimization', 8, 'pending', null),
    (client_job, 'INTERNAL_REVIEW', 'Internal Review', 9, 'pending', null),
    (client_job, 'CLIENT_REVIEW', 'Client Review', 10, 'pending', null),
    (client_job, 'WORLD_READY', 'World Ready', 11, 'pending', null)
  on conflict (job_id, stage_key) do nothing;

  insert into public.activity (owner_id, project_id, project_name, message, event_type)
  values (new.owner_id, new.id, new.name, 'Project submitted for production', 'project_submitted');

  return new;
end;
$$;

drop trigger if exists projects_submitted on public.projects;
create trigger projects_submitted
  after update of status on public.projects
  for each row execute function public.handle_project_submitted();

drop trigger if exists companies_touch_updated_at on public.companies;
create trigger companies_touch_updated_at
  before update on public.companies
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists processing_jobs_touch_updated_at on public.processing_jobs;
create trigger processing_jobs_touch_updated_at
  before update on public.processing_jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists worlds_touch_updated_at on public.worlds;
create trigger worlds_touch_updated_at
  before update on public.worlds
  for each row execute function public.touch_updated_at();
