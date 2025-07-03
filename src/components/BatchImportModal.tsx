/**
 * BatchImportModal Component - Bulk Import Flashcards
 * 批量导入闪卡功能：支持OCR、CSV、文档解析
 */

import React, { useState } from 'react'
import { CreateFlashcardData, createFlashcards } from '../api/flashcards'
import { flashcardAI, GeneratedAICard } from '../services/flashcardAI'
import styles from './BatchImportModal.module.css'
import ContentUploader from './ContentUploader'

interface BatchImportModalProps {
  isOpen: boolean
  onClose: () => void
  onCardsGenerated: (count: number) => void
  setId: string
}

type ImportStep = 'upload' | 'topic_selection' | 'generating' | 'preview' | 'success' | 'error'

const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, onCardsGenerated, setId }) => {
  const [step, setStep] = useState<ImportStep>('upload')
  const [error, setError] = useState<string>('')
  const [extractedContent, setExtractedContent] = useState('')
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [generatedCards, setGeneratedCards] = useState<GeneratedAICard[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [generationCount, setGenerationCount] = useState<number>(10);

  const handleContentExtracted = async (content: string, fileName: string) => {
    setStep('generating')
    setIsProcessing(true)
    setError('')
    try {
      setExtractedContent(content)
      const topics = await flashcardAI.extractTopicsFromDocument(content)
      setExtractedTopics(topics)
      setSelectedTopics(topics)
      setStep('topic_selection')
    } catch (e: any) {
      handleError(e.message || 'Failed to extract topics from the document.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateFromTopics = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic to generate flashcards.')
      return
    }
    setStep('generating')
    setIsProcessing(true)
    setError('')
    try {
      const cards = await flashcardAI.generateFlashcardsFromDocument(extractedContent, selectedTopics, generationCount)
      setGeneratedCards(cards)
      setStep('preview')
    } catch (e: any) {
      handleError(e.message || 'An unknown error occurred while AI was generating cards.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveCards = async () => {
    setStep('generating') // Show a generic processing/saving state
    setIsProcessing(true)
    setError('')
    try {
      const cardsToSave: CreateFlashcardData[] = generatedCards.map(card => ({
        question: card.question,
        answer: card.answer,
        set_id: setId,
      }))

      await createFlashcards(cardsToSave)
      onCardsGenerated(cardsToSave.length)
      setStep('success') // Go to success step
    } catch (e: any) {
      handleError(e.message || 'Failed to save the generated cards.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleTopicSelection = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setStep('error')
  }

  const handleClose = () => {
    // Reset state before closing
    setStep('upload')
    setError('')
    setExtractedContent('')
    setExtractedTopics([])
    setSelectedTopics([])
    setGeneratedCards([])
    setIsProcessing(false)
    setGenerationCount(10)
    onClose()
  }
  
  if (!isOpen) return null

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className={styles.stepContainer}>
            <div className={styles.header}>
              <h2 className={styles.title}>AI-Powered Document Import</h2>
              <p className={styles.subtitle}>Generate flashcards by uploading your study materials.</p>
            </div>
            <ContentUploader 
              onContentExtracted={handleContentExtracted} 
              onExtractionError={handleError} 
            />
          </div>
        )
      case 'topic_selection':
        return (
          <div className={styles.stepContainer}>
            <div className={styles.header}>
              <h2 className={styles.title}>Select Key Topics</h2>
              <p className={styles.subtitle}>AI has identified these topics. Choose which ones to focus on for generation.</p>
            </div>
            <div className={styles.topicList}>
              {extractedTopics.map((topic, index) => (
                <label key={index} className={styles.topicItem}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => handleTopicSelection(topic)}
                    className={styles.checkbox}
                  />
                  <span className={styles.topicText}>{topic}</span>
                </label>
              ))}
            </div>

            <div className={styles.configSection}>
              <h3 className={styles.configTitle}>Number of Cards to Generate</h3>
              <div className={styles.countSelector}>
                {[10, 25, 50].map(num => (
                  <button
                    key={num}
                    className={`${styles.countButton} ${generationCount === num ? styles.active : ''}`}
                    onClick={() => setGenerationCount(num)}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  className={styles.countInput}
                  value={generationCount}
                  onChange={(e) => setGenerationCount(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button onClick={handleClose} className={styles.secondaryButton}>Cancel</button>
              <button 
                onClick={handleGenerateFromTopics} 
                className={styles.primaryButton}
                disabled={selectedTopics.length === 0 || isProcessing}
              >
                {isProcessing ? 'Generating...' : `Generate Cards from ${selectedTopics.length} Topics`}
              </button>
            </div>
          </div>
        )
      case 'generating':
        return (
          <div className={styles.centeredStep}>
            <div className={styles.spinner}></div>
            <h3 className={styles.generatingTitle}>AI is working its magic...</h3>
            <p className={styles.generatingSubtitle}>Analyzing content and crafting high-quality flashcards. This may take a moment.</p>
          </div>
        )
      case 'preview':
        return (
          <div className={`${styles.stepContainer} ${styles.previewStep}`}>
            <div className={styles.header}>
              <h2 className={styles.title}>Review Generated Cards ({generatedCards.length})</h2>
              <p className={styles.subtitle}>Review the AI-generated cards below. Save them to your set when you're ready.</p>
            </div>
            <div className={styles.previewList}>
                {generatedCards.map((card, index) => (
                    <div key={index} className={styles.previewCard}>
                        <div className={styles.cardField}>
                          <span className={styles.fieldLabel}>Question:</span>
                          <p>{card.question}</p>
                        </div>
                        <div className={styles.cardField}>
                          <span className={styles.fieldLabel}>Answer:</span>
                          <p>{card.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.footer}>
                <button onClick={() => setStep('topic_selection')} className={styles.secondaryButton} disabled={isProcessing}>Back</button>
                <button onClick={handleSaveCards} className={styles.primaryButton} disabled={isProcessing}>
                    {isProcessing ? 'Saving...' : `Save ${generatedCards.length} Cards`}
                </button>
            </div>
          </div>
        )
      case 'success':
        return (
          <div className={styles.centeredStep}>
              <div className={styles.successIcon}>🎉</div>
              <h2 className={styles.title}>Success!</h2>
              <p className={styles.subtitle}>{generatedCards.length} new flashcards have been successfully added to your set.</p>
              <button onClick={handleClose} className={styles.primaryButton}>Done</button>
          </div>
        )
      case 'error':
        return (
          <div className={styles.centeredStep}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.title}>An Error Occurred</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={() => setStep('upload')} className={styles.primaryButton}>
              Try Again
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={handleClose} className={styles.closeButton} disabled={isProcessing}>×</button>
        {renderContent()}
      </div>
    </div>
  )
}

export default BatchImportModal 