/**
 * @fileName authRoutes.ts
 * @description 认证路由，处理登录、登出、刷新Token等
 * @author keflag
 * @createDate 2026-03-08 11:07:36
 * @lastUpdateDate 2026-03-08 11:07:36
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { login, logout, refreshToken, getUserByUuid } from '../services/authService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { LoginRequest } from '../types/auth';

const router = Router();

/**
 * @route POST /api/auth/login
 * @description 用户登录
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { account, password, rememberDevice } = req.body as LoginRequest;
        
        if (!account || !password) {
            res.status(400).json({
                success: false,
                error: '账号和密码不能为空',
            });
            return;
        }
        
        const result = await login(
            { account, password, rememberDevice: rememberDevice || false },
            req.headers['user-agent'] || '',
            req.ip || ''
        );
        
        res.json(result);
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : '登录失败',
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @description 用户登出
 */
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '未登录',
            });
            return;
        }
        
        await logout(req.user.uuid, req.user.sessionId, req.ip || '');
        
        res.json({
            success: true,
            message: '登出成功',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '登出失败',
        });
    }
});

/**
 * @route POST /api/auth/refresh
 * @description 刷新Token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: '未提供Token',
            });
            return;
        }
        
        const oldToken = authHeader.substring(7);
        
        const result = await refreshToken(
            oldToken,
            req.headers['user-agent'] || '',
            req.ip || ''
        );
        
        res.json(result);
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : '刷新Token失败',
        });
    }
});

/**
 * @route GET /api/auth/me
 * @description 获取当前用户信息
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: '未登录',
            });
            return;
        }
        
        const user = await getUserByUuid(req.user.uuid);
        
        if (!user) {
            res.status(404).json({
                success: false,
                error: '用户不存在',
            });
            return;
        }
        
        res.json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '获取用户信息失败',
        });
    }
});

export default router;
