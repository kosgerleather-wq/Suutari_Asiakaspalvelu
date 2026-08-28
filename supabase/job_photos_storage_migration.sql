-- Fix: photos intermittently "disappeared" / failed to sync.
--
-- Photos were stored as base64 text directly in jobs.img / jobs.img_after.
-- Real phone photos run 3-8MB each; with 35 jobs already in the table this
-- made "SELECT * FROM jobs" (run on every page load and every save) time
-- out under Postgres's statement_timeout:
--
--   ERROR 57014: canceling statement due to statement timeout
--
-- That error was only ever logged to the console (never shown to staff), so
-- a sync that silently failed looked identical to one that succeeded — the
-- job/photo stayed visible on the device that made it, but never reached
-- the database or any other device. This is the same failure shape as the
-- earlier localStorage-quota bug, one level up the stack.
--
-- Fix: move photos to Supabase Storage (job-photos bucket) and store only
-- the public URL string in jobs.img / jobs.img_after. Run this once in the
-- Supabase SQL Editor for the project used by this app.

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete job photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read job photos" ON storage.objects;

CREATE POLICY "Authenticated upload job photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-photos');
CREATE POLICY "Authenticated update job photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'job-photos');
CREATE POLICY "Authenticated delete job photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'job-photos');
CREATE POLICY "Public read job photos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'job-photos');

-- Manual step (not SQL, already done for the live project as of 2026-08-28):
-- the 35 existing jobs with base64 img/img_after were migrated to this
-- bucket via a one-off script run against the authenticated Supabase client
-- in the browser (fetch each row -> convert the data: URL to a Blob ->
-- upload to job-photos -> update the row to store the returned public URL
-- instead). No further action needed unless the bucket is recreated.
