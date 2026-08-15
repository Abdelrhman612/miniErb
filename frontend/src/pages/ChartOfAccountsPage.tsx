import React, { useEffect, useState } from 'react';
import { accountService } from '../services/api/accountService';
import type { Account, AccountTransactionResponseDto, CreateAccountDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateAccountDto>({
    code: '',
    name: '',
    accountType: 'Asset',
    parentAccountId: undefined,
    isGroup: false,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Statement / Transactions View State
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<AccountTransactionResponseDto[]>([]);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل دليل الحسابات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenStatement = async (account: Account) => {
    setSelectedAccount(account);
    await fetchTransactions(account.id, fromDate, toDate);
  };

  const fetchTransactions = async (accountId: number, fDate?: string, tDate?: string) => {
    try {
      setTxLoading(true);
      const data = await accountService.getTransactions(accountId, fDate || undefined, tDate || undefined);
      setTransactions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل حركات الحساب.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleFilterTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccount) {
      await fetchTransactions(selectedAccount.id, fromDate, toDate);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await accountService.create({
        code: formData.code.trim(),
        name: formData.name.trim(),
        accountType: formData.accountType,
        parentAccountId: formData.parentAccountId ? Number(formData.parentAccountId) : undefined,
        isGroup: formData.isGroup,
      });
      setSuccessMessage('تم إضافة الحساب بنجاح.');
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        name: '',
        accountType: 'Asset',
        parentAccountId: undefined,
        isGroup: false,
      });
      await fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إضافة الحساب.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (account: Account) => {
    try {
      setError(null);
      await accountService.update(account.id, {
        name: account.name,
        accountType: account.accountType,
        parentAccountId: account.parentAccountId,
        isGroup: account.isGroup,
        isActive: !account.isActive,
      });
      setSuccessMessage(`تم ${!account.isActive ? 'تنشيط' : 'إيقاف'} الحساب بنجاح.`);
      await fetchAccounts();
      if (selectedAccount?.id === account.id) {
        setSelectedAccount({ ...account, isActive: !account.isActive });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحديث حالة الحساب.');
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupAccounts = accounts.filter((a) => a.isGroup);

  if (loading && accounts.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-100">دليل الحسابات (Chart of Accounts)</h1>
          <p className="text-sm text-slate-400 mt-1">الشجرة المالية المركزية ونظام الحسابات والربط مع الخزائن والعملاء والموردين والمصروفات</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            إضافة حساب جديد
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      {/* Search and Filter */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-96 relative">
          <svg className="w-5 h-5 text-slate-500 absolute right-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="بحث بالكود أو اسم الحساب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-11 pl-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="text-sm text-slate-400">
          إجمالي الحسابات: <span className="font-bold text-slate-200">{accounts.length}</span>
        </div>
      </div>

      {/* Accounts Table / Tree */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="px-6 py-4">الكود</th>
                <th className="px-6 py-4">اسم الحساب</th>
                <th className="px-6 py-4">النوع الرئيسي</th>
                <th className="px-6 py-4">التصنيف</th>
                <th className="px-6 py-4">الرصيد (جنيه)</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    لا توجد حسابات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const typeName =
                    acc.accountType === 'Asset'
                      ? 'أصول'
                      : acc.accountType === 'Liability'
                      ? 'التزامات'
                      : acc.accountType === 'Equity'
                      ? 'حقوق ملكية'
                      : acc.accountType === 'Revenue'
                      ? 'إيرادات'
                      : acc.accountType === 'Expense'
                      ? 'مصروفات'
                      : acc.accountType === 'Treasury'
                      ? 'خزنة'
                      : acc.accountType === 'Customer'
                      ? 'عميل'
                      : acc.accountType === 'Supplier'
                      ? 'مورد'
                      : acc.accountType;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-emerald-400">
                        {acc.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-100">
                        <span className={acc.isGroup ? 'font-bold text-blue-400' : ''}>
                          {acc.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">{typeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            acc.isGroup
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {acc.isGroup ? 'مجموعة (رئيسي)' : 'فرعي (حركة)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-100">
                        {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            acc.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {acc.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenStatement(acc)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors text-xs font-medium"
                          >
                            كشف الحساب
                          </button>
                          <button
                            onClick={() => handleToggleStatus(acc)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              acc.isActive
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {acc.isActive ? 'إيقاف' : 'تنشيط'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة حساب جديد في الدليل"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">كود الحساب *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="مثال: 510005"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اسم الحساب *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: مصروف صيانة"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">نوع الحساب *</label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="Asset">أصول (Asset)</option>
              <option value="Liability">التزامات (Liability)</option>
              <option value="Equity">حقوق ملكية (Equity)</option>
              <option value="Revenue">إيرادات (Revenue)</option>
              <option value="Expense">مصروفات (Expense)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">الحساب الأب (المجموعة)</label>
            <select
              value={formData.parentAccountId || ''}
              onChange={(e) => setFormData({ ...formData, parentAccountId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- بدون حساب أب (جذري) --</option>
              {groupAccounts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isGroup"
              checked={formData.isGroup}
              onChange={(e) => setFormData({ ...formData, isGroup: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isGroup" className="text-sm font-medium text-slate-300">
              حساب رئيسي (مجموعة) - لا تقبل حركات مالية مباشرة
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
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

      {/* Account Statement / Transactions Modal */}
      {selectedAccount && (
        <Modal
          isOpen={!!selectedAccount}
          onClose={() => setSelectedAccount(null)}
          title={`كشف حساب: (${selectedAccount.code}) ${selectedAccount.name}`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
            {/* Account Info Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">نوع الحساب</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedAccount.accountType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">الرصيد الحالي</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} جنيه
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">الحالة</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {selectedAccount.isActive ? 'نشط' : 'متوقف'}
                </p>
              </div>
            </div>

            {/* Date Filters */}
            <form onSubmit={handleFilterTransactions} className="flex flex-wrap gap-4 items-end bg-slate-950 p-4 rounded-xl border border-slate-800 print:hidden">
              <div>
                <label className="block text-xs text-slate-400 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
              >
                بحث وتصفية
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 transition-colors ml-auto"
              >
                طباعة كشف الحساب
              </button>
            </form>

            {/* Transactions Table */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              {txLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  لا توجد حركات مالية مسجلة لهذا الحساب في الفترة المحددة.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                        <th className="px-4 py-3">التاريخ</th>
                        <th className="px-4 py-3">البيان</th>
                        <th className="px-4 py-3">الطرف</th>
                        <th className="px-4 py-3">مدين</th>
                        <th className="px-4 py-3">دائن</th>
                        <th className="px-4 py-3">الرصيد الجاري</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/50">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                            {new Date(tx.transactionDate).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="px-4 py-3 text-slate-200">{tx.description || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-400">{tx.partyName || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-rose-400">
                            {tx.debit > 0 ? tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-400">
                            {tx.credit > 0 ? tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-100">
                            {tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ChartOfAccountsPage;
