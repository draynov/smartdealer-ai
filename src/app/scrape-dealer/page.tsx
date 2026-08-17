'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CarListing {
  url: string;
  mobileId: string;
  title?: string;
  price?: string;
  thumbnailUrl?: string;
}

interface ScrapeResult {
  dealerSlug: string;
  dealerUrl: string;
  listingUrl: string;
  totalFound: number;
  listings: CarListing[];
}

export default function ScrapeDealerPage() {
  const [dealerUrl, setDealerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const handleScrape = async () => {
    if (!dealerUrl.trim()) {
      setError('Моля въведете URL на dealer профил');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scrape-dealer-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Грешка при извличане на обяви');
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Scrape error:', err);
      setError('Грешка при извличане на обяви');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Извличане на обяви от dealer профил
          </h1>
          <p className="text-gray-600">
            Подайте URL на Mobile.bg dealer профил за да видите всички обяви
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label htmlFor="dealerUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Mobile.bg dealer профил URL
          </label>
          <div className="flex gap-3">
            <input
              id="dealerUrl"
              type="text"
              value={dealerUrl}
              onChange={(e) => setDealerUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="https://avtomarket.mobile.bg/"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
            >
              {loading ? 'Зареждане...' : 'Извлечи обяви'}
            </button>
          </div>
          
          {/* Example */}
          <p className="mt-2 text-sm text-gray-500">
            Пример: https://avtomarket.mobile.bg/ или https://dealer-name.mobile.bg/
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Резултат</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dealer</p>
                  <p className="font-medium">{result.dealerSlug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Открити обяви</p>
                  <p className="font-medium text-blue-600 text-2xl">{result.totalFound}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Listing URL</p>
                <a 
                  href={result.listingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {result.listingUrl}
                </a>
              </div>
            </div>

            {/* Listings */}
            {result.listings.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Открити обяви ({result.listings.length})</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {result.listings.map((listing, index) => (
                    <div key={listing.mobileId} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        {/* Index */}
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="text-gray-400 font-medium">{index + 1}</span>
                        </div>

                        {/* Thumbnail */}
                        {listing.thumbnailUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={listing.thumbnailUrl} 
                              alt={listing.title || 'Car'}
                              className="w-20 h-16 object-cover rounded"
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {listing.title && (
                            <p className="font-medium text-gray-900 truncate mb-1">
                              {listing.title}
                            </p>
                          )}
                          {listing.price && (
                            <p className="text-blue-600 font-semibold mb-1">
                              {listing.price}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mb-1">
                            Mobile ID: {listing.mobileId}
                          </p>
                          <a 
                            href={listing.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all"
                          >
                            {listing.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Не са открити обяви</p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {!result && !loading && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Как работи?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Подайте URL на Mobile.bg dealer профил (напр. https://avtomarket.mobile.bg/)</li>
              <li>2. Системата извлича списък с всички обяви на dealer-а</li>
              <li>3. Показва URL, Mobile ID, заглавие и цена (ако са налични)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
