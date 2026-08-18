'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vehicle {
  id: string;
  mobile_id: string;
  title: string;
  make: string;
  model: string;
  year: string;
  price_eur: number;
  mileage: string;
  fuel_type: string;
  power_hp: string;
  created_at: string;
  vehicle_images?: VehicleImage[];
}

interface VehicleImage {
  thumbnail_url: string;
  position: number;
}

export default function CarsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images (
            thumbnail_url,
            position
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        setError('Грешка при зареждане на автомобилите');
        return;
      }

      setVehicles(data || []);
    } catch (err) {
      console.error('Load vehicles error:', err);
      setError('Грешка при зареждане на автомобилите');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg flex items-center justify-center gap-2">
            <svg className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Изтеглени автомобили</h1>
          <p className="mt-2 text-gray-600">
            Общо {vehicles.length} {vehicles.length === 1 ? 'автомобил' : 'автомобила'}
          </p>
        </div>

        {/* Empty state */}
        {vehicles.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Няма изтеглени автомобили</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Изтеглете първия автомобил
            </Link>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            // Get first image (position = 1 or first in array)
            const firstImage = vehicle.vehicle_images?.find(img => img.position === 1) 
              || vehicle.vehicle_images?.[0];
            const thumbnailUrl = firstImage?.thumbnail_url;

            return (
              <Link
                key={vehicle.id}
                href={`/cars/${vehicle.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image */}
                {thumbnailUrl ? (
                  <div className="relative aspect-[4/3] bg-gray-200">
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(thumbnailUrl)}`}
                      alt={vehicle.title || `${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-200 aspect-[4/3] flex items-center justify-center text-gray-400">
                    Без снимка
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {vehicle.title || `${vehicle.make} ${vehicle.model}`}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {vehicle.year && (
                      <p>{vehicle.year}</p>
                    )}
                    {vehicle.mileage && (
                      <p>{vehicle.mileage}</p>
                    )}
                    {vehicle.fuel_type && vehicle.power_hp && (
                      <p>{vehicle.fuel_type}, {vehicle.power_hp}</p>
                    )}
                  </div>

                  {vehicle.price_eur && (
                    <p className="mt-3 text-xl font-bold text-blue-600">
                      {vehicle.price_eur.toLocaleString('bg-BG')} €
                    </p>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    ID: {vehicle.mobile_id}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
