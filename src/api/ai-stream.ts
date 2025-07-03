import { getAIModel } from '@/config/aiModel'
import { AIAssistantConfig, AIConversation } from '@/types'

// Stream response type definition
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

// Optimized AI prompt templates
const AI_PROMPTS = {
  writing: {
    bullet_tutor: `You are an academic writing tutor. Keep your answer concise, under 150 words.\n\nQuestion: {user_message}`,
    socratic_bot: `You are a Socratic tutor. Guide thinking with questions, under 100 words.\n\nQuestion: {user_message}`,
    quick_fix: `Provide direct writing advice, under 80 words.\n\nQuestion: {user_message}`,
    diagram_ai: `Explain with a simple diagram, under 100 words.\n\nQuestion: {user_message}`
  },
  stem: {
    bullet_tutor: `You are a STEM tutor. Use guided instruction, under 150 words.\n\nQuestion: {user_message}`,
    socratic_bot: `Guide STEM thinking with questions, under 100 words.\n\nQuestion: {user_message}`,
    quick_fix: `Provide direct problem-solving steps, under 80 words.\n\nQuestion: {user_message}`,
    diagram_ai: `Explain the concept with a diagram, under 100 words.\n\nQuestion: {user_message}`
  },
  reading: {
    bullet_tutor: `You are a reading tutor. Guide comprehension, under 150 words.\n\nQuestion: {user_message}`,
    socratic_bot: `Deepen understanding with questions, under 100 words.\n\nQuestion: {user_message}`,
    quick_fix: `Directly explain the main points, under 80 words.\n\nQuestion: {user_message}`,
    diagram_ai: `Analyze the text with a diagram, under 100 words.\n\nQuestion: {user_message}`
  },
  programming: {
    bullet_tutor: `You are a programming tutor. Guide their thinking process, under 150 words.\n\nQuestion: {user_message}`,
    socratic_bot: `Guide programming logic with questions, under 100 words.\n\nQuestion: {user_message}`,
    quick_fix: `Provide a direct code solution, under 80 words.\n\nQuestion: {user_message}`,
    diagram_ai: `Explain with a flowchart, under 100 words.\n\nQuestion: {user_message}`
  }
}

const LEGACY_MODE_TO_NEW_MODE_MAPPING: Record<string, string> = {
  bullet_tutor: 'bullet_tutor',
  socratic_bot: 'socratic_bot',
  quick_fix: 'quick_fix',
  diagram_ai: 'diagram_ai'
};

type PromptMode = keyof typeof AI_PROMPTS['writing'];

export class AIStreamService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.baseUrl = 'https://api.openai.com/v1'
  }

  /**
   * Streams a call to the OpenAI API
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

      console.log('🚀 Starting streaming AI call:', userMessage)
      const startTime = Date.now()

      // Build the optimized prompt
      const assistantType = conversation.assistant_type
      const mode = config?.mode || 'bullet_tutor'
      
      const promptMode = (mode in AI_PROMPTS[assistantType] ? mode : 'bullet_tutor') as PromptMode;
      const promptTemplate = AI_PROMPTS[assistantType][promptMode]
      
      const systemPrompt = promptTemplate.replace('{user_message}', userMessage)

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Streaming request timed out, aborting.')
        controller.abort()
        options.onError('Request timed out, please try again later.')
      }, 15000) // 15-second timeout

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: config?.model || getAIModel(),
          messages,
          max_tokens: 400, // Further reduce tokens
          temperature: 0.7,
          top_p: 0.9,
          stream: true, // Enable streaming response
          frequency_penalty: 0,
          presence_penalty: 0
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Streaming API error:', errorText)
        options.onError(`API error: ${response.statusText}`)
        return
      }

      console.log(`📡 Streaming response started (${Date.now() - startTime}ms)`)

      // Process the stream
      const reader = response.body?.getReader()
      if (!reader) {
        options.onError('Could not read response stream')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log(`✅ Streaming response complete (Total time: ${Date.now() - startTime}ms)`)
            options.onComplete(fullContent)
            break
          }

          // Decode data
          buffer += decoder.decode(value, { stream: true })
          
          // Process SSE data format
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep unfinished lines

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
                  
                  // Send stream chunk
                  options.onChunk({
                    content: content,
                    isComplete: false
                  })
                }
              } catch (parseError) {
                console.warn('Failed to parse stream data:', parseError)
              }
            }
          }
        }
      } catch (streamError) {
        console.error('💥 Stream processing error:', streamError)
        options.onError('Stream processing failed, please try again.')
      } finally {
        reader.releaseLock()
      }

    } catch (error: any) {
      console.error('💥 Streaming API call failed:', error)
      
      if (error.name === 'AbortError') {
        options.onError('Request timed out, please try again later.')
      } else if (error.message.includes('fetch')) {
        options.onError('Network connection error, please check your connection.')
      } else {
        options.onError(`AI service is temporarily unavailable: ${error.message}`)
      }
    }
  }
}

// Create a global instance
export const aiStreamService = new AIStreamService() 