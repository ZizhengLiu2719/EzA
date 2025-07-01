/**
 * AI智能提示生成服务
 * 为闪卡学习提供智能提示、记忆技巧和学习策略
 */

import { FSRSCard } from '../types/SRSTypes'

export interface AIHint {
  id: string
  type: 'memory_technique' | 'concept_connection' | 'mnemonic' | 'visual_aid' | 'context_clue'
  content: string
  confidence: number // 0-1, AI对提示有效性的信心
  reasoning: string // AI生成此提示的推理过程
  difficulty_adjustment: number // -2 to +2, 对卡片难度的建议调整
}

export interface HintGenerationOptions {
  user_knowledge_level: 'beginner' | 'intermediate' | 'advanced'
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing'
  subject_context: string
  previous_mistakes?: string[]
  time_constraint?: number // 秒，用户希望的学习时间
  hint_types?: AIHint['type'][]
}

class AIHintService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * 为指定卡片生成智能学习提示
   */
  async generateHintsForCard(
    card: FSRSCard, 
    options: HintGenerationOptions
  ): Promise<AIHint[]> {
    const prompt = this.buildHintPrompt(card, options)
    
    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7,
        max_tokens: 400
      })

      return this.parseHintResponse(response)
    } catch (error) {
      console.error('AI提示生成失败:', error)
      return this.getFallbackHints(card, options)
    }
  }

  /**
   * 生成记忆宫殿技巧提示
   */
  async generateMemoryPalaceGuide(
    cards: FSRSCard[],
    theme: string = 'familiar_location'
  ): Promise<{
    palace_description: string
    room_assignments: Array<{
      card_id: string
      room: string
      memory_anchor: string
      visualization: string
    }>
    navigation_path: string
  }> {
    const prompt = `
你是一位记忆大师，擅长记忆宫殿技术。帮助用户为以下知识点创建记忆宫殿：

主题环境: ${theme}
知识点数量: ${cards.length}

卡片内容:
${cards.map((card, index) => `${index + 1}. 问题: ${card.question}\n   答案: ${card.answer}`).join('\n')}

请创建一个记忆宫殿方案，包括：
1. 宫殿整体描述（选择熟悉的地点）
2. 每个知识点的房间分配和记忆锚点
3. 生动的视觉化描述
4. 导航路径说明

用JSON格式输出，确保内容生动有趣且易于记忆。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.8,
        max_tokens: 600
      })

      return this.parseMemoryPalaceResponse(response)
    } catch (error) {
      console.error('记忆宫殿生成失败:', error)
      return this.getFallbackMemoryPalace(cards, theme)
    }
  }

  /**
   * 为困难卡片生成突破性提示
   */
  async generateBreakthroughHint(
    card: FSRSCard,
    struggling_patterns: string[]
  ): Promise<{
    root_cause_analysis: string
    targeted_strategy: string
    step_by_step_approach: string[]
    alternative_explanations: string[]
    practice_suggestions: string[]
  }> {
    const prompt = `
用户在学习这张卡片时遇到困难：

问题: ${card.question}
答案: ${card.answer}
困难模式: ${struggling_patterns.join(', ')}
当前难度: ${card.difficulty}
成功率: ${(card.success_rate * 100).toFixed(1)}%

作为学习心理学专家，请分析根本原因并提供突破性学习策略：

1. 根本原因分析（为什么用户在此卡片上困难）
2. 针对性策略（基于困难模式的具体建议）
3. 分步骤学习方法
4. 多种解释方式
5. 练习建议

用JSON格式输出，确保策略具体可执行。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 500
      })

      return this.parseBreakthroughResponse(response)
    } catch (error) {
      console.error('突破性提示生成失败:', error)
      return this.getFallbackBreakthroughHint(card)
    }
  }

  /**
   * 实时难度调整建议
   */
  async suggestDifficultyAdjustment(
    card: FSRSCard,
    recent_performance: {
      rating: number
      response_time: number
      timestamp: Date
    }[]
  ): Promise<{
    suggested_adjustment: number // -2 to +2
    reasoning: string
    confidence: number
    next_review_strategy: string
  }> {
    const avgRating = recent_performance.reduce((sum, p) => sum + p.rating, 0) / recent_performance.length
    const avgTime = recent_performance.reduce((sum, p) => sum + p.response_time, 0) / recent_performance.length

    const prompt = `
分析这张卡片的学习表现并建议难度调整：

卡片信息:
- 当前难度: ${card.difficulty}
- 稳定性: ${card.stability}
- 总复习次数: ${card.reps}
- 成功率: ${(card.success_rate * 100).toFixed(1)}%

最近表现 (最近${recent_performance.length}次):
- 平均评分: ${avgRating.toFixed(1)}/4
- 平均响应时间: ${(avgTime / 1000).toFixed(1)}秒
- 详细记录: ${recent_performance.map(p => `评分${p.rating}, ${(p.response_time/1000).toFixed(1)}s`).join('; ')}

请提供难度调整建议（-2到+2的整数调整）和推理。
用JSON格式输出。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.4,
        max_tokens: 300
      })

      return this.parseDifficultyResponse(response)
    } catch (error) {
      console.error('难度调整建议生成失败:', error)
      return this.getFallbackDifficultyAdjustment(card, recent_performance)
    }
  }

  /**
   * 生成知识连接图谱
   */
  async generateKnowledgeConnections(
    target_card: FSRSCard,
    related_cards: FSRSCard[]
  ): Promise<{
    connections: Array<{
      target_card_id: string
      related_card_id: string
      connection_type: 'causal' | 'analogical' | 'hierarchical' | 'temporal' | 'conceptual'
      strength: number // 0-1
      explanation: string
    }>
    learning_path: string[]
    concept_map: string
  }> {
    const prompt = `
分析以下知识点之间的连接关系：

目标卡片:
问题: ${target_card.question}
答案: ${target_card.answer}

相关卡片:
${related_cards.map((card, index) => `${index + 1}. 问题: ${card.question}\n   答案: ${card.answer}`).join('\n')}

请识别知识连接，包括：
1. 因果关系 (causal)
2. 类比关系 (analogical)  
3. 层次关系 (hierarchical)
4. 时间关系 (temporal)
5. 概念关系 (conceptual)

为每个连接提供强度评分(0-1)和解释，并建议最佳学习路径。
用JSON格式输出。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 500
      })

      return this.parseConnectionResponse(response)
    } catch (error) {
      console.error('知识连接生成失败:', error)
      return this.getFallbackConnections(target_card, related_cards)
    }
  }

  // === 私有辅助方法 ===

  private buildHintPrompt(card: FSRSCard, options: HintGenerationOptions): string {
    return `
你是一位专业的学习心理学家和记忆专家。为以下学习卡片生成智能提示：

卡片内容:
问题: ${card.question}
答案: ${card.answer}
${card.hint ? `现有提示: ${card.hint}` : ''}
${card.explanation ? `解释: ${card.explanation}` : ''}

学习者信息:
- 知识水平: ${options.user_knowledge_level}
- 学习风格: ${options.learning_style}
- 学科背景: ${options.subject_context}
${options.previous_mistakes ? `- 之前错误: ${options.previous_mistakes.join(', ')}` : ''}
${options.time_constraint ? `- 时间限制: ${options.time_constraint}秒` : ''}

当前卡片统计:
- 难度: ${card.difficulty}
- 成功率: ${(card.success_rate * 100).toFixed(1)}%
- 复习次数: ${card.reps}

请生成2-3个不同类型的智能提示，每个提示包括：
1. 类型 (memory_technique/concept_connection/mnemonic/visual_aid/context_clue)
2. 具体内容 (简洁有效)
3. 信心度 (0-1)
4. 推理过程
5. 难度调整建议 (-2到+2)

用JSON数组格式输出。
`
  }

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
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 400
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseHintResponse(response: string): AIHint[] {
    try {
      const hints = JSON.parse(response)
      return Array.isArray(hints) ? hints.map((hint: any, index: number) => ({
        id: `hint_${Date.now()}_${index}`,
        type: hint.type || 'concept_connection',
        content: hint.content || hint.text || '',
        confidence: hint.confidence || 0.8,
        reasoning: hint.reasoning || hint.reason || '',
        difficulty_adjustment: hint.difficulty_adjustment || 0
      })) : []
    } catch (error) {
      console.error('提示解析失败:', error)
      return []
    }
  }

  private parseMemoryPalaceResponse(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return this.getFallbackMemoryPalace([], 'home')
    }
  }

  private parseBreakthroughResponse(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        root_cause_analysis: '需要更多练习和不同的学习方法',
        targeted_strategy: '分解问题，逐步学习',
        step_by_step_approach: ['理解概念', '记忆要点', '反复练习'],
        alternative_explanations: ['用比喻解释', '图像化记忆'],
        practice_suggestions: ['每日复习', '主动回忆练习']
      }
    }
  }

  private parseDifficultyResponse(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        suggested_adjustment: 0,
        reasoning: '基于当前表现，维持现有难度',
        confidence: 0.7,
        next_review_strategy: '继续常规复习'
      }
    }
  }

  private parseConnectionResponse(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        connections: [],
        learning_path: [],
        concept_map: '暂无连接图谱'
      }
    }
  }

  // 回退方法
  private getFallbackHints(card: FSRSCard, options: HintGenerationOptions): AIHint[] {
    return [{
      id: `fallback_${Date.now()}`,
      type: 'concept_connection',
      content: '尝试将这个概念与您已知的知识联系起来',
      confidence: 0.6,
      reasoning: '通用学习策略',
      difficulty_adjustment: 0
    }]
  }

  private getFallbackMemoryPalace(cards: FSRSCard[], theme: string): any {
    return {
      palace_description: `想象您的${theme}，为每个知识点分配一个房间`,
      room_assignments: cards.map((card, index) => ({
        card_id: card.id,
        room: `房间${index + 1}`,
        memory_anchor: '门把手',
        visualization: `在门把手上贴上答案便签`
      })),
      navigation_path: '按顺序访问每个房间'
    }
  }

  private getFallbackBreakthroughHint(card: FSRSCard): any {
    return {
      root_cause_analysis: '此卡片需要更多关注和练习',
      targeted_strategy: '分解学习，循序渐进',
      step_by_step_approach: ['重新理解问题', '记忆关键词', '练习回忆'],
      alternative_explanations: ['用自己的话重新描述', '寻找相似例子'],
      practice_suggestions: ['增加复习频率', '使用记忆技巧']
    }
  }

  private getFallbackDifficultyAdjustment(card: FSRSCard, performance: any[]): any {
    const avgRating = performance.reduce((sum, p) => sum + p.rating, 0) / performance.length
    
    return {
      suggested_adjustment: avgRating < 2.5 ? 1 : avgRating > 3.5 ? -1 : 0,
      reasoning: `基于平均评分${avgRating.toFixed(1)}的调整建议`,
      confidence: 0.7,
      next_review_strategy: '根据表现调整复习间隔'
    }
  }

  private getFallbackConnections(target: FSRSCard, related: FSRSCard[]): any {
    return {
      connections: related.map(card => ({
        target_card_id: target.id,
        related_card_id: card.id,
        connection_type: 'conceptual' as const,
        strength: 0.5,
        explanation: '概念相关性'
      })),
      learning_path: [target.id, ...related.map(c => c.id)],
      concept_map: '基础概念连接图'
    }
  }
}

export const aiHintService = new AIHintService()
export default aiHintService 