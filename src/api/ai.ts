import { AIAssistantConfig, AIConversation, AIMessage, ApiResponse, ReviewCard, WeeklyReport } from '@/types';
import { checkFileSizeLimit } from '@/utils';
import { supabase } from './supabase';

// AI 配置和提示词管理
const AI_PROMPTS = {
  writing: {
    bullet_tutor: `你是学术写作导师。帮助学生：1.思考文章结构 2.提供写作技巧 3.改进表达 4.鼓励独立创作。请引导式回应，控制在200字内。

任务：{task_title}
问题：{user_message}`,
    
    socratic_bot: `你是苏格拉底式导师。通过提问引导学生思考写作，不直接给答案。控制在150字内。

任务：{task_title}
问题：{user_message}`,
    
    quick_fix: `你是高效写作编辑。直接提供具体改进建议，简洁明了，控制在100字内。

任务：{task_title}
问题：{user_message}`,
    
    diagram_ai: `你是视觉化写作导师。帮助学生通过图表组织写作思路，控制在150字内。

任务：{task_title}
问题：{user_message}`
  },
  
  stem: {
    bullet_tutor: `你是STEM导师。帮助学生：1.理解概念 2.解决问题 3.掌握方法 4.建立信心。引导式教学，控制在200字内。

任务：{task_title}
问题：{user_message}`,
    
    socratic_bot: `你是苏格拉底式STEM导师。通过提问引导学生发现答案，培养逻辑思维。控制在150字内。

任务：{task_title}
问题：{user_message}`,
    
    quick_fix: `你是高效STEM助手。直接提供解题步骤和答案，简洁准确，控制在100字内。

任务：{task_title}
问题：{user_message}`,
    
    diagram_ai: `你是视觉化STEM导师。用图表、公式帮助理解概念，控制在150字内。

任务：{task_title}
问题：{user_message}`
  },
  
  reading: {
    bullet_tutor: `你是阅读理解导师。帮助学生：1.理解内容 2.分析结构 3.提取要点 4.培养思辨。引导式教学，控制在200字内。

任务：{task_title}
问题：{user_message}`,
    
    socratic_bot: `你是苏格拉底式阅读导师。通过提问帮助学生深入理解文本。控制在150字内。

任务：{task_title}
问题：{user_message}`,
    
    quick_fix: `你是高效阅读助手。直接提供理解要点和答案，简洁明了，控制在100字内。

任务：{task_title}
问题：{user_message}`,
    
    diagram_ai: `你是视觉化阅读导师。用图表帮助理解文章结构和内容，控制在150字内。

任务：{task_title}
问题：{user_message}`
  },
  
  programming: {
    bullet_tutor: `你是编程导师。帮助学生：1.理解需求 2.编程思路 3.调试代码 4.独立编程。引导式教学，控制在200字内。

任务：{task_title}
问题：{user_message}`,
    
    socratic_bot: `你是苏格拉底式编程导师。通过提问引导学生思考算法和逻辑。控制在150字内。

任务：{task_title}
问题：{user_message}`,
    
    quick_fix: `你是高效编程助手。直接提供代码解决方案和最佳实践，控制在100字内。

任务：{task_title}
问题：{user_message}`,
    
    diagram_ai: `你是视觉化编程导师。用流程图帮助理解程序逻辑，控制在150字内。

任务：{task_title}
问题：{user_message}`
  }
}

// OpenAI API 配置
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo'; // 默认使用GPT-3.5-turbo

