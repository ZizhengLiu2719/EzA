// Enhanced AI System Type Definitions

// 学习风格枚举
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'mixed'

// 认知负荷等级
export type CognitiveLoadLevel = 'low' | 'optimal' | 'high' | 'overload'

// 学习状态
export type LearningState = 'focused' | 'distracted' | 'confused' | 'confident' | 'frustrated' | 'motivated'

// 增强版AI助手配置
export interface EnhancedAIConfig {
  // 动态模式配置
  mode: {
    primary: 'socratic' | 'guided' | 'direct' | 'visual' | 'collaborative'
    intensity: number // 0-100, 教学强度
    adaptation_speed: 'slow' | 'medium' | 'fast' // 适应速度
  }
  
  // 个性化配置
  personalization: {
    learning_style: LearningStyle
    confidence_level: number // 0-100
    preferred_complexity: 'simple' | 'moderate' | 'complex'
    response_length: 'brief' | 'detailed' | 'adaptive'
  }
  
  // 认知负荷管理
  cognitive_load: {
    current_level: CognitiveLoadLevel
    target_level: CognitiveLoadLevel
    auto_adjustment: boolean
  }
  
  // 上下文感知
  context: {
    subject_domain: string
    current_task_type?: string
    session_duration: number // 当前会话时长(分钟)
    recent_performance: 'poor' | 'average' | 'good' | 'excellent'
  }
  
  // 技术配置
  technical: {
    model: 'gpt-4o-mini' | 'o4-mini-high' | 'gpt-4o'
    temperature: number
    max_tokens: number
    response_format: 'conversational' | 'structured' | 'visual'
  }
}

// 学习行为分析数据
export interface LearningBehaviorData {
  user_id: string
  session_id: string
  
  // 交互模式
  interaction_patterns: {
    average_response_time: number // 平均回复时间(秒)
    message_length_preference: number // 偏好的消息长度
    question_asking_frequency: number // 提问频率
    help_seeking_pattern: 'independent' | 'frequent' | 'reluctant'
  }
  
  // 学习表现
  performance_metrics: {
    task_completion_rate: number // 0-100
    error_frequency: number
    improvement_velocity: number // 学习速度
    retention_rate: number // 知识保持率
  }
  
  // 偏好分析
  preferences: {
    preferred_explanation_style: 'examples' | 'theory' | 'visual' | 'step_by_step'
    feedback_preference: 'immediate' | 'delayed' | 'summary'
    challenge_level: 'conservative' | 'moderate' | 'aggressive'
  }
  
  timestamp: string
}

// 认知负荷监控数据
export interface CognitiveLoadMetrics {
  user_id: string
  session_id: string
  
  // 实时指标
  current_metrics: {
    response_delay: number // 响应延迟(秒)
    error_rate: number // 错误率
    help_requests: number // 求助次数
    task_switching_frequency: number // 任务切换频率
  }
  
  // 累积指标
  session_metrics: {
    total_cognitive_load: number // 0-100
    peak_load_points: number[] // 负荷峰值时间点
    recovery_periods: number[] // 恢复期时间点
    overall_efficiency: number // 0-100
  }
  
  // 生理指标(如果可用)
  physiological?: {
    estimated_attention_level: number // 0-100
    fatigue_indicator: number // 0-100
  }
  
  timestamp: string
}

// 智能提示词模板
export interface SmartPromptTemplate {
  id: string
  name: string
  category: 'socratic' | 'guided' | 'direct' | 'visual' | 'collaborative'
  
  // 基础模板
  base_template: string
  
  // 个性化变量
  personalization_variables: {
    learning_style_adaptations: Record<LearningStyle, string>
    cognitive_load_adaptations: Record<CognitiveLoadLevel, string>
    confidence_level_adaptations: Record<string, string>
  }
  
  // 条件逻辑
  conditional_logic: {
    if_confused: string
    if_confident: string
    if_frustrated: string
    if_time_pressure: string
  }
  
  // 元数据
  metadata: {
    educational_principles: string[] // 基于的教育原理
    target_cognitive_load: CognitiveLoadLevel
    estimated_effectiveness: number // 0-100
  }
}

// AI会话增强数据
export interface EnhancedAIConversation {
  id: string
  user_id: string
  task_id?: string
  assistant_type: 'writing' | 'stem' | 'reading' | 'programming' | 'research' | 'critical_thinking'
  
  // 增强字段
  learning_objectives: string[]
  personalization_profile: LearningBehaviorData
  cognitive_load_history: CognitiveLoadMetrics[]
  adaptation_log: Array<{
    timestamp: string
    reason: string
    old_config: Partial<EnhancedAIConfig>
    new_config: Partial<EnhancedAIConfig>
    effectiveness_score?: number
  }>
  
  created_at: string
  updated_at: string
}

// AI响应增强数据
export interface EnhancedAIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  
  // 增强字段
  educational_metadata?: {
    teaching_method_used: string
    cognitive_load_level: CognitiveLoadLevel
    personalization_applied: string[]
    learning_objectives_addressed: string[]
  }
  
  // 分析数据
  analytics?: {
    generation_config: Partial<EnhancedAIConfig>
    prompt_template_used: string
    response_quality_score: number // 0-100
    estimated_effectiveness: number // 0-100
  }
  
  timestamp: string
}

// 学习分析结果
export interface LearningAnalytics {
  user_id: string
  analysis_period: {
    start_date: string
    end_date: string
  }
  
  // 学习风格分析
  learning_style_analysis: {
    detected_style: LearningStyle
    confidence_score: number // 0-100
    style_distribution: Record<LearningStyle, number>
    recommendation: string
  }
  
  // 认知模式分析
  cognitive_patterns: {
    optimal_session_length: number // 分钟
    best_performance_times: string[] // 时间段
    cognitive_load_trends: Array<{
      date: string
      average_load: number
      peak_load: number
      efficiency: number
    }>
  }
  
  // 学习进度分析
  progress_analysis: {
    skill_improvements: Array<{
      skill: string
      improvement_rate: number
      current_level: number
    }>
    learning_velocity: number
    retention_patterns: Record<string, number>
  }
  
  // 个性化建议
  recommendations: {
    teaching_method_adjustments: string[]
    cognitive_load_management: string[]
    learning_strategy_suggestions: string[]
    technology_optimizations: string[]
  }
  
  generated_at: string
} 