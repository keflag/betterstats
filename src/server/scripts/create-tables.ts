/**
 * @fileName create-tables.ts
 * @description 创建数据库表结构 - 用户表、学校表、权限规则表等核心表
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { pool } from '../config/database';

const createTables = async () => {
  try {
    console.log('开始创建数据库表结构...');

    // 创建学校表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(50) UNIQUE,
        address TEXT,
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 学校表创建成功');

    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL,
        school_uuid UUID REFERENCES schools(uuid) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'active',
        avatar_url TEXT,
        real_name VARCHAR(100),
        student_id VARCHAR(50),
        class_info VARCHAR(100),
        last_login_at TIMESTAMP WITH TIME ZONE,
        last_login_device VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 用户表创建成功');

    // 创建用户设备表（记住设备功能）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id SERIAL PRIMARY KEY,
        user_uuid UUID REFERENCES users(uuid) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        device_name VARCHAR(255),
        device_token VARCHAR(512) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 用户设备表创建成功');

    // 创建权限规则表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permission_rules (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        actions JSONB NOT NULL DEFAULT '[]',
        scope VARCHAR(50) DEFAULT 'self',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, resource)
      )
    `);
    console.log('✅ 权限规则表创建成功');

    // 创建操作日志表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id SERIAL PRIMARY KEY,
        user_uuid UUID REFERENCES users(uuid) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_uuid UUID,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 操作日志表创建成功');

    // 创建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_uuid);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_device ON user_devices(user_uuid);
      CREATE INDEX IF NOT EXISTS idx_permission_rules_role ON permission_rules(role);
      CREATE INDEX IF NOT EXISTS idx_logs_user ON operation_logs(user_uuid);
      CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at);
    `);
    console.log('✅ 索引创建成功');

    // 插入默认权限规则
    await insertDefaultPermissions();

    // 创建默认学校和管理员
    await createDefaultSchoolAndAdmin();

    console.log('\n数据库表结构创建完成！');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库表创建失败:', error);
    await pool.end();
    process.exit(1);
  }
};

const insertDefaultPermissions = async () => {
  const permissions = [
    {
      role: 'platform_admin',
      resource: 'schools',
      actions: ['create', 'read', 'update', 'delete', 'ban'],
      scope: 'all',
      description: '平台管理员可以管理所有学校',
    },
    {
      role: 'platform_admin',
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete', 'ban'],
      scope: 'all',
      description: '平台管理员可以管理所有用户',
    },
    {
      role: 'platform_admin',
      resource: 'system_settings',
      actions: ['create', 'read', 'update'],
      scope: 'all',
      description: '平台管理员可以配置系统设置',
    },
    {
      role: 'school_admin',
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete', 'ban'],
      scope: 'school',
      description: '学校管理员可以管理本校用户',
    },
    {
      role: 'school_admin',
      resource: 'school_settings',
      actions: ['create', 'read', 'update'],
      scope: 'school',
      description: '学校管理员可以配置本校统计设置',
    },
    {
      role: 'teacher',
      resource: 'students',
      actions: ['read'],
      scope: 'class',
      description: '老师可以查看所带班级学生数据',
    },
    {
      role: 'teacher',
      resource: 'assignments',
      actions: ['create', 'read', 'update', 'analyze'],
      scope: 'class',
      description: '老师可以创建和分析作业统计',
    },
    {
      role: 'teacher',
      resource: 'reports',
      actions: ['create', 'read', 'update', 'delete'],
      scope: 'class',
      description: '老师可以创建和管理统计报告',
    },
    {
      role: 'student',
      resource: 'personal_data',
      actions: ['read', 'submit'],
      scope: 'self',
      description: '学生可以查看和提交个人数据',
    },
  ];

  for (const perm of permissions) {
    await pool.query(
      `INSERT INTO permission_rules (role, resource, actions, scope, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (role, resource) DO NOTHING`,
      [perm.role, perm.resource, JSON.stringify(perm.actions), perm.scope, perm.description]
    );
  }

  console.log('✅ 默认权限规则插入成功');
};

const createDefaultSchoolAndAdmin = async () => {
  // 创建示例学校
  const schoolResult = await pool.query(
    `INSERT INTO schools (name, code, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (code) DO NOTHING
     RETURNING uuid`,
    ['示例学校', 'demo_school', 'active']
  );

  if (schoolResult.rows.length > 0) {
    console.log('✅ 示例学校创建成功');

    // 创建平台管理员
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    await pool.query(
      `INSERT INTO users (username, password_hash, email, role, status, real_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', passwordHash, 'admin@example.com', 'platform_admin', 'active', '系统管理员']
    );

    console.log('✅ 平台管理员账号创建成功 (用户名：admin, 密码：Admin@123)');

    // 创建学校管理员
    const schoolAdminHash = await bcrypt.hash('SchoolAdmin@123', 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, email, role, school_uuid, status, real_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO NOTHING`,
      ['school_admin', schoolAdminHash, 'school@example.com', 'school_admin', schoolResult.rows[0].uuid, 'active', '学校管理员']
    );

    console.log('✅ 学校管理员账号创建成功 (用户名：school_admin, 密码：SchoolAdmin@123)');
  } else {
    console.log('ℹ️  示例学校已存在，跳过创建');
  }
};

createTables();
