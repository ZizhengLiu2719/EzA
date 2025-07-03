/**
 * FlashcardEditor Component - Individual Card CRUD Operations
 * 单个闪卡的创建、编辑、删除管理组件
 */

import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { CreateFlashcardData } from '../api/flashcards'
import { FSRSCard } from '../types/SRSTypes'
import styles from './FlashcardEditor.module.css'

interface FlashcardEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateFlashcardData, cardId?: string) => Promise<void>
  setId: string
  isLoading?: boolean
  cardToEdit?: FSRSCard | null
}

const FlashcardEditor: React.FC<FlashcardEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  setId,
  isLoading = false,
  cardToEdit
}) => {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    hint: '',
    explanation: ''
  })

  useEffect(() => {
    if (cardToEdit) {
      setFormData({
        question: cardToEdit.question,
        answer: cardToEdit.answer,
        hint: cardToEdit.hint || '',
        explanation: cardToEdit.explanation || ''
      })
    } else {
      setFormData({
        question: '',
        answer: '',
        hint: '',
        explanation: ''
      })
    }
  }, [cardToEdit, isOpen])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required'
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const cardData: CreateFlashcardData = {
        ...formData,
        set_id: setId,
        card_type: 'basic',
        tags: cardToEdit?.tags || []
      }

      await onSave(cardData, cardToEdit?.id)
      handleClose()
    } catch (error) {
      console.error('Error saving flashcard:', error)
      setErrors({ submit: 'Failed to save flashcard. Please try again.' })
    }
  }

  const handleClose = () => {
    setFormData({
      question: '',
      answer: '',
      hint: '',
      explanation: ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  const isEditing = !!cardToEdit

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditing ? 'Edit Flashcard' : 'Create New Flashcard'}</h2>
          <button onClick={handleClose} disabled={isLoading} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.cardForm}>
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Question *</label>
            <textarea
              className={`${styles.fieldTextarea} ${errors.question ? styles.fieldError : ''}`}
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question..."
              rows={3}
              disabled={isLoading}
            />
            {errors.question && (
              <span className={styles.errorMessage}>{errors.question}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Answer *</label>
            <textarea
              className={`${styles.fieldTextarea} ${errors.answer ? styles.fieldError : ''}`}
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Enter your answer..."
              rows={3}
              disabled={isLoading}
            />
            {errors.answer && (
              <span className={styles.errorMessage}>{errors.answer}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Hint (Optional)</label>
            <textarea
              className={styles.fieldTextarea}
              value={formData.hint}
              onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
              placeholder="Add a hint..."
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Explanation (Optional)</label>
            <textarea
              className={styles.fieldTextarea}
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Add explanation..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Card')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default FlashcardEditor
