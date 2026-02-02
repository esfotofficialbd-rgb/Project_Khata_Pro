-- ==========================================
-- 🛑 FINAL RESET SECTION (DEEP CLEAN)
-- এই সেকশনটি টেবিলের পাশাপাশি আগের ফাংশন ও ট্রিগারও ডিলিট করবে।
-- এর ফলে Security Advisor এর ওয়ার্নিং চলে যাবে।
-- ==========================================

-- 1. Drop Triggers & Functions (To remove Security Warnings)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- 2. Drop Tables (Order matters to avoid dependency errors)
DROP TABLE IF EXISTS public.user_locations CASCADE;
DROP TABLE IF EXISTS public.public_notices CASCADE;
DROP TABLE IF EXISTS public.material_logs CASCADE;
DROP TABLE IF EXISTS public.work_reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Drop Storage Policies (To prevent conflicts)
DROP POLICY IF EXISTS "Images Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Images Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Images Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Images Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- ==========================================
-- ✅ SETUP SECTION (FRESH START)
-- অ্যাপের জন্য ১০০% কার্যকরী স্কিমা
-- ==========================================

-- 1. PROFILES TABLE (ইউজার ইনফরমেশন)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  phone text unique,
  full_name text,
  role text check (role in ('contractor', 'supervisor', 'worker')),
  company_name text,
  designation text, -- সুপারভাইজারের পদবী
  skill_type text, -- কর্মীর কাজের ধরণ
  daily_rate numeric default 0,
  monthly_salary numeric default 0,
  payment_type text default 'daily',
  assigned_project_id text,
  balance numeric default 0, -- বর্তমান বকেয়া
  is_verified boolean default false,
  avatar_url text,
  email text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROJECTS TABLE (প্রজেক্টের তথ্য)
create table public.projects (
  id text primary key, -- React generates ID using Date.now()
  project_name text not null,
  client_name text,
  client_phone text,
  location text,
  project_type text default 'daily', -- daily, fixed, sqft
  budget_amount numeric default 0,
  current_expense numeric default 0,
  status text default 'active', -- active, completed
  start_date text,
  sqft_rate numeric,
  total_area numeric,
  mistri_rate numeric,
  helper_rate numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ATTENDANCE TABLE (হাজিরা)
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  worker_id uuid references public.profiles(id) on delete cascade,
  project_id text references public.projects(id) on delete cascade,
  date text not null,
  status text check (status in ('P', 'H', 'A')), -- Present, Half, Absent
  overtime numeric default 0,
  amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TRANSACTIONS TABLE (আয়-ব্যয় ও বেতন)
create table public.transactions (
  id text primary key, -- React generates ID
  project_id text references public.projects(id) on delete cascade,
  related_user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('income', 'expense', 'salary')),
  amount numeric not null,
  description text,
  date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. NOTIFICATIONS TABLE (নোটিফিকেশন)
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text,
  message text,
  date text,
  is_read boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. WORK REPORTS TABLE (কাজের রিপোর্ট)
create table public.work_reports (
  id text primary key,
  project_id text references public.projects(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete cascade,
  date text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. MATERIAL LOGS TABLE (সাইট মালামাল)
create table public.material_logs (
  id text primary key,
  project_id text references public.projects(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete cascade,
  date text not null,
  item_name text,
  quantity numeric,
  unit text,
  supplier_name text,
  challan_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. PUBLIC NOTICES TABLE (নোটিশ বোর্ড)
create table public.public_notices (
  id uuid default gen_random_uuid() primary key,
  message text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. USER LOCATIONS TABLE (লাইভ ট্র্যাকিং)
create table public.user_locations (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  lat double precision,
  lng double precision,
  is_active boolean default true,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 🔒 SECURITY POLICIES (RLS)
-- ==========================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.attendance enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.work_reports enable row level security;
alter table public.material_logs enable row level security;
alter table public.public_notices enable row level security;
alter table public.user_locations enable row level security;

-- Universal Access Policy (For MVP: All logged-in users can read/write)
-- প্রোডাকশনে প্রয়োজনে এটি পরিবর্তন করা যেতে পারে
create policy "Enable all access for authenticated users" on public.profiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.attendance for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.work_reports for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.material_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.public_notices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on public.user_locations for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ==========================================
-- 📂 STORAGE BUCKET SETUP
-- ==========================================

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Images Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Images Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Images Update Access"
  on storage.objects for update
  using ( bucket_id = 'images' and auth.uid() = owner );

create policy "Images Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'images' and auth.uid() = owner );

-- ==========================================
-- ⚡ REALTIME SETUP
-- ==========================================

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
alter publication supabase_realtime add table public.user_locations;