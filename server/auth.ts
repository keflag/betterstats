/**
 * @fileName auth.ts
 * @description 基于HTTP-Only Cookie的认证模块，支持一次性token
 * @author keflag
 * @createDate 2026-03-08 09:53:42
 * @lastUpdateDate 2026-03-08 10:04:49
 * @version 3.0.0
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
 * @constant COOKIE_NAME
 * @description Cookie名称
 */
const COOKIE_NAME = 'betterstats_token';

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
        exp: Math.floor(Date.now() / 1000) + 60, // 60秒有效期
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
        
        // 限制集合大小，防止内存泄漏
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
 * @functionName setTokenCookie
 * @description 设置HTTP-Only Cookie
 * @params:res Response Express响应对象
 * @params:token string JWT Token
 */
function setTokenCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 1000, // 60秒
        path: '/',
    });
}

/**
 * @functionName clearTokenCookie
 * @description 清除Token Cookie
 * @params:res Response Express响应对象
 */
function clearTokenCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
}

/**
 * @functionName authenticateCookie
 * @description Cookie认证中间件（一次性token）
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 * @params:next NextFunction Express下一个中间件函数
 */
function authenticateCookie(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
        res.status(401).json({
            error: '未登录',
            message: '请先访问初始化接口获取访问权限',
        });
        return;
    }

    const payload = verifyToken(token);

    if (!payload) {
        clearTokenCookie(res);
        res.status(403).json({
            error: '认证失败',
            message: 'token已过期或无效，请重新初始化',
        });
        return;
    }

    // 将解码后的信息附加到请求对象
    (req as any).jwtPayload = payload;
    
    // 生成新token并设置cookie（自动刷新）
    const newToken = generateToken();
    setTokenCookie(res, newToken);
    
    next();
}

/**
 * @functionName initSession
 * @description 初始化会话，签发第一个token
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 */
function initSession(req: Request, res: Response): void {
    // 生成初始token
    const token = generateToken();
    
    // 设置HTTP-Only Cookie
    setTokenCookie(res, token);
    
    res.json({
        success: true,
        message: '会话已初始化，token已设置到HTTP-Only Cookie',
    });
}

/**
 * @functionName logout
 * @description 退出登录，清除cookie
 * @params:req Request Express请求对象
 * @params:res Response Express响应对象
 */
function logout(req: Request, res: Response): void {
    clearTokenCookie(res);
    res.json({
        success: true,
        message: '已退出登录',
    });
}

export {
    generateToken,
    verifyToken,
    authenticateCookie,
    initSession,
    logout,
    COOKIE_NAME,
    USED_TOKENS,
};

export default {
    generateToken,
    verifyToken,
    authenticateCookie,
    initSession,
    logout,
    COOKIE_NAME,
    USED_TOKENS,
};

