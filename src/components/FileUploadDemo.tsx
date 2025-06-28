import { useFileUpload } from '@/hooks/useFileUpload'
import { FileTypeDetector, formatFileSize } from '@/utils/fileParser'
import { AlertCircle, CheckCircle, File, FileText, Image, Loader, Upload, X } from 'lucide-react'
import React, { useRef, useState } from 'react'
import styles from './FileUploadDemo.module.css'

interface FileUploadDemoProps {
  courseId: string
  onUploadComplete?: (materials: any[]) => void
}

export const FileUploadDemo: React.FC<FileUploadDemoProps> = ({ 
  courseId, 
  onUploadComplete 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState<'syllabus' | 'textbook' | 'lecture_notes' | 'assignment' | 'other'>('syllabus')
  
  const {
    uploadState,
    addFiles,
    removeFile,
    clearFiles,
    validateFiles,
    uploadFiles,
    retryFailedFiles,
    getFileStats,
    getFileTypeStats,
    hasErrors,
    isAllCompleted,
    getErrors
  } = useFileUpload()

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      const { valid, errors } = validateFiles(files)
      
      if (errors.length > 0) {
        alert(`The following files have issues:\n${errors.join('\n')}`)
      }
      
      if (valid.length > 0) {
        addFiles(valid)
      }
    }
    
    // 清空 input 值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理拖拽
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    if (files.length > 0) {
      const { valid, errors } = validateFiles(files)
      
      if (errors.length > 0) {
        alert(`The following files have issues:\n${errors.join('\n')}`)
      }
      
      if (valid.length > 0) {
        addFiles(valid)
      }
    }
  }

  // 开始上传
  const handleUpload = async () => {
    if (uploadState.files.length === 0) return
    
    const results = await uploadFiles(courseId, selectedType)
    
    if (onUploadComplete && results.length > 0) {
      onUploadComplete(results)
    }
  }

  // 重试失败的文件
  const handleRetry = async () => {
    if (!hasErrors()) return
    
    const results = await retryFailedFiles(courseId, selectedType)
    
    if (onUploadComplete && results.length > 0) {
      onUploadComplete(results)
    }
  }

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (FileTypeDetector.isPDF(file)) return <FileText className={styles.fileIcon} />
    if (FileTypeDetector.isImage(file)) return <Image className={styles.fileIcon} />
    if (FileTypeDetector.isWordDocument(file)) return <File className={styles.fileIcon} />
    return <FileText className={styles.fileIcon} />
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={styles.statusIcon} />
      case 'error':
        return <AlertCircle className={styles.statusIcon} />
      case 'uploading':
      case 'processing':
        return <Loader className={`${styles.statusIcon} ${styles.spinning}`} />
      default:
        return null
    }
  }

  const stats = getFileStats()
  const typeStats = getFileTypeStats()

  return (
    <div className={styles.container}>
      {/* 文件类型选择 */}
      <div className={styles.typeSelector}>
        <label>File Type:</label>
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value as any)}
        >
          <option value="syllabus">Syllabus</option>
          <option value="textbook">Textbook</option>
          <option value="lecture_notes">Lecture Notes</option>
          <option value="assignment">Assignment</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* 拖拽上传区域 */}
      <div 
        className={styles.dropZone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={styles.uploadIcon} />
        <p>Drag files here or click to select files</p>
        <p className={styles.supportedTypes}>
          Supported: PDF, Word, Image, Text files (Max 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileSelect}
          className={styles.hiddenInput}
        />
      </div>

      {/* 文件列表 */}
      {uploadState.files.length > 0 && (
        <div className={styles.fileList}>
          <div className={styles.fileListHeader}>
            <h3>File List ({uploadState.files.length})</h3>
            <button 
              onClick={clearFiles}
              className={styles.clearButton}
            >
              Clear
            </button>
          </div>
          
          {uploadState.files.map((fileData) => (
            <div key={fileData.id} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                {getFileIcon(fileData.file)}
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{fileData.file.name}</span>
                  <span className={styles.fileSize}>
                    {formatFileSize(fileData.file.size)}
                  </span>
                </div>
              </div>
              
              <div className={styles.fileStatus}>
                {getStatusIcon(fileData.status)}
                <span className={styles.statusText}>{fileData.status}</span>
                {fileData.progress > 0 && fileData.progress < 100 && (
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${fileData.progress}%` }}
                    />
                  </div>
                )}
                {fileData.error && (
                  <span className={styles.errorText}>{fileData.error}</span>
                )}
              </div>
              
              <button
                onClick={() => removeFile(fileData.id)}
                className={styles.removeButton}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {uploadState.files.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>Total Files:</span>
            <span>{stats.total}</span>
          </div>
          <div className={styles.statItem}>
            <span>Completed:</span>
            <span>{stats.completed}</span>
          </div>
          <div className={styles.statItem}>
            <span>Errors:</span>
            <span>{stats.error}</span>
          </div>
          <div className={styles.statItem}>
            <span>Total Size:</span>
            <span>{stats.totalSizeFormatted}</span>
          </div>
        </div>
      )}

      {/* 文件类型统计 */}
      {Object.keys(typeStats).length > 0 && (
        <div className={styles.typeStats}>
          <h4>File Type Distribution:</h4>
          <div className={styles.typeList}>
            {Object.entries(typeStats).map(([type, count]) => (
              <span key={type} className={styles.typeTag}>
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actions}>
        {uploadState.files.length > 0 && !uploadState.isUploading && (
          <button 
            onClick={handleUpload}
            className={styles.uploadButton}
            disabled={uploadState.files.filter(f => f.status === 'pending').length === 0}
          >
            Start Upload ({uploadState.files.filter(f => f.status === 'pending').length})
          </button>
        )}
        
        {hasErrors() && (
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            Retry Failed Files ({stats.error})
          </button>
        )}
        
        {isAllCompleted() && (
          <div className={styles.successMessage}>
            ✅ All files uploaded successfully!
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {getErrors().length > 0 && (
        <div className={styles.errorList}>
          <h4>Error Details:</h4>
          {getErrors().map((error, index) => (
            <div key={index} className={styles.errorItem}>
              <strong>{error.fileName}:</strong> {error.error}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 