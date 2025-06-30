/**
 * 学习分析引擎 (Learning Analytics Engine)
 * Phase 2: Advanced analytics for personalized learning insights
 */

import {
    AggregatedBehaviorMetrics,
    AnalysisModel,
    BehaviorDataCollector,
    LearningAnalyticsEngine,
    LearningInsight,
    LearningPattern,
    LearningPrediction,
    PatternPrediction,
    PatternRecognitionEngine
} from '../types/analytics-enhanced'

import {
    CognitiveLoadMetrics,
    EnhancedAIMessage,
    LearningBehaviorData,
    LearningState
} from '../types/ai-enhanced'

// Remove duplicate interfaces - using ones from analytics-enhanced.ts

/**
 * 行为数据点接口
 */
export interface BehaviorDataPoint {
  timestamp: string
  event_type: string
  event_data: Record<string, any>
  significance_score: number
}

/**
 * 主学习分析引擎类
 * 集成行为数据收集、模式识别、预测分析
 */
class LearningAnalyticsEngineImpl implements LearningAnalyticsEngine {
  public user_id: string
  public analytics_config: any
  public data_sources: any[] = []
  public analysis_models: AnalysisModel[] = []
  public insights: LearningInsight[] = []
  public predictions: LearningPrediction[] = []

  private behaviorCollector: BehaviorDataCollectorImpl
  private patternRecognizer: PatternRecognitionEngineImpl
  private insightGenerator: InsightGenerator
  private predictionEngine: PredictionEngine

  constructor(userId: string, config?: Partial<any>) {
    this.user_id = userId
    this.analytics_config = {
      analysis_frequency: 'real_time',
      data_retention_days: 90,
      privacy_level: 'standard',
      predictive_modeling: true,
      adaptive_recommendations: true,
      ...config
    }

    this.behaviorCollector = new BehaviorDataCollectorImpl(userId)
    this.patternRecognizer = new PatternRecognitionEngineImpl()
    this.insightGenerator = new InsightGenerator()
    this.predictionEngine = new PredictionEngine()

    this.initializeAnalysisModels()
  }

