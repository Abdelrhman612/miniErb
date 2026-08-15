import React, { useEffect, useState } from 'react';
import { treasuryService } from '../services/api/treasuryService';
import type { TreasuryResponseDto, AccountTransactionResponseDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function TreasuryPage() {
  const [treasuries, setTreasuries] = useState<TreasuryResponseDto[]>([]);
  const [selectedTreasury, setSelectedTreasury] = useState<TreasuryResponseDto | null>(null);
  const [transactions, setTransactions] = useState<AccountTransactionResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    initialBalance: 0,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTreasuries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await treasuryService.getAll();
      setTreasuries(data);
      if (data.length > 0) {
        if (!selectedTreasury || !data.some(t => t.id === selectedTreasury.id)) {
          setSelectedTreasury(data[0]);
          await fetchTransactions(data[0].id);
        } else {
          // refresh selected treasury details
          const current = data.find(t => t.id === selectedTreasury.id);
          if (current) setSelectedTreasury(current);
          await fetchTransactions(selectedTreasury.id);
        }
      } else {
        setSelectedTreasury(null);
        setTransactions([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل الخزائن.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (treasuryId: number) => {
    try {
      setTxLoading(true);
      const data = await treasuryService.getTransactions(treasuryId);
      setTransactions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل حركات الخزنة.');
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuries();
  }, []);

  const handleSelectTreasury = async (treasury: TreasuryResponseDto) => {
    setSelectedTreasury(treasury);
    await fetchTransactions(treasury.id);
  };

  const handleCreateTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const created = await treasuryService.create({
        name: formData.name,
        code: formData.code,
        initialBalance: Number(formData.initialBalance),
      });
      setSuccessMessage('تم إنشاء الخزنة بنجاح.');
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', initialBalance: 0 });
      await fetchTreasuries();
      setSelectedTreasury(created);
      await fetchTransactions(created.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء الخزنة.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && treasuries.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">الخزنة والحسابات المالية</h1>
          <p className="text-sm text-slate-400 mt-1">إدارة الخزائن النقدية ومتابعة حركات القبض والصرف والرصيد الحالي</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          إضافة خزنة جديدة
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {treasuries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-200">لا توجد خزائن مضافة</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">قم بإنشاء خزنة جديدة لبدء تسجيل الحركات المالية.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
          >
            إنشاء الخزنة الرئيسية
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Treasury Tabs / Selector if multiple */}
          {treasuries.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {treasuries.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTreasury(t)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    selectedTreasury?.id === t.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {t.name} ({t.code})
                </button>
              ))}
            </div>
          )}

          {selectedTreasury && (
            <>
              {/* Treasury Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">اسم الخزنة</p>
                  <p className="text-xl font-bold text-slate-100 mt-2">{selectedTreasury.name}</p>
                  <p className="text-xs text-slate-500 mt-1">الكود: {selectedTreasury.code}</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">الرصيد الحالي</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-emerald-400">
                      {selectedTreasury.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-medium text-slate-400">جنيه</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">يتم احتساب الرصيد تلقائياً من الحركات</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">حالة الخزنة</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${selectedTreasury.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="text-base font-semibold text-slate-200">
                      {selectedTreasury.isActive ? 'نشطة' : 'غير نشطة'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">تاريخ الإنشاء: {new Date(selectedTreasury.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>

              {/* Transactions History Table */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-100">سجل حركات الخزنة</h3>
                  <span className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full">
                    إجمالي الحركات: {transactions.length}
                  </span>
                </div>

                {txLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <LoadingSpinner />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <p>لا توجد حركات مالية مسجلة لهذه الخزنة حتى الآن.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                          <th className="px-6 py-4">التاريخ</th>
                          <th className="px-6 py-4">النوع</th>
                          <th className="px-6 py-4">الطرف (العميل / المورد)</th>
                          <th className="px-6 py-4">المبلغ (جنيه)</th>
                          <th className="px-6 py-4">البيان</th>
                          <th className="px-6 py-4">المصدر / المرجع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                        {transactions.map((tx) => {
                          const isCredit = tx.transactionType === 2; // Credit = Inflow
                          return (
                            <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                {new Date(tx.transactionDate).toLocaleString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    isCredit
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {isCredit ? 'دائن (قبض)' : 'مدين (صرف)'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-200">
                                {tx.partyName ? (
                                  <span className="px-3 py-1 rounded-lg bg-slate-800/80 text-emerald-400 border border-slate-700">
                                    {tx.partyName}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold">
                                <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isCredit ? '+' : '-'}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-200">{tx.description || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                                {tx.referenceType ? `${tx.referenceType} #${tx.referenceId || ''}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Treasury Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة خزنة جديدة"
      >
        <form onSubmit={handleCreateTreasury} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اسم الخزنة *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: الخزنة الرئيسية"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">كود الخزنة *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: CASH-001"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">الرصيد الافتتاحي (جنيه)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">سيتم تسجيل الرصيد الافتتاحي تلقائياً في سجل حركات الخزنة.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default TreasuryPage;
