import { getModeConfig } from '@/config/aiModeConfigs';
import { AIAssistantConfig, AIConversation, AIMessage, AIModeId, ApiResponse, ReviewCard, WeeklyReport } from '@/types';
import { checkFileSizeLimit } from '@/utils';
import { getAIModel } from '../config/aiModel';
import { supabase } from './supabase';


// Legacy AI prompts mapping (for backward compatibility)
const LEGACY_AI_PROMPTS = {
  writing: {
    bullet_tutor: 'study_buddy',
    socratic_bot: 'academic_coach', 
    quick_fix: 'quick_clarifier',
    diagram_ai: 'writing_mentor'
  },
  stem: {
    bullet_tutor: 'study_buddy',
    socratic_bot: 'academic_coach',
    quick_fix: 'quick_clarifier', 
    diagram_ai: 'stem_specialist'
  },
  reading: {
    bullet_tutor: 'study_buddy',
    socratic_bot: 'academic_coach',
    quick_fix: 'quick_clarifier',
    diagram_ai: 'humanities_scholar'
  },
  programming: {
    bullet_tutor: 'study_buddy', 
    socratic_bot: 'academic_coach',
    quick_fix: 'quick_clarifier',
    diagram_ai: 'stem_specialist'
  }
}

// OpenAI API 配置
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = getAIModel();

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
      const model = config?.model || getAIModel()
      
      // 🚀 激进性能优化 - 大幅减少Token和时间
      const maxTokens = model === 'gpt-4o' ? 500 : 400  // 进一步减少Token数量，提升速度
      const temperature = model === 'gpt-4o' ? 0.5 : 0.6  // 提高温度，减少推理时间

      console.log('🔥 开始调用OpenAI API:', model, `(max_tokens: ${maxTokens})`)
      console.log('📝 Sending message length:', JSON.stringify(messages).length, 'characters')

      // Create AbortController for timeout control
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏰ OpenAI API request timed out, aborting request')
        controller.abort()
      }, 15000) // 🚀 Reduced to 15-second timeout for aggressive optimization

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
          top_p: config?.top_p || 0.8,  // Further reduced for faster generation
          frequency_penalty: config?.frequency_penalty || 0.1,  // Slight penalty for speed
          presence_penalty: config?.presence_penalty || 0.1,    // Slight penalty for speed
          stream: false  // Ensure streaming is not used
        }),
        signal: controller.signal // Add signal for request cancellation
      })

      const duration = Date.now() - startTime
      clearTimeout(timeoutId) // Clear the timeout timer
      console.log(`📡 OpenAI API response (${duration}ms):`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ OpenAI API response error:', errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: { message: errorText } }
        }
        
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ OpenAI API call successful (Total time: ${Date.now() - startTime}ms)`)
      console.log('🔢 Token usage:', data.usage)
      
      const content = data.choices[0]?.message?.content || 'Sorry, I was unable to generate a response.'
      return content
    } catch (error: any) {
      console.error('💥 OpenAI API call failed:', error)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out: The AI service took too long to respond. Please try again later.')
      } else if (error.message.includes('fetch')) {
        throw new Error('Network connection error: Could not connect to the AI service. Please check your network connection.')
      } else {
        throw new Error(`AI service is temporarily unavailable: ${error.message}`)
      }
    }
  }

  // 生成对话回复 - Updated for new English prompt system
  async generateConversationResponse(
    conversation: AIConversation,
    userMessage: string,
    config?: AIAssistantConfig
  ): Promise<string> {
    const modeId = config?.mode || 'study_buddy' as AIModeId
    
    // Get the AI mode configuration
    const modeConfig = getModeConfig(modeId)
    
    if (!modeConfig) {
      // Fallback to legacy mapping for backward compatibility
      const assistantType = conversation.assistant_type
      const legacyMode = config?.mode
      
      // Only use legacy mapping for old mode types
      const legacyModeMapping = {
        'bullet_tutor': 'bullet_tutor',
        'socratic_bot': 'socratic_bot', 
        'quick_fix': 'quick_fix',
        'diagram_ai': 'diagram_ai'
      } as const
      
      const mappedLegacyMode = legacyMode && legacyMode in legacyModeMapping 
        ? legacyModeMapping[legacyMode as keyof typeof legacyModeMapping]
        : 'bullet_tutor'
      
      const fallbackModeId = LEGACY_AI_PROMPTS[assistantType]?.[mappedLegacyMode] || 'study_buddy'
      const fallbackConfig = getModeConfig(fallbackModeId)
      
      if (!fallbackConfig) {
        throw new Error(`Unsupported AI mode: ${modeId}`)
      }
      
      console.log(`🔄 Using fallback mode: ${fallbackModeId} for legacy mode: ${mappedLegacyMode}`)
      return this.generateResponseWithConfig(fallbackConfig, conversation, userMessage, config)
    }

    return this.generateResponseWithConfig(modeConfig, conversation, userMessage, config)
  }

  // Helper method to generate response with mode configuration
  private async generateResponseWithConfig(
    modeConfig: any,
    conversation: AIConversation,
    userMessage: string,
    config?: AIAssistantConfig
  ): Promise<string> {
    // Build the system prompt using the English template
    const taskTitle = conversation.task_id ? 'Related Assignment' : 'Learning Support'
    const systemPrompt = modeConfig.promptTemplate
      .replace('{task_title}', taskTitle)
      .replace('{user_message}', userMessage)

    // Add academic version context
    const academicContext = config?.academicVersion === 'high_school' 
      ? '\n\nNote: This is for a high school student. Keep explanations age-appropriate and supportive.'
      : '\n\nNote: This is for a college student. Encourage critical thinking and independent analysis.'

    const finalSystemPrompt = systemPrompt + academicContext

    // Build message history
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      { role: 'user', content: userMessage }
    ]

    // Use the mode's specific token limit
    const modelConfig = {
      ...config,
      max_tokens: modeConfig.maxTokens || 400,
      model: config?.model || getAIModel()
    }

    return await this.callOpenAI(messages, modelConfig)
  }

  // 生成复习卡片
  async generateReviewCards(courseContent: any): Promise<Omit<ReviewCard, 'id' | 'course_id' | 'created_at'>[]> {
    const systemPrompt = `You are an expert in generating course review cards. Please create high-quality review cards based on the provided course content.

