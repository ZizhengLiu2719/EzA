# 📚 EzA API Documentation

## 🌟 **概览**

EzA 提供了一套强大的 API，用于 AI 学习助手、分析引擎和自适应测试系统。本文档详细说明了所有可用的接口、参数和返回值。

---

## 🤖 **AI Assistant API**

### `useEnhancedAI` Hook

**描述**: 核心 AI 助手钩子，提供个性化 AI 交互能力

#### 参数

```typescript
interface EnhancedAIConfig {
  mode: AIMode; // AI模式
  assistantType: AssistantType; // 助手类型
  personalization: PersonalizationConfig; // 个性化配置
  cognitiveLoad: CognitiveLoadConfig; // 认知负荷配置
  context: ContextConfig; // 上下文配置
}

type AIMode =
  | "guided_tutor"
  | "socratic_method"
  | "quick_fix"
  | "visual_assistant";
type AssistantType = "writing" | "stem" | "reading" | "programming";
```

#### 返回值

```typescript
interface EnhancedAIReturn {
  // 核心AI功能
  messages: EnhancedAIMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;

  // 学习分析
  learningStyle: LearningStyle;
  cognitiveState: CognitiveLoadLevel;

  // 个性化设置
  updateConfig: (config: Partial<EnhancedAIConfig>) => void;
  resetConversation: () => void;
}
```

#### 使用示例

```typescript
const {
  messages,
  sendMessage,
  isLoading,
  learningStyle,
  cognitiveState,
  updateConfig,
} = useEnhancedAI({
  mode: "guided_tutor",
  assistantType: "stem",
  personalization: {
    learningStyle: "adaptive",
    difficultyLevel: "intermediate",
    pace: "moderate",
  },
});
```

---

## 📊 **Learning Analytics API**

### `useAdvancedLearningAnalytics` Hook

**描述**: 高级学习分析钩子，提供深度行为分析和预测能力

#### 返回值

```typescript
interface AdvancedLearningAnalyticsReturn {
  // 核心分析功能
  analyticsEngine: LearningAnalyticsEngine;

  // 实时数据
  behaviorData: LearningBehaviorData | null;
  cognitiveMetrics: CognitiveLoadMetrics | null;

  // 分析结果
  insights: LearningInsight[];
  predictions: LearningPrediction[];
  recommendations: string[];

  // 模式识别
  patterns: LearningPattern[];

  // 控制函数
  startAnalysis: () => void;
  stopAnalysis: () => void;
  generateReport: () => AnalysisReport;
}
```

#### 使用示例

```typescript
const { analyticsEngine, insights, predictions, patterns, generateReport } =
  useAdvancedLearningAnalytics();

// 获取学习效率分析
const efficiency = analyticsEngine.getLearningEfficiencyAnalysis();
```

---

## 🧠 **Learning Analytics Engine API**

### `LearningAnalyticsEngine` 类

#### 核心方法

##### `analyzeUserBehavior()`

**描述**: 分析用户学习行为并生成洞察

```typescript
async analyzeUserBehavior(
  messages: EnhancedAIMessage[],
  behaviorData: LearningBehaviorData,
  cognitiveMetrics: CognitiveLoadMetrics
): Promise<{
  insights: LearningInsight[]
  predictions: LearningPrediction[]
  recommendations: string[]
}>
```

**参数说明**:

- `messages`: AI 对话消息历史
- `behaviorData`: 用户学习行为数据
- `cognitiveMetrics`: 认知负荷指标

**返回值**: 包含洞察、预测和推荐的分析结果

##### `getLearningEfficiencyAnalysis()`

**描述**: 获取学习效率深度分析

```typescript
getLearningEfficiencyAnalysis(): {
  overall_efficiency: number                    // 整体效率 (0-100)
  efficiency_factors: Array<{                   // 效率因子分析
    factor: string
    impact: number
    suggestion: string
  }>
  time_optimization_potential: number           // 时间优化潜力 (0-100)
}
```

##### `exportAnalysisReport()`

**描述**: 导出完整分析报告

```typescript
exportAnalysisReport(): {
  summary: AnalysisSummary
  detailed_insights: LearningInsight[]
  predictions: LearningPrediction[]
  efficiency_analysis: EfficiencyAnalysis
  recommendations: string[]
}
```

