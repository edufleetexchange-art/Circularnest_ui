import axios, { AxiosInstance } from 'axios';

const getAPIBaseURL = (): string => {
  const env = import.meta.env.VITE_API_URL;

  // Always use absolute backend URL in production
  if (env && env.startsWith('http')) {
    return env;
  }

  // Dev fallback ONLY (Vite proxy)
  if (import.meta.env.DEV) {
    return '/api';
  }

  // Absolute fallback (prevents Vercel /api hijack)
  return 'https://circularnest.onrender.com';
};


const API_BASE_URL = getAPIBaseURL();

class ApiService {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to requests if available
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle responses and errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(data: {
    email: string;
    password: string;
    role: 'admin' | 'user';
    institutionName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactPerson?: string;
  }) {
    const response = await this.api.post('/api/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/api/auth/login', { email, password })
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/api/auth/me');
    return response.data;
  }

  async updateProfile(data: {
    institutionName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      console.log('Updating profile with data:', data);
      console.log('API Base URL:', API_BASE_URL);
      const response = await this.api.put('/api/auth/profile', data);
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API updateProfile error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.response?.config?.url,
        method: error.response?.config?.method,
        headers: error.response?.config?.headers
      });
      throw error;
    }
  }

  // Circular endpoints
  async uploadCircular(formData: FormData) {
    const response = await this.api.post('/api/circulars/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getCirculars(params?: { category?: string; limit?: number; page?: number; status?: string }) {
    console.log('[API] getCirculars called with params:', params);
    console.log('[API] Using base URL:', this.api.defaults.baseURL);

    const response = await this.api.get('/api/circulars', { params });

    // Check if we got HTML instead of JSON (indicates API not available)
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.error('[API] Received HTML instead of JSON - API backend may not be available');
      console.error('[API] Response headers:', response.headers);
      throw new Error('API backend is not responding correctly. Please check server configuration.');
    }
    
    console.log('[API] getCirculars response:', response.data);
    return response.data;
  }

  async getCircular(id: string) {
    const response = await this.api.get(`/api/circulars/${id}`);
    return response.data;
  }

  async updateCircularStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const response = await this.api.put(`/api/circulars/${id}/status`, { status });
    return response.data;
  }

  async updateCircular(id: string, data: {
    title?: string;
    orderDate?: string;
    description?: string;
    category?: string;
    isPublished?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
  }) {
    const response = await this.api.put(`/api/circulars/${id}`, data);
    return response.data;
  }

  async deleteCircular(id: string) {
    const response = await this.api.delete(`/api/circulars/${id}`);
    return response.data;
  }

  async downloadCircular(id: string, fileName: string) {
    const response = await this.api.get(`/api/circulars/${id}/download`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async viewCircular(id: string) {
    const response = await this.api.get(`/api/circulars/${id}/download`, {
      responseType: 'blob'
    });
    
    // Open in new window/tab
    const url = window.URL.createObjectURL(new Blob([response.data]));
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  }

  // Pending upload endpoints
  async submitPendingUpload(formData: FormData) {
    const response = await this.api.post('/api/pending/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async submitGuestUpload(formData: FormData) {
    const response = await this.api.post('/api/pending/guest-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getPendingUploads(status?: string) {
    const response = await this.api.get('/api/pending', { params: { status } });
    return response.data;
  }

  async getMySubmissions() {
    const response = await this.api.get('/api/pending/my-submissions');
    return response.data;
  }

  async approvePendingUpload(id: string, reviewNotes?: string) {
    const response = await this.api.put(`/api/pending/${id}/approve`, { reviewNotes });
    return response.data;
  }

  async rejectPendingUpload(id: string, reviewNotes: string) {
    const response = await this.api.put(`/api/pending/${id}/reject`, { reviewNotes });
    return response.data;
  }

  async deletePendingUpload(id: string) {
    const response = await this.api.delete(`/api/pending/${id}`);
    return response.data;
  }

  // Circular methods for Blink Storage URLs
  async getCircularsWithStorage(params?: { 
    status?: string; 
    category?: string; 
    limit?: number;
    userId?: string;
  }): Promise<{ success: boolean; circulars: any[]; total: number; message?: string }> {
    try {
      console.log('[API] getCircularsWithStorage called with params:', params);
      const response = await this.api.get('/circulars', { params });
      console.log('[API] getCircularsWithStorage response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] getCircularsWithStorage error:', error);
      return { success: false, circulars: [], total: 0, message: error.message };
    }
  }

  async getCircularById(id: string): Promise<{ success: boolean; circular?: any; message?: string }> {
    try {
      const response = await this.api.get(`/api/circulars/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('[API] getCircularById error:', error);
      return { success: false, message: error.message };
    }
  }

  async uploadCircularWithFile(data: {
    title: string;
    description?: string;
    orderDate?: string;
    category?: string;
    file: File;
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<{ success: boolean; circular?: any; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.orderDate) formData.append('orderDate', data.orderDate);
      if (data.category) formData.append('category', data.category);
      if (data.status) formData.append('status', data.status);
      formData.append('file', data.file);

      const response = await this.api.post('/api/circulars/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('[API] uploadCircularWithFile error:', error);
      return { success: false, message: error.message };
    }
  }

  async updateCircularStatusById(
    id: string,
    status: 'pending' | 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<{ success: boolean; circular?: any; message?: string }> {
    try {
      const response = await this.api.put(`/api/circulars/${id}/status`, { status, reviewNotes });
      return response.data;
    } catch (error: any) {
      console.error('[API] updateCircularStatusById error:', error);
      return { success: false, message: error.message };
    }
  }

  async deleteCircularById(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.api.delete(`/api/circulars/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('[API] deleteCircularById error:', error);
      return { success: false, message: error.message };
    }
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/api/health');
    return response.data;
  }
}

export const api = new ApiService();
