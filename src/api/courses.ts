import { ApiResponse, Course, CourseMaterial, CourseParseResult, Task } from '@/types'
import { validateFileSize, validateFileType } from '@/utils'
import { courseParseApi as aiCourseParseApi } from './ai'
import { supabase } from './supabase'

// 课程管理 API
export const coursesApi = {
  // 获取用户的所有课程
  async getUserCourses(): Promise<ApiResponse<Course[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 创建新课程
  async createCourse(courseData: Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Course>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as Course, error: error.message }
    }
  },

  // 更新课程信息
  async updateCourse(courseId: string, updates: Partial<Course>): Promise<ApiResponse<Course>> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as Course, error: error.message }
    }
  },

  // 删除课程
  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { data: undefined, error: error.message }
    }
  }
}

// 课程材料管理 API
export const materialsApi = {
  // 上传课程材料
  async uploadMaterial(
    courseId: string,
    file: File,
    type: CourseMaterial['type']
  ): Promise<ApiResponse<CourseMaterial>> {
    try {
      // 验证文件类型和大小
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ]
      
      if (!validateFileType(file, allowedTypes)) {
        throw new Error('不支持的文件类型')
      }
      
      if (!validateFileSize(file, 10)) { // 10MB 限制
        throw new Error('文件大小超过限制')
      }

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${courseId}/${Date.now()}.${fileExt}`
      
      // 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('syllabus')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 获取文件 URL
      const { data: { publicUrl } } = supabase.storage
        .from('syllabus')
        .getPublicUrl(fileName)

      // 提取文本内容（这里需要 OCR 或文本提取）
      let extractedText = ''
      if (file.type === 'text/plain') {
        extractedText = await file.text()
      } else if (file.type === 'application/pdf') {
        // TODO: 实现 PDF 文本提取
        extractedText = await this.extractTextFromPDF(file)
      } else if (file.type.startsWith('image/')) {
        // TODO: 实现图片 OCR
        extractedText = await this.extractTextFromImage(file)
      }

      // 保存到数据库
      const { data, error } = await supabase
        .from('course_materials')
        .insert([{
          course_id: courseId,
          name: file.name,
          type,
          file_url: publicUrl,
          file_size: file.size,
          extracted_text: extractedText
        }])
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as CourseMaterial, error: error.message }
    }
  },

  // 从 PDF 提取文本
  async extractTextFromPDF(file: File): Promise<string> {
    // TODO: 实现 PDF 文本提取
    // 可以使用 pdf.js 或其他 PDF 处理库
    return 'PDF 文本提取功能待实现'
  },

  // 从图片提取文本（OCR）
  async extractTextFromImage(file: File): Promise<string> {
    // TODO: 实现图片 OCR
    // 可以使用 Tesseract.js 或其他 OCR 服务
    return '图片 OCR 功能待实现'
  },

  // 获取课程的所有材料
  async getCourseMaterials(courseId: string): Promise<ApiResponse<CourseMaterial[]>> {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 删除课程材料
  async deleteMaterial(materialId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { data: undefined, error: error.message }
    }
  }
}

// 课程解析 API
export const courseParseApi = {
  // 解析课程材料并生成任务
  async parseCourseMaterials(
    courseId: string,
    materialIds: string[]
  ): Promise<ApiResponse<CourseParseResult>> {
    try {
      // 获取材料内容
      const { data: materials, error: materialsError } = await supabase
        .from('course_materials')
        .select('*')
        .in('id', materialIds)

      if (materialsError) throw materialsError

      // 使用 AI 解析课程材料
      const parseResult = await aiCourseParseApi.parseCourseMaterials(materials || [])

      if (parseResult.error) {
        throw new Error(parseResult.error)
      }

      // 保存解析的任务到数据库
      if (parseResult.data.tasks && parseResult.data.tasks.length > 0) {
        await this.saveParsedTasks(courseId, parseResult.data.tasks)
      }

      return parseResult
    } catch (error: any) {
      return { data: {} as CourseParseResult, error: error.message }
    }
  },

  // 保存解析的任务
  async saveParsedTasks(courseId: string, tasks: Omit<Task, 'id' | 'course_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      const tasksWithCourseId = tasks.map(task => ({
        ...task,
        course_id: courseId
      }))

      const { error } = await supabase
        .from('tasks')
        .insert(tasksWithCourseId)

      if (error) throw error
    } catch (error: any) {
      console.error('Failed to save parsed tasks:', error)
      throw error
    }
  },

  // 获取课程任务
  async getCourseTasks(courseId: string): Promise<ApiResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  }
}

// 任务管理 API
export const tasksApi = {
  // 获取用户的所有任务
  async getUserTasks(): Promise<ApiResponse<Task[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          courses!inner(user_id)
        `)
        .eq('courses.user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      return { data: data || [] }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 创建新任务
  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as Task, error: error.message }
    }
  },

  // 更新任务
  async updateTask(taskId: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as Task, error: error.message }
    }
  },

  // 删除任务
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { data: undefined, error: error.message }
    }
  }
} 