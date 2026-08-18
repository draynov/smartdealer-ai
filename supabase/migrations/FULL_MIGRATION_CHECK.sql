-- ========================================
-- FULL MIGRATION CHECK FOR SUPABASE
-- Date: 2026-08-18
-- ========================================

-- 1. ADD MISSING COLUMNS TO DEALERS
-- ========================================
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

-- 2. UPDATE EXISTING DEALERS
-- ========================================
UPDATE dealers SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. ADD TRIGGER FOR DEALERS UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dealers_updated_at ON dealers;
CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. CHECK IF VEHICLES TABLE EXISTS AND HAS DEALER_ID
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='vehicles' AND column_name='dealer_id'
  ) THEN
    RAISE NOTICE 'vehicles.dealer_id column is missing - table might need recreation';
  ELSE
    RAISE NOTICE 'vehicles.dealer_id column exists - OK';
  END IF;
END $$;

-- 5. VERIFY INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_id ON vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_mobile_id ON vehicles(mobile_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify everything is working:

-- Check dealers columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dealers' ORDER BY ordinal_position;

-- Check vehicles dealer_id FK:
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'vehicles' AND constraint_type = 'FOREIGN KEY';

-- Check triggers:
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table IN ('dealers', 'vehicles');

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('dealers', 'vehicles', 'vehicle_images', 'vehicle_features');
