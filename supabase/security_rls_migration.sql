-- Security fix: lock down public read/write access on `jobs` and `requests`.
--
-- Background: the previous RLS policies used USING (true) / WITH CHECK (true),
-- which let anyone with the (public, client-side) Supabase key read, insert,
-- update, and delete all customer and job data, directly via the REST API,
-- with no admin login required. Run this once in the Supabase SQL Editor
-- (Project → SQL Editor → New query) for the project used by this app.
--
-- After this migration, only requests carrying a valid Supabase Auth session
-- (role = authenticated) can touch these tables. Customers tracking an order
-- via track.html still work — they only call the get_job_status() RPC below,
-- which is SECURITY DEFINER and returns just the safe subset of columns.

-- Remove the old wide-open public policies (safe if they don't exist).
DROP POLICY IF EXISTS "Allow public read" ON requests;
DROP POLICY IF EXISTS "Allow public insert" ON requests;
DROP POLICY IF EXISTS "Allow public update" ON requests;
DROP POLICY IF EXISTS "Allow public delete" ON requests;
DROP POLICY IF EXISTS "Allow public read" ON jobs;
DROP POLICY IF EXISTS "Allow public insert" ON jobs;
DROP POLICY IF EXISTS "Allow public update" ON jobs;
DROP POLICY IF EXISTS "Allow public delete" ON jobs;
DROP POLICY IF EXISTS "Authenticated full access" ON requests;
DROP POLICY IF EXISTS "Authenticated full access" ON jobs;

-- Make sure RLS is actually enabled (no-op if already on).
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Only logged-in staff (a real Supabase Auth session) may read/write.
CREATE POLICY "Authenticated full access" ON requests
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated full access" ON jobs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Re-affirm the customer-facing tracking function stays narrow and public.
CREATE OR REPLACE FUNCTION get_job_status(job_id TEXT)
RETURNS TABLE(id TEXT, product TEXT, work TEXT, status TEXT, date TEXT, img TEXT, img_after TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.product, j.work, j.status, j.date, j.img, j.img_after
  FROM jobs j
  WHERE j.id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO authenticated;

-- Manual step (not SQL): in Supabase Dashboard → Authentication → Users,
-- add your own staff account(s) with email + a strong password so you can
-- log in to the admin panel. Then, in Authentication → Settings, disable
-- "Allow new users to sign up" so no one else can self-register.
