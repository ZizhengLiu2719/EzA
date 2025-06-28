import AIQuickPrompts from '@/components/AIQuickPrompts'
import BackToDashboardButton from '@/components/BackToDashboardButton'
import { useAI } from '@/hooks/useAI'
import { useTasks } from '@/hooks/useTasks'
import { AIAssistantConfig, Task } from '@/types'
import { formatDateTime } from '@/utils'
import { LucideBot, LucideChevronDown, LucideLightbulb, LucideMessageSquare, LucidePlus, LucideRefreshCw, LucideSend, LucideSettings, LucideUser } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import AILearningProgress from '../components/AILearningProgress'
import SubscriptionStatus from '../components/SubscriptionStatus'
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
  const [showProgress, setShowProgress] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 下拉框外部点击关闭的ref
  const configDropdownRef = useRef<HTMLDivElement>(null)
  const promptsDropdownRef = useRef<HTMLDivElement>(null)
  const progressDropdownRef = useRef<HTMLDivElement>(null)

  // 处理外部点击关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target as Node)) {
        setShowConfig(false)
      }
      if (promptsDropdownRef.current && !promptsDropdownRef.current.contains(event.target as Node)) {
        setShowQuickPrompts(false)
      }
      if (progressDropdownRef.current && !progressDropdownRef.current.contains(event.target as Node)) {
        setShowProgress(false)
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

  useEffect(() => {
    // 自动创建第一个对话
    if (conversations.length === 0) {
      createConversation('writing')
    }
  }, [conversations.length, createConversation])

  return (
    <div className={styles.assistant}>
      <BackToDashboardButton />
      
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>AI Learning Assistant</h1>
            <p>Let AI become your personal learning mentor, providing personalized guidance</p>
          </div>
          <div className={styles.headerActions}>
            {/* AI Config Dropdown */}
            <div className={styles.dropdown} ref={configDropdownRef}>
              <button 
                className={`${styles.dropdownBtn} ${showConfig ? styles.active : ''}`}
                onClick={() => {
                  setShowConfig(!showConfig)
                  setShowQuickPrompts(false)
                  setShowProgress(false)
                }}
              >
                <LucideSettings size={20} />
                AI Config
                <LucideChevronDown size={16} className={`${styles.chevron} ${showConfig ? styles.chevronUp : ''}`} />
              </button>
              {showConfig && (
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownHeader}>
                    <h3>AI Configuration</h3>
                  </div>
                  <div className={styles.dropdownBody}>
                    <div className={styles.configSection}>
                      <label>Writing Style</label>
                      <select 
                        value={aiConfig.writing_style || 'academic'}
                        onChange={(e) => handleConfigChange({ writing_style: e.target.value as any })}
                        className={styles.configSelect}
                      >
                        <option value="academic">Academic</option>
                        <option value="creative">Creative</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    <div className={styles.configSection}>
                      <label>Citation Format</label>
                      <select 
                        value={aiConfig.citation_format || 'apa'}
                        onChange={(e) => handleConfigChange({ citation_format: e.target.value as any })}
                        className={styles.configSelect}
                      >
                        <option value="apa">APA</option>
                        <option value="mla">MLA</option>
                        <option value="chicago">Chicago</option>
                      </select>
                    </div>
                    <div className={styles.configSection}>
                      <label>Difficulty Level</label>
                      <select 
                        value={aiConfig.difficulty_level || 'intermediate'}
                        onChange={(e) => handleConfigChange({ difficulty_level: e.target.value as any })}
                        className={styles.configSelect}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Dropdown */}
            <div className={styles.dropdown} ref={promptsDropdownRef}>
              <button 
                className={`${styles.dropdownBtn} ${styles.quickPromptsBtn} ${showQuickPrompts ? styles.active : ''}`}
                onClick={() => {
                  setShowQuickPrompts(!showQuickPrompts)
                  setShowConfig(false)
                  setShowProgress(false)
                }}
              >
                <LucideLightbulb size={20} />
                Quick Prompts
                <LucideChevronDown size={16} className={`${styles.chevron} ${showQuickPrompts ? styles.chevronUp : ''}`} />
              </button>
              {showQuickPrompts && (
                <div className={styles.dropdownContent}>
                  <AIQuickPrompts 
                    onSelectPrompt={handleQuickPromptSelect}
                    currentCategory={selectedTask?.type}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {/* Learning Progress Dropdown */}
            <div className={styles.dropdown} ref={progressDropdownRef}>
              <button 
                className={`${styles.dropdownBtn} ${styles.progressBtn} ${showProgress ? styles.active : ''}`}
                onClick={() => {
                  setShowProgress(!showProgress)
                  setShowConfig(false)
                  setShowQuickPrompts(false)
                }}
              >
                <LucideBot size={20} />
                Learning Progress
                <LucideChevronDown size={16} className={`${styles.chevron} ${showProgress ? styles.chevronUp : ''}`} />
              </button>
              {showProgress && (
                <div className={styles.dropdownContent}>
                  <AILearningProgress />
                </div>
              )}
            </div>

            <button 
              className={styles.newChatBtn}
              onClick={handleNewConversation}
              disabled={loading}
            >
              <LucidePlus size={20} />
              New Chat
            </button>
          </div>
        </div>

        <div className={styles.assistantContent}>
          {/* 左侧边栏 */}
          <div className={styles.sidebar}>
            {/* 任务选择器 */}
            <div className={styles.section}>
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

            {/* AI模式选择 */}
            <div className={styles.section}>
              <h3>AI Mode</h3>
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
            <div className={`${styles.section} ${styles.chatHistorySection}`}>
              <div className={styles.sectionHeader}>
                <h3>Chat History</h3>
                <button 
                  className={styles.newChatBtn}
                  onClick={handleNewConversation}
                  title="Start new conversation"
                >
                  <LucidePlus size={16} />
                </button>
              </div>
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

            {/* 订阅状态 */}
            <SubscriptionStatus 
              currentPlan={userSubscription.plan}
              usageStats={userSubscription.usageStats}
            />
          </div>

          {/* 主聊天区域 */}
          <div className={styles.mainContent}>
            <div className={styles.chatContainer}>
              {/* 聊天头部 */}
              <div className={styles.chatHeader}>
                <div className={styles.chatInfo}>
                  <h2>AI Chat</h2>
                  <p>{getCurrentConfigDescription()}</p>
                </div>
                <div className={styles.chatActions}>
                  {loading && (
                    <div className={styles.loadingIndicator}>
                      <LucideRefreshCw size={16} className={styles.spinning} />
                      AI thinking...
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
                    <h3>Start your AI learning journey</h3>
                    <p>Select a task, then tell me what help you need</p>
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
                    placeholder="Describe your question or need..."
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskAssistant 