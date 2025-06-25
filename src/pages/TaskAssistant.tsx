import { useState } from 'react'
import styles from './TaskAssistant.module.css'

const TaskAssistant = () => {
  const [selectedTask, setSelectedTask] = useState('')
  const [assistantType, setAssistantType] = useState('writing')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const tasks = [
    { id: '1', title: '历史论文初稿', type: 'writing', due: '明天' },
    { id: '2', title: '数学作业第三章', type: 'stem', due: '3天后' },
    { id: '3', title: '心理学阅读笔记', type: 'reading', due: '下周' }
  ]

  const assistantTypes = [
    { id: 'writing', name: '写作辅助', icon: '✍️' },
    { id: 'stem', name: 'STEM解题', icon: '🧮' },
    { id: 'reading', name: '阅读摘要', icon: '📚' },
    { id: 'programming', name: '编程帮助', icon: '💻' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    setIsLoading(true)
    // TODO: 实现AI对话逻辑
    console.log('AI Assistant request:', { selectedTask, assistantType, message })
    
    setTimeout(() => {
      setIsLoading(false)
      setMessage('')
    }, 2000)
  }

  return (
    <div className={styles.assistant}>
      <div className="container">
        <div className={styles.header}>
          <h1>AI 学习助理</h1>
          <p>选择任务类型，让AI为你提供个性化学习指导</p>
        </div>
        
        <div className={styles.assistantContent}>
          <div className={styles.sidebar}>
            <div className={styles.taskSection}>
              <h3>选择任务</h3>
              <div className={styles.taskList}>
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`${styles.taskItem} ${selectedTask === task.id ? styles.selected : ''}`}
                    onClick={() => setSelectedTask(task.id)}
                  >
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.taskDue}>截止: {task.due}</span>
                    </div>
                    <span className={styles.taskType}>{task.type}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.typeSection}>
              <h3>AI 模式</h3>
              <div className={styles.typeList}>
                {assistantTypes.map((type) => (
                  <div 
                    key={type.id}
                    className={`${styles.typeItem} ${assistantType === type.id ? styles.selected : ''}`}
                    onClick={() => setAssistantType(type.id)}
                  >
                    <span className={styles.typeIcon}>{type.icon}</span>
                    <span className={styles.typeName}>{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.mainContent}>
            <div className={styles.chatArea}>
              <div className={styles.chatHeader}>
                <h2>AI 对话</h2>
                <p>描述你需要什么帮助，AI会为你提供指导</p>
              </div>
              
              <div className={styles.chatMessages}>
                <div className={styles.message}>
                  <div className={styles.messageContent}>
                    <p>你好！我是你的AI学习助理。请告诉我你需要什么帮助？</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className={styles.chatInput}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="描述你的问题或需求..."
                  rows={3}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className={`btn btn-primary ${styles.sendBtn}`}
                  disabled={!message.trim() || isLoading}
                >
                  {isLoading ? '发送中...' : '发送'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskAssistant 