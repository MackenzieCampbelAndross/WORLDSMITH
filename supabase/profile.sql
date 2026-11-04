-- Crestion Labs Client Profile schema & storage definition.
--
-- Profile data is persisted into public.profiles and public.companies.
-- Custom JSON parameters (address, contacts, branding options, additional intake)
-- are stored cleanly in public.companies.details as a validated JSON object.
--
-- This script is idempotent and safe to run in Supabase SQL editor.

-- 1. Create client-assets storage bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('client-assets', 'client-assets', true)
on conflict (id) do update set public = true;

-- 2. Storage policies for authenticated uploads in client-assets
drop policy if exists "client_assets_public_select" on storage.objects;
create policy "client_assets_public_select" on storage.objects
  for select using (bucket_id = 'client-assets');

drop policy if exists "client_assets_authenticated_insert" on storage.objects;
create policy "client_assets_authenticated_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'client-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "client_assets_authenticated_update" on storage.objects;
create policy "client_assets_authenticated_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'client-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'client-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "client_assets_authenticated_delete" on storage.objects;
create policy "client_assets_authenticated_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'client-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Ensure profiles and companies have appropriate columns
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.companies add column if not exists website text not null default '';
alter table public.companies add column if not exists details text not null default '';
alter table public.companies add column if not exists updated_at timestamptz not null default now();
