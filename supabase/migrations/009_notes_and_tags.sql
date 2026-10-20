-- Add tags column to habits
alter table public.habits
  add column if not exists tags text[] not null default '{}';

create index if not exists habits_tags_idx on public.habits using gin (tags);

-- Add note column to habit_logs
alter table public.habit_logs
  add column if not exists note text check (char_length(note) <= 500);
