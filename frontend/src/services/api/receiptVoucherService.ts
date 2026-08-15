import api from './api';
import type { ReceiptVoucherResponseDto, CreateReceiptVoucherDto, UpdateReceiptVoucherDto } from '../../types';

export const receiptVoucherService = {
    getAll: async (): Promise<ReceiptVoucherResponseDto[]> => {
        const response = await api.get<ReceiptVoucherResponseDto[]>('/api/receipt-vouchers');
        return response.data;
    },

    getById: async (id: number): Promise<ReceiptVoucherResponseDto> => {
        const response = await api.get<ReceiptVoucherResponseDto>(`/api/receipt-vouchers/${id}`);
        return response.data;
    },

    create: async (dto: CreateReceiptVoucherDto): Promise<ReceiptVoucherResponseDto> => {
        const response = await api.post<ReceiptVoucherResponseDto>('/api/receipt-vouchers', dto);
        return response.data;
    },

    update: async (id: number, dto: UpdateReceiptVoucherDto): Promise<ReceiptVoucherResponseDto> => {
        const response = await api.put<ReceiptVoucherResponseDto>(`/api/receipt-vouchers/${id}`, dto);
        return response.data;
    },

    confirm: async (id: number): Promise<ReceiptVoucherResponseDto> => {
        const response = await api.post<ReceiptVoucherResponseDto>(`/api/receipt-vouchers/${id}/confirm`);
        return response.data;
    },

    cancel: async (id: number): Promise<ReceiptVoucherResponseDto> => {
        const response = await api.post<ReceiptVoucherResponseDto>(`/api/receipt-vouchers/${id}/cancel`);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/receipt-vouchers/${id}`);
    },
};
