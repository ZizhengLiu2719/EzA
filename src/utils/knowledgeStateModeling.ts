/**
 * 知识状态建模 (Knowledge State Modeling)
 * Phase 2: Real-time knowledge state tracking and modeling
 */

import { CognitiveLoadMetrics, LearningBehaviorData } from '../types/ai-enhanced'

/**
 * 概念接口
 */
export interface Concept {
  concept_id: string
  name: string
  description: string
  difficulty_level: number // 1-10
  cognitive_complexity: 'low' | 'medium' | 'high'
  prerequisite_concepts: string[]
  related_concepts: string[]
  learning_objectives: string[]
}

/**
 * 概念掌握度接口
 */
export interface ConceptMastery {
  concept_id: string
  mastery_level: number // 0-100
  confidence_score: number // 0-1
  evidence_count: number
  last_assessment: string
  mastery_stability: number // 0-1
  forgetting_curve: ForgettingCurve
}

/**
 * 遗忘曲线接口
 */
export interface ForgettingCurve {
  initial_strength: number // 0-1
  decay_rate: number
  retention_half_life: number // days
  predicted_retention: Array<{
    days_future: number
    predicted_retention: number
  }>
}

/**
 * 知识状态接口
 */
export interface KnowledgeState {
  user_id: string
  timestamp: string
  concept_masteries: ConceptMastery[]
  overall_proficiency: number // 0-100
  knowledge_gaps: KnowledgeGap[]
  strength_areas: string[]
  learning_readiness: LearningReadiness[]
  state_confidence: number // 0-1
}

/**
 * 知识缺口接口
 */
export interface KnowledgeGap {
  concept_id: string
  gap_type: 'missing_prerequisite' | 'partial_understanding' | 'misconception'
  severity: 'low' | 'medium' | 'high' | 'critical'
  impact_score: number // 0-100
  recommended_interventions: string[]
  estimated_time_to_fill: number // hours
}

/**
 * 学习准备度接口
 */
export interface LearningReadiness {
  concept_id: string
  readiness_score: number // 0-100
  prerequisite_satisfaction: number // 0-100
  cognitive_load_prediction: number // 0-100
  optimal_learning_time: string
  readiness_factors: ReadinessFactor[]
}

/**
 * 准备度因子接口
 */
export interface ReadinessFactor {
  factor_name: string
  impact_weight: number // 0-1
  current_value: number
  optimal_range: [number, number]
}

/**
 * 知识状态建模引擎
 */
export class KnowledgeStateModelingEngine {
  private userId: string
  private concepts: Map<string, Concept> = new Map()
  private currentState: KnowledgeState | null = null
  private stateHistory: KnowledgeState[] = []
  private masteryThreshold = 75 // 掌握阈值
  private decayModel = new KnowledgeDecayModel()

  constructor(userId: string) {
    this.userId = userId
    this.initializeConceptBase()
  }

  /**
   * 更新知识状态
   */
  async updateKnowledgeState(
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics,
    assessmentResults?: any[]
  ): Promise<{
    updated_state: KnowledgeState
    state_changes: StateChange[]
    insights: string[]
    recommendations: string[]
  }> {
    // 1. 分析当前证据
    const evidences = this.extractLearningEvidence(behaviorData, cognitiveMetrics, assessmentResults)

    // 2. 更新概念掌握度
    const updatedMasteries = this.updateConceptMasteries(evidences)

    // 3. 识别知识缺口
    const knowledgeGaps = this.identifyKnowledgeGaps(updatedMasteries)

    // 4. 计算学习准备度
    const learningReadiness = this.calculateLearningReadiness(updatedMasteries)

    // 5. 构建新状态
    const newState: KnowledgeState = {
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      concept_masteries: updatedMasteries,
      overall_proficiency: this.calculateOverallProficiency(updatedMasteries),
      knowledge_gaps: knowledgeGaps,
      strength_areas: this.identifyStrengthAreas(updatedMasteries),
      learning_readiness: learningReadiness,
      state_confidence: this.calculateStateConfidence(updatedMasteries)
    }

    // 6. 分析状态变化
    const stateChanges = this.analyzeStateChanges(this.currentState, newState)

    // 7. 生成洞察和建议
    const insights = this.generateStateInsights(newState, stateChanges)
    const recommendations = this.generateLearningRecommendations(newState)

    // 8. 更新状态
    if (this.currentState) {
      this.stateHistory.push(this.currentState)
    }
    this.currentState = newState

    return {
      updated_state: newState,
      state_changes: stateChanges,
      insights,
      recommendations
    }
  }

