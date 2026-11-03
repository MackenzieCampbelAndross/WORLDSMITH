-- Repairs floor-plan uploads: the private project-files bucket, its storage policies,
-- and the project_files table policies.
-- Run in Supabase Dashboard -> SQL Editor. Idempotent, touches no existing rows.
--
-- The storage policies call a security-definer helper instead of an inline subquery
-- because the storage service evaluates them in its own request context, where the
-- inline subquery against public.projects is filtered by that table's RLS and
-- evaluates false for every upload.

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do update set public = false;

create or replace function public.owns_project_folder(folder text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id::text = folder and p.owner_id = auth.uid()
  );
$$;
grant execute on function public.owns_project_folder(text) to authenticated;

drop policy if exists "project_files_storage_select" on storage.objects;
create policy "project_files_storage_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'project-files'
    and public.owns_project_folder((storage.foldername(name))[1])
  );

drop policy if exists "project_files_storage_insert" on storage.objects;
create policy "project_files_storage_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'project-files'
    and public.owns_project_folder((storage.foldername(name))[1])
  );

drop policy if exists "project_files_storage_update" on storage.objects;
create policy "project_files_storage_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'project-files'
    and public.owns_project_folder((storage.foldername(name))[1])
  ) with check (
    bucket_id = 'project-files'
    and public.owns_project_folder((storage.foldername(name))[1])
  );

drop policy if exists "project_files_storage_delete" on storage.objects;
create policy "project_files_storage_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'project-files'
    and public.owns_project_folder((storage.foldername(name))[1])
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

-- Confirmation. Expect four storage rows (two say "insert"/"select"...), four table rows.
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
