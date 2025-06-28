import { CourseParseResult, Subtask, Task } from '@/types'

// 日期处理工具
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getDaysUntil = (dueDate: string): number => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isOverdue = (dueDate: string): boolean => {
  return getDaysUntil(dueDate) < 0
}

export const getWeekRange = (date: Date = new Date()) => {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

// 任务拆解工具
export const generateSubtasks = (task: Task): Subtask[] => {
  const subtasks: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[] = []
  
  switch (task.type) {
    case 'writing':
      subtasks.push(
        { title: '头脑风暴和资料收集', description: '收集相关材料和想法', status: 'pending', order: 1, estimated_hours: task.estimated_hours * 0.2 },
        { title: '撰写大纲', description: '组织文章结构和要点', status: 'pending', order: 2, estimated_hours: task.estimated_hours * 0.15 },
        { title: '撰写初稿', description: '完成文章初稿', status: 'pending', order: 3, estimated_hours: task.estimated_hours * 0.4 },
        { title: '修改和润色', description: '检查语法、逻辑和格式', status: 'pending', order: 4, estimated_hours: task.estimated_hours * 0.2 },
        { title: '最终检查和提交', description: '最终检查并提交作业', status: 'pending', order: 5, estimated_hours: task.estimated_hours * 0.05 }
      )
      break
      
    case 'reading':
      subtasks.push(
        { title: '预览和概览', description: '快速浏览章节标题和摘要', status: 'pending', order: 1, estimated_hours: task.estimated_hours * 0.1 },
        { title: '深度阅读', description: '仔细阅读和理解内容', status: 'pending', order: 2, estimated_hours: task.estimated_hours * 0.6 },
        { title: '做笔记', description: '记录重要概念和要点', status: 'pending', order: 3, estimated_hours: task.estimated_hours * 0.2 },
        { title: '复习和总结', description: '回顾和总结关键内容', status: 'pending', order: 4, estimated_hours: task.estimated_hours * 0.1 }
      )
      break
      
    case 'assignment':
      subtasks.push(
        { title: '理解题目要求', description: '仔细阅读和分析作业要求', status: 'pending', order: 1, estimated_hours: task.estimated_hours * 0.1 },
        { title: '收集资料', description: '查找相关资料和参考', status: 'pending', order: 2, estimated_hours: task.estimated_hours * 0.2 },
        { title: '制定解决方案', description: '设计解题思路和方法', status: 'pending', order: 3, estimated_hours: task.estimated_hours * 0.3 },
        { title: '执行和完成', description: '按照计划完成作业', status: 'pending', order: 4, estimated_hours: task.estimated_hours * 0.3 },
        { title: '检查和提交', description: '检查结果并提交', status: 'pending', order: 5, estimated_hours: task.estimated_hours * 0.1 }
      )
      break
      
    case 'project':
      subtasks.push(
        { title: '项目规划', description: '制定项目计划和时间表', status: 'pending', order: 1, estimated_hours: task.estimated_hours * 0.15 },
        { title: '研究和设计', description: '进行研究和设计阶段', status: 'pending', order: 2, estimated_hours: task.estimated_hours * 0.25 },
        { title: '开发和实现', description: '核心开发和实现工作', status: 'pending', order: 3, estimated_hours: task.estimated_hours * 0.4 },
        { title: '测试和调试', description: '测试功能和修复问题', status: 'pending', order: 4, estimated_hours: task.estimated_hours * 0.15 },
        { title: '文档和演示', description: '准备文档和演示材料', status: 'pending', order: 5, estimated_hours: task.estimated_hours * 0.05 }
      )
      break
      
    default:
      subtasks.push(
        { title: '准备阶段', description: '准备和规划工作', status: 'pending', order: 1, estimated_hours: task.estimated_hours * 0.3 },
        { title: '执行阶段', description: '主要执行工作', status: 'pending', order: 2, estimated_hours: task.estimated_hours * 0.5 },
        { title: '完成阶段', description: '收尾和提交工作', status: 'pending', order: 3, estimated_hours: task.estimated_hours * 0.2 }
      )
  }
  
  return subtasks as Subtask[]
}

// 文件处理工具
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type) || 
         allowedTypes.some(type => file.name.toLowerCase().endsWith(type))
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

