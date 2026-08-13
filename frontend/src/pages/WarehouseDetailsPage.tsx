import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { warehouseService } from '../services/api';
import type { WarehouseInventory } from '../types';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function WarehouseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<WarehouseInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const data = await warehouseService.getInventory(Number(id));
        setInventory(data);
      } catch {
        setError('فشل في تحميل بيانات مخزون المستودع.');
      } finally {
        setLoading(false);
      }
    };
    void fetchInventory();
  }, [id]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back button & Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/warehouses')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          العودة للمخازن
        </button>
      </div>

      {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

      {loading ? (
        <LoadingSpinner />
      ) : inventory ? (
        <div className="space-y-6">
          {/* Warehouse Info Card */}
          <div className="p-6 bg-slate-900/60 border border-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-100">{inventory.warehouseName}</h1>
                <p className="font-mono text-xs text-slate-400 mt-0.5">كود المخزن: {inventory.warehouseCode}</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              عدد المنتجات المخزنة: <strong className="text-emerald-400">{inventory.items.length}</strong>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">البضاعة الموجودة في المخزن</h2>

            {inventory.items.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-base text-slate-400">لا توجد منتجات في هذا المخزن</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">المنتج</th>
                      <th className="p-3.5">الكود</th>
                      <th className="p-3.5 text-left">الكمية المتاحة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventory.items.map(item => (
                      <tr key={item.productId} className="hover:bg-slate-950/40">
                        <td className="p-3.5 font-semibold text-slate-200">{item.productName}</td>
                        <td className="p-3.5 font-mono text-xs text-slate-400">{item.productCode}</td>
                        <td className="p-3.5 text-left font-bold text-emerald-400">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
