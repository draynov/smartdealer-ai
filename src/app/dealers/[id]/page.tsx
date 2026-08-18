'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';

interface Dealer {
  id: string;
  name: string;
  slug: string;
  mobile_profile_url: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  member_since: number | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  working_hours: Record<string, string> | null;
  vehicle_count: number;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  title: string;
  price_eur: number;
  price_bgn: number;
  year: string;
  mileage: string;
  fuel_type: string;
  source_url: string;
}

export default function DealerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importError, setImportError] = useState('');
  const [mobileListingCount, setMobileListingCount] = useState<number | null>(null);

  useEffect(() => {
    fetchDealer();
    fetchVehicles();
  }, [id]);

  const fetchDealer = async () => {
    try {
      const response = await fetch(`/api/dealers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch dealer');
      const data = await response.json();
      setDealer(data);
    } catch (err) {
      setError('Грешка при зареждане на дилър');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicles?dealer_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const handleImportListings = async () => {
    if (!dealer?.mobile_profile_url) {
      setImportError('Дилърът няма Mobile.bg профил URL');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportProgress({ current: 0, total: 0 });

    try {
      // Step 1: Scrape listings from Mobile.bg
      const scrapeResponse = await fetch('/api/scrape-dealer-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerUrl: dealer.mobile_profile_url }),
      });

      if (!scrapeResponse.ok) {
        throw new Error('Грешка при изтегляне на обяви от Mobile.bg');
      }

      const scrapeData = await scrapeResponse.json();
      const listings = scrapeData.listings || [];
      
      // Save Mobile.bg listing count
      setMobileListingCount(listings.length);

      if (listings.length === 0) {
        setImportError('Не са намерени обяви');
        setImporting(false);
        return;
      }

      setImportProgress({ current: 0, total: listings.length });

      // Step 2: Import each listing
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        
        try {
          const importResponse = await fetch('/api/import-vehicle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: listing.url,
              dealer_id: id 
            }),
          });

          if (importResponse.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Error importing listing:', listing.url, err);
        }

        setImportProgress({ current: i + 1, total: listings.length });
      }

      // Refresh vehicle list
      await fetchVehicles();
      await fetchDealer();

      if (errorCount > 0) {
        setImportError(`Импортирани ${successCount} от ${listings.length} обяви (${errorCount} грешки)`);
      }

    } catch (err: any) {
      setImportError(err.message || 'Грешка при импортиране на обяви');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Зареждане...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Дилър не е намерен'}
          </div>
          <Link href="/dealers" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Назад към дилъри
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dealers" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Назад към дилъри
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{dealer.name}</h1>
            <Link
              href={`/dealers/${dealer.id}/edit`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Редактирай
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Основна информация</h2>
              
              {dealer.logo_url && (
                <img 
                  src={dealer.logo_url} 
                  alt={dealer.name}
                  className="h-16 object-contain mb-4"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Slug</p>
                  <p className="font-medium">{dealer.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Обяви</p>
                  <p className="font-medium">{dealer.vehicle_count}</p>
                </div>
                {dealer.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Телефон</p>
                    <p className="font-medium">{dealer.phone}</p>
                  </div>
                )}
                {dealer.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{dealer.email}</p>
                  </div>
                )}
                {dealer.city && (
                  <div>
                    <p className="text-sm text-gray-600">Град</p>
                    <p className="font-medium">{dealer.city}</p>
                  </div>
                )}
                {dealer.member_since && (
                  <div>
                    <p className="text-sm text-gray-600">В Mobile.bg от</p>
                    <p className="font-medium">{dealer.member_since} г.</p>
                  </div>
                )}
              </div>

              {dealer.address && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Адрес</p>
                  <p className="font-medium">{dealer.address}</p>
                </div>
              )}
            </div>

            {/* Vehicles */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Обяви ({dealer.vehicle_count})
                </h2>
                {dealer.mobile_profile_url && (
                  <button
                    onClick={handleImportListings}
                    disabled={importing}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    {importing ? 'Импортиране...' : 'Изтегли обяви'}
                  </button>
                )}
              </div>

              {importing && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    Импортиране {importProgress.current} от {importProgress.total}...
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {importError && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  {importError}
                </div>
              )}

              {vehicles.length === 0 ? (
                <p className="text-gray-600">Няма добавени обяви</p>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/cars/${vehicle.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900">{vehicle.title}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>{vehicle.year}</span>
                        <span>{vehicle.mileage}</span>
                        <span>{vehicle.fuel_type}</span>
                      </div>
                      <p className="text-blue-600 font-semibold mt-2">
                        {vehicle.price_eur ? `€${vehicle.price_eur.toLocaleString()}` : `${vehicle.price_bgn?.toLocaleString()} лв.`}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {dealer.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Описание</h2>
                <p className="text-gray-700 whitespace-pre-line">{dealer.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Working Hours */}
            {dealer.working_hours && Object.keys(dealer.working_hours).length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Работно време</h2>
                <div className="space-y-2">
                  {Object.entries(dealer.working_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-gray-700 capitalize">{day}</span>
                      <span className="font-medium">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile.bg Stats */}
            {mobileListingCount !== null && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mobile.bg</h2>
                <div>
                  <p className="text-sm text-gray-600">Брой обяви в Mobile.bg</p>
                  <p className="text-2xl font-bold text-blue-600">{mobileListingCount}</p>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Линкове</h2>
              <div className="space-y-3">
                {dealer.mobile_profile_url && (
                  <a
                    href={dealer.mobile_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    Mobile.bg профил →
                  </a>
                )}
                {dealer.website_url && (
                  <a
                    href={dealer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    Собствен сайт →
                  </a>
                )}
                {dealer.facebook_url && (
                  <a
                    href={dealer.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    Facebook →
                  </a>
                )}
                {dealer.instagram_url && (
                  <a
                    href={dealer.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    Instagram →
                  </a>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Метаданни</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Създаден</p>
                  <p className="font-medium">{new Date(dealer.created_at).toLocaleDateString('bg-BG')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Обновен</p>
                  <p className="font-medium">{new Date(dealer.updated_at).toLocaleDateString('bg-BG')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