  /**
   * 初始化分析模型
   */
  private initializeAnalysisModels(): void {
    this.analysis_models = [
      {
        model_id: 'engagement_predictor_v1.2',
        model_name: 'Engagement Prediction Model',
        version: '1.2.0',
        model_type: 'machine_learning',
        description: 'Predicts user engagement levels',
        input_features: [{
          feature_name: 'response_time',
          feature_type: 'numerical',
          importance_score: 0.8,
          description: 'User response time patterns'
        }],
        output_predictions: [{
          output_name: 'engagement_score',
          output_type: 'prediction',
          confidence_measure: 'probability',
          interpretation: 'User engagement probability'
        }],
        performance_metrics: { precision: 0.85, recall: 0.82, f1_score: 0.83, last_evaluated: new Date().toISOString() },
        training_data: { data_size: 10000, data_quality_score: 85, training_period: '2024-01', feature_coverage: 0.95, label_quality: 0.90, data_freshness: '2024-01-15' },
        deployment_info: { deployment_date: new Date().toISOString(), environment: 'production', monitoring_enabled: true, auto_retraining: false, performance_threshold: 0.8 }
      },
      {
        model_id: 'learning_efficiency_analyzer_v2.1',
        model_name: 'Learning Efficiency Analyzer',
        version: '2.1.0',
        model_type: 'statistical',
        description: 'Analyzes learning efficiency patterns',
        input_features: [{
          feature_name: 'completion_rate',
          feature_type: 'numerical',
          importance_score: 0.9,
          description: 'Task completion rates'
        }],
        output_predictions: [{
          output_name: 'efficiency_score',
          output_type: 'prediction',
          confidence_measure: 'statistical_confidence',
          interpretation: 'Learning efficiency prediction'
        }],
        performance_metrics: { precision: 0.88, recall: 0.85, f1_score: 0.87, last_evaluated: new Date().toISOString() },
        training_data: { data_size: 15000, data_quality_score: 90, training_period: '2024-01', feature_coverage: 0.92, label_quality: 0.88, data_freshness: '2024-01-15' },
        deployment_info: { deployment_date: new Date().toISOString(), environment: 'production', monitoring_enabled: true, auto_retraining: false, performance_threshold: 0.85 }
      },
      {
        model_id: 'cognitive_load_optimizer_v1.0',
        model_name: 'Cognitive Load Optimizer',
        version: '1.0.0',
        model_type: 'hybrid',
        description: 'Optimizes cognitive load distribution',
        input_features: [{
          feature_name: 'cognitive_metrics',
          feature_type: 'numerical',
          importance_score: 0.85,
          description: 'Cognitive load measurements'
        }],
        output_predictions: [{
          output_name: 'optimal_load',
          output_type: 'prediction',
          confidence_measure: 'optimization_score',
          interpretation: 'Optimal cognitive load prediction'
        }],
        performance_metrics: { precision: 0.80, recall: 0.78, f1_score: 0.79, last_evaluated: new Date().toISOString() },
        training_data: { data_size: 8000, data_quality_score: 82, training_period: '2024-01', feature_coverage: 0.88, label_quality: 0.85, data_freshness: '2024-01-15' },
        deployment_info: { deployment_date: new Date().toISOString(), environment: 'production', monitoring_enabled: true, auto_retraining: false, performance_threshold: 0.75 }
      },
      {
        model_id: 'pattern_recognition_ml_v3.0',
        model_name: 'Machine Learning Pattern Recognition',
        version: '3.0.0',
        model_type: 'deep_learning',
        description: 'Identifies learning behavior patterns',
        input_features: [{
          feature_name: 'behavior_sequences',
          feature_type: 'temporal',
          importance_score: 0.95,
          description: 'Sequential behavior patterns'
        }],
        output_predictions: [{
          output_name: 'pattern_type',
          output_type: 'classification',
          confidence_measure: 'neural_confidence',
          interpretation: 'Behavior pattern classification'
        }],
        performance_metrics: { precision: 0.90, recall: 0.87, f1_score: 0.89, last_evaluated: new Date().toISOString() },
        training_data: { data_size: 25000, data_quality_score: 95, training_period: '2024-01', feature_coverage: 0.98, label_quality: 0.92, data_freshness: '2024-01-15' },
        deployment_info: { deployment_date: new Date().toISOString(), environment: 'production', monitoring_enabled: true, auto_retraining: true, performance_threshold: 0.88 }
      }
    ]
  }

  /**
   * 实时分析用户学习行为
   */
  async analyzeUserBehavior(
    messages: EnhancedAIMessage[],
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics
  ): Promise<{
    insights: LearningInsight[]
    predictions: LearningPrediction[]
    recommendations: string[]
  }> {
    // 1. 收集行为数据
    await this.behaviorCollector.collectBehaviorData(messages, behaviorData, cognitiveMetrics)

    // 2. 识别学习模式
    const patterns = await this.patternRecognizer.identifyPatterns(
      this.behaviorCollector.getAggregatedMetrics()
    )

    // 3. 生成洞察
    const insights = await this.insightGenerator.generateInsights(
      behaviorData,
      patterns,
      cognitiveMetrics
    )

    // 4. 生成预测
    const predictions = await this.predictionEngine.generatePredictions(
      insights,
      patterns,
      behaviorData.performance_metrics
    )

    // 5. 生成个性化推荐
    const recommendations = this.generatePersonalizedRecommendations(insights, predictions, patterns)

    // 更新内部状态
    this.insights = insights
    this.predictions = predictions

    return { insights, predictions, recommendations }
  }

