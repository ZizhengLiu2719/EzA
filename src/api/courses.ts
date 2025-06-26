import { ApiResponse, Course, CourseMaterial, CourseParseResult, Task } from '@/types'
import { validateFileSize, validateFileType } from '@/utils'
import { FileParser, FileTypeDetector, FileUploadProgress } from '@/utils/fileParser'
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
    type: CourseMaterial['type'],
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<CourseMaterial>> {
    try {
      // 验证文件类型和大小
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]
      
      if (!validateFileType(file, allowedTypes)) {
        throw new Error('不支持的文件类型')
      }
      
      if (!validateFileSize(file, 10)) { // 10MB 限制
        throw new Error('文件大小超过限制')
      }

      // 检查文件是否支持解析
      if (!FileTypeDetector.isSupported(file)) {
        throw new Error('文件类型不支持解析')
      }

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${courseId}/${Date.now()}.${fileExt}`
      
      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('syllabus')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 获取文件 URL
      const { data: { publicUrl } } = supabase.storage
        .from('syllabus')
        .getPublicUrl(fileName)

      // 解析文件内容
      let extractedText = ''

      try {
        const uploadProgress = new FileUploadProgress(
          onProgress,
          (result) => {
            extractedText = result.text
          },
          (error) => {
            console.warn('文件解析失败，但文件已上传:', error.message)
          }
        )

        await uploadProgress.parseWithProgress(file)
      } catch (parseError) {
        console.warn('文件解析失败，但文件已上传:', parseError)
        // 即使解析失败，也继续保存文件信息
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

  // 批量上传课程材料
  async uploadMultipleMaterials(
    courseId: string,
    files: File[],
    type: CourseMaterial['type'],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<ApiResponse<CourseMaterial[]>> {
    try {
      const results: CourseMaterial[] = []
      const errors: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          const result = await this.uploadMaterial(
            courseId,
            file,
            type,
            (progress) => onProgress?.(i, progress)
          )
          
          if (result.error) {
            errors.push(`${file.name}: ${result.error}`)
          } else {
            results.push(result.data)
          }
        } catch (error: any) {
          errors.push(`${file.name}: ${error.message}`)
        }
      }

      if (errors.length > 0) {
        return { 
          data: results, 
          error: `部分文件上传失败: ${errors.join('; ')}` 
        }
      }

      return { data: results }
    } catch (error: any) {
      return { data: [], error: error.message }
    }
  },

  // 重新解析课程材料
  async reparseMaterial(materialId: string): Promise<ApiResponse<CourseMaterial>> {
    try {
      // 获取材料信息
      const { data: material, error: materialError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (materialError) throw materialError

      // 从 Storage 下载文件
      const fileName = material.file_url.split('/').pop()
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('syllabus')
        .download(fileName || '')

      if (downloadError) throw downloadError

      // 创建 File 对象
      const file = new File([fileData], material.name, { type: material.file_url.split('.').pop() || '' })

      // 重新解析文件
      const parser = FileParser.getInstance()
      const parseResult = await parser.parseFile(file)

      // 更新数据库
      const { data, error } = await supabase
        .from('course_materials')
        .update({
          extracted_text: parseResult.text
        })
        .eq('id', materialId)
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (error: any) {
      return { data: {} as CourseMaterial, error: error.message }
    }
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
      // 获取材料信息以删除 Storage 中的文件
      const { data: material, error: materialError } = await supabase
        .from('course_materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (materialError) throw materialError

      // 删除 Storage 中的文件
      const fileName = material.file_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('syllabus')
          .remove([fileName])
      }

      // 删除数据库记录
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      return { data: undefined }
    } catch (error: any) {
      return { data: undefined, error: error.message }
    }
  },

  // 获取材料解析统计
  async getMaterialStats(courseId: string): Promise<ApiResponse<{
    totalMaterials: number
    parsedMaterials: number
    totalWords: number
    fileTypes: Record<string, number>
  }>> {
    try {
      const { data: materials, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)

      if (error) throw error

      const stats = {
        totalMaterials: materials?.length || 0,
        parsedMaterials: materials?.filter(m => m.extracted_text).length || 0,
        totalWords: materials?.reduce((sum, m) => {
          if (m.extracted_text) {
            const words = m.extracted_text.split(/\s+/).length
            return sum + words
          }
          return sum
        }, 0) || 0,
        fileTypes: {} as Record<string, number>
      }

      // 统计文件类型
      materials?.forEach(material => {
        const fileType = FileTypeDetector.getFileTypeDescription(material as any)
        stats.fileTypes[fileType] = (stats.fileTypes[fileType] || 0) + 1
      })

      return { data: stats }
    } catch (error: any) {
      return { data: {} as any, error: error.message }
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