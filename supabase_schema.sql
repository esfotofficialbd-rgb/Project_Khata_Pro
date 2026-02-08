
-- ============================================================
-- 🧨 RESET: DROP ALL EXISTING TABLES (CLEAN SLATE)
-- ============================================================
-- সতর্কতা: এটি চালালে আগের সব ডাটা মুছে যাবে এবং নতুন করে টেবিল তৈরি হবে।
DROP TABLE IF EXISTS public.user_locations CASCADE;
DROP TABLE IF EXISTS public.public_notices CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.material_logs CASCADE;
DROP TABLE IF EXISTS public.work_reports CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- 🏗️ 1. PROFILES (Users)
-- ============================================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('contractor', 'worker', 'supervisor')),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company_name TEXT,
    designation TEXT,
    skill_type TEXT,
    daily_rate NUMERIC DEFAULT 0,
    monthly_salary NUMERIC DEFAULT 0,
    payment_type TEXT CHECK (payment_type IN ('daily', 'monthly')),
    balance NUMERIC DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    assigned_project_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- সার্চিং ফাস্ট করার জন্য ইনডেক্স
CREATE INDEX idx_profiles_phone ON public.profiles(phone);

-- ============================================================
-- 🏗️ 2. PROJECTS
-- ============================================================
CREATE TABLE public.projects (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    location TEXT,
    client_name TEXT,
    client_phone TEXT,
    project_type TEXT CHECK (project_type IN ('fixed', 'daily', 'sqft')),
    budget_amount NUMERIC DEFAULT 0,
    current_expense NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    start_date TEXT,
    sqft_rate NUMERIC,
    total_area NUMERIC,
    mistri_rate NUMERIC,
    helper_rate NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 3. ATTENDANCE
-- ============================================================
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    status TEXT CHECK (status IN ('P', 'H', 'A')),
    overtime NUMERIC DEFAULT 0,
    amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_worker ON public.attendance(worker_id);

-- ============================================================
-- 🏗️ 4. TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'salary')),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 5. WORK REPORTS
-- ============================================================
CREATE TABLE public.work_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 6. MATERIAL LOGS
-- ============================================================
CREATE TABLE public.material_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TEXT,
    item_name TEXT,
    quantity NUMERIC,
    unit TEXT,
    supplier_name TEXT,
    challan_photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT,
    date TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 8. PUBLIC NOTICES
-- ============================================================
CREATE TABLE public.public_notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🏗️ 9. USER LOCATIONS
-- ============================================================
CREATE TABLE public.user_locations (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    lat NUMERIC,
    lng NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 🔄 AUTOMATION: HANDLE NEW USER (TRIGGER)
-- ============================================================
-- এই ফাংশনটি নতুন ইউজার সাইন-আপ করার সাথে সাথে অটোমেটিক প্রোফাইল তৈরি করবে।
-- Security Fix: Added 'SET search_path = public' to prevent search_path manipulation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
      id, 
      role, 
      full_name, 
      phone, 
      email, 
      company_name, 
      is_verified, 
      balance, 
      created_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'contractor'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    new.email,
    new.raw_user_meta_data->>'company_name',
    TRUE,
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ট্রিগার সেটআপ
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 🔒 SECURITY POLICIES (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY "Projects viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update projects" ON public.projects FOR UPDATE USING (auth.role() = 'authenticated');

-- Attendance
CREATE POLICY "Attendance viewable by everyone" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update attendance" ON public.attendance FOR UPDATE USING (auth.role() = 'authenticated');

-- Transactions
CREATE POLICY "Transactions viewable by everyone" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports & Materials
CREATE POLICY "Reports viewable by everyone" ON public.work_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert reports" ON public.work_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Materials viewable by everyone" ON public.material_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert materials" ON public.material_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications
CREATE POLICY "Notifications viewable by owner" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owner can update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Public Notices
CREATE POLICY "Public notices viewable by everyone" ON public.public_notices FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert notices" ON public.public_notices FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User Locations
CREATE POLICY "Locations viewable by everyone" ON public.user_locations FOR SELECT USING (true);
CREATE POLICY "Users can update own location" ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location update" ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 📦 STORAGE (Images Bucket)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Images Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Images Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Images Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Images Delete Access" ON storage.objects;

CREATE POLICY "Images Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Images Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Images Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.uid() = owner);
CREATE POLICY "Images Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);
    