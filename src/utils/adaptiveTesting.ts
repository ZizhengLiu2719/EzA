/**
 * 适应性测试系统 (Adaptive Testing System)
 * 计算机化自适应测试 (CAT - Computer Adaptive Testing)
 * Phase 2: Real-time capability assessment and knowledge state modeling
 */

/**
 * 测试项目接口
 */
export interface TestItem {
  item_id: string
  content: string
  item_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'performance'
  difficulty_parameter: number // IRT b parameter (-3 to +3)
  discrimination_parameter: number // IRT a parameter (0.5 to 2.5)
  guessing_parameter?: number // IRT c parameter (0 to 0.3)
  content_area: string
  cognitive_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  estimated_time: number // seconds
  options?: string[] // for multiple choice
  correct_answer?: string
  rubric?: AssessmentRubric
}

/**
 * 评分标准接口
 */
export interface AssessmentRubric {
  max_score: number
  criteria: RubricCriterion[]
  scoring_method: 'holistic' | 'analytic' | 'automated'
}

/**
 * 评分标准条目
 */
export interface RubricCriterion {
  criterion_name: string
  weight: number // 0-1
  levels: RubricLevel[]
}

/**
 * 评分等级
 */
export interface RubricLevel {
  level: number
  description: string
  score: number
}

/**
 * 测试会话接口
 */
export interface TestSession {
  session_id: string
  user_id: string
  test_type: 'diagnostic' | 'formative' | 'summative' | 'placement'
  start_time: string
  end_time?: string
  status: 'in_progress' | 'completed' | 'terminated' | 'paused'
  current_ability_estimate: number // theta
  current_standard_error: number
  items_administered: TestItemResponse[]
  stopping_reason?: 'max_items' | 'target_precision' | 'time_limit' | 'user_termination'
  final_ability_estimate?: number
  reliability_estimate?: number
  confidence_interval?: [number, number]
}

/**
 * 测试项目响应接口
 */
export interface TestItemResponse {
  item_id: string
  response: any
  correct: boolean
  response_time: number // seconds
  administration_timestamp: string
  ability_before: number
  ability_after: number
  standard_error_before: number
  standard_error_after: number
  information_gain: number
}

/**
 * 测试配置接口
 */
export interface TestConfiguration {
  test_id: string
  subject_domain: string
  test_purpose: 'diagnostic' | 'formative' | 'summative' | 'placement'
  min_items: number
  max_items: number
  target_precision: number // target SEM
  time_limit_minutes?: number
  difficulty_range: [number, number] // [min, max] difficulty
  content_balancing: boolean
  exposure_control: boolean
  item_selection_method: ItemSelectionMethod
  ability_estimation_method: AbilityEstimationMethod
  stopping_criteria: StoppingCriteria
}

/**
 * 项目选择方法
 */
export type ItemSelectionMethod = 
  | 'maximum_information' | 'bayesian_expected_posterior'
  | 'kullback_leibler' | 'fisher_information' | 'random'

/**
 * 能力估算方法
 */
export type AbilityEstimationMethod = 
  | 'maximum_likelihood' | 'bayesian_modal' | 'expected_aposteriori'
  | 'weighted_likelihood'

/**
 * 停止标准接口
 */
export interface StoppingCriteria {
  max_time_minutes?: number
  target_sem?: number // Standard Error of Measurement
  confidence_level?: number // 0-1
  min_reliability?: number // 0-1
  classification_accuracy?: number // 0-1
}

/**
 * 项目信息函数接口
 */
export interface ItemInformation {
  item_id: string
  information_at_theta: (theta: number) => number
  maximum_information: number
  optimal_theta: number
}

/**
 * 能力评估结果接口
 */
export interface AbilityAssessment {
  user_id: string
  subject_domain: string
  ability_estimate: number // theta
  standard_error: number
  confidence_interval: [number, number]
  reliability: number // 0-1
  percentile_rank: number // 0-100
  proficiency_level: 'below_basic' | 'basic' | 'proficient' | 'advanced'
  strengths: string[]
  areas_for_improvement: string[]
  recommended_next_steps: string[]
  assessment_timestamp: string
}

/**
 * 自适应测试引擎类
 */
export class AdaptiveTestingEngine {
  private userId: string
  private testConfiguration: TestConfiguration
  private itemBank: Map<string, TestItem> = new Map()
  private currentSession: TestSession | null = null
  private administeredItems: Set<string> = new Set()
  private irtModel: IRTModel

