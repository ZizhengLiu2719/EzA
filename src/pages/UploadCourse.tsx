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
        if (!course) throw new Error('Course not found')
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
        setError(`Unsupported file type: ${file.name}`)
        return false
      }
      
      if (!validateFileSize(file, 10)) { // 10MB 限制
        setError(`File too large: ${file.name}`)
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
      setSuccess('Course information and tasks saved successfully!');
      setEditMode(false);
      // 保存成功后跳转到我的课程界面
      navigate('/courses');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseName.trim()) {
      setError('Please enter a course name')
      return
    }
    
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // 1. 先本地解析所有文件内容并检查字符数
      for (const file of files) {
        const parser = (await import('@/utils/fileParser')).FileParser.getInstance();
        const { text } = await parser.parseFile(file);
        const sizeCheck = (await import('@/utils')).checkFileSizeLimit(text);
        if (sizeCheck.isOverLimit) {
          setError(`File "${file.name}" content too large! Current character count: ${sizeCheck.characterCount}, exceeds limit: ${sizeCheck.limit}. Please upload smaller files or split content.`);
          setUploading(false);
          return;
        }
      }

      // 2. 只有全部校验通过后，才创建课程
      const courseData = {
        name: courseName,
        semester,
        year,
        description: '',
        grading_policy: ''
      }

      const newCourse = await createCourse(courseData)
      if (!newCourse) {
        throw new Error('Failed to create course')
      }

      // 3. 上传文件
      const uploadPromises = files.map(async (file) => {
        const fileType = getFileType(file.name)
        return await materialsApi.uploadMaterial(newCourse.id, file, fileType)
      })

      const uploadResults = await Promise.all(uploadPromises)
      const uploadErrors = uploadResults.filter(result => result.error)
      
      if (uploadErrors.length > 0) {
        // 上传失败，删除刚创建的课程
        await deleteCourse(newCourse.id)
        throw new Error(`Some files failed to upload: ${uploadErrors[0].error}`)
      }

      const uploadedMaterials = uploadResults.map(result => result.data)

      // 4. 解析课程内容
      setParsing(true)
      const materialIds = uploadedMaterials.map(material => material.id)
      const parseResponse = await courseParseApi.parseCourseMaterials(newCourse.id, materialIds)
      
      if (parseResponse.error) {
        // 解析失败，删除刚创建的课程
        await deleteCourse(newCourse.id)
        throw new Error(`Course parsing failed: ${parseResponse.error}`)
      }

      setParseResult(parseResponse.data)
      setFinalCourseId(newCourse.id)
      setEditMode(true)
      setSuccess('Course created successfully! Please complete the structured information and save.')

      // 5. 更新课程信息（如AI解析出新课程名/描述/评分政策，仅更新，不再新建课程）
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

    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setParsing(false)
    }
  }

  const getFileType = (fileName: string): CourseMaterial['type'] => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('syllabus') || lowerName.includes('outline')) {
      return 'syllabus'
    } else if (lowerName.includes('textbook') || lowerName.includes('book')) {
      return 'textbook'
    } else if (lowerName.includes('lecture') || lowerName.includes('notes')) {
      return 'lecture_notes'
    } else if (lowerName.includes('assignment') || lowerName.includes('homework')) {
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
          <h1>Upload Course Materials</h1>
          <p>Upload your syllabus, textbooks or lecture notes, let EzA automatically plan your learning path</p>
        </div>
        
        {editMode && parseResult ? (
          <>
            <div className={styles.infoTip} style={{marginBottom: 16, color: '#b45309', background: '#fef3c7', padding: '10px 16px', borderRadius: 6, fontSize: 15}}>
              AI-parsed task lists only include tasks related to course grading. If syllabus information is not clear enough, AI may not extract relevant information. Students should add tasks based on actual course requirements during the semester.
            </div>
            <CourseParseResultEditor
              initialData={parseResult}
              onSave={handleSaveStructured}
              onCancel={() => setEditMode(false)}
            />
          </>
        ) : (
          <form onSubmit={handleSubmit} className={styles.uploadForm}>
            {/* 课程基本信息 */}
            <div className={styles.courseInfo}>
              <h3>Course Information</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="courseName">Course Name</label>
                  <input
                    type="text"
                    id="courseName"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Advanced Mathematics"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="semester">Semester</label>
                  <select
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="Fall">Fall Semester</option>
                    <option value="Spring">Spring Semester</option>
                    <option value="Summer">Summer Semester</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="year">Year</label>
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
              <h3>Upload Course Materials</h3>
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
                  <h3>Drag files here or click to select</h3>
                  <p>Supports PDF, Word, text files and images (max 10MB, content not exceeding 16,000 characters)</p>
                </div>
              </div>
            </div>
            
            {/* 文件列表 */}
            {files.length > 0 && (
              <div className={styles.fileList}>
                <h3>Selected Files:</h3>
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
              <div className={styles.previewSection}>
                <h3>Parsing Results Preview</h3>
                <div className={styles.previewContent}>
                  <p><strong>Course Name:</strong> {parseResult.course_name}</p>
                  <p><strong>Semester:</strong> {parseResult.semester} {parseResult.year}</p>
                  <p><strong>Tasks Found:</strong> {parseResult.tasks.length}</p>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <div className={styles.submitSection}>
              <button
                type="submit"
                disabled={uploading || parsing}
                className={styles.submitBtn}
              >
                {uploading ? 'Creating Course...' : parsing ? 'Parsing Content...' : 'Upload & Parse'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UploadCourse 