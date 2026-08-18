import api from './api';
import type { LoginRequestDto, CreateUserDto, AuthResponseDto, CurrentUserResponseDto, UserResponseDto } from '../../types';

export const authService = {
  login: async (dto: LoginRequestDto): Promise<AuthResponseDto> => {
    const response = await api.post<AuthResponseDto>('/api/auth/login', dto);
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponseDto> => {
    const response = await api.get<CurrentUserResponseDto>('/api/auth/me');
    return response.data;
  },

  getUsers: async (): Promise<UserResponseDto[]> => {
    const response = await api.get<UserResponseDto[]>('/api/users');
    return response.data;
  },

  createUser: async (dto: CreateUserDto): Promise<UserResponseDto> => {
    const response = await api.post<UserResponseDto>('/api/users', dto);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};
