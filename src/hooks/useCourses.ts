import { coursesApi } from '@/api/courses'
import { Course } from '@/types'
import { useEffect, useState } from 'react'

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取用户的所有课程
  const fetchCourses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await coursesApi.getUserCourses()
      if (response.error) {
        setError(response.error)
      } else {
        setCourses(response.data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 创建新课程
  const createCourse = async (courseData: Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setError(null)
    
    try {
      const response = await coursesApi.createCourse(courseData)
      if (response.error) {
        setError(response.error)
        return null
      } else {
        setCourses(prev => [response.data, ...prev])
        return response.data
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // 更新课程
  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    setError(null)
    
    try {
      const response = await coursesApi.updateCourse(courseId, updates)
      if (response.error) {
        setError(response.error)
        return null
      } else {
        setCourses(prev => prev.map(course => 
          course.id === courseId ? response.data : course
        ))
        return response.data
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // 删除课程
  const deleteCourse = async (courseId: string) => {
    setError(null)
    
    try {
      const response = await coursesApi.deleteCourse(courseId)
      if (response.error) {
        setError(response.error)
        return false
      } else {
        setCourses(prev => prev.filter(course => course.id !== courseId))
        return true
      }
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  // 获取单个课程
  const getCourse = (courseId: string) => {
    return courses.find(course => course.id === courseId)
  }

  // 初始化加载
  useEffect(() => {
    fetchCourses()
  }, [])

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourse
  }
} 