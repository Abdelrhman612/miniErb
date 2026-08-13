import api from './api';
import type {
  PurchaseInvoiceResponseDto,
  CreatePurchaseInvoiceDto,
  UpdatePurchaseInvoiceDto,
} from '../../types';

export const purchaseInvoiceService = {
  getAll: async (): Promise<PurchaseInvoiceResponseDto[]> => {
    const response = await api.get<PurchaseInvoiceResponseDto[]>('/api/purchase-invoices');
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseInvoiceResponseDto> => {
    const response = await api.get<PurchaseInvoiceResponseDto>(`/api/purchase-invoices/${id}`);
    return response.data;
  },

  create: async (dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoiceResponseDto> => {
    const response = await api.post<PurchaseInvoiceResponseDto>('/api/purchase-invoices', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdatePurchaseInvoiceDto): Promise<PurchaseInvoiceResponseDto> => {
    const response = await api.put<PurchaseInvoiceResponseDto>(`/api/purchase-invoices/${id}`, dto);
    return response.data;
  },

  confirm: async (id: number): Promise<PurchaseInvoiceResponseDto> => {
    const response = await api.post<PurchaseInvoiceResponseDto>(`/api/purchase-invoices/${id}/confirm`);
    return response.data;
  },

  cancel: async (id: number): Promise<PurchaseInvoiceResponseDto> => {
    const response = await api.post<PurchaseInvoiceResponseDto>(`/api/purchase-invoices/${id}/cancel`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/purchase-invoices/${id}`);
  },
};

export const purchaseInvoiceApi = purchaseInvoiceService;
