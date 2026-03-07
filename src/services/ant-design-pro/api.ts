/**
 * @fileName api.ts
 * @description 认证和用户相关 API 接口 - 对接真实后端服务
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { request } from '@umijs/max';

export interface LoginParams {
  username: string;
  password: string;
  rememberDevice?: boolean;
  type?: string;
}

export interface UserInfo {
  uuid: string;
  username: string;
  email?: string;
  role: string;
  realName?: string;
  avatarUrl?: string;
  schoolUuid?: string;
  studentId?: string;
  classInfo?: string;
}

export interface LoginResult {
  success: boolean;
  data?: {
    user: UserInfo;
    token: string;
    refreshToken: string;
    deviceToken?: string;
    expiresIn: number;
  };
  message?: string;
}

export interface CurrentUserResponse {
  success: boolean;
  data: UserInfo;
}

/**
 * @description 用户登录接口
 * @param body 登录参数
 * @returns 登录结果
 */
export async function login(body: LoginParams) {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
  });
}

/**
 * @description 获取当前用户信息
 * @returns 用户信息
 */
export async function currentUser() {
  return request<CurrentUserResponse>('/auth/me', {
    method: 'GET',
  });
}

/**
 * @description 退出登录
 * @param deviceToken 设备 token
 * @returns 退出结果
 */
export async function outLogin(deviceToken?: string) {
  return request<Record<string, any>>('/auth/logout', {
    method: 'POST',
    data: { deviceToken },
  });
}

/**
 * @description 刷新 token
 * @param refreshToken 刷新令牌
 * @returns 新的 token
 */
export async function refreshToken(refreshToken: string) {
  return request<{ success: boolean; data: { token: string; expiresIn: number } }>('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: { refreshToken },
  });
}

/**
 * @description 获取规则列表 - 临时保留用于兼容旧代码
 * @param params 查询参数
 * @returns 规则列表
 */
export async function rule(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/**
 * @description 更新规则 - 临时保留用于兼容旧代码
 * @param options 更新参数
 * @returns 规则项
 */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/**
 * @description 新建规则 - 临时保留用于兼容旧代码
 * @param options 新建参数
 * @returns 规则项
 */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/**
 * @description 删除规则 - 临时保留用于兼容旧代码
 * @param options 删除参数
 * @returns 删除结果
 */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}

/**
 * @description 获取公告列表 - 临时保留用于兼容旧代码
 * @param options 查询参数
 * @returns 公告列表
 */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}
