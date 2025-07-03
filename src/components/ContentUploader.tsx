/**
 * Content Uploader Component
 * A unified component for uploading various file types (PDF, DOCX, TXT, images)
 * and extracting their text content on the client-side.
 */
import { UploadCloud } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import React, { useCallback, useState } from 'react';
import Tesseract from 'tesseract.js';
import styles from './ContentUploader.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ContentUploaderProps {
  onContentExtracted: (content: string, fileName: string) => void;
  onExtractionError: (error: string) => void;
}

type UploadState = 'idle' | 'processing' | 'success' | 'error';

const ContentUploader: React.FC<ContentUploaderProps> = ({
  onContentExtracted,
  onExtractionError,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Drag & drop your files here, or click to browse');

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    await processFile(file);
  }, []);

  const processFile = async (file: File) => {
    setUploadState('processing');
    setStatusText(`Processing: ${file.name}`);
    setProgress(0);

    try {
      let text = '';
      const fileType = file.type;

      if (fileType === 'application/pdf') {
        text = await parsePdf(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await parseDocx(file);
      } else if (fileType.startsWith('image/')) {
        text = await parseImage(file);
      } else if (fileType === 'text/plain') {
        text = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      onContentExtracted(text, file.name);
      setUploadState('success');
      setStatusText(`Successfully extracted content from ${file.name}`);
    } catch (error: any) {
      console.error('File processing error:', error);
      const errorMessage = error.message || 'An unknown error occurred during file processing.';
      onExtractionError(errorMessage);
      setUploadState('error');
      setStatusText(errorMessage);
    }
  };

  const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      setProgress(Math.round((i / pdf.numPages) * 100));
    }
    return fullText;
  };

  const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  };

  const parseImage = async (file: File): Promise<string> => {
    setStatusText('Performing OCR on image...');
    const { data: { text } } = await (Tesseract as any).recognize(file, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });
    return text;
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <div className={styles.uploaderContainer}>
      <div 
        className={`${styles.dropzone} ${uploadState === 'processing' ? styles.processing : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => (document.getElementById('file-input') as HTMLInputElement).click()}
      >
        <input
          id="file-input"
          type="file"
          className={styles.fileInput}
          onChange={(e) => handleFileChange(e.target.files)}
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
        />
        <div className={styles.uploaderContent}>
          <UploadCloud size={48} className={styles.uploadIcon} />
          <p className={styles.statusText}>{statusText}</p>
          {uploadState === 'processing' && (
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className={styles.supportedFormats}>
            Supported formats: PDF, DOCX, TXT, JPG, PNG
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentUploader; 