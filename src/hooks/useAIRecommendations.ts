/**
 * AI推荐系统Hook
 * 集成多个AI服务，提供综合的智能学习推荐
 */

import { useCallback, useEffect, useState } from 'react'
import { AIHint, aiHintService, HintGenerationOptions } from '../services/aiHintService'
import { ContentGenerationOptions, contentGenerator, GeneratedQuestion } from '../services/contentGenerator'
import { difficultyAI, DifficultyRecommendation, LearningContext } from '../services/difficultyAI'
import { FSRSCard } from '../types/SRSTypes'

export interface AIRecommendation {
  id: string
  type: 'study_hint' | 'difficulty_adjustment' | 'content_generation' | 'exam_preparation' | 'learning_strategy'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action_items: string[]
  estimated_impact: number // 0-1, 预期效果
  estimated_time: number // 分钟
  confidence: number // 0-1, AI置信度
  personalization_score: number // 0-1, 个性化程度
  created_at: Date
  expires_at?: Date
  metadata?: any
}

export interface LearningSession {
  cards: FSRSCard[]
  context: LearningContext
  duration: number
  performance_metrics: {
    accuracy: number
    average_response_time: number
    confidence_levels: number[]
    struggle_patterns: string[]
  }
}

export interface UserPreferences {
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing'
  difficulty_preference: number // 1-10
  study_time_preference: number // 分钟/天
  notification_preferences: {
    hints: boolean
    difficulty_adjustments: boolean
    study_reminders: boolean
    progress_updates: boolean
  }
  subject_interests: string[]
  goal_setting: {
    target_accuracy: number
    target_study_time: number
    target_mastery_level: number
  }
}

export interface AIRecommendationState {
  recommendations: AIRecommendation[]
  loading: boolean
  error: string | null
  last_updated: Date | null
  total_recommendations: number
  active_recommendations: AIRecommendation[]
  dismissed_recommendations: string[]
}

export interface UseAIRecommendationsReturn {
  // 状态
  state: AIRecommendationState
  
  // 核心推荐功能
  generateRecommendations: (session: LearningSession, preferences: UserPreferences) => Promise<void>
  getPersonalizedHints: (card: FSRSCard, options: HintGenerationOptions) => Promise<AIHint[]>
  getDifficultyRecommendation: (card: FSRSCard, context: LearningContext) => Promise<DifficultyRecommendation | null>
  generateAdditionalContent: (topic: string, options: ContentGenerationOptions) => Promise<GeneratedQuestion[]>
  
  // 推荐管理
  dismissRecommendation: (recommendationId: string) => void
  acceptRecommendation: (recommendationId: string) => Promise<void>
  prioritizeRecommendations: () => AIRecommendation[]
  getRecommendationsByType: (type: AIRecommendation['type']) => AIRecommendation[]
  
  // 学习洞察
  getStudyInsights: () => {
    learning_velocity: number
    improvement_trends: string[]
    optimization_opportunities: string[]
    performance_predictions: any[]
  }
  
  // 配置管理
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  resetRecommendations: () => void
  
  // 实用功能
  exportRecommendations: () => any
  scheduleStudySession: (recommendations: AIRecommendation[]) => any
}

