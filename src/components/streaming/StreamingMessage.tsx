import React, { useEffect, useState } from 'react'

interface StreamingMessageProps {
  content: string
  isComplete?: boolean
  onExpandToggle?: () => void
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  isComplete = false,
  onExpandToggle 
}) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [isLoadingFull, setIsLoadingFull] = useState(false)

  // 检测是否为预览消息（以...结尾且长度>=150）
  const isActualPreview = content.endsWith('...') && content.length >= 150

  useEffect(() => {
    // 简化逻辑：如果是完成状态，直接显示全部内容
    if (isComplete) {
      setDisplayedContent(content)
      return
    }

    // 如果是预览，立即显示预览内容  
    if (isActualPreview) {
      setDisplayedContent(content)
      return
    }

    // 打字机效果（流式响应时）
    if (content && !isComplete) {
      setDisplayedContent('')
      let index = 0
      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1))
          index++
        } else {
          clearInterval(timer)
        }
      }, 20)

      return () => clearInterval(timer)
    }
  }, [content, isComplete, isActualPreview])

  // 处理展开/收起
  const handleExpandToggle = () => {
    if (onExpandToggle) {
      setIsLoadingFull(true)
      onExpandToggle()
      setTimeout(() => setIsLoadingFull(false), 2000)
    }
  }

  return (
    <>      
      {/* 消息文本 - 恢复正常样式 */}
      <div 
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          color: '#ffffff',
          lineHeight: 1.6,
          position: 'relative'
        }}
      >
        {displayedContent}
        
        {/* 正在输入指示器 */}
        {!isComplete && !isActualPreview && (
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '16px',
              backgroundColor: '#10b981',
              marginLeft: '2px',
              marginBottom: '-2px',
              animation: 'blink 1s infinite'
            }}
          />
        )}
      </div>

      {/* 预览状态提示 */}
      {isActualPreview && (
        <div 
          style={{ 
            marginTop: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          {isLoadingFull ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderTop: '2px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <span>正在加载完整内容...</span>
            </div>
          ) : (
            <button
              onClick={handleExpandToggle}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                padding: '0'
              }}
            >
              ▼ 查看完整内容
            </button>
          )}
        </div>
      )}

      {/* 消息时间 */}
      <div 
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '4px',
          fontWeight: '500',
          textAlign: 'right'
        }}
      >
        {new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>

      {/* CSS动画 */}
      <style dangerouslySetInnerHTML={{ 
        __html: `
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` 
      }} />
    </>
  )
}

export default StreamingMessage 