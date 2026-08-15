import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { receiptVoucherService, treasuryService, customerService, supplierService, accountService } from '../services/api';
import type { ReceiptVoucherResponseDto, CreateReceiptVoucherDto, UpdateReceiptVoucherDto, TreasuryResponseDto, Customer, Supplier, Account } from '../types';
import { VoucherStatus } from '../types';

interface ReceiptFormProps {
    initial?: ReceiptVoucherResponseDto;
    treasuries: TreasuryResponseDto[];
    customers: Customer[];
    suppliers: Supplier[];
    accounts: Account[];
    onSave: (dto: CreateReceiptVoucherDto) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

function ReceiptForm({ initial, treasuries, customers, suppliers, accounts, onSave, onCancel, saving }: ReceiptFormProps) {
    const [treasuryId, setTreasuryId] = useState<number>(initial?.treasuryId ?? (treasuries[0]?.id ?? 0));
    const [partyType, setPartyType] = useState<'customer' | 'supplier' | 'account' | 'other'>(
        initial?.customerId ? 'customer' : initial?.supplierId ? 'supplier' : initial?.counterAccountId ? 'account' : 'other'
    );
    const [customerId, setCustomerId] = useState<number>(initial?.customerId ?? (customers[0]?.id ?? 0));
    const [supplierId, setSupplierId] = useState<number>(initial?.supplierId ?? (suppliers[0]?.id ?? 0));
    const [counterAccountId, setCounterAccountId] = useState<number>(initial?.counterAccountId ?? (accounts.filter(a => !a.isGroup && a.isActive)[0]?.id ?? 0));
    const [partyName, setPartyName] = useState<string>(initial?.partyName ?? '');
    const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
    const [voucherDate, setVoucherDate] = useState<string>(
        initial?.voucherDate ? new Date(initial.voucherDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    const [description, setDescription] = useState<string>(initial?.description ?? '');
    const [error, setError] = useState<string>('');

    const transactionAccounts = useMemo(() => accounts.filter(a => !a.isGroup && a.isActive), [accounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!treasuryId) { setError('الخزنة مطلوبة'); return; }
        if (amount <= 0) { setError('المبلغ يجب أن يكون أكبر من الصفر'); return; }

        const dto: CreateReceiptVoucherDto = {
            treasuryId: Number(treasuryId),
            voucherDate: new Date(voucherDate).toISOString(),
            amount: Number(amount),
            description: description.trim() || undefined,
            customerId: partyType === 'customer' ? Number(customerId) : undefined,
            supplierId: partyType === 'supplier' ? Number(supplierId) : undefined,
            counterAccountId: partyType === 'account' ? Number(counterAccountId) : undefined,
            partyName: partyType === 'other' ? partyName.trim() || undefined : undefined,
        };

        await onSave(dto);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">الخزنة (مدين) *</label>
                <select
                    value={treasuryId}
                    onChange={(e) => setTreasuryId(Number(e.target.value))}
                    disabled={saving}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                    <option value={0}>اختر الخزنة</option>
                    {treasuries.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">نوع الطرف المقابل *</label>
                    <select
                        value={partyType}
                        onChange={(e) => setPartyType(e.target.value as any)}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    >
                        <option value="customer">عميل</option>
                        <option value="supplier">مورد</option>
                        <option value="account">حساب من دليل الحسابات</option>
                        <option value="other">طرف آخر / عام</option>
                    </select>
                </div>

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
            </div>

            {partyType === 'customer' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">العميل *</label>
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(Number(e.target.value))}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    >
                        <option value={0}>اختر العميل</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                    </select>
                </div>
            )}

            {partyType === 'supplier' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">المورد *</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(Number(e.target.value))}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    >
                        <option value={0}>اختر المورد</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                        ))}
                    </select>
                </div>
            )}

            {partyType === 'account' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">الحساب المقابل (من الدليل) *</label>
                    <select
                        value={counterAccountId}
                        onChange={(e) => setCounterAccountId(Number(e.target.value))}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    >
                        <option value={0}>اختر الحساب</option>
                        {transactionAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.accountType})</option>
                        ))}
                    </select>
                </div>
            )}

            {partyType === 'other' && (
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">اسم الطرف (المقبوض منه) *</label>
                    <input
                        type="text"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        placeholder="مثال: جهة خارجية"
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                </div>
            )}

            <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">المبلغ (جنيه) *</label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={saving}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-emerald-400"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">البيان / ملاحظات</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="بيان سند القبض..."
                    disabled={saving}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    rows={3}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={saving}
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

