/**
 * AI难度自适应服务
 * 基于认知科学和学习心理学的智能难度调节系统
 */

import { FSRSCard } from '../types/SRSTypes'

export interface CognitiveLoad {
  intrinsic: number    // 内在认知负荷 (0-1)
  extraneous: number   // 外在认知负荷 (0-1) 
  germane: number      // 相关认知负荷 (0-1)
  total: number        // 总认知负荷 (0-1)
  recommendation: 'reduce' | 'maintain' | 'increase'
}

export interface LearningContext {
  user_id: string
  subject: string
  session_duration: number // 当前会话时长(分钟)
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
  energy_level: 'high' | 'medium' | 'low'
  distraction_level: 'high' | 'medium' | 'low'
  stress_level: 'high' | 'medium' | 'low'
  recent_performance: {
    accuracy: number
    response_time: number
    confidence: number
  }[]
}

export interface DifficultyRecommendation {
  target_difficulty: number      // 推荐目标难度 (1-10)
  adjustment_magnitude: number   // 调整幅度 (-3 to +3)
  confidence: number            // 推荐置信度 (0-1)
  reasoning: string            // 调整原因
  adaptive_strategy: 'gradual' | 'immediate' | 'delayed'
  next_review_timing: number   // 建议下次复习时间间隔(小时)
  cognitive_load_target: CognitiveLoad
  personalization_factors: {
    learning_speed: number     // 学习速度因子 (0-2)
    retention_strength: number // 记忆保持强度 (0-2)
    difficulty_preference: number // 难度偏好 (-1 to +1)
  }
}

export interface AdaptiveLearningProfile {
  user_id: string
  optimal_difficulty_range: [number, number]  // 最佳难度范围
  cognitive_capacity: number                  // 认知容量评估
  learning_speed: number                      // 学习速度
  retention_rate: number                      // 记忆保持率
  preferred_challenge_level: number           // 偏好挑战水平
  fatigue_pattern: number[]                   // 疲劳模式 (24小时)
  peak_performance_hours: number[]            // 最佳表现时段
  subject_strengths: Record<string, number>   // 学科优势
  learning_style_weights: {
    visual: number
    auditory: number
    kinesthetic: number
    reading_writing: number
  }
}

