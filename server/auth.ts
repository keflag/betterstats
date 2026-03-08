/**
 * @fileName auth.ts
 * @description JWT认证模块，提供一次性token生成和验证功能
 * @author keflag
 * @createDate 2026-03-08 09:53:42
 * @lastUpdateDate 2026-03-08 09:58:49
 * @version 2.0.0
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

/**
 * @interface JwtPayload
 * @description JWT载荷接口
 */
interface JwtPayload {
    iss: string;
    jti: string;
    iat: number;
    exp: number;
}

/**
 * @constant JWT_SECRET
 * @description JWT密钥，从环境变量获取
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * @constant USED_TOKENS
 * @description 已使用的token集合（内存存储，重启后清空）
 */
const USED_TOKENS = new Set<string>();

/**
 * @functionName generateToken
 * @description 生成一次性JWT Token
 * @return string JWT Token字符串
 * @example const token = generateToken();
 */
function generateToken(): string {
    const jti = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const payload: JwtPayload = {
        iss: 'betterstats-server',
        jti,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60, // 60秒有效期，足够单次请求
    };

    return jwt.sign(payload, JWT_SECRET);
}

/**
 * @functionName verifyToken
 * @description 验证JWT Token（一次性使用）
 * @params:token string JWT Token字符串
 * @return JwtPayload | null 验证成功返回载荷，失败返回null
 * @example const payload = verifyToken(token);
 */
function verifyToken(token: string): JwtPayload | null {
    try {
        // 检查token是否已被使用
        if (USED_TOKENS.has(token)) {
            console.log('Token已被使用:', token.substring(0, 20) + '...');
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // 标记token为已使用
        USED_TOKENS.add(token);
        
        // 限制集合大小，防止内存泄漏（保留最近10000个）
        if (USED_TOKENS.size > 10000) {
            const iterator = USED_TOKENS.values();
            for (let i = 0; i < 1000; i++) {
                const oldToken = iterator.next().value;
                if (oldToken) {
                    USED_TOKENS.delete(oldToken);
                }
            }
        }
        
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * @functionName authenticateJwt
 * @description JWT认证中间件（一次性token）
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 * @params:next NextFunction Express下一个中间件函数
 */
function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({
            error: '缺少认证信息',
            message: '请在请求头中添加Authorization: Bearer <token>',
        });
        return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            error: '认证格式错误',
            message: 'Authorization头格式应为: Bearer <token>',
        });
        return;
    }

    const token = parts[1];
    const payload = verifyToken(token);

    if (!payload) {
        res.status(403).json({
            error: '无效的token',
            message: 'token已过期、签名无效或已被使用',
        });
        return;
    }

    // 将解码后的信息附加到请求对象
    (req as any).jwtPayload = payload;
    (req as any).usedToken = token;
    next();
}

/**
 * @functionName login
 * @description 登录接口处理函数，验证密码后签发token
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 */
function login(req: Request, res: Response): void {
    const { password } = req.body;
    const expectedPassword = process.env.DB_PASSWORD;

    if (!expectedPassword) {
        res.status(500).json({
            error: '服务器配置错误',
            message: '未配置数据库密码',
        });
        return;
    }

    if (password !== expectedPassword) {
        res.status(401).json({
            error: '认证失败',
            message: '密码错误',
        });
        return;
    }

    const token = generateToken();
    res.json({
        success: true,
        token,
        message: '请在下一次请求中使用此token，使用后立即失效',
    });
}

/**
 * @functionName refreshTokenMiddleware
 * @description 刷新token中间件，在响应中返回新token
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 * @params:next NextFunction Express下一个中间件函数
 */
function refreshTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
        // 如果响应成功，附加新token
        if (res.statusCode >= 200 && res.statusCode < 300) {
            body.nextToken = generateToken();
        }
        return originalJson(body);
    };
    
    next();
}

export {
    generateToken,
    verifyToken,
    authenticateJwt,
    login,
    refreshTokenMiddleware,
    USED_TOKENS,
};

export default {
    generateToken,
    verifyToken,
    authenticateJwt,
    login,
    refreshTokenMiddleware,
    USED_TOKENS,
};

