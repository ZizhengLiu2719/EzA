import { aiConversationApi } from '@/api/ai'
import React, { useState } from 'react'

const AITestComponent: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testOpenAIConnection = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔧 开始测试OpenAI连接...')
      
      // 检查API Key
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      console.log('🔑 API Key存在:', apiKey ? '是' : '否')
      console.log('🔑 API Key长度:', apiKey?.length || 0)
      
      if (!apiKey) {
        throw new Error('OpenAI API Key未配置')
      }

      // 创建测试对话
      const conversationResponse = await aiConversationApi.createConversation('writing')
      
      if (conversationResponse.error) {
        throw new Error(`创建对话失败: ${conversationResponse.error}`)
      }

      console.log('✅ 对话创建成功:', conversationResponse.data)

      // 发送测试消息
      const messageResponse = await aiConversationApi.sendMessage(
        conversationResponse.data.id,
        '你好，这是一个测试消息。请简短回复确认你收到了。',
        { mode: 'bullet_tutor', model: 'gpt-3.5-turbo' }
      )

      if (messageResponse.error) {
        throw new Error(`发送消息失败: ${messageResponse.error}`)
      }

      console.log('✅ 消息发送成功:', messageResponse.data)
      setResult({
        success: true,
        conversation: conversationResponse.data,
        message: messageResponse.data,
        apiKeyStatus: 'OK',
        timestamp: new Date().toLocaleString()
      })

    } catch (err: any) {
      console.error('❌ AI测试失败:', err)
      setError(err.message)
      setResult({
        success: false,
        error: err.message,
        timestamp: new Date().toLocaleString()
      })
    } finally {
      setTesting(false)
    }
  }

  const testEnvironmentVariables = () => {
    const envVars = {
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? '已配置' : '未配置',
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置'
    }
    
    console.table(envVars)
    setResult({ envVars, timestamp: new Date().toLocaleString() })
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #333', 
      margin: '20px', 
      borderRadius: '8px',
      backgroundColor: '#1a1a1a',
      color: '#fff'
    }}>
      <h3>🔧 EzA AI 诊断工具</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testEnvironmentVariables}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          检查环境变量
        </button>
        
        <button 
          onClick={testOpenAIConnection}
          disabled={testing}
          style={{
            padding: '10px 15px',
            backgroundColor: testing ? '#666' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer'
          }}
        >
          {testing ? '🔄 测试中...' : '🧪 测试AI连接'}
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f44336', 
          color: 'white', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>❌ 错误:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: result.success === false ? '#f44336' : '#4CAF50', 
          color: 'white', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <strong>📊 测试结果:</strong>
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
        <p><strong>使用说明:</strong></p>
        <ol>
          <li>首先点击"检查环境变量"确认配置</li>
          <li>然后点击"测试AI连接"测试完整流程</li>
          <li>打开浏览器开发者工具查看详细日志</li>
        </ol>
      </div>
    </div>
  )
}

export default AITestComponent 