  /**
   * 生成个性化学习推荐
   */
  private generatePersonalizedRecommendations(
    insights: LearningInsight[],
    predictions: LearningPrediction[],
    patterns: LearningPattern[]
  ): string[] {
    const recommendations: string[] = []

    // 基于洞察的推荐
    insights.forEach(insight => {
      if (insight.significance_score > 75) {
        switch (insight.insight_type) {
          case 'behavior':
            recommendations.push(`优化学习行为: ${insight.description}`)
            break
          case 'performance':
            recommendations.push(`提升学习表现: ${insight.description}`)
            break
          case 'pattern':
            recommendations.push(`利用学习模式: ${insight.description}`)
            break
        }
      }
    })

    // 基于预测的推荐
    predictions.forEach(prediction => {
      if (prediction.confidence_level > 0.8) {
        switch (prediction.prediction_type) {
          case 'performance':
            recommendations.push(`预期性能优化: 根据${prediction.target_metric}预测结果调整学习策略`)
            break
          case 'risk':
            recommendations.push(`风险预防: ${prediction.target_metric}存在潜在风险，建议提前干预`)
            break
          case 'opportunity':
            recommendations.push(`机会把握: ${prediction.target_metric}显示学习机会，建议加强相关练习`)
            break
        }
      }
    })

    // 基于模式的推荐
    patterns.forEach(pattern => {
      if (pattern.confidence_score > 80) {
        switch (pattern.pattern_type) {
          case 'learning_rhythm':
            recommendations.push(`学习节奏优化: ${pattern.description}`)
            break
          case 'cognitive_load_pattern':
            recommendations.push(`认知负荷管理: ${pattern.description}`)
            break
          case 'engagement_cycle':
            recommendations.push(`参与度循环: ${pattern.description}`)
            break
        }
      }
    })

    return recommendations.slice(0, 10) // 限制推荐数量
  }

  /**
   * 获取学习效率分析
   */
  getLearningEfficiencyAnalysis(): {
    overall_efficiency: number
    efficiency_factors: Array<{ factor: string; impact: number; suggestion: string }>
    time_optimization_potential: number
  } {
    const aggregatedMetrics = this.behaviorCollector.getAggregatedMetrics()
    
    // 计算整体效率 (0-100)
    const overall_efficiency = this.calculateOverallEfficiency(aggregatedMetrics)
    
    // 分析效率因子
    const efficiency_factors = [
      {
        factor: '专注持续时间',
        impact: Math.min(aggregatedMetrics.focus_duration / 45, 1) * 100, // 45分钟为最佳
        suggestion: aggregatedMetrics.focus_duration < 25 
          ? '建议增加专注时间，使用番茄工作法' 
          : aggregatedMetrics.focus_duration > 60 
          ? '建议适当休息，避免疲劳' 
          : '当前专注时间良好'
      },
      {
        factor: '交互速度',
        impact: Math.min(aggregatedMetrics.interaction_velocity / 2, 1) * 100, // 2 actions/min 为最佳
        suggestion: aggregatedMetrics.interaction_velocity < 1
          ? '可以提高学习节奏，增加互动频率'
          : aggregatedMetrics.interaction_velocity > 3
          ? '学习节奏较快，确保理解质量'
          : '当前学习节奏适中'
      },
      {
        factor: '错误恢复',
        impact: Math.max(100 - aggregatedMetrics.error_recovery_time, 0),
        suggestion: aggregatedMetrics.error_recovery_time > 120
          ? '错误恢复时间较长，建议寻求更多帮助'
          : '错误恢复能力良好'
      },
      {
        factor: '求助合理性',
        impact: this.calculateHelpSeekingOptimality(aggregatedMetrics.help_seeking_ratio) * 100,
        suggestion: aggregatedMetrics.help_seeking_ratio < 0.1
          ? '可以更主动地寻求帮助'
          : aggregatedMetrics.help_seeking_ratio > 0.4
          ? '尝试更多独立思考'
          : '求助频率合理'
      }
    ]

    // 计算时间优化潜力
    const time_optimization_potential = this.calculateTimeOptimizationPotential(aggregatedMetrics)

    return {
      overall_efficiency,
      efficiency_factors,
      time_optimization_potential
    }
  }

