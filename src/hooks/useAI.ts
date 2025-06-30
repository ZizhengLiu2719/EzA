import { aiConversationApi } from '@/api/ai'
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
    updateAIConfig,
    getAIModeOptions,
    getCurrentConfigDescription,
    clearError,
    forceResetLoading
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