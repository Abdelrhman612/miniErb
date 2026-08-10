import axios from 'axios';
import { config } from '../../config';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async () => {
  const response = await api.get<{ message: string }>('/api/health');
  return response.data;
};

export default api;
