# 🚀 EzA Deployment Guide

## 🌟 **部署概览**

本指南将帮助你将 EzA AI 学习平台部署到生产环境。EzA 支持多种部署方式，从简单的静态部署到完整的云端解决方案。

---

## 🏗️ **部署架构**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (Vercel/      │    │   (Supabase)    │    │   (OpenAI)      │
│    Netlify)     │    │                 │    │                 │
│                 │    │ • PostgreSQL    │    │ • GPT-3.5/4o   │
│ • React App     │──▶ │ • Auth          │──▶ │ • Embeddings   │
│ • Static Files  │    │ • Storage       │    │ • Fine-tuning   │
│ • CDN           │    │ • Edge Funcs    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔧 **环境要求**

### 📋 **系统要求**

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **内存**: 最少 512MB RAM
- **存储**: 最少 1GB 可用空间
- **网络**: 稳定的互联网连接

### 🔑 **所需服务**

- **Supabase 账户** - 数据库和后端服务
- **OpenAI API 密钥** - AI 功能支持
- **部署平台账户** - Vercel、Netlify 或其他

---

## ⚡ **快速部署 (推荐)**

### 🎯 **方案 1: Vercel 一键部署**

1. **Fork 项目到 GitHub**

   ```bash
   # 克隆项目
   git clone https://github.com/your-username/EzA.git
   cd EzA
   ```

2. **设置环境变量**

   - 在 Vercel Dashboard 中添加环境变量
   - 或创建 `.env.local` 文件：

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

3. **一键部署**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/EzA)

### 🌐 **方案 2: Netlify 部署**

1. **连接 GitHub 仓库**

   - 登录 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 选择你的 EzA 仓库

2. **配置构建设置**

   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **设置环境变量**
   - 在 Netlify Dashboard → Site settings → Environment variables
   - 添加所有必需的环境变量

---

## 🛠️ **手动部署**

### 📦 **构建生产版本**