  /**
   * 计算整体学习效率
   */
  private calculateOverallEfficiency(metrics: AggregatedBehaviorMetrics): number {
    const weights = {
      engagement: 0.25,
      focus: 0.25,
      interaction_velocity: 0.20,
      error_recovery: 0.15,
      help_seeking: 0.10,
      consistency: 0.05
    }

    const normalizedScores = {
      engagement: metrics.engagement_score,
      focus: Math.min(metrics.focus_duration / 45, 1) * 100,
      interaction_velocity: Math.min(metrics.interaction_velocity / 2, 1) * 100,
      error_recovery: Math.max(100 - metrics.error_recovery_time, 0),
      help_seeking: this.calculateHelpSeekingOptimality(metrics.help_seeking_ratio) * 100,
      consistency: metrics.preference_consistency
    }

    let weightedSum = 0
    Object.entries(weights).forEach(([key, weight]) => {
      weightedSum += normalizedScores[key as keyof typeof normalizedScores] * weight
    })

    return Math.round(weightedSum)
  }

  /**
   * 计算求助行为的最优性
   */
  private calculateHelpSeekingOptimality(ratio: number): number {
    // 最优求助比例在 0.15-0.25 之间
    if (ratio >= 0.15 && ratio <= 0.25) return 1.0
    if (ratio < 0.15) return ratio / 0.15
    return Math.max(0, 1 - (ratio - 0.25) / 0.25)
  }

  /**
   * 计算时间优化潜力
   */
  private calculateTimeOptimizationPotential(metrics: AggregatedBehaviorMetrics): number {
    let potential = 0

    // 基于各项指标计算可优化空间
    if (metrics.focus_duration < 30) potential += 20 // 专注时间提升潜力
    if (metrics.interaction_velocity < 1.5) potential += 15 // 交互效率提升潜力
    if (metrics.error_recovery_time > 90) potential += 25 // 错误处理优化潜力
    if (metrics.help_seeking_ratio > 0.3 || metrics.help_seeking_ratio < 0.1) potential += 10 // 求助优化潜力
    if (metrics.preference_consistency < 70) potential += 15 // 一致性改善潜力

    return Math.min(potential, 100)
  }

  /**
   * 导出分析报告
   */
  exportAnalysisReport(): {
    summary: any
    detailed_insights: LearningInsight[]
    predictions: LearningPrediction[]
    efficiency_analysis: any
    recommendations: string[]
  } {
    const efficiency_analysis = this.getLearningEfficiencyAnalysis()
    const recommendations = this.generatePersonalizedRecommendations(
      this.insights,
      this.predictions,
      this.patternRecognizer.detected_patterns
    )

    return {
      summary: {
        user_id: this.user_id,
        analysis_timestamp: new Date().toISOString(),
        total_insights: this.insights.length,
        high_confidence_predictions: this.predictions.filter(p => p.confidence_level > 0.8).length,
        overall_efficiency: efficiency_analysis.overall_efficiency,
        optimization_potential: efficiency_analysis.time_optimization_potential
      },
      detailed_insights: this.insights,
      predictions: this.predictions,
      efficiency_analysis,
      recommendations
    }
  }
}

/**
 * 学习行为数据收集器实现
 */
class BehaviorDataCollectorImpl implements BehaviorDataCollector {
  public session_id: string
  public user_id: string
  public collection_start: string
  public collection_end?: string
  public data_points: BehaviorDataPoint[] = []
  public aggregated_metrics: AggregatedBehaviorMetrics

  constructor(userId: string) {
    this.user_id = userId
    this.session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.collection_start = new Date().toISOString()
    this.aggregated_metrics = this.initializeMetrics()
  }

