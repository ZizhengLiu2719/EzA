import { tasksApi } from '@/api/courses'
import { ApiResponse, Task } from '@/types'
import { calculateTaskPriority, getDaysUntil, isOverdue } from '@/utils'
import { useEffect, useState } from 'react'

export const useTasks = (courseId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取任务
  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let response: ApiResponse<Task[]>
      
      if (courseId) {
        response = await tasksApi.getCourseTasks(courseId)
      } else {
        response = await tasksApi.getUserTasks()
      }
      
      if (response.error) {
        setError(response.error)
      } else {
        setTasks(response.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 创建新任务
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    setError(null)
    
    try {
      const response = await tasksApi.createTask(taskData)
      if (response.error) {
        setError(response.error)
        return null
      } else {
        setTasks(prev => [response.data, ...prev])
        return response.data
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // 更新任务
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setError(null)
    
    try {
      const response = await tasksApi.updateTask(taskId, updates)
      if (response.error) {
        setError(response.error)
        return null
      } else {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? response.data : task
        ))
        return response.data
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // 删除任务
  const deleteTask = async (taskId: string) => {
    setError(null)
    
    try {
      const response = await tasksApi.deleteTask(taskId)
      if (response.error) {
        setError(response.error)
        return false
      } else {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        return true
      }
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // 获取单个任务
  const getTask = (taskId: string) => {
    return tasks.find(task => task.id === taskId)
  }

  // 按状态筛选任务
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  // 获取即将到期的任务（3天内）
  const getUpcomingTasks = () => {
    return tasks.filter(task => {
      const daysUntil = getDaysUntil(task.due_date)
      return daysUntil >= 0 && daysUntil <= 3
    })
  }

  // 获取逾期任务
  const getOverdueTasks = () => {
    return tasks.filter(task => isOverdue(task.due_date))
  }

  // 获取高优先级任务
  const getHighPriorityTasks = () => {
    return tasks.filter(task => task.priority === 'high')
  }

  // 按优先级排序任务
  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      const priorityA = calculateTaskPriority(a)
      const priorityB = calculateTaskPriority(b)
      return priorityB - priorityA
    })
  }

  // 获取本周任务
  const getThisWeekTasks = () => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date)
      return taskDate >= weekStart && taskDate <= weekEnd
    })
  }

  // 获取任务统计
  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(task => task.status === 'completed').length
    const inProgress = tasks.filter(task => task.status === 'in_progress').length
    const pending = tasks.filter(task => task.status === 'pending').length
    const overdue = tasks.filter(task => task.status === 'overdue').length
    
    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  // 批量更新任务状态
  const batchUpdateTaskStatus = async (taskIds: string[], status: Task['status']) => {
    setError(null)
    
    try {
      const updatePromises = taskIds.map(taskId => 
        tasksApi.updateTask(taskId, { status })
      )
      
      const results = await Promise.all(updatePromises)
      const hasError = results.some(result => result.error)
      
      if (hasError) {
        setError('部分任务更新失败')
      } else {
        // 重新获取任务列表
        await fetchTasks()
      }
      
      return !hasError
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchTasks()
  }, [courseId])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTasksByStatus,
    getUpcomingTasks,
    getOverdueTasks,
    getHighPriorityTasks,
    getSortedTasks,
    getThisWeekTasks,
    getTaskStats,
    batchUpdateTaskStatus
  }
} 