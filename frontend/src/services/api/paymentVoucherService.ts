import api from './api';
import type { PaymentVoucherResponseDto, CreatePaymentVoucherDto, UpdatePaymentVoucherDto } from '../../types';

export const paymentVoucherService = {
    getAll: async (): Promise<PaymentVoucherResponseDto[]> => {
        const response = await api.get<PaymentVoucherResponseDto[]>('/api/payment-vouchers');
        return response.data;
    },

    getById: async (id: number): Promise<PaymentVoucherResponseDto> => {
        const response = await api.get<PaymentVoucherResponseDto>(`/api/payment-vouchers/${id}`);
        return response.data;
    },

    create: async (dto: CreatePaymentVoucherDto): Promise<PaymentVoucherResponseDto> => {
        const response = await api.post<PaymentVoucherResponseDto>('/api/payment-vouchers', dto);
        return response.data;
    },

    update: async (id: number, dto: UpdatePaymentVoucherDto): Promise<PaymentVoucherResponseDto> => {
        const response = await api.put<PaymentVoucherResponseDto>(`/api/payment-vouchers/${id}`, dto);
        return response.data;
    },

    confirm: async (id: number): Promise<PaymentVoucherResponseDto> => {
        const response = await api.post<PaymentVoucherResponseDto>(`/api/payment-vouchers/${id}/confirm`);
        return response.data;
    },

    cancel: async (id: number): Promise<PaymentVoucherResponseDto> => {
        const response = await api.post<PaymentVoucherResponseDto>(`/api/payment-vouchers/${id}/cancel`);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/payment-vouchers/${id}`);
    },
};
