import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import {
    salesInvoiceService,
    customerService,
    warehouseService,
    productService,
} from '../services/api';
import type {
    SalesInvoiceResponseDto,
    CreateSalesInvoiceDto,
    UpdateSalesInvoiceDto,
    CreateSalesInvoiceItemDto,
    Customer,
    Warehouse,
    Product,
} from '../types';
import { PaymentType, PurchaseInvoiceStatus } from '../types';

interface SalesInvoiceFormProps {
    initial?: SalesInvoiceResponseDto;
    customers: Customer[];
    warehouses: Warehouse[];
    products: Product[];
    onSave: (dto: CreateSalesInvoiceDto) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

function SalesInvoiceForm({
    initial,
    customers,
    warehouses,
    products,
    onSave,
    onCancel,
    saving,
}: SalesInvoiceFormProps) {
    const [customerId, setCustomerId] = useState<number>(initial?.customerId ?? (customers[0]?.id ?? 0));
    const [warehouseId, setWarehouseId] = useState<number>(initial?.warehouseId ?? (warehouses[0]?.id ?? 0));
    const [invoiceDate, setInvoiceDate] = useState<string>(
        initial?.invoiceDate
            ? new Date(initial.invoiceDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [paymentType, setPaymentType] = useState<PaymentType>(initial?.paymentType ?? PaymentType.Cash);
    const [paidAmount, setPaidAmount] = useState<number>(initial?.paidAmount ?? 0);
    const [notes, setNotes] = useState<string>(initial?.notes ?? '');
    const [items, setItems] = useState<CreateSalesInvoiceItemDto[]>(
        initial?.items?.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) ?? []
    );

    const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id ?? 0);
    const [itemQuantity, setItemQuantity] = useState<number>(1);
    const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
    const [warehouseInventory, setWarehouseInventory] = useState<Record<number, number>>({});

    useEffect(() => {
        if (!warehouseId) {
            setWarehouseInventory({});
            return;
        }
        warehouseService.getInventory(warehouseId)
            .then(res => {
                const map: Record<number, number> = {};
                res.items.forEach(i => {
                    map[i.productId] = i.quantity;
                });
                setWarehouseInventory(map);
            })
            .catch(() => {
                setWarehouseInventory({});
            });
    }, [warehouseId]);

    const availableQty = selectedProductId ? (warehouseInventory[selectedProductId] ?? 0) : 0;

    const [formError, setFormError] = useState<string>('');

    // Update unit price when selected product changes (default to selling price)
    useEffect(() => {
        const prod = products.find(p => p.id === Number(selectedProductId));
        if (prod) {
            setItemUnitPrice(prod.sellingPrice);
        }
    }, [selectedProductId, products]);

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    }, [items]);

    const remainingAmount = useMemo(() => {
        return Math.max(0, totalAmount - paidAmount);
    }, [totalAmount, paidAmount]);

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
        if (itemQuantity > availableQty) {
            setFormError('الكمية المطلوبة أكبر من الكمية المتاحة');
            return;
        }
        if (itemUnitPrice < 0) {
            setFormError('سعر الوحدة لا يمكن أن يكون سالباً.');
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
                unitPrice: Number(itemUnitPrice),
            },
        ]);
        setItemQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, idx) => idx !== index));
    };

    const validate = (): string => {
        if (!customerId) return 'العميل مطلوب.';
        if (!warehouseId) return 'المستودع مطلوب.';
        if (!invoiceDate) return 'تاريخ الفاتورة مطلوب.';
        if (items.length === 0) return 'يجب إضافة بند واحد على الأقل للفاتورة.';

        for (const item of items) {
            if (item.quantity <= 0) return 'كمية كل منتج يجب أن تكون أكبر من الصفر.';
            if (item.unitPrice < 0) return 'سعر الوحدة لا يمكن أن يكون سالباً.';
        }

        if (paidAmount < 0) return 'المبلغ المدفوع لا يمكن أن يكون سالباً.';
        if (paidAmount > totalAmount) return 'المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة.';

        if (paymentType === PaymentType.Cash && Math.abs(paidAmount - totalAmount) > 0.01) {
            return 'في الدفع النقدي (Cash)، يجب أن يكون المبلغ المدفوع مساوياً لإجمالي الفاتورة.';
        }
        if (paymentType === PaymentType.Credit && paidAmount !== 0) {
            return 'في البيع الآجل (Credit)، يجب أن يكون المبلغ المدفوع صفراً.';
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

        const dto: CreateSalesInvoiceDto = {
            customerId: Number(customerId),
            warehouseId: Number(warehouseId),
            invoiceDate: new Date(invoiceDate).toISOString(),
            paymentType: Number(paymentType) as PaymentType,
            paidAmount: Number(paidAmount),
            notes: notes.trim() || undefined,
            items: items.map(i => ({
                productId: Number(i.productId),
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
            })),
        };

        await onSave(dto);
    };

    const activeCustomers = customers.filter(c => c.isActive);
    const activeWarehouses = warehouses.filter(w => w.isActive);
    const activeProducts = products.filter(p => p.isActive);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {formError && <Alert type="error" message={formError} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <SearchableSelect
                        label="العميل"
                        required
                        value={customerId}
                        onChange={(val) => setCustomerId(Number(val))}
                        options={activeCustomers.map(c => ({
                            value: c.id,
                            label: c.name,
                            subLabel: c.phone
                        }))}
                        placeholder="اختر أو ابحث عن العميل..."
                        disabled={saving}
                    />
                </div>

                <div>
                    <SearchableSelect
                        label="المستودع"
                        required
                        value={warehouseId}
                        onChange={(val) => setWarehouseId(Number(val))}
                        options={activeWarehouses.map(w => ({
                            value: w.id,
                            label: w.name,
                            subLabel: w.code
                        }))}
                        placeholder="اختر أو ابحث عن المستودع..."
                        disabled={saving}
                    />
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
                            {activeProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.code} - {p.name} (سعر البيع: {p.sellingPrice})
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
                        <p className="text-xs text-slate-400 mt-1">المتاح في المخزن: <span className="font-bold text-emerald-400">{availableQty}</span></p>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-400 mb-1">سعر الوحدة</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemUnitPrice}
                            onChange={e => setItemUnitPrice(Number(e.target.value))}
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
                                    <th className="p-3">سعر الوحدة</th>
                                    <th className="p-3">الإجمالي</th>
                                    <th className="p-3 text-center">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {items.map((item, index) => {
                                    const prod = products.find(p => p.id === item.productId);
                                    const itemTotal = item.quantity * item.unitPrice;
                                    return (
                                        <tr key={index} className="hover:bg-slate-950/40">
                                            <td className="p-3 text-slate-200">
                                                {prod ? `${prod.code} - ${prod.name}` : `منتج #${item.productId}`}
                                            </td>
                                            <td className="p-3 text-slate-300">{item.quantity}</td>
                                            <td className="p-3 text-slate-300">{item.unitPrice.toFixed(2)}</td>
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
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-400">إجمالي الفاتورة:</p>
                        <p className="text-lg font-black text-emerald-400">{totalAmount.toFixed(2)} ج.م</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">المبلغ المدفوع:</p>
                        <p className="text-lg font-bold text-blue-400">{Number(paidAmount).toFixed(2)} ج.م</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">المتبقي (الآجل):</p>
                        <p className="text-lg font-bold text-amber-400">{remainingAmount.toFixed(2)} ج.م</p>
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

function SalesInvoiceDetailsModal({
    invoice,
    onClose,
}: {
    invoice: SalesInvoiceResponseDto | null;
    onClose: () => void;
}) {
    if (!invoice) return null;

    const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    return (
        <Modal isOpen={!!invoice} onClose={onClose} title={`تفاصيل فاتورة المبيعات: ${invoice.invoiceNumber}`}>
            <div className="print-container space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 print:bg-white p-4 rounded-xl border border-slate-800 print:border-slate-300 text-sm">
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">رقم الفاتورة</span>
                        <span className="font-bold text-slate-100 print:text-slate-900">{invoice.invoiceNumber}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">الحالة</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                            invoice.status === PurchaseInvoiceStatus.Confirmed
                                ? 'bg-emerald-500/15 text-emerald-400 print:text-emerald-900 border border-emerald-500/20'
                                : invoice.status === PurchaseInvoiceStatus.Cancelled
                                ? 'bg-rose-500/15 text-rose-400 print:text-rose-900 border border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-400 print:text-amber-900 border border-amber-500/20'
                        }`}>
                            {invoice.statusName}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">العميل</span>
                        <span className="font-semibold text-slate-200 print:text-slate-900">{invoice.customerName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">المستودع</span>
                        <span className="font-semibold text-slate-200 print:text-slate-900">{invoice.warehouseName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">تاريخ الفاتورة</span>
                        <span className="text-slate-300 print:text-slate-900">{new Date(invoice.invoiceDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">طريقة الدفع</span>
                        <span className="text-slate-300 print:text-slate-900">{invoice.paymentTypeName}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">إجمالي الفاتورة</span>
                        <span className="font-bold text-emerald-400 print:text-emerald-900">{invoice.totalAmount.toFixed(2)} ج.م</span>
                    </div>
                    <div>
                        <span className="text-slate-400 print:text-slate-600 block text-xs">المبلغ المدفوع / المتبقي</span>
                        <span className="font-bold text-blue-400 print:text-blue-900">{invoice.paidAmount.toFixed(2)} ج.م</span>
                        <span className="text-xs text-amber-400 print:text-amber-900 block">المتبقي: {remaining.toFixed(2)} ج.م</span>
                    </div>
                    {invoice.notes && (
                        <div className="col-span-2">
                            <span className="text-slate-400 print:text-slate-600 block text-xs">ملاحظات</span>
                            <span className="text-slate-300 print:text-slate-900">{invoice.notes}</span>
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-200 print:text-slate-900 mb-3">بنود الفاتورة</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                        <table className="w-full text-right text-xs">
                            <thead className="bg-slate-950 print:bg-slate-200 text-slate-400 print:text-slate-900 border-b border-slate-800 print:border-slate-300">
                                <tr>
                                    <th className="p-2.5">المنتج</th>
                                    <th className="p-2.5">الكمية</th>
                                    <th className="p-2.5">سعر الوحدة</th>
                                    <th className="p-2.5">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-slate-900">
                                {invoice.items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-950/30">
                                        <td className="p-2.5 text-slate-200 print:text-slate-900">{item.productCode} - {item.productName}</td>
                                        <td className="p-2.5 text-slate-300 print:text-slate-900">{item.quantity}</td>
                                        <td className="p-2.5 text-slate-300 print:text-slate-900">{item.unitPrice.toFixed(2)}</td>
                                        <td className="p-2.5 font-semibold text-emerald-400 print:text-emerald-900">{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="pt-2 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-colors print:hidden"
                    >
                        طباعة الفاتورة
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

export function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoiceResponseDto[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [query, setQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editTarget, setEditTarget] = useState<SalesInvoiceResponseDto | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');

    const [detailsTarget, setDetailsTarget] = useState<SalesInvoiceResponseDto | null>(null);

    const [confirmTarget, setConfirmTarget] = useState<SalesInvoiceResponseDto | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const [cancelTarget, setCancelTarget] = useState<SalesInvoiceResponseDto | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [invData, custData, whData, prodData] = await Promise.all([
                salesInvoiceService.getAll(),
                customerService.getAll(),
                warehouseService.getAll(),
                productService.getAll(),
            ]);
            setInvoices(invData);
            setCustomers(custData);
            setWarehouses(whData);
            setProducts(prodData);
        } catch {
            setError('فشل في تحميل بيانات فواتير المبيعات أو البيانات المرتبطة.');
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
                [inv.invoiceNumber, inv.customerName, inv.warehouseName, inv.notes ?? ''].some(val =>
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

    const openEdit = (inv: SalesInvoiceResponseDto) => {
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

    const handleSave = async (dto: CreateSalesInvoiceDto) => {
        setSaving(true);
        setSaveError('');
        try {
            if (editTarget) {
                await salesInvoiceService.update(editTarget.id, dto as UpdateSalesInvoiceDto);
            } else {
                await salesInvoiceService.create(dto);
            }
            closeModal();
            await loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setSaveError(err.response?.data?.message ?? 'فشل في حفظ فاتورة المبيعات.');
            } else {
                setSaveError('فشل في حفظ فاتورة المبيعات.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        setActionLoading(true);
        try {
            await salesInvoiceService.confirm(confirmTarget.id);
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
            await salesInvoiceService.cancel(cancelTarget.id);
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
            await salesInvoiceService.delete(id);
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
                    <h1 className="text-2xl font-black text-slate-100">فواتير المبيعات</h1>
                    <p className="text-slate-500 text-sm mt-1">إدارة فواتير مبيعات البضائع للمستودعات وتأكيدها أو إلغاؤها</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    فاتورة مبيعات جديدة
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="بحث برقم الفاتورة، اسم العميل، المستودع، أو الملاحظات..."
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
                                {query || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة لخيارات البحث أو التصفية.' : 'لا توجد فواتير مبيعات حتى الآن. أضف أول فاتورة الآن.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map(inv => (
                            <div
                                key={inv.id}
                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700 transition-colors gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-slate-100 text-base">{inv.invoiceNumber}</p>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                inv.status === PurchaseInvoiceStatus.Confirmed
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : inv.status === PurchaseInvoiceStatus.Cancelled
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {inv.statusName}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                                            <span>العميل: <strong className="text-slate-200">{inv.customerName}</strong></span>
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
                title={editTarget ? `تعديل فاتورة مبيعات: ${editTarget.invoiceNumber}` : 'إنشاء فاتورة مبيعات جديدة'}
            >
                {saveError && <div className="mb-4"><Alert type="error" message={saveError} /></div>}
                <SalesInvoiceForm
                    initial={editTarget ?? undefined}
                    customers={customers}
                    warehouses={warehouses}
                    products={products}
                    onSave={handleSave}
                    onCancel={closeModal}
                    saving={saving}
                />
            </Modal>

            {/* Details Modal */}
            <SalesInvoiceDetailsModal
                invoice={detailsTarget}
                onClose={() => setDetailsTarget(null)}
            />

            {/* Confirm Dialog */}
            <Modal isOpen={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="تأكيد فاتورة المبيعات">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من تأكيد الفاتورة رقم <span className="font-bold text-white">"{confirmTarget?.invoiceNumber}"</span>؟
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        سيتم خصم الكمية من المخزن وإضافة المبلغ المدفوع إلى الخزنة.
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
            <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="إلغاء فاتورة المبيعات">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        هل أنت متأكد من إلغاء الفاتورة رقم <span className="font-bold text-white">"{cancelTarget?.invoiceNumber}"</span>؟
                    </p>
                    {cancelTarget?.status === PurchaseInvoiceStatus.Confirmed && (
                        <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            تحذير: هذه الفاتورة مؤكدة. إلغاؤها سيؤدي إلى إعادة الكميات للمخزن ورد المدفوعات من الخزنة تلقائياً.
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
