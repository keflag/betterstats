/**
 * @fileName init-db.ts
 * @description 数据库初始化脚本 - 创建必要的表和示例数据
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { pool } from '../config/database';

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 用户表创建成功');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ 索引创建成功');

    const sampleUsers = [
      ['张三', 'zhangsan@example.com'],
      ['李四', 'lisi@example.com'],
      ['王五', 'wangwu@example.com'],
      ['赵六', 'zhaoliu@example.com'],
      ['钱七', 'qianqi@example.com'],
    ];

    for (const [username, email] of sampleUsers) {
      await pool.query(
        'INSERT INTO users (username, email) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
        [username, email]
      );
    }

    console.log('✅ 示例数据插入成功');

    const result = await pool.query('SELECT COUNT(*) FROM users');
    const count = result.rows[0].count;
    console.log(`📊 当前用户总数：${count}`);

    console.log('\n数据库初始化完成！');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    await pool.end();
    process.exit(1);
  }
};

initDatabase();
