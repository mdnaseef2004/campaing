-- SUPABASE DATABASE SCHEMA FOR CAMPAIGN POSTER GENERATOR

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles / Users Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY, -- e.g., 'camp-abc123'
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    slogan TEXT NOT NULL,
    collect_name BOOLEAN DEFAULT TRUE NOT NULL,
    collect_phone BOOLEAN DEFAULT TRUE NOT NULL,
    collect_category BOOLEAN DEFAULT TRUE NOT NULL,
    template_style TEXT NOT NULL DEFAULT 'cyberpunk',
    template_url TEXT, -- Base64 representation or storage link
    google_sheet_url TEXT, -- Google Apps Script Web App URL
    button_text TEXT DEFAULT 'Generate My Poster' NOT NULL,
    theme_colors JSONB, -- Colors config: e.g. {"primary": "#6366f1", "gradient": "from-indigo-500 to-rose-500"}
    slug TEXT UNIQUE NOT NULL, -- Campaign custom slug
    otp_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 3. Create Submissions (Leads) Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY, -- e.g., 'STU-ABC123'
    campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Anonymous',
    phone TEXT,
    category TEXT,
    referrer_id TEXT,
    referrer_link TEXT,
    device_type TEXT DEFAULT 'Desktop' NOT NULL,
    shares_count INTEGER DEFAULT 0 NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create Click Logs Table
CREATE TABLE IF NOT EXISTS public.clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    referrer_id TEXT NOT NULL,
    device_type TEXT DEFAULT 'Desktop' NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for clicks
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;


-----------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-----------------------------------------------------------

-- Users policies:
-- Users can view their own profile
CREATE POLICY "Allow users to view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Allow users to create own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Allow users to update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);


-- Campaigns policies:
-- Everyone can select campaigns (publicly readable so students can access their forms)
CREATE POLICY "Allow public campaign viewing" 
ON public.campaigns FOR SELECT 
USING (true);

-- Authenticated users can insert campaigns
CREATE POLICY "Allow users to create campaigns" 
ON public.campaigns FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

-- Only campaign owner can update their campaign
CREATE POLICY "Allow owner campaign updating" 
ON public.campaigns FOR UPDATE 
USING (auth.uid() = admin_id);

-- Only campaign owner can delete their campaign
CREATE POLICY "Allow owner campaign deletion" 
ON public.campaigns FOR DELETE 
USING (auth.uid() = admin_id);


-- Submissions policies:
-- Public can select submissions (needed to verify referrers and leaderboards)
CREATE POLICY "Allow public submissions viewing" 
ON public.submissions FOR SELECT 
USING (true);

-- Anyone can submit (public registration)
CREATE POLICY "Allow public submissions creation" 
ON public.submissions FOR INSERT 
WITH CHECK (true);

-- Anyone can update a submission (specifically to increment share counts)
CREATE POLICY "Allow public submissions updating" 
ON public.submissions FOR UPDATE 
USING (true);

-- Only campaign owner (via campaign's admin_id) can delete submissions
CREATE POLICY "Allow owner submissions deletion" 
ON public.submissions FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = submissions.campaign_id AND c.admin_id = auth.uid()
    )
);


-- Clicks policies:
-- Public can read/insert clicks (for click tracking)
CREATE POLICY "Allow public clicks select" 
ON public.clicks FOR SELECT 
USING (true);

-- Anyone can log click
CREATE POLICY "Allow public clicks insertion" 
ON public.clicks FOR INSERT 
WITH CHECK (true);

-- Only campaign owner can delete click logs
CREATE POLICY "Allow owner clicks deletion" 
ON public.clicks FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = clicks.campaign_id AND c.admin_id = auth.uid()
    )
);


-----------------------------------------------------------
-- USER REGISTRATION TRIGGER
-----------------------------------------------------------
-- Auto-insert profile record when a new Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Administrator'),
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution link
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
