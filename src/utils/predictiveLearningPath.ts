/**
 * 预测性学习路径规划 (Predictive Learning Path Planning)
 * Phase 2: AI-driven personalized learning path generation
 */

import { CognitiveLoadMetrics, LearningBehaviorData } from '../types/ai-enhanced'

/**
 * 学习路径接口
 */
export interface LearningPath {
  id: string
  name: string
  description: string
  estimated_duration: number // hours
  difficulty_progression: DifficultyProgression
  learning_modules: LearningModule[]
  prerequisite_knowledge: string[]
  predicted_outcomes: PredictedOutcome[]
  personalization_score: number // 0-100
  success_probability: number // 0-1
}

/**
 * 学习模块接口
 */
export interface LearningModule {
  id: string
  title: string
  type: 'concept' | 'practice' | 'assessment' | 'project' | 'review'
  estimated_time: number // minutes
  difficulty_level: number // 1-10
  prerequisites: string[]
  learning_objectives: string[]
  adaptive_parameters: AdaptiveParameters
  success_criteria: SuccessCriteria[]
}

/**
 * 难度递进接口
 */
export interface DifficultyProgression {
  progression_type: 'linear' | 'exponential' | 'adaptive' | 'spiral'
  starting_difficulty: number // 1-10
  target_difficulty: number // 1-10
  adaptation_rate: number // 0-1
  milestone_checkpoints: number[]
}

/**
 * 自适应参数接口
 */
export interface AdaptiveParameters {
  min_mastery_threshold: number // 0-100
  max_attempts: number
  hint_availability: boolean
  peer_collaboration: boolean
  ai_assistance_level: 'minimal' | 'moderate' | 'high'
  review_frequency: 'low' | 'medium' | 'high'
}

/**
 * 成功标准接口
 */
export interface SuccessCriteria {
  criterion: string
  measurement_method: string
  threshold: number
  weight: number // 0-1
  evaluation_timing: 'immediate' | 'delayed' | 'cumulative'
}

/**
 * 预测结果接口
 */
export interface PredictedOutcome {
  metric: string
  predicted_value: number
  confidence_interval: [number, number]
  timeframe: string
  influencing_factors: string[]
}

/**
 * 路径推荐接口
 */
export interface PathRecommendation {
  path_id: string
  recommendation_reason: string
  suitability_score: number // 0-100
  estimated_completion_time: number // hours
  challenge_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  resource_requirements: ResourceRequirement[]
}

/**
 * 资源需求接口
 */
export interface ResourceRequirement {
  resource_type: 'time' | 'tools' | 'materials' | 'support' | 'environment'
  description: string
  availability_requirement: 'required' | 'recommended' | 'optional'
  quantity_estimate: string
}

/**
 * 预测性学习路径规划引擎
 */
export class PredictiveLearningPathPlanner {
  private userId: string
  private generatedPaths: Map<string, LearningPath> = new Map()
  private pathHistory: LearningPath[] = []
  private optimizationCriteria: OptimizationCriteria

  constructor(userId: string) {
    this.userId = userId
    this.optimizationCriteria = this.getDefaultOptimizationCriteria()
  }

  /**
   * 生成个性化学习路径
   */
  async generatePersonalizedPaths(
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics,
    learningGoals: string[],
    availableTime: number, // hours per week
    preferredDifficulty: number = 5 // 1-10
  ): Promise<{
    recommended_paths: LearningPath[]
    path_recommendations: PathRecommendation[]
    optimization_insights: string[]
    alternative_approaches: AlternativeApproach[]
  }> {
    // 1. 分析用户特征
    const userProfile = this.analyzeUserProfile(behaviorData, cognitiveMetrics)

    // 2. 生成候选路径
    const candidatePaths = this.generateCandidatePaths(
      userProfile,
      learningGoals,
      availableTime,
      preferredDifficulty
    )

    // 3. 优化路径选择
    const optimizedPaths = this.optimizePaths(candidatePaths, userProfile)

    // 4. 生成推荐和洞察
    const recommendations = this.generatePathRecommendations(optimizedPaths, userProfile)
    const insights = this.generateOptimizationInsights(optimizedPaths, userProfile)
    const alternatives = this.generateAlternativeApproaches(optimizedPaths)

    return {
      recommended_paths: optimizedPaths,
      path_recommendations: recommendations,
      optimization_insights: insights,
      alternative_approaches: alternatives
    }
  }

