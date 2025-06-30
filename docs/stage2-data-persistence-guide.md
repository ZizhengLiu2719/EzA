# 阶段 2: 数据持久化与 Supabase 集成 📖

## 🎯 概述

阶段 2 成功实现了 EzA AI 学习助手平台的完整数据持久化层，建立了基于 Supabase 的现代数据管理系统，支持 FSRS-5 间隔重复算法、实时数据同步和离线优先架构。

## 🏗️ 架构组件

### 1. 数据库 Schema (database/migrations/)

#### `002_learning_system.sql` - 核心学习系统表

- **flashcard_sets**: 闪卡集合管理
- **flashcards**: 支持 FSRS-5 算法的智能闪卡
- **study_sessions**: 详细的学习会话记录
- **review_logs**: 每次复习的完整日志
- **review_analytics**: 聚合分析数据
- **fsrs_parameters**: 个性化算法参数

#### `003_stored_procedures.sql` - 高级数据库函数

- **submit_card_review_transaction()**: 原子性复习记录
- **get_user_study_stats()**: 用户学习统计
- **optimize_fsrs_parameters()**: 自动参数优化
- **update_review_analytics()**: 分析数据更新
- **get_study_recommendations()**: 智能学习建议

### 2. API 数据访问层 (src/api/)

#### `flashcards.ts` - 闪卡 CRUD 操作

```typescript
// 主要功能
- getFlashcardSets(): 获取用户闪卡集合
- createFlashcardSet(): 创建新集合
- submitCardReview(): FSRS算法复习记录
- getDueFlashcards(): 获取待复习卡片
- getUserFSRSParameters(): 个性化参数管理
```

#### `studySessions.ts` - 学习会话管理

```typescript
// 核心功能
- createStudySession(): 开始学习会话
- updateStudySession(): 实时会话更新
- getStudyAnalytics(): 学习分析数据
- getWeeklyStudyStats(): 周统计数据
- calculateStudyStreak(): 连续学习天数
```

### 3. React Hooks 层 (src/hooks/)

#### `useFlashcardSets.ts` - 闪卡集合状态管理

```typescript
const {
  sets, // 闪卡集合列表
  statistics, // 统计数据
  createSet, // 创建集合
  updateSet, // 更新集合
  deleteSet, // 删除集合
  isLoading, // 加载状态
} = useFlashcardSets();
```

#### `useStudyProgress.ts` - 学习进度追踪

```typescript
const {
  session, // 当前会话
  sessionStats, // 实时统计
  startSession, // 开始会话
  recordCardReview, // 记录复习
  completeSession, // 完成会话
} = useActiveStudySession();
```

#### `useRealtimeSync.ts` - 实时数据同步

```typescript
const {
  connectionState, // 连接状态
  subscribe, // 订阅实时更新
  addToSyncQueue, // 离线队列
} = useRealtimeSync();
```

## 🚀 核心特性

### 1. FSRS-5 间隔重复算法集成

- **智能调度**: 基于记忆强度的复习间隔
- **个性化参数**: 17 个可调节的算法参数
- **自动优化**: 根据表现自动调整参数
- **学习状态跟踪**: NEW → LEARNING → REVIEW → RELEARNING

### 2. 实时数据同步

- **Supabase Realtime**: 多设备数据同步
- **离线优先**: 断网时本地操作，联网后自动同步
- **冲突解决**: 智能处理数据冲突
- **状态指示器**: 实时连接状态显示

### 3. 深度学习分析

- **保留率追踪**: 1 天/7 天/30 天记忆保留
- **学习速度**: 每小时掌握卡片数
- **弱点识别**: 困难卡片自动标记
- **趋势分析**: 学习表现趋势监控

### 4. 会话管理系统

- **多模式支持**: flashcard, learn, test, gravity, ai-tutor
- **实时统计**: 准确率、响应时间、连击数
- **暂停恢复**: 会话状态保存
- **详细日志**: 每次操作完整记录

## 📊 数据流架构

```
用户界面 (React Components)
     ↓
React Hooks (useFlashcardSets, useStudyProgress)
     ↓
API Layer (flashcards.ts, studySessions.ts)
     ↓
Supabase Client (实时同步 + 离线缓存)
     ↓
PostgreSQL Database (FSRS算法 + 分析存储)
```

