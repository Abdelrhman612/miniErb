import api from './api';
import type { TreasuryResponseDto, CreateTreasuryDto, AccountTransactionResponseDto } from '../../types';

export const treasuryService = {
  getAll: async (): Promise<TreasuryResponseDto[]> => {
    const response = await api.get<TreasuryResponseDto[]>('/api/treasury');
    return response.data;
  },

  getById: async (id: number): Promise<TreasuryResponseDto> => {
    const response = await api.get<TreasuryResponseDto>(`/api/treasury/${id}`);
    return response.data;
  },

  getTransactions: async (id: number): Promise<AccountTransactionResponseDto[]> => {
    const response = await api.get<AccountTransactionResponseDto[]>(`/api/treasury/${id}/transactions`);
    return response.data;
  },

  create: async (dto: CreateTreasuryDto): Promise<TreasuryResponseDto> => {
    const response = await api.post<TreasuryResponseDto>('/api/treasury', dto);
    return response.data;
  },
};
