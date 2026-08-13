import api from './api';
import type {
  SalesInvoiceResponseDto,
  CreateSalesInvoiceDto,
  UpdateSalesInvoiceDto,
} from '../../types';

export const salesInvoiceService = {
  getAll: async (): Promise<SalesInvoiceResponseDto[]> => {
    const response = await api.get<SalesInvoiceResponseDto[]>('/api/sales-invoices');
    return response.data;
  },

  getById: async (id: number): Promise<SalesInvoiceResponseDto> => {
    const response = await api.get<SalesInvoiceResponseDto>(`/api/sales-invoices/${id}`);
    return response.data;
  },

  create: async (dto: CreateSalesInvoiceDto): Promise<SalesInvoiceResponseDto> => {
    const response = await api.post<SalesInvoiceResponseDto>('/api/sales-invoices', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateSalesInvoiceDto): Promise<SalesInvoiceResponseDto> => {
    const response = await api.put<SalesInvoiceResponseDto>(`/api/sales-invoices/${id}`, dto);
    return response.data;
  },

  confirm: async (id: number): Promise<SalesInvoiceResponseDto> => {
    const response = await api.post<SalesInvoiceResponseDto>(`/api/sales-invoices/${id}/confirm`);
    return response.data;
  },

  cancel: async (id: number): Promise<SalesInvoiceResponseDto> => {
    const response = await api.post<SalesInvoiceResponseDto>(`/api/sales-invoices/${id}/cancel`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/sales-invoices/${id}`);
  },
};

export const salesInvoiceApi = salesInvoiceService;
