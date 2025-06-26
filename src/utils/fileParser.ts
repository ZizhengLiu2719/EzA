import mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'

// 动态导入 PDF.js 以避免构建问题
let pdfjsLib: any = null

async function getPdfJs() {
  if (!pdfjsLib) {
    // 使用 CDN 版本
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    document.head.appendChild(script)
    
    await new Promise((resolve) => {
      script.onload = resolve
    })
    
    pdfjsLib = (window as any).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }
  return pdfjsLib
}

// 文件解析器类
export class FileParser {
  private static instance: FileParser
  private tesseractWorker: any = null

  private constructor() {}

  static getInstance(): FileParser {
    if (!FileParser.instance) {
      FileParser.instance = new FileParser()
    }
    return FileParser.instance
  }

  // 初始化 Tesseract OCR
  private async initTesseract(): Promise<void> {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker('chi_sim+eng')
    }
  }

  // 从 PDF 提取文本
  async extractTextFromPDF(file: File): Promise<string> {
    try {
      const pdfjs = await getPdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += pageText + '\n\n'
      }
      
      return fullText.trim()
    } catch (error) {
      console.error('PDF 解析失败:', error)
      throw new Error('PDF 文件解析失败，请确保文件格式正确')
    }
  }

  // 从图片提取文本（OCR）
  async extractTextFromImage(file: File): Promise<string> {
    try {
      await this.initTesseract()
      
      const result = await this.tesseractWorker.recognize(file)
      return result.data.text.trim()
    } catch (error) {
      console.error('OCR 解析失败:', error)
      throw new Error('图片文字识别失败，请确保图片清晰可读')
    }
  }

  // 从 Word 文档提取文本
  async extractTextFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      return result.value.trim()
    } catch (error) {
      console.error('Word 文档解析失败:', error)
      throw new Error('Word 文档解析失败，请确保文件格式正确')
    }
  }

  // 从文本文件提取文本
  async extractTextFromText(file: File): Promise<string> {
    try {
      return await file.text()
    } catch (error) {
      console.error('文本文件读取失败:', error)
      throw new Error('文本文件读取失败')
    }
  }

  // 通用文件解析方法
  async parseFile(file: File): Promise<{
    text: string
    metadata: {
      fileName: string
      fileSize: number
      fileType: string
      pageCount?: number
      wordCount: number
      extractedAt: string
    }
  }> {
    let text = ''
    let pageCount: number | undefined

    try {
      // 根据文件类型选择解析方法
      if (file.type === 'application/pdf') {
        text = await this.extractTextFromPDF(file)
        // 获取 PDF 页数
        const pdfjs = await getPdfJs()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
        pageCount = pdf.numPages
      } else if (file.type.startsWith('image/')) {
        text = await this.extractTextFromImage(file)
      } else if (file.type.includes('word') || file.type.includes('document')) {
        text = await this.extractTextFromWord(file)
      } else if (file.type === 'text/plain') {
        text = await this.extractTextFromText(file)
      } else {
        throw new Error('不支持的文件类型')
      }

      // 计算字数
      const wordCount = this.countWords(text)

      return {
        text,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          pageCount,
          wordCount,
          extractedAt: new Date().toISOString()
        }
      }
    } catch (error: any) {
      console.error('文件解析失败:', error)
      throw new Error(`文件解析失败: ${error.message}`)
    }
  }

  // 计算字数
  private countWords(text: string): number {
    // 移除多余空格和换行符
    const cleanText = text.replace(/\s+/g, ' ').trim()
    
    // 中文字符计数
    const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length
    
    // 英文单词计数
    const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length
    
    // 数字计数
    const numbers = (cleanText.match(/\d+/g) || []).length
    
    return chineseChars + englishWords + numbers
  }

  // 清理 OCR 结果
  cleanOCRText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[^\w\s\u4e00-\u9fa5.,!?;:()]/g, '') // 移除特殊字符
      .trim()
  }

  // 提取关键信息
  extractKeyInfo(text: string): {
    dates: string[]
    numbers: string[]
    emails: string[]
    urls: string[]
  } {
    const dates = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/g) || []
    const numbers = text.match(/\d+(?:\.\d+)?/g) || []
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
    const urls = text.match(/https?:\/\/[^\s]+/g) || []

    return {
      dates: [...new Set(dates)],
      numbers: [...new Set(numbers)],
      emails: [...new Set(emails)],
      urls: [...new Set(urls)]
    }
  }

  // 释放资源
  async dispose(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate()
      this.tesseractWorker = null
    }
  }
}

// 文件类型检测
export const FileTypeDetector = {
  // 检查是否为 PDF
  isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  },

  // 检查是否为图片
  isImage(file: File): boolean {
    return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
  },

  // 检查是否为 Word 文档
  isWordDocument(file: File): boolean {
    return file.type.includes('word') || 
           file.type.includes('document') || 
           /\.(doc|docx)$/i.test(file.name)
  },

  // 检查是否为文本文件
  isTextFile(file: File): boolean {
    return file.type === 'text/plain' || /\.(txt|md|rtf)$/i.test(file.name)
  },

  // 获取文件类型描述
  getFileTypeDescription(file: File): string {
    if (this.isPDF(file)) return 'PDF 文档'
    if (this.isImage(file)) return '图片文件'
    if (this.isWordDocument(file)) return 'Word 文档'
    if (this.isTextFile(file)) return '文本文件'
    return '未知文件类型'
  },

  // 检查文件是否支持解析
  isSupported(file: File): boolean {
    return this.isPDF(file) || 
           this.isImage(file) || 
           this.isWordDocument(file) || 
           this.isTextFile(file)
  }
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件上传进度追踪
export class FileUploadProgress {
  private onProgress?: (progress: number) => void
  private onComplete?: (result: any) => void
  private onError?: (error: Error) => void

  constructor(
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: Error) => void
  ) {
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.onError = onError
  }

  // 模拟解析进度
  async parseWithProgress(file: File): Promise<any> {
    try {
      // 开始解析
      this.onProgress?.(10)
      
      const parser = FileParser.getInstance()
      
      // 解析文件
      this.onProgress?.(30)
      const result = await parser.parseFile(file)
      
      // 后处理
      this.onProgress?.(70)
      const cleanedText = parser.cleanOCRText(result.text)
      const keyInfo = parser.extractKeyInfo(cleanedText)
      
      this.onProgress?.(90)
      
      const finalResult = {
        ...result,
        text: cleanedText,
        keyInfo
      }
      
      this.onProgress?.(100)
      this.onComplete?.(finalResult)
      
      return finalResult
    } catch (error: any) {
      this.onError?.(error)
      throw error
    }
  }
}

// 批量文件解析
export class BatchFileParser {
  private parser: FileParser

  constructor() {
    this.parser = FileParser.getInstance()
  }

  // 批量解析文件
  async parseFiles(files: File[]): Promise<Array<{
    file: File
    result: any
    error?: string
  }>> {
    const results = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const result = await this.parser.parseFile(file)
        results.push({ file, result })
      } catch (error: any) {
        results.push({ file, result: null, error: error.message })
      }
    }
    
    return results
  }

  // 合并多个文件的文本
  mergeTexts(results: Array<{ file: File; result: any; error?: string }>): string {
    return results
      .filter(item => !item.error && item.result)
      .map(item => item.result.text)
      .join('\n\n--- 文件分割线 ---\n\n')
  }
} 