## 🔧 使用示例

### 基础闪卡集合操作

```typescript
import { useFlashcardSets } from "../hooks";

function FlashcardManager() {
  const { sets, createSet, isLoading } = useFlashcardSets();

  const handleCreateSet = async () => {
    await createSet({
      title: "新的学习集合",
      subject: "数学",
      difficulty: 3,
      tags: ["代数", "基础"],
    });
  };

  if (isLoading) return <div>加载中...</div>;

  return (
    <div>
      {sets.map((set) => (
        <div key={set.id}>
          <h3>{set.title}</h3>
          <p>{set.card_count} 张卡片</p>
          <p>掌握度: {Math.round(set.mastery_level * 100)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### 学习会话管理

```typescript
import { useActiveStudySession } from "../hooks";

function StudySession({ setId }: { setId: string }) {
  const {
    session,
    sessionStats,
    startSession,
    recordCardReview,
    completeSession,
  } = useActiveStudySession();

  const handleStartStudy = async () => {
    await startSession({
      set_id: setId,
      mode: "flashcard",
      config: { maxCards: 20 },
    });
  };

  const handleCardAnswer = async (rating: ReviewRating) => {
    await recordCardReview(currentCard, rating, responseTime);
  };

  return (
    <div>
      {!session ? (
        <button onClick={handleStartStudy}>开始学习</button>
      ) : (
        <div>
          <p>已学习: {sessionStats?.cardsStudied} 张</p>
          <p>准确率: {Math.round((sessionStats?.accuracy || 0) * 100)}%</p>
          {/* 复习界面 */}
        </div>
      )}
    </div>
  );
}
```

### 实时同步设置

```typescript
import { useRealtimeFlashcardSets, useConnectionStatus } from "../hooks";

function RealtimeDemo({ userId }: { userId: string }) {
  // 自动启用实时同步
  useRealtimeFlashcardSets(userId);

  const connectionStatus = useConnectionStatus();

  return (
    <div
      className={`status ${connectionStatus.isOnline ? "online" : "offline"}`}
    >
      {connectionStatus.isOnline ? "🟢 已连接" : "🔴 离线模式"}
    </div>
  );
}
```

## 🛠️ 配置要求

### 1. 环境变量

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 依赖包

```json
{
  "@tanstack/react-query": "^4.x",
  "@supabase/supabase-js": "^2.x"
}
```

### 3. 应用程序包装器

```typescript
// App.tsx
import { QueryProvider } from "./providers/QueryProvider";

function App() {
  return <QueryProvider>{/* 你的应用组件 */}</QueryProvider>;
}
```

## 📈 性能优化

### 1. 智能缓存策略

- **查询缓存**: 5 分钟 staleTime, 10 分钟 gcTime
- **乐观更新**: 立即 UI 反馈，后台同步
- **预取策略**: 提前加载相关数据

### 2. 离线优先设计

- **本地存储**: IndexedDB 缓存重要数据
- **同步队列**: 离线操作自动排队
- **冲突解决**: 最后修改获胜策略

### 3. 数据库优化

- **复合索引**: 优化查询性能
- **存储过程**: 减少网络往返
- **分页加载**: 大数据集分批处理

## 🔮 下一步发展

### 阶段 3: AI 智能功能增强

- GPT-4 集成的智能问答生成
- 个性化学习路径推荐
- 自然语言处理的内容分析

### 阶段 4: 数据可视化仪表板

- 学习进度可视化图表
- 知识掌握热力图
- 预测性学习分析

### 阶段 5: 协作与分享功能

- 学习小组协作
- 公共卡片库
- 社区驱动内容

## 🎉 总结

阶段 2 的数据持久化系统为 EzA 平台奠定了坚实的数据基础：

✅ **完整的 FSRS-5 算法实现** - 科学的间隔重复学习  
✅ **实时数据同步** - 多设备无缝体验  
✅ **离线优先架构** - 随时随地学习  
✅ **深度学习分析** - 数据驱动的学习洞察  
✅ **类型安全的 API** - 可靠的开发体验  
✅ **可扩展的架构** - 为未来功能做好准备

现在可以开始阶段 3 的 AI 功能开发，或优先实现数据可视化功能。数据基础已经完全就绪！
