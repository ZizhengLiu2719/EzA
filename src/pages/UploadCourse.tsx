import { useState } from 'react'
import styles from './UploadCourse.module.css'

const UploadCourse = () => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])

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
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 实现文件上传和解析逻辑
    console.log('Uploading files:', files)
  }

  return (
    <div className={styles.uploadPage}>
      <div className="container">
        <div className={styles.header}>
          <h1>上传课程资料</h1>
          <p>上传你的syllabus、教材或讲义，让EzA为你自动规划学习路径</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.uploadForm}>
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
              <p>支持 PDF、Word、文本文件和图片</p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className={styles.fileList}>
              <h3>已选择的文件：</h3>
              {files.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span>{file.name}</span>
                  <span className={styles.fileSize}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={files.length === 0}
          >
            开始解析课程
          </button>
        </form>
      </div>
    </div>
  )
}

export default UploadCourse 