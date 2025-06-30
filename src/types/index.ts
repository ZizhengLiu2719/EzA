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
  title: string
  description?: string
  type: 'reading' | 'writing' | 'assignment' | 'exam' | 'quiz' | 'project' | 'presentation'
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  estimated_hours: number
  actual_hours?: number
  weight?: number // 占课程总分的百分比
  created_at: string
  updated_at: string
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

// AI 助手配置类型
export interface AIAssistantConfig {
  mode: 'bullet_tutor' | 'socratic_bot' | 'quick_fix' | 'diagram_ai'
  model?: 'gpt-3.5-turbo' | 'gpt-4o'
  writing_style?: 'academic' | 'creative' | 'technical'
  citation_format?: 'mla' | 'apa' | 'chicago'
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
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
  aiModel: 'gpt-3.5-turbo' | 'gpt-4o'
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

