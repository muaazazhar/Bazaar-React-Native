import axios from 'axios';
import { getApiBaseUrl } from '@/services/baseUrl';

let authToken: string | null = null;

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
}
