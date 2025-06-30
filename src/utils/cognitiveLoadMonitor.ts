import { CognitiveLoadLevel, CognitiveLoadMetrics, EnhancedAIMessage, LearningState } from '@/types/ai-enhanced'

/**
 * 认知负荷监控器
 * 基于认知负荷理论(Cognitive Load Theory)实时监控学习状态
 */
export class CognitiveLoadMonitor {
  private static instance: CognitiveLoadMonitor
  private sessionStartTime: number = Date.now()
  private interactionHistory: InteractionEvent[] = []
  
  static getInstance(): CognitiveLoadMonitor {
    if (!CognitiveLoadMonitor.instance) {
      CognitiveLoadMonitor.instance = new CognitiveLoadMonitor()
    }
    return CognitiveLoadMonitor.instance
  }

  /**
   * 开始新的监控会话
   */
  startSession(userId: string): string {
    const sessionId = `session_${userId}_${Date.now()}`
    this.sessionStartTime = Date.now()
    this.interactionHistory = []
    return sessionId
  }

  /**
   * 记录用户交互事件
   */
  recordInteraction(event: InteractionEvent): void {
    event.timestamp = Date.now()
    this.interactionHistory.push(event)
    
    // 保持历史记录在合理范围内
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-500)
    }
  }

  /**
   * 分析当前认知负荷
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param recentMessages 最近的消息历史
   * @returns 认知负荷分析结果
   */
  analyzeCognitiveLoad(
    userId: string,
    sessionId: string,
    recentMessages: EnhancedAIMessage[]
  ): CognitiveLoadAnalysis {
    const currentMetrics = this.calculateCurrentMetrics(recentMessages)
    const sessionMetrics = this.calculateSessionMetrics()
    const cognitiveLoadLevel = this.determineCognitiveLoadLevel(currentMetrics, sessionMetrics)
    const learningState = this.identifyLearningState(currentMetrics, recentMessages)
    
    return {
      user_id: userId,
      session_id: sessionId,
      current_load_level: cognitiveLoadLevel,
      learning_state: learningState,
      metrics: {
        user_id: userId,
        session_id: sessionId,
        current_metrics: currentMetrics,
        session_metrics: sessionMetrics,
        timestamp: new Date().toISOString()
      },
      recommendations: this.generateRecommendations(cognitiveLoadLevel, learningState, currentMetrics),
      confidence_score: this.calculateConfidenceScore(currentMetrics, sessionMetrics)
    }
  }

  /**
   * 计算当前指标
   */
  private calculateCurrentMetrics(recentMessages: EnhancedAIMessage[]): CurrentCognitiveMetrics {
    const now = Date.now()
    const recentInteractions = this.interactionHistory.filter(
      event => now - event.timestamp < 5 * 60 * 1000 // 最近5分钟
    )

    return {
      response_delay: this.calculateAverageResponseDelay(recentMessages),
      error_rate: this.calculateErrorRate(recentMessages),
      help_requests: this.countHelpRequests(recentMessages),
      task_switching_frequency: this.calculateTaskSwitchingFrequency(recentInteractions),
      message_complexity: this.analyzeMessageComplexity(recentMessages),
      confusion_indicators: this.detectConfusionIndicators(recentMessages),
      engagement_level: this.calculateEngagementLevel(recentInteractions)
    }
  }

  /**
   * 计算会话指标
   */
  private calculateSessionMetrics(): SessionCognitiveMetrics {
    const sessionDuration = Date.now() - this.sessionStartTime
    const totalInteractions = this.interactionHistory.length
    
    const loadHistory = this.interactionHistory.map(event => {
      const timeSinceStart = event.timestamp - this.sessionStartTime
      return {
        time: timeSinceStart,
        load: this.estimateInteractionLoad(event)
      }
    })

    return {
      total_cognitive_load: this.calculateTotalCognitiveLoad(loadHistory),
      peak_load_points: this.identifyPeakLoadPoints(loadHistory),
      recovery_periods: this.identifyRecoveryPeriods(loadHistory),
      overall_efficiency: this.calculateEfficiency(totalInteractions, sessionDuration),
      session_duration: sessionDuration,
      interaction_frequency: totalInteractions / (sessionDuration / 60000) // 每分钟交互次数
    }
  }

  /**
   * 确定认知负荷等级
   */
  private determineCognitiveLoadLevel(
    currentMetrics: CurrentCognitiveMetrics,
    sessionMetrics: SessionCognitiveMetrics
  ): CognitiveLoadLevel {
    let loadScore = 0

    // 基于响应延迟
    if (currentMetrics.response_delay > 30) loadScore += 25
    else if (currentMetrics.response_delay > 15) loadScore += 15
    else if (currentMetrics.response_delay > 10) loadScore += 5

    // 基于错误率
    if (currentMetrics.error_rate > 0.4) loadScore += 30
    else if (currentMetrics.error_rate > 0.2) loadScore += 20
    else if (currentMetrics.error_rate > 0.1) loadScore += 10

    // 基于求助频率
    if (currentMetrics.help_requests > 5) loadScore += 20
    else if (currentMetrics.help_requests > 3) loadScore += 15
    else if (currentMetrics.help_requests > 1) loadScore += 5

    // 基于任务切换频率
    if (currentMetrics.task_switching_frequency > 0.8) loadScore += 15
    else if (currentMetrics.task_switching_frequency > 0.5) loadScore += 10

    // 基于困惑指标
    if (currentMetrics.confusion_indicators > 3) loadScore += 25
    else if (currentMetrics.confusion_indicators > 1) loadScore += 15

    // 基于参与度（低参与度可能表示负荷过高）
    if (currentMetrics.engagement_level < 0.3) loadScore += 20
    else if (currentMetrics.engagement_level < 0.5) loadScore += 10

    // 基于会话总体负荷
    if (sessionMetrics.total_cognitive_load > 80) loadScore += 15
    else if (sessionMetrics.total_cognitive_load > 60) loadScore += 10

    // 确定等级
    if (loadScore >= 80) return 'overload'
    if (loadScore >= 60) return 'high'
    if (loadScore >= 30) return 'optimal'
    return 'low'
  }

  /**
   * 识别学习状态
   */
  private identifyLearningState(
    currentMetrics: CurrentCognitiveMetrics,
    recentMessages: EnhancedAIMessage[]
  ): LearningState {
    const confusionKeywords = ['confused', 'don\'t understand', 'unclear', '困惑', '不明白']
    const confidenceKeywords = ['got it', 'understand', 'clear', 'makes sense', '明白了', '懂了']
    const frustrationKeywords = ['frustrated', 'difficult', 'hard', 'annoying', '困难', '烦人']
    const motivationKeywords = ['interesting', 'excited', 'want to learn', '有趣', '想学']

    const userMessages = recentMessages.filter(msg => msg.role === 'user')
    const messageContent = userMessages.map(msg => msg.content.toLowerCase()).join(' ')

    // 检测关键词出现次数
    const confusionCount = confusionKeywords.filter(keyword => messageContent.includes(keyword)).length
    const confidenceCount = confidenceKeywords.filter(keyword => messageContent.includes(keyword)).length
    const frustrationCount = frustrationKeywords.filter(keyword => messageContent.includes(keyword)).length
    const motivationCount = motivationKeywords.filter(keyword => messageContent.includes(keyword)).length

    // 结合指标判断状态
    if (confusionCount > 0 || currentMetrics.confusion_indicators > 2) {
      return 'confused'
    }
    
    if (frustrationCount > 0 || (currentMetrics.error_rate > 0.4 && currentMetrics.help_requests > 3)) {
      return 'frustrated'
    }
    
    if (confidenceCount > 0 && currentMetrics.error_rate < 0.1 && currentMetrics.engagement_level > 0.7) {
      return 'confident'
    }
    
    if (motivationCount > 0 || currentMetrics.engagement_level > 0.8) {
      return 'motivated'
    }
    
    if (currentMetrics.engagement_level < 0.3 || currentMetrics.task_switching_frequency > 0.8) {
      return 'distracted'
    }

    return 'focused'
  }

  /**
   * 生成调整建议
   */
  private generateRecommendations(
    loadLevel: CognitiveLoadLevel,
    learningState: LearningState,
    metrics: CurrentCognitiveMetrics
  ): CognitiveLoadRecommendations {
    const recommendations: CognitiveLoadRecommendations = {
      immediate_actions: [],
      teaching_adjustments: [],
      content_modifications: [],
      break_suggestions: []
    }

    // 基于认知负荷等级的建议
    switch (loadLevel) {
      case 'overload':
        recommendations.immediate_actions.push('Consider taking a 10-15 minute break')
        recommendations.teaching_adjustments.push('Switch to simpler explanations')
        recommendations.content_modifications.push('Break down complex concepts into smaller chunks')
        recommendations.break_suggestions.push('Deep breathing exercises recommended')
        break

      case 'high':
        recommendations.teaching_adjustments.push('Provide more scaffolding and support')
        recommendations.content_modifications.push('Use more examples and visual aids')
        recommendations.immediate_actions.push('Slow down the pace')
        break

      case 'low':
        recommendations.teaching_adjustments.push('Increase challenge level')
        recommendations.content_modifications.push('Introduce more complex concepts')
        recommendations.immediate_actions.push('Add interactive elements')
        break

      case 'optimal':
        recommendations.immediate_actions.push('Current pace is working well')
        recommendations.teaching_adjustments.push('Maintain current teaching approach')
        break
    }

    // 基于学习状态的建议
    switch (learningState) {
      case 'confused':
        recommendations.teaching_adjustments.push('Provide more clarification and examples')
        recommendations.content_modifications.push('Review prerequisite concepts')
        break

      case 'frustrated':
        recommendations.immediate_actions.push('Offer encouragement and support')
        recommendations.teaching_adjustments.push('Simplify explanations')
        recommendations.break_suggestions.push('Short motivational break recommended')
        break

      case 'distracted':
        recommendations.immediate_actions.push('Refocus attention with engaging questions')
        recommendations.teaching_adjustments.push('Use more interactive elements')
        break

      case 'confident':
        recommendations.teaching_adjustments.push('Introduce challenging concepts')
        recommendations.content_modifications.push('Add advanced applications')
        break
    }

    return recommendations
  }

  // 辅助计算方法

  private calculateAverageResponseDelay(messages: EnhancedAIMessage[]): number {
    if (messages.length < 2) return 0

    const delays: number[] = []
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'user' && messages[i-1].role === 'assistant') {
        const delay = new Date(messages[i].timestamp).getTime() - new Date(messages[i-1].timestamp).getTime()
        delays.push(delay / 1000) // 转换为秒
      }
    }

    return delays.length > 0 ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length : 0
  }

  private calculateErrorRate(messages: EnhancedAIMessage[]): number {
    const userMessages = messages.filter(msg => msg.role === 'user')
    if (userMessages.length === 0) return 0

    const errorKeywords = ['wrong', 'mistake', 'error', 'incorrect', '错误', '不对']
    const errorMessages = userMessages.filter(msg => 
      errorKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length

    return errorMessages / userMessages.length
  }

  private countHelpRequests(messages: EnhancedAIMessage[]): number {
    const helpKeywords = ['help', 'stuck', 'don\'t know', 'confused', '帮助', '不会', '卡住了']
    return messages.filter(msg => 
      msg.role === 'user' && 
      helpKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
  }

  private calculateTaskSwitchingFrequency(interactions: InteractionEvent[]): number {
    if (interactions.length < 2) return 0

    let switches = 0
    for (let i = 1; i < interactions.length; i++) {
      if (interactions[i].type !== interactions[i-1].type) {
        switches++
      }
    }

    return switches / interactions.length
  }

  private analyzeMessageComplexity(messages: EnhancedAIMessage[]): number {
    const userMessages = messages.filter(msg => msg.role === 'user')
    if (userMessages.length === 0) return 0

    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
    const complexWords = userMessages.reduce((sum, msg) => {
      const words = msg.content.split(/\s+/)
      return sum + words.filter(word => word.length > 8).length
    }, 0)

    return Math.min((avgLength + complexWords * 10) / 100, 1) // 归一化到0-1
  }

  private detectConfusionIndicators(messages: EnhancedAIMessage[]): number {
    const confusionKeywords = [
      'confused', 'don\'t understand', 'unclear', 'what does this mean',
      'explain again', 'still confused', '困惑', '不明白', '什么意思'
    ]
    
    return messages.filter(msg => 
      msg.role === 'user' && 
      confusionKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    ).length
  }

  private calculateEngagementLevel(interactions: InteractionEvent[]): number {
    if (interactions.length === 0) return 0

    const recentInteractions = interactions.slice(-10) // 最近10次交互
    const engagementScore = recentInteractions.reduce((sum, interaction) => {
      return sum + this.getEngagementScore(interaction)
    }, 0)

    return Math.min(engagementScore / recentInteractions.length, 1)
  }

  private getEngagementScore(interaction: InteractionEvent): number {
    switch (interaction.type) {
      case 'question': return 0.8
      case 'detailed_response': return 0.9
      case 'quick_response': return 0.6
      case 'help_request': return 0.7
      case 'task_switch': return 0.3
      default: return 0.5
    }
  }

  private calculateTotalCognitiveLoad(loadHistory: Array<{time: number, load: number}>): number {
    if (loadHistory.length === 0) return 0
    
    const totalLoad = loadHistory.reduce((sum, point) => sum + point.load, 0)
    return Math.min(totalLoad / loadHistory.length, 100)
  }

  private identifyPeakLoadPoints(loadHistory: Array<{time: number, load: number}>): number[] {
    const peaks: number[] = []
    const threshold = 0.8 // 80%以上认为是峰值
    
    for (let i = 1; i < loadHistory.length - 1; i++) {
      if (loadHistory[i].load > threshold && 
          loadHistory[i].load > loadHistory[i-1].load && 
          loadHistory[i].load > loadHistory[i+1].load) {
        peaks.push(loadHistory[i].time)
      }
    }
    
    return peaks
  }

  private identifyRecoveryPeriods(loadHistory: Array<{time: number, load: number}>): number[] {
    const recoveries: number[] = []
    let inRecovery = false
    let recoveryStart = 0
    
    for (const point of loadHistory) {
      if (point.load < 0.3 && !inRecovery) { // 进入恢复期
        inRecovery = true
        recoveryStart = point.time
      } else if (point.load > 0.5 && inRecovery) { // 离开恢复期
        inRecovery = false
        recoveries.push(point.time - recoveryStart)
      }
    }
    
    return recoveries
  }

  private calculateEfficiency(interactions: number, duration: number): number {
    if (duration === 0) return 0
    
    const interactionsPerMinute = interactions / (duration / 60000)
    const optimalRate = 2 // 每分钟2次交互视为最优
    
    return Math.min(Math.max(interactionsPerMinute / optimalRate, 0), 1) * 100
  }

  private estimateInteractionLoad(event: InteractionEvent): number {
    const baseLoads = {
      'question': 0.6,
      'detailed_response': 0.8,
      'quick_response': 0.4,
      'help_request': 0.9,
      'task_switch': 0.7,
      'error_correction': 0.8
    }
    
    return baseLoads[event.type] || 0.5
  }

  private calculateConfidenceScore(
    currentMetrics: CurrentCognitiveMetrics,
    sessionMetrics: SessionCognitiveMetrics
  ): number {
    let confidence = 70 // 基础置信度
    
    // 基于数据量调整置信度
    if (sessionMetrics.session_duration > 10 * 60 * 1000) confidence += 10 // 超过10分钟
    if (sessionMetrics.interaction_frequency > 1) confidence += 10 // 交互频率合理
    if (this.interactionHistory.length > 20) confidence += 10 // 足够的交互历史
    
    return Math.min(confidence, 95)
  }
}

// 相关接口定义
interface InteractionEvent {
  type: 'question' | 'detailed_response' | 'quick_response' | 'help_request' | 'task_switch' | 'error_correction'
  timestamp: number
  duration?: number
  metadata?: any
}

interface CurrentCognitiveMetrics {
  response_delay: number
  error_rate: number
  help_requests: number
  task_switching_frequency: number
  message_complexity: number
  confusion_indicators: number
  engagement_level: number
}

interface SessionCognitiveMetrics {
  total_cognitive_load: number
  peak_load_points: number[]
  recovery_periods: number[]
  overall_efficiency: number
  session_duration: number
  interaction_frequency: number
}

interface CognitiveLoadAnalysis {
  user_id: string
  session_id: string
  current_load_level: CognitiveLoadLevel
  learning_state: LearningState
  metrics: CognitiveLoadMetrics
  recommendations: CognitiveLoadRecommendations
  confidence_score: number
}

interface CognitiveLoadRecommendations {
  immediate_actions: string[]
  teaching_adjustments: string[]
  content_modifications: string[]
  break_suggestions: string[]
}

export const cognitiveLoadMonitor = CognitiveLoadMonitor.getInstance() 