# 🚀 快速启动指南

## 第一步：检查环境

确保你已经安装：
- ✅ Node.js >= 20.0.0
- ✅ PostgreSQL 数据库

## 第二步：配置数据库连接

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的数据库信息：
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=BetterStats
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的密码
PORT=8001
```

## 第三步：测试数据库连接

```bash
npm run db:test
```

如果看到 `✅ 数据库连接成功！` 说明配置正确。

## 第四步：初始化数据库

```bash
npm run db:init
```

这将创建：
- `users` 表
- 索引优化
- 5 条示例数据

## 第五步：启动后端服务

```bash
npm run server
```

服务将在 `http://localhost:8001` 启动

## 第六步：验证服务

访问健康检查接口：
```
http://localhost:8001/health
```

你应该看到：
```json
{
  "status": "healthy",
  "timestamp": "2026-03-07T...",
  "database": "connected"
}
```

## 第七步：测试 API 接口

### 使用 curl 测试：

```bash
# 获取用户列表
curl http://localhost:8001/api/users

# 获取单个用户
curl http://localhost:8001/api/users/1

# 创建用户
curl -X POST http://localhost:8001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"测试用户"}'
```

### 使用 Postman 或其他 API 工具

导入 API 测试集合或直接访问上述接口。

## 第八步：前端集成

1. 在 `.env` 文件中添加前端 API 地址：
```env
REACT_APP_API_URL=http://localhost:8001/api
```

2. 在 React 组件中使用：
```typescript
import { userApi } from '@/server/api';

// 获取用户列表
const response = await userApi.getUsers(1, 10);
console.log(response.data);
```

3. 启动前端开发服务器：
```bash
npm run start:dev
```

## 📋 常用命令

```bash
# 测试数据库连接
npm run db:test

# 初始化数据库
npm run db:init

# 启动后端服务
npm run server

# 启动前端服务
npm run start:dev

# TypeScript 类型检查
npm run tsc

# 代码 lint
npm run lint
```

## 🔍 故障排查

### 问题：数据库连接失败

**解决方案：**
1. 检查 PostgreSQL 服务是否运行
   ```bash
   # Windows
   net start | findstr PostgreSQL
   ```
2. 验证 `.env` 文件配置
3. 确认数据库存在

### 问题：端口已被占用

**解决方案：**
修改 `.env` 中的 `PORT` 值：
```env
PORT=8002
```

### 问题：CORS 错误

**解决方案：**
确保 `.env` 中的 `CORS_ORIGIN` 配置正确：
```env
CORS_ORIGIN=http://localhost:8000
```

## 📚 更多信息

详细文档请查看 [SERVER_README.md](./SERVER_README.md)

## ✅ 验证清单

- [ ] PostgreSQL 服务已启动
- [ ] `.env` 文件已配置
- [ ] 数据库连接测试通过
- [ ] 数据库初始化完成
- [ ] 后端服务启动成功
- [ ] 健康检查接口返回正常
- [ ] API 接口测试通过

全部完成后，你就可以开始使用安全的数据库服务了！🎉
