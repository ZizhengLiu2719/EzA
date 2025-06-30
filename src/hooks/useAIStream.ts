import { aiStreamService, StreamChunk } from '@/api/ai-stream'
import { supabase } from '@/api/supabase'
import { AIAssistantConfig, AIConversation, AIMessage } from '@/types'
import { useCallback, useRef, useState } from 'react'

// 流式消息类型，匹配数据库表结构
interface StreamMessage extends Omit<AIMessage, 'id' | 'timestamp'> {
  // 只包含数据库中实际存在的字段
}

export interface UseAIStreamReturn {
  isStreaming: boolean
  streamingMessage: string
  sendStreamMessage: (message: string, conversation: AIConversation, config?: AIAssistantConfig, onComplete?: (fullContent: string) => void) => Promise<void>
  stopStreaming: () => void
  error: string | null
  clearError: () => void
  clearStreamingMessage: () => void
}

export function useAIStream(): UseAIStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const streamingRef = useRef<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 清除流式消息
  const clearStreamingMessage = useCallback(() => {
    console.log('🧹 清除流式消息状态')
    setStreamingMessage('')
  }, [])

  // 停止流式响应
  const stopStreaming = useCallback(() => {
    streamingRef.current = false
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setStreamingMessage('')
  }, [])

  // 发送流式消息
  const sendStreamMessage = useCallback(async (
    message: string,
    conversation: AIConversation,
    config?: AIAssistantConfig,
    onComplete?: (fullContent: string) => void
  ) => {
    if (isStreaming || !message.trim()) {
      return
    }

    console.log('🚀 开始流式消息发送:', message)
    setError(null)
    setIsStreaming(true)
    setStreamingMessage('')
    streamingRef.current = true

    // 创建新的AbortController
    abortControllerRef.current = new AbortController()

    try {
      // 🚀 优化1: 快速开始AI调用，不等待数据库操作
      let fullAIContent = ''
      let aiMessageId: string | null = null

      // 🔥 并行执行：AI调用 + 数据库操作
      const [aiResponse] = await Promise.allSettled([
        // AI调用 - 立即开始，最高优先级
        aiStreamService.streamCompletion(
          conversation,
          message,
          config || { mode: 'bullet_tutor' },
          {
            onChunk: (chunk: StreamChunk) => {
              if (!streamingRef.current) return
              fullAIContent += chunk.content
              setStreamingMessage(fullAIContent)
              console.log('📝 收到流式块:', chunk.content)
            },

            onComplete: async (fullContent: string) => {
              if (!streamingRef.current) return
              console.log('✅ 流式响应完成，总长度:', fullContent.length)

              // 如果有AI消息ID，更新数据库
              if (aiMessageId) {
                try {
                  console.log('💾 更新AI消息内容到数据库')
                  await supabase
                    .from('ai_messages')
                    .update({ content: fullContent })
                    .eq('id', aiMessageId)
                  console.log('✅ AI消息内容已保存')
                } catch (updateErr) {
                  console.warn('⚠️ 更新AI消息失败，但用户体验不受影响:', updateErr)
                }
              }

              // 触发回调
              if (onComplete) {
                onComplete(fullContent)
              }

              // 清理状态
              setIsStreaming(false)
              setStreamingMessage('')
              streamingRef.current = false
            },

            onError: (errorMessage: string) => {
              console.error('💥 流式响应错误:', errorMessage)
              setError(errorMessage)
              setIsStreaming(false)
              setStreamingMessage('')
              streamingRef.current = false

              // 如果有AI消息ID，删除未完成的记录
              if (aiMessageId) {
                supabase
                  .from('ai_messages')
                  .delete()
                  .eq('id', aiMessageId)
                  .then(() => console.log('🗑️ 已清理未完成的AI消息'))
              }
            }
          }
        ),

        // 数据库操作 - 后台并行执行
        (async () => {
          try {
            // 快速认证检查（可以考虑缓存）
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
              console.warn('⚠️ 用户认证失败，但不阻塞AI调用:', authError)
              return
            }

            console.log('💾 后台开始数据库操作')

            // 并行执行两个数据库插入
            const [userResult, aiResult] = await Promise.allSettled([
              // 保存用户消息
              supabase
                .from('ai_messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'user',
                  content: message
                })
                .select()
                .single(),

              // 创建AI消息记录
              supabase
                .from('ai_messages')
                .insert({
                  conversation_id: conversation.id,
                  role: 'assistant',
                  content: '' // 初始为空，后续更新
                })
                .select()
                .single()
            ])

            // 处理用户消息保存结果
            if (userResult.status === 'fulfilled' && !userResult.value.error) {
              console.log('✅ 用户消息已保存')
            } else {
              console.warn('⚠️ 用户消息保存失败:', userResult)
            }

            // 处理AI消息创建结果
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

      // 检查AI调用是否成功
      if (aiResponse.status === 'rejected') {
        throw new Error(`AI调用失败: ${aiResponse.reason}`)
      }

    } catch (err: any) {
      console.error('💥 流式消息发送失败:', err)
      setError(err.message || '发送消息失败，请重试')
      setIsStreaming(false)
      setStreamingMessage('')
      streamingRef.current = false
    }
  }, [isStreaming])

  return {
    isStreaming,
    streamingMessage,
    sendStreamMessage,
    stopStreaming,
    error,
    clearError,
    clearStreamingMessage
  }
} 