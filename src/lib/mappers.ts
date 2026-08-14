import { VehicleInsert, VehicleImageInsert, VehicleFeatureInsert } from '@/types/database';

// CarData interface from scraper
interface CarData {
  mobileId: string;
  url: string;
  brand: string;
  model: string;
  modification: string;
  title: string;
  price: string;
  priceEur: string;
  hasVat: boolean;
  location: string;
  sellerType: string;
  sellerName: string;
  phone: string;
  lastEdit: string;
  views: number;
  productionDate: string;
  year: string;
  mileage: string;
  engine: string;
  cylinderVolume: string;
  power: string;
  powerKw: string;
  euroStandard: string;
  transmission: string;
  category: string;
  condition: string;
  color: string;
  vin: string;
  electricRange: string;
  batteryCapacity: string;
  fuelType: string;
  fuelConsumption: string;
  description: string;
  descriptionRaw: string;
  features: {
    safety: string[];
    other: string[];
    exterior: string[];
    protection: string[];
    interior: string[];
    comfort: string[];
  };
  allFeatures: string[];
  images: string[];
  thumbnails: string[];
  imageCount: number;
}

/**
 * Convert scraped CarData to Vehicle insert format
 */
export function carDataToVehicle(carData: CarData, dealerId: string): VehicleInsert {
  // Parse prices
  const priceEur = parseFloat(carData.priceEur.replace(/[^\d.]/g, '')) || null;
  const priceBgn = carData.price ? parseFloat(carData.price.replace(/[^\d.]/g, '')) || null : null;
  
  // Determine currency
  let currency = 'EUR';
  if (carData.priceEur && carData.priceEur.includes('€')) {
    currency = 'EUR';
  } else if (carData.price && carData.price.includes('лв')) {
    currency = 'BGN';
  }
  
  // VAT info
  const vatInfo = carData.hasVat ? 'с ДДС' : 'без ДДС';
  
  return {
    dealer_id: dealerId,
    mobile_id: carData.mobileId,
    source_url: carData.url,
    title: carData.title || null,
    make: carData.brand || null,
    model: carData.model || null,
    version: carData.modification || null,
    price_bgn: priceBgn,
    price_eur: priceEur,
    currency: currency,
    has_vat: carData.hasVat,
    vat_info: vatInfo,
    year: carData.year || null,
    production_date: carData.productionDate || null,
    mileage: carData.mileage || null,
    fuel_type: carData.fuelType || null,
    fuel_consumption: carData.fuelConsumption || null,
    engine: carData.engine || null,
    cylinder_volume_cc: carData.cylinderVolume || null,
    power_hp: carData.power || null,
    power_kw: carData.powerKw || null,
    euro_standard: carData.euroStandard || null,
    transmission: carData.transmission || null,
    category: carData.category || null,
    condition: carData.condition || null,
    color: carData.color || null,
    electric_range_km: carData.electricRange || null,
    battery_capacity_kwh: carData.batteryCapacity || null,
    vin: carData.vin || null,
    location: carData.location || null,
    seller_type: carData.sellerType || null,
    seller_name: carData.sellerName || null,
    phone: carData.phone || null,
    description: carData.description || null,
    description_raw: carData.descriptionRaw || null,
    view_count: carData.views || 0,
    last_edit_at: carData.lastEdit || null,
    status: 'active',
  };
}

/**
 * Convert scraped images to VehicleImage insert format
 */
export function carDataToImages(carData: CarData, vehicleId: string): VehicleImageInsert[] {
  const images: VehicleImageInsert[] = [];
  
  for (let i = 0; i < carData.images.length; i++) {
    images.push({
      vehicle_id: vehicleId,
      large_url: carData.images[i] || null,
      thumbnail_url: carData.thumbnails[i] || null,
      position: i + 1, // 1-indexed
    });
  }
  
  return images;
}

/**
 * Convert scraped features to VehicleFeature insert format
 */
export function carDataToFeatures(carData: CarData, vehicleId: string): VehicleFeatureInsert[] {
  const features: VehicleFeatureInsert[] = [];
  
  // Safety features
  carData.features.safety.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'safety',
      name: name,
      is_selected: true,
    });
  });
  
  // Comfort features
  carData.features.comfort.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'comfort',
      name: name,
      is_selected: true,
    });
  });
  
  // Exterior features
  carData.features.exterior.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'exterior',
      name: name,
      is_selected: true,
    });
  });
  
  // Interior features
  carData.features.interior.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'interior',
      name: name,
      is_selected: true,
    });
  });
  
  // Protection features
  carData.features.protection.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'protection',
      name: name,
      is_selected: true,
    });
  });
  
  // Other features
  carData.features.other.forEach(name => {
    features.push({
      vehicle_id: vehicleId,
      category: 'other',
      name: name,
      is_selected: true,
    });
  });
  
  return features;
}
