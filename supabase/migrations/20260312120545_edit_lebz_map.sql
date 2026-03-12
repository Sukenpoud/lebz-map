/*
  Lebz Map - initial schema

  Hypothèses :
  - frontend avec Supabase Auth
  - photos stockées dans le bucket `lebz-photos`
  - les fichiers uploadés sont rangés sous : <user_id>/<filename>

  Cette migration :
  - crée profiles
  - crée lebz
  - crée un trigger pour auto-créer le profil à l'inscription
  - crée une vue validated_countries basée sur la première lebz par pays et par user
  - active RLS
  - crée les policies DB
  - crée le bucket storage + policies storage
*/

-- Extension utile pour gen_random_uuid()
create extension if not exists pgcrypto;

-- =========================
-- TABLES
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (
    username is null or char_length(trim(username)) between 3 and 30
  )
);

create table if not exists public.lebz (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  city_name text,
  country_code text,
  country_name text,
  photo_url text,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  rating integer not null check (rating between 1 and 5),
  visited_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lebz_user_id
  on public.lebz(user_id);

create index if not exists idx_lebz_user_country_created
  on public.lebz(user_id, country_code, created_at, id);

create index if not exists idx_lebz_country_code
  on public.lebz(country_code);

create index if not exists idx_lebz_visited_at
  on public.lebz(visited_at desc);

-- =========================
-- UPDATED_AT trigger helper
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_lebz_updated_at on public.lebz;
create trigger set_lebz_updated_at
before update on public.lebz
for each row
execute function public.set_updated_at();

-- =========================
-- AUTO-CREATE PROFILE
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================
-- VIEW: validated_countries
-- =========================

drop view if exists public.validated_countries;

create view public.validated_countries
with (security_invoker = on)
as
with ranked as (
  select
    l.*,
    row_number() over (
      partition by l.user_id, l.country_code
      order by l.created_at asc, l.id asc
    ) as rn,
    count(*) over (
      partition by l.user_id, l.country_code
    ) as lebz_count_in_country
  from public.lebz l
  where l.country_code is not null
    and l.country_name is not null
)
select
  l.id as first_lebz_id,
  l.user_id,
  l.country_code,
  l.country_name,
  l.city_name as first_city_name,
  l.visited_at as first_visit_date,
  l.created_at as validated_at,
  l.lebz_count_in_country
from ranked l
where l.rn = 1;

-- =========================
-- RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.lebz enable row level security;

-- Nettoyage si tu relances la migration sur une base déjà bricolée
drop policy if exists "Authenticated users can read all profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Authenticated users can read all lebz" on public.lebz;
drop policy if exists "Users can insert own lebz" on public.lebz;
drop policy if exists "Users can update own lebz" on public.lebz;
drop policy if exists "Users can delete own lebz" on public.lebz;

-- Profiles
create policy "Authenticated users can read all profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Lebz
create policy "Authenticated users can read all lebz"
on public.lebz
for select
to authenticated
using (true);

create policy "Users can insert own lebz"
on public.lebz
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own lebz"
on public.lebz
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own lebz"
on public.lebz
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================
-- STORAGE
-- =========================

insert into storage.buckets (id, name, public)
values ('lebz-photos', 'lebz-photos', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view lebz photos" on storage.objects;
drop policy if exists "Authenticated users can upload lebz photos" on storage.objects;
drop policy if exists "Users can update own lebz photos" on storage.objects;
drop policy if exists "Users can delete own lebz photos" on storage.objects;

create policy "Anyone can view lebz photos"
on storage.objects
for select
to public
using (bucket_id = 'lebz-photos');

create policy "Authenticated users can upload lebz photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lebz-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own lebz photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'lebz-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'lebz-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own lebz photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lebz-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);