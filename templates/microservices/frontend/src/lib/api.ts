import axios from 'axios';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if available
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: unknown }>('/api/users/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    apiClient.post('/api/users/auth/register', { email, password, name }),
};

// Payments
export const payments = {
  createCheckout: (priceId: string) =>
    apiClient.post<{ url: string }>('/api/payments/checkout/session', { priceId }),
  getSubscription: (userId: string) =>
    apiClient.get(`/api/payments/subscriptions/${userId}`),
};

// Core
export const core = {
  getItems: () => apiClient.get('/api/core/items'),
  createItem: (name: string, data: Record<string, unknown>) =>
    apiClient.post('/api/core/items', { name, data }),
};
