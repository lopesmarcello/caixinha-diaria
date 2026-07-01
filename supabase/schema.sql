-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Creates the caixinhas/deposits tables and locks them down with Row Level
-- Security so each user can only ever see/modify their own rows.

create table if not exists caixinhas (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  total_days  integer not null check (total_days >= 1),
  created_at  timestamptz not null default now(),
  status      text not null default 'active' check (status in ('active', 'completed')),
  drawn_value integer
);

create table if not exists deposits (
  id            bigint generated always as identity primary key,
  caixinha_id   bigint not null references caixinhas(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  value         integer not null,
  deposited_at  timestamptz not null default now()
);

alter table caixinhas enable row level security;
alter table deposits enable row level security;

create policy "own caixinhas" on caixinhas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own deposits" on deposits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
