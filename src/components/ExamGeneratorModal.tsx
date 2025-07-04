/**
 * Unified Create Flashcard Set Modal Component
 * 统一的闪卡集创建模态框 - 支持多种创建方式
 */

import { AlertCircle } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CreateFlashcardSetData, FlashcardSetWithStats, getFlashcardsBySetIds } from '../api/flashcards'
import { examAI, ExamConfiguration, ExamQuestion, GeneratedExam } from '../services/examAI'
import { flashcardAI } from '../services/flashcardAI'
import ContentUploader from './ContentUploader'
import styles from './ExamGeneratorModal.module.css'

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

interface ExamGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  flashcardSets: FlashcardSetWithStats[]
  onExamGenerated: (exam: GeneratedExam) => void
  examType?: any // Add this prop to receive the exam type preset
}

interface ExamSettings {
  title: string
  subject: string
  duration: number // 分钟
  question_types: {
    single_choice: number;
    true_false: number
    short_answer: number
    essay: number
    fill_blank: number
  }
  difficulty_focus: 'easy' | 'medium' | 'hard' | 'mixed'
  cognitive_focus: 'remember' | 'understand' | 'apply' | 'analyze' | 'mixed'
  selectedTopics: string[]
  isProfessorMode: boolean
}

// Add exam type presets configuration
const EXAM_TYPE_PRESETS = {
  'unit-test': {
    title: 'Unit Test',
    subject: 'Academic Subject',
    duration: 50,
    question_types: {
      single_choice: 15,
      true_false: 5,
      short_answer: 3,
      essay: 1,
      fill_blank: 1,
    },
    difficulty_focus: 'medium' as const,
    cognitive_focus: 'understand' as const,
    selectedTopics: ['Unit Concepts Review', 'Key Learning Objectives', 'Practice Applications'],
    isProfessorMode: false,
  },
  'chapter-exam': {
    title: 'Chapter Exam',
    subject: 'Academic Subject',
    duration: 75,
    question_types: {
      single_choice: 20,
      true_false: 8,
      short_answer: 5,
      essay: 2,
      fill_blank: 0,
    },
    difficulty_focus: 'mixed' as const,
    cognitive_focus: 'mixed' as const,
    selectedTopics: ['Chapter Overview', 'Core Concepts', 'Applied Knowledge', 'Critical Analysis'],
    isProfessorMode: false,
  },
  'midterm': {
    title: 'Midterm Examination',
    subject: 'Course Material',
    duration: 90,
    question_types: {
      single_choice: 25,
      true_false: 10,
      short_answer: 7,
      essay: 3,
      fill_blank: 0,
    },
    difficulty_focus: 'mixed' as const,
    cognitive_focus: 'mixed' as const,
    selectedTopics: ['Comprehensive Review', 'Integration of Concepts', 'Problem Solving', 'Analytical Thinking'],
    isProfessorMode: true,
  },
  'final-exam': {
    title: 'Final Examination',
    subject: 'Complete Course',
    duration: 120,
    question_types: {
      single_choice: 30,
      true_false: 15,
      short_answer: 10,
      essay: 5,
      fill_blank: 0,
    },
    difficulty_focus: 'hard' as const,
    cognitive_focus: 'analyze' as const,
    selectedTopics: ['Cumulative Knowledge', 'Advanced Applications', 'Synthesis & Evaluation', 'Research Skills'],
    isProfessorMode: true,
  },
  'pop-quiz': {
    title: 'Pop Quiz',
    subject: 'Recent Material',
    duration: 15,
    question_types: {
      single_choice: 8,
      true_false: 2,
      short_answer: 0,
      essay: 0,
      fill_blank: 0,
    },
    difficulty_focus: 'easy' as const,
    cognitive_focus: 'remember' as const,
    selectedTopics: ['Recent Class Material', 'Basic Concepts', 'Quick Review'],
    isProfessorMode: false,
  }
}

