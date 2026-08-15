import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Alert } from '../components/ui/Alert';
import { FormField, TextareaField } from '../components/ui/FormFields';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { customerService } from '../services/api';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '../types';

interface CustomerFormProps {
    initial?: Customer;
    onSave: (dto: CreateCustomerDto | UpdateCustomerDto) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

function CustomerForm({ initial, onSave, onCancel, saving }: CustomerFormProps) {
    const [name, setName] = useState(initial?.name ?? '');
    const [phone, setPhone] = useState(initial?.phone ?? '');
    const [phone2, setPhone2] = useState(initial?.phone2 ?? '');
    const [address, setAddress] = useState(initial?.address ?? '');
    const [notes, setNotes] = useState(initial?.notes ?? '');
    const [openingBalance, setOpeningBalance] = useState(initial?.openingBalance ?? 0);
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'اسم العميل مطلوب';
        if (!phone.trim()) e.phone = 'رقم الهاتف مطلوب';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const dto = initial
            ? ({
                name: name.trim(),
                phone: phone.trim(),
                phone2: phone2.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
                openingBalance,
                isActive,
            } as UpdateCustomerDto)
            : ({
                name: name.trim(),
                phone: phone.trim(),
                phone2: phone2.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
                openingBalance,
            } as CreateCustomerDto);

        await onSave(dto);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField id="customer-name" label="اسم العميل *" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد علي" error={errors.name} disabled={saving} />
            <FormField id="customer-phone" label="الهاتف *" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: 01000000000" error={errors.phone} disabled={saving} />
            <FormField id="customer-phone2" label="الهاتف 2" value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="اختياري" disabled={saving} />
            <TextareaField id="customer-address" label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اختياري" disabled={saving} />
            <TextareaField id="customer-notes" label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" disabled={saving} />
            <FormField id="customer-opening" label="الرصيد الافتتاحي" type="number" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} disabled={saving} />
            {initial && (
                <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setIsActive(!isActive)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-slate-300">{isActive ? 'نشط' : 'غير نشط'}</span>
                </label>
            )}
            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {saving ? 'جاري الحفظ...' : initial ? 'تحديث' : 'إضافة'}
                </button>
                <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
                    إلغاء
                </button>
            </div>
        </form>
    );
}

export function CustomersPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState<Customer | null>(null);
    const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await customerService.getAll();
            setCustomers(data);
        } catch {
            setError('فشل في تحميل العملاء. تحقق من اتصالك بالسيرفر.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const filtered = customers.filter((item) => {
        const term = query.trim().toLowerCase();
        if (!term) return true;
        return [item.name, item.phone, item.address ?? ''].some((value) => value.toLowerCase().includes(term));
    });

    const openCreate = () => { setEditTarget(null); setSaveError(''); setModalOpen(true); };
    const openEdit = (item: Customer) => { setEditTarget(item); setSaveError(''); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

    const handleSave = async (dto: CreateCustomerDto | UpdateCustomerDto) => {
        setSaving(true);
        setSaveError('');
        try {
            if (editTarget) {
                await customerService.update(editTarget.id, dto as UpdateCustomerDto);
            } else {
                await customerService.create(dto as CreateCustomerDto);
            }
            closeModal();
            await load();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSaveError(err.response?.data?.message ?? 'فشل في الحفظ');
            } else {
                setSaveError('فشل في الحفظ');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteLoading(true);
        try {
            await customerService.delete(deleteConfirm.id);
            setDeleteConfirm(null);
            await load();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في الحذف');
            } else {
                setError('فشل في الحذف');
            }
            setDeleteConfirm(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleHardDelete = async () => {
        if (!hardDeleteConfirm) return;
        setHardDeleteLoading(true);
        try {
            await customerService.deletePermanently(hardDeleteConfirm.id);
            setHardDeleteConfirm(null);
            await load();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في الحذف النهائي');
            } else {
                setError('فشل في الحذف النهائي');
            }
            setHardDeleteConfirm(null);
        } finally {
            setHardDeleteLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-100">العملاء</h1>
                    <p className="text-slate-500 text-sm mt-1">إدارة بيانات العملاء والأرصدة الافتتاحية والحسابات</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    عميل جديد
                </button>
            </div>

            <div className="mb-6">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو العنوان" className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>

            {error && <Alert type="error" message={error} />}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="grid gap-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <p>{query ? 'لا توجد نتائج لهذا البحث.' : 'لا توجد عملاء بعد. أضف أول عميل الآن.'}</p>
                        </div>
                    ) : filtered.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-100">{item.name}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{item.phone}</p>
                                    {item.address && <p className="text-sm text-slate-500">{item.address}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/40 text-slate-500 border-slate-700/40'}`}>
                                    {item.isActive ? 'نشط' : 'غير نشط'}
                                </span>
                                <button
                                    onClick={() => navigate(`/customers/${item.id}/account`)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors"
                                >
                                    كشف الحساب
                                </button>
                                <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="تعديل">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => setDeleteConfirm(item)} className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="إلغاء التفعيل">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0 9 9 0 0112.728 0zm-6.364 2.5v4m0 4h.01" /></svg>
                                </button>
                                <button onClick={() => setHardDeleteConfirm(item)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="حذف نهائي">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editTarget ? `تعديل: ${editTarget.name}` : 'إضافة عميل جديد'}>
                {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
                <CustomerForm initial={editTarget ?? undefined} onSave={handleSave} onCancel={closeModal} saving={saving} />
            </Modal>

            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="تأكيد إلغاء التفعيل">
                <p className="text-slate-300 mb-6">
                    هل أنت متأكد من إلغاء تفعيل العميل <span className="font-bold text-white">"{deleteConfirm?.name}"</span>؟
                </p>
                <div className="flex gap-3">
                    <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                        {deleteLoading ? 'جاري الحفظ...' : 'إلغاء التفعيل'}
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
                        إلغاء
                    </button>
                </div>
            </Modal>

            <Modal isOpen={!!hardDeleteConfirm} onClose={() => setHardDeleteConfirm(null)} title="تأكيد الحذف النهائي">
                <p className="text-slate-300 mb-6">
                    هذا الإجراء سيحذف العميل <span className="font-bold text-white">"{hardDeleteConfirm?.name}"</span> نهائياً من قاعدة البيانات.
                </p>
                <div className="flex gap-3">
                    <button onClick={handleHardDelete} disabled={hardDeleteLoading} className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-50">
                        {hardDeleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
                    </button>
                    <button onClick={() => setHardDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
                        إلغاء
                    </button>
                </div>
            </Modal>
        </div>
    );
}
