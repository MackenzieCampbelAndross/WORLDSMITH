-- Fix new-user provisioning on an already-migrated project.
-- portal.sql used to insert into companies before the profiles row existed, which
-- violates companies_owner_id_fkey and makes every OTP signup fail with HTTP 500.
-- Run this once in Supabase Dashboard -> SQL Editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_company uuid;
begin
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
