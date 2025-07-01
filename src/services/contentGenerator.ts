/**
 * AI内容生成服务
 * 智能生成学习题目、解释、提示和相关学习材料
 */

import { getAIModel } from '@/config/aiModel'
import { FSRSCard } from '../types/SRSTypes'

export interface GeneratedQuestion {
  id: string
  question: string
  answer: string
  hint?: string
  explanation?: string
  difficulty: number // 1-10
  question_type: 'definition' | 'application' | 'analysis' | 'synthesis' | 'evaluation'
  cognitive_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  estimated_time: number // 秒
  tags: string[]
  source_material?: string
  confidence: number // 0-1, AI对生成质量的信心
}

export interface ContentGenerationOptions {
  subject: string
  topic: string
  difficulty_range: [number, number] // [min, max]
  question_count: number
  question_types?: GeneratedQuestion['question_type'][]
  cognitive_levels?: GeneratedQuestion['cognitive_level'][]
  learning_objectives?: string[]
  target_audience: 'high_school' | 'college' | 'graduate'
  time_constraint?: number // 总时间限制(分钟)
  language_style: 'formal' | 'conversational' | 'technical'
  include_multimedia?: boolean
}

export interface StudyMaterialPackage {
  title: string
  description: string
  learning_objectives: string[]
  prerequisite_knowledge: string[]
  estimated_study_time: number // 分钟
  difficulty_progression: number[] // 每个阶段的难度
  content_sections: {
    type: 'introduction' | 'concept' | 'example' | 'practice' | 'assessment'
    title: string
    content: string
    questions: GeneratedQuestion[]
    interactive_elements?: {
      type: 'quiz' | 'simulation' | 'diagram' | 'video'
      description: string
      implementation_hint: string
    }[]
  }[]
  summary: string
  further_reading: string[]
}

export interface ExplanationEnhancement {
  original_explanation: string
  enhanced_explanation: string
  improvement_type: 'clarity' | 'depth' | 'examples' | 'analogies' | 'visual_aids'
  additional_examples: string[]
  analogies: string[]
  common_misconceptions: string[]
  practice_suggestions: string[]
  related_concepts: string[]
}

