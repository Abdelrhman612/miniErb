import { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import type { Product, Category, CreateProductDto, UpdateProductDto } from '../types';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FormField, TextareaField, SelectField } from '../components/ui/FormFields';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import axios from 'axios';

// ── Product Form ───────────────────────────────────────────────────────────────
interface ProductFormProps {
  initial?: Product;
  categories: Category[];
  onSave: (dto: CreateProductDto | UpdateProductDto) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ProductForm({ initial, categories, onSave, onCancel, saving }: ProductFormProps) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    barcode: initial?.barcode ?? '',
    purchasePrice: initial?.purchasePrice?.toString() ?? '0',
    sellingPrice: initial?.sellingPrice?.toString() ?? '0',
    minimumStock: initial?.minimumStock?.toString() ?? '0',
    unit: initial?.unit ?? '',
    categoryId: initial?.categoryId?.toString() ?? '',
    isActive: initial?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'الكود مطلوب';
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.unit.trim()) e.unit = 'وحدة القياس مطلوبة';
    if (!form.categoryId) e.categoryId = 'الفئة مطلوبة';
    if (Number(form.purchasePrice) < 0) e.purchasePrice = 'سعر الشراء لا يمكن أن يكون سالباً';
    if (Number(form.sellingPrice) < 0) e.sellingPrice = 'سعر البيع لا يمكن أن يكون سالباً';
    if (Number(form.minimumStock) < 0) e.minimumStock = 'الحد الأدنى لا يمكن أن يكون سالباً';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const base = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      minimumStock: Number(form.minimumStock),
      unit: form.unit.trim(),
      categoryId: Number(form.categoryId),
    };
    const dto = initial
      ? ({ ...base, isActive: form.isActive } as UpdateProductDto)
      : (base as CreateProductDto);
    await onSave(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pe-1">
      <div className="grid grid-cols-2 gap-4">
        <FormField id="p-code" label="الكود *" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="مثال: NL-001" error={errors.code} disabled={saving} />
        <FormField id="p-name" label="الاسم *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="اسم المنتج" error={errors.name} disabled={saving} />
      </div>
      <TextareaField id="p-desc" label="الوصف" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="وصف اختياري" disabled={saving} />
      <div className="grid grid-cols-2 gap-4">
        <FormField id="p-barcode" label="الباركود" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="باركود اختياري" disabled={saving} />
        <FormField id="p-unit" label="وحدة القياس *" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="مثال: قطعة، كيلو، متر" error={errors.unit} disabled={saving} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField id="p-purchase" label="سعر الشراء (ج.م)" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} error={errors.purchasePrice} disabled={saving} />
        <FormField id="p-selling" label="سعر البيع (ج.م)" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} error={errors.sellingPrice} disabled={saving} />
        <FormField id="p-minstock" label="الحد الأدنى للمخزون" type="number" step="0.01" min="0" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} error={errors.minimumStock} disabled={saving} />
      </div>
      <SelectField id="p-category" label="الفئة *" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} error={errors.categoryId} disabled={saving}>
        <option value="">-- اختر فئة --</option>
        {categories.filter((c) => c.isActive).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </SelectField>
      {initial && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => set('isActive', !form.isActive)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-300">{form.isActive ? 'نشط' : 'غير نشط'}</span>
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

// ── Products Page ──────────────────────────────────────────────────────────────
export function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState<Product | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [prods, cats] = await Promise.all([productService.getAll(), categoryService.getAll()]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setError('فشل في تحميل البيانات. تحقق من اتصالك بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openCreate = () => { setEditTarget(null); setSaveError(''); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditTarget(p); setSaveError(''); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); setSaveError(''); };

  const handleSave = async (dto: CreateProductDto | UpdateProductDto) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editTarget) {
        await productService.update(editTarget.id, dto as UpdateProductDto);
        showToast('تم تحديث المنتج بنجاح', 'success');
      } else {
        await productService.create(dto as CreateProductDto);
        showToast('تم إضافة المنتج بنجاح', 'success');
      }
      closeModal();
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? 'فشل في الحفظ';
        setSaveError(msg);
        showToast(msg, 'error');
      } else {
        setSaveError('فشل في الحفظ');
        showToast('فشل في الحفظ', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateConfirm) return;
    setDeactivateLoading(true);
    try {
      await productService.deactivate(deactivateConfirm.id);
      showToast('تم إلغاء تفعيل المنتج بنجاح', 'success');
      setDeactivateConfirm(null);
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? 'فشل في إلغاء التفعيل';
        setError(msg);
        showToast(msg, 'error');
      } else {
        setError('فشل في إلغاء التفعيل');
        showToast('فشل في إلغاء التفعيل', 'error');
      }
      setDeactivateConfirm(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await productService.delete(deleteConfirm.id);
      showToast('تم حذف المنتج نهائياً', 'success');
      setDeleteConfirm(null);
      await loadAll();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message ?? 'فشل في الحذف';
        setError(msg);
        showToast(msg, 'error');
      } else {
        setError('فشل في الحذف');
        showToast('فشل في الحذف', 'error');
      }
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'active') return matchesSearch && p.isActive;
    if (statusFilter === 'inactive') return matchesSearch && !p.isActive;
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100">إدارة المنتجات</h1>
          <p className="text-slate-400 text-sm mt-1">كتالوج قطع غيار ماكينات الخياطة وأسعارها</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          منتج جديد
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي المنتجات', value: products.length, color: 'text-slate-100', border: 'border-slate-800' },
          { label: 'المنتجات النشطة', value: products.filter(p => p.isActive).length, color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'المنتجات غير النشطة', value: products.filter(p => !p.isActive).length, color: 'text-rose-400', border: 'border-rose-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-slate-900/60 border ${stat.border} rounded-2xl p-5 shadow-lg`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative flex-1 w-full">
          <svg className="absolute top-1/2 -translate-y-1/2 end-4 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو الفئة..."
            className="w-full pe-11 ps-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === 'all' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            الكل ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            النشطة ({products.filter(p => p.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === 'inactive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            غير النشطة ({products.filter(p => !p.isActive).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><LoadingSpinner /></div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              title={searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات مسجلة'}
              description={searchTerm || statusFilter !== 'all' ? 'جرب تغيير شروط البحث أو تصتيف الحالة للوصول إلى النتيجة المطلوبة.' : 'ابدأ بإضافة أول منتج إلى النظام لتبدأ في إدارة المخزون والمبيعات.'}
              actionLabel={!searchTerm && statusFilter === 'all' ? '+ إضافة منتج جديد' : undefined}
              onAction={!searchTerm && statusFilter === 'all' ? openCreate : undefined}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold">
                      <th className="px-6 py-4">الكود</th>
                      <th className="px-6 py-4">اسم المنتج</th>
                      <th className="px-6 py-4">الفئة</th>
                      <th className="px-6 py-4">سعر البيع</th>
                      <th className="px-6 py-4">الوحدة</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filtered.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                            {product.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-100">{product.name}</p>
                          {product.barcode && <p className="text-xs text-slate-500 mt-0.5">باركود: {product.barcode}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                            {product.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-100">
                          {product.sellingPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">ج.م</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-medium">{product.unit}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            product.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {product.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(product)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 transition-colors"
                              title="تعديل"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {product.isActive && (
                              <button
                                onClick={() => setDeactivateConfirm(product)}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 transition-colors"
                                title="إلغاء التفعيل"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(product)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                              title="حذف نهائي"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                <span>عرض {filtered.length} من إجمالي {products.length} منتج</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editTarget ? `تعديل المنتج: ${editTarget.name}` : 'إضافة منتج جديد'}>
        {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
        <ProductForm
          initial={editTarget ?? undefined}
          categories={categories}
          onSave={handleSave}
          onCancel={closeModal}
          saving={saving}
        />
      </Modal>

      {/* Deactivate Confirm Modal */}
      <Modal isOpen={!!deactivateConfirm} onClose={() => setDeactivateConfirm(null)} title="تأكيد إلغاء التفعيل">
        <p className="text-slate-300 mb-6 text-sm">
          هل أنت متأكد من إلغاء تفعيل المنتج <span className="font-bold text-white">"{deactivateConfirm?.name}"</span>؟
          <br />
          <span className="text-xs text-slate-500 mt-1 block">سيتم إخفاء المنتج من قوائم الاختيار دون حذف السجل نهائياً.</span>
        </p>
        <div className="flex gap-3">
          <button onClick={handleDeactivate} disabled={deactivateLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm hover:bg-amber-500/25 transition-colors disabled:opacity-50">
            {deactivateLoading ? 'جاري التنفيذ...' : 'تأكيد إلغاء التفعيل'}
          </button>
          <button onClick={() => setDeactivateConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
            إلغاء
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="تأكيد الحذف النهائي">
        <p className="text-slate-300 mb-6 text-sm">
          هل أنت متأكد من حذف المنتج <span className="font-bold text-white">"{deleteConfirm?.name}"</span> نهائياً؟
          <br />
          <span className="text-xs text-rose-400 mt-1 block">تحذير: هذا الإجراء نهائي ولا يمكن التراجع عنه.</span>
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm hover:bg-rose-500/25 transition-colors disabled:opacity-50">
            {deleteLoading ? 'جاري الحذف...' : 'حذف نهائي'}
          </button>
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors">
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ProductsPage;
