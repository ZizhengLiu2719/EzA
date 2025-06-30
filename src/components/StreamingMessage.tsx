import { useEffect, useState } from 'react'

interface StreamingMessageProps {
  content: string
  isComplete: boolean
  isStreaming: boolean
  onAnimationComplete?: () => void
}

export function StreamingMessage({ 
  content, 
  isComplete, 
  isStreaming,
  onAnimationComplete 
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  // 打字机效果配置
  const TYPING_SPEED = 15 // 毫秒/字符，更快的打字速度
  const CHUNK_SIZE = 1 // 每次显示的字符数

  useEffect(() => {
    if (!isStreaming && isComplete) {
      // 如果不是流式状态且已完成，直接显示全部内容
      setDisplayedContent(content)
      setCurrentIndex(content.length)
      onAnimationComplete?.()
      return
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        const nextIndex = Math.min(currentIndex + CHUNK_SIZE, content.length)
        setDisplayedContent(content.slice(0, nextIndex))
        setCurrentIndex(nextIndex)
      }, TYPING_SPEED)

      return () => clearTimeout(timer)
    } else if (isComplete && currentIndex >= content.length) {
      // 打字动画完成
      onAnimationComplete?.()
    }
  }, [content, currentIndex, isComplete, isStreaming, onAnimationComplete])

  // 当内容更新时，继续从当前位置显示
  useEffect(() => {
    if (content.length > displayedContent.length && isStreaming) {
      // 继续打字机效果
      setCurrentIndex(displayedContent.length)
    }
  }, [content, displayedContent.length, isStreaming])

  return (
    <div 
      className="streaming-message"
      style={{
        color: '#ffffff',
        lineHeight: '1.6',
        fontSize: '14px',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
    >
      <div className="message-content">
        {displayedContent}
        {isStreaming && !isComplete && (
          <span 
            className="typing-cursor" 
            style={{
              color: '#6366f1',
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }}
          >▋</span>
        )}
      </div>
      
      {/* 流式状态指示器 */}
      {isStreaming && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <div 
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6366f1',
                borderRadius: '50%',
                animation: 'bounce 1.4s infinite ease-in-out'
              }}
            ></div>
            <div 
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6366f1',
                borderRadius: '50%',
                animation: 'bounce 1.4s infinite ease-in-out 0.2s'
              }}
            ></div>
            <div 
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6366f1',
                borderRadius: '50%',
                animation: 'bounce 1.4s infinite ease-in-out 0.4s'
              }}
            ></div>
          </div>
          <span style={{ marginLeft: '8px' }}>AI正在思考...</span>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          }
          40% { 
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default StreamingMessage 