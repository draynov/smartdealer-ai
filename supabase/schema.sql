-- SmartDealer AI - Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. DEALERS TABLE
-- ================================================
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  mobile_profile_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. VEHICLES TABLE
-- ================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
  
  -- Mobile.bg identifiers
  mobile_id VARCHAR(100) UNIQUE NOT NULL,
  source_url TEXT NOT NULL,
  
  -- Basic info
  title VARCHAR(500),
  make VARCHAR(100),
  model VARCHAR(100),
  version TEXT,
  
  -- Price
  price_bgn DECIMAL(12, 2),
  price_eur DECIMAL(12, 2),
  currency VARCHAR(10),
  has_vat BOOLEAN DEFAULT false,
  vat_info TEXT,
  
  -- Dates
  year VARCHAR(10),
  production_date VARCHAR(100),
  
  -- Technical specs
  mileage VARCHAR(50),
  fuel_type VARCHAR(50),
  fuel_consumption VARCHAR(50),
  engine VARCHAR(100),
  cylinder_volume_cc VARCHAR(50),
  power_hp VARCHAR(50),
  power_kw VARCHAR(50),
  euro_standard VARCHAR(50),
  transmission VARCHAR(50),
  category VARCHAR(50),
  condition VARCHAR(50),
  color VARCHAR(100),
  
  -- Electric/Hybrid specific
  electric_range_km VARCHAR(50),
  battery_capacity_kwh VARCHAR(50),
  
  -- Identification
  vin VARCHAR(100),
  
  -- Location & Seller
  location VARCHAR(255),
  seller_type VARCHAR(50),
  seller_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Description
  description TEXT,
  description_raw TEXT,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  last_edit_at VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'hidden')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. VEHICLE IMAGES TABLE
-- ================================================
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  large_url TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. VEHICLE FEATURES TABLE
-- ================================================
CREATE TABLE vehicle_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('safety', 'comfort', 'exterior', 'interior', 'protection', 'other')),
  name VARCHAR(255) NOT NULL,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX idx_vehicles_mobile_id ON vehicles(mobile_id);
CREATE INDEX idx_vehicles_dealer_id ON vehicles(dealer_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_position ON vehicle_images(vehicle_id, position);
CREATE INDEX idx_vehicle_features_vehicle_id ON vehicle_features(vehicle_id);
CREATE INDEX idx_vehicle_features_category ON vehicle_features(vehicle_id, category);

-- ================================================
-- TRIGGER FOR UPDATED_AT
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TEST DATA - Initial dealer
-- ================================================
INSERT INTO dealers (name, slug, city) 
VALUES ('Test Dealer', 'test-dealer', 'София')
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- COMMENTS
-- ================================================
COMMENT ON TABLE vehicles IS 'Автомобили импортирани от Mobile.bg';
COMMENT ON COLUMN vehicles.mobile_id IS 'Уникален ID от Mobile.bg обявата';
COMMENT ON COLUMN vehicles.status IS 'active=активна обява, sold=продадена, hidden=скрита';
COMMENT ON TABLE vehicle_images IS 'Снимки на автомобилите (thumbnail и large URL)';
COMMENT ON COLUMN vehicle_images.position IS 'Ред на снимката (1 = основна снимка)';
COMMENT ON TABLE vehicle_features IS 'Екстри на автомобилите по категории';
