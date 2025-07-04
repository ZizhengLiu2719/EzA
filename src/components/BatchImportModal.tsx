/**
 * BatchImportModal Component - Bulk Import Flashcards
 * 批量导入闪卡功能：支持OCR、CSV、文档解析
 */

import React, { useState } from 'react'
import { CreateFlashcardData } from '../api/flashcards'
import { flashcardAI, GeneratedAICard } from '../services/flashcardAI'
import styles from './BatchImportModal.module.css'
import ContentUploader from './ContentUploader'

interface BatchImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cards: Omit<CreateFlashcardData, 'set_id'>[]) => Promise<void>
  onError?: (error: string) => void
}

type ImportStep = 'upload' | 'topic_selection' | 'generating' | 'preview' | 'success' | 'error'

const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose, onSave, onError }) => {
  const [step, setStep] = useState<ImportStep>('upload')
  const [error, setError] = useState<string>('')
  const [extractedContent, setExtractedContent] = useState('')
  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [generatedCards, setGeneratedCards] = useState<GeneratedAICard[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [generationCount, setGenerationCount] = useState<number>(10);
  const [fileNames, setFileNames] = useState<string[]>([])

  const handleContentExtracted = async (content: string, fileNames: string[]) => {
    setStep('generating')
    setIsProcessing(true)
    setError('')
    try {
      setExtractedContent(content)
      const topics = await flashcardAI.extractTopicsFromDocument(content)
      setExtractedTopics(topics)
      setSelectedTopics(topics)
      setFileNames(fileNames)
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
      
      // Validate that we got a reasonable number of cards
      if (cards.length === 0) {
        throw new Error('AI failed to generate any flashcards from the document. Please try with different topics or content.')
      }
      
      if (cards.length < Math.ceil(generationCount * 0.5)) {
        console.warn(`Generated only ${cards.length} cards out of ${generationCount} requested`)
      }
      
      setGeneratedCards(cards)
      setStep('preview')
    } catch (e: any) {
      console.error('Card generation failed:', e)
      handleError(e.message || 'An unknown error occurred while AI was generating cards.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveCards = async () => {
    if (generatedCards.length === 0) {
      setError('No cards available to save. Please generate cards first.')
      return
    }
    
    setStep('generating') // Show a generic processing/saving state
    setIsProcessing(true)
    setError('')
    try {
      const cardsToSave: Omit<CreateFlashcardData, 'set_id'>[] = generatedCards.map(card => ({
        question: card.question,
        answer: card.answer,
        hint: card.hint,
        explanation: card.explanation,
        card_type: card.card_type,
        tags: card.tags
      }))

      await onSave(cardsToSave)
    } catch (e: any) {
      console.error('Card saving failed:', e)
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
    console.error('BatchImportModal error:', errorMessage);
    setError(errorMessage)
    setStep('error')
    
    // Notify parent component about the error
    if (onError) {
      onError(errorMessage);
    }
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
    setFileNames([])
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
              <p className={styles.subtitle}>AI has identified these topics from your documents. Choose which ones to focus on for generation.</p>
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