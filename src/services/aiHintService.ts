/**
 * AI智能提示生成服务
 * 为闪卡学习提供智能提示、记忆技巧和学习策略
 */

import { getAIModel } from '@/config/aiModel'
import { FSRSCard } from '../types/SRSTypes'

export interface AIHint {
  id: string
  type: 'memory_technique' | 'concept_connection' | 'mnemonic' | 'visual_aid' | 'context_clue'
  content: string
  confidence: number // 0-1, AI对提示有效性的信心
  reasoning: string // AI's reasoning for generating this hint
  difficulty_adjustment: number // -2 to +2, suggested adjustment to the card's difficulty
}

export interface HintGenerationOptions {
  user_knowledge_level: 'beginner' | 'intermediate' | 'advanced'
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing'
  subject_context: string
  previous_mistakes?: string[]
  time_constraint?: number // seconds, desired study time from the user
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
      console.error('AI hint generation failed:', error)
      return this.getFallbackHints(card, options)
    }
  }

  /**
   * Generates a Memory Palace technique guide
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
You are a memory grandmaster specializing in the Memory Palace technique. Help the user create a memory palace for the following knowledge points:

Theme Environment: ${theme}
Number of Knowledge Points: ${cards.length}

Card Content:
${cards.map((card, index) => `${index + 1}. Question: ${card.question}\n   Answer: ${card.answer}`).join('\n')}

Please create a memory palace plan that includes:
1. A general description of the palace (choose a familiar location)
2. Room assignments and memory anchors for each knowledge point
3. Vivid visualization descriptions
4. Instructions for the navigation path

Output in JSON format, ensuring the content is engaging, fun, and easy to remember.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.8,
        max_tokens: 600
      })

      return this.parseMemoryPalaceResponse(response)
    } catch (error) {
      console.error('Memory Palace generation failed:', error)
      return this.getFallbackMemoryPalace(cards, theme)
    }
  }

  /**
   * Generates a breakthrough hint for a difficult card
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
The user is having difficulty with this card:

Question: ${card.question}
Answer: ${card.answer}
Struggling Patterns: ${struggling_patterns.join(', ')}
Current Difficulty: ${card.difficulty}
Success Rate: ${(card.reps > 0 ? (card.lapses / card.reps) : 0).toFixed(2)}%

As a learning psychology expert, please analyze the root cause and provide a breakthrough learning strategy:

1. Root Cause Analysis (why the user is struggling with this card)
2. Targeted Strategy (specific advice based on the struggling patterns)
3. Step-by-step Learning Approach
4. Alternative Explanations
5. Practice Suggestions

Output in JSON format, ensuring the strategy is concrete and actionable.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 500
      })

      return this.parseBreakthroughResponse(response)
    } catch (error) {
      console.error('Breakthrough hint generation failed:', error)
      return this.getFallbackBreakthroughHint(card)
    }
  }

  /**
   * Real-time difficulty adjustment suggestion
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
Analyze the learning performance for this card and suggest a difficulty adjustment:

Card Information:
- Current Difficulty: ${card.difficulty}
- Stability: ${card.stability}
- Total Repetitions: ${card.reps}
- Lapses: ${card.lapses}

Recent Performance (last ${recent_performance.length} reviews):
- Average Rating: ${avgRating.toFixed(1)}/4
- Average Response Time: ${(avgTime / 1000).toFixed(1)} seconds
- Detailed Log: ${recent_performance.map(p => `Rating ${p.rating}, ${(p.response_time/1000).toFixed(1)}s`).join('; ')}

Please provide a difficulty adjustment suggestion (an integer from -2 to +2) and the reasoning.
Output in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.4,
        max_tokens: 300
      })

      return this.parseDifficultyResponse(response)
    } catch (error) {
      console.error('Difficulty adjustment suggestion failed:', error)
      return this.getFallbackDifficultyAdjustment(card, recent_performance)
    }
  }

  /**
   * Generates a knowledge connection map
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
Analyze the connections between the following knowledge points:

Target Card:
Question: ${target_card.question}
Answer: ${target_card.answer}

Related Cards:
${related_cards.map((card, index) => `${index + 1}. Question: ${card.question}\n   Answer: ${card.answer}`).join('\n')}

Please identify the knowledge connections, including:
1. Causal relationships
2. Analogical relationships
3. Hierarchical relationships
4. Temporal relationships
5. Conceptual relationships

Provide a strength score (0-1) and an explanation for each connection, and suggest an optimal learning path.
Output in JSON format.
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 500
      })

      return this.parseConnectionResponse(response)
    } catch (error) {
      console.error('Knowledge connection generation failed:', error)
      return this.getFallbackConnections(target_card, related_cards)
    }
  }

  // === 私有辅助方法 ===

  private buildHintPrompt(card: FSRSCard, options: HintGenerationOptions): string {
    return `
You are an AI learning assistant. Generate a helpful hint for the following flashcard.

**Card:**
Question: ${card.question}
Answer: ${card.answer}

**User Profile:**
- Knowledge Level: ${options.user_knowledge_level}
- Learning Style: ${options.learning_style}
- Subject: ${options.subject_context}
- Previous Mistakes on this topic: ${options.previous_mistakes?.join(', ') || 'None'}

**Hint Requirements:**
- The hint should not give away the answer directly.
- It should guide the user towards the correct thinking process.
- Tailor the hint to the user's profile.
- If possible, choose from these types: ${options.hint_types?.join(', ') || 'any'}.
- Provide the hint in a JSON format with 'type', 'content', and 'reasoning' fields.
`;
  }

  private async callOpenAI(prompt: string, options: any = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: getAIModel(),
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
      id: `fallback_${card.id}`,
      type: 'context_clue',
      content: 'Think about the main concept this question is related to.',
      confidence: 0.5,
      reasoning: 'Fallback hint due to AI service error.',
      difficulty_adjustment: 0
    }];
  }

  private getFallbackMemoryPalace(cards: FSRSCard[], theme: string): any {
    return {
      palace_description: `A standard ${theme}-themed memory palace.`,
      room_assignments: cards.map(card => ({
        card_id: card.id,
        room: 'Main Hall',
        memory_anchor: 'A central table',
        visualization: `Imagine the answer to '${card.question}' written on a plaque on the table.`
      })),
      navigation_path: 'Start at the entrance and walk to the main hall.'
    };
  }

  private getFallbackBreakthroughHint(card: FSRSCard): any {
    return {
      root_cause_analysis: 'The concept may be abstract or not well-connected to prior knowledge.',
      targeted_strategy: 'Try to connect this concept to something you already know well.',
      step_by_step_approach: ['1. Re-read the question carefully.', '2. Break down the answer into smaller parts.', '3. Try to explain the concept in your own words.'],
      alternative_explanations: ['Consider looking for a video explanation of this topic online.'],
      practice_suggestions: ['Find a similar practice problem to solve.']
    };
  }

  private getFallbackDifficultyAdjustment(card: FSRSCard, performance: any[]): any {
    const lastRating = performance.length > 0 ? performance[performance.length - 1].rating : 0;
    let adjustment = 0;
    if (lastRating <= 2) adjustment = 1; // Increase difficulty if failed
    if (lastRating === 4) adjustment = -1; // Decrease difficulty if easy
    return {
      suggested_adjustment: adjustment,
      reasoning: 'Fallback logic based on the last performance rating.',
      confidence: 0.5,
      next_review_strategy: 'Review again after a shorter interval if the last attempt was a failure.'
    };
  }

  private getFallbackConnections(target: FSRSCard, related: FSRSCard[]): any {
    return {
      connections: related.map(r => ({
        target_card_id: target.id,
        related_card_id: r.id,
        connection_type: 'conceptual',
        strength: 0.5,
        explanation: `The concept in '${target.question}' is related to the concept in '${r.question}'.`
      })),
      learning_path: [target.id, ...related.map(r => r.id)],
      concept_map: 'A simple linear map connecting the target card to related cards.'
    };
  }
}

export const aiHintService = new AIHintService()
export default aiHintService 