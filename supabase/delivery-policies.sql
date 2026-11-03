-- Lets a finished world be recorded against the client's project.
-- Two things block delivery today: projects_update_own only accepts updates to
-- rows still in DRAFT and only writes back DRAFT/SUBMITTED, and worlds has no
-- write policy at all. Run in Supabase Dashboard -> SQL Editor. Idempotent.

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and status in (
      'DRAFT', 'SUBMITTED', 'REVIEWING', 'ASSETS_RECEIVED',
      'PROCESSING', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'COMPLETED'
    )
    and (
      company_id is null
      or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
    )
  );

drop policy if exists "worlds_insert_own" on public.worlds;
create policy "worlds_insert_own" on public.worlds
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "worlds_update_own" on public.worlds;
create policy "worlds_update_own" on public.worlds
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Confirmation: expect five project_files/worlds-related rows plus the project policy.
select c.relname as table_name, pol.polname,
  case pol.polcmd when 'r' then 'select' when 'a' then 'insert'
                  when 'w' then 'update' when 'd' then 'delete' else 'all' end as command
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where c.relname in ('projects', 'worlds')
order by 1, 3;
