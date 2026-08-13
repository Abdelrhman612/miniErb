import api from './api';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto, WarehouseInventory } from '../../types';

export const warehouseService = {
  getAll: async (): Promise<Warehouse[]> => {
    const response = await api.get<Warehouse[]>('/api/warehouses');
    return response.data;
  },

  getById: async (id: number): Promise<Warehouse> => {
    const response = await api.get<Warehouse>(`/api/warehouses/${id}`);
    return response.data;
  },

  getInventory: async (id: number): Promise<WarehouseInventory> => {
    const response = await api.get<WarehouseInventory>(`/api/warehouses/${id}/inventory`);
    return response.data;
  },

  create: async (dto: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await api.post<Warehouse>('/api/warehouses', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateWarehouseDto): Promise<Warehouse> => {
    const response = await api.put<Warehouse>(`/api/warehouses/${id}`, dto);
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`/api/warehouses/${id}`);
  },
};
