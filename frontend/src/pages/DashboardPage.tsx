import { useEffect, useState } from 'react';
import { accountService, treasuryService, salesInvoiceService, purchaseInvoiceService } from '../services/api';
import type { Account, TreasuryResponseDto, SalesInvoiceResponseDto, PurchaseInvoiceResponseDto } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Alert } from '../components/ui/Alert';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [treasuries, setTreasuries] = useState<TreasuryResponseDto[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceResponseDto[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceResponseDto[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [accs, treas, sales, purchases] = await Promise.all([
        accountService.getAll(),
        treasuryService.getAll(),
        salesInvoiceService.getAll(),
        purchaseInvoiceService.getAll(),
      ]);
      setAccounts(accs);
      setTreasuries(treas);
      setSalesInvoices(sales);
      setPurchaseInvoices(purchases);
    } catch {
      setError('فشل في تحميل مؤشرات الملخص المالي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute metrics from backend values
  const totalTreasuryBalance = treasuries.reduce((sum, t) => sum + (Number(t.balance) || 0), 0);

  const customerAccounts = accounts.filter(a => a.accountType === 'Customer');
  const totalCustomerReceivables = customerAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const supplierAccounts = accounts.filter(a => a.accountType === 'Supplier');
  const totalSupplierPayables = supplierAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalSales = salesInvoices
    .filter(inv => inv.status === 2) // Confirmed
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const totalPurchases = purchaseInvoices
    .filter(inv => inv.status === 2) // Confirmed
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

  const expenseAccounts = accounts.filter(a => a.accountType === 'Expense');
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  if (loading) {
    return <div className="p-24 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">لوحة المؤشرات المالية (Financial Summary)</h1>
          <p className="text-zinc-400 text-xs mt-1">ملخص مالي شامل مستمد مباشرة من نظام الحسابات والخزائن والمبيعات والمشتريات</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 hover:text-zinc-100 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>تحديث المؤشرات</span>
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Treasury Balance */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">رصيد الخزينة الإجمالي</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-400">
              {totalTreasuryBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">الأرصدة النقدية المتاحة في الخزائن النشطة</p>
        </div>

        {/* Customer Receivables */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">مستحقات العملاء</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-400">
              {totalCustomerReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">إجمالي الأرصدة غير المدافاة من العملاء</p>
        </div>

        {/* Supplier Payables */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">مستحقات الموردين</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-400">
              {totalSupplierPayables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">إجمالي الالتزامات المستحقة للموردين</p>
        </div>

        {/* Total Sales */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">إجمالي المبيعات المؤكدة</span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-teal-400">
              {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">قيمة فواتير المبيعات المعتمدة نهائياً</p>
        </div>

        {/* Total Purchases */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">إجمالي المشتريات المؤكدة</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7v8m0 0v2m0-2l8 4" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-purple-400">
              {totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">قيمة فواتير المشتريات المعتمدة نهائياً</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#121216] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">إجمالي المصروفات</span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-rose-400">
              {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-medium text-zinc-400">جنيه</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">الأرصدة المسجلة في حسابات المصروفات</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
