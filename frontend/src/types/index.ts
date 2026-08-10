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
