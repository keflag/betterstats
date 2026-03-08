/**
 * @fileName server.ts
 * @description 数据库服务统一入口，端口17342
 * @author keflag
 * @createDate 2026-03-08 10:20:00
 * @lastUpdateDate 2026-03-08 10:20:00
 * @version 1.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// 加载环境变量
dotenv.config();

// ============ 配置 ============
const SERVER_CONFIG = {
    PORT: 17342,
    get API_BASE_URL(): string {
        return `http://localhost:${this.PORT}`;
    },
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 100,
    },
    CORS: {
        METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
        ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
    },
    DB_POOL: {
        MAX_CONNECTIONS: 20,
        IDLE_TIMEOUT_MS: 30000,
        CONNECTION_TIMEOUT_MS: 2000,
    },
    SECURITY: {
        MAX_BODY_SIZE: '10mb',
        VALID_IDENTIFIER_REGEX: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    },
};

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const COOKIE_NAME = 'betterstats_token';
const USED_TOKENS = new Set<string>();

// ============ 数据库 ============
function createPool(): Pool {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'betterstats',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: SERVER_CONFIG.DB_POOL.MAX_CONNECTIONS,
        idleTimeoutMillis: SERVER_CONFIG.DB_POOL.IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: SERVER_CONFIG.DB_POOL.CONNECTION_TIMEOUT_MS,
