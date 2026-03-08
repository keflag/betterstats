/**
 * @fileName seed.ts
 * @description 数据库种子数据初始化脚本，用于第一阶段开发测试
 * @author keflag
 * @createDate 2026-03-08 12:00:00
 * @lastUpdateDate 2026-03-08 12:00:00
 * @version 1.0.0
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = '123456';

/**
 * @functionName hashPassword
 * @description 密码哈希
 */
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * @functionName seedDatabase
 * @description 初始化测试数据
 */
export async function seedDatabase(pool: Pool): Promise<void> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('开始初始化测试数据...');
        
        // 1. 创建测试学校
        console.log('创建测试学校...');
        const schoolResult = await client.query(
            `INSERT INTO schools (name, code, status, config)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (code) DO NOTHING
             RETURNING uuid`,
            ['测试第一中学', 'TEST_SCHOOL_001', 'available', {}]
        );
        
        let schoolUuid: string;
        if (schoolResult.rows.length > 0) {
            schoolUuid = schoolResult.rows[0].uuid;
        } else {
            const existingSchool = await client.query(
                'SELECT uuid FROM schools WHERE code = $1',
                ['TEST_SCHOOL_001']
            );
            schoolUuid = existingSchool.rows[0].uuid;
        }
        console.log(`学校创建完成，UUID: ${schoolUuid}`);
        
        // 2. 创建测试班级
        console.log('创建测试班级...');
        const classResult = await client.query(
            `INSERT INTO classes (name, grade, class_name, school_uuid, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING uuid`,
            ['2024 级 1 班', '2024 级', '1 班', schoolUuid, 'available']
        );
        
        let classUuid: string;
        if (classResult.rows.length > 0) {
            classUuid = classResult.rows[0].uuid;
        } else {
            const existingClass = await client.query(
                'SELECT uuid FROM classes WHERE name = $1 AND school_uuid = $2',
                ['2024 级 1 班', schoolUuid]
            );
            classUuid = existingClass.rows[0].uuid;
        }
        console.log(`班级创建完成，UUID: ${classUuid}`);
        
        // 3. 创建测试用户
        console.log('创建测试用户...');
        const passwordHash = await hashPassword(DEFAULT_PASSWORD);
        
        // 3.1 平台超级管理员
        const platformAdminResult = await client.query(
            `INSERT INTO users (account, password_hash, role, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (account) DO NOTHING
             RETURNING uuid`,
            ['admin', passwordHash, 'platform_admin', 'available']
        );
        
        // 3.2 学校超级管理员
        const schoolAdminResult = await client.query(
            `INSERT INTO users (account, password_hash, role, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (account) DO NOTHING
             RETURNING uuid`,
            ['school_admin', passwordHash, 'school_admin', 'available']
        );
        
        // 3.3 教师用户
        const teacherResult = await client.query(
            `INSERT INTO users (account, password_hash, role, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (account) DO NOTHING
             RETURNING uuid`,
            ['teacher1', passwordHash, 'teacher', 'available']
        );
        
        // 3.4 学生用户（多个）
        const studentAccounts = ['student1', 'student2', 'student3', 'student4', 'student5'];
        const studentUuids: string[] = [];
        
        for (const account of studentAccounts) {
            const result = await client.query(
                `INSERT INTO users (account, password_hash, role, status)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (account) DO NOTHING
                 RETURNING uuid`,
                [account, passwordHash, 'student', 'available']
            );
            
            if (result.rows.length > 0) {
                studentUuids.push(result.rows[0].uuid);
            } else {
                const existing = await client.query(
                    'SELECT uuid FROM users WHERE account = $1',
                    [account]
                );
                studentUuids.push(existing.rows[0].uuid);
            }
        }
        
        console.log('用户创建完成');
        
        // 4. 创建教师信息
        console.log('创建教师信息...');
        let teacherUuid: string;
        if (teacherResult.rows.length > 0) {
            teacherUuid = teacherResult.rows[0].uuid;
        } else {
            const teacherQuery = await client.query(
                'SELECT uuid FROM users WHERE account = $1',
                ['teacher1']
            );
            teacherUuid = teacherQuery.rows[0].uuid;
        }
        
        await client.query(
            `INSERT INTO teachers (user_uuid, name, gender, school_uuid, email, subjects, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_uuid) DO NOTHING`,
            [teacherUuid, '张老师', '男', schoolUuid, 'teacher1@test.com', JSON.stringify(['数学']), 'available']
        );
        
        // 5. 创建学生信息
        console.log('创建学生信息...');
        const studentNames = ['张三', '李四', '王五', '赵六', '钱七'];
        
        for (let i = 0; i < studentUuids.length; i++) {
            const studentUserUuid = studentUuids[i];
            const studentName = studentNames[i];
            const studentAccount = studentAccounts[i];
            const studentNo = `STU2024${String(i + 1).padStart(3, '0')}`;
            
            await client.query(
                `INSERT INTO students (user_uuid, name, gender, student_no, grade, class_uuid, class_name, school_uuid, enrollment_year, email, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (user_uuid) DO NOTHING`,
                [
                    studentUserUuid,
                    studentName,
                    i % 2 === 0 ? '男' : '女',
                    studentNo,
                    '2024 级',
                    classUuid,
                    '1 班',
                    schoolUuid,
                    2024,
                    `${studentAccount}@test.com`,
                    'available'
                ]
            );
        }
        
        console.log('学生信息创建完成');
        
        // 6. 更新班级的班主任
        console.log('更新班级信息...');
        await client.query(
            'UPDATE classes SET headteacher_uuid = $1 WHERE uuid = $2',
            [teacherUuid, classUuid]
        );
        
        await client.query('COMMIT');
        
        console.log('\n✅ 测试数据初始化完成！');
        console.log('\n测试账号列表：');
        console.log('===========================================');
        console.log('账号：admin          密码：123456  角色：平台超级管理员');
        console.log('账号：school_admin   密码：123456  角色：学校超级管理员');
        console.log('账号：teacher1       密码：123456  角色：教师');
        console.log('账号：student1-5     密码：123456  角色：学生');
        console.log('===========================================\n');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('初始化测试数据失败:', error);
        throw error;
    } finally {
        client.release();
    }
}

export default seedDatabase;