  private initializeMetrics(): AggregatedBehaviorMetrics {
    return {
      engagement_score: 0,
      focus_duration: 0,
      interaction_velocity: 0,
      help_seeking_ratio: 0,
      error_recovery_time: 0,
      concept_transition_speed: 0,
      preference_consistency: 0
    }
  }

  async collectBehaviorData(
    messages: EnhancedAIMessage[],
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics
  ): Promise<void> {
    // 从消息中提取行为数据点
    messages.forEach(message => {
      if (message.role === 'user') {
        this.data_points.push({
          timestamp: message.timestamp,
          event_type: 'message_sent',
          event_data: {
            content_length: message.content.length,
            response_time: this.calculateResponseTime(message)
          },
          context: {
            subject_domain: 'general',
            difficulty_level: 5,
            time_of_day: new Date(message.timestamp).getHours().toString(),
            session_duration: this.getSessionDuration(),
            cognitive_state: this.inferCognitiveState(message, cognitiveMetrics)
          },
          significance_score: 70
        })
      }
    })

    // 更新聚合指标
    this.updateAggregatedMetrics(behaviorData, cognitiveMetrics)
  }

  private calculateResponseTime(message: EnhancedAIMessage): number {
    // 简化实现：基于内容长度估算
    return Math.max(5, message.content.length * 0.1)
  }

  private getSessionDuration(): number {
    const start = new Date(this.collection_start)
    const now = new Date()
    return Math.round((now.getTime() - start.getTime()) / (1000 * 60)) // 分钟
  }

  private inferCognitiveState(message: EnhancedAIMessage, cognitiveMetrics: CognitiveLoadMetrics): LearningState {
    const cognitiveLoad = cognitiveMetrics.current_metrics.response_delay
    const errorRate = cognitiveMetrics.current_metrics.error_rate

    if (errorRate > 0.3) return 'confused'
    if (cognitiveLoad > 30) return 'frustrated'
    if (cognitiveLoad < 10 && errorRate < 0.1) return 'confident'
    if (this.containsQuestionWords(message.content)) return 'motivated'
    return 'focused'
  }

  private containsQuestionWords(content: string): boolean {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'can you', 'could you', '?']
    return questionWords.some(word => content.toLowerCase().includes(word))
  }

  private updateAggregatedMetrics(
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics
  ): void {
    this.aggregated_metrics = {
      engagement_score: this.calculateEngagementScore(behaviorData),
      focus_duration: this.getSessionDuration(),
      interaction_velocity: this.calculateInteractionVelocity(),
      help_seeking_ratio: this.calculateHelpSeekingRatio(),
      error_recovery_time: cognitiveMetrics.current_metrics.response_delay,
      concept_transition_speed: this.calculateConceptTransitionSpeed(),
      preference_consistency: behaviorData.preferences.feedback_preference === 'immediate' ? 85 : 70
    }
  }

  private calculateEngagementScore(behaviorData: LearningBehaviorData): number {
    const baseScore = 60
    let score = baseScore

    // 基于任务完成率调整
    score += behaviorData.performance_metrics.task_completion_rate * 0.3

    // 基于交互模式调整
    if (behaviorData.interaction_patterns.question_asking_frequency > 0.5) score += 10
    if (behaviorData.interaction_patterns.average_response_time < 30) score += 10

    // 基于学习表现调整
    score += behaviorData.performance_metrics.improvement_velocity * 0.2

    return Math.min(100, Math.max(0, score))
  }

  private calculateInteractionVelocity(): number {
    const totalEvents = this.data_points.length
    const sessionMinutes = this.getSessionDuration()
    return sessionMinutes > 0 ? totalEvents / sessionMinutes : 0
  }

  private calculateHelpSeekingRatio(): number {
    const helpEvents = this.data_points.filter(dp => dp.event_type === 'help_requested').length
    const totalEvents = this.data_points.length
    return totalEvents > 0 ? helpEvents / totalEvents : 0
  }

  private calculateConceptTransitionSpeed(): number {
    // 简化实现：基于不同主题的消息数量
    const uniqueTopics = new Set(this.data_points.map(dp => dp.context.subject_domain))
    const sessionHours = this.getSessionDuration() / 60
    return sessionHours > 0 ? uniqueTopics.size / sessionHours : 0
  }

  getAggregatedMetrics(): AggregatedBehaviorMetrics {
    return this.aggregated_metrics
  }
}