  /**
   * 提取学习证据
   */
  private extractLearningEvidence(
    behaviorData: LearningBehaviorData,
    cognitiveMetrics: CognitiveLoadMetrics,
    assessmentResults?: any[]
  ): LearningEvidence[] {
    const evidences: LearningEvidence[] = []

    // 从行为数据提取证据
    evidences.push({
      source_type: 'behavior',
      concept_id: 'general_engagement',
      evidence_strength: behaviorData.performance_metrics.task_completion_rate / 100,
      evidence_type: 'performance',
      timestamp: new Date().toISOString(),
      details: {
        completion_rate: behaviorData.performance_metrics.task_completion_rate,
        improvement_velocity: behaviorData.performance_metrics.improvement_velocity
      }
    })

    // 从认知负荷数据提取证据
    evidences.push({
      source_type: 'cognitive',
      concept_id: 'cognitive_processing',
      evidence_strength: Math.max(0, (100 - cognitiveMetrics.session_metrics.total_cognitive_load) / 100),
      evidence_type: 'cognitive_load',
      timestamp: new Date().toISOString(),
      details: {
        total_load: cognitiveMetrics.session_metrics.total_cognitive_load,
        efficiency: cognitiveMetrics.session_metrics.overall_efficiency
      }
    })

    // 从评估结果提取证据
    if (assessmentResults) {
      assessmentResults.forEach(result => {
        evidences.push({
          source_type: 'assessment',
          concept_id: result.concept_id || 'general',
          evidence_strength: result.score / 100,
          evidence_type: 'formal_assessment',
          timestamp: result.timestamp || new Date().toISOString(),
          details: result
        })
      })
    }

    return evidences
  }

  /**
   * 更新概念掌握度
   */
  private updateConceptMasteries(evidences: LearningEvidence[]): ConceptMastery[] {
    const masteries: Map<string, ConceptMastery> = new Map()

    // 初始化现有掌握度
    if (this.currentState) {
      this.currentState.concept_masteries.forEach(mastery => {
        masteries.set(mastery.concept_id, { ...mastery })
      })
    }

    // 基于证据更新掌握度
    evidences.forEach(evidence => {
      const currentMastery = masteries.get(evidence.concept_id) || {
        concept_id: evidence.concept_id,
        mastery_level: 50, // 初始值
        confidence_score: 0.1,
        evidence_count: 0,
        last_assessment: evidence.timestamp,
        mastery_stability: 0.5,
        forgetting_curve: this.initializeForgettingCurve()
      }

      // 更新掌握度
      const updatedMastery = this.updateMasteryWithEvidence(currentMastery, evidence)
      masteries.set(evidence.concept_id, updatedMastery)
    })

    // 应用遗忘衰减
    masteries.forEach((mastery, conceptId) => {
      const decayedMastery = this.applyForgettingDecay(mastery)
      masteries.set(conceptId, decayedMastery)
    })

    return Array.from(masteries.values())
  }

  /**
   * 基于证据更新掌握度
   */
  private updateMasteryWithEvidence(mastery: ConceptMastery, evidence: LearningEvidence): ConceptMastery {
    const evidenceWeight = this.calculateEvidenceWeight(evidence)
    const currentWeight = mastery.confidence_score * mastery.evidence_count

    // 加权平均更新掌握度
    const newMasteryLevel = (
      mastery.mastery_level * currentWeight + 
      evidence.evidence_strength * 100 * evidenceWeight
    ) / (currentWeight + evidenceWeight)

    // 更新置信度
    const newConfidence = Math.min(0.95, mastery.confidence_score + evidenceWeight * 0.1)

    // 更新稳定性
    const newStability = this.calculateMasteryStability(mastery, evidence)

    return {
      ...mastery,
      mastery_level: Math.max(0, Math.min(100, newMasteryLevel)),
      confidence_score: newConfidence,
      evidence_count: mastery.evidence_count + 1,
      last_assessment: evidence.timestamp,
      mastery_stability: newStability,
      forgetting_curve: this.updateForgettingCurve(mastery.forgetting_curve, evidence)
    }
  }

