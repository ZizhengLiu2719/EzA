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
    <div className="streaming-message">
      <div className="message-content">
        {displayedContent}
        {isStreaming && !isComplete && (
          <span className="typing-cursor animate-pulse ml-1">▋</span>
        )}
      </div>
      
      {/* 流式状态指示器 */}
      {isStreaming && (
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="ml-2">AI正在思考...</span>
        </div>
      )}
    </div>
  )
}

export default StreamingMessage 