---

## 🎯 **Pattern Recognition API**

### `PatternRecognitionEngine` 类

#### 核心方法

##### `identifyPatterns()`

**描述**: 识别用户学习模式

```typescript
async identifyPatterns(
  metrics: AggregatedBehaviorMetrics
): Promise<LearningPattern[]>
```

**识别的模式类型**:

- `learning_rhythm` - 学习节奏模式
- `cognitive_load_pattern` - 认知负荷模式
- `engagement_cycle` - 参与度循环
- `help_seeking` - 求助行为模式
- `error_pattern` - 错误处理模式
- `time_preference` - 时间偏好模式

#### 模式数据结构

```typescript
interface LearningPattern {
  id: string;
  pattern_type: PatternType;
  description: string;
  frequency: number;
  confidence_score: number; // 0-100
  first_detected: string;
  last_observed: string;
  associated_outcomes: PatternOutcome[];
  trigger_conditions: TriggerCondition[];
}
```

---

## 🛣️ **Predictive Learning Path API**

### `LearningPathPlanner` 类

#### 核心方法

##### `generateOptimizedPath()`

**描述**: 生成个性化学习路径

```typescript
async generateOptimizedPath(
  objectives: LearningObjective[],
  constraints: LearningConstraints,
  preferences: UserPreferences
): Promise<LearningPath>
```

**学习路径类型**:

- `efficiency_focused` - 效率优先
- `depth_focused` - 深度学习
- `balanced` - 平衡发展
- `quick_start` - 快速入门
- `project_driven` - 项目驱动

#### 路径数据结构

```typescript
interface LearningPath {
  id: string;
  name: string;
  description: string;
  estimated_duration: number; // 小时
  difficulty_progression: DifficultyProgression;
  learning_modules: LearningModule[];
  predicted_outcomes: PredictedOutcome[];
  personalization_score: number; // 0-100
}
```

---

## 📝 **Adaptive Testing API**

### `AdaptiveTestingSystem` 类

#### 核心方法

##### `startTest()`

**描述**: 开始自适应测试

```typescript
async startTest(
  configuration: TestConfiguration
): Promise<TestSession>
```

##### `submitResponse()`

**描述**: 提交题目答案

```typescript
async submitResponse(
  sessionId: string,
  itemId: string,
  response: any
): Promise<{
  nextItem?: TestItem
  abilityEstimate: number
  standardError: number
  continueTest: boolean
}>
```

##### `getAbilityEstimate()`

**描述**: 获取当前能力评估

```typescript
getAbilityEstimate(sessionId: string): {
  ability: number                      // theta值
  standardError: number               // 标准误差
  reliability: number                 // 可靠性 (0-1)
  confidenceInterval: [number, number] // 置信区间
}
```

#### 测试配置

```typescript
interface TestConfiguration {
  subject_domain: string;
  test_purpose: "diagnostic" | "formative" | "summative" | "placement";
  min_items: number;
  max_items: number;
  target_precision: number; // 0-1
  stopping_criteria: StoppingCriteria;
}
```

---

## 🔍 **Knowledge State Modeling API**

### `KnowledgeStateModel` 类

#### 核心方法

##### `updateKnowledgeState()`

**描述**: 更新知识状态

```typescript
async updateKnowledgeState(
  evidence: EvidenceSource[],
  timestamp: string
): Promise<KnowledgeState>
```

##### `predictMastery()`

**描述**: 预测概念掌握度

```typescript
predictMastery(
  conceptId: string,
  timeframe: string
): MasteryPrediction
```

##### `identifyKnowledgeGaps()`

**描述**: 识别知识差距

```typescript
identifyKnowledgeGaps(): KnowledgeGap[]
```

#### 知识状态结构

```typescript
interface KnowledgeState {
  timestamp: string;
  concept_masteries: ConceptMastery[];
  overall_proficiency: number; // 0-100
  knowledge_gaps: KnowledgeGap[];
  strength_areas: string[];
  learning_readiness: LearningReadiness[];
}
```

---

## 🔧 **Utility Functions**

### 学习风格检测

```typescript
// 检测学习风格 (VARK模型)
detectLearningStyle(
  interactions: UserInteraction[]
): {
  style: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
  confidence: number
  breakdown: VARKBreakdown
}
```

