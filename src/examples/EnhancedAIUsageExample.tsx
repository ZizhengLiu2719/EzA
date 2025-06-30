import { useEnhancedAI } from '@/hooks/useEnhancedAI'
import React, { useEffect, useState } from 'react'

/**
 * 增强AI系统使用示例
 * 展示如何使用新的个性化AI功能
 */
const EnhancedAIUsageExample: React.FC = () => {
  const {
    // 基础功能
    currentConversation,
    messages,
    loading,
    error,
    
    // 增强功能
    aiConfig,
    learningAnalytics,
    cognitiveLoadMetrics,
    
    // 功能方法
    initializeEnhancedAI,
    createEnhancedConversation,
    sendEnhancedMessage,
    analyzeLearningstyle,
    monitorCognitiveLoad,
    generateLearningAnalytics,
    updateAIConfig
  } = useEnhancedAI()

  const [inputMessage, setInputMessage] = useState('')

  // 初始化系统
  useEffect(() => {
    const initSystem = async () => {
      const sessionId = await initializeEnhancedAI('user_123')
      if (sessionId) {
        // 创建数学学习对话
        await createEnhancedConversation(
          'stem', 
          ['Understand algebra fundamentals', 'Solve linear equations'],
          'math_task_1'
        )
      }
    }
    
    initSystem()
  }, [])

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    await sendEnhancedMessage(inputMessage)
    setInputMessage('')
    
    // 每5条消息分析一次学习状态
    if (messages.length % 5 === 0) {
      const styleAnalysis = await analyzeLearningstyle()
      const loadAnalysis = await monitorCognitiveLoad()
      
      console.log('Learning Style Analysis:', styleAnalysis)
      console.log('Cognitive Load Analysis:', loadAnalysis)
    }
  }

  // 调整AI配置
  const handleConfigChange = (newConfig: Partial<typeof aiConfig>) => {
    updateAIConfig({
      ...aiConfig,
      ...newConfig
    })
  }

  // 生成学习报告
  const handleGenerateReport = async () => {
    const report = await generateLearningAnalytics({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    })
    
    console.log('Learning Analytics Report:', report)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧠 Enhanced AI Learning Assistant</h1>
      
      {/* AI配置面板 */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '20px',
        background: '#f8f9fa'
      }}>
        <h3>🎯 AI Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          {/* 学习风格显示 */}
          <div>
            <label>Learning Style:</label>
            <div style={{ 
              padding: '8px', 
              background: '#e3f2fd', 
              borderRadius: '4px',
              margin: '4px 0'
            }}>
              {aiConfig.personalization.learning_style} 
              ({aiConfig.personalization.confidence_level}% confidence)
            </div>
          </div>

          {/* 认知负荷显示 */}
          <div>
            <label>Cognitive Load:</label>
            <div style={{ 
              padding: '8px', 
              background: getLoadColor(aiConfig.cognitive_load.current_level), 
              borderRadius: '4px',
              margin: '4px 0'
            }}>
              {aiConfig.cognitive_load.current_level}
            </div>
          </div>

          {/* 教学强度调节 */}
          <div>
            <label>Teaching Intensity: {aiConfig.mode.intensity}%</label>
            <input
              type="range"
              min="20"
              max="100"
              value={aiConfig.mode.intensity}
              onChange={(e) => handleConfigChange({
                mode: { ...aiConfig.mode, intensity: Number(e.target.value) }
              })}
              style={{ width: '100%' }}
            />
          </div>

          {/* 复杂度偏好 */}
          <div>
            <label>Complexity Preference:</label>
            <select
              value={aiConfig.personalization.preferred_complexity}
              onChange={(e) => handleConfigChange({
                personalization: { 
                  ...aiConfig.personalization, 
                  preferred_complexity: e.target.value as any 
                }
              })}
              style={{ width: '100%', padding: '4px' }}
            >
              <option value="simple">Simple</option>
              <option value="moderate">Moderate</option>
              <option value="complex">Complex</option>
            </select>
          </div>
        </div>
      </div>

      {/* 认知负荷监控 */}
      {cognitiveLoadMetrics && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px',
          background: '#fff3cd'
        }}>
          <h3>⚡ Cognitive Load Monitoring</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <strong>Response Delay:</strong><br />
              {cognitiveLoadMetrics.current_metrics.response_delay.toFixed(1)}s
            </div>
            <div>
              <strong>Error Rate:</strong><br />
              {(cognitiveLoadMetrics.current_metrics.error_rate * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Help Requests:</strong><br />
              {cognitiveLoadMetrics.current_metrics.help_requests}
            </div>
          </div>
        </div>
      )}

      {/* 消息界面 */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        height: '400px', 
        overflow: 'auto',
        padding: '16px',
        marginBottom: '20px',
        background: 'white'
      }}>
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            style={{ 
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: message.role === 'user' ? '#e3f2fd' : '#f1f8e9'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
            </div>
            <div>{message.content}</div>
            
            {/* 显示AI的教学元数据 */}
            {message.role === 'assistant' && message.educational_metadata && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#666',
                borderTop: '1px solid #ddd',
                paddingTop: '8px'
              }}>
                Teaching Method: {message.educational_metadata.teaching_method_used} | 
                Cognitive Load: {message.educational_metadata.cognitive_load_level} |
                Personalization: {message.educational_metadata.personalization_applied.join(', ')}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            🤖 AI is thinking... (applying personalized teaching methods)
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question... (AI will adapt to your learning style)"
          style={{ 
            flex: 1, 
            padding: '12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px' 
          }}
        />
        <button 
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim()}
          style={{ 
            padding: '12px 24px', 
            background: '#4F46E5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>

      {/* 分析按钮 */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={analyzeLearningstyle}
          style={{ 
            padding: '8px 16px', 
            background: '#10B981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🎯 Analyze Learning Style
        </button>
        
        <button 
          onClick={monitorCognitiveLoad}
          style={{ 
            padding: '8px 16px', 
            background: '#F59E0B', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚡ Check Cognitive Load
        </button>
        
        <button 
          onClick={handleGenerateReport}
          style={{ 
            padding: '8px 16px', 
            background: '#8B5CF6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📊 Generate Report
        </button>
      </div>

      {/* 错误显示 */}
      {error && (
        <div style={{ 
          marginTop: '20px',
          padding: '12px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          Error: {error}
        </div>
      )}

      {/* 学习分析显示 */}
      {learningAnalytics && (
        <div style={{ 
          marginTop: '20px',
          padding: '16px', 
          background: '#f0f8ff', 
          border: '1px solid #b3d9ff',
          borderRadius: '8px'
        }}>
          <h3>📊 Learning Analytics</h3>
          <p><strong>Detected Learning Style:</strong> {learningAnalytics.learning_style_analysis.detected_style}</p>
          <p><strong>Confidence:</strong> {learningAnalytics.learning_style_analysis.confidence_score}%</p>
          <p><strong>Recommendations:</strong></p>
          <ul>
            {learningAnalytics.recommendations.teaching_method_adjustments.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// 辅助函数：获取认知负荷颜色
const getLoadColor = (level: string): string => {
  switch (level) {
    case 'low': return '#d4edda'
    case 'optimal': return '#cce5ff'
    case 'high': return '#fff3cd'
    case 'overload': return '#f8d7da'
    default: return '#e9ecef'
  }
}

export default EnhancedAIUsageExample 