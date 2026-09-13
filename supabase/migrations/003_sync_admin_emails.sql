-- Sync production admin allowlist with app config.
INSERT INTO public.admin_emails (email) VALUES
  ('ctchang@usc.edu'),
  ('ctnchang@icloud.com'),
  ('bryanram2024@gmail.com'),
  ('president@usc.edu'),
  ('copresident@usc.edu')
ON CONFLICT (email) DO NOTHING;

-- Promote any already-signed-up admins who were stuck as members.
UPDATE public.users
SET role = 'admin'
WHERE lower(email) IN (
  SELECT lower(email) FROM public.admin_emails
);