  constructor(userId: string, config: TestConfiguration) {
    this.userId = userId
    this.testConfiguration = config
    this.irtModel = new IRTModel('2PL') // Default to 2-Parameter Logistic Model
    this.initializeItemBank()
  }

  /**
   * 开始自适应测试会话
   */
  async startTestSession(): Promise<{
    session_id: string
    first_item: TestItem
    initial_ability_estimate: number
    estimated_completion_time: number
  }> {
    // 1. 创建新的测试会话
    this.currentSession = {
      session_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: this.userId,
      test_type: this.testConfiguration.test_purpose,
      start_time: new Date().toISOString(),
      status: 'in_progress',
      current_ability_estimate: 0, // 初始能力估计为0 (平均水平)
      current_standard_error: 1.0, // 初始标准误差较大
      items_administered: []
    }

    // 2. 选择第一个测试项目
    const firstItem = this.selectNextItem(0, 1.0)

    // 3. 估算完成时间
    const estimatedTime = this.estimateCompletionTime()

    return {
      session_id: this.currentSession.session_id,
      first_item: firstItem,
      initial_ability_estimate: 0,
      estimated_completion_time: estimatedTime
    }
  }

  /**
   * 提交测试项目响应
   */
  async submitItemResponse(
    itemId: string,
    response: any,
    responseTime: number
  ): Promise<{
    correct: boolean
    updated_ability_estimate: number
    updated_standard_error: number
    next_item?: TestItem
    session_complete: boolean
    assessment_result?: AbilityAssessment
  }> {
    if (!this.currentSession) {
      throw new Error('No active test session')
    }

    const item = this.itemBank.get(itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }

    // 1. 评分响应
    const correct = this.scoreResponse(item, response)

    // 2. 更新能力估计
    const abilityBefore = this.currentSession.current_ability_estimate
    const seBefore = this.currentSession.current_standard_error

    const { newAbility, newSE } = this.updateAbilityEstimate(
      abilityBefore,
      seBefore,
      item,
      correct
    )

    // 3. 记录响应
    const itemResponse: TestItemResponse = {
      item_id: itemId,
      response,
      correct,
      response_time: responseTime,
      administration_timestamp: new Date().toISOString(),
      ability_before: abilityBefore,
      ability_after: newAbility,
      standard_error_before: seBefore,
      standard_error_after: newSE,
      information_gain: this.calculateInformationGain(item, abilityBefore, newAbility)
    }

    this.currentSession.items_administered.push(itemResponse)
    this.currentSession.current_ability_estimate = newAbility
    this.currentSession.current_standard_error = newSE
    this.administeredItems.add(itemId)

    // 4. 检查停止条件
    const shouldStop = this.checkStoppingCriteria()

    if (shouldStop.stop) {
      // 完成测试
      this.currentSession.status = 'completed'
      this.currentSession.end_time = new Date().toISOString()
      this.currentSession.stopping_reason = shouldStop.reason
      this.currentSession.final_ability_estimate = newAbility
      this.currentSession.reliability_estimate = this.calculateReliability()
      this.currentSession.confidence_interval = this.calculateConfidenceInterval(newAbility, newSE)

      const assessmentResult = this.generateFinalAssessment()

      return {
        correct,
        updated_ability_estimate: newAbility,
        updated_standard_error: newSE,
        session_complete: true,
        assessment_result: assessmentResult
      }
    } else {
      // 选择下一个项目
      const nextItem = this.selectNextItem(newAbility, newSE)

      return {
        correct,
        updated_ability_estimate: newAbility,
        updated_standard_error: newSE,
        next_item: nextItem,
        session_complete: false
      }
    }
  }

  /**
   * 选择下一个测试项目
   */
  private selectNextItem(currentAbility: number, currentSE: number): TestItem {
    const availableItems = Array.from(this.itemBank.values())
      .filter(item => !this.administeredItems.has(item.item_id))
      .filter(item => this.meetsContentConstraints(item))

    if (availableItems.length === 0) {
      throw new Error('No more items available')
    }

    switch (this.testConfiguration.item_selection_method) {
      case 'maximum_information':
        return this.selectMaximumInformationItem(availableItems, currentAbility)
      
      case 'fisher_information':
        return this.selectFisherInformationItem(availableItems, currentAbility)
      
      case 'bayesian_expected_posterior':
        return this.selectBayesianItem(availableItems, currentAbility, currentSE)
      
      case 'random':
        return availableItems[Math.floor(Math.random() * availableItems.length)]
      
      default:
        return this.selectMaximumInformationItem(availableItems, currentAbility)
    }
  }

