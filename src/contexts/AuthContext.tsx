/**
 * @fileName AuthContext.tsx
 * @description 全局认证上下文，管理用户登录状态和权限
 * @author keflag
 * @createDate 2026-03-08 11:09:02
 * @lastUpdateDate 2026-03-08 11:09:02
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';

/**
 * @enum UserRole
 * @description 用户角色枚举
 */
export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

/**
 * @enum UserStatus
 * @description 用户状态枚举
 */
export enum UserStatus {
  AVAILABLE = 'available',
  BANNED = 'banned',
  DISABLED = 'disabled',
}

/**
 * @interface UserInfo
 * @description 用户信息接口
 */
export interface UserInfo {
  uuid: string;
  account: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  lastOnlineAt: string | null;
}

/**
 * @interface AuthContextType
 * @description 认证上下文类型
 */
interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (account: string, password: string, rememberDevice: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:17342';
const TOKEN_KEY = 'betterstats_token';

/**
 * @componentName AuthProvider
 * @description 认证上下文提供者
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * @functionName initAuth
   * @description 初始化认证状态
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        try {
          await fetchUserInfo(savedToken);
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * @functionName fetchUserInfo
   * @description 获取用户信息
   */
  const fetchUserInfo = async (authToken: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    const data = await response.json();
    if (data.success) {
      setUser(data.user);
    }
  };

  /**
   * @functionName login
   * @description 用户登录
   */
  const login = async (account: string, password: string, rememberDevice: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account, password, rememberDevice }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        message.success('登录成功');
        return true;
      } else {
        message.error(data.error || '登录失败');
        return false;
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      return false;
    }
  };

  /**
   * @functionName logout
   * @description 用户登出
   */
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('登出请求失败', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      message.success('已退出登录');
    }
  };

  /**
   * @functionName refreshUserInfo
   * @description 刷新用户信息
   */
  const refreshUserInfo = async () => {
    if (token) {
      await fetchUserInfo(token);
    }
  };

  /**
   * @functionName hasRole
   * @description 检查用户角色
   */
  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUserInfo,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @functionName useAuth
 * @description 使用认证上下文的Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
