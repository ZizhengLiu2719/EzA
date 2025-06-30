import { useAI } from '@/hooks/useAI'
import { useAIStream } from '@/hooks/useAIStream'
import React, { useState } from 'react'

const AIStreamTest: React.FC = () => {
  const [testMessage, setTestMessage] = useState('你好，请帮我测试一下流式响应')
  const { isStreaming, streamingMessage, sendStreamMessage, error } = useAIStream()
  const { createConversation, currentConversation } = useAI()

  const handleTest = async () => {
    if (!testMessage.trim()) return

    // 如果没有对话，先创建一个
    let conversation = currentConversation
    if (!conversation) {
      conversation = await createConversation('programming')
      if (!conversation) {
        console.error('❌ 创建测试对话失败')
        return
      }
    }

    console.log('🧪 开始测试流式响应...')
    await sendStreamMessage(testMessage, conversation, { mode: 'quick_fix' })
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
      <h3>🧪 AI流式响应测试</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="输入测试消息..."
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #555',
            backgroundColor: '#333',
            color: '#fff'
          }}
        />
      </div>

      <button
        onClick={handleTest}
        disabled={isStreaming}
        style={{
          padding: '10px 20px',
          backgroundColor: isStreaming ? '#666' : '#007acc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isStreaming ? 'not-allowed' : 'pointer'
        }}
      >
        {isStreaming ? '🔄 发送中...' : '🚀 测试流式响应'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ff4444', 
          borderRadius: '4px' 
        }}>
          ❌ 错误: {error}
        </div>
      )}

      {streamingMessage && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#333', 
          borderRadius: '4px',
          minHeight: '50px',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>🤖 AI回复:</strong>
          <div style={{ marginTop: '5px' }}>
            {streamingMessage}
            {isStreaming && <span className="cursor">|</span>}
          </div>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
        💡 打开浏览器控制台查看详细日志
      </div>

      <style>{`
        .cursor {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default AIStreamTest 