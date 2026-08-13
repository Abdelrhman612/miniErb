import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import {
    purchaseInvoiceService,
    supplierService,
    warehouseService,
    productService,
} from '../services/api';
import type {
    PurchaseInvoiceResponseDto,
    CreatePurchaseInvoiceDto,
    UpdatePurchaseInvoiceDto,
    CreatePurchaseInvoiceItemDto,
    Supplier,
    Warehouse,
    Product,
} from '../types';
import { PaymentType, PurchaseInvoiceStatus } from '../types';

interface PurchaseInvoiceFormProps {
    initial?: PurchaseInvoiceResponseDto;
    suppliers: Supplier[];
    warehouses: Warehouse[];
    products: Product[];
    onSave: (dto: CreatePurchaseInvoiceDto) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

function PurchaseInvoiceForm({
    initial,
    suppliers,
    warehouses,
    products,
    onSave,
    onCancel,
    saving,
}: PurchaseInvoiceFormProps) {
    const [supplierId, setSupplierId] = useState<number>(initial?.supplierId ?? (suppliers[0]?.id ?? 0));
    const [warehouseId, setWarehouseId] = useState<number>(initial?.warehouseId ?? (warehouses[0]?.id ?? 0));
    const [invoiceDate, setInvoiceDate] = useState<string>(
        initial?.invoiceDate
            ? new Date(initial.invoiceDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [paymentType, setPaymentType] = useState<PaymentType>(initial?.paymentType ?? PaymentType.Cash);
    const [paidAmount, setPaidAmount] = useState<number>(initial?.paidAmount ?? 0);
    const [notes, setNotes] = useState<string>(initial?.notes ?? '');
    const [items, setItems] = useState<CreatePurchaseInvoiceItemDto[]>(
        initial?.items?.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })) ?? []
    );

