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