  /**
   * 分析用户档案
   */
  private analyzeUserProfile(
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics
  ): UserProfile {
    return {
      learning_velocity: behaviorData.performance_metrics.improvement_velocity,
      cognitive_capacity: this.calculateCognitiveCapacity(cognitiveMetrics),
      preferred_pace: this.inferPreferredPace(behaviorData),
      attention_span: this.estimateAttentionSpan(cognitiveMetrics),
      help_seeking_tendency: behaviorData.interaction_patterns.help_seeking_pattern,
      error_tolerance: this.calculateErrorTolerance(behaviorData),
      motivation_level: this.assessMotivationLevel(behaviorData),
      learning_style_preference: this.identifyLearningStylePreference(behaviorData)
    }
  }

  /**
   * 生成候选路径
   */
  private generateCandidatePaths(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number,
    preferredDifficulty: number
  ): LearningPath[] {
    const paths: LearningPath[] = []

    // 1. 效率优先路径
    paths.push(this.createEfficiencyFocusedPath(userProfile, learningGoals, availableTime))

    // 2. 深度学习路径
    paths.push(this.createDepthFocusedPath(userProfile, learningGoals, availableTime))

    // 3. 平衡发展路径
    paths.push(this.createBalancedPath(userProfile, learningGoals, availableTime))

    // 4. 快速入门路径
    paths.push(this.createQuickStartPath(userProfile, learningGoals, availableTime))

    // 5. 项目驱动路径
    paths.push(this.createProjectDrivenPath(userProfile, learningGoals, availableTime))

    return paths.filter(path => path.personalization_score > 60)
  }

  /**
   * 创建效率优先路径
   */
  private createEfficiencyFocusedPath(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number
  ): LearningPath {
    const modules = this.generateEfficiencyModules(learningGoals, userProfile)
    
    return {
      id: `efficiency_path_${Date.now()}`,
      name: '效率优先学习路径',
      description: '专注于快速掌握核心概念，最短时间达到学习目标',
      estimated_duration: Math.min(availableTime * 0.8, modules.reduce((sum, m) => sum + m.estimated_time / 60, 0)),
      difficulty_progression: {
        progression_type: 'linear',
        starting_difficulty: Math.max(1, userProfile.cognitive_capacity * 10 - 2),
        target_difficulty: Math.min(10, userProfile.cognitive_capacity * 10 + 1),
        adaptation_rate: 0.8,
        milestone_checkpoints: [25, 50, 75, 100]
      },
      learning_modules: modules,
      prerequisite_knowledge: this.identifyPrerequisites(learningGoals),
      predicted_outcomes: this.predictEfficiencyOutcomes(userProfile, availableTime),
      personalization_score: this.calculatePersonalizationScore(userProfile, 'efficiency'),
      success_probability: this.predictSuccessProbability(userProfile, 'efficiency')
    }
  }

  /**
   * 创建深度学习路径
   */
  private createDepthFocusedPath(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number
  ): LearningPath {
    const modules = this.generateDepthModules(learningGoals, userProfile)
    
    return {
      id: `depth_path_${Date.now()}`,
      name: '深度学习路径',
      description: '注重概念深度理解和知识体系构建',
      estimated_duration: availableTime * 1.2,
      difficulty_progression: {
        progression_type: 'spiral',
        starting_difficulty: Math.max(2, userProfile.cognitive_capacity * 10 - 1),
        target_difficulty: Math.min(10, userProfile.cognitive_capacity * 10 + 2),
        adaptation_rate: 0.5,
        milestone_checkpoints: [20, 40, 60, 80, 100]
      },
      learning_modules: modules,
      prerequisite_knowledge: this.identifyPrerequisites(learningGoals),
      predicted_outcomes: this.predictDepthOutcomes(userProfile, availableTime),
      personalization_score: this.calculatePersonalizationScore(userProfile, 'depth'),
      success_probability: this.predictSuccessProbability(userProfile, 'depth')
    }
  }

