/**
 * @fileName permissionService.ts
 * @description 权限服务，处理权限校验
 * @author keflag
 * @createDate 2026-03-08 11:03:46
 * @lastUpdateDate 2026-03-08 11:03:46
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { UserRole, Permission } from '../types/auth';

let pool: Pool;

/**
 * @functionName setPool
 * @description 设置数据库连接池
 */
export function setPool(dbPool: Pool): void {
    pool = dbPool;
}

/**
 * @functionName getUserPermissions
 * @description 获取用户权限列表
 */
export async function getUserPermissions(role: UserRole): Promise<Permission[]> {
    const result = await pool.query(
        `SELECT resource, action, scope 
         FROM permissions 
         WHERE role = $1 AND status = 'available'`,
        [role]
    );
    
    return result.rows.map(row => ({
        resource: row.resource,
        action: row.action,
        scope: row.scope,
    }));
}

/**
 * @functionName hasPermission
 * @description 检查用户是否有权限
 */
export async function hasPermission(
    role: UserRole,
    resource: string,
    action: string
): Promise<boolean> {
    const result = await pool.query(
        `SELECT 1 FROM permissions 
         WHERE role = $1 AND resource = $2 AND action = $3 AND status = 'available'`,
        [role, resource, action]
    );
    
    return result.rows.length > 0;
}

/**
 * @functionName checkPermissionScope
 * @description 检查权限范围
 */
export function checkPermissionScope(
    userScope: string,
    requiredScope: string,
    userSchoolUuid?: string,
    targetSchoolUuid?: string,
    userClassUuid?: string,
    targetClassUuid?: string
): boolean {
    // 平台管理员可以访问所有数据
    if (userScope === 'all') {
        return true;
    }
    
    // 本校范围检查
    if (userScope === 'own_school') {
        return userSchoolUuid === targetSchoolUuid;
    }
    
    // 本班范围检查
    if (userScope === 'own_class') {
        return userSchoolUuid === targetSchoolUuid && userClassUuid === targetClassUuid;
    }
    
    // 仅自己
    if (userScope === 'own') {
        return false; // 需要在具体业务逻辑中检查
    }
    
    return false;
}

export default {
    setPool,
    getUserPermissions,
    hasPermission,
    checkPermissionScope,
};
