-- Ensure allowlisted admins exist and are promoted (run in Supabase SQL editor if needed).
INSERT INTO public.admin_emails (email) VALUES
  ('ctchang@usc.edu'),
  ('ctnchang@icloud.com'),
  ('bryanram2024@gmail.com'),
  ('president@usc.edu'),
  ('copresident@usc.edu')
ON CONFLICT (email) DO NOTHING;

UPDATE public.users
SET role = 'admin'
WHERE lower(email) IN (
  SELECT lower(email) FROM public.admin_emails
);

-- Allow admins to delete user rows (service role bypasses RLS; this covers session client).
DROP POLICY IF EXISTS "Admins delete users" ON public.users;
CREATE POLICY "Admins delete users"
  ON public.users FOR DELETE
  USING (public.is_admin());