  /**
   * 创建平衡发展路径
   */
  private createBalancedPath(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number
  ): LearningPath {
    const modules = this.generateBalancedModules(learningGoals, userProfile)
    
    return {
      id: `balanced_path_${Date.now()}`,
      name: '平衡发展路径',
      description: '理论与实践并重，全面发展各项能力',
      estimated_duration: availableTime,
      difficulty_progression: {
        progression_type: 'adaptive',
        starting_difficulty: userProfile.cognitive_capacity * 10,
        target_difficulty: Math.min(9, userProfile.cognitive_capacity * 10 + 2),
        adaptation_rate: 0.7,
        milestone_checkpoints: [15, 30, 45, 60, 75, 90, 100]
      },
      learning_modules: modules,
      prerequisite_knowledge: this.identifyPrerequisites(learningGoals),
      predicted_outcomes: this.predictBalancedOutcomes(userProfile, availableTime),
      personalization_score: this.calculatePersonalizationScore(userProfile, 'balanced'),
      success_probability: this.predictSuccessProbability(userProfile, 'balanced')
    }
  }

  /**
   * 创建快速入门路径
   */
  private createQuickStartPath(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number
  ): LearningPath {
    const modules = this.generateQuickStartModules(learningGoals, userProfile)
    
    return {
      id: `quickstart_path_${Date.now()}`,
      name: '快速入门路径',
      description: '快速上手，立即开始实践',
      estimated_duration: Math.min(availableTime * 0.6, 20),
      difficulty_progression: {
        progression_type: 'exponential',
        starting_difficulty: 1,
        target_difficulty: 6,
        adaptation_rate: 0.9,
        milestone_checkpoints: [30, 60, 100]
      },
      learning_modules: modules,
      prerequisite_knowledge: [],
      predicted_outcomes: this.predictQuickStartOutcomes(userProfile, availableTime),
      personalization_score: this.calculatePersonalizationScore(userProfile, 'quickstart'),
      success_probability: this.predictSuccessProbability(userProfile, 'quickstart')
    }
  }

  /**
   * 创建项目驱动路径
   */
  private createProjectDrivenPath(
    userProfile: UserProfile,
    learningGoals: string[],
    availableTime: number
  ): LearningPath {
    const modules = this.generateProjectModules(learningGoals, userProfile)
    
    return {
      id: `project_path_${Date.now()}`,
      name: '项目驱动路径',
      description: '通过实际项目学习，边做边学',
      estimated_duration: availableTime * 1.1,
      difficulty_progression: {
        progression_type: 'adaptive',
        starting_difficulty: 3,
        target_difficulty: 8,
        adaptation_rate: 0.6,
        milestone_checkpoints: [25, 50, 75, 100]
      },
      learning_modules: modules,
      prerequisite_knowledge: this.identifyPrerequisites(learningGoals),
      predicted_outcomes: this.predictProjectOutcomes(userProfile, availableTime),
      personalization_score: this.calculatePersonalizationScore(userProfile, 'project'),
      success_probability: this.predictSuccessProbability(userProfile, 'project')
    }
  }

  /**
   * 生成效率模块
   */
  private generateEfficiencyModules(learningGoals: string[], userProfile: UserProfile): LearningModule[] {
    return learningGoals.map((goal, index) => ({
      id: `efficiency_module_${index}`,
      title: `高效掌握: ${goal}`,
      type: index % 3 === 0 ? 'concept' : index % 3 === 1 ? 'practice' : 'assessment' as any,
      estimated_time: Math.max(15, Math.min(45, userProfile.attention_span)),
      difficulty_level: Math.min(8, 3 + index),
      prerequisites: index > 0 ? [`efficiency_module_${index - 1}`] : [],
      learning_objectives: [`快速理解${goal}`, `掌握${goal}核心要点`],
      adaptive_parameters: {
        min_mastery_threshold: 70,
        max_attempts: 3,
        hint_availability: true,
        peer_collaboration: false,
        ai_assistance_level: 'high',
        review_frequency: 'low'
      },
      success_criteria: [{
        criterion: '核心概念掌握',
        measurement_method: '快速测试',
        threshold: 70,
        weight: 1.0,
        evaluation_timing: 'immediate'
      }]
    }))
  }

