/**
 * Phase 2: 集成高级学习分析系统 Hook
 * 整合学习分析引擎、模式识别、预测路径规划、自适应测试、知识状态建模
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { CognitiveLoadMetrics, EnhancedAIMessage, LearningBehaviorData } from '../types/ai-enhanced'
import { getKnowledgeStateModelingEngine } from '../utils/knowledgeStateModeling'
import { getLearningAnalyticsEngine } from '../utils/learningAnalyticsEngine'
import { getLearningPatternRecognitionEngine } from '../utils/learningPatternRecognition'
import { getPredictiveLearningPathPlanner } from '../utils/predictiveLearningPath'
import { useEnhancedAI } from './useEnhancedAI'

/**
 * 高级学习分析状态接口
 */
export interface AdvancedLearningAnalyticsState {
  // 学习分析
  analytics: {
    insights: any[]
    predictions: any[]
    efficiency_analysis: any
    recommendations: string[]
    real_time_stats: any
  }
  
  // 模式识别
  patterns: {
    detected_patterns: any[]
    pattern_predictions: any[]
    pattern_insights: string[]
    pattern_statistics: any
  }
  
  // 学习路径规划
  learning_paths: {
    recommended_paths: any[]
    path_recommendations: any[]
    optimization_insights: string[]
    alternative_approaches: any[]
  }
  
  // 知识状态建模
  knowledge_state: {
    current_state: any | null
    state_changes: any[]
    knowledge_insights: string[]
    mastery_predictions: any[]
  }
  
  // 自适应测试
  adaptive_testing: {
    available_tests: any[]
    current_session: any | null
    test_results: any[]
    capability_assessments: any[]
  }
  
  // 综合分析
  comprehensive_analysis: {
    overall_progress: number
    learning_velocity: number
    efficiency_score: number
    next_milestones: any[]
    strategic_recommendations: string[]
  }
  
  // 系统状态
  is_analyzing: boolean
  last_update: string
  analysis_confidence: number
}

/**
 * Hook配置接口
 */
export interface AdvancedAnalyticsConfig {
  analysis_frequency: 'real_time' | 'periodic' | 'on_demand'
  auto_pattern_detection: boolean
  path_optimization_enabled: boolean
  adaptive_testing_enabled: boolean
  knowledge_modeling_enabled: boolean
  analysis_depth: 'surface' | 'standard' | 'deep'
  privacy_level: 'minimal' | 'standard' | 'comprehensive'
}

/**
 * 高级学习分析Hook
 */