  /**
   * 选择最大信息量项目
   */
  private selectMaximumInformationItem(items: TestItem[], theta: number): TestItem {
    let maxInformation = 0
    let bestItem = items[0]

    for (const item of items) {
      const information = this.calculateItemInformation(item, theta)
      if (information > maxInformation) {
        maxInformation = information
        bestItem = item
      }
    }

    return bestItem
  }

  /**
   * 选择Fisher信息项目
   */
  private selectFisherInformationItem(items: TestItem[], theta: number): TestItem {
    // Fisher信息与最大信息方法类似，但考虑信息函数的二阶导数
    return this.selectMaximumInformationItem(items, theta)
  }

  /**
   * 选择贝叶斯项目
   */
  private selectBayesianItem(items: TestItem[], theta: number, se: number): TestItem {
    let maxExpectedInfo = 0
    let bestItem = items[0]

    for (const item of items) {
      // 计算期望后验信息
      const expectedInfo = this.calculateExpectedPosteriorInformation(item, theta, se)
      if (expectedInfo > maxExpectedInfo) {
        maxExpectedInfo = expectedInfo
        bestItem = item
      }
    }

    return bestItem
  }

  /**
   * 计算项目信息量
   */
  private calculateItemInformation(item: TestItem, theta: number): number {
    const a = item.discrimination_parameter
    const b = item.difficulty_parameter
    const c = item.guessing_parameter || 0

    // 2PL或3PL模型的信息函数
    const prob = this.irtModel.calculateProbability(theta, a, b, c)
    const q = 1 - prob

    if (c > 0) {
      // 3PL模型信息函数
      const numerator = a * a * q * ((prob - c) ** 2)
      const denominator = prob * ((1 - c) ** 2)
      return numerator / denominator
    } else {
      // 2PL模型信息函数
      return a * a * prob * q
    }
  }

  /**
   * 计算期望后验信息
   */
  private calculateExpectedPosteriorInformation(item: TestItem, theta: number, se: number): number {
    // 简化实现：计算正确和错误响应的期望信息
    const prob = this.irtModel.calculateProbability(theta, item.discrimination_parameter, item.difficulty_parameter, item.guessing_parameter)
    
    const infoIfCorrect = this.calculateItemInformation(item, theta + se)
    const infoIfIncorrect = this.calculateItemInformation(item, theta - se)
    
    return prob * infoIfCorrect + (1 - prob) * infoIfIncorrect
  }

  /**
   * 检查内容约束
   */
  private meetsContentConstraints(item: TestItem): boolean {
    if (!this.testConfiguration.content_balancing) {
      return true
    }

    // 简化实现：检查内容领域平衡
    const administeredByContent = new Map<string, number>()
    
    this.currentSession?.items_administered.forEach(response => {
      const adminItem = this.itemBank.get(response.item_id)
      if (adminItem) {
        const count = administeredByContent.get(adminItem.content_area) || 0
        administeredByContent.set(adminItem.content_area, count + 1)
      }
    })

    const currentCount = administeredByContent.get(item.content_area) || 0
    const maxAllowed = Math.ceil(this.testConfiguration.max_items / 3) // 假设有3个内容领域

    return currentCount < maxAllowed
  }

  /**
   * 评分响应
   */
  private scoreResponse(item: TestItem, response: any): boolean {
    switch (item.item_type) {
      case 'multiple_choice':
      case 'true_false':
        return response === item.correct_answer
      
      case 'short_answer':
        return this.scoreShortAnswer(item, response)
      
      case 'essay':
        return this.scoreEssay(item, response)
      
      case 'performance':
        return this.scorePerformance(item, response)
      
      default:
        return false
    }
  }

  /**
   * 简答题评分
   */
  private scoreShortAnswer(item: TestItem, response: string): boolean {
    // 简化实现：关键词匹配
    const keywords = item.correct_answer?.split('|') || []
    const responseText = response.toLowerCase()
    
    return keywords.some(keyword => responseText.includes(keyword.toLowerCase()))
  }

