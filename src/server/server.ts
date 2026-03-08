/**
 * @fileName server.ts
 * @description 安全服务器配置 - 集成 CORS、Helmet 安全头、错误处理等
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, {
	type Application,
	type NextFunction,
	type Request,
	type Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pool } from "./config/database";
import loginRoutes from "./routes/login.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8001;
const NODE_ENV = process.env.NODE_ENV || "development";

// 生产环境速率限制更严格
const isProduction = NODE_ENV === "production";

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分钟
	max: isProduction ? 100 : 1000, // 生产环境限制 100 次/15 分钟，开发环境 1000 次
	message: {
		success: false,
		message: "请求过于频繁，请稍后再试",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分钟
	max: isProduction ? 5 : 100, // 生产环境限制 5 次/15 分钟，开发环境 100 次
	message: {
		success: false,
		message: "尝试次数过多，请 15 分钟后再试",
	},
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(helmet());

app.use(limiter);

app.use("/auth/login", loginLimiter);

// 生产环境 CORS 配置
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
	? corsOrigin.split(",")
	: ["http://localhost:8000"];

app.use(
	cors({
		origin: (origin, callback) => {
			// 允许没有 origin 的请求（如 mobile apps 或 curl）
			if (!origin) return callback(null, true);

			if (
				allowedOrigins.indexOf(origin) !== -1 ||
				origin.endsWith(".vercel.app") ||
				origin.endsWith(".netlify.app")
			) {
				callback(null, true);
			} else {
				callback(new Error("不允许的 CORS 源"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
		maxAge: 86400, // 24 小时
	}),
);

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();
	res.on("finish", () => {
		const duration = Date.now() - start;
		// 生产环境只记录慢请求
		if (!isProduction || duration > 1000) {
			console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
		}
	});
	next();
});

app.use("/auth", loginRoutes);
app.use("/api", userRoutes);

app.get("/health", async (_req: Request, res: Response) => {
	try {
		await pool.query("SELECT 1");
		res.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			database: "connected",
		});
	} catch (error) {
		res.status(503).json({
			status: "unhealthy",
			timestamp: new Date().toISOString(),
			database: "disconnected",
		});
	}
});

app.use((_req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		message: "接口不存在",
	});
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	// 生产环境不暴露详细错误信息
	if (isProduction) {
		console.error("Unhandled error:", err.message);
		res.status(500).json({
			success: false,
			message: "服务器内部错误",
		});
	} else {
		console.error("Unhandled error:", err);
		res.status(500).json({
			success: false,
			message: err.message,
		});
	}
});

app.listen(PORT, () => {
	const protocol = isProduction ? "https" : "http";
	const host = isProduction ? "0.0.0.0" : "localhost";
	console.log(`🚀 服务器已启动：${protocol}://${host}:${PORT}`);
	console.log(`📊 环境：${NODE_ENV}`);
	console.log(`🔗 健康检查：${protocol}://${host}:${PORT}/health`);

	if (isProduction) {
		console.log(`⚠️  生产模式：已启用严格的安全限制`);
	}
});

const shutdown = async () => {
	console.log("\n正在关闭服务器...");
	await pool.end();
	console.log("数据库连接已关闭");
	process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default app;
