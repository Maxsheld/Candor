-- =========================================================
-- Candor / Supabase database bootstrap
-- Run this in the Supabase SQL Editor
-- Intended for a fresh clone / empty project
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- ENUM TYPES
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'role_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.role_type as enum ('user', 'assistant');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'conversation_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.conversation_status as enum ('active', 'ended');
  end if;
end
$$;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamp not null default now(),
  status public.conversation_status not null default 'active'
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role public.role_type not null,
  content text not null,
  order_index serial not null,
  created_at timestamp not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  summary_text text not null,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_conversations_user_id_created_at
  on public.conversations (user_id, created_at desc);

create index if not exists idx_messages_conversation_id_order_index
  on public.messages (conversation_id, order_index);

create index if not exists idx_session_summaries_user_id_created_at
  on public.session_summaries (user_id, created_at desc);

create index if not exists idx_session_summaries_conversation_id
  on public.session_summaries (conversation_id);

-- =========================================================
-- UPDATED_AT TRIGGER FOR USER PROFILES
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

-- =========================================================
-- AUTH SIGNUP -> AUTO CREATE USER PROFILE
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, profile_json)
  values (
    new.id,
    '{
      "baseline_identity": "",
      "current_focus": {
        "topic": "",
        "sessions_active": 0
      },
      "key_entities": [
        {
          "name": "",
          "relation": "",
          "current_state": "",
          "last_mentioned": ""
        }
      ],
      "key_insights": [],
      "unresolved_commitments": []
    }'::jsonb
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

-- =========================================================
-- RLS
-- =========================================================

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.user_profiles enable row level security;
alter table public.session_summaries enable row level security;

-- =========================================================
-- CLEAN POLICY RECREATION
-- =========================================================

drop policy if exists "Users can view own conversations" on public.conversations;
drop policy if exists "Users can insert own conversations" on public.conversations;
drop policy if exists "Users can update own conversations" on public.conversations;
drop policy if exists "Users can delete own conversations" on public.conversations;

drop policy if exists "Users can view messages from own conversations" on public.messages;
drop policy if exists "Users can insert messages into own conversations" on public.messages;

drop policy if exists "Users can view own profile" on public.user_profiles;

drop policy if exists "Users can view own session summaries" on public.session_summaries;

-- =========================================================
-- CONVERSATIONS POLICIES
-- =========================================================

create policy "Users can view own conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own conversations"
on public.conversations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own conversations"
on public.conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
on public.conversations
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- MESSAGES POLICIES
-- Access is based on ownership of the parent conversation
-- =========================================================

create policy "Users can view messages from own conversations"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can insert messages into own conversations"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

-- =========================================================
-- USER PROFILES POLICIES
-- Authenticated users can read only their own profile
-- Writes are expected to happen through backend/service-role flows
-- =========================================================

create policy "Users can view own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

-- =========================================================
-- SESSION SUMMARIES POLICIES
-- Authenticated users can read only their own summaries
-- Inserts are expected from backend/service-role flows
-- =========================================================

create policy "Users can view own session summaries"
on public.session_summaries
for select
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- NOTES
-- =========================================================
-- 1. user_profiles.id is intentionally the same as auth.users.id.
--
-- 2. session_summaries and user_profiles write paths are intended for
--    backend/service-role workflows, so no authenticated write policies
--    are included for those tables.
