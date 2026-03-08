/**
 * @fileName AuthGuard.tsx
 * @description 权限守卫组件，控制页面访问权限
 * @author keflag
 * @createDate 2026-03-08 11:10:11
 * @lastUpdateDate 2026-03-08 11:10:11
 * @version 1.0.0
 */

import React from 'react';
import { Navigate, useLocation } from 'umi';
import { Spin, Result, Button } from 'antd';
import { useAuth, UserRole } from '@/contexts/AuthContext';

/**
 * @interface AuthGuardProps
 * @description 权限守卫属性接口
 */
interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * @componentName AuthGuard
 * @description 基础认证守卫，检查是否登录
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 未登录，重定向到登录页
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

/**
 * @componentName RoleGuard
 * @description 角色权限守卫，检查用户角色
 */
export const RoleGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRoles = [], 
  fallback 
}) => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 检查角色权限
  if (requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" href="/">
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

/**
 * @componentName PlatformAdminGuard
 * @description 平台管理员权限守卫
 */
export const PlatformAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRoles={[UserRole.PLATFORM_ADMIN]}>
      {children}
    </RoleGuard>
  );
};

/**
 * @componentName SchoolAdminGuard
 * @description 学校管理员权限守卫
 */
export const SchoolAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRoles={[UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN]}>
      {children}
    </RoleGuard>
  );
};

/**
 * @componentName TeacherGuard
 * @description 教师权限守卫
 */
export const TeacherGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN]}>
      {children}
    </RoleGuard>
  );
};

/**
 * @componentName StudentGuard
 * @description 学生权限守卫
 */
export const StudentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard requiredRoles={[UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.PLATFORM_ADMIN]}>
      {children}
    </RoleGuard>
  );
};

export default AuthGuard;