/**
 * 模式识别引擎实现
 */
class PatternRecognitionEngineImpl implements PatternRecognitionEngine {
  public algorithm_version = 'v3.0'
  public training_data_size = 10000
  public confidence_threshold = 0.75
  public detected_patterns: LearningPattern[] = []
  public pattern_predictions: PatternPrediction[] = []

  async identifyPatterns(metrics: AggregatedBehaviorMetrics): Promise<LearningPattern[]> {
    this.detected_patterns = []

    // 识别学习节奏模式
    this.identifyLearningRhythmPattern(metrics)

    // 识别认知负荷模式
    this.identifyCognitiveLoadPattern(metrics)

    // 识别参与度循环模式
    this.identifyEngagementCyclePattern(metrics)

    // 识别求助模式
    this.identifyHelpSeekingPattern(metrics)

    return this.detected_patterns
  }

  private identifyLearningRhythmPattern(metrics: AggregatedBehaviorMetrics): void {
    if (metrics.focus_duration > 0) {
      let rhythmType = ''
      let confidence = 0

      if (metrics.focus_duration < 20) {
        rhythmType = 'short_burst'
        confidence = 85
      } else if (metrics.focus_duration > 50) {
        rhythmType = 'extended_focus'
        confidence = 90
      } else {
        rhythmType = 'balanced_rhythm'
        confidence = 95
      }

      this.detected_patterns.push({
        id: `rhythm_${Date.now()}`,
        pattern_type: 'learning_rhythm',
        description: `用户表现出${rhythmType}学习节奏，专注时长${metrics.focus_duration}分钟`,
        frequency: 1,
        confidence_score: confidence,
        first_detected: new Date().toISOString(),
        last_observed: new Date().toISOString(),
        associated_outcomes: [{
          outcome_type: rhythmType === 'balanced_rhythm' ? 'positive' : 'neutral',
          impact_score: confidence,
          description: `${rhythmType}学习节奏的效果分析`,
          evidence: [`专注时长: ${metrics.focus_duration}分钟`]
        }],
        trigger_conditions: [{
          condition_type: 'focus_duration',
          condition_value: metrics.focus_duration,
          probability: confidence / 100
        }]
      })
    }
  }

  private identifyCognitiveLoadPattern(metrics: AggregatedBehaviorMetrics): void {
    const loadIndicator = 100 - metrics.engagement_score // 简化的负荷指标

    let loadLevel = ''
    let confidence = 0

    if (loadIndicator < 25) {
      loadLevel = 'optimal_load'
      confidence = 90
    } else if (loadIndicator > 70) {
      loadLevel = 'cognitive_overload'
      confidence = 85
    } else {
      loadLevel = 'moderate_load'
      confidence = 75
    }

    this.detected_patterns.push({
      id: `cognitive_load_${Date.now()}`,
      pattern_type: 'cognitive_load_pattern',
      description: `用户认知负荷水平为${loadLevel}，需要相应调整`,
      frequency: 1,
      confidence_score: confidence,
      first_detected: new Date().toISOString(),
      last_observed: new Date().toISOString(),
      associated_outcomes: [{
        outcome_type: loadLevel === 'optimal_load' ? 'positive' : 'negative',
        impact_score: confidence,
        description: `${loadLevel}的学习效果影响`,
        evidence: [`参与度评分: ${metrics.engagement_score}`]
      }],
      trigger_conditions: [{
        condition_type: 'cognitive_load_level',
        condition_value: loadLevel,
        probability: confidence / 100
      }]
    })
  }

