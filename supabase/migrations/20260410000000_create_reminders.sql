-- Create enum for reminder type
create type reminder_type as enum ('recurring', 'one_time');

-- Create reminders table
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type reminder_type not null,
  interval_minutes integer,
  scheduled_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast per-user lookups
create index reminders_user_id_idx on reminders(user_id);

-- Auto-update updated_at on row change
create or replace function update_reminders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reminders_updated_at
  before update on reminders
  for each row
  execute function update_reminders_updated_at();

-- RLS
alter table reminders enable row level security;

create policy "Users can select their own reminders"
  on reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reminders"
  on reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reminders"
  on reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reminders"
  on reminders for delete
  using (auth.uid() = user_id);
