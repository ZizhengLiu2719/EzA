import { courseParseApi, materialsApi } from '@/api/courses'
import BackToDashboardButton from '@/components/BackToDashboardButton'
import CourseParseResultEditor from '@/components/CourseParseResultEditor'
import { useCourses } from '@/hooks/useCourses'
import { CourseMaterial, CourseParseResult } from '@/types'
import { formatFileSize, validateFileSize, validateFileType } from '@/utils'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './UploadCourse.module.css'

const UploadCourse = () => {
  const navigate = useNavigate()
  const { createCourse, updateCourse, deleteCourse } = useCourses()
  const { courseId } = useParams<{ courseId?: string }>()
  
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [semester, setSemester] = useState('Fall')
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parseResult, setParseResult] = useState<CourseParseResult | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [finalCourseId, setFinalCourseId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStructured = async () => {
      if (!courseId) return;
      setUploading(true);
      setError('');
      try {
        // 获取课程详情
        const courseRes = await import('@/api/courses').then(m => m.coursesApi.getUserCourses())
        const course = courseRes.data.find((c: any) => c.id === courseId)
        if (!course) throw new Error('未找到该课程')
        // 获取任务
        const tasksRes = await import('@/api/courses').then(m => m.courseParseApi.getCourseTasks(courseId))
        const tasks = tasksRes.data || []
        // 组装结构化信息
        const structured: CourseParseResult = {
          course_name: course.name,
          semester: course.semester,
          year: course.year,
          grading_policy: course.grading_policy,
          course_description: course.description,
          tasks: tasks.map((t: any) => ({
            title: t.title,
            type: t.type,
            due_date: t.due_date,
            priority: t.priority,
            estimated_hours: t.estimated_hours,
            status: t.status,
            description: t.description,
            weight: t.weight
          }))
        }
        setParseResult(structured)
        setFinalCourseId(courseId)
        setEditMode(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setUploading(false)
      }
    }
    fetchStructured()
    // eslint-disable-next-line
  }, [courseId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      validateAndAddFiles(newFiles)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files)
      validateAndAddFiles(newFiles)
    }
  }

  const validateAndAddFiles = (newFiles: File[]) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]

    const validFiles = newFiles.filter(file => {
      if (!validateFileType(file, allowedTypes)) {
        setError(`不支持的文件类型: ${file.name}`)
        return false
      }
      
      if (!validateFileSize(file, 10)) { // 10MB 限制
        setError(`文件过大: ${file.name}`)
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      setError('')
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveStructured = async (edited: CourseParseResult) => {
    if (!finalCourseId) return;
    setUploading(true);
    setError('');
    try {
      // 更新课程信息
      await updateCourse(finalCourseId, {
        name: edited.course_name,
        semester: edited.semester,
        year: edited.year,
        description: edited.course_description,
        grading_policy: edited.grading_policy,
      });
      // 先删除原有任务，防止重复
      await courseParseApi.deleteAllTasksForCourse(finalCourseId);
      // 批量保存任务
      if (edited.tasks.length > 0) {
        await courseParseApi.saveParsedTasks(finalCourseId, edited.tasks);
      }
      setSuccess('课程信息和任务已保存！');
      setEditMode(false);
      // 可选：跳转或刷新
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseName.trim()) {
      setError('请输入课程名称')
      return
    }
    
    if (files.length === 0) {
      setError('请选择至少一个文件')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // 1. 创建课程
      const courseData = {
        name: courseName,
        semester,
        year,
        description: '',
        grading_policy: ''
      }

      const newCourse = await createCourse(courseData)
      if (!newCourse) {
        throw new Error('创建课程失败')
      }

      // 2. 上传文件
      const uploadPromises = files.map(async (file) => {
        const fileType = getFileType(file.name)
        return await materialsApi.uploadMaterial(newCourse.id, file, fileType)
      })

      const uploadResults = await Promise.all(uploadPromises)
      const uploadErrors = uploadResults.filter(result => result.error)
      
      if (uploadErrors.length > 0) {
        throw new Error(`部分文件上传失败: ${uploadErrors[0].error}`)
      }

      const uploadedMaterials = uploadResults.map(result => result.data)

      // 3. 解析课程内容
      setParsing(true)
      const materialIds = uploadedMaterials.map(material => material.id)
      const parseResponse = await courseParseApi.parseCourseMaterials(newCourse.id, materialIds)
      
      if (parseResponse.error) {
        // 检查是否是文件大小限制错误
        if (parseResponse.error.includes('文件内容过大')) {
          setError(parseResponse.error)
          // 删除已创建的课程，因为解析失败
          await deleteCourse(newCourse.id)
        } else {
          throw new Error(`课程解析失败: ${parseResponse.error}`)
        }
        return
      }

      setParseResult(parseResponse.data)
      setFinalCourseId(newCourse.id)
      setEditMode(true)
      setSuccess('课程创建成功！请完善结构化信息后保存。')

      // 4. 更新课程信息（如AI解析出新课程名/描述/评分政策，仅更新，不再新建课程）
      if (parseResponse.data.course_name && (
        parseResponse.data.course_name !== courseName ||
        parseResponse.data.course_description ||
        parseResponse.data.grading_policy
      )) {
        await updateCourse(newCourse.id, {
          name: parseResponse.data.course_name,
          description: parseResponse.data.course_description || '',
          grading_policy: parseResponse.data.grading_policy || ''
        });
      }

      // 5. 跳转到课程页面
      // setTimeout(() => {
      //   navigate('/dashboard')
      // }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setParsing(false)
    }
  }

  const getFileType = (fileName: string): CourseMaterial['type'] => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('syllabus') || lowerName.includes('大纲')) {
      return 'syllabus'
    } else if (lowerName.includes('textbook') || lowerName.includes('教材')) {
      return 'textbook'
    } else if (lowerName.includes('lecture') || lowerName.includes('讲义')) {
      return 'lecture_notes'
    } else if (lowerName.includes('assignment') || lowerName.includes('作业')) {
      return 'assignment'
    } else {
      return 'other'
    }
  }

  return (
    <div className={styles.uploadPage} style={{ position: 'relative' }}>
      <BackToDashboardButton />
      <div className="container">
        <div className={styles.header}>
          <h1>上传课程资料</h1>
          <p>上传你的syllabus、教材或讲义，让EzA为你自动规划学习路径</p>
        </div>
        
        {editMode && parseResult ? (
          <CourseParseResultEditor
            initialData={parseResult}
            onSave={handleSaveStructured}
            onCancel={() => setEditMode(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className={styles.uploadForm}>
            {/* 课程基本信息 */}
            <div className={styles.courseInfo}>
              <h3>课程信息</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="courseName">课程名称</label>
                  <input
                    type="text"
                    id="courseName"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="例如：高等数学"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="semester">学期</label>
                  <select
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="Fall">秋季学期</option>
                    <option value="Spring">春季学期</option>
                    <option value="Summer">夏季学期</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="year">年份</label>
                  <input
                    type="number"
                    id="year"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
            </div>

            {/* 文件上传区域 */}
            <div className={styles.uploadSection}>
              <h3>上传课程材料</h3>
              <div 
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleChange}
                  className={styles.fileInput}
                />
                <div className={styles.dropContent}>
                  <div className={styles.dropIcon}>📚</div>
                  <h3>拖拽文件到这里或点击选择</h3>
                  <p>支持 PDF、Word、文本文件和图片（最大 10MB，内容不超过 16,000 字符）</p>
                </div>
              </div>
            </div>
            
            {/* 文件列表 */}
            {files.length > 0 && (
              <div className={styles.fileList}>
                <h3>已选择的文件：</h3>
                {files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </span>
                      <span className={styles.fileType}>
                        {getFileType(file.name)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className={styles.removeFile}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 错误和成功消息 */}
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {/* 解析结果预览 */}
            {parseResult && !editMode && (
              <div className={styles.parseResult}>
                <h3>解析结果预览</h3>
                <div className={styles.resultContent}>
                  <p><strong>课程名称：</strong>{parseResult.course_name}</p>
                  <p><strong>学期：</strong>{parseResult.semester} {parseResult.year}</p>
                  {parseResult.course_description && (
                    <p><strong>课程描述：</strong>{parseResult.course_description}</p>
                  )}
                  {parseResult.grading_policy && (
                    <p><strong>评分政策：</strong>{parseResult.grading_policy}</p>
                  )}
                  <p><strong>识别到的任务：</strong>{parseResult.tasks.length} 个</p>
                  <button type="button" onClick={() => setEditMode(true)} className={styles.saveBtn}>进入结构化编辑</button>
                </div>
              </div>
            )}
            
            {/* 提交按钮 */}
            <button 
              type="submit" 
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={files.length === 0 || uploading || parsing}
            >
              {uploading ? '上传中...' : parsing ? '解析中...' : '开始解析课程'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default UploadCourse 