  /**
   * 计算证据权重
   */
  private calculateEvidenceWeight(evidence: LearningEvidence): number {
    let weight = 1.0

    // 基于证据类型调整权重
    switch (evidence.evidence_type) {
      case 'formal_assessment':
        weight = 1.0
        break
      case 'performance':
        weight = 0.7
        break
      case 'cognitive_load':
        weight = 0.5
        break
      case 'self_assessment':
        weight = 0.3
        break
    }

    // 基于证据强度调整
    weight *= evidence.evidence_strength

    // 基于时间衰减调整
    const ageHours = (Date.now() - new Date(evidence.timestamp).getTime()) / (1000 * 60 * 60)
    const timeDecay = Math.exp(-ageHours / 168) // 一周半衰期
    weight *= timeDecay

    return Math.max(0.1, Math.min(2.0, weight))
  }

  /**
   * 计算掌握稳定性
   */
  private calculateMasteryStability(mastery: ConceptMastery, evidence: LearningEvidence): number {
    let stability = mastery.mastery_stability

    // 一致性证据增加稳定性
    const masteryDirection = mastery.mastery_level > 50 ? 1 : -1
    const evidenceDirection = evidence.evidence_strength > 0.5 ? 1 : -1

    if (masteryDirection === evidenceDirection) {
      stability = Math.min(1.0, stability + 0.05)
    } else {
      stability = Math.max(0.1, stability - 0.1)
    }

    // 高证据数量增加稳定性
    if (mastery.evidence_count > 5) {
      stability = Math.min(1.0, stability + 0.02)
    }

    return stability
  }

  /**
   * 初始化遗忘曲线
   */
  private initializeForgettingCurve(): ForgettingCurve {
    return {
      initial_strength: 0.5,
      decay_rate: 0.1,
      retention_half_life: 7, // 7天
      predicted_retention: this.generateRetentionPredictions(0.5, 0.1)
    }
  }

  /**
   * 更新遗忘曲线
   */
  private updateForgettingCurve(curve: ForgettingCurve, evidence: LearningEvidence): ForgettingCurve {
    // 基于新证据调整遗忘参数
    const newStrength = Math.max(curve.initial_strength, evidence.evidence_strength)
    const newDecayRate = curve.decay_rate * (evidence.evidence_strength > 0.7 ? 0.9 : 1.1)
    const newHalfLife = curve.retention_half_life * (evidence.evidence_strength > 0.7 ? 1.2 : 0.9)

    return {
      initial_strength: newStrength,
      decay_rate: Math.max(0.01, Math.min(0.5, newDecayRate)),
      retention_half_life: Math.max(1, Math.min(30, newHalfLife)),
      predicted_retention: this.generateRetentionPredictions(newStrength, newDecayRate)
    }
  }

  /**
   * 生成保持率预测
   */
  private generateRetentionPredictions(initialStrength: number, decayRate: number): Array<{days_future: number; predicted_retention: number}> {
    const predictions = []
    const timePoints = [1, 3, 7, 14, 30, 60, 90]

    timePoints.forEach(days => {
      const retention = initialStrength * Math.exp(-decayRate * days)
      predictions.push({
        days_future: days,
        predicted_retention: Math.max(0, Math.min(1, retention))
      })
    })

    return predictions
  }

  /**
   * 应用遗忘衰减
   */
  private applyForgettingDecay(mastery: ConceptMastery): ConceptMastery {
    const daysSinceAssessment = (Date.now() - new Date(mastery.last_assessment).getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceAssessment > 0) {
      const decayFactor = Math.exp(-mastery.forgetting_curve.decay_rate * daysSinceAssessment)
      const decayedLevel = mastery.mastery_level * decayFactor
      
      return {
        ...mastery,
        mastery_level: Math.max(0, decayedLevel)
      }
    }

    return mastery
  }

