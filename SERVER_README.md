# 安全数据库服务使用指南

## 📋 目录结构

```
src/server/
├── config/
│   └── database.ts          # 数据库连接配置
├── dao/
│   ├── BaseDAO.ts          # 数据访问层基类
│   └── UserDAO.ts          # 用户数据访问对象
├── routes/
│   └── user.routes.ts      # 用户 API 路由
├── utils/
│   └── validators.ts       # 输入验证工具
├── scripts/
│   └── init-db.ts          # 数据库初始化脚本
├── server.ts               # 服务器主文件
└── api.ts                  # 前端 API 调用封装
```

## 🚀 快速开始

### 1. 配置数据库连接

编辑 `.env` 文件，配置你的 PostgreSQL 数据库连接信息：

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=BetterStats
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
PORT=8001
```

### 2. 初始化数据库

首次运行前，需要初始化数据库表结构：

```bash
npm run db:init
```

此命令会：
- 创建 `users` 表
- 创建索引优化查询性能
- 插入示例数据

### 3. 启动后端服务

```bash
npm run server
```

服务将在 `http://localhost:8001` 启动

### 4. 健康检查

访问 `http://localhost:8001/health` 检查服务和数据库连接状态

## 🔒 安全特性

### 1. SQL 注入防护

所有数据库查询都使用**参数化查询**：

```typescript
// ✅ 正确 - 参数化查询
const sql = 'SELECT * FROM users WHERE id = $1';
const params = [id];
await query(sql, params);

// ❌ 错误 - 字符串拼接（禁止使用）
const sql = `SELECT * FROM users WHERE id = ${id}`;
```

### 2. 输入验证

使用 **zod** 进行严格的输入验证：

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

const { page, pageSize } = validateInput(paginationSchema, req.query);
```

### 3. CORS 配置

限制跨域访问，仅允许前端域名：

```typescript
app.use(
  cors({
    origin: 'http://localhost:8000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
```

### 4. Helmet 安全头

自动设置各种 HTTP 安全头：
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy

### 5. 错误处理

生产环境不暴露详细错误信息：

```typescript
app.use((err, _req, res, _next) => {
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
  });
});
```

## 📡 API 接口

### 用户管理

#### 获取用户列表
```
GET /api/users?page=1&pageSize=10
```

#### 获取单个用户
```
GET /api/users/:id
```

#### 创建用户
```
POST /api/users
Body: { "name": "张三" }
```

#### 更新用户
```
PUT /api/users/:id
Body: { "name": "新名字" }
```

#### 删除用户
```
DELETE /api/users/:id
```

## 🔌 前端使用示例

### React 组件中使用

```typescript
import { userApi } from '@/server/api';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await userApi.getUsers(1, 10);
      if (response.success) {
        setUsers(response.data);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.username}</div>
      ))}
    </div>
  );
}
```

### 配置 API 地址

在 `.env` 中添加：

```env
REACT_APP_API_URL=http://localhost:8001/api
```

## 🛡️ 最佳实践

### 1. 创建新的 DAO

```typescript
import { BaseDAO } from './BaseDAO';

export class ProductDAO extends BaseDAO {
  async findAll() {
    const sql = 'SELECT * FROM products WHERE active = $1';
    const params = [true];
    return this.executeQuery(sql, params);
  }
}
```

### 2. 添加新的路由

```typescript
import { Router } from 'express';
import { ProductDAO } from '../dao/ProductDAO';
import { validateInput } from '../utils/validators';

const router = Router();

router.get('/products', async (req, res) => {
  try {
    const dao = new ProductDAO();
    const products = await dao.findAll();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
```

### 3. 在 server.ts 中注册路由

```typescript
import productRoutes from './routes/product.routes';

app.use('/api', productRoutes);
```

## 🔧 开发命令

```bash
# 初始化数据库
npm run db:init

# 启动后端服务
npm run server

# 开发模式（前端 + 后端）
# 终端 1: 启动后端
npm run server

# 终端 2: 启动前端
npm run start:dev
```

## 📝 注意事项

1. **永远不要**将 `.env` 文件提交到版本控制
2. **永远不要**使用字符串拼接构建 SQL 查询
3. **始终**使用参数化查询
4. **始终**验证所有用户输入
5. **始终**使用 HTTPS（生产环境）
6. **定期**更新依赖包以修复安全漏洞

## 🚨 故障排除

### 数据库连接失败

检查 `.env` 配置和 PostgreSQL 服务状态：

```bash
# 检查 PostgreSQL 是否运行
# Windows
net start | findstr PostgreSQL

# 查看连接错误日志
```

### CORS 错误

确保前端地址在 CORS 配置中允许：

```typescript
origin: 'http://localhost:8000' // 修改为你的前端地址
```

## 📚 参考资料

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [node-pg 文档](https://node-postgres.com/)
- [zod 文档](https://zod.dev/)
- [Express 安全最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
