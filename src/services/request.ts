/**
 * @fileName request.ts
 * @description 全局请求配置 - 处理认证 token 和错误拦截
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import type { RequestOptions } from '@@/plugin-request/request';

/**
 * @functionName getStoredToken
 * @description 获取本地存储的 token
 * @return 返回 token 字符串或 null
 */
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * @functionName authHeaderInterceptor
 * @description 请求拦截器 - 添加认证头
 * @params url 请求 URL
 * @params options 请求选项
 * @return 返回包含认证头的请求配置
 */
const authHeaderInterceptor = (url: string, options: RequestOptions) => {
  const token = getStoredToken();
  
  if (token) {
    return {
      url,
      options: {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    };
  }
  
  return { url, options };
};

export { authHeaderInterceptor, getStoredToken };
