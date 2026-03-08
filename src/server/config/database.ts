/**
 * @fileName database.ts
 * @description 数据库连接配置模块 - 使用连接池和参数化查询确保安全性
 * @author BetterStats Team
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import dotenv from "dotenv";
import { Pool, type PoolConfig } from "pg";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const poolConfig: PoolConfig = {
	host: process.env.POSTGRES_HOST || "localhost",
	port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
	database: process.env.POSTGRES_DATABASE || "betterstats",
	user: process.env.POSTGRES_USER || "postgres",
	password: process.env.POSTGRES_PASSWORD || "",
	// 生产环境使用更大的连接池
	min: parseInt(
		process.env.POSTGRES_POOL_MIN || (isProduction ? "5" : "2"),
		10,
	),
	max: parseInt(
		process.env.POSTGRES_POOL_MAX || (isProduction ? "20" : "10"),
		10,
	),
	idleTimeoutMillis: isProduction ? 60000 : 30000,
	connectionTimeoutMillis: parseInt(
		process.env.POSTGRES_POOL_TIMEOUT || "30000",
		10,
	),
	// 生产环境启用 SSL
	ssl:
		isProduction && process.env.POSTGRES_SSL !== "false"
			? { rejectUnauthorized: false }
			: false,
};

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
	console.error("Unexpected error on idle client", err);
	if (isProduction) {
		// 生产环境不退出进程，尝试重新连接
		console.log("尝试重新连接数据库...");
	} else {
		process.exit(-1);
	}
});

export const query = (text: string, params?: unknown[]) =>
	pool.query(text, params);

export const getClient = async () => {
	const client = await pool.connect();
	const originalQuery = client.query.bind(client);
	const queryWithParams = (queryText: string, params?: unknown[]) => {
		return originalQuery(queryText, params);
	};
	client.query = queryWithParams as typeof client.query;
	return client;
};
