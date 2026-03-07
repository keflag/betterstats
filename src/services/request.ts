/**
 * @fileName request.ts
 * @description 全局请求配置 - 处理认证 token 和错误拦截
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import type { RequestOptions } from "@@/plugin-request/request";
import { request } from "@umijs/max";

const getStoredToken = () => {
	if (typeof window !== "undefined") {
		return localStorage.getItem("token");
	}
	return null;
};

const handleResponse = async (response: Response): Promise<any> => {
	const contentType = response.headers.get("content-type");

	if (contentType?.includes("application/json")) {
		const data = await response.clone().json();

		if (!response.ok) {
			if (response.status === 401) {
				localStorage.removeItem("token");
				localStorage.removeItem("refreshToken");
				window.location.href = "/user/login";
			}

			throw new Error(data.message || "请求失败");
		}

		return data;
	}

	if (!response.ok) {
		throw new Error(`HTTP Error: ${response.status}`);
	}

	return response;
};

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

request.interceptors.request.use(authHeaderInterceptor);
request.interceptors.response.use(handleResponse);

export default request;
