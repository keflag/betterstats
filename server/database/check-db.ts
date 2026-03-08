/**
 * @fileName check-db.ts
 * @description 检查并创建数据库
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // 先连接到默认数据库
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
};

console.log('密码长度:', process.env.DB_PASSWORD?.length);
console.log('密码前 10 个字符:', process.env.DB_PASSWORD?.substring(0, 10));

async function main() {
    console.log('检查数据库连接...');
    console.log('配置:', {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        database: DB_CONFIG.database,
    });
    
    const pool = new Pool(DB_CONFIG);
    
    try {
        // 测试连接
        await pool.query('SELECT NOW()');
        console.log('✅ 数据库连接成功');
        
        // 检查数据库是否存在
        const result = await pool.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            ['betterstats']
        );
        
        if (result.rows.length === 0) {
            console.log('创建数据库 betterstats...');
            await pool.query('CREATE DATABASE betterstats');
            console.log('✅ 数据库创建成功');
        } else {
            console.log('✅ 数据库已存在');
        }
        
        console.log('\n请运行 npm run db:init 初始化表结构');
        
    } catch (error) {
        console.error('❌ 错误:', error);
    } finally {
        await pool.end();
    }
}

main();
