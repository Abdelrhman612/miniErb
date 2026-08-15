import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { journalVoucherService, treasuryService, customerService, supplierService, accountService } from '../services/api';
import type { JournalVoucherResponseDto, CreateJournalVoucherDto, UpdateJournalVoucherDto, CreateJournalVoucherItemDto, TreasuryResponseDto, Customer, Supplier, Account } from '../types';
import { VoucherStatus } from '../types';

interface JournalFormProps {
    initial?: JournalVoucherResponseDto;
    treasuries: TreasuryResponseDto[];
    customers: Customer[];
    suppliers: Supplier[];
    accounts: Account[];
    onSave: (dto: CreateJournalVoucherDto) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

function JournalForm({ initial, accounts, onSave, onCancel, saving }: JournalFormProps) {
    const [voucherDate, setVoucherDate] = useState<string>(
        initial?.voucherDate ? new Date(initial.voucherDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    const [description, setDescription] = useState<string>(initial?.description ?? '');
    const transactionAccounts = useMemo(() => accounts.filter(a => !a.isGroup && a.isActive), [accounts]);
    const defaultAccId = transactionAccounts[0]?.id ?? 0;

    const [items, setItems] = useState<CreateJournalVoucherItemDto[]>(
        initial?.items?.map(i => ({ accountId: i.accountId, debit: i.debit, credit: i.credit, description: i.description })) ?? [
            { accountId: defaultAccId, debit: 0, credit: 0, description: '' },
            { accountId: defaultAccId, debit: 0, credit: 0, description: '' },
        ]
    );
    const [error, setError] = useState<string>('');

    const totalDebit = useMemo(() => items.reduce((sum, i) => sum + (Number(i.debit) || 0), 0), [items]);
    const totalCredit = useMemo(() => items.reduce((sum, i) => sum + (Number(i.credit) || 0), 0), [items]);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleAddItem = () => {
        setItems([...items, { accountId: defaultAccId, debit: 0, credit: 0, description: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length <= 2) {
            setError('سند القيد يجب أن يحتوي على بندين على الأقل.');
            return;
        }
        setItems(items.filter((_, idx) => idx !== index));
    };

    const handleItemChange = (index: number, field: keyof CreateJournalVoucherItemDto, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        // If debit is entered, clear credit (and vice versa)
        if (field === 'debit' && Number(value) > 0) {
            updated[index].credit = 0;
        } else if (field === 'credit' && Number(value) > 0) {
            updated[index].debit = 0;
        }
        setItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!isBalanced) {
            setError('إجمالي المدين يجب أن يساوي إجمالي الدائن وأن يكون أكبر من الصفر.');
            return;
        }

        const dto: CreateJournalVoucherDto = {
            voucherDate: new Date(voucherDate).toISOString(),
            description: description.trim() || undefined,
            items: items.map(i => ({
                accountId: Number(i.accountId),
                debit: Number(i.debit) || 0,
                credit: Number(i.credit) || 0,
                description: i.description?.trim() || undefined,
            })),
        };

        await onSave(dto);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">تاريخ السند *</label>
                    <input
                        type="date"
                        value={voucherDate}
                        onChange={(e) => setVoucherDate(e.target.value)}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">البيان العام *</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="بيان سند القيد..."
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                </div>
            </div>

            <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-200">بنود القيد المحاسبي (الحسابات والأطراف)</h3>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30"
                    >
                        + إضافة بند
                    </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className="md:col-span-5">
                                <label className="block text-[10px] text-slate-400 mb-0.5">الحساب من دليل الحسابات</label>
                                <select
                                    value={item.accountId}
                                    onChange={(e) => handleItemChange(index, 'accountId', Number(e.target.value))}
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                                >
                                    <option value={0}>اختر الحساب</option>
                                    {transactionAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.accountType})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] text-emerald-400 mb-0.5">مدين (Debit)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.debit}
                                    onChange={(e) => handleItemChange(index, 'debit', Number(e.target.value))}
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-bold text-emerald-400"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] text-rose-400 mb-0.5">دائن (Credit)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.credit}
                                    onChange={(e) => handleItemChange(index, 'credit', Number(e.target.value))}
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-bold text-rose-400"
                                />
                            </div>
                            <div className="md:col-span-1 flex justify-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                                    title="حذف البند"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                    <span>إجمالي المدين: <strong className="text-emerald-400">{totalDebit.toFixed(2)}</strong></span>
                </div>
                <div>
                    <span>إجمالي الدائن: <strong className="text-rose-400">{totalCredit.toFixed(2)}</strong></span>
                </div>
                <div>
                    <span>الحالة: <strong className={isBalanced ? 'text-emerald-400' : 'text-amber-400'}>{isBalanced ? 'متوازن ✓' : 'غير متوازن ✗'}</strong></span>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving || !isBalanced}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {saving ? 'جاري الحفظ...' : initial ? 'تحديث السند' : 'حفظ مسودة'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
                >
                    إلغاء
                </button>
            </div>
        </form>
    );
}

function JournalVoucherDetailsModal({
    voucher,
    onClose,
}: {
    voucher: JournalVoucherResponseDto | null;
    onClose: () => void;
}) {
    if (!voucher) return null;

    return (
        <Modal isOpen={!!voucher} onClose={onClose} title={`تفاصيل سند قيد: ${voucher.voucherNumber}`}>
            <div className="print-container bg-slate-900 print:bg-white text-slate-100 print:text-slate-900 p-6 rounded-2xl space-y-6">
                <div className="border-b border-slate-800 print:border-slate-300 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black">سند قيد مزدوج (Journal Voucher)</h2>
                        <p className="text-xs text-slate-400 print:text-slate-600 mt-1">رقم السند: <span className="font-mono font-bold">{voucher.voucherNumber}</span></p>
                    </div>
                    <div className="text-left print:text-right">
                        <p className="text-sm font-bold text-emerald-400 print:text-emerald-800">نظام ERP المصغر</p>
                        <p className="text-xs text-slate-400 print:text-slate-600">التاريخ: {new Date(voucher.voucherDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>

                <div className="bg-slate-950/60 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 text-sm space-y-2">
                    <div>
                        <span className="text-slate-400 print:text-slate-600 text-xs">الحالة: </span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            voucher.status === VoucherStatus.Confirmed
                                ? 'bg-emerald-500/15 text-emerald-400 print:text-emerald-900 border border-emerald-500/20'
                                : voucher.status === VoucherStatus.Cancelled
                                ? 'bg-rose-500/15 text-rose-400 print:text-rose-900 border border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-400 print:text-amber-900 border border-amber-500/20'
                        }`}>
                            {voucher.statusName}
                        </span>
                    </div>
                    {voucher.description && (
                        <div>
                            <span className="text-slate-400 print:text-slate-600 text-xs block">البيان العام</span>
                            <span className="text-slate-200 print:text-slate-900">{voucher.description}</span>
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-200 print:text-slate-900 mb-3">بنود القيد المحاسبي</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-900 border-b border-slate-800 print:border-slate-300">
                                <tr>
                                    <th className="p-3">الحساب</th>
                                    <th className="p-3">البيان</th>
                                    <th className="p-3">مدين</th>
                                    <th className="p-3">دائن</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-slate-900">
                                {voucher.items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-950/30">
                                        <td className="p-3 font-semibold text-slate-200 print:text-slate-900">{item.accountCode} - {item.accountName}</td>
                                        <td className="p-3 text-slate-400 print:text-slate-700">{item.description || '-'}</td>
                                        <td className="p-3 font-bold text-emerald-400 print:text-emerald-900">{item.debit > 0 ? item.debit.toFixed(2) : '-'}</td>
                                        <td className="p-3 font-bold text-rose-400 print:text-rose-900">{item.credit > 0 ? item.credit.toFixed(2) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-950 print:bg-slate-200 font-bold border-t border-slate-800 print:border-slate-300">
                                <tr>
                                    <td colSpan={2} className="p-3 text-left">الإجماليات:</td>
                                    <td className="p-3 text-emerald-400 print:text-emerald-900">{voucher.totalDebit.toFixed(2)}</td>
                                    <td className="p-3 text-rose-400 print:text-rose-900">{voucher.totalCredit.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-slate-700">
                    <div className="border-t border-slate-700 print:border-slate-400 pt-2">إعداد المحاسب</div>
                    <div className="border-t border-slate-700 print:border-slate-400 pt-2">اعتماد الإدارة المادية</div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-colors print:hidden"
                    >
                        طباعة السند
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors print:hidden"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export function JournalVouchersPage() {
    const [vouchers, setVouchers] = useState<JournalVoucherResponseDto[]>([]);
    const [treasuries, setTreasuries] = useState<TreasuryResponseDto[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<JournalVoucherResponseDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [detailsTarget, setDetailsTarget] = useState<JournalVoucherResponseDto | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<JournalVoucherResponseDto | null>(null);
    const [cancelTarget, setCancelTarget] = useState<JournalVoucherResponseDto | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [vData, tData, cData, sData, aData] = await Promise.all([
                journalVoucherService.getAll(),
                treasuryService.getAll(),
                customerService.getAll(),
                supplierService.getAll(),
                accountService.getAll(),
            ]);
            setVouchers(vData);
            setTreasuries(tData);
            setCustomers(cData);
            setSuppliers(sData);
            setAccounts(aData);
        } catch {
            setError('فشل في تحميل بيانات سندات القيد.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filtered = useMemo(() => {
        return vouchers.filter(v => {
            const term = query.trim().toLowerCase();
            const matchesQuery =
                !term ||
                [v.voucherNumber, v.description ?? ''].some(val =>
                    val.toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'draft' && v.status === VoucherStatus.Draft) ||
                (statusFilter === 'confirmed' && v.status === VoucherStatus.Confirmed) ||
                (statusFilter === 'cancelled' && v.status === VoucherStatus.Cancelled);

            return matchesQuery && matchesStatus;
        });
    }, [vouchers, query, statusFilter]);

    const openCreate = () => { setEditTarget(null); setSaveError(''); setModalOpen(true); };
    const openEdit = (v: JournalVoucherResponseDto) => {
        if (v.status !== VoucherStatus.Draft) return;
        setEditTarget(v);
        setSaveError('');
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

    const handleSave = async (dto: CreateJournalVoucherDto) => {
        setSaving(true);
        setSaveError('');
        try {
            if (editTarget) {
                await journalVoucherService.update(editTarget.id, dto as UpdateJournalVoucherDto);
            } else {
                await journalVoucherService.create(dto);
            }
            closeModal();
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSaveError(err.response?.data?.message ?? 'فشل في حفظ سند القيد.');
            } else {
                setSaveError('فشل في حفظ سند القيد.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        setActionLoading(true);
        try {
            await journalVoucherService.confirm(confirmTarget.id);
            setConfirmTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في تأكيد سند القيد.');
            } else {
                setError('فشل في تأكيد سند القيد.');
            }
            setConfirmTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setActionLoading(true);
        try {
            await journalVoucherService.cancel(cancelTarget.id);
            setCancelTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في إلغاء سند القيد.');
            } else {
                setError('فشل في إلغاء سند القيد.');
            }
            setCancelTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await journalVoucherService.delete(id);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في حذف السند المسودة.');
            } else {
                setError('فشل في حذف السند المسودة.');
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto text-right" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-100">سندات القيد المزدوج (Journal Vouchers)</h1>
                    <p className="text-slate-500 text-sm mt-1">إدراج وإدارة القيود المحاسبية المزدوجة بين الحسابات والخزائن</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    سند قيد جديد
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="بحث برقم السند أو البيان..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'draft', 'confirmed', 'cancelled'].map(st => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === st
                                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {st === 'all' && 'الكل'}
                            {st === 'draft' && 'مسودة'}
                            {st === 'confirmed' && 'مؤكد'}
                            {st === 'cancelled' && 'ملغي'}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="grid gap-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/60 rounded-2xl">
                            <p className="text-slate-500">لا توجد سندات قيد مطابقة لخيارات البحث أو التصفية.</p>
                        </div>
                    ) : (
                        filtered.map(v => (
                            <div
                                key={v.id}
                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-slate-100 text-base">{v.voucherNumber}</p>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                v.status === VoucherStatus.Confirmed
                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                                    : v.status === VoucherStatus.Cancelled
                                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {v.statusName}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                            <span>البيان: <strong className="text-slate-200">{v.description || '-'}</strong></span>
                                            <span>التاريخ: {new Date(v.voucherDate).toLocaleDateString('ar-EG')}</span>
                                            <span>عدد البنود: {v.items.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">إجمالي المبلغ:</p>
                                        <p className="text-sm font-bold text-emerald-400">{v.totalDebit.toFixed(2)} ج.م</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDetailsTarget(v)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                                        >
                                            التفاصيل والطباعة
                                        </button>

                                        {v.status === VoucherStatus.Draft && (
                                            <>
                                                <button
                                                    onClick={() => openEdit(v)}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                                                >
                                                    تعديل
                                                </button>
                                                <button
                                                    onClick={() => setConfirmTarget(v)}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                                >
                                                    تأكيد
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                                                >
                                                    حذف
                                                </button>
                                            </>
                                        )}

                                        {v.status === VoucherStatus.Confirmed && (
                                            <button
                                                onClick={() => setCancelTarget(v)}
                                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                                            >
                                                إلغاء السند
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editTarget ? `تعديل سند قيد: ${editTarget.voucherNumber}` : 'إضافة سند قيد جديد'}>
                {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
                <JournalForm
                    initial={editTarget ?? undefined}
                    treasuries={treasuries}
                    customers={customers}
                    suppliers={suppliers}
                    accounts={accounts}
                    onSave={handleSave}
                    onCancel={closeModal}
                    saving={saving}
                />
            </Modal>

            <JournalVoucherDetailsModal voucher={detailsTarget} onClose={() => setDetailsTarget(null)} />

            <Modal isOpen={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="تأكيد سند القيد">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من تأكيد سند القيد رقم <span className="font-bold text-white">"{confirmTarget?.voucherNumber}"</span>؟
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        سيتم تطبيق القيود المحاسبية على الحسابات المعنية تلقائياً.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'جاري التأكيد...' : 'تأكيد السند'}
                        </button>
                        <button
                            onClick={() => setConfirmTarget(null)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
                        >
                            تراجع
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="إلغاء سند القيد">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من إلغاء سند القيد رقم <span className="font-bold text-white">"{cancelTarget?.voucherNumber}"</span>؟
                    </p>
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        تحذير: هذا السند مؤكد. إلغاؤه سيؤدي إلى عكس الحركات المحاسبية لجميع بنود القيد تلقائياً.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCancel}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-400 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                        </button>
                        <button
                            onClick={() => setCancelTarget(null)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
                        >
                            تراجع
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
