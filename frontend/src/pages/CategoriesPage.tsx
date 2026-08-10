import { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FormField, TextareaField } from '../components/ui/FormFields';
import axios from 'axios';

// ── Category Form ──────────────────────────────────────────────────────────────
interface CategoryFormProps {
  initial?: Category;
  onSave: (dto: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function CategoryForm({ initial, onSave, onCancel, saving }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'الاسم مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const dto = initial
      ? ({ name: name.trim(), description: description.trim() || undefined, isActive } as UpdateCategoryDto)
      : ({ name: name.trim(), description: description.trim() || undefined } as CreateCategoryDto);
    await onSave(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="cat-name"
        label="اسم الفئة *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="مثال: إبر ماكينة"
        error={errors.name}
        disabled={saving}
      />
      <TextareaField
        id="cat-desc"
        label="الوصف"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="وصف اختياري للفئة"
        disabled={saving}
      />
      {initial && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsActive(!isActive)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              isActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                isActive ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="text-sm text-slate-300">{isActive ? 'نشطة' : 'غير نشطة'}</span>
        </label>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'جاري الحفظ...' : initial ? 'تحديث' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

// ── Categories Page ────────────────────────────────────────────────────────────
export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {
      setError('فشل في تحميل الفئات. تحقق من اتصالك بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setSaveError(''); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setSaveError(''); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

  const handleSave = async (dto: CreateCategoryDto | UpdateCategoryDto) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editTarget) {
        await categoryService.update(editTarget.id, dto as UpdateCategoryDto);
      } else {
        await categoryService.create(dto as CreateCategoryDto);
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
      await categoryService.delete(deleteConfirm.id);
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">الفئات</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة فئات المنتجات</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          فئة جديدة
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4">
          {categories.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p>لا توجد فئات بعد. أضف أول فئة الآن.</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">{cat.name}</p>
                    {cat.description && <p className="text-sm text-slate-500 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    cat.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-700/40 text-slate-500 border-slate-700/40'
                  }`}>
                    {cat.isActive ? 'نشطة' : 'غير نشطة'}
                  </span>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="تعديل"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cat)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="حذف"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? `تعديل: ${editTarget.name}` : 'إضافة فئة جديدة'}
      >
        {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
        <CategoryForm
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onCancel={closeModal}
          saving={saving}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد الحذف"
      >
        <p className="text-slate-300 mb-6">
          هل أنت متأكد من حذف الفئة <span className="font-bold text-white">"{deleteConfirm?.name}"</span>؟
          <br />
          <span className="text-sm text-slate-500 mt-1 block">لا يمكن حذف فئة مرتبطة بمنتجات.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-colors disabled:opacity-50"
          >
            {deleteLoading ? 'جاري الحذف...' : 'حذف'}
          </button>
          <button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
