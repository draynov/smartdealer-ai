'use client';

import { useState, useEffect } from 'react';
import { ALL_FEATURES, CATEGORY_NAMES } from './constants/features';

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
  images: string[]; // Full-size versions
  thumbnails: string[]; // Small versions for grid
  imageCount: number;
}

// Helper component for displaying info items
function InfoItem({ label, value, highlight = false, icon }: { label: string; value: string; highlight?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`border-b border-gray-200 pb-2 ${highlight ? 'bg-blue-50 p-2 rounded' : ''}`}>
      <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </dt>
      <dd className={`mt-1 text-sm ${highlight ? 'font-semibold text-blue-900' : 'text-gray-900'} ${icon ? 'ml-6' : ''}`}>{value}</dd>
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

// Feature category - shows all possible features with has/missing indication
function FeatureCategory({ 
  title, 
  allPossibleFeatures, 
  availableFeatures 
}: { 
  title: string; 
  allPossibleFeatures: string[]; 
  availableFeatures: string[] 
}) {
  // Simple normalize - just lowercase and trim
  const normalize = (str: string) => str.toLowerCase().trim();
  
  // Count matches
  const matchedFeatures = allPossibleFeatures.filter(feature => 
    availableFeatures.some(af => normalize(af) === normalize(feature))
  );
  
  const availableCount = matchedFeatures.length;
  const totalCount = allPossibleFeatures.length;
  
  return (
    <div className="mb-6">
      <h4 className="text-base font-medium text-gray-700 mb-3">
        {title} ({availableCount}/{totalCount})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {allPossibleFeatures.map((feature, index) => {
          const hasFeature = availableFeatures.some(af => 
            normalize(af) === normalize(feature)
          );
          
          return (
            <div key={index} className="flex items-start">
              <span className={`mr-2 mt-0.5 shrink-0 ${hasFeature ? 'text-green-600' : 'text-gray-300'}`}>
                {hasFeature ? '✓' : '✗'}
              </span>
              <span className={`text-sm ${hasFeature ? 'text-gray-700' : 'text-gray-400'}`}>
                {feature}
              </span>
            </div>
          );
        })}
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
                <InfoItem 
                  label="Дата на производство" 
                  value={carData.productionDate}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <InfoItem 
                  label="Двигател" 
                  value={carData.engine}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                <InfoItem 
                  label="Мощност" 
                  value={carData.power}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <InfoItem 
                  label="Евростандарт" 
                  value={carData.euroStandard}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <InfoItem 
                  label="Скоростна кутия" 
                  value={carData.transmission}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <InfoItem 
                  label="Пробег [км]" 
                  value={carData.mileage}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
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

            {/* Екстри по категории - показва всички възможни екстри */}
            <Section title={`Екстри (${carData.allFeatures.length} от ${Object.values(ALL_FEATURES).flat().length})`}>
              <FeatureCategory 
                title={CATEGORY_NAMES.safety}
                allPossibleFeatures={ALL_FEATURES.safety} 
                availableFeatures={carData.features.safety} 
              />
              <FeatureCategory 
                title={CATEGORY_NAMES.comfort}
                allPossibleFeatures={ALL_FEATURES.comfort} 
                availableFeatures={carData.features.comfort} 
              />
              <FeatureCategory 
                title={CATEGORY_NAMES.exterior}
                allPossibleFeatures={ALL_FEATURES.exterior} 
                availableFeatures={carData.features.exterior} 
              />
              <FeatureCategory 
                title={CATEGORY_NAMES.interior}
                allPossibleFeatures={ALL_FEATURES.interior} 
                availableFeatures={carData.features.interior} 
              />
              <FeatureCategory 
                title={CATEGORY_NAMES.protection}
                allPossibleFeatures={ALL_FEATURES.protection} 
                availableFeatures={carData.features.protection} 
              />
              <FeatureCategory 
                title={CATEGORY_NAMES.other}
                allPossibleFeatures={ALL_FEATURES.other} 
                availableFeatures={carData.features.other} 
              />
            </Section>

            {/* Description */}
            {carData.description !== 'Няма данни' && (
              <Section title="Описание">
                <p className="text-gray-700 whitespace-pre-wrap">{carData.description}</p>
              </Section>
            )}

            {/* Images */}
            {carData.images.length > 0 && carData.thumbnails && carData.thumbnails.length > 0 && (
              <Section title={`Снимки (${carData.imageCount})`}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {carData.thumbnails.map((thumbnail, index) => (
                    <div 
                      key={index} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(thumbnail)}`}
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
