/**
 * @fileName config.ts
 * @description 服务器配置文件，集中管理所有配置项
 * @author keflag
 * @createDate 2026-03-08 09:44:27
 * @lastUpdateDate 2026-03-08 09:48:05
 * @version 1.0.0
 */

/**
 * @constant SERVER_CONFIG
 * @description 服务器配置对象
 */
export const SERVER_CONFIG = {
    /**
     * @property PORT
     * @description 数据库服务端口
     */
    PORT: 17342,

    /**
     * @property API_BASE_URL
     * @description API基础URL
     */
    get API_BASE_URL(): string {
        return `http://localhost:${this.PORT}`;
    },

    /**
     * @property RATE_LIMIT
     * @description 速率限制配置
     */
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 100,
    },

    /**
     * @property CORS
     * @description CORS配置
     */
    CORS: {
        METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
        ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
    },

    /**
     * @property DB_POOL
     * @description 数据库连接池配置
     */
    DB_POOL: {
        MAX_CONNECTIONS: 20,
        IDLE_TIMEOUT_MS: 30000,
        CONNECTION_TIMEOUT_MS: 2000,
    },

    /**
     * @property SECURITY
     * @description 安全配置
     */
    SECURITY: {
        MAX_BODY_SIZE: '10mb',
        VALID_IDENTIFIER_REGEX: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    },

    /**
     * @property AUTH
     * @description 认证配置
     */
    AUTH: {
        TOKEN_HEADER: 'x-pgsql-token',
        TOKEN_KEY: 'pgsql_token',
    },
};

export default SERVER_CONFIG;

