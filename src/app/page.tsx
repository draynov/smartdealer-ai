'use client';

import { useState, useEffect } from 'react';

interface CarData {
  // Идентификация
  mobileId: string;
  url: string;
  
  // Основна информация
  brand: string;
  model: string;
  modification: string;
  title: string;
  price: string;
  priceEur: string;
  hasVat: boolean;
  
  // Местоположение и продавач
  location: string;
  sellerType: string;
  sellerName: string;
  phone: string;
  
  // Статус на обявата
  lastEdit: string;
  views: number;
  priceHistory: Array<{ date: string; price: string }>;
  
  // Технически данни
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
  
  // Хибрид/Електрически
  electricRange: string;
  batteryCapacity: string;
  
  // Горива
  fuelType: string;
  fuelConsumption: string;
  
  // Описание
  description: string;
  descriptionRaw: string;
  
  // Екстри
  features: {
    safety: string[];
    other: string[];
    exterior: string[];
    protection: string[];
    interior: string[];
    comfort: string[];
  };
  allFeatures: string[];
  
  // Снимки
  images: string[];
  imageCount: number;
}

// Helper component for displaying info items
function InfoItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border-b border-gray-200 pb-2 ${highlight ? 'bg-blue-50 p-2 rounded' : ''}`}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm ${highlight ? 'font-semibold text-blue-900' : 'text-gray-900'}`}>{value}</dd>
    </div>
  );
}

// Section wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

// Info grid
function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}