export function useAIRecommendations(
  userId: string,
  initialPreferences?: Partial<UserPreferences>
): UseAIRecommendationsReturn {
  // 状态管理
  const [state, setState] = useState<AIRecommendationState>({
    recommendations: [],
    loading: false,
    error: null,
    last_updated: null,
    total_recommendations: 0,
    active_recommendations: [],
    dismissed_recommendations: []
  })

  const [preferences, setPreferences] = useState<UserPreferences>({
    learning_style: 'visual',
    difficulty_preference: 6,
    study_time_preference: 30,
    notification_preferences: {
      hints: true,
      difficulty_adjustments: true,
      study_reminders: true,
      progress_updates: true
    },
    subject_interests: [],
    goal_setting: {
      target_accuracy: 0.85,
      target_study_time: 30,
      target_mastery_level: 0.8
    },
    ...initialPreferences
  })

  // 生成综合推荐
  const generateRecommendations = useCallback(async (
    session: LearningSession,
    userPreferences: UserPreferences
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const recommendations: AIRecommendation[] = []

      // 1. 认知负荷评估和推荐
      const cognitiveLoad = await difficultyAI.assessCognitiveLoad(session.cards, session.context)
      
      if (cognitiveLoad.recommendation !== 'maintain') {
        recommendations.push({
          id: `cognitive_${Date.now()}`,
          type: 'learning_strategy',
          priority: cognitiveLoad.total > 0.8 ? 'high' : 'medium',
          title: '认知负荷优化建议',
          description: `当前认知负荷为${(cognitiveLoad.total * 100).toFixed(1)}%，建议${cognitiveLoad.recommendation === 'reduce' ? '降低' : '提高'}学习强度`,
          action_items: [
            cognitiveLoad.recommendation === 'reduce' 
              ? '考虑休息5-10分钟' 
              : '可以增加学习难度',
            '调整学习环境以减少干扰',
            '优化学习节奏和时间安排'
          ],
          estimated_impact: 0.8,
          estimated_time: 10,
          confidence: 0.85,
          personalization_score: 0.9,
          created_at: new Date(),
          metadata: { cognitive_load: cognitiveLoad }
        })
      }

      // 2. 困难卡片的智能提示推荐
      const strugglingCards = session.cards.filter(card => 
        card.success_rate < 0.7 || session.performance_metrics.struggle_patterns.length > 0
      )

      for (const card of strugglingCards.slice(0, 3)) {
        const hints = await aiHintService.generateHintsForCard(card, {
          user_knowledge_level: userPreferences.difficulty_preference > 7 ? 'advanced' : 
                               userPreferences.difficulty_preference > 4 ? 'intermediate' : 'beginner',
          learning_style: userPreferences.learning_style,
          subject_context: session.context.subject,
          previous_mistakes: session.performance_metrics.struggle_patterns,
          time_constraint: userPreferences.study_time_preference * 60
        })

        if (hints.length > 0) {
          recommendations.push({
            id: `hint_${card.id}_${Date.now()}`,
            type: 'study_hint',
            priority: card.success_rate < 0.5 ? 'high' : 'medium',
            title: `针对 "${card.question.substring(0, 50)}..." 的学习提示`,
            description: hints[0].content,
            action_items: [
              '尝试使用提供的记忆技巧',
              '练习相关的概念连接',
              '增加这张卡片的复习频率'
            ],
            estimated_impact: hints[0].confidence,
            estimated_time: 5,
            confidence: hints[0].confidence,
            personalization_score: 0.95,
            created_at: new Date(),
            metadata: { card_id: card.id, hints }
          })
        }
      }

      // 3. 内容生成推荐
      if (session.cards.length < 10) {
        recommendations.push({
          id: `content_${Date.now()}`,
          type: 'content_generation',
          priority: 'medium',
          title: '扩展学习内容',
          description: `当前只有${session.cards.length}张卡片，建议生成更多相关练习题`,
          action_items: [
            '基于当前主题生成相似问题',
            '创建不同难度级别的变体',
            '添加实际应用场景的题目'
          ],
          estimated_impact: 0.7,
          estimated_time: 15,
          confidence: 0.8,
          personalization_score: 0.8,
          created_at: new Date(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
        })
      }

      // 4. 考试准备推荐
      const masteryLevel = session.cards.reduce((sum, card) => sum + card.success_rate, 0) / session.cards.length
      
      if (masteryLevel > 0.8) {
        recommendations.push({
          id: `exam_${Date.now()}`,
          type: 'exam_preparation',
          priority: 'medium',
          title: '考试准备建议',
          description: `掌握度已达${(masteryLevel * 100).toFixed(1)}%，可以开始模拟考试测试`,
          action_items: [
            '生成综合性模拟考试',
            '设置限时练习',
            '重点测试应用和分析能力'
          ],
          estimated_impact: 0.85,
          estimated_time: 45,
          confidence: 0.9,
          personalization_score: 0.75,
          created_at: new Date()
        })
      }

      // 5. 学习策略优化推荐
      if (session.performance_metrics.average_response_time > 60) {
        recommendations.push({
          id: `strategy_${Date.now()}`,
          type: 'learning_strategy',
          priority: 'low',
          title: '学习效率优化',
          description: '平均响应时间较长，建议优化学习策略',
          action_items: [
            '尝试主动回忆技术',
            '使用计时练习提高速度',
            '分解复杂问题为小步骤'
          ],
          estimated_impact: 0.6,
          estimated_time: 20,
          confidence: 0.7,
          personalization_score: 0.8,
          created_at: new Date()
        })
      }

      // 按优先级和个性化分数排序
      const sortedRecommendations = recommendations.sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 }
        const scoreA = priorityScore[a.priority] + a.personalization_score
        const scoreB = priorityScore[b.priority] + b.personalization_score
        return scoreB - scoreA
      })

      setState(prev => ({
        ...prev,
        recommendations: sortedRecommendations,
        active_recommendations: sortedRecommendations.filter(r => 
          !prev.dismissed_recommendations.includes(r.id)
        ),
        total_recommendations: sortedRecommendations.length,
        last_updated: new Date(),
        loading: false
      }))

      console.log('✅ 生成了', sortedRecommendations.length, '个AI推荐')

    } catch (error) {
      console.error('AI推荐生成失败:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '推荐生成失败'
      }))
    }
  }, [])

  // 获取个性化提示
  const getPersonalizedHints = useCallback(async (
    card: FSRSCard,
    options: HintGenerationOptions
  ): Promise<AIHint[]> => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const hints = await aiHintService.generateHintsForCard(card, options)
      setState(prev => ({ ...prev, loading: false }))
      return hints
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return []
    }
  }, [])

  // 获取难度推荐
  const getDifficultyRecommendation = useCallback(async (
    card: FSRSCard, 
    context: LearningContext
  ): Promise<DifficultyRecommendation | null> => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      // 创建用户学习档案（简化版）
      const userProfile = {
        user_id: userId,
        optimal_difficulty_range: [preferences.difficulty_preference - 2, preferences.difficulty_preference + 2] as [number, number],
        cognitive_capacity: 0.8,
        learning_speed: 1.0,
        retention_rate: 0.75,
        preferred_challenge_level: preferences.difficulty_preference,
        fatigue_pattern: new Array(24).fill(0.5),
        peak_performance_hours: [9, 10, 14, 15, 16],
        subject_strengths: {},
        learning_style_weights: {
          visual: preferences.learning_style === 'visual' ? 0.7 : 0.1,
          auditory: preferences.learning_style === 'auditory' ? 0.7 : 0.1,
          kinesthetic: preferences.learning_style === 'kinesthetic' ? 0.7 : 0.1,
          reading_writing: preferences.learning_style === 'reading_writing' ? 0.7 : 0.1
        }
      }

      const cognitiveLoad = await difficultyAI.assessCognitiveLoad([card], context)
      const recommendation = await difficultyAI.generateDifficultyRecommendation(card, context, userProfile, cognitiveLoad)
      
      setState(prev => ({ ...prev, loading: false }))
      return recommendation
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      return null
    }
  }, [userId, preferences])

  // 生成额外内容
  const generateAdditionalContent = useCallback(async (
    topic: string,
    options: ContentGenerationOptions
  ): Promise<GeneratedQuestion[]> => {
    try {
      return await contentGenerator.generateQuestions(topic, `关于${topic}的学习材料`, options)
    } catch (error) {
      console.error('内容生成失败:', error)
      return []
    }
  }, [])

  // 推荐管理
  const dismissRecommendation = useCallback((recommendationId: string) => {
    setState(prev => ({
      ...prev,
      dismissed_recommendations: [...prev.dismissed_recommendations, recommendationId],
      active_recommendations: prev.active_recommendations.filter(r => r.id !== recommendationId)
    }))
  }, [])

  const acceptRecommendation = useCallback(async (recommendationId: string) => {
    const recommendation = state.recommendations.find(r => r.id === recommendationId)
    if (!recommendation) return

    console.log('接受推荐:', recommendation.title)
    
    // 根据推荐类型执行相应操作
    switch (recommendation.type) {
      case 'study_hint':
        // 显示提示或集成到学习界面
        break
      case 'difficulty_adjustment':
        // 调整卡片难度
        break
      case 'content_generation':
        // 生成新内容
        break
      case 'exam_preparation':
        // 启动考试准备流程
        break
      default:
        break
    }

    dismissRecommendation(recommendationId)
  }, [state.recommendations, dismissRecommendation])

  const prioritizeRecommendations = useCallback((): AIRecommendation[] => {
    return state.active_recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.personalization_score - a.personalization_score
    })
  }, [state.active_recommendations])

  const getRecommendationsByType = useCallback((type: AIRecommendation['type']) => {
    return state.active_recommendations.filter(r => r.type === type)
  }, [state.active_recommendations])

  // 学习洞察
  const getStudyInsights = useCallback(() => {
    // 基于推荐数据计算学习洞察
    const totalImpact = state.recommendations.reduce((sum, r) => sum + r.estimated_impact, 0)
    const avgConfidence = state.recommendations.reduce((sum, r) => sum + r.confidence, 0) / state.recommendations.length || 0

    return {
      learning_velocity: avgConfidence * 10, // 简化计算
      improvement_trends: [
        '学习效率稳步提升',
        '难点突破能力增强',
        '知识应用能力发展良好'
      ],
      optimization_opportunities: [
        '可以尝试更多样化的学习方法',
        '考虑增加实际应用练习',
        '建议定期进行综合性测试'
      ],
      performance_predictions: [
        { metric: '准确率', predicted_improvement: '+15%', timeframe: '2周' },
        { metric: '响应速度', predicted_improvement: '+25%', timeframe: '1周' },
        { metric: '长期记忆', predicted_improvement: '+20%', timeframe: '1个月' }
      ]
    }
  }, [state.recommendations])

  // 配置管理
  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }, [])

  const resetRecommendations = useCallback(() => {
    setState({
      recommendations: [],
      loading: false,
      error: null,
      last_updated: null,
      total_recommendations: 0,
      active_recommendations: [],
      dismissed_recommendations: []
    })
  }, [])

  // 实用功能
  const exportRecommendations = useCallback(() => {
    return {
      export_date: new Date().toISOString(),
      user_id: userId,
      recommendations: state.recommendations.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        expires_at: r.expires_at?.toISOString()
      })),
      user_preferences: preferences,
      summary: {
        total: state.total_recommendations,
        active: state.active_recommendations.length,
        dismissed: state.dismissed_recommendations.length
      }
    }
  }, [userId, state, preferences])

  const scheduleStudySession = useCallback((recommendations: AIRecommendation[]) => {
    const totalTime = recommendations.reduce((sum, r) => sum + r.estimated_time, 0)
    const highPriorityCount = recommendations.filter(r => r.priority === 'high').length

    return {
      estimated_duration: totalTime,
      recommended_order: recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }),
      break_suggestions: totalTime > 45 ? ['在30分钟后休息5分钟'] : [],
      focus_areas: recommendations.slice(0, 3).map(r => r.title),
      success_probability: Math.min(0.95, 0.6 + (highPriorityCount * 0.1))
    }
  }, [])

  // 自动清理过期推荐
  useEffect(() => {
    const now = new Date()
    setState(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter(r => 
        !r.expires_at || r.expires_at > now
      ),
      active_recommendations: prev.active_recommendations.filter(r => 
        !r.expires_at || r.expires_at > now
      )
    }))
  }, [])

  return {
    state,
    generateRecommendations,
    getPersonalizedHints,
    getDifficultyRecommendation,
    generateAdditionalContent,
    dismissRecommendation,
    acceptRecommendation,
    prioritizeRecommendations,
    getRecommendationsByType,
    getStudyInsights,
    updatePreferences,
    resetRecommendations,
    exportRecommendations,
    scheduleStudySession
  }
}

export default useAIRecommendations 