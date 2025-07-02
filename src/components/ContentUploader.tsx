import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle, FileUp, Loader2, XCircle } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { examAI } from '../services/examAI';
import styles from './ContentUploader.module.css';

interface ContentUploaderProps {
  onTopicsExtracted: (topics: string[]) => void;
  className?: string;
}

type UploadState = 'idle' | 'processing' | 'success' | 'error';

const ContentUploader: React.FC<ContentUploaderProps> = ({ onTopicsExtracted, className }) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!supportedTypes.includes(file.type)) {
      setErrorMessage('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      setUploadState('error');
      return;
    }

    setUploadState('processing');
    setFileName(file.name);
    setErrorMessage(null);

    try {
      const topics = await examAI.extractTopicsFromDocument(file);
      onTopicsExtracted(topics);
      setUploadState('success');
    } catch (error: any) {
      console.error('Error extracting topics from document:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      setUploadState('error');
    }
  }, [onTopicsExtracted]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const resetState = () => {
    setUploadState('idle');
    setFileName(null);
    setErrorMessage(null);
  }

  const renderStateContent = () => {
    switch (uploadState) {
      case 'processing':
        return (
          <>
            <Loader2 className={`w-8 h-8 text-blue-500 animate-spin ${styles.icon}`} />
            <p className="font-semibold text-blue-600">AI is analyzing your document...</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className={`w-8 h-8 text-green-500 ${styles.icon}`} />
            <p className="font-semibold text-green-600">Successfully extracted topics!</p>
            <button onClick={resetState} className={styles.tryAgainButton}>Upload another file</button>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className={`w-8 h-8 text-red-500 ${styles.icon}`} />
            <p className="font-semibold text-red-600">Analysis Failed</p>
            <p className="text-sm text-red-500 px-4">{errorMessage}</p>
            <button onClick={resetState} className={styles.tryAgainButton}>Try Again</button>
          </>
        );
      case 'idle':
      default:
        return (
          <>
            <div className="flex items-center justify-center gap-2 text-gray-500">
               <FileUp className={`w-6 h-6 ${styles.icon}`} />
               <BrainCircuit className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <p className="font-semibold text-gray-700">Drop your syllabus, notes, or PPT here</p>
            <p className="text-sm text-gray-500">or <span className="text-blue-600 font-medium">click to browse</span></p>
            <p className="text-xs text-gray-400 mt-2">Supports PDF, DOCX, TXT</p>
          </>
        );
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <input
        type="file"
        id="file-upload"
        className={styles.fileInput}
        onChange={onFileChange}
        accept=".pdf,.docx,.txt"
        disabled={uploadState === 'processing'}
      />
      <label
        htmlFor="file-upload"
        className={`${styles.dropzone} ${uploadState !== 'idle' ? styles.processing : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <motion.div
          key={uploadState}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={styles.stateContent}
        >
          {renderStateContent()}
        </motion.div>
      </label>
    </div>
  );
};

export default ContentUploader; 