  /**
   * 生成深度模块
   */
  private generateDepthModules(learningGoals: string[], userProfile: UserProfile): LearningModule[] {
    return learningGoals.flatMap((goal, index) => [
      {
        id: `depth_concept_${index}`,
        title: `深度理解: ${goal}理论基础`,
        type: 'concept' as any,
        estimated_time: Math.max(30, userProfile.attention_span * 1.2),
        difficulty_level: Math.min(9, 4 + index),
        prerequisites: index > 0 ? [`depth_concept_${index - 1}`] : [],
        learning_objectives: [`深入理解${goal}`, `构建${goal}知识体系`],
        adaptive_parameters: {
          min_mastery_threshold: 85,
          max_attempts: 5,
          hint_availability: true,
          peer_collaboration: true,
          ai_assistance_level: 'moderate',
          review_frequency: 'high'
        },
        success_criteria: [{
          criterion: '深度理解',
          measurement_method: '综合分析',
          threshold: 85,
          weight: 0.7,
          evaluation_timing: 'delayed'
        }, {
          criterion: '知识关联',
          measurement_method: '概念映射',
          threshold: 80,
          weight: 0.3,
          evaluation_timing: 'cumulative'
        }]
      },
      {
        id: `depth_practice_${index}`,
        title: `深度练习: ${goal}应用实践`,
        type: 'practice' as any,
        estimated_time: Math.max(45, userProfile.attention_span * 1.5),
        difficulty_level: Math.min(10, 5 + index),
        prerequisites: [`depth_concept_${index}`],
        learning_objectives: [`应用${goal}解决问题`, `熟练运用${goal}`],
        adaptive_parameters: {
          min_mastery_threshold: 80,
          max_attempts: 4,
          hint_availability: true,
          peer_collaboration: true,
          ai_assistance_level: 'moderate',
          review_frequency: 'medium'
        },
        success_criteria: [{
          criterion: '应用能力',
          measurement_method: '实践评估',
          threshold: 80,
          weight: 1.0,
          evaluation_timing: 'immediate'
        }]
      }
    ])
  }

  /**
   * 生成平衡模块
   */
  private generateBalancedModules(learningGoals: string[], userProfile: UserProfile): LearningModule[] {
    const modules: LearningModule[] = []
    
    learningGoals.forEach((goal, index) => {
      // 概念学习
      modules.push({
        id: `balanced_concept_${index}`,
        title: `理解: ${goal}`,
        type: 'concept',
        estimated_time: userProfile.attention_span,
        difficulty_level: 3 + index,
        prerequisites: index > 0 ? [`balanced_concept_${index - 1}`] : [],
        learning_objectives: [`理解${goal}基本概念`],
        adaptive_parameters: {
          min_mastery_threshold: 75,
          max_attempts: 4,
          hint_availability: true,
          peer_collaboration: false,
          ai_assistance_level: 'moderate',
          review_frequency: 'medium'
        },
        success_criteria: [{
          criterion: '概念理解',
          measurement_method: '理论测试',
          threshold: 75,
          weight: 1.0,
          evaluation_timing: 'immediate'
        }]
      })
      
      // 实践练习
      modules.push({
        id: `balanced_practice_${index}`,
        title: `练习: ${goal}`,
        type: 'practice',
        estimated_time: userProfile.attention_span * 1.2,
        difficulty_level: 4 + index,
        prerequisites: [`balanced_concept_${index}`],
        learning_objectives: [`练习${goal}应用`],
        adaptive_parameters: {
          min_mastery_threshold: 75,
          max_attempts: 3,
          hint_availability: true,
          peer_collaboration: true,
          ai_assistance_level: 'moderate',
          review_frequency: 'medium'
        },
        success_criteria: [{
          criterion: '实践能力',
          measurement_method: '练习评估',
          threshold: 75,
          weight: 1.0,
          evaluation_timing: 'immediate'
        }]
      })
      
      // 每两个目标后添加一次评估
      if ((index + 1) % 2 === 0) {
        modules.push({
          id: `balanced_assessment_${Math.floor(index / 2)}`,
          title: `阶段评估`,
          type: 'assessment',
          estimated_time: 30,
          difficulty_level: 5 + Math.floor(index / 2),
          prerequisites: [`balanced_practice_${index}`],
          learning_objectives: ['综合评估学习效果'],
          adaptive_parameters: {
            min_mastery_threshold: 80,
            max_attempts: 2,
            hint_availability: false,
            peer_collaboration: false,
            ai_assistance_level: 'minimal',
            review_frequency: 'low'
          },
          success_criteria: [{
            criterion: '综合掌握',
            measurement_method: '综合测试',
            threshold: 80,
            weight: 1.0,
            evaluation_timing: 'immediate'
          }]
        })
      }
    })
    
    return modules
  }