// AI 服务类
class AIService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  // 调用 OpenAI API
  async callOpenAI(messages: any[], config?: Partial<any>): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      // 确定使用的模型
      const model = config?.model || 'gpt-3.5-turbo' // 默认使用GPT-3.5-turbo
      
      // 优化Token配置 - 减少输出长度提升速度
      const maxTokens = model === 'gpt-4o' ? 800 : 600  // 大幅减少Token数量
      const temperature = model === 'gpt-4o' ? 0.3 : 0.4  // 略微提高温度，减少推理时间

      console.log('🔥 开始调用OpenAI API:', model, `(max_tokens: ${maxTokens})`)
      console.log('📝 发送消息长度:', JSON.stringify(messages).length, '字符')

      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏰ OpenAI API请求超时，取消请求')
        controller.abort()
      }, 20000) // 减少到20秒超时

      const startTime = Date.now()

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages,
          max_tokens: config?.max_tokens || maxTokens,
          temperature: config?.temperature || temperature,
          top_p: config?.top_p || 0.9,  // 略微降低，提升生成速度
          frequency_penalty: config?.frequency_penalty || 0,
          presence_penalty: config?.presence_penalty || 0,
          stream: false  // 确保不使用流式响应
        }),
        signal: controller.signal // 添加信号用于取消请求
      })

      const duration = Date.now() - startTime
      clearTimeout(timeoutId) // 清除超时计时器
      console.log(`📡 OpenAI API响应 (${duration}ms):`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ OpenAI API响应错误:', errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: { message: errorText } }
        }
        
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ OpenAI API调用成功 (总耗时: ${Date.now() - startTime}ms)`)
      console.log('🔢 Token使用情况:', data.usage)
      
      const content = data.choices[0]?.message?.content || '抱歉，我无法生成回复。'
      return content
    } catch (error: any) {
      console.error('💥 OpenAI API调用失败:', error)
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时：AI服务响应时间过长，请稍后重试')
      } else if (error.message.includes('fetch')) {
        throw new Error('网络连接错误：无法连接到AI服务，请检查网络连接')
      } else {
        throw new Error(`AI 服务暂时不可用: ${error.message}`)
      }
    }
  }

  // 生成对话回复
  async generateConversationResponse(
    conversation: AIConversation,
    userMessage: string,
    config?: AIAssistantConfig
  ): Promise<string> {
    const assistantType = conversation.assistant_type
    const mode = config?.mode || 'bullet_tutor'
    
    // 获取对应的提示词模板
    const promptTemplate = AI_PROMPTS[assistantType]?.[mode] || AI_PROMPTS[assistantType]?.bullet_tutor
    
    if (!promptTemplate) {
      throw new Error(`不支持的助手类型: ${assistantType}`)
    }

    // 构建系统提示词
    const systemPrompt = promptTemplate
      .replace('{task_title}', conversation.task_id ? '相关任务' : '学习辅导')
      .replace('{user_message}', userMessage)

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]

    return await this.callOpenAI(messages)
  }

  // 生成复习卡片
  async generateReviewCards(courseContent: any): Promise<Omit<ReviewCard, 'id' | 'course_id' | 'created_at'>[]> {
    const systemPrompt = `你是一位专业的课程复习卡片生成专家。请根据提供的课程内容生成高质量的复习卡片。

要求：
1. 生成 5-8 张复习卡片
2. 每张卡片包含问题和答案
3. 涵盖基础概念、应用理论和重点公式
4. 难度分布：简单 30%，中等 50%，困难 20%
5. 问题要具体且有启发性
6. 答案要准确且易于理解

课程内容：${JSON.stringify(courseContent, null, 2)}

请以 JSON 格式返回复习卡片数组，格式如下：
[
  {
    "question": "问题内容",
    "answer": "答案内容", 
    "category": "分类",
    "difficulty": "easy|medium|hard"
  }
]`

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt }
      ])

      // 尝试解析 JSON 响应
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0])
        return cards.map((card: any) => ({
          ...card,
          mastery_level: 0
        }))
      }

      // 如果无法解析 JSON，返回默认卡片
      return this.getDefaultReviewCards()
    } catch (error) {
      console.error('Failed to generate review cards:', error)
      return this.getDefaultReviewCards()
    }
  }

  // 生成周报告建议
  async generateWeeklyRecommendations(stats: any, tasks: any[]): Promise<string[]> {
    const systemPrompt = `你是一位专业的学习教练。请根据学生的学习数据生成个性化的建议。

