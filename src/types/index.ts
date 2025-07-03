// 用户相关类型
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// 课程相关类型
export interface Course {
  id: string
  user_id: string
  name: string
  semester: string
  year: number
  description?: string
  grading_policy?: string
  created_at: string
  updated_at: string
}

// 课程材料类型
export interface CourseMaterial {
  id: string
  course_id: string
  name: string
  type: 'syllabus' | 'textbook' | 'lecture_notes' | 'assignment' | 'other'
  file_url: string
  file_size: number
  extracted_text?: string
  created_at: string
}

// 任务类型
export interface Task {
  id: string
  course_id: string
  user_id: string
  title: string
  description: string
  type: 'reading' | 'writing' | 'assignment' | 'exam' | 'quiz' | 'project' | 'presentation'
  due_date: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  estimated_hours: number
  actual_hours?: number
  weight?: number // 占课程总分的百分比
  created_at: string
  updated_at: string
  scheduled_start_time?: string | null
  is_locked: boolean
}

// 子任务类型
export interface Subtask {
  id: string
  task_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  order: number
  estimated_hours: number
  created_at: string
}

// AI 对话类型
export interface AIConversation {
  id: string
  user_id: string
  task_id?: string
  assistant_type: 'writing' | 'stem' | 'reading' | 'programming'
  created_at: string
  updated_at: string
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// 复习卡片类型
export interface ReviewCard {
  id: string
  course_id: string
  question: string
  answer: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  mastery_level: number // 0-100
  last_reviewed?: string
  created_at: string
}

// 周报告类型
export interface WeeklyReport {
  id: string
  user_id: string
  week_start: string
  week_end: string
  tasks_completed: number
  total_tasks: number
  completion_rate: number
  study_hours: number
  procrastination_index: number
  focus_score: number
  recommendations: string[]
  created_at: string
}

// 学习统计类型
export interface StudyStats {
  total_courses: number
  active_tasks: number
  completed_tasks: number
  overdue_tasks: number
  total_study_hours: number
  average_completion_rate: number
}

// API 响应类型
export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

// 文件上传类型
export interface FileUpload {
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

// 课程解析结果类型
export interface CourseParseResult {
  course_name: string
  semester: string
  year: number
  tasks: Omit<Task, 'id' | 'course_id' | 'created_at' | 'updated_at'>[]
  grading_policy?: string
  course_description?: string
}

// 新增：学术版本类型
export type AcademicVersion = 'high_school' | 'college'

// 新增：AI模式ID类型
export type HighSchoolModeId = 
  | 'study_buddy' 
  | 'writing_mentor' 
  | 'math_tutor' 
  | 'science_guide' 
  | 'homework_helper'
  | 'test_prep_coach'  // 11-12年级解锁
  | 'research_assistant'  // 11-12年级解锁
  | 'academic_planner'  // 11-12年级解锁

export type CollegeModeId = 
  | 'academic_coach'
  | 'quick_clarifier' 
  | 'research_mentor'
  | 'collaboration_facilitator'
  | 'thesis_developer'
  | 'exam_strategist'
  | 'stem_specialist'
  | 'humanities_scholar'
  | 'social_science_analyst'
  | 'business_advisor'
  | 'creative_guide'
  | 'lab_mentor'
  // Review模块专用AI模式
  | 'flashcard_assistant'
  | 'memory_palace_guide'
  | 'exam_strategy_advisor'
  | 'knowledge_connector'

export type AIModeId = HighSchoolModeId | CollegeModeId

// 新增：AI模式配置接口
export interface AIModeConfig {
  id: AIModeId
  name: string
  description: string
  icon: string
  targetVersion: AcademicVersion | 'both'
  requiredGrade?: number  // 高中模式的年级要求 (9-12)
  subjectSpecialization?: string[]
  promptTemplate: string
  maxTokens: number
  responseStyle: 'friendly' | 'academic' | 'professional'
  example: string  // 使用示例
}

// 更新：AI助手配置类型
export interface AIAssistantConfig {
  mode: AIModeId
  academicVersion: AcademicVersion
  model?: 'gpt-4o-mini' | 'gpt-4o'
  writing_style?: 'academic' | 'creative' | 'technical'
  citation_format?: 'mla' | 'apa' | 'chicago'
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  userGrade?: number  // 用户年级 (9-12 for high school, 13-16 for college)
}

// 新增：用户学术档案
export interface UserAcademicProfile {
  id: string
  user_id: string
  academic_version: AcademicVersion
  grade?: number  // 9-12 for high school, 13-16 for college years
  major?: string  // college major
  gpa?: number
  preferred_citation_format: 'mla' | 'apa' | 'chicago'
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing'
  created_at: string
  updated_at: string
}

// 日历事件类型
export interface CalendarEvent {
  id: string
  task_id: string
  title: string
  start_time: string
  end_time: string
  description?: string
  location?: string
  calendar_type: 'google' | 'apple' | 'internal'
  external_id?: string
}

// 订阅计划类型
export type SubscriptionPlan = 'free' | 'pro' | 'elite'

// 订阅计划配置
export interface SubscriptionConfig {
  plan: SubscriptionPlan
  name: string
  price: number
  currency: string
  aiModel: 'gpt-4o-mini' | 'gpt-4o'
  monthlyConversations: number // -1 表示无限
  monthlyCourses: number // -1 表示无限
  features: string[]
  description: string
}

// 用户订阅信息
export interface UserSubscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: 'active' | 'cancelled' | 'expired'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// 使用统计
export interface UsageStats {
  monthly_conversations_used: number
  monthly_courses_used: number
  monthly_conversations_limit: number
  monthly_courses_limit: number
}

// 重新导出增强AI类型
export * from './ai-enhanced'

// 游戏化系统类型
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'study' | 'exam' | 'streak' | 'mastery' | 'social' | 'milestone'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary'
  points: number
  requirements: {
    type: 'cards_studied' | 'exam_score' | 'study_streak' | 'time_spent' | 'perfect_score' | 'improvement'
    target: number
    timeframe?: number // 天数，如果有时间限制
  }
  unlocked_at?: Date
  progress?: number // 0-1, 当前进度
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: Date
  progress: number // 0-1
}

export interface StudyStreak {
  id: string
  user_id: string
  current_streak: number // 连续天数
  longest_streak: number
  last_study_date: Date
  streak_milestones: {
    days: number
    achieved_at: Date
    reward_claimed: boolean
  }[]
}

export interface XPSystem {
  id: string
  user_id: string
  total_xp: number
  level: number
  xp_to_next_level: number
  recent_gains: {
    amount: number
    source: 'study_session' | 'exam_completion' | 'achievement' | 'streak_bonus'
    timestamp: Date
    description: string
  }[]
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  avatar?: string
  total_xp: number
  level: number
  current_streak: number
  achievements_count: number
  weekly_xp: number
  rank: number
}

export interface GameificationConfig {
  xp_rates: {
    card_correct: number
    card_difficult: number
    exam_completion: number
    perfect_exam: number
    daily_goal: number
    streak_bonus: number
  }
  level_thresholds: number[] // XP required for each level
  achievement_rewards: Record<string, number> // achievement_id -> xp_reward
}

export interface EnhancedAIConfig {
  // 智能模式设置
  auto_adjust_difficulty: boolean; // 根据学术等级自动调整难度
  adaptive_language: boolean; // 根据AI模式调整语言风格
  
