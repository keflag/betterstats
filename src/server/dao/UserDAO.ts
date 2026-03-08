/**
 * @fileName UserDAO.ts
 * @description 用户数据访问对象 - 演示安全的数据库操作
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import { BaseDAO } from "./BaseDAO";

export interface User {
	id: number;
	username: string;
	email: string;
	createdAt: Date;
}

export class UserDAO extends BaseDAO {
	async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
		const sql =
			"SELECT id, username, email, created_at FROM users ORDER BY id LIMIT $1 OFFSET $2";
		const params = [limit, offset];
		const rows = await this.executeQuery<
			{ id: number; username: string; email: string; created_at: string }[]
		>(sql, params);

		return rows.map((row) => ({
			id: row.id,
			username: row.username,
			email: row.email,
			createdAt: new Date(row.created_at),
		}));
	}

	async findById(id: number): Promise<User | null> {
		const sql =
			"SELECT id, username, email, created_at FROM users WHERE id = $1";
		const params = [id];
		const rows = await this.executeQuery<
			{ id: number; username: string; email: string; created_at: string }[]
		>(sql, params);

		if (rows.length === 0) {
			return null;
		}

		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			createdAt: new Date(row.created_at),
		};
	}

	async create(username: string, email: string): Promise<User> {
		const sql =
			"INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username, email, created_at";
		const params = [username, email];
		const rows = await this.executeQuery<
			{ id: number; username: string; email: string; created_at: string }[]
		>(sql, params);

		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			createdAt: new Date(row.created_at),
		};
	}

	async update(
		id: number,
		username?: string,
		email?: string,
	): Promise<User | null> {
		const sql =
			"UPDATE users SET username = COALESCE($1, username), email = COALESCE($2, email) WHERE id = $3 RETURNING id, username, email, created_at";
		const params = [username || null, email || null, id];
		const rows = await this.executeQuery<
			{ id: number; username: string; email: string; created_at: string }[]
		>(sql, params);

		if (rows.length === 0) {
			return null;
		}

		const row = rows[0];
		return {
			id: row.id,
			username: row.username,
			email: row.email,
			createdAt: new Date(row.created_at),
		};
	}

	async delete(id: number): Promise<boolean> {
		const sql = "DELETE FROM users WHERE id = $1";
		const params = [id];
		const result = await this.executeQuery<{ count: number }[]>(sql, params);

		return result.length > 0;
	}
}
