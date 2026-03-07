# BetterStats 阶段一实施指南

## 📋 阶段一：基础架构与核心权限体系搭建

### ✅ 已完成任务

1. **数据库表结构设计** - 包含用户表、学校表、权限规则表等
2. **JWT 鉴权机制** - token 生成、校验、刷新
3. **登录模块** - 账号密码登录、7 天记住设备
4. **权限系统** - 角色枚举、权限拦截器
5. **UUID 生成** - 用户唯一标识

### 🗄️ 数据库表结构

#### 1. 学校表 (schools)
```sql
- uuid: UUID 主键
- name: 学校名称
- code: 学校代码
- address: 地址
- contact_phone: 联系电话
- contact_email: 联系邮箱
- status: 状态 (active/banned)
- settings: JSONB 配置
```

#### 2. 用户表 (users)
```sql
- uuid: UUID 主键
- username: 用户名
- password_hash: 密码哈希
- email: 邮箱
- phone: 电话
- role: 角色 (platform_admin/school_admin/teacher/student)
- school_uuid: 所属学校 UUID
- status: 状态 (active/banned)
- student_id: 学号 (学生用)
- class_info: 班级信息
```

#### 3. 用户设备表 (user_devices)
```sql
- id: 主键
- user_uuid: 用户 UUID
- device_id: 设备 ID
- device_token: 设备令牌
- expires_at: 过期时间
- is_active: 是否激活
```

#### 4. 权限规则表 (permission_rules)
```sql
- role: 角色
- resource: 资源
- actions: 可执行操作 (JSONB)
- scope: 权限范围 (all/school/class/self)
```

#### 5. 操作日志表 (operation_logs)
```sql
- user_uuid: 用户 UUID
- action: 操作
- resource: 资源
- old_value: 旧值
- new_value: 新值
- ip_address: IP 地址
```

### 🚀 快速开始

#### 1. 初始化数据库表

```bash
npm run db:tables
```

此命令会：
- 创建所有数据库表
- 创建索引优化查询
- 插入默认权限规则
- 创建示例学校和管理员账号

**默认管理员账号：**
- 平台管理员：`admin` / `Admin@123`
- 学校管理员：`school_admin` / `SchoolAdmin@123`

#### 2. 启动后端服务

```bash
npm run server
```

服务将在 `http://localhost:8001` 启动

#### 3. 测试登录接口

```bash
# 登录
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123",
    "rememberDevice": true
  }'
```

响应示例：
```json
{
  "success": true,
  "data": {
    "user": {
      "uuid": "xxx",
      "username": "admin",
      "role": "platform_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "xxx",
    "deviceToken": "xxx",
    "expiresIn": 7200
  }
}
```

### 📡 API 接口文档

#### 认证相关

##### 1. 用户登录
```
POST /auth/login
```

**请求参数：**
```json
{
  "username": "用户名",
  "password": "密码",
  "rememberDevice": true
}
```

**返回：**
- token: JWT 令牌 (2 小时有效期)
- refreshToken: 刷新令牌 (7 天有效期)
- deviceToken: 设备令牌 (记住设备时用)

##### 2. 刷新 Token
```
POST /auth/refresh
```

**请求参数：**
```json
{
  "refreshToken": "刷新令牌"
}
```

##### 3. 用户登出
```
POST /auth/logout
```

**请求头：**
```
Authorization: Bearer <token>
```

##### 4. 获取当前用户信息
```
GET /auth/me
```

**请求头：**
```
Authorization: Bearer <token>
```

### 🔐 权限系统

#### 角色定义

1. **platform_admin** - 平台超级管理员
   - 管理所有学校和用户
   - 配置系统设置
   - 查看所有数据

2. **school_admin** - 学校超级管理员
   - 管理本校用户
   - 配置本校统计设置
   - 查看本校数据

3. **teacher** - 学校老师
   - 查看所带班级学生数据
   - 创建和分析作业统计
   - 管理统计报告

4. **student** - 学生
   - 查看个人数据
   - 提交学习数据

#### 权限范围

- `all` - 全平台范围
- `school` - 学校范围
- `class` - 班级范围
- `self` - 个人范围

### 🔒 安全特性

#### 1. 密码加密
- 使用 bcrypt 进行密码哈希
- 盐值 rounds: 10

#### 2. JWT Token
- 访问令牌有效期：2 小时
- 刷新令牌有效期：7 天
- 支持自动刷新机制

#### 3. 设备管理
- 支持"7 天记住设备"功能
- 设备令牌唯一标识
- 可主动撤销设备授权

#### 4. 操作日志
- 记录所有敏感操作
- 包含操作前后数据对比
- 记录 IP 地址和用户代理

### 📝 使用示例

#### 前端集成示例

```typescript
// 登录
const login = async (username: string, password: string, rememberDevice: boolean) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberDevice }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
  }
  
  return data;
};

// 带认证的请求
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.status === 401) {
    // Token 过期，尝试刷新
    const newToken = await refreshAuthToken();
    if (newToken) {
      return fetchWithAuth(url, options);
    }
    // 刷新失败，跳转登录页
    window.location.href = '/login';
  }
  
  return response;
};
```

### 🎯 下一步计划

阶段二：平台超级管理员功能开发
- [ ] 学校管理页面
- [ ] 全局用户管理
- [ ] 数据操作功能
- [ ] 系统配置功能

### ⚠️ 注意事项

1. **生产环境必须修改 JWT_SECRET**
   ```env
   JWT_SECRET=your-secure-random-string
   ```

2. **HTTPS 部署**
   - 生产环境必须使用 HTTPS
   - 防止 token 被窃取

3. **密码策略**
   - 建议实施密码强度检查
   - 定期更换密码

4. **Token 安全**
   - 前端存储在 localStorage 或 sessionStorage
   - 不要存储在 cookie 中（除非有适当的保护）

### 🐛 故障排除

#### 问题：登录失败 "用户名或密码错误"

**解决方案：**
1. 检查数据库表是否已创建
2. 确认默认管理员账号已创建
3. 检查密码是否正确

#### 问题：Token 验证失败

**解决方案：**
1. 检查 JWT_SECRET 是否一致
2. 确认 token 未过期
3. 检查用户状态是否正常

### 📚 相关文件

- 数据库表创建：`src/server/scripts/create-tables.ts`
- 认证中间件：`src/server/middleware/auth.ts`
- 登录路由：`src/server/routes/login.routes.ts`
- 服务器配置：`src/server/server.ts`