function ReceiptVoucherDetailsModal({
    voucher,
    onClose,
}: {
    voucher: ReceiptVoucherResponseDto | null;
    onClose: () => void;
}) {
    if (!voucher) return null;

    return (
        <Modal isOpen={!!voucher} onClose={onClose} title={`تفاصيل سند قبض: ${voucher.voucherNumber}`}>
            <div className="print-container bg-slate-900 print:bg-white text-slate-100 print:text-slate-900 p-6 rounded-2xl space-y-6">
                <div className="border-b border-slate-800 print:border-slate-300 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black">سند قبض (Receipt Voucher)</h2>
                        <p className="text-xs text-slate-400 print:text-slate-600 mt-1">رقم السند: <span className="font-mono font-bold">{voucher.voucherNumber}</span></p>
                    </div>
                    <div className="text-left print:text-right">
                        <p className="text-sm font-bold text-emerald-400 print:text-emerald-800">نظام ERP المصغر</p>
                        <p className="text-xs text-slate-400 print:text-slate-600">التاريخ: {new Date(voucher.voucherDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300 text-sm">
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">الحالة</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                            voucher.status === VoucherStatus.Confirmed
                                ? 'bg-emerald-500/15 text-emerald-400 print:text-emerald-900 border border-emerald-500/20'
                                : voucher.status === VoucherStatus.Cancelled
                                ? 'bg-rose-500/15 text-rose-400 print:text-rose-900 border border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-400 print:text-amber-900 border border-amber-500/20'
                        }`}>
                            {voucher.statusName}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">الخزنة</span>
                        <span className="font-semibold text-slate-200 print:text-slate-900">{voucher.treasuryName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">المقبوض منه (الطرف)</span>
                        <span className="font-bold text-emerald-300 print:text-emerald-900">{voucher.resolvedPartyName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">المبلغ</span>
                        <span className="font-black text-lg text-emerald-400 print:text-emerald-900">
                            {voucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} جنيه
                        </span>
                    </div>
                    {voucher.description && (
                        <div className="col-span-2">
                            <span className="text-slate-400 print:text-slate-600 block text-xs">البيان</span>
                            <span className="text-slate-300 print:text-slate-900">{voucher.description}</span>
                        </div>
                    )}
                </div>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 print:text-slate-700">
                    <div className="border-t border-slate-700 print:border-slate-400 pt-2">توقيع المستلم</div>
                    <div className="border-t border-slate-700 print:border-slate-400 pt-2">توقيع المحاسب / المسؤول</div>
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

export function ReceiptVouchersPage() {
    const [vouchers, setVouchers] = useState<ReceiptVoucherResponseDto[]>([]);
    const [treasuries, setTreasuries] = useState<TreasuryResponseDto[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ReceiptVoucherResponseDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [detailsTarget, setDetailsTarget] = useState<ReceiptVoucherResponseDto | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<ReceiptVoucherResponseDto | null>(null);
    const [cancelTarget, setCancelTarget] = useState<ReceiptVoucherResponseDto | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [vData, tData, cData, sData, aData] = await Promise.all([
                receiptVoucherService.getAll(),
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
            setError('فشل في تحميل بيانات سندات القبض.');
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
                [v.voucherNumber, v.resolvedPartyName, v.treasuryName, v.description ?? ''].some(val =>
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
    const openEdit = (v: ReceiptVoucherResponseDto) => {
        if (v.status !== VoucherStatus.Draft) return;
        setEditTarget(v);
        setSaveError('');
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

    const handleSave = async (dto: CreateReceiptVoucherDto) => {
        setSaving(true);
        setSaveError('');
        try {
            if (editTarget) {
                await receiptVoucherService.update(editTarget.id, dto as UpdateReceiptVoucherDto);
            } else {
                await receiptVoucherService.create(dto);
            }
            closeModal();
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSaveError(err.response?.data?.message ?? 'فشل في حفظ سند القبض.');
            } else {
                setSaveError('فشل في حفظ سند القبض.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        setActionLoading(true);
        try {
            await receiptVoucherService.confirm(confirmTarget.id);
            setConfirmTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في تأكيد السند.');
            } else {
                setError('فشل في تأكيد السند.');
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
            await receiptVoucherService.cancel(cancelTarget.id);
            setCancelTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في إلغاء السند.');
            } else {
                setError('فشل في إلغاء السند.');
            }
            setCancelTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await receiptVoucherService.delete(id);
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
                    <h1 className="text-2xl font-black text-slate-100">سندات القبض (Receipt Vouchers)</h1>
                    <p className="text-slate-500 text-sm mt-1">إدراج وإدارة سندات تحصيل الأموال وإضافتها للخزنة وحسابات العملاء/الموردين</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    سند قبض جديد
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="بحث برقم السند، اسم الطرف، الخزنة، أو البيان..."
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
                            <p className="text-slate-500">لا توجد سندات قبض مطابقة لخيارات البحث أو التصفية.</p>
                        </div>
                    ) : (
                        filtered.map(v => (
                            <div
                                key={v.id}
                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                            <span>الطرف: <strong className="text-slate-200">{v.resolvedPartyName}</strong></span>
                                            <span>الخزنة: <strong className="text-slate-200">{v.treasuryName}</strong></span>
                                            <span>التاريخ: {new Date(v.voucherDate).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">المبلغ:</p>
                                        <p className="text-lg font-black text-emerald-400">{v.amount.toFixed(2)} ج.م</p>
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

            <Modal isOpen={modalOpen} onClose={closeModal} title={editTarget ? `تعديل سند قبض: ${editTarget.voucherNumber}` : 'إضافة سند قبض جديد'}>
                {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
                <ReceiptForm
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

            <ReceiptVoucherDetailsModal voucher={detailsTarget} onClose={() => setDetailsTarget(null)} />

            <Modal isOpen={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="تأكيد سند القبض">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من تأكيد سند القبض رقم <span className="font-bold text-white">"{confirmTarget?.voucherNumber}"</span>؟
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        سيتم إيداع المبلغ في الخزنة وتحديث حساب الطرف (إن وجد) تلقائياً.
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

            <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="إلغاء سند القبض">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من إلغاء سند القبض رقم <span className="font-bold text-white">"{cancelTarget?.voucherNumber}"</span>؟
                    </p>
                    <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        تحذير: هذا السند مؤكد. إلغاؤه سيؤدي إلى عكس الحركات المالية في الخزنة والحسابات تلقائياً عبر قيود العكس.
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
