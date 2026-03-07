/**
 * @fileName login.routes.ts
 * @description 登录认证路由 - 支持账号密码登录、7 天记住设备
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { generateToken, generateRefreshToken, logOperation } from '../middleware/auth';
import { validateInput } from '../utils/validators';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(6).max(50),
  rememberDevice: z.boolean().optional().default(false),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, rememberDevice } = validateInput(loginSchema, req.body);

    const userResult = await pool.query(
      `SELECT uuid, username, password_hash, email, role, school_uuid, status, real_name, avatar_url
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: '账号已被封禁，请联系管理员',
      });
      return;
    }

    const token = generateToken({
      uuid: user.uuid,
      username: user.username,
      role: user.role,
      schoolUuid: user.school_uuid,
    });

    const refreshToken = generateRefreshToken(user.uuid);

    await pool.query(
      `UPDATE users 
       SET last_login_at = CURRENT_TIMESTAMP, 
           last_login_device = $1
       WHERE uuid = $2`,
      [req.headers['user-agent'] || 'unknown', user.uuid]
    );

    let deviceToken: string | undefined;

    if (rememberDevice) {
      const deviceId = uuidv4();
      deviceToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await pool.query(
        `INSERT INTO user_devices 
         (user_uuid, device_id, device_name, device_token, expires_at, is_active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [
          user.uuid,
          deviceId,
          req.headers['user-agent'] || 'unknown',
          deviceToken,
          expiresAt,
        ]
      );
    }

    await logOperation(
      user.uuid,
      'login',
      'user',
      user.uuid,
      null,
      { login_time: new Date().toISOString() },
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.json({
      success: true,
      data: {
        user: {
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          role: user.role,
          realName: user.real_name,
          avatarUrl: user.avatar_url,
          schoolUuid: user.school_uuid,
        },
        token,
        refreshToken,
        deviceToken,
        expiresIn: 7200,
      },
      message: '登录成功',
    });
  } catch (error) {
    console.error('登录失败:', error);
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = validateInput(refreshSchema, req.body);

    const payload = await new Promise<any>((resolve, reject) => {
      require('jsonwebtoken').verify(refreshToken, process.env.JWT_SECRET, (err: any, decoded: any) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    const userResult = await pool.query(
      'SELECT uuid, username, role, school_uuid, status FROM users WHERE uuid = $1',
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

    const newToken = generateToken({
      uuid: user.uuid,
      username: user.username,
      role: user.role,
      schoolUuid: user.school_uuid,
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 7200,
      },
      message: 'Token 刷新成功',
    });
  } catch (error) {
    console.error('刷新 Token 失败:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh Token 无效或已过期',
    });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      const payload = await new Promise<any>((resolve, reject) => {
        require('jsonwebtoken').verify(token, process.env.JWT_SECRET, (err: any, decoded: any) => {
          if (err) reject(err);
          else resolve(decoded);
        });
      });

      await pool.query(
        `UPDATE user_devices 
         SET is_active = false 
         WHERE user_uuid = $1 AND device_token = $2`,
        [payload.uuid, req.body.deviceToken]
      );
    }

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/me', async (req: Request, res: Response) => {
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
    const payload = await new Promise<any>((resolve, reject) => {
      require('jsonwebtoken').verify(token, process.env.JWT_SECRET, (err: any, decoded: any) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    const userResult = await pool.query(
      `SELECT uuid, username, email, role, school_uuid, status, real_name, avatar_url, student_id, class_info
       FROM users
       WHERE uuid = $1`,
      [payload.uuid]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        role: user.role,
        realName: user.real_name,
        avatarUrl: user.avatar_url,
        schoolUuid: user.school_uuid,
        studentId: user.student_id,
        classInfo: user.class_info,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(401).json({
      success: false,
      message: '认证失败',
    });
  }
});

export default router;
