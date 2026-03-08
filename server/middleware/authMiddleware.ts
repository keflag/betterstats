/**
 * @fileName authMiddleware.ts
 * @description 认证中间件，处理Token验证和权限校验
 * @author keflag
 * @createDate 2026-03-08 11:03:46
 * @lastUpdateDate 2026-03-08 11:03:46
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserByUuid, updateLastOnline } from '../services/authService';
import { hasPermission } from '../services/permissionService';
import { UserRole, JwtPayload, UserStatus } from '../types/auth';

/**
 * @interface AuthenticatedRequest
 * @description 带认证信息的请求接口
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        uuid: string;
        role: UserRole;
        sessionId: number;
    };
}

/**
 * @functionName authMiddleware
 * @description Token认证中间件
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: '未提供认证Token',
        });
        return;
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
        res.status(401).json({
            success: false,
            error: 'Token无效或已过期',
        });
        return;
    }
    
    // 将用户信息附加到请求对象
    req.user = {
        uuid: payload.userUuid,
        role: payload.role,
        sessionId: payload.sessionId,
    };
    
    // 更新用户最后在线时间（异步，不阻塞请求）
    updateLastOnline(payload.userUuid).catch(console.error);
    
    next();
}

/**
 * @functionName requireAuth
 * @description 要求登录的中间件
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    authMiddleware(req, res, () => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '请先登录',
            });
            return;
        }
        next();
    });
}

/**
 * @functionName requirePermission
 * @description 权限检查中间件工厂函数
 */
export function requirePermission(resource: string, action: string) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '请先登录',
            });
            return;
        }
        
        const hasAccess = await hasPermission(req.user.role, resource, action);
        
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: '没有权限执行此操作',
            });
            return;
        }
        
        next();
    };
}

/**
 * @functionName requireRole
 * @description 角色检查中间件工厂函数
 */
export function requireRole(...roles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '请先登录',
            });
            return;
        }
        
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: '没有权限访问此资源',
            });
            return;
        }
        
        next();
    };
}

export default {
    authMiddleware,
    requireAuth,
    requirePermission,
    requireRole,
};