  /**
   * 识别知识缺口
   */
  private identifyKnowledgeGaps(masteries: ConceptMastery[]): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = []
    const masteryMap = new Map(masteries.map(m => [m.concept_id, m]))

    this.concepts.forEach(concept => {
      const mastery = masteryMap.get(concept.concept_id)
      
      if (!mastery || mastery.mastery_level < this.masteryThreshold) {
        // 检查先决条件
        const missingPrerequisites = concept.prerequisite_concepts.filter(prereq => {
          const prereqMastery = masteryMap.get(prereq)
          return !prereqMastery || prereqMastery.mastery_level < this.masteryThreshold
        })

        let gapType: 'missing_prerequisite' | 'partial_understanding' | 'misconception' = 'partial_understanding'
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

        if (missingPrerequisites.length > 0) {
          gapType = 'missing_prerequisite'
          severity = 'high'
        } else if (mastery && mastery.mastery_level < 30) {
          gapType = 'misconception'
          severity = 'critical'
        }

        gaps.push({
          concept_id: concept.concept_id,
          gap_type: gapType,
          severity,
          impact_score: this.calculateGapImpact(concept, mastery),
          recommended_interventions: this.generateGapInterventions(concept, gapType),
          estimated_time_to_fill: this.estimateTimeToFill(concept, mastery)
        })
      }
    })

