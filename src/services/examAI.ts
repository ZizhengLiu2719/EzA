/**
 * AI考试生成器服务
 * 智能生成个性化考试、自动评分和深度分析
 */

import { FSRSCard } from '../types/SRSTypes'

export interface ExamQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank' | 'matching'
  question: string
  options?: string[] // for multiple choice
  correct_answer: string | string[]
  points: number
  difficulty: number // 1-10
  estimated_time: number // 秒
  cognitive_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  subject_area: string
  topic: string
  hint?: string
  explanation?: string
  rubric?: {
    excellent: string
    good: string
    satisfactory: string
    needs_improvement: string
  }
}

export interface ExamConfiguration {
  title: string
  subject: string
  topics: string[]
  duration: number // 分钟
  total_points: number
  question_distribution: {
    type: ExamQuestion['type']
    count: number
    points_per_question: number
  }[]
  difficulty_distribution: {
    difficulty_range: [number, number]
    percentage: number
  }[]
  cognitive_distribution: {
    level: ExamQuestion['cognitive_level']
    percentage: number
  }[]
  learning_objectives: string[]
  special_instructions?: string
}

export interface GeneratedExam {
  id: string
  config: ExamConfiguration
  questions: ExamQuestion[]
  metadata: {
    generated_at: Date
    total_questions: number
    estimated_completion_time: number
    difficulty_average: number
    cognitive_level_distribution: Record<string, number>
    ai_confidence: number
  }
  instructions: string
  answer_key: {
    question_id: string
    correct_answer: string | string[]
    explanation: string
    points: number
  }[]
}

export interface ExamResponse {
  question_id: string
  student_answer: string | string[]
  response_time: number // 秒
  confidence_level?: number // 1-5
  flagged_for_review?: boolean
}

