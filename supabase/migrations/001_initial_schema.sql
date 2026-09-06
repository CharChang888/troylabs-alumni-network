-- TL Alumni Network — initial schema
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enums
CREATE TYPE user_role AS ENUM ('member', 'admin', 'stakeholder');
CREATE TYPE program_affiliation AS ENUM ('TL_INTERNAL', 'IGNITE', 'BUILD', 'DEMO');
CREATE TYPE division_type AS ENUM (
  'Product Management', 'Design', 'Tech', 'VC/Finance', 'Marketing', 'DEMO'
);
CREATE TYPE profile_visibility AS ENUM ('public', 'hidden');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'failed', 'replied');
CREATE TYPE stakeholder_type AS ENUM ('ANGEL_INVESTOR', 'EARLY_STAGE_FUND', 'MENTOR', 'PARTNER');

-- Users (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allowed email domains
CREATE TABLE public.allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  cohort_year INT,
  programs program_affiliation[] NOT NULL DEFAULT '{}',
  divisions division_type[] NOT NULL DEFAULT '{}',
  eboard_roles TEXT[] NOT NULL DEFAULT '{}',
  startups TEXT[] NOT NULL DEFAULT '{}',
  current_title TEXT,
  current_company TEXT,
  linkedin_url TEXT,
  industries TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  visibility profile_visibility NOT NULL DEFAULT 'public',
  sms_opt_in BOOLEAN NOT NULL DEFAULT false,
  notification_industries TEXT[] NOT NULL DEFAULT '{}',
  stakeholder_type stakeholder_type,
  embedding vector(1536),
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  location_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message campaigns
CREATE TABLE public.message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_name TEXT,
  event_date TIMESTAMPTZ,
  event_location TEXT,
  rsvp_url TEXT,
  audience_filters JSONB NOT NULL DEFAULT '{}',
  recipient_count INT NOT NULL DEFAULT 0,
  status campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message deliveries
CREATE TABLE public.message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.message_campaigns(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  phone TEXT NOT NULL,
  status delivery_status NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX profiles_embedding_idx ON public.profiles USING hnsw (embedding vector_cosine_ops);
CREATE INDEX profiles_programs_idx ON public.profiles USING GIN (programs);
CREATE INDEX profiles_divisions_idx ON public.profiles USING GIN (divisions);
CREATE INDEX profiles_industries_idx ON public.profiles USING GIN (industries);
CREATE INDEX profiles_location_idx ON public.profiles (lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX profiles_search_idx ON public.profiles USING GIN (
  to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(current_title,'') || ' ' || coalesce(current_company,'') || ' ' || coalesce(bio,''))
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Profiles: members read public profiles
CREATE POLICY "Public profiles readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
