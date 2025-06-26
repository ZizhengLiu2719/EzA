import { materialsApi } from '@/api/courses'
import { CourseMaterial } from '@/types'
import { FileTypeDetector, formatFileSize } from '@/utils/fileParser'
import { useCallback, useState } from 'react'

export interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  result?: CourseMaterial
}

export interface UploadState {
  files: UploadFile[]
  isUploading: boolean
  totalProgress: number
  completedCount: number
  errorCount: number
}

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    files: [],
    isUploading: false,
    totalProgress: 0,
    completedCount: 0,
    errorCount: 0
  })

  // 添加文件到上传队列
  const addFiles = useCallback((files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending'
    }))

    setUploadState(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles]
    }))

    return newFiles.map(f => f.id)
  }, [])

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }))
  }, [])

  // 清空所有文件
  const clearFiles = useCallback(() => {
    setUploadState(prev => ({
      ...prev,
      files: []
    }))
  }, [])

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件大小（10MB 限制）
    if (file.size > 10 * 1024 * 1024) {
      return `文件 ${file.name} 超过 10MB 限制`
    }

    // 检查文件类型
    if (!FileTypeDetector.isSupported(file)) {
      return `文件 ${file.name} 类型不支持`
    }

    return null
  }, [])

  // 验证所有文件
  const validateFiles = useCallback((files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        valid.push(file)
      }
    })

    return { valid, errors }
  }, [validateFile])

  // 上传单个文件
  const uploadFile = useCallback(async (
    fileId: string,
    courseId: string,
    type: CourseMaterial['type']
  ): Promise<CourseMaterial | null> => {
    const fileData = uploadState.files.find(f => f.id === fileId)
    if (!fileData) return null

    // 更新状态为上传中
    setUploadState(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    }))

    try {
      const result = await materialsApi.uploadMaterial(
        courseId,
        fileData.file,
        type,
        (progress) => {
          setUploadState(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.id === fileId 
                ? { ...f, progress }
                : f
            )
          }))
        }
      )

      if (result.error) {
        throw new Error(result.error)
      }

      // 更新状态为完成
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', progress: 100, result: result.data }
            : f
        ),
        completedCount: prev.completedCount + 1
      }))

      return result.data
    } catch (error: any) {
      // 更新状态为错误
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: error.message }
            : f
        ),
        errorCount: prev.errorCount + 1
      }))

      return null
    }
  }, [uploadState.files])

  // 批量上传文件
  const uploadFiles = useCallback(async (
    courseId: string,
    type: CourseMaterial['type']
  ): Promise<CourseMaterial[]> => {
    const pendingFiles = uploadState.files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      return []
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      totalProgress: 0
    }))

    const results: CourseMaterial[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileData = pendingFiles[i]
      const result = await uploadFile(fileData.id, courseId, type)
      
      if (result) {
        results.push(result)
      }

      // 更新总进度
      const progress = ((i + 1) / pendingFiles.length) * 100
      setUploadState(prev => ({
        ...prev,
        totalProgress: progress
      }))
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: false
    }))

    return results
  }, [uploadState.files, uploadFile])

  // 重新上传失败的文件
  const retryFailedFiles = useCallback(async (
    courseId: string,
    type: CourseMaterial['type']
  ): Promise<CourseMaterial[]> => {
    const failedFiles = uploadState.files.filter(f => f.status === 'error')
    
    if (failedFiles.length === 0) {
      return []
    }

    const results: CourseMaterial[] = []

    for (const fileData of failedFiles) {
      // 重置文件状态
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'pending', progress: 0, error: undefined }
            : f
        )
      }))

      const result = await uploadFile(fileData.id, courseId, type)
      if (result) {
        results.push(result)
      }
    }

    return results
  }, [uploadState.files, uploadFile])

  // 获取文件统计信息
  const getFileStats = useCallback(() => {
    const stats = {
      total: uploadState.files.length,
      pending: uploadState.files.filter(f => f.status === 'pending').length,
      uploading: uploadState.files.filter(f => f.status === 'uploading').length,
      processing: uploadState.files.filter(f => f.status === 'processing').length,
      completed: uploadState.files.filter(f => f.status === 'completed').length,
      error: uploadState.files.filter(f => f.status === 'error').length,
      totalSize: uploadState.files.reduce((sum, f) => sum + f.file.size, 0)
    }

    return {
      ...stats,
      totalSizeFormatted: formatFileSize(stats.totalSize)
    }
  }, [uploadState.files])

  // 获取文件类型统计
  const getFileTypeStats = useCallback(() => {
    const typeStats: Record<string, number> = {}
    
    uploadState.files.forEach(fileData => {
      const fileType = FileTypeDetector.getFileTypeDescription(fileData.file)
      typeStats[fileType] = (typeStats[fileType] || 0) + 1
    })

    return typeStats
  }, [uploadState.files])

  // 检查是否有错误
  const hasErrors = useCallback(() => {
    return uploadState.files.some(f => f.status === 'error')
  }, [uploadState.files])

  // 检查是否全部完成
  const isAllCompleted = useCallback(() => {
    return uploadState.files.length > 0 && 
           uploadState.files.every(f => f.status === 'completed')
  }, [uploadState.files])

  // 获取错误信息
  const getErrors = useCallback(() => {
    return uploadState.files
      .filter(f => f.status === 'error')
      .map(f => ({ fileName: f.file.name, error: f.error }))
  }, [uploadState.files])

  return {
    // 状态
    uploadState,
    
    // 文件操作
    addFiles,
    removeFile,
    clearFiles,
    
    // 验证
    validateFile,
    validateFiles,
    
    // 上传操作
    uploadFile,
    uploadFiles,
    retryFailedFiles,
    
    // 统计信息
    getFileStats,
    getFileTypeStats,
    
    // 状态检查
    hasErrors,
    isAllCompleted,
    getErrors
  }
} 