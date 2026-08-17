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
    return <div className="p-16 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-right" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-100">لوحة المؤشرات المالية (Financial Summary)</h1>
        <p className="text-slate-500 text-sm mt-1">ملخص مالي شامل مستمد مباشرة من نظام الحسابات والخزائن والمبيعات والمشتريات</p>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Treasury Balance */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">رصيد الخزينة</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-emerald-400">
              {totalTreasuryBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">إجمالي الأرصدة النقدية في الخزائن النشطة</p>
        </div>

        {/* Customer Receivables */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">إجمالي مستحقات العملاء</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-blue-400">
              {totalCustomerReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">الأرصدة المستحقة على العملاء (حسابات العملاء)</p>
        </div>

        {/* Supplier Payables */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">إجمالي مستحقات الموردين</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-amber-400">
              {totalSupplierPayables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">الأرصدة المستحقة للموردين (حسابات الموردين)</p>
        </div>

        {/* Total Sales */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">إجمالي المبيعات المؤكدة</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-teal-400">
              {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">إجمالي قيم فواتير المبيعات المؤكدة</p>
        </div>

        {/* Total Purchases */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">إجمالي المشتريات المؤكدة</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-purple-400">
              {totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">إجمالي قيم فواتير المشتريات المؤكدة</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">إجمالي المصروفات</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-rose-400">
              {totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-slate-400">جنيه</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">إجمالي حسابات المصروفات في الدليل</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={loadData}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors"
        >
          تحديث المؤشرات المالية
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
