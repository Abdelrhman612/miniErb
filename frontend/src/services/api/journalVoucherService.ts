import api from './api';
import type { JournalVoucherResponseDto, CreateJournalVoucherDto, UpdateJournalVoucherDto } from '../../types';

export const journalVoucherService = {
    getAll: async (): Promise<JournalVoucherResponseDto[]> => {
        const response = await api.get<JournalVoucherResponseDto[]>('/api/journal-vouchers');
        return response.data;
    },

    getById: async (id: number): Promise<JournalVoucherResponseDto> => {
        const response = await api.get<JournalVoucherResponseDto>(`/api/journal-vouchers/${id}`);
        return response.data;
    },

    create: async (dto: CreateJournalVoucherDto): Promise<JournalVoucherResponseDto> => {
        const response = await api.post<JournalVoucherResponseDto>('/api/journal-vouchers', dto);
        return response.data;
    },

    update: async (id: number, dto: UpdateJournalVoucherDto): Promise<JournalVoucherResponseDto> => {
        const response = await api.put<JournalVoucherResponseDto>(`/api/journal-vouchers/${id}`, dto);
        return response.data;
    },

    confirm: async (id: number): Promise<JournalVoucherResponseDto> => {
        const response = await api.post<JournalVoucherResponseDto>(`/api/journal-vouchers/${id}/confirm`);
        return response.data;
    },

    cancel: async (id: number): Promise<JournalVoucherResponseDto> => {
        const response = await api.post<JournalVoucherResponseDto>(`/api/journal-vouchers/${id}/cancel`);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/journal-vouchers/${id}`);
    },
};