class DifficultyAI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * 评估当前认知负荷
   */
  async assessCognitiveLoad(
    current_cards: FSRSCard[],
    context: LearningContext
  ): Promise<CognitiveLoad> {
    const prompt = `
作为认知心理学专家，评估当前学习会话的认知负荷：

学习上下文:
- 会话时长: ${context.session_duration}分钟
- 时间段: ${context.time_of_day}
- 能量水平: ${context.energy_level}
- 干扰水平: ${context.distraction_level}
- 压力水平: ${context.stress_level}

当前卡片统计:
- 卡片数量: ${current_cards.length}
- 平均难度: ${(current_cards.reduce((sum, card) => sum + card.difficulty, 0) / current_cards.length).toFixed(2)}
- 复杂卡片比例: ${(current_cards.filter(card => card.difficulty > 6).length / current_cards.length * 100).toFixed(1)}%

最近表现:
- 平均准确率: ${(context.recent_performance.reduce((sum, p) => sum + p.accuracy, 0) / context.recent_performance.length * 100).toFixed(1)}%
- 平均响应时间: ${(context.recent_performance.reduce((sum, p) => sum + p.response_time, 0) / context.recent_performance.length / 1000).toFixed(1)}秒
- 平均信心度: ${(context.recent_performance.reduce((sum, p) => sum + p.confidence, 0) / context.recent_performance.length).toFixed(2)}

请根据认知负荷理论评估三种负荷类型：
1. 内在认知负荷 (任务本身复杂度)
2. 外在认知负荷 (无关干扰因素)  
3. 相关认知负荷 (促进学习的处理)

用JSON格式输出评估结果和建议。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 350
      })

      return this.parseCognitiveLoadResponse(response)
    } catch (error) {
      console.error('认知负荷评估失败:', error)
      return this.getFallbackCognitiveLoad(current_cards, context)
    }
  }

  /**
   * 生成个性化难度推荐
   */
  async generateDifficultyRecommendation(
    card: FSRSCard,
    context: LearningContext,
    user_profile: AdaptiveLearningProfile,
    cognitive_load: CognitiveLoad
  ): Promise<DifficultyRecommendation> {
    const prompt = `
作为AI学习心理学家，为用户提供个性化难度调整建议：

当前卡片:
- 难度: ${card.difficulty}
- 稳定性: ${card.stability.toFixed(2)}
- 成功率: ${(card.success_rate * 100).toFixed(1)}%
- 复习次数: ${card.reps}
- 平均用时: ${card.average_time.toFixed(1)}秒

用户学习档案:
- 最佳难度范围: ${user_profile.optimal_difficulty_range[0]}-${user_profile.optimal_difficulty_range[1]}
- 认知容量: ${user_profile.cognitive_capacity.toFixed(2)}
- 学习速度: ${user_profile.learning_speed.toFixed(2)}
- 记忆保持率: ${(user_profile.retention_rate * 100).toFixed(1)}%
- 偏好挑战水平: ${user_profile.preferred_challenge_level.toFixed(2)}

当前状态:
- 认知负荷: ${cognitive_load.total.toFixed(2)} (${cognitive_load.recommendation})
- 会话时长: ${context.session_duration}分钟
- 能量水平: ${context.energy_level}

基于以下原则提供建议:
1. 维持适当的挑战水平 (Zone of Proximal Development)
2. 避免认知过载
3. 个性化适应用户档案
4. 考虑当前学习状态

用JSON格式输出详细的难度调整建议。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.4,
        max_tokens: 450
      })

      return this.parseDifficultyRecommendation(response, card, user_profile)
    } catch (error) {
      console.error('难度推荐生成失败:', error)
      return this.getFallbackDifficultyRecommendation(card, context, user_profile, cognitive_load)
    }
  }

  /**
   * 动态调整学习节奏
   */
  async adjustLearningPace(
    session_performance: {
      cards_completed: number
      total_time: number
      accuracy: number
      fatigue_indicators: string[]
    },
    target_goals: {
      desired_accuracy: number
      time_budget: number
      cards_target: number
    }
  ): Promise<{
    recommended_pace: 'slower' | 'maintain' | 'faster'
    break_suggestion: {
      needed: boolean
      duration: number // 分钟
      type: 'micro' | 'short' | 'long'
    }
    session_adjustment: {
      continue: boolean
      remaining_time_allocation: number
      difficulty_adjustment: number
    }
    motivational_message: string
  }> {
    const pace_ratio = session_performance.cards_completed / (session_performance.total_time / 60) // 卡片/分钟
    const accuracy_gap = target_goals.desired_accuracy - session_performance.accuracy
    
    const prompt = `
作为学习节奏优化专家，分析当前学习会话并提供调整建议：

会话表现:
- 已完成卡片: ${session_performance.cards_completed}
- 总用时: ${session_performance.total_time}分钟  
- 当前准确率: ${(session_performance.accuracy * 100).toFixed(1)}%
- 学习节奏: ${pace_ratio.toFixed(2)}卡片/分钟
- 疲劳指标: ${session_performance.fatigue_indicators.join(', ')}

目标设定:
- 期望准确率: ${(target_goals.desired_accuracy * 100).toFixed(1)}%
- 时间预算: ${target_goals.time_budget}分钟
- 卡片目标: ${target_goals.cards_target}张

基于学习心理学原理，提供：
1. 节奏调整建议 (slower/maintain/faster)
2. 休息建议 (是否需要、时长、类型)
3. 会话调整策略
4. 激励性反馈

用JSON格式输出建议。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 400
      })

      return this.parsePaceAdjustment(response)
    } catch (error) {
      console.error('学习节奏调整失败:', error)
      return this.getFallbackPaceAdjustment(session_performance, target_goals)
    }
  }

  /**
   * 构建用户学习档案
   */
  async buildLearningProfile(
    user_id: string,
    historical_data: {
      cards_studied: FSRSCard[]
      session_records: Array<{
        date: Date
        duration: number
        accuracy: number
        cards_count: number
        time_of_day: string
        subject: string
      }>
      preference_feedback: Array<{
        difficulty: number
        satisfaction: number
        perceived_challenge: number
      }>
    }
  ): Promise<AdaptiveLearningProfile> {
    const prompt = `
作为学习分析专家，基于历史数据构建用户的自适应学习档案：

历史学习记录:
- 总学习卡片: ${historical_data.cards_studied.length}
- 学习会话: ${historical_data.session_records.length}次
- 平均准确率: ${(historical_data.session_records.reduce((sum, s) => sum + s.accuracy, 0) / historical_data.session_records.length * 100).toFixed(1)}%

卡片难度分布:
${this.calculateDifficultyDistribution(historical_data.cards_studied)}

时间段表现分析:
${this.analyzeTimePerformance(historical_data.session_records)}

学科表现分析:
${this.analyzeSubjectPerformance(historical_data.session_records)}

用户偏好反馈:
- 平均偏好难度: ${(historical_data.preference_feedback.reduce((sum, p) => sum + p.difficulty, 0) / historical_data.preference_feedback.length).toFixed(2)}
- 平均满意度: ${(historical_data.preference_feedback.reduce((sum, p) => sum + p.satisfaction, 0) / historical_data.preference_feedback.length).toFixed(2)}

请构建包含以下要素的学习档案：
1. 最佳难度范围
2. 认知容量评估
3. 学习速度特征
4. 记忆保持模式
5. 疲劳周期分析
6. 学科优势识别
7. 学习风格偏好

用JSON格式输出完整的用户学习档案。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 600
      })

      return this.parseLearningProfile(response, user_id)
    } catch (error) {
      console.error('学习档案构建失败:', error)
      return this.getFallbackLearningProfile(user_id, historical_data)
    }
  }

  // === 私有辅助方法 ===

  private async callOpenAI(prompt: string, options: any = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.4,
        max_tokens: options.max_tokens || 400
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseCognitiveLoadResponse(response: string): CognitiveLoad {
    try {
      const parsed = JSON.parse(response)
      return {
        intrinsic: parsed.intrinsic || 0.5,
        extraneous: parsed.extraneous || 0.3,
        germane: parsed.germane || 0.6,
        total: parsed.total || 0.7,
        recommendation: parsed.recommendation || 'maintain'
      }
    } catch (error) {
      return {
        intrinsic: 0.5,
        extraneous: 0.3,
        germane: 0.6,
        total: 0.7,
        recommendation: 'maintain'
      }
    }
  }

  private parseDifficultyRecommendation(
    response: string,
    card: FSRSCard,
    profile: AdaptiveLearningProfile
  ): DifficultyRecommendation {
    try {
      const parsed = JSON.parse(response)
      return {
        target_difficulty: parsed.target_difficulty || card.difficulty,
        adjustment_magnitude: parsed.adjustment_magnitude || 0,
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || '基于当前表现的标准调整',
        adaptive_strategy: parsed.adaptive_strategy || 'gradual',
        next_review_timing: parsed.next_review_timing || 24,
        cognitive_load_target: parsed.cognitive_load_target || {
          intrinsic: 0.6,
          extraneous: 0.2,
          germane: 0.7,
          total: 0.8,
          recommendation: 'maintain'
        },
        personalization_factors: parsed.personalization_factors || {
          learning_speed: profile.learning_speed,
          retention_strength: profile.retention_rate,
          difficulty_preference: profile.preferred_challenge_level - 5
        }
      }
    } catch (error) {
      return this.getFallbackDifficultyRecommendation(card, {} as any, profile, {} as any)
    }
  }

  private parsePaceAdjustment(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        recommended_pace: 'maintain',
        break_suggestion: {
          needed: false,
          duration: 5,
          type: 'micro'
        },
        session_adjustment: {
          continue: true,
          remaining_time_allocation: 15,
          difficulty_adjustment: 0
        },
        motivational_message: '继续保持现在的学习节奏！'
      }
    }
  }

  private parseLearningProfile(response: string, user_id: string): AdaptiveLearningProfile {
    try {
      const parsed = JSON.parse(response)
      return {
        user_id,
        optimal_difficulty_range: parsed.optimal_difficulty_range || [4, 7],
        cognitive_capacity: parsed.cognitive_capacity || 0.8,
        learning_speed: parsed.learning_speed || 1.0,
        retention_rate: parsed.retention_rate || 0.8,
        preferred_challenge_level: parsed.preferred_challenge_level || 6,
        fatigue_pattern: parsed.fatigue_pattern || new Array(24).fill(0.5),
        peak_performance_hours: parsed.peak_performance_hours || [9, 10, 11, 15, 16],
        subject_strengths: parsed.subject_strengths || {},
        learning_style_weights: parsed.learning_style_weights || {
          visual: 0.3,
          auditory: 0.2,
          kinesthetic: 0.2,
          reading_writing: 0.3
        }
      }
    } catch (error) {
      return this.getFallbackLearningProfile(user_id, {} as any)
    }
  }

  // 数据分析辅助方法
  private calculateDifficultyDistribution(cards: FSRSCard[]): string {
    const distribution = cards.reduce((acc, card) => {
      const range = Math.floor(card.difficulty / 2) * 2
      acc[range] = (acc[range] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    return Object.entries(distribution)
      .map(([range, count]) => `${range}-${parseInt(range) + 1}: ${count}张`)
      .join(', ')
  }

  private analyzeTimePerformance(sessions: any[]): string {
    const timeGroups = sessions.reduce((acc, session) => {
      acc[session.time_of_day] = acc[session.time_of_day] || []
      acc[session.time_of_day].push(session.accuracy)
      return acc
    }, {} as Record<string, number[]>)

    return Object.entries(timeGroups)
      .map(([time, accuracies]) => {
        const avg = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        return `${time}: ${(avg * 100).toFixed(1)}%`
      })
      .join(', ')
  }

  private analyzeSubjectPerformance(sessions: any[]): string {
    const subjectGroups = sessions.reduce((acc, session) => {
      acc[session.subject] = acc[session.subject] || []
      acc[session.subject].push(session.accuracy)
      return acc
    }, {} as Record<string, number[]>)

    return Object.entries(subjectGroups)
      .map(([subject, accuracies]) => {
        const avg = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        return `${subject}: ${(avg * 100).toFixed(1)}%`
      })
      .join(', ')
  }

  // 回退方法
  private getFallbackCognitiveLoad(cards: FSRSCard[], context: LearningContext): CognitiveLoad {
    const avgDifficulty = cards.reduce((sum, card) => sum + card.difficulty, 0) / cards.length
    const sessionLoad = Math.min(context.session_duration / 30, 1) // 30分钟后开始增加负荷

    return {
      intrinsic: Math.min(avgDifficulty / 10, 0.9),
      extraneous: context.distraction_level === 'high' ? 0.7 : context.distraction_level === 'medium' ? 0.4 : 0.2,
      germane: context.energy_level === 'high' ? 0.8 : context.energy_level === 'medium' ? 0.6 : 0.4,
      total: Math.min((avgDifficulty / 10) + sessionLoad, 0.9),
      recommendation: sessionLoad > 0.8 ? 'reduce' : sessionLoad < 0.4 ? 'increase' : 'maintain'
    }
  }

  private getFallbackDifficultyRecommendation(
    card: FSRSCard,
    context: LearningContext,
    profile: AdaptiveLearningProfile,
    load: CognitiveLoad
  ): DifficultyRecommendation {
    const adjustment = card.success_rate < 0.6 ? -1 : card.success_rate > 0.9 ? 1 : 0

    return {
      target_difficulty: Math.max(1, Math.min(10, card.difficulty + adjustment)),
      adjustment_magnitude: adjustment,
      confidence: 0.6,
      reasoning: `基于${(card.success_rate * 100).toFixed(1)}%成功率的标准调整`,
      adaptive_strategy: 'gradual',
      next_review_timing: card.success_rate > 0.8 ? 48 : 12,
      cognitive_load_target: {
        intrinsic: 0.6,
        extraneous: 0.2,
        germane: 0.7,
        total: 0.8,
        recommendation: 'maintain'
      },
      personalization_factors: {
        learning_speed: 1.0,
        retention_strength: 0.8,
        difficulty_preference: 0
      }
    }
  }

  private getFallbackPaceAdjustment(performance: any, goals: any): any {
    return {
      recommended_pace: performance.accuracy < goals.desired_accuracy ? 'slower' : 'maintain',
      break_suggestion: {
        needed: performance.total_time > 45,
        duration: 5,
        type: 'micro'
      },
      session_adjustment: {
        continue: true,
        remaining_time_allocation: Math.max(10, goals.time_budget - performance.total_time),
        difficulty_adjustment: performance.accuracy < 0.7 ? -1 : 0
      },
      motivational_message: '保持专注，你做得很好！'
    }
  }

  private getFallbackLearningProfile(user_id: string, data: any): AdaptiveLearningProfile {
    return {
      user_id,
      optimal_difficulty_range: [4, 7],
      cognitive_capacity: 0.8,
      learning_speed: 1.0,
      retention_rate: 0.75,
      preferred_challenge_level: 6,
      fatigue_pattern: new Array(24).fill(0.5),
      peak_performance_hours: [9, 10, 14, 15, 16],
      subject_strengths: {},
      learning_style_weights: {
        visual: 0.25,
        auditory: 0.25,
        kinesthetic: 0.25,
        reading_writing: 0.25
      }
    }
  }
}

export const difficultyAI = new DifficultyAI()
export default difficultyAI 