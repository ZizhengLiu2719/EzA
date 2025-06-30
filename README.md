# 🎓 EzA - AI-Powered Learning Success Platform

<div align="center">

![EzA Logo](https://via.placeholder.com/200x100/6366f1/ffffff?text=EzA)

**🧠 Revolutionizing Education with AI • 🎮 Cyberpunk Aesthetic • 🚀 Gen Z Ready**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

</div>

## 🌟 **什么是 EzA？**

**EzA (Easy Academic)** 是一个革命性的 AI 学习助手平台，专为美国大学生设计。融合最新 AI 技术、教育心理学理论和赛博朋克美学，为每个学生提供个性化的学习体验。

### ✨ **核心特色**

- 🤖 **4 种 AI 助手专家** - 写作、STEM、阅读、编程
- 🧠 **4 种智能模式** - 引导导师、苏格拉底式、快速修复、视觉助手
- 📊 **实时学习分析** - 基于认知科学的个性化适应
- 🎯 **预测性学习路径** - AI 驱动的个性化学习规划
- 📝 **自适应测试系统** - Computer Adaptive Testing (CAT)
- 🎮 **游戏化体验** - XP 系统、成就解锁、赛博朋克界面
- 💰 **灵活订阅** - $0/$4.99/$9.99/月三档选择

## 🚀 **快速开始**

### 📋 **系统要求**

- Node.js 18+
- npm 8+ 或 yarn 1.22+
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)

### ⚡ **安装与运行**

```bash
# 克隆项目
git clone https://github.com/your-username/EzA.git
cd EzA

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件，添加必要的API密钥

# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:5173
```

### 🔧 **环境配置**

创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI 配置
VITE_OPENAI_API_KEY=your_openai_api_key

# 应用配置
VITE_APP_NAME=EzA
VITE_APP_VERSION=2.0.0
```

## 🏗️ **技术架构**

### 📱 **前端技术栈**

- **React 18** - 现代 React 与 Hooks
- **TypeScript** - 类型安全开发
- **Vite** - 快速构建工具
- **CSS Modules** - 组件化样式
- **Framer Motion** - 流畅动画

### 🔧 **后端服务**

- **Supabase** - 数据库、认证、存储
- **PostgreSQL** - 关系型数据库
- **Row Level Security** - 数据安全

### 🤖 **AI 服务**

- **OpenAI GPT-3.5-turbo/GPT-4o** - 对话 AI
- **mammoth.js** - Word 文档解析
- **tesseract.js** - 光学字符识别
- **pdf.js** - PDF 文档解析

## 🧠 **核心 AI 功能**

### 🎯 **Phase 1: 个性化基础**

- ✅ **学习风格检测** - VARK 模型自动识别
- ✅ **认知负荷监控** - 实时学习状态分析
- ✅ **智能提示引擎** - 教育心理学驱动
- ✅ **增强 AI 钩子** - 统一接口集成

### 🚀 **Phase 2: 高级分析** (新增)

- ✅ **学习分析引擎** - 深度行为数据分析
- ✅ **模式识别算法** - 10+种学习模式检测
- ✅ **预测性路径规划** - AI 驱动个性化学习
- ✅ **自适应测试系统** - IRT 模型能力评估
- ✅ **知识状态建模** - 实时掌握度追踪

## 📊 **系统功能矩阵**

| 功能模块        | 描述             | 状态    | 技术       |
| --------------- | ---------------- | ------- | ---------- |
| **AI 助手系统** | 4 种专业 AI 助手 | ✅ 完成 | OpenAI GPT |
| **学习分析**    | 实时行为分析     | ✅ 完成 | 机器学习   |
| **模式识别**    | 学习模式检测     | ✅ 完成 | 深度学习   |
| **自适应测试**  | CAT 能力评估     | ✅ 完成 | IRT 模型   |
| **文档解析**    | 多格式文件支持   | ✅ 完成 | OCR/NLP    |
| **游戏化系统**  | XP/成就系统      | ✅ 完成 | React      |
| **订阅管理**    | 三档订阅模式     | ✅ 完成 | Supabase   |

## 🎮 **用户体验**

### 🎨 **设计语言**

- **赛博朋克美学** - 霓虹色彩、未来感界面
- **Gen Z 友好** - 直观操作、快速响应
- **暗色模式优先** - 护眼学习环境

### 📱 **响应式设计**

- 桌面端优化 (1920x1080+)
- 平板端适配 (768px+)
- 移动端友好 (375px+)

## 📈 **性能指标**

- ⚡ **首屏加载** < 2 秒
- 🔄 **AI 响应时间** < 3 秒
- 📊 **分析处理** < 1 秒
- 💾 **内存占用** < 100MB
- 🌐 **离线支持** 基础功能可用

## 🛠️ **开发命令**

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览构建结果

# 代码质量
npm run lint         # ESLint检查
npm run lint:fix     # 自动修复
npm run type-check   # TypeScript检查

# 测试
npm run test         # 运行单元测试
npm run test:ui      # 测试UI界面
npm run test:e2e     # 端到端测试
```

## 📦 **项目结构**

```
EzA/
├── src/
│   ├── components/          # React组件
│   │   ├── ui/             # 基础UI组件
│   │   ├── ai/             # AI相关组件
│   │   └── dashboard/      # 仪表板组件
│   ├── hooks/              # React Hooks
│   │   ├── useEnhancedAI.ts
│   │   └── useAdvancedLearningAnalytics.ts
│   ├── utils/              # 工具函数
│   │   ├── learningAnalyticsEngine.ts
│   │   ├── learningPatternRecognition.ts
│   │   └── adaptiveTesting.ts
│   ├── types/              # TypeScript类型
│   │   ├── ai-enhanced.ts
│   │   └── analytics-enhanced.ts
│   └── styles/             # 样式文件
├── docs/                   # 项目文档
├── public/                 # 静态资源
└── tests/                  # 测试文件
```

## 🤝 **贡献指南**

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 📝 **编码规范**

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件使用 PascalCase 命名
- 函数使用 camelCase 命名
- 文件使用 kebab-case 命名

## 📄 **许可证**

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 **致谢**

- **OpenAI** - 提供强大的 AI 能力
- **Supabase** - 优秀的后端服务
- **React 团队** - 现代前端框架
- **教育心理学社区** - 理论基础支持

## 📞 **联系我们**

- 📧 Email: contact@eza-learning.com
- 🐦 Twitter: [@EzALearning](https://twitter.com/EzALearning)
- 💬 Discord: [EzA Community](https://discord.gg/eza)
- 📱 官网: [https://eza-learning.com](https://eza-learning.com)

---

<div align="center">

**🎓 让学习变得简单、智能、有趣 🚀**

Made with ❤️ by the EzA Team

</div>