// 学习统计工具
export const calculateCompletionRate = (completed: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export const calculateProcrastinationIndex = (overdueTasks: number, totalTasks: number): number => {
  if (totalTasks === 0) return 0
  const rate = (overdueTasks / totalTasks) * 10
  return Math.min(Math.round(rate), 10)
}

export const calculateFocusScore = (
  completedTasks: number,
  totalStudyHours: number,
  averageTaskHours: number
): number => {
  if (totalStudyHours === 0 || averageTaskHours === 0) return 0
  
  const efficiency = completedTasks / totalStudyHours
  const expectedEfficiency = 1 / averageTaskHours
  const score = (efficiency / expectedEfficiency) * 100
  
  return Math.min(Math.max(Math.round(score), 0), 100)
}

// 优先级计算工具
export const calculateTaskPriority = (task: Task): number => {
  const daysUntil = getDaysUntil(task.due_date)
  const weight = task.weight || 1
  const basePriority = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1
  
  // 越接近截止日期，优先级越高
  const urgencyFactor = Math.max(0, 10 - daysUntil)
  
  return (basePriority * weight * urgencyFactor) / 10
}

// 课程解析工具
export const parseCourseFromText = async (text: string): Promise<CourseParseResult> => {
  // 这里应该调用 OpenAI API 进行解析
  // 目前返回模拟数据
  return {
    course_name: '示例课程',
    semester: 'Fall',
    year: 2024,
    tasks: [],
    grading_policy: '基于作业和考试',
    course_description: '课程描述'
  }
}

// 时间管理工具
export const estimateTaskDuration = (taskType: string, complexity: 'low' | 'medium' | 'high'): number => {
  const baseHours = {
    reading: { low: 1, medium: 2, high: 4 },
    writing: { low: 2, medium: 4, high: 8 },
    assignment: { low: 1, medium: 3, high: 6 },
    exam: { low: 2, medium: 4, high: 8 },
    quiz: { low: 0.5, medium: 1, high: 2 },
    project: { low: 4, medium: 8, high: 16 },
    presentation: { low: 2, medium: 4, high: 8 }
  }
  
  return baseHours[taskType as keyof typeof baseHours]?.[complexity] || 2
}

// 颜色工具
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#10b981'
    default: return '#6b7280'
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#10b981'
    case 'in_progress': return '#3b82f6'
    case 'pending': return '#6b7280'
    case 'overdue': return '#ef4444'
    default: return '#6b7280'
  }
}

// 本地存储工具
export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error reading from localStorage:', error)
    return defaultValue
  }
}

// 检查文件内容是否超过GPT-4o的token限制
export function checkFileSizeLimit(text: string): {
  isOverLimit: boolean
  characterCount: number
  estimatedTokens: number
  limit: number
} {
  const characterCount = text.length
  // GPT-4o的token限制约为128000 tokens，约等于512000字符
  const limit = 512000
  // 粗略估算：1个token约等于4个字符
  const estimatedTokens = Math.ceil(characterCount / 4)
  
  return {
    isOverLimit: characterCount > limit,
    characterCount,
    estimatedTokens,
    limit
  }
}

// 获取文件大小限制的友好提示信息
export function getFileSizeLimitMessage(characterCount: number, limit: number): string {
  const isOverLimit = characterCount > limit
  const percentage = Math.round((characterCount / limit) * 100)
  
  if (isOverLimit) {
    return `文件内容过大！当前字符数：${characterCount.toLocaleString()}，超过GPT-4o限制：${limit.toLocaleString()}（${percentage}%）。请上传较小的文件或分割文件内容。`
  } else {
    return `文件大小正常。当前字符数：${characterCount.toLocaleString()}，GPT-4o限制：${limit.toLocaleString()}（${percentage}%）`
  }
} 