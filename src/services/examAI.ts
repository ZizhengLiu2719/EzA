/**
 * AI考试生成器服务
 * 智能生成个性化考试、自动评分和深度分析
 */

import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { getAIModel } from '../config/aiModel';
import type { ExamConfiguration, ExamQuestion, ExamResponse, ExamResult, GeneratedExam } from '../types/examTypes';
import { FSRSCard } from '../types/SRSTypes';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export type { ExamConfiguration, ExamQuestion, ExamResponse, ExamResult, GeneratedExam };

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
    config: ExamConfiguration,
    isProfessorMode: boolean = false
  ): Promise<GeneratedExam> {
    const professorModeInstruction = isProfessorMode 
      ? `**风格指示 (Professor Mode):** 
请模仿一位顶尖大学教授的风格出题。避免简单的记忆性问题，侧重于考察学生的分析、评估和应用能力。问题应该更具深度和挑战性，可能需要结合多个知识点来回答。`
      : '';

    const prompt = `
作为考试设计专家，基于提供的学习卡片数据和 FSRS 间隔重复算法信息，生成一份高度个性化的考试。

**出题策略 (Question Selection Strategy):**
请优先考察学生掌握不佳的知识点。选择题目时，请重点关注那些 **stability 值较低**、**lapses (错误次数) 较多**、或 **due (到期时间) 已到**的卡片，因为这些是学生的潜在弱点。利用这些数据来智能地选择题目，以最大化这份考试的复习效率。

${professorModeInstruction}

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

可用学习卡片 (${cards.length}张) - FSRS 数据:
${cards.slice(0, 150).map((card, index) => {
  const isDue = new Date(card.due) <= new Date();
  return `${index + 1}. 问题: ${card.question.substring(0, 100)}...
   答案: ${card.answer.substring(0, 100)}...
   FSRS 数据: stability=${card.stability.toFixed(2)}, lapses=${card.lapses}, due=${new Date(card.due).toLocaleDateString()}, is_due=${isDue ? 'YES' : 'NO'}`
}).join('\n')}
${cards.length > 150 ? `\n... 和其他 ${cards.length - 150} 张卡片` : ''}

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
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" },
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
作为智能教育分析师，对这份考试进行全面评分和深度诊断分析。

**评分与分析要求 (Scoring & Analysis Requirements):**
1.  **逐题评分 (Question-by-Question Scoring):** 根据提供的正确答案和评分规则，为每道题打分。对于主观题（如简答、论述），请根据答案质量给出合理的部分分。
2.  **计算总分 (Calculate Total Score):** 汇总所有题目的得分，计算总分和百分比。
3.  **深度诊断 (In-depth Diagnosis):** 这是最重要的部分。请仔细分析学生的**所有错题**，并总结出其核心优势、弱点和根本的错误模式。
    -   **优势分析 (Strengths):** 学生在哪些知识点或题型上表现出色？
    -   **弱点与错误模式分析 (Weaknesses & Error Patterns):**
        -   学生是否混淆了某些关键概念？
        -   在特定类型的认知任务上是否存在困难（例如，在所有需要'分析'或'应用'的问题上都表现不佳）？
        -   是否存在系统性的知识空白？
        -   请提供具体、可操作的诊断，而不仅仅是罗列错误的题目。例如，说"该学生似乎未完全理解React的useEffect依赖数组如何工作，导致在相关题目中出错"，而不是"学生答错了第5题"。
4.  **提供反馈 (Provide Feedback):** 给出总体反馈和针对具体问题的改进建议。

**JSON 输出格式:**
请严格遵循 ExamResult 的 JSON 结构输出结果。请确保 'analysis.strengths' 和 'analysis.weaknesses' 字段填充上有洞察力的分析文本数组。

---

**考试信息:**
- 标题: ${exam.config.title}
- 总分: ${exam.config.total_points}

**题目与正确答案:**
${exam.questions.map(q => `
- 问题ID: ${q.id}
  - 问题: ${q.question}
  - 正确答案: ${Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
  - 分数: ${q.points}
  - 题目类型: ${q.type}
  - 知识点: ${q.topic}
`).join('')}

**学生答案:**
${responses.map(r => `
- 问题ID: ${r.question_id}
  - 学生答案: ${Array.isArray(r.student_answer) ? r.student_answer.join(', ') : r.student_answer}
  - 答题用时: ${r.response_time.toFixed(1)}s
`).join('')}
`

    // AI anaylsis and scoring
    const response = await this.callOpenAI(prompt, {
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    })

    try {
      // Use robust JSON parsing
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }
      const parsed = JSON.parse(jsonMatch[0]);

      if (
        !parsed.analysis ||
        typeof parsed.analysis.strengths !== 'string' ||
        typeof parsed.analysis.weaknesses !== 'string' ||
        !Array.isArray(parsed.scored_questions)
      ) {
        throw new Error(
          "AI response is missing required fields for exam scoring (analysis, scored_questions)."
        )
      }
      return parsed as ExamResult
    } catch (error: any) {
      console.error('Failed to parse scored exam from AI:', error, 'Raw response:', response);
      throw new Error(`AI failed to return a valid scored exam. ${error.message}`);
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

  /**
   * Extracts key topics from a document file.
   * Supports .pdf, .docx, and .txt files.
   */
  async extractTopicsFromDocument(file: File): Promise<string[]> {
    let textContent = '';
    
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContentStream = await page.getTextContent();
            const pageText = textContentStream.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }
        textContent = fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        textContent = result.value;
      } else if (file.type === 'text/plain') {
        textContent = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      if (!textContent.trim()) {
        console.warn('Document is empty or contains no readable text.');
        return [];
      }
    } catch (error) {
      console.error('Error parsing document file:', error);
      throw new Error('Failed to parse the document. It might be corrupted or in an unsupported format.');
    }

    const prompt = `
      Analyze the following course material content and identify the top 10-15 most important core topics, concepts, or keywords. 
      These topics should represent the key learning objectives and potential exam focus areas.
      Return the result as a JSON array of strings.

      Example output: ["React Hooks", "State Management", "Component Lifecycle", "Virtual DOM"]

      Document Content:
      ---
      ${textContent.substring(0, 8000)}
      ---
    `;

    try {
      const response = await this.callOpenAI(prompt, {
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });
      
      // The response can be a JSON object `{"topics": [...]}` or a raw JSON array `[...]`.
      // It might also be wrapped in markdown.
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("AI response did not contain a valid JSON object or array:", response);
        throw new Error("AI response did not contain a valid JSON object or array.");
      }
      
      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      let topics: string[] = [];

      if (Array.isArray(parsed)) {
        // Handle case where the AI returns a raw array
        topics = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Handle case where the AI returns an object like {"topics": [...] }
        topics = parsed.topics || parsed.result || parsed.keywords || [];
      }

      if (Array.isArray(topics) && topics.every(t => typeof t === 'string')) {
        return topics;
      } else {
        console.error("AI response did not match expected format:", parsed);
        throw new Error("AI failed to extract topics in the correct format.");
      }
    } catch (error) {
      console.error('Failed to extract topics with AI:', error);
      throw new Error('AI analysis of the document failed.');
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
        temperature: options.temperature || 0.6,
        max_tokens: options.max_tokens || 800
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error.message)
    }
    return data.choices[0].message.content
  }

  private parseGeneratedExam(response: string, config: ExamConfiguration): GeneratedExam {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }
      let parsed = JSON.parse(jsonMatch[0]);

      // Handle cases where the response is wrapped in an "exam" object
      if (parsed.exam) {
        parsed = parsed.exam;
      }

      let allQuestions: ExamQuestion[] = [];

      if (Array.isArray(parsed.questions)) {
        allQuestions = parsed.questions;
      } else if (typeof parsed.questions === 'object' && parsed.questions !== null) {
        allQuestions = Object.values(parsed.questions).flat() as ExamQuestion[];
      }

      if (allQuestions.length === 0) {
        console.error('Could not extract any questions from the AI response:', parsed);
        throw new Error("AI response did not contain any valid questions.");
      }

      const generatedExam: GeneratedExam = {
        id: parsed.id || `exam_${Date.now()}`,
        config: config,
        questions: allQuestions,
        metadata: parsed.metadata || {},
        instructions: parsed.instructions || "Please review the questions carefully and answer to the best of your ability.",
        answer_key: parsed.answer_key || [],
      };

      return generatedExam;
    } catch (error: any) {
      console.error('Failed to parse generated exam from AI:', error, 'Raw response:', response);
      throw new Error(`AI failed to return a valid exam structure. ${error.message}`);
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
    console.warn("AI exam generation failed. Using fallback exam.");
    
    // Create a basic exam structure from cards as a fallback
    const fallbackQuestions: ExamQuestion[] = cards.slice(0, 10).map((card, index) => ({
      id: `fallback_q_${index + 1}`,
      type: 'short_answer',
      question: card.question,
      correct_answer: card.answer,
      points: 10,
      difficulty: card.difficulty || 5,
      estimated_time: 60,
      cognitive_level: 'remember',
      subject_area: config.subject,
      topic: config.topics[0] || 'General',
      explanation: card.answer,
    }));

    return {
      id: `fallback_exam_${Date.now()}`,
      config: config,
      questions: fallbackQuestions, // Ensure questions is always an array
      metadata: {
        generated_at: new Date(),
        total_questions: fallbackQuestions.length,
        estimated_completion_time: fallbackQuestions.length * 60,
        difficulty_average: fallbackQuestions.reduce((acc, q) => acc + q.difficulty, 0) / (fallbackQuestions.length || 1),
        cognitive_level_distribution: { remember: fallbackQuestions.length },
        ai_confidence: 0.1
      },
      instructions: "This is a fallback exam due to a generation error. It contains up to 10 questions based on your flashcards.",
      answer_key: fallbackQuestions.map(q => ({
        question_id: q.id,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
        points: q.points
      }))
    };
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