# 文件解析功能文档

## 概述

EzA 的文件解析功能支持多种文件格式的智能解析，包括 PDF 文本提取、图片 OCR 识别、Word 文档解析等。该功能为课程材料上传和 AI 分析提供了强大的基础支持。

## 功能特性

### 支持的文件格式

- **PDF 文档** (.pdf)

  - 文本提取
  - 页数统计
  - 结构化内容解析

- **Word 文档** (.doc, .docx)

  - 文本内容提取
  - 格式保持
  - 表格和列表识别

- **图片文件** (.jpg, .jpeg, .png, .gif, .bmp, .webp)

  - OCR 文字识别
  - 中英文混合识别
  - 图片质量优化

- **文本文件** (.txt, .md, .rtf)
  - 直接文本读取
  - 编码自动检测
  - 格式保持

### 核心功能

1. **智能文件类型检测**

   - 基于文件扩展名和 MIME 类型
   - 自动选择合适的解析方法

2. **批量文件处理**

   - 支持多文件同时上传
   - 进度追踪和状态管理
   - 错误处理和重试机制

3. **内容提取和清理**

   - 文本内容提取
   - OCR 结果优化
   - 关键信息识别（日期、邮箱、URL 等）

4. **元数据统计**
   - 文件大小和类型统计
   - 字数统计
   - 解析质量评估

## 技术实现

### 依赖库

```json
{
  "pdfjs-dist": "^4.0.379", // PDF 文本提取
  "tesseract.js": "^5.0.4", // OCR 文字识别
  "mammoth": "^1.6.0", // Word 文档解析
  "docx": "^8.5.0" // Word 文档处理
}
```

### 核心类和方法

#### FileParser 类

```typescript
class FileParser {
  // 单例模式
  static getInstance(): FileParser;

  // 解析文件
  async parseFile(file: File): Promise<{
    text: string;
    metadata: {
      fileName: string;
      fileSize: number;
      fileType: string;
      pageCount?: number;
      wordCount: number;
      extractedAt: string;
    };
  }>;

  // 从 PDF 提取文本
  async extractTextFromPDF(file: File): Promise<string>;

  // 从图片提取文本（OCR）
  async extractTextFromImage(file: File): Promise<string>;

  // 从 Word 文档提取文本
  async extractTextFromWord(file: File): Promise<string>;

  // 清理 OCR 结果
  cleanOCRText(text: string): string;

  // 提取关键信息
  extractKeyInfo(text: string): {
    dates: string[];
    numbers: string[];
    emails: string[];
    urls: string[];
  };
}
```

#### FileTypeDetector 工具

```typescript
const FileTypeDetector = {
  isPDF(file: File): boolean
  isImage(file: File): boolean
  isWordDocument(file: File): boolean
  isTextFile(file: File): boolean
  getFileTypeDescription(file: File): string
  isSupported(file: File): boolean
}
```

#### FileUploadProgress 类

```typescript
class FileUploadProgress {
  constructor(
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: Error) => void
  );

  async parseWithProgress(file: File): Promise<any>;
}
```

## 使用方法

### 基本文件解析

```typescript
import { FileParser } from "@/utils/fileParser";

const parser = FileParser.getInstance();

// 解析单个文件
const result = await parser.parseFile(file);
console.log("提取的文本:", result.text);
console.log("文件元数据:", result.metadata);
```

### 文件上传和解析

```typescript
import { useFileUpload } from "@/hooks/useFileUpload";
import { materialsApi } from "@/api/courses";

const { addFiles, uploadFiles, uploadState } = useFileUpload();

// 添加文件到上传队列
const fileIds = addFiles(selectedFiles);

// 上传并解析文件
const results = await uploadFiles(courseId, "syllabus");
```

### 批量文件处理

```typescript
import { BatchFileParser } from "@/utils/fileParser";

const batchParser = new BatchFileParser();

// 批量解析文件
const results = await batchParser.parseFiles(files);

// 合并多个文件的文本
const mergedText = batchParser.mergeTexts(results);
```

### 文件类型检测

```typescript
import { FileTypeDetector } from "@/utils/fileParser";

// 检查文件类型
if (FileTypeDetector.isPDF(file)) {
  console.log("这是一个 PDF 文件");
}

// 获取文件类型描述
const description = FileTypeDetector.getFileTypeDescription(file);
console.log("文件类型:", description);
```

## 组件使用

### FileUploadDemo 组件