    return gaps.sort((a, b) => b.impact_score - a.impact_score)
  }

  /**
   * 计算缺口影响
   */
  private calculateGapImpact(concept: Concept, mastery?: ConceptMastery): number {
    let impact = concept.difficulty_level * 10 // 基础影响

    // 基于相关概念数量
    impact += concept.related_concepts.length * 5

    // 基于当前掌握度差距
    if (mastery) {
      const masteryGap = this.masteryThreshold - mastery.mastery_level
      impact += masteryGap * 0.5
    } else {
      impact += this.masteryThreshold * 0.5
    }

    return Math.min(100, impact)
  }

  /**
   * 生成缺口干预建议
   */
  private generateGapInterventions(concept: Concept, gapType: string): string[] {
    const interventions: string[] = []

    switch (gapType) {
      case 'missing_prerequisite':
        interventions.push(`先学习先决条件: ${concept.prerequisite_concepts.join(', ')}`)
        interventions.push('使用脚手架式教学方法')
        break
      case 'partial_understanding':
        interventions.push('增加练习和应用机会')
        interventions.push('提供多角度解释和例子')
        break
      case 'misconception':
        interventions.push('识别和纠正错误概念')
        interventions.push('使用对比教学法')
        break
    }

    interventions.push(`重点关注${concept.name}的核心概念`)
    return interventions
  }

  /**
   * 估算填补时间
   */
  private estimateTimeToFill(concept: Concept, mastery?: ConceptMastery): number {
    let baseTime = concept.difficulty_level * 2 // 基础时间(小时)

    if (mastery) {
      const masteryGap = Math.max(0, this.masteryThreshold - mastery.mastery_level)
      baseTime += masteryGap * 0.1
    } else {
      baseTime += this.masteryThreshold * 0.1
    }

    return Math.max(1, Math.round(baseTime))
  }

  /**
   * 计算学习准备度
   */
  private calculateLearningReadiness(masteries: ConceptMastery[]): LearningReadiness[] {
    const readiness: LearningReadiness[] = []
    const masteryMap = new Map(masteries.map(m => [m.concept_id, m]))

    this.concepts.forEach(concept => {
      const currentMastery = masteryMap.get(concept.concept_id)
      
      // 如果已经掌握，跳过
      if (currentMastery && currentMastery.mastery_level >= this.masteryThreshold) {
        return
      }

      // 计算先决条件满足度
      const prereqSatisfaction = this.calculatePrerequisiteSatisfaction(concept, masteryMap)
      
      // 计算认知负荷预测
      const cognitiveLoadPrediction = this.predictCognitiveLoad(concept, currentMastery)
      
      // 计算综合准备度
      const readinessScore = this.calculateReadinessScore(prereqSatisfaction, cognitiveLoadPrediction, concept)

      readiness.push({
        concept_id: concept.concept_id,
        readiness_score,
        prerequisite_satisfaction: prereqSatisfaction,
        cognitive_load_prediction: cognitiveLoadPrediction,
        optimal_learning_time: this.determineOptimalLearningTime(concept, readinessScore),
        readiness_factors: this.analyzeReadinessFactors(concept, currentMastery, prereqSatisfaction)
      })
    })

    return readiness.sort((a, b) => b.readiness_score - a.readiness_score)
  }

  /**
   * 计算先决条件满足度
   */
  private calculatePrerequisiteSatisfaction(concept: Concept, masteryMap: Map<string, ConceptMastery>): number {
    if (concept.prerequisite_concepts.length === 0) return 100

    const satisfiedCount = concept.prerequisite_concepts.filter(prereq => {
      const prereqMastery = masteryMap.get(prereq)
      return prereqMastery && prereqMastery.mastery_level >= this.masteryThreshold
    }).length

    return (satisfiedCount / concept.prerequisite_concepts.length) * 100
  }

  /**
   * 预测认知负荷
   */
  private predictCognitiveLoad(concept: Concept, currentMastery?: ConceptMastery): number {
    let load = concept.difficulty_level * 10 // 基础负荷

    // 基于复杂度调整
    switch (concept.cognitive_complexity) {
      case 'high':
        load += 20
        break
      case 'medium':
        load += 10
        break
      case 'low':
        load += 0
        break
    }

    // 基于当前掌握度调整
    if (currentMastery) {
      load -= currentMastery.mastery_level * 0.3
    }

    return Math.max(10, Math.min(100, load))
  }

  /**
   * 计算准备度评分
   */
  private calculateReadinessScore(prereqSatisfaction: number, cognitiveLoad: number, concept: Concept): number {
    let score = 0

    // 先决条件权重 (50%)
    score += prereqSatisfaction * 0.5

    // 认知负荷权重 (30%) - 负荷越低，准备度越高
    score += (100 - cognitiveLoad) * 0.3

    // 概念重要性权重 (20%) - 难度适中的概念优先
    const importanceScore = 100 - Math.abs(concept.difficulty_level - 5) * 10
    score += importanceScore * 0.2

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 确定最佳学习时间
   */
  private determineOptimalLearningTime(concept: Concept, readinessScore: number): string {
    if (readinessScore > 80) return 'immediate'
    if (readinessScore > 60) return 'within_week'
    if (readinessScore > 40) return 'within_month'
    return 'future'
  }

  /**
   * 分析准备度因子
   */
  private analyzeReadinessFactors(concept: Concept, mastery?: ConceptMastery, prereqSatisfaction?: number): ReadinessFactor[] {
    return [
      {
        factor_name: 'prerequisite_mastery',
        impact_weight: 0.5,
        current_value: prereqSatisfaction || 0,
        optimal_range: [80, 100]
      },
      {
        factor_name: 'concept_difficulty',
        impact_weight: 0.3,
        current_value: (10 - concept.difficulty_level) * 10,
        optimal_range: [40, 70]
      },
      {
        factor_name: 'current_mastery',
        impact_weight: 0.2,
        current_value: mastery?.mastery_level || 0,
        optimal_range: [0, 40]
      }
    ]
  }

  /**
   * 计算整体熟练度
   */
  private calculateOverallProficiency(masteries: ConceptMastery[]): number {
    if (masteries.length === 0) return 0

    const weightedSum = masteries.reduce((sum, mastery) => {
      const concept = this.concepts.get(mastery.concept_id)
      const weight = concept ? concept.difficulty_level : 5
      return sum + mastery.mastery_level * weight * mastery.confidence_score
    }, 0)

    const totalWeight = masteries.reduce((sum, mastery) => {
      const concept = this.concepts.get(mastery.concept_id)
      const weight = concept ? concept.difficulty_level : 5
      return sum + weight * mastery.confidence_score
    }, 0)

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  }

  /**
   * 识别优势领域
   */
  private identifyStrengthAreas(masteries: ConceptMastery[]): string[] {
    return masteries
      .filter(m => m.mastery_level >= this.masteryThreshold && m.confidence_score > 0.7)
      .map(m => {
        const concept = this.concepts.get(m.concept_id)
        return concept?.name || m.concept_id
      })
      .slice(0, 5) // 前5个优势领域
  }

  /**
   * 计算状态置信度
   */
  private calculateStateConfidence(masteries: ConceptMastery[]): number {
    if (masteries.length === 0) return 0

    const avgConfidence = masteries.reduce((sum, m) => sum + m.confidence_score, 0) / masteries.length
    const evidenceWeight = Math.min(1, masteries.reduce((sum, m) => sum + m.evidence_count, 0) / (masteries.length * 5))
    
    return avgConfidence * evidenceWeight
  }

  /**
   * 分析状态变化
   */
  private analyzeStateChanges(oldState: KnowledgeState | null, newState: KnowledgeState): StateChange[] {
    const changes: StateChange[] = []

    if (!oldState) {
      changes.push({
        change_type: 'initial_state',
        concept_id: 'overall',
        magnitude: newState.overall_proficiency,
        description: '初始知识状态建立',
        evidence: [`整体熟练度: ${newState.overall_proficiency}%`]
      })
      return changes
    }

    // 比较整体熟练度变化
    const proficiencyChange = newState.overall_proficiency - oldState.overall_proficiency
    if (Math.abs(proficiencyChange) > 5) {
      changes.push({
        change_type: proficiencyChange > 0 ? 'proficiency_increase' : 'proficiency_decrease',
        concept_id: 'overall',
        magnitude: Math.abs(proficiencyChange),
        description: `整体熟练度${proficiencyChange > 0 ? '提升' : '下降'}${Math.abs(proficiencyChange)}%`,
        evidence: [`从${oldState.overall_proficiency}%到${newState.overall_proficiency}%`]
      })
    }

    // 比较概念掌握度变化
    const oldMasteryMap = new Map(oldState.concept_masteries.map(m => [m.concept_id, m]))
    
    newState.concept_masteries.forEach(newMastery => {
      const oldMastery = oldMasteryMap.get(newMastery.concept_id)
      
      if (!oldMastery) {
        changes.push({
          change_type: 'new_concept',
          concept_id: newMastery.concept_id,
          magnitude: newMastery.mastery_level,
          description: `新概念${newMastery.concept_id}开始学习`,
          evidence: [`掌握度: ${newMastery.mastery_level}%`]
        })
      } else {
        const masteryChange = newMastery.mastery_level - oldMastery.mastery_level
        if (Math.abs(masteryChange) > 10) {
          changes.push({
            change_type: masteryChange > 0 ? 'mastery_increase' : 'mastery_decrease',
            concept_id: newMastery.concept_id,
            magnitude: Math.abs(masteryChange),
            description: `${newMastery.concept_id}掌握度${masteryChange > 0 ? '提升' : '下降'}`,
            evidence: [`从${oldMastery.mastery_level}%到${newMastery.mastery_level}%`]
          })
        }
      }
    })

    return changes
  }

  /**
   * 生成状态洞察
   */
  private generateStateInsights(state: KnowledgeState, changes: StateChange[]): string[] {
    const insights: string[] = []

    // 整体状态洞察
    if (state.overall_proficiency > 80) {
      insights.push('知识掌握程度很高，可以尝试更高难度的学习内容')
    } else if (state.overall_proficiency < 50) {
      insights.push('需要加强基础知识的学习，建议重点巩固薄弱环节')
    }

    // 变化洞察
    const significantChanges = changes.filter(c => c.magnitude > 15)
    if (significantChanges.length > 0) {
      insights.push(`检测到${significantChanges.length}个显著的知识状态变化`)
    }

    // 缺口洞察
    const criticalGaps = state.knowledge_gaps.filter(g => g.severity === 'critical')
    if (criticalGaps.length > 0) {
      insights.push(`发现${criticalGaps.length}个关键知识缺口，需要优先解决`)
    }

    // 准备度洞察
    const readyConcepts = state.learning_readiness.filter(r => r.readiness_score > 80)
    if (readyConcepts.length > 0) {
      insights.push(`有${readyConcepts.length}个概念已准备好进行深入学习`)
    }

    return insights
  }

  /**
   * 生成学习建议
   */
  private generateLearningRecommendations(state: KnowledgeState): string[] {
    const recommendations: string[] = []

    // 基于知识缺口的建议
    const priorityGaps = state.knowledge_gaps.slice(0, 3)
    priorityGaps.forEach(gap => {
      recommendations.push(`优先解决${gap.concept_id}的${gap.gap_type}问题`)
    })

    // 基于学习准备度的建议
    const readyConcepts = state.learning_readiness
      .filter(r => r.readiness_score > 70)
      .slice(0, 2)
    
    readyConcepts.forEach(ready => {
      recommendations.push(`适合开始学习${ready.concept_id}，预计认知负荷${ready.cognitive_load_prediction}%`)
    })

    // 基于优势领域的建议
    if (state.strength_areas.length > 0) {
      recommendations.push(`利用${state.strength_areas[0]}等优势领域，尝试相关的高级概念`)
    }

    return recommendations.slice(0, 6)
  }

  /**
   * 初始化概念库
   */
  private initializeConceptBase(): void {
    const sampleConcepts: Concept[] = [
      {
        concept_id: 'basic_arithmetic',
        name: '基础算术',
        description: '加减乘除基本运算',
        difficulty_level: 2,
        cognitive_complexity: 'low',
        prerequisite_concepts: [],
        related_concepts: ['algebra_basics'],
        learning_objectives: ['掌握四则运算', '理解运算优先级']
      },
      {
        concept_id: 'algebra_basics',
        name: '代数基础',
        description: '变量、方程和不等式',
        difficulty_level: 5,
        cognitive_complexity: 'medium',
        prerequisite_concepts: ['basic_arithmetic'],
        related_concepts: ['linear_equations'],
        learning_objectives: ['理解变量概念', '解一元方程']
      },
      {
        concept_id: 'linear_equations',
        name: '线性方程',
        description: '一次函数和线性方程组',
        difficulty_level: 7,
        cognitive_complexity: 'medium',
        prerequisite_concepts: ['algebra_basics'],
        related_concepts: ['coordinate_geometry'],
        learning_objectives: ['解线性方程组', '理解函数图像']
      }
    ]

    sampleConcepts.forEach(concept => {
      this.concepts.set(concept.concept_id, concept)
    })
  }

  /**
   * 获取当前知识状态
   */
  getCurrentKnowledgeState(): KnowledgeState | null {
    return this.currentState
  }

  /**
   * 获取知识状态历史
   */
  getStateHistory(): KnowledgeState[] {
    return this.stateHistory
  }

  /**
   * 获取概念详情
   */
  getConcept(conceptId: string): Concept | undefined {
    return this.concepts.get(conceptId)
  }
}

