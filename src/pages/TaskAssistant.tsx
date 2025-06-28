import AIQuickPrompts from '@/components/AIQuickPrompts'
import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useAI } from '@/hooks/useAI'
import { useTasks } from '@/hooks/useTasks'
import { AIAssistantConfig, Task } from '@/types'
import { formatDateTime } from '@/utils'
import { LucideBot, LucideLightbulb, LucideMessageSquare, LucidePlus, LucideRefreshCw, LucideSend, LucideSettings, LucideUser } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './TaskAssistant.module.css'

const TaskAssistant = () => {
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    aiConfig,
    createConversation,
    selectConversation,
    sendMessage,
    updateAIConfig,
    getAIModeOptions,
    getCurrentConfigDescription,
    clearError
  } = useAI()

  const { tasks, fetchTasks } = useTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [showTaskSelector, setShowTaskSelector] = useState(false)
  const [showQuickPrompts, setShowQuickPrompts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 加载任务数据
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // 处理发送消息
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || loading) return

    const message = inputMessage.trim()
    setInputMessage('')

    // 如果没有当前对话，创建一个新的
    if (!currentConversation) {
      // 根据选中的任务类型确定assistant_type
      const assistantType = selectedTask?.type === 'writing' ? 'writing' :
                           selectedTask?.type === 'assignment' || selectedTask?.type === 'exam' || selectedTask?.type === 'quiz' ? 'stem' :
                           selectedTask?.type === 'reading' ? 'reading' : 'programming'
      
      const newConversation = await createConversation(assistantType, selectedTask?.id)
      if (!newConversation) return
    }

    // 发送消息
    await sendMessage(message)
  }, [inputMessage, loading, currentConversation, createConversation, sendMessage, selectedTask])

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

  return (
    <div className={styles.assistant}>
      <BackToDashboardButton />
      
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>AI 学习助理</h1>
            <p>让AI成为你的专属学习导师，提供个性化指导</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.configBtn}
              onClick={() => setShowConfig(!showConfig)}
            >
              <LucideSettings size={20} />
              AI配置
            </button>
            <button 
              className={styles.quickPromptsBtn}
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            >
              <LucideLightbulb size={20} />
              快速提示
            </button>
            <button 
              className={styles.newChatBtn}
              onClick={handleNewConversation}
              disabled={loading}
            >
              <LucidePlus size={20} />
              新对话
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={clearError}>×</button>
          </div>
        )}

        <div className={styles.assistantContent}>
          {/* 左侧边栏 */}
          <div className={styles.sidebar}>
            {/* 任务选择器 */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>选择任务</h3>
                <button 
                  className={styles.toggleBtn}
                  onClick={() => setShowTaskSelector(!showTaskSelector)}
                >
                  {showTaskSelector ? '收起' : '展开'}
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
                  <h4>当前任务</h4>
                  <div className={styles.taskCard}>
                    <div className={styles.taskCardHeader}>
                      <span className={styles.taskCardIcon}>
                        {getTaskTypeIcon(selectedTask.type)}
                      </span>
                      <span className={styles.taskCardTitle}>{selectedTask.title}</span>
                    </div>
                    <p className={styles.taskCardDesc}>{selectedTask.description}</p>
                    <div className={styles.taskCardMeta}>
                      <span>截止: {formatDateTime(selectedTask.due_date)}</span>
                      <span>优先级: {selectedTask.priority}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI模式选择 */}
            <div className={styles.section}>
              <h3>AI 模式</h3>
              <div className={styles.modeList}>
                {getAIModeOptions().map((mode) => (
                  <div 
                    key={mode.value}
                    className={`${styles.modeItem} ${aiConfig.mode === mode.value ? styles.selected : ''}`}
                    onClick={() => handleConfigChange({ mode: mode.value as any })}
                  >
                    <span className={styles.modeIcon}>{mode.icon}</span>
                    <div className={styles.modeInfo}>
                      <span className={styles.modeName}>{mode.label}</span>
                      <span className={styles.modeDesc}>{mode.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 对话历史 */}
            <div className={styles.section}>
              <h3>对话历史</h3>
              <div className={styles.conversationList}>
                {conversations.map((conversation) => (
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
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 主聊天区域 */}
          <div className={styles.mainContent}>
            <div className={styles.chatContainer}>
              {/* 聊天头部 */}
              <div className={styles.chatHeader}>
                <div className={styles.chatInfo}>
                  <h2>AI 对话</h2>
                  <p>{getCurrentConfigDescription()}</p>
                </div>
                <div className={styles.chatActions}>
                  {loading && (
                    <div className={styles.loadingIndicator}>
                      <LucideRefreshCw size={16} className={styles.spinning} />
                      AI思考中...
                    </div>
                  )}
                </div>
              </div>

              {/* 消息列表 */}
              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <LucideBot size={48} />
                    </div>
                    <h3>开始你的AI学习之旅</h3>
                    <p>选择一个任务，然后告诉我你需要什么帮助</p>
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
                          <div className={styles.messageText}>
                            {message.content}
                          </div>
                          <div className={styles.messageTime}>
                            {formatDateTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    placeholder="描述你的问题或需求..."
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
                  按 Enter 发送，Shift + Enter 换行
                </div>
              </div>
            </div>
          </div>

          {/* AI配置面板 */}
          {showConfig && (
            <div className={styles.configPanel}>
              <div className={styles.configHeader}>
                <h3>AI 配置</h3>
                <button 
                  onClick={() => setShowConfig(false)}
                  className={styles.closeBtn}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.configContent}>
                <div className={styles.configSection}>
                  <h4>写作风格</h4>
                  <div className={styles.configOptions}>
                    {['academic', 'creative', 'technical'].map((style) => (
                      <label key={style} className={styles.configOption}>
                        <input
                          type="radio"
                          name="writing_style"
                          value={style}
                          checked={aiConfig.writing_style === style}
                          onChange={(e) => handleConfigChange({ writing_style: e.target.value as any })}
                        />
                        <span>{style === 'academic' ? '学术' : style === 'creative' ? '创意' : '技术'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.configSection}>
                  <h4>引用格式</h4>
                  <div className={styles.configOptions}>
                    {['mla', 'apa', 'chicago'].map((format) => (
                      <label key={format} className={styles.configOption}>
                        <input
                          type="radio"
                          name="citation_format"
                          value={format}
                          checked={aiConfig.citation_format === format}
                          onChange={(e) => handleConfigChange({ citation_format: e.target.value as any })}
                        />
                        <span>{format.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.configSection}>
                  <h4>难度级别</h4>
                  <div className={styles.configOptions}>
                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                      <label key={level} className={styles.configOption}>
                        <input
                          type="radio"
                          name="difficulty_level"
                          value={level}
                          checked={aiConfig.difficulty_level === level}
                          onChange={(e) => handleConfigChange({ difficulty_level: e.target.value as any })}
                        />
                        <span>
                          {level === 'beginner' ? '初学者' : 
                           level === 'intermediate' ? '中级' : '高级'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 快速提示面板 */}
          {showQuickPrompts && (
            <div className={styles.quickPromptsPanel}>
              <AIQuickPrompts
                onSelectPrompt={handleQuickPromptSelect}
                currentCategory={selectedTask?.type}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskAssistant 