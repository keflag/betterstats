# 生产环境部署指南

本文档详细说明了如何将 BetterStats 项目部署到生产环境。

## 📋 部署前检查清单

### 1. 环境变量配置

**必须配置的环境变量：**

```bash
# 基础环境
NODE_ENV=production
REACT_APP_ENV=prod

# 服务器配置
PORT=8001

# 后端 API 地址（生产环境使用完整域名）
REACT_APP_API_URL=https://api.yourdomain.com

# CORS 配置（允许的前端域名）
CORS_ORIGIN=https://www.yourdomain.com,https://app.yourdomain.com

# JWT 安全密钥（必须使用强随机密钥！）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 数据库配置
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_DATABASE=betterstats
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-strong-password

# 数据库连接池（生产环境推荐配置）
POSTGRES_POOL_MIN=5
POSTGRES_POOL_MAX=20

# 数据库 SSL（云数据库通常需要启用）
POSTGRES_SSL=true
```

**生成强 JWT 密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. 数据库准备

1. 确保 PostgreSQL 数据库已安装并运行
2. 创建数据库和用户
3. 执行数据库迁移脚本
4. 配置数据库防火墙规则
5. 启用 SSL 连接（如果在云上）

### 3. 构建前端

```bash
# 安装依赖
npm install

# 设置生产环境变量
export REACT_APP_ENV=prod
export REACT_APP_API_URL=https://api.yourdomain.com

# 构建生产版本
npm run build
```

### 4. 启动后端服务

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=8001
export JWT_SECRET=your-secret-key
export POSTGRES_HOST=your-db-host
export POSTGRES_PASSWORD=your-password
export CORS_ORIGIN=https://www.yourdomain.com

# 启动服务
npm run server
```

### 5. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'betterstats-server',
    script: 'npm',
    args: 'run server',
    env: {
      NODE_ENV: 'production',
      PORT: 8001
    },
    instances: 'max',
    exec_mode: 'cluster',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};

# 启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 6. Nginx 配置示例

```nginx
# 前端静态文件
server {
    listen 80;
    server_name www.yourdomain.com;
    
    location / {
        root /var/www/betterstats/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /var/www/betterstats/dist;
        try_files $uri $uri/ /index.html;
    }
}

# 后端 API 反向代理
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Docker 部署（可选）

**Dockerfile 示例：**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 8001

CMD ["npm", "run", "server"]
```

**docker-compose.yml 示例：**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - PORT=8001
      - POSTGRES_HOST=db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DATABASE=betterstats
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=https://www.yourdomain.com
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=betterstats
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 8. 安全建议

1. **启用 HTTPS**：生产环境必须使用 HTTPS
2. **防火墙配置**：只开放必要的端口（80, 443）
3. **数据库访问控制**：限制数据库只能从应用服务器访问
4. **定期备份**：设置数据库自动备份
5. **日志监控**：配置日志监控和告警
6. **速率限制**：已内置，可根据需要调整
7. **CORS 限制**：严格限制允许的域名

### 9. 性能优化

1. **使用 CDN**：静态资源使用 CDN 加速
2. **启用 Gzip**：Nginx 配置 Gzip 压缩
3. **数据库索引**：确保常用查询有索引
4. **连接池优化**：根据服务器配置调整连接池大小
5. **缓存策略**：配置浏览器缓存和服务器缓存

### 10. 监控和日志

**推荐监控指标：**
- CPU 使用率
- 内存使用率
- 数据库连接数
- 请求响应时间
- 错误率
- 磁盘空间

**日志管理：**
- 应用日志：`logs/` 目录
- 数据库日志：根据数据库配置
- Nginx 日志：`/var/log/nginx/`

### 11. 常见问题

**Q: CORS 错误怎么办？**
A: 检查 `CORS_ORIGIN` 配置，确保包含前端域名

**Q: 数据库连接失败？**
A: 检查数据库连接配置，确认防火墙允许连接

**Q: JWT 认证失败？**
A: 确保 `JWT_SECRET` 配置正确且前后端一致

**Q: 速率限制太严格？**
A: 调整 `server.ts` 中的 `limiter` 配置

### 12. 健康检查

**健康检查端点：**
```
GET https://api.yourdomain.com/health
```

**响应示例：**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-07T10:00:00.000Z",
  "database": "connected"
}
```

### 13. 部署验证清单

- [ ] 环境变量已正确配置
- [ ] 数据库连接正常
- [ ] HTTPS 已启用
- [ ] CORS 配置正确
- [ ] 健康检查端点可访问
- [ ] 登录功能正常
- [ ] API 接口正常
- [ ] 日志记录正常
- [ ] 监控系统已配置
- [ ] 备份策略已设置

---

**技术支持：** 如有问题，请查看日志或联系开发团队。
