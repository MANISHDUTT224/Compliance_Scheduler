import axios from 'axios';
import { Task } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data.map((task: any) => ({
      ...task,
      dueDate: new Date(task.dueDate),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));
  },

  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; message: string; emailsSent: number }> => {
    const response = await api.post('/tasks', {
      ...task,
      dueDate: task.dueDate.toISOString(),
    });
    return response.data;
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<{ message: string }> => {
    const response = await api.put(`/tasks/${id}`, {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    });
    return response.data;
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export default api;