  /**
   * 生成快速入门模块
   */
  private generateQuickStartModules(learningGoals: string[], userProfile: UserProfile): LearningModule[] {
    return learningGoals.slice(0, 3).map((goal, index) => ({
      id: `quickstart_${index}`,
      title: `快速上手: ${goal}`,
      type: index === 2 ? 'project' : 'practice' as any,
      estimated_time: Math.min(30, userProfile.attention_span * 0.8),
      difficulty_level: 2 + index,
      prerequisites: index > 0 ? [`quickstart_${index - 1}`] : [],
      learning_objectives: [`快速掌握${goal}基础`],
      adaptive_parameters: {
        min_mastery_threshold: 60,
        max_attempts: 2,
        hint_availability: true,
        peer_collaboration: false,
        ai_assistance_level: 'high',
        review_frequency: 'low'
      },
      success_criteria: [{
        criterion: '基础掌握',
        measurement_method: '快速验证',
        threshold: 60,
        weight: 1.0,
        evaluation_timing: 'immediate'
      }]
    }))
  }

  /**
   * 生成项目模块
   */
  private generateProjectModules(learningGoals: string[], userProfile: UserProfile): LearningModule[] {
    const modules: LearningModule[] = []
    
    // 项目规划
    modules.push({
      id: 'project_planning',
      title: '项目规划与设计',
      type: 'concept',
      estimated_time: 45,
      difficulty_level: 3,
      prerequisites: [],
      learning_objectives: ['规划学习项目', '设计实现方案'],
      adaptive_parameters: {
        min_mastery_threshold: 70,
        max_attempts: 3,
        hint_availability: true,
        peer_collaboration: true,
        ai_assistance_level: 'moderate',
        review_frequency: 'medium'
      },
      success_criteria: [{
        criterion: '项目规划',
        measurement_method: '方案评估',
        threshold: 70,
        weight: 1.0,
        evaluation_timing: 'immediate'
      }]
    })
    
    // 实际项目实施
    learningGoals.forEach((goal, index) => {
      modules.push({
        id: `project_implement_${index}`,
        title: `项目实施: ${goal}模块`,
        type: 'project',
        estimated_time: userProfile.attention_span * 2,
        difficulty_level: 4 + index,
        prerequisites: index === 0 ? ['project_planning'] : [`project_implement_${index - 1}`],
        learning_objectives: [`在项目中实现${goal}`],
        adaptive_parameters: {
          min_mastery_threshold: 75,
          max_attempts: 4,
          hint_availability: true,
          peer_collaboration: true,
          ai_assistance_level: 'moderate',
          review_frequency: 'high'
        },
        success_criteria: [{
          criterion: '功能实现',
          measurement_method: '项目评估',
          threshold: 75,
          weight: 0.8,
          evaluation_timing: 'cumulative'
        }, {
          criterion: '代码质量',
          measurement_method: '同行评议',
          threshold: 70,
          weight: 0.2,
          evaluation_timing: 'delayed'
        }]
      })
    })
    
    // 项目总结
    modules.push({
      id: 'project_review',
      title: '项目总结与反思',
      type: 'review',
      estimated_time: 30,
      difficulty_level: 6,
      prerequisites: [`project_implement_${learningGoals.length - 1}`],
      learning_objectives: ['总结项目经验', '反思学习过程'],
      adaptive_parameters: {
        min_mastery_threshold: 80,
        max_attempts: 2,
        hint_availability: false,
        peer_collaboration: true,
        ai_assistance_level: 'minimal',
        review_frequency: 'low'
      },
      success_criteria: [{
        criterion: '项目总结',
        measurement_method: '反思报告',
        threshold: 80,
        weight: 1.0,
        evaluation_timing: 'delayed'
      }]
    })
    
    return modules
  }

