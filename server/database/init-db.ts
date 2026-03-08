/**
 * @fileName init-db.ts
 * @description 数据库初始化脚本，执行 SQL 初始化和种子数据
 * @author keflag
 * @createDate 2026-03-08 12:05:00
 * @lastUpdateDate 2026-03-08 12:05:00
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import seedDatabase from './seed';

// 加载环境变量
dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'betterstats',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
};

/**
 * @functionName runInitSQL
 * @description 执行初始化 SQL 脚本
 */
async function runInitSQL(pool: Pool): Promise<void> {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('执行数据库初始化 SQL...');
    await pool.query(sql);
    console.log('✅ 数据库表结构初始化完成');
}

/**
 * @functionName main
 * @description 主函数
 */
async function main(): Promise<void> {
    console.log('===========================================');
    console.log('BetterStats 数据库初始化');
    console.log('===========================================\n');
    
    const pool = new Pool(DB_CONFIG);
    
    try {
        // 测试数据库连接
        console.log('连接数据库...');
        await pool.connect();
        console.log('✅ 数据库连接成功\n');
        
        // 执行初始化 SQL
        await runInitSQL(pool);
        
        // 执行种子数据
        console.log('\n初始化种子数据...');
        await seedDatabase(pool);
        
        console.log('\n✅ 所有初始化完成！\n');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// 运行初始化
main().catch(console.error);
