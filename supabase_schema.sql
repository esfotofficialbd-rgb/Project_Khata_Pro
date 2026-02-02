-- 1. PROFILES TABLE (Users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  phone text unique,
  full_name text,
  role text check (role in ('contractor', 'supervisor', 'worker')),
  company_name text,
  designation text,
  skill_type text,
  daily_rate numeric,
  monthly_salary numeric,
  payment_type text,
  assigned_project_id text,
  balance numeric default 0,
  is_verified boolean default false,
  avatar_url text,
  email text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROJECTS TABLE
create table if not exists public.projects (
  id text primary key,
  project_name text not null,
  client_name text,
  client_phone text,
  location text,
  project_type text,
  budget_amount numeric default 0,
  current_expense numeric default 0,
  status text default 'active',
  start_date text,
  sqft_rate numeric,
  total_area numeric,
  mistri_rate numeric,
  helper_rate numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ATTENDANCE TABLE
create table if not exists public.attendance (
  id text primary key,
  worker_id uuid references public.profiles(id),
  project_id text references public.projects(id),
  date text not null,
  status text,
  overtime numeric default 0,
  amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id text primary key,
  project_id text references public.projects(id),
  related_user_id uuid references public.profiles(id),
  type text check (type in ('income', 'expense', 'salary')),
  amount numeric not null,
  description text,
  date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  type text,
  message text,
  date text,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. WORK REPORTS TABLE (New)
create table if not exists public.work_reports (
  id text primary key,
  project_id text references public.projects(id),
  submitted_by uuid references public.profiles(id),
  date text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. MATERIAL LOGS TABLE (New)
create table if not exists public.material_logs (
  id text primary key,
  project_id text references public.projects(id),
  submitted_by uuid references public.profiles(id),
  date text not null,
  item_name text,
  quantity numeric,
  unit text,
  supplier_name text,
  challan_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. PUBLIC NOTICES TABLE (New)
create table if not exists public.public_notices (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  created_by uuid references public.profiles(id),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.attendance enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.work_reports enable row level security;
alter table public.material_logs enable row level security;
alter table public.public_notices enable row level security;

-- CREATE GENERIC POLICIES (For development - allows all authenticated users)
do $$ 
begin
  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'profiles') then
    create policy "Enable all access for authenticated users" on public.profiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
  
  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'projects') then
    create policy "Enable all access for authenticated users" on public.projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'attendance') then
    create policy "Enable all access for authenticated users" on public.attendance for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'transactions') then
    create policy "Enable all access for authenticated users" on public.transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'notifications') then
    create policy "Enable all access for authenticated users" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'work_reports') then
    create policy "Enable all access for authenticated users" on public.work_reports for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'material_logs') then
    create policy "Enable all access for authenticated users" on public.material_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;

  if not exists (select from pg_policies where policyname = 'Enable all access for authenticated users' and tablename = 'public_notices') then
    create policy "Enable all access for authenticated users" on public.public_notices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  end if;
end $$;

-- SETUP REALTIME (Optional but recommended)
-- Try to create publication safely
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.work_reports;
alter publication supabase_realtime add table public.material_logs;
alter publication supabase_realtime add table public.public_notices;