  /**
   * 作文题评分
   */
  private scoreEssay(item: TestItem, response: string): boolean {
    // 简化实现：基于长度和关键词的启发式评分
    const minLength = 100 // 最少字数
    const keywords = item.correct_answer?.split('|') || []
    
    if (response.length < minLength) return false
    
    const keywordMatches = keywords.filter(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    ).length
    
    return keywordMatches >= keywords.length * 0.6 // 至少60%关键词匹配
  }

  /**
   * 表现题评分
   */
  private scorePerformance(item: TestItem, response: any): boolean {
    // 简化实现：基于评分标准的综合评分
    if (!item.rubric) return false
    
    let totalScore = 0
    let maxScore = 0
    
    item.rubric.criteria.forEach(criterion => {
      const responseValue = response[criterion.criterion_name] || 0
      const criterionScore = Math.min(responseValue, criterion.levels[criterion.levels.length - 1].score)
      
      totalScore += criterionScore * criterion.weight
      maxScore += criterion.levels[criterion.levels.length - 1].score * criterion.weight
    })
    
    return (totalScore / maxScore) >= 0.6 // 60%以上为通过
  }

  /**
   * 更新能力估计
   */
  private updateAbilityEstimate(
    currentAbility: number,
    currentSE: number,
    item: TestItem,
    correct: boolean
  ): { newAbility: number; newSE: number } {
    switch (this.testConfiguration.ability_estimation_method) {
      case 'maximum_likelihood':
        return this.updateMLEstimate(currentAbility, currentSE, item, correct)
      
      case 'bayesian_modal':
        return this.updateBayesianEstimate(currentAbility, currentSE, item, correct)
      
      case 'expected_aposteriori':
        return this.updateEAPEstimate(currentAbility, currentSE, item, correct)
      
      default:
        return this.updateMLEstimate(currentAbility, currentSE, item, correct)
    }
  }

  /**
   * 最大似然估计更新
   */
  private updateMLEstimate(
    currentAbility: number,
    currentSE: number,
    item: TestItem,
    correct: boolean
  ): { newAbility: number; newSE: number } {
    const a = item.discrimination_parameter
    const b = item.difficulty_parameter
    const c = item.guessing_parameter || 0

    // Newton-Raphson方法更新能力估计
    let theta = currentAbility
    const maxIterations = 10
    const tolerance = 0.001

    for (let i = 0; i < maxIterations; i++) {
      const prob = this.irtModel.calculateProbability(theta, a, b, c)
      const info = this.calculateItemInformation(item, theta)
      
      // 一阶导数 (似然函数的对数导数)
      let firstDerivative = 0
      if (correct) {
        firstDerivative = a * (1 - prob) / prob
      } else {
        firstDerivative = -a * prob / (1 - prob)
      }

      // 二阶导数 (信息函数的负值)
      const secondDerivative = -info

      // Newton-Raphson更新
      const delta = firstDerivative / secondDerivative
      theta = theta - delta

      if (Math.abs(delta) < tolerance) break
    }

    // 更新标准误差
    const totalInformation = this.calculateTotalInformation(theta)
    const newSE = 1 / Math.sqrt(Math.max(totalInformation, 0.1))

    return {
      newAbility: Math.max(-4, Math.min(4, theta)), // 限制在合理范围内
      newSE: Math.max(0.1, Math.min(2.0, newSE))
    }
  }

  /**
   * 贝叶斯估计更新
   */
  private updateBayesianEstimate(
    currentAbility: number,
    currentSE: number,
    item: TestItem,
    correct: boolean
  ): { newAbility: number; newSE: number } {
    // 简化的贝叶斯更新
    const likelihood = this.irtModel.calculateProbability(
      currentAbility,
      item.discrimination_parameter,
      item.difficulty_parameter,
      item.guessing_parameter
    )

    const adjustment = correct ? 
      item.discrimination_parameter * (1 - likelihood) * 0.5 :
      -item.discrimination_parameter * likelihood * 0.5

    const newAbility = currentAbility + adjustment
    const newSE = currentSE * 0.9 // 逐渐减少不确定性

    return {
      newAbility: Math.max(-4, Math.min(4, newAbility)),
      newSE: Math.max(0.1, Math.min(2.0, newSE))
    }
  }

  /**
   * EAP估计更新
   */
  private updateEAPEstimate(
    currentAbility: number,
    currentSE: number,
    item: TestItem,
    correct: boolean
  ): { newAbility: number; newSE: number } {
    // 简化的期望后验估计
    return this.updateBayesianEstimate(currentAbility, currentSE, item, correct)
  }

