'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DesignData {
  logoUrl: string;
  primaryColor: string;
  secondaryColor?: string;
  dealerName: string;
  websiteUrl: string;
  isDarkTheme?: boolean;
}

export default function DesignExtractorPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [design, setDesign] = useState<DesignData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Моля въведете URL адрес');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setDesign(null);

      const response = await fetch('/api/scrape-dealer-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape design');
      }

      const data = await response.json();
      setDesign(data);
    } catch (err) {
      console.error('Design extraction error:', err);
      setError('Грешка при извличане на дизайна. Проверете URL адреса.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Дизайн Екстрактор</h1>
          <p className="mt-2 text-gray-600">
            Извличане на дизайн от уебсайт на дилър - лого, цветове, стилове
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                URL адрес на сайта на дилъра
              </label>
              <div className="flex gap-3">
                <input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Извличане...' : 'Извлечи дизайн'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Например: https://technoekipavto.com
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Results */}
        {design && (
          <div className="space-y-8">
            {/* Extracted Data Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">Извлечени елементи</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Лого</h3>
                  {design.logoUrl ? (
                    <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center h-32">
                      <img 
                        src={design.logoUrl} 
                        alt="Dealer Logo" 
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-lg p-4 bg-gray-50 flex items-center justify-center h-32 text-gray-400">
                      Не е намерено
                    </div>
                  )}
                  {design.logoUrl && (
                    <p className="mt-2 text-xs text-gray-500 truncate">{design.logoUrl}</p>
                  )}
                </div>

                {/* Primary Color */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Основен цвят</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      className="w-full h-20 rounded mb-2 border"
                      style={{ backgroundColor: design.primaryColor }}
                    ></div>
                    <p className="text-center font-mono text-sm">{design.primaryColor}</p>
                    {design.isDarkTheme && (
                      <p className="mt-2 text-xs text-orange-600 text-center">
                        ⚠️ Тъмна тема - може да не е подходящ за UI елементи
                      </p>
                    )}
                  </div>
                  {design.secondaryColor && design.secondaryColor !== design.primaryColor && (
                    <div className="border rounded-lg p-4 bg-gray-50 mt-3">
                      <p className="text-xs text-gray-500 mb-2 text-center">Вторичен цвят</p>
                      <div 
                        className="w-full h-16 rounded mb-2 border"
                        style={{ backgroundColor: design.secondaryColor }}
                      ></div>
                      <p className="text-center font-mono text-sm">{design.secondaryColor}</p>
                    </div>
                  )}
                </div>

                {/* Dealer Name */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Име на дилъра</h3>
                  <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center h-32">
                    <p className="text-lg font-semibold text-center">{design.dealerName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UI Elements Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-6">Визуализация на UI елементи</h2>
              
              <div className="space-y-8">
                {/* Typography */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Типография</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">H1 Заглавие</p>
                      <h1 
                        className="text-3xl font-bold"
                        style={{ color: design.primaryColor }}
                      >
                        BMW X5 xDrive30d M Sport
                      </h1>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">H2 Заглавие</p>
                      <h2 
                        className="text-2xl font-semibold"
                        style={{ color: design.primaryColor }}
                      >
                        Основни характеристики
                      </h2>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">H3 Заглавие</p>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Технически данни
                      </h3>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Параграф</p>
                      <p className="text-gray-700">
                        Автомобилът е в отлично състояние, редовно поддържан с пълна сервизна история.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prices */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Цени</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Цена в детайл (голяма)</p>
                      <div className="border rounded-lg p-4">
                        <span 
                          className="text-4xl font-bold"
                          style={{ color: design.primaryColor }}
                        >
                          45 900 €
                        </span>
                        <p className="text-lg text-gray-600 mt-1">89 700 лв</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Цена в листинг (малка)</p>
                      <div className="border rounded-lg p-4">
                        <span 
                          className="text-xl font-bold"
                          style={{ color: design.primaryColor }}
                        >
                          45 900 €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Бутони</h3>
                  <div className="flex flex-wrap gap-4">
                    <button
                      className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition"
                      style={{ backgroundColor: design.primaryColor }}
                    >
                      Свържете се с нас
                    </button>
                    <button
                      className="px-6 py-3 border-2 rounded-lg font-medium hover:bg-gray-50 transition"
                      style={{ 
                        borderColor: design.primaryColor,
                        color: design.primaryColor 
                      }}
                    >
                      Виж повече
                    </button>
                    <Link
                      href="#"
                      className="px-6 py-3 inline-flex items-center font-medium hover:underline"
                      style={{ color: design.primaryColor }}
                    >
                      Към обявата →
                    </Link>
                  </div>
                </div>

                {/* Icons & Checkmarks */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Икони и отметки</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <svg 
                        className="h-5 w-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={3} 
                        stroke="currentColor"
                        style={{ color: design.primaryColor }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Климатроник</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg 
                        className="h-5 w-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={3} 
                        stroke="currentColor"
                        style={{ color: design.primaryColor }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Кожен салон</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg 
                        className="h-5 w-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={3} 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Панорамен покрив</span>
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Карти (листинг стил)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 rounded-lg overflow-hidden hover:shadow-lg transition" style={{ borderColor: design.primaryColor }}>
                      <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                        Снимка на автомобил
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          BMW X5 xDrive30d M Sport
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">2019 г. • 85 000 км • Дизел</p>
                        <p 
                          className="text-xl font-bold"
                          style={{ color: design.primaryColor }}
                        >
                          45 900 €
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branded Header Preview */}
                {design.logoUrl && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Branded Header</h3>
                    <div 
                      className="border-b-4 p-4 bg-white rounded-lg"
                      style={{ borderBottomColor: design.primaryColor }}
                    >
                      <img 
                        src={design.logoUrl} 
                        alt={design.dealerName}
                        className="h-12 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Branded Footer Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Branded Footer</h3>
                  <div 
                    className="text-white p-8 rounded-lg"
                    style={{ backgroundColor: design.primaryColor }}
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">{design.dealerName}</h3>
                      <p className="opacity-90">Професионални услуги и качествени автомобили</p>
                      <p className="mt-4 font-medium">📞 +359 888 123 456</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
