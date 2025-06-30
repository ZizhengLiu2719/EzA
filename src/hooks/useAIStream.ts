import { aiStreamService, StreamChunk, StreamOptions } from '@/api/ai-stream'
import { supabase } from '@/api/supabase'
import { AIAssistantConfig, AIConversation, AIMessage } from '@/types'
import { useCallback, useRef, useState } from 'react'

// 扩展消息类型以支持流式响应需要的字段
interface StreamMessage extends Omit<AIMessage, 'id' | 'timestamp'> {
  assistant_type?: string
  mode?: string
}

export interface UseAIStreamReturn {
  isStreaming: boolean
  streamingMessage: string
  sendStreamMessage: (message: string, conversation: AIConversation, config?: AIAssistantConfig) => Promise<void>
  stopStreaming: () => void
  error: string | null
  clearError: () => void
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
    config?: AIAssistantConfig
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
      // 1. 立即保存用户消息到数据库
      const userMessageData: StreamMessage = {
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        assistant_type: conversation.assistant_type,
        mode: config?.mode || 'bullet_tutor'
      }

      const { data: savedUserMessage, error: userMessageError } = await supabase
        .from('ai_messages')
        .insert(userMessageData)
        .select()
        .single()

      if (userMessageError) {
        console.error('❌ 保存用户消息失败:', userMessageError)
        throw new Error('保存消息失败')
      }

      console.log('✅ 用户消息已保存:', savedUserMessage)

      // 2. 创建AI消息记录（初始为空）
      const aiMessageData: StreamMessage = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: '', // 初始为空，流式更新
        assistant_type: conversation.assistant_type,
        mode: config?.mode || 'bullet_tutor'
      }

      const { data: aiMessage, error: aiMessageError } = await supabase
        .from('ai_messages')
        .insert(aiMessageData)
        .select()
        .single()

      if (aiMessageError) {
        console.error('❌ 创建AI消息失败:', aiMessageError)
        throw new Error('创建AI消息失败')
      }

      console.log('✅ AI消息记录已创建:', aiMessage)

      // 3. 开始流式AI调用
      let fullAIContent = ''

      const streamOptions: StreamOptions = {
        onChunk: (chunk: StreamChunk) => {
          if (!streamingRef.current) return

          // 更新流式消息显示
          fullAIContent += chunk.content
          setStreamingMessage(fullAIContent)
          
          console.log('📝 收到流式块:', chunk.content)
        },

        onComplete: async (fullContent: string) => {
          if (!streamingRef.current) return

          console.log('✅ 流式响应完成，总长度:', fullContent.length)

          try {
            // 更新数据库中的AI消息内容
            const { error: updateError } = await supabase
              .from('ai_messages')
              .update({ content: fullContent })
              .eq('id', aiMessage.id)

            if (updateError) {
              console.error('❌ 更新AI消息失败:', updateError)
            } else {
              console.log('✅ AI消息内容已更新到数据库')
            }
          } catch (updateErr) {
            console.error('💥 更新消息时出错:', updateErr)
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

          // 删除未完成的AI消息记录
          supabase
            .from('ai_messages')
            .delete()
            .eq('id', aiMessage.id)
            .then(() => console.log('🗑️ 已删除未完成的AI消息'))
        }
      }

      // 启动流式调用
      await aiStreamService.streamCompletion(
        conversation,
        message,
        config || { mode: 'bullet_tutor' },
        streamOptions
      )

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
    clearError
  }
} 