  /**
   * 计算总信息量
   */
  private calculateTotalInformation(theta: number): number {
    let totalInfo = 0
    
    this.currentSession?.items_administered.forEach(response => {
      const item = this.itemBank.get(response.item_id)
      if (item) {
        totalInfo += this.calculateItemInformation(item, theta)
      }
    })
    
    return totalInfo
  }

  /**
   * 计算信息增益
   */
  private calculateInformationGain(item: TestItem, oldAbility: number, newAbility: number): number {
    const oldInfo = this.calculateTotalInformation(oldAbility)
    const newInfo = this.calculateTotalInformation(newAbility)
    return newInfo - oldInfo
  }

  /**
   * 检查停止条件
   */
  private checkStoppingCriteria(): { stop: boolean; reason?: string } {
    if (!this.currentSession) {
      return { stop: true, reason: 'no_session' }
    }

    const itemsAdministered = this.currentSession.items_administered.length
    const currentSE = this.currentSession.current_standard_error
    const criteria = this.testConfiguration.stopping_criteria

    // 检查最大项目数
    if (itemsAdministered >= this.testConfiguration.max_items) {
      return { stop: true, reason: 'max_items' }
    }

    // 检查最小项目数
    if (itemsAdministered < this.testConfiguration.min_items) {
      return { stop: false }
    }

    // 检查目标精度
    if (criteria.target_sem && currentSE <= criteria.target_sem) {
      return { stop: true, reason: 'target_precision' }
    }

    // 检查时间限制
    if (criteria.max_time_minutes) {
      const elapsedMinutes = (Date.now() - new Date(this.currentSession.start_time).getTime()) / (1000 * 60)
      if (elapsedMinutes >= criteria.max_time_minutes) {
        return { stop: true, reason: 'time_limit' }
      }
    }

    // 检查最小可靠性
    if (criteria.min_reliability) {
      const reliability = this.calculateReliability()
      if (reliability >= criteria.min_reliability) {
        return { stop: true, reason: 'min_reliability' }
      }
    }

    return { stop: false }
  }

  /**
   * 计算可靠性
   */
  private calculateReliability(): number {
    if (!this.currentSession) return 0

    const totalInfo = this.calculateTotalInformation(this.currentSession.current_ability_estimate)
    return totalInfo / (1 + totalInfo)
  }

  /**
   * 计算置信区间
   */
  private calculateConfidenceInterval(ability: number, se: number): [number, number] {
    const z = 1.96 // 95% 置信区间
    return [ability - z * se, ability + z * se]
  }

  /**
   * 生成最终评估报告
   */
  private generateFinalAssessment(): AbilityAssessment {
    if (!this.currentSession) {
      throw new Error('No active session for assessment')
    }

    const ability = this.currentSession.final_ability_estimate || this.currentSession.current_ability_estimate
    const se = this.currentSession.current_standard_error
    const reliability = this.currentSession.reliability_estimate || this.calculateReliability()

    return {
      user_id: this.userId,
      subject_domain: this.testConfiguration.subject_domain,
      ability_estimate: ability,
      standard_error: se,
      confidence_interval: this.currentSession.confidence_interval || this.calculateConfidenceInterval(ability, se),
      reliability: reliability,
      percentile_rank: this.calculatePercentileRank(ability),
      proficiency_level: this.determineProficiencyLevel(ability),
      strengths: this.identifyStrengths(),
      areas_for_improvement: this.identifyWeaknesses(),
      recommended_next_steps: this.generateRecommendations(),
      assessment_timestamp: new Date().toISOString()
    }
  }

  /**
   * 计算百分位排名
   */
  private calculatePercentileRank(ability: number): number {
    // 假设能力分布为标准正态分布 N(0,1)
    // 使用简化的正态分布累积函数近似
    const z = ability
    const percentile = 0.5 * (1 + this.erf(z / Math.sqrt(2)))
    return Math.round(percentile * 100)
  }

  /**
   * 误差函数近似
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  /**
   * 确定熟练程度等级
   */
  private determineProficiencyLevel(ability: number): 'below_basic' | 'basic' | 'proficient' | 'advanced' {
    if (ability < -1) return 'below_basic'
    if (ability < 0) return 'basic'
    if (ability < 1) return 'proficient'
    return 'advanced'
  }

