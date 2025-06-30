import { aiConversationApi } from '@/api/ai'
import AIModeSelector from '@/components/AIModeSelector'
import BackToDashboardButton from '@/components/BackToDashboardButton'
import SmartAIConfig from '@/components/SmartAIConfig'
import SmartPrompts from '@/components/SmartPrompts'
import StreamingMessage from '@/components/streaming/StreamingMessage'
import VersionSwitcher from '@/components/VersionSwitcher'
import { useAI } from '@/hooks/useAI'
import { useAIStream } from '@/hooks/useAIStream'
import { useTasks } from '@/hooks/useTasks'
import { useVersionMode } from '@/hooks/useVersionMode'
import { AIAssistantConfig, EnhancedAIConfig, Task } from '@/types'
import { formatDateTime } from '@/utils'
import { LucideBot, LucideChevronDown, LucideLightbulb, LucideMessageSquare, LucidePlus, LucideRefreshCw, LucideSend, LucideSettings, LucideSquare, LucideTrash2, LucideUser } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import SubscriptionStatus from '../components/SubscriptionStatus'
import styles from './TaskAssistant.module.css'

const TaskAssistant = () => {
  // Initialize version mode management
  const versionMode = useVersionMode(13) // Default to college freshman

  const {
    conversations,
    currentConversation,
    messages,
    loading: classicLoading,
    error: classicError,
    aiConfig,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    deleteAllConversations,
    sendMessageFast,
    updateAIConfig,
    getAIModeOptions,
    getCurrentConfigDescription,
    clearError,
    forceResetLoading,
    addMessage
  } = useAI()

  const {
    isStreaming,
    streamingMessage,
    sendStreamMessage,
    stopStreaming,
    error: streamError,
    clearError: clearStreamError,
    clearStreamingMessage
  } = useAIStream()

  const { tasks, fetchTasks } = useTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const [useStreamMode, setUseStreamMode] = useState(false)
  const [showVersionSelector, setShowVersionSelector] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  
  // Enhanced AI Configuration State - 使用默认值避免循环依赖
  const [enhancedConfig, setEnhancedConfig] = useState<EnhancedAIConfig>({
    auto_adjust_difficulty: true,
    adaptive_language: true,
    academic_level_config: {
      high_school: {
        max_complexity: 'intermediate',
        preferred_explanation_style: 'step_by_step',
        vocabulary_level: 'grade_appropriate'
      },
      college: {
        max_complexity: 'advanced',
        preferred_explanation_style: 'analytical',
        vocabulary_level: 'academic'
      }
    },
    mode_specific_config: {
      response_length: 'detailed',
      interaction_style: 'conversational',
      feedback_frequency: 'moderate'
    },
    writing_style: 'academic',
    citation_format: 'apa',
    difficulty_level: 'intermediate',
    model: 'gpt-3.5-turbo'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const configDropdownRef = useRef<HTMLDivElement>(null)
  const promptsDropdownRef = useRef<HTMLDivElement>(null)
  const versionDropdownRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  const loading = useStreamMode ? isStreaming : classicLoading
  const error = useStreamMode ? streamError : classicError

  // 初始化enhancedConfig与aiConfig同步 - 只在初始化时同步一次
  useEffect(() => {
    setEnhancedConfig(prev => ({
      ...prev,
      writing_style: aiConfig.writing_style || prev.writing_style,
      citation_format: aiConfig.citation_format || prev.citation_format,
      difficulty_level: aiConfig.difficulty_level || prev.difficulty_level,
      model: aiConfig.model || prev.model
    }))
  }, []) // 空依赖数组，只在组件挂载时执行一次

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
        setShowConfig(false)
      }
      if (promptsDropdownRef.current && !promptsDropdownRef.current.contains(event.target as Node)) {
        setShowQuickPrompts(false)
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target as Node)) {
        setShowVersionSelector(false)
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 加载任务数据
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 处理发送消息（支持流式和非流式模式）
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || loading) return

    const message = inputMessage.trim()
    
    // 🚀 性能优化：立即清空输入框和显示用户消息，给用户即时反馈
    setInputMessage('')

    // 确定要使用的对话
    let conversationToUse = currentConversation

    // 如果没有当前对话，创建一个新的
    if (!conversationToUse) {
      // 根据选中的任务类型确定assistant_type
      const assistantType = selectedTask?.type === 'writing' ? 'writing' :
                           selectedTask?.type === 'assignment' || selectedTask?.type === 'exam' || selectedTask?.type === 'quiz' ? 'stem' :
                           selectedTask?.type === 'reading' ? 'reading' : 'programming'
      
      const newConversation = await createConversation(assistantType, selectedTask?.id)
      if (!newConversation) {
        // 如果创建对话失败，恢复输入框内容
        setInputMessage(message)
        return
      }
      
      conversationToUse = newConversation
    }

    // 🚀 立即添加用户消息到界面，无需等待任何网络操作
    const userMessage = {
      id: `user_${Date.now()}`,
      conversation_id: conversationToUse.id,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    }
    addMessage(userMessage)
    console.log('⚡ 用户消息已立即显示')

    if (useStreamMode && conversationToUse) {
      // 使用优化后的流式响应 - AI调用几乎立即开始
      try {
        await sendStreamMessage(message, conversationToUse, aiConfig, async (fullContent: string) => {
          // 流式完成后直接添加到消息列表
          console.log('✅ 流式响应完成，添加AI消息')
          
          const newAIMessage = {
            id: `ai_${Date.now()}`,
            conversation_id: conversationToUse.id,
            role: 'assistant' as const,
            content: fullContent,
            timestamp: new Date().toISOString()
          }
          
          addMessage(newAIMessage)
          clearStreamingMessage()
          console.log('🎉 对话流程完成')
        })
      } catch (error) {
        console.error('❌ 流式消息发送失败:', error)
        // 可以选择是否移除已显示的用户消息或显示错误状态
      }
    } else {
      // 使用优化的普通模式（非流式）
      try {
        console.log('🔄 开始普通模式AI对话')
        await sendMessageFast(message, conversationToUse, userMessage)
        console.log('✅ 普通AI响应完成')
      } catch (error) {
        console.error('❌ 普通消息发送失败:', error)
        setInputMessage(message) // 恢复输入内容
        // 可以选择移除用户消息或显示错误状态
      }
    }
  }, [inputMessage, loading, currentConversation, createConversation, selectedTask, useStreamMode, sendStreamMessage, sendMessageFast, aiConfig, addMessage, clearStreamingMessage])

  // 处理快速提示选择
  const handleQuickPromptSelect = useCallback((prompt: string) => {
    setInputMessage(prompt)
    setShowQuickPrompts(false)
    // 聚焦到输入框
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  // 处理回车发送
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // 创建新对话
  const handleNewConversation = useCallback(async () => {
    const assistantType = selectedTask?.type === 'writing' ? 'writing' :
                         selectedTask?.type === 'assignment' ? 'stem' :
                         selectedTask?.type === 'reading' ? 'reading' : 'programming'
    
    await createConversation(assistantType, selectedTask?.id)
  }, [createConversation, selectedTask])

  // 更新AI配置
  const handleConfigChange = useCallback((config: Partial<AIAssistantConfig>) => {
    updateAIConfig(config)
  }, [updateAIConfig])

  // 清除错误（同时清除两种模式的错误）
  const handleClearError = useCallback(() => {
    clearError()
    clearStreamError()
    clearStreamingMessage()
  }, [clearError, clearStreamError, clearStreamingMessage])

  // 停止流式响应
  const handleStopStreaming = useCallback(() => {
    stopStreaming()
  }, [stopStreaming])

  // 删除对话 - 优化版本，更流畅的体验
  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // 防止触发选择对话
    
    try {
      const result = await deleteConversation(conversationId)
      if (!result.success && result.error) {
        // 只在真正失败时显示错误，乐观更新已经处理了UI
        console.error('Failed to delete conversation:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }, [deleteConversation])

  // 删除所有对话 - 保留确认对话框，因为这是重要操作
  const handleDeleteAllConversations = useCallback(async () => {
    if (conversations.length === 0) {
      alert('No conversations to delete.')
      return
    }

    if (window.confirm(`Are you sure you want to delete ALL ${conversations.length} conversations? This action cannot be undone.`)) {
      try {
        const result = await deleteAllConversations()
        if (result.success) {
          // 成功消息是可选的，因为UI已经乐观更新
          console.log(`Successfully deleted ${result.deletedCount} conversations.`)
        } else {
          console.error('Failed to delete all conversations:', result.error)
          alert('Failed to delete conversations. Please try again.')
        }
      } catch (error) {
        console.error('Failed to delete all conversations:', error)
        alert('Failed to delete conversations. Please try again.')
      }
    }
  }, [deleteAllConversations, conversations.length])

  // 获取任务类型图标
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'writing': return '✍️'
      case 'reading': return '📚'
      case 'assignment': return '📝'
      case 'exam': return '📊'
      case 'quiz': return '❓'
      case 'project': return '🎯'
      case 'presentation': return '🎤'
      default: return '📋'
    }
  }

  // 获取任务状态颜色
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'in_progress': return '#f59e0b'
      case 'overdue': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // 模拟用户订阅状态
  const [userSubscription] = useState({
    plan: 'free' as const,
    usageStats: {
      monthly_conversations_used: 15,
      monthly_courses_used: 2,
      monthly_conversations_limit: 50,
      monthly_courses_limit: 5
    }
  })

  // 🚀 获取消息的完整内容
  const getMessageFullContent = useCallback(async (messageId: string) => {
    try {
      const response = await aiConversationApi.getMessageFullContent(messageId)
      if (!response.error && response.data) {
        // 更新消息列表中的该消息 - 通过重新获取对话消息
        if (currentConversation) {
          await selectConversation(currentConversation.id)
        }
        
        console.log('✅ 完整内容已加载:', messageId)
      }
    } catch (err: any) {
      console.error('❌ 获取完整内容失败:', err)
      // 使用正确的错误处理方式，或者可以显示一个toast通知
      console.warn(`获取完整内容失败: ${err.message}`)
    }
  }, [currentConversation, selectConversation])

  return (
    <div className={styles.assistant}>
      <div className={styles.header}>
        {/* 顶层导航 */}
        <div className={styles.topNav}>
          <div className={styles.headerContent}>
            <h1>AI Learning Assistant</h1>
            <p>Your personalized tutor for every subject</p>
          </div>
          <div className={styles.navActions}>
            <BackToDashboardButton />
          </div>
        </div>

        {/* 底层工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {/* Stream/Normal模式切换 */}
            <div className={styles.streamModeToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={useStreamMode}
                  onChange={(e) => setUseStreamMode(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
                <span className={styles.toggleText}>🚀 Stream Mode</span>
              </label>
            </div>
          </div>

          <div className={styles.toolbarCenter}>
            {/* 错误提示 */}
            {error && (
              <div className={styles.errorMessage}>
                <span>⚠️ {error}</span>
                <button onClick={handleClearError} className={styles.clearErrorBtn}>
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className={styles.toolbarRight}>
            {/* AI Config Dropdown */}
            <div className={styles.dropdown} ref={configDropdownRef}>
              <button 
                className={`${styles.toolbarBtn} ${showConfig ? styles.active : ''}`}
                onClick={() => {
                  setShowConfig(!showConfig)
                  setShowQuickPrompts(false)
                }}
              >
                <LucideSettings size={18} />
                <span>Config</span>
                <LucideChevronDown size={14} className={`${styles.chevron} ${showConfig ? styles.chevronUp : ''}`} />
              </button>
              {showConfig && (
                <div className={styles.dropdownContent}>
                  <SmartAIConfig
                    currentMode={versionMode.selectedModeId || 'study_buddy'}
                    onConfigChange={(configUpdate) => {
                      setEnhancedConfig(prev => ({ ...prev, ...configUpdate }))
                      // Also update legacy aiConfig for backward compatibility
                      const legacyUpdate: Partial<AIAssistantConfig> = {}
                      if (configUpdate.writing_style) {
                        legacyUpdate.writing_style = configUpdate.writing_style
                      }
                      if (configUpdate.citation_format) {
                        legacyUpdate.citation_format = configUpdate.citation_format
                      }
                      if (configUpdate.difficulty_level) {
                        legacyUpdate.difficulty_level = configUpdate.difficulty_level
                      }
                      if (configUpdate.model) {
                        legacyUpdate.model = configUpdate.model
                      }
                      
                      // 只在有更新时才调用
                      if (Object.keys(legacyUpdate).length > 0) {
                        handleConfigChange(legacyUpdate)
                      }
                    }}
                    currentConfig={enhancedConfig}
                  />
                </div>
              )}
            </div>

            {/* Quick Prompts Dropdown */}
            <div className={styles.dropdown} ref={promptsDropdownRef}>
              <button 
                className={`${styles.toolbarBtn} ${styles.quickPromptsBtn} ${showQuickPrompts ? styles.active : ''}`}
                onClick={() => {
                  setShowQuickPrompts(!showQuickPrompts)
                  setShowConfig(false)
                }}
              >
                <LucideLightbulb size={18} />
                <span>Prompts</span>
                <LucideChevronDown size={14} className={`${styles.chevron} ${showQuickPrompts ? styles.chevronUp : ''}`} />
              </button>
              {showQuickPrompts && (
                <div className={styles.dropdownContent}>
                  <SmartPrompts 
                    currentMode={versionMode.selectedModeId || 'study_buddy'}
                    onSelectPrompt={handleQuickPromptSelect}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <button 
              className={styles.newChatBtn}
              onClick={handleNewConversation}
              disabled={loading}
              title="开始新对话"
            >
              <LucidePlus size={18} />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.assistantContent}>
        {/* 左侧边栏 */}
        <div className={styles.sidebar}>
          {/* 任务选择器 - 保持固定在顶部 */}
          <div className={`${styles.section} ${styles.taskSelectorSection}`}>
            <div className={styles.sectionHeader}>
              <h3>Select Task</h3>
              <button 
                className={styles.toggleBtn}
                onClick={() => setShowTaskSelector(!showTaskSelector)}
              >
                {showTaskSelector ? 'Collapse' : 'Expand'}
              </button>
            </div>
            
            {showTaskSelector && (
              <div className={styles.taskList}>
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`${styles.taskItem} ${selectedTask?.id === task.id ? styles.selected : ''}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className={styles.taskIcon}>
                      {getTaskTypeIcon(task.type)}
                    </div>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskTitle}>{task.title}</div>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskType}>{task.type}</span>
                        <span className={styles.taskDue}>
                          {formatDateTime(task.due_date)}
                        </span>
                      </div>
                    </div>
                    <div 
                      className={styles.taskStatus}
                      style={{ backgroundColor: getTaskStatusColor(task.status) }}
                    />
                  </div>
                ))}
              </div>
            )}

            {selectedTask && (
              <div className={styles.selectedTaskInfo}>
                <h4>Current Task</h4>
                <div className={styles.taskCard}>
                  <div className={styles.taskCardHeader}>
                    <span className={styles.taskCardIcon}>
                      {getTaskTypeIcon(selectedTask.type)}
                    </span>
                    <span className={styles.taskCardTitle}>{selectedTask.title}</span>
                  </div>
                  <p className={styles.taskCardDesc}>{selectedTask.description}</p>
                  <div className={styles.taskCardMeta}>
                    <span>Due: {formatDateTime(selectedTask.due_date)}</span>
                    <span>Priority: {selectedTask.priority}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI模式选择 - 添加滚动容器 */}
          <div className={styles.aiModeContainer}>
            <div className={styles.section}>
              {/* Version Switcher */}
              <VersionSwitcher
                currentVersion={versionMode.currentVersion}
                onVersionChange={versionMode.switchVersion}
                userGrade={versionMode.userGrade}
                disabled={loading}
              />

              {/* AI Mode Selector */}
              <AIModeSelector
                availableModes={versionMode.availableModes}
                selectedModeId={versionMode.selectedModeId}
                onModeSelect={versionMode.selectMode}
                academicVersion={versionMode.currentVersion}
                userGrade={versionMode.userGrade}
                disabled={loading}
                showExamples={true}
              />

              {/* Current Configuration Display */}
              <div className={styles.currentConfig}>
                <div className={styles.configTitle}>Current Setup</div>
                <div className={styles.configDetails}>
                  <div className={styles.configItem}>
                    <span className={styles.configLabel}>Version:</span>
                    <span className={styles.configValue}>
                      {versionMode.currentVersion === 'high_school' ? 'High School' : 'College'}
                    </span>
                  </div>
                  {versionMode.userGrade && (
                    <div className={styles.configItem}>
                      <span className={styles.configLabel}>Grade:</span>
                      <span className={styles.configValue}>
                        {versionMode.userGrade <= 12 ? `Grade ${versionMode.userGrade}` : `Year ${versionMode.userGrade - 12}`}
                      </span>
                    </div>
                  )}
                  {versionMode.selectedMode && (
                    <div className={styles.configItem}>
                      <span className={styles.configLabel}>Mode:</span>
                      <span className={styles.configValue}>
                        {versionMode.selectedMode.icon} {versionMode.selectedMode.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 主聊天区域 */}
        <div className={styles.mainContent}>
          <div className={styles.chatContainer}>
            {/* 聊天头部 */}
            <div className={styles.chatHeader}>
              <div className={styles.chatInfo}>
                <h2>
                  AI Chat
                  <span className={styles.modeBadge}>
                    {useStreamMode ? '🚀 STREAM' : '📝 NORMAL'}
                  </span>
                </h2>
                <p>{getCurrentConfigDescription()}</p>
              </div>
              <div className={styles.modeToggle}>
                <button
                  className={`${styles.modeToggleBtn} ${useStreamMode ? styles.active : ''}`}
                  onClick={() => setUseStreamMode(true)}
                  title="流式响应模式 - 实时打字效果"
                >
                  🚀 Stream
                </button>
                <button
                  className={`${styles.modeToggleBtn} ${!useStreamMode ? styles.active : ''}`}
                  onClick={() => setUseStreamMode(false)}
                  title="普通响应模式 - 瞬间显示完整回复"
                >
                  📝 Normal
                </button>
              </div>
              <div className={styles.chatActions}>
                {loading && (
                  <div className={styles.loadingIndicator}>
                    <LucideRefreshCw size={16} className={styles.spinning} />
                    {useStreamMode ? 'AI streaming...' : 'AI thinking...'}
                    {useStreamMode && (
                      <button 
                        onClick={handleStopStreaming}
                        style={{
                          marginLeft: '10px',
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="停止流式响应"
                      >
                        <LucideSquare size={12} />
                        Stop
                      </button>
                    )}
                    {!useStreamMode && (
                      <button 
                        onClick={forceResetLoading}
                        style={{
                          marginLeft: '10px',
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="重置AI状态"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 消息列表 */}
            <div className={styles.messagesContainer}>
              {messages.length === 0 && !isStreaming ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <LucideBot size={48} />
                  </div>
                  <h3>Start your AI learning journey</h3>
                  <p>Ask a question or select a task to begin your conversation</p>
                  {useStreamMode && (
                    <div className={styles.streamModeInfo}>
                      <span className={styles.streamIcon}>🚀</span>
                      <p>Stream Mode enabled - Experience ChatGPT-like real-time responses!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.aiMessage}`}
                    >
                      <div className={styles.messageAvatar}>
                        {message.role === 'user' ? (
                          <LucideUser size={20} />
                        ) : (
                          <LucideBot size={20} />
                        )}
                      </div>
                      <div className={styles.messageContent}>
                        {message.role === 'assistant' ? (
                          // AI消息使用StreamingMessage组件处理预览
                          <StreamingMessage
                            content={message.content}
                            isComplete={true}
                            onExpandToggle={() => getMessageFullContent(message.id)}
                          />
                        ) : (
                          // 用户消息保持原样
                          <>
                            <div className={styles.messageText}>
                              {message.content}
                            </div>
                            <div className={styles.messageTime}>
                              {formatDateTime(message.timestamp)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* 流式响应消息 */}
                  {isStreaming && streamingMessage && (
                    <div className={`${styles.message} ${styles.aiMessage} ${styles.streamingMessage}`}>
                      <div className={styles.messageAvatar}>
                        <LucideBot size={20} />
                      </div>
                      <div className={styles.messageContent}>
                        <StreamingMessage
                          content={streamingMessage}
                          isComplete={false}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 输入区域 */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={useStreamMode ? "Experience instant AI responses..." : "Describe your question or need..."}
                  rows={1}
                  disabled={loading}
                  className={styles.messageInput}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className={styles.sendButton}
                >
                  <LucideSend size={20} />
                </button>
              </div>
              <div className={styles.inputHint}>
                Press Enter to send, Shift + Enter for new line
                {useStreamMode && <span className={styles.streamHint}> • 🚀 Stream Mode Active</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧状态栏 */}
        <div className={styles.rightSidebar}>
          <SubscriptionStatus 
            currentPlan={userSubscription.plan}
            usageStats={userSubscription.usageStats}
          />
          
          {/* Chat History - 移到右侧 */}
          <div className={`${styles.section} ${styles.chatHistorySection}`}>
            <div className={styles.sectionHeader}>
              <h3>Chat History</h3>
              <div className={styles.chatHistoryActions}>
                <button 
                  className={styles.newChatBtn}
                  onClick={handleNewConversation}
                  title="Start new conversation"
                >
                  <LucidePlus size={16} />
                </button>
                {conversations.length > 0 && (
                  <button 
                    className={styles.deleteAllBtn}
                    onClick={handleDeleteAllConversations}
                    title="Delete all conversations"
                  >
                    <LucideTrash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className={`${styles.conversationList} ${styles.chatHistoryContainer}`}>
              {conversations.length === 0 ? (
                <div className={styles.emptyConversations}>
                  <p>No conversations yet.</p>
                  <p>Start a conversation to begin!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className={`${styles.conversationItem} ${currentConversation?.id === conversation.id ? styles.selected : ''}`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <div className={styles.conversationIcon}>
                      <LucideMessageSquare size={16} />
                    </div>
                    <div className={styles.conversationInfo}>
                      <span className={styles.conversationType}>
                        {conversation.assistant_type}
                      </span>
                      <span className={styles.conversationTime}>
                        {formatDateTime(conversation.updated_at)}
                      </span>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      title="Delete conversation"
                    >
                      <LucideTrash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskAssistant 