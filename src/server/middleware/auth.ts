/**
 * @fileName auth.ts
 * @description JWT 认证模块 - token 生成、校验、刷新
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 JWT_SECRET 环境变量！');
  }
  console.warn('警告：未设置 JWT_SECRET，使用临时密钥（仅开发环境）');
}

const SECRET = JWT_SECRET || 'dev-secret-key-change-in-production';
const TOKEN_EXPIRES_IN = '2h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPayload {
  uuid: string;
  username: string;
  role: string;
  schoolUuid?: string;
  permissions?: string[];
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRES_IN });
};

export const generateRefreshToken = (uuid: string): string => {
  return jwt.sign({ uuid }, SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Token 无效或已过期');
  }
};

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const userResult = await pool.query(
      'SELECT uuid, role, school_uuid, status FROM users WHERE uuid = $1',
      [payload.uuid]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: '账号已被封禁',
      });
      return;
    }

    req.user = {
      uuid: user.uuid,
      username: payload.username,
      role: user.role,
      schoolUuid: user.school_uuid,
      permissions: payload.permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token 已过期',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '认证失败',
    });
  }
};

export const permissionMiddleware = (requiredPermission: {
  resource: string;
  action: string;
}) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '未认证',
        });
        return;
      }

      const userRole = req.user.role;

      const result = await pool.query(
        `SELECT actions, scope FROM permission_rules 
         WHERE role = $1 AND resource = $2`,
        [userRole, requiredPermission.resource]
      );

      if (result.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: '没有权限执行此操作',
        });
        return;
      }

      const { actions, scope } = result.rows[0];

      if (!actions.includes(requiredPermission.action)) {
        res.status(403).json({
          success: false,
          message: '没有权限执行此操作',
        });
        return;
      }

      (req.user as any).scope = scope;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '权限验证失败',
      });
    }
  };
};

export const logOperation = async (
  userUuid: string,
  action: string,
  resource: string,
  resourceUuid: string | null,
  oldValue: any,
  newValue: any,
  ipAddress: string,
  userAgent: string
) => {
  try {
    await pool.query(
      `INSERT INTO operation_logs 
       (user_uuid, action, resource, resource_uuid, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userUuid, action, resource, resourceUuid, oldValue, newValue, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};