```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 🔍 **构建验证**

构建完成后检查以下内容：

✅ **文件完整性**

```bash
ls -la dist/
# 应该包含:
# - index.html
# - assets/ (JS, CSS 文件)
# - vite.svg
```

✅ **环境变量检查**

```bash
grep -r "undefined" dist/assets/*.js
# 应该没有返回结果
```

✅ **资源优化**

```bash
# 检查文件大小
du -h dist/assets/*
# JS bundle 应该 < 1MB
# CSS 文件应该 < 200KB
```

---

## 🗄️ **数据库设置**

### 🎯 **Supabase 配置**

1. **创建新项目**

   - 访问 [Supabase Dashboard](https://supabase.com/dashboard)
   - 点击 "New project"
   - 选择组织和区域

2. **数据库架构**

   ```sql
   -- 用户扩展信息表
   CREATE TABLE user_profiles (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     learning_style VARCHAR(20),
     subscription_tier VARCHAR(20) DEFAULT 'free',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- 学习会话表
   CREATE TABLE learning_sessions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     session_data JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- 学习分析数据表
   CREATE TABLE analytics_data (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     behavior_data JSONB,
     insights JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Row Level Security (RLS)**

   ```sql
   -- 启用 RLS
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

   -- 创建策略
   CREATE POLICY "Users can view own profile" ON user_profiles
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can update own profile" ON user_profiles
     FOR UPDATE USING (auth.uid() = user_id);
   ```

### 🔐 **认证配置**

1. **启用认证提供商**

   - Email/Password
   - Google OAuth (可选)
   - GitHub OAuth (可选)

2. **配置邮件模板**
   ```html
   <!-- 自定义邮件模板 -->
   <h2>欢迎加入 EzA! 🎓</h2>
   <p>点击下面的链接确认您的邮箱：</p>
   <a href="{{ .ConfirmationURL }}">确认邮箱</a>
   ```

---

## 🌍 **域名和 SSL 配置**

### 🔗 **自定义域名**

1. **添加域名记录**

   ```
   Type: CNAME
   Name: www
   Value: your-project.vercel.app
   ```

2. **配置重定向**
   ```json
   // vercel.json
   {
     "redirects": [
       {
         "source": "/",
         "destination": "/dashboard",
         "statusCode": 301
       }
     ]
   }
   ```

### 🔒 **SSL 证书**

- **Vercel**: 自动提供免费 SSL
- **Netlify**: 自动 Let's Encrypt 证书
- **自部署**: 使用 Certbot 或 Cloudflare

---

## 📊 **监控和分析**

### 📈 **性能监控**

1. **集成 Vercel Analytics**

   ```typescript
   // src/main.tsx
   import { inject } from "@vercel/analytics";

   inject();
   ```

2. **错误追踪 (Sentry)**

   ```bash
   npm install @sentry/react @sentry/tracing
   ```

   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production",
   });
   ```

### 🔍 **用户分析**

1. **Google Analytics 4**

   ```html
   <!-- index.html -->
   <script
     async
     src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
   ></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag() {
       dataLayer.push(arguments);
     }
     gtag("js", new Date());
     gtag("config", "GA_MEASUREMENT_ID");
   </script>
   ```

2. **用户反馈**

   ```typescript
   // 集成 Hotjar 或 LogRocket
   import LogRocket from "logrocket";

   LogRocket.init("app/id");
   ```

---

## 🔧 **环境配置详解**

### 📝 **环境变量完整列表**

```env
# ===== 核心配置 =====
VITE_APP_NAME=EzA
VITE_APP_VERSION=2.0.0
VITE_NODE_ENV=production

# ===== Supabase 配置 =====
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===== OpenAI 配置 =====
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_OPENAI_ORG_ID=org-your-organization-id

# ===== 功能开关 =====
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TESTING_FEATURES=false
VITE_ENABLE_DEBUG_MODE=false

# ===== 第三方服务 =====
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ===== API 限制 =====
VITE_MAX_FILE_SIZE=10485760  # 10MB
VITE_API_RATE_LIMIT=100      # 每分钟请求数
```

### 🌐 **多环境配置**

```bash
# 开发环境
.env.development

# 测试环境
.env.staging

# 生产环境
.env.production
```

---

## 🚨 **故障排除**

### ❗ **常见问题**

**Q1: 构建失败，提示 TypeScript 错误**

```bash
# 解决方案
npm run type-check
# 修复类型错误后重新构建
npm run build
```

**Q2: Supabase 连接失败**

```bash
# 检查环境变量
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 验证 URL 格式
curl $VITE_SUPABASE_URL/rest/v1/
```

**Q3: OpenAI API 响应错误**

```bash
# 验证 API 密钥
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $VITE_OPENAI_API_KEY"
```

**Q4: 文件上传失败**

```typescript
// 检查 Supabase Storage 配置
const { data, error } = await supabase.storage.from("documents").list();

if (error) console.error("Storage error:", error);
```

### 🔧 **调试工具**

```bash
# 检查构建大小
npm run build -- --analyze

# 检查 lighthouse 性能
npx lighthouse http://localhost:5173

# 检查 bundle 分析
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/assets
```

---

## 🔄 **CI/CD 配置**

### 🚀 **GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📋 **部署检查清单**

### ✅ **部署前检查**

- [ ] 所有环境变量已配置
- [ ] 代码已通过所有测试
- [ ] 生产构建无错误
- [ ] 数据库迁移已完成
- [ ] SSL 证书已配置
- [ ] 域名 DNS 已设置
- [ ] 监控工具已集成
- [ ] 备份策略已制定

### ✅ **部署后验证**

- [ ] 网站可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] AI 助手响应正常
- [ ] 文件上传功能正常
- [ ] 分析功能运行正常
- [ ] 支付系统工作正常（如启用）
- [ ] 邮件通知正常发送
- [ ] 性能指标符合预期

---

## 📞 **支持和帮助**

如遇部署问题，请联系：

- 📧 **邮件支持**: deployment@eza-learning.com
- 💬 **Discord 社区**: [EzA Deployment Help](https://discord.gg/eza-deployment)
- 📖 **详细文档**: [https://docs.eza-learning.com/deployment](https://docs.eza-learning.com/deployment)
- 🐛 **问题报告**: [GitHub Issues](https://github.com/your-username/EzA/issues)

---

**🎉 恭喜！你已成功部署 EzA AI 学习平台！**

_最后更新: 2024 年 1 月_
