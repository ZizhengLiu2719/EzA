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
        setError('对话不存在')
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

  // 发送消息
  const sendMessage = useCallback(async (message: string) => {
    if (!currentConversation) {
      setError('请先选择或创建一个对话')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await aiConversationApi.sendMessage(
        currentConversation.id,
        message,
        {
          ...aiConfig,
          model: aiConfig.model || 'gpt-3.5-turbo' // 确保有默认模型
        }
      )
      
      if (response.error) {
        setError(response.error)
      } else {
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentConversation, aiConfig])

  // 更新 AI 配置
  const updateAIConfig = useCallback((config: Partial<AIAssistantConfig>) => {
    const newConfig = { ...aiConfig, ...config }
    
    if (validateAIConfig(newConfig)) {
      setAIConfig(newConfig)
    } else {
      setError('AI 配置无效')
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
    sendMessage,
    updateAIConfig,
    getAIModeOptions,
    getCurrentConfigDescription,
    clearError
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

  const fetchStats = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await aiConversationApi.getUserConversations()
      if (!response.error && response.data) {
        // 这里可以添加更复杂的统计计算
        const totalConversations = response.data.length
        const totalMessages = response.data.reduce((sum, conv) => 
          sum + (conv.messages?.length || 0), 0
        )
        
        setStats({
          totalConversations,
          totalMessages,
          averageMessagesPerConversation: totalConversations > 0 
            ? Math.round(totalMessages / totalConversations) 
            : 0,
          mostUsedMode: 'bullet_tutor', // 简化版本
          mostUsedType: 'writing' // 简化版本
        })
      }
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