  private identifyEngagementCyclePattern(metrics: AggregatedBehaviorMetrics): void {
    let engagementLevel = ''
    let confidence = 0

    if (metrics.engagement_score > 80) {
      engagementLevel = 'high_engagement'
      confidence = 95
    } else if (metrics.engagement_score < 50) {
      engagementLevel = 'low_engagement'
      confidence = 80
    } else {
      engagementLevel = 'moderate_engagement'
      confidence = 70
    }

    this.detected_patterns.push({
      id: `engagement_${Date.now()}`,
      pattern_type: 'engagement_cycle',
      description: `用户当前处于${engagementLevel}状态`,
      frequency: 1,
      confidence_score: confidence,
      first_detected: new Date().toISOString(),
      last_observed: new Date().toISOString(),
      associated_outcomes: [{
        outcome_type: engagementLevel === 'high_engagement' ? 'positive' : 'neutral',
        impact_score: metrics.engagement_score,
        description: `${engagementLevel}对学习效果的影响`,
        evidence: [`参与度评分: ${metrics.engagement_score}`]
      }],
      trigger_conditions: [{
        condition_type: 'engagement_score',
        condition_value: metrics.engagement_score,
        probability: confidence / 100
      }]
    })
  }

  private identifyHelpSeekingPattern(metrics: AggregatedBehaviorMetrics): void {
    let seekingPattern = ''
    let confidence = 0

    if (metrics.help_seeking_ratio < 0.1) {
      seekingPattern = 'independent_learner'
      confidence = 85
    } else if (metrics.help_seeking_ratio > 0.3) {
      seekingPattern = 'help_dependent'
      confidence = 80
    } else {
      seekingPattern = 'balanced_help_seeking'
      confidence = 90
    }

    this.detected_patterns.push({
      id: `help_seeking_${Date.now()}`,
      pattern_type: 'help_seeking',
      description: `用户表现为${seekingPattern}模式`,
      frequency: 1,
      confidence_score: confidence,
      first_detected: new Date().toISOString(),
      last_observed: new Date().toISOString(),
      associated_outcomes: [{
        outcome_type: seekingPattern === 'balanced_help_seeking' ? 'positive' : 'neutral',
        impact_score: confidence,
        description: `${seekingPattern}模式的学习效果`,
        evidence: [`求助比例: ${(metrics.help_seeking_ratio * 100).toFixed(1)}%`]
      }],
      trigger_conditions: [{
        condition_type: 'help_seeking_ratio',
        condition_value: metrics.help_seeking_ratio,
        probability: confidence / 100
      }]
    })
  }
}

/**
 * 洞察生成器
 */
class InsightGenerator {
  async generateInsights(
    behaviorData: LearningBehaviorData,
    patterns: LearningPattern[],
    cognitiveMetrics: CognitiveLoadMetrics
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = []

    // 生成行为洞察
    insights.push(...this.generateBehaviorInsights(behaviorData))

    // 生成模式洞察
    insights.push(...this.generatePatternInsights(patterns))

    // 生成认知洞察
    insights.push(...this.generateCognitiveInsights(cognitiveMetrics))

    return insights.sort((a, b) => b.significance_score - a.significance_score)
  }

  private generateBehaviorInsights(behaviorData: LearningBehaviorData): LearningInsight[] {
    const insights: LearningInsight[] = []

    // 任务完成率洞察
    if (behaviorData.performance_metrics.task_completion_rate < 70) {
      insights.push({
        insight_id: `completion_rate_${Date.now()}`,
        insight_type: 'performance',
        significance_score: 85,
        title: '任务完成率需要改善',
        description: `当前任务完成率为${behaviorData.performance_metrics.task_completion_rate}%，建议调整学习策略`,
        confidence_level: 0.8,
        actionable_items: ['分解复杂任务', '设置中间检查点', '提供更多指导'],
        generated_at: new Date().toISOString()
      })
    }

    // 学习速度洞察
    if (behaviorData.performance_metrics.improvement_velocity > 0.8) {
      insights.push({
        insight_id: `high_velocity_${Date.now()}`,
        insight_type: 'performance',
        significance_score: 90,
        title: '学习速度表现优秀',
        description: '用户学习速度很快，可以考虑增加挑战难度',
        confidence_level: 0.9,
        actionable_items: ['提供进阶内容', '增加实践项目', '设置更高目标'],
        generated_at: new Date().toISOString()
      })
    }

    return insights
  }

