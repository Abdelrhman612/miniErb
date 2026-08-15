import api from './api';
import type { Account, AccountNode, CreateAccountDto, UpdateAccountDto, AccountTransactionResponseDto } from '../../types';

export const accountService = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/api/chart-of-accounts');
    return response.data;
  },

  getTree: async (): Promise<AccountNode[]> => {
    const response = await api.get<AccountNode[]>('/api/chart-of-accounts/tree');
    return response.data;
  },

  getById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/api/chart-of-accounts/${id}`);
    return response.data;
  },

  getChildren: async (id: number): Promise<Account[]> => {
    const response = await api.get<Account[]>(`/api/chart-of-accounts/${id}/children`);
    return response.data;
  },

  getTransactions: async (id: number, fromDate?: string, toDate?: string): Promise<AccountTransactionResponseDto[]> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get<AccountTransactionResponseDto[]>(`/api/chart-of-accounts/${id}/transactions${query}`);
    return response.data;
  },

  create: async (dto: CreateAccountDto): Promise<Account> => {
    const response = await api.post<Account>('/api/chart-of-accounts', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateAccountDto): Promise<Account> => {
    const response = await api.put<Account>(`/api/chart-of-accounts/${id}`, dto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/chart-of-accounts/${id}`);
  },
};
