import api from './api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerAccountResponseDto, AccountTransactionResponseDto } from '../../types';

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        const response = await api.get<Customer[]>('/api/customers');
        return response.data;
    },

    getById: async (id: number): Promise<Customer> => {
        const response = await api.get<Customer>(`/api/customers/${id}`);
        return response.data;
    },

    getAccount: async (id: number): Promise<CustomerAccountResponseDto> => {
        const response = await api.get<CustomerAccountResponseDto>(`/api/customers/${id}/account`);
        return response.data;
    },

    getAccountTransactions: async (id: number, fromDate?: string, toDate?: string): Promise<AccountTransactionResponseDto[]> => {
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await api.get<AccountTransactionResponseDto[]>(`/api/customers/${id}/account/transactions${query}`);
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