  /**
   * 识别优势
   */
  private identifyStrengths(): string[] {
    if (!this.currentSession) return []

    const strengths: string[] = []
    const contentAreas = new Map<string, { correct: number; total: number }>()

    // 分析各内容领域的表现
    this.currentSession.items_administered.forEach(response => {
      const item = this.itemBank.get(response.item_id)
      if (item) {
        const stats = contentAreas.get(item.content_area) || { correct: 0, total: 0 }
        stats.total++
        if (response.correct) stats.correct++
        contentAreas.set(item.content_area, stats)
      }
    })

    // 识别表现好的领域
    contentAreas.forEach((stats, area) => {
      const accuracy = stats.correct / stats.total
      if (accuracy > 0.7 && stats.total >= 2) {
        strengths.push(`${area}领域表现优秀 (正确率: ${Math.round(accuracy * 100)}%)`)
      }
    })

    // 分析认知层次表现
    const cognitiveStats = new Map<string, { correct: number; total: number }>()
    this.currentSession.items_administered.forEach(response => {
      const item = this.itemBank.get(response.item_id)
      if (item) {
        const stats = cognitiveStats.get(item.cognitive_level) || { correct: 0, total: 0 }
        stats.total++
        if (response.correct) stats.correct++
        cognitiveStats.set(item.cognitive_level, stats)
      }
    })

    cognitiveStats.forEach((stats, level) => {
      const accuracy = stats.correct / stats.total
      if (accuracy > 0.75 && stats.total >= 2) {
        strengths.push(`${level}认知层次能力强`)
      }
    })

    return strengths.length > 0 ? strengths : ['整体表现稳定']
  }

  /**
   * 识别弱点
   */
  private identifyWeaknesses(): string[] {
    if (!this.currentSession) return []

    const weaknesses: string[] = []
    const contentAreas = new Map<string, { correct: number; total: number }>()

    this.currentSession.items_administered.forEach(response => {
      const item = this.itemBank.get(response.item_id)
      if (item) {
        const stats = contentAreas.get(item.content_area) || { correct: 0, total: 0 }
        stats.total++
        if (response.correct) stats.correct++
        contentAreas.set(item.content_area, stats)
      }
    })

    // 识别表现较差的领域
    contentAreas.forEach((stats, area) => {
      const accuracy = stats.correct / stats.total
      if (accuracy < 0.5 && stats.total >= 2) {
        weaknesses.push(`${area}领域需要加强 (正确率: ${Math.round(accuracy * 100)}%)`)
      }
    })

    return weaknesses
  }

  /**
   * 生成建议
   */
  private generateRecommendations(): string[] {
    if (!this.currentSession) return []

    const recommendations: string[] = []
    const ability = this.currentSession.current_ability_estimate

    // 基于能力水平的建议
    if (ability < -1) {
      recommendations.push('建议从基础概念开始，逐步建立知识基础')
      recommendations.push('可以寻求额外的辅导支持')
    } else if (ability < 0) {
      recommendations.push('继续巩固基础知识，增加练习量')
      recommendations.push('重点关注理解概念的应用')
    } else if (ability < 1) {
      recommendations.push('可以尝试更有挑战性的问题')
      recommendations.push('注重知识的深度理解和迁移应用')
    } else {
      recommendations.push('继续保持学习态势，可以承担更复杂的学习任务')
      recommendations.push('考虑担任同伴导师角色')
    }

    // 基于错误模式的建议
    const avgResponseTime = this.currentSession.items_administered.reduce(
      (sum, response) => sum + response.response_time, 0
    ) / this.currentSession.items_administered.length

    if (avgResponseTime > 120) { // 2分钟以上
      recommendations.push('可以提高答题速度，加强时间管理')
    } else if (avgResponseTime < 30) { // 30秒以下
      recommendations.push('建议更仔细地阅读题目，避免因粗心导致错误')
    }

    return recommendations
  }

  /**
   * 估算完成时间
   */
  private estimateCompletionTime(): number {
    const avgTimePerItem = 90 // 假设平均每题90秒
    const estimatedItems = Math.min(
      this.testConfiguration.max_items,
      Math.max(this.testConfiguration.min_items, 15) // 默认估算15题
    )
    
    return Math.round(estimatedItems * avgTimePerItem / 60) // 返回分钟数
  }