export function useAdvancedLearningAnalytics(
  userId: string,
  config: Partial<AdvancedAnalyticsConfig> = {}
) {
  // 默认配置
  const defaultConfig: AdvancedAnalyticsConfig = {
    analysis_frequency: 'real_time',
    auto_pattern_detection: true,
    path_optimization_enabled: true,
    adaptive_testing_enabled: true,
    knowledge_modeling_enabled: true,
    analysis_depth: 'standard',
    privacy_level: 'standard'
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 状态管理
  const [state, setState] = useState<AdvancedLearningAnalyticsState>({
    analytics: {
      insights: [],
      predictions: [],
      efficiency_analysis: {},
      recommendations: [],
      real_time_stats: {}
    },
    patterns: {
      detected_patterns: [],
      pattern_predictions: [],
      pattern_insights: [],
      pattern_statistics: {}
    },
    learning_paths: {
      recommended_paths: [],
      path_recommendations: [],
      optimization_insights: [],
      alternative_approaches: []
    },
    knowledge_state: {
      current_state: null,
      state_changes: [],
      knowledge_insights: [],
      mastery_predictions: []
    },
    adaptive_testing: {
      available_tests: [],
      current_session: null,
      test_results: [],
      capability_assessments: []
    },
    comprehensive_analysis: {
      overall_progress: 0,
      learning_velocity: 0,
      efficiency_score: 0,
      next_milestones: [],
      strategic_recommendations: []
    },
    is_analyzing: false,
    last_update: new Date().toISOString(),
    analysis_confidence: 0
  })

  // 引擎实例
  const analyticsEngine = useRef(getLearningAnalyticsEngine(userId))
  const patternEngine = useRef(getLearningPatternRecognitionEngine(userId))
  const pathPlanner = useRef(getPredictiveLearningPathPlanner(userId))
  const knowledgeEngine = useRef(getKnowledgeStateModelingEngine(userId))

  // 集成Phase 1的增强AI系统
  const enhancedAI = useEnhancedAI()

  // 分析队列和定时器
  const analysisQueue = useRef<any[]>([])
  const analysisTimer = useRef<NodeJS.Timeout | null>(null)

  /**
   * 执行综合学习分析
   */
  const performComprehensiveAnalysis = useCallback(async (
    messages: EnhancedAIMessage[],
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics
  ) => {
    setState(prev => ({ ...prev, is_analyzing: true }))

    try {
      // 1. 并行执行各模块分析
      const [
        analyticsResult,
        patternsResult,
        knowledgeResult
      ] = await Promise.all([
        // 学习分析引擎
        analyticsEngine.current.analyzeUserBehavior(messages, behaviorData, cognitiveMetrics),
        
        // 模式识别引擎
        patternEngine.current.analyzeAndIdentifyPatterns(behaviorData, cognitiveMetrics, []),
        
        // 知识状态建模
        knowledgeEngine.current.updateKnowledgeState(behaviorData, cognitiveMetrics, [])
      ])

      // 2. 基于分析结果生成学习路径
      const pathsResult = await pathPlanner.current.generatePersonalizedPaths(
        behaviorData,
        cognitiveMetrics,
        extractLearningGoals(analyticsResult.insights, patternsResult.detected_patterns),
        calculateAvailableTime(behaviorData),
        determineDifficultyPreference(knowledgeResult.updated_state)
      )

      // 3. 执行综合分析
      const comprehensiveAnalysis = performMetaAnalysis({
        analytics: analyticsResult,
        patterns: patternsResult,
        paths: pathsResult,
        knowledge: knowledgeResult
      })

      // 4. 更新状态
      setState(prev => ({
        ...prev,
        analytics: {
          insights: analyticsResult.insights,
          predictions: analyticsResult.predictions,
          efficiency_analysis: analyticsEngine.current.getLearningEfficiencyAnalysis(),
          recommendations: analyticsResult.recommendations,
          real_time_stats: generateRealTimeStats(analyticsResult)
        },
        patterns: {
          detected_patterns: patternsResult.detected_patterns,
          pattern_predictions: patternsResult.pattern_predictions,
          pattern_insights: patternsResult.insights,
          pattern_statistics: patternEngine.current.getPatternStatistics()
        },
        learning_paths: {
          recommended_paths: pathsResult.recommended_paths,
          path_recommendations: pathsResult.path_recommendations,
          optimization_insights: pathsResult.optimization_insights,
          alternative_approaches: pathsResult.alternative_approaches
        },
        knowledge_state: {
          current_state: knowledgeResult.updated_state,
          state_changes: knowledgeResult.state_changes,
          knowledge_insights: knowledgeResult.insights,
          mastery_predictions: generateMasteryPredictions(knowledgeResult.updated_state)
        },
        comprehensive_analysis: comprehensiveAnalysis,
        is_analyzing: false,
        last_update: new Date().toISOString(),
        analysis_confidence: calculateAnalysisConfidence({
          analytics: analyticsResult,
          patterns: patternsResult,
          knowledge: knowledgeResult
        })
      }))

    } catch (error) {
      console.error('综合分析失败:', error)
      setState(prev => ({ ...prev, is_analyzing: false }))
    }
  }, [userId])

  /**
   * 提取学习目标
   */
  const extractLearningGoals = (insights: any[], patterns: any[]): string[] => {
    const goals: string[] = []

    // 从洞察中提取目标
    insights.forEach(insight => {
      if (insight.insight_type === 'performance' && insight.significance_score > 80) {
        goals.push(`改进${insight.title}`)
      }
    })

    // 从模式中提取目标
    patterns.forEach(pattern => {
      if (pattern.confidence_score > 85) {
        goals.push(`优化${pattern.pattern_type}`)
      }
    })

    // 默认目标
    if (goals.length === 0) {
      goals.push('提高学习效率', '增强知识掌握', '优化学习方法')
    }

    return goals.slice(0, 5)
  }

  /**
   * 计算可用时间
   */
  const calculateAvailableTime = (behaviorData: LearningBehaviorData): number => {
    // 基于历史行为估算每周可用时间
    const avgSessionTime = behaviorData.interaction_patterns.average_response_time / 60 // 转换为分钟
    const sessionsPerWeek = 7 // 假设每周7次学习
    return Math.max(5, Math.min(40, avgSessionTime * sessionsPerWeek / 60)) // 转换为小时，限制在5-40小时
  }

  /**
   * 确定难度偏好
   */
  const determineDifficultyPreference = (knowledgeState: any): number => {
    if (!knowledgeState) return 5
    
    const proficiency = knowledgeState.overall_proficiency
    if (proficiency > 80) return 8
    if (proficiency > 60) return 6
    if (proficiency > 40) return 4
    return 3
  }

  /**
   * 执行元分析
   */
  const performMetaAnalysis = (results: any) => {
    // 计算整体进度
    const overallProgress = calculateOverallProgress(results)
    
    // 计算学习速度
    const learningVelocity = calculateLearningVelocity(results)
    
    // 计算效率评分
    const efficiencyScore = calculateEfficiencyScore(results)
    
    // 生成下一里程碑
    const nextMilestones = generateNextMilestones(results)
    
    // 生成战略建议
    const strategicRecommendations = generateStrategicRecommendations(results)

    return {
      overall_progress: overallProgress,
      learning_velocity: learningVelocity,
      efficiency_score: efficiencyScore,
      next_milestones: nextMilestones,
      strategic_recommendations: strategicRecommendations
    }
  }

  /**
   * 计算整体进度
   */
  const calculateOverallProgress = (results: any): number => {
    let progress = 0
    let totalWeight = 0

    // 知识状态权重 (40%)
    if (results.knowledge?.updated_state) {
      progress += results.knowledge.updated_state.overall_proficiency * 0.4
      totalWeight += 0.4
    }

    // 学习效率权重 (30%)
    if (results.analytics?.insights) {
      const efficiencyInsights = results.analytics.insights.filter((i: any) => i.insight_type === 'performance')
      const avgSignificance = efficiencyInsights.reduce((sum: number, i: any) => sum + i.significance_score, 0) / Math.max(1, efficiencyInsights.length)
      progress += avgSignificance * 0.3
      totalWeight += 0.3
    }

    // 模式稳定性权重 (20%)
    if (results.patterns?.detected_patterns) {
      const stablePatterns = results.patterns.detected_patterns.filter((p: any) => p.strength_score > 80)
      const stabilityScore = (stablePatterns.length / Math.max(1, results.patterns.detected_patterns.length)) * 100
      progress += stabilityScore * 0.2
      totalWeight += 0.2
    }

    // 路径完成度权重 (10%)
    if (results.paths?.recommended_paths) {
      const avgPersonalization = results.paths.recommended_paths.reduce((sum: number, p: any) => sum + p.personalization_score, 0) / Math.max(1, results.paths.recommended_paths.length)
      progress += avgPersonalization * 0.1
      totalWeight += 0.1
    }

    return totalWeight > 0 ? Math.round(progress / totalWeight) : 0
  }

  /**
   * 计算学习速度
   */
  const calculateLearningVelocity = (results: any): number => {
    let velocity = 0

    // 基于知识状态变化
    if (results.knowledge?.state_changes) {
      const positiveChanges = results.knowledge.state_changes.filter((c: any) => 
        c.change_type.includes('increase') || c.change_type === 'new_concept'
      )
      velocity += positiveChanges.length * 10
    }

    // 基于模式预测
    if (results.patterns?.pattern_predictions) {
      const highConfidencePredictions = results.patterns.pattern_predictions.filter((p: any) => p.next_occurrence_probability > 0.8)
      velocity += highConfidencePredictions.length * 5
    }

    return Math.min(100, velocity)
  }

  /**
   * 计算效率评分
   */
  const calculateEfficiencyScore = (results: any): number => {
    let score = 50 // 基础分

    // 基于学习分析效率
    if (results.analytics?.efficiency_analysis) {
      score = results.analytics.efficiency_analysis.overall_efficiency
    }

    // 基于模式优化
    if (results.patterns?.detected_patterns) {
      const positivePatterns = results.patterns.detected_patterns.filter((p: any) => 
        p.associated_outcomes.some((o: any) => o.outcome_type === 'positive')
      )
      const patternBonus = (positivePatterns.length / Math.max(1, results.patterns.detected_patterns.length)) * 10
      score += patternBonus
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * 生成下一里程碑
   */
  const generateNextMilestones = (results: any): any[] => {
    const milestones: any[] = []

    // 基于知识缺口
    if (results.knowledge?.updated_state?.knowledge_gaps) {
      const priorityGaps = results.knowledge.updated_state.knowledge_gaps
        .filter((gap: any) => gap.severity === 'high' || gap.severity === 'critical')
        .slice(0, 3)

      priorityGaps.forEach((gap: any) => {
        milestones.push({
          type: 'knowledge_gap',
          title: `解决${gap.concept_id}知识缺口`,
          description: gap.gap_type,
          estimated_time: gap.estimated_time_to_fill,
          priority: gap.severity === 'critical' ? 'high' : 'medium'
        })
      })
    }

    // 基于学习准备度
    if (results.knowledge?.updated_state?.learning_readiness) {
      const readyConcepts = results.knowledge.updated_state.learning_readiness
        .filter((r: any) => r.readiness_score > 80)
        .slice(0, 2)

      readyConcepts.forEach((ready: any) => {
        milestones.push({
          type: 'learning_opportunity',
          title: `学习${ready.concept_id}`,
          description: '高准备度概念',
          estimated_time: 5, // 假设5小时
          priority: 'medium'
        })
      })
    }

    // 基于推荐路径
    if (results.paths?.recommended_paths?.length > 0) {
      const bestPath = results.paths.recommended_paths[0]
      milestones.push({
        type: 'learning_path',
        title: `完成${bestPath.name}`,
        description: bestPath.description,
        estimated_time: bestPath.estimated_duration,
        priority: 'low'
      })
    }

    return milestones.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    })
  }

  /**
   * 生成战略建议
   */
  const generateStrategicRecommendations = (results: any): string[] => {
    const recommendations: string[] = []

    // 基于综合分析的战略建议
    const overallProgress = calculateOverallProgress(results)
    
    if (overallProgress > 80) {
      recommendations.push('学习进展优秀，考虑挑战更高难度内容或担任导师角色')
    } else if (overallProgress < 40) {
      recommendations.push('建议重点巩固基础知识，调整学习策略')
    }

    // 基于模式的建议
    if (results.patterns?.detected_patterns) {
      const strongPatterns = results.patterns.detected_patterns.filter((p: any) => p.strength_score > 85)
      if (strongPatterns.length > 0) {
        recommendations.push(`充分利用您的${strongPatterns[0].pattern_type}优势模式`)
      }
    }

    // 基于知识状态的建议
    if (results.knowledge?.updated_state) {
      const state = results.knowledge.updated_state
      if (state.knowledge_gaps.length > 3) {
        recommendations.push('当前知识缺口较多，建议采用系统性学习方法')
      }
      if (state.strength_areas.length > 0) {
        recommendations.push(`基于${state.strength_areas[0]}等优势领域，扩展相关知识`)
      }
    }

    // 基于效率的建议
    const efficiencyScore = calculateEfficiencyScore(results)
    if (efficiencyScore < 60) {
      recommendations.push('学习效率有提升空间，建议优化学习时间安排和方法')
    }

    return recommendations.slice(0, 5)
  }

  /**
   * 生成实时统计
   */
  const generateRealTimeStats = (analyticsResult: any) => {
    return {
      total_insights: analyticsResult.insights.length,
      high_confidence_predictions: analyticsResult.predictions.filter((p: any) => p.confidence_level > 0.8).length,
      active_recommendations: analyticsResult.recommendations.length,
      analysis_depth: finalConfig.analysis_depth,
      last_analysis_time: new Date().toISOString()
    }
  }

  /**
   * 生成掌握度预测
   */
  const generateMasteryPredictions = (knowledgeState: any) => {
    if (!knowledgeState || !knowledgeState.concept_masteries) return []

    return knowledgeState.concept_masteries
      .filter((m: any) => m.mastery_level < 90)
      .map((m: any) => ({
        concept_id: m.concept_id,
        current_mastery: m.mastery_level,
        predicted_mastery_in_week: Math.min(100, m.mastery_level + 10),
        predicted_mastery_in_month: Math.min(100, m.mastery_level + 25),
        confidence: m.confidence_score
      }))
      .slice(0, 5)
  }

  /**
   * 计算分析置信度
   */
  const calculateAnalysisConfidence = (results: any): number => {
    let confidence = 0
    let factors = 0

    // 知识状态置信度
    if (results.knowledge?.updated_state?.state_confidence) {
      confidence += results.knowledge.updated_state.state_confidence * 100
      factors++
    }

    // 模式识别置信度
    if (results.patterns?.detected_patterns) {
      const avgPatternConfidence = results.patterns.detected_patterns.reduce(
        (sum: number, p: any) => sum + p.confidence_score, 0
      ) / Math.max(1, results.patterns.detected_patterns.length)
      confidence += avgPatternConfidence
      factors++
    }

    // 分析深度影响
    const depthMultiplier = {
      'surface': 0.7,
      'standard': 1.0,
      'deep': 1.2
    }[finalConfig.analysis_depth] || 1.0

    return factors > 0 ? Math.round((confidence / factors) * depthMultiplier) : 50
  }

  /**
   * 队列化分析处理
   */
  const queueAnalysis = useCallback((data: any) => {
    analysisQueue.current.push(data)

    if (finalConfig.analysis_frequency === 'real_time') {
      // 实时处理
      processAnalysisQueue()
    } else if (finalConfig.analysis_frequency === 'periodic') {
      // 定期处理
      if (analysisTimer.current) {
        clearTimeout(analysisTimer.current)
      }
      analysisTimer.current = setTimeout(processAnalysisQueue, 5000) // 5秒延迟
    }
  }, [finalConfig.analysis_frequency])

  /**
   * 处理分析队列
   */
  const processAnalysisQueue = useCallback(async () => {
    if (analysisQueue.current.length === 0 || state.is_analyzing) return

    const latestData = analysisQueue.current[analysisQueue.current.length - 1]
    analysisQueue.current = []

    await performComprehensiveAnalysis(
      latestData.messages || [],
      latestData.behaviorData || {
        user_id: userId,
        session_id: 'default',
        interaction_patterns: { average_response_time: 0, message_length_preference: 0, question_asking_frequency: 0, help_seeking_pattern: 'independent' },
        performance_metrics: { task_completion_rate: 0, error_frequency: 0, improvement_velocity: 0, retention_rate: 0 },
        preferences: { preferred_explanation_style: 'examples', feedback_preference: 'immediate', challenge_level: 'moderate' },
        timestamp: new Date().toISOString()
      },
      latestData.cognitiveMetrics || enhancedAI.cognitiveLoadMetrics || {
        user_id: userId,
        session_id: 'default',
        current_metrics: { response_delay: 0, error_rate: 0, help_requests: 0, task_switching_frequency: 0 },
        session_metrics: { total_cognitive_load: 50, peak_load_points: [], recovery_periods: [], overall_efficiency: 75 },
        timestamp: new Date().toISOString()
      }
    )
  }, [state.is_analyzing, performComprehensiveAnalysis, enhancedAI])

  /**
   * 手动触发分析
   */
  const triggerAnalysis = useCallback(async (
    messages?: EnhancedAIMessage[],
    behaviorData?: LearningBehaviorData,
    cognitiveMetrics?: CognitiveLoadMetrics
  ) => {
    const defaultBehaviorData = {
      user_id: userId,
      session_id: 'default',
      interaction_patterns: { average_response_time: 0, message_length_preference: 0, question_asking_frequency: 0, help_seeking_pattern: 'independent' as const },
      performance_metrics: { task_completion_rate: 0, error_frequency: 0, improvement_velocity: 0, retention_rate: 0 },
      preferences: { preferred_explanation_style: 'examples' as const, feedback_preference: 'immediate' as const, challenge_level: 'moderate' as const },
      timestamp: new Date().toISOString()
    }
    
    const defaultCognitiveMetrics = {
      user_id: userId,
      session_id: 'default',
      current_metrics: { response_delay: 0, error_rate: 0, help_requests: 0, task_switching_frequency: 0 },
      session_metrics: { total_cognitive_load: 50, peak_load_points: [], recovery_periods: [], overall_efficiency: 75 },
      timestamp: new Date().toISOString()
    }
    
    await performComprehensiveAnalysis(
      messages || enhancedAI.messages,
      behaviorData || defaultBehaviorData,
      cognitiveMetrics || enhancedAI.cognitiveLoadMetrics || defaultCognitiveMetrics
    )
  }, [performComprehensiveAnalysis, enhancedAI, userId])

  /**
   * 导出分析报告
   */
  const exportAnalysisReport = useCallback(() => {
    return {
      user_id: userId,
      report_timestamp: new Date().toISOString(),
      analysis_config: finalConfig,
      comprehensive_state: state,
      phase_1_integration: {
        learning_style: enhancedAI.aiConfig?.personalization?.learning_style || 'mixed',
        cognitive_load: enhancedAI.aiConfig?.cognitive_load?.current_level || 'optimal',
        ai_configuration: enhancedAI.aiConfig || {}
      },
      summary: {
        overall_progress: state.comprehensive_analysis.overall_progress,
        learning_velocity: state.comprehensive_analysis.learning_velocity,
        efficiency_score: state.comprehensive_analysis.efficiency_score,
        analysis_confidence: state.analysis_confidence,
        key_insights: [
          ...state.analytics.insights.slice(0, 3),
          ...state.patterns.pattern_insights.slice(0, 2),
          ...state.knowledge_state.knowledge_insights.slice(0, 2)
        ],
        strategic_recommendations: state.comprehensive_analysis.strategic_recommendations
      }
    }
  }, [userId, finalConfig, state, enhancedAI])

  /**
   * 重置分析状态
   */
  const resetAnalysis = useCallback(() => {
    setState({
      analytics: { insights: [], predictions: [], efficiency_analysis: {}, recommendations: [], real_time_stats: {} },
      patterns: { detected_patterns: [], pattern_predictions: [], pattern_insights: [], pattern_statistics: {} },
      learning_paths: { recommended_paths: [], path_recommendations: [], optimization_insights: [], alternative_approaches: [] },
      knowledge_state: { current_state: null, state_changes: [], knowledge_insights: [], mastery_predictions: [] },
      adaptive_testing: { available_tests: [], current_session: null, test_results: [], capability_assessments: [] },
      comprehensive_analysis: { overall_progress: 0, learning_velocity: 0, efficiency_score: 0, next_milestones: [], strategic_recommendations: [] },
      is_analyzing: false,
      last_update: new Date().toISOString(),
      analysis_confidence: 0
    })
  }, [])

  // 监听Phase 1系统变化，自动触发分析
  useEffect(() => {
    if (finalConfig.analysis_frequency === 'real_time' && enhancedAI.messages.length > 0) {
      queueAnalysis({
        messages: enhancedAI.messages,
        behaviorData: null,
        cognitiveMetrics: enhancedAI.cognitiveLoadMetrics
      })
    }
  }, [enhancedAI.messages.length, queueAnalysis, finalConfig.analysis_frequency])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (analysisTimer.current) {
        clearTimeout(analysisTimer.current)
      }
    }
  }, [])

  return {
    // 状态
    ...state,
    
    // Phase 1 集成
    enhancedAI,
    
    // 配置
    config: finalConfig,
    
    // 方法
    triggerAnalysis,
    queueAnalysis,
    exportAnalysisReport,
    resetAnalysis,
    
    // 实用工具
    utils: {
      calculateOverallProgress: () => calculateOverallProgress({
        analytics: { insights: state.analytics.insights },
        patterns: { detected_patterns: state.patterns.detected_patterns },
        knowledge: { updated_state: state.knowledge_state.current_state },
        paths: { recommended_paths: state.learning_paths.recommended_paths }
      }),
      
      getNextPriorityAction: () => {
        const milestones = state.comprehensive_analysis.next_milestones
        return milestones.length > 0 ? milestones[0] : null
      },
      
      getPersonalizedRecommendation: () => {
        const recommendations = state.comprehensive_analysis.strategic_recommendations
        return recommendations.length > 0 ? recommendations[0] : '继续保持学习状态'
      },
      
      getEfficiencyInsights: () => {
        return state.analytics.efficiency_analysis
      }
    }
  }
}

// Export types are already declared above