学习统计：
- 任务完成率: ${stats.completion_rate}%
- 学习时间: ${stats.study_hours} 小时
- 拖延指数: ${stats.procrastination_index}/10
- 专注度评分: ${stats.focus_score}/100

任务情况：
${tasks.map(task => `- ${task.title}: ${task.status}`).join('\n')}

请生成 3-5 条具体、可操作的建议，帮助学生在下周提高学习效率。建议要：
1. 针对性强，基于具体数据
2. 可操作，有明确的行动步骤
3. 积极正面，鼓励学生
4. 不超过 50 字

请直接返回建议列表，每条建议一行。`

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt }
      ])

      return response.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return ['本周表现良好，继续保持！']
    }
  }

  // 解析课程材料
  async parseCourseMaterials(materials: any[]): Promise<any> {
    // 拼接所有材料文本
    const materialsText = materials.map(m => `${m.name}:\n${m.extracted_text || '无文本内容'}`).join('\n\n');
    
    // 检查文件内容是否超过GPT-4o的token限制
    const sizeCheck = checkFileSizeLimit(materialsText)
    if (sizeCheck.isOverLimit) {
      throw new Error(`文件内容过大！当前字符数：${sizeCheck.characterCount.toLocaleString()}，超过GPT-4o限制：${sizeCheck.limit.toLocaleString()}。请上传较小的文件或分割文件内容。`)
    }
    
    const systemPrompt = `你是一位专业的课程材料解析专家。请分析提供的课程材料，提取关键信息并生成结构化数据。\n\n要求：\n1. 识别课程名称、学期、年份\n2. 提取所有任务、作业、考试信息\n3. 识别评分政策和课程重点\n4. 生成任务时间线\n5. 提供课程描述\n\n请以 JSON 格式返回解析结果，格式如下：\n{\n  "course_name": "课程名称",\n  "semester": "学期",\n  "year": 年份,\n  "course_description": "课程描述",\n  "grading_policy": "评分政策",\n  "tasks": [\n    {\n      "title": "任务标题",\n      "type": "reading|writing|assignment|exam|quiz|project|presentation",\n      "due_date": "YYYY-MM-DD",\n      "priority": "low|medium|high",\n      "estimated_hours": 数字,\n      "description": "任务描述"\n    }\n  ]\n}`;
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      };
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请解析以下课程材料：\n\n${materialsText}` }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        // grading提示
        const gradingNotice = '只自动生成了与评分权重有关的任务，其他任务请在下方手动补充。';
        // 补全所有任务的estimated_hours字段，默认2小时
        parsedData.tasks = parsedData.tasks.map((t: any) => ({
          ...t,
          estimated_hours: t.estimated_hours == null ? 2 : t.estimated_hours
        }));
        return { ...parsedData, gradingNotice };
      }
      // 如果AI解析失败，抛出错误而不是返回默认模板
      throw new Error('AI解析失败，无法生成课程结构。请检查文件内容或稍后重试。');
    } catch (error) {
      console.error('AI解析失败:', error);
      // 如果是文件大小限制错误，直接抛出
      if (error instanceof Error && error.message.includes('文件内容过大')) {
        throw error;
      }
      // 其他错误也抛出，不再返回默认模板
      throw new Error('AI解析失败，无法生成课程结构。请检查文件内容或稍后重试。');
    }
  }

  // 默认复习卡片
  private getDefaultReviewCards(): Omit<ReviewCard, 'id' | 'course_id' | 'created_at'>[] {
    return [
      {
        question: '什么是课程的核心概念？',
        answer: '根据课程材料，核心概念包括基础理论、重要方法和关键应用。',
        category: '基础概念',
        difficulty: 'easy',
        mastery_level: 0
      },
      {
        question: '如何应用课程中的主要理论？',
        answer: '主要理论的应用需要理解其基本原理，结合实际案例进行分析和验证。',
        category: '应用理论',
        difficulty: 'medium',
        mastery_level: 0
      },
      {
        question: '课程中最重要的公式或方法是什么？',
        answer: '最重要的公式和方法是课程的核心工具，需要熟练掌握其推导和应用。',
        category: '公式记忆',
        difficulty: 'hard',
        mastery_level: 0
      }
    ]
  }

  // 默认课程解析
  private getDefaultCourseParse() {
    return {
      course_name: '示例课程',
      semester: 'Fall',
      year: 2024,
      course_description: '课程描述',
      grading_policy: '基于作业和考试',
      tasks: []
    }
  }
}

