-- ============================================================
-- Migration 013: Profile Cover Banner Synchronization
-- ============================================================
alter table public.profiles
  add column if not exists cover_preset text default 'aurora',
  add column if not exists cover_url text;
