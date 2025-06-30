import {
    CognitiveLoadLevel,
    CognitiveLoadMetrics,
    EnhancedAIConfig,
    EnhancedAIConversation,
    EnhancedAIMessage,
    LearningAnalytics,
    LearningBehaviorData
} from '@/types/ai-enhanced'
import { cognitiveLoadMonitor } from '@/utils/cognitiveLoadMonitor'
import { learningStyleDetector } from '@/utils/learningStyleDetector'
import { smartPromptEngine } from '@/utils/smartPromptEngine'
import { useCallback, useRef, useState } from 'react'

/**
 * 增强版AI Hook
 * 集成个性化学习、认知负荷监控和智能提示词生成
 */
export const useEnhancedAI = () => {
  // 基础状态
  const [conversations, setConversations] = useState<EnhancedAIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<EnhancedAIConversation | null>(null)
  const [messages, setMessages] = useState<EnhancedAIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 增强功能状态
  const [aiConfig, setAIConfig] = useState<EnhancedAIConfig>({
    mode: {
      primary: 'guided',
      intensity: 70,
      adaptation_speed: 'medium'
    },
    personalization: {
      learning_style: 'mixed',
      confidence_level: 50,
      preferred_complexity: 'moderate',
      response_length: 'adaptive'
    },
    cognitive_load: {
      current_level: 'optimal',
      target_level: 'optimal',
      auto_adjustment: true
    },
    context: {
      subject_domain: 'general',
      session_duration: 0,
      recent_performance: 'average'
    },
    technical: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1500,
      response_format: 'conversational'
    }
  })

  const [learningAnalytics, setLearningAnalytics] = useState<LearningAnalytics | null>(null)
  const [cognitiveLoadMetrics, setCognitiveLoadMetrics] = useState<CognitiveLoadMetrics | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  // Refs for tracking
  const sessionStartTime = useRef<number>(Date.now())
  const interactionHistory = useRef<any[]>([])

  /**
   * 初始化增强AI系统
   */
  const initializeEnhancedAI = useCallback(async (userId: string) => {
    try {
      // 启动认知负荷监控会话
      const newSessionId = cognitiveLoadMonitor.startSession(userId)
      setSessionId(newSessionId)
      sessionStartTime.current = Date.now()

      // 重置状态
      setError(null)
      
      return newSessionId
    } catch (err: any) {
      setError(`Failed to initialize enhanced AI: ${err.message}`)
      return null
    }
  }, [])

  /**
   * 分析学习风格
   */
  const analyzeLearningstyle = useCallback(async () => {
    try {
      if (messages.length < 5) {
        return null // 需要足够的数据进行分析
      }

      // 构建学习行为数据
      const behaviorData: LearningBehaviorData = {
        user_id: currentConversation?.user_id || '',
        session_id: sessionId,
        interaction_patterns: {
          average_response_time: calculateAverageResponseTime(),
          message_length_preference: calculateMessageLengthPreference(),
          question_asking_frequency: calculateQuestionFrequency(),
          help_seeking_pattern: analyzeHelpSeekingPattern()
        },
        performance_metrics: {
          task_completion_rate: calculateTaskCompletionRate(),
          error_frequency: calculateErrorFrequency(),
          improvement_velocity: calculateImprovementVelocity(),
          retention_rate: 0.8 // 暂时使用默认值
        },
        preferences: {
          preferred_explanation_style: detectExplanationStyle(),
          feedback_preference: 'immediate',
          challenge_level: 'moderate'
        },
        timestamp: new Date().toISOString()
      }

      // 执行学习风格分析
      const styleAnalysis = learningStyleDetector.analyzeLearningstyle(behaviorData, messages)
      
      // 更新AI配置
      setAIConfig(prev => ({
        ...prev,
        personalization: {
          ...prev.personalization,
          learning_style: styleAnalysis.detected_style,
          confidence_level: styleAnalysis.confidence_score
        }
      }))

      return styleAnalysis
    } catch (err: any) {
      setError(`Learning style analysis failed: ${err.message}`)
      return null
    }
  }, [messages, currentConversation, sessionId])

  /**
   * 监控认知负荷
   */
  const monitorCognitiveLoad = useCallback(async () => {
    try {
      if (!currentConversation || messages.length === 0) {
        return null
      }

      // 分析认知负荷
      const loadAnalysis = cognitiveLoadMonitor.analyzeCognitiveLoad(
        currentConversation.user_id,
        sessionId,
        messages.slice(-10) // 最近10条消息
      )

      setCognitiveLoadMetrics(loadAnalysis.metrics)

      // 自动调整AI配置
      if (aiConfig.cognitive_load.auto_adjustment) {
        setAIConfig(prev => ({
          ...prev,
          cognitive_load: {
            ...prev.cognitive_load,
            current_level: loadAnalysis.current_load_level
          }
        }))

        // 根据认知负荷调整教学强度
        const intensityAdjustment = getIntensityAdjustment(loadAnalysis.current_load_level)
        if (intensityAdjustment !== null) {
          setAIConfig(prev => ({
            ...prev,
            mode: {
              ...prev.mode,
              intensity: Math.max(20, Math.min(100, prev.mode.intensity + intensityAdjustment))
            }
          }))
        }
      }

      return loadAnalysis
    } catch (err: any) {
      setError(`Cognitive load monitoring failed: ${err.message}`)
      return null
    }
  }, [currentConversation, sessionId, messages, aiConfig.cognitive_load.auto_adjustment])

  /**
   * 发送增强消息
   */
  const sendEnhancedMessage = useCallback(async (message: string) => {
    if (!currentConversation || loading) return

    setLoading(true)
    setError(null)

    try {
      // 记录交互事件
      cognitiveLoadMonitor.recordInteraction({
        type: 'question',
        timestamp: Date.now(),
        metadata: { message_length: message.length }
      })

      // 更新会话时长
      const sessionDuration = (Date.now() - sessionStartTime.current) / 60000 // 分钟
      setAIConfig(prev => ({
        ...prev,
        context: {
          ...prev.context,
          session_duration: sessionDuration
        }
      }))

      // 构建对话上下文
      const conversationContext = {
        subject_domain: aiConfig.context.subject_domain,
        current_task_type: aiConfig.context.current_task_type,
        learning_objectives: currentConversation.learning_objectives,
        conversation_history_length: messages.length,
        recent_topics: extractRecentTopics(),
        student_errors: extractRecentErrors(),
        success_patterns: extractSuccessPatterns()
      }

      // 生成个性化提示词
      const personalizedPrompt = smartPromptEngine.generatePersonalizedPrompt(
        aiConfig,
        conversationContext,
        message
      )

      // 调用AI API (这里需要集成实际的API调用)
      const aiResponse = await callEnhancedAIAPI(personalizedPrompt, message, aiConfig)

      // 创建增强消息对象
      const userMessage: EnhancedAIMessage = {
        id: `msg_${Date.now()}_user`,
        conversation_id: currentConversation.id,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }

      const assistantMessage: EnhancedAIMessage = {
        id: `msg_${Date.now()}_assistant`,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: aiResponse,
        educational_metadata: {
          teaching_method_used: aiConfig.mode.primary,
          cognitive_load_level: aiConfig.cognitive_load.current_level,
          personalization_applied: [
            `learning_style_${aiConfig.personalization.learning_style}`,
            `complexity_${aiConfig.personalization.preferred_complexity}`
          ],
          learning_objectives_addressed: extractAddressedObjectives(aiResponse, conversationContext.learning_objectives)
        },
        analytics: {
          generation_config: aiConfig,
          prompt_template_used: `${aiConfig.mode.primary}_${aiConfig.context.subject_domain}`,
          response_quality_score: 85, // 暂时使用固定值
          estimated_effectiveness: calculateEstimatedEffectiveness()
        },
        timestamp: new Date().toISOString()
      }

      // 更新消息列表
      setMessages(prev => [...prev, userMessage, assistantMessage])

      // 定期执行分析
      if (messages.length % 5 === 0) {
        setTimeout(() => {
          analyzeLearningstyle()
          monitorCognitiveLoad()
        }, 1000)
      }

    } catch (err: any) {
      setError(`Failed to send enhanced message: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [currentConversation, loading, aiConfig, messages, analyzeLearningstyle, monitorCognitiveLoad])

  /**
   * 创建增强对话
   */
  const createEnhancedConversation = useCallback(async (
    assistantType: EnhancedAIConversation['assistant_type'],
    learningObjectives: string[] = [],
    taskId?: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      // 初始化个性化配置
      const initialBehaviorData: LearningBehaviorData = {
        user_id: 'current_user', // 需要从认证状态获取
        session_id: sessionId,
        interaction_patterns: {
          average_response_time: 10,
          message_length_preference: 50,
          question_asking_frequency: 2,
          help_seeking_pattern: 'independent'
        },
        performance_metrics: {
          task_completion_rate: 80,
          error_frequency: 0.1,
          improvement_velocity: 1.2,
          retention_rate: 0.8
        },
        preferences: {
          preferred_explanation_style: 'examples',
          feedback_preference: 'immediate',
          challenge_level: 'moderate'
        },
        timestamp: new Date().toISOString()
      }

      const newConversation: EnhancedAIConversation = {
        id: `conv_${Date.now()}`,
        user_id: 'current_user',
        task_id: taskId,
        assistant_type: assistantType,
        learning_objectives: learningObjectives,
        personalization_profile: initialBehaviorData,
        cognitive_load_history: [],
        adaptation_log: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setConversations(prev => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      setMessages([])

      // 更新AI配置的学科领域
      setAIConfig(prev => ({
        ...prev,
        context: {
          ...prev.context,
          subject_domain: assistantType
        }
      }))

      return newConversation
    } catch (err: any) {
      setError(`Failed to create enhanced conversation: ${err.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  /**
   * 生成学习分析报告
   */
  const generateLearningAnalytics = useCallback(async (timeRange: { start: string, end: string }) => {
    try {
      // 这里应该从后端获取历史数据并进行分析
      // 暂时生成模拟数据
      const analytics: LearningAnalytics = {
        user_id: currentConversation?.user_id || '',
        analysis_period: timeRange,
        learning_style_analysis: {
          detected_style: aiConfig.personalization.learning_style,
          confidence_score: aiConfig.personalization.confidence_level,
          style_distribution: {
            visual: 20,
            auditory: 30,
            kinesthetic: 25,
            reading_writing: 15,
            mixed: 10
          },
          recommendation: 'Continue using mixed learning approaches with emphasis on auditory methods.'
        },
        cognitive_patterns: {
          optimal_session_length: 25,
          best_performance_times: ['09:00-11:00', '14:00-16:00'],
          cognitive_load_trends: [
            { date: '2024-01-01', average_load: 65, peak_load: 85, efficiency: 78 },
            { date: '2024-01-02', average_load: 70, peak_load: 90, efficiency: 82 }
          ]
        },
        progress_analysis: {
          skill_improvements: [
            { skill: 'Problem Solving', improvement_rate: 15, current_level: 75 },
            { skill: 'Critical Thinking', improvement_rate: 12, current_level: 68 }
          ],
          learning_velocity: 1.3,
          retention_patterns: {
            'short_term': 0.85,
            'medium_term': 0.72,
            'long_term': 0.58
          }
        },
        recommendations: {
          teaching_method_adjustments: [
            'Increase use of visual aids',
            'Provide more hands-on practice'
          ],
          cognitive_load_management: [
            'Take breaks every 20-25 minutes',
            'Reduce complexity during afternoon sessions'
          ],
          learning_strategy_suggestions: [
            'Use spaced repetition for better retention',
            'Practice explaining concepts to others'
          ],
          technology_optimizations: [
            'Enable automatic difficulty adjustment',
            'Use multi-modal content delivery'
          ]
        },
        generated_at: new Date().toISOString()
      }

      setLearningAnalytics(analytics)
      return analytics
    } catch (err: any) {
      setError(`Failed to generate learning analytics: ${err.message}`)
      return null
    }
  }, [currentConversation, aiConfig.personalization])

  // 辅助计算函数
  const calculateAverageResponseTime = (): number => {
    // 实现响应时间计算逻辑
    return 12 // 暂时返回固定值
  }

  const calculateMessageLengthPreference = (): number => {
    if (messages.length === 0) return 50
    const userMessages = messages.filter(msg => msg.role === 'user')
    const totalLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0)
    return Math.round(totalLength / userMessages.length)
  }

  const calculateQuestionFrequency = (): number => {
    const questionCount = messages.filter(msg => 
      msg.role === 'user' && msg.content.includes('?')
    ).length
    return Math.round(questionCount / Math.max(messages.length / 2, 1))
  }

  const analyzeHelpSeekingPattern = (): 'independent' | 'frequent' | 'reluctant' => {
    const helpKeywords = ['help', 'confused', 'don\'t understand', 'stuck']
    const helpMessages = messages.filter(msg => 
      msg.role === 'user' && 
      helpKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    
    const ratio = helpMessages / Math.max(messages.length, 1)
    if (ratio > 0.3) return 'frequent'
    if (ratio < 0.1) return 'reluctant'
    return 'independent'
  }

  const calculateTaskCompletionRate = (): number => {
    // 实现任务完成率计算逻辑
    return 75 // 暂时返回固定值
  }

  const calculateErrorFrequency = (): number => {
    const errorKeywords = ['wrong', 'mistake', 'error', 'incorrect']
    const errorMessages = messages.filter(msg => 
      errorKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
    return errorMessages / Math.max(messages.length, 1)
  }

  const calculateImprovementVelocity = (): number => {
    // 实现改进速度计算逻辑
    return 1.2 // 暂时返回固定值
  }

  const detectExplanationStyle = (): 'examples' | 'theory' | 'visual' | 'step_by_step' => {
    // 实现解释风格检测逻辑
    return 'examples' // 暂时返回固定值
  }

  const getIntensityAdjustment = (loadLevel: CognitiveLoadLevel): number | null => {
    switch (loadLevel) {
      case 'low': return 10
      case 'high': return -10
      case 'overload': return -20
      case 'optimal': return 0
      default: return null
    }
  }

  const extractRecentTopics = (): string[] => {
    // 实现主题提取逻辑
    return ['mathematics', 'problem solving']
  }

  const extractRecentErrors = (): string[] => {
    // 实现错误提取逻辑
    return []
  }

  const extractSuccessPatterns = (): string[] => {
    // 实现成功模式提取逻辑
    return ['responds well to examples', 'understands visual explanations']
  }

  const extractAddressedObjectives = (response: string, objectives: string[]): string[] => {
    // 实现目标匹配逻辑
    return objectives.slice(0, 2) // 暂时返回前两个目标
  }

  const calculateEstimatedEffectiveness = (): number => {
    // 实现效果评估逻辑
    return 85 // 暂时返回固定值
  }

  // 模拟API调用函数
  const callEnhancedAIAPI = async (prompt: string, userMessage: string, config: EnhancedAIConfig): Promise<string> => {
    // 这里应该集成实际的OpenAI API调用
    return `Based on your learning style (${config.personalization.learning_style}) and current cognitive load (${config.cognitive_load.current_level}), here's a personalized response to: "${userMessage}"`
  }

  return {
    // 基础状态
    conversations,
    currentConversation,
    messages,
    loading,
    error,

    // 增强功能状态
    aiConfig,
    learningAnalytics,
    cognitiveLoadMetrics,
    sessionId,

    // 基础功能
    initializeEnhancedAI,
    createEnhancedConversation,
    sendEnhancedMessage,

    // 增强功能
    analyzeLearningstyle,
    monitorCognitiveLoad,
    generateLearningAnalytics,

    // 配置管理
    updateAIConfig: setAIConfig,
    clearError: () => setError(null)
  }
} 