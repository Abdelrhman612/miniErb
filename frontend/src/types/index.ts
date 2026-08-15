export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  code: string;
  name: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit: string;
  categoryId: number;
}

export interface UpdateProductDto {
  code: string;
  name: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit: string;
  categoryId: number;
  isActive: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WarehouseInventoryItem {
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
}

export interface WarehouseInventory {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  items: WarehouseInventoryItem[];
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  address?: string;
}

export interface UpdateWarehouseDto {
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
}

export interface UpdateCustomerDto {
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  isActive: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
}

export interface UpdateSupplierDto {
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  openingBalance: number;
  isActive: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
}

export const PaymentType = {
  Cash: 1,
  Credit: 2,
  Partial: 3,
} as const;
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];

export const PurchaseInvoiceStatus = {
  Draft: 1,
  Confirmed: 2,
  Cancelled: 3,
} as const;
export type PurchaseInvoiceStatus = typeof PurchaseInvoiceStatus[keyof typeof PurchaseInvoiceStatus];

export interface CreatePurchaseInvoiceItemDto {
  productId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInvoiceDto {
  invoiceNumber?: string;
  supplierId: number;
  warehouseId: number;
  invoiceDate: string;
  paymentType: PaymentType;
  paidAmount: number;
  notes?: string;
  items: CreatePurchaseInvoiceItemDto[];
}

export interface UpdatePurchaseInvoiceDto extends CreatePurchaseInvoiceDto {}

export interface PurchaseInvoiceItemResponseDto {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseInvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  warehouseId: number;
  warehouseName: string;
  invoiceDate: string;
  paymentType: PaymentType;
  paymentTypeName: string;
  paidAmount: number;
  totalAmount: number;
  status: PurchaseInvoiceStatus;
  statusName: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseInvoiceItemResponseDto[];
}

export interface CreateSalesInvoiceItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesInvoiceDto {
  invoiceNumber?: string;
  customerId: number;
  warehouseId: number;
  invoiceDate: string;
  paymentType: PaymentType;
  paidAmount: number;
  notes?: string;
  items: CreateSalesInvoiceItemDto[];
}

export interface UpdateSalesInvoiceDto extends CreateSalesInvoiceDto {}

export interface SalesInvoiceItemResponseDto {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesInvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  warehouseId: number;
  warehouseName: string;
  invoiceDate: string;
  paymentType: PaymentType;
  paymentTypeName: string;
  paidAmount: number;
  totalAmount: number;
  status: PurchaseInvoiceStatus;
  statusName: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: SalesInvoiceItemResponseDto[];
}

export const TransactionType = {
  Debit: 1,
  Credit: 2,
} as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export interface TreasuryResponseDto {
  id: number;
  name: string;
  code: string;
  accountType: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTreasuryDto {
  name: string;
  code: string;
  initialBalance: number;
}

export interface AccountProductDetailDto {
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AccountTransactionResponseDto {
  id: number;
  accountId: number;
  transactionType: TransactionType;
  transactionTypeName: string;
  amount: number;
  debit: number;
  credit: number;
  paidAmount: number;
  outstandingAmount: number;
  description?: string;
  partyName?: string;
  referenceType?: string;
  referenceId?: number;
  invoiceNumber?: string;
  debtorName: string;
  creditorName: string;
  products: AccountProductDetailDto[];
  runningBalance: number;
  transactionDate: string;
  createdAt: string;
}

export interface CustomerAccountResponseDto {
  customerId: number;
  customerName: string;
  phone: string;
  address?: string;
  accountId: number;
  code: string;
  openingBalance: number;
  balance: number;
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  isActive: boolean;
}

export interface SupplierAccountResponseDto {
  supplierId: number;
  supplierName: string;
  phone: string;
  address?: string;
  accountId: number;
  code: string;
  openingBalance: number;
  balance: number;
  totalPurchases: number;
  totalPaid: number;
  totalOutstanding: number;
  isActive: boolean;
}

export const VoucherStatus = {
  Draft: 1,
  Confirmed: 2,
  Cancelled: 3,
} as const;
export type VoucherStatus = typeof VoucherStatus[keyof typeof VoucherStatus];

export interface ReceiptVoucherResponseDto {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  treasuryId: number;
  treasuryName: string;
  customerId?: number;
  customerName?: string;
  supplierId?: number;
  supplierName?: string;
  counterAccountId?: number;
  counterAccountCode?: string;
  counterAccountName?: string;
  partyName?: string;
  resolvedPartyName: string;
  amount: number;
  description?: string;
  status: VoucherStatus;
  statusName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReceiptVoucherDto {
  voucherNumber?: string;
  voucherDate: string;
  treasuryId: number;
  customerId?: number;
  supplierId?: number;
  counterAccountId?: number;
  partyName?: string;
  amount: number;
  description?: string;
}
export interface UpdateReceiptVoucherDto extends CreateReceiptVoucherDto {}

export interface PaymentVoucherResponseDto {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  treasuryId: number;
  treasuryName: string;
  supplierId?: number;
  supplierName?: string;
  customerId?: number;
  customerName?: string;
  counterAccountId?: number;
  counterAccountCode?: string;
  counterAccountName?: string;
  partyName?: string;
  resolvedPartyName: string;
  amount: number;
  description?: string;
  status: VoucherStatus;
  statusName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePaymentVoucherDto {
  voucherNumber?: string;
  voucherDate: string;
  treasuryId: number;
  supplierId?: number;
  customerId?: number;
  counterAccountId?: number;
  partyName?: string;
  amount: number;
  description?: string;
}
export interface UpdatePaymentVoucherDto extends CreatePaymentVoucherDto {}

export interface JournalVoucherItemResponseDto {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalVoucherItemDto {
  accountId: number;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalVoucherResponseDto {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  description?: string;
  status: VoucherStatus;
  statusName: string;
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  updatedAt?: string;
  items: JournalVoucherItemResponseDto[];
}

export interface CreateJournalVoucherDto {
  voucherNumber?: string;
  voucherDate: string;
  description?: string;
  items: CreateJournalVoucherItemDto[];
}
export interface UpdateJournalVoucherDto extends CreateJournalVoucherDto {}

export interface Account {
  id: number;
  code: string;
  name: string;
  accountType: string;
  parentAccountId?: number;
  parentAccountName?: string;
  isGroup: boolean;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AccountNode {
  id: number;
  code: string;
  name: string;
  accountType: string;
  parentAccountId?: number;
  isGroup: boolean;
  isActive: boolean;
  balance: number;
  children: AccountNode[];
}

export interface CreateAccountDto {
  code: string;
  name: string;
  accountType: string;
  parentAccountId?: number;
  isGroup: boolean;
}

export interface UpdateAccountDto {
  name: string;
  accountType: string;
  parentAccountId?: number;
  isGroup: boolean;
  isActive: boolean;
}
