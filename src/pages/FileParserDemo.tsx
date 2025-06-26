import { materialsApi } from '@/api/courses'
import { FileUploadDemo } from '@/components/FileUploadDemo'
import { FileParser, FileTypeDetector } from '@/utils/fileParser'
import { AlertCircle, CheckCircle, File, FileText, Image } from 'lucide-react'
import React, { useState } from 'react'
import styles from './FileParserDemo.module.css'

export const FileParserDemo: React.FC = () => {
  const [demoCourseId] = useState('demo-course-123')
  const [materials, setMaterials] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // 处理文件上传完成
  const handleUploadComplete = async (uploadedMaterials: any[]) => {
    setMaterials(prev => [...prev, ...uploadedMaterials])
    
    // 获取材料统计
    await loadMaterialStats()
  }

  // 加载材料统计
  const loadMaterialStats = async () => {
    setIsLoadingStats(true)
    try {
      const result = await materialsApi.getMaterialStats(demoCourseId)
      if (result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // 测试文件解析
  const testFileParsing = async () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp'
    
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const parser = FileParser.getInstance()
        const result = await parser.parseFile(file)
        
        alert(`
文件解析结果：
文件名: ${result.metadata.fileName}
文件大小: ${(result.metadata.fileSize / 1024).toFixed(2)} KB
文件类型: ${FileTypeDetector.getFileTypeDescription(file)}
字数: ${result.metadata.wordCount}
页数: ${result.metadata.pageCount || 'N/A'}

提取的文本（前200字符）:
${result.text.substring(0, 200)}...
        `)
      } catch (error: any) {
        alert(`解析失败: ${error.message}`)
      }
    }
    
    fileInput.click()
  }

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('PDF')) return <FileText className={styles.fileIcon} />
    if (fileType.includes('图片')) return <Image className={styles.fileIcon} />
    if (fileType.includes('Word')) return <File className={styles.fileIcon} />
    return <FileText className={styles.fileIcon} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>文件解析功能演示</h1>
        <p>上传课程材料，体验智能文件解析功能</p>
      </div>

      <div className={styles.content}>
        {/* 功能说明 */}
        <div className={styles.features}>
          <h2>支持的文件格式</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <FileText className={styles.featureIcon} />
              <h3>PDF 文档</h3>
              <p>文本提取、页数统计、结构化解析</p>
            </div>
            <div className={styles.featureItem}>
              <File className={styles.featureIcon} />
              <h3>Word 文档</h3>
              <p>文本内容提取、格式保持、表格识别</p>
            </div>
            <div className={styles.featureItem}>
              <Image className={styles.featureIcon} />
              <h3>图片文件</h3>
              <p>OCR 文字识别、中英文混合、质量优化</p>
            </div>
            <div className={styles.featureItem}>
              <FileText className={styles.featureIcon} />
              <h3>文本文件</h3>
              <p>直接文本读取、编码检测、格式保持</p>
            </div>
          </div>
        </div>

        {/* 文件上传演示 */}
        <div className={styles.uploadSection}>
          <h2>文件上传演示</h2>
          <FileUploadDemo
            courseId={demoCourseId}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* 快速测试 */}
        <div className={styles.testSection}>
          <h2>快速测试</h2>
          <p>选择一个文件进行快速解析测试</p>
          <button 
            onClick={testFileParsing}
            className={styles.testButton}
          >
            测试文件解析
          </button>
        </div>

        {/* 材料列表 */}
        {materials.length > 0 && (
          <div className={styles.materialsSection}>
            <div className={styles.sectionHeader}>
              <h2>已上传的材料</h2>
              <button 
                onClick={loadMaterialStats}
                className={styles.refreshButton}
                disabled={isLoadingStats}
              >
                {isLoadingStats ? '加载中...' : '刷新统计'}
              </button>
            </div>
            
            <div className={styles.materialsList}>
              {materials.map((material, index) => (
                <div key={material.id || index} className={styles.materialItem}>
                  <div className={styles.materialInfo}>
                    {getFileTypeIcon(FileTypeDetector.getFileTypeDescription(material as any))}
                    <div className={styles.materialDetails}>
                      <h4>{material.name}</h4>
                      <p>类型: {material.type}</p>
                      <p>大小: {(material.file_size / 1024).toFixed(2)} KB</p>
                      {material.extracted_text && (
                        <p className={styles.textPreview}>
                          文本预览: {material.extracted_text.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles.materialStatus}>
                    {material.extracted_text ? (
                      <CheckCircle className={styles.statusIcon} />
                    ) : (
                      <AlertCircle className={styles.statusIcon} />
                    )}
                    <span>
                      {material.extracted_text ? '解析完成' : '解析失败'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 统计信息 */}
        {stats && (
          <div className={styles.statsSection}>
            <h2>解析统计</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>总材料数</h3>
                <p className={styles.statNumber}>{stats.totalMaterials}</p>
              </div>
              <div className={styles.statCard}>
                <h3>已解析</h3>
                <p className={styles.statNumber}>{stats.parsedMaterials}</p>
              </div>
              <div className={styles.statCard}>
                <h3>总字数</h3>
                <p className={styles.statNumber}>{stats.totalWords.toLocaleString()}</p>
              </div>
              <div className={styles.statCard}>
                <h3>解析率</h3>
                <p className={styles.statNumber}>
                  {stats.totalMaterials > 0 
                    ? ((stats.parsedMaterials / stats.totalMaterials) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            {/* 文件类型分布 */}
            {Object.keys(stats.fileTypes).length > 0 && (
              <div className={styles.fileTypeDistribution}>
                <h3>文件类型分布</h3>
                <div className={styles.typeBars}>
                  {Object.entries(stats.fileTypes).map(([type, count]) => (
                    <div key={type} className={styles.typeBar}>
                      <div className={styles.typeLabel}>{type}</div>
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.bar}
                          style={{ 
                            width: `${(Number(count) / stats.totalMaterials) * 100}%` 
                          }}
                        />
                      </div>
                      <div className={styles.typeCount}>{String(count)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 