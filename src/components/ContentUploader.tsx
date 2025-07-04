/**
 * Content Uploader Component
 * A unified component for uploading various file types (PDF, DOCX, TXT, images)
 * and extracting their text content on the client-side. Now supports multiple files.
 */
import { CheckCircle, FileText, Loader, UploadCloud, XCircle } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import React, { useCallback, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';
import styles from './ContentUploader.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ContentUploaderProps {
  onContentExtracted: (content: string, fileNames: string[]) => void;
  onExtractionError: (error: string) => void;
  processImmediately?: boolean;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  extractedText?: string;
  error?: string;
}

const ContentUploader: React.FC<ContentUploaderProps> = ({
  onContentExtracted,
  onExtractionError,
  processImmediately = false,
}) => {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const isProcessing = fileStatuses.some(fs => fs.status === 'processing');

  const updateFileStatus = (fileName: string, updates: Partial<FileStatus>) => {
    setFileStatuses(prev => 
      prev.map(fs => fs.file.name === fileName ? { ...fs, ...updates } : fs)
    );
  };

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFileStatuses: FileStatus[] = Array.from(files).map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    
    setFileStatuses(prev => [...prev, ...newFileStatuses.filter(fs => !prev.some(pfs => pfs.file.name === fs.file.name))]);
  }, []);

  useEffect(() => {
    const pendingFiles = fileStatuses.filter(fs => fs.status === 'pending');
    if (processImmediately && pendingFiles.length > 0 && !isProcessing) {
      handleProcessFiles();
    }
  }, [fileStatuses, processImmediately, isProcessing]);

  const handleProcessFiles = async () => {
    // 1. Set status to 'processing' for UI feedback
    setFileStatuses(prev =>
      prev.map(fs => (fs.status === 'pending' ? { ...fs, status: 'processing' } : fs))
    );
  
    const filesToProcess = fileStatuses.filter(fs => fs.status === 'pending');
  
    // 2. Process all files and collect the results
    const results = await Promise.all(
      filesToProcess.map(async ({ file }) => {
        const progressCallback = (progress: number) => {
          setFileStatuses(prev =>
            prev.map(pfs => (pfs.file.name === file.name ? { ...pfs, progress } : pfs))
          );
        };
  
        try {
          let text = '';
          const fileType = file.type;
  
          if (fileType === 'application/pdf') {
            text = await parsePdf(file, progressCallback);
          } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            text = await parseDocx(file, progressCallback);
          } else if (fileType.startsWith('image/')) {
            text = await parseImage(file, progressCallback);
          } else if (fileType === 'text/plain') {
            text = await file.text();
          } else {
            throw new Error(`Unsupported file type: ${fileType}`);
          }
          return { name: file.name, status: 'success' as const, extractedText: text };
        } catch (error: any) {
          const errorMessage = error.message || 'An unknown error occurred.';
          return { name: file.name, status: 'error' as const, error: errorMessage };
        }
      })
    );
  
    // 3. Update final statuses based on results
    setFileStatuses(prev =>
      prev.map(fs => {
        const result = results.find(r => r.name === fs.file.name);
        if (!result) return fs;
        return {
          ...fs,
          status: result.status,
          progress: 100,
          extractedText: result.status === 'success' ? result.extractedText : undefined,
          error: result.status === 'error' ? result.error : undefined,
        };
      })
    );
  
    // 4. Notify parent component *after* all state updates are committed
    const successfulExtractions = results.filter(r => r.status === 'success');
    if (successfulExtractions.length > 0) {
      const combinedText = successfulExtractions.map(r => r.extractedText).join('\n\n---\n\n');
      const fileNames = successfulExtractions.map(r => r.name);
      onContentExtracted(combinedText, fileNames);
    }
  
    const failedExtractions = results.filter(r => r.status === 'error');
    if (failedExtractions.length > 0) {
      onExtractionError(`${failedExtractions.length} file(s) failed to process.`);
    }
  };

  const parsePdf = async (file: File, progressCallback: (p: number) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      progressCallback(Math.round((i / pdf.numPages) * 100));
    }
    return fullText;
  };

  const parseDocx = async (file: File, progressCallback: (p: number) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    progressCallback(50);
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    progressCallback(100);
    return value;
  };

  const parseImage = async (file: File, progressCallback: (p: number) => void): Promise<string> => {
    const { data: { text } } = await (Tesseract as any).recognize(file, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          progressCallback(Math.round(m.progress * 100));
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

  const renderFileStatus = () => (
    <div className={styles.fileList}>
      {fileStatuses.map(({ file, status, progress, error }) => (
        <div key={file.name} className={styles.fileRow}>
          <FileText className={styles.fileIcon} />
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{file.name}</span>
            {status === 'processing' && (
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              </div>
            )}
             {status === 'error' && <span className={styles.errorText}>{error}</span>}
          </div>
          <div className={styles.statusIcon}>
            {status === 'pending' && <Loader size={18} className="animate-spin" />}
            {status === 'processing' && <Loader size={18} className="animate-spin" />}
            {status === 'success' && <CheckCircle size={18} className={styles.successIcon} />}
            {status === 'error' && <XCircle size={18} className={styles.errorIcon} />}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className={styles.uploaderContainer}>
      <div 
        className={`${styles.dropzone} ${fileStatuses.length > 0 ? styles.hasFiles : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => (document.getElementById('file-input') as HTMLInputElement).click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className={styles.fileInput}
          onChange={(e) => handleFileChange(e.target.files)}
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
        />
        <div className={styles.uploaderContent}>
          <UploadCloud size={48} className={styles.uploadIcon} />
          <p className={styles.statusText}>Drag & drop files here, or click to browse</p>
          <p className={styles.supportedFormats}>
            Supported formats: PDF, DOCX, TXT, JPG, PNG
          </p>
        </div>
      </div>
      {fileStatuses.length > 0 && (
        processImmediately ? (
          renderFileStatus()
        ) : (
          <>
            {renderFileStatus()}
            <div className={styles.actionsContainer}>
              <button
                onClick={handleProcessFiles}
                className={styles.processButton}
                disabled={isProcessing || !fileStatuses.some(fs => fs.status === 'pending')}
              >
                {isProcessing ? 'Processing...' : `Confirm and Process ${fileStatuses.filter(fs => fs.status === 'pending').length} File(s)`}
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ContentUploader; 