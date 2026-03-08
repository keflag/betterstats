/**
 * @fileName auth.ts
 * @description JWT认证模块，提供token生成和验证功能
 * @author keflag
 * @createDate 2026-03-08 09:53:42
 * @lastUpdateDate 2026-03-08 09:53:42
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import SERVER_CONFIG from './config';

/**
 * @interface JwtPayload
 * @description JWT载荷接口
 */
interface JwtPayload {
    iss: string;
    iat: number;
    exp: number;
}

/**
 * @constant JWT_SECRET
 * @description JWT密钥，从环境变量获取
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * @constant TOKEN_EXPIRY
 * @description Token过期时间（秒）
 */
const TOKEN_EXPIRY = 24 * 60 * 60; // 24小时

/**
 * @functionName generateToken
 * @description 生成JWT Token
 * @return string JWT Token字符串
 * @example const token = generateToken();
 */
function generateToken(): string {
    const payload: JwtPayload = {
        iss: 'betterstats-server',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
    };

    return jwt.sign(payload, JWT_SECRET);
}

/**
 * @functionName verifyToken
 * @description 验证JWT Token
 * @params:token string JWT Token字符串
 * @return JwtPayload | null 验证成功返回载荷，失败返回null
 * @example const payload = verifyToken(token);
 */
function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * @functionName authenticateJwt
 * @description JWT认证中间件
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
            message: 'token已过期或签名无效',
        });
        return;
    }

    // 将解码后的信息附加到请求对象
    (req as any).jwtPayload = payload;
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
        expiresIn: TOKEN_EXPIRY,
    });
}

export {
    generateToken,
    verifyToken,
    authenticateJwt,
    login,
    TOKEN_EXPIRY,
};

export default {
    generateToken,
    verifyToken,
    authenticateJwt,
    login,
    TOKEN_EXPIRY,
};