Requirements:
1. Generate 5-8 review cards.
2. Each card must include a question and an answer.
3. Cover basic concepts, applied theories, and key formulas.
4. Difficulty distribution: 30% easy, 50% medium, 20% hard.
5. Questions should be specific and insightful.
6. Answers should be accurate and easy to understand.

Course Content: ${JSON.stringify(courseContent, null, 2)}

Please return the review cards as a JSON array with the following format:
[
  {
    "question": "Question content",
    "answer": "Answer content", 
    "category": "Category",
    "difficulty": "easy|medium|hard"
  }
]`

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt }
      ])

      // Try to parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0])
        return cards.map((card: any) => ({
          ...card,
          mastery_level: 0
        }))
      }

      // If JSON parsing fails, return default cards
      return this.getDefaultReviewCards()
    } catch (error) {
      console.error('Failed to generate review cards:', error)
      return this.getDefaultReviewCards()
    }
  }

  // 生成周报告建议
  async generateWeeklyRecommendations(stats: any, tasks: any[]): Promise<string[]> {
    const systemPrompt = `You are a professional learning coach. Please generate personalized recommendations for the student based on their learning data.

Learning Statistics:
- Task completion rate: ${stats.completion_rate}%
- Study hours: ${stats.study_hours} hours
- Procrastination index: ${stats.procrastination_index}/10
- Focus score: ${stats.focus_score}/100

Task Status:
${tasks.map(task => `- ${task.title}: ${task.status}`).join('\n')}

Please generate 3-5 specific, actionable recommendations to help the student improve their learning efficiency next week. The recommendations should be:
1. Targeted and based on specific data.
2. Actionable, with clear steps.
3. Positive and encouraging.
4. No more than 50 words each.

