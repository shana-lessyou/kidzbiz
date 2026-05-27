-- Add parent notification preferences to families table
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS notify_email        text,
  ADD COLUMN IF NOT EXISTS notify_on_request   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_task_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_on_summary   boolean NOT NULL DEFAULT false;
