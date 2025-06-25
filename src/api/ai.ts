import { AIAssistantConfig, AIConversation, AIMessage, ApiResponse, ReviewCard, WeeklyReport } from '@/types'

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
          assistant_type: assistantType,
          messages: []
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

      const { data: savedUserMessage, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert([userMessage])
        .select()
        .single()

      if (userMsgError) throw userMsgError

      // 调用 AI API 获取回复
      const aiResponse = await this.callAIAPI(conversation, message, config)

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

  // 调用 AI API（这里需要集成 OpenAI）
  async callAIAPI(
    conversation: AIConversation,
    userMessage: string,
    config?: AIAssistantConfig
  ): Promise<string> {
    // TODO: 实现 OpenAI API 调用
    // 这里返回模拟回复
    const responses = {
      writing: [
        "我来帮你分析这个写作任务。首先，让我们明确论文的主题和结构。你能告诉我更多关于这个主题的信息吗？",
        "对于这个写作任务，我建议采用以下结构：1. 引言 2. 主体段落 3. 结论。你想从哪个部分开始？",
        "这是一个很好的写作主题。我注意到你需要遵循学术写作规范，让我为你提供一些具体的建议。"
      ],
      stem: [
        "让我帮你分析这个数学问题。首先，我们需要理解问题的核心概念。你能告诉我你目前的理解吗？",
        "对于这类问题，我建议采用分步骤的方法。让我们先确定已知条件和目标。",
        "这是一个典型的STEM问题。让我为你提供解题思路，而不是直接给出答案。"
      ],
      reading: [
        "我来帮你分析这个阅读材料。首先，让我们识别文章的主要论点和支持证据。",
        "对于这个阅读任务，我建议采用SQ3R方法：Survey, Question, Read, Recite, Review。",
        "这是一个很好的阅读材料。让我为你总结关键概念和重要信息。"
      ],
      programming: [
        "我来帮你分析这个编程问题。首先，让我们理解问题的需求和约束条件。",
        "对于这个编程任务，我建议采用模块化的方法。让我们先设计算法结构。",
        "这是一个典型的编程问题。让我为你提供解题思路和代码结构建议。"
      ]
    }

    const typeResponses = responses[conversation.assistant_type] || responses.writing
    const randomIndex = Math.floor(Math.random() * typeResponses.length)
    
    return typeResponses[randomIndex]
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
      const cards = await this.generateCardsWithAI(courseContent)

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

  // 使用 AI 生成复习卡片
  async generateCardsWithAI(courseContent: any): Promise<Omit<ReviewCard, 'id' | 'course_id' | 'created_at'>[]> {
    // TODO: 实现 OpenAI API 调用
    // 这里返回模拟数据
    return [
      {
        question: '什么是课程的核心概念？',
        answer: '根据课程材料，核心概念包括...',
        category: '基础概念',
        difficulty: 'easy',
        mastery_level: 0
      },
      {
        question: '如何应用课程中的主要理论？',
        answer: '主要理论的应用方法包括...',
        category: '应用理论',
        difficulty: 'medium',
        mastery_level: 0
      },
      {
        question: '课程中最重要的公式是什么？',
        answer: '最重要的公式是...',
        category: '公式记忆',
        difficulty: 'hard',
        mastery_level: 0
      }
    ]
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
      const recommendations = await this.generateAIRecommendations(stats, tasks || [])

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

  // 生成 AI 建议
  async generateAIRecommendations(stats: any, tasks: any[]): Promise<string[]> {
    // TODO: 实现 OpenAI API 调用
    // 这里返回模拟建议
    const recommendations = []

    if (stats.completion_rate < 70) {
      recommendations.push('建议提高任务完成率，可以尝试番茄工作法来提高专注度')
    }

    if (stats.procrastination_index > 5) {
      recommendations.push('拖延指数较高，建议制定更详细的时间计划，避免任务堆积')
    }

    if (stats.focus_score < 80) {
      recommendations.push('专注度有待提升，建议减少干扰，创造更好的学习环境')
    }

    const overdueTasks = tasks.filter(task => task.status === 'overdue')
    if (overdueTasks.length > 0) {
      recommendations.push(`有 ${overdueTasks.length} 个任务已逾期，建议优先处理这些任务`)
    }

    return recommendations.length > 0 ? recommendations : ['本周表现良好，继续保持！']
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

// 导入 supabase 客户端
import { supabase } from './supabase'
