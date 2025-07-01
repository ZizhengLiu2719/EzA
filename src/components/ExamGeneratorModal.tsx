/**
 * Unified Create Flashcard Set Modal Component
 * 统一的闪卡集创建模态框 - 支持多种创建方式
 */

import { AlertCircle, BrainCircuit } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { CreateFlashcardSetData } from '../api/flashcards'
import { examAI, ExamConfiguration, ExamQuestion, GeneratedExam } from '../services/examAI'
import { FSRSCard } from '../types/SRSTypes'
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

interface ExamGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  cards: FSRSCard[]
  onExamGenerated: (exam: GeneratedExam) => void
}

interface ExamSettings {
  title: string
  subject: string
  duration: number // 分钟
  total_points: number
  question_types: {
    multiple_choice: number
    true_false: number
    short_answer: number
    essay: number
    fill_blank: number
  }
  difficulty_focus: 'easy' | 'medium' | 'hard' | 'mixed'
  cognitive_focus: 'remember' | 'understand' | 'apply' | 'analyze' | 'mixed'
  learning_objectives: string[]
}

const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  cards,
  onExamGenerated
}) => {
  const [step, setStep] = useState<'settings' | 'generating' | 'error'>('settings')
  const [isGenerating, setIsGenerating] = useState(false)
  const [settings, setSettings] = useState<ExamSettings>({
    title: '复习测试',
    subject: '通用',
    duration: 30,
    total_points: 100,
    question_types: {
      multiple_choice: 5,
      true_false: 3,
      short_answer: 2,
      essay: 0,
      fill_blank: 0,
    },
    difficulty_focus: 'mixed',
    cognitive_focus: 'mixed',
    learning_objectives: ['测试知识掌握度', '巩固学习成果'],
  })
  const [newObjective, setNewObjective] = useState('')
  const [error, setError] = useState<string>('')

  const totalQuestions = Object.values(settings.question_types).reduce((sum, count) => sum + count, 0)

  const handleClose = () => {
    // Reset state on close, but not if generation is in progress
    if (isGenerating) return;
    setStep('settings')
    setError('')
    onClose()
  }

  const createExamConfig = useCallback((): ExamConfiguration => {
    const questionDistribution = Object.entries(settings.question_types)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: type as ExamQuestion['type'],
        count,
        points_per_question: Math.floor(settings.total_points / (totalQuestions || 1)),
      }))

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
      topics: Array.from(new Set(cards.map(card => card.tags || []).flat())).filter(Boolean),
      duration: settings.duration,
      total_points: settings.total_points,
      question_distribution: questionDistribution,
      difficulty_distribution: difficultyDistribution,
      cognitive_distribution: cognitiveDistribution,
      learning_objectives: settings.learning_objectives,
    }
  }, [settings, cards, totalQuestions])

  const handleGenerateExam = useCallback(async () => {
    if (isGenerating) return
    if (cards.length < 10) {
      setError(`至少需要10张卡片才能生成考试，当前只有 ${cards.length} 张。`)
      setStep('error')
      return
    }
    if (totalQuestions === 0) {
      setError('请至少选择一种题型。')
      setStep('error')
      return
    }
    if (totalQuestions > cards.length) {
      setError(`题目总数 (${totalQuestions}) 不能超过可用闪卡数量 (${cards.length})。`)
      setStep('error')
      return
    }

    setIsGenerating(true)
    setStep('generating')
    setError('')

    try {
      const examConfig = createExamConfig()
      const exam = await examAI.generateExamFromCards(cards, examConfig)
      onExamGenerated(exam)
    } catch (err) {
      console.error('❌ 考试生成失败:', err)
      const errorMessage = err instanceof Error ? err.message : '发生未知错误，请稍后重试。'
      setError(`考试生成失败: ${errorMessage}`)
      setStep('error')
    } finally {
      setIsGenerating(false)
    }
  }, [cards, totalQuestions, createExamConfig, onExamGenerated, isGenerating])

  const updateSettings = useCallback((updates: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  const updateQuestionType = useCallback(
    (type: keyof ExamSettings['question_types'], count: number) => {
      setSettings(prev => ({
        ...prev,
        question_types: {
          ...prev.question_types,
          [type]: Math.max(0, count),
        },
      }))
    },
    []
  )

  const handleObjectiveSubmit = () => {
    if (newObjective.trim() && !settings.learning_objectives.includes(newObjective.trim())) {
      updateSettings({
        learning_objectives: [...settings.learning_objectives, newObjective.trim()],
      })
    }
    setNewObjective('')
  }

  const removeLearningObjective = useCallback(
    (index: number) => {
      updateSettings({
        learning_objectives: settings.learning_objectives.filter((_, i) => i !== index),
      })
    },
    [settings.learning_objectives, updateSettings]
  )
  
  if (!isOpen) return null

  const renderContent = () => {
    if (step === 'generating') {
      return (
        <div className={styles.centeredContent}>
            <div className={styles.spinner}></div>
            <h3 className={styles.loadingTitle}>AI 正在为您精心组卷...</h3>
            <p className={styles.loadingText}>请稍候，这可能需要一点时间</p>
        </div>
      )
    }

    if (step === 'error') {
        return (
          <div className={styles.centeredContent}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h3 className={styles.loadingTitle}>出错了</h3>
            <p className={styles.errorText}>{error}</p>
            <button
              type="button"
              onClick={() => setStep('settings')}
              className={styles.submitButton}
            >
              返回设置
            </button>
          </div>
        )
      }

    return (
        <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); handleGenerateExam(); }}>
            <div className={styles.formGrid}>
                {/* Left Column */}
                <div className={styles.formColumn}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>基本设置</label>
                        <div className={styles.inputRow}>
                            <label htmlFor="title" className={styles.inlineLabel}>考试标题</label>
                            <input
                                type="text"
                                id="title"
                                className={styles.fieldInput}
                                value={settings.title}
                                onChange={e => updateSettings({ title: e.target.value })}
                                placeholder="e.g., 期中复习"
                            />
                        </div>
                        <div className={styles.inputRow}>
                             <label htmlFor="subject" className={styles.inlineLabel}>学科</label>
                            <input
                                type="text"
                                id="subject"
                                className={styles.fieldInput}
                                value={settings.subject}
                                onChange={e => updateSettings({ subject: e.target.value })}
                                placeholder="e.g., 计算机科学"
                            />
                        </div>
                         <div className={styles.inputRow}>
                             <label htmlFor="duration" className={styles.inlineLabel}>时长(分钟)</label>
                            <input
                                type="number"
                                id="duration"
                                className={styles.fieldInput}
                                value={settings.duration}
                                onChange={e => updateSettings({ duration: parseInt(e.target.value, 10) || 0 })}
                            />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>难度重点</label>
                         <select
                            className={styles.fieldSelect}
                            value={settings.difficulty_focus}
                            onChange={e => updateSettings({ difficulty_focus: e.target.value as any })}
                        >
                            <option value="mixed">混合难度</option>
                            <option value="easy">侧重简单</option>
                            <option value="medium">侧重中等</option>
                            <option value="hard">侧重困难</option>
                        </select>
                    </div>
                     <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>学习目标</label>
                        <div className={styles.tagContainer}>
                            <div className={styles.tagsList}>
                                {settings.learning_objectives.map((obj, index) => (
                                <div key={index} className={styles.tag}>
                                    {obj}
                                    <button type="button" className={styles.tagRemove} onClick={() => removeLearningObjective(index)}>✕</button>
                                </div>
                                ))}
                            </div>
                            <div className={styles.tagInputWrapper}>
                                <input
                                type="text"
                                className={styles.tagInput}
                                value={newObjective}
                                onChange={e => setNewObjective(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleObjectiveSubmit();
                                    }
                                }}
                                placeholder="添加一个学习目标..."
                                />
                                <button type="button" className={styles.tagAddButton} onClick={handleObjectiveSubmit}>添加</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className={styles.formColumn}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>题型分布 (共 {totalQuestions} 题)</label>
                        <div className={styles.questionTypeGrid}>
                           <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>选择题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('multiple_choice', settings.question_types['multiple_choice'] - 1)}>-</button>
                                    <span>{settings.question_types['multiple_choice']}</span>
                                    <button type="button" onClick={() => updateQuestionType('multiple_choice', settings.question_types['multiple_choice'] + 1)}>+</button>
                                </div>
                            </div>
                             <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>判断题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('true_false', settings.question_types['true_false'] - 1)}>-</button>
                                    <span>{settings.question_types['true_false']}</span>
                                    <button type="button" onClick={() => updateQuestionType('true_false', settings.question_types['true_false'] + 1)}>+</button>
                                </div>
                            </div>
                            <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>填空题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('fill_blank', settings.question_types['fill_blank'] - 1)}>-</button>
                                    <span>{settings.question_types['fill_blank']}</span>
                                    <button type="button" onClick={() => updateQuestionType('fill_blank', settings.question_types['fill_blank'] + 1)}>+</button>
                                </div>
                            </div>
                             <div className={styles.questionTypeRow}>
                                <span className={styles.questionTypeLabel}>简答题</span>
                                <div className={styles.stepper}>
                                    <button type="button" onClick={() => updateQuestionType('short_answer', settings.question_types['short_answer'] - 1)}>-</button>
                                    <span>{settings.question_types['short_answer']}</span>
                                    <button type="button" onClick={() => updateQuestionType('short_answer', settings.question_types['short_answer'] + 1)}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleClose}>
                取消
                </button>
                <button type="submit" className={styles.submitButton} disabled={isGenerating}>
                {isGenerating ? '生成中...' : '开始生成考试'}
                </button>
            </div>
        </form>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <BrainCircuit size={24} />
                <div>
                  <h2 className={styles.modalTitle}>智能考试生成器</h2>
                  <p className={styles.modalSubtitle}>基于 {cards.length} 张闪卡</p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={handleClose}>
                ✕
              </button>
            </div>
            {renderContent()}
      </div>
    </div>
  )
}

export default ExamGeneratorModal 