  /**
   * 计算认知容量
   */
  private calculateCognitiveCapacity(cognitiveMetrics: CognitiveLoadMetrics): number {
    const efficiency = cognitiveMetrics.session_metrics.overall_efficiency
    const totalLoad = cognitiveMetrics.session_metrics.total_cognitive_load
    
    // 标准化到 0-1 范围
    return Math.max(0.1, Math.min(1.0, (efficiency / 100) * (1 - totalLoad / 100)))
  }

  /**
   * 推断偏好节奏
   */
  private inferPreferredPace(behaviorData: LearningBehaviorData): 'slow' | 'medium' | 'fast' {
    const responseTime = behaviorData.interaction_patterns.average_response_time
    
    if (responseTime < 20) return 'fast'
    if (responseTime > 60) return 'slow'
    return 'medium'
  }

  /**
   * 估算注意力持续时间
   */
  private estimateAttentionSpan(cognitiveMetrics: CognitiveLoadMetrics): number {
    // 基于认知负荷数据估算，返回分钟数
    const efficiency = cognitiveMetrics.session_metrics.overall_efficiency
    const baseSpan = 30 // 基础30分钟
    
    return Math.round(baseSpan * (efficiency / 100))
  }

  /**
   * 计算错误容忍度
   */
  private calculateErrorTolerance(behaviorData: LearningBehaviorData): number {
    const errorRate = behaviorData.performance_metrics.error_frequency
    const retentionRate = behaviorData.performance_metrics.retention_rate
    
    // 错误率低但保持率高说明容忍度好
    return Math.max(0, 1 - errorRate + retentionRate * 0.5)
  }

  /**
   * 评估动机水平
   */
  private assessMotivationLevel(behaviorData: LearningBehaviorData): number {
    const completionRate = behaviorData.performance_metrics.task_completion_rate
    const improvementVelocity = behaviorData.performance_metrics.improvement_velocity
    
    return Math.min(1.0, (completionRate / 100 + improvementVelocity) / 2)
  }

  /**
   * 识别学习风格偏好
   */
  private identifyLearningStylePreference(behaviorData: LearningBehaviorData): string {
    const helpSeeking = behaviorData.interaction_patterns.help_seeking_pattern
    const responseLength = behaviorData.interaction_patterns.message_length_preference
    
    if (helpSeeking === 'frequent') return 'collaborative'
    if (responseLength > 100) return 'detailed'
    return 'practical'
  }

  /**
   * 优化路径
   */
  private optimizePaths(candidatePaths: LearningPath[], userProfile: UserProfile): LearningPath[] {
    return candidatePaths
      .filter(path => path.success_probability > 0.6)
      .sort((a, b) => b.personalization_score - a.personalization_score)
      .slice(0, 3) // 返回前3个最优路径
  }

