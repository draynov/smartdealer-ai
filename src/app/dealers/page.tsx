'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Dealer {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  vehicle_count: number;
  created_at: string;
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const response = await fetch('/api/dealers');
      if (!response.ok) throw new Error('Failed to fetch dealers');
      const data = await response.json();
      setDealers(data);
    } catch (err) {
      setError('Грешка при зареждане на дилъри');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/dealers/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Грешка при изтриване');
        return;
      }

      // Refresh list
      fetchDealers();
      setDeleteConfirm(null);
    } catch (err) {
      alert('Грешка при изтриване на дилър');
      console.error(err);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Дилъри</h1>
          <Link
            href="/dealers/add"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Добави дилър
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Dealers Table */}
        {dealers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Няма добавени дилъри</p>
            <Link
              href="/dealers/add"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Добавете първия дилър
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Име
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Град
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Обяви
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {dealer.name}
                      </div>
                      <div className="text-sm text-gray-500">{dealer.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dealer.city || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dealer.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {dealer.vehicle_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dealers/${dealer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Виж
                        </Link>
                        <Link
                          href={`/dealers/${dealer.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Редактирай
                        </Link>
                        {deleteConfirm === dealer.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(dealer.id)}
                              className="text-red-600 hover:text-red-900 font-semibold"
                            >
                              Потвърди
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Откажи
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(dealer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Изтрий
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