  /**
   * 初始化项目库
   */
  private initializeItemBank(): void {
    // 示例项目数据 - 实际应用中应从数据库加载
    const sampleItems: TestItem[] = [
      {
        item_id: 'math_001',
        content: '计算 2 + 3 = ?',
        item_type: 'multiple_choice',
        difficulty_parameter: -2.0,
        discrimination_parameter: 1.2,
        content_area: 'basic_arithmetic',
        cognitive_level: 'remember',
        estimated_time: 30,
        options: ['4', '5', '6', '7'],
        correct_answer: '5'
      },
      {
        item_id: 'math_002',
        content: '解方程 2x + 5 = 11',
        item_type: 'short_answer',
        difficulty_parameter: 0.0,
        discrimination_parameter: 1.5,
        content_area: 'algebra',
        cognitive_level: 'apply',
        estimated_time: 120,
        correct_answer: 'x=3|3'
      },
      {
        item_id: 'math_003',
        content: '证明勾股定理',
        item_type: 'essay',
        difficulty_parameter: 2.0,
        discrimination_parameter: 1.0,
        content_area: 'geometry',
        cognitive_level: 'analyze',
        estimated_time: 600,
        correct_answer: 'proof|demonstration|pythagorean|theorem'
      }
    ]

    sampleItems.forEach(item => {
      this.itemBank.set(item.item_id, item)
    })
  }

  /**
   * 获取当前会话状态
   */
  getCurrentSession(): TestSession | null {
    return this.currentSession
  }

  /**
   * 获取实时统计
   */
  getRealTimeStatistics(): {
    items_completed: number
    current_accuracy: number
    estimated_ability: number
    confidence_level: number
    time_elapsed: number
    estimated_remaining: number
  } {
    if (!this.currentSession) {
      return {
        items_completed: 0,
        current_accuracy: 0,
        estimated_ability: 0,
        confidence_level: 0,
        time_elapsed: 0,
        estimated_remaining: 0
      }
    }

    const itemsCompleted = this.currentSession.items_administered.length
    const correctCount = this.currentSession.items_administered.filter(r => r.correct).length
    const accuracy = itemsCompleted > 0 ? correctCount / itemsCompleted : 0
    
    const timeElapsed = (Date.now() - new Date(this.currentSession.start_time).getTime()) / (1000 * 60)
    const avgTimePerItem = itemsCompleted > 0 ? timeElapsed / itemsCompleted : 1.5
    const estimatedRemaining = Math.max(0, this.testConfiguration.min_items - itemsCompleted) * avgTimePerItem

    return {
      items_completed: itemsCompleted,
      current_accuracy: Math.round(accuracy * 100),
      estimated_ability: this.currentSession.current_ability_estimate,
      confidence_level: Math.round((1 - this.currentSession.current_standard_error) * 100),
      time_elapsed: Math.round(timeElapsed),
      estimated_remaining: Math.round(estimatedRemaining)
    }
  }
}

/**
 * IRT模型类
 */
class IRTModel {
  private modelType: '1PL' | '2PL' | '3PL'

  constructor(modelType: '1PL' | '2PL' | '3PL' = '2PL') {
    this.modelType = modelType
  }

  /**
   * 计算响应概率
   */
  calculateProbability(theta: number, a: number, b: number, c: number = 0): number {
    const D = 1.7 // 缩放常数

    switch (this.modelType) {
      case '1PL':
        // Rasch模型
        return Math.exp(D * (theta - b)) / (1 + Math.exp(D * (theta - b)))
      
      case '2PL':
        // 2参数logistic模型
        return Math.exp(D * a * (theta - b)) / (1 + Math.exp(D * a * (theta - b)))
      
      case '3PL':
        // 3参数logistic模型
        const prob2PL = Math.exp(D * a * (theta - b)) / (1 + Math.exp(D * a * (theta - b)))
        return c + (1 - c) * prob2PL
      
      default:
        return 0
    }
  }
}

// 导出单例管理
let testEngineInstance: AdaptiveTestingEngine | null = null

export function getAdaptiveTestingEngine(userId: string, config: TestConfiguration): AdaptiveTestingEngine {
  if (!testEngineInstance || (testEngineInstance as any).userId !== userId) {
    testEngineInstance = new AdaptiveTestingEngine(userId, config)
  }
  return testEngineInstance
}

export { AdaptiveTestingEngine, IRTModel }
