/**
 * @fileName api.ts
 * @description 前端 API 调用封装 - 提供类型安全的后端服务访问方法
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const request = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('网络错误');
  }
};

export const userApi = {
  getUsers: async (page: number = 1, pageSize: number = 10) => {
    return request<User[]>(`/users?page=${page}&pageSize=${pageSize}`);
  },

  getUserById: async (id: number) => {
    return request<User>(`/users/${id}`);
  },

  createUser: async (name: string) => {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  updateUser: async (id: number, name: string) => {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  deleteUser: async (id: number) => {
    return request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
