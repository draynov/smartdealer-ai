'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PreviewSetupPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [dealerUrl, setDealerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealerUrl.trim()) {
      setError('Моля въведете URL на сайта');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Call API to scrape dealer design
      const response = await fetch('/api/scrape-dealer-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: dealerUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape dealer design');
      }

      const data = await response.json();

      // Redirect to preview page with branding params
      const params = new URLSearchParams({
        logo: data.logoUrl || '',
        color: data.primaryColor || '#2563eb',
        dealerName: data.dealerName || 'Dealer',
      });

      router.push(`/preview/${vehicleId}?${params.toString()}`);
    } catch (err) {
      console.error('Branding preview error:', err);
      setError('Грешка при зареждане на дизайна. Проверете URL-а.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/cars/${vehicleId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Назад към обявата
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              DEMO Брандинг на обява
            </h1>
            <p className="text-gray-600">
              Въведете URL адреса на сайта на дилъра, за да видите как би изглеждала обявата в неговия дизайн.
            </p>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <svg className="w-24 h-24 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="dealer-url" className="block text-sm font-medium text-gray-700 mb-2">
                URL на сайта на дилъра
              </label>
              <input
                id="dealer-url"
                type="url"
                placeholder="https://example.com"
                value={dealerUrl}
                onChange={(e) => setDealerUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Например: https://technoekipavto.com
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Зареждане на дизайна...' : 'Генерирай DEMO преглед'}
            </button>
          </form>

          {/* Info boxes */}
          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Какво ще се извлече?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Логото на дилъра</li>
                <li>• Основния цвят на сайта</li>
                <li>• Име на дилъра</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Резултат</h3>
              <p className="text-sm text-green-800">
                Ще видите обявата стилизирана с брандинга на дилъра - идеално за демонстрация на клиенти!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
