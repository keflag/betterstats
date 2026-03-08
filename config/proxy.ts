/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */

// 从环境变量获取后端 API 地址，支持不同环境使用不同的后端地址
const getBackendUrl = () => {
	if (process.env.REACT_APP_API_URL) {
		return process.env.REACT_APP_API_URL;
	}

	// 根据环境返回不同的后端地址
	switch (process.env.REACT_APP_ENV) {
		case "prod":
			// 生产环境应该使用完整域名，不应该走代理
			return "";
		case "pre":
			return "http://localhost:8080";
		case "test":
			return "http://localhost:8080";
		case "dev":
		default:
			return "http://localhost:8080";
	}
};

const BACKEND_URL = getBackendUrl();

export default {
	// 本地开发服务器代理配置 - 转发到后端 API 服务器
	dev: {
		// 认证接口代理
		"/auth/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
		// API 接口代理
		"/api/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
	},
	/**
	 * @name 详细的代理配置
	 * @doc https://github.com/chimurai/http-proxy-middleware
	 */
	test: {
		"/auth/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
		"/api/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
	},
	pre: {
		"/auth/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
		"/api/": {
			target: BACKEND_URL,
			changeOrigin: true,
			pathRewrite: { "^": "" },
		},
	},
};