### 认知负荷监控

```typescript
// 监控认知负荷
monitorCognitiveLoad(
  responseTime: number,
  errorRate: number,
  taskComplexity: number
): CognitiveLoadMetrics
```

### 智能提示生成

```typescript
// 生成个性化提示
generateSmartPrompt(
  context: LearningContext,
  userProfile: UserProfile,
  objective: string
): string
```

---

## 📈 **数据类型参考**

### 核心数据结构

#### `LearningInsight`

```typescript
interface LearningInsight {
  insight_id: string;
  insight_type: "behavior" | "performance" | "pattern" | "prediction";
  title: string;
  description: string;
  significance_score: number; // 0-100
  confidence_level: number; // 0-1
  evidence: InsightEvidence[];
  actionable_items: string[];
  generated_at: string;
}
```

#### `LearningPrediction`

```typescript
interface LearningPrediction {
  prediction_id: string;
  prediction_type: "performance" | "behavior" | "outcome" | "risk";
  target_metric: string;
  predicted_value: number;
  confidence_interval: [number, number];
  probability: number; // 0-1
  timeframe: string;
  factors: PredictionFactor[];
  uncertainty_sources: string[];
  generated_at: string;
}
```

#### `CognitiveLoadMetrics`

```typescript
interface CognitiveLoadMetrics {
  current_metrics: {
    intrinsic_load: number; // 0-100
    extraneous_load: number; // 0-100
    germane_load: number; // 0-100
    response_delay: number; // 秒
    error_rate: number; // 0-1
    help_requests: number;
  };
  session_metrics: {
    total_cognitive_load: number; // 0-100
    peak_load: number; // 0-100
    average_load: number; // 0-100
    load_trend: "increasing" | "stable" | "decreasing";
  };
  recommendations: string[];
}
```

---

## 🚨 **错误处理**

### 常见错误代码

| 错误代码        | 描述             | 解决方案                |
| --------------- | ---------------- | ----------------------- |
| `AI_001`        | AI 服务不可用    | 检查网络连接和 API 密钥 |
| `ANALYTICS_001` | 分析数据不足     | 需要更多交互数据        |
| `PATTERN_001`   | 模式识别失败     | 数据质量不足或噪音过多  |
| `TEST_001`      | 测试配置无效     | 检查测试参数设置        |
| `KNOWLEDGE_001` | 知识状态更新失败 | 证据数据格式错误        |

### 错误处理示例

```typescript
try {
  const analysis = await analyticsEngine.analyzeUserBehavior(
    messages,
    behaviorData,
    cognitiveMetrics
  );
} catch (error) {
  if (error.code === "ANALYTICS_001") {
    console.log("需要更多数据进行分析");
  } else {
    console.error("分析过程中发生错误:", error.message);
  }
}
```

---

## 🔗 **API 集成示例**

### 完整工作流程

```typescript
import { useEnhancedAI, useAdvancedLearningAnalytics } from "path/to/hooks";

function LearningDashboard() {
  // 1. 初始化AI助手
  const aiAssistant = useEnhancedAI({
    mode: "guided_tutor",
    assistantType: "stem",
    personalization: { learningStyle: "adaptive" },
  });

  // 2. 初始化分析系统
  const analytics = useAdvancedLearningAnalytics();

  // 3. 开始学习会话
  const startLearningSession = async () => {
    analytics.startAnalysis();

    // 发送消息到AI
    await aiAssistant.sendMessage("帮我理解微积分的基本概念");

    // 获取分析结果
    const insights = analytics.insights;
    const predictions = analytics.predictions;

    // 生成报告
    const report = analytics.generateReport();
  };

  return (
    <div>
      {/* AI聊天界面 */}
      <AIChat {...aiAssistant} />

      {/* 分析仪表板 */}
      <AnalyticsDashboard {...analytics} />
    </div>
  );
}
```

---

## 📞 **技术支持**

如有 API 使用问题，请联系：

- 📧 Email: api-support@eza-learning.com
- 📖 文档: [https://docs.eza-learning.com](https://docs.eza-learning.com)
- 💬 Discord: [EzA Developer Community](https://discord.gg/eza-dev)

---

_最后更新: 2024 年 1 月_
