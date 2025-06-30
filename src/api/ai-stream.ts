import { AIAssistantConfig, AIConversation } from '@/types'

// 流式响应类型定义
export interface StreamChunk {
  content: string
  isComplete: boolean
  error?: string
}

export interface StreamOptions {
  onChunk: (chunk: StreamChunk) => void
  onComplete: (fullContent: string) => void
  onError: (error: string) => void
}

// AI 提示词模板（优化版）
const AI_PROMPTS = {
  writing: {
    bullet_tutor: `你是学术写作导师。简洁回答，控制在150字内。\n\n问题：{user_message}`,
    socratic_bot: `你是苏格拉底式导师。用问题引导思考，100字内。\n\n问题：{user_message}`,
    quick_fix: `直接提供写作建议，80字内。\n\n问题：{user_message}`,
    diagram_ai: `用简单图表说明，100字内。\n\n问题：{user_message}`
  },
  stem: {
    bullet_tutor: `你是STEM导师。引导式教学，150字内。\n\n问题：{user_message}`,
    socratic_bot: `用问题引导STEM思维，100字内。\n\n问题：{user_message}`,
    quick_fix: `直接提供解题步骤，80字内。\n\n问题：{user_message}`,
    diagram_ai: `用图表解释概念，100字内。\n\n问题：{user_message}`
  },
  reading: {
    bullet_tutor: `你是阅读导师。引导理解，150字内。\n\n问题：{user_message}`,
    socratic_bot: `用问题深化理解，100字内。\n\n问题：{user_message}`,
    quick_fix: `直接解释要点，80字内。\n\n问题：{user_message}`,
    diagram_ai: `用图表分析文本，100字内。\n\n问题：{user_message}`
  },
  programming: {
    bullet_tutor: `你是编程导师。引导思维，150字内。\n\n问题：{user_message}`,
    socratic_bot: `用问题引导编程逻辑，100字内。\n\n问题：{user_message}`,
    quick_fix: `直接提供代码方案，80字内。\n\n问题：{user_message}`,
    diagram_ai: `用流程图解释，100字内。\n\n问题：{user_message}`
  }
}

export class AIStreamService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * 流式调用OpenAI API
   */
  async streamCompletion(
    conversation: AIConversation,
    userMessage: string,
    config: AIAssistantConfig,
    options: StreamOptions
  ): Promise<void> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      console.log('🚀 开始流式AI调用:', userMessage)
      const startTime = Date.now()

      // 构建优化的提示词
      const assistantType = conversation.assistant_type
      const mode = config?.mode || 'bullet_tutor'
      const promptTemplate = AI_PROMPTS[assistantType]?.[mode] || AI_PROMPTS[assistantType]?.bullet_tutor
      
      const systemPrompt = promptTemplate.replace('{user_message}', userMessage)

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]

      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏰ 流式请求超时，取消请求')
        controller.abort()
        options.onError('请求超时，请稍后重试')
      }, 15000) // 15秒超时

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config?.model || 'gpt-3.5-turbo',
          messages,
          max_tokens: 400, // 进一步减少token
          temperature: 0.7,
          top_p: 0.9,
          stream: true, // 启用流式响应
          frequency_penalty: 0,
          presence_penalty: 0
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 流式API错误:', errorText)
        options.onError(`API错误: ${response.statusText}`)
        return
      }

      console.log(`📡 流式响应开始 (${Date.now() - startTime}ms)`)

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        options.onError('无法读取响应流')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log(`✅ 流式响应完成 (总耗时: ${Date.now() - startTime}ms)`)
            options.onComplete(fullContent)
            break
          }

          // 解码数据
          buffer += decoder.decode(value, { stream: true })
          
          // 处理SSE格式的数据
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保留未完成的行

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                options.onComplete(fullContent)
                return
              }

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                
                if (content) {
                  fullContent += content
                  
                  // 发送流式数据块
                  options.onChunk({
                    content: content,
                    isComplete: false
                  })
                }
              } catch (parseError) {
                console.warn('解析流式数据失败:', parseError)
              }
            }
          }
        }
      } catch (streamError) {
        console.error('💥 流式处理错误:', streamError)
        options.onError('流式处理失败，请重试')
      } finally {
        reader.releaseLock()
      }

    } catch (error: any) {
      console.error('💥 流式API调用失败:', error)
      
      if (error.name === 'AbortError') {
        options.onError('请求超时，请稍后重试')
      } else if (error.message.includes('fetch')) {
        options.onError('网络连接错误，请检查网络')
      } else {
        options.onError(`AI服务暂时不可用: ${error.message}`)
      }
    }
  }
}

// 创建全局实例
export const aiStreamService = new AIStreamService() 