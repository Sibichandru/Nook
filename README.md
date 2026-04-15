# Nook

A personal management app built with Next.js 16, Supabase, Mantine UI, and Tailwind CSS.

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16 (App Router)             |
| UI Library  | Mantine v8                          |
| Styling     | Tailwind CSS v4 + CSS custom props  |
| Auth & DB   | Supabase (Auth + PostgreSQL)        |
| Language    | TypeScript 5                        |
| Package Mgr | Bun                                 |
| Deployment  | Vercel                              |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/) v1+
- A [Supabase](https://supabase.com/) project (free tier works)

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd os-app
```

### 2. Install dependencies

```bash
bun install
# or
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

You can find these values in **Supabase Dashboard > Project Settings > API**.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is used by the auth middleware and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is used by the browser and server Supabase clients. In most setups they are the same anon/public key.

### 4. Set up the database

See [Database Setup](#database-setup) below for all table definitions and migrations.

### 5. Run the development server

```bash
bun run dev
# or
npm run dev
```

The app starts on **http://localhost:6060**.

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start dev server (port 6060) |
| `npm run build` | Production build             |
| `npm run lint`  | Run ESLint                   |
| `npm run start` | Start production server      |

## Database Setup

Nook uses Supabase PostgreSQL with Row Level Security (RLS) enabled on all user-facing tables. Below is every table required by the app. You can run these SQL statements in the **Supabase Dashboard > SQL Editor**, or apply the migration files from the `supabase/migrations/` directory.

### Profiles table

Stores user metadata and links to auth.users. You should create this table **first** since other tables and the role system depend on it.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
```

**Auto-create profile on signup** (recommended trigger):

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

### Roles table

Used by `getCurrentUserWithRole()` to gate access. The dashboard home requires the `admin` role.

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create index roles_profile_id_idx on roles(profile_id);

alter table roles enable row level security;

create policy "Users can view their own role"
  on roles for select
  using (auth.uid() = profile_id);
```

To grant a user admin access:

```sql
insert into roles (profile_id, role)
values ('<user-uuid>', 'admin');
```

### Diary Entries table

Stores one diary entry per user per date.

```sql
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  content text not null default '',
  mood integer check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, entry_date)
);

create index diary_entries_user_date_idx on diary_entries(user_id, entry_date);

-- Auto-update updated_at
create or replace function update_diary_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger diary_entries_updated_at
  before update on diary_entries
  for each row
  execute function update_diary_updated_at();

-- RLS
alter table diary_entries enable row level security;

create policy "Users can select their own entries"
  on diary_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on diary_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on diary_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on diary_entries for delete
  using (auth.uid() = user_id);
```

### Reminders table

Migration file: `supabase/migrations/20260410000000_create_reminders.sql`

```sql
create type reminder_type as enum ('recurring', 'one_time');

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

create index reminders_user_id_idx on reminders(user_id);

-- Auto-update updated_at
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
```

### Recommended order of execution

1. `profiles` table + trigger
2. `roles` table
3. `diary_entries` table
4. `reminders` table (or run the migration file)

## Project Structure

```
app/
  layout.tsx                  # Root layout (fonts, providers, theme init)
  page.tsx                    # Landing page
  globals.css                 # Kinetic Workspace design tokens (light/dark)
  access-denied/page.tsx      # Shown when role check fails
  providers/
    auth-providers.tsx        # React context for client-side auth (useAuth)
    mantine-provider.tsx      # Mantine theme config (Electric Indigo palette)
  (auth)/
    layout.tsx                # Auth layout (centered card + theme toggle)
    login/page.tsx            # Login form
    signup/page.tsx           # Signup form
  (dashboard)/dashboard/
    layout.tsx                # Dashboard shell (navbar, sidebar, main area)
    page.tsx                  # Admin dashboard (requires admin role)
    diary/                    # Diary feature
    reminders/                # Reminders feature
    chat/                     # Chat feature (placeholder)

components/
  Sidebar.tsx                 # Sidebar navigation
  ThemeToggle.tsx             # Dark/light mode toggle
  Loader.tsx                  # Full-screen loading overlay

hooks/
  useNotifications.ts         # Browser Notification API + service worker
  useReminderScheduler.ts     # Client-side reminder scheduling engine

lib/
  auth.ts                     # getCurrentUserWithRole() — server-side
  middleware.ts               # Auth middleware for /dashboard/* routes
  constants/constants.ts      # Sidebar nav items
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server Supabase client

types/
  Diary.ts                    # DiaryEntry type
  Reminder.ts                 # Reminder type

public/
  sw.js                       # Service worker for background notifications
  assets/loading.svg          # Loading animation

supabase/
  migrations/                 # SQL migration files
```

## Authentication & Authorization

- **Supabase Auth** handles signup, login, and session management.
- **Middleware** (`lib/middleware.ts`) protects all `/dashboard/*` routes by checking for an authenticated session. Unauthenticated users are redirected to `/login`.
- **Role-based access**: `getCurrentUserWithRole()` fetches the user's role from the `profiles` + `roles` tables. The dashboard home page requires the `admin` role and redirects others to `/access-denied`.
- **Client-side auth context**: `useAuth()` hook provides the current user and loading state to any client component.

## Design System

The app uses the **Kinetic Workspace** design system:

- **Primary color**: Electric Indigo (`#4b4dd8` light / `#c0c1ff` dark)
- **Fonts**: Manrope (headings), Inter (body)
- **Theme**: Dark/light toggle via `data-mantine-color-scheme` attribute, persisted in `localStorage`
- **Surfaces**: Avoids pure white. Light mode uses `--secondary_fixed` (#ebebf5) as the base surface.

## CI/CD

- **GitHub Actions**: `.github/workflows/quality-checks.yml` runs ESLint on pushes to `main`/`dev` and on pull requests.
- **Deployment**: Vercel with automatic deploys from `main` branch (configured in `vercel.json`).

## Feature Documentation

Detailed documentation for each feature is available in the `docs/features/` directory:

- [Authentication](docs/features/authentication.md)
- [Diary](docs/features/diary.md)
- [Reminders](docs/features/reminders.md)
- [Chat](docs/features/chat.md)
- [Theme System](docs/features/theme-system.md)
- [Sidebar & Navigation](docs/features/sidebar-navigation.md)
