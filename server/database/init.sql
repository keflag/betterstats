-- betterstats 数据库初始化脚本
-- 第一阶段：基础架构与核心权限体系
-- @createDate 2026-03-08 10:43:20

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 学校表
CREATE TABLE schools (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'banned', 'disabled')),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 班级表
CREATE TABLE classes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    class_name VARCHAR(50) NOT NULL,  -- 班级名称（如"一班"，非UUID）
    school_uuid UUID NOT NULL REFERENCES schools(uuid) ON DELETE CASCADE,
    headteacher_uuid UUID,  -- 班主任用户UUID
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'banned', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 用户表（登录认证专用）
CREATE TABLE users (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('platform_admin', 'school_admin', 'teacher', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'banned', 'disabled')),
    
    -- 登录相关
    last_login_at TIMESTAMP,
    last_online_at TIMESTAMP,  -- 最后上线时间
    last_login_ip INET,
    
    -- 设备绑定（7天记住设备）
    device_fingerprint VARCHAR(255),
    device_expires_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 学生信息表
CREATE TABLE students (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID NOT NULL UNIQUE REFERENCES users(uuid) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('男', '女')),
    student_no VARCHAR(20) UNIQUE,  -- 学号
    grade VARCHAR(20) NOT NULL,  -- 年级（如"2024级"）
    class_uuid UUID REFERENCES classes(uuid) ON DELETE SET NULL,
    class_name VARCHAR(50),  -- 班级名称（冗余存储，方便查询）
    school_uuid UUID REFERENCES schools(uuid) ON DELETE SET NULL,
    enrollment_year INT,  -- 入学年份
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'banned', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 教师信息表（不要工号）
CREATE TABLE teachers (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID NOT NULL UNIQUE REFERENCES users(uuid) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('男', '女')),
    school_uuid UUID REFERENCES schools(uuid) ON DELETE SET NULL,
    email VARCHAR(100),
    subjects JSONB DEFAULT '[]',  -- 教授科目
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'banned', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. 权限规则表
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    resource VARCHAR(50) NOT NULL,  -- school, user, class, data, report, config
    action VARCHAR(50) NOT NULL,    -- create, read, update, delete, manage
    scope VARCHAR(20) NOT NULL DEFAULT 'own' CHECK (scope IN ('all', 'own_school', 'own_class', 'own')),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
);

-- 7. 登录会话表
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. 操作日志表
CREATE TABLE operation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID REFERENCES users(uuid) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,  -- login, logout, create, update, delete, query
    target_type VARCHAR(50),      -- school, class, user, student, teacher, data, config
    target_uuid UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_account ON users(account);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_device ON users(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

CREATE INDEX idx_students_user_uuid ON students(user_uuid);
CREATE INDEX idx_students_school ON students(school_uuid);
CREATE INDEX idx_students_class ON students(class_uuid);
CREATE INDEX idx_students_status ON students(status);

CREATE INDEX idx_teachers_user_uuid ON teachers(user_uuid);
CREATE INDEX idx_teachers_school ON teachers(school_uuid);
CREATE INDEX idx_teachers_status ON teachers(status);

CREATE INDEX idx_classes_school ON classes(school_uuid);
CREATE INDEX idx_classes_status ON classes(status);

CREATE INDEX idx_schools_status ON schools(status);

CREATE INDEX idx_sessions_user ON sessions(user_uuid);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE status = 'active';

CREATE INDEX idx_logs_user ON operation_logs(user_uuid);
CREATE INDEX idx_logs_action ON operation_logs(action);
CREATE INDEX idx_logs_created ON operation_logs(created_at);

-- 初始化权限数据
INSERT INTO permissions (role, resource, action, scope) VALUES
-- 平台超级管理员权限
('platform_admin', 'school', 'manage', 'all'),
('platform_admin', 'class', 'manage', 'all'),
('platform_admin', 'user', 'manage', 'all'),
('platform_admin', 'student', 'manage', 'all'),
('platform_admin', 'teacher', 'manage', 'all'),
('platform_admin', 'data', 'manage', 'all'),
('platform_admin', 'config', 'manage', 'all'),
('platform_admin', 'report', 'manage', 'all'),

-- 学校超级管理员权限
('school_admin', 'school', 'read', 'own_school'),
('school_admin', 'school', 'update', 'own_school'),
('school_admin', 'class', 'manage', 'own_school'),
('school_admin', 'user', 'manage', 'own_school'),
('school_admin', 'student', 'manage', 'own_school'),
('school_admin', 'teacher', 'manage', 'own_school'),
('school_admin', 'data', 'manage', 'own_school'),
('school_admin', 'config', 'manage', 'own_school'),
('school_admin', 'report', 'manage', 'own_school'),

-- 学校老师权限
('teacher', 'school', 'read', 'own_school'),
('teacher', 'class', 'read', 'own_school'),
('teacher', 'student', 'read', 'own_class'),
('teacher', 'data', 'read', 'own_class'),
('teacher', 'data', 'create', 'own_class'),
('teacher', 'report', 'manage', 'own_class'),

-- 学生权限
('student', 'school', 'read', 'own_school'),
('student', 'class', 'read', 'own_class'),
('student', 'student', 'read', 'own'),
('student', 'data', 'read', 'own'),
('student', 'data', 'create', 'own');

-- 创建更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