// 创建 AI 服务实例
const aiService = new AIService()

// AI 对话 API
export const aiConversationApi = {
  // 创建新的 AI 对话
  async createConversation(
    assistantType: AIConversation['assistant_type'],
    taskId?: string
  ): Promise<ApiResponse<AIConversation>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert([{
          user_id: user.id,
          task_id: taskId,
          assistant_type: assistantType
        }])
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as AIConversation, error: error.message }
    }
  },

  // 获取用户的对话历史
  async getUserConversations(): Promise<ApiResponse<AIConversation[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 发送消息到 AI
  async sendMessage(
    conversationId: string,
    message: string,
    config?: AIAssistantConfig
  ): Promise<ApiResponse<AIMessage>> {
    try {
      // 获取对话上下文
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      // 保存用户消息
      const userMessage: Omit<AIMessage, 'id'> = {
        conversation_id: conversationId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }

      const { error: userMsgError } = await supabase
        .from('ai_messages')
        .insert([userMessage])
        .select()
        .single()

      if (userMsgError) throw userMsgError

      // 调用 AI API 获取回复
      const aiResponse = await aiService.generateConversationResponse(conversation, message, config)

      // 保存 AI 回复
      const aiMessage: Omit<AIMessage, 'id'> = {
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }

      const { data: savedAIMessage, error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert([aiMessage])
        .select()
        .single()

      if (aiMsgError) throw aiMsgError

      // 更新对话时间戳
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return { data: savedAIMessage }
    } catch (error: any) {
      return { data: {} as AIMessage, error: error.message }
    }
  },

  // 获取对话的所有消息
  async getConversationMessages(conversationId: string): Promise<ApiResponse<AIMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 删除对话和相关消息
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      // 首先验证对话是否属于当前用户
      const { data: conversation, error: verifyError } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single()

      if (verifyError) throw verifyError
      if (conversation.user_id !== user.id) {
        throw new Error('无权限删除此对话')
      }

      // 删除对话相关的所有消息
      const { error: messagesError } = await supabase
        .from('ai_messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) throw messagesError

      // 删除对话记录
      const { error: conversationError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id) // 双重安全检查

      if (conversationError) throw conversationError

      return { data: { success: true } }
    } catch (error: any) {
      return { data: { success: false }, error: error.message }
    }
  },

  // 删除用户的所有对话
  async deleteAllConversations(): Promise<ApiResponse<{ success: boolean, deletedCount: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      // 获取用户的所有对话ID
      const { data: conversations, error: getError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('user_id', user.id)

      if (getError) throw getError
      
      const conversationIds = conversations?.map(conv => conv.id) || []
      const deletedCount = conversationIds.length

      if (deletedCount === 0) {
        return { data: { success: true, deletedCount: 0 } }
      }

      // 删除所有对话相关的消息
      const { error: messagesError } = await supabase
        .from('ai_messages')
        .delete()
        .in('conversation_id', conversationIds)

      if (messagesError) throw messagesError

      // 删除所有对话记录
      const { error: conversationsError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', user.id)

      if (conversationsError) throw conversationsError

      return { data: { success: true, deletedCount } }
    } catch (error: any) {
      return { data: { success: false, deletedCount: 0 }, error: error.message }
    }
  }
}

// 复习卡片 API
export const reviewCardsApi = {
  // 为课程生成复习卡片
  async generateReviewCards(courseId: string): Promise<ApiResponse<ReviewCard[]>> {
    try {
      // 获取课程材料和任务信息
      const { data: materials } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', courseId)

      // 合并课程内容
      const courseContent = {
        materials: materials || [],
        tasks: tasks || []
      }

      // 调用 AI 生成复习卡片
      const cards = await aiService.generateReviewCards(courseContent)

      // 保存到数据库
      const cardsWithCourseId = cards.map(card => ({
        ...card,
        course_id: courseId
      }))

      const { data, error } = await supabase
        .from('review_cards')
        .insert(cardsWithCourseId)
        .select()

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 获取课程的复习卡片
  async getCourseReviewCards(courseId: string): Promise<ApiResponse<ReviewCard[]>> {
    try {
      const { data, error } = await supabase
        .from('review_cards')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 更新卡片掌握程度
  async updateCardMastery(cardId: string, masteryLevel: number): Promise<ApiResponse<ReviewCard>> {
    try {
      const { data, error } = await supabase
        .from('review_cards')
        .update({
          mastery_level: masteryLevel,
          last_reviewed: new Date().toISOString()
        })
        .eq('id', cardId)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as ReviewCard, error: error.message }
    }
  }
}

// 周报告 API
export const weeklyReportApi = {
  // 生成周报告
  async generateWeeklyReport(weekStart: string, weekEnd: string): Promise<ApiResponse<WeeklyReport>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      // 获取本周的任务数据
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          courses!inner(user_id)
        `)
        .eq('courses.user_id', user.id)
        .gte('due_date', weekStart)
        .lte('due_date', weekEnd)

      // 计算统计数据
      const stats = this.calculateWeeklyStats(tasks || [])

      // 生成 AI 建议
      const recommendations = await aiService.generateWeeklyRecommendations(stats, tasks || [])

      // 创建周报告
      const reportData: Omit<WeeklyReport, 'id' | 'created_at'> = {
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        ...stats,
        recommendations
      }

      const { data, error } = await supabase
        .from('weekly_reports')
        .insert([reportData])
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as WeeklyReport, error: error.message }
    }
  },

  // 计算周统计数据
  calculateWeeklyStats(tasks: any[]): {
    tasks_completed: number
    total_tasks: number
    completion_rate: number
    study_hours: number
    procrastination_index: number
    focus_score: number
  } {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    const overdueTasks = tasks.filter(task => task.status === 'overdue').length
    const totalStudyHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0)
    const averageTaskHours = totalTasks > 0 ? totalStudyHours / totalTasks : 0

    return {
      tasks_completed: completedTasks,
      total_tasks: totalTasks,
      completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      study_hours: totalStudyHours,
      procrastination_index: totalTasks > 0 ? Math.min(Math.round((overdueTasks / totalTasks) * 10), 10) : 0,
      focus_score: this.calculateFocusScore(completedTasks, totalStudyHours, averageTaskHours)
    }
  },

  // 计算专注度评分
  calculateFocusScore(completedTasks: number, totalStudyHours: number, averageTaskHours: number): number {
    if (totalStudyHours === 0 || averageTaskHours === 0) return 0
    
    const efficiency = completedTasks / totalStudyHours
    const expectedEfficiency = 1 / averageTaskHours
    const score = (efficiency / expectedEfficiency) * 100
    
    return Math.min(Math.max(Math.round(score), 0), 100)
  },

  // 获取用户的周报告历史
  async getUserWeeklyReports(): Promise<ApiResponse<WeeklyReport[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  }
}

// 课程解析 API
export const courseParseApi = {
  // 解析课程材料
  async parseCourseMaterials(materials: any[]): Promise<ApiResponse<any>> {
    try {
      const result = await aiService.parseCourseMaterials(materials)
      return { data: result }
    } catch (error: any) {
      return { data: {}, error: error.message }
    }
  }
}

// 导入 supabase 客户端

