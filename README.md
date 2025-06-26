# EzA - AI 驱动的学习成功系统

> Upload your syllabus. I'll handle the rest.

EzA 是一个专为美国大学生设计的 AI 驱动学习成功系统，旨在帮助学生从课程开始，一路顺利走向成功。

## 🎯 核心功能

- **课程导入中心** - 上传 syllabus、教材、讲义，1 分钟内掌握整个学期结构
- **智能任务引擎** - 自动生成学习路径图，子任务拆解，与日历同步
- **AI 学习助理** - 写作引导、STEM 解题、阅读摘要，全方位 AI 辅导
- **每周反馈教练** - 任务完成率分析、拖延指数、个性化建议
- **复习与考试准备** - 自动生成复习卡、模拟题、错题追踪
- **本学期课程总览** - 查看所有已上传课程，快速访问 syllabus 编辑

## 🛠️ 技术栈

- **前端**: React + TypeScript + Vite
- **样式**: CSS Modules (无 Tailwind)
- **状态管理**: Zustand
- **路由**: React Router DOM
- **动画**: Framer Motion
- **后端**: Supabase (Auth + PostgreSQL + Storage)
- **AI**: OpenAI GPT-4
- **部署**: Vercel

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
src/
├── assets/                  # 图片、图标等
├── components/             # UI组件 + 样式模块
├── pages/                  # 页面组件
├── layouts/                # 页面结构
├── styles/                 # 全局样式
├── hooks/                  # 自定义Hook
├── api/                    # API请求封装
├── context/                # 状态共享
├── utils/                  # 工具函数
├── types/                  # TypeScript类型
└── main.tsx
```

## 🎨 设计理念

- **PC 优先，移动兼容** - 响应式设计，优先考虑桌面端体验
- **模块化 CSS** - 使用 CSS Modules，避免样式冲突
- **组件化开发** - 高度可复用的组件设计
- **用户体验优先** - 简洁直观的界面设计

## 📈 开发计划

- [x] 项目基础架构搭建
- [x] 首页和导航组件
- [x] 用户认证页面
- [x] 基础页面框架
- [x] Supabase 集成
- [x] 文件上传功能
- [x] AI 对话功能
- [x] 任务管理系统
- [x] 课程 syllabus 解析与编辑
- [x] 课程总览页面
- [x] 首页六大模块布局优化
- [ ] 复习系统
- [ ] 数据可视化
- [ ] 每周反馈分析
- [ ] 考试准备功能

## 🔧 核心功能实现

### 课程 Syllabus 解析

- 支持 PDF 文件上传
- AI 自动解析 syllabus 内容
- 生成结构化任务列表
- 前端编辑与保存功能
- 数据库持久化存储

### 课程管理

- 课程列表总览
- 新建课程与编辑课程
- Syllabus 信息持久化
- 路由参数支持

### AI 集成

- OpenAI GPT-4 API 集成
- 智能 syllabus 解析
- 结构化数据输出
- 错误处理与重试机制

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License