// 接口定义
interface LearningEvidence {
  source_type: 'behavior' | 'assessment' | 'cognitive' | 'self_report'
  concept_id: string
  evidence_strength: number // 0-1
  evidence_type: 'performance' | 'cognitive_load' | 'formal_assessment' | 'self_assessment'
  timestamp: string
  details: any
}

interface StateChange {
  change_type: 'initial_state' | 'mastery_increase' | 'mastery_decrease' | 'new_concept' | 'proficiency_increase' | 'proficiency_decrease'
  concept_id: string
  magnitude: number
  description: string
  evidence: string[]
}

/**
 * 知识衰减模型
 */
class KnowledgeDecayModel {
  calculateDecay(initialStrength: number, daysSinceLastPractice: number, conceptDifficulty: number): number {
    // Ebbinghaus遗忘曲线的修改版本
    const difficultyFactor = 1 + (conceptDifficulty - 5) * 0.1
    const decayRate = 0.1 * difficultyFactor
    
    return initialStrength * Math.exp(-decayRate * daysSinceLastPractice)
  }
}

// 导出单例管理
let knowledgeModelInstance: KnowledgeStateModelingEngine | null = null

export function getKnowledgeStateModelingEngine(userId: string): KnowledgeStateModelingEngine {
  if (!knowledgeModelInstance || (knowledgeModelInstance as any).userId !== userId) {
    knowledgeModelInstance = new KnowledgeStateModelingEngine(userId)
  }
  return knowledgeModelInstance
}

export { KnowledgeStateModelingEngine }
