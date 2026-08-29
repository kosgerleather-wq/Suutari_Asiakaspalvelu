-- Feature: let customers look up their order using the number printed on
-- the physical card handed to them at drop-off (stored in jobs.name — the
-- shop does not collect real customer names, for privacy), instead of only
-- the job code (#1052). Also lets staff leave a short note for the customer
-- to see on the tracking page, separate from the internal-only
-- "Sisäinen huomautus" field.
--
-- Run once in the Supabase SQL Editor for the project used by this app.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Changing the return columns isn't allowed via CREATE OR REPLACE, so drop
-- the old get_job_status first (this only redefines the function, no data
-- is touched).
DROP FUNCTION IF EXISTS get_job_status(TEXT);
CREATE OR REPLACE FUNCTION get_job_status(job_id TEXT)
RETURNS TABLE(id TEXT, product TEXT, work TEXT, status TEXT, date TEXT, img TEXT, img_after TEXT, customer_note TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.product, j.work, j.status, j.date, j.img, j.img_after, j.customer_note
  FROM jobs j
  WHERE j.id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_jobs_by_ticket(ticket TEXT)
RETURNS TABLE(id TEXT, product TEXT, work TEXT, status TEXT, date TEXT, img TEXT, img_after TEXT, customer_note TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.product, j.work, j.status, j.date, j.img, j.img_after, j.customer_note
  FROM jobs j
  WHERE trim(lower(j.name)) = trim(lower(ticket))
  ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_job_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_jobs_by_ticket(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_jobs_by_ticket(TEXT) TO authenticated;

-- If PostgREST doesn't pick up the new function immediately:
-- NOTIFY pgrst, 'reload schema';
