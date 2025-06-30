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

  // 调试信息
  console.log('🔍 StreamingMessage props:', { 
    content: content.substring(0, 100) + '...', 
    contentLength: content.length,
    isComplete, 
    isActualPreview 
  })

  useEffect(() => {
    console.log('🔄 StreamingMessage useEffect triggered:', { content, isComplete, isActualPreview })
    
    // 简化逻辑：如果是完成状态，直接显示全部内容
    if (isComplete) {
      setDisplayedContent(content)
      console.log('✅ 设置完成状态内容:', content.length)
      return
    }

    // 如果是预览，立即显示预览内容  
    if (isActualPreview) {
      setDisplayedContent(content)
      console.log('📄 设置预览内容:', content.length)
      return
    }

    // 打字机效果（流式响应时）
    if (content && !isComplete) {
      console.log('⌨️ 开始打字机效果')
      setDisplayedContent('')
      let index = 0
      const timer = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1))
          index++
        } else {
          clearInterval(timer)
          console.log('✅ 打字机效果完成')
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

  console.log('🖼️ 即将渲染内容:', displayedContent.length)

  return (
    <>      
      {/* 消息文本 - 确保内容能显示 */}
      <div 
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          color: '#ffffff',
          lineHeight: 1.6,
          position: 'relative',
          minHeight: '20px', // 确保有最小高度
          border: '1px solid rgba(255,255,255,0.1)', // 临时调试边框
          padding: '8px' // 临时调试内边距
        }}
      >
        {displayedContent || '⚠️ 内容为空'}
        
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

      {/* 调试信息 */}
      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
        Debug: content.length={content.length}, displayed.length={displayedContent.length}, isComplete={isComplete.toString()}
      </div>

      {/* 预览状态提示 */}
      {isActualPreview && (
        <div 
          style={{ 
            marginTop: '12px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          {isLoadingFull ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderTop: '2px solid #3b82f6',
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
                color: '#3b82f6',
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

      {/* 状态指示器 */}
      <div 
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '4px',
          fontWeight: '500'
        }}
      >
        {isActualPreview && '📄 预览模式'}
        {isComplete && !isActualPreview && '✅ 完成'}
        {!isComplete && !isActualPreview && '⏳ 正在输入...'}
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