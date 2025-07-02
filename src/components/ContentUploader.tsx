import { FileUp, UploadCloud } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import styles from './ContentUploader.module.css';

interface ContentUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const ContentUploader: React.FC<ContentUploaderProps> = ({ onFileUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  return (
    <div className={styles.uploaderContainer}>
      <p className={styles.uploaderTitle}>
        <FileUp size={18} />
        <span>AI-Powered Topic Extraction</span>
      </p>
      <p className={styles.uploaderSubtitle}>
        Upload a Syllabus, PPT, or notes (.pdf, .txt, .docx) to automatically identify key topics for your exam.
      </p>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          type="file"
          id="file-input"
          className={styles.fileInput}
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx,.md"
          disabled={isLoading}
        />
        {isLoading ? (
          <>
            <div className={styles.spinner} />
            <span className={styles.dropzoneText}>Analyzing Document...</span>
          </>
        ) : (
          <>
            <UploadCloud size={32} className={styles.uploadIcon} />
            {fileName ? (
              <span className={styles.fileName}>{fileName}</span>
            ) : (
              <span className={styles.dropzoneText}>
                Drag & Drop file here or <strong>click to browse</strong>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentUploader; 