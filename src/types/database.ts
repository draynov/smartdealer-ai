// Database types for Supabase tables

export interface Dealer {
  id: string;
  name: string;
  slug: string;
  mobile_profile_url: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  dealer_id: string;
  mobile_id: string;
  source_url: string;
  title: string | null;
  make: string | null;
  model: string | null;
  version: string | null;
  price_bgn: number | null;
  price_eur: number | null;
  currency: string | null;
  has_vat: boolean;
  vat_info: string | null;
  year: string | null;
  production_date: string | null;
  mileage: string | null;
  fuel_type: string | null;
  fuel_consumption: string | null;
  engine: string | null;
  cylinder_volume_cc: string | null;
  power_hp: string | null;
  power_kw: string | null;
  euro_standard: string | null;
  transmission: string | null;
  category: string | null;
  condition: string | null;
  color: string | null;
  electric_range_km: string | null;
  battery_capacity_kwh: string | null;
  vin: string | null;
  location: string | null;
  seller_type: string | null;
  seller_name: string | null;
  phone: string | null;
  description: string | null;
  description_raw: string | null;
  view_count: number;
  last_edit_at: string | null;
  status: 'active' | 'sold' | 'hidden';
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  thumbnail_url: string | null;
  large_url: string | null;
  position: number;
  created_at: string;
}

export interface Feature {
  id: number;
  name: string;
  category: 'safety' | 'comfort' | 'exterior' | 'interior' | 'protection' | 'other';
}

export interface VehicleFeature {
  id: string;
  vehicle_id: string;
  feature_id: number;
  created_at: string;
}

// Insert types (without id and timestamps)
export type VehicleInsert = Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'last_synced_at'> & {
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
};

export type VehicleImageInsert = Omit<VehicleImage, 'id' | 'created_at'>;

export type VehicleFeatureInsert = Omit<VehicleFeature, 'id' | 'created_at'>;
