/**
 * @fileName database.ts
 * @description 数据库连接配置模块 - 使用连接池和参数化查询确保安全性
 * @author BetterStats Team
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DATABASE || 'betterstats',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  min: parseInt(process.env.POSTGRES_POOL_MIN || '2', 10),
  max: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_POOL_TIMEOUT || '30000', 10),
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const queryWithParams = (queryText: string, params?: unknown[]) => {
    return originalQuery(queryText, params);
  };
  client.query = queryWithParams as typeof client.query;
  return client;
};
