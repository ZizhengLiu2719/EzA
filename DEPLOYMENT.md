# EzA 部署指南

## 🚀 快速部署

### 1. 环境准备

#### 系统要求

- Node.js 18+
- npm 或 yarn
- Git

#### 克隆项目

```bash
git clone <your-repo-url>
cd EzA
npm install
```

### 2. Supabase 设置

#### 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目 URL 和 anon key

#### 数据库初始化

1. 在 Supabase Dashboard 中进入 SQL Editor
2. 运行 `database/schema.sql` 中的所有 SQL 语句
3. 创建 Storage bucket：
   - 名称：`course-materials`
   - 权限：Authenticated users only

#### 环境变量配置

创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. AI 服务集成

#### OpenAI 设置

1. 注册 [OpenAI](https://openai.com) 账户
2. 获取 API Key
3. 添加到环境变量：

```env
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-4
```

#### OCR 服务（可选）

1. 注册 [Replicate](https://replicate.com)
2. 获取 API Token
3. 添加到环境变量：

```env
VITE_REPLICATE_API_TOKEN=your_replicate_api_token
```

#### 数学公式识别（可选）

1. 注册 [Mathpix](https://mathpix.com)
2. 获取 App ID 和 Key
3. 添加到环境变量：

```env
VITE_MATHPIX_APP_ID=your_mathpix_app_id
VITE_MATHPIX_APP_KEY=your_mathpix_app_key
```

### 4. 开发环境运行

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 5. 生产环境部署

#### Vercel 部署（推荐）

1. 安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 登录 Vercel：

```bash
vercel login
```

3. 部署项目：

```bash
vercel --prod
```

4. 配置环境变量：
   - 在 Vercel Dashboard 中添加所有环境变量
   - 确保生产环境变量正确设置

#### Netlify 部署

1. 构建项目：

```bash
npm run build
```

2. 上传 `dist` 文件夹到 Netlify
3. 配置环境变量和重定向规则

#### 其他平台

项目支持任何支持静态文件托管的平台：

- GitHub Pages
- AWS S3 + CloudFront
- Google Cloud Storage
- 阿里云 OSS

## 🔧 高级配置

### 自定义域名

1. 在 Vercel/Netlify 中配置自定义域名
2. 更新 `vite.config.ts` 中的 base 路径（如需要）

### CDN 配置

```typescript
// vite.config.ts
export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
```

### 性能优化

1. 启用 gzip 压缩
2. 配置缓存策略
3. 使用 CDN 加速静态资源

## 🔒 安全配置

### CORS 设置

在 Supabase 中配置允许的域名：

```sql
-- 在 Supabase Dashboard 的 Settings > API 中配置
```

### 环境变量安全

- 永远不要提交 `.env` 文件到版本控制
- 使用 `.env.example` 作为模板
- 在生产环境中使用环境变量管理

### API 密钥轮换

定期轮换 API 密钥：

1. 生成新的 API 密钥
2. 更新环境变量
3. 重新部署应用

## 📊 监控和分析

### 错误监控

集成错误监控服务：

```bash
npm install @sentry/react
```

### 性能监控

使用 Vercel Analytics 或 Google Analytics

### 用户行为分析

集成 Mixpanel 或 Amplitude

## 🔄 CI/CD 配置

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🧪 测试

### 单元测试

```bash
npm run test
```

### E2E 测试

```bash
npm run test:e2e
```

### 性能测试

```bash
npm run lighthouse
```

## 📈 扩展功能

### 日历同步

1. 配置 Google Calendar API
2. 添加日历同步功能
3. 更新环境变量

### 邮件通知

1. 配置邮件服务（SendGrid、Mailgun）
2. 实现邮件模板
3. 添加通知功能

### 移动端适配

1. 优化移动端样式
2. 添加 PWA 支持
3. 实现离线功能

## 🐛 故障排除

### 常见问题

#### 1. Supabase 连接失败

- 检查环境变量是否正确
- 确认 Supabase 项目状态
- 检查网络连接

#### 2. 文件上传失败

- 检查 Storage bucket 权限
- 确认文件大小限制
- 验证文件类型

#### 3. AI 功能不工作

- 检查 OpenAI API 密钥
- 确认 API 配额
- 验证网络连接

#### 4. 构建失败

- 检查依赖版本
- 确认 Node.js 版本
- 清理缓存重新安装

### 调试技巧

1. 使用浏览器开发者工具
2. 检查网络请求
3. 查看控制台错误
4. 使用 React DevTools

## 📞 支持

### 文档

- [项目 README](./README.md)
- [API 文档](./docs/api.md)
- [组件文档](./docs/components.md)

### 社区

- GitHub Issues
- Discord 社区
- 邮件支持

### 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解最新更新
