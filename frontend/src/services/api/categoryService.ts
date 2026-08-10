import api from './api';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/categories');
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/api/categories/${id}`);
    return response.data;
  },

  create: async (dto: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>('/api/categories', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateCategoryDto): Promise<Category> => {
    const response = await api.put<Category>(`/api/categories/${id}`, dto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/categories/${id}`);
  },
};
