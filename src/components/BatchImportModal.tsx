/**
 * BatchImportModal Component - Bulk Import Flashcards
 * 批量导入闪卡功能：支持OCR、CSV、文档解析
 */

import React, { useCallback, useState } from 'react'
import { CreateFlashcardData } from '../api/flashcards'
import styles from './BatchImportModal.module.css'

interface BatchImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (cards: CreateFlashcardData[]) => Promise<void>
  setId: string
  isLoading?: boolean
}

type ImportMethod = 'text' | 'csv' | 'ocr' | 'json'

interface ParsedCard {
  question: string
  answer: string
  hint?: string
  explanation?: string
  tags?: string[]
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  setId,
  isLoading = false
}) => {
  const [importMethod, setImportMethod] = useState<ImportMethod>('text')
  const [textInput, setTextInput] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Parse text input into cards
  const parseTextInput = useCallback((text: string): ParsedCard[] => {
    const cards: ParsedCard[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length; i += 2) {
      const question = lines[i]?.trim()
      const answer = lines[i + 1]?.trim()
      
      if (question && answer) {
        cards.push({
          question,
          answer,
          tags: []
        })
      }
    }
    
    return cards
  }, [])

  // Parse CSV content
  const parseCSV = useCallback((csvContent: string): ParsedCard[] => {
    const cards: ParsedCard[] = []
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('question') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple CSV parsing (handles basic cases)
      const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim())
      
      if (columns.length >= 2) {
        const card: ParsedCard = {
          question: columns[0],
          answer: columns[1],
          tags: []
        }
        
        // Optional columns
        if (columns[2]) card.hint = columns[2]
        if (columns[3]) card.explanation = columns[3]
        if (columns[4]) card.tags = columns[4].split(';').map(tag => tag.trim())
        
        cards.push(card)
      }
    }
    
    return cards
  }, [])

  // Handle text input parsing
  const handleTextParse = () => {
    try {
      setParseError(null)
      const cards = parseTextInput(textInput)
      if (cards.length === 0) {
        setParseError('No valid cards found. Make sure each question and answer is on separate lines.')
        return
      }
      setParsedCards(cards)
    } catch (error) {
      setParseError('Error parsing text input')
    }
  }

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        setParseError(null)
        const csvContent = e.target?.result as string
        const cards = parseCSV(csvContent)
        
        if (cards.length === 0) {
          setParseError('No valid cards found in CSV. Expected format: Question, Answer, Hint, Explanation, Tags')
          return
        }
        
        setParsedCards(cards)
      } catch (error) {
        setParseError('Error parsing CSV file')
      }
    }
    
    reader.readAsText(file)
  }

  // Handle OCR image processing
  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setIsProcessing(true)
    
    try {
      setParseError(null)
      
      // Import Tesseract.js dynamically
      const { createWorker } = await import('tesseract.js')
      
      const worker = await createWorker('eng')
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      
      // Parse OCR text using text parsing logic
      const cards = parseTextInput(text)
      
      if (cards.length === 0) {
        setParseError('Could not extract valid cards from image. Try a clearer image with question-answer pairs.')
        return
      }
      
      setParsedCards(cards)
    } catch (error) {
      console.error('OCR Error:', error)
      setParseError('Error processing image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle JSON import
  const handleJSONUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        setParseError(null)
        const jsonContent = e.target?.result as string
        const data = JSON.parse(jsonContent)
        
        let cards: ParsedCard[] = []
        
        if (Array.isArray(data)) {
          cards = data.filter(item => item.question && item.answer)
        } else if (data.cards && Array.isArray(data.cards)) {
          cards = data.cards.filter((item: any) => item.question && item.answer)
        }
        
        if (cards.length === 0) {
          setParseError('No valid cards found in JSON. Expected format: [{question, answer, hint?, explanation?, tags?}]')
          return
        }
        
        setParsedCards(cards)
      } catch (error) {
        setParseError('Invalid JSON format')
      }
    }
    
    reader.readAsText(file)
  }

  // Handle import
  const handleImport = async () => {
    if (parsedCards.length === 0) return

    try {
      const cardsToImport: CreateFlashcardData[] = parsedCards.map(card => ({
        set_id: setId,
        question: card.question,
        answer: card.answer,
        hint: card.hint,
        explanation: card.explanation,
        card_type: 'basic',
        tags: card.tags || []
      }))

      await onImport(cardsToImport)
      handleClose()
    } catch (error) {
      setParseError('Error importing cards. Please try again.')
    }
  }

  // Reset and close
  const handleClose = () => {
    setTextInput('')
    setCsvFile(null)
    setImageFile(null)
    setParsedCards([])
    setParseError(null)
    setIsProcessing(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Batch Import Flashcards</h2>
          <button onClick={handleClose} disabled={isLoading || isProcessing}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          
          {/* Import Method Selection */}
          <div className={styles.methodSelector}>
            <h3>Choose Import Method</h3>
            <div className={styles.methodOptions}>
              
              <button
                className={`${styles.methodOption} ${importMethod === 'text' ? styles.active : ''}`}
                onClick={() => setImportMethod('text')}
              >
                <span className={styles.methodIcon}>📝</span>
                <div>
                  <strong>Text Input</strong>
                  <p>Paste question-answer pairs</p>
                </div>
              </button>

              <button
                className={`${styles.methodOption} ${importMethod === 'csv' ? styles.active : ''}`}
                onClick={() => setImportMethod('csv')}
              >
                <span className={styles.methodIcon}>📊</span>
                <div>
                  <strong>CSV File</strong>
                  <p>Upload CSV with cards data</p>
                </div>
              </button>

              <button
                className={`${styles.methodOption} ${importMethod === 'ocr' ? styles.active : ''}`}
                onClick={() => setImportMethod('ocr')}
              >
                <span className={styles.methodIcon}>📷</span>
                <div>
                  <strong>OCR Image</strong>
                  <p>Extract text from images</p>
                </div>
              </button>

              <button
                className={`${styles.methodOption} ${importMethod === 'json' ? styles.active : ''}`}
                onClick={() => setImportMethod('json')}
              >
                <span className={styles.methodIcon}>💾</span>
                <div>
                  <strong>JSON Export</strong>
                  <p>Import from JSON file</p>
                </div>
              </button>

            </div>
          </div>

          {/* Input Methods */}
          <div className={styles.inputSection}>
            
            {/* Text Input */}
            {importMethod === 'text' && (
              <div className={styles.textInputSection}>
                <h4>Paste Your Cards</h4>
                <p className={styles.instructions}>
                  Enter one question per line, followed by its answer on the next line.
                  Leave a blank line between cards.
                </p>
                <textarea
                  className={styles.textArea}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`What is the capital of France?
Paris
What is 2 + 2?
4

What is photosynthesis?
The process by which plants convert light into energy`}
                  rows={8}
                  disabled={isProcessing}
                />
                <button 
                  className={styles.parseButton}
                  onClick={handleTextParse}
                  disabled={!textInput.trim() || isProcessing}
                >
                  Parse Cards ({textInput.split('\n').filter(l => l.trim()).length / 2 | 0} estimated)
                </button>
              </div>
            )}

            {/* CSV Upload */}
            {importMethod === 'csv' && (
              <div className={styles.fileInputSection}>
                <h4>Upload CSV File</h4>
                <p className={styles.instructions}>
                  CSV format: Question, Answer, Hint (optional), Explanation (optional), Tags (optional, semicolon-separated)
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className={styles.fileInput}
                  disabled={isProcessing}
                />
                {csvFile && (
                  <p className={styles.fileName}>Selected: {csvFile.name}</p>
                )}
              </div>
            )}

            {/* OCR Upload */}
            {importMethod === 'ocr' && (
              <div className={styles.fileInputSection}>
                <h4>Upload Image for OCR</h4>
                <p className={styles.instructions}>
                  Upload an image containing question-answer pairs. Works best with clear, high-contrast text.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOCRUpload}
                  className={styles.fileInput}
                  disabled={isProcessing}
                />
                {imageFile && (
                  <p className={styles.fileName}>Selected: {imageFile.name}</p>
                )}
                {isProcessing && (
                  <div className={styles.processing}>
                    <div className={styles.spinner}></div>
                    <p>Processing image... This may take a few moments.</p>
                  </div>
                )}
              </div>
            )}

            {/* JSON Upload */}
            {importMethod === 'json' && (
              <div className={styles.fileInputSection}>
                <h4>Upload JSON File</h4>
                <p className={styles.instructions}>
                  JSON format: {'[{question: "...", answer: "...", hint?: "...", explanation?: "...", tags?: [...]}]'}
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJSONUpload}
                  className={styles.fileInput}
                  disabled={isProcessing}
                />
              </div>
            )}

          </div>

          {/* Error Display */}
          {parseError && (
            <div className={styles.error}>
              <p>{parseError}</p>
            </div>
          )}

          {/* Preview Parsed Cards */}
          {parsedCards.length > 0 && (
            <div className={styles.previewSection}>
              <h4>Preview ({parsedCards.length} cards)</h4>
              <div className={styles.cardPreview}>
                {parsedCards.slice(0, 5).map((card, index) => (
                  <div key={index} className={styles.previewCard}>
                    <div className={styles.previewQuestion}>
                      Q: {card.question}
                    </div>
                    <div className={styles.previewAnswer}>
                      A: {card.answer}
                    </div>
                    {card.hint && (
                      <div className={styles.previewHint}>
                        💡 {card.hint}
                      </div>
                    )}
                  </div>
                ))}
                {parsedCards.length > 5 && (
                  <p className={styles.moreCards}>
                    ... and {parsedCards.length - 5} more cards
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import Actions */}
          <div className={styles.modalActions}>
            <button
              onClick={handleClose}
              disabled={isLoading || isProcessing}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={parsedCards.length === 0 || isLoading || isProcessing}
              className={styles.importButton}
            >
              {isLoading ? 'Importing...' : `Import ${parsedCards.length} Cards`}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default BatchImportModal 