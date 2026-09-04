-- Adds a counter for how many times a job's delivery date has been
-- automatically pushed forward because the product wasn't picked up by
-- closing time (see rolloverOverdueDates() in app.js). Every day after
-- closing, any job that's still unclaimed and due (or overdue) gets its
-- `date` advanced to the next business day (Monday if that would land on
-- a weekend), and this counter increments by one each time it happens.
-- The home page's "Myöhässä, ei noudettu" stat uses it, since the job's
-- `date` field itself no longer stays in the past once it's been rolled.
--
-- Run this once in the Supabase SQL Editor for the project used by this app.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS postponed_count INTEGER NOT NULL DEFAULT 0;
