import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { supplierService } from '../services/api';
import type { SupplierAccountResponseDto, AccountTransactionResponseDto } from '../types';

export function SupplierAccountPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const supplierId = Number(id);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [account, setAccount] = useState<SupplierAccountResponseDto | null>(null);
    const [transactions, setTransactions] = useState<AccountTransactionResponseDto[]>([]);

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const loadData = async (fDate?: string, tDate?: string) => {
        try {
            setLoading(true);
            setError('');
            const [accData, txData] = await Promise.all([
                supplierService.getAccount(supplierId),
                supplierService.getAccountTransactions(supplierId, fDate, tDate),
            ]);
            setAccount(accData);
            setTransactions(txData);
        } catch {
            setError('فشل في تحميل بيانات حساب المورد.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!supplierId) return;
        void loadData();
    }, [supplierId]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        void loadData(fromDate || undefined, toDate || undefined);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading && !account) {
        return <div className="p-12"><LoadingSpinner /></div>;
    }

    if (error && !account) {
        return <div className="p-8 max-w-4xl mx-auto"><Alert type="error" message={error} /></div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-none text-right" dir="rtl">
            <div className="flex items-center justify-between mb-6 print:hidden">
                <button
                    onClick={() => navigate('/suppliers')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    العودة للموردين
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    طباعة كشف الحساب
                </button>
            </div>

            <div className="print-container bg-slate-900/60 print:bg-white border border-slate-800 print:border-none rounded-3xl p-6 md:p-8 space-y-6">
                <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-slate-100 print:text-slate-900">كشف حساب مورد</h1>
                        <p className="text-slate-400 print:text-slate-600 text-sm mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="text-left print:text-right">
                        <p className="text-lg font-extrabold text-emerald-400 print:text-emerald-700">نظام ERP المصغر</p>
                        <p className="text-xs text-slate-500">إدارة الحسابات والمشتريات</p>
                    </div>
                </div>

                {account && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-2xl border border-slate-800 print:border-slate-300">
                            <span className="text-xs text-slate-400 print:text-slate-600 block">المورد</span>
                            <span className="text-base font-bold text-slate-100 print:text-slate-900 block mt-1">{account.supplierName}</span>
                            <span className="text-xs text-slate-500 block mt-0.5">{account.phone}</span>
                            {account.address && <span className="text-xs text-slate-500 block">{account.address}</span>}
                        </div>

                        <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-2xl border border-slate-800 print:border-slate-300">
                            <span className="text-xs text-slate-400 print:text-slate-600 block">الرصيد الافتتاحي</span>
                            <span className="text-lg font-bold text-slate-200 print:text-slate-900 block mt-1">
                                {account.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                            </span>
                            <span className="text-xs text-slate-500 block mt-1">إجمالي المشتريات: {account.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-2xl border border-slate-800 print:border-slate-300">
                            <span className="text-xs text-slate-400 print:text-slate-600 block">إجمالي المدفوع / المستحق</span>
                            <span className="text-lg font-bold text-blue-400 print:text-blue-700 block mt-1">
                                {account.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                            </span>
                            <span className="text-xs text-amber-400 print:text-amber-700 block mt-1">
                                المستحق: {account.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                            </span>
                        </div>

                        <div className="bg-emerald-500/10 print:bg-emerald-50 p-4 rounded-2xl border border-emerald-500/20 print:border-emerald-300">
                            <span className="text-xs text-emerald-400 print:text-emerald-800 block font-semibold">المستحق للمورد</span>
                            <span className="text-2xl font-black text-emerald-300 print:text-emerald-900 block mt-1">
                                {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
                            </span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">من تاريخ:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">إلى تاريخ:</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                    >
                        تصفية التقرير
                    </button>
                    {(fromDate || toDate) && (
                        <button
                            type="button"
                            onClick={() => { setFromDate(''); setToDate(''); void loadData(undefined, undefined); }}
                            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
                        >
                            إزالة التصفية
                        </button>
                    )}
                </form>

                {error && <Alert type="error" message={error} />}

                <div>
                    <h3 className="text-base font-bold text-slate-200 print:text-slate-900 mb-3">حركات الحساب</h3>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-950/40 print:bg-slate-50 rounded-2xl border border-slate-800/80 print:border-slate-300">
                            <p className="text-sm">لا توجد حركات مسجلة في هذا النطاق الزمني</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300">
                            <table className="w-full text-right text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-800 font-bold uppercase tracking-wider">
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">رقم الفاتورة</th>
                                        <th className="p-3">البيان</th>
                                        <th className="p-3">المدين</th>
                                        <th className="p-3">الدائن</th>
                                        <th className="p-3">المبلغ</th>
                                        <th className="p-3">المدفوع</th>
                                        <th className="p-3">المستحق</th>
                                        <th className="p-3">المنتجات</th>
                                        <th className="p-3">الرصيد</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-slate-300 print:text-slate-900">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                                            <td className="p-3 whitespace-nowrap text-slate-400 print:text-slate-700">
                                                {new Date(tx.transactionDate).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="p-3 font-mono font-bold text-slate-200 print:text-slate-900">{tx.invoiceNumber || '-'}</td>
                                            <td className="p-3 text-slate-200 print:text-slate-900">{tx.description || '-'}</td>
                                            <td className="p-3 font-bold text-amber-400 print:text-amber-700 whitespace-nowrap">
                                                {tx.debit > 0 ? tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-bold text-emerald-400 print:text-emerald-700 whitespace-nowrap">
                                                {tx.credit > 0 ? tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-semibold whitespace-nowrap">{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 font-semibold text-blue-400 print:text-blue-700 whitespace-nowrap">
                                                {tx.paidAmount > 0 ? tx.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-semibold text-amber-400 print:text-amber-700 whitespace-nowrap">
                                                {tx.outstandingAmount > 0 ? tx.outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3">
                                                {tx.products && tx.products.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {tx.products.map((p, idx) => (
                                                            <div key={idx} className="text-xs text-slate-400 print:text-slate-700">
                                                                {p.productName} ({p.quantity} × {p.unitPrice})
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 font-black text-emerald-300 print:text-emerald-900 whitespace-nowrap">
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
        </div>
    );
}
