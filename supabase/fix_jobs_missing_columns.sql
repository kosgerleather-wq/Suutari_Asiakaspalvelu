-- Fix: every "Uusi vastaanotto" (new job) save was silently failing.
--
-- The `jobs` table was created before `phone` and `request_id` were added
-- to the app's insert payload (in saveJob() in app.js). Because the original
-- setup script used `CREATE TABLE IF NOT EXISTS`, re-running it never added
-- the missing columns to the already-existing table. Every insert from the
-- intake form was then rejected by PostgREST with HTTP 400 (unknown column),
-- and the error was only logged to the browser console — never shown to the
-- user — so newly added products appeared to save locally but never reached
-- the database, and vanished on reload or on another device.
--
-- Run this once in the Supabase SQL Editor for the project used by this app.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS request_id TEXT;