const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  flashcardSets,
  onExamGenerated,
  examType
}) => {
  const [step, setStep] = useState<'settings' | 'generating' | 'error'>('settings')
  const [source, setSource] = useState<'flashcards' | 'files'>('flashcards');
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtractingTopics, setIsExtractingTopics] = useState(false)
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([])
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('')
  const [error, setError] = useState<string>('')

  // Get preset configuration based on examType
  const getInitialSettings = useCallback((): ExamSettings => {
    if (examType?.id && EXAM_TYPE_PRESETS[examType.id as keyof typeof EXAM_TYPE_PRESETS]) {
      const preset = EXAM_TYPE_PRESETS[examType.id as keyof typeof EXAM_TYPE_PRESETS]
      return {
        ...preset,
        // Override with examType data if available
        title: examType.name || preset.title,
        duration: examType.duration || preset.duration,
      }
    }
    
    // Default fallback settings
    return {
      title: 'Review Test',
      subject: 'General',
      duration: 30,
      question_types: {
        single_choice: 5,
        true_false: 3,
        short_answer: 2,
        essay: 0,
        fill_blank: 0,
      },
      difficulty_focus: 'mixed',
      cognitive_focus: 'mixed',
      selectedTopics: ['Test Knowledge Mastery', 'Reinforce Learning Outcomes'],
      isProfessorMode: false,
    }
  }, [examType])

  const [settings, setSettings] = useState<ExamSettings>(getInitialSettings())
  
  const totalQuestions = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0)
  
  // Reset settings when examType changes
  useEffect(() => {
    if (isOpen) {
      setSettings(getInitialSettings())
    }
  }, [examType, isOpen, getInitialSettings])

  const handleTopicsExtracted = (topics: string[]) => {
    setExtractedTopics(topics);
    updateSettings({
      selectedTopics: Array.from(new Set([...settings.selectedTopics, ...topics]))
    });
  };

  const handleContentUpload = async (content: string) => {
    setIsExtractingTopics(true);
    setError('');
    try {
        const topics = await flashcardAI.extractTopicsFromDocument(content);
        handleTopicsExtracted(topics);
    } catch (err: any) {
        setError(err.message || 'Failed to extract topics from your document.');
    } finally {
        setIsExtractingTopics(false);
    }
  };

  const handleSetSelectionChange = (setId: string) => {
    setSelectedSetIds(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const selectedCardsCount = useMemo(() => {
    if (source !== 'flashcards') return 0;
    return flashcardSets
      .filter(set => selectedSetIds.includes(set.id))
      .reduce((sum, set) => sum + (set.card_count || 0), 0);
  }, [selectedSetIds, flashcardSets, source]);

  const handleClose = () => {
    if (isGenerating) return;
    setStep('settings')
    setError('')
    onClose()
  }

  const createExamConfig = useCallback((): ExamConfiguration => {
    const totalPoints = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0) * 5; // Assuming 5 points per question

    const questionDistribution = Object.entries(settings.question_types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as ExamQuestion['type'],
        count,
        points_per_question: 5,
      }))

    const finalTopics = settings.selectedTopics;

    const difficultyDistribution =
      settings.difficulty_focus === 'mixed'
        ? [
            { difficulty_range: [1, 4] as [number, number], percentage: 30 },
            { difficulty_range: [4, 7] as [number, number], percentage: 50 },
            { difficulty_range: [7, 10] as [number, number], percentage: 20 },
          ]
        : [
            {
              difficulty_range:
                settings.difficulty_focus === 'easy'
                  ? ([1, 4] as [number, number])
                  : settings.difficulty_focus === 'medium'
                  ? ([4, 7] as [number, number])
                  : ([7, 10] as [number, number]),
              percentage: 100,
            },
          ]

    const cognitiveDistribution =
      settings.cognitive_focus === 'mixed'
        ? [
            { level: 'remember' as const, percentage: 25 },
            { level: 'understand' as const, percentage: 30 },
            { level: 'apply' as const, percentage: 25 },
            { level: 'analyze' as const, percentage: 20 },
          ]
        : [{ level: settings.cognitive_focus as any, percentage: 100 }]

    return {
      title: settings.title,
      subject: settings.subject,
      topics: finalTopics,
      duration: settings.duration,
      total_points: totalPoints,
      question_distribution: questionDistribution,
      difficulty_distribution: difficultyDistribution,
      cognitive_distribution: cognitiveDistribution,
      learning_objectives: settings.selectedTopics,
    }
  }, [settings])

  const handleGenerateExam = useCallback(async () => {
    if (isGenerating) return

    if (source === 'flashcards' && selectedSetIds.length === 0) {
      setError('Please select at least one flashcard set for the exam.')
      setStep('error')
      return
    }

    if (source === 'flashcards') {
    const availableCardsCount = selectedCardsCount;
      if (totalQuestions === 0) {
        setError('Please set at least one question type and count.');
        setStep('error');
        return;
      }
      if (availableCardsCount < 10 && availableCardsCount < totalQuestions) {
      setError(`At least 10 cards are required to generate an exam, but only ${availableCardsCount} are available in the selected sets.`)
      setStep('error')
      return
    }
    if (totalQuestions > availableCardsCount) {
      setError(`Total questions (${totalQuestions}) cannot exceed the number of available cards (${availableCardsCount}) in the selected sets.`)
      setStep('error')
      return
      }
    }
    
    if (source === 'files' && totalQuestions === 0) {
      setError('Please set at least one question type and count.');
      setStep('error');
      return;
    }

    setIsGenerating(true)
    setStep('generating')
    setError('')

    try {
      const examConfig = createExamConfig()
      let generatedExam;

      if (source === 'flashcards') {
        const cardsForExam = await getFlashcardsBySetIds(selectedSetIds);
        generatedExam = await examAI.generateExamFromCards(cardsForExam, examConfig, settings.isProfessorMode)
      } else {
        // TODO: Implement generateExamFromContent
        // For now, we'll use a placeholder or throw an error
        setError('File-based exam generation is not implemented yet.');
        setStep('error');
        setIsGenerating(false);
        return;
      }
      onExamGenerated(generatedExam)
    } catch (err: any) {
      console.error('Exam generation failed:', err)
      setError(err.message || 'Exam generation failed, please try again later.')
      setStep('error')
    } finally {
      setIsGenerating(false)
    }
  }, [
    isGenerating, 
    source, 
    selectedSetIds, 
    selectedCardsCount, 
    totalQuestions, 
    createExamConfig, 
    onExamGenerated, 
    settings.isProfessorMode
  ]);

  const updateSettings = (newSettings: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }
  
  const updateQuestionCount = (type: keyof ExamSettings['question_types'], delta: number) => {
    setSettings(prev => {
      const newCount = (prev.question_types[type] || 0) + delta;
      if (newCount < 0) return prev; // Don't allow negative numbers
      return {
        ...prev,
        question_types: {
          ...prev.question_types,
          [type]: newCount,
        }
      };
    });
  };

  const handleTopicSubmit = () => {
    if (newTopic.trim() && !settings.selectedTopics.includes(newTopic.trim())) {
      updateSettings({
        selectedTopics: [...settings.selectedTopics, newTopic.trim()],
      })
    }
    setNewTopic('')
  }

  const handleTopicToggle = (topic: string) => {
    updateSettings({
      selectedTopics: settings.selectedTopics.includes(topic)
      ? settings.selectedTopics.filter(t => t !== topic)
        : [...settings.selectedTopics, topic],
    })
  }

  const renderSettings = () => (
    <>
      <div className={styles.modalBody}>
        {/* Exam Type Header */}
        {examType && (
          <div className={styles.examTypeHeader}>
            <div className={styles.examTypeInfo}>
              <h2 className={styles.examTypeName}>{examType.name}</h2>
              <p className={styles.examTypeDescription}>{examType.description}</p>
              <div className={styles.examTypeDetails}>
                <span className={styles.examTypeDetail}>
                  <span className={styles.detailIcon}>⏱️</span>
                  Duration: {examType.duration} minutes
                </span>
                <span className={styles.examTypeDetail}>
                  <span className={styles.detailIcon}>❓</span>
                  Target: {examType.questionCount} questions
                </span>
                <span className={styles.examTypeDetail}>
                  <span className={styles.detailIcon}>📊</span>
                  Difficulty: {examType.difficulty}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.mainArea}>
          {/* Left Panel: Settings */}
          <div className={styles.configPanel}>
             <div className={styles.configSection}>
                <p className={styles.sectionTitle}>Basic Settings</p>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Exam Title</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={settings.title}
                      onChange={(e) => updateSettings({ title: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Subject</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={settings.subject}
                      onChange={(e) => updateSettings({ subject: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Duration (minutes)</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={settings.duration}
                      onChange={(e) => updateSettings({ duration: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Difficulty Focus</label>
                    <select
                      className={styles.fieldSelect}
                      value={settings.difficulty_focus}
                      onChange={e => updateSettings({ difficulty_focus: e.target.value as any })}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

            <div className={styles.configSection}>
              <p className={styles.sectionTitle}>Question Distribution ({totalQuestions} total)</p>
              <div className={styles.questionTypeGrid}>
                {(Object.keys(settings.question_types) as Array<keyof typeof settings.question_types>).map(type => (
                  <div key={type} className={styles.stepperRow}>
                    <span className={styles.stepperLabel}>{type === 'single_choice' ? 'Multiple Choice' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <div className={styles.stepper}>
                      <button onClick={() => updateQuestionCount(type, -1)} disabled={settings.question_types[type] <= 0}>-</button>
                      <span>{settings.question_types[type]}</span>
                      <button onClick={() => updateQuestionCount(type, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Source Selection */}
          <div className={styles.sourcePanel}>
            <div className={styles.sourceSelector}>
              <button
                className={`${styles.sourceButton} ${source === 'flashcards' ? styles.active : ''}`}
                onClick={() => setSource('flashcards')}
              >
                From Flashcard Sets
              </button>
              <button
                className={`${styles.sourceButton} ${source === 'files' ? styles.active : ''}`}
                onClick={() => setSource('files')}
              >
                From File Upload
              </button>
            </div>

            {source === 'flashcards' && (
              <div className={styles.configSection}>
                <p className={styles.sectionTitle}>
                  Select Flashcard Sets
                  <span className={styles.selectionCount}>Selected {selectedSetIds.length} sets / {selectedCardsCount} total cards</span>
                </p>
                <div className={styles.setList}>
                  {flashcardSets.map(set => (
                    <div
                      key={set.id}
                      className={`${styles.setItem} ${selectedSetIds.includes(set.id) ? styles.selected : ''}`}
                      onClick={() => handleSetSelectionChange(set.id)}
                    >
                      <span className={styles.setName}>{set.title}</span>
                      <span className={styles.setCount}>{set.card_count} cards</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {source === 'files' && (
              <div className={styles.configSection}>
                <p className={styles.sectionTitle}>Upload Study Materials</p>
                {isExtractingTopics ? (
                    <div className={styles.centeredContent} style={{padding: '20px 0'}}>
                        <div className={styles.spinner}></div>
                        <p style={{marginTop: '10px'}}>AI is analyzing your document for topics...</p>
                    </div>
                ) : (
                    <ContentUploader 
                        onContentExtracted={handleContentUpload} 
                        onExtractionError={(errText) => {
                            setError(errText);
                            setStep('error');
                        }} 
                    />
                )}
              </div>
            )}

            <div className={styles.configSection}>
              <p className={styles.sectionTitle}>Exam Focus (Topics)</p>
              <div className={styles.tagsList}>
                {settings.selectedTopics.map(topic => (
                  <span
                    key={topic}
                    className={`${styles.tag} ${styles.tagSelected}`}
                    onClick={() => handleTopicToggle(topic)}
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className={styles.tagInputWrapper}>
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="Add a custom topic..."
                  className={styles.tagInput}
                  onKeyPress={e => e.key === 'Enter' && handleTopicSubmit()}
                />
                <button onClick={handleTopicSubmit} className={styles.tagAddButton}>Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button onClick={handleClose} className={styles.cancelButton}>Cancel</button>
        <button onClick={handleGenerateExam} disabled={isGenerating} className={styles.generateButton}>
          {isGenerating ? 'Generating...' : `Generate ${totalQuestions} Questions`}
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (step) {
      case 'settings':
        return renderSettings();
      case 'generating':
      return (
        <div className={styles.centeredContent}>
            <div className={styles.spinner}></div>
            <h3 className={styles.loadingTitle}>AI is crafting your exam...</h3>
            <p className={styles.loadingText}>Please wait, this may take a moment.</p>
        </div>
      )
      case 'error':
        return (
          <div className={styles.centeredContent}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h3 className={styles.loadingTitle}>An Error Occurred</h3>
            <p className={styles.errorText}>{error}</p>
            <button
              type="button"
              onClick={() => setStep('settings')}
              className={styles.submitButton}
            >
              Back to Settings
            </button>
          </div>
        )
      default:
        return renderSettings();
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
                  <div>
            <h2>Smart Exam Generator</h2>
            {source === 'flashcards' 
              ? <p>Based on {selectedCardsCount} selected cards</p>
              : <p>Based on uploaded content</p>
            }
                  </div>
          <button onClick={handleClose} className={styles.closeButton}>
            &times;
              </button>
            </div>
            {renderContent()}
            
      </div>
    </div>
  )
}

export default ExamGeneratorModal 