Please return only the list of recommendations, with each on a new line.`

    try {
      const response = await this.callOpenAI([
        { role: 'system', content: systemPrompt }
      ])

      return response.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
      return ["You performed well this week, keep it up!"]
    }
  }

  // 解析课程材料
  async parseCourseMaterials(materials: any[]): Promise<any> {
    // Concatenate all material texts
    const materialsText = materials.map(m => `${m.name}:\n${m.extracted_text || 'No text content'}`).join('\n\n');
    
    // Check if the file content exceeds GPT-4o's token limit
    const sizeCheck = checkFileSizeLimit(materialsText)
    if (sizeCheck.isOverLimit) {
      throw new Error(`File content is too large! Current character count: ${sizeCheck.characterCount.toLocaleString()}, exceeds GPT-4o limit: ${sizeCheck.limit.toLocaleString()}. Please upload a smaller file or split the content.`)
    }
    
    const systemPrompt = `You are an expert in parsing course materials. Please analyze the provided materials, extract key information, and generate structured data.\n\nRequirements:\n1. Identify the course name, semester, and year.\n2. Extract all tasks, assignments, and exam information.\n3. Identify the grading policy and course highlights.\n4. Generate a task timeline.\n5. Provide a course description.\n\nPlease return the parsed results in JSON format as follows:\n{\n  "course_name": "Course Name",\n  "semester": "Semester",\n  "year": 2024,\n  "course_description": "Course Description",\n  "grading_policy": "Grading Policy",\n  "tasks": [\n    {\n      "title": "Task Title",\n      "type": "reading|writing|assignment|exam|quiz|project|presentation",\n      "due_date": "YYYY-MM-DD",\n      "priority": "low|medium|high",\n      "estimated_hours": 10,\n      "description": "Task Description"\n    }\n  ]\n}`;
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
            { role: 'user', content: `Please parse the following course materials:\n\n${materialsText}` }
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      // Try to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        // Grading notice
        const gradingNotice = 'Only tasks related to grading weights were automatically generated. Please add other tasks manually below.';
        // Fill in estimated_hours for all tasks, default to 2 hours
        parsedData.tasks = parsedData.tasks.map((t: any) => ({
          ...t,
          estimated_hours: t.estimated_hours == null ? 2 : t.estimated_hours
        }));
        return { ...parsedData, gradingNotice };
      }
      // If AI parsing fails, throw an error instead of returning a default template
      throw new Error('AI parsing failed, unable to generate course structure. Please check the file content or try again later.');
    } catch (error) {
      console.error('AI parsing failed:', error);
      // If it's a file size limit error, rethrow it directly
      if (error instanceof Error && error.message.includes('File content is too large')) {
        throw error;
      }
      // Rethrow other errors as well, no longer returning a default template
      throw new Error('AI parsing failed, unable to generate course structure. Please check the file content or try again later.');
    }
  }

  // 默认复习卡片
  private getDefaultReviewCards(): Omit<ReviewCard, 'id' | 'course_id' | 'created_at'>[] {
    return [
      {
        question: 'What are the core concepts of the course?',
        answer: 'According to the course materials, core concepts include fundamental theories, important methods, and key applications.',
        category: 'Basic Concepts',
        difficulty: 'easy',
        mastery_level: 0
      },
      {
        question: 'How can the main theories of the course be applied?',
        answer: 'Applying the main theories requires understanding their basic principles and analyzing real-world cases for validation.',
        category: 'Applied Theory',
        difficulty: 'medium',
        mastery_level: 0
      },
      {
        question: 'What are the most important formulas or methods in the course?',
        answer: 'The most important formulas and methods are the core tools of the course; their derivation and application must be mastered.',
        category: 'Formula Memorization',
        difficulty: 'hard',
        mastery_level: 0
      }
    ]
  }

  // 默认课程解析
  private getDefaultCourseParse() {
    return {
      course_name: 'Sample Course',
      semester: 'Fall',
      year: 2024,
      course_description: 'Course Description',
      grading_policy: 'Based on assignments and exams',
      tasks: []
    }
  }
}

// 创建 AI 服务实例
const aiService = new AIService()

// 导出 AI 服务实例
export { aiService };

// AI 对话 API
export const aiConversationApi = {
  // 创建新的 AI 对话
  async createConversation(
    assistantType: AIConversation['assistant_type'],
    taskId?: string
  ): Promise<ApiResponse<AIConversation>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not logged in')

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
      if (!user) throw new Error('User not logged in')

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

  // 🚀 获取对话的最近消息（分页加载优化）
  async getRecentConversationMessages(
    conversationId: string, 
    limit: number = 20
  ): Promise<ApiResponse<AIMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false }) // Get the latest in descending order
        .limit(limit)

      if (error) throw error
      
      // Reverse the order to have the oldest message first
      const messages = (data || []).reverse()
      return { data: messages }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 🚀 获取对话的最近消息预览（超快速加载）
  async getRecentConversationMessagesPreviews(
    conversationId: string, 
    limit: number = 20
  ): Promise<ApiResponse<AIMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select(`
          id,
          conversation_id,
          role,
          timestamp,
          content
        `)
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      // Process messages: truncate long content for preview
      const processedMessages = (data || []).map(message => ({
        ...message,
        content: message.content.length > 150 
          ? message.content.substring(0, 150) + '...' 
          : message.content,
        isPreview: message.content.length > 150 // Mark if it's a preview
      })).reverse() // Reverse the order

      return { data: processedMessages as AIMessage[] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 🚀 获取消息的完整内容
  async getMessageFullContent(messageId: string): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('content')
        .eq('id', messageId)
        .single()

      if (error) throw error
      return { data: data.content }
    } catch (error: any) {
      return { data: '', error: error.message }
    }
  },

  // 🚀 获取对话的更多历史消息（向前分页）
  async getMoreConversationMessages(
    conversationId: string,
    beforeTimestamp: string,
    limit: number = 20
  ): Promise<ApiResponse<AIMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('timestamp', beforeTimestamp)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      // Reverse the order to have the oldest message first
      const messages = (data || []).reverse()
      return { data: messages }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 删除对话和相关消息 - 优化版本
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not logged in')

      // 🚀 Optimization: Use CASCADE delete and RLS policies to delete the conversation and all related messages in one operation.
      // The foreign key constraint will automatically delete related messages, and RLS will ensure permissions.
      const { error: conversationError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id) // RLS will ensure users can only delete their own conversations

      if (conversationError) throw conversationError

      return { data: { success: true } }
    } catch (error: any) {
      return { data: { success: false }, error: error.message }
    }
  },

  // 删除用户的所有对话 - 优化版本
  async deleteAllConversations(): Promise<ApiResponse<{ success: boolean, deletedCount: number }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not logged in')

      // 🚀 Optimization: First get the number of conversations to be deleted, then delete them all at once using CASCADE.
      const { data: conversations, error: countError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('user_id', user.id)

      if (countError) throw countError
      
      const deletedCount = conversations?.length || 0

      if (deletedCount === 0) {
        return { data: { success: true, deletedCount: 0 } }
      }

      // 🚀 Use CASCADE delete: delete all conversations, related messages will be deleted automatically.
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
      // Get course materials and task information
      const { data: materials } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', courseId)

      // Merge course content
      const courseContent = {
        materials: materials || [],
        tasks: tasks || []
      }

      // Call AI to generate review cards
      const cards = await aiService.generateReviewCards(courseContent)

      // Save to the database
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
      if (!user) throw new Error('User not logged in')

      // Get this week's task data
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          courses!inner(user_id)
        `)
        .eq('courses.user_id', user.id)
        .gte('due_date', weekStart)
        .lte('due_date', weekEnd)

      // Calculate statistics
      const stats = this.calculateWeeklyStats(tasks || [])

      // Generate AI recommendations
      const recommendations = await aiService.generateWeeklyRecommendations(stats, tasks || [])

      // Create the weekly report
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

  // Calculate weekly statistics
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

  // Calculate focus score
  calculateFocusScore(completedTasks: number, totalStudyHours: number, averageTaskHours: number): number {
    if (totalStudyHours === 0 || averageTaskHours === 0) return 0
    
    const efficiency = completedTasks / totalStudyHours
    const expectedEfficiency = 1 / averageTaskHours
    const score = (efficiency / expectedEfficiency) * 100
    
    return Math.min(Math.max(Math.round(score), 0), 100)
  },

  // Get user's weekly report history
  async getUserWeeklyReports(): Promise<ApiResponse<WeeklyReport[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not logged in')

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

// AI Course Parsing API
export const aiCourseParseApi = {
  // Parse course materials and generate tasks
  async parseCourseMaterials(materials: any[]): Promise<ApiResponse<any>> {
    const courseContent = materials
    try {
      const result = await aiService.parseCourseMaterials(courseContent)
      return { data: result }
    } catch (error: any) {
      return { data: {}, error: error.message }
    }
  }
}

// 导入 supabase 客户端

