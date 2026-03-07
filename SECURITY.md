# 🔒 安全特性说明

## 概述

本数据库服务实现了多层安全防护机制，确保数据传输和存储的安全性。

## 核心安全特性

### 1. SQL 注入防护 ✅

**实现方式：**
- 所有数据库查询使用**参数化查询**（Prepared Statements）
- 禁止使用字符串拼接构建 SQL 语句

**代码示例：**

```typescript
// ✅ 正确做法 - 参数化查询
const sql = 'SELECT * FROM users WHERE id = $1';
const params = [id];
const result = await pool.query(sql, params);

// ❌ 严禁使用 - 字符串拼接（易受 SQL 注入攻击）
const sql = `SELECT * FROM users WHERE id = ${id}`;
```

**防护效果：**
- 完全防止 SQL 注入攻击
- 参数自动转义，无需手动处理特殊字符

### 2. 输入验证 ✅

**实现方式：**
- 使用 **zod** 库进行严格的类型验证
- 所有用户输入必须通过 schema 验证

**验证规则：**

```typescript
// 分页参数验证
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// ID 参数验证
const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// 字符串验证（防止 XSS）
const stringSchema = z.object({
  name: z.string()
    .min(1)
    .max(255)
    .regex(/^[\w\s\u4e00-\u9fa5-]+$/),
});
```

**防护效果：**
- 防止类型混淆攻击
- 防止 XSS（跨站脚本攻击）
- 确保数据格式正确

### 3. CORS（跨域资源共享）控制 ✅

**实现方式：**
- 严格限制允许的源（origin）
- 仅允许特定的 HTTP 方法
- 限制允许的请求头

**配置示例：**

```typescript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**防护效果：**
- 防止未授权的跨域访问
- 限制攻击面

### 4. Helmet 安全头 ✅

**实现方式：**
- 自动设置多种 HTTP 安全头

**安全头列表：**
- `X-Content-Type-Options`: 防止 MIME 类型嗅探
- `X-Frame-Options`: 防止点击劫持
- `X-XSS-Protection`: 启用 XSS 过滤器
- `Content-Security-Policy`: 限制资源加载
- `Strict-Transport-Security`: 强制 HTTPS

**防护效果：**
- 多层浏览器端安全防护
- 防止常见 Web 攻击

### 5. 错误处理 ✅

**实现方式：**
- 生产环境隐藏详细错误信息
- 统一错误响应格式
- 记录详细错误日志（服务器端）

**代码示例：**

```typescript
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '服务器内部错误', // 生产环境不暴露细节
  });
});
```

**防护效果：**
- 防止信息泄露
- 避免暴露系统细节

### 6. 连接池管理 ✅

**实现方式：**
- 使用连接池复用数据库连接
- 设置连接超时和空闲超时
- 限制最大连接数

**配置示例：**

```typescript
const poolConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  min: parseInt(process.env.POSTGRES_POOL_MIN || '2', 10),
  max: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_POOL_TIMEOUT || '30000', 10),
};
```

**防护效果：**
- 防止连接泄露
- 提高性能和稳定性
- 防止 DoS 攻击

### 7. 事务支持 ✅

**实现方式：**
- 提供事务执行方法
- 自动回滚失败的事务

**代码示例：**

```typescript
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
```

**防护效果：**
- 保证数据一致性
- 原子性操作

### 8. 敏感信息保护 ✅

**实现方式：**
- 使用 `.env` 文件存储敏感信息
- `.env` 文件已添加到 `.gitignore`
- 提供 `.env.example` 模板

**防护效果：**
- 防止敏感信息泄露到版本控制
- 安全的环境变量管理

## 安全最佳实践

### ✅ 应该做的

1. **始终使用参数化查询**
   ```typescript
   await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
   ```

2. **始终验证用户输入**
   ```typescript
   const validated = validateInput(schema, req.body);
   ```

3. **使用事务处理多步操作**
   ```typescript
   await this.executeTransaction(async (client) => {
     await client.query(sql1, params1);
     await client.query(sql2, params2);
   });
   ```

4. **限制返回数据量**
   ```typescript
   const sql = 'SELECT * FROM users LIMIT $1 OFFSET $2';
   ```

5. **使用 HTTPS（生产环境）**
   ```typescript
   // 在生产环境配置 HTTPS
   ```

### ❌ 不应该做的

1. **禁止字符串拼接 SQL**
   ```typescript
   // ❌ 危险！
   const sql = `SELECT * FROM users WHERE name = '${name}'`;
   ```

2. **禁止信任用户输入**
   ```typescript
   // ❌ 危险！
   const userId = req.query.id; // 未验证
   ```

3. **禁止暴露详细错误**
   ```typescript
   // ❌ 危险！
   res.status(500).json({ error: err.stack });
   ```

4. **禁止硬编码密码**
   ```typescript
   // ❌ 危险！
   const password = 'mysecretpassword';
   ```

## 安全审计清单

- [x] 所有查询使用参数化
- [x] 所有输入经过验证
- [x] CORS 配置正确
- [x] 安全头已设置
- [x] 错误处理完善
- [x] 连接池配置合理
- [x] 敏感信息已保护
- [x] 事务使用正确

## 依赖包安全

已安装的安全相关包：

```json
{
  "pg": "^8.20.0",        // PostgreSQL 客户端
  "zod": "^4.3.6",        // 输入验证
  "helmet": "^8.1.0",     // 安全头
  "cors": "^2.8.6",       // CORS 控制
  "dotenv": "^17.3.1"     // 环境变量
}
```

## 应急响应

如果发现安全漏洞：

1. **立即停止服务**
   ```bash
   Ctrl+C  # 停止服务
   ```

2. **检查日志**
   ```bash
   # 查看服务器日志
   ```

3. **修复漏洞**
   - 定位问题代码
   - 应用安全修复

4. **测试修复**
   - 验证漏洞已修复
   - 确保没有引入新问题

5. **重新启动服务**
   ```bash
   npm run server
   ```

## 参考资料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PostgreSQL 安全文档](https://www.postgresql.org/docs/current/security.html)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet 文档](https://helmetjs.github.io/)

---

**安全是持续的过程，不是一次性的任务。** 请定期审查和更新安全措施。