  /**
   * 计算个性化评分
   */
  private calculatePersonalizationScore(userProfile: UserProfile, pathType: string): number {
    let score = 50 // 基础分

    // 基于用户档案调整分数
    switch (pathType) {
      case 'efficiency':
        score += userProfile.learning_velocity * 30
        score += userProfile.preferred_pace === 'fast' ? 20 : 0
        break
      case 'depth':
        score += userProfile.error_tolerance * 25
        score += userProfile.attention_span > 45 ? 20 : 0
        break
      case 'balanced':
        score += userProfile.motivation_level * 20
        score += 15 // 平衡路径通常适合大多数人
        break
      case 'quickstart':
        score += userProfile.preferred_pace === 'fast' ? 25 : 0
        score += userProfile.motivation_level * 15
        break
      case 'project':
        score += userProfile.learning_style_preference === 'practical' ? 25 : 0
        score += userProfile.motivation_level * 20
        break
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * 预测成功概率
   */
  private predictSuccessProbability(userProfile: UserProfile, pathType: string): number {
    let probability = 0.6 // 基础概率

    // 基于用户档案和路径类型调整
    probability += userProfile.motivation_level * 0.2
    probability += userProfile.cognitive_capacity * 0.15
    probability += (1 - userProfile.error_tolerance) * 0.05

    return Math.min(0.95, Math.max(0.1, probability))
  }

  /**
   * 生成路径推荐
   */
  private generatePathRecommendations(paths: LearningPath[], userProfile: UserProfile): PathRecommendation[] {
    return paths.map(path => ({
      path_id: path.id,
      recommendation_reason: this.generateRecommendationReason(path, userProfile),
      suitability_score: path.personalization_score,
      estimated_completion_time: path.estimated_duration,
      challenge_level: this.determinechallengeLevel(path),
      resource_requirements: this.determineResourceRequirements(path)
    }))
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReason(path: LearningPath, userProfile: UserProfile): string {
    const reasons = []
    
    if (path.personalization_score > 80) {
      reasons.push('高度匹配您的学习特点')
    }
    
    if (path.success_probability > 0.8) {
      reasons.push('成功概率很高')
    }
    
    if (userProfile.preferred_pace === 'fast' && path.name.includes('效率')) {
      reasons.push('符合您的快节奏学习偏好')
    }
    
    if (userProfile.learning_style_preference === 'practical' && path.name.includes('项目')) {
      reasons.push('适合您的实践型学习风格')
    }
    
    return reasons.join(', ') || '综合考虑您的学习特点推荐'
  }

  /**
   * 确定挑战等级
   */
  private determinechallengeLevel(path: LearningPath): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const avgDifficulty = (path.difficulty_progression.starting_difficulty + path.difficulty_progression.target_difficulty) / 2
    
    if (avgDifficulty <= 3) return 'beginner'
    if (avgDifficulty <= 6) return 'intermediate'
    if (avgDifficulty <= 8) return 'advanced'
    return 'expert'
  }

  /**
   * 确定资源需求
   */
  private determineResourceRequirements(path: LearningPath): ResourceRequirement[] {
    const requirements: ResourceRequirement[] = []
    
    requirements.push({
      resource_type: 'time',
      description: `每周${Math.ceil(path.estimated_duration / 4)}小时学习时间`,
      availability_requirement: 'required',
      quantity_estimate: `${path.estimated_duration}小时总计`
    })
    
    if (path.learning_modules.some(m => m.type === 'project')) {
      requirements.push({
        resource_type: 'tools',
        description: '开发工具和环境',
        availability_requirement: 'required',
        quantity_estimate: '基础开发环境'
      })
    }
    
    if (path.learning_modules.some(m => m.adaptive_parameters.peer_collaboration)) {
      requirements.push({
        resource_type: 'support',
        description: '同伴协作和交流',
        availability_requirement: 'recommended',
        quantity_estimate: '定期互动'
      })
    }
    
    return requirements
  }

  /**
   * 识别先决条件
   */
  private identifyPrerequisites(learningGoals: string[]): string[] {
    // 简化实现：基于目标推断先决条件
    const prerequisites: string[] = []
    
    if (learningGoals.some(goal => goal.toLowerCase().includes('advanced'))) {
      prerequisites.push('基础概念理解')
    }
    
    if (learningGoals.some(goal => goal.toLowerCase().includes('programming'))) {
      prerequisites.push('编程基础')
    }
    
    return prerequisites
  }

  /**
   * 预测各类结果
   */
  private predictEfficiencyOutcomes(userProfile: UserProfile, availableTime: number): PredictedOutcome[] {
    return [
      {
        metric: 'completion_rate',
        predicted_value: Math.min(95, 70 + userProfile.motivation_level * 25),
        confidence_interval: [65, 95],
        timeframe: `${Math.ceil(availableTime * 0.8)}小时内`,
        influencing_factors: ['学习动机', '可用时间', '认知能力']
      },
      {
        metric: 'knowledge_retention',
        predicted_value: Math.min(85, 60 + userProfile.cognitive_capacity * 25),
        confidence_interval: [55, 85],
        timeframe: '1个月后',
        influencing_factors: ['认知容量', '复习频率']
      }
    ]
  }

  private predictDepthOutcomes(userProfile: UserProfile, availableTime: number): PredictedOutcome[] {
    return [
      {
        metric: 'understanding_depth',
        predicted_value: Math.min(90, 65 + userProfile.error_tolerance * 25),
        confidence_interval: [70, 90],
        timeframe: `${Math.ceil(availableTime * 1.2)}小时内`,
        influencing_factors: ['错误容忍度', '注意力持续时间']
      }
    ]
  }

  private predictBalancedOutcomes(userProfile: UserProfile, availableTime: number): PredictedOutcome[] {
    return [
      {
        metric: 'overall_competency',
        predicted_value: 75 + userProfile.motivation_level * 15,
        confidence_interval: [65, 85],
        timeframe: `${availableTime}小时内`,
        influencing_factors: ['学习动机', '平衡能力']
      }
    ]
  }

  private predictQuickStartOutcomes(userProfile: UserProfile, availableTime: number): PredictedOutcome[] {
    return [
      {
        metric: 'quick_mastery',
        predicted_value: 65 + (userProfile.preferred_pace === 'fast' ? 20 : 0),
        confidence_interval: [50, 80],
        timeframe: `${Math.ceil(availableTime * 0.6)}小时内`,
        influencing_factors: ['学习节奏偏好', '基础能力']
      }
    ]
  }

  private predictProjectOutcomes(userProfile: UserProfile, availableTime: number): PredictedOutcome[] {
    return [
      {
        metric: 'practical_skills',
        predicted_value: 80 + (userProfile.learning_style_preference === 'practical' ? 15 : 0),
        confidence_interval: [70, 90],
        timeframe: `${Math.ceil(availableTime * 1.1)}小时内`,
        influencing_factors: ['实践偏好', '项目经验']
      }
    ]
  }

  /**
   * 生成优化洞察
   */
  private generateOptimizationInsights(paths: LearningPath[], userProfile: UserProfile): string[] {
    const insights: string[] = []
    
    const bestPath = paths[0]
    insights.push(`推荐路径"${bestPath.name}"最适合您的学习特点`)
    
    if (userProfile.cognitive_capacity > 0.8) {
      insights.push('您的认知能力较强，可以考虑更有挑战性的内容')
    }
    
    if (userProfile.motivation_level > 0.8) {
      insights.push('您的学习动机很高，适合设定更高的学习目标')
    }
    
    if (userProfile.attention_span < 30) {
      insights.push('建议将学习内容分解成更小的模块，每次15-20分钟')
    }
    
    return insights
  }

  /**
   * 生成替代方案
   */
  private generateAlternativeApproaches(paths: LearningPath[]): AlternativeApproach[] {
    return [
      {
        approach_name: '混合学习模式',
        description: '结合线上学习和线下实践',
        suitability_score: 75,
        trade_offs: ['需要更多时间', '但学习效果更佳']
      },
      {
        approach_name: '同伴学习',
        description: '与其他学习者组成学习小组',
        suitability_score: 70,
        trade_offs: ['需要协调时间', '但可以互相激励']
      },
      {
        approach_name: '导师指导',
        description: '寻找经验丰富的导师进行一对一指导',
        suitability_score: 85,
        trade_offs: ['成本较高', '但针对性更强']
      }
    ]
  }

  /**
   * 获取默认优化标准
   */
  private getDefaultOptimizationCriteria(): OptimizationCriteria {
    return {
      primary_goal: 'learning_effectiveness',
      weights: {
        'efficiency': 0.3,
        'effectiveness': 0.4,
        'engagement': 0.2,
        'retention': 0.1
      },
      constraints: [
        {
          constraint_type: 'time_limit',
          constraint_value: 100, // 小时
          flexibility: 'preferred'
        }
      ],
      optimization_algorithm: 'weighted_scoring'
    }
  }
}

// 接口定义
interface UserProfile {
  learning_velocity: number
  cognitive_capacity: number
  preferred_pace: 'slow' | 'medium' | 'fast'
  attention_span: number
  help_seeking_tendency: string
  error_tolerance: number
  motivation_level: number
  learning_style_preference: string
}

interface OptimizationCriteria {
  primary_goal: string
  weights: Record<string, number>
  constraints: Array<{
    constraint_type: string
    constraint_value: any
    flexibility: string
  }>
  optimization_algorithm: string
}

interface AlternativeApproach {
  approach_name: string
  description: string
  suitability_score: number
  trade_offs: string[]
}

// 导出单例实例
let plannerInstance: PredictiveLearningPathPlanner | null = null

export function getPredictiveLearningPathPlanner(userId: string): PredictiveLearningPathPlanner {
  if (!plannerInstance || (plannerInstance as any).userId !== userId) {
    plannerInstance = new PredictiveLearningPathPlanner(userId)
  }
  return plannerInstance
}

export { PredictiveLearningPathPlanner }
