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
    const oldCacheKey = `messages_${conversationId}`
    const recentCacheKey = `recent_messages_${conversationId}`
    sessionStorage.removeItem(oldCacheKey)
    sessionStorage.removeItem(recentCacheKey)
    console.log('🗑️ 已清理对话缓存:', conversationId)
  } catch (err) {
    console.warn('⚠️ 清理缓存失败:', err)
  }
}

const clearAllMessageCaches = () => {
  try {
    const keys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('messages_') || key.startsWith('recent_messages_')
    )
    keys.forEach(key => sessionStorage.removeItem(key))
    console.log('🗑️ 已清理所有消息缓存，数量:', keys.length)
  } catch (err) {
    console.warn('⚠️ 清理所有缓存失败:', err)
  }
}

// 🚀 更新最近消息缓存的工具函数
const updateRecentMessagesCache = (conversationId: string, newMessages: AIMessage[]) => {
  try {
    // 只缓存最近20条消息
    const recentMessages = newMessages.slice(-20)
    const recentCacheKey = `recent_messages_${conversationId}`
    sessionStorage.setItem(recentCacheKey, JSON.stringify(recentMessages))
    console.log('✅ 最近消息缓存已更新')
  } catch (err) {
    console.warn('⚠️ 更新最近消息缓存失败:', err)
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
        
        // 🚀 并行预加载所有对话的最近消息
        if (response.data && response.data.length > 0) {
          console.log('🚀 开始预加载所有对话的最近消息')
          
          Promise.allSettled(
            response.data.map(async (conversation) => {
              try {
                // 检查是否已有缓存
                const recentCacheKey = `recent_messages_${conversation.id}`
                const cachedMessages = sessionStorage.getItem(recentCacheKey)
                
                if (!cachedMessages) {
                  // 没有缓存，预加载最近消息
                  const messagesResponse = await aiConversationApi.getRecentConversationMessages(conversation.id, 10)
                  if (!messagesResponse.error && messagesResponse.data) {
                    sessionStorage.setItem(recentCacheKey, JSON.stringify(messagesResponse.data))
                    console.log(`✅ 预加载对话 ${conversation.id} 的最近消息`)
                  }
                }
              } catch (err) {
                console.warn(`⚠️ 预加载对话 ${conversation.id} 消息失败:`, err)
              }
            })
          ).then(() => {
            console.log('🎉 所有对话预加载完成，用户切换将极其流畅')
          })
        }
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

      // 🚀 检查是否已有缓存的完整消息
      const fullCacheKey = `recent_messages_${conversationId}`
      const cachedFullMessages = sessionStorage.getItem(fullCacheKey)
      
      if (cachedFullMessages) {
        try {
          const parsedMessages = JSON.parse(cachedFullMessages)
          setMessages(parsedMessages)
          console.log('✅ 使用缓存的完整消息，立即显示')
          return // 有完整缓存，直接返回
        } catch (err) {
          console.warn('⚠️ 完整消息缓存解析失败:', err)
        }
      }

      // 🔥 直接加载完整消息（临时移除预览逻辑）
      setMessages([]) // 先清空消息
      
      try {
        console.log('💾 开始加载完整消息')
        const response = await aiConversationApi.getRecentConversationMessages(conversationId, 20)
        
        if (!response.error && response.data) {
          console.log('✅ 获取到消息:', response.data.length, '条')
          response.data.forEach((msg, index) => {
            console.log(`📝 消息${index}: role=${msg.role}, content长度=${msg.content?.length || 0}`)
          })
          
          setMessages(response.data)
          
          // 缓存完整消息
          try {
            sessionStorage.setItem(fullCacheKey, JSON.stringify(response.data))
            console.log('✅ 完整消息已缓存')
          } catch (cacheErr) {
            console.warn('⚠️ 缓存保存失败:', cacheErr)
          }
        } else {
          console.error('❌ 获取消息失败:', response.error)
          setError(response.error || '获取消息失败')
        }
      } catch (err: any) {
        console.error('💥 消息加载异常:', err)
        setError(err.message)
      }

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
      console.log('📝 AI回复内容预览:', aiContent.substring(0, 200))

      // 创建AI消息对象
      const aiMessage: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: conversation.id, // 🚀 使用传入的对话ID
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }

      console.log('📦 创建的AI消息对象:', {
        id: aiMessage.id,
        role: aiMessage.role,
        contentLength: aiMessage.content.length,
        conversationId: aiMessage.conversation_id
      })

      // 🚀 立即添加到UI - 无等待
      setMessages(prev => {
        const newMessages = [...prev, aiMessage]
        
        // 🚀 更新最近消息缓存
        updateRecentMessagesCache(conversation.id, newMessages)
        
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
          // 🚀 处理临时对话：等待真实对话创建完成
          let actualConversationId = conversation.id
          
          if (conversation.id.startsWith('temp_')) {
            console.log('⏳ 检测到临时对话，等待真实对话ID')
            
            // 等待最多10秒让真实对话创建完成
            let waitTime = 0
            const maxWaitTime = 10000 // 10秒
            const checkInterval = 100 // 100ms检查一次
            
            while (waitTime < maxWaitTime) {
              await new Promise(resolve => setTimeout(resolve, checkInterval))
              waitTime += checkInterval
              
              // 检查对话是否已经更新为真实对话
              const currentConv = conversations.find(c => 
                c.id === conversation.id || // 原临时ID还在
                (c.id !== conversation.id && !c.id.startsWith('temp_')) // 或者找到新的真实对话
              )
              
              if (currentConv && !currentConv.id.startsWith('temp_')) {
                actualConversationId = currentConv.id
                console.log('✅ 找到真实对话ID:', actualConversationId)
                break
              }
              
              // 也检查当前对话状态是否已经更新
              if (currentConversation && !currentConversation.id.startsWith('temp_')) {
                actualConversationId = currentConversation.id
                console.log('✅ 当前对话已更新为真实ID:', actualConversationId)
                break
              }
            }
            
            // 如果仍然是临时对话，说明对话创建失败，但仍然尝试保存
            if (actualConversationId.startsWith('temp_')) {
              console.warn('⚠️ 等待超时，仍为临时对话，尝试创建对话后保存消息')
              
              // 尝试直接创建对话（备用方案）
              try {
                const assistantType = conversation.assistant_type || 'programming'
                const createResponse = await aiConversationApi.createConversation(assistantType)
                
                if (!createResponse.error && createResponse.data) {
                  actualConversationId = createResponse.data.id
                  console.log('✅ 备用方案：成功创建对话', actualConversationId)
                  
                  // 更新当前对话为真实对话
                  setCurrentConversation(createResponse.data)
                  setConversations(prev => prev.map(conv => 
                    conv.id === conversation.id ? createResponse.data : conv
                  ))
                } else {
                  console.error('❌ 备用方案失败，无法创建对话:', createResponse.error)
                  return // 放弃保存
                }
              } catch (createErr) {
                console.error('❌ 备用对话创建失败:', createErr)
                return // 放弃保存
              }
            }
          }

          console.log('💾 开始后台数据库操作，对话ID:', actualConversationId)
          console.log('💾 准备保存的AI内容长度:', aiContent.length)
          console.log('💾 准备保存的AI内容预览:', aiContent.substring(0, 100))
          
          // 快速认证检查
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          if (authError || !user) {
            console.warn('⚠️ 用户认证失败，跳过数据库操作')
            return
          }

          // 构建要插入的AI消息数据
          const aiInsertData = {
            conversation_id: actualConversationId, // 使用真实对话ID
            role: 'assistant',
            content: aiContent,
            timestamp: aiMessage.timestamp
          }
          
          console.log('📤 准备插入的AI消息数据:', {
            conversation_id: aiInsertData.conversation_id,
            role: aiInsertData.role,
            contentLength: aiInsertData.content.length,
            contentPreview: aiInsertData.content.substring(0, 100),
            timestamp: aiInsertData.timestamp
          })

          // 并行保存用户消息和AI消息
          const [userResult, aiResult] = await Promise.allSettled([
            // 保存用户消息
            supabase
              .from('ai_messages')
              .insert({
                conversation_id: actualConversationId, // 使用真实对话ID
                role: 'user',
                content: message,
                timestamp: userMessage.timestamp
              }),
            
            // 保存AI消息
            supabase
              .from('ai_messages')
              .insert(aiInsertData)
          ])

          // 处理结果
          if (userResult.status === 'fulfilled' && !userResult.value.error) {
            console.log('✅ 用户消息已持久化')
          } else {
            console.warn('⚠️ 用户消息持久化失败:', userResult)
          }

          if (aiResult.status === 'fulfilled' && !aiResult.value.error) {
            console.log('✅ AI消息已持久化成功')
            console.log('✅ 持久化的数据:', aiResult.value.data)
          } else {
            console.error('❌ AI消息持久化失败:', aiResult)
            if (aiResult.status === 'rejected') {
              console.error('❌ AI消息插入被拒绝:', aiResult.reason)
            } else {
              console.error('❌ AI消息插入错误:', aiResult.value.error)
            }
          }

          // 更新对话时间戳
          const conversationUpdate = await supabase
            .from('ai_conversations')
            .update({ updated_at: aiMessage.timestamp })
            .eq('id', actualConversationId) // 使用真实对话ID

          if (!conversationUpdate.error) {
            console.log('✅ 对话时间戳已更新')
          }

        } catch (dbErr) {
          console.error('❌ 后台数据库操作异常:', dbErr)
        }
      }).catch(err => {
        console.error('❌ 后台任务启动失败:', err)
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
      
      // 🚀 更新最近消息缓存
      if (currentConversation) {
        updateRecentMessagesCache(currentConversation.id, newMessages)
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

  // 🚀 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || messages.length === 0) {
      console.warn('⚠️ 没有当前对话或消息，无法加载更多')
      return
    }

    setLoading(true)
    console.log('🔄 开始加载更多历史消息')

    try {
      // 获取当前最早消息的时间戳
      const earliestMessage = messages[0]
      const beforeTimestamp = earliestMessage.timestamp

      const response = await aiConversationApi.getMoreConversationMessages(
        currentConversation.id,
        beforeTimestamp,
        20
      )

      if (response.error) {
        setError(response.error)
        console.error('❌ 加载更多消息失败:', response.error)
      } else {
        if (response.data && response.data.length > 0) {
          // 将新消息添加到当前消息列表的前面
          setMessages(prev => [...response.data, ...prev])
          
          // 更新缓存
          const newAllMessages = [...response.data, ...messages]
          updateRecentMessagesCache(currentConversation.id, newAllMessages)
          
          console.log(`✅ 已加载 ${response.data.length} 条历史消息`)
        } else {
          console.log('📝 没有更多历史消息了')
        }
      }
    } catch (err: any) {
      setError(err.message)
      console.error('💥 加载更多消息异常:', err)
    } finally {
      setLoading(false)
    }
  }, [currentConversation, messages])

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
    addMessage,
    loadMoreMessages
  }
}

// AI 统计 Hook
export const useAIStats = () => {
  const [stats] = useState({
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