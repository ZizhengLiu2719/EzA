import { aiConversationApi } from '@/api/ai'
import { supabase } from '@/api/supabase'
import { AIAssistantConfig, AIConversation, AIMessage } from '@/types'
import { AI_MODES, getAIConfigDescription, validateAIConfig } from '@/utils/ai'
import { useCallback, useEffect, useState } from 'react'

// 🚀 静态导入AI服务，消除动态导入延迟
import { aiService } from '@/api/ai'

// 🚀 缓存管理工具函数
const clearMessageCache = (conversationId: string) => {
  try {
    const cacheKey = `messages_${conversationId}`
    sessionStorage.removeItem(cacheKey)
    console.log('🗑️ 已清理对话缓存:', conversationId)
  } catch (err) {
    console.warn('⚠️ 清理缓存失败:', err)
  }
}

const clearAllMessageCaches = () => {
  try {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith('messages_'))
    keys.forEach(key => sessionStorage.removeItem(key))
    console.log('🗑️ 已清理所有消息缓存，数量:', keys.length)
  } catch (err) {
    console.warn('⚠️ 清理所有缓存失败:', err)
  }
}

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

  // 创建新对话 - 🚀 乐观更新版本，立即响应
  const createConversation = useCallback(async (
    assistantType: AIConversation['assistant_type'],
    taskId?: string
  ) => {
    console.log('🚀 开始创建新对话（乐观更新）:', assistantType)
    
    // 🚀 立即创建临时对话 - 用户无需等待
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const tempConversation: AIConversation = {
      id: tempId,
      user_id: '', // 临时为空，后台会更新
      task_id: taskId,
      assistant_type: assistantType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 🚀 立即更新UI - 用户可以马上看到新对话
    setConversations(prev => [tempConversation, ...prev])
    setCurrentConversation(tempConversation)
    setMessages([])
    
    console.log('✅ 临时对话已创建，用户可以立即开始聊天')

    // 🔥 后台异步保存到数据库 - 完全不阻塞用户体验
    Promise.resolve().then(async () => {
      try {
        console.log('💾 开始后台保存对话到数据库')
        
        const response = await aiConversationApi.createConversation(assistantType, taskId)
        
        if (response.error) {
          console.error('❌ 对话保存失败:', response.error)
          
          // 保存失败，但不影响用户当前体验
          // 可以选择：1) 静默失败  2) 显示警告  3) 回滚
          // 这里选择静默失败，因为用户已经在使用对话了
          console.warn('⚠️ 对话将以临时模式运行，数据可能不会持久化')
          return
        }

        const realConversation = response.data
        console.log('✅ 对话已保存到数据库，ID:', realConversation.id)

        // 🚀 更新UI中的临时对话为真实对话
        setConversations(prev => prev.map(conv => 
          conv.id === tempId ? realConversation : conv
        ))
        
        // 如果这个临时对话仍然是当前对话，更新为真实对话
        setCurrentConversation(current => 
          current?.id === tempId ? realConversation : current
        )

        console.log('✅ 临时对话已更新为真实对话')

      } catch (err: any) {
        console.error('💥 后台保存对话失败:', err)
        // 同样选择静默失败，保持用户体验流畅
        console.warn('⚠️ 对话将以临时模式运行，重新加载页面后可能丢失')
      }
    }).catch(err => {
      console.warn('⚠️ 后台任务启动失败:', err)
    })

    // 🚀 立即返回临时对话，不等待数据库操作
    return tempConversation
  }, [])

  // 选择对话 - 🚀 乐观更新版本，立即切换
  const selectConversation = useCallback(async (conversationId: string) => {
    console.log('🚀 开始切换对话（乐观更新）:', conversationId)
    
    try {
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        setError('Conversation does not exist')
        return
      }

      // 🚀 立即切换到选中的对话 - 用户无需等待
      setCurrentConversation(conversation)
      setError(null)
      
      console.log('✅ 对话已立即切换，开始加载消息')

      // 🚀 检查是否已有缓存的消息
      const cacheKey = `messages_${conversationId}`
      const cachedMessages = sessionStorage.getItem(cacheKey)
      
      if (cachedMessages) {
        try {
          const parsedMessages = JSON.parse(cachedMessages)
          setMessages(parsedMessages)
          console.log('✅ 使用缓存消息，立即显示')
          
          // 后台刷新缓存（可选）
          Promise.resolve().then(async () => {
            try {
              const response = await aiConversationApi.getConversationMessages(conversationId)
              if (!response.error && response.data) {
                // 检查是否有新消息
                if (JSON.stringify(response.data) !== cachedMessages) {
                  setMessages(response.data)
                  sessionStorage.setItem(cacheKey, JSON.stringify(response.data))
                  console.log('🔄 缓存已更新')
                }
              }
            } catch (err) {
              console.warn('⚠️ 后台刷新缓存失败:', err)
            }
          })
          
          return // 使用缓存，直接返回
        } catch (err) {
          console.warn('⚠️ 缓存解析失败，回退到网络加载:', err)
        }
      }

      // 🔥 没有缓存，后台异步加载消息 - 不阻塞UI
      setMessages([]) // 先清空消息，显示loading状态
      
      Promise.resolve().then(async () => {
        try {
          console.log('💾 开始后台加载消息')
          const response = await aiConversationApi.getConversationMessages(conversationId)
          
          if (response.error) {
            console.error('❌ 加载消息失败:', response.error)
            setError(response.error)
          } else {
            setMessages(response.data)
            
            // 🚀 缓存消息以供下次快速访问
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(response.data))
              console.log('✅ 消息已缓存')
            } catch (cacheErr) {
              console.warn('⚠️ 缓存保存失败:', cacheErr)
            }
            
            console.log('✅ 消息加载完成')
          }
        } catch (err: any) {
          console.error('💥 后台加载消息失败:', err)
          setError(err.message)
        }
      }).catch(err => {
        console.warn('⚠️ 后台任务启动失败:', err)
      })

    } catch (err: any) {
      console.error('💥 切换对话失败:', err)
      setError(err.message)
    }
  }, [conversations])

  // 删除对话 - 优化版本，支持乐观更新
  const deleteConversation = useCallback(async (conversationId: string) => {
    // 🚀 乐观更新：立即更新UI，给用户瞬间反馈
    const originalConversations = conversations
    const originalCurrentConversation = currentConversation
    const originalMessages = messages

    // 立即从本地状态中移除对话
    setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    
    // 如果删除的是当前对话，立即清空当前对话
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null)
      setMessages([])
    }

    // 🚀 立即清理缓存
    clearMessageCache(conversationId)

    console.log('🗑️ 乐观删除：UI已立即更新')

    try {
      // 🚀 后台异步执行实际删除操作
      const response = await aiConversationApi.deleteConversation(conversationId)
      
      if (response.error) {
        // ❌ 删除失败，回滚UI状态
        console.error('❌ 删除失败，回滚状态:', response.error)
        setConversations(originalConversations)
        setCurrentConversation(originalCurrentConversation)
        setMessages(originalMessages)
        setError(`删除失败: ${response.error}`)
        return { success: false, error: response.error }
      }

      console.log('✅ 后台删除成功确认')
      return { success: true }
    } catch (err: any) {
      // ❌ 网络错误，回滚UI状态
      console.error('❌ 网络错误，回滚状态:', err.message)
      setConversations(originalConversations)
      setCurrentConversation(originalCurrentConversation)
      setMessages(originalMessages)
      setError(`删除失败: ${err.message}`)
      return { success: false, error: err.message }
    }
  }, [conversations, currentConversation, messages])

  // 删除所有对话 - 优化版本，支持乐观更新
  const deleteAllConversations = useCallback(async () => {
    if (conversations.length === 0) {
      return { success: true, deletedCount: 0 }
    }

    // 🚀 乐观更新：立即清空UI
    const originalConversations = conversations
    const originalCurrentConversation = currentConversation
    const originalMessages = messages
    const deletedCount = conversations.length

    // 立即清空本地状态
    setConversations([])
    setCurrentConversation(null)
    setMessages([])

    // 🚀 立即清理所有缓存
    clearAllMessageCaches()

    console.log(`🗑️ 乐观删除：${deletedCount}个对话已立即清空`)

    try {
      // 🚀 后台异步执行实际删除操作
      const response = await aiConversationApi.deleteAllConversations()
      
      if (response.error) {
        // ❌ 删除失败，回滚UI状态
        console.error('❌ 批量删除失败，回滚状态:', response.error)
        setConversations(originalConversations)
        setCurrentConversation(originalCurrentConversation)
        setMessages(originalMessages)
        setError(`批量删除失败: ${response.error}`)
        return { success: false, error: response.error }
      }

      console.log(`✅ 后台批量删除成功确认: ${response.data.deletedCount}个对话`)

      return { success: true, deletedCount: response.data.deletedCount }
    } catch (err: any) {
      // ❌ 网络错误，回滚UI状态
      console.error('❌ 批量删除网络错误，回滚状态:', err.message)
      setConversations(originalConversations)
      setCurrentConversation(originalCurrentConversation)
      setMessages(originalMessages)
      setError(`批量删除失败: ${err.message}`)
      return { success: false, error: err.message }
    }
  }, [conversations, currentConversation, messages])

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

  // 🚀 优化版本：普通发送消息（完全分离AI和数据库）
  const sendMessageFast = useCallback(async (
    message: string, 
    conversation: AIConversation, 
    userMessage: AIMessage
  ) => {
    if (!conversation) {
      setError('Please select or create a conversation first')
      return
    }

    setLoading(true)
    setError(null)
    
    console.log('🚀 开始普通AI调用（完全分离版）:', message)
    console.log('📝 使用对话:', conversation.id)
    
    // 短超时控制 - 仅针对AI调用
    const timeoutId = setTimeout(() => {
      console.warn('⏰ AI调用超时（20秒）')
      setLoading(false)
      setError('AI response timeout. Please try again.')
    }, 20000) // 减少到20秒，只针对AI调用
    
    try {
      const startTime = Date.now()

      // 🚀 核心策略：只等待AI调用，数据库操作完全后台进行
      console.log('🤖 开始AI调用（静态导入）')
      
      const aiContent = await aiService.generateConversationResponse(
        conversation, // 🚀 使用传入的对话，而不是状态中的对话
        message,
        {
          ...aiConfig,
          model: aiConfig.model || 'gpt-3.5-turbo'
        }
      )
      
      console.log('✅ AI响应完成，耗时:', Date.now() - startTime + 'ms')
      console.log('🎯 AI回复内容长度:', aiContent.length, '字符')

      // 创建AI消息对象
      const aiMessage: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: conversation.id, // 🚀 使用传入的对话ID
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }

      // 🚀 立即添加到UI - 无等待
      setMessages(prev => {
        const newMessages = [...prev, aiMessage]
        
        // 🚀 同步更新缓存
        const cacheKey = `messages_${conversation.id}`
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(newMessages))
          console.log('✅ 消息缓存已同步更新')
        } catch (cacheErr) {
          console.warn('⚠️ 缓存更新失败:', cacheErr)
        }
        
        return newMessages
      })
      
      // 更新对话列表中的最后更新时间
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id // 🚀 使用传入的对话ID
          ? { ...conv, updated_at: aiMessage.timestamp }
          : conv
      ))
      
      console.log('✅ AI消息已添加到UI，总耗时:', Date.now() - startTime + 'ms')

      // 🔥 完全后台的数据库操作 - 不阻塞任何用户体验
      Promise.resolve().then(async () => {
        try {
          // 🚀 检测临时对话：跳过数据库操作，避免保存失败
          if (conversation.id.startsWith('temp_')) {
            console.log('⏭️ 检测到临时对话，跳过数据库操作，等待真实对话ID')
            return
          }

          console.log('💾 开始后台数据库操作（完全异步）')
          
          // 快速认证检查
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
            console.warn('⚠️ 用户认证失败，跳过数据库操作')
            return
          }

          // 并行保存用户消息和AI消息
          const [userResult, aiResult] = await Promise.allSettled([
            // 保存用户消息
            supabase
              .from('ai_messages')
              .insert({
                conversation_id: conversation.id, // 🚀 使用传入的对话ID
                role: 'user',
                content: message,
                timestamp: userMessage.timestamp
              }),
            
            // 保存AI消息
            supabase
              .from('ai_messages')
              .insert({
                conversation_id: conversation.id, // 🚀 使用传入的对话ID
                role: 'assistant',
                content: aiContent,
                timestamp: aiMessage.timestamp
              })
          ])

          // 处理结果
          if (userResult.status === 'fulfilled' && !userResult.value.error) {
            console.log('✅ 用户消息已持久化')
          } else {
            console.warn('⚠️ 用户消息持久化失败:', userResult)
          }

          if (aiResult.status === 'fulfilled' && !aiResult.value.error) {
            console.log('✅ AI消息已持久化')
          } else {
            console.warn('⚠️ AI消息持久化失败:', aiResult)
          }

          // 更新对话时间戳
          const conversationUpdate = await supabase
            .from('ai_conversations')
            .update({ updated_at: aiMessage.timestamp })
            .eq('id', conversation.id) // 🚀 使用传入的对话ID

          if (!conversationUpdate.error) {
            console.log('✅ 对话时间戳已更新')
          }

        } catch (dbErr) {
          console.warn('⚠️ 后台数据库操作失败，但不影响用户体验:', dbErr)
        }
      }).catch(err => {
        console.warn('⚠️ 后台任务启动失败:', err)
      })

    } catch (err: any) {
      console.error('💥 AI调用失败:', err)
      
      // 🚀 快速用户友好的错误处理
      if (err.message.includes('timeout')) {
        setError('AI响应超时，请重试')
      } else if (err.message.includes('API key')) {
        setError('API配置问题，请检查设置')
      } else if (err.message.includes('rate limit')) {
        setError('请求过于频繁，请稍后重试')
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        setError('网络连接问题，请重试')
      } else {
        setError(`AI服务错误: ${err.message}`)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
      console.log('🏁 AI调用完成')
    }
  }, [aiConfig])

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
    setMessages(prev => {
      const newMessages = [...prev, message]
      
      // 🚀 同步更新缓存
      if (currentConversation) {
        const cacheKey = `messages_${currentConversation.id}`
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(newMessages))
          console.log('✅ 消息缓存已同步更新')
        } catch (cacheErr) {
          console.warn('⚠️ 缓存更新失败:', cacheErr)
        }
      }
      
      return newMessages
    })
    
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