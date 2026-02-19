-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public user profiles, linked to auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'homeowner' check (role in ('homeowner', 'builder', 'certifier')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROJECTS (Construction projects)
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  name text not null,
  builder_name text,
  contract_value numeric,
  start_date date,
  status text default 'planning' check (status in ('planning', 'active', 'completed', 'paused')),
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STAGES (Project milestones e.g., Base, Frame, Enclosed)
create table stages (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'verified')),
  completion_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHECKLIST ITEMS (Granular tasks within a stage)
create table checklist_items (
  id uuid default uuid_generate_v4() primary key,
  stage_id uuid references stages(id) on delete cascade not null,
  description text not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  evidence_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VARIATIONS (Cost changes)
create table variations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  additional_cost numeric default 0,
  status text default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected')),
  approved_by_user_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DEFECTS (Issues/Snags)
create table defects (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  severity text default 'minor' check (severity in ('minor', 'major', 'critical')),
  status text default 'open' check (status in ('open', 'fixed', 'verified')),
  image_url text,
  location text, -- e.g., "Master Bedroom"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Row Level Security)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table stages enable row level security;
alter table checklist_items enable row level security;
alter table variations enable row level security;
alter table defects enable row level security;

-- Profiles: Users can view/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Projects: Users can CRUD their own projects
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can create own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

-- Stages (Owned by project owner)
create policy "Users can view own project stages" on stages for select using (
  exists (select 1 from projects where projects.id = stages.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert own project stages" on stages for insert with check (
  exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
);

-- Checklist Items (Owned by stage -> project -> owner)
create policy "Users can view own checklist items" on checklist_items for select using (
  exists (
    select 1 from stages 
    join projects on projects.id = stages.project_id 
    where stages.id = checklist_items.stage_id and projects.user_id = auth.uid()
  )
);
create policy "Users can insert own checklist items" on checklist_items for insert with check (
  exists (
    select 1 from stages 
    join projects on projects.id = stages.project_id 
    where stages.id = stage_id and projects.user_id = auth.uid()
  )
);
create policy "Users can update own checklist items" on checklist_items for update using (
  exists (
    select 1 from stages 
    join projects on projects.id = stages.project_id 
    where stages.id = checklist_items.stage_id and projects.user_id = auth.uid()
  )
);

-- Variations
create policy "Users can view own project variations" on variations for select using (
  exists (select 1 from projects where projects.id = variations.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert own project variations" on variations for insert with check (
  exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
);

-- Defects
create policy "Users can view own project defects" on defects for select using (
  exists (select 1 from projects where projects.id = defects.project_id and projects.user_id = auth.uid())
);
create policy "Users can insert own project defects" on defects for insert with check (
  exists (select 1 from projects where projects.id = project_id and projects.user_id = auth.uid())
);

-- TRIGGER: Auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'homeowner');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on rerun
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
