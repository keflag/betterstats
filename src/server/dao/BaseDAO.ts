/**
 * @fileName BaseDAO.ts
 * @description 数据访问层基类 - 所有数据库操作必须使用参数化查询防止 SQL 注入
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { PoolClient } from 'pg';
import { query, getClient } from '../config/database';

export class BaseDAO {
  protected async executeQuery<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<T> {
    const result = await query(sql, params);
    return result.rows as T;
  }

  protected async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
