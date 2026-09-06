-- Auth bootstrap, roster invites, domain seeds, and missing RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS public.alumni_invites (
  email TEXT PRIMARY KEY,
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
  sms_opt_in BOOLEAN NOT NULL DEFAULT false,
  stakeholder_type stakeholder_type,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_invites ENABLE ROW LEVEL SECURITY;

INSERT INTO public.allowed_domains (domain, notes) VALUES
  ('usc.edu', 'USC'),
  ('student.usc.edu', 'USC students'),
  ('gmail.com', 'Personal email — verify alumni in production'),
  ('outlook.com', 'Personal email — verify alumni in production'),
  ('icloud.com', 'Personal email — verify alumni in production')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO public.admin_emails (email) VALUES
  ('president@usc.edu'),
  ('copresident@usc.edu')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite public.alumni_invites%ROWTYPE;
  has_invite BOOLEAN := false;
  assigned_role user_role := 'member';
BEGIN
  SELECT * INTO invite
  FROM public.alumni_invites
  WHERE lower(email) = lower(NEW.email);
  has_invite := FOUND;

  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    assigned_role := 'admin';
  ELSIF has_invite THEN
    assigned_role := invite.role;
  ELSIF NEW.email ILIKE '%angelfund%' THEN
    assigned_role := 'stakeholder';
  END IF;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), assigned_role)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (
    user_id, email, full_name, phone, cohort_year, programs, divisions,
    eboard_roles, startups, current_title, current_company, linkedin_url,
    industries, bio, city, region, country, lat, lng, photo_url,
    sms_opt_in, stakeholder_type
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(invite.full_name, ''),
    invite.phone,
    invite.cohort_year,
    COALESCE(invite.programs, '{}'),
    COALESCE(invite.divisions, '{}'),
    COALESCE(invite.eboard_roles, '{}'),
    COALESCE(invite.startups, '{}'),
    invite.current_title,
    invite.current_company,
    invite.linkedin_url,
    COALESCE(invite.industries, '{}'),
    invite.bio,
    invite.city,
    invite.region,
    invite.country,
    invite.lat,
    invite.lng,
    invite.photo_url,
    COALESCE(invite.sms_opt_in, false),
    CASE
      WHEN assigned_role = 'stakeholder'
        THEN COALESCE(invite.stakeholder_type, 'ANGEL_INVESTOR'::stakeholder_type)
      ELSE invite.stakeholder_type
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Users read own or admin reads all" ON public.users;
CREATE POLICY "Users read own or admin reads all"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins update users" ON public.users;
CREATE POLICY "Admins update users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read domains" ON public.allowed_domains;
CREATE POLICY "Authenticated read domains"
  ON public.allowed_domains FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage domains" ON public.allowed_domains;
CREATE POLICY "Admins manage domains"
  ON public.allowed_domains FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage campaigns" ON public.message_campaigns;
CREATE POLICY "Admins manage campaigns"
  ON public.message_campaigns FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage deliveries" ON public.message_deliveries;
CREATE POLICY "Admins manage deliveries"
  ON public.message_deliveries FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated insert analytics" ON public.analytics_events;
CREATE POLICY "Authenticated insert analytics"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read analytics" ON public.analytics_events;
CREATE POLICY "Admins read analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage invites" ON public.alumni_invites;
CREATE POLICY "Admins manage invites"
  ON public.alumni_invites FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage admin emails" ON public.admin_emails;
CREATE POLICY "Admins manage admin emails"
  ON public.admin_emails FOR ALL
  TO authenticated
  USING (public.is_admin());
