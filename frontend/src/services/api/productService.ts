import api from './api';
import type { Product, CreateProductDto, UpdateProductDto } from '../../types';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/products');
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  create: async (dto: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/api/products', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateProductDto): Promise<Product> => {
    const response = await api.put<Product>(`/api/products/${id}`, dto);
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}`);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}/delete`);
  },
};
