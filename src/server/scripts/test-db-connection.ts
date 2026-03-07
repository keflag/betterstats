/**
 * @fileName test-db-connection.ts
 * @description 数据库连接测试脚本 - 验证数据库配置是否正确
 * @author BetterStats Team
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { pool } from '../config/database';

const testConnection = async () => {
  try {
    console.log('正在测试数据库连接...');
    console.log(`配置信息:`);
    console.log(`  - Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`  - Port: ${process.env.POSTGRES_PORT || '5432'}`);
    console.log(`  - Database: ${process.env.POSTGRES_DATABASE || 'betterstats'}`);
    console.log(`  - User: ${process.env.POSTGRES_USER || 'postgres'}`);
    
    const result = await pool.query('SELECT NOW()');
    const now = result.rows[0].now;
    
    console.log('\n✅ 数据库连接成功！');
    console.log(`服务器时间：${now}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库连接失败！');
    if (error instanceof Error) {
      console.error(`错误信息：${error.message}`);
      console.error('\n请检查:');
      console.error('1. PostgreSQL 服务是否已启动');
      console.error('2. .env 文件中的数据库配置是否正确');
      console.error('3. 数据库是否存在');
    }
    await pool.end();
    process.exit(1);
  }
};

testConnection();