// Feature category
function FeatureCategory({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="mb-4">
      <h4 className="text-base font-medium text-gray-700 mb-2">{title} ({features.length})</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5 shrink-0">✓</span>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage !== null) {
        setSelectedImage(null);
      }
      if (e.key === 'ArrowLeft' && selectedImage !== null && selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      }
      if (e.key === 'ArrowRight' && selectedImage !== null && carData && selectedImage < carData.images.length - 1) {
        setSelectedImage(selectedImage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, carData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCarData(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Грешка при зареждане на данните');
        return;
      }

      setCarData(data);
    } catch (err) {
      setError('Грешка при свързване със сървъра');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SmartDealer</h1>
          <p className="text-gray-600">Извличане на данни от Mobile.bg обяви</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile.bg URL
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.mobile.bg/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Зареждане...' : 'Зареди обявата'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {carData && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {carData.brand} {carData.model}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                {carData.modification}
              </p>
            </div>

            {/* Идентификация и статус */}
            <Section title="Идентификация и статус">
              <InfoGrid>
                <InfoItem label="Mobile ID" value={carData.mobileId} />
                <InfoItem label="Марка" value={carData.brand} />
                <InfoItem label="Модел" value={carData.model} />
              </InfoGrid>
              <div className="mt-4">
                <InfoItem label="Модификация" value={carData.modification} />
              </div>
            </Section>

            {/* Обща информация */}
            <Section title="Обща информация">
              <InfoGrid>
                <InfoItem label="Последна редакция" value={carData.lastEdit} />
                <InfoItem label="Прегледи" value={carData.views.toString()} />
                <InfoItem label="Местоположение" value={carData.location} />
                <InfoItem label="Продавач" value={carData.sellerType} />
                {carData.sellerName !== 'Няма данни' && (
                  <InfoItem label="Име на продавача" value={carData.sellerName} />
                )}
                <InfoItem label="Телефон" value={carData.phone} />
                <InfoItem 
                  label="Цена (EUR)" 
                  value={`${carData.priceEur} ${carData.hasVat ? 'с ДДС' : 'без ДДС'}`} 
                  highlight 
                />
              </InfoGrid>
            </Section>

            {/* Основни характеристики - 6-те важни полета */}
            <Section title="Основни характеристики">
              <InfoGrid>
                <InfoItem label="Дата на производство" value={carData.productionDate} />
                <InfoItem label="Двигател" value={carData.engine} />
                <InfoItem label="Мощност" value={carData.power} />
                <InfoItem label="Евростандарт" value={carData.euroStandard} />
                <InfoItem label="Скоростна кутия" value={carData.transmission} />
                <InfoItem label="Пробег [км]" value={carData.mileage} />
              </InfoGrid>
            </Section>

            {/* Технически детайли - останалите данни */}
            <Section title="Технически детайли">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carData.category !== 'Няма данни' && (
                  <InfoItem label="Категория" value={carData.category} />
                )}
                {carData.condition !== 'Няма данни' && (
                  <InfoItem label="Състояние" value={carData.condition} />
                )}
                {carData.color !== 'Няма данни' && (
                  <InfoItem label="Цвят" value={carData.color} />
                )}
                {carData.cylinderVolume !== 'Няма данни' && (
                  <InfoItem label="Кубатура [куб.см]" value={carData.cylinderVolume} />
                )}
                {carData.fuelType !== 'Няма данни' && (
                  <InfoItem label="Тип гориво" value={carData.fuelType} />
                )}
                {carData.powerKw !== 'Няма данни' && (
                  <InfoItem label="Мощност (kW)" value={carData.powerKw} />
                )}
                {carData.fuelConsumption !== 'Няма данни' && (
                  <InfoItem label="Разход на гориво" value={carData.fuelConsumption} />
                )}
                {carData.electricRange !== 'Няма данни' && (
                  <InfoItem label="Електрически пробег (WLTP)" value={carData.electricRange} />
                )}
                {carData.batteryCapacity !== 'Няма данни' && (
                  <InfoItem label="Капацитет на батерията" value={carData.batteryCapacity} />
                )}
                {carData.vin !== 'Няма данни' && (
                  <InfoItem label="VIN" value={carData.vin} highlight />
                )}
              </div>
            </Section>

            {/* Description */}
            {carData.description !== 'Няма данни' && (
              <Section title="Описание">
                <p className="text-gray-700 whitespace-pre-wrap">{carData.description}</p>
              </Section>
            )}

            {/* Екстри по категории */}
            {carData.allFeatures.length > 0 && (
              <Section title={`Екстри (${carData.allFeatures.length})`}>
                {carData.features.safety.length > 0 && (
                  <FeatureCategory title="Безопасност" features={carData.features.safety} />
                )}
                {carData.features.comfort.length > 0 && (
                  <FeatureCategory title="Комфорт" features={carData.features.comfort} />
                )}
                {carData.features.exterior.length > 0 && (
                  <FeatureCategory title="Екстериор" features={carData.features.exterior} />
                )}
                {carData.features.interior.length > 0 && (
                  <FeatureCategory title="Интериор" features={carData.features.interior} />
                )}
                {carData.features.protection.length > 0 && (
                  <FeatureCategory title="Защита" features={carData.features.protection} />
                )}
                {carData.features.other.length > 0 && (
                  <FeatureCategory title="Други" features={carData.features.other} />
                )}
              </Section>
            )}

            {/* Images */}
            {carData.images.length > 0 && (
              <Section title={`Снимки (${carData.imageCount})`}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {carData.images.map((image, index) => (
                    <div 
                      key={index} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(image)}`}
                        alt={`Снимка ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Image Modal */}
            {selectedImage !== null && carData && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedImage(null)}
              >
                <button
                  className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </button>
                
                {/* Previous button */}
                {selectedImage > 0 && (
                  <button
                    className="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage - 1);
                    }}
                  >
                    ‹
                  </button>
                )}
                
                {/* Next button */}
                {selectedImage < carData.images.length - 1 && (
                  <button
                    className="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage + 1);
                    }}
                  >
                    ›
                  </button>
                )}
                
                <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(carData.images[selectedImage])}`}
                    alt={`Снимка ${selectedImage + 1}`}
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                  <p className="text-white text-center mt-4">
                    Снимка {selectedImage + 1} от {carData.images.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
