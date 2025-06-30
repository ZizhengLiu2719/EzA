import { aiConversationApi } from '@/api/ai'
import { supabase } from '@/api/supabase'
import { AIAssistantConfig, AIConversation, AIMessage } from '@/types'
import { AI_MODES, getAIConfigDescription, validateAIConfig } from '@/utils/ai'
import { useCallback, useEffect, useState } from 'react'

export const useAI = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiConfig, setAIConfig] = useState<AIAssistantConfig>({
    mode: 'bullet_tutor',
    model: 'gpt-3.5-turbo' // 默认使用GPT-3.5-turbo
  })

  // 获取用户的所有对话
  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await aiConversationApi.getUserConversations()
      if (response.error) {
        setError(response.error)
      } else {
        setConversations(response.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 创建新对话
  const createConversation = useCallback(async (
    assistantType: AIConversation['assistant_type'],
    taskId?: string
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await aiConversationApi.createConversation(assistantType, taskId)
      if (response.error) {
        setError(response.error)
        return null
      } else {
        const newConversation = response.data
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversation(newConversation)
        setMessages([])
        return newConversation
      }
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 选择对话
  const selectConversation = useCallback(async (conversationId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        setError('Conversation does not exist')
        return
      }

      setCurrentConversation(conversation)
      
      // 获取对话消息
      const response = await aiConversationApi.getConversationMessages(conversationId)
      if (response.error) {
        setError(response.error)
      } else {
        setMessages(response.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [conversations])

  // 删除对话
  const deleteConversation = useCallback(async (conversationId: string) => {
    setError(null)
    
    try {
      // 调用API删除对话
      const response = await aiConversationApi.deleteConversation(conversationId)
      
      if (response.error) {
        setError(response.error)
        return { success: false, error: response.error }
      }

      // 从本地状态中移除对话
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      // 如果删除的是当前对话，清空当前对话
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
      
      return { success: true }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [currentConversation])

  // 删除所有对话
  const deleteAllConversations = useCallback(async () => {
    setError(null)
    
    try {
      // 调用API删除所有对话
      const response = await aiConversationApi.deleteAllConversations()
      
      if (response.error) {
        setError(response.error)
        return { success: false, error: response.error }
      }

      // 清空本地状态
      setConversations([])
      setCurrentConversation(null)
      setMessages([])
      
      return { success: true, deletedCount: response.data.deletedCount }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // 发送消息
  const sendMessage = useCallback(async (message: string) => {
    if (!currentConversation) {
      setError('Please select or create a conversation first')
      return
    }

    setLoading(true)
    setError(null)
    
    console.log('🚀 开始发送消息:', message)
    console.log('📝 当前对话:', currentConversation)
    
    // 延长超时时间到60秒
    const timeoutId = setTimeout(() => {
      console.warn('⏰ AI请求超时（60秒），自动重置loading状态')
      setLoading(false)
      setError('AI request timed out after 60 seconds. This might be due to OpenAI API issues. Please check your internet connection and try again.')
    }, 60000)
    
    try {
      // 添加请求开始时间记录
      const startTime = Date.now()
      console.log('⏱️ API请求开始时间:', new Date().toLocaleTimeString())
      
      const response = await aiConversationApi.sendMessage(
        currentConversation.id,
        message,
        {
          ...aiConfig,
          model: aiConfig.model || 'gpt-3.5-turbo' // 确保有默认模型
        }
      )
      
      const duration = Date.now() - startTime
      console.log('⏱️ API请求完成，耗时:', duration + 'ms')
      console.log('📨 API响应:', response)
      
      if (response.error) {
        console.error('❌ API错误:', response.error)
        // 检查是否是特定的错误类型
        if (response.error.includes('timeout') || response.error.includes('network')) {
          setError('Network connection issue. Please check your internet and try again.')
        } else if (response.error.includes('API key') || response.error.includes('authentication')) {
          setError('API authentication issue. Please check your OpenAI API key configuration.')
        } else if (response.error.includes('rate limit') || response.error.includes('quota')) {
          setError('OpenAI API rate limit exceeded. Please wait a moment and try again.')
        } else {
          setError(`AI Error: ${response.error}`)
        }
      } else {
        console.log('✅ 消息发送成功:', response.data)
        const newMessage = response.data
        setMessages(prev => [...prev, newMessage])
        
        // 更新对话列表中的最后更新时间
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, updated_at: newMessage.timestamp }
            : conv
        ))
      }
    } catch (err: any) {
      console.error('💥 发送消息异常:', err)
      
      // 更详细的错误处理
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to AI service. Please check your internet connection.')
      } else if (err.message.includes('timeout')) {
        setError('Request timeout: AI service took too long to respond. Please try again.')
      } else if (err.message.includes('CORS')) {
        setError('CORS error: Please check your API configuration.')
      } else {
        setError(`Unexpected error: ${err.message}`)
      }
    } finally {
      clearTimeout(timeoutId) // 清除超时
      console.log('🏁 清除loading状态')
      setLoading(false)
    }
  }, [currentConversation, aiConfig])

  // 🚀 优化版本：普通发送消息（并行处理）
  const sendMessageFast = useCallback(async (message: string, userMessage: AIMessage) => {
    if (!currentConversation) {
      setError('Please select or create a conversation first')
      return
    }

    setLoading(true)
    setError(null)
    
    console.log('🚀 开始普通AI调用:', message)
    
    // 超时控制
    const timeoutId = setTimeout(() => {
      console.warn('⏰ 普通AI请求超时')
      setLoading(false)
      setError('AI request timed out. Please try again.')
    }, 45000) // 45秒超时
    
    try {
      let aiMessageId: string | null = null
      const startTime = Date.now()

      // 🔥 并行执行：AI调用 + 数据库操作
      const [aiResponse] = await Promise.allSettled([
        // AI调用 - 最高优先级，立即开始
        (async () => {
          console.log('🤖 开始AI调用')
          
          // 导入aiService
          const { aiService } = await import('@/api/ai')
          
          const aiResult = await aiService.generateConversationResponse(
            currentConversation,
            message,
            {
              ...aiConfig,
              model: aiConfig.model || 'gpt-3.5-turbo'
            }
          )
          
          console.log('✅ AI响应完成，耗时:', Date.now() - startTime + 'ms')
          return aiResult
        })(),

        // 数据库操作 - 后台并行执行
        (async () => {
          try {
            console.log('💾 后台开始数据库操作')

            // 并行执行数据库插入
            const [userResult, aiResult] = await Promise.allSettled([
              // 保存用户消息（已在UI显示，这里只是持久化）
              supabase
                .from('ai_messages')
                .insert({
                  conversation_id: currentConversation.id,
                  role: 'user',
                  content: message,
                  timestamp: userMessage.timestamp
                })
                .select()
                .single(),

              // 创建AI消息记录（稍后更新内容）
              supabase
                .from('ai_messages')
                .insert({
                  conversation_id: currentConversation.id,
                  role: 'assistant',
                  content: '', // 初始为空
                  timestamp: new Date().toISOString()
                })
                .select()
                .single()
            ])

            // 处理结果
            if (userResult.status === 'fulfilled' && !userResult.value.error) {
              console.log('✅ 用户消息已持久化')
            } else {
              console.warn('⚠️ 用户消息持久化失败:', userResult)
            }

            if (aiResult.status === 'fulfilled' && !aiResult.value.error) {
              aiMessageId = aiResult.value.data.id
              console.log('✅ AI消息记录已创建，ID:', aiMessageId)
            } else {
              console.warn('⚠️ AI消息记录创建失败:', aiResult)
            }

          } catch (dbErr) {
            console.warn('⚠️ 数据库操作失败，但不影响AI响应:', dbErr)
          }
        })()
      ])

      // 检查AI调用结果
      if (aiResponse.status === 'rejected') {
        throw new Error(`AI调用失败: ${aiResponse.reason}`)
      }

      const aiContent = aiResponse.value
      console.log('🎯 AI回复内容:', aiContent)

      // 创建AI消息对象
      const aiMessage: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }

      // 立即添加到UI
      setMessages(prev => [...prev, aiMessage])
      
      // 更新对话列表中的最后更新时间
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, updated_at: aiMessage.timestamp }
          : conv
      ))
      
      console.log('✅ AI消息已添加到UI')

      // 异步更新数据库（不阻塞UI）
      if (aiMessageId) {
        supabase
          .from('ai_messages')
          .update({ content: aiContent })
          .eq('id', aiMessageId)
          .then(({ error }: { error: any }) => {
            if (error) {
              console.warn('⚠️ AI消息更新失败:', error)
            } else {
              console.log('✅ AI消息已持久化')
            }
          })
      }

      // 异步更新对话时间戳
      supabase
        .from('ai_conversations')
        .update({ updated_at: aiMessage.timestamp })
        .eq('id', currentConversation.id)
        .then(() => console.log('✅ 对话时间戳已更新'))

    } catch (err: any) {
      console.error('💥 普通AI调用失败:', err)
      
      // 用户友好的错误处理
      if (err.message.includes('timeout')) {
        setError('AI response timeout. Please try again.')
      } else if (err.message.includes('API key')) {
        setError('API key issue. Please check configuration.')
      } else if (err.message.includes('rate limit')) {
        setError('Too many requests. Please wait and try again.')
      } else {
        setError(`AI Error: ${err.message}`)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      console.log('🏁 普通AI调用完成')
    }
  }, [currentConversation, aiConfig, setMessages, setConversations])

  // 更新 AI 配置
  const updateAIConfig = useCallback((config: Partial<AIAssistantConfig>) => {
    const newConfig = { ...aiConfig, ...config }
    
    if (validateAIConfig(newConfig)) {
      setAIConfig(newConfig)
    } else {
      setError('Invalid AI configuration')
    }
  }, [aiConfig])

  // 获取 AI 模式选项
  const getAIModeOptions = useCallback(() => {
    return Object.entries(AI_MODES).map(([key, value]) => ({
      value: key,
      label: value.name,
      description: value.description,
      icon: value.icon,
      color: value.color
    }))
  }, [])

  // 获取当前 AI 配置描述
  const getCurrentConfigDescription = useCallback(() => {
    return getAIConfigDescription(aiConfig)
  }, [aiConfig])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 强制重置loading状态
  const forceResetLoading = useCallback(() => {
    console.log('🔄 强制重置loading状态')
    setLoading(false)
    setError(null)
  }, [])

  // 添加消息到当前对话
  const addMessage = useCallback((message: AIMessage) => {
    console.log('➕ 添加消息到对话:', message)
    setMessages(prev => [...prev, message])
    
    // 更新对话列表中的最后更新时间
    if (currentConversation) {
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversation.id 
          ? { ...conv, updated_at: message.timestamp }
          : conv
      ))
    }
  }, [currentConversation])

  // 初始化加载
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    aiConfig,
    
    // 方法
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    deleteAllConversations,
    sendMessage,
    sendMessageFast,
    updateAIConfig,
    getAIModeOptions,
    getCurrentConfigDescription,
    clearError,
    forceResetLoading,
    addMessage
  }
}

// AI 统计 Hook
export const useAIStats = () => {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
    mostUsedMode: 'bullet_tutor',
    mostUsedType: 'writing'
  })
  const [loading, setLoading] = useState(false)

  // 获取 AI 使用统计
  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // 这里应该调用实际的 API
      // const response = await aiStatsApi.getUserStats()
      // setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch AI stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    fetchStats
  }
} 