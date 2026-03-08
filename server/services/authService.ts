/**
 * @fileName authService.ts
 * @description 认证服务，处理登录、Token生成和验证
 * @author keflag
 * @createDate 2026-03-08 10:52:59
 * @lastUpdateDate 2026-03-08 10:52:59
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { 
    UserRole, 
    UserStatus, 
    SessionStatus, 
    JwtPayload, 
    UserInfo, 
    LoginRequest, 
    LoginResponse 
} from '../types/auth';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = 24 * 60 * 60; // 24小时（秒）
const REMEMBER_DEVICE_DAYS = 7;

// 数据库连接池
let pool: Pool;

/**
 * @functionName setPool
 * @description 设置数据库连接池
 */
export function setPool(dbPool: Pool): void {
    pool = dbPool;
}

/**
 * @functionName generateToken
 * @description 生成JWT Token
 */
function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * @functionName verifyToken
 * @description 验证JWT Token
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        return null;
    }
}

/**
 * @functionName hashPassword
 * @description 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * @functionName comparePassword
 * @description 验证密码
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * @functionName generateDeviceFingerprint
 * @description 生成设备指纹
 */
function generateDeviceFingerprint(userAgent: string, ip: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${userAgent}:${ip}`).digest('hex');
}

/**
 * @functionName login
 * @description 用户登录
 */
export async function login(
    data: LoginRequest, 
    userAgent: string, 
    ip: string
): Promise<LoginResponse> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. 查找用户
        const userResult = await client.query(
            'SELECT * FROM users WHERE account = $1 AND status = $2',
            [data.account, UserStatus.AVAILABLE]
        );
        
        if (userResult.rows.length === 0) {
            throw new Error('账号或密码错误');
        }
        
        const user = userResult.rows[0];
        
        // 2. 验证密码
        const isValid = await comparePassword(data.password, user.password_hash);
        if (!isValid) {
            throw new Error('账号或密码错误');
        }
        
        // 3. 创建会话
        const deviceFingerprint = generateDeviceFingerprint(userAgent, ip);
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY * 1000);
        
        const sessionResult = await client.query(
            `INSERT INTO sessions (user_uuid, token_hash, expires_at, device_fingerprint, user_agent, ip_address, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [user.uuid, '', expiresAt, deviceFingerprint, userAgent, ip, SessionStatus.ACTIVE]
        );
        
        const sessionId = sessionResult.rows[0].id;
        
        // 4. 生成Token
        const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
            userUuid: user.uuid,
            role: user.role as UserRole,
            sessionId: sessionId,
        };
        
        const token = generateToken(tokenPayload);
        
        // 5. 更新会话的token_hash
        await client.query(
            'UPDATE sessions SET token_hash = $1 WHERE id = $2',
            [token, sessionId]
        );
        
        // 6. 更新用户登录信息
        await client.query(
            `UPDATE users 
             SET last_login_at = CURRENT_TIMESTAMP, 
                 last_online_at = CURRENT_TIMESTAMP,
                 last_login_ip = $1,
                 device_fingerprint = $2,
                 device_expires_at = $3
             WHERE uuid = $4`,
            [ip, deviceFingerprint, 
             data.rememberDevice ? new Date(Date.now() + REMEMBER_DEVICE_DAYS * 24 * 60 * 60 * 1000) : null,
             user.uuid]
        );
        
        // 7. 记录登录日志
        await client.query(
            `INSERT INTO operation_logs (user_uuid, action, target_type, target_uuid, details, ip_address, user_agent)
             VALUES ($1, 'login', 'user', $2, $3, $4, $5)`,
            [user.uuid, user.uuid, JSON.stringify({ rememberDevice: data.rememberDevice }), ip, userAgent]
        );
        
        await client.query('COMMIT');
        
        const userInfo: UserInfo = {
            uuid: user.uuid,
            account: user.account,
            email: user.email,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            lastLoginAt: user.last_login_at,
            lastOnlineAt: new Date(),
        };
        
        return {
            success: true,
            token,
            expiresAt,
            user: userInfo,
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * @functionName logout
 * @description 用户登出
 */
export async function logout(userUuid: string, sessionId: number, ip: string): Promise<void> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. 更新会话状态
        await client.query(
            'UPDATE sessions SET status = $1 WHERE id = $2',
            [SessionStatus.REVOKED, sessionId]
        );
        
        // 2. 清除设备绑定
        await client.query(
            'UPDATE users SET device_fingerprint = NULL, device_expires_at = NULL WHERE uuid = $1',
            [userUuid]
        );
        
        // 3. 记录登出日志
        await client.query(
            `INSERT INTO operation_logs (user_uuid, action, target_type, target_uuid, ip_address)
             VALUES ($1, 'logout', 'user', $1, $2)`,
            [userUuid, ip]
        );
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * @functionName refreshToken
 * @description 刷新Token
 */
export async function refreshToken(
    oldToken: string, 
    userAgent: string, 
    ip: string
): Promise<LoginResponse> {
    const payload = verifyToken(oldToken);
    if (!payload) {
        throw new Error('Token无效');
    }
    
    const client = await pool.connect();
    
    try {
        // 1. 验证会话
        const sessionResult = await client.query(
            'SELECT * FROM sessions WHERE id = $1 AND token_hash = $2 AND status = $3',
            [payload.sessionId, oldToken, SessionStatus.ACTIVE]
        );
        
        if (sessionResult.rows.length === 0) {
            throw new Error('会话已失效');
        }
        
        // 2. 获取用户信息
        const userResult = await client.query(
            'SELECT * FROM users WHERE uuid = $1 AND status = $2',
            [payload.userUuid, UserStatus.AVAILABLE]
        );
        
        if (userResult.rows.length === 0) {
            throw new Error('用户不存在或已被禁用');
        }
        
        const user = userResult.rows[0];
        
        // 3. 生成新Token
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY * 1000);
        const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
            userUuid: user.uuid,
            role: user.role as UserRole,
            sessionId: payload.sessionId,
        };
        const newToken = generateToken(newPayload);
        
        // 4. 更新会话
        await client.query(
            'UPDATE sessions SET token_hash = $1, expires_at = $2 WHERE id = $3',
            [newToken, expiresAt, payload.sessionId]
        );
        
        // 5. 更新用户在线时间
        await client.query(
            'UPDATE users SET last_online_at = CURRENT_TIMESTAMP WHERE uuid = $1',
            [user.uuid]
        );
        
        const userInfo: UserInfo = {
            uuid: user.uuid,
            account: user.account,
            email: user.email,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            lastLoginAt: user.last_login_at,
            lastOnlineAt: new Date(),
        };
        
        return {
            success: true,
            token: newToken,
            expiresAt,
            user: userInfo,
        };
        
    } finally {
        client.release();
    }
}

/**
 * @functionName getUserByUuid
 * @description 根据UUID获取用户信息
 */
export async function getUserByUuid(uuid: string): Promise<UserInfo | null> {
    const result = await pool.query(
        'SELECT * FROM users WHERE uuid = $1',
        [uuid]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    const user = result.rows[0];
    
    return {
        uuid: user.uuid,
        account: user.account,
        email: user.email,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        lastLoginAt: user.last_login_at,
        lastOnlineAt: user.last_online_at,
    };
}

/**
 * @functionName updateLastOnline
 * @description 更新用户最后在线时间
 */
export async function updateLastOnline(userUuid: string): Promise<void> {
    await pool.query(
        'UPDATE users SET last_online_at = CURRENT_TIMESTAMP WHERE uuid = $1',
        [userUuid]
    );
}

export default {
    setPool,
    login,
    logout,
    refreshToken,
    verifyToken,
    getUserByUuid,
    updateLastOnline,
    hashPassword,
    comparePassword,
};
