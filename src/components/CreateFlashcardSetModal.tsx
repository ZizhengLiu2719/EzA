/**
 * Create Flashcard Set Modal Component
 * 创建新闪卡集合的模态框组件
 */

import React, { useState } from 'react'
import { CreateFlashcardSetData } from '../api/flashcards'
import styles from './CreateFlashcardSetModal.module.css'

interface CreateFlashcardSetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateFlashcardSetData) => Promise<void>
  isLoading?: boolean
}

const SUBJECTS = [
  'Mathematics',
  'Science',
  'History',
  'English',
  'Foreign Language',
  'Computer Science',
  'Chemistry',
  'Physics',
  'Biology',
  'Psychology',
  'Philosophy',
  'Art',
  'Music',
  'Other'
]

const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Basic concepts and vocabulary' },
  { value: 2, label: 'Elementary', description: 'Fundamental knowledge' },
  { value: 3, label: 'Intermediate', description: 'Standard academic level' },
  { value: 4, label: 'Advanced', description: 'Complex concepts and applications' },
  { value: 5, label: 'Expert', description: 'Professional and research level' }
]

const CreateFlashcardSetModal: React.FC<CreateFlashcardSetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateFlashcardSetData>({
    title: '',
    description: '',
    subject: '',
    difficulty: 3,
    is_public: false,
    tags: [],
    visibility: 'private',
    language: 'en',
    category: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Error creating flashcard set:', error)
      setErrors({ submit: 'Failed to create flashcard set. Please try again.' })
    }
  }

  // 处理关闭
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      difficulty: 3,
      is_public: false,
      tags: [],
      visibility: 'private',
      language: 'en',
      category: ''
    })
    setErrors({})
    setTagInput('')
    onClose()
  }

  // 添加标签
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }))
      setTagInput('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  // 处理Enter键添加标签
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>Create New Study Set</h2>
            <p className={styles.modalSubtitle}>Build your personalized flashcard collection</p>
          </div>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          {/* Title Field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Study Set Title *
            </label>
            <input
              type="text"
              className={`${styles.fieldInput} ${errors.title ? styles.fieldError : ''}`}
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Spanish Vocabulary - Advanced Level"
              disabled={isLoading}
              maxLength={100}
            />
            {errors.title && (
              <span className={styles.errorMessage}>{errors.title}</span>
            )}
          </div>

          {/* Subject Field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Subject *
            </label>
            <select
              className={`${styles.fieldSelect} ${errors.subject ? styles.fieldError : ''}`}
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              disabled={isLoading}
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            {errors.subject && (
              <span className={styles.errorMessage}>{errors.subject}</span>
            )}
          </div>

          {/* Description Field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Description
            </label>
            <textarea
              className={`${styles.fieldTextarea} ${errors.description ? styles.fieldError : ''}`}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this study set covers..."
              disabled={isLoading}
              rows={3}
              maxLength={500}
            />
            <div className={styles.characterCount}>
              {formData.description?.length || 0}/500
            </div>
            {errors.description && (
              <span className={styles.errorMessage}>{errors.description}</span>
            )}
          </div>

          {/* Difficulty Level */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Difficulty Level
            </label>
            <div className={styles.difficultySelector}>
              {DIFFICULTY_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  className={`${styles.difficultyOption} ${
                    formData.difficulty === level.value ? styles.selected : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: level.value }))}
                  disabled={isLoading}
                >
                  <div className={styles.difficultyStars}>
                    {'★'.repeat(level.value)}
                  </div>
                  <div className={styles.difficultyLabel}>{level.label}</div>
                  <div className={styles.difficultyDescription}>{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags Field */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Tags
            </label>
            <div className={styles.tagInput}>
              <input
                type="text"
                className={styles.fieldInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add tags to organize your set..."
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={styles.addTagButton}
                disabled={isLoading || !tagInput.trim()}
              >
                Add
              </button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className={styles.tagList}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTagButton}
                      disabled={isLoading}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Visibility
            </label>
            <div className={styles.visibilityOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visibility: e.target.value as 'private' | 'public' | 'shared',
                    is_public: e.target.value === 'public'
                  }))}
                  disabled={isLoading}
                />
                <span className={styles.radioLabel}>
                  <span className={styles.radioIcon}>🔒</span>
                  <span>Private</span>
                  <span className={styles.radioDescription}>Only you can see this set</span>
                </span>
              </label>
              
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    visibility: e.target.value as 'private' | 'public' | 'shared',
                    is_public: e.target.value === 'public'
                  }))}
                  disabled={isLoading}
                />
                <span className={styles.radioLabel}>
                  <span className={styles.radioIcon}>🌍</span>
                  <span>Public</span>
                  <span className={styles.radioDescription}>Anyone can find and study this set</span>
                </span>
              </label>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner}>
                  <span className={styles.spinner}></span>
                  Creating...
                </span>
              ) : (
                <span>
                  <span className={styles.buttonIcon}>✨</span>
                  Create Study Set
                </span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateFlashcardSetModal 