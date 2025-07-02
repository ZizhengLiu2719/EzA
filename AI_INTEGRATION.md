# EzA AI 集成指南

## 🚀 概述

EzA 的 AI 集成功能提供了强大的学习辅助能力，包括智能对话、课程解析、复习卡片生成和个性化建议。

## 🔧 环境配置

### 1. OpenAI API 配置

在项目根目录创建 `.env` 文件：

```bash
# OpenAI 配置
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制并保存到 `.env` 文件中

## 🤖 AI 功能模块

### 1. AI 对话系统

#### 支持的助手类型

- **写作助手** (`writing`) - 学术写作指导
- **STEM 助手** (`stem`) - 数学和科学问题解答
- **阅读助手** (`reading`) - 阅读理解辅助
- **编程助手** (`programming`) - 编程问题指导

#### AI 模式

- **引导式导师** (`bullet_tutor`) - 通过引导式问题帮助学生思考
- **苏格拉底式** (`socratic_bot`) - 通过提问引导学生发现答案
- **快速修复** (`quick_fix`) - 直接提供具体的解决方案
- **视觉化助手** (`diagram_ai`) - 通过图表和图示帮助理解

#### 使用示例

```typescript
import { useAI } from "@/hooks/useAI";

const { createConversation, sendMessage, updateAIConfig } = useAI();

// 创建写作对话
const conversation = await createConversation("writing");

// 配置 AI 模式
updateAIConfig({
  mode: "socratic_bot",
  writing_style: "academic",
  citation_format: "apa",
});

// 发送消息
await sendMessage("我需要写一篇关于人工智能的论文，请帮我规划结构");
```

### 2. 课程材料解析

#### 支持的文件类型

- PDF 文档
- Word 文档
- 文本文件
- 图片文件（OCR 支持）

#### 解析功能

- 自动提取课程信息
- 识别任务和截止日期
- 生成学习路径
- 创建复习卡片

#### 使用示例

### Step 1: Upload Materials

Use `materialsApi.uploadMaterial` to upload course materials to the backend.

```javascript
import { materialsApi } from "@/api/courses";

// ... inside an async function
const courseId = "..."; // The ID of the newly created course
const file = "..."; // The path to the uploaded file
const type = "syllabus"; // The type of the uploaded file

try {
  const material = await materialsApi.uploadMaterial(courseId, file, type);
  if (material.error) {
    console.error("Upload failed:", material.error);
    return;
  }

  // Now you have:
  // material.id
  // material.course_id
  // material.type
  // material.uploaded_at
  // ... and other material details
} catch (error) {
  console.error("An error occurred during upload:", error);
}
```

### Step 2: Parse Materials and Get Structured Data

Use `materialsApi.parseCourseMaterials` to send the uploaded material IDs to the backend. The backend will then use the AI service to parse the text and return a structured `CourseParseResult` object.

```javascript
import { materialsApi } from "@/api/courses";

// ... inside an async function
const courseId = "..."; // The ID of the newly created course
const materialIds = ["...", "..."]; // IDs of uploaded materials

try {
  const parseResult = await materialsApi.parseCourseMaterials(
    courseId,
    materialIds
  );
  if (parseResult.error) {
    console.error("Parsing failed:", parseResult.error);
    return;
  }

  const structuredData = parseResult.data;
  // Now you have:
  // structuredData.course_name
  // structuredData.semester
  // structuredData.year
  // structuredData.tasks (an array of Task objects)
  // ... and other course details
} catch (error) {
  console.error("An error occurred during parsing:", error);
}
```

### 3. 复习卡片生成

#### 功能特点

- 基于课程内容自动生成
- 支持多种难度级别
- 智能分类和标签
- 掌握程度追踪

#### 使用示例

```typescript
import { reviewCardsApi } from "@/api/ai";

// 生成复习卡片
const cards = await reviewCardsApi.generateReviewCards(courseId);

// 更新掌握程度
await reviewCardsApi.updateCardMastery(cardId, 85);
```

### 4. 周报告和建议

#### 分析维度

- 任务完成率
- 学习时间统计
- 拖延指数
- 专注度评分

#### 使用示例

```typescript
import { weeklyReportApi } from "@/api/ai";

// 生成周报告
const report = await weeklyReportApi.generateWeeklyReport(
  "2024-01-01",
  "2024-01-07"
);
```

## 🎯 AI 配置选项

### 写作风格配置

```typescript
const writingStyles = {
  academic: "学术写作",
  creative: "创意写作",
  technical: "技术写作",
};
```

### 引用格式配置

```typescript
const citationFormats = {
  mla: "现代语言协会格式",
  apa: "美国心理学协会格式",
  chicago: "芝加哥格式",
};
```

### 难度级别配置

```typescript
const difficultyLevels = {
  beginner: "初学者",
  intermediate: "中级",
  advanced: "高级",
};
```

## 🔍 错误处理

### 常见错误及解决方案

1. **API Key 未配置**

   ```
   错误: OpenAI API key not configured
   解决: 检查 .env 文件中的 VITE_OPENAI_API_KEY 配置
   ```

2. **API 调用失败**

   ```
   错误: AI 服务暂时不可用
   解决: 检查网络连接和 OpenAI API 状态
   ```

3. **文件上传失败**
   ```
   错误: 不支持的文件类型
   解决: 确保文件类型在支持列表中
   ```

## 📊 性能优化

### 1. 请求缓存

- 实现智能缓存机制
- 避免重复的 AI 请求
- 缓存常用的解析结果

### 2. 成本控制

- 限制免费用户的使用次数
- 优化提示词以减少 token 消耗
- 实现请求压缩和批处理

### 3. 响应优化

- 使用流式响应
- 实现打字机效果
- 添加加载状态指示

## 🛠️ 开发调试

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 检查环境变量
echo $VITE_OPENAI_API_KEY
```

### 2. 日志调试

```typescript
// 启用详细日志
console.log("AI Response:", response);
console.log("AI Config:", config);
```

### 3. 错误追踪

```typescript
try {
  const response = await aiService.callOpenAI(messages);
} catch (error) {
  console.error("AI Error:", error);
  // 发送错误报告
}
```

## 🔒 安全考虑

### 1. API Key 安全

- 不要在客户端代码中硬编码 API Key
- 使用环境变量管理敏感信息
- 定期轮换 API Key

### 2. 用户数据保护

- 加密存储敏感对话内容
- 实现数据删除功能
- 遵守隐私法规

### 3. 内容过滤

- 实现内容安全检查
- 过滤不当内容
- 记录异常使用

## 📈 监控和分析

### 1. 使用统计

- 跟踪 AI 使用频率
- 分析用户偏好
- 监控性能指标

### 2. 质量评估

- 评估 AI 回复质量
- 收集用户反馈
- 持续优化提示词

### 3. 成本监控

- 跟踪 API 调用成本
- 优化资源使用
- 设置使用限制

## 🚀 部署注意事项

### 1. 环境变量

确保生产环境中正确配置所有必要的环境变量。

### 2. API 限制

设置适当的 API 调用限制和速率限制。

### 3. 错误处理

实现完善的错误处理和用户友好的错误消息。

### 4. 监控

设置监控和告警系统，及时发现问题。

## 📚 相关文档

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [EzA 项目文档](./README.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进 AI 功能！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 支持

如果遇到问题，请：

1. 查看本文档
2. 搜索现有 Issue
3. 创建新的 Issue
4. 联系开发团队
