-- Migration: Add new fields to dealers table
-- Date: 2026-08-18

-- Add new columns to existing dealers table
ALTER TABLE dealers
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS member_since INTEGER,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing dealers with updated_at = created_at
UPDATE dealers SET updated_at = created_at WHERE updated_at IS NULL;
