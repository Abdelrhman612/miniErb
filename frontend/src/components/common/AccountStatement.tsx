import React, { useState } from 'react';
import type { AccountTransactionResponseDto } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AccountStatementProps {
  accountName: string;
  accountCode: string;
  accountType: string;
  openingBalance?: number;
  transactions: AccountTransactionResponseDto[];
  loading?: boolean;
  onFilter?: (fromDate: string, toDate: string) => void;
  onRefresh?: () => void;
}

export function AccountStatement({
  accountName,
  accountCode,
  accountType,
  openingBalance = 0,
  transactions,
  loading = false,
  onFilter,
  onRefresh,
}: AccountStatementProps) {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onFilter) {
      onFilter(fromDate, toDate);
    }
  };

  const totalDebit = transactions.reduce((sum, tx) => sum + (Number(tx.debit) || 0), 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + (Number(tx.credit) || 0), 0);
  const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance : openingBalance;

  const typeName =
    accountType === 'Asset'
      ? 'أصول'
      : accountType === 'Liability'
      ? 'التزامات'
      : accountType === 'Equity'
      ? 'حقوق ملكية'
      : accountType === 'Revenue'
      ? 'إيرادات'
      : accountType === 'Expense'
      ? 'مصروفات'
      : accountType === 'Treasury'
      ? 'خزنة'
      : accountType === 'Customer'
      ? 'عميل'
      : accountType === 'Supplier'
      ? 'مورد'
      : accountType;

  return (
    <div className="print-container space-y-6 text-right" dir="rtl">
      {/* Header / Info */}
      <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 print:border-slate-300 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-100 print:text-slate-900">كشف حساب عام (Account Statement)</h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                تحديث
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
            >
              طباعة كشف الحساب
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 print:bg-slate-100 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
            <span className="text-xs text-slate-400 print:text-slate-600 block">اسم الحساب</span>
            <span className="text-sm font-bold text-slate-100 print:text-slate-900 block mt-1">{accountName}</span>
            <span className="text-xs text-emerald-400 print:text-emerald-800 font-mono block mt-0.5">الكود: {accountCode}</span>
          </div>
          <div className="bg-slate-950/60 print:bg-slate-100 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
            <span className="text-xs text-slate-400 print:text-slate-600 block">نوع الحساب</span>
            <span className="text-sm font-bold text-slate-200 print:text-slate-900 block mt-1">{typeName}</span>
          </div>
          <div className="bg-slate-950/60 print:bg-slate-100 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
            <span className="text-xs text-slate-400 print:text-slate-600 block">الرصيد الافتتاحي</span>
            <span className="text-sm font-bold text-slate-200 print:text-slate-900 block mt-1">
              {openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} جنيه
            </span>
          </div>
          <div className="bg-emerald-500/10 print:bg-emerald-50 p-3.5 rounded-xl border border-emerald-500/20 print:border-emerald-300">
            <span className="text-xs text-emerald-400 print:text-emerald-800 block font-semibold">الرصيد الختامي</span>
            <span className="text-lg font-black text-emerald-300 print:text-emerald-900 block mt-1">
              {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} جنيه
            </span>
          </div>
        </div>

        {/* Filter Form */}
        {onFilter && (
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3 pt-2 print:hidden">
            <div>
              <label className="block text-xs text-slate-400 mb-1">من تاريخ</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
            >
              بحث وتصفية
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  onFilter('', '');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
              >
                إزالة التصفية
              </button>
            )}
          </form>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 print:bg-white border border-slate-800 print:border-slate-300 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 print:border-slate-300 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 print:text-slate-900">سجل حركات الحساب</h3>
          <span className="text-xs text-slate-400 print:text-slate-600 bg-slate-800/60 print:bg-slate-200 px-3 py-1 rounded-full">
            عدد الحركات: {transactions.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            لا توجد حركات مالية مسجلة لهذا الحساب في الفترة المحددة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-900 font-bold uppercase tracking-wider border-b border-slate-800 print:border-slate-300">
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المستند / المرجع</th>
                  <th className="p-3.5">البيان</th>
                  <th className="p-3.5">الطرف</th>
                  <th className="p-3.5">مدين</th>
                  <th className="p-3.5">دائن</th>
                  <th className="p-3.5">الرصيد الجاري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-slate-900">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="p-3.5 whitespace-nowrap text-slate-400 print:text-slate-700">
                      {new Date(tx.transactionDate).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-200 print:text-slate-900">
                      {tx.referenceType ? `${tx.referenceType} #${tx.referenceId || tx.invoiceNumber || ''}` : '-'}
                    </td>
                    <td className="p-3.5 text-slate-200 print:text-slate-900">{tx.description || '-'}</td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400 print:text-slate-700">{tx.partyName || '-'}</td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-rose-400 print:text-rose-800">
                      {tx.debit > 0 ? tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-emerald-400 print:text-emerald-800">
                      {tx.credit > 0 ? tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-black text-slate-100 print:text-slate-900">
                      {tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 print:bg-slate-200 font-bold border-t border-slate-800 print:border-slate-300">
                <tr>
                  <td colSpan={4} className="p-3.5 text-left">الإجماليات:</td>
                  <td className="p-3.5 text-rose-400 print:text-rose-800">
                    {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-emerald-400 print:text-emerald-800">
                    {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3.5 text-emerald-300 print:text-emerald-900">
                    {closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Signature Area for Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 text-center text-xs text-slate-700 pt-12">
        <div className="border-t border-slate-400 pt-2">توقيع المحاسب</div>
        <div className="border-t border-slate-400 pt-2">اعتماد الإدارة المادية</div>
      </div>
    </div>
  );
}

export default AccountStatement;
