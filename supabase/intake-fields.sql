-- Crestion Labs portal: floor-plan measurements the reconstruction engine needs.
-- Run this in the Supabase SQL editor. It is idempotent and safe to re-run.

alter table public.projects add column if not exists plan_width_meters numeric;
alter table public.projects add column if not exists plan_length_meters numeric;
alter table public.projects add column if not exists furnishing_style text not null default 'modern';

comment on column public.projects.plan_width_meters is
  'Measured building width in metres; with plan_length_meters it locks real-world scale.';
comment on column public.projects.plan_length_meters is
  'Measured building length in metres; with plan_width_meters it locks real-world scale.';
comment on column public.projects.furnishing_style is
  'One of modern, minimalist, scandinavian, warm_luxury.';
