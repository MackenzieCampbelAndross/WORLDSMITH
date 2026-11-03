-- Recreate the private project-files bucket, its owner-only storage policies and the
-- project_files table policies. This is what fixes "new row violates row-level security
-- policy" when a client uploads a floor plan: the upload inserts a row into
-- storage.objects and then a record into project_files, and both need an INSERT policy.
-- Run in Supabase Dashboard -> SQL Editor. Idempotent, touches no existing rows.

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do update set public = false;

drop policy if exists "project_files_storage_select" on storage.objects;
create policy "project_files_storage_select" on storage.objects
  for select using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_storage_insert" on storage.objects;
create policy "project_files_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_storage_update" on storage.objects;
create policy "project_files_storage_update" on storage.objects
  for update using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_storage_delete" on storage.objects;
create policy "project_files_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

alter table public.project_files enable row level security;

grant select, insert, update, delete on public.project_files to authenticated;

drop policy if exists "project_files_select_own" on public.project_files;
create policy "project_files_select_own" on public.project_files
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_insert_own" on public.project_files;
create policy "project_files_insert_own" on public.project_files
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_update_own" on public.project_files;
create policy "project_files_update_own" on public.project_files
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_files_delete_own" on public.project_files;
create policy "project_files_delete_own" on public.project_files
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.owner_id = auth.uid()
    )
  );

-- Confirmation. Expect four project_files rows, four objects rows and one bucket row.
select c.relname as table_name, pol.polname,
  case pol.polcmd
    when 'r' then 'select' when 'a' then 'insert'
    when 'w' then 'update' when 'd' then 'delete' else 'all'
  end as command
from pg_policy pol
join pg_class c on c.oid = pol.polrelid
where c.relname in ('project_files', 'objects')
order by 1, 3;

select id, public as is_public from storage.buckets where id = 'project-files';
