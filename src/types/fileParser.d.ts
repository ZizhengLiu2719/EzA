declare module 'tesseract.js' {
  export function createWorker(languages?: string): Promise<{
    recognize(file: File): Promise<{
      data: {
        text: string
      }
    }>
    terminate(): Promise<void>
  }>
}

declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string
  }>
}

declare module 'docx' {
  export class Document {
    constructor(options?: any)
  }
  
  export class Packer {
    static toBuffer(doc: Document): Promise<Buffer>
  }
  
  export class Paragraph {
    constructor(options?: any)
  }
  
  export class TextRun {
    constructor(options?: any)
  }
} 