/**
 * FSRS-5 间隔重复算法类型定义
 * Free Spaced Repetition Scheduler - Version 5
 */

// FSRS-5 卡片状态枚举
export enum FSRSState {
  NEW = 0,        // 新卡片
  LEARNING = 1,   // 学习中
  REVIEW = 2,     // 复习中
  RELEARNING = 3  // 重新学习
}

// 复习评级 (基于Anki的评级系统)
export enum ReviewRating {
  AGAIN = 1,      // 忘记了，需要重新学习
  HARD = 2,       // 困难，勉强想起来
  GOOD = 3,       // 良好，正常想起来
  EASY = 4        // 简单，很容易想起来
}

// FSRS-5 参数配置
export interface FSRSParameters {
  // 学习阶段参数
  w0: number;     // 初始难度权重
  w1: number;     // 难度增长权重
  w2: number;     // 稳定性基础权重
  w3: number;     // 稳定性增长权重
  w4: number;     // 遗忘权重
  w5: number;     // 记忆权重
  w6: number;     // 重新学习权重
  w7: number;     // 错误回忆权重
  w8: number;     // 正确回忆权重
  w9: number;     // 检索成功权重
  w10: number;    // 检索失败权重
  w11: number;    // 记忆强度权重
  w12: number;    // 记忆衰减权重
  w13: number;    // 上下文权重
  w14: number;    // 间隔影响权重
  w15: number;    // 难度修正权重
  w16: number;    // 稳定性修正权重
  
  // 算法参数
  requestRetention: number;  // 目标记忆保持率 (0.9 = 90%)
  maximumInterval: number;   // 最大复习间隔(天)
  easyBonus: number;        // 简单评级加成
  hardInterval: number;     // 困难评级间隔因子
  newInterval: number;      // 新卡片初始间隔
  graduatingInterval: number; // 毕业间隔
  easyInterval: number;     // 简单间隔
  
  // 学习步骤 (分钟)
  learningSteps: number[];  // [1, 10, 1440] = 1分钟, 10分钟, 1天
  relearningSteps: number[]; // [10, 1440] = 10分钟, 1天
}

// 卡片复习记录
export interface ReviewLog {
  id: string;
  cardId: string;
  rating: ReviewRating;
  state: FSRSState;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  review: Date;
  duration?: number; // 答题用时(毫秒)
}

// FSRS-5 卡片数据
export interface FSRSCard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
  
  // FSRS-5 核心属性
  due: Date;                 // 下次复习时间
  stability: number;         // 记忆稳定性 (天)
  difficulty: number;        // 卡片难度 (0-10)
  elapsed_days: number;      // 距离上次复习天数
  scheduled_days: number;    // 预定复习间隔
  reps: number;             // 复习次数
  lapses: number;           // 忘记次数
  state: FSRSState;         // 当前状态
  last_review?: Date;       // 上次复习时间
  
  // 学习统计
  total_time: number;       // 总学习时间(秒)
  average_time: number;     // 平均答题时间(秒)
  success_rate: number;     // 成功率 (0-1)
  
  // 元数据
  created_at: Date;
  updated_at: Date;
  tags?: string[];
  subject?: string;
}

// 复习会话结果
export interface ReviewSession {
  id: string;
  user_id: string;
  set_id: string;
  mode: 'flashcard' | 'learn' | 'test' | 'match' | 'gravity' | 'ai-tutor';
  
  // 会话统计
  cards_reviewed: number;
  total_time: number;       // 总时间(秒)
  accuracy: number;         // 准确率 (0-1)
  
  // 评级分布
  again_count: number;
  hard_count: number;
  good_count: number;
  easy_count: number;
  
  // 会话数据
  reviews: ReviewLog[];
  
  // 时间戳
  started_at: Date;
  ended_at: Date;
  created_at: Date;
}

// 学习统计和分析
export interface LearningStats {
  // 基础统计
  total_cards: number;
  new_cards: number;
  learning_cards: number;
  review_cards: number;
  
  // 复习统计
  reviews_today: number;
  reviews_this_week: number;
  reviews_this_month: number;
  
  // 掌握度统计
  average_stability: number;
  average_difficulty: number;
  average_success_rate: number;
  
  // 时间统计
  time_studied_today: number;    // 分钟
  time_studied_this_week: number;
  time_studied_this_month: number;
  
  // 预测数据
  cards_due_today: number;
  cards_due_tomorrow: number;
  cards_due_this_week: number;
  
  // 保持率预测
  retention_rate: {
    one_day: number;
    one_week: number;
    one_month: number;
    three_months: number;
  };
}

// SRS调度器配置
export interface SRSSchedulerConfig {
  daily_new_cards: number;      // 每日新卡片数量
  daily_review_cards: number;   // 每日复习卡片数量
  auto_advance: boolean;        // 自动推进学习
  show_answer_timer: boolean;   // 显示答案计时器
  bury_related: boolean;        // 埋葬相关卡片
  learn_ahead_limit: number;    // 提前学习限制(分钟)
}

// 复习结果回调类型
export type ReviewCallback = (
  card: FSRSCard,
  rating: ReviewRating,
  reviewTime: number
) => Promise<void>;

// SRS Hook 返回值
export interface UseSpacedRepetitionReturn {
  // 当前学习数据
  currentCard: FSRSCard | null;
  remainingCards: number;
  sessionStats: Partial<ReviewSession>;
  
  // 学习控制
  submitReview: (rating: ReviewRating, duration?: number) => Promise<void>;
  skipCard: () => void;
  endSession: () => Promise<ReviewSession>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  
  // 统计数据
  learningStats: LearningStats;
  
  // 配置
  parameters: FSRSParameters;
  updateParameters: (newParams: Partial<FSRSParameters>) => void;
}

// 默认FSRS-5参数 (基于最新研究优化)
export const DEFAULT_FSRS_PARAMETERS: FSRSParameters = {
  // FSRS-5.0 最新参数
  w0: 0.4072,
  w1: 1.1829,
  w2: 3.1262,
  w3: 15.4722,
  w4: 7.2102,
  w5: 0.5316,
  w6: 1.0651,
  w7: 0.0234,
  w8: 1.616,
  w9: 0.1544,
  w10: 1.0824,
  w11: 1.9813,
  w12: 0.0953,
  w13: 0.2975,
  w14: 2.2042,
  w15: 0.2407,
  w16: 2.9466,
  
  // 记忆目标
  requestRetention: 0.9,
  maximumInterval: 36500, // 100年
  
  // 评级参数
  easyBonus: 1.3,
  hardInterval: 1.2,
  newInterval: 0.0,
  graduatingInterval: 1.0,
  easyInterval: 4.0,
  
  // 学习步骤 (分钟)
  learningSteps: [1, 10],
  relearningSteps: [10]
};

// 默认调度器配置
export const DEFAULT_SRS_CONFIG: SRSSchedulerConfig = {
  daily_new_cards: 20,
  daily_review_cards: 200,
  auto_advance: false,
  show_answer_timer: true,
  bury_related: false,
  learn_ahead_limit: 20
}; 