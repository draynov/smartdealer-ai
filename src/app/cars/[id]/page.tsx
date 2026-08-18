'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ALL_FEATURES, CATEGORY_NAMES } from '@/app/constants/features';

interface Vehicle {
  id: string;
  mobile_id: string;
  source_url: string;
  title: string;
  make: string;
  model: string;
  version: string;
  price_bgn: number;
  price_eur: number;
  currency: string;
  has_vat: boolean;
  vat_info: string;
  year: string;
  production_date: string;
  mileage: string;
  fuel_type: string;
  fuel_consumption: string;
  engine: string;
  cylinder_volume_cc: string;
  power_hp: string;
  power_kw: string;
  euro_standard: string;
  transmission: string;
  category: string;
  condition: string;
  color: string;
  electric_range_km: string;
  battery_capacity_kwh: string;
  vin: string;
  location: string;
  seller_type: string;
  seller_name: string;
  phone: string;
  description: string;
  view_count: number;
  last_edit_at: string;
  created_at: string;
  dealer_id?: string;
  dealer?: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    city: string | null;
  };
}

interface VehicleImage {
  id: string;
  thumbnail_url: string;
  large_url: string;
  position: number;
}

interface Feature {
  id: number;
  name: string;
  category: string;
}

export default function CarDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);

      // Load vehicle with dealer info
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          dealer:dealers(
            id,
            name,
            slug,
            phone,
            city
          )
        `)
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicleData) {
        setError('Автомобилът не е намерен');
        return;
      }

      setVehicle(vehicleData);

      // Load images
      const { data: imagesData } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('position');

      setImages(imagesData || []);

      // Load features with JOIN
      const { data: featuresData } = await supabase
        .from('vehicle_features')
        .select(`
          feature_id,
          features (
            id,
            name,
            category
          )
        `)
        .eq('vehicle_id', vehicleId);

      // Extract features from nested structure
      const extractedFeatures = (featuresData || [])
        .map((item: any) => item.features)
        .filter(Boolean);

      setFeatures(extractedFeatures);
    } catch (err) {
      console.error('Load vehicle error:', err);
      setError('Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  // Check if feature is selected
  const hasFeature = (featureName: string) => {
    return features.some(f => f.name === featureName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Автомобилът не е намерен'}</p>
          <Link
            href="/cars"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Назад към списъка
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/cars"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          Назад към списъка
        </Link>

        {/* Title - H1 най-горе */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vehicle.title}
          </h1>
          {vehicle.version && (
            <p className="text-lg text-gray-600">{vehicle.version}</p>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images + Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery - Голяма снимка + thumbnails */}
            {images.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Large Image */}
                <div className="mb-4">
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(selectedImage || images[0]?.large_url || '')}`}
                    alt={vehicle.title}
                    className="w-full h-96 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(images[0]?.large_url || '')}
                  />
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-6 gap-2">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.large_url)}
                      className={`aspect-video bg-gray-100 rounded overflow-hidden hover:opacity-75 transition ${
                        selectedImage === img.large_url ? 'ring-2 ring-blue-600' : ''
                      }`}
                    >
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(img.thumbnail_url)}`}
                        alt={`Снимка ${img.position}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {images.length} {images.length === 1 ? 'снимка' : 'снимки'}
                </p>
              </div>
            )}

            {/* Main Characteristics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Основни характеристики</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicle.year && (
                  <div>
                    <p className="text-sm text-gray-500">Година</p>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                )}
                {vehicle.mileage && (
                  <div>
                    <p className="text-sm text-gray-500">Пробег</p>
                    <p className="font-medium">{vehicle.mileage}</p>
                  </div>
                )}
                {vehicle.fuel_type && (
                  <div>
                    <p className="text-sm text-gray-500">Гориво</p>
                    <p className="font-medium">{vehicle.fuel_type}</p>
                  </div>
                )}
                {vehicle.power_hp && (
                  <div>
                    <p className="text-sm text-gray-500">Мощност</p>
                    <p className="font-medium">{vehicle.power_hp}</p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div>
                    <p className="text-sm text-gray-500">Скоростна кутия</p>
                    <p className="font-medium">{vehicle.transmission}</p>
                  </div>
                )}
                {vehicle.category && (
                  <div>
                    <p className="text-sm text-gray-500">Категория</p>
                    <p className="font-medium">{vehicle.category}</p>
                  </div>
                )}
                {vehicle.color && (
                  <div>
                    <p className="text-sm text-gray-500">Цвят</p>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                )}
                {vehicle.euro_standard && (
                  <div>
                    <p className="text-sm text-gray-500">Евростандарт</p>
                    <p className="font-medium">{vehicle.euro_standard}</p>
                  </div>
                )}
                {vehicle.condition && (
                  <div>
                    <p className="text-sm text-gray-500">Състояние</p>
                    <p className="font-medium">{vehicle.condition}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Описание</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
              </div>
            )}

            {/* Features Checklist */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Екстри ({features.length} от 96)
              </h2>
              {Object.entries(ALL_FEATURES).map(([categoryKey, categoryFeatures]) => (
                <div key={categoryKey} className="mb-6 last:mb-0">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {CATEGORY_NAMES[categoryKey as keyof typeof CATEGORY_NAMES]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryFeatures.map((featureName) => {
                      const has = hasFeature(featureName);
                      return (
                        <div
                          key={featureName}
                          className={`text-sm flex items-start gap-2 ${
                            has ? 'text-green-700' : 'text-gray-400'
                          }`}
                        >
                          {has ? (
                            <svg className="h-4 w-4 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span>{featureName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price - най-горе в sidebar */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-3">Цена</h2>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-blue-600">
                  {vehicle.price_eur?.toLocaleString('bg-BG') || '-'} €
                </span>
              </div>
              {vehicle.price_bgn && (
                <p className="text-lg text-gray-600">
                  {vehicle.price_bgn.toLocaleString('bg-BG')} лв
                </p>
              )}
              {vehicle.vat_info && (
                <p className="mt-2 text-sm text-gray-600">{vehicle.vat_info}</p>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Информация</h2>
              <div className="space-y-3">
                {vehicle.location && (
                  <div>
                    <p className="text-sm text-gray-500">Локация</p>
                    <p className="font-medium">{vehicle.location}</p>
                  </div>
                )}
                {(vehicle.dealer || vehicle.seller_name) && (
                  <div>
                    <p className="text-sm text-gray-500">Продавач</p>
                    {vehicle.dealer ? (
                      <Link 
                        href={`/dealers/${vehicle.dealer.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {vehicle.dealer.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{vehicle.seller_name}</p>
                    )}
                  </div>
                )}
                {vehicle.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="font-medium">{vehicle.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Технически данни</h2>
              <div className="space-y-3 text-sm">
                {vehicle.vin && (
                  <div>
                    <p className="text-gray-500">VIN</p>
                    <p className="font-mono">{vehicle.vin}</p>
                  </div>
                )}
                {vehicle.engine && (
                  <div>
                    <p className="text-gray-500">Двигател</p>
                    <p>{vehicle.engine}</p>
                  </div>
                )}
                {vehicle.cylinder_volume_cc && (
                  <div>
                    <p className="text-gray-500">Обем</p>
                    <p>{vehicle.cylinder_volume_cc}</p>
                  </div>
                )}
                {vehicle.power_kw && (
                  <div>
                    <p className="text-gray-500">Мощност (kW)</p>
                    <p>{vehicle.power_kw}</p>
                  </div>
                )}
                {vehicle.fuel_consumption && (
                  <div>
                    <p className="text-gray-500">Разход</p>
                    <p>{vehicle.fuel_consumption}</p>
                  </div>
                )}
                {vehicle.electric_range_km && (
                  <div>
                    <p className="text-gray-500">Електр. пробег</p>
                    <p>{vehicle.electric_range_km}</p>
                  </div>
                )}
                {vehicle.battery_capacity_kwh && (
                  <div>
                    <p className="text-gray-500">Батерия</p>
                    <p>{vehicle.battery_capacity_kwh}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Линкове</h2>
              <div className="space-y-2">
                <a
                  href={vehicle.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition"
                >
                  Виж в Mobile.bg
                </a>
                <p className="text-xs text-gray-500 text-center">
                  ID: {vehicle.mobile_id}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
              <p>Добавено: {new Date(vehicle.created_at).toLocaleDateString('bg-BG')}</p>
              {vehicle.view_count > 0 && (
                <p>Прегледи в Mobile.bg: {vehicle.view_count}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="Голяма снимка"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
