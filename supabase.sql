-- Run this in Supabase: SQL Editor > New query > paste > Run.
-- This is a public, no-login starter. Anyone can read and insert posts.
-- Do not put secrets or personal information in posts.

create table if not exists public.posts (
  id bigint generated always as identity primary key,
  title text check (title is null or char_length(title) <= 90),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
on public.posts for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can publish posts" on public.posts;
create policy "Anyone can publish posts"
on public.posts for insert
to anon, authenticated
with check (
  char_length(trim(body)) between 1 and 2000
  and (title is null or char_length(title) <= 90)
);

grant select, insert on public.posts to anon, authenticated;
grant usage, select on sequence public.posts_id_seq to anon, authenticated;
