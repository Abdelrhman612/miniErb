import api from './api';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../../types';

export const supplierService = {
    getAll: async (): Promise<Supplier[]> => {
        const response = await api.get<Supplier[]>('/api/suppliers');
        return response.data;
    },

    getById: async (id: number): Promise<Supplier> => {
        const response = await api.get<Supplier>(`/api/suppliers/${id}`);
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
