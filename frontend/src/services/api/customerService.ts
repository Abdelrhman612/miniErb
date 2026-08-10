import api from './api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../types';

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        const response = await api.get<Customer[]>('/api/customers');
        return response.data;
    },

    getById: async (id: number): Promise<Customer> => {
        const response = await api.get<Customer>(`/api/customers/${id}`);
        return response.data;
    },

    create: async (dto: CreateCustomerDto): Promise<Customer> => {
        const response = await api.post<Customer>('/api/customers', dto);
        return response.data;
    },

    update: async (id: number, dto: UpdateCustomerDto): Promise<Customer> => {
        const response = await api.put<Customer>(`/api/customers/${id}`, dto);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/customers/${id}`);
    },

    deletePermanently: async (id: number): Promise<void> => {
        await api.delete(`/api/customers/${id}/delete`);
    },
};
