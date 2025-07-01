/**
 * Unified Create Flashcard Set Modal Component
 * 统一的闪卡集创建模态框 - 支持多种创建方式
 */

import React, { useState } from 'react'
import { CreateFlashcardSetData } from '../api/flashcards'
import styles from './CreateFlashcardSetModal.module.css'

interface CreateFlashcardSetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateFlashcardSetData) => Promise<void>
  onMethodSelected?: (method: CreationMethod, setData: CreateFlashcardSetData) => void
  isLoading?: boolean
}

// 创建方式枚举
type CreationMethod = 'manual' | 'import' | 'ai-generate'

const CREATION_METHODS = [
  {
    id: 'manual' as CreationMethod,
    title: '🖊️ Manual Creation',
    description: 'Create flashcards manually with full control',
    icon: '🖊️',
    features: ['Custom design', 'Flexible content', 'Step by step']
  },
  {
    id: 'import' as CreationMethod,
    title: '📤 Batch Import',
    description: 'Import from CSV, text, images, or JSON',
    icon: '📤',
    features: ['CSV files', 'OCR from images', 'Text parsing', 'JSON import']
  },
  {
    id: 'ai-generate' as CreationMethod,
    title: '🤖 AI Generation',
    description: 'Let AI generate flashcards from topics',
    icon: '🤖',
    features: ['Topic-based', 'Multiple types', 'Instant creation', 'Smart content']
  }
]

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
  onMethodSelected,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState<'method' | 'details'>('method')
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod>('manual')
  
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

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理方式选择
  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method)
    setCurrentStep('details')
  }

  // 处理基本信息提交
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (selectedMethod === 'manual') {
        // 手动创建直接提交表单数据
        await onSubmit(formData)
        handleClose()
      } else {
        // 对于导入和AI生成，通知父组件选择的方法和数据
        onMethodSelected?.(selectedMethod, formData)
        handleClose()
      }
    } catch (error) {
      console.error('Error creating flashcard set:', error)
      setErrors({ submit: 'Failed to create flashcard set. Please try again.' })
    }
  }

  // 处理关闭
  const handleClose = () => {
    setCurrentStep('method')
    setSelectedMethod('manual')
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
        
        {/* Step 1: 选择创建方式 */}
        {currentStep === 'method' && (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <h2 className={styles.modalTitle}>Create New Study Set</h2>
                <p className={styles.modalSubtitle}>Choose how you'd like to create your flashcards</p>
              </div>
              <button className={styles.closeButton} onClick={handleClose}>
                ✕
              </button>
            </div>

            <div className={styles.methodSelection}>
              {CREATION_METHODS.map(method => (
                <div
                  key={method.id}
                  className={styles.methodCard}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className={styles.methodIcon}>{method.icon}</div>
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodTitle}>{method.title}</h3>
                    <p className={styles.methodDescription}>{method.description}</p>
                    <div className={styles.methodFeatures}>
                      {method.features.map(feature => (
                        <span key={feature} className={styles.methodFeature}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.methodArrow}>→</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 2: 输入基本信息 */}
        {currentStep === 'details' && (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <button 
                  className={styles.backButton}
                  onClick={() => setCurrentStep('method')}
                >
                  ← Back
                </button>
                <div>
                  <h2 className={styles.modalTitle}>Study Set Details</h2>
                  <p className={styles.modalSubtitle}>
                    Setup basic information for your {selectedMethod === 'manual' ? 'manual' : selectedMethod === 'import' ? 'imported' : 'AI-generated'} study set
                  </p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={handleClose}>
                ✕
              </button>
            </div>

            <form onSubmit={handleDetailsSubmit} className={styles.modalForm}>
              
              {/* Selected Method Indicator */}
              <div className={styles.selectedMethodBanner}>
                <span className={styles.methodIconSmall}>
                  {CREATION_METHODS.find(m => m.id === selectedMethod)?.icon}
                </span>
                <span>
                  {CREATION_METHODS.find(m => m.id === selectedMethod)?.title}
                </span>
              </div>

              {/* Title Field */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Study Set Title *</label>
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
                <label className={styles.fieldLabel}>Subject *</label>
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
                <label className={styles.fieldLabel}>Description (Optional)</label>
                <textarea
                  className={`${styles.fieldTextarea} ${errors.description ? styles.fieldError : ''}`}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your study set..."
                  disabled={isLoading}
                  maxLength={500}
                  rows={3}
                />
                {errors.description && (
                  <span className={styles.errorMessage}>{errors.description}</span>
                )}
              </div>

              {/* Difficulty Level */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Difficulty Level</label>
                <div className={styles.difficultyGrid}>
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      className={`${styles.difficultyOption} ${
                        formData.difficulty === level.value ? styles.difficultySelected : ''
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, difficulty: level.value }))}
                      disabled={isLoading}
                    >
                      <span className={styles.difficultyLabel}>{level.label}</span>
                      <span className={styles.difficultyDescription}>{level.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tags (Optional)</label>
                <div className={styles.tagContainer}>
                  <div className={styles.tagInputWrapper}>
                    <input
                      type="text"
                      className={styles.tagInput}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Add tags..."
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className={styles.tagAddButton}
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || isLoading}
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.tags && formData.tags.length > 0 && (
                    <div className={styles.tagsList}>
                      {formData.tags.map(tag => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                          <button
                            type="button"
                            className={styles.tagRemove}
                            onClick={() => handleRemoveTag(tag)}
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visibility */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Visibility</label>
                <div className={styles.visibilityOptions}>
                  <label className={styles.visibilityOption}>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        visibility: e.target.value as 'private' | 'public' | 'shared',
                        is_public: false
                      }))}
                      disabled={isLoading}
                    />
                    <span className={styles.visibilityLabel}>
                      🔒 Private - Only you can access
                    </span>
                  </label>
                  <label className={styles.visibilityOption}>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        visibility: e.target.value as 'private' | 'public' | 'shared',
                        is_public: true
                      }))}
                      disabled={isLoading}
                    />
                    <span className={styles.visibilityLabel}>
                      🌍 Public - Anyone can discover and study
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setCurrentStep('method')}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 
                   selectedMethod === 'manual' ? 'Create Study Set' :
                   selectedMethod === 'import' ? 'Create & Import' :
                   'Create & Generate'}
                </button>
              </div>

              {errors.submit && (
                <div className={styles.submitError}>{errors.submit}</div>
              )}
            </form>
          </>
        )}

      </div>
    </div>
  )
}

export default CreateFlashcardSetModal 