```tsx
import { FileUploadDemo } from "@/components/FileUploadDemo";

function CourseMaterialsPage() {
  const handleUploadComplete = (materials) => {
    console.log("上传完成的材料:", materials);
  };

  return (
    <FileUploadDemo
      courseId="course-123"
      onUploadComplete={handleUploadComplete}
    />
  );
}
```

## 配置和优化

### OCR 配置

```typescript
// 初始化 Tesseract OCR
private async initTesseract(): Promise<void> {
  if (!this.tesseractWorker) {
    // 支持中文简体和英文
    this.tesseractWorker = await createWorker('chi_sim+eng')
  }
}
```

### PDF.js 配置

```typescript
// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

### 文件大小限制

```typescript
// 文件大小验证（10MB）
if (file.size > 10 * 1024 * 1024) {
  throw new Error("文件大小超过限制");
}
```

## 错误处理

### 常见错误类型

1. **文件格式不支持**

   ```typescript
   throw new Error("不支持的文件类型");
   ```

2. **文件大小超限**

   ```typescript
   throw new Error("文件大小超过限制");
   ```

3. **解析失败**

   ```typescript
   throw new Error("PDF 文件解析失败，请确保文件格式正确");
   ```

4. **OCR 识别失败**
   ```typescript
   throw new Error("图片文字识别失败，请确保图片清晰可读");
   ```

### 错误处理策略

```typescript
try {
  const result = await parser.parseFile(file);
  // 处理成功结果
} catch (error) {
  console.error("文件解析失败:", error);
  // 显示用户友好的错误信息
  showErrorMessage(error.message);
}
```

## 性能优化

### 1. 单例模式

- FileParser 使用单例模式避免重复初始化
- Tesseract worker 复用，减少内存占用

### 2. 异步处理

- 文件解析使用异步操作，不阻塞 UI
- 支持进度回调，提供实时反馈

### 3. 资源管理

```typescript
// 释放 OCR worker 资源
async dispose(): Promise<void> {
  if (this.tesseractWorker) {
    await this.tesseractWorker.terminate()
    this.tesseractWorker = null
  }
}
```

### 4. 批量处理优化

- 支持批量文件上传
- 并行处理多个文件
- 错误隔离，单个文件失败不影响其他文件

## 安全考虑

### 1. 文件类型验证

```typescript
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
```

### 2. 文件大小限制

- 单个文件最大 10MB
- 防止恶意大文件上传

### 3. 内容安全

- 文本内容清理和验证
- 防止 XSS 攻击

## 部署注意事项

### 1. CDN 配置

- PDF.js worker 需要从 CDN 加载
- 确保网络访问正常

### 2. 内存管理

- 大文件处理时注意内存使用
- 及时释放不需要的资源

### 3. 错误监控

- 记录解析失败的文件和原因
- 监控 OCR 识别准确率

## 扩展功能

### 1. 自定义解析器

```typescript
interface CustomParser {
  canParse(file: File): boolean;
  parse(file: File): Promise<string>;
}

// 注册自定义解析器
FileParser.registerParser(customParser);
```

### 2. 解析结果缓存

```typescript
// 缓存解析结果，避免重复解析
const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
const cachedResult = await cache.get(cacheKey);
```

### 3. 解析质量评估

```typescript
// 评估解析质量
const quality = assessParseQuality(extractedText, originalFile);
if (quality < 0.8) {
  // 提示用户检查文件质量
}
```

## 测试

### 单元测试

```typescript
describe("FileParser", () => {
  test("should parse PDF correctly", async () => {
    const parser = FileParser.getInstance();
    const result = await parser.parseFile(pdfFile);
    expect(result.text).toBeTruthy();
    expect(result.metadata.pageCount).toBeGreaterThan(0);
  });
});
```

### 集成测试

```typescript
describe("File Upload Integration", () => {
  test("should upload and parse multiple files", async () => {
    const results = await uploadFiles(courseId, files);
    expect(results.length).toBe(files.length);
  });
});
```

## 常见问题

### Q: OCR 识别准确率不高怎么办？

A:

- 确保图片清晰度足够
- 使用支持的图片格式
- 考虑图片预处理（去噪、增强对比度）

### Q: PDF 解析失败怎么办？

A:

- 检查 PDF 是否为扫描版
- 确认 PDF 没有密码保护
- 尝试重新上传文件

### Q: 大文件处理慢怎么办？

A:

- 考虑文件大小限制
- 使用进度提示
- 实现后台处理

### Q: 如何提高解析性能？

A:

- 使用 Web Workers 进行后台处理
- 实现结果缓存
- 优化文件预处理流程
