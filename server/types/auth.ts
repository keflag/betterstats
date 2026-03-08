/**
 * @fileName auth.ts
 * @description 认证相关类型定义
 * @author keflag
 * @createDate 2026-03-08 10:50:19
 * @lastUpdateDate 2026-03-08 10:50:19
 * @version 1.0.0
 */

/**
 * @enum UserRole
 * @description 用户角色枚举
 */
export enum UserRole {
    PLATFORM_ADMIN = 'platform_admin',
    SCHOOL_ADMIN = 'school_admin',
    TEACHER = 'teacher',
    STUDENT = 'student',
}

/**
 * @enum UserStatus
 * @description 用户状态枚举
 */
export enum UserStatus {
    AVAILABLE = 'available',
    BANNED = 'banned',
    DISABLED = 'disabled',
}

/**
 * @enum SessionStatus
 * @description 会话状态枚举
 */
export enum SessionStatus {
    ACTIVE = 'active',
    REVOKED = 'revoked',
    EXPIRED = 'expired',
}

/**
 * @interface JwtPayload
 * @description JWT载荷接口
 */
export interface JwtPayload {
    userUuid: string;
    role: UserRole;
    sessionId: number;
    iat: number;
    exp: number;
}

/**
 * @interface UserInfo
 * @description 用户信息接口
 */
export interface UserInfo {
    uuid: string;
    account: string;
    email: string | null;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date | null;
    lastOnlineAt: Date | null;
}

/**
 * @interface LoginRequest
 * @description 登录请求接口
 */
export interface LoginRequest {
    account: string;
    password: string;
    rememberDevice: boolean;
}

/**
 * @interface LoginResponse
 * @description 登录响应接口
 */
export interface LoginResponse {
    success: boolean;
    token: string;
    expiresAt: Date;
    user: UserInfo;
}

/**
 * @interface Permission
 * @description 权限接口
 */
export interface Permission {
    resource: string;
    action: string;
    scope: string;
}

export default {
    UserRole,
    UserStatus,
    SessionStatus,
};