    const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id ?? 0);
    const [itemQuantity, setItemQuantity] = useState<number>(1);
    const [itemUnitCost, setItemUnitCost] = useState<number>(0);

    const [formError, setFormError] = useState<string>('');

    // Update unit cost when selected product changes
    useEffect(() => {
        const prod = products.find(p => p.id === Number(selectedProductId));
        if (prod) {
            setItemUnitCost(prod.purchasePrice);
        }
    }, [selectedProductId, products]);

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    }, [items]);

    // Auto-adjust paid amount when payment type changes
    useEffect(() => {
        if (paymentType === PaymentType.Cash) {
            setPaidAmount(totalAmount);
        } else if (paymentType === PaymentType.Credit) {
            setPaidAmount(0);
        } else if (paymentType === PaymentType.Partial) {
            if (paidAmount >= totalAmount || paidAmount <= 0) {
                setPaidAmount(Number((totalAmount * 0.5).toFixed(2)));
            }
        }
    }, [paymentType, totalAmount]);

    const handleAddItem = () => {
        setFormError('');
        if (!selectedProductId || selectedProductId <= 0) {
            setFormError('يرجى اختيار منتج صحيح.');
            return;
        }
        if (itemQuantity <= 0) {
            setFormError('الكمية يجب أن تكون أكبر من الصفر.');
            return;
        }
        if (itemUnitCost < 0) {
            setFormError('تكلفة الوحدة لا يمكن أن تكون سالبة.');
            return;
        }

        // Check duplicate product
        if (items.some(i => i.productId === Number(selectedProductId))) {
            setFormError('هذا المنتج مضاف بالفعل في الفاتورة.');
            return;
        }

        setItems([
            ...items,
            {
                productId: Number(selectedProductId),
                quantity: Number(itemQuantity),
                unitCost: Number(itemUnitCost),
            },
        ]);
        setItemQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, idx) => idx !== index));
    };

    const validate = (): string => {
        if (!supplierId) return 'المورد مطلوب.';
        if (!warehouseId) return 'المستودع مطلوب.';
        if (!invoiceDate) return 'تاريخ الفاتورة مطلوب.';
        if (items.length === 0) return 'يجب إضافة بند واحد على الأقل للفاتورة.';

        for (const item of items) {
            if (item.quantity <= 0) return 'كمية كل منتج يجب أن تكون أكبر من الصفر.';
            if (item.unitCost < 0) return 'تكلفة الوحدة لا يمكن أن تكون سالبة.';
        }

        if (paidAmount < 0) return 'المبلغ المدفوع لا يمكن أن يكون سالباً.';
        if (paidAmount > totalAmount) return 'المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة.';

        if (paymentType === PaymentType.Cash && Math.abs(paidAmount - totalAmount) > 0.01) {
            return 'في الدفع النقدي (Cash)، يجب أن يكون المبلغ المدفوع مساوياً لإجمالي الفاتورة.';
        }
        if (paymentType === PaymentType.Credit && paidAmount !== 0) {
            return 'في الشراء الآجل (Credit)، يجب أن يكون المبلغ المدفوع صفراً.';
        }
        if (paymentType === PaymentType.Partial && (paidAmount <= 0 || paidAmount >= totalAmount)) {
            return 'في الدفع الجزئي (Partial)، يجب أن يكون المبلغ المدفوع أكبر من الصفر وأقل من إجمالي الفاتورة.';
        }

        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setFormError(err);
            return;
        }

        const dto: CreatePurchaseInvoiceDto = {
            supplierId: Number(supplierId),
            warehouseId: Number(warehouseId),
            invoiceDate: new Date(invoiceDate).toISOString(),
            paymentType: Number(paymentType) as PaymentType,
            paidAmount: Number(paidAmount),
            notes: notes.trim() || undefined,
            items: items.map(i => ({
                productId: Number(i.productId),
                quantity: Number(i.quantity),
                unitCost: Number(i.unitCost),
            })),
        };

        await onSave(dto);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {formError && <Alert type="error" message={formError} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">المورد *</label>
                    <select
                        value={supplierId}
                        onChange={e => setSupplierId(Number(e.target.value))}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value={0}>اختر المورد</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.phone})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">المستودع *</label>
                    <select
                        value={warehouseId}
                        onChange={e => setWarehouseId(Number(e.target.value))}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value={0}>اختر المستودع</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} ({w.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">تاريخ الفاتورة *</label>
                    <input
                        type="date"
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">طريقة الدفع *</label>
                    <select
                        value={paymentType}
                        onChange={e => setPaymentType(Number(e.target.value) as PaymentType)}
                        disabled={saving}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value={PaymentType.Cash}>نقدي (Cash)</option>
                        <option value={PaymentType.Credit}>آجل (Credit)</option>
                        <option value={PaymentType.Partial}>جزئي (Partial)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">المبلغ المدفوع *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paidAmount}
                        onChange={e => setPaidAmount(Number(e.target.value))}
                        disabled={saving || paymentType === PaymentType.Cash || paymentType === PaymentType.Credit}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">ملاحظات</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={saving}
                        placeholder="ملاحظات اختيارية..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
            </div>

            {/* Items Section */}
            <div className="border-t border-slate-800 pt-5">
                <h3 className="text-base font-bold text-slate-200 mb-3">بنود الفاتورة (المنتجات)</h3>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-4">
                    <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">المنتج</label>
                        <select
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm"
                        >
                            <option value={0}>اختر المنتج</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.code} - {p.name} (شراء: {p.purchasePrice})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">الكمية</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={itemQuantity}
                            onChange={e => setItemQuantity(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">تكلفة الوحدة</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemUnitCost}
                            onChange={e => setItemUnitCost(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-colors"
                        >
                            إضافة بند
                        </button>
                    </div>
                </div>

                {/* Items Table */}
                {items.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">لم يتم إضافة أي بند بعد.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-3">المنتج</th>
                                    <th className="p-3">الكمية</th>
                                    <th className="p-3">تكلفة الوحدة</th>
                                    <th className="p-3">الإجمالي</th>
                                    <th className="p-3 text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {items.map((item, index) => {
                                    const prod = products.find(p => p.id === item.productId);
                                    const itemTotal = item.quantity * item.unitCost;
                                    return (
                                        <tr key={index} className="hover:bg-slate-950/40">
                                            <td className="p-3 text-slate-200">
                                                {prod ? `${prod.code} - ${prod.name}` : `منتج #${item.productId}`}
                                            </td>
                                            <td className="p-3 text-slate-300">{item.quantity}</td>
                                            <td className="p-3 text-slate-300">{item.unitCost.toFixed(2)}</td>
                                            <td className="p-3 font-semibold text-emerald-400">{itemTotal.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title="حذف البند"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Invoice Totals Banner */}
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400">إجمالي الفاتورة:</p>
                        <p className="text-xl font-black text-emerald-400">{totalAmount.toFixed(2)} ج.م</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-400">المبلغ المدفوع:</p>
                        <p className="text-lg font-bold text-blue-400">{Number(paidAmount).toFixed(2)} ج.م</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {saving ? 'جاري الحفظ...' : initial ? 'تحديث الفاتورة' : 'حفظ كمسودة (Draft)'}
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

function PurchaseInvoiceDetailsModal({
    invoice,
    onClose,
}: {
    invoice: PurchaseInvoiceResponseDto | null;
    onClose: () => void;
}) {
    if (!invoice) return null;

    return (
        <Modal isOpen={!!invoice} onClose={onClose} title={`تفاصيل فاتورة المشتريات: ${invoice.invoiceNumber}`}>
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
                    <div>
                        <span className="text-slate-400 block text-xs">رقم الفاتورة</span>
                        <span className="font-bold text-slate-100">{invoice.invoiceNumber}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">الحالة</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                            invoice.status === PurchaseInvoiceStatus.Confirmed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : invoice.status === PurchaseInvoiceStatus.Cancelled
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                            {invoice.statusName}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">المورد</span>
                        <span className="font-semibold text-slate-200">{invoice.supplierName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">المستودع</span>
                        <span className="font-semibold text-slate-200">{invoice.warehouseName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">تاريخ الفاتورة</span>
                        <span className="text-slate-300">{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">طريقة الدفع</span>
                        <span className="text-slate-300">{invoice.paymentTypeName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">إجمالي الفاتورة</span>
                        <span className="font-bold text-emerald-400">{invoice.totalAmount.toFixed(2)} ج.م</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs">المبلغ المدفوع</span>
                        <span className="font-bold text-blue-400">{invoice.paidAmount.toFixed(2)} ج.م</span>
                    </div>
                    {invoice.notes && (
                        <div className="col-span-2">
                            <span className="text-slate-400 block text-xs">ملاحظات</span>
                            <span className="text-slate-300">{invoice.notes}</span>
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-3">بنود الفاتورة</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-2.5">المنتج</th>
                                    <th className="p-2.5">الكمية</th>
                                    <th className="p-2.5">تكلفة الوحدة</th>
                                    <th className="p-2.5">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {invoice.items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-950/30">
                                        <td className="p-2.5 text-slate-200">{item.productCode} - {item.productName}</td>
                                        <td className="p-2.5 text-slate-300">{item.quantity}</td>
                                        <td className="p-2.5 text-slate-300">{item.unitCost.toFixed(2)}</td>
                                        <td className="p-2.5 font-semibold text-emerald-400">{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export function PurchaseInvoicesPage() {
    const [invoices, setInvoices] = useState<PurchaseInvoiceResponseDto[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [query, setQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editTarget, setEditTarget] = useState<PurchaseInvoiceResponseDto | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');

    const [detailsTarget, setDetailsTarget] = useState<PurchaseInvoiceResponseDto | null>(null);

    const [confirmTarget, setConfirmTarget] = useState<PurchaseInvoiceResponseDto | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const [cancelTarget, setCancelTarget] = useState<PurchaseInvoiceResponseDto | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [invData, supData, whData, prodData] = await Promise.all([
                purchaseInvoiceService.getAll(),
                supplierService.getAll(),
                warehouseService.getAll(),
                productService.getAll(),
            ]);
            setInvoices(invData);
            setSuppliers(supData);
            setWarehouses(whData);
            setProducts(prodData);
        } catch {
            setError('فشل في تحميل بيانات فواتير المشتريات أو البيانات المرتبطة.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filtered = useMemo(() => {
        return invoices.filter(inv => {
            const term = query.trim().toLowerCase();
            const matchesQuery =
                !term ||
                [inv.invoiceNumber, inv.supplierName, inv.warehouseName, inv.notes ?? ''].some(val =>
                    val.toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'draft' && inv.status === PurchaseInvoiceStatus.Draft) ||
                (statusFilter === 'confirmed' && inv.status === PurchaseInvoiceStatus.Confirmed) ||
                (statusFilter === 'cancelled' && inv.status === PurchaseInvoiceStatus.Cancelled);

            return matchesQuery && matchesStatus;
        });
    }, [invoices, query, statusFilter]);

    const openCreate = () => {
        setEditTarget(null);
        setSaveError('');
        setModalOpen(true);
    };

    const openEdit = (inv: PurchaseInvoiceResponseDto) => {
        if (inv.status !== PurchaseInvoiceStatus.Draft) return;
        setEditTarget(inv);
        setSaveError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditTarget(null);
        setSaveError('');
    };

    const handleSave = async (dto: CreatePurchaseInvoiceDto) => {
        setSaving(true);
        setSaveError('');
        try {
            if (editTarget) {
                await purchaseInvoiceService.update(editTarget.id, dto as UpdatePurchaseInvoiceDto);
            } else {
                await purchaseInvoiceService.create(dto);
            }
            closeModal();
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSaveError(err.response?.data?.message ?? 'فشل في حفظ الفاتورة.');
            } else {
                setSaveError('فشل في حفظ الفاتورة.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        setActionLoading(true);
        try {
            await purchaseInvoiceService.confirm(confirmTarget.id);
            setConfirmTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في تأكيد الفاتورة.');
            } else {
                setError('فشل في تأكيد الفاتورة.');
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
            await purchaseInvoiceService.cancel(cancelTarget.id);
            setCancelTarget(null);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في إلغاء الفاتورة.');
            } else {
                setError('فشل في إلغاء الفاتورة.');
            }
            setCancelTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteDraft = async (id: number) => {
        try {
            await purchaseInvoiceService.delete(id);
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message ?? 'فشل في حذف الفاتورة المسودة.');
            } else {
                setError('فشل في حذف الفاتورة المسودة.');
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-100">فواتير المشتريات</h1>
                    <p className="text-slate-500 text-sm mt-1">إدارة فواتير مشتريات المخازن وتأكيدها أو إلغاؤها</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    فاتورة مشتريات جديدة
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="بحث برقم الفاتورة، اسم المورد، المستودع، أو الملاحظات..."
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
                            {st === 'confirmed' && 'مؤكدة'}
                            {st === 'cancelled' && 'ملغاة'}
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
                            <p className="text-slate-500">
                                {query || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة لخيارات البحث أو التصفية.' : 'لا توجد فواتير مشتريات حتى الآن. أضف أول فاتورة الآن.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map(inv => (
                            <div
                                key={inv.id}
                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-slate-100 text-base">{inv.invoiceNumber}</p>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                inv.status === PurchaseInvoiceStatus.Confirmed
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : inv.status === PurchaseInvoiceStatus.Cancelled
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {inv.statusName}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                            <span>المورد: <strong className="text-slate-200">{inv.supplierName}</strong></span>
                                            <span>المستودع: <strong className="text-slate-200">{inv.warehouseName}</strong></span>
                                            <span>التاريخ: {new Date(inv.invoiceDate).toLocaleDateString('ar-EG')}</span>
                                            <span>الدفع: {inv.paymentTypeName}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">الإجمالي / المدفوع:</p>
                                        <p className="text-sm font-bold text-emerald-400">
                                            {inv.totalAmount.toFixed(2)} ج.م <span className="text-xs text-slate-500 font-normal">({inv.paidAmount.toFixed(2)} مدفوع)</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDetailsTarget(inv)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                                        >
                                            التفاصيل
                                        </button>

                                        {inv.status === PurchaseInvoiceStatus.Draft && (
                                            <>
                                                <button
                                                    onClick={() => openEdit(inv)}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                                                >
                                                    تعديل
                                                </button>
                                                <button
                                                    onClick={() => setConfirmTarget(inv)}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                                                >
                                                    تأكيد
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDraft(inv.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                                                >
                                                    حذف
                                                </button>
                                            </>
                                        )}

                                        {(inv.status === PurchaseInvoiceStatus.Draft || inv.status === PurchaseInvoiceStatus.Confirmed) && (
                                            <button
                                                onClick={() => setCancelTarget(inv)}
                                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                                            >
                                                إلغاء الفاتورة
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editTarget ? `تعديل فاتورة مشتريات: ${editTarget.invoiceNumber}` : 'إشاء فاتورة مشتريات جديدة'}
            >
                {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
                <PurchaseInvoiceForm
                    initial={editTarget ?? undefined}
                    suppliers={suppliers}
                    warehouses={warehouses}
                    products={products}
                    onSave={handleSave}
                    onCancel={closeModal}
                    saving={saving}
                />
            </Modal>

            {/* Details Modal */}
            <PurchaseInvoiceDetailsModal
                invoice={detailsTarget}
                onClose={() => setDetailsTarget(null)}
            />

            {/* Confirm Dialog */}
            <Modal isOpen={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="تأكيد فاتورة المشتريات">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من تأكيد الفاتورة رقم <span className="font-bold text-white">"{confirmTarget?.invoiceNumber}"</span>؟
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        ملاحظة: سيقوم النظام تلقائياً بإضافة الكميات المشتراة إلى المستودع المحدد وخصم المبلغ المدفوع من الخزنة.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? 'جاري التأكيد...' : 'تأكيد الفاتورة'}
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

            {/* Cancel Dialog */}
            <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="إلغاء فاتورة المشتريات">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من إلغاء الفاتورة رقم <span className="font-bold text-white">"{cancelTarget?.invoiceNumber}"</span>؟
                    </p>
                    {cancelTarget?.status === PurchaseInvoiceStatus.Confirmed && (
                        <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            تحذير: هذه الفاتورة مؤكدة. إلغاؤها سيؤدي إلى عكس تأثيراتها تلقائياً (خصم الكميات من المستودع واسترداد المبلغ المدفوع للخزنة).
                        </p>
                    )}
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
