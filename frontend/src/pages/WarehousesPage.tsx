import { useState, useEffect } from 'react';
import { warehouseService } from '../services/api';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FormField, TextareaField } from '../components/ui/FormFields';
import axios from 'axios';

// ── Warehouse Form ─────────────────────────────────────────────────────────────
interface WarehouseFormProps {
  initial?: Warehouse;
  onSave: (dto: CreateWarehouseDto | UpdateWarehouseDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function WarehouseForm({ initial, onSave, onCancel, saving }: WarehouseFormProps) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = 'الكود مطلوب';
    if (!name.trim()) e.name = 'الاسم مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const base = { code: code.trim(), name: name.trim(), address: address.trim() || undefined };
    const dto = initial
      ? ({ ...base, isActive } as UpdateWarehouseDto)
      : (base as CreateWarehouseDto);
    await onSave(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField id="wh-code" label="الكود *" value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: WH-01" error={errors.code} disabled={saving} />
        <FormField id="wh-name" label="اسم المخزن *" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المخزن" error={errors.name} disabled={saving} />
      </div>
      <TextareaField id="wh-address" label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="عنوان المخزن (اختياري)" disabled={saving} />
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

// ── Warehouses Page ────────────────────────────────────────────────────────────
export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState<Warehouse | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await warehouseService.getAll();
      setWarehouses(data);
    } catch {
      setError('فشل في تحميل المخازن. تحقق من اتصالك بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setSaveError(''); setModalOpen(true); };
  const openEdit = (w: Warehouse) => { setEditTarget(w); setSaveError(''); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

  const handleSave = async (dto: CreateWarehouseDto | UpdateWarehouseDto) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editTarget) {
        await warehouseService.update(editTarget.id, dto as UpdateWarehouseDto);
      } else {
        await warehouseService.create(dto as CreateWarehouseDto);
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

  const handleDeactivate = async () => {
    if (!deactivateConfirm) return;
    setDeactivateLoading(true);
    try {
      await warehouseService.deactivate(deactivateConfirm.id);
      setDeactivateConfirm(null);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'فشل في إلغاء التفعيل');
      } else {
        setError('فشل في إلغاء التفعيل');
      }
      setDeactivateConfirm(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">المخازن</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة مواقع التخزين</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          مخزن جديد
        </button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {warehouses.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p>لا توجد مخازن بعد. أضف أول مخزن الآن.</p>
            </div>
          ) : (
            warehouses.map((wh) => (
              <div key={wh.id} className="p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{wh.name}</p>
                      <span className="font-mono text-xs text-slate-500">{wh.code}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${
                    wh.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-700/40 text-slate-500 border-slate-700/40'
                  }`}>
                    {wh.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>

                {wh.address && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {wh.address}
                  </p>
                )}

                <div className="flex gap-2 pt-1 border-t border-slate-800">
                  <button onClick={() => openEdit(wh)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل
                  </button>
                  {wh.isActive && (
                    <button onClick={() => setDeactivateConfirm(wh)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      إلغاء التفعيل
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editTarget ? `تعديل: ${editTarget.name}` : 'إضافة مخزن جديد'}>
        {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
        <WarehouseForm initial={editTarget ?? undefined} onSave={handleSave} onCancel={closeModal} saving={saving} />
      </Modal>

      {/* Deactivate Confirm */}
      <Modal isOpen={!!deactivateConfirm} onClose={() => setDeactivateConfirm(null)} title="تأكيد إلغاء التفعيل">
        <p className="text-slate-300 mb-6">
          هل تريد إلغاء تفعيل المخزن <span className="font-bold text-white">"{deactivateConfirm?.name}"</span>؟
        </p>
        <div className="flex gap-3">
          <button onClick={handleDeactivate} disabled={deactivateLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors disabled:opacity-50">
            {deactivateLoading ? 'جاري التنفيذ...' : 'إلغاء التفعيل'}
          </button>
          <button onClick={() => setDeactivateConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
