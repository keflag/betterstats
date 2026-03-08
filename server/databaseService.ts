/**
 * @fileName databaseService.ts
 * @description 安全的数据库服务，提供PostgreSQL数据库访问API，端口17342
 * @author keflag
 * @createDate 2026-03-08 09:38:44
 * @lastUpdateDate 2026-03-08 10:18:58
 * @version 2.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import SERVER_CONFIG from './config';
import { authenticateCookie, initSession, logout } from './auth';

// 加载环境变量
dotenv.config();

/**
 * @functionName createPool
 * @description 创建PostgreSQL连接池
 * @return Pool PostgreSQL连接池实例
 */
function createPool(): Pool {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'betterstats',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: SERVER_CONFIG.DB_POOL.MAX_CONNECTIONS,
        idleTimeoutMillis: SERVER_CONFIG.DB_POOL.IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: SERVER_CONFIG.DB_POOL.CONNECTION_TIMEOUT_MS,
    });
}

/**
 * @functionName validateTableName
 * @description 验证表名是否合法，防止SQL注入
 * @params:tableName string 表名
 * @return boolean 是否合法
 * @example validateTableName('users') // true
 * @example validateTableName('users; DROP TABLE users;') // false
 */
function validateTableName(tableName: string): boolean {
    return SERVER_CONFIG.SECURITY.VALID_IDENTIFIER_REGEX.test(tableName);
}

/**
 * @functionName validateColumnName
 * @description 验证列名是否合法，防止SQL注入
 * @params:columnName string 列名
 * @return boolean 是否合法
 */
function validateColumnName(columnName: string): boolean {
    return SERVER_CONFIG.SECURITY.VALID_IDENTIFIER_REGEX.test(columnName);
}

/**
 * @functionName sanitizeInput
 * @description 清理用户输入，防止XSS攻击
 * @params:input string 用户输入
 * @return string 清理后的输入
 */
function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// 创建Express应用
const app = express();
const PORT = SERVER_CONFIG.PORT;

// 安全中间件
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000'],
    methods: SERVER_CONFIG.CORS.METHODS,
    allowedHeaders: SERVER_CONFIG.CORS.ALLOWED_HEADERS,
}));

// 速率限制
const limiter = rateLimit({
    windowMs: SERVER_CONFIG.RATE_LIMIT.WINDOW_MS,
    max: SERVER_CONFIG.RATE_LIMIT.MAX_REQUESTS,
    message: { error: '请求过于频繁，请稍后再试' },
});
app.use(limiter);

app.use(express.json({ limit: SERVER_CONFIG.SECURITY.MAX_BODY_SIZE }));
app.use(cookieParser());

// 创建数据库连接池
const pool = createPool();

/**
 * @functionName executeQuery
 * @description 执行参数化查询，防止SQL注入
 * @params:sql string SQL查询语句（使用参数化查询）
 * @params:params any[] 查询参数
 * @return Promise<QueryResult> 查询结果
 * @example executeQuery('SELECT * FROM users WHERE id = $1', [1])
 */
async function executeQuery(sql: string, params: any[] = []): Promise<QueryResult> {
    const client: PoolClient = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result;
    } finally {
        client.release();
    }
}

// 错误处理中间件
interface ApiError extends Error {
    statusCode?: number;
}

function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction): void {
    console.error('Error:', err);
    res.status(err.statusCode || 500).json({
        error: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

// 健康检查接口（无需token）
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 初始化会话（无需token，设置HTTP-Only Cookie）
app.post('/api/init', initSession);

// 退出登录
app.post('/api/logout', logout);

// 以下接口需要Cookie认证（一次性token，自动刷新）
app.use(authenticateCookie);

// 查询接口 - 使用参数化查询防止SQL注入
app.post('/api/query', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sql, params } = req.body;
        
        // 只允许SELECT语句
        if (!sql || typeof sql !== 'string') {
            return res.status(400).json({ error: 'SQL语句不能为空' });
        }
        
        const trimmedSql = sql.trim().toUpperCase();
        if (!trimmedSql.startsWith('SELECT')) {
            return res.status(403).json({ error: '只允许执行SELECT查询' });
        }
        
        // 禁止危险关键字
        const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE'];
        const upperSql = sql.toUpperCase();
        for (const keyword of dangerousKeywords) {
            if (upperSql.includes(keyword)) {
                return res.status(403).json({ error: `SQL语句包含禁止的关键字: ${keyword}` });
            }
        }
        
        const result = await executeQuery(sql, params || []);
        res.json({
            rows: result.rows,
            rowCount: result.rowCount,
        });
    } catch (error) {
        next(error);
    }
});

// 安全的表数据查询接口
app.get('/api/table/:tableName', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tableName } = req.params;
        const { page = '1', limit = '10', orderBy, order = 'ASC' } = req.query;
        
        // 验证表名
        if (!validateTableName(tableName as string)) {
            return res.status(400).json({ error: '无效的表名' });
        }
        
        // 验证排序字段
        let orderClause = '';
        if (orderBy) {
            if (!validateColumnName(orderBy as string)) {
                return res.status(400).json({ error: '无效的排序字段' });
            }
            const orderDirection = (order as string).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            orderClause = `ORDER BY "${orderBy}" ${orderDirection}`;
        }
        
        // 分页参数
        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
        const offset = (pageNum - 1) * limitNum;
        
        // 使用参数化查询
        const sql = `
            SELECT * FROM "${tableName}"
            ${orderClause}
            LIMIT $1 OFFSET $2
        `;
        
        const result = await executeQuery(sql, [limitNum, offset]);
        
        // 获取总数
        const countSql = `SELECT COUNT(*) as total FROM "${tableName}"`;
        const countResult = await executeQuery(countSql);
        const total = parseInt(countResult.rows[0].total, 10);
        
        res.json({
            data: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
});

// 根据ID查询单条记录
app.get('/api/table/:tableName/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tableName, id } = req.params;
        
        // 验证表名
        if (!validateTableName(tableName as string)) {
            return res.status(400).json({ error: '无效的表名' });
        }
        
        // 验证ID是否为数字
        const numericId = parseInt(id as string, 10);
        if (isNaN(numericId)) {
            return res.status(400).json({ error: '无效的ID' });
        }
        
        const sql = `SELECT * FROM "${tableName}" WHERE id = $1 LIMIT 1`;
        const result = await executeQuery(sql, [numericId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '记录不存在' });
        }
        
        res.json({ data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`数据库服务已启动，端口: ${PORT}`);
    console.log(`健康检查: ${SERVER_CONFIG.API_BASE_URL}/health`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('正在关闭数据库连接池...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('正在关闭数据库连接池...');
    await pool.end();
    process.exit(0);
});