class ContentGenerator {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * 基于主题智能生成学习问题
   */
  async generateQuestions(
    topic: string,
    source_material: string,
    options: ContentGenerationOptions
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
作为教育内容专家，基于以下材料生成高质量学习问题：

主题: ${topic}
学科: ${options.subject}
目标受众: ${options.target_audience}
难度范围: ${options.difficulty_range[0]}-${options.difficulty_range[1]}
问题数量: ${options.question_count}

源材料:
${source_material}

学习目标:
${options.learning_objectives?.join('\n') || '掌握核心概念和应用'}

请生成涵盖不同认知层次的问题：
1. Remember (记忆) - 基础事实和概念
2. Understand (理解) - 解释和总结
3. Apply (应用) - 在新情境中使用知识
4. Analyze (分析) - 分解和关联
5. Evaluate (评价) - 判断和批评
6. Create (创造) - 合成新想法

每个问题包含：
- 明确的问题陈述
- 准确的答案
- 有用的提示
- 详细的解释
- 难度评估 (1-10)
- 认知层次分类
- 预估答题时间
- 相关标签

用JSON数组格式输出所有问题。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.7,
        max_tokens: 1000
      })

      return this.parseGeneratedQuestions(response)
    } catch (error) {
      console.error('问题生成失败:', error)
      return this.getFallbackQuestions(topic, options)
    }
  }

  /**
   * 基于现有卡片生成相似问题
   */
  async generateSimilarQuestions(
    base_card: FSRSCard,
    variation_count: number = 3,
    difficulty_adjustment: number = 0 // -2 to +2
  ): Promise<GeneratedQuestion[]> {
    const prompt = `
基于这张学习卡片，生成${variation_count}个相似但不同的问题变体：

原始卡片:
问题: ${base_card.question}
答案: ${base_card.answer}
${base_card.hint ? `提示: ${base_card.hint}` : ''}
${base_card.explanation ? `解释: ${base_card.explanation}` : ''}
当前难度: ${base_card.difficulty}

变体要求:
- 保持核心概念不变
- 调整难度: ${difficulty_adjustment > 0 ? `增加${difficulty_adjustment}` : difficulty_adjustment < 0 ? `降低${Math.abs(difficulty_adjustment)}` : '保持相同'}
- 使用不同的表达方式
- 提供新的应用场景
- 确保每个变体都有独特价值

每个变体包含：
1. 重新表述的问题
2. 对应的准确答案  
3. 适当的提示
4. 清晰的解释
5. 调整后的难度值

用JSON数组格式输出所有变体。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.8,
        max_tokens: 800
      })

      return this.parseGeneratedQuestions(response)
    } catch (error) {
      console.error('变体问题生成失败:', error)
      return this.getFallbackSimilarQuestions(base_card, variation_count)
    }
  }

  /**
   * 增强现有解释
   */
  async enhanceExplanation(
    question: string,
    answer: string,
    current_explanation: string,
    enhancement_focus: ExplanationEnhancement['improvement_type'][]
  ): Promise<ExplanationEnhancement> {
    const prompt = `
作为教育专家，增强以下学习材料的解释质量：

问题: ${question}
答案: ${answer}
当前解释: ${current_explanation}

增强重点: ${enhancement_focus.join(', ')}

请提供：
1. 改进后的解释（更清晰、更全面）
2. 具体的改进类型说明
3. 2-3个相关例子
4. 1-2个生动的类比
5. 常见误解澄清
6. 练习建议
7. 相关概念连接

确保增强后的内容：
- 更容易理解
- 包含具体例子
- 使用恰当的类比
- 预防常见错误
- 促进深度学习

用JSON格式输出增强结果。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 600
      })

      return this.parseExplanationEnhancement(response, current_explanation)
    } catch (error) {
      console.error('解释增强失败:', error)
      return this.getFallbackExplanationEnhancement(current_explanation, enhancement_focus)
    }
  }

  /**
   * 生成完整的学习材料包
   */
  async generateStudyMaterialPackage(
    topic: string,
    learning_objectives: string[],
    target_duration: number, // 分钟
    options: Partial<ContentGenerationOptions>
  ): Promise<StudyMaterialPackage> {
    const prompt = `
创建关于"${topic}"的完整学习材料包：

学习目标:
${learning_objectives.join('\n')}

目标学习时间: ${target_duration}分钟
目标受众: ${options.target_audience || 'college'}
语言风格: ${options.language_style || 'conversational'}

请创建包含以下部分的学习包：

1. **介绍部分** (10%时间)
   - 主题概述
   - 学习目标
   - 先决知识
   - 学习路径

2. **核心概念** (40%时间)
   - 基础概念解释
   - 关键术语定义
   - 原理和理论
   - 概念间关系

3. **实例与应用** (30%时间)
   - 具体例子
   - 实际应用
   - 案例研究
   - 问题解决

4. **练习与评估** (15%时间)
   - 练习题目
   - 自测问题
   - 反思提示
   - 应用练习

5. **总结与拓展** (5%时间)
   - 要点总结
   - 进一步阅读
   - 相关主题
   - 实践建议

每个部分包含适当的问题和互动元素。用JSON格式输出完整的学习包结构。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 1200
      })

      return this.parseStudyMaterialPackage(response, topic)
    } catch (error) {
      console.error('学习材料包生成失败:', error)
      return this.getFallbackStudyMaterialPackage(topic, learning_objectives, target_duration)
    }
  }

  /**
   * 智能填充卡片空白信息
   */
  async fillMissingCardInfo(
    incomplete_card: Partial<FSRSCard>,
    context: {
      subject: string
      topic?: string
      difficulty_hint?: number
    }
  ): Promise<{
    suggested_question?: string
    suggested_answer?: string
    suggested_hint?: string
    suggested_explanation?: string
    suggested_tags?: string[]
    confidence: number
  }> {
    const prompt = `
帮助完善这张不完整的学习卡片：

现有信息:
${incomplete_card.question ? `问题: ${incomplete_card.question}` : ''}
${incomplete_card.answer ? `答案: ${incomplete_card.answer}` : ''}
${incomplete_card.hint ? `提示: ${incomplete_card.hint}` : ''}
${incomplete_card.explanation ? `解释: ${incomplete_card.explanation}` : ''}

上下文信息:
- 学科: ${context.subject}
${context.topic ? `- 主题: ${context.topic}` : ''}
${context.difficulty_hint ? `- 建议难度: ${context.difficulty_hint}` : ''}

请为缺失的部分提供建议：
${!incomplete_card.question ? '- 生成合适的问题' : ''}
${!incomplete_card.answer ? '- 提供准确的答案' : ''}
${!incomplete_card.hint ? '- 添加有用的提示' : ''}
${!incomplete_card.explanation ? '- 编写清晰的解释' : ''}
- 建议相关标签

确保所有建议内容：
1. 彼此一致和协调
2. 适合指定的学科和主题
3. 具有教育价值
4. 符合学习心理学原理

用JSON格式输出建议内容和置信度。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 500
      })

      return this.parseCardCompletion(response)
    } catch (error) {
      console.error('卡片信息填充失败:', error)
      return this.getFallbackCardCompletion(incomplete_card, context)
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
        model: getAIModel(),
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 600
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseGeneratedQuestions(response: string): GeneratedQuestion[] {
    try {
      const questions = JSON.parse(response)
      return Array.isArray(questions) ? questions.map((q: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        question: q.question || '',
        answer: q.answer || '',
        hint: q.hint,
        explanation: q.explanation,
        difficulty: q.difficulty || 5,
        question_type: q.question_type || 'definition',
        cognitive_level: q.cognitive_level || 'understand',
        estimated_time: q.estimated_time || 30,
        tags: Array.isArray(q.tags) ? q.tags : [],
        confidence: q.confidence || 0.8
      })) : []
    } catch (error) {
      console.error('问题解析失败:', error)
      return []
    }
  }

  private parseExplanationEnhancement(response: string, original: string): ExplanationEnhancement {
    try {
      const parsed = JSON.parse(response)
      return {
        original_explanation: original,
        enhanced_explanation: parsed.enhanced_explanation || original,
        improvement_type: parsed.improvement_type || 'clarity',
        additional_examples: parsed.additional_examples || [],
        analogies: parsed.analogies || [],
        common_misconceptions: parsed.common_misconceptions || [],
        practice_suggestions: parsed.practice_suggestions || [],
        related_concepts: parsed.related_concepts || []
      }
    } catch (error) {
      return this.getFallbackExplanationEnhancement(original, ['clarity'])
    }
  }

  private parseStudyMaterialPackage(response: string, topic: string): StudyMaterialPackage {
    try {
      const parsed = JSON.parse(response)
      return {
        title: parsed.title || `${topic} 学习指南`,
        description: parsed.description || `关于${topic}的综合学习材料`,
        learning_objectives: parsed.learning_objectives || [],
        prerequisite_knowledge: parsed.prerequisite_knowledge || [],
        estimated_study_time: parsed.estimated_study_time || 60,
        difficulty_progression: parsed.difficulty_progression || [3, 5, 7],
        content_sections: parsed.content_sections || [],
        summary: parsed.summary || '',
        further_reading: parsed.further_reading || []
      }
    } catch (error) {
      return this.getFallbackStudyMaterialPackage(topic, [], 60)
    }
  }

  private parseCardCompletion(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        confidence: 0.5
      }
    }
  }

  // 回退方法
  private getFallbackQuestions(topic: string, options: ContentGenerationOptions): GeneratedQuestion[] {
    return [{
      id: `fallback_${Date.now()}`,
      question: `什么是${topic}？`,
      answer: `${topic}是...`,
      hint: `考虑${topic}的基本定义`,
      explanation: `这是关于${topic}的基础问题`,
      difficulty: 3,
      question_type: 'definition',
      cognitive_level: 'understand',
      estimated_time: 30,
      tags: [topic, options.subject],
      confidence: 0.6
    }]
  }

  private getFallbackSimilarQuestions(card: FSRSCard, count: number): GeneratedQuestion[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `similar_${Date.now()}_${index}`,
      question: `${card.question} (变体 ${index + 1})`,
      answer: card.answer,
      hint: card.hint,
      explanation: card.explanation,
      difficulty: card.difficulty,
      question_type: 'definition' as const,
      cognitive_level: 'understand' as const,
      estimated_time: 30,
      tags: card.tags || [],
      confidence: 0.6
    }))
  }

  private getFallbackExplanationEnhancement(
    original: string,
    focus: ExplanationEnhancement['improvement_type'][]
  ): ExplanationEnhancement {
    return {
      original_explanation: original,
      enhanced_explanation: `${original}\n\n这个概念可以进一步理解为...`,
      improvement_type: focus[0] || 'clarity',
      additional_examples: ['例子1', '例子2'],
      analogies: ['这就像...'],
      common_misconceptions: ['常见误解：...'],
      practice_suggestions: ['练习建议：...'],
      related_concepts: ['相关概念：...']
    }
  }

  private getFallbackStudyMaterialPackage(
    topic: string,
    objectives: string[],
    duration: number
  ): StudyMaterialPackage {
    return {
      title: `${topic} 学习指南`,
      description: `关于${topic}的学习材料包`,
      learning_objectives: objectives,
      prerequisite_knowledge: [],
      estimated_study_time: duration,
      difficulty_progression: [3, 5, 7],
      content_sections: [{
        type: 'introduction',
        title: '介绍',
        content: `欢迎学习${topic}`,
        questions: [],
        interactive_elements: []
      }],
      summary: `本材料包涵盖了${topic}的核心概念`,
      further_reading: []
    }
  }

  private getFallbackCardCompletion(card: Partial<FSRSCard>, context: any): any {
    return {
      suggested_question: card.question || `关于${context.subject}的问题`,
      suggested_answer: card.answer || '答案待补充',
      suggested_hint: card.hint || '提示：仔细思考概念',
      suggested_explanation: card.explanation || '这个概念很重要',
      suggested_tags: [context.subject, context.topic].filter(Boolean),
      confidence: 0.5
    }
  }
}

export const contentGenerator = new ContentGenerator()
export default contentGenerator 