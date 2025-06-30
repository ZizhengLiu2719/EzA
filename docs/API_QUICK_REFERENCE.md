# ⚡ EzA API Quick Reference

## 🚀 **快速开始**

```typescript
import { useEnhancedAI, useAdvancedLearningAnalytics } from "@/hooks";

// 基础AI助手
const ai = useEnhancedAI({
  mode: "guided_tutor",
  assistantType: "stem",
});

// 高级分析
const analytics = useAdvancedLearningAnalytics();
```

---

## 🤖 **AI Assistant API**

### `useEnhancedAI` Hook

```typescript
const {
  messages, // 消息历史
  sendMessage, // 发送消息函数
  isLoading, // 加载状态
  learningStyle, // 学习风格
  cognitiveState, // 认知状态
  updateConfig, // 更新配置
  resetConversation, // 重置对话
} = useEnhancedAI({
  mode: "guided_tutor" | "socratic_method" | "quick_fix" | "visual_assistant",
  assistantType: "writing" | "stem" | "reading" | "programming",
  personalization: {
    learningStyle: "adaptive",
    difficultyLevel: "intermediate",
    pace: "moderate",
  },
});
```

---

## 📊 **Analytics API**

### `useAdvancedLearningAnalytics` Hook

```typescript
const {
  analyticsEngine, // 分析引擎实例
  insights, // 学习洞察
  predictions, // 学习预测
  patterns, // 学习模式
  recommendations, // 个性化推荐
  generateReport, // 生成报告
} = useAdvancedLearningAnalytics();
```

### 学习分析引擎方法

```typescript
// 分析用户行为
const analysis = await analyticsEngine.analyzeUserBehavior(
  messages,
  behaviorData,
  cognitiveMetrics
);

// 获取学习效率分析
const efficiency = analyticsEngine.getLearningEfficiencyAnalysis();

// 导出分析报告
const report = analyticsEngine.exportAnalysisReport();
```

---

## 🎯 **模式识别**

```typescript
// 识别学习模式
const patterns = await patternEngine.identifyPatterns(metrics);

// 可识别的模式类型
type PatternType =
  | "learning_rhythm" // 学习节奏
  | "cognitive_load_pattern" // 认知负荷
  | "engagement_cycle" // 参与度循环
  | "help_seeking"; // 求助行为
```

---

## 🛣️ **预测性学习路径**

```typescript
// 生成学习路径
const path = await pathPlanner.generateOptimizedPath(
  objectives,
  constraints,
  preferences
);

// 路径类型
type PathType =
  | "efficiency_focused" // 效率优先
  | "depth_focused" // 深度学习
  | "balanced" // 平衡发展
  | "quick_start" // 快速入门
  | "project_driven"; // 项目驱动
```

---

## 📝 **自适应测试**

```typescript
// 开始测试
const session = await testSystem.startTest({
  subject_domain: "mathematics",
  test_purpose: "diagnostic",
  min_items: 10,
  max_items: 30,
});

// 提交答案
const result = await testSystem.submitResponse(sessionId, itemId, userResponse);

// 获取能力评估
const ability = testSystem.getAbilityEstimate(sessionId);
```

---

## 🧭 **知识状态建模**

```typescript
// 更新知识状态
const state = await knowledgeModel.updateKnowledgeState(evidence, timestamp);

// 预测掌握度
const mastery = knowledgeModel.predictMastery(conceptId, timeframe);

// 识别知识差距
const gaps = knowledgeModel.identifyKnowledgeGaps();
```

---

## 🔧 **工具函数**

```typescript
// 学习风格检测
const style = detectLearningStyle(interactions);

// 认知负荷监控
const load = monitorCognitiveLoad(responseTime, errorRate, complexity);

// 智能提示生成
const prompt = generateSmartPrompt(context, userProfile, objective);
```

---

## 📈 **数据类型**

### 核心类型

```typescript
interface LearningInsight {
  insight_id: string;
  insight_type: "behavior" | "performance" | "pattern";
  title: string;
  description: string;
  significance_score: number; // 0-100
  confidence_level: number; // 0-1
  evidence: InsightEvidence[];
  actionable_items: string[];
  generated_at: string;
}

interface LearningPrediction {
  prediction_id: string;
  prediction_type: "performance" | "behavior" | "outcome";
  target_metric: string;
  predicted_value: number;
  confidence_interval: [number, number];
  probability: number; // 0-1
  timeframe: string;
  generated_at: string;
}

interface CognitiveLoadMetrics {
  current_metrics: {
    intrinsic_load: number; // 0-100
    extraneous_load: number; // 0-100
    germane_load: number; // 0-100
    response_delay: number; // 秒
    error_rate: number; // 0-1
  };
  session_metrics: {
    total_cognitive_load: number; // 0-100
    peak_load: number; // 0-100
    average_load: number; // 0-100
  };
  recommendations: string[];
}
```

---

## 🚨 **错误处理**

```typescript
try {
  const analysis = await analyticsEngine.analyzeUserBehavior(...)
} catch (error) {
  switch (error.code) {
    case 'AI_001':
      console.log('AI服务不可用')
      break
    case 'ANALYTICS_001':
      console.log('分析数据不足')
      break
    default:
      console.error('未知错误:', error.message)
  }
}
```

---

## 📝 **使用示例**

### 完整学习会话

```typescript
function LearningSession() {
  const ai = useEnhancedAI({
    mode: "guided_tutor",
    assistantType: "stem",
  });

  const analytics = useAdvancedLearningAnalytics();

  const startSession = async () => {
    // 开始分析
    analytics.startAnalysis();

    // 发送消息
    await ai.sendMessage("帮我理解微积分");

    // 获取洞察
    const insights = analytics.insights;
    const predictions = analytics.predictions;

    // 生成报告
    const report = analytics.generateReport();
  };

  return (
    <div>
      <ChatInterface {...ai} />
      <AnalyticsDashboard {...analytics} />
    </div>
  );
}
```

---

## 📞 **获取帮助**

- 📚 [完整 API 文档](./API_DOCUMENTATION.md)
- 👨‍💻 [开发者指南](./DEVELOPER_GUIDE.md)
- 💬 [Discord 支持](https://discord.gg/eza-dev)

---

_最后更新: 2024 年 1 月_
