import api from './api';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto, SupplierAccountResponseDto, AccountTransactionResponseDto } from '../../types';

export const supplierService = {
    getAll: async (): Promise<Supplier[]> => {
        const response = await api.get<Supplier[]>('/api/suppliers');
        return response.data;
    },

    getById: async (id: number): Promise<Supplier> => {
        const response = await api.get<Supplier>(`/api/suppliers/${id}`);
        return response.data;
    },

    getAccount: async (id: number): Promise<SupplierAccountResponseDto> => {
        const response = await api.get<SupplierAccountResponseDto>(`/api/suppliers/${id}/account`);
        return response.data;
    },

    getAccountTransactions: async (id: number, fromDate?: string, toDate?: string): Promise<AccountTransactionResponseDto[]> => {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get<AccountTransactionResponseDto[]>(`/api/suppliers/${id}/account/transactions${query}`);
        return response.data;
    },

    create: async (dto: CreateSupplierDto): Promise<Supplier> => {
        const response = await api.post<Supplier>('/api/suppliers', dto);
        return response.data;
    },

    update: async (id: number, dto: UpdateSupplierDto): Promise<Supplier> => {
        const response = await api.put<Supplier>(`/api/suppliers/${id}`, dto);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/suppliers/${id}`);
    },

    deletePermanently: async (id: number): Promise<void> => {
        await api.delete(`/api/suppliers/${id}/delete`);
    },
};