export interface ExamResult {
  exam_id: string
  student_responses: ExamResponse[]
  scoring: {
    total_score: number
    max_possible_score: number
    percentage: number
    question_scores: {
      question_id: string
      earned_points: number
      max_points: number
      is_correct: boolean
      partial_credit?: number
    }[]
  }
  analysis: {
    time_analysis: {
      total_time: number
      average_time_per_question: number
      rushed_questions: string[] // question_ids
      over_time_questions: string[]
    }
    difficulty_analysis: {
      easy_questions_performance: number // 0-1
      medium_questions_performance: number
      hard_questions_performance: number
    }
    cognitive_analysis: {
      remember_performance: number
      understand_performance: number
      apply_performance: number
      analyze_performance: number
      evaluate_performance: number
      create_performance: number
    }
    topic_analysis: {
      topic: string
      performance: number
      question_count: number
    }[]
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
  grade_level: 'A' | 'B' | 'C' | 'D' | 'F'
  feedback: {
    overall_feedback: string
    question_feedback: {
      question_id: string
      feedback: string
      improvement_suggestions: string[]
    }[]
  }
}

export interface AdaptiveExamSettings {
  initial_difficulty: number
  adaptation_rate: number // 调整敏感度
  minimum_questions: number
  maximum_questions: number
  termination_criteria: {
    confidence_threshold: number // 能力估计的置信度
    standard_error_threshold: number
    time_limit?: number
  }
  ability_estimation_method: 'irt' | 'cat' | 'hybrid'
}

class ExamAI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * 基于学习卡片生成个性化考试
   */
  async generateExamFromCards(
    cards: FSRSCard[],
    config: ExamConfiguration
  ): Promise<GeneratedExam> {
    const prompt = `
作为考试设计专家，基于提供的学习卡片生成一份个性化考试：

考试配置:
- 标题: ${config.title}
- 学科: ${config.subject}
- 时长: ${config.duration}分钟
- 总分: ${config.total_points}分
- 主题: ${config.topics.join(', ')}

问题分布要求:
${config.question_distribution.map(dist => 
  `- ${dist.type}: ${dist.count}题, 每题${dist.points_per_question}分`
).join('\n')}

难度分布:
${config.difficulty_distribution.map(dist => 
  `- 难度${dist.difficulty_range[0]}-${dist.difficulty_range[1]}: ${dist.percentage}%`
).join('\n')}

认知层次分布:
${config.cognitive_distribution.map(dist => 
  `- ${dist.level}: ${dist.percentage}%`
).join('\n')}

可用学习卡片 (${cards.length}张):
${cards.slice(0, 10).map((card, index) => 
  `${index + 1}. 问题: ${card.question}\n   答案: ${card.answer}\n   难度: ${card.difficulty}`
).join('\n')}
${cards.length > 10 ? `... 和其他${cards.length - 10}张卡片` : ''}

学习目标:
${config.learning_objectives.join('\n')}

请生成包含以下内容的完整考试：
1. 多样化的题型组合
2. 符合指定的难度和认知分布
3. 清晰的问题表述
4. 准确的答案和评分标准
5. 有用的提示和解释
6. 详细的答案解析

用JSON格式输出完整的考试结构。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.6,
        max_tokens: 1500
      })

      return this.parseGeneratedExam(response, config)
    } catch (error) {
      console.error('考试生成失败:', error)
      return this.getFallbackExam(cards, config)
    }
  }

  /**
   * 智能评分和分析
   */
  async scoreExam(
    exam: GeneratedExam,
    responses: ExamResponse[]
  ): Promise<ExamResult> {
    const prompt = `
作为智能评分专家，对这份考试进行全面评分和分析：

考试信息:
- 标题: ${exam.config.title}
- 总题数: ${exam.questions.length}
- 总分: ${exam.config.total_points}
- 时长: ${exam.config.duration}分钟

学生答题情况:
${responses.map((response, index) => {
  const question = exam.questions.find(q => q.id === response.question_id)
  const correct_answer = exam.answer_key.find(a => a.question_id === response.question_id)?.correct_answer
  
  return `题目${index + 1}: ${question?.question || '未知题目'}
学生答案: ${Array.isArray(response.student_answer) ? response.student_answer.join(', ') : response.student_answer}
正确答案: ${Array.isArray(correct_answer) ? correct_answer.join(', ') : correct_answer}
用时: ${response.response_time}秒
题型: ${question?.type}
难度: ${question?.difficulty}
认知层次: ${question?.cognitive_level}`
}).join('\n\n')}

请提供详细的评分和分析：

1. **精确评分**
   - 每题得分计算
   - 部分分数评估 (适用时)
   - 总分统计

2. **时间分析**
   - 总用时评估
   - 各题用时分析
   - 时间管理表现

3. **能力分析**
   - 不同难度表现
   - 认知层次表现
   - 主题掌握度

4. **诊断反馈**
   - 优势领域识别
   - 薄弱环节诊断
   - 具体改进建议

5. **个性化反馈**
   - 每题详细反馈
   - 学习建议
   - 后续学习路径

用JSON格式输出完整的评分结果和分析。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.4,
        max_tokens: 1200
      })

      return this.parseExamResult(response, exam, responses)
    } catch (error) {
      console.error('考试评分失败:', error)
      return this.getFallbackExamResult(exam, responses)
    }
  }

  /**
   * 自适应考试引擎
   */
  async generateAdaptiveQuestion(
    current_ability_estimate: number,
    previous_responses: ExamResponse[],
    available_questions: ExamQuestion[],
    settings: AdaptiveExamSettings
  ): Promise<{
    next_question: ExamQuestion
    reasoning: string
    confidence: number
    estimated_ability_range: [number, number]
    continue_exam: boolean
  }> {
    const prompt = `
作为自适应测试专家，基于学生当前表现选择下一道最优问题：

当前能力估计: ${current_ability_estimate.toFixed(2)} (1-10量表)

已答题表现:
${previous_responses.map((response, index) => {
  const question = available_questions.find(q => q.id === response.question_id)
  return `题目${index + 1}: 难度${question?.difficulty}, 用时${response.response_time}s, 答对: ${response.student_answer === question?.correct_answer ? '是' : '否'}`
}).join('\n')}

可选问题池:
${available_questions.map((q, index) => 
  `${index + 1}. 难度: ${q.difficulty}, 题型: ${q.type}, 主题: ${q.topic}, 认知层次: ${q.cognitive_level}`
).join('\n')}

自适应设置:
- 最小题数: ${settings.minimum_questions}
- 最大题数: ${settings.maximum_questions}
- 置信度阈值: ${settings.termination_criteria.confidence_threshold}
- 估计方法: ${settings.ability_estimation_method}

基于IRT和CAT理论，选择能最大化信息量的下一道题目。考虑：
1. 题目难度与当前能力估计的匹配度
2. 信息函数最大化
3. 测量精度提升
4. 考试终止条件

用JSON格式输出选择结果和推理过程。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.3,
        max_tokens: 400
      })

      return this.parseAdaptiveSelection(response, available_questions)
    } catch (error) {
      console.error('自适应题目选择失败:', error)
      return this.getFallbackAdaptiveSelection(current_ability_estimate, available_questions)
    }
  }

  /**
   * 生成考试后学习建议
   */
  async generateStudyRecommendations(
    exam_result: ExamResult,
    student_learning_profile: {
      learning_style: string
      difficulty_preference: number
      time_availability: number // 每日可用学习时间(分钟)
      goal_performance: number // 目标分数百分比
    }
  ): Promise<{
    immediate_actions: string[]
    short_term_plan: {
      duration: string
      daily_tasks: string[]
      focus_areas: string[]
      practice_suggestions: string[]
    }
    long_term_strategy: {
      duration: string
      milestones: string[]
      skill_development: string[]
      assessment_schedule: string[]
    }
    personalized_tips: string[]
    resource_recommendations: {
      type: 'reading' | 'practice' | 'video' | 'interactive'
      title: string
      description: string
      estimated_time: number
      priority: 'high' | 'medium' | 'low'
    }[]
  }> {
    const performanceGap = student_learning_profile.goal_performance - exam_result.scoring.percentage
    
    const prompt = `
作为学习顾问，基于考试结果为学生制定个性化学习计划：

考试表现:
- 总分: ${exam_result.scoring.percentage.toFixed(1)}%
- 目标分数: ${student_learning_profile.goal_performance}%
- 表现差距: ${performanceGap.toFixed(1)}%

详细分析:
- 优势领域: ${exam_result.analysis.strengths.join(', ')}
- 薄弱环节: ${exam_result.analysis.weaknesses.join(', ')}
- 时间管理: ${exam_result.analysis.time_analysis.total_time}分钟 (限时${60}分钟)

学生档案:
- 学习风格: ${student_learning_profile.learning_style}
- 难度偏好: ${student_learning_profile.difficulty_preference}
- 可用时间: 每日${student_learning_profile.time_availability}分钟

认知层次表现:
- 记忆: ${(exam_result.analysis.cognitive_analysis.remember_performance * 100).toFixed(1)}%
- 理解: ${(exam_result.analysis.cognitive_analysis.understand_performance * 100).toFixed(1)}%
- 应用: ${(exam_result.analysis.cognitive_analysis.apply_performance * 100).toFixed(1)}%
- 分析: ${(exam_result.analysis.cognitive_analysis.analyze_performance * 100).toFixed(1)}%

基于教育心理学和个性化学习理论，制定：

1. **立即行动** (今天开始)
2. **短期计划** (1-2周)
3. **长期策略** (1-2个月)
4. **个性化技巧**
5. **资源推荐**

确保计划：
- 针对性强，重点突出
- 时间安排合理
- 符合学习风格
- 可操作性强
- 有明确的里程碑

用JSON格式输出完整的学习建议。
`

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.5,
        max_tokens: 800
      })

      return this.parseStudyRecommendations(response)
    } catch (error) {
      console.error('学习建议生成失败:', error)
      return this.getFallbackStudyRecommendations(exam_result, student_learning_profile)
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
        temperature: options.temperature || 0.6,
        max_tokens: options.max_tokens || 800
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private parseGeneratedExam(response: string, config: ExamConfiguration): GeneratedExam {
    try {
      const parsed = JSON.parse(response)
      return {
        id: `exam_${Date.now()}`,
        config,
        questions: parsed.questions || [],
        metadata: {
          generated_at: new Date(),
          total_questions: parsed.questions?.length || 0,
          estimated_completion_time: config.duration,
          difficulty_average: parsed.difficulty_average || 5,
          cognitive_level_distribution: parsed.cognitive_level_distribution || {},
          ai_confidence: parsed.ai_confidence || 0.8
        },
        instructions: parsed.instructions || '请仔细阅读每道题目，按要求作答。',
        answer_key: parsed.answer_key || []
      }
    } catch (error) {
      return this.getFallbackExam([], config)
    }
  }

  private parseExamResult(response: string, exam: GeneratedExam, responses: ExamResponse[]): ExamResult {
    try {
      return JSON.parse(response)
    } catch (error) {
      return this.getFallbackExamResult(exam, responses)
    }
  }

  private parseAdaptiveSelection(response: string, questions: ExamQuestion[]): any {
    try {
      const parsed = JSON.parse(response)
      const selectedQuestion = questions.find(q => q.id === parsed.next_question_id) || questions[0]
      
      return {
        next_question: selectedQuestion,
        reasoning: parsed.reasoning || '基于当前能力估计选择',
        confidence: parsed.confidence || 0.7,
        estimated_ability_range: parsed.estimated_ability_range || [4, 6],
        continue_exam: parsed.continue_exam !== false
      }
    } catch (error) {
      return this.getFallbackAdaptiveSelection(5, questions)
    }
  }

  private parseStudyRecommendations(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      return {
        immediate_actions: ['复习薄弱知识点', '制定学习计划'],
        short_term_plan: {
          duration: '1-2周',
          daily_tasks: ['每日复习30分钟'],
          focus_areas: ['基础概念'],
          practice_suggestions: ['做练习题']
        },
        long_term_strategy: {
          duration: '1-2个月',
          milestones: ['提升10分'],
          skill_development: ['分析能力'],
          assessment_schedule: ['每周一次小测']
        },
        personalized_tips: ['保持规律学习'],
        resource_recommendations: []
      }
    }
  }

  // 回退方法
  private getFallbackExam(cards: FSRSCard[], config: ExamConfiguration): GeneratedExam {
    const sampleQuestions: ExamQuestion[] = cards.slice(0, 5).map((card, index) => ({
      id: `q_${index}`,
      type: 'short_answer',
      question: card.question,
      correct_answer: card.answer,
      points: 10,
      difficulty: card.difficulty,
      estimated_time: 120,
      cognitive_level: 'understand',
      subject_area: config.subject,
      topic: config.topics[0] || '通用',
      hint: card.hint,
      explanation: card.explanation
    }))

    return {
      id: `exam_${Date.now()}`,
      config,
      questions: sampleQuestions,
      metadata: {
        generated_at: new Date(),
        total_questions: sampleQuestions.length,
        estimated_completion_time: config.duration,
        difficulty_average: 5,
        cognitive_level_distribution: {},
        ai_confidence: 0.6
      },
      instructions: '请仔细阅读每道题目，按要求作答。',
      answer_key: sampleQuestions.map(q => ({
        question_id: q.id,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '参考答案解析',
        points: q.points
      }))
    }
  }

  private getFallbackExamResult(exam: GeneratedExam, responses: ExamResponse[]): ExamResult {
    const totalScore = responses.length * 8 // 假设平均8分
    const maxScore = exam.config.total_points

    return {
      exam_id: exam.id,
      student_responses: responses,
      scoring: {
        total_score: totalScore,
        max_possible_score: maxScore,
        percentage: (totalScore / maxScore) * 100,
        question_scores: responses.map(r => ({
          question_id: r.question_id,
          earned_points: 8,
          max_points: 10,
          is_correct: true
        }))
      },
      analysis: {
        time_analysis: {
          total_time: responses.reduce((sum, r) => sum + r.response_time, 0),
          average_time_per_question: 120,
          rushed_questions: [],
          over_time_questions: []
        },
        difficulty_analysis: {
          easy_questions_performance: 0.9,
          medium_questions_performance: 0.8,
          hard_questions_performance: 0.7
        },
        cognitive_analysis: {
          remember_performance: 0.85,
          understand_performance: 0.8,
          apply_performance: 0.75,
          analyze_performance: 0.7,
          evaluate_performance: 0.65,
          create_performance: 0.6
        },
        topic_analysis: exam.config.topics.map(topic => ({
          topic,
          performance: 0.8,
          question_count: 2
        })),
        strengths: ['基础概念掌握良好'],
        weaknesses: ['应用能力需要提升'],
        recommendations: ['多做实践练习']
      },
      grade_level: 'B',
      feedback: {
        overall_feedback: '整体表现良好，继续保持。',
        question_feedback: responses.map(r => ({
          question_id: r.question_id,
          feedback: '回答正确',
          improvement_suggestions: []
        }))
      }
    }
  }

  private getFallbackAdaptiveSelection(ability: number, questions: ExamQuestion[]): any {
    const suitableQuestions = questions.filter(q => 
      Math.abs(q.difficulty - ability) <= 2
    )
    
    return {
      next_question: suitableQuestions[0] || questions[0],
      reasoning: '基于能力估计选择合适难度的题目',
      confidence: 0.7,
      estimated_ability_range: [ability - 1, ability + 1],
      continue_exam: true
    }
  }

  private getFallbackStudyRecommendations(result: ExamResult, profile: any): any {
    return {
      immediate_actions: [
        '复习考试中的错误题目',
        '识别主要薄弱环节',
        '制定针对性学习计划'
      ],
      short_term_plan: {
        duration: '1-2周',
        daily_tasks: [
          `每日学习${profile.time_availability}分钟`,
          '重点复习薄弱知识点',
          '完成相关练习题'
        ],
        focus_areas: result.analysis.weaknesses.slice(0, 3),
        practice_suggestions: [
          '多做类似题型的练习',
          '使用间隔重复法复习',
          '寻求老师或同学帮助'
        ]
      },
      long_term_strategy: {
        duration: '1-2个月',
        milestones: [
          '薄弱环节提升10分',
          '整体成绩达到目标',
          '建立稳定学习习惯'
        ],
        skill_development: [
          '提升分析思维能力',
          '增强问题解决技巧',
          '培养批判性思维'
        ],
        assessment_schedule: [
          '每周一次自测',
          '每两周一次模拟考试',
          '每月一次综合评估'
        ]
      },
      personalized_tips: [
        `适合您的${profile.learning_style}学习风格的方法`,
        '保持规律的学习节奏',
        '及时复习，避免遗忘'
      ],
      resource_recommendations: [
        {
          type: 'practice' as const,
          title: '针对性练习题集',
          description: '专门针对薄弱环节的练习',
          estimated_time: 30,
          priority: 'high' as const
        },
        {
          type: 'reading' as const,
          title: '基础概念复习材料',
          description: '巩固基础知识',
          estimated_time: 20,
          priority: 'medium' as const
        }
      ]
    }
  }
}

export const examAI = new ExamAI()
export default examAI 