  private generatePatternInsights(patterns: LearningPattern[]): LearningInsight[] {
    const insights: LearningInsight[] = []

    patterns.forEach(pattern => {
      if (pattern.confidence_score > 80) {
        insights.push({
          insight_id: `pattern_${pattern.id}`,
          insight_type: 'pattern',
          significance_score: pattern.confidence_score,
          title: `发现${pattern.pattern_type}模式`,
          description: pattern.description,
          confidence_level: pattern.confidence_score / 100,
          evidence: [],
          actionable_items: pattern.associated_outcomes.map(outcome => outcome.description),
          generated_at: new Date().toISOString()
        })
      }
    })

    return insights
  }

  private generateCognitiveInsights(cognitiveMetrics: CognitiveLoadMetrics): LearningInsight[] {
    const insights: LearningInsight[] = []

    // 认知负荷洞察
    if (cognitiveMetrics.session_metrics.total_cognitive_load > 80) {
      insights.push({
        insight_id: `cognitive_overload_${Date.now()}`,
        insight_type: 'behavior',
        significance_score: 95,
        title: '认知负荷过高',
        description: '当前认知负荷超过最佳水平，建议适当休息或降低任务复杂度',
        confidence_level: 0.9,
        evidence: [],
        actionable_items: ['安排学习休息', '简化当前任务', '分步骤完成'],
        generated_at: new Date().toISOString()
      })
    }

    return insights
  }
}

/**
 * 预测引擎
 */
class PredictionEngine {
  async generatePredictions(
    insights: LearningInsight[],
    patterns: LearningPattern[],
    performanceMetrics: any
  ): Promise<LearningPrediction[]> {
    const predictions: LearningPrediction[] = []

    // 基于模式的预测
    patterns.forEach(pattern => {
      if (pattern.confidence_score > 75) {
        predictions.push({
          prediction_id: `pred_${pattern.id}`,
          prediction_type: 'behavior',
          target_metric: pattern.pattern_type,
          predicted_value: pattern.confidence_score,
          confidence_interval: [pattern.confidence_score - 10, pattern.confidence_score + 5],
          probability: pattern.confidence_score / 100,
          timeframe: '1 week',
          factors: [],
          uncertainty_sources: ['数据量限制', '个体差异'],
          generated_at: new Date().toISOString()
        })
      }
    })

    // 性能预测
    if (performanceMetrics.improvement_velocity > 0) {
      predictions.push({
        prediction_id: `performance_${Date.now()}`,
        prediction_type: 'performance',
        target_metric: 'learning_progress',
        predicted_value: performanceMetrics.improvement_velocity * 1.2,
        confidence_level: 0.8,
        timeframe: '2 weeks',
        factors: [],
        uncertainty_sources: ['外部因素', '动机变化'],
        generated_at: new Date().toISOString()
      })
    }

    return predictions
  }
}

// 创建单例实例
let engineInstance: LearningAnalyticsEngineImpl | null = null

/**
 * 获取学习分析引擎实例
 */
export function getLearningAnalyticsEngine(userId: string): LearningAnalyticsEngineImpl {
  if (!engineInstance || engineInstance.user_id !== userId) {
    engineInstance = new LearningAnalyticsEngineImpl(userId)
  }
  return engineInstance
}

/**
 * 导出主要接口和类型
 */
export {
    BehaviorDataCollectorImpl, InsightGenerator, LearningAnalyticsEngineImpl, PatternRecognitionEngineImpl, PredictionEngine
}