  // 学术等级相关设置
  academic_level_config: {
    high_school: {
      max_complexity: 'basic' | 'intermediate';
      preferred_explanation_style: 'step_by_step' | 'visual' | 'analogy';
      vocabulary_level: 'grade_appropriate' | 'advanced';
    };
    college: {
      max_complexity: 'intermediate' | 'advanced' | 'expert';
      preferred_explanation_style: 'analytical' | 'research_based' | 'theoretical';
      vocabulary_level: 'academic' | 'professional' | 'technical';
    };
  };
  
  // AI模式特定设置
  mode_specific_config: {
    response_length: 'concise' | 'detailed' | 'comprehensive';
    interaction_style: 'tutorial' | 'conversational' | 'professional';
    feedback_frequency: 'minimal' | 'moderate' | 'extensive';
  };
  
  // 传统设置（保留但智能化）
  writing_style?: 'academic' | 'creative' | 'technical';
  citation_format?: 'apa' | 'mla' | 'chicago';
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  model?: 'gpt-4o-mini' | 'gpt-4o'
}

export interface SmartPromptCategory {
  id: string;
  name: string;
  icon: string;
  academic_versions: AcademicVersion[];
  compatible_modes: (HighSchoolModeId | CollegeModeId)[];
  prompts: SmartPrompt[];
}

export interface SmartPrompt {
  id: string;
  title: string;
  description: string;
  academic_version: AcademicVersion;
  target_modes: (HighSchoolModeId | CollegeModeId)[];
  prompt_template: string;
  variables?: string[]; // 可替换的变量如 {subject}, {difficulty}
  examples?: string[];
}

export interface SolutionStep {
  title: string
  step: string
}

export interface Visual {
  type: 'plot'
  imageUrl: string
}

export interface Solution {
  steps: SolutionStep[]
  visuals: Visual[]
}

