'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DealerFormData {
  name: string;
  slug: string;
  mobile_profile_url: string;
  phone: string;
  city: string;
  address: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  member_since: string;
  website_url: string;
  email: string;
  facebook_url: string;
  instagram_url: string;
  working_hours: Record<string, string>;
}

export default function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<DealerFormData>({
    name: '',
    slug: '',
    mobile_profile_url: '',
    phone: '',
    city: '',
    address: '',
    description: '',
    logo_url: '',
    cover_image_url: '',
    member_since: '',
    website_url: '',
    email: '',
    facebook_url: '',
    instagram_url: '',
    working_hours: {},
  });

  useEffect(() => {
    fetchDealer();
  }, [id]);

  const fetchDealer = async () => {
    try {
      const response = await fetch(`/api/dealers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch dealer');
      const data = await response.json();
      
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        mobile_profile_url: data.mobile_profile_url || '',
        phone: data.phone || '',
        city: data.city || '',
        address: data.address || '',
        description: data.description || '',
        logo_url: data.logo_url || '',
        cover_image_url: data.cover_image_url || '',
        member_since: data.member_since ? String(data.member_since) : '',
        website_url: data.website_url || '',
        email: data.email || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        working_hours: data.working_hours || {},
      });
    } catch (err) {
      setError('Грешка при зареждане на дилър');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReScrape = async () => {
    if (!formData.mobile_profile_url) {
      setError('Моля, попълнете Mobile.bg URL за обновяване');
      return;
    }

    setScraping(true);
    setError('');

    try {
      const response = await fetch('/api/dealers/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.mobile_profile_url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Грешка при зареждане');
      }

      const data = await response.json();
      
      // Update form with scraped data, but keep slug
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || prev.phone,
        city: data.city || prev.city,
        address: data.address || prev.address,
        description: data.description || prev.description,
        logo_url: data.logo_url || prev.logo_url,
        cover_image_url: data.cover_image_url || prev.cover_image_url,
        member_since: data.member_since ? String(data.member_since) : prev.member_since,
        working_hours: data.working_hours || prev.working_hours,
      }));
    } catch (err: any) {
      setError(err.message || 'Грешка при зареждане на данни');
      console.error(err);
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      setError('Име и slug са задължителни');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        member_since: formData.member_since ? parseInt(formData.member_since, 10) : null,
        working_hours: Object.keys(formData.working_hours).length > 0 ? formData.working_hours : null,
      };

      const response = await fetch(`/api/dealers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обновяване');
      }

      router.push(`/dealers/${id}`);
    } catch (err: any) {
      setError(err.message || 'Грешка при обновяване на дилър');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof DealerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Зареждане...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dealers/${id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Назад към дилър
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Редактирай дилър</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Re-scrape section */}
          {formData.mobile_profile_url && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Обнови данни от Mobile.bg
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Автоматично обнови информацията от Mobile.bg профила
              </p>
              <button
                type="button"
                onClick={handleReScrape}
                disabled={scraping}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {scraping ? 'Обновяване...' : '🔄 Обнови данните'}
              </button>
            </div>
          )}

          {/* Form fields */}
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Основна информация
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Име <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Град
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  В Mobile.bg от година
                </label>
                <input
                  type="number"
                  value={formData.member_since}
                  onChange={(e) => handleChange('member_since', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <h3 className="text-md font-semibold text-gray-900 mt-6 mb-4">
              URLs
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile.bg URL
                </label>
                <input
                  type="url"
                  value={formData.mobile_profile_url}
                  onChange={(e) => handleChange('mobile_profile_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Собствен сайт
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleChange('website_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {saving ? 'Запазване...' : '💾 Запази промените'}
            </button>
            <Link
              href={`/dealers/